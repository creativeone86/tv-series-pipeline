import { upsertAsset, listAssetsByType } from '@/lib/repos/asset-repo';
import { getProject, updateProjectById } from '@/lib/repos/project-repo';
import { listCostLogByProject, recordCostLog } from '@/lib/repos/cost-log-repo';
import { getReviewStatus } from '@/lib/review-status';
import { persistAsset } from '@/lib/asset-storage';
import { ttsLangCode, normalizeLanguage } from '@/lib/language-detect';
import { applyNarrationDurations, beatsToScript, scriptToBeats } from './beats';
import { reserveTtsEur } from './budget-governor';
import { estimateBeatTtsEur } from './cost-rates';
import { directExplainer } from './director';
import { resolveBeat } from './resolver';
import { motionToKenBurns, type ExplainerBeat, type ExplainerPlan, type FrameResolution, type VisualFunction } from './types';
import { promoteToVocabulary } from './vocabulary-repo';
import { getStyleKit, persistStyleKit } from './style-kit-repo';
import { PAPERCUT_DIORAMA_V1 } from './style-kits';
import { applySectionIds, deriveSections, sectionContentHash, sectionVideoCacheKey } from './sections';
import {
  buildNarrationScript,
  carveFrameWindows,
  frameCountForBeat,
  isAlignmentMonotonic,
  preCompensateForXfade,
  proportionalWindows,
  windowsFromAlignment,
  type CharacterAlignment,
} from './narration-track';
import { alignmentToSrt, alignmentToVtt } from './captions';
import { stillFrameToParallaxVideo, usesParallax, wordCardImpact, wordCardSequenceVideo } from './motion';
import { explainerConcurrency, runBounded, withBackoff } from './throughput';
import { DEFAULT_SERIES_VOICE_ID, elevenLabsSubscription } from '@/lib/tts-providers/elevenlabs';
import { endCardSpec, questionTitles, renderEndCard, thumbnailCandidates, youtubeDescription } from './packaging';
import { characterSheetPrompt } from './character-sheet';
import { ensureSeriesSting } from './series-sting';
import { assertNoStockImport } from './no-stock';
import { generateSubstrateSwatch } from './style-plate';
import type { ExplainerCategory, ProjectOutputConfig, Script } from '@/types/agents';

export interface ExplainerPipelineInput {
  projectId: string;
  userId: string;
  topic?: string;
  category?: ExplainerCategory;
  language?: string;
  targetSeconds?: number;
  autoApprove?: boolean;
  skipTts?: boolean;
  skipResolve?: boolean;
  skipRender?: boolean;
  force?: boolean;
}

export type ExplainerEmit = (type: string, data: unknown) => void;

