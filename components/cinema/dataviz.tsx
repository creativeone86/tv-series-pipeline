'use client';

/**
 * Cinema data-viz components (v2.13.3 / v2.13.4)
 *
 * Inspired by Tremor BarList / DonutChart density, but cinema palette + serif/mono mix,
 * no extra deps (Tremor v3 is React 18 only; we are 19)
 *
 * Includes:
 *   <CameoBarList>     — per-shot horizontal bars, colored ≥85 / 70-84 / <70
 *   <CameoDonut>       — three-segment donut, AVG in the center
 *   <Sparkline>        — v2.13.4: gradient fill + endpoint dots + auto trend color
 *   <ScoreDonut>       — v2.13.4 project-card mini donut (28-44px)
 */

import { useMemo, type ReactNode } from 'react';
import { useLocale } from '@/hooks/use-locale';

// ────────────────────────────────────────────────
// Shared: 0-100 → three-tier color
// ────────────────────────────────────────────────
function tier(score: number | null | undefined) {
  if (typeof score !== 'number') return 'na' as const;
  if (score >= 85) return 'pass' as const;
  if (score >= 70) return 'warn' as const;
  return 'fail' as const;
}
const TIER_COLOR = {
  pass: 'var(--cinema-green)',
  warn: 'var(--cinema-amber)',
  fail: 'var(--cinema-red)',
  na: 'var(--cinema-text-3)',
} as const;

// ────────────────────────────────────────────────
// CameoBarList — horizontal bars
// ────────────────────────────────────────────────
export interface BarListItem {
  shotNumber: number;
  score: number | null;
  retried?: boolean;
}

