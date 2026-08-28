'use client';

/**
 * PolishHistoryPanel — browse / restore prior polish runs (modal).
 *
 * Consumes scriptAsset.data.polishHistory[] (written by polish page
 * handleSaveToProject, max 10 entries).
 *
 * Two actions:
 *   · "View"          → emit onView(entry); parent fills current result and closes
 *   · "Replace source" → emit onRestoreSource(entry); parent puts entry.polished
 *                        into the left source textarea for iterate-from-this-version
 *
 * Why a modal instead of inlining on the polish page:
 *   The polish page is already 770+ lines; a 10-row list needs its own scroll
 *   and shadow. A modal stays clean and can be reused on project detail later.
 */

import { useMemo } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { X, ClockCounterClockwise as History, Stethoscope, Gauge, ArrowsLeftRight as ArrowRightLeft, Eye, Pulse as Activity, FileText, TrendUp as TrendingUp, TrendDown as TrendingDown, Minus } from '@phosphor-icons/react';
import type { PolishAudit } from './IndustryAuditCard';
import { readinessLevel } from '@/lib/polish-prompts';
import { Sparkline } from '@/components/cinema/dataviz';
import { timeAgoZh } from '@/lib/relative-time';
import { useLocale } from '@/hooks/use-locale';

export interface PolishHistoryEntry {
  at?: string;
  mode?: 'basic' | 'pro';
  style?: string | null;
  intensity?: string;
  focus?: string | null;
  polished?: string;
  summary?: string;
  notes?: string[];
  audit?: PolishAudit | null;
  elapsedMs?: number;
  model?: string;
}