export async function runExplainerPipeline(input: ExplainerPipelineInput, emit: ExplainerEmit = () => {}): Promise<{
  script: Script;
  resolutions: FrameResolution[];
  finalVideoUrl?: string;
}> {
  const project = await getProject(input.projectId);
  if (!project) throw new Error('project not found');

  const cfg = await readOutputConfig(input.projectId);
  const expl = cfg.explainer || {};
  const language = normalizeLanguage(input.language || expl.language || 'bg', input.topic);
  const category = input.category || expl.category || 'GENERAL';
  const capEur = expl.capEur ?? 40;
  const hardCapEur = expl.hardCapEur ?? capEur;
  const allowPaidImages = expl.allowPaidImages !== false;
  assertNoStockImport('explainer/pipeline');
  let kit = await getStyleKit(input.userId, expl.styleKitId || expl.visualBibleId).catch(() => PAPERCUT_DIORAMA_V1);
  if (expl.seriesId) {
    try {
      const { getSeriesAnchor } = await import('@/lib/repos/series-repo');
      const bible = await getSeriesAnchor(expl.seriesId);
      if (bible) {
        kit = {
          ...kit,
          styleAnchorUrl: kit.styleAnchorUrl || bible.styleAnchorUrl,
          characterSheetUrl: kit.characterSheetUrl || bible.characterSheetUrl,
          substrateTextureUrl: kit.substrateTextureUrl || bible.substrateTextureUrl,
          narrativeVoice: kit.narrativeVoice || bible.narrativeVoice,
        };
      }
    } catch { /* first episode has no bible yet */ }
  }
  if (kit.plateProfile === 'material' && !kit.substrateTextureUrl) {
    try {
      const swatch = await generateSubstrateSwatch(kit);
      const url = (await persistAsset(`data:image/png;base64,${swatch.toString('base64')}`, { contentType: 'image/png', ext: '.png' }))?.url;
      if (url) {
        kit = { ...kit, substrateTextureUrl: url };
        await persistStyleKit(input.userId, kit, kit.styleAnchorUrl || url);
      }
    } catch { /* local fibre is enough */ }
  }
  if (!kit.styleAnchorUrl && process.env.MOCK_ENGINES !== '1' && !input.skipResolve && allowPaidImages) {
    try {
      const { buildStyleBiblePrompt } = await import('@/lib/style-bible');
      await import('@/lib/image-providers/builtins');
      const { dispatchImageGenerate } = await import('@/lib/image-providers/registry');
      const anchorPrompt = [
        kit.promptPrefix,
        buildStyleBiblePrompt({ styleKeywords: kit.promptPrefix || '', genre: category, moodHint: kit.narrativeVoice?.register }),
        `material identity: ${kit.material || 'papercut'}`,
        `avoid: ${kit.negativePrompt}`,
      ].filter(Boolean).join('. ');
      const anchor = await dispatchImageGenerate({ prompt: anchorPrompt, aspectRatio: '16:9', label: 'style-anchor' }, { refCount: 0 });
      if (anchor.result?.imageUrl) {
        const persisted = anchor.result.imageUrl.startsWith('data:')
          ? (await persistAsset(anchor.result.imageUrl, { contentType: 'image/png', ext: '.png' }))?.url || anchor.result.imageUrl
          : anchor.result.imageUrl;
        kit = { ...kit, styleAnchorUrl: persisted };
        await persistStyleKit(input.userId, kit, persisted);
      }
    } catch { /* text prompt truths are the fallback identity */ }
  }
  const targetSeconds = input.targetSeconds || expl.targetDuration || cfg.targetDuration || 120;
  const narrationMode = expl.narrationMode || 'continuous';

  emit('step', { step: 'director' });
  let script = await loadScript(input.projectId);
  if (!script) {
    const plan = await directExplainer({
      topic: input.topic || project.title || project.description || '',
      category,
      language,
      targetSeconds,
    });
    script = beatsToScript(plan);
    await persistScript(input.projectId, script, plan);
    for (const c of plan.llmCosts || []) {
      await recordCostLog({
        userId: input.userId,
        projectId: input.projectId,
        engine: `llm-${c.stage}`,
        costEur: c.costEur,
        metadata: { model: c.model, promptTokens: c.promptTokens, completionTokens: c.completionTokens },
      });
    }
    await upsertAsset({
      projectId: input.projectId,
      type: 'publish-copy',
      name: 'youtube packaging',
      data: {
        titles: questionTitles(plan),
        description: youtubeDescription(plan),
        sourcesBlock: plan.sourcesBlock,
      },
    });
    emit('script', script);
  } else {
    emit('script', script);
  }

  const review = await getReviewStatus(input.projectId);
  const approved = input.autoApprove || review.status === 'approved' || process.env.EXPLAINER_AUTO_APPROVE === '1';
  if (!approved && !input.skipTts) {
    emit('status', { message: 'Script awaiting approval' });
    emit('gate', { gateId: 'script-review', status: review.status });
    return { script, resolutions: [] };
  }

  let beats = scriptToBeats(script);
  const sections = deriveSections(beats, targetSeconds);
  beats = applySectionIds(beats, sections);
  const reservedTts = reserveTtsEur(beats.map((b) => b.narrationText), expl.ttsProvider || 'elevenlabs');

  if (!input.skipTts) {
    emit('step', { step: 'tts' });
    await import('@/lib/tts-providers/builtins');
    const { dispatchTTSGenerate } = await import('@/lib/tts-providers/registry');
    const voiceId = expl.voiceId || DEFAULT_SERIES_VOICE_ID;
    const sub = await elevenLabsSubscription().catch(() => null);
    const needed = beats.reduce((s, b) => s + (b.narrationText || '').length, 0);
    if (sub && sub.remaining < needed) {
      throw new Error(`this episode needs ${needed} characters, ${sub.remaining} remain this cycle`);
    }

    const durations: Record<string, number> = {};
    if (narrationMode === 'continuous') {
      const existingTracks = await listAssetsByType(input.projectId, 'narration-track' as any);
      await runBounded(sections, explainerConcurrency('tts'), async (section) => {
        const secBeats = beats.filter((b) => section.beatIds.includes(b.id));
        const hash = sectionContentHash(secBeats);
        const existing = existingTracks.find((a) => {
          let d: any = a.data; try { if (typeof d === 'string') d = JSON.parse(d); } catch { d = {}; }
          return d?.sectionId === section.id && d?.contentHash === hash;
        });
        if (existing && !input.force) {
          let d: any = existing.data; try { if (typeof d === 'string') d = JSON.parse(d); } catch { d = {}; }
          for (const w of d?.beatWindows || []) durations[w.id] = Math.max(0.4, (w.endSec || 0) - (w.startSec || 0));
          emit('tts', { sectionId: section.id, cached: true });
          return;
        }
        const { script: text, offsets } = buildNarrationScript(secBeats);
        const r = await withBackoff(() => dispatchTTSGenerate({
          text,
          voiceId,
          language: ttsLangCode(language),
          label: section.id,
          withTimestamps: true,
          stability: 0.45,
          similarityBoost: 0.8,
          style: 0.15,
          speakerBoost: true,
        }, { prefer: expl.ttsProvider || 'elevenlabs', language: ttsLangCode(language) }), { label: `tts ${section.id}` });
        const audio = r.result;
        if (!audio) return;
        const alignment = audio.alignment as CharacterAlignment | undefined;
        const okAlign = isAlignmentMonotonic(alignment);
        const beatWindows = okAlign && alignment
          ? windowsFromAlignment(offsets, alignment, { totalDuration: audio.duration })
          : proportionalWindows(offsets, audio.duration);
        const frameWindows = beatWindows.flatMap((w) => {
          const beat = secBeats.find((b) => b.id === w.id);
          const n = frameCountForBeat(w.endSec - w.startSec);
          return carveFrameWindows(w, n, alignment, beat?.narrationText);
        });
        for (const w of beatWindows) durations[w.id] = Math.max(0.4, w.endSec - w.startSec);
        const srt = alignment ? alignmentToSrt(alignment) : '';
        const vtt = alignment ? alignmentToVtt(alignment) : '';
        await upsertAsset({
          projectId: input.projectId,
          type: 'narration-track' as any,
          name: `section ${section.id}`,
          data: {
            sectionId: section.id, duration: audio.duration, alignment, beatWindows, frameWindows,
            contentHash: hash, alignmentOk: okAlign, provider: audio.provider,
          },
          mediaUrls: [audio.audioUrl],
          shotNumber: section.order,
          persistentUrl: audio.audioUrl,
        });
        if (srt) {
          const srtUrl = (await persistAsset(`data:text/plain;base64,${Buffer.from(srt).toString('base64')}`, { contentType: 'text/plain', ext: '.srt' }))?.url;
          await upsertAsset({
            projectId: input.projectId, type: 'captions' as any, name: `srt ${section.id}`,
            data: { sectionId: section.id, format: 'srt' }, mediaUrls: srtUrl ? [srtUrl] : [], persistentUrl: srtUrl,
          });
        }
        if (vtt) {
          const vttUrl = (await persistAsset(`data:text/plain;base64,${Buffer.from(vtt).toString('base64')}`, { contentType: 'text/plain', ext: '.vtt' }))?.url;
          await upsertAsset({
            projectId: input.projectId, type: 'captions' as any, name: `vtt ${section.id}`,
            data: { sectionId: section.id, format: 'vtt' }, mediaUrls: vttUrl ? [vttUrl] : [], persistentUrl: vttUrl,
          });
        }
        await recordCostLog({
          userId: input.userId,
          projectId: input.projectId,
          engine: `tts-${audio.provider}`,
          durationSec: audio.duration,
          costEur: estimateBeatTtsEur(text, audio.provider),
          metadata: { sectionId: section.id, cached: r.tried.some((t) => t.error === 'cache-hit'), alignmentOk: okAlign },
        });
        emit('tts', { sectionId: section.id, duration: audio.duration, audioUrl: audio.audioUrl, alignmentOk: okAlign });
      });
    } else {
      for (const beat of beats) {
        const r = await dispatchTTSGenerate({
          text: beat.narrationText,
          voiceId,
          language: ttsLangCode(language),
          label: beat.id,
        }, { prefer: expl.ttsProvider || 'elevenlabs', language: ttsLangCode(language) });
        const audio = r.result;
        if (audio) {
          durations[beat.id] = audio.duration + 0.35;
          await upsertAsset({
            projectId: input.projectId,
            type: 'shot-audio',
            name: `beat ${beat.id}`,
            data: { beatId: beat.id, duration: audio.duration, provider: audio.provider },
            mediaUrls: [audio.audioUrl],
            shotNumber: beat.order,
            persistentUrl: audio.audioUrl,
          });
          await recordCostLog({
            userId: input.userId,
            projectId: input.projectId,
            engine: `tts-${audio.provider}`,
            durationSec: audio.duration,
            costEur: estimateBeatTtsEur(beat.narrationText, audio.provider),
            metadata: { beatId: beat.id, cached: r.tried.some((t) => t.error === 'cache-hit') },
          });
        }
        emit('tts', { beatId: beat.id, duration: durations[beat.id], audioUrl: audio?.audioUrl });
      }
    }
    script = applyNarrationDurations(script, durations);
    await persistScript(input.projectId, script);
    beats = scriptToBeats(script);
  }

  if (!kit.characterSheetUrl && process.env.MOCK_ENGINES !== '1' && !input.skipResolve) {
    try {
      await import('@/lib/image-providers/builtins');
      const { dispatchImageGenerate } = await import('@/lib/image-providers/registry');
      const sheet = await dispatchImageGenerate({
        prompt: characterSheetPrompt(kit),
        aspectRatio: '16:9',
        sref: kit.styleAnchorUrl,
        label: 'character-sheet',
      }, { refCount: 0 });
      if (sheet.result?.imageUrl) {
        const persisted = sheet.result.imageUrl.startsWith('data:')
          ? (await persistAsset(sheet.result.imageUrl, { contentType: 'image/png', ext: '.png' }))?.url || sheet.result.imageUrl
          : sheet.result.imageUrl;
        kit = { ...kit, characterSheetUrl: persisted };
        await persistStyleKit(input.userId, kit, kit.styleAnchorUrl || persisted);
        // Promote + lock the sheet so re-plans and revisions never drift the guide.
        try {
          const { promoteToVocabulary, setVocabularyLock } = await import('./vocabulary-repo');
          const asset = await promoteToVocabulary({
            userId: input.userId,
            projectId: input.projectId,
            imageUrl: persisted,
            canonicalEntityId: 'GUIDE_CHARACTER',
            visualFunction: 'CHARACTER',
            scope: 'SERIES',
            seriesId: expl.seriesId,
            category,
            locked: true,
          });
          await setVocabularyLock(input.userId, asset.id, true);
        } catch { /* vocab lock optional */ }
      }
    } catch { /* optional series asset */ }
  }

  // Persist the series bible: kit id + guide voice + anchors so every future episode
  // in the series inherits the same identity without re-deriving it.
  if (expl.seriesId) {
    try {
      const { getSeriesAnchor, setSeriesAnchor } = await import('@/lib/repos/series-repo');
      const prev = (await getSeriesAnchor(expl.seriesId)) || {};
      await setSeriesAnchor(expl.seriesId, {
        ...prev,
        styleKitId: kit.id,
        styleAnchorUrl: kit.styleAnchorUrl || prev.styleAnchorUrl,
        characterSheetUrl: kit.characterSheetUrl || prev.characterSheetUrl,
        substrateTextureUrl: kit.substrateTextureUrl || prev.substrateTextureUrl,
        narrativeVoice: kit.narrativeVoice || prev.narrativeVoice,
      });
    } catch { /* series bible persistence optional */ }
  }

  const resolutions: FrameResolution[] = [];
  if (!input.skipResolve) {
    emit('step', { step: 'resolve' });
    const existingByKey = await loadExistingFrames(input.projectId);
    let previousUrl: string | undefined;
    let previousGoal: string | undefined;
    const usedScenes = new Set<string>();
    void usedScenes;
    // One distinct image per beat by default (EXPLAINER_FRAMES_PER_BEAT). This is the
    // other half of the de-duplication fix: without it a long beat fanned out into
    // several near-identical frames, multiplying both cost and repetition.
    const framesPerBeatCap = Math.max(1, Number(process.env.EXPLAINER_FRAMES_PER_BEAT) || 1);
    for (const beat of beats) {
      const frameN = Math.min(
        framesPerBeatCap,
        Math.max(1, beat.frames?.length || frameCountForBeat(beat.actualNarrationDuration || beat.estimatedDuration || 8)),
      );
      for (let fi = 0; fi < frameN; fi++) {
        const spent = (await listCostLogByProject(input.projectId)).reduce((s, r) => s + r.costEur, 0);
        const key = `${beat.id}:${fi}`;
        const res = await resolveBeat(beat, {
          userId: input.userId,
          projectId: input.projectId,
          seriesId: expl.seriesId,
          previousFrameUrl: previousUrl,
          previousGoal,
          allowPaidImages,
          existingFrame: existingByKey.get(key) || (fi === 0 ? existingByKey.get(beat.id) : undefined),
          budget: { capEur, hardCapEur, spentEur: spent, reservedTtsEur: reservedTts },
          kit,
          frameSource: expl.frameSource || 'auto',
          force: input.force,
          frameIndex: fi,
        });
        resolutions.push(res);
        if (res.imageUrl) {
          previousUrl = res.imageUrl;
          previousGoal = beat.visualGoal;
          const persisted = res.imageUrl.startsWith('data:')
            ? (await persistAsset(res.imageUrl, { contentType: 'image/png', ext: '.png' }))?.url || res.imageUrl
            : res.imageUrl;
          res.imageUrl = persisted;
          await upsertAsset({
            projectId: input.projectId,
            type: 'storyboard',
            name: `beat ${beat.id} f${fi}`,
            data: { ...res, visualIntent: beat.visualIntent, teachingGoal: beat.teachingGoal, beatId: beat.id, frameIndex: fi },
            mediaUrls: [persisted],
            shotNumber: beat.order * 10 + fi,
            persistentUrl: persisted,
          });
          if (res.costEur > 0) {
            await recordCostLog({
              userId: input.userId,
              projectId: input.projectId,
              engine: `image-${res.provider || 'explainer'}`,
              costEur: res.costEur,
              metadata: { beatId: beat.id, frameIndex: fi, strategy: res.strategy },
            });
          }
          if (res.strategy !== 'REUSE_EXISTING' && fi === 0) {
            await seedVocabularyFromFrame({
              userId: input.userId,
              projectId: input.projectId,
              imageUrl: persisted,
              entities: beat.activeEntities,
              seriesId: expl.seriesId,
              category,
            });
          }
        }
        emit('resolve', res);
      }
    }
  }

  if (!input.skipRender && resolutions.length === 0) {
    const boards = await listAssetsByType(input.projectId, 'storyboard');
    for (const b of boards) {
      let data: any = b.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = {}; } }
      const imageUrl = b.persistent_url
        || (() => { try { return JSON.parse(b.media_urls || '[]')[0]; } catch { return undefined; } })()
        || data?.imageUrl;
      if (!imageUrl) continue;
      resolutions.push({ ...(data as FrameResolution), beatId: data?.beatId || `beat-${b.shot_number}`, frameIndex: data?.frameIndex || 0, imageUrl });
    }
  }

  if (!input.skipRender && resolutions.some((r) => r.imageUrl)) {
    try {
      const planForPack = (await loadPlan(input.projectId)) || beatsToPlan(beats, script, category, language);
      const frameUrls = resolutions.filter((r) => r.imageUrl && String(r.imageUrl).startsWith('http')).map((r) => r.imageUrl!) as string[];
      const thumbs = thumbnailCandidates(planForPack, kit, frameUrls);
      const endSpec = endCardSpec(planForPack, kit);
      let endCardUrl: string | undefined;
      try {
        const card = await renderEndCard(endSpec, kit, expl.outputWidth ?? 1920, expl.outputHeight ?? 1080);
        endCardUrl = (await persistAsset(`data:image/png;base64,${card.toString('base64')}`, { contentType: 'image/png', ext: '.png' }))?.url;
      } catch { /* end card is optional */ }
      await upsertAsset({
        projectId: input.projectId,
        type: 'publish-copy',
        name: 'youtube thumbnails',
        data: { thumbnails: thumbs, endCard: endSpec },
        mediaUrls: endCardUrl ? [endCardUrl] : undefined,
        persistentUrl: endCardUrl,
      });
    } catch { /* packaging never blocks render */ }
  }

  let finalVideoUrl: string | undefined;
  if (!input.skipRender && resolutions.some((r) => r.imageUrl)) {
    emit('step', { step: 'render' });
    const stingUrl = expl.stingAfterSection === undefined || expl.stingAfterSection === 0
      ? await ensureSeriesSting({ projectId: input.projectId, userId: input.userId, seriesId: expl.seriesId, kit })
      : undefined;
    finalVideoUrl = await renderExplainer({
      projectId: input.projectId,
      script,
      resolutions,
      aspect: '16:9',
      outputWidth: expl.outputWidth || 1920,
      outputHeight: expl.outputHeight || 1080,
      sectionTransitionSec: expl.sectionTransitionSec || 0,
      stingUrl,
      stingAfterSection: expl.stingAfterSection ?? 0,
      kit,
    });
    if (finalVideoUrl) {
      await upsertAsset({
        projectId: input.projectId,
        type: 'final_video',
        name: 'explainer mp4',
        data: { width: expl.outputWidth || 1920, height: expl.outputHeight || 1080 },
        mediaUrls: [finalVideoUrl],
        persistentUrl: finalVideoUrl,
      });
      emit('editResult', { finalVideoUrl });
    }
  }

  emit('step', { step: 'finalize' });
  return { script, resolutions, finalVideoUrl };
}

