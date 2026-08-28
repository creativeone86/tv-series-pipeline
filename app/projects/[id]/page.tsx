'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { SafeAreaOverlay } from '@/components/ui/safe-area-overlay';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Users, Mountains as Mountain, FilmStrip as Film, Video, Play, Scissors, Star, CheckCircle as CheckCircle2, Warning as AlertTriangle, Pencil, FloppyDisk as Save, X, ChatCircle as MessageCircle, ChartBar as BarChart3, FilmSlate as Clapperboard, Scan as ScanEye, MonitorPlay, LinkSimple as Link2, Gauge, BracketsCurly as Braces, Megaphone, MagicWand, SpeakerHigh, ArrowsOut as Maximize, ArrowsIn as Minimize, UsersThree } from '@phosphor-icons/react';
import { CameoPanel } from '@/components/CameoPanel';
import { CharacterCastPanel } from '@/components/project/character-cast-panel';
import { DistributionPanel } from '@/components/project/distribution-panel';
import { LocalizePanel } from '@/components/project/localize-panel';
import { MusicGenPanel } from '@/components/project/music-gen-panel';
import { CoverCandidatesPanel } from '@/components/project/cover-candidates-panel';
import { DirectorConsole } from '@/components/director-console';
import LatestPolishBanner from '@/components/polish/LatestPolishBanner';
import ProjectChatSidebar, { ChatLauncherButton } from '@/components/agent-chat-sidebar';
import { CameoBadge, CameoSummary } from '@/components/cameo/CameoStoryboardWidgets';
import { ShotInspector, type InspectShot } from '@/components/project/shot-inspector';
import { Eyebrow, TimecodeChip, FilmStripDivider, EmptyState } from '@/components/cinema/primitives';
import { ExportResolutionDropdown } from '@/components/project/export-resolution-dropdown';
import { PlatformExportDropdown } from '@/components/project/platform-export-dropdown';
import { ShotWorkshopTab } from '@/components/project/shot-workshop-tab';
import { CommentThread } from '@/components/collab/comment-thread';
import { PresenceAvatars } from '@/components/collab/presence-avatars';
import { buildTargetId } from '@/lib/comments-shared';
import { useAuth } from '@/components/auth-provider';
import { PacingChart } from '@/components/project/pacing-chart';
import { ReviewStatusBadge } from '@/components/project/review-status-badge';
import dynamic from 'next/dynamic';
import { VisionAuditTab } from '@/components/project/vision-audit-tab';
import { OneClickFilmPanel } from '@/components/project/oneclick-film-panel';
import { CostAttributionPanel } from '@/components/project/cost-attribution-panel';
import { DecisionLogPanel } from '@/components/project/decision-log-panel';
import { SaveTemplateButton } from '@/components/project/save-template-button';
import { InviteProjectButton } from '@/components/project/invite-project-button';
import { ShotCinematographyModal } from '@/components/project/shot-cinematography-modal';
import { DirectorStageModal } from '@/components/project/director-stage-modal';
import { FrameInspectModal } from '@/components/project/frame-inspect-modal';
import type { StageScene } from '@/lib/stage-blocking';
import { seedSpecFromCameraAngle, normalizeShotSpec, describeShotSpec, type ShotSpec } from '@/lib/cinematography';
import { ContinuityConsole } from '@/components/project/continuity-console';
import { HealShotsButton } from '@/components/project/heal-shots-button';
import { AssetLedgerPanel } from '@/components/project/asset-ledger-panel';
import { ClipWithAudio } from '@/components/project/clip-with-audio';
import { PullSheetTable } from '@/components/project/pull-sheet-table';
import { ProjectFormatBar } from '@/components/project/project-format-bar';
import { EmotionRhythmChart } from '@/components/project/emotion-rhythm-chart';
import { computeEmotionCurve } from '@/lib/emotion-curve';
import { MonitorTab } from '@/components/project/monitor-tab';
import { ParamLinkagePanel } from '@/components/project/param-linkage-panel';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';

// Code-split: the timeline is the heaviest widget on the project page (~1182 lines + drag/audio),
// and only renders when activeTab==='timeline' → lazy-load it out of the first-paint bundle.
// ssr:false: client-only, no server render needed.
function TimelineLoadingFallback() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { projectView: Record<string, string> };
  return <div className="p-8 text-center text-sm opacity-60">{t.projectView.loadingTimeline}</div>;
}
const CinemaTimeline = dynamic(
  () => import('@/components/project/cinema-timeline').then((m) => m.CinemaTimeline),
  { ssr: false, loading: () => <TimelineLoadingFallback /> },
);