export default function PolishHistoryPanel({
  history,
  onClose,
  onView,
  onRestoreSource,
}: {
  history: PolishHistoryEntry[];
  onClose: () => void;
  onView: (entry: PolishHistoryEntry) => void;
  onRestoreSource: (entry: PolishHistoryEntry) => void;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };

  // Ingest order is already newest-first (handleSaveToProject reverse-slice).
  // Re-sort stably in case someone edited asset data by hand.
  const sorted = useMemo(() => {
    return [...history].sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    });
  }, [history]);

  // v2.13.4: header sparkline — versions with a score, oldest → newest (left → right)
  // so "line rising to the right" reads as improvement.
  const trend = useMemo(() => {
    const withScore = sorted
      .filter((e) => typeof e.audit?.aigcReadiness?.score === 'number')
      .map((e) => ({
        score: e.audit!.aigcReadiness!.score!,
        at: e.at ? new Date(e.at).getTime() : 0,
      }))
      .sort((a, b) => a.at - b.at);
    return withScore;
  }, [sorted]);
  const trendValues = trend.map((tr) => tr.score);
  const trendDelta =
    trend.length >= 2 ? trend[trend.length - 1].score - trend[0].score : 0;

  // v10.3.6 a11y: Escape + focus trap + restore focus
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 outline-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.polishUi.historyAria}
      tabIndex={-1}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] bg-black/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <History className="w-4 h-4 text-violet-300 shrink-0" />
            <h3 className="text-sm font-semibold text-white truncate">
              {t.polishUi.historyHeading.replace('{n}', String(sorted.length))}
            </h3>
            <span className="text-[10px] text-white/40 hidden sm:inline shrink-0">{t.polishUi.maxKeep}</span>
          </div>

          {/* v2.13.4: AIGC trend sparkline */}
          {trend.length >= 2 && (
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 shrink-0"
              title={t.polishUi.trendTitle
                .replace('{from}', String(trend[0].score))
                .replace('{to}', String(trend[trend.length - 1].score))
                .replace('{n}', String(trend.length))}
            >
              <span className="text-[9.5px] text-white/45 uppercase tracking-wider hidden sm:inline">TREND</span>
              <Sparkline values={trendValues} width={70} height={18} domain={[0, 100]} />
              <span
                className={`flex items-center gap-0.5 text-[10.5px] font-mono tabular-nums font-semibold ${
                  trendDelta > 0
                    ? 'text-emerald-300'
                    : trendDelta < 0
                      ? 'text-rose-300'
                      : 'text-amber-300'
                }`}
              >
                {trendDelta > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trendDelta < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {trendDelta > 0 ? '+' : ''}
                {trendDelta}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
            title={t.product.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto p-4">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/50 flex flex-col items-center gap-3">
              <FileText className="w-8 h-8 text-white/20" />
              <p>{t.polishUi.historyEmpty}</p>
              <p className="text-[11px] text-white/35 max-w-[280px]">
                {t.polishUi.historyEmptyHint}
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {sorted.map((e, i) => (
                <HistoryRow
                  key={e.at ? `${e.at}-${i}` : i}
                  entry={e}
                  index={i}
                  onView={() => { onView(e); onClose(); }}
                  onRestoreSource={() => { onRestoreSource(e); onClose(); }}
                />
              ))}
            </ul>
          )}
        </div>

        {/* footer hint */}
        <div className="px-5 py-2.5 border-t border-[var(--border)] bg-black/20 text-[10.5px] text-white/45 leading-relaxed">
          <strong className="text-white/60">{t.polishUi.view}</strong> {t.polishUi.footerViewHint}{' '}
          <strong className="text-white/60">{t.polishUi.replaceSource}</strong> {t.polishUi.footerReplaceHint}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({
  entry, index, onView, onRestoreSource,
}: {
  entry: PolishHistoryEntry;
  index: number;
  onView: () => void;
  onRestoreSource: () => void;
}) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { polishUi: Record<string, string> };

  const when = useMemo(() => {
    if (!entry.at) return '—';
    try {
      const d = new Date(entry.at);
      if (locale === 'en') {
        return d.toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      // v12.301: shared lib/relative-time (this file and LatestPolishBanner used to diverge)
      return timeAgoZh(d, Date.now(), { withTime: true });
    } catch {
      return entry.at;
    }
  }, [entry.at, locale]);

  const score = entry.audit?.aigcReadiness?.score;
  const hasScore = typeof score === 'number';
  const lvl = hasScore ? readinessLevel(score!) : null;
  const scoreColor =
    lvl?.level === 'green' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : lvl?.level === 'amber' ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
        : lvl?.level === 'red' ? 'text-rose-300 border-rose-500/30 bg-rose-500/10'
          : '';

  const readinessLabel =
    lvl?.level === 'green' ? t.polishUi.readinessGreen
      : lvl?.level === 'amber' ? t.polishUi.readinessAmber
        : lvl ? t.polishUi.readinessRed
          : '';

  const isPro = entry.mode === 'pro';

  return (
    <li className="rounded-xl border border-[var(--border)] bg-black/25 hover:bg-black/35 transition-colors overflow-hidden">
      <div className="p-3.5 flex flex-col gap-2.5">
        {/* Top: metadata */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-white/40 font-mono tabular-nums">#{index + 1}</span>
          <span
            className={`px-1.5 py-0.5 rounded-md font-semibold text-[10px] border flex items-center gap-1 ${
              isPro
                ? 'bg-violet-500/15 text-violet-200 border-violet-500/30'
                : 'bg-[#E8C547]/10 text-[#E8C547] border-[#E8C547]/25'
            }`}
          >
            {isPro ? <Stethoscope className="w-2.5 h-2.5" /> : <Gauge className="w-2.5 h-2.5" />}
            {isPro ? 'Pro' : 'Basic'}
          </span>
          {entry.style ? (
            <span className="text-white/55">{entry.style}</span>
          ) : null}
          {entry.intensity ? (
            <span className="text-white/40">· {entry.intensity}</span>
          ) : null}
          {hasScore && lvl ? (
            <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] border flex items-center gap-1 tabular-nums ${scoreColor}`}>
              <Activity className="w-2.5 h-2.5" />
              {score} · {readinessLabel}
            </span>
          ) : null}
          <span className={hasScore ? 'text-white/40 text-[10px]' : 'ml-auto text-white/40 text-[10px]'}>
            {when}
          </span>
        </div>

        {/* Mid: summary */}
        {entry.summary ? (
          <p className="text-[12.5px] text-white/80 leading-relaxed line-clamp-2">
            {entry.summary}
          </p>
        ) : (
          <p className="text-[11.5px] text-white/40 italic">{t.polishUi.noSummary}</p>
        )}

        {/* Bottom: size + actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/35 tabular-nums">
            {t.polishUi.charsNotes
              .replace('{chars}', String((entry.polished || '').length))
              .replace('{n}', String(entry.notes?.length || 0))}
          </span>
          {entry.model ? (
            <span className="text-[10px] text-white/30 font-mono truncate max-w-[160px]" title={entry.model}>
              · {entry.model.slice(0, 22)}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={onView}
              className="px-2 py-1 rounded-md text-[11px] bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 transition-colors flex items-center gap-1"
              title={t.polishUi.viewTitle}
            >
              <Eye className="w-3 h-3" />
              {t.polishUi.view}
            </button>
            <button
              onClick={onRestoreSource}
              className="px-2 py-1 rounded-md text-[11px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 border border-violet-500/25 transition-colors flex items-center gap-1"
              title={t.polishUi.replaceSourceTitle}
            >
              <ArrowRightLeft className="w-3 h-3" />
              {t.polishUi.replaceSource}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
