'use client';

/**
 * LatestPolishBanner — project-detail header strip for the most recent polish audit.
 *
 * Consumes the record polish page writes to script asset.data.latestPolish,
 * closing the loop:
 *   polish → write-back → project page shows readiness → decide whether to re-run
 *
 * Default: collapsed; shows AIGC readiness + summary + note count.
 * "Expand audit" embeds the full IndustryAuditCard.
 *
 * If latestPolish is missing or malformed, the component renders nothing.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Stethoscope, CaretDown as ChevronDown, CaretUp as ChevronUp, Pulse as Activity, Clock, Sparkle as Sparkles, ArrowSquareOut as ExternalLink } from '@phosphor-icons/react';
import IndustryAuditCard, { type PolishAudit } from './IndustryAuditCard';
import { readinessLevel } from '@/lib/polish-prompts';
import { timeAgoZh } from '@/lib/relative-time';
import { useLocale } from '@/hooks/use-locale';

interface LatestPolishEntry {
  at?: string;
  mode?: 'basic' | 'pro';
  style?: string | null;
  intensity?: string;
  focus?: string | null;
  polished?: string;
  summary?: string;
  notes?: string[];
  audit?: PolishAudit | null;
  model?: string;
}

export default function LatestPolishBanner({
  entry, projectId,
}: {
  entry: LatestPolishEntry | null | undefined;
  projectId: string;
}) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };
  const [expanded, setExpanded] = useState(false);

  // Hooks must run before any early return (React rules of hooks).
  // Missing entry: useMemo still receives undefined — that's fine.
  const when = useMemo(() => {
    if (!entry?.at) return '';
    try {
      // v12.301: shared lib/relative-time (zh). English uses locale date.
      if (locale === 'en') return new Date(entry.at).toLocaleString('en');
      return timeAgoZh(entry.at);
    } catch {
      return '';
    }
  }, [entry?.at, locale]);

  // No polished text → treat as never run; stay silent
  if (!entry || typeof entry.polished !== 'string') return null;

  const score = entry.audit?.aigcReadiness?.score;
  const hasScore = typeof score === 'number';
  const lvl = hasScore ? readinessLevel(score!) : null;

  const barColor =
    lvl?.level === 'green' ? 'bg-emerald-400'
      : lvl?.level === 'amber' ? 'bg-amber-400'
        : 'bg-rose-400';
  const labelColor =
    lvl?.level === 'green' ? 'text-emerald-300'
      : lvl?.level === 'amber' ? 'text-amber-300'
        : 'text-rose-300';

  const readinessLabel =
    lvl?.level === 'green' ? t.polishUi.readinessGreen
      : lvl?.level === 'amber' ? t.polishUi.readinessAmber
        : lvl ? t.polishUi.readinessRed
          : '';

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] to-rose-500/[0.05] overflow-hidden">
      {/* Main banner row */}
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <Stethoscope className="w-5 h-5 text-violet-300" />
          <div>
            <p className="text-[11px] text-violet-300 tracking-widest uppercase leading-none">
              {t.polishUi.latestPolish}
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              {entry.mode === 'pro' ? t.polishUi.proIndustry : 'Basic'}
              {when ? ` · ${when}` : ''}
            </p>
          </div>
        </div>

        {/* Readiness score + bar (Pro only) */}
        {hasScore && lvl ? (
          <div className="flex items-center gap-2 min-w-[200px] flex-1">
            <Activity className={`w-4 h-4 ${labelColor}`} />
            <span className={`text-xl font-bold tabular-nums ${labelColor}`}>{score}</span>
            <span className="text-[10px] text-white/40">/ 100</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden ml-2 min-w-[80px]">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
            </div>
            <span className={`text-[11px] ${labelColor}`}>{readinessLabel}</span>
          </div>
        ) : null}

        {/* Note count */}
        {Array.isArray(entry.notes) && entry.notes.length > 0 ? (
          <span className="text-[11px] text-white/55 bg-white/5 px-2 py-0.5 rounded-full">
            {t.polishUi.notesCount.replace('{n}', String(entry.notes.length))}
          </span>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {entry.audit ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[12px] text-white/80 transition-colors flex items-center gap-1"
              title={expanded ? t.polishUi.collapseAuditTitle : t.polishUi.expandAuditTitle}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? t.polishUi.collapse : t.polishUi.viewAudit}
            </button>
          ) : null}
          <Link
            href={`/dashboard/polish?projectId=${encodeURIComponent(projectId)}`}
            className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-[12px] text-violet-100 border border-violet-500/30 transition-colors flex items-center gap-1"
            title={t.polishUi.polishAgainTitle}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t.polishUi.polishAgain}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </div>

      {/* Summary strip */}
      {entry.summary ? (
        <div className="px-5 pb-3 -mt-1 text-[12.5px] text-white/75 leading-relaxed flex gap-2">
          <Clock className="w-3.5 h-3.5 text-white/35 shrink-0 mt-0.5" />
          <span>{entry.summary}</span>
        </div>
      ) : null}

      {/* Expanded: full audit */}
      {expanded && entry.audit ? (
        <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-black/15">
          <IndustryAuditCard audit={entry.audit} />
        </div>
      ) : null}
    </div>
  );
}