export async function renderExplainer(opts: {
  projectId: string;
  script: Script;
  resolutions: FrameResolution[];
  aspect: string;
  outputWidth: number;
  outputHeight: number;
  sectionTransitionSec?: number;
  stingUrl?: string;
  stingAfterSection?: number;
  kit?: import('./types').StyleKit;
}): Promise<string | undefined> {
  const { stillFrameToVideo, composeVideo, concatVideosSimple, probeVideoIntegrity } = await import('@/services/video-composer');
  const { serveFilePathUrl } = await import('@/lib/serve-file-sign');
  const tracks = await listAssetsByType(opts.projectId, 'narration-track' as any);
  const audioRows = await listAssetsByType(opts.projectId, 'shot-audio');
  const tmp = `${process.cwd()}/data/composed/explainer-${opts.projectId}`;
  const fs = await import('fs');
  fs.mkdirSync(tmp, { recursive: true });

  const beats = scriptToBeats(opts.script);
  const sections = deriveSections(beats, beats.reduce((s, b) => s + (b.actualNarrationDuration || 8), 0) || 120);
  const sectionPaths: string[] = [];

  for (const section of sections) {
    const secBeats = beats.filter((b) => section.beatIds.includes(b.id));
    const contentPart = sectionContentHash(secBeats);
    // Find the narration track BEFORE the cache check: the voice is the master clock,
    // so a section rendered while silent must be invalidated once its track exists.
    const track = tracks.find((a) => {
      let d: any = a.data; try { if (typeof d === 'string') d = JSON.parse(d); } catch { d = {}; }
      return d?.sectionId === section.id;
    });
    let trackData: any = track?.data;
    try { if (typeof trackData === 'string') trackData = JSON.parse(trackData); } catch { trackData = {}; }
    const beatWindows: Array<{ id: string; startSec: number; endSec: number }> = trackData?.beatWindows || [];
    const trackUrl = track?.persistent_url || (() => { try { return JSON.parse(track?.media_urls || '[]')[0]; } catch { return undefined; } })();
    const trackDuration = Number(trackData?.duration) || 0;
    // Cache key folds in audio presence + track duration → a silent cache never
    // satisfies an audio render, and re-timing the voice forces a rebuild.
    const hash = sectionVideoCacheKey(contentPart, !!trackUrl, trackDuration);
    const cached = (await listAssetsByType(opts.projectId, 'section-video' as any)).find((a) => {
      let d: any = a.data; try { if (typeof d === 'string') d = JSON.parse(d); } catch { d = {}; }
      return d?.sectionId === section.id && d?.contentHash === hash && a.persistent_url;
    });
    if (cached?.persistent_url) {
      sectionPaths.push(cached.persistent_url);
      continue;
    }

    const clips = [];
    const voiceoverClips = [];

    // Phase 1 — plan clip durations from each beat's FULL window (the voice is the
    // master clock). resolve emits one image per beat, so a beat's single frame must
    // claim the whole beat window (split evenly if a beat ever has several frames),
    // NOT just the first alignment sub-window — otherwise the video is a fraction of
    // the narration and the voice gets cut.
    interface ClipPlan { beat: ExplainerBeat; res: FrameResolution; i: number; frameCount: number; duration: number }
    const plans: ClipPlan[] = [];
    for (const beat of secBeats) {
      const frames = opts.resolutions.filter((r) => r.beatId === beat.id && r.imageUrl);
      if (!frames.length) continue;
      const bw = beatWindows.find((w) => w.id === beat.id);
      const beatDur = bw
        ? Math.max(0.8, bw.endSec - bw.startSec)
        : (beat.actualNarrationDuration || beat.estimatedDuration || 6);
      for (const [i, res] of frames.entries()) {
        plans.push({ beat, res, i, frameCount: frames.length, duration: Math.max(1.2, beatDur / frames.length) });
      }
    }
    if (plans.length === 0) continue;
    // Pad the LAST clip up to the track length (plus a small tail) so the section
    // video is never shorter than its narration. Done BEFORE rendering the clip file.
    const plannedTotal = plans.reduce((s, p) => s + p.duration, 0);
    if (trackDuration > 0 && plannedTotal < trackDuration + 0.4) {
      plans[plans.length - 1]!.duration += (trackDuration + 0.4) - plannedTotal;
    } else {
      plans[plans.length - 1]!.duration += 0.5;
    }

    // Phase 2 — render each clip's video file at its final (possibly padded) duration.
    for (const { beat, res, i, duration } of plans) {
      const shot = res.shotType || beat.shotType;
      const dims = { w: opts.outputWidth, h: opts.outputHeight };
      let videoPath: string;
      try {
        if (wordCardImpact(shot) && (beat.overlayText || beat.narrationText)) {
          videoPath = await wordCardSequenceVideo({
            text: beat.overlayText || beat.narrationText,
            kit: opts.kit || PAPERCUT_DIORAMA_V1,
            duration, tmp, w: dims.w, h: dims.h,
          });
        } else if (usesParallax(shot, opts.kit)) {
          videoPath = await stillFrameToParallaxVideo({
            imageUrl: res.imageUrl!, duration, tmp,
            planes: opts.kit?.depthPlanes || 3, w: dims.w, h: dims.h,
          });
        } else {
          videoPath = await stillFrameToVideo(res.imageUrl!, duration, tmp, motionToKenBurns(beat.visualIntent?.motion), dims);
        }
      } catch (e) {
        console.warn('[explainer] motion fallback to ken burns', e instanceof Error ? e.message : e);
        videoPath = await stillFrameToVideo(res.imageUrl!, duration, tmp, motionToKenBurns(beat.visualIntent?.motion), dims);
      }
      clips.push({
        shotNumber: beat.order * 10 + i,
        videoUrl: videoPath,
        duration,
        transition: 'cut' as const,
        dialogue: i === 0 ? (beat.narrationText || '') : '',
      });
    }
    if (clips.length === 0) continue;

    if (trackUrl) {
      voiceoverClips.push({ shotNumber: clips[0]!.shotNumber, audioUrl: trackUrl });
    } else {
      for (const beat of secBeats) {
        const audio = audioRows.find((a) => a.shot_number === beat.order);
        const audioUrl = audio?.persistent_url || (() => { try { return JSON.parse(audio?.media_urls || '[]')[0]; } catch { return undefined; } })();
        if (audioUrl) voiceoverClips.push({ shotNumber: beat.order * 10, audioUrl });
      }
    }

    const td = 0;
    void preCompensateForXfade;
    const musicRows = await listAssetsByType(opts.projectId, 'music');
    const musicUrl = musicRows[0]?.persistent_url || (() => {
      try { return JSON.parse(musicRows[0]?.media_urls || '[]')[0]; } catch { return undefined; }
    })();
    const impactCues = clips
      .filter((c) => {
        const beat = secBeats.find((b) => b.order * 10 === Math.floor(c.shotNumber / 10) * 10 || b.order * 10 === c.shotNumber);
        return beat?.shotType === 'WORD_CARD';
      })
      .map((c) => ({ shotNumber: c.shotNumber, atSec: 0.08, intensity: 0.45 }));
    const compose = withTimeout(composeVideo({
      clips: clips.map((c) => ({ ...c, dialogue: '' })),
      voiceoverClips,
      aspect: opts.aspect,
      outputSize: { w: opts.outputWidth, h: opts.outputHeight },
      transitionDuration: td,
      musicUrl,
      musicVolume: 0.12,
      voiceoverVolume: 0.92,
      actionMode: impactCues.length > 0,
      impactCues,
    }), 180_000, `section ${section.id} compose timed out`);
    const result = await compose;
    const url = serveFilePathUrl(result.outputPath);
    await upsertAsset({
      projectId: opts.projectId,
      type: 'section-video' as any,
      name: `section ${section.id}`,
      data: { sectionId: section.id, contentHash: hash, hasAudio: !!trackUrl, trackDuration },
      mediaUrls: [url],
      persistentUrl: result.outputPath,
    });
    sectionPaths.push(result.outputPath);
  }

  if (sectionPaths.length === 0) return undefined;
  const insertAt = Math.min(sectionPaths.length, Math.max(0, (opts.stingAfterSection ?? 0) + 1));
  let stingClip: string | undefined;
  if (opts.stingUrl) {
    const { normalizeStingClip } = await import('./series-sting');
    stingClip = await normalizeStingClip(opts.stingUrl, tmp, opts.outputWidth, opts.outputHeight);
  }
  const ordered = stingClip
    ? [...sectionPaths.slice(0, insertAt), stingClip, ...sectionPaths.slice(insertAt)]
    : sectionPaths;
  const master = ordered.length === 1
    ? ordered[0]!
    : await concatVideosSimple(ordered, undefined, tmp);
  const probe = await probeVideoIntegrity(master);
  if (!probe.ok) {
    console.warn('[explainer] master probe failed', probe.reason);
  }
  return serveFilePathUrl(master);
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function persistScript(projectId: string, script: Script, plan?: ExplainerPlan) {
  await upsertAsset({
    projectId,
    type: 'script',
    name: script.title || 'explainer script',
    data: { ...script, explainerPlan: plan || null },
  });
  await updateProjectById(projectId, { script_data: JSON.stringify(script) });
}

async function loadExistingFrames(projectId: string): Promise<Map<string, FrameResolution>> {
  const map = new Map<string, FrameResolution>();
  const boards = await listAssetsByType(projectId, 'storyboard');
  for (const b of boards) {
    let data: any = b.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = {}; } }
    const imageUrl = b.persistent_url
      || (() => { try { return JSON.parse(b.media_urls || '[]')[0]; } catch { return undefined; } })()
      || data?.imageUrl;
    const beatId = data?.beatId || `beat-${b.shot_number}`;
    const frameIndex = data?.frameIndex || 0;
    if (!imageUrl || !beatId) continue;
    const row = { ...(data as FrameResolution), beatId, frameIndex, imageUrl };
    map.set(`${beatId}:${frameIndex}`, row);
    if (frameIndex === 0) map.set(beatId, row);
  }
  return map;
}

