import { persistAsset } from '@/lib/asset-storage';
import { canAfford, decideGovernor, type EpisodeBudget, type GovernorDecision } from './budget-governor';
import { estimateImageEur } from './cost-rates';
import { composeLayers } from './compositor';
import { compileFramePrompt } from './prompt-compiler';
import { pickScene, rasterizeSvg, renderDiagramSvg, shouldPreferDiagram } from './svg';
import { applyStylePlate, generateSubstrateSwatch, materialise } from './style-plate';
import { defaultVisualBible, kitToBible, type ExplainerBeat, type FrameResolution, type FrameSource, type ResolveStrategy, type SeriesVisualBible, type ShotType, type StyleKit } from './types';
import { findVocabulary, isEntityLocked } from './vocabulary-repo';
import { PAPERCUT_DIORAMA_V1 } from './style-kits';
import { compositeOverlay } from './typography';
import { fallbackFreeShot, framePromptWithQa, scoreGeneratedFrame } from './frame-qa';
import { isStockUrl } from './no-stock';
export { shouldPreferDiagram } from './svg';

export interface ResolveContext {
  userId: string;
  projectId: string;
  budget: EpisodeBudget;
  previousFrameUrl?: string;
  previousGoal?: string;
  seriesId?: string;
  bible?: SeriesVisualBible;
  kit?: StyleKit;
  allowPaidImages?: boolean;
  existingFrame?: FrameResolution;
  force?: boolean;
  frameSource?: FrameSource;
  frameIndex?: number;
}

const PAID_STRATEGIES = new Set<ResolveStrategy>([
  'GENERATE_NEW',
  'GENERATE_FROM_REFERENCES',
  'EDIT_PREVIOUS_FRAME',
]);

const FREE_SHOTS = new Set<ShotType>(['WORD_CARD', 'IN_SCENE_WORD', 'TIMELINE', 'MAP', 'MICRO_VIEW']);
const MATERIAL_FORCE_SVG = new Set<ShotType>(['TIMELINE', 'MAP', 'MICRO_VIEW']);

async function renderDiagramFrame(beat: ExplainerBeat, ctx: ResolveContext): Promise<FrameResolution | null> {
  const kit = ctx.kit || PAPERCUT_DIORAMA_V1;
  const bible = ctx.bible || kitToBible(kit);
  const svg = renderDiagramSvg(pickScene(beat), bible);
  let png = await rasterizeSvg(svg);
  if (kit.plateProfile === 'material') {
    const substrate = await generateSubstrateSwatch(kit);
    png = await materialise(png, kit, substrate);
  }
  const plated = await applyStylePlate(png, kit);
  const overlay = overlayFor(beat, ctx);
  const finished = overlay
    ? await compositeOverlay(plated.buffer, overlay, kit, beat.shotType === 'WORD_CARD' ? 'wordCard' : 'inSceneWord')
    : plated.buffer;
  const url = await persistPng(finished);
  if (!url) return null;
  return done(beat, 'DETERMINISTIC_RENDER', url, [], 0, beat.shotType, ctx.frameIndex);
}

function overlayFor(beat: ExplainerBeat, ctx: ResolveContext): string | undefined {
  return beat.frames?.[ctx.frameIndex || 0]?.overlayText || beat.overlayText;
}

/**
 * A beat is a "continuity" beat only when it explicitly wants to evolve the previous
 * frame (a SEQUENCE motion or an explicit continuity flag). Everything else gets a
 * fresh image so we never chain near-duplicate edits.
 */
function isContinuityBeat(beat: ExplainerBeat): boolean {
  const motion = beat.visualIntent?.motion?.type;
  return motion === 'SEQUENCE' || (beat as unknown as { continuity?: boolean }).continuity === true;
}

export function wantsDiagram(beat: ExplainerBeat, ctx: ResolveContext): boolean {
  const shot = beat.shotType || beat.frames?.[ctx.frameIndex || 0]?.shotType;
  const source = ctx.frameSource || 'auto';
  // Explicit 'generated' → real AI imagery for every pictorial beat, even the
  // diagrammatic shots (TIMELINE/MAP/MICRO_VIEW) that a material kit would otherwise
  // force to SVG. The crafted-SVG path is the cheap/POC look; 'generated' opts out of it.
  if (source === 'generated') return false;
  if (source === 'diagram') return true;
  if (shot && ctx.kit?.plateProfile === 'material' && MATERIAL_FORCE_SVG.has(shot)) return true;
  if (shot && FREE_SHOTS.has(shot)) return true;
  return shouldPreferDiagram({ ...beat, shotType: shot });
}

