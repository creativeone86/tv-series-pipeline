'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreationWorkspace } from '@/components/creation-workspace';
import { useProjectWorkspaceStore, useActiveGenerationStore } from '@/lib/store';
import { AgentRole, type Project } from '@/types/agents';
import { MagicWand as Wand2, Lightning as Zap, Sparkle as Sparkles, Lightbulb, FilmSlate, Play, Pencil } from '@phosphor-icons/react';
import { validateIdea, sanitizeInput } from '@/lib/validation';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';
import { IMG_PREVIEW_DEFAULT } from '@/lib/placeholder-images';
import { buildInitialNodes, initialEdges } from '@/components/pipeline-canvas';
import { type StoryTemplate } from '@/lib/story-templates';
import { CharacterLockSection, type LockedCharacter } from '@/components/create/character-lock-section';
import { EngineWeather } from '@/components/create/engine-weather';
import { MultimodalRefShelf } from '@/components/multimodal-ref-shelf';
import type { ReferenceAsset } from '@/lib/multimodal-ref';
// v2.13 cinema redesign — opt-in primitives, other pages unchanged
import {
  SlateCard,
  AspectChip,
  TimecodeChip,
  FilmStripDivider,
  StatusBar,
  Eyebrow,
  TechReadout,
} from '@/components/cinema/primitives';
import { MovingBorderButton } from '@/components/cinema/effects';
import { CameraLanguagePicker } from '@/components/create/camera-language-picker';
import { ScriptDraftsCompare } from '@/components/create/script-drafts-compare';
import { StyleLoraLibrary } from '@/components/create/style-lora-library';
import { TemplateLibraryPicker } from '@/components/create/template-library-picker';
import { FirstRunGuide } from '@/components/create/first-run-guide';
import { PreviewShotModal } from '@/components/create/preview-shot-modal';
import { DemoModeBanner } from '@/components/demo-mode-banner';
import type { ScriptDraft } from '@/lib/script-drafts';
import { listSupportedLanguages } from '@/lib/language-detect';
import { saveCreatePrefs, loadCreatePrefs } from '@/lib/create-prefs';
import { LanguagePicker } from '@/components/create/language-picker';
import { getSystemLanguage } from '@/lib/system-language';

// Pika-style art presets — ids/icons/colors only; labels via t.workshop
const stylePresets = [
  { id: 'poetic-mist', en: 'Poetic Mist', color: 'from-slate-600 to-blue-900', icon: '🌫️' },
  { id: 'neo-noir', en: 'Neo Noir', color: 'from-gray-900 to-red-950', icon: '🌃' },
  { id: 'ink-wash', en: 'Ink Wash', color: 'from-stone-700 to-stone-900', icon: '🎋' },
  { id: 'dreamwave', en: 'Dreamwave', color: 'from-indigo-600 to-rose-500', icon: '🌊' },
  { id: 'cyber-neon', en: 'Cyber Neon', color: 'from-cyan-600 to-violet-700', icon: '⚡' },
  { id: 'anime-3d', en: 'Anime 3D', color: 'from-amber-600 to-orange-700', icon: '🏮' },
  { id: 'cinematic', en: 'Cinematic', color: 'from-neutral-700 to-neutral-900', icon: '🎬' },
  { id: 'ghibli', en: 'Ghibli', color: 'from-green-600 to-emerald-800', icon: '🍃' },
  // v9.5.5: aligned with style gallery (anime / donghua splits); en = gallery nameEn, thumbs at /styles/<id>.jpg
  { id: 'american-comic', en: 'American Comic', color: 'from-red-700 to-amber-600', icon: '💥' },
  { id: 'mihoyo-game', en: 'Game Anime (miHoYo)', color: 'from-sky-500 to-violet-600', icon: '🎮' },
  { id: 'wushan-ink', en: 'Ink-Wash Action', color: 'from-stone-600 to-zinc-800', icon: '🖌️' },
  { id: 'haitang-ethereal', en: 'Ethereal Donghua', color: 'from-orange-500 to-rose-600', icon: '🏮' },
];

/** Chinese labels from lib story-templates.styleRecommendation — match only, not shown. */
const STYLE_ZH: Record<string, string> = {
  'poetic-mist': '\u8bd7\u610f\u6c34\u58a8',
  'neo-noir': '\u65b0\u9ed1\u8272',
  'ink-wash': '\u6c34\u58a8\u4e39\u9752',
  dreamwave: '\u68a6\u5883\u6ce2\u6d6a',
  'cyber-neon': '\u8d5b\u535a\u9713\u8679',
  'anime-3d': '3D\u56fd\u521b',
  cinematic: '\u7535\u5f71\u5199\u5b9e',
  ghibli: '\u5409\u535c\u529b\u98ce',
  'american-comic': '\u7f8e\u6f2b',
  'mihoyo-game': '\u539f\u795e\u5d29\u574f',
  'wushan-ink': '\u96fe\u5c71\u6c34\u58a8',
  'haitang-ethereal': '\u6d77\u68e0\u552f\u7f8e',
};

const STYLE_I18N: Record<string, { label: string; desc: string }> = {
  'poetic-mist': { label: 'poeticMist', desc: 'poeticMistDesc' },
  'neo-noir': { label: 'neoNoir', desc: 'neoNoirDesc' },
  'ink-wash': { label: 'inkWash', desc: 'inkWashDesc' },
  dreamwave: { label: 'dreamwave', desc: 'dreamwaveDesc' },
  'cyber-neon': { label: 'cyberNeon', desc: 'cyberNeonDesc' },
  'anime-3d': { label: 'anime3d', desc: 'anime3dDesc' },
  cinematic: { label: 'cinematic', desc: 'cinematicDesc' },
  ghibli: { label: 'ghibli', desc: 'ghibliDesc' },
  'american-comic': { label: 'americanComic', desc: 'americanComicDesc' },
  'mihoyo-game': { label: 'mihoyoGame', desc: 'mihoyoGameDesc' },
  'wushan-ink': { label: 'wushanInk', desc: 'wushanInkDesc' },
  'haitang-ethereal': { label: 'haitangEthereal', desc: 'haitangEtherealDesc' },
};

const EXAMPLE_IDEA_DEFS = [
  { id: 'cyberpunk', icon: Zap },
  { id: 'palace', icon: Sparkles },
  { id: 'wasteland', icon: Wand2 },
  { id: 'magic', icon: Lightbulb },
] as const;

/** Backend SSE / script-parser protocol tokens (escaped so this TSX stays Han-free). */
const SSE = {
  director: '\u5bfc\u6f14',
  analyze: '\u5206\u6790',
  writer: '\u7f16\u5267',
  script: '\u5267\u672c',
  charDesigner: '\u89d2\u8272\u8bbe\u8ba1\u5e08',
  sceneDesigner: '\u573a\u666f\u8bbe\u8ba1\u5e08',
  storyboarder: '\u5206\u955c\u5e08',
  video: '\u89c6\u9891',
  generate: '\u751f\u6210',
  editor: '\u526a\u8f91\u5e08',
  editMux: '\u526a\u8f91\u5408\u6210',
  score: '\u914d\u4e50',
  producer: '\u5236\u7247\u4eba',
  review: '\u5ba1\u6838',
  autoOpt: '\u81ea\u52a8\u4f18\u5316',
  secondReview: '\u4e8c\u6b21\u5ba1\u6838',
};
const SCRIPT_FMT = {
  chapter1: '\u7b2c 1 \u7ae0',
  draft: '(\u8349\u7a3f)',
  scene: '\u573a\u666f',
  day: '\u65e5',
  actionPrefix: '\u25b3\u753b\u9762\uff1a',
};
const EDIT_STYLE_FAST = '\u5feb\u8282\u594f\u71c3\u5411';
const EDIT_STYLE_SLOW = '\u6162\u53d9\u6292\u60c5';
const TAG_PERSONAL = '\u4e2a\u4eba';