async function loadScript(projectId: string): Promise<Script | null> {
  const rows = await listAssetsByType(projectId, 'script');
  const raw = rows[0]?.data;
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch { data = null; }
  }
  if (data && typeof data === 'object' && Array.isArray((data as Script).shots)) return data as Script;
  return null;
}

async function loadPlan(projectId: string): Promise<ExplainerPlan | null> {
  const rows = await listAssetsByType(projectId, 'script');
  let data: any = rows[0]?.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
  const plan = data?.explainerPlan;
  return plan && Array.isArray(plan.beats) ? (plan as ExplainerPlan) : null;
}

function beatsToPlan(beats: ExplainerBeat[], script: Script, category: ExplainerCategory, language: string): ExplainerPlan {
  return {
    title: script.title || 'Untitled',
    synopsis: script.synopsis || '',
    language,
    category,
    beats,
  } as ExplainerPlan;
}

export async function readOutputConfig(projectId: string): Promise<ProjectOutputConfig> {
  const { getDbDriver } = await import('@/lib/db-driver');
  const row = await getDbDriver().get<{ output_config?: string | null }>('SELECT output_config FROM projects WHERE id = ?', [projectId]);
  try {
    return row?.output_config ? JSON.parse(row.output_config) : { resolution: '720p', aspectRatio: '16:9' };
  } catch {
    return { resolution: '720p', aspectRatio: '16:9' };
  }
}

