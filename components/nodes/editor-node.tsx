'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PipelineNodeData, AgentRole } from '@/types/agents';
import { NodeShell } from './node-shell';
import { Scissors, CircleNotch as Loader2, CheckCircle as CheckCircle2, Clock, Play, FilmStrip as Film, FloppyDisk as Save, ArrowsClockwise as RefreshCw, MusicNotes as Music, SpeakerHigh as Volume2, ArrowUp, ArrowDown, Trash as Trash2, ArrowUUpLeft as Undo2, WarningCircle as AlertCircle } from '@phosphor-icons/react';
import { VideoModal } from '@/components/ui/video-modal';
import { useProjectWorkspaceStore } from '@/lib/store';
import { useLocale } from '@/hooks/use-locale';

function EditorNodeComponent({ data }: NodeProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const d = data as unknown as PipelineNodeData & {
    editResult?: {
      timeline: any[];
      totalDuration: number;
      videoCount: number;
      finalVideoUrl?: string;
      musicUrl?: string;
    };
  };

  const editResult = d.editResult;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVideoSrc, setSelectedVideoSrc] = useState('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');
  const [saved, setSaved] = useState(false);
  /** v12.299: re-edit failure reason — previously failure rendered as success */
  const [regenError, setRegenError] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  // === Local editable timeline ===
  // Only set when the user edits; otherwise use editResult.timeline
  const [draftTimeline, setDraftTimeline] = useState<any[] | null>(null);
  const activeTimeline = draftTimeline || editResult?.timeline || [];
  const isDirty = !!draftTimeline;

  // Reset draft when editResult updates (e.g. after re-edit)
  useEffect(() => {
    setDraftTimeline(null);
  }, [editResult?.timeline]);

  const moveShot = (from: number, to: number) => {
    if (!editResult?.timeline) return;
    if (to < 0 || to >= activeTimeline.length) return;
    const next = [...activeTimeline];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraftTimeline(next);
  };
  const removeShot = (idx: number) => {
    if (!editResult?.timeline) return;
    const next = activeTimeline.filter((_, i) => i !== idx);
    setDraftTimeline(next);
  };
  const resetTimeline = () => setDraftTimeline(null);

  const confirmNodeAssets = useProjectWorkspaceStore(s => s.confirmNodeAssets);

  const handlePlayAll = () => {
    // Prefer the FFmpeg-muxed final film
    if (editResult?.finalVideoUrl) {
      setSelectedVideoSrc(editResult.finalVideoUrl);
      setSelectedVideoTitle(t.projectMisc.filmPreviewMuxed);
      setModalOpen(true);
      return;
    }
    // Fallback: first valid timeline video
    if (editResult?.timeline) {
      const firstValid = editResult.timeline.find((tl: any) => tl.videoUrl && !tl.videoUrl.startsWith('data:'));
      if (firstValid) {
        setSelectedVideoSrc(firstValid.videoUrl);
        setSelectedVideoTitle(t.projectMisc.filmPreview);
        setModalOpen(true);
      }
    }
  };

  const handleShotClick = (videoUrl: string, shotNumber: number) => {
    if (videoUrl && !videoUrl.startsWith('data:')) {
      setSelectedVideoSrc(videoUrl);
      setSelectedVideoTitle(t.product.shotN.replace('{n}', String(shotNumber)));
      setModalOpen(true);
    }
  };

  const handleSaveToProject = async () => {
    // Confirm all edit-related assets and save to the project
    confirmNodeAssets('editor' as any);
    setSaved(true);

    // If the user edited the timeline, write the updated editResult back to the store
    if (draftTimeline && editResult) {
      const newTotal = draftTimeline.reduce((s, x: any) => s + (x.duration || 0), 0);
      const s = useProjectWorkspaceStore.getState();
      s.updateNodeData('node-editor', {
        editResult: { ...editResult, timeline: draftTimeline, videoCount: draftTimeline.length, totalDuration: newTotal },
      } as any);
      setDraftTimeline(null);
    }

    // Persist via backend
    try {
      const s = useProjectWorkspaceStore.getState();
      const projectId = s.currentProject?.id;
      if (projectId && editResult) {
        await fetch('/api/assets/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            agentRole: 'editor',
            assets: s.assets.filter(a => ['timeline', 'final_video', 'music', 'video'].includes(a.type)),
            timeline: draftTimeline || editResult.timeline,
          }),
        }).catch(() => {});
      }
    } catch {}
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenError(null);   // v12.299: clear last failure before retry
    const s = useProjectWorkspaceStore.getState();
    const projectId = s.currentProject?.id;
    if (!projectId || isRegenerating) return;

    setIsRegenerating(true);
    setSaved(false);

    // Mark node running
    s.updateNodeData('node-editor', { status: 'running', progress: 10 } as any);

    try {
      const response = await fetch('/api/regenerate-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, stage: 'editor' }),
      });

      if (!response.ok) throw new Error(t.seriesDetail.requestFailed);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error(t.workshop.streamReadFailed);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'editResult') {
              s.updateNodeData('node-editor', { status: 'completed', progress: 100, editResult: event.data } as any);
            }
            if (event.type === 'heartbeat') {
              const cur = (s.nodes.find(n => n.id === 'node-editor')?.data as any)?.progress || 10;
              if (cur < 90) s.updateNodeData('node-editor', { progress: cur + 5 } as any);
            }
          } catch { /* skip */ }
        }
      }
    } catch (error) {
      // v12.299: failure must not look like success. Old code wrote status:'completed',
      // progress:100 — so a network/5xx error still showed a blue check and 100%,
      // identical to a real success, while editResult stayed stale.
      console.error('[EditorNode] Regenerate failed:', error);
      const _msg = error instanceof Error ? error.message : String(error ?? t.projectMisc.unknownShort);
      setRegenError(_msg.slice(0, 120));
      s.updateNodeData('node-editor', { status: 'error', progress: 0 } as any);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePlayMusic = () => {
    if (editResult?.musicUrl) {
      const audio = new Audio(editResult.musicUrl);
      if (musicPlaying) {
        audio.pause();
        setMusicPlaying(false);
      } else {
        audio.play().catch(() => {});
        setMusicPlaying(true);
        audio.onended = () => setMusicPlaying(false);
      }
    }
  };

  return (
    <NodeShell status={d.status} color="blue" className="min-w-[300px] max-w-[400px]" agentRole={d.agentRole}>
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-blue-500 !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 grid place-items-center">
          <Scissors className="w-4 h-4 text-blue-400/80" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            {t.product.editor}
            {d.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin" />}
            {d.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
            {d.status === 'pending' && <Clock className="w-3.5 h-3.5 text-gray-500" />}
            {d.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400" weight="fill" />}
          </div>
          <div className="text-[11px] text-gray-400">{t.projectMisc.editorSub}</div>
        </div>
        {d.status === 'running' && <span className="text-[10px] text-green-400 font-medium">{d.progress}%</span>}
      </div>

      {editResult ? (
        <div>
          {/* Film play bar */}
          <div
            className="flex items-center gap-3 mb-3 bg-black/20 rounded-lg p-3 cursor-pointer hover:bg-black/30 transition-colors group"
            onClick={handlePlayAll}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 grid place-items-center group-hover:bg-blue-500/30 transition-colors">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-white font-medium">{t.projectMisc.shotCountN.replace('{n}', String(editResult.videoCount))}</div>
              <div className="text-[10px] text-gray-400">{t.projectMisc.totalDuration.replace('{n}', String(editResult.totalDuration))}</div>
            </div>
            <div className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {t.projectMisc.playFilm}
            </div>
          </div>

          {/* Score status */}
          {editResult.musicUrl && (
            <div
              className="flex items-center gap-2 mb-3 bg-black/20 rounded-lg px-3 py-2 cursor-pointer hover:bg-black/30 transition-colors"
              onClick={handlePlayMusic}
            >
              {musicPlaying ? (
                <Volume2 className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              ) : (
                <Music className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span className="text-[11px] text-gray-300">{t.projectMisc.bgm}</span>
              <span className="text-[9px] text-gray-500 ml-auto">{musicPlaying ? t.projectMisc.playing : t.projectMisc.clickPreview}</span>
            </div>
          )}

          {/* Shot timeline — editable (up/down/delete) */}
          {activeTimeline.length > 0 && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {activeTimeline.map((tl: any, i: number) => {
                const activeTotal = activeTimeline.reduce((s: number, x: any) => s + (x.duration || 0), 0) || 1;
                return (
                  <div
                    key={`${tl.shotNumber}-${i}`}
                    className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-1.5 text-[11px] group/shot hover:bg-black/30 transition-colors"
                  >
                    <span
                      className="text-blue-400 font-medium w-6 cursor-pointer"
                      onClick={() => handleShotClick(tl.videoUrl, tl.shotNumber)}
                    >
                      #{tl.shotNumber}
                    </span>
                    <div
                      className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                      onClick={() => handleShotClick(tl.videoUrl, tl.shotNumber)}
                    >
                      <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${(tl.duration / activeTotal) * 100}%` }} />
                    </div>
                    <span className="text-gray-400 w-7 text-right text-[10px]">{tl.duration}s</span>
                    {/* Edit buttons: hover only */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/shot:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveShot(i, i - 1); }}
                        disabled={i === 0}
                        className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                        title={t.projectMisc.moveUp}
                      >
                        <ArrowUp className="w-2.5 h-2.5 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveShot(i, i + 1); }}
                        disabled={i === activeTimeline.length - 1}
                        className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                        title={t.projectMisc.moveDown}
                      >
                        <ArrowDown className="w-2.5 h-2.5 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeShot(i); }}
                        className="p-0.5 rounded hover:bg-red-500/20"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Timeline dirty hint */}
          {isDirty && (
            <div className="flex items-center justify-between mt-2 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-[10px]">
              <span className="text-orange-300">{t.projectMisc.timelineDirty.replace('{n}', String(activeTimeline.length))}</span>
              <button
                onClick={resetTimeline}
                className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Undo2 className="w-3 h-3" /> {t.projectMisc.undo}
              </button>
            </div>
          )}

          {/* === Save / regenerate bar === */}
          {d.status === 'completed' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
              <button
                onClick={handleSaveToProject}
                disabled={saved}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  saved
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                    : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                }`}
              >
                {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? t.projectMisc.savedShort : t.projectMisc.saveToProject}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isRegenerating
                    ? 'bg-orange-500/25 text-orange-300 cursor-wait'
                    : 'bg-orange-500/15 text-orange-300 hover:bg-orange-500/25'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? t.projectMisc.redoing : t.projectMisc.reEdit}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-xs">
          {d.status === 'error'
            ? <span className="text-red-400">{regenError ? t.projectMisc.reEditFailedWith.replace('{error}', regenError) : t.projectMisc.reEditFailed}</span>
            : <span className="text-gray-500">{d.status === 'pending' ? t.projectMisc.waitVideos : d.status === 'running' ? t.projectMisc.editing : ''}</span>}
        </div>
      )}

      {d.status === 'running' && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${d.progress}%` }} />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-blue-500 !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform" />

      <VideoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        src={selectedVideoSrc}
        title={selectedVideoTitle}
      />
    </NodeShell>
  );
}

export const EditorNode = memo(EditorNodeComponent);
