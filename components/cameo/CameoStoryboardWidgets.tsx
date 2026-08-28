'use client';

/**
 * CameoStoryboardWidgets — Cameo consistency viz on the storyboard tab (Sprint A.4)
 *
 * Three pieces:
 *   · CameoBadge      — red/amber/green corner dot on a board card (popover detail)
 *   · CameoSummary    — project header strip (N shots · avg · need regen)
 *   · CameoBatchRetry — "batch regen low-score shots" + progress
 *
 * Data contract:
 *   each storyboard asset data may include cameoScore/cameoRetried/...,
 *   written by v2.12 Sprint A.1 evaluateAndRetry in the orchestrator and persisted
 *   via create-stream. Old data without cameoScore is a friendly noop.
 *
 * Goal (ROADMAP_V4 "5 seconds to see which shots to redraw"): one-line overview,
 *           per-card badge, one-click batch regen loop.
 */

import { useState, useMemo } from 'react';
import { Pulse as Activity, Repeat, Warning as AlertTriangle, CircleNotch as Loader2, CheckCircle as CheckCircle2, X } from '@phosphor-icons/react';
import { CameoBarList, CameoDonut } from '@/components/cinema/dataviz';
import { NumberTicker } from '@/components/cinema/effects';
import { useLocale } from '@/hooks/use-locale';

interface CameoData {
  cameoScore?: number;
  cameoRetried?: boolean;
  cameoAttempts?: number;
  cameoFinalCw?: number;
  cameoReason?: string;
  /** v2.12 Phase 3 → A.4: per-character face-lock scores; only on 2+ character shots. null = vision failed */
  cameoPerCharacterScores?: Array<{ name?: string; score: number | null; reasoning?: string }>;
}

/** Map 0-100 to red / amber / green, aligned with readinessLevel */
function classify(score?: number): 'green' | 'amber' | 'red' | 'na' {
  if (typeof score !== 'number') return 'na';
  if (score >= 85) return 'green';
  if (score >= 70) return 'amber';  // ROADMAP_V4 §2 A.4: 70-84 yellow; 75 is retry; display uses 70
  return 'red';
}

