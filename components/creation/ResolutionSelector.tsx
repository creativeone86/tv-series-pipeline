'use client';

/**
 * ResolutionSelector (v2.0 Sprint 0 D5)
 *
 * Resolution tier picker — 360P / 480P / 720P (max 720P this cycle).
 *
 * Features:
 *  - Three visual cards (size cue + cost estimate)
 *  - Duration-linked cost for this generation
 *  - Aspect-ratio switch (16:9 / 9:16 / 1:1)
 *  - Create path has no 4K (engine create max 720P). 4K is post-film
 *    single-shot "4K re-render" (`regenerate-shot-4k`, Kling Master 1080p
 *    → lanczos 2160p, plan-gated) — shipped, not "coming soon".
 *
 * Usage:
 *   <ResolutionSelector
 *     value={{ resolution: '720p', aspectRatio: '16:9' }}
 *     durationSec={5}
 *     onChange={...}
 *   />
 */

import * as React from 'react';
import type { ResolutionTier, AspectRatio } from '@/types/agents';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';

// ──────────────────────────────────────────────────────────
// Cost table (CNY / sec, estimate; backend cost_log writes the real value)
// ──────────────────────────────────────────────────────────

interface TierMeta {
  label: string;
  dim: string;
  pricePerSec: number;
  descKey: string;
  badgeKey?: string;
}

const TIER_META: Record<ResolutionTier, TierMeta> = {
  '360p': {
    label: '360P',
    dim: '640 × 360',
    pricePerSec: 0.05,
    descKey: 'tier360Desc',
  },
  '480p': {
    label: '480P',
    dim: '854 × 480',
    pricePerSec: 0.12,
    descKey: 'tier480Desc',
    badgeKey: 'tierRecommended',
  },
  '720p': {
    label: '720P',
    dim: '1280 × 720',
    pricePerSec: 0.22,
    descKey: 'tier720Desc',
  },
};

const ASPECT_RATIOS: Array<{ value: AspectRatio; labelKey: string; icon: string }> = [
  { value: '16:9', labelKey: 'aspectLandscape', icon: '▭' },
  { value: '9:16', labelKey: 'aspectPortrait', icon: '▯' },
  { value: '1:1', labelKey: 'aspectSquare', icon: '◻' },
];

// ──────────────────────────────────────────────────────────
// Helpers (exported for tests)
// ──────────────────────────────────────────────────────────

export function estimateCost(resolution: ResolutionTier, durationSec: number): number {
  const meta = TIER_META[resolution];
  if (!meta) return 0;
  return Math.round(meta.pricePerSec * durationSec * 100) / 100;
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────

export interface ResolutionSelectorValue {
  resolution: ResolutionTier;
  aspectRatio: AspectRatio;
}

export interface ResolutionSelectorProps {
  value: ResolutionSelectorValue;
  onChange: (next: ResolutionSelectorValue) => void;
  /** Duration in seconds used for this-run cost estimate */
  durationSec?: number;
  /** Disable aspect-ratio switching (some modes lock the ratio) */
  lockAspectRatio?: boolean;
  className?: string;
}

export function ResolutionSelector({
  value,
  onChange,
  durationSec = 5,
  lockAspectRatio = false,
  className,
}: ResolutionSelectorProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { workshop: Record<string, string> };
  const w = t.workshop ?? {};

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* Resolution cards */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h4 className="text-sm font-semibold text-white">{w.resolutionTitle || 'Resolution'}</h4>
          <span className="text-xs text-neutral-400">
            {w.resolutionHint || 'Create max 720P · per-shot 4K re-render after film (Kling Master · plan-gated)'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="resolution-grid">
          {(Object.keys(TIER_META) as ResolutionTier[]).map(tier => {
            const meta = TIER_META[tier];
            const selected = value.resolution === tier;
            const cost = estimateCost(tier, durationSec);
            const badge = meta.badgeKey ? (w[meta.badgeKey] || t.billing.recommended) : undefined;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onChange({ ...value, resolution: tier })}
                className={cn(
                  'relative rounded-lg border-2 p-4 text-left transition-all duration-200',
                  selected
                    ? 'border-[#E8C547] bg-[#E8C547]/10 shadow-lg shadow-[#E8C547]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30',
                )}
                data-testid={`resolution-tier-${tier}`}
                data-selected={selected}
                aria-pressed={selected}
              >
                {badge && (
                  <span className="absolute right-2 top-2 rounded bg-[#E8C547]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#E8C547]">
                    {badge}
                  </span>
                )}
                <div className="text-lg font-bold text-white">{meta.label}</div>
                <div className="mt-1 text-xs text-neutral-400">{meta.dim}</div>
                <div className="mt-3 text-[11px] text-neutral-300">{w[meta.descKey] || meta.label}</div>
                <div className="mt-3 flex items-baseline gap-1 border-t border-white/10 pt-2">
                  <span className="text-xs text-neutral-400">{w.estimated || 'Est.'}</span>
                  <span className="text-sm font-semibold text-[#E8C547]">
                    ¥{cost.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-500">/ {durationSec}s</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h4 className="text-sm font-semibold text-white">{w.aspectTitle || 'Aspect ratio'}</h4>
          {lockAspectRatio && (
            <span className="text-[11px] text-neutral-500">{w.aspectLocked || 'This mode locks the ratio'}</span>
          )}
        </div>
        <div className="flex gap-2" data-testid="aspect-ratio-row">
          {ASPECT_RATIOS.map(ar => {
            const selected = value.aspectRatio === ar.value;
            return (
              <button
                key={ar.value}
                type="button"
                disabled={lockAspectRatio}
                onClick={() => onChange({ ...value, aspectRatio: ar.value })}
                className={cn(
                  'flex-1 rounded-lg border-2 px-3 py-3 text-sm transition-all',
                  selected
                    ? 'border-[#E8C547] bg-[#E8C547]/10 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/30',
                  lockAspectRatio && 'cursor-not-allowed opacity-40',
                )}
                data-testid={`aspect-${ar.value}`}
                data-selected={selected}
                aria-pressed={selected}
              >
                <div className="text-2xl leading-none">{ar.icon}</div>
                <div className="mt-1 text-xs">{w[ar.labelKey] || ar.value}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
