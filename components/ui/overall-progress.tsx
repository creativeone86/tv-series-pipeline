'use client';

import { useProjectWorkspaceStore } from '@/lib/store';
import { useMemo } from 'react';
import { STAGE_WEIGHTS, calculateOverallProgress, type StageProgress } from '@/lib/progress-calculator';
import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

/**
 * Node ID → stage key
 */
const NODE_TO_STAGE: Record<string, keyof typeof STAGE_WEIGHTS> = {
  'node-director': 'DIRECTOR',
  'node-writer': 'WRITER',
  'node-character': 'CHARACTER',
  'node-scene': 'SCENE',
  'node-storyboard': 'STORYBOARD',
  'node-video': 'VIDEO',
  'node-editor': 'EDITOR',
  'node-producer': 'REVIEW',
};

/**
 * Fold each node's {status, progress} into overall progress + current-stage label.
 * Replaces the old per-node progress bars.
 */
export function OverallProgressBar() {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const nodes = useProjectWorkspaceStore(s => s.nodes);
  const isProducing = useProjectWorkspaceStore(s => s.isProducing);

  const { overall, currentStageLabel, runningStages } = useMemo(() => {
    const stageLabels: Record<keyof typeof STAGE_WEIGHTS, string> = {
      DIRECTOR: t.kitUi.stageDirector,
      WRITER: t.kitUi.stageWriter,
      CHARACTER: t.product.characterDesign,
      SCENE: t.product.sceneDesign,
      STORYBOARD: t.kitUi.stageStoryboard,
      VIDEO: t.product.videoGen,
      EDITOR: t.product.phaseEdit,
      REVIEW: t.product.phaseReview,
    };
    const stages: StageProgress[] = [];
    let current: string | null = null;

    for (const node of nodes) {
      const stageKey = NODE_TO_STAGE[node.id];
      if (!stageKey) continue;
      const data = node.data as any;
      const status = (data?.status || 'pending') as StageProgress['status'];
      const progress = typeof data?.progress === 'number' ? data.progress : (status === 'completed' ? 100 : 0);
      stages.push({ stage: stageKey, status, progress });
      if (status === 'running' && !current) current = stageLabels[stageKey];
    }

    const overall = calculateOverallProgress(stages);
    const running = stages.filter(s => s.status === 'running');
    return { overall, currentStageLabel: current, runningStages: running };
  }, [nodes, t]);

  if (!isProducing && overall === 0) return null;
  if (!isProducing && overall >= 100) return null;

  return (
    <div className="shrink-0 border-b border-white/[0.04] bg-[#0B0B0C]/90 backdrop-blur-xl px-5 py-2">
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-[11px] font-medium text-white/60">
          {currentStageLabel ? `${currentStageLabel} · ` : ''}{overall}%
        </div>
        <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E8C547] via-[#F4A261] to-[#E76F51] transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, overall))}%` }}
          />
        </div>
        {runningStages.length > 1 && (
          <div className="shrink-0 text-[10px] text-white/30">
            {t.kitUi.parallelStages.replace('{n}', String(runningStages.length))}
          </div>
        )}
      </div>
    </div>
  );
}
