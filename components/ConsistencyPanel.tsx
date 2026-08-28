'use client';

/**
 * ConsistencyPanel (v2.11 #1)
 *
 * Live "face lock / shot continuity" meters for this run, aggregating
 * `consistencyStatus` events emitted by the orchestrator.
 *
 * Why surface this:
 *   Cameo and keyframes are about continuity, but users cannot tell mid-generation
 *   whether shots actually connect. Visualizing signals the backend already computes
 *   is a differentiator vs. local competitors.
 *
 * Two bars:
 *   - Face-locked X/N: shots that stuffed the uploaded Cameo face into subject_reference
 *   - Chained X/N: shots visually anchored to the previous clip's last frame
 *
 * Source: zustand.useAgentStore; SSE callbacks in /api/create-stream push
 * addConsistencyEvent(ev) one by one.
 */

import { useMemo } from 'react';
import { UserCircle as UserCircle2, LinkSimple as Link2, Sparkle as Sparkles, Anchor } from '@phosphor-icons/react';
import { useAgentStore, type ConsistencyEvent } from '@/lib/store';
import { useLocale } from '@/hooks/use-locale';

interface Props {
  /** Optional estimate when totalShots has not been reported (e.g. storyboard count) */
  fallbackTotal?: number;
  /** Compact mode for the narrow sidebar */
  compact?: boolean;
}

export function ConsistencyPanel({ fallbackTotal = 0, compact = false }: Props) {
  const { t } = useLocale();
  const events = useAgentStore((s) => s.consistencyEvents);
  const totalShots = useAgentStore((s) => s.totalShots);

  const { cameoShots, keyframeShots, globalAnchorShots, total } = useMemo(() => computeStats(events, totalShots, fallbackTotal), [events, totalShots, fallbackTotal]);

  // No events yet — Cameo may be unlocked and the first shot has not finished
  if (events.length === 0) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-white/5 border border-white/10 rounded-xl`}>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5" />
          {t.sharedUi.continuityPending}
        </div>
      </div>
    );
  }

  const cameoPct = total > 0 ? Math.round((cameoShots / total) * 100) : 0;
  const keyframePct = total > 0 ? Math.round((keyframeShots / total) * 100) : 0;

  return (
    <div className={`${compact ? 'p-3' : 'p-4'} bg-gradient-to-br from-[#E8C547]/5 to-white/5 border border-[#E8C547]/20 rounded-xl space-y-3`}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#E8C547]" />
        <h4 className="text-sm font-semibold text-[#E8C547]">{t.sharedUi.continuityMonitor}</h4>
      </div>

      {/* Cameo face lock */}
      <StatRow
        icon={<UserCircle2 className="w-3.5 h-3.5" />}
        label={t.sharedUi.cameoLocked}
        value={cameoShots}
        total={total}
        pct={cameoPct}
        color="from-[#E8C547] to-[#D4A830]"
        tooltip={cameoShots === 0 ? t.sharedUi.cameoUnusedTip : t.sharedUi.cameoUsedTip.replace('{n}', String(cameoShots))}
      />

      {/* Keyframe chain */}
      <StatRow
        icon={<Link2 className="w-3.5 h-3.5" />}
        label={t.sharedUi.shotChain}
        value={keyframeShots}
        total={Math.max(1, total - 1)}  // first shot has no prior frame; denominator - 1
        pct={total > 1 ? Math.round((keyframeShots / (total - 1)) * 100) : 0}
        color="from-blue-400 to-cyan-400"
        tooltip={t.sharedUi.shotChainTip.replace('{n}', String(keyframeShots))}
      />

      {/* v2.11 #3 smart interp: global style anchor */}
      <StatRow
        icon={<Anchor className="w-3.5 h-3.5" />}
        label={t.sharedUi.globalAnchor}
        value={globalAnchorShots}
        total={Math.max(1, total - 1)}
        pct={total > 1 ? Math.round((globalAnchorShots / (total - 1)) * 100) : 0}
        color="from-purple-400 to-pink-400"
        tooltip={t.sharedUi.globalAnchorTip.replace('{n}', String(globalAnchorShots))}
      />
    </div>
  );
}

/** Fold the event list into counts */
function computeStats(events: ConsistencyEvent[], totalShots: number, fallbackTotal: number) {
  const cameoSet = new Set<number>();
  const keyframeSet = new Set<number>();
  const globalAnchorSet = new Set<number>();
  let maxShot = 0;
  for (const e of events) {
    maxShot = Math.max(maxShot, e.shotNumber);
    if (e.type === 'cameoApplied') cameoSet.add(e.shotNumber);
    if (e.type === 'keyframeChained') keyframeSet.add(e.shotNumber);
    if (e.type === 'globalAnchorApplied') globalAnchorSet.add(e.shotNumber);
  }
  // Prefer orchestrator total; else max observed shot number; else estimate
  const total = totalShots || maxShot || fallbackTotal || 0;
  return {
    cameoShots: cameoSet.size,
    keyframeShots: keyframeSet.size,
    globalAnchorShots: globalAnchorSet.size,
    total,
  };
}

function StatRow(props: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  pct: number;
  color: string;
  tooltip?: string;
}) {
  return (
    <div title={props.tooltip}>
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-1.5 text-gray-300">
          {props.icon}
          <span>{props.label}</span>
        </div>
        <span className="font-mono text-gray-400">
          {props.value}<span className="text-gray-600">/{props.total || '—'}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${props.color} transition-all duration-500`}
          style={{ width: `${props.pct}%` }}
        />
      </div>
    </div>
  );
}
