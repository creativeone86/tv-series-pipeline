'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PipelineNodeData, ReviewItem, AgentRole } from '@/types/agents';
import { NodeShell } from './node-shell';
import { CircleNotch as Loader2, CheckCircle as CheckCircle2, Warning as AlertTriangle, ArrowRight, Clock, FilmSlate as Clapperboard, Megaphone, ArrowsClockwise as RefreshCw, ArrowCounterClockwise as RotateCcw, Sparkle as Sparkles, Gauge } from '@phosphor-icons/react';
import { useProjectWorkspaceStore } from '@/lib/store';
import { useLocale } from '@/hooks/use-locale';

// Stage config: node id + color (labels looked up via t)
const STAGE_META: Record<string, { nodeId: string; color: string }> = {
  writer: { nodeId: 'node-writer', color: 'text-purple-400' },
  character_designer: { nodeId: 'node-character', color: 'text-amber-400' },
  scene_designer: { nodeId: 'node-scene', color: 'text-emerald-400' },
  storyboard: { nodeId: 'node-storyboard', color: 'text-cyan-400' },
  video_producer: { nodeId: 'node-video', color: 'text-pink-400' },
  editor: { nodeId: 'node-editor', color: 'text-blue-400' },
};

const DIRECTOR_LABEL = '\u5bfc\u6f14';