export async function resolveBeat(beat: ExplainerBeat, ctx: ResolveContext): Promise<FrameResolution> {
  const decision = decideGovernor(ctx.budget, estimateImageEur('GENERATE_NEW'));

  if (!ctx.force && ctx.existingFrame?.imageUrl && PAID_STRATEGIES.has(ctx.existingFrame.strategy)) {
    return { ...ctx.existingFrame, frameIndex: ctx.frameIndex ?? ctx.existingFrame.frameIndex };
  }

  if (wantsDiagram(beat, ctx) && canAfford(decision, 'DETERMINISTIC_RENDER', beat.importance)) {
    const rendered = await renderDiagramFrame(beat, ctx);
    if (rendered) return rendered;
  }

  const vocab = await findVocabulary(ctx.userId, {
    text: beat.visualGoal || beat.visualIntent.subject,
    seriesId: ctx.seriesId,
  });

  const entityHits = beat.activeEntities
    .map((id) => vocab.find((v) => v.vocabulary.canonicalEntityId === id))
    .filter(Boolean) as typeof vocab;

  // In 'generated' mode every beat gets its OWN fresh, beat-accurate image. We still
  // feed the matched entity thumbnails into generation as references (consistency),
  // but we must NOT short-circuit to reusing an entity thumbnail as the final frame —
  // that is what collapsed 13 beats onto one identical picture.
  if (ctx.frameSource !== 'generated' && entityHits.length > 0 && entityHits.length >= Math.max(1, beat.activeEntities.length - 1) && (ctx.frameIndex || 0) === 0) {
    if (entityHits.length === 1) {
      return done(beat, 'REUSE_EXISTING', entityHits[0]!.thumbnail, entityHits.map((e) => e.id), 0, beat.shotType, ctx.frameIndex);
    }
    if (canAfford(decision, 'COMPOSE_EXISTING', beat.importance) && entityHits.length >= 2) {
      try {
        const bible = ctx.bible || defaultVisualBible();
        const buf = await composeLayers({
          width: 1920, height: 1080,
          background: entityHits.find((e) => e.vocabulary.visualFunction === 'ENVIRONMENT')?.thumbnail
            ? { url: entityHits.find((e) => e.vocabulary.visualFunction === 'ENVIRONMENT')!.thumbnail }
            : { color: (ctx.kit?.paper || bible.palette.bg) },
          layers: entityHits
            .filter((e) => e.vocabulary.visualFunction !== 'ENVIRONMENT')
            .slice(0, 4)
            .map((e, i) => ({ url: e.thumbnail, left: 200 + i * 280, top: 220 + (i % 2) * 80, width: 420, height: 420 })),
        });
        const plated = ctx.kit ? await applyStylePlate(buf, ctx.kit) : { buffer: buf };
        const url = await persistPng(plated.buffer);
        if (url) return done(beat, 'COMPOSE_EXISTING', url, entityHits.map((e) => e.id), 0, beat.shotType, ctx.frameIndex);
      } catch { /* fall through */ }
    }
    return done(beat, 'REUSE_EXISTING', entityHits[0]!.thumbnail, entityHits.map((e) => e.id), 0, beat.shotType, ctx.frameIndex);
  }

  if (ctx.frameSource !== 'generated' && canAfford(decision, 'DETERMINISTIC_RENDER', beat.importance)) {
    const rendered = await renderDiagramFrame(beat, ctx);
    if (rendered) return rendered;
  }

  if (!ctx.allowPaidImages) {
    return unresolved(beat, decision, 'paid image generation disabled', ctx.frameIndex);
  }

  // Prefer a fresh GENERATE_NEW per beat (distinct, beat-accurate imagery). Only fall
  // to EDIT_PREVIOUS_FRAME for explicitly flagged continuity beats — chaining edits off
  // the previous frame is what produced ~18 near-duplicate frames.
  const allowEdit = !!ctx.previousFrameUrl && isContinuityBeat(beat);
  const paidOrder: ResolveStrategy[] = allowEdit
    ? ['EDIT_PREVIOUS_FRAME', 'GENERATE_NEW', 'GENERATE_FROM_REFERENCES']
    : ['GENERATE_NEW', 'GENERATE_FROM_REFERENCES'];
  for (const strategy of paidOrder) {
    if (!canAfford(decision, strategy, beat.importance)) continue;
    if (strategy === 'EDIT_PREVIOUS_FRAME' && !ctx.previousFrameUrl) continue;
    const url = await generatePaid(beat, ctx, strategy, entityHits.map((e) => e.thumbnail).filter(Boolean));
    if (url) {
      return done(beat, strategy, url, entityHits.map((e) => e.id), estimateImageEur(strategy), beat.shotType, ctx.frameIndex);
    }
  }

  if (isEntityLocked(vocab, beat.activeEntities[0] || '')) {
    const locked = vocab.find((v) => v.vocabulary.canonicalEntityId === beat.activeEntities[0] && v.vocabulary.locked);
    if (locked) return done(beat, 'REUSE_EXISTING', locked.thumbnail, [locked.id], 0, beat.shotType, ctx.frameIndex);
  }

  if (canAfford(decision, 'DETERMINISTIC_RENDER', beat.importance)) {
    const rendered = await renderDiagramFrame({ ...beat, shotType: fallbackFreeShot(beat.shotType) }, ctx);
    if (rendered) return rendered;
  }

  return unresolved(beat, decision, 'no eligible strategy', ctx.frameIndex);
}