const PALETTE = {
  green: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/35' },
  amber: { dot: 'bg-amber-400',   text: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/35' },
  red:   { dot: 'bg-rose-400',    text: 'text-rose-300',    bg: 'bg-rose-500/15',    border: 'border-rose-500/35' },
  na:    { dot: 'bg-white/15',    text: 'text-white/40',    bg: 'bg-white/5',        border: 'border-white/10' },
} as const;

// ────────────────────────────────────────────────
// Badge — corner mark on a single board card
// ────────────────────────────────────────────────

export function CameoBadge({ data }: { data: CameoData }) {
  const { t } = useLocale();
  const [showPopover, setShowPopover] = useState(false);
  const lvl = classify(data.cameoScore);
  // No score → do not render (empty badges pollute the card)
  if (lvl === 'na' && !data.cameoRetried) return null;

  const p = PALETTE[lvl];

  return (
    <div className="absolute top-2 right-2 z-10">
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowPopover((v) => !v); }}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-sm shadow-sm hover:scale-105 transition-transform ${p.bg} ${p.text} ${p.border}`}
        aria-label={`${t.sharedUi.cameoConsistency}: ${data.cameoScore ?? '—'}/100`}
        title={`${t.sharedUi.cameoConsistency}: ${data.cameoScore ?? '—'}/100`}
      >
        <Activity className="w-2.5 h-2.5" />
        {typeof data.cameoScore === 'number' ? data.cameoScore : '—'}
        {data.cameoRetried ? <Repeat className="w-2.5 h-2.5 ml-0.5 opacity-80" /> : null}
      </button>

      {showPopover ? (
        <>
          {/* Translucent overlay to catch click-outside */}
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowPopover(false); }}
          />
          <div
            className={`absolute right-0 mt-1.5 w-56 rounded-lg border ${p.border} bg-[#0E0E10]/97 shadow-2xl backdrop-blur z-40 p-3 text-left`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] tracking-widest uppercase ${p.text}`}>{t.sharedUi.cameoConsistency}</span>
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowPopover(false); }}
                className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-end gap-1 mb-2">
              <span className={`text-2xl font-bold ${p.text} tabular-nums leading-none`}>
                {typeof data.cameoScore === 'number' ? data.cameoScore : '—'}
              </span>
              <span className="text-[10px] text-white/40 mb-0.5">/ 100</span>
            </div>

            {/* v2.12 Phase 3: per-character score bars — only when 2+ entries */}
            {data.cameoPerCharacterScores && data.cameoPerCharacterScores.length >= 2 ? (
              <div className="mb-2 pb-2 border-b border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">
                  per-character ({data.cameoPerCharacterScores.length})
                </div>
                <ul className="space-y-1.5">
                  {data.cameoPerCharacterScores.map((c, i) => {
                    const lvl = classify(c.score == null ? undefined : c.score);
                    const cp = PALETTE[lvl];
                    const widthPct = c.score == null ? 0 : Math.max(2, Math.min(100, c.score));
                    return (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-[10.5px] text-white/65 truncate flex-shrink-0 max-w-[80px]" title={c.name || t.sharedUi.characterN.replace('{n}', String(i + 1))}>
                          {c.name || `#${i + 1}`}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className={`h-full ${cp.dot} transition-all`}
                            style={{ width: `${widthPct}%`, opacity: c.score == null ? 0.2 : 1 }}
                          />
                        </div>
                        <span className={`text-[10.5px] font-semibold tabular-nums ${cp.text} flex-shrink-0 w-8 text-right`}>
                          {c.score == null ? '—' : c.score}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {data.cameoReason ? (
              <p className="text-[11px] text-white/70 leading-relaxed mb-2 italic">"{data.cameoReason}"</p>
            ) : null}

            <ul className="space-y-1 text-[10.5px] text-white/55">
              {data.cameoRetried ? (
                <li className="flex items-center gap-1.5">
                  <Repeat className="w-3 h-3 text-violet-300" />
                  <span>{t.sharedUi.autoRetriedN.replace('{n}', String(data.cameoAttempts ?? 2))}</span>
                </li>
              ) : (
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-white/40" />
                  <span>{t.sharedUi.firstPassOk}</span>
                </li>
              )}
              {typeof data.cameoFinalCw === 'number' ? (
                <li className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-white/40" />
                  <span>{t.sharedUi.finalCw} = {data.cameoFinalCw}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────
// Summary Bar — project header strip
// ────────────────────────────────────────────────

export function CameoSummary({
  storyboards, onBatchRetry, batchRetrying,
}: {
  storyboards: Array<{ data?: CameoData; shotNumber?: number }>;
  onBatchRetry: (lowScoreShotNumbers: number[]) => void;
  batchRetrying: boolean;
}) {
  const { t } = useLocale();
  const stats = useMemo(() => {
    const scored = storyboards.filter((sb) => typeof sb.data?.cameoScore === 'number');
    const total = storyboards.length;
    const evaluated = scored.length;
    if (evaluated === 0) {
      return { total, evaluated: 0, avg: null, lowCount: 0, retriedCount: 0, lowShotNumbers: [] as number[] };
    }
    const sum = scored.reduce((s, sb) => s + (sb.data!.cameoScore ?? 0), 0);
    const avg = Math.round(sum / evaluated);
    const lowShots = scored.filter((sb) => (sb.data!.cameoScore ?? 100) < 75);
    const retried = scored.filter((sb) => sb.data!.cameoRetried).length;
    return {
      total,
      evaluated,
      avg,
      lowCount: lowShots.length,
      retriedCount: retried,
      lowShotNumbers: lowShots.map((sb) => sb.shotNumber ?? 0).filter((n) => n > 0),
    };
  }, [storyboards]);

  // No scores → do not render the strip (avoid empty-state noise)
  if (stats.evaluated === 0) {
    if (stats.total > 0) {
      return (
        <div className="mb-3 px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-[11px] text-white/45 leading-relaxed">
          {t.sharedUi.cameoNoScores}
        </div>
      );
    }
    return null;
  }

  const avgLvl = classify(stats.avg ?? undefined);
  const ap = PALETTE[avgLvl];

  return (
    <>
    <div className="mb-3 flex items-center gap-3 flex-wrap px-3 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/8 to-rose-500/5 border border-violet-500/20 [.cinema-page_&]:rounded-none [.cinema-page_&]:bg-[var(--cinema-surface-2)] [.cinema-page_&]:border-[var(--cinema-border-hi)] [.cinema-page_&]:bg-none [.cinema-page_&]:border" style={{ borderRadius: undefined }}>
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-violet-300 [.cinema-page_&]:text-[var(--cinema-amber)]" />
        <span className="text-[11px] text-violet-200 tracking-widest uppercase [.cinema-page_&]:cinema-eyebrow [.cinema-page_&]:text-[var(--cinema-amber)] [.cinema-page_&]:opacity-90">
          <span className="[.cinema-page_&]:hidden">{t.sharedUi.cameoConsistency}</span>
          <span className="hidden [.cinema-page_&]:inline">CAMEO · {t.sharedUi.consistencyMeter}</span>
        </span>
      </div>
      <div className="text-[12px] text-white/85 [.cinema-page_&]:cinema-mono [.cinema-page_&]:text-[var(--cinema-text-2)]">
        <span className="[.cinema-page_&]:opacity-50 [.cinema-page_&]:tracking-widest [.cinema-page_&]:text-[10px] [.cinema-page_&]:mr-1">SHOTS</span>
        <span className="font-semibold tabular-nums [.cinema-page_&]:text-[var(--cinema-text)]">{stats.total}</span>
        <span className="[.cinema-page_&]:hidden"> {t.product.shotsUnit}</span>
      </div>
      <div className="flex items-center gap-1 text-[12px]">
        <span className="text-white/50 [.cinema-page_&]:cinema-eyebrow [.cinema-page_&]:tracking-widest">
          <span className="[.cinema-page_&]:hidden">{t.sharedUi.average}</span>
          <span className="hidden [.cinema-page_&]:inline">AVG</span>
        </span>
        <span className={`font-bold tabular-nums ${ap.text} [.cinema-page_&]:cinema-mono`}>{stats.avg}</span>
        <span className="text-white/30 text-[10px] [.cinema-page_&]:cinema-mono [.cinema-page_&]:opacity-40">/100</span>
      </div>
      {stats.lowCount > 0 ? (
        <div className="flex items-center gap-1 text-[12px] text-rose-300 [.cinema-page_&]:text-[var(--cinema-red)]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            <span className="font-semibold tabular-nums [.cinema-page_&]:cinema-mono">{stats.lowCount}</span>
            <span className="[.cinema-page_&]:hidden"> {t.sharedUi.shotsNeedRegen}</span>
            <span className="hidden [.cinema-page_&]:inline opacity-75 ml-1 cinema-mono text-[10px] tracking-wider">BELOW THRESHOLD</span>
          </span>
        </div>
      ) : null}
      {stats.retriedCount > 0 ? (
        <div className="flex items-center gap-1 text-[11px] text-violet-200/70 [.cinema-page_&]:text-[var(--cinema-text-2)] [.cinema-page_&]:cinema-mono">
          <Repeat className="w-3 h-3" />
          <span>
            <span className="[.cinema-page_&]:hidden">{t.sharedUi.autoRetriedShots.replace('{n}', String(stats.retriedCount))}</span>
            <span className="hidden [.cinema-page_&]:inline">RETRIED · {stats.retriedCount}</span>
          </span>
        </div>
      ) : null}
      {stats.lowCount > 0 ? (
        <button
          onClick={() => onBatchRetry(stats.lowShotNumbers)}
          disabled={batchRetrying}
          className="ml-auto px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-[11.5px] text-violet-100 border border-violet-500/35 transition-colors flex items-center gap-1.5 [.cinema-page_&]:rounded-none [.cinema-page_&]:bg-[var(--cinema-amber)] [.cinema-page_&]:hover:bg-[#D6B270] [.cinema-page_&]:text-black [.cinema-page_&]:border-[var(--cinema-amber)] [.cinema-page_&]:font-semibold"
          title={t.sharedUi.batchRetryTitle.replace('{n}', String(stats.lowCount))}
        >
          {batchRetrying ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="[.cinema-page_&]:hidden">{t.sharedUi.retrying}</span>
              <span className="hidden [.cinema-page_&]:inline cinema-mono tracking-wider">RETRYING…</span>
            </>
          ) : (
            <>
              <Repeat className="w-3.5 h-3.5" />
              <span className="[.cinema-page_&]:hidden">{t.sharedUi.batchRetryN.replace('{n}', String(stats.lowCount))}</span>
              <span className="hidden [.cinema-page_&]:inline cinema-mono tracking-wider">▶ BATCH RETRY · {stats.lowCount}</span>
            </>
          )}
        </button>
      ) : (
        <span className="ml-auto text-[10.5px] text-emerald-300/70 [.cinema-page_&]:text-[var(--cinema-green)] [.cinema-page_&]:cinema-mono [.cinema-page_&]:tracking-wider">
          <span className="[.cinema-page_&]:hidden">✓ {t.sharedUi.allShotsPass}</span>
          <span className="hidden [.cinema-page_&]:inline">✓ ALL SHOTS PASS</span>
        </span>
      )}
    </div>
    {/* v2.13.3 — extra donut + per-shot bars in cinema mode only */}
    <CameoDashboard storyboards={storyboards} stats={stats} />
    </>
  );
}

// ────────────────────────────────────────────────
// CameoDashboard — donut + per-shot bar list (cinema only)
// ────────────────────────────────────────────────
function CameoDashboard({
  storyboards,
  stats,
}: {
  storyboards: Array<{ data?: CameoData; shotNumber?: number }>;
  stats: { evaluated: number; avg: number | null; lowCount: number; retriedCount: number };
}) {
  const { t } = useLocale();
  // Prepare BarList data
  const items = useMemo(() => {
    return storyboards
      .filter((sb) => typeof sb.shotNumber === 'number')
      .map((sb) => ({
        shotNumber: sb.shotNumber!,
        score: typeof sb.data?.cameoScore === 'number' ? sb.data!.cameoScore! : null,
        retried: !!sb.data?.cameoRetried,
      }));
  }, [storyboards]);

  // donut three-tier counts (≥85 pass / 70-84 warn / <70 fail / null na)
  const seg = useMemo(() => {
    let pass = 0, warn = 0, fail = 0, na = 0;
    for (const it of items) {
      if (it.score == null) na++;
      else if (it.score >= 85) pass++;
      else if (it.score >= 70) warn++;
      else fail++;
    }
    return { pass, warn, fail, na };
  }, [items]);

  if (stats.evaluated === 0) return null;
  const scrollToShot = (n: number) => {
    const el = document.querySelector(`[data-shot="${n}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="hidden [.cinema-page_&]:grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 mb-4 cinema-card-hi p-4">
      {/* Left: donut + three-tier counts */}
      <div className="flex items-center gap-4">
        <CameoDonut
          pass={seg.pass}
          warn={seg.warn}
          fail={seg.fail}
          na={seg.na}
          centerLabel={stats.avg != null ? <NumberTicker value={stats.avg} /> : '—'}
          centerSub="AVG · 100"
          size={104}
        />
        <div className="space-y-1.5 text-[10.5px] cinema-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cinema-green)' }} />
            <span className="opacity-60 tracking-wider">PASS ≥ 85</span>
            <span className="ml-auto tabular-nums" style={{ color: 'var(--cinema-green)' }}><NumberTicker value={seg.pass} /></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cinema-amber)' }} />
            <span className="opacity-60 tracking-wider">WARN 70-84</span>
            <span className="ml-auto tabular-nums" style={{ color: 'var(--cinema-amber)' }}><NumberTicker value={seg.warn} /></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cinema-red)' }} />
            <span className="opacity-60 tracking-wider">FAIL &lt; 70</span>
            <span className="ml-auto tabular-nums" style={{ color: 'var(--cinema-red)' }}><NumberTicker value={seg.fail} /></span>
          </div>
          {seg.na > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cinema-text-3)' }} />
              <span className="opacity-60 tracking-wider">NO SCORE</span>
              <span className="ml-auto tabular-nums opacity-70"><NumberTicker value={seg.na} /></span>
            </div>
          )}
        </div>
      </div>
      {/* Right: per-shot bar list */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="cinema-eyebrow tracking-widest">PER-SHOT · {t.sharedUi.weakestFirst}</span>
          <span className="cinema-mono text-[10px] opacity-50">click → jump</span>
        </div>
        <CameoBarList items={items} threshold={75} onClickShot={scrollToShot} maxRows={12} />
      </div>
    </div>
  );
}