function ReviewNodeComponent({ data }: NodeProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const d = data as unknown as PipelineNodeData & {
    review?: {
      overallScore: number;
      summary: string;
      items: ReviewItem[];
      dimensions?: Record<string, { score: number; comment: string }>;
      status: string;
      passed?: boolean;
    };
    isDirector?: boolean;
    onAcceptReview?: () => void;
    onComplete?: () => void;
  };

  const stageLabel = (key: string) => {
    switch (key) {
      case 'writer': return t.product.writer;
      case 'character_designer': return t.product.characterDesign;
      case 'scene_designer': return t.product.sceneDesign;
      case 'storyboard': return t.product.storyboard;
      case 'video_producer': return t.product.videoGen;
      case 'editor': return t.projectMisc.editStage;
      default: return key;
    }
  };
  const dimLabel = (key: string) => ({
    narrative: t.projectMisc.dimNarrative,
    visualConsistency: t.projectMisc.dimVisualConsistency,
    pacing: t.projectMisc.dimPacing,
    characterPerformance: t.projectMisc.dimPerformance,
    visualQuality: t.projectMisc.dimVisualQuality,
    audio: t.projectMisc.dimAudio,
  }[key] || key);

  const review = d.review;
  const isDirector = d.isDirector || d.label === DIRECTOR_LABEL;
  const nodeLabel = isDirector ? t.product.director : t.product.producer;
  const nodeSubLabel = isDirector ? t.projectMisc.directorMonitorSub : t.projectMisc.producerReviewSub;
  const IconComponent = isDirector ? Megaphone : Clapperboard;
  const colorName = isDirector ? 'pink' : 'orange';
  const iconColor = isDirector ? 'text-[#E8C547]' : 'text-orange-400';
  const iconBg = isDirector ? 'bg-[#E8C547]/20' : 'bg-orange-500/20';
  const handleColor = isDirector ? '!bg-[#E8C547]' : '!bg-orange-500';
  const pipelineChips = [t.product.writer, t.product.tabCharacters, t.product.tabScenes, t.product.tabStoryboard, t.product.tabVideos, t.projectMisc.editStage];

  // === Producer partial-redo state ===
  const [selectedRedoStages, setSelectedRedoStages] = useState<Set<string>>(new Set());
  const [isRedoing, setIsRedoing] = useState(false);
  const [showRedoPanel, setShowRedoPanel] = useState(false);

  // Stages called out in the review
  const getProblematicStages = useCallback(() => {
    if (!review?.items?.length) return [];
    const stages = new Set<string>();
    // Failed videos
    const s = useProjectWorkspaceStore.getState();
    const videos = s.assets.filter(a => a.type === 'video');
    const failedVideos = videos.filter(v => !v.mediaUrls?.[0] || v.mediaUrls[0].startsWith('data:'));
    if (failedVideos.length > 0) stages.add('video_producer');

    // From review items
    for (const item of review.items) {
      if (item.targetRole) stages.add(item.targetRole);
    }

    return Array.from(stages);
  }, [review]);

  const toggleRedoStage = (stage: string) => {
    setSelectedRedoStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  // === Run partial redo ===
  const handlePartialRedo = useCallback(async () => {
    if (selectedRedoStages.size === 0 || isRedoing) return;

    const s = useProjectWorkspaceStore.getState();
    const projectId = s.currentProject?.id;
    if (!projectId) return;

    setIsRedoing(true);

    // Mark selected stage + later stages as needing redo
    const stageOrder = ['writer', 'character_designer', 'scene_designer', 'storyboard', 'video_producer', 'editor'];
    const earliestIdx = Math.min(...Array.from(selectedRedoStages).map(st => stageOrder.indexOf(st)).filter(i => i >= 0));
    const stagesToRedo = stageOrder.slice(earliestIdx);

    // Update node status
    for (const stage of stagesToRedo) {
      const cfg = STAGE_META[stage];
      if (cfg) {
        s.updateNodeData(cfg.nodeId, { status: 'pending', progress: 0 } as any);
      }
    }
    s.updateNodeData('node-producer', { status: 'running', progress: 10 } as any);

    // Redo stage by stage (from earliest selected)
    for (const stage of stagesToRedo) {
      const cfg = STAGE_META[stage];
      if (!cfg) continue;

      s.updateNodeData(cfg.nodeId, { status: 'running', progress: 10 } as any);

      try {
        const response = await fetch('/api/regenerate-shot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, stage }),
        });

        if (!response.ok) {
          s.updateNodeData(cfg.nodeId, { status: 'error', progress: 0 } as any);
          continue;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) continue;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'redoStageComplete') {
                s.updateNodeData(cfg.nodeId, { status: 'completed', progress: 100 } as any);
                // Update assets
                if (event.data.stage === 'video' && event.data.data) {
                  const st = useProjectWorkspaceStore.getState();
                  event.data.data.forEach((v: any) => {
                    const va = st.assets.find(a => a.type === 'video' && a.shotNumber === v.shotNumber);
                    if (va) st.updateAsset(va.id, { mediaUrls: v.videoUrl ? [v.videoUrl] : [], data: { duration: v.duration || 8, status: 'completed' } });
                  });
                  st.updateNodeData('node-video', { assets: useProjectWorkspaceStore.getState().assets.filter(a => a.type === 'video') } as any);
                }
                if (event.data.stage === 'editor' && event.data.data) {
                  s.updateNodeData('node-editor', { status: 'completed', progress: 100, editResult: event.data.data } as any);
                }
              }
              if (event.type === 'videos') {
                const st = useProjectWorkspaceStore.getState();
                (event.data || []).forEach((v: any) => {
                  const va = st.assets.find(a => a.type === 'video' && a.shotNumber === v.shotNumber);
                  if (va) st.updateAsset(va.id, { mediaUrls: v.videoUrl ? [v.videoUrl] : [], data: { duration: v.duration || 8, status: 'completed' } });
                });
              }
              if (event.type === 'editResult') {
                s.updateNodeData('node-editor', { status: 'completed', progress: 100, editResult: event.data } as any);
              }
            } catch { /* skip */ }
          }
        }

        s.updateNodeData(cfg.nodeId, { status: 'completed', progress: 100 } as any);
      } catch (e) {
        console.error(`[Producer] Redo stage ${stage} failed:`, e);
        s.updateNodeData(cfg.nodeId, { status: 'error', progress: 0 } as any);
      }
    }

    s.updateNodeData('node-producer', { status: 'completed', progress: 100 } as any);
    setIsRedoing(false);
    setShowRedoPanel(false);
    setSelectedRedoStages(new Set());
  }, [selectedRedoStages, isRedoing]);

  return (
    <NodeShell status={d.status} color={colorName} className="min-w-[340px] max-w-[440px]" agentRole={d.agentRole}>
      {isDirector ? (
        <Handle type="source" position={Position.Bottom} className={`!w-4 !h-4 ${handleColor} !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform`} />
      ) : (
        <Handle type="target" position={Position.Left} className={`!w-4 !h-4 ${handleColor} !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform`} />
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg ${iconBg} grid place-items-center`}>
          <IconComponent className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            {nodeLabel}
            {d.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin" />}
            {d.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
            {d.status === 'reviewing' && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
            {d.status === 'pending' && <Clock className="w-3.5 h-3.5 text-gray-500" />}
          </div>
          <div className="text-[11px] text-gray-400">{nodeSubLabel}</div>
        </div>
      </div>

      {/* === Director compact view === */}
      {isDirector && !review && (
        <div className="text-center py-4">
          {d.status === 'running' ? (
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E8C547] animate-pulse" />
              <div className="text-xs text-[#E8C547]">{t.projectMisc.directorGuiding}</div>
            </div>
          ) : d.status === 'completed' ? (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <div className="text-xs text-blue-400">{t.projectMisc.monitorDone}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1 flex-wrap justify-center">
                {pipelineChips.map(s => (
                  <span key={s} className="text-[8px] px-1.5 py-0.5 rounded-md bg-[#E8C547]/8 text-[#E8C547]/50 border border-[#E8C547]/10">{s}</span>
                ))}
              </div>
              <div className="text-[10px] text-gray-500">{t.projectMisc.monitorAll}</div>
            </div>
          )}
        </div>
      )}

      {/* === Producer review (enhanced + partial redo) === */}
      {!isDirector && review ? (
        <div>
          {/* Score */}
          <div className="flex items-center gap-3 mb-3 bg-black/20 rounded-xl p-3">
            <div className="relative">
              <Gauge className="w-8 h-8 text-orange-400/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-orange-400">{review.overallScore}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-400">{t.projectMisc.overallScoreLabel}</div>
              <div className={`text-[10px] font-medium mt-0.5 ${
                review.overallScore >= 80 ? 'text-emerald-400' :
                review.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {review.overallScore >= 80 ? t.projectMisc.qualityExcellent : review.overallScore >= 60 ? t.projectMisc.qualityNeedsWork : t.projectMisc.qualityRework}
              </div>
            </div>
            {review.passed && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>

          {/* Dimension scores (if any) */}
          {review.dimensions && (
            <div className="grid grid-cols-3 gap-1 mb-3">
              {Object.entries(review.dimensions).slice(0, 6).map(([key, dim]: [string, any]) => (
                <div key={key} className="bg-black/20 rounded-lg p-1.5 text-center">
                  <div className={`text-sm font-bold ${dim.score >= 15 ? 'text-emerald-400' : dim.score >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>{dim.score}</div>
                  <div className="text-[8px] text-gray-500 truncate">{dimLabel(key)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Review summary */}
          <div className="text-xs text-gray-300 leading-relaxed mb-3 bg-black/20 rounded-xl p-2.5">
            {review.summary}
          </div>

          {/* Issues */}
          {review.items?.length > 0 && (
            <div className="space-y-1.5 mb-3 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
              {review.items.map((item, i) => (
                <div key={i} className={`rounded-xl p-2 text-[11px] border ${
                  item.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                  item.severity === 'major' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' :
                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                }`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.shotNumber && <span className="text-[9px] opacity-70">{t.product.shotN.replace('{n}', String(item.shotNumber))}</span>}
                    <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                    <span className="text-[9px] opacity-70">{stageLabel(item.targetRole) || item.targetRole}</span>
                  </div>
                  <div>{item.issue}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{t.projectMisc.suggestionPrefix.replace('{text}', item.suggestion)}</div>
                </div>
              ))}
            </div>
          )}

          {/* === Actions: partial redo === */}
          {!review.passed && d.status === 'completed' && (
            <div className="border-t border-white/5 pt-3 mt-2">
              {!showRedoPanel ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRedoPanel(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 text-orange-300 text-xs font-medium hover:bg-orange-500/25 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t.projectMisc.selectPartialRedo}
                  </button>
                  <button
                    onClick={d.onAcceptReview}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8C547]/15 text-[#FF6B6B] text-xs font-medium hover:bg-[#E8C547]/25 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t.projectMisc.redoAll}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400 mb-2">
                    {t.projectMisc.selectRedoHint}
                  </div>

                  {/* Highlight stages with issues */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(STAGE_META).map(([key, cfg]) => {
                      const isSelected = selectedRedoStages.has(key);
                      const isProblematic = getProblematicStages().includes(key);

                      return (
                        <button
                          key={key}
                          onClick={() => toggleRedoStage(key)}
                          disabled={isRedoing}
                          className={`relative px-2 py-2 rounded-xl text-[10px] font-medium transition-all border ${
                            isSelected
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                              : isProblematic
                                ? 'bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/15'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          <span className={cfg.color}>{stageLabel(key)}</span>
                          {isProblematic && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                          {isSelected && (
                            <CheckCircle2 className="absolute -top-1 -right-1 w-3.5 h-3.5 text-orange-400 bg-[#141520] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedRedoStages.size > 0 && (
                    <div className="text-[9px] text-gray-500 bg-black/20 rounded-lg px-2 py-1.5">
                      {t.projectMisc.redoFromStage.replace('{label}', stageLabel(Array.from(selectedRedoStages).sort((a, b) => {
                        const order = Object.keys(STAGE_META);
                        return order.indexOf(a) - order.indexOf(b);
                      })[0]) )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handlePartialRedo}
                      disabled={selectedRedoStages.size === 0 || isRedoing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isRedoing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t.projectMisc.redoing}
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t.projectMisc.startRedo.replace('{n}', String(selectedRedoStages.size))}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowRedoPanel(false); setSelectedRedoStages(new Set()); }}
                      disabled={isRedoing}
                      className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review passed */}
          {review.passed && d.status === 'completed' && (
            <div className="flex gap-2 border-t border-white/5 pt-3 mt-2">
              <button
                onClick={d.onComplete}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.projectMisc.completeProject}
              </button>
              <button
                onClick={() => setShowRedoPanel(!showRedoPanel)}
                className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Passed but still want a redo panel */}
          {review.passed && showRedoPanel && d.status === 'completed' && (
            <div className="mt-2 space-y-2">
              <div className="text-[11px] text-gray-400">{t.projectMisc.selectOptimizeHint}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(STAGE_META).map(([key]) => {
                  const isSelected = selectedRedoStages.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleRedoStage(key)}
                      disabled={isRedoing}
                      className={`px-2 py-2 rounded-xl text-[10px] font-medium transition-all border ${
                        isSelected
                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {stageLabel(key)}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handlePartialRedo}
                disabled={selectedRedoStages.size === 0 || isRedoing}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-30"
              >
                {isRedoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                {isRedoing ? t.projectMisc.redoing : t.projectMisc.startRedo.replace('{n}', String(selectedRedoStages.size))}
              </button>
            </div>
          )}
        </div>
      ) : !isDirector ? (
        <div className="text-center py-6 text-gray-500 text-xs">
          {d.status === 'pending' ? t.projectMisc.waitEdit : d.status === 'running' ? t.projectMisc.producerReviewing : t.projectMisc.reviewComplete}
        </div>
      ) : null}

      {!isDirector && (
        <Handle type="source" position={Position.Bottom} id="feedback" className={`!w-4 !h-4 !bg-red-500 !border-2 !border-[#141414] !rounded-full hover:!scale-125 !transition-transform`} />
      )}
    </NodeShell>
  );
}

export const ReviewNode = memo(ReviewNodeComponent);