// Dynamically load MJ-generated style preview images
function useStylePreviews() {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch('/style-previews.json')
      .then(r => r.ok ? r.json() : {})
      .then(d => setPreviews(d || {}))
      .catch(() => {});
  }, []);
  return previews;
}
const durationOptions = ['3s', '5s', '8s']; // durations the current API can honor
// v10.6.0 portrait-first: 9:16 first = new projects default vertical (2026 short-drama); landscape still one tap
const aspectOptions = ['9:16', '16:9', '1:1', '2.35:1'];

export default function DashboardCreatePage() {
  const { t: tRaw, locale } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};
  const styleLabel = (p: (typeof stylePresets)[number]) => w[STYLE_I18N[p.id]?.label] || p.en;
  const styleDesc = (p: (typeof stylePresets)[number]) => w[STYLE_I18N[p.id]?.desc] || p.en;
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlExtracting, setUrlExtracting] = useState(false);
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const [videoProvider, setVideoProvider] = useState('veo');
  const [style, setStyle] = useState(stylePresets[0].en);
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  // v2.18 P1: template expand/detail lives in <TemplateLibraryPicker>; expandedTemplate removed

  // Vidu-style: pre-fill idea from URL query (cases page "use this")
  useEffect(() => {
    const ideaParam = searchParams.get('idea');
    if (ideaParam) {
      setIdea(decodeURIComponent(ideaParam));
      return;
    }
    // v6.2.1: long-form split episode arrives via sessionStorage (avoids URL length caps)
    try {
      const seed = sessionStorage.getItem('qfmj-create-seed');
      if (seed) {
        setIdea(seed);
        sessionStorage.removeItem('qfmj-create-seed');
      }
    } catch { /* ignore */ }
    // v6.3: style gallery "apply this look" arrives via sessionStorage
    try {
      const styleSeed = sessionStorage.getItem('qfmj-create-style');
      if (styleSeed) {
        setStyle(styleSeed);
        sessionStorage.removeItem('qfmj-create-style');
      }
    } catch { /* ignore */ }
    // v9.6.8 (T2 template market): "start from template" pre-fills look + refs + locked cast
    try {
      const tplRaw = sessionStorage.getItem('qfmj-create-template');
      if (tplRaw) {
        const tpl = JSON.parse(tplRaw) as { style?: string; styleEn?: string; references?: ReferenceAsset[]; lockedCharacters?: LockedCharacter[]; voiceOverrides?: Record<string, string> };
        if (tpl.styleEn || tpl.style) setStyle(tpl.styleEn || tpl.style!);
        if (Array.isArray(tpl.references) && tpl.references.length) setReferences(tpl.references);
        if (Array.isArray(tpl.lockedCharacters) && tpl.lockedCharacters.length) setLockedCharacters(tpl.lockedCharacters);
        // v9.7.9: stash voice overrides until the new project exists
        if (tpl.voiceOverrides && Object.keys(tpl.voiceOverrides).length) sessionStorage.setItem('qfmj-pending-voice-overrides', JSON.stringify(tpl.voiceOverrides));
        sessionStorage.removeItem('qfmj-create-template');
      }
    } catch { /* ignore */ }
  }, [searchParams]);
  const [duration, setDuration] = useState(durationOptions[1]); // default 5s
  const [aspect, setAspect] = useState(aspectOptions[0]);
  // v2.12 Phase 1: multi-cast face lock (1-3), front-loaded in the pipeline
  const [lockedCharacters, setLockedCharacters] = useState<LockedCharacter[]>([]);
  const [references, setReferences] = useState<ReferenceAsset[]>([]); // v9.5.6: multi-ref shelf (Kling Elements-style)
  // v2.14 P1.1: global default camera language — all shots inherit; per-shot can override
  const [cameraDefault, setCameraDefault] = useState<string | null>(null);
  // v12.0.4: one-line edit style ('' = mid-tempo / preset / free text) → pacing + transitions
  const [editStyle, setEditStyle] = useState('');
  // v12.134 issue #2: script language ('auto' = detect from idea / explicit code)
  const [scriptLanguage, setScriptLanguage] = useState('auto');
  // v12.143: storyboard sketch lock — sketch then lock framing; off by default
  const [sketchLock, setSketchLock] = useState(false);

  // v12.145: remember create prefs across sessions (Miora Agent Memory step 1)
  useEffect(() => {
    const p = loadCreatePrefs();
    if (!p) { const sys = getSystemLanguage(); if (sys !== 'auto') setScriptLanguage(sys); return; } // v12.165
    if (p.style) setStyle(p.style);
    if (p.aspect) setAspect(p.aspect);
    if (p.cameraDefault !== undefined) setCameraDefault(p.cameraDefault);
    if (typeof p.editStyle === 'string') setEditStyle(p.editStyle);
    if (p.scriptLanguage) setScriptLanguage(p.scriptLanguage);
    else { const sys = getSystemLanguage(); if (sys !== 'auto') setScriptLanguage(sys); } // v12.165 system-language fallback
    if (typeof p.sketchLock === 'boolean') setSketchLock(p.sketchLock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // v2.15 G9: draft count (1 = Writer direct; 2/3 = /api/script-drafts compare, then full run)
  const [draftCount, setDraftCount] = useState<1 | 2 | 3>(1);
  // v10.5.3: simple/pro switch — default pro (pixel-match existing UI); localStorage persists
  const [createMode, setCreateMode] = useState<'simple' | 'pro'>('pro');
  useEffect(() => {
    try {
      const m = localStorage.getItem('qfmj-create-mode');
      if (m === 'simple' || m === 'pro') setCreateMode(m);
    } catch { /* ignore */ }
  }, []);
  const switchCreateMode = (m: 'simple' | 'pro') => {
    setCreateMode(m);
    try { localStorage.setItem('qfmj-create-mode', m); } catch { /* ignore */ }
  };
  const [showDraftCompare, setShowDraftCompare] = useState(false);
  // v2.18 P1.3: 1-shot test-preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [workspaceProject, setWorkspaceProject] = useState<Project | null>(null);
  const { showToast } = useToast();

  const stylePreviews = useStylePreviews();
  const {
    setCurrentProject, setNodes, setEdges, setIsProducing,
    addChatMessage, setAssets,
  } = useProjectWorkspaceStore();

  const handleSelectTemplate = (template: StoryTemplate) => {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
    } else {
      setSelectedTemplate(template);
      setIdea(template.exampleIdea);
      // Set recommended style if it matches one of the presets
      const matchedPreset = stylePresets.find(p =>
        p.en === template.styleRecommendation || STYLE_ZH[p.id] === template.styleRecommendation,
      );
      if (matchedPreset) setStyle(matchedPreset.en);
      // v2.18: auto-fill form when template has recommendedDuration / Aspect / Camera
      if (template.recommendedDuration && durationOptions.includes(`${template.recommendedDuration}s` as any)) {
        setDuration(`${template.recommendedDuration}s` as any);
      }
      if (template.recommendedAspect && aspectOptions.includes(template.recommendedAspect as any)) {
        setAspect(template.recommendedAspect as any);
      }
      if (template.recommendedCamera) {
        setCameraDefault(template.recommendedCamera);
      }
    }
  };

  const handleExtractUrl = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;
    setUrlExtracting(true);
    setUrlHint(null);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch('/api/tools/url-to-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.idea) {
          setIdea(data.idea);
          setUrlHint(null);
        } else {
          setUrlHint(w.urlExtractFailed || 'Auto-extract failed, please enter manually');
        }
      } else {
        setUrlHint(w.urlExtractFailed || 'Auto-extract failed, please enter manually');
      }
    } catch {
      clearTimeout(timer);
      setUrlHint(w.urlExtractFailed || 'Auto-extract failed, please enter manually');
    } finally {
      setUrlExtracting(false);
    }
  };

  const handleStartCreation = async () => {
    const validation = validateIdea(idea);
    if (!validation.valid) {
      showToast({ title: validation.error || w.invalidInput || t.common.error, type: 'error' });
      return;
    }

    // v2.15 G9: draftCount > 1 → compare-drafts modal first, then full pipeline
    if (draftCount > 1) {
      setShowDraftCompare(true);
      return;
    }

    return runFullPipeline(idea);
  };

  // v2.15 G9: picked draft → stitch synopsis + shots into a quasi-script idea.
  // /api/create-stream + isFullScriptInput() detect screenplay markers and
  // adapt via parsedScript; Writer rewrites from this version.
  const handleDraftPicked = (draft: ScriptDraft) => {
    setShowDraftCompare(false);
    if (!draft.script) return;
    const lines: string[] = [];
    lines.push(`${SCRIPT_FMT.chapter1} ${draft.script.title || SCRIPT_FMT.draft}`);
    lines.push('');
    if (draft.script.synopsis) lines.push(draft.script.synopsis);
    lines.push('');
    for (const sh of draft.script.shots || []) {
      lines.push(`${sh.shotNumber}-1 ${sh.sceneDescription || SCRIPT_FMT.scene} ${SCRIPT_FMT.day}`);
      if (sh.action) lines.push(`${SCRIPT_FMT.actionPrefix}${sh.action}`);
      if (sh.dialogue && sh.characters?.[0]) {
        lines.push(`${sh.characters[0]}：${sh.dialogue}`);
      }
      lines.push('');
    }
    const adapted = lines.join('\n');
    setIdea(adapted);
    showToast({ title: (w.draftAdopted || 'Adopted draft #{id}, starting full pipeline').replace('{id}', draft.draftId.slice(-4)), type: 'success' });
    // Submit immediately with adapted (setIdea is async)
    runFullPipeline(adapted);
  };

  // v2.19 P0.2: opts.previewSeedImage — test-shot modal "use this image for full run".
  // create-stream sets previewSeedImage on the orchestrator; shot 1 storyboard reuses it (skip MJ).
  const runFullPipeline = async (rawIdea: string, opts?: { previewSeedImage?: string }) => {
    const sanitizedIdea = sanitizeInput(rawIdea);
    const projectId = `proj-${Date.now()}`;
    const project: Project = {
      id: projectId,
      userId: 'current-user',
      title: sanitizedIdea.slice(0, 20) + (sanitizedIdea.length > 20 ? '...' : ''),
      description: sanitizedIdea,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(project);
    setAssets([]);
    setNodes(buildInitialNodes([]));
    setEdges(initialEdges);
    // v12.x(#3): clear prior producer score / review history / agent bubbles
    useProjectWorkspaceStore.getState().clearAgentOutputs();
    setIsProducing(true);
    setWorkspaceProject(project);
    // v12.5.0(#4): register in-progress job so module switch / refresh can return to it
    useActiveGenerationStore.getState().start({ projectId, idea: sanitizedIdea });

    addChatMessage(AgentRole.WRITER, {
      id: `msg-sys-${Date.now()}`, projectId, agentRole: AgentRole.WRITER, role: 'assistant',
      content: (w.chatReceivedIdea || 'Got your idea: “{idea}”\n\nWriting script, characters, and boards...').replace('{idea}', sanitizedIdea), createdAt: new Date().toISOString(),
    });

    try {
      // v12.145: remember this create config for next visit
      saveCreatePrefs({ style, aspect, cameraDefault, editStyle, scriptLanguage, sketchLock });
      const response = await fetch('/api/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: sanitizedIdea, videoProvider, style, duration, aspect, projectId,
          templateId: selectedTemplate?.id,
          // v2.12 Phase 1: 1-3 locked faces; persist to locked_characters, first imageUrl → primary_character_ref
          lockedCharacters: lockedCharacters.length > 0 ? lockedCharacters : undefined,
          // v2.14 P1.1: global camera-language id (CAMERA_LANGUAGE_PRESETS)
          cameraDefault: cameraDefault || undefined,
          // v2.19 P0.2: test-shot → reuse as shot 1 first frame (skip generateImage)
          previewSeedImage: opts?.previewSeedImage || undefined,
          // v9.5.6: multi-refs (cast/look/scene/prop/...) — bindElements → cref/sref/framing
          references: references.length ? references : undefined,
          // v12.0.4: one-line edit style (empty → mid-tempo)
          editStyle: editStyle.trim() || undefined,
          // v12.134 issue #2: explicit script language ('auto' → detect from idea)
          language: scriptLanguage !== 'auto' ? scriptLanguage : undefined,
          // v12.143: sketch lock (sketch then lock framing; +1 image per shot)
          sketchLock: sketchLock || undefined,
        }),
      });
      if (!response.ok) throw new Error(w.createFailed || 'Creation failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error(w.streamReadFailed || 'Could not read response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSSEEvent(event, projectId);
          } catch { /* skip malformed */ }
        }
      }

      // v9.7.9: pending voice overrides from one-tap start → apply now that the project exists
      try {
        const pendingVO = sessionStorage.getItem('qfmj-pending-voice-overrides');
        if (pendingVO) {
          sessionStorage.removeItem('qfmj-pending-voice-overrides');
          const overrides = JSON.parse(pendingVO);
          if (overrides && Object.keys(overrides).length) {
            await fetch(`/api/projects/${encodeURIComponent(projectId)}/voice-overrides`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ overrides }),
            }).catch(() => {});
          }
        }
      } catch { /* voice-override apply failure must not block the film */ }
    } catch (error) {
      showToast({ title: error instanceof Error ? error.message : (w.createFailed || 'Creation failed'), type: 'error' });
    } finally {
      setIsProducing(false);
      useActiveGenerationStore.getState().finish(); // v12.5.0(#4): job done, clear global indicator
    }
  };

  // ── SSE handlers ──
  const handleSSEEvent = (event: any, projectId: string) => {
    const { type, data } = event;
    const ts = new Date().toISOString();
    const s = useProjectWorkspaceStore.getState();

    // v12.5.0(#4): milestone → update global phase label (visible across modules)
    const phaseMap: Record<string, string> = {
      plan: t.product.phasePlan, script: t.product.phaseScript, characters: t.product.phaseCharacters,
      scenes: t.product.phaseScenes, storyboardPlans: t.product.phaseStoryboardPlans,
      storyboards: t.product.phaseStoryboards, videoClip: t.product.phaseVideo, videos: t.product.phaseVideo,
      pacingAudit: t.product.phasePacing, editResult: t.product.phaseEdit, review: t.product.phaseReview,
      complete: t.product.phaseComplete,
    };
    const phase = phaseMap[type];
    if (phase) useActiveGenerationStore.getState().setPhase(phase);

    switch (type) {
      case 'agents':
      case 'projectId':
        break;

      // Agent talk bubble
      case 'agentTalk': {
        const role = data.role as AgentRole;
        s.addChatMessage(role, { id: `msg-talk-${Date.now()}-${Math.random()}`, projectId, agentRole: role, role: 'assistant', content: data.text, createdAt: ts });
        break;
      }

      // LLM heartbeat — nudge the running node's progress
      case 'heartbeat': {
        const nodes = s.nodes;
        const runningNode = nodes.find(n => (n.data as any)?.status === 'running');
        if (runningNode) {
          const cur = (runningNode.data as any)?.progress || 0;
          if (cur < 90) {
            s.updateNodeData(runningNode.id, { progress: Math.min(cur + 5, 90) } as any);
          }
        }
        break;
      }

      // MJ progress
      // v2.11 #4: per-image % goes to imageProgress, do not overwrite stage-level progress.
      // Node progress is aggregated by orchestrator this.update(role, { progress }) (i+1/total).
      // mjProgress/videoProgress only reflect the image currently rendering.
      case 'mjProgress': {
        const pctMatch = (data.progress || '').match(/(\d+)/);
        if (pctMatch) {
          const nodes = s.nodes;
          const runningNode = nodes.find(n => (n.data as any)?.status === 'running');
          if (runningNode) {
            s.updateNodeData(runningNode.id, {
              imageProgress: parseInt(pctMatch[1]),
              imageProgressLabel: data.label || w.currentImage || 'Current image',
            } as any);
          }
        }
        break;
      }

      // Veo video progress (per shot)
      // Same: write shot asset + node currentShotProgress, leave stage-level progress alone
      case 'videoProgress': {
        const progress = typeof data.progress === 'number' ? data.progress : 0;
        s.updateNodeData('node-video', { currentShotProgress: progress, status: 'running' } as any);
        // Update that shot's video-asset generate status
        if (data.shotNumber) {
          const va = s.assets.find(a => a.type === 'video' && a.shotNumber === data.shotNumber);
          if (va) {
            s.updateAsset(va.id, { data: { ...va.data, status: 'generating', progress } });
          }
        }
        break;
      }

      case 'status': {
        const msg: string = data.message || '';
        if (msg.includes(SSE.director) && msg.includes(SSE.analyze)) {
          s.updateNodeData('node-director', { status: 'running', progress: 50 });
          s.updateNodeData('node-writer', { status: 'running', progress: 10 });
          s.setActiveAgent(AgentRole.WRITER);
        } else if (msg.includes(SSE.writer) && msg.includes(SSE.script)) {
          s.updateNodeData('node-director', { status: 'completed', progress: 100 });
          s.updateNodeData('node-writer', { status: 'running', progress: 40 });
          s.setActiveAgent(AgentRole.WRITER);
        } else if (msg.includes(SSE.charDesigner)) {
          s.updateNodeData('node-writer', { status: 'completed', progress: 100 });
          s.updateNodeData('node-character', { status: 'running', progress: 20 });
          s.setActiveAgent(AgentRole.CHARACTER_DESIGNER);
        } else if (msg.includes(SSE.sceneDesigner)) {
          s.updateNodeData('node-character', { status: 'completed', progress: 100 });
          s.updateNodeData('node-scene', { status: 'running', progress: 20 });
          s.setActiveAgent(AgentRole.SCENE_DESIGNER);
        } else if (msg.includes(SSE.storyboarder)) {
          s.updateNodeData('node-scene', { status: 'completed', progress: 100 });
          s.updateNodeData('node-storyboard', { status: 'running', progress: 20 });
          s.setActiveAgent(AgentRole.STORYBOARD);
        } else if (msg.includes(SSE.video) && msg.includes(SSE.generate)) {
          s.updateNodeData('node-storyboard', { status: 'completed', progress: 100 });
          s.updateNodeData('node-video', { status: 'running', progress: 20 });
          s.setActiveAgent(AgentRole.VIDEO_PRODUCER);
        } else if (msg.includes(SSE.editor) || msg.includes(SSE.editMux) || msg.includes(SSE.score)) {
          s.updateNodeData('node-video', { status: 'completed', progress: 100 });
          s.updateNodeData('node-editor', { status: 'running', progress: 30 });
          s.setActiveAgent(AgentRole.EDITOR);
        } else if (msg.includes(SSE.producer) && msg.includes(SSE.review)) {
          s.updateNodeData('node-editor', { status: 'completed', progress: 100 });
          s.updateNodeData('node-producer', { status: 'running', progress: 30 });
          s.setActiveAgent(AgentRole.PRODUCER);
        } else if (msg.includes(SSE.autoOpt)) {
          s.updateNodeData('node-producer', { status: 'reviewing', progress: 50 });
        } else if (msg.includes(SSE.secondReview)) {
          s.updateNodeData('node-producer', { status: 'running', progress: 80 });
          s.setActiveAgent(AgentRole.PRODUCER);
        }
        break;
      }

      case 'plan': {
        s.updateNodeData('node-writer', { status: 'running', progress: 30 });
        s.addAsset({ id: `asset-script-${Date.now()}`, projectId, type: 'script', name: t.product.tabScript, data: { synopsis: '', genre: data.genre, style: data.style, shots: [] }, mediaUrls: [], version: 1, createdAt: ts, updatedAt: ts });
        (data.characters || []).forEach((c: any, i: number) => {
          s.addAsset({ id: `asset-char-${Date.now()}-${i}`, projectId, type: 'character', name: c.name, data: { description: c.description }, mediaUrls: [], version: 1, createdAt: ts, updatedAt: ts });
        });
        (data.scenes || []).forEach((sc: any, i: number) => {
          s.addAsset({ id: `asset-scene-${Date.now()}-${i}`, projectId, type: 'scene', name: sc.name || sc.location || (w.assetSceneN || 'Scene {n}').replace('{n}', String(i + 1)), data: { description: sc.description, location: sc.location }, mediaUrls: [], version: 1, createdAt: ts, updatedAt: ts });
        });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.WRITER, { id: `msg-plan-${Date.now()}`, projectId, agentRole: AgentRole.WRITER, role: 'assistant', content: (w.chatPlanReady || 'Director planned: {genre} look, {chars} characters, {scenes} scenes.').replace('{genre}', data.genre).replace('{chars}', String(data.characters?.length || 0)).replace('{scenes}', String(data.scenes?.length || 0)), createdAt: ts });
        break;
      }

      case 'script': {
        const sa = s.assets.find(a => a.type === 'script');
        if (sa) s.updateAsset(sa.id, { data: { ...sa.data, synopsis: data.synopsis, title: data.title, shots: data.shots } });
        s.updateNodeData('node-writer', { status: 'completed', progress: 100 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.WRITER, { id: `msg-script-${Date.now()}`, projectId, agentRole: AgentRole.WRITER, role: 'assistant', content: (w.chatScriptDone || 'Script “{title}” is ready!\n\n{synopsis}\n\n{n} shots.').replace('{title}', data.title).replace('{synopsis}', data.synopsis).replace('{n}', String(data.shots?.length || 0)), createdAt: ts });
        break;
      }

      case 'characters': {
        (data || []).forEach((c: any) => {
          const ca = s.assets.find(a => a.type === 'character' && a.name === c.character);
          // Allow data: URIs (mockSvg placeholders) so cards have a visual
          // Persistence (route.ts saveAsset) already filters data: and will not write them to DB
          const mediaUrls = c.imageUrl ? [c.imageUrl] : [];
          if (ca) s.updateAsset(ca.id, { mediaUrls });
        });
        s.updateNodeData('node-character', { status: 'completed', progress: 100 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.CHARACTER_DESIGNER, { id: `msg-chars-${Date.now()}`, projectId, agentRole: AgentRole.CHARACTER_DESIGNER, role: 'assistant', content: (w.chatCharsDone || '{n} character designs ready!').replace('{n}', String(data?.length || 0)), createdAt: ts });
        break;
      }

      case 'scenes': {
        (data || []).forEach((sc: any) => {
          const sa = s.assets.find(a => a.type === 'scene' && (a.name === sc.name || a.data?.location === sc.name));
          const mediaUrls = sc.imageUrl ? [sc.imageUrl] : [];
          if (sa) s.updateAsset(sa.id, { mediaUrls });
        });
        s.updateNodeData('node-scene', { status: 'completed', progress: 100 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.SCENE_DESIGNER, { id: `msg-scenes-${Date.now()}`, projectId, agentRole: AgentRole.SCENE_DESIGNER, role: 'assistant', content: (w.chatScenesDone || '{n} scene concepts ready!').replace('{n}', String(data?.length || 0)), createdAt: ts });
        break;
      }

      case 'storyboardPlans': {
        // Phase 1: text-only board descriptions (no images yet)
        (data || []).forEach((sb: any, i: number) => {
          const sn = sb.shotNumber || i + 1;
          s.addAsset({ id: `asset-sb-${Date.now()}-${i}`, projectId, type: 'storyboard', name: t.product.shotN.replace('{n}', String(sn)), data: { description: sb.prompt, planData: (sb as any).planData, duration: 10 }, mediaUrls: [], shotNumber: sn, version: 1, createdAt: ts, updatedAt: ts });
        });
        s.updateNodeData('node-storyboard', { status: 'running', progress: 50 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.STORYBOARD, { id: `msg-sbplan-${ts}`, projectId, agentRole: AgentRole.STORYBOARD, role: 'assistant', content: (w.chatBoardsPlanned || '{n} board descriptions planned, rendering boards...').replace('{n}', String(data?.length || 0)), createdAt: ts });
        break;
      }

      case 'storyboardSketch': {
        // v12.144 (full-film sketch lock): per-shot framing sketch → asset; boards panel shows thumb
        const sk = data as { shotNumber?: number; sketchUrl?: string };
        if (sk?.shotNumber && sk?.sketchUrl) {
          s.addAsset({ id: `asset-sksk-${Date.now()}-${sk.shotNumber}`, projectId, type: 'storyboard-sketch', name: (w.assetSketchN || 'Shot {n} sketch').replace('{n}', String(sk.shotNumber)), data: {}, mediaUrls: [sk.sketchUrl], shotNumber: sk.shotNumber, version: 1, createdAt: ts, updatedAt: ts });
          refreshNodeAssets();
        }
        break;
      }

      case 'storyboards': {
        // Phase 2: rendered boards — update existing storyboard assets
        const existing = s.assets.filter(a => a.type === 'storyboard');
        (data || []).forEach((sb: any, i: number) => {
          const sn = sb.shotNumber || i + 1;
          const ex = existing.find(a => a.shotNumber === sn);
          const sbMediaUrls = sb.imageUrl ? [sb.imageUrl] : [];
          if (ex) { s.updateAsset(ex.id, { mediaUrls: sbMediaUrls, data: { ...ex.data, description: sb.prompt } }); }
          else { s.addAsset({ id: `asset-sb-${Date.now()}-${i}`, projectId, type: 'storyboard', name: t.product.shotN.replace('{n}', String(sn)), data: { description: sb.prompt, duration: 10 }, mediaUrls: sbMediaUrls, shotNumber: sn, version: 1, createdAt: ts, updatedAt: ts }); }
        });
        s.updateNodeData('node-storyboard', { status: 'completed', progress: 100 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.STORYBOARD, { id: `msg-sb-${ts}-${Math.random()}`, projectId, agentRole: AgentRole.STORYBOARD, role: 'assistant', content: (w.chatBoardsDone || '{n} boards rendered! Cast/scene/look consistency locked ✅').replace('{n}', String(data?.length || 0)), createdAt: ts });
        break;
      }

      // Per-clip video done (live push — show each clip as it finishes)
      case 'videoClip': {
        const v = data;
        const sn = v.shotNumber || 1;
        const existing = s.assets.find(a => a.type === 'video' && a.shotNumber === sn);
        if (existing) {
          s.updateAsset(existing.id, { mediaUrls: v.videoUrl ? [v.videoUrl] : [], data: { duration: v.duration || 5, status: 'completed' } });
        } else {
          s.addAsset({ id: `asset-video-${Date.now()}-${sn}`, projectId, type: 'video', name: (w.assetVideoN || 'Video {n}').replace('{n}', String(sn)), data: { duration: v.duration || 5, status: 'completed' }, mediaUrls: v.videoUrl ? [v.videoUrl] : [], shotNumber: sn, version: 1, createdAt: ts, updatedAt: ts });
        }
        refreshNodeAssets();
        break;
      }

      case 'videos': {
        // All videos done (final confirm — every clip updated)
        const existingVids = s.assets.filter(a => a.type === 'video');
        (data || []).forEach((v: any, i: number) => {
          const sn = v.shotNumber || i + 1;
          const ex = existingVids.find(a => a.shotNumber === sn);
          if (ex) { s.updateAsset(ex.id, { mediaUrls: v.videoUrl ? [v.videoUrl] : [], data: { duration: v.duration || 5, status: 'completed' } }); }
          else { s.addAsset({ id: `asset-video-${Date.now()}-${i}`, projectId, type: 'video', name: (w.assetVideoN || 'Video {n}').replace('{n}', String(sn)), data: { duration: v.duration || 5, status: 'completed' }, mediaUrls: v.videoUrl ? [v.videoUrl] : [], shotNumber: sn, version: 1, createdAt: ts, updatedAt: ts }); }
        });
        s.updateNodeData('node-video', { status: 'completed', progress: 100 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.VIDEO_PRODUCER, { id: `msg-vid-${ts}-${Math.random()}`, projectId, agentRole: AgentRole.VIDEO_PRODUCER, role: 'assistant', content: (w.chatVideosDone || '{n} video clips ready! Ask for a shot number and duration to regenerate.').replace('{n}', String(data?.length || 0)), createdAt: ts });
        break;
      }

      // v10.6.2: pacing/hook audit (after Writer; Editor BGM re-push) → merge onto script asset
      case 'pacingAudit': {
        const sa = s.assets.find(a => a.type === 'script');
        if (sa) s.updateAsset(sa.id, { data: { ...sa.data, pacingReport: data } });
        break;
      }
      // v12.340: continuity sheet. editor-agent has emitted this since v12.16.0
      // but this switch had no case — events fell through default and were dropped.
      // Cross-shot lighting / aspect / fps issues were computed but never shown.
      // Same as pacingAudit: hang on script asset data for the existing panel.
      case 'continuitySheet': {
        const sa = s.assets.find(a => a.type === 'script');
        if (sa) s.updateAsset(sa.id, { data: { ...sa.data, continuitySheet: data } });
        // Spell out failing checks in chat — agentTalk only said "found N", not which
        const issues: string[] = (data as any)?.check?.issues || [];
        if (issues.length) {
          s.addChatMessage(AgentRole.EDITOR, {
            id: `msg-cont-${Date.now()}`, projectId, agentRole: AgentRole.EDITOR,
            role: 'agent', content: (w.chatContinuityIssues || 'Continuity sheet: {n} issues — {list}{more}')
              .replace('{n}', String(issues.length))
              .replace('{list}', issues.slice(0, 3).join(';'))
              .replace('{more}', issues.length > 3 ? (w.chatContinuityMore || ' and {n} more').replace('{n}', String(issues.length)) : ''),
            timestamp: new Date().toISOString(),
          } as any);
        }
        break;
      }
      case 'editResult': {
        s.updateNodeData('node-editor', { status: 'completed', progress: 100, editResult: data } as any);
        refreshNodeAssets();
        s.addChatMessage(AgentRole.EDITOR, { id: `msg-edit-${Date.now()}`, projectId, agentRole: AgentRole.EDITOR, role: 'assistant',
          content: (w.chatEditDone || 'Edit done! {n} shots, {sec}s total ✂️').replace('{n}', String(data.videoCount)).replace('{sec}', String(data.totalDuration)), createdAt: ts });
        break;
      }

      case 'review': {
        s.updateNodeData('node-producer', { status: 'completed', progress: 100, review: data } as any);
        s.setDirectorReview(data);
        s.addReviewToHistory(data);
        refreshNodeAssets();
        const score = data.overallScore || 0;
        const emoji = score >= 80 ? '👍' : score >= 70 ? '🤔' : '😤';
        s.addChatMessage(AgentRole.PRODUCER, { id: `msg-rev-${ts}-${Math.random()}`, projectId, agentRole: AgentRole.PRODUCER, role: 'assistant',
          content: (w.chatReviewDone || 'Review done! Score: {score}/100 {emoji}\n\n{summary}\n\n{items}{pass}')
            .replace('{score}', String(score))
            .replace('{emoji}', emoji)
            .replace('{summary}', data.summary)
            .replace('{items}', data.items?.length ? (w.chatReviewItems || 'Found {n} suggestions.').replace('{n}', String(data.items.length)) : (w.chatReviewNone || 'Nothing to improve.'))
            .replace('{pass}', data.passed ? (w.chatReviewPass || '\n\n✅ Review passed!') : (w.chatReviewFail || '\n\n⚠️ Did not pass, auto-optimizing...')), createdAt: ts });
        break;
      }

      case 'complete': {
        s.updateNodeData('node-producer', { status: 'completed', progress: 100 });
        refreshNodeAssets();
        s.addChatMessage(AgentRole.PRODUCER, { id: `msg-done-${Date.now()}`, projectId, agentRole: AgentRole.PRODUCER, role: 'assistant',
          content: w.chatComplete || 'Pipeline finished! All assets saved.\n\nOpen My Assets for confirmed assets, or keep chatting with agents to adjust.', createdAt: ts });
        break;
      }

      case 'pipelineError': {
        // Non-fatal: a step failed but the pipeline continues; support "retry this step"
        const { code, userMsg, retryable, stage, details } = data || {};
        const shotNumber = details?.shotNumber;
        showToast({
          title: userMsg || w.stepFailed || 'Step failed',
          description: `[${code || 'UNKNOWN'}] ${(w.stageLabel || 'stage:{stage}').replace('{stage}', stage || '-')}`,
          type: 'warning',
          duration: 8000,
          action: retryable && shotNumber && projectId ? {
            label: (w.retryShot || 'Retry shot {n}').replace('{n}', String(shotNumber)),
            onClick: () => {
              fetch(`/api/projects/${projectId}/regenerate-shot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shotNumber }),
              }).catch(() => {});
            },
          } : undefined,
        });
        break;
      }

      case 'error': {
        const title = data.userMsg || data.message || w.createError || 'Creation error';
        const desc = data.code ? `[${data.code}] ${data.stage || ''}` : undefined;
        showToast({
          title, description: desc, type: 'error', duration: 8000,
          action: data.retryable ? {
            label: w.retryCurrentStep || 'Restart current step',
            onClick: () => window.location.reload(),
          } : undefined,
        });
        break;
      }
    }
  };

  const refreshNodeAssets = () => {
    const s = useProjectWorkspaceStore.getState();
    const a = s.assets;
    const map: Record<string, string[]> = {
      'node-writer': ['script', 'character'],
      'node-character': ['character'],
      'node-scene': ['scene'],
      'node-storyboard': ['storyboard', 'storyboard-sketch'], // v12.144 panel includes sketches
      'node-video': ['video'],
      'node-editor': ['timeline', 'final_video', 'music'],
    };
    for (const [nid, types] of Object.entries(map)) {
      s.updateNodeData(nid, { assets: a.filter(x => types.includes(x.type)) } as any);
    }
  };

  // ── Already in production mode ──
  if (workspaceProject) {
    return <CreationWorkspace project={workspaceProject} />;
  }

  // ── Idea entry (v2.13 cinema redesign) ──
  // Cinema dashboard + studio density — not oiioii pink / blob mascot / dot canvas
  const ideaCharCount = idea.trim().length;
  const isReady = ideaCharCount >= 10;
  const totalDurationSec = parseFloat(duration.replace(/[^\d.]/g, '')) * 6; // ~6 shots
  return (
    <div className="cinema-page -mx-[5vw] -my-6 px-[5vw] py-6">
      {/* v2.15 G9: draft-compare modal — shown when draftCount > 1 and user hits ROLL */}
      {showDraftCompare && (
        <ScriptDraftsCompare
          idea={idea}
          style={style}
          count={draftCount}
          onPick={handleDraftPicked}
          onCancel={() => setShowDraftCompare(false)}
        />
      )}

      {/* v2.18 P1.3: test-shot modal — 1-shot end-to-end preview */}
      {/* v2.19 P0.2: seed goes straight to runFullPipeline — skip handleStartCreation
          (that path resets state and may open draft-compare; test-shot already chose) */}
      {showPreview && (
        <PreviewShotModal
          idea={idea}
          style={style}
          aspect={aspect}
          videoToo={true}
          onAccept={(seed) => {
            setShowPreview(false);
            if (seed?.imageUrl) {
              showToast({ title: w.previewSeeded || 'Reused test-shot as shot 1 first frame, starting full pipeline', type: 'success' });
              runFullPipeline(idea, { previewSeedImage: seed.imageUrl });
            } else {
              handleStartCreation();
            }
          }}
          onCancel={() => setShowPreview(false)}
        />
      )}

      {/* v10.1.2: demo banner — no image/video engine key → placeholder + how to enable */}
      <DemoModeBanner />
      {/* v10.5.3: first-run 3-step guide (idea → look → ROLL); hide after done/skip */}
      <FirstRunGuide />

      {/* ── Top: slate title + actions (instead of a flat h2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start mb-6">
        <SlateCard
          title={t.sidebar.workshop}
          scene="01"
          take={ideaCharCount > 0 ? String(Math.floor(ideaCharCount / 50) + 1).padStart(2, '0') : '—'}
          director="ChrisChen667788"
          notes={w.slateNotes || 'From one idea to a full short — set copy, cast, look, and duration, then ROLL'}
        />
        <div className="flex flex-col gap-2 items-stretch sm:items-end">
          {/* v10.5.3: simple/pro switch — simple keeps idea → look → duration/aspect → ROLL */}
          <div className="inline-flex self-stretch sm:self-end rounded-lg border border-[var(--cinema-border-hi)] overflow-hidden" role="group" aria-label={w.createModeAria || 'Creation mode'}>
            {([['simple', w.modeSimple || 'Simple'], ['pro', w.modePro || 'Pro']] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchCreateMode(m)}
                aria-pressed={createMode === m}
                className={`px-3 py-1 cinema-mono text-[11px] transition-colors ${
                  createMode === m
                    ? 'bg-[var(--cinema-amber,#C9A35E)] text-[#0A0908] font-semibold'
                    : 'text-[var(--cinema-text-2)] hover:text-[var(--cinema-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* v2.18 P1.3: test-shot — 30-60s for 1 shot so user sees vibe before full run */}
          <button
            onClick={() => setShowPreview(true)}
            disabled={!isReady}
            className="cinema-btn !px-4 !py-2 !text-[12px] inline-flex items-center justify-center gap-1.5 disabled:opacity-40 whitespace-nowrap"
            title={isReady ? (w.previewShotTitle || '1 image + 5s video, 30–60s, no full pipeline') : (w.needTenChars || 'Enter at least 10 characters')}
          >
            <FilmSlate className="w-3.5 h-3.5" weight="duotone" />
            {w.previewShot || 'Test shot ×1'}
          </button>
          <MovingBorderButton
            data-guide="roll"
            onClick={handleStartCreation}
            disabled={!isReady}
            duration={3000}
            containerClassName={`whitespace-nowrap ${
              isReady
                ? 'shadow-[0_6px_18px_-8px_rgba(201,163,94,0.55)]'
                : 'opacity-40 cursor-not-allowed'
            }`}
            className={`cinema-btn cinema-btn-primary !px-6 !py-3 !text-[13px] whitespace-nowrap ${
              !isReady ? 'opacity-100' : ''
            }`}
            title={isReady ? (w.enterWorkshop || t.sidebar.workshop) : (w.needTenChars || 'Enter at least 10 characters')}
          >
            <span className="inline-flex items-center gap-1.5">
              {isReady ? <><Play size={13} weight="fill" /> {w.rollReady || 'ROLL'}</> : <><Pencil size={13} /> {w.awaitingIdea || 'Awaiting idea'}</>}
            </span>
          </MovingBorderButton>
          {/* v8.3 P5: idea generator lives here (no standalone nav) — director prompts + look/LUT/camera */}
          <Link
            href="/dashboard/master-prompt"
            className="text-[11px] text-[var(--cinema-text-2)] hover:text-[var(--cinema-amber)] transition-colors inline-flex items-center justify-end gap-1 whitespace-nowrap"
            title={w.noInspirationTitle || 'Director-grade prompts · film look / LUT / camera presets · glossary'}
          >
            <Sparkles size={12} weight="duotone" /> {w.noInspiration || 'No idea? Build a director-grade prompt →'}
          </Link>
        </div>
      </div>

      <FilmStripDivider label={w.act1 || 'ACT 1 · Idea + setup'} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cinema-card p-5 flex flex-col gap-5">
          {/* v12.149: engine weather — show unhealthy engines before create (hidden if all healthy) */}
          <EngineWeather />
          {/* URL → idea */}
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlHint(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleExtractUrl(); } }}
                placeholder={w.urlPlaceholder || 'Paste a product/brand URL to extract an idea'}
                className="cinema-input flex-1 text-sm"
                disabled={urlExtracting}
              />
              <button
                type="button"
                onClick={handleExtractUrl}
                disabled={urlExtracting || !urlInput.trim()}
                className="cinema-btn-ghost text-sm px-3 shrink-0 disabled:opacity-40"
              >
                {urlExtracting ? (w.extracting || 'Extracting…') : (w.extract || 'Extract')}
              </button>
            </div>
            {urlHint && (
              <p className="mt-1 text-xs opacity-60">{urlHint}</p>
            )}
          </div>

          <label className="block">
            <div className="flex items-center justify-between mb-2">
              <Eyebrow>{w.scriptEyebrow || 'Script · Idea / screenplay'}</Eyebrow>
              <span className="cinema-mono text-[10px] opacity-60 tabular-nums">
                {ideaCharCount} chars
              </span>
            </div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={10}
              placeholder={w.ideaPlaceholder || 'Two ways to start:\n1. Short idea: a traveler in a dusk city, neon rain...\n2. Full script: paste scenes, dialogue, and action lines'}
              data-guide="idea"
              className="cinema-textarea"
            />
          </label>

          {/* v2.18 P1: template library — search / tags / personal / clone / save current */}
          {createMode === 'pro' && <TemplateLibraryPicker
            selectedId={selectedTemplate?.id || null}
            onSelect={(tpl) => {
              if (tpl === null) setSelectedTemplate(null);
              else handleSelectTemplate(tpl);
            }}
            onSaveCurrentAsTemplate={async () => {
              const trimmedIdea = idea.trim();
              if (!trimmedIdea || trimmedIdea.length < 10) {
                showToast({ title: w.templateNeedIdea || 'Enter at least 10 characters before saving a template', type: 'error' });
                return;
              }
              const name = window.prompt(w.templateNamePrompt || 'Name this template (≤40 chars)', w.templateNameDefault || 'My template');
              if (!name?.trim()) return;
              try {
                const res = await fetch('/api/global-assets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'template',
                    name: name.trim().slice(0, 40),
                    description: (w.templateDesc || 'Custom template · {style} · {duration} · {aspect}').replace('{style}', style).replace('{duration}', duration).replace('{aspect}', aspect),
                    metadata: {
                      icon: '⭐',
                      nameEn: 'Custom',
                      exampleIdea: trimmedIdea,
                      structureHint: w.customTemplateHint || 'Custom template from the current idea; no preset structure — Director/Writer follow the idea',
                      emotionCurve: '',
                      keyElements: [],
                      styleRecommendation: style,
                      shotCount: { min: 4, max: 8 },
                      colorPalette: '',
                      tags: [TAG_PERSONAL, style],
                      recommendedDuration: parseInt(duration.replace(/[^\d]/g, '')) as 5 | 6 | 10 | 15,
                      recommendedAspect: aspect as any,
                      recommendedCamera: cameraDefault || undefined,
                    },
                  }),
                });
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  showToast({ title: (w.templateSaveFailed || 'Save failed: {error}').replace('{error}', String(body.error || res.status)), type: 'error' });
                  return;
                }
                showToast({ title: (w.templateSaved || 'Saved template “{name}”. Pick it next time you create.').replace('{name}', name.trim()), type: 'success' });
              } catch (e) {
                showToast({ title: e instanceof Error ? e.message : (w.templateSaveFailed || 'Save failed: {error}').replace('{error}', ''), type: 'error' });
              }
            }}
          />}

          {/* Style preset shelf — cinema redesign */}
          <div data-guide="style">
            <div className="flex items-center justify-between mb-2">
              <Eyebrow>{w.lookEyebrow || 'Look · Style presets'}</Eyebrow>
              <span className="cinema-mono text-[10px] opacity-50">{stylePresets.length} looks</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
              {stylePresets.map((preset, idx) => {
                const isActive = style === preset.en;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setStyle(preset.en)}
                    className={`shrink-0 min-w-[150px] overflow-hidden border text-left transition-colors group ${
                      isActive
                        ? 'border-[var(--cinema-amber)]'
                        : 'border-[var(--cinema-border)] hover:border-[var(--cinema-amber-deep)]'
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {stylePreviews[preset.id] ? (
                        <img loading="lazy" decoding="async" src={stylePreviews[preset.id]} alt={styleLabel(preset)} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        // v8.3 P6.3: gold emblem fallback when no live preview; then emoji
                        <div className="absolute inset-0 grid place-items-center text-3xl bg-[var(--cinema-surface-2)]">
                          <span aria-hidden>{preset.icon}</span>
                          <img src={`/look-icons/${preset.id}.jpg`} alt="" aria-hidden loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      )}
                      {/* Top sprocket dim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      {/* Selected: LOOK NN top-left */}
                      <div className="absolute top-1.5 left-1.5 cinema-mono text-[8px] tracking-widest opacity-90 text-white/90 bg-black/40 px-1 rounded">
                        LOOK {String(idx + 1).padStart(2, '0')}
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 cinema-mono text-[8px] tracking-widest font-bold bg-[var(--cinema-amber)] text-black px-1 rounded">
                          ACTIVE
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-[var(--cinema-surface)]">
                      <div className="cinema-headline text-[11px] truncate">{styleLabel(preset)}</div>
                      <div className="cinema-mono text-[9px] opacity-55 truncate mt-0.5">{styleDesc(preset)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* v2.12 Phase 1 — face-lock (1-3), pro mode only as of v10.5.3 */}
          {createMode === 'pro' && (
            <>
              <CharacterLockSection
                value={lockedCharacters}
                onChange={setLockedCharacters}
              />
              {/* v9.5.6: multi-ref shelf (Kling Elements-style) — cast/look/scene/prop/camera/voice → cref/sref/framing */}
              <div className="mt-5">
                <MultimodalRefShelf refs={references} onChange={setReferences} />
              </div>
            </>
          )}

          <FilmStripDivider label={w.act2 || 'ACT 2 · Shot specs'} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Eyebrow>{w.durationEyebrow || 'Duration · Shot length'}</Eyebrow>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {durationOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`cinema-btn !px-3 !py-1 cinema-mono !text-[11px] ${duration === d ? 'cinema-btn-primary' : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Eyebrow>{w.aspectEyebrow || 'Aspect · Frame'}</Eyebrow>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {aspectOptions.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={`cinema-btn !px-3 !py-1 cinema-mono !text-[11px] ${aspect === a ? 'cinema-btn-primary' : ''}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {createMode === 'pro' && <div>
            <Eyebrow>{w.engineEyebrow || t.create.videoProviderLabel}</Eyebrow>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { id: 'veo', label: 'Veo 3.1', sub: 'cinematic · slow' },
                { id: 'minimax', label: 'Minimax', sub: 'balanced · fast' },
                { id: 'keling', label: w.klingLabel || 'Kling AI', sub: w.klingSub || 'Official API · connected' }, // v12.157: key wired; alias normalized in engine-order
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVideoProvider(v.id)}
                  className={`cinema-card-hi p-3 transition-all text-left ${
                    videoProvider === v.id
                      ? 'border-[var(--cinema-amber-deep)] bg-[var(--cinema-amber-glow)]'
                      : 'hover:border-[var(--cinema-border-hi)]'
                  }`}
                  style={videoProvider === v.id ? { borderColor: 'var(--cinema-amber)' } : undefined}
                >
                  <div className="cinema-mono text-[10px] opacity-50 mb-0.5 tracking-wider">{v.id.toUpperCase()}</div>
                  <div className="cinema-headline text-sm">{v.label}</div>
                  <div className="cinema-mono text-[9px] mt-0.5 opacity-60">{v.sub}</div>
                </button>
              ))}
            </div>
          </div>}

          {/* v2.14 P1.1 + v2.16 P1.2: global camera language — cinema-card-hi to match neighbors */}
          {createMode === 'pro' && <div className="cinema-card-hi p-3">
            <CameraLanguagePicker value={cameraDefault} onChange={setCameraDefault} />
          </div>}

          {/* v12.0.4: one-line edit style — feeds smart edit (emotion squeeze + transition hardness) */}
          {createMode === 'pro' && <div className="cinema-card-hi p-3" data-testid="edit-style-picker">
            <div className="cinema-mono text-[10px] opacity-50 mb-1.5 tracking-wider">{w.editStyleTitle || 'Edit style · one-line pacing'}</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { v: '', label: w.editStyleDefault || 'Default mid-tempo' },
                { v: EDIT_STYLE_FAST, label: w.editStyleFast || '⚡ Fast & punchy' },
                { v: EDIT_STYLE_SLOW, label: w.editStyleSlow || '🌙 Slow & lyrical' },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setEditStyle(p.v)}
                  className={`cinema-btn !px-3 !py-1 cinema-mono !text-[11px] ${editStyle === p.v ? 'cinema-btn-primary' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={editStyle}
              onChange={(e) => setEditStyle(e.target.value)}
              placeholder={w.editStylePlaceholder || 'Or custom: “beat-cut shorts” “Wong Kar-wai pauses” (needs LLM key)'}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--cinema-amber)] transition-colors"
            />
          </div>}

          {/* v12.165: production language (shared LanguagePicker; star sets system default) */}
          <div data-testid="script-language-picker">
            <LanguagePicker value={scriptLanguage} onChange={setScriptLanguage} label={w.scriptLanguageLabel || 'Script language · dialogue / VO / TTS'} />
          </div>

          {/* v12.143: storyboard sketch lock — constrain framing / camera before generate */}
          <div className="cinema-card-hi p-3" data-testid="sketch-lock-toggle">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sketchLock}
                onChange={(e) => setSketchLock(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <div className="cinema-mono text-[11px]">🎬 {w.sketchLockTitle || 'Storyboard sketch lock'} <span className="opacity-40">{w.sketchLockBadge || '(experimental · more controllable framing)'}</span></div>
                <div className="cinema-mono text-[9px] opacity-40 mt-0.5">{w.sketchLockDesc || 'Each shot gets a B/W framing sketch first, then boards lock to that framing/camera — closer to the designed lens language; cost: +1 image per shot. Sketches are saved and can be viewed/replaced per shot in Shot Workshop.'}</div>
              </div>
            </label>
          </div>

          {/* v2.15 G8 + v2.16 P1.2: my style library — same card wrap */}
          {createMode === 'pro' && <div className="cinema-card-hi p-3">
            <StyleLoraLibrary
              currentStyle={style}
              currentCameraDefault={cameraDefault}
              onApply={(applied) => {
                if (applied.stylePreset) setStyle(applied.stylePreset);
                setCameraDefault(applied.cameraDefault);
                showToast({ title: (w.styleApplied || 'Applied style: {style}').replace('{style}', applied.stylePreset || ''), type: 'success' });
              }}
            />
          </div>}

          {/* v2.15 G9: draft count — 1 = direct; 2/3 = compare cards first */}
          {createMode === 'pro' && <div>
            <Eyebrow>{w.draftsEyebrow || 'Drafts · Compare'}</Eyebrow>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setDraftCount(n)}
                  title={n === 1 ? (w.draftDirectTitle || 'Generate 1 script directly') : (w.draftCompareTitle || 'Generate {n} versions, then pick one').replace('{n}', String(n))}
                  className={`cinema-btn !px-3 !py-1 cinema-mono !text-[11px] ${draftCount === n ? 'cinema-btn-primary' : ''}`}
                >
                  {n === 1 ? (w.draftDirect || 'Direct ×1') : (w.draftCompare || 'Compare ×{n}').replace('{n}', String(n))}
                </button>
              ))}
            </div>
            {draftCount > 1 && (
              <div className="cinema-mono text-[10px] opacity-60 mt-1">
                {(w.draftCompareHint || '↑ After ROLL, compare {n} drafts first (+30–60s)').replace('{n}', String(draftCount))}
              </div>
            )}
          </div>}

          {/* Tech readout — live feedback of current choices */}
          <div className="cinema-card-hi p-3">
            <Eyebrow>{w.readoutEyebrow || 'Readout · Setup preview'}</Eyebrow>
            <div className="mt-2">
              <TechReadout pairs={[
                ['fps', '24'],
                ['format', 'MP4'],
                ['shot', duration],
                ['aspect', aspect],
                ['engine', videoProvider],
                ['camera', cameraDefault || 'auto'],
                ['drafts', String(draftCount)],
                ['est_total', `~${(totalDurationSec).toFixed(0)}s`],
              ]} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Preview: eyebrow + aspect chip + timecode — dashboard density */}
          <div className="cinema-card-hi p-3">
            <div className="flex items-center justify-between mb-2">
              <Eyebrow>{w.previewEyebrow || 'Live Preview'}</Eyebrow>
              <div className="flex items-center gap-1">
                <AspectChip ratio={aspect} />
                <TimecodeChip seconds={parseFloat(duration.replace(/[^\d.]/g, ''))} variant="amber" />
              </div>
            </div>
            <div className="relative rounded-[2px] overflow-hidden border border-[var(--cinema-border)] bg-black">
              {/* v12.46: Arcane-style loop preview (autoplay/muted/loop; IMG_PREVIEW_DEFAULT poster) */}
              <video
                src="/preview/live-preview.mp4"
                poster={IMG_PREVIEW_DEFAULT}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-[260px] object-cover opacity-90"
              />
              {/* LIVE indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-black/50 backdrop-blur-sm pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cinema-red)] animate-pulse" />
                <span className="cinema-mono text-[8px] tracking-widest text-white/80">LIVE</span>
              </div>
              {/* Safe-area crop — common in cinema software */}
              <div className="absolute inset-[10%] border border-dashed border-[rgba(245,241,234,0.18)] pointer-events-none" />
            </div>
          </div>

          <FilmStripDivider label={w.act3 || 'ACT 3 · Inspiration'} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Eyebrow>{w.inspirationEyebrow || 'Inspiration'}</Eyebrow>
              <span className="cinema-mono text-[10px] opacity-50">{EXAMPLE_IDEA_DEFS.length} cues</span>
            </div>
            {EXAMPLE_IDEA_DEFS.map((ex, i) => {
              const titleKey = `idea${ex.id[0].toUpperCase()}${ex.id.slice(1)}Title`;
              const contentKey = `idea${ex.id[0].toUpperCase()}${ex.id.slice(1)}Content`;
              const title = w[titleKey] || ex.id;
              const content = w[contentKey] || '';
              return (
              <button
                key={ex.id}
                onClick={() => setIdea(content)}
                className="cinema-card-hi p-3 group flex items-start gap-3 hover:border-[var(--cinema-amber-deep)] transition-colors text-left"
              >
                <div className="cinema-mono text-[10px] opacity-50 w-6 pt-0.5 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <ex.icon className="w-4 h-4 text-[var(--cinema-amber)] mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="cinema-subhead text-sm leading-tight">{title}</div>
                  <div className="text-[11px] opacity-60 line-clamp-2 mt-1 leading-relaxed">{content}</div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Logic Pro-style status bar ── */}
      <div className="sticky bottom-0 mt-8 -mx-[5vw]">
        <StatusBar
          items={[
            { label: 'STATUS', value: isReady ? 'READY' : 'AWAITING IDEA', status: isReady ? 'green' : 'amber' },
            { label: 'CHARS', value: <span className="cinema-mono">{ideaCharCount}</span> },
            { label: 'TEMPLATE', value: (selectedTemplate ? (locale === 'en' ? selectedTemplate.nameEn : selectedTemplate.name) : '—') },
            { label: 'STYLE', value: style },
            { label: 'SHOT', value: <span className="cinema-mono">{duration}</span> },
            { label: 'ASPECT', value: <span className="cinema-mono">{aspect}</span> },
            { label: 'ENGINE', value: videoProvider.toUpperCase() },
            { label: 'LOCKED', value: <span className="cinema-mono">{lockedCharacters.length}/3</span>, status: lockedCharacters.length > 0 ? 'green' : 'neutral' },
          ]}
        />
      </div>
    </div>
  );
}
