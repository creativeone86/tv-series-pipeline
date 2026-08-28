'use client';

/**
 * CameoScoreBadge (v2.11 #2)
 *
 * Card-style "photo fit report" from /api/cameo/preview.
 *
 * Design:
 *   - large score + verdict badge (excellent/good/fair/poor colors)
 *   - 4 dimension mini-bars (clarity / lighting / angle / size)
 *   - red warning rows / grey suggestion rows
 *   - loading / error states
 *
 * Reused by CameoPanel (project detail) and CreatePage (upload during create).
 */

import { CircleNotch as Loader2, Warning as AlertTriangle, Lightbulb, Sparkle as Sparkles } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

export interface CameoScoreBadgeData {
  score: number;
  verdict: 'excellent' | 'good' | 'fair' | 'poor';
  dimensions: {
    clarity: number;
    lighting: number;
    angle: number;
    size: number;
  };
  suggestions: string[];
  warnings: string[];
  summary?: string;
}

interface Props {
  loading?: boolean;
  error?: string | null;
  data?: CameoScoreBadgeData | null;
  /** Compact mode: drop summary, for narrow columns */
  compact?: boolean;
}

const VERDICT_STYLE: Record<
  CameoScoreBadgeData['verdict'],
  { color: string; bg: string }
> = {
  excellent: { color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  good:      { color: 'text-[#E8C547]',   bg: 'bg-[#E8C547]/15 border-[#E8C547]/30' },
  fair:      { color: 'text-orange-300',  bg: 'bg-orange-500/15 border-orange-500/30' },
  poor:      { color: 'text-red-300',     bg: 'bg-red-500/15 border-red-500/30' },
};

export function CameoScoreBadge({ loading, error, data, compact = false }: Props) {
  const { t } = useLocale();
  if (loading) {
    return (
      <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {t.sharedUi.cameoAnalyzing}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-500">
        {t.sharedUi.cameoScoreUnavailable.replace('{error}', error)}
      </div>
    );
  }
  if (!data) return null;

  const v = VERDICT_STYLE[data.verdict];
  const verdictLabel = {
    excellent: t.sharedUi.verdictExcellent,
    good: t.sharedUi.verdictGood,
    fair: t.sharedUi.verdictFair,
    poor: t.sharedUi.verdictPoor,
  }[data.verdict];

  return (
    <div className={`mt-3 p-3 rounded-xl border ${v.bg} space-y-2`}>
      {/* Header: large score + verdict */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${v.color}`} />
          <span className="text-xs text-gray-300">{t.sharedUi.cameoFit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold ${v.color} leading-none`}>{data.score}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${v.bg} ${v.color}`}>
            {verdictLabel}
          </span>
        </div>
      </div>

      {/* Four dimension mini-bars */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <DimBar label={t.sharedUi.dimClarity} value={data.dimensions.clarity} />
        <DimBar label={t.sharedUi.dimLighting} value={data.dimensions.lighting} />
        <DimBar label={t.sharedUi.dimAngle} value={data.dimensions.angle} />
        <DimBar label={t.sharedUi.dimSize} value={data.dimensions.size} />
      </div>

      {/* Warnings (red) */}
      {data.warnings.length > 0 && (
        <ul className="space-y-1">
          {data.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-300">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Suggestions (grey) */}
      {data.suggestions.length > 0 && (
        <ul className="space-y-1">
          {data.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400">
              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#E8C547]/70" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}

      {/* summary (optional) */}
      {!compact && data.summary && (
        <p className="text-[11px] text-gray-500 italic border-t border-white/5 pt-2">
          {data.summary}
        </p>
      )}
    </div>
  );
}

function DimBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'from-emerald-400 to-emerald-500'
    : value >= 60 ? 'from-[#E8C547] to-[#D4A830]'
    : value >= 40 ? 'from-orange-400 to-orange-500'
    : 'from-red-400 to-red-500';
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