export function CameoBarList({
  items,
  threshold = 75,
  onClickShot,
  maxRows = 16,
}: {
  items: BarListItem[];
  threshold?: number;
  onClickShot?: (shotNumber: number) => void;
  maxRows?: number;
}) {
  const { t } = useLocale();
  const sorted = useMemo(() => {
    // Lowest scores first so the user looks at the weak shots first
    return [...items]
      .sort((a, b) => {
        const ax = typeof a.score === 'number' ? a.score : 999;
        const bx = typeof b.score === 'number' ? b.score : 999;
        return ax - bx;
      })
      .slice(0, maxRows);
  }, [items, maxRows]);

  if (sorted.length === 0) {
    return (
      <div className="cinema-mono text-[11px] opacity-50 py-2">NO SCORE DATA</div>
    );
  }

  return (
    <div className="space-y-1">
      {sorted.map((it) => {
        const scoreTier = tier(it.score);
        const color = TIER_COLOR[scoreTier];
        const widthPct = it.score == null ? 0 : Math.max(2, Math.min(100, it.score));
        const isLow = typeof it.score === 'number' && it.score < threshold;
        return (
          <button
            key={it.shotNumber}
            onClick={() => onClickShot?.(it.shotNumber)}
            className={`w-full flex items-center gap-2 px-2 py-1 text-left transition-colors ${
              onClickShot ? 'hover:bg-[var(--cinema-surface-2)]' : 'cursor-default'
            }`}
            style={{ borderRadius: 3 }}
          >
            <span className="cinema-mono text-[10px] opacity-60 w-12 tracking-wider tabular-nums">
              SHOT {String(it.shotNumber).padStart(2, '0')}
            </span>
            <div className="flex-1 h-2 cinema-meter" style={{ borderRadius: 2 }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${color}66 0%, ${color} 100%)`,
                  opacity: it.score == null ? 0.3 : 1,
                }}
              />
            </div>
            <span
              className="cinema-mono text-[10.5px] w-9 text-right tabular-nums font-semibold"
              style={{ color: it.score == null ? 'var(--cinema-text-3)' : color }}
            >
              {it.score == null ? '—' : it.score}
            </span>
            {it.retried && (
              <span className="cinema-mono text-[8.5px] opacity-50 tracking-widest" title={t.sharedUi.shotAutoRetried}>
                RTY
              </span>
            )}
            {isLow && !it.retried && (
              <span className="cinema-mono text-[8.5px] tracking-widest" style={{ color: 'var(--cinema-red)' }}>
                LOW
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────
// CameoDonut — three-segment ring
// ────────────────────────────────────────────────
export function CameoDonut({
  pass,
  warn,
  fail,
  na = 0,
  centerLabel,
  centerSub,
  size = 96,
}: {
  pass: number;
  warn: number;
  fail: number;
  na?: number;
  centerLabel: ReactNode;
  centerSub?: string;
  size?: number;
}) {
  const total = pass + warn + fail + na;
  const r = (size - 8) / 2; // padding 4px
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // Compute each segment stroke-dasharray
  const segments: Array<{ value: number; color: string; key: string }> = [];
  if (pass > 0) segments.push({ value: pass, color: TIER_COLOR.pass, key: 'pass' });
  if (warn > 0) segments.push({ value: warn, color: TIER_COLOR.warn, key: 'warn' });
  if (fail > 0) segments.push({ value: fail, color: TIER_COLOR.fail, key: 'fail' });
  if (na > 0) segments.push({ value: na, color: TIER_COLOR.na, key: 'na' });

  let acc = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Base ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--cinema-surface-2)"
          strokeWidth="6"
        />
        {total > 0 && segments.map((seg) => {
          const len = (seg.value / total) * circ;
          const offset = (acc / total) * circ;
          acc += seg.value;
          return (
            <circle
              key={seg.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="6"
              strokeDasharray={`${len} ${circ}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
          );
        })}
      </svg>
      {/* Center readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="cinema-mono text-[20px] font-semibold tabular-nums leading-none">
          {centerLabel}
        </span>
        {centerSub && (
          <span className="cinema-mono text-[8.5px] tracking-widest opacity-50 mt-1">
            {centerSub}
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Sparkline — compact trend (v2.13.4: gradient fill + endpoints + auto-trend color)
//
// Used at the top of PolishHistoryPanel — see if AIGC readiness is improving
// ────────────────────────────────────────────────
export function Sparkline({
  values,
  width = 80,
  height = 20,
  color,
  area = true,
  endpoints = true,
  domain,
}: {
  values: number[];
  width?: number;
  height?: number;
  /** Auto by trend: first→last up=green / flat=amber / down=red */
  color?: string;
  /** Whether to fill the area under the line */
  area?: boolean;
  /** Whether to draw dots at the first/last points */
  endpoints?: boolean;
  /** Force [min, max] domain (default auto); e.g. scores always use [0, 100] */
  domain?: [number, number];
}) {
  if (values.length < 2) return null;

  // auto-trend: compare first vs last to pick line color
  const first = values[0];
  const last = values[values.length - 1];
  const trendColor = color
    ? color
    : last > first
      ? 'var(--cinema-green)'
      : last < first
        ? 'var(--cinema-red)'
        : 'var(--cinema-amber)';

  const [domMin, domMax] = domain ?? [Math.min(...values), Math.max(...values)];
  const range = domMax - domMin || 1;
  const step = width / (values.length - 1);

  const coords = values.map((v, i) => ({
    x: i * step,
    y: height - ((v - domMin) / range) * (height - 2) - 1, // 1px padding top/bottom
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath = `M ${coords[0].x},${height} L ${linePoints
    .split(' ')
    .join(' L ')} L ${coords[coords.length - 1].x},${height} Z`;

  const gradId = `cinema-spark-grad-${trendColor.replace(/[^a-z]/gi, '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      {area && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <polyline
        points={linePoints}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {endpoints && (
        <>
          <circle cx={coords[0].x} cy={coords[0].y} r="1.8" fill={trendColor} opacity="0.6" />
          <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.4" fill={trendColor} />
        </>
      )}
    </svg>
  );
}

// ────────────────────────────────────────────────
// ScoreDonut — project-card mini donut (v2.13.4)
//
// Single arc, color by tier (≥85 green / ≥70 amber / <70 red / N/A grey), score in the center.
// Sized 28-44px, replacing the old score pill on project cards.
// ────────────────────────────────────────────────
export function ScoreDonut({
  score,
  size = 36,
  thickness = 3.5,
  showCenter = true,
  centerLabel,
}: {
  score: number | null | undefined;
  /** Diameter px */
  size?: number;
  /** Stroke width px */
  thickness?: number;
  /** Whether to render the score in the center */
  showCenter?: boolean;
  /** Custom center text (default = rounded score) */
  centerLabel?: ReactNode;
}) {
  const t = tier(score);
  const color = TIER_COLOR[t];
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = typeof score === 'number' ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const dash = filled * circ;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={typeof score === 'number' ? `Score ${score}` : 'No score'}
      role="img"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--cinema-surface-2)"
          strokeWidth={thickness}
          opacity="0.6"
        />
        {typeof score === 'number' && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        )}
      </svg>
      {showCenter && (
        <span
          className="absolute inset-0 flex items-center justify-center cinema-mono font-semibold tabular-nums"
          style={{
            fontSize: Math.max(9, Math.round(size * 0.32)),
            color: typeof score === 'number' ? color : 'var(--cinema-text-3)',
            lineHeight: 1,
          }}
        >
          {centerLabel ?? (typeof score === 'number' ? Math.round(score) : '—')}
        </span>
      )}
    </div>
  );
}