export async function writeOutputConfig(projectId: string, cfg: ProjectOutputConfig): Promise<void> {
  await updateProjectById(projectId, { output_config: JSON.stringify(cfg) });
}

function visualFunctionOf(entityId: string): VisualFunction {
  if (entityId === 'GUIDE_CHARACTER') return 'CHARACTER';
  if (entityId === 'SPACE_BG') return 'ENVIRONMENT';
  if (entityId === 'PHYSICS_ARROW' || entityId === 'QUESTION_MOTIF') return 'MOTIF';
  return 'OBJECT';
}

async function seedVocabularyFromFrame(input: {
  userId: string;
  projectId: string;
  imageUrl: string;
  entities: string[];
  seriesId?: string;
  category?: ExplainerCategory;
}): Promise<void> {
  const { findVocabulary } = await import('./vocabulary-repo');
  for (const entityId of input.entities) {
    try {
      const existing = await findVocabulary(input.userId, { entityId, seriesId: input.seriesId });
      if (existing.length > 0) continue;
      await promoteToVocabulary({
        userId: input.userId,
        projectId: input.projectId,
        imageUrl: input.imageUrl,
        canonicalEntityId: entityId,
        visualFunction: visualFunctionOf(entityId),
        scope: 'SERIES',
        seriesId: input.seriesId,
        category: input.category,
      });
    } catch (e) {
      console.warn('[explainer] vocab seed failed', entityId, e instanceof Error ? e.message : e);
    }
  }
}