function displayName(item: any, locale: string, fallback?: string) {
  const fb = fallback ?? item?.name ?? item?.title ?? '';
  if (locale === 'en') return item?.nameEn || item?.en || item?.titleEn || fb;
  return fb;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image') || url.startsWith('data:')) return false;
  if (/\.(mp4|webm|mov|avi|mkv|m3u8|ts)(\?|#|$)/i.test(url)) return true;
  if (/oss.*aliyuncs\.com|cos\..+myqcloud\.com|vod\.|video\./i.test(url)) return true;
  if (url.startsWith('http') && !/\.(jpg|jpeg|png|gif|svg|webp|bmp|ico|tiff)(\?|#|$)/i.test(url)) return true;
  return false;
}

export default function ProjectDetailPage() {
  const { t: tRaw, locale } = useLocale();
  const t = tRaw as typeof tRaw & { projectView: Record<string, string> };
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();   // v12.300: failures must be visible, not console-only
  const [project, setProject] = useState<any>(null);
  // v10.6.0 vertical-first: project aspect drives the preview (legacy rows without a column → 16:9); subtitle safe-area toggle
  const [showSafeArea, setShowSafeArea] = useState(false);
  const isVertical = project?.aspect === '9:16';
  const frameClass = isVertical ? 'aspect-[9/16]' : 'aspect-video';
  const mainFrameClass = isVertical ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-video';
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('script');
  const [playingIndex, setPlayingIndex] = useState<number>(-1);
  // Full playback: click for fullscreen. Fullscreen is on the outer wrap (not <video>), so swapping
  // the next shot remounts <video> without dropping fullscreen; the whole playlist stays fullscreen.
  const playerWrapRef = useRef<HTMLDivElement | null>(null);
  const [isPlayerFs, setIsPlayerFs] = useState(false);
  useEffect(() => {
    const onFsChange = () => setIsPlayerFs(document.fullscreenElement === playerWrapRef.current);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);
  const togglePlayerFullscreen = () => {
    const el = playerWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };
  // v12.13.2: display at the video/image's real aspect — a bare <video> defaults to object-fit:fill and
  // stretches mixed-ratio sources into a fixed box (portrait box + landscape clip = distortion). Probe real
  // size on load; preview + fullscreen both use the real ratio + object-contain.
  const [playerRatio, setPlayerRatio] = useState<number | null>(null);
  // Re-probe on shot change (ratios may differ); onLoadedMetadata/onLoad refill immediately
  useEffect(() => { setPlayerRatio(null); }, [playingIndex]);
  // Given fullscreen or not, return main-player className/style: real ratio if known, else project aspect.
  const mediaPresentation = (isFs: boolean): { className: string; style?: CSSProperties } => {
    if (isFs) return { className: 'max-h-screen max-w-full object-contain' };
    if (playerRatio) {
      return playerRatio < 1
        ? { className: 'object-contain bg-black mx-auto block h-auto', style: { aspectRatio: String(playerRatio), maxHeight: '72vh', width: 'auto' } } // portrait: cap height, center
        : { className: 'w-full object-contain bg-black block', style: { aspectRatio: String(playerRatio) } };                                          // landscape/square: fill width
    }
    return { className: `w-full object-contain bg-black ${mainFrameClass}` }; // fallback: project aspect box, object-contain so it does not stretch
  };
  // v12.153 full-film health (ffprobe: aspect/duration/fps/bitrate/audio/shot completeness/downgraded shots)
  const [healthReport, setHealthReport] = useState<{ overall: string; items: Array<{ key: string; label: string; status: string; detail: string }>; animaticShots?: number[] } | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);
  const loadHealth = async () => {
    try {
      const d = await fetch(`/api/projects/${id}/health`).then((r) => r.json());
      if (Array.isArray(d.items)) setHealthReport(d);
    } catch { /* silent if fetch fails */ }
  };
  // v12.190: project cost drill-down (cost_log × rollupByEngine)
  const [costReport, setCostReport] = useState<{ totalCny: number; entries: number; byEngine: Array<{ engine: string; costCny: number; count: number }> } | null>(null);
  const [costOpen, setCostOpen] = useState(false);
  const loadCost = async () => {
    try {
      const d = await fetch(`/api/projects/${id}/cost`).then((r) => r.json());
      if (typeof d.totalCny === 'number') setCostReport(d);
    } catch { /* silent */ }
  };
  // v12.1.1 final-film audio check
  const [audioCheck, setAudioCheck] = useState<{ audible: boolean; label: string; hasAudioStream: boolean | null; healed: boolean } | null>(null);
  // v12.153: fetch health when the videos tab is active (authoritative downgrade source; play tab reuses it)
  useEffect(() => {
    if ((activeTab === 'videos' || activeTab === 'play') && !healthReport) void loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  useEffect(() => {
    if (activeTab !== 'play') return;
    let alive = true;
    fetch(`/api/projects/${encodeURIComponent(id)}/audio-check`)
      .then((r) => r.json()).then((d) => { if (alive && d.exists) setAudioCheck(d); }).catch(() => {});
    return () => { alive = false; };
  }, [activeTab, id]);

  // Editing state
  const [editingShot, setEditingShot] = useState<number | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  const [shotDraft, setShotDraft] = useState<{ sceneDescription: string; dialogue: string; emotion: string }>({ sceneDescription: '', dialogue: '', emotion: '' });
  const [characterDraft, setCharacterDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);
  // AI assistant sidebar — alt+/ also opens it
  const [chatOpen, setChatOpen] = useState(false);
  // Sprint A.4 batch-retry in-progress flag
  const [batchRetrying, setBatchRetrying] = useState(false);
  const [batchRetryMsg, setBatchRetryMsg] = useState<string>('');
  // v7.2 single-shot cine desk: open board + locally saved camera overrides (skip a full refresh)
  const [cinemaShot, setCinemaShot] = useState<{ shotNumber: number; title?: string; spec: ShotSpec; emotion?: string } | null>(null);
  const [inspectShot, setInspectShot] = useState<InspectShot | null>(null);
  const [specOverrides, setSpecOverrides] = useState<Record<number, ShotSpec>>({});
  // v12.318 director stage: open shot + already-blocked shot numbers (chip highlight, skip a full refresh)
  const [stageShot, setStageShot] = useState<{ shotNumber: number; title?: string; scene?: StageScene | null; characters?: string[] } | null>(null);
  // v12.330: frame inspect — v12.315 segment retake + v12.328 frame inspect previously had APIs only, no entry
  const [frameShot, setFrameShot] = useState<{ shotNumber: number; title?: string } | null>(null);
  const [stagedShots, setStagedShots] = useState<Record<number, true>>({});

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(d => { if (d.id) setProject(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // v12.150: batch re-render failed/downgraded shots (SSE progress; refetch project assets when done)
  const [rerenderBusy, setRerenderBusy] = useState(false);
  const [rerenderMsg, setRerenderMsg] = useState('');
  const rerenderFailedShots = async () => {
    if (rerenderBusy) return;
    setRerenderBusy(true);
    setRerenderMsg(t.projectView.rerenderStarting);
    try {
      const res = await fetch('/api/regenerate-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, stage: 'failed-videos' }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'status') setRerenderMsg(ev.data?.message || '');
            if (ev.type === 'regenerateComplete') setRerenderMsg(t.projectView.rerenderShotDone.replace('{n}', String(ev.data?.shotNumber)));
            if (ev.type === 'regenerateError') setRerenderMsg(t.projectView.rerenderShotFail.replace('{n}', String(ev.data?.shotNumber)).replace('{error}', ev.data?.error || ''));
            if (ev.type === 'batchDone') setRerenderMsg(t.projectView.rerenderBatchDone.replace('{ok}', String(ev.data?.ok)).replace('{total}', String(ev.data?.total)) + (ev.data?.fail ? t.projectView.rerenderBatchFailSuffix.replace('{n}', String(ev.data.fail)) : ''));
          } catch { /* skip bad lines */ }
        }
      }
      // Refetch project to refresh video assets and the final film
      const d = await fetch(`/api/projects/${id}`).then((r) => r.json());
      if (d.id) setProject(d);
    } catch (e) {
      setRerenderMsg(t.projectView.rerenderRequestFail);
    } finally {
      setRerenderBusy(false);
    }
  };

  const startEditShot = (shotIndex: number, shot: any) => {
    setEditingShot(shotIndex);
    setShotDraft({
      sceneDescription: shot.sceneDescription || '',
      dialogue: shot.dialogue || '',
      emotion: shot.emotion || '',
    });
  };

  const cancelEditShot = () => {
    setEditingShot(null);
    setShotDraft({ sceneDescription: '', dialogue: '', emotion: '' });
  };

  const saveShot = async (shotIndex: number) => {
    if (!project) return;
    const assets = project.assets || [];
    const scriptAsset = assets.find((a: any) => a.type === 'script');
    if (!scriptAsset) return;

    const script = project.scriptData || scriptAsset?.data;
    if (!script) return;

    const updatedShots = (script.shots || []).map((s: any, i: number) =>
      i === shotIndex ? { ...s, ...shotDraft } : s
    );
    const updatedData = { ...scriptAsset.data, shots: updatedShots };

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: scriptAsset.id, data: updatedData }),
      });
      if (res.ok) {
        setProject((prev: any) => ({
          ...prev,
          scriptData: prev.scriptData
            ? { ...prev.scriptData, shots: updatedShots }
            : prev.scriptData,
          assets: prev.assets.map((a: any) =>
            a.id === scriptAsset.id ? { ...a, data: updatedData } : a
          ),
        }));
        setEditingShot(null);
      }
    } catch (e) {
      // v12.300: previously console.error only — modal stayed open, loading cleared, zero feedback,
      // so the user could not tell whether to retry or if anything was saved.
      console.error('Failed to save shot:', e);
      showToast({ title: t.projectView.saveFailed, description: (e instanceof Error ? e.message : t.projectView.checkNetwork).slice(0, 120), type: 'error', duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  const startEditCharacter = (characterId: string, description: string) => {
    setEditingCharacter(characterId);
    setCharacterDraft(description || '');
  };

  const cancelEditCharacter = () => {
    setEditingCharacter(null);
    setCharacterDraft('');
  };

  const saveCharacter = async (characterId: string) => {
    if (!project) return;
    const assets = project.assets || [];
    const charAsset = assets.find((a: any) => a.id === characterId);
    if (!charAsset) return;

    const updatedData = { ...charAsset.data, description: characterDraft };

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: characterId, data: updatedData }),
      });
      if (res.ok) {
        setProject((prev: any) => ({
          ...prev,
          assets: prev.assets.map((a: any) =>
            a.id === characterId ? { ...a, data: updatedData } : a
          ),
        }));
        setEditingCharacter(null);
      }
    } catch (e) {
      console.error('Failed to save character:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] text-white grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8C547] to-[#D4A830] grid place-items-center animate-pulse">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div className="text-sm text-[var(--cinema-text-3)]">{t.projectView.loadingProject}</div>
      </div>
    </div>
  );
  if (!project) return (
    <div className="min-h-screen bg-[var(--background)] text-white grid place-items-center">
      <div className="text-[var(--cinema-text-3)]">{t.projectView.projectNotFound}</div>
    </div>
  );

  const assets = project.assets || [];
  const scriptAsset = assets.find((a: any) => a.type === 'script');
  const characters = assets.filter((a: any) => a.type === 'character');
  const scenes = assets.filter((a: any) => a.type === 'scene');
  const storyboards = assets.filter((a: any) => a.type === 'storyboard').sort((a: any, b: any) => (a.shotNumber || 0) - (b.shotNumber || 0));
  // v9.4.6: one-click film loop needs shotNumber → board prompt (defensive; panel skips missing shots)
  const shotPrompts = storyboards.map((s: any) => ({
    shotNumber: s.shotNumber || 0,
    prompt: s.prompt || (s.data && typeof s.data === 'object' ? s.data.prompt : '') || '',
  }));
  const videos = assets.filter((a: any) => a.type === 'video').sort((a: any, b: any) => (a.shotNumber || 0) - (b.shotNumber || 0));
  // v12.1.0 clip preview overlays VO: shotNumber → shot-audio (TTS) URL
  const shotAudioByShot: Record<number, string> = {};
  for (const a of assets as any[]) {
    if (a.type === 'shot-audio' && typeof a.shotNumber === 'number' && a.mediaUrls?.[0]) shotAudioByShot[a.shotNumber] = a.mediaUrls[0];
  }
  const timeline = assets.find((a: any) => a.type === 'timeline');
  const review = project.directorNotes;
  const script = project.scriptData || scriptAsset?.data;

  const tabs = [
    // v6.4: director console — full-pipeline overview + jump to edit
    { key: 'director', label: t.product.tabDirector, icon: MonitorPlay, count: 0 },
    { key: 'script', label: t.product.tabScript, icon: FileText, count: script?.shots?.length || 0 },
    { key: 'characters', label: t.product.tabCharacters, icon: Users, count: characters.length },
    { key: 'scenes', label: t.product.tabScenes, icon: Mountain, count: scenes.length },
    { key: 'storyboard', label: t.product.tabStoryboard, icon: Film, count: storyboards.length },
    { key: 'continuity', label: t.product.tabContinuity, icon: Link2, count: 0 },
    { key: 'videos', label: t.product.tabVideos, icon: Video, count: videos.length },
    { key: 'workshop', label: t.product.tabWorkshop, icon: Scissors, count: videos.length },
    { key: 'timeline', label: t.product.tabTimeline, icon: Clapperboard, count: script?.shots?.length || 0 },
    { key: 'pacing', label: t.product.tabPacing, icon: BarChart3, count: script?.pacingReport?.warnings?.length || 0 },
    { key: 'pullsheet', label: t.product.tabPullsheet, icon: Clapperboard, count: 0 },
    { key: 'vision-audit', label: t.product.tabVision, icon: ScanEye, count: 0 },
    { key: 'oneclick', label: t.product.tabOneclick, icon: MagicWand, count: 0 },
    { key: 'monitor', label: t.product.tabMonitor, icon: Gauge, count: 0 },
    { key: 'param-linkage', label: t.product.tabParam, icon: Braces, count: 0 },
    { key: 'comments', label: t.product.tabComments, icon: MessageCircle, count: 0 },
    { key: 'distribution', label: t.product.tabDistribution, icon: Megaphone, count: 0 },
    { key: 'play', label: t.product.tabPlay, icon: Play, count: 0 },
  ];

  // v12.42 workflow spine: fold 18 flat tabs into two-level IA (create → refine → review → deliver).
  // activeGroup is derived from activeTab (including programmatic setActiveTab, e.g. director jumps); no extra state.
  const TAB_GROUPS: { key: string; label: string; en: string; tabKeys: string[] }[] = [
    { key: 'create',  label: t.product.groupCreate, en: 'CREATE',  tabKeys: ['director', 'script', 'characters', 'scenes', 'storyboard', 'videos', 'oneclick'] },
    { key: 'refine',  label: t.product.groupRefine, en: 'REFINE',  tabKeys: ['workshop', 'continuity', 'timeline', 'param-linkage'] },
    { key: 'review',  label: t.product.groupReview, en: 'REVIEW',  tabKeys: ['pacing', 'pullsheet', 'vision-audit', 'monitor'] },
    { key: 'deliver', label: t.product.groupDeliver, en: 'DELIVER', tabKeys: ['play', 'comments', 'distribution'] },
  ];
  const tabByKey: Record<string, typeof tabs[number]> = Object.fromEntries(tabs.map((t) => [t.key, t]));
  const activeGroup = TAB_GROUPS.find((g) => g.tabKeys.includes(activeTab))?.key || 'create';
  const groupTabs = (TAB_GROUPS.find((g) => g.key === activeGroup)?.tabKeys || []).map((k) => tabByKey[k]).filter(Boolean);

  return (
    <div className="cinema-page min-h-screen text-white">
      {/* Nav — cinema: back on the left + project slate title + score meter on the right */}
      <nav className="sticky top-0 z-50 bg-[var(--cinema-surface)]/85 backdrop-blur-xl border-b border-[var(--cinema-border)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/projects" className="cinema-btn-ghost cinema-btn !p-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="cinema-eyebrow">PROJECT</span>
                <span className="cinema-mono text-[10px] opacity-50">· {project.id?.slice(-8) || '——'}</span>
              </div>
              <div className="cinema-headline text-lg truncate">{displayName(project, locale, project.title)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* v3.0 P0.2: presence — who is viewing this project (Yjs awareness)
                v3.1.3 P3: pass activeTab → chip under others' avatars e.g. "in Shot Workshop" */}
            {user && (
              <PresenceAvatars
                projectId={id}
                currentUser={{ id: user.id, name: user.name, avatarUrl: user.avatarUrl || null }}
                activeTab={activeTab}
              />
            )}
            {/* v3.x P0.3 E.3: review-status badge */}
            <ReviewStatusBadge projectId={id} currentUserId={user?.id} />
            {/* v3.x: invite collaborators (owner only) */}
            <InviteProjectButton
              projectId={id}
              isOwner={!!user && (project?.userId === user.id || project?.user_id === user.id)}
            />
            <span className={`cinema-chip ${project.status === 'completed' ? 'cinema-chip-green' : 'cinema-chip-amber'}`}>
              <span className="cinema-statusbar-dot" style={{ background: project.status === 'completed' ? 'var(--cinema-green)' : 'var(--cinema-amber)' }} />
              {project.status === 'completed' ? 'COMPLETED' : 'IN PRODUCTION'}
            </span>
            {review && (
              <div className="cinema-chip cinema-chip-amber">
                <Star className="w-3 h-3" />
                <span className="cinema-mono">{review.overallScore}<span className="opacity-50">/100</span></span>
              </div>
            )}
            {/* v2.16 P0.2: 4K export dropdown — pick resolution; plan-gate is enforced on the route */}
            <ExportResolutionDropdown projectId={id} />
            {/* v3.5.1: platform export — Douyin/Kuaishou/Xiaohongshu portrait/landscape + platform captions */}
            <PlatformExportDropdown projectId={id} />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* v9.2.3 P4.1: editorial-split header — magazine-style asymmetric two-col (wide title + ruled meta deck) */}
        <motion.header
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 lg:gap-10 items-start"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="cinema-eyebrow">PROJECT</span>
              <span className="cinema-mono text-[10px] opacity-50">· {project.id?.slice(-8) || '——'}</span>
            </div>
            <h1 className="cinema-headline text-3xl sm:text-4xl leading-[1.1] tracking-tight">{displayName(project, locale, project.title)}</h1>
            {script?.synopsis && (
              <p className="mt-3 text-sm text-[var(--cinema-text-3)] leading-relaxed max-w-2xl">{script.synopsis}</p>
            )}
            {script?.theme && (
              <p className="mt-2 text-xs text-[var(--cinema-amber)]">{t.projectView.themeLabel.replace('{theme}', script.theme)}</p>
            )}
          </div>
          <dl className="lg:border-l lg:border-[var(--cinema-border)] lg:pl-8 grid grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-3 shrink-0">
            {[
              { label: t.product.statShots, value: String(script?.shots?.length ?? 0) },
              { label: t.product.statCast, value: String(Array.isArray(project.lockedCharacters) ? project.lockedCharacters.length : 0) },
              { label: t.product.statScore, value: review ? `${review.overallScore}/100` : '—' },
              { label: t.product.statStatus, value: project.status === 'completed' ? t.product.statusDone : t.product.statusMaking },
            ].map((m) => (
              <div key={m.label}>
                <dt className="cinema-eyebrow !text-[9px] opacity-50">{m.label}</dt>
                <dd className="cinema-mono text-base tabular-nums mt-0.5">{m.value}</dd>
              </div>
            ))}
          </dl>
        </motion.header>

        {/* v2.11: latest polish industry checklist (when present) */}
        {scriptAsset?.data?.latestPolish ? (
          <LatestPolishBanner entry={scriptAsset.data.latestPolish} projectId={id} />
        ) : null}

        {/* v2.12 Phase 1: multi-cast face-lock preview — cinema redesign */}
        {Array.isArray(project.lockedCharacters) && project.lockedCharacters.length > 0 && (
          <div className="cinema-card-hi p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Eyebrow>{t.projectView.castLocked.replace('{n}', String(project.lockedCharacters.length))}</Eyebrow>
              <span className="cinema-mono text-[10px] opacity-50">{t.projectView.faceConsistency}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {project.lockedCharacters.map((c: any, idx: number) => {
                const roleLabel = ({ lead: 'LEAD', antagonist: 'ANTAGONIST', supporting: 'SUPPORTING', cameo: 'CAMEO' } as Record<string, string>)[c.role] || c.role || 'CAST';
                return (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1.5 cinema-card border border-[var(--cinema-border-hi)]">
                    <span className="cinema-mono text-[10px] opacity-60 w-5 text-center">{String.fromCharCode(65 + idx)}</span>
                    <img src={c.imageUrl} alt={displayName(c, locale, c.name)} className="w-9 h-9 object-cover" style={{ borderRadius: 3 }} loading="lazy" />
                    <div className="text-xs leading-tight">
                      <div className="cinema-headline text-[12px]">{displayName(c, locale, c.name)}</div>
                      <div className="cinema-mono text-[9px] opacity-60">{roleLabel} · cw={c.cw}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* v2.10 A: Cameo lead-face lock (single-cast fallback; Phase 1 still sits next to multi-cast) */}
        <CameoPanel
          projectId={id}
          initialUrl={project.primaryCharacterRef}
          onChange={(nextUrl) => setProject((prev: any) => ({ ...prev, primaryCharacterRef: nextUrl }))}
        />

        {/* v12.198: multi-cast dossier (add/edit supporting faces after build; writes locked_characters → subject_reference per shot) */}
        <CharacterCastPanel projectId={id} />

        {/* Tabs — v12.42 two-level workflow spine (create → refine → review → deliver), folding 18 flat tabs */}
        <div className="mb-6 flex flex-col gap-2">
          {/* Spine: workflow groups */}
          <div
            role="tablist"
            aria-label={t.projectView.workflowGroupsAria}
            className="flex items-center gap-1 cinema-card p-1 w-fit"
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
              e.preventDefault();
              const i = TAB_GROUPS.findIndex(g => g.key === activeGroup);
              const ni = (i + (e.key === 'ArrowRight' ? 1 : TAB_GROUPS.length - 1)) % TAB_GROUPS.length;
              setActiveTab(TAB_GROUPS[ni].tabKeys[0]);
            }}
          >
            {TAB_GROUPS.map(g => {
              const on = activeGroup === g.key;
              return (
                <button
                  key={g.key}
                  role="tab"
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => { if (g.key !== activeGroup) setActiveTab(g.tabKeys[0]); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    on
                      ? 'bg-[var(--cinema-amber)] text-black font-semibold'
                      : 'text-[var(--cinema-text-2)] hover:text-[var(--cinema-text)] hover:bg-[var(--cinema-surface-2)]'
                  }`}
                  style={{ borderRadius: 3 }}
                >
                  <span>{g.label}</span>
                  <span className={`cinema-mono text-[8px] tracking-widest ${on ? 'opacity-60' : 'opacity-40'}`}>{g.en}</span>
                </button>
              );
            })}
          </div>
          {/* Stages in the current group */}
          <div
            role="tablist"
            aria-label={t.projectView.stagesAria.replace('{group}', TAB_GROUPS.find(g => g.key === activeGroup)?.label || '')}
            className="flex items-center gap-0.5 cinema-card overflow-x-auto p-1 w-fit"
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
              e.preventDefault();
              const keys = groupTabs.map(t => t.key);
              const i = Math.max(0, keys.indexOf(activeTab));
              const ni = (i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length;
              setActiveTab(keys[ni]);
            }}
          >
            {groupTabs.map(t => {
              const on = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    on
                      ? 'bg-[var(--cinema-amber)] text-black font-semibold'
                      : 'text-[var(--cinema-text-2)] hover:text-[var(--cinema-text)] hover:bg-[var(--cinema-surface-2)]'
                  }`}
                  style={{ borderRadius: 3 }}
                >
                  <t.icon className="w-3 h-3" />
                  <span>{t.label}</span>
                  {t.count > 0 && <span className="cinema-mono text-[9px] opacity-70 tabular-nums">{String(t.count).padStart(2, '0')}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* v6.4: director console — full-pipeline overview */}
          {activeTab === 'director' && (
            <DirectorConsole
              assets={assets}
              onEditStage={(tab) => setActiveTab(tab)}
              projectId={id}
              onReran={() => {
                fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d?.id) setProject(d); }).catch(() => {});
              }}
            />
          )}

          {/* Script */}
          {activeTab === 'script' && script && (
            <div className="space-y-2.5">
              {(script.shots || []).map((shot: any, i: number) => (
                <div key={i} className="cinema-card p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="cinema-mono text-[9px] tracking-widest text-[var(--cinema-amber)]">SHOT {String(shot.shotNumber || i + 1).padStart(2, '0')}</span>
                    {shot.act && <span className="cinema-mono text-[10px] opacity-50">ACT {shot.act}</span>}
                    {shot.emotion && editingShot !== i && <span className="cinema-mono text-[10px] opacity-50">{shot.emotion}</span>}
                    {shot.duration && <TimecodeChip seconds={shot.duration} />}
                    <div className="ml-auto">
                      {editingShot === i ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => saveShot(i)} disabled={saving} className="cinema-btn-primary !text-xs !py-1 disabled:opacity-50">
                            <Save className="w-3 h-3" /> {t.common.save}
                          </button>
                          <button onClick={cancelEditShot} className="cinema-btn-ghost !text-xs !py-1">
                            <X className="w-3 h-3" /> {t.common.cancel}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditShot(i, shot)} className="cinema-btn-ghost !text-xs !py-1">
                          <Pencil className="w-3 h-3" /> {t.common.edit}
                        </button>
                      )}
                    </div>
                  </div>

                  {editingShot === i ? (
                    <div className="space-y-2.5 mt-2">
                      <div>
                        <label className="cinema-eyebrow !text-[9px] opacity-60 block mb-1">{t.projectView.sceneDescription}</label>
                        <textarea
                          value={shotDraft.sceneDescription}
                          onChange={e => setShotDraft(d => ({ ...d, sceneDescription: e.target.value }))}
                          rows={3}
                          className="cinema-input w-full text-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="cinema-eyebrow !text-[9px] opacity-60 block mb-1">{t.projectView.dialogue}</label>
                        <textarea
                          value={shotDraft.dialogue}
                          onChange={e => setShotDraft(d => ({ ...d, dialogue: e.target.value }))}
                          rows={2}
                          className="cinema-input w-full text-sm resize-none !text-[var(--cinema-blue)]"
                        />
                      </div>
                      <div>
                        <label className="cinema-eyebrow !text-[9px] opacity-60 block mb-1">{t.visionAudit.dimMood}</label>
                        <input
                          type="text"
                          value={shotDraft.emotion}
                          onChange={e => setShotDraft(d => ({ ...d, emotion: e.target.value }))}
                          className="cinema-input w-full text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="cinema-subhead text-sm opacity-90">{shot.sceneDescription}</p>
                      {shot.dialogue && <p className="text-xs text-[var(--cinema-blue)] mt-1.5 italic">「{shot.dialogue}」</p>}
                      {shot.beat && <p className="cinema-mono text-[10px] opacity-50 mt-1">{t.projectView.beatLabel.replace('{beat}', shot.beat)}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cast */}
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.length === 0 && <div className="col-span-full"><EmptyState icon={Users} title={t.product.emptyCharacters} hint={t.projectView.emptyCharactersHint} /></div>}
              {characters.map((c: any) => (
                <div key={c.id} className="cinema-card overflow-hidden">
                  {c.mediaUrls?.[0] && (
                    <img loading="lazy" decoding="async" src={c.mediaUrls[0]} alt={displayName(c, locale, c.name)} className="w-full h-[200px] object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="cinema-headline text-sm mb-1.5">{displayName(c, locale, c.name)}</h3>
                    {editingCharacter === c.id ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={characterDraft}
                          onChange={e => setCharacterDraft(e.target.value)}
                          rows={4}
                          className="cinema-input w-full text-xs resize-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => saveCharacter(c.id)} disabled={saving} className="cinema-btn-primary !text-xs !py-1 disabled:opacity-50">
                            <Save className="w-3 h-3" /> {t.common.save}
                          </button>
                          <button onClick={cancelEditCharacter} className="cinema-btn-ghost !text-xs !py-1">
                            <X className="w-3 h-3" /> {t.common.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="cinema-subhead text-xs opacity-80 leading-relaxed">{c.data?.description}</p>
                        <button onClick={() => startEditCharacter(c.id, c.data?.description || '')} className="cinema-btn-ghost !text-xs !py-1 mt-3">
                          <Pencil className="w-3 h-3" /> {t.projectView.editDescription}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scenes */}
          {activeTab === 'scenes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenes.length === 0 && <div className="col-span-full"><EmptyState icon={Mountain} title={t.product.emptyScenes} hint={t.projectView.emptyScenesHint} /></div>}
              {scenes.map((s: any) => (
                <div key={s.id} className="cinema-card overflow-hidden">
                  {s.mediaUrls?.[0] && (
                    <img loading="lazy" decoding="async" src={s.mediaUrls[0]} alt={displayName(s, locale, s.name)} className="w-full h-[180px] object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="cinema-headline text-sm mb-1.5">{displayName(s, locale, s.name)}</h3>
                    <p className="cinema-subhead text-xs opacity-80 leading-relaxed">{s.data?.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Storyboard */}
          {activeTab === 'storyboard' && (
            <div>
              {/* v7.4 project format bar (aspect / color / fps / safe frame) */}
              <ProjectFormatBar projectId={id} initialFormat={assets.find((a: any) => a.type === 'project-format')?.data} />
              {/* Sprint A.4 · Cameo consistency summary + batch-retry button */}
              <CameoSummary
                storyboards={storyboards}
                batchRetrying={batchRetrying}
                onBatchRetry={async (lowShots) => {
                  if (!lowShots.length) return;
                  setBatchRetrying(true);
                  setBatchRetryMsg('');
                  try {
                    const res = await fetch(`/api/projects/${id}/cameo-retry-storyboard`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ shotNumbers: lowShots }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setBatchRetryMsg(json?.error || t.projectView.cameoRetryFail.replace('{status}', String(res.status)));
                    } else {
                      setBatchRetryMsg(
                        t.projectView.cameoRetryDone.replace('{upgraded}', String(json.upgraded ?? 0)).replace('{unchanged}', String(json.unchanged ?? 0)).replace('{failed}', String(json.failed ?? 0))
                      );
                      // Refetch latest data to refresh the page
                      const fresh = await fetch(`/api/projects/${id}`).then((r) => r.json()).catch(() => null);
                      if (fresh?.id) setProject(fresh);
                    }
                  } catch (e: any) {
                    setBatchRetryMsg(e?.message || t.projectView.networkError);
                  } finally {
                    setBatchRetrying(false);
                    setTimeout(() => setBatchRetryMsg(''), 8000);
                  }
                }}
              />
              {batchRetryMsg ? (
                <div className="cinema-card-hi mb-3 px-3 py-2 cinema-mono text-[11px] tracking-wide" style={{ borderColor: 'var(--cinema-amber-deep)' }}>
                  <span className="opacity-60">[BATCH RETRY] </span>{batchRetryMsg}
                </div>
              ) : null}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {storyboards.map((sb: any) => {
                  const dur = (sb.data?.duration as number) || 5;
                  const curSpec: ShotSpec = specOverrides[sb.shotNumber] || (sb.data?.cameraSpec ? normalizeShotSpec(sb.data.cameraSpec) : seedSpecFromCameraAngle(sb.data?.cameraAngle));
                  const hasSaved = !!specOverrides[sb.shotNumber] || !!sb.data?.cameraSpec;
                  const scriptShot = (script?.shots || [])[sb.shotNumber - 1];
                  return (
                    <div
                      key={sb.id}
                      data-shot={sb.shotNumber}
                      className="cinema-card relative overflow-hidden hover:border-[var(--cinema-amber-deep)] transition-colors scroll-mt-24"
                    >
                      {/* Sprint A.4 · Cameo badge top-right (hidden when there is no score) */}
                      <CameoBadge data={sb.data || {}} />
                      {sb.mediaUrls?.[0] ? (
                        <div
                          className="relative cursor-pointer group/insp"
                          onClick={() => setInspectShot({ shotNumber: sb.shotNumber, imageUrl: sb.mediaUrls[0], description: sb.data?.description, dialogue: scriptShot?.dialogue, emotion: scriptShot?.emotion, duration: dur, data: sb.data || {}, specSummary: describeShotSpec(curSpec) })}
                        >
                          <img loading="lazy" decoding="async" src={sb.mediaUrls[0]} alt={sb.name} className={`w-full ${frameClass} object-cover`} />
                          {isVertical && showSafeArea && <SafeAreaOverlay />}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/insp:bg-black/35 opacity-0 group-hover/insp:opacity-100 transition-all">
                            <span className="cinema-chip cinema-chip-amber">{t.projectView.inspector}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full ${frameClass} flex items-center justify-center bg-[var(--cinema-surface-2)] cinema-mono text-[10px] opacity-40`}>
                          NO RENDER
                        </div>
                      )}
                      <div className="px-2.5 py-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="cinema-mono text-[9px] tracking-widest opacity-60">SHOT {String(sb.shotNumber).padStart(2, '0')}</span>
                          <TimecodeChip seconds={dur} />
                        </div>
                        <p className="cinema-subhead text-[11px] line-clamp-2 opacity-85 leading-snug">
                          {sb.data?.description?.slice(0, 60) || '——'}
                        </p>
                        {/* v7.2 single-shot cine desk — camera-summary chip + entry */}
                        <button
                          onClick={() => setCinemaShot({ shotNumber: sb.shotNumber, title: sb.data?.description?.slice(0, 60), spec: curSpec, emotion: scriptShot?.emotion })}
                          title={t.projectView.cineDeskTitle}
                          className="mt-1.5 w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md border border-[var(--cinema-border)] hover:border-[var(--cinema-amber)] transition group/cine"
                        >
                          <Clapperboard size={11} className={hasSaved ? 'text-[var(--cinema-amber)]' : 'text-[var(--cinema-text-3)]'} />
                          <span className="cinema-mono text-[9px] truncate opacity-75 group-hover/cine:opacity-100">
                            {describeShotSpec(curSpec)}
                          </span>
                        </button>
                        {/* v12.318 director stage — blocking / camera / composition check */}
                        <button
                          onClick={async () => {
                            let scene: StageScene | null = null;
                            try {
                              const r = await fetch(`/api/projects/${id}/stage?shot=${sb.shotNumber}`);
                              if (r.ok) scene = (await r.json())?.scene ?? null;
                            } catch { /* treat as unblocked if we cannot read; do not block opening the stage */ }
                            setStageShot({
                              shotNumber: sb.shotNumber,
                              title: sb.data?.description?.slice(0, 60),
                              scene,
                              characters: scriptShot?.characters,
                            });
                          }}
                          title={t.projectView.directorStageTitle}
                          className="mt-1 w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md border border-[var(--cinema-border)] hover:border-[var(--cinema-amber)] transition"
                        >
                          <UsersThree size={11} className={stagedShots[sb.shotNumber] ? 'text-[var(--cinema-amber)]' : 'text-[var(--cinema-text-3)]'} />
                          <span className="cinema-mono text-[9px] truncate opacity-75">
                            {stagedShots[sb.shotNumber] ? t.projectView.stagedOn : t.projectView.stagedOff}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* v7.3 continuity + seed-lock console */}
          {activeTab === 'continuity' && (
            <>
              <ContinuityConsole
                projectId={id}
                characters={characters}
                scenes={scenes}
                storyboards={storyboards}
                initialSettings={assets.find((a: any) => a.type === 'continuity')?.data}
              />
              {/* v10.6.1: asset-level continuity ledger — wardrobe/scene/props × citing shots; edit description lists impacted shots */}
              <AssetLedgerPanel projectId={id} />
            </>
          )}

          {/* Videos */}
          {activeTab === 'videos' && (
            <>
            {isVertical && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowSafeArea((v) => !v)}
                  aria-pressed={showSafeArea}
                  className={`cinema-btn-ghost !text-[11px] !py-1 ${showSafeArea ? '!text-[var(--cinema-amber)] !border-[var(--cinema-amber-deep)]' : ''}`}
                >
                  {t.projectView.subtitleSafeArea.replace('{state}', showSafeArea ? 'ON' : 'OFF')}
                </button>
              </div>
            )}
            {/* v12.150: batch re-render failed/downgraded shots (animatic or missing video; one-click after balance recovers) */}
            {(() => {
              // Local detect ∪ health report (persistent_url washed to ?key=hash breaks local regex; server health is authoritative)
              const healthAnimatic = new Set(healthReport?.animaticShots || []);
              const degraded = videos.filter((v: any) => v?.data?.isAnimatic === true || !v?.mediaUrls?.[0] || /animatic-\d+\.mp4/.test(String(v?.mediaUrls?.[0] || '')) || healthAnimatic.has(v?.shotNumber));
              if (degraded.length === 0 && !rerenderMsg) return null;
              return (
                <div className="mb-3 flex items-center gap-3 flex-wrap" data-testid="batch-rerender-bar">
                  {degraded.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void rerenderFailedShots()}
                      disabled={rerenderBusy}
                      className="cinema-btn-ghost !text-[11px] !py-1 !text-[var(--cinema-amber)] !border-[var(--cinema-amber-deep)] disabled:opacity-50"
                    >
                      {rerenderBusy ? t.projectView.rerenderBusy : t.projectView.rerenderBatchBtn.replace('{n}', String(degraded.length))}
                    </button>
                  )}
                  {rerenderMsg && <span className="cinema-mono text-[10px] opacity-70">{rerenderMsg}</span>}
                </div>
              );
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.length === 0 && <div className="col-span-full"><EmptyState icon={Video} title={t.product.emptyVideos} hint={t.projectView.emptyVideosHint} /></div>}
              {videos.map((v: any) => {
                const url = v.mediaUrls?.[0];
                const isVid = url && isVideoUrl(url);
                return (
                  <div key={v.id} className="cinema-card overflow-hidden">
                    {url && (
                      isVid ? (
                        <ClipWithAudio
                          videoUrl={url}
                          audioUrl={shotAudioByShot[v.shotNumber]}
                          className={`w-full ${frameClass}`}
                          overlay={isVertical && showSafeArea ? <SafeAreaOverlay /> : undefined}
                        />
                      ) : (
                        <div className="relative">
                          <img loading="lazy" decoding="async" src={url} alt={v.name} className={`w-full ${frameClass} object-cover`} />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                              <AlertTriangle className="w-7 h-7 text-[var(--cinema-amber)] mx-auto mb-2" />
                              <p className="cinema-mono text-[10px] opacity-80">{t.projectView.videoGenFailed}</p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="cinema-mono text-[10px] tracking-widest text-[var(--cinema-amber)]">SHOT {String(v.shotNumber).padStart(2, '0')}</span>
                      <TimecodeChip seconds={v.data?.duration || 5} />
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}

          {/* v2.16 P1.4: Shot Workshop — 4K re-render / multi-res export / jump to U2V */}
          {activeTab === 'workshop' && (
            <ShotWorkshopTab
              projectId={id}
              videos={videos.map((v: any) => ({
                shotNumber: v.shotNumber || v.shot_number,
                videoUrl: v.mediaUrls?.[0] || v.media_urls?.[0],
                imageUrl: v.mediaUrls?.[0],
                meta: v.data || v.meta,
              }))}
              storyboards={storyboards.map((s: any) => ({
                shotNumber: s.shotNumber || s.shot_number,
                imageUrl: s.imageUrl || s.mediaUrls?.[0],
              }))}
            />
          )}

          {/* v3.1 F: Cinema Timeline MVP */}
          {activeTab === 'timeline' && (
            <CinemaTimeline
              projectId={id}
              currentUser={user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl || null } : undefined}
            />
          )}

          {/* v2.21 P1.4: pacing — per-shot conflict + reversal marks + warnings/suggestions */}
          {activeTab === 'pullsheet' && <PullSheetTable projectId={id} />}

          {activeTab === 'pacing' && (
            <div className="flex flex-col gap-4">
              {/* v7.5 emotion curve + multi-track pacing heatmap */}
              <EmotionRhythmChart
                curve={computeEmotionCurve(
                  (script?.shots || []).map((sh: any, i: number) => {
                    const sb = storyboards.find((b: any) => (b.shotNumber ?? b.shot_number) === (sh.shotNumber ?? i + 1));
                    const cs = sb?.data?.cameraSpec;
                    return {
                      emotion: sh.emotion,
                      durationS: sh.duration ?? sb?.data?.duration ?? 5,
                      motion: cs?.motion,
                      conflict: script?.pacingReport?.shots?.[i]?.conflictScore,
                      lightingSetup: cs?.lighting?.setup,
                      atmosphere: cs?.atmosphere,
                    };
                  }),
                )}
              />
              <PacingChart
                report={script?.pacingReport || null}
                dialogueCoverage={script?.dialogueCoverageReport || null}
                styleAuditShots={storyboards.map((sb: any) => ({
                  shotNumber: sb.shotNumber || sb.shot_number,
                  styleAuditScore: sb.styleAuditScore ?? sb.data?.styleAuditScore,
                  styleAuditRetried: sb.styleAuditRetried ?? sb.data?.styleAuditRetried,
                  styleAuditReason: sb.styleAuditReason ?? sb.data?.styleAuditReason,
                }))}
              />
            </div>
          )}

          {/* v3.4.1: film QC — Vision checks whether the picture matches the script */}
          {activeTab === 'vision-audit' && (
            <VisionAuditTab projectId={id} onJumpToWorkshop={() => setActiveTab('workshop')} />
          )}

          {/* v9.4.6: one-click film self-heal loop (vs Kling; we add self-check + auto-reshoot) */}
          {activeTab === 'oneclick' && (
            <OneClickFilmPanel projectId={id} shotPrompts={shotPrompts} />
          )}

          {/* v8.0 technical monitor — video scopes + EDL/XML delivery */}
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <MonitorTab projectId={id} storyboards={storyboards} />
              {/* v9.6.5 T3 cost: project-level cost attribution */}
              <CostAttributionPanel projectId={id} />
              {/* v12.199: per-shot decision log (decision-log API had no UI entry) */}
              <DecisionLogPanel projectId={id} />
              {/* v9.6.8 T2 template market: save this project as a reusable template */}
              <SaveTemplateButton projectId={id} />
            </div>
          )}

          {/* v8.2 param linkage — JSON ↔ visual sync */}
          {activeTab === 'param-linkage' && (
            <ParamLinkagePanel
              projectId={id}
              shots={storyboards.map((sb: any) => ({ shotNumber: sb.shotNumber, cameraSpec: sb.data?.cameraSpec }))}
              continuity={assets.find((a: any) => a.type === 'continuity')?.data}
              format={assets.find((a: any) => a.type === 'project-format')?.data}
              onSynced={(doc) => setSpecOverrides((m) => {
                const next = { ...m };
                for (const s of doc.shots) next[s.shotNumber] = s.spec;
                return next;
              })}
            />
          )}

          {/* v3.0 P0.1: comment collab — project discussion + a thread per shot */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <CommentThread
                projectId={id}
                targetType="project"
                targetId={buildTargetId('project', id)}
                contextLabel="PROJECT"
                currentUserId={(project?.userId || project?.user_id) || null}
              />
              {/* Per-shot comment threads — collapsible list */}
              {script?.shots && script.shots.length > 0 && (
                <div className="space-y-2">
                  <div className="cinema-eyebrow opacity-60">PER-SHOT COMMENTS</div>
                  <div className="grid grid-cols-1 gap-3">
                    {script.shots.map((sh: any) => (
                      <details
                        key={sh.shotNumber}
                        className="cinema-card-hi p-3 group"
                      >
                        <summary className="cursor-pointer flex items-center justify-between gap-2 select-none">
                          <span className="cinema-mono text-[11px]">
                            <span className="opacity-50">SHOT</span> #{sh.shotNumber}
                            <span className="opacity-50 ml-2">· {sh.sceneDescription?.slice(0, 40) || t.projectView.noSceneDesc}</span>
                          </span>
                          <span className="cinema-mono text-[10px] opacity-50 group-open:hidden">{t.projectView.expandComments}</span>
                        </summary>
                        <div className="mt-3">
                          <CommentThread
                            projectId={id}
                            targetType="shot"
                            targetId={buildTargetId('shot', id, sh.shotNumber)}
                            contextLabel={`SHOT #${sh.shotNumber}`}
                            currentUserId={(project?.userId || project?.user_id) || null}
                            pollIntervalMs={0}
                          />
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* v9.1.2 multi-platform distribute + v9.1.3 AI portrait cover candidates (pre-publish: copy + cover) */}
          {activeTab === 'distribution' && (
            <div className="flex flex-col gap-4">
              <MusicGenPanel projectId={id} />
              <LocalizePanel projectId={id} />
              <DistributionPanel projectId={id} />
              <CoverCandidatesPanel projectId={id} title={displayName(project, locale, project.title)} />
            </div>
          )}

          {/* Full playback */}
          {activeTab === 'play' && (
            <div>
              {/* v12.190: cost drill-down (fetch on open; per-engine + total) */}
              <div className="mb-3" data-testid="cost-panel">
                <button type="button" onClick={() => { const o = !costOpen; setCostOpen(o); if (o && !costReport) void loadCost(); }} className="cinema-btn-ghost !text-[11px] !py-1">
                  {t.projectView.costDetails}{costReport ? `(¥${costReport.totalCny})` : ''}{costOpen ? ' ▲' : ' ▼'}
                </button>
                {costOpen && costReport && (
                  <div className="mt-2 cinema-card p-3 space-y-1">
                    {costReport.byEngine.map((e) => (
                      <div key={e.engine} className="flex justify-between text-[11px]"><span className="opacity-70">{e.engine}</span><span className="cinema-mono">¥{e.costCny}({t.projectView.costTimes.replace('{n}', String(e.count))})</span></div>
                    ))}
                    <div className="flex justify-between text-[11px] border-t border-white/10 pt-1 font-medium"><span>{t.projectView.costTotal.replace('{n}', String(costReport.entries))}</span><span className="cinema-mono">¥{costReport.totalCny}</span></div>
                  </div>
                )}
                {costOpen && !costReport && <div className="mt-2 cinema-mono text-[10px] opacity-60">{t.projectView.querying}</div>}
              </div>
              {/* v12.153: full-film health (ffprobe on open, red/yellow/green per dimension) */}
              <div className="mb-3" data-testid="film-health-panel">
                <button
                  type="button"
                  onClick={() => { const opening = !healthOpen; setHealthOpen(opening); if (opening && !healthReport) void loadHealth(); }}
                  className="cinema-btn-ghost !text-[11px] !py-1"
                >
                  {t.projectView.filmHealth} {healthReport ? ({ ok: '🟢', warn: '🟡', fail: '🔴', unknown: '⚪' } as any)[healthReport.overall] || '' : ''}{healthOpen ? ' ▲' : ' ▼'}
                </button>
                {healthOpen && (
                  <div className="mt-2 cinema-card p-3 space-y-1.5">
                    {!healthReport && <div className="cinema-mono text-[10px] opacity-60">{t.projectView.probing}</div>}
                    {healthReport?.items.map((it) => (
                      <div key={it.key} className="flex items-start gap-2 text-[11px]">
                        <span className="shrink-0">{({ ok: '🟢', warn: '🟡', fail: '🔴', unknown: '⚪' } as any)[it.status] || '⚪'}</span>
                        <span className="shrink-0 font-medium w-16">{it.label}</span>
                        <span className="opacity-70 min-w-0">{it.detail}</span>
                      </div>
                    ))}
                    {healthReport && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button type="button" onClick={() => void loadHealth()} className="cinema-mono text-[10px] opacity-50 hover:opacity-90">{t.projectView.recheckHealth}</button>
                        {healthReport.overall !== 'ok' && (
                          <HealShotsButton projectId={id} onHealed={() => void loadHealth()} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {audioCheck && (
                <div className="mb-3 flex items-center gap-2 text-[12px]" data-testid="final-audio-badge">
                  <span className={`cinema-chip ${audioCheck.audible ? 'cinema-chip-green' : 'cinema-chip-amber'}`}>
                    <SpeakerHigh className="w-3 h-3" weight="fill" /> {audioCheck.label}
                  </span>
                  {audioCheck.healed && <span className="cinema-mono text-[10px] opacity-40">{t.projectView.audioHealed}</span>}
                  {!audioCheck.audible && <span className="cinema-mono text-[10px] opacity-45">{t.projectView.audioMissingHint}</span>}
                </div>
              )}
              <div className="cinema-card overflow-hidden mb-4">
                {videos.length > 0 ? (
                  <div ref={playerWrapRef} className={`relative ${isPlayerFs ? 'w-screen h-screen bg-black grid place-items-center' : ''}`}>
                    {videos[Math.max(0, playingIndex)]?.mediaUrls?.[0] ? (
                      (() => {
                        const url = videos[Math.max(0, playingIndex)].mediaUrls[0];
                        const mp = mediaPresentation(isPlayerFs);
                        return isVideoUrl(url) ? (
                          <video
                            key={playingIndex}
                            src={url}
                            autoPlay
                            playsInline
                            controls
                            onLoadedMetadata={(e) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) setPlayerRatio(v.videoWidth / v.videoHeight); }}
                            onDoubleClick={(e) => { e.preventDefault(); togglePlayerFullscreen(); }}
                            className={mp.className}
                            style={mp.style}
                            onEnded={() => {
                              if (playingIndex < videos.length - 1) setPlayingIndex(playingIndex + 1);
                            }}
                          />
                        ) : (
                          <div className={isPlayerFs ? 'relative grid place-items-center' : 'relative'}>
                            <img loading="lazy" decoding="async" src={url} alt="playing"
                              onLoad={(e) => { const im = e.currentTarget; if (im.naturalWidth && im.naturalHeight) setPlayerRatio(im.naturalWidth / im.naturalHeight); }}
                              className={mp.className} style={mp.style} />
                            <div className="absolute top-3 right-3 cinema-chip cinema-chip-amber !text-[10px]">
                              {t.projectView.boardFallback}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className={`w-full ${mainFrameClass} bg-black grid place-items-center cinema-mono text-[11px] opacity-40`}>{t.projectView.noVideo}</div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/70 text-xs text-white">
                      {t.projectView.shotOf.replace('{n}', String(playingIndex >= 0 ? videos[playingIndex]?.shotNumber : '-')).replace('{total}', String(videos.length))}
                    </div>
                    {/* Click for fullscreen (outer wrap so playlist does not drop FS); double-click the picture also works */}
                    <button
                      type="button"
                      onClick={togglePlayerFullscreen}
                      title={isPlayerFs ? t.projectView.exitFullscreen : t.projectView.watchFullscreen}
                      aria-label={isPlayerFs ? t.projectView.exitFullscreen : t.projectView.watchFullscreen}
                      className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/15 text-white/90 text-xs transition-colors">
                      {isPlayerFs ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      <span>{isPlayerFs ? t.projectView.exitFullscreen : t.projectView.fullscreen}</span>
                    </button>
                  </div>
                ) : (
                  <div className={`w-full ${mainFrameClass} grid place-items-center cinema-mono text-[11px] opacity-40`}>{t.projectView.noVideosYet}</div>
                )}
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setPlayingIndex(0)} className="cinema-btn-primary !text-sm">
                  <Play className="w-4 h-4" />{t.projectView.playFromStart}
                </button>
                <div className="flex gap-1 overflow-x-auto">
                  {videos.map((v: any, i: number) => (
                    <button key={i} onClick={() => setPlayingIndex(i)}
                      className={`cinema-mono px-2.5 py-1.5 rounded-[3px] text-xs transition-colors ${playingIndex === i ? 'bg-[var(--cinema-amber)] text-black font-semibold' : 'text-[var(--cinema-text-2)] hover:bg-[var(--cinema-surface-2)]'}`}>
                      #{String(v.shotNumber).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Director review */}
              {review && (
                <div className="cinema-card-hi p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-5 h-5 text-[var(--cinema-amber)]" weight="fill" />
                    <span className="cinema-headline text-lg text-[var(--cinema-amber)]">{review.overallScore}<span className="cinema-mono text-sm opacity-50"> /100</span></span>
                    <span className={`cinema-chip ${review.passed ? 'cinema-chip-green' : 'cinema-chip-amber'}`}>
                      {review.passed ? <CheckCircle2 className="w-3 h-3" weight="fill" /> : <AlertTriangle className="w-3 h-3" />}
                      {review.passed ? t.projectView.reviewPassed : t.projectView.needsWork}
                    </span>
                  </div>
                  <p className="cinema-subhead text-sm opacity-90 mb-4">{review.summary}</p>

                  {review.dimensions && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {Object.entries(review.dimensions).map(([key, dim]: [string, any]) => (
                        <div key={key} className="rounded-[3px] p-2.5 bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="cinema-mono text-[10px] opacity-60">{
                              { narrative: t.projectView.dimNarrative, visualConsistency: t.projectView.dimVisualConsistency, pacing: t.projectView.dimPacing, characterPerformance: t.projectView.dimPerformance, visualQuality: t.projectView.dimVisualQuality, audio: t.projectView.dimAudio }[key] || key
                            }</span>
                            <span className="cinema-mono text-xs text-[var(--cinema-amber)] tabular-nums">{dim.score}</span>
                          </div>
                          <p className="cinema-mono text-[10px] opacity-50 leading-relaxed">{dim.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.items?.length > 0 && (
                    <div className="space-y-1.5">
                      {review.items.map((item: any, i: number) => (
                        <div key={i} className={`flex items-start gap-2 rounded-[3px] p-2 text-[11px] border ${
                          item.severity === 'critical' ? 'bg-[var(--cinema-red)]/12 text-[var(--cinema-red)] border-[var(--cinema-red)]/30' :
                          item.severity === 'major' ? 'bg-[var(--cinema-amber)]/10 text-[var(--cinema-amber)] border-[var(--cinema-amber-deep)]' :
                          'bg-[var(--cinema-amber)]/[0.05] text-[var(--cinema-text-2)] border-[var(--cinema-border)]'
                        }`}>
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          <div>
                            {item.shotNumber && <span className="opacity-70 cinema-mono">SHOT {String(item.shotNumber).padStart(2, '0')}: </span>}
                            {item.issue}
                            <span className="opacity-60 ml-1">→ {item.suggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* AI assistant launcher + sidebar (alt+/ also opens it) */}
      <ChatLauncherButton open={chatOpen} onClick={() => setChatOpen(true)} />
      <ProjectChatSidebar projectId={id} open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* v7.2 single-shot cine desk modal */}
      {cinemaShot && (
        <ShotCinematographyModal
          projectId={id}
          shotNumber={cinemaShot.shotNumber}
          shotTitle={cinemaShot.title}
          initialSpec={cinemaShot.spec}
          emotion={cinemaShot.emotion}
          onClose={() => setCinemaShot(null)}
          onSaved={(spec) => setSpecOverrides((m) => ({ ...m, [cinemaShot.shotNumber]: spec }))}
        />
      )}

      {/* v12.318 director stage modal */}
      {stageShot && (
        <DirectorStageModal
          projectId={id}
          shotNumber={stageShot.shotNumber}
          shotTitle={stageShot.title}
          initialScene={stageShot.scene}
          characterNames={stageShot.characters}
          onClose={() => setStageShot(null)}
          onSaved={() => setStagedShots((m) => ({ ...m, [stageShot.shotNumber]: true }))}
        />
      )}

      {/* v12.330 frame-inspect modal — selected frame range is handed to segment retake */}
      {frameShot && (
        <FrameInspectModal
          projectId={id}
          shotNumber={frameShot.shotNumber}
          shotTitle={frameShot.title}
          onClose={() => setFrameShot(null)}
          onRetake={async ({ fromS, toS }) => {
            // Range is computed on the server (same frame-snap as planSegmentRetake); the client only forwards it.
            // dryRun first: if the plan fails, show the human-readable reason instead of spending engine quota.
            try {
              const r = await fetch(`/api/projects/${id}/segment-retake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shotNumber: frameShot.shotNumber, fromS, toS, dryRun: true }),
              });
              const j = await r.json();
              if (!r.ok || j?.plan?.ok === false) {
                showToast({ title: t.projectView.cannotRetakeSegment, description: String(j?.error || j?.plan?.reason || '').slice(0, 140), type: 'error', duration: 5000 });
                return;
              }
              showToast({
                title: t.projectView.canRetake,
                description: t.projectView.retakePlanDesc.replace('{gen}', Number(j.plan?.generateDurationS ?? 0).toFixed(3)).replace('{patch}', (toS - fromS).toFixed(3)),
                type: 'success', duration: 5000,
              });
            } catch (e) {
              showToast({ title: t.projectView.dryRunFailed, description: (e instanceof Error ? e.message : t.projectView.checkNetwork).slice(0, 120), type: 'error', duration: 4000 });
            }
          }}
        />
      )}

      {/* v12.44 unified shot inspector — click a board to open preview / metadata / actions */}
      {inspectShot && (
        <ShotInspector
          shot={inspectShot}
          frameClass={frameClass}
          onClose={() => setInspectShot(null)}
          onFrameInspect={() => {
            setFrameShot({ shotNumber: inspectShot.shotNumber, title: (inspectShot as any)?.title });
            setInspectShot(null);
          }}
          onCinema={() => {
            const sn = inspectShot.shotNumber;
            const sbx = (storyboards as any[]).find((s) => s.shotNumber === sn);
            const spec = specOverrides[sn] || (sbx?.data?.cameraSpec ? normalizeShotSpec(sbx.data.cameraSpec) : seedSpecFromCameraAngle(sbx?.data?.cameraAngle));
            setCinemaShot({ shotNumber: sn, title: inspectShot.description?.slice(0, 60), spec, emotion: inspectShot.emotion });
            setInspectShot(null);
          }}
          onWorkshop={() => { setActiveTab('workshop'); setInspectShot(null); }}
        />
      )}
    </div>
  );
}