async function generatePaid(
  beat: ExplainerBeat,
  ctx: ResolveContext,
  strategy: ResolveStrategy,
  refs: string[],
): Promise<string | undefined> {
  try {
    await import('@/lib/image-providers/builtins');
    const { dispatchImageGenerate } = await import('@/lib/image-providers/registry');
    const prompt = framePromptWithQa(compileFramePrompt({
      beat,
      bible: ctx.bible,
      kit: ctx.kit,
      entityBlocks: beat.activeEntities,
      previousGoal: ctx.previousGoal,
    }));
    const shot = beat.shotType || beat.frames?.[ctx.frameIndex || 0]?.shotType;
    const characterLed = (shot === 'SCENE' || shot === 'GUIDE_ON_VOID' || shot === 'ANNOTATED_SCENE') && ctx.kit?.characterSheetUrl;
    const styleRefs = characterLed
      ? [ctx.kit!.characterSheetUrl!, ctx.kit?.styleAnchorUrl, ...refs].filter(Boolean) as string[]
      : [ctx.kit?.styleAnchorUrl, ctx.kit?.characterSheetUrl, ...refs].filter(Boolean) as string[];
    const referenceImages = strategy === 'EDIT_PREVIOUS_FRAME' && ctx.previousFrameUrl
      ? [ctx.previousFrameUrl, ...styleRefs].slice(0, 8)
      : styleRefs.slice(0, 8);
    const { withBackoff } = await import('./throughput');
    const imgQuality = (process.env.EXPLAINER_IMAGE_QUALITY || 'medium') as 'low' | 'medium' | 'high' | 'auto';
    const imgSize = process.env.EXPLAINER_IMAGE_SIZE || '1024x1024';
    const gen = await withBackoff(() => dispatchImageGenerate(
      {
        prompt,
        aspectRatio: '16:9',
        quality: imgQuality,
        size: imgSize,
        referenceImages: referenceImages.length ? referenceImages : undefined,
        sref: styleRefs[0],
        label: `${beat.id}:${ctx.frameIndex || 0}`,
      },
      { refCount: referenceImages.length },
    ), { label: `image ${beat.id}:${ctx.frameIndex || 0}` });
    let url = gen.result?.imageUrl;
    if (!url || isStockUrl(url)) return undefined;
    if (url.startsWith('data:') && ctx.kit) {
      const raw = Buffer.from(url.split(',')[1] || '', 'base64');
      const plated = await applyStylePlate(raw, ctx.kit);
      const overlay = overlayFor(beat, ctx);
      const finished = overlay
        ? await compositeOverlay(plated.buffer, overlay, ctx.kit, beat.shotType === 'WORD_CARD' ? 'wordCard' : 'inSceneWord')
        : plated.buffer;
      url = await persistPng(finished);
    }
    const qa = url ? await scoreGeneratedFrame(url, { beat, kit: ctx.kit, index: ctx.frameIndex }) : null;
    if (qa && !qa.pass) {
      if (qa.hint && !prompt.includes(qa.hint)) {
        const retry = await dispatchImageGenerate(
          { prompt: `${prompt}. ${qa.hint}`, aspectRatio: '16:9', quality: imgQuality, size: imgSize, referenceImages: referenceImages.length ? referenceImages : undefined, sref: styleRefs[0], label: `${beat.id}:retry` },
          { refCount: referenceImages.length },
        );
        if (retry.result?.imageUrl && !isStockUrl(retry.result.imageUrl)) return retry.result.imageUrl;
      }
      return undefined;
    }
    return url;
  } catch (e) {
    console.warn('[explainer] image generate failed', e instanceof Error ? e.message : e);
    return undefined;
  }
}

async function persistPng(buf: Buffer): Promise<string | undefined> {
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  const p = await persistAsset(dataUrl, { contentType: 'image/png', ext: '.png' });
  return p?.url;
}

function done(
  beat: ExplainerBeat,
  strategy: ResolveStrategy,
  imageUrl: string,
  vocabularyIds: string[],
  costEur: number,
  shotType?: ShotType,
  frameIndex?: number,
): FrameResolution {
  return {
    beatId: beat.id,
    frameIndex: frameIndex || 0,
    strategy,
    imageUrl,
    vocabularyIds,
    costEur,
    shotType,
    provider: strategy.startsWith('GENERATE') || strategy.startsWith('EDIT') ? 'openai-gpt-image' : 'local',
  };
}

function unresolved(beat: ExplainerBeat, decision: GovernorDecision, reason: string, frameIndex?: number): FrameResolution {
  return {
    beatId: beat.id,
    frameIndex: frameIndex || 0,
    strategy: 'UNRESOLVED',
    vocabularyIds: [],
    costEur: 0,
    blockedCostEur: estimateImageEur('GENERATE_NEW'),
    reason: `${reason} (${decision.level})`,
  };
}
