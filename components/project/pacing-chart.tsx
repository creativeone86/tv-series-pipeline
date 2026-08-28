'use client';

/**
 * v2.21 P1.4 + v2.24 A/C — Pacing analysis chart (PacingChart).
 *
 * Shows:
 *   - PacingAuditReport (P1.1) — conflict score / reversals / cliffhanger
 *   - StyleAudit history (v2.24 A) — per-shot look score + retry marks
 *   - DialogueCoverageReport (v2.24 C) — missing reverse / missing CU list
 */

import { ChartBar as BarChart3, ArrowRight, Warning as AlertTriangle, CheckCircle as CheckCircle2, TrendUp as TrendingUp, TrendDown as TrendingDown, Minus, Lightbulb, Palette, ChatCircle as MessageCircle, ArrowsClockwise as RefreshCw } from '@phosphor-icons/react';
import { EmptyState } from '@/components/cinema/primitives';
import { useLocale } from '@/hooks/use-locale';

type Polarity = -1 | 0 | 1;

interface ShotReport {
  shotNumber: number;
  conflictScore: number;
  polarity: Polarity;
  warning: string | null;
}

interface HookMetric {
  score: number;
  reasons: string[];
}

interface BgmSyncMetric {
  available: boolean;
  rate: number | null;
  alignedCuts: number;
  totalCuts: number;
  windowS: number;
}

// v10.6.2 — hook-audit trio (opening 3s / episode cliff / BGM hits)
interface HookAuditShape {
  openingHook: HookMetric;
  cliffhanger: HookMetric;
  bgmSync: BgmSyncMetric;
  llmAssisted: boolean;
}

interface PacingReport {
  dramaMode: boolean;
  averageConflictScore: number;
  reversalCount: number;
  reversalDensity: number;
  passed: boolean;
  shots: ShotReport[];
  warnings: string[];
  suggestions: string[];
  hooks?: HookAuditShape;
  /**
   * v12.279: pacing audit v2 diagnostics.
   * Root cause: v12.275 added v2 (curve shape / draggy stretches / opening density / duration rhythm),
   * v12.278 persisted it and exported to NLE, but this component's local interface had no `v2` field —
   * computed, stored, exported, and the UI never showed it.
   */
  v2?: PacingV2Shape;
}

/** v12.279: aligned with lib/pacing-audit-v2 output (render fields only). */
export interface PacingV2Shape {
  shape?: { shape: string; slope: number; peakIndex: number; peakProminence: number; warning: string | null };
  dragSegments?: Array<{ fromShot: number; toShot: number; length: number; avgScore: number }>;
  opening?: { sampled: number; avgScore: number; reversals: number; passed: boolean; warning: string | null };
  durationRhythm?: { sampled: number; mean: number; cv: number; longestRun: number; warning: string | null };
  actionable?: string[];
}

// v2.24 A — Style audit per-shot data (from Storyboard.styleAuditScore etc)
export interface StyleAuditShot {
  shotNumber: number;
  styleAuditScore?: number;     // 0-100
  styleAuditRetried?: boolean;
  styleAuditReason?: string;
}

// v2.24 C — Dialogue coverage report shape
export interface DialogueCoverageReportShape {
  sceneCount: number;
  multiCharSceneCount: number;
  needsReverseShot: Array<{ startIndex: number; endIndex: number; characters: string[] }>;
  needsCloseUp: Array<{ startIndex: number; endIndex: number; characters: string[] }>;
  coverageScore: number;
  warnings: string[];
  rewriteHints: string[];
}

export interface PacingChartProps {
  report: PacingReport | null | undefined;
  /** v2.24 A — per-shot style audit scores for the look-consistency sub-section */
  styleAuditShots?: StyleAuditShot[];
  /** v2.24 C — dialogue coverage report */
  dialogueCoverage?: DialogueCoverageReportShape | null;
}

function scoreColor(score: number): string {
  if (score >= 7) return 'var(--cinema-green)';
  if (score >= 4) return 'var(--cinema-amber)';
  return 'var(--cinema-red)';
}

function PolarityIcon({ p }: { p: Polarity }) {
  if (p === 1) return <TrendingUp className="w-3 h-3" style={{ color: 'var(--cinema-green)' }} />;
  if (p === -1) return <TrendingDown className="w-3 h-3" style={{ color: 'var(--cinema-red)' }} />;
  return <Minus className="w-3 h-3 opacity-40" />;
}

export function PacingChart({ report, styleAuditShots, dialogueCoverage }: PacingChartProps) {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { projectView: Record<string, string> };
  if (!report) {
    return (
      <div className="cinema-card-hi">
        <EmptyState icon={TrendingUp} title={t.projectView.emptyPacing} hint={t.projectView.emptyPacingHint} />
      </div>
    );
  }

  const { shots, averageConflictScore, reversalCount, passed, dramaMode, warnings, suggestions } = report;
  const v2 = report.v2;

  // Reversal pairs — mark adjacent shots with opposite polarity
  const reversalEdges = new Set<number>();
  let lastNonZero: { idx: number; polarity: Polarity } | null = null;
  for (let i = 0; i < shots.length; i++) {
    const p = shots[i].polarity;
    if (p === 0) continue;
    if (lastNonZero && p !== lastNonZero.polarity) {
      reversalEdges.add(lastNonZero.idx); // mark on the right of the previous shot
    }
    lastNonZero = { idx: i, polarity: p };
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cinema-card-hi p-3">
          <div className="cinema-eyebrow mb-1">AVG CONFLICT</div>
          <div className="flex items-baseline gap-1">
            <span className="cinema-headline text-2xl" style={{ color: scoreColor(averageConflictScore) }}>
              {averageConflictScore.toFixed(1)}
            </span>
            <span className="cinema-mono text-[10px] opacity-50">/10</span>
          </div>
          <div className="cinema-mono text-[9px] opacity-40 mt-0.5">
            {dramaMode ? t.projectView.dramaConflictPass : t.projectView.stdConflictPass}
          </div>
        </div>

        <div className="cinema-card-hi p-3">
          <div className="cinema-eyebrow mb-1">REVERSALS</div>
          <div className="flex items-baseline gap-1">
            <span className="cinema-headline text-2xl">{reversalCount}</span>
            <span className="cinema-mono text-[10px] opacity-50">{t.projectView.timesUnit}</span>
          </div>
          <div className="cinema-mono text-[9px] opacity-40 mt-0.5">
            {dramaMode ? t.projectView.dramaReversalPass : t.projectView.stdReversalPass}
          </div>
        </div>

        <div className="cinema-card-hi p-3">
          <div className="cinema-eyebrow mb-1">VERDICT</div>
          <div className="flex items-center gap-1.5">
            {passed ? (
              <>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--cinema-green)' }} />
                <span className="cinema-headline text-base" style={{ color: 'var(--cinema-green)' }}>{t.visionAudit.passLabel}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--cinema-amber)' }} />
                <span className="cinema-headline text-base" style={{ color: 'var(--cinema-amber)' }}>{t.projectView.needsFix}</span>
              </>
            )}
          </div>
          <div className="cinema-mono text-[9px] opacity-40 mt-0.5">
            {dramaMode ? t.projectView.dramaMode : t.projectView.stdMode}
          </div>
        </div>
      </div>

      {/* v10.6.2 — hook-audit trio */}
      {report.hooks && (
        <div className="cinema-card-hi p-4" data-testid="hook-audit">
          <div className="flex items-center justify-between mb-3">
            <div className="cinema-eyebrow">{t.projectView.hookAudit}</div>
            <div className="cinema-mono text-[10px] opacity-50">
              {report.hooks.llmAssisted ? t.projectView.heuristicLlm : t.projectView.heuristicOnly}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="cinema-mono text-[10px] opacity-60 mb-1">{t.projectView.openingHook}</div>
              <div className="flex items-baseline gap-1">
                <span className="cinema-headline text-xl" style={{ color: scoreColor(report.hooks.openingHook.score) }}>
                  {report.hooks.openingHook.score}
                </span>
                <span className="cinema-mono text-[10px] opacity-50">/10</span>
              </div>
            </div>
            <div>
              <div className="cinema-mono text-[10px] opacity-60 mb-1">{t.projectView.episodeCliff}</div>
              <div className="flex items-baseline gap-1">
                <span className="cinema-headline text-xl" style={{ color: scoreColor(report.hooks.cliffhanger.score) }}>
                  {report.hooks.cliffhanger.score}
                </span>
                <span className="cinema-mono text-[10px] opacity-50">/10</span>
              </div>
            </div>
            <div>
              <div className="cinema-mono text-[10px] opacity-60 mb-1">{t.projectView.bgmSync}</div>
              {report.hooks.bgmSync.available && report.hooks.bgmSync.rate !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="cinema-headline text-xl" style={{ color: scoreColor(report.hooks.bgmSync.rate * 10) }}>
                    {Math.round(report.hooks.bgmSync.rate * 100)}%
                  </span>
                  <span className="cinema-mono text-[10px] opacity-50">
                    {t.projectView.cutsCount.replace('{aligned}', String(report.hooks.bgmSync.alignedCuts)).replace('{total}', String(report.hooks.bgmSync.totalCuts))}
                  </span>
                </div>
              ) : (
                <div className="cinema-mono text-[11px] opacity-50">{t.projectView.noBgm}</div>
              )}
            </div>
          </div>
          <ul className="mt-3 space-y-0.5">
            {[...report.hooks.openingHook.reasons.map((r) => t.projectView.openingPrefix.replace('{reason}', r)),
              ...report.hooks.cliffhanger.reasons.map((r) => t.projectView.cliffPrefix.replace('{reason}', r))].map((r, i) => (
              <li key={i} className="cinema-mono text-[10px] opacity-50">· {r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-shot bars + reversal arrows */}
      <div className="cinema-card-hi p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="cinema-eyebrow">PER-SHOT CONFLICT</div>
          <div className="cinema-mono text-[10px] opacity-50">
            {t.projectView.shotsCount.replace('{n}', String(shots.length))}
          </div>
        </div>
        {shots.length === 0 ? (
          <div className="cinema-mono text-[11px] opacity-50 py-4 text-center">
            {t.projectView.noShotData}
          </div>
        ) : (
          <div className="flex items-end gap-1 min-h-[140px]">
            {shots.map((s, i) => {
              const heightPct = Math.max(8, (s.conflictScore / 10) * 100);
              const color = scoreColor(s.conflictScore);
              const isReversal = reversalEdges.has(i);
              return (
                <div key={s.shotNumber} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  {/* Reversal arrow — above this shot's bar */}
                  <div className="h-4 flex items-center justify-center">
                    {isReversal && (
                      <ArrowRight
                        className="w-3 h-3"
                        style={{ color: 'var(--cinema-amber)' }}
                        aria-label={t.projectView.emotionReversalAria}
                      />
                    )}
                  </div>
                  {/* Polarity icon */}
                  <PolarityIcon p={s.polarity} />
                  {/* Bar */}
                  <div
                    className="w-full rounded-t flex items-end justify-center relative group"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: '12px',
                      background: color,
                      opacity: s.warning ? 0.6 : 0.9,
                    }}
                    title={s.warning ?? `Shot ${s.shotNumber}: ${s.conflictScore}/10`}
                  >
                    <span className="cinema-mono text-[9px] text-black/70 font-bold pb-0.5">
                      {s.conflictScore}
                    </span>
                  </div>
                  {/* Shot number */}
                  <div className="cinema-mono text-[10px] opacity-60">{s.shotNumber}</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-3 mt-3 cinema-mono text-[9px] opacity-50">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--cinema-green)' }} /> {t.projectView.strong7}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--cinema-amber)' }} /> {t.projectView.mid46}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--cinema-red)' }} /> {t.projectView.weak4}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <ArrowRight className="w-2.5 h-2.5" style={{ color: 'var(--cinema-amber)' }} /> {t.projectView.reversalPoint}
          </span>
        </div>
      </div>

      {/* v2.24 A: look-consistency sub-section (StyleAudit per-shot scores) */}
      {styleAuditShots && styleAuditShots.length > 0 && (
        <div className="cinema-card-hi p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="cinema-eyebrow flex items-center gap-1.5">
              <Palette className="w-3 h-3" />
              {t.projectView.styleBible}
            </div>
            {(() => {
              const scored = styleAuditShots.filter((s) => s.styleAuditScore != null);
              if (scored.length === 0) return null;
              const avg = scored.reduce((sum, s) => sum + (s.styleAuditScore || 0), 0) / scored.length;
              const retried = styleAuditShots.filter((s) => s.styleAuditRetried).length;
              return (
                <span className="cinema-mono text-[10px] opacity-60">
                  {t.projectView.styleAvg.replace('{avg}', avg.toFixed(0)).replace('{n}', String(retried))}
                </span>
              );
            })()}
          </div>
          <div className="flex items-end gap-1 min-h-[80px]">
            {styleAuditShots.map((s) => {
              const score = s.styleAuditScore;
              if (score == null) {
                return (
                  <div key={s.shotNumber} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full bg-white/5 rounded-t" style={{ height: '20%' }} />
                    <span className="cinema-mono text-[9px] opacity-30">{s.shotNumber}</span>
                  </div>
                );
              }
              const heightPct = Math.max(15, (score / 100) * 100);
              const color = score >= 85 ? 'var(--cinema-green)' : score >= 70 ? 'var(--cinema-amber)' : 'var(--cinema-red)';
              return (
                <div key={s.shotNumber} className="flex-1 flex flex-col items-center gap-1 min-w-0 relative">
                  {s.styleAuditRetried && (
                    <span
                      className="absolute -top-3 cinema-mono text-[10px]"
                      style={{ color: 'var(--cinema-amber)' }}
                      title={t.projectView.retriedTitle.replace('{reason}', s.styleAuditReason || '')}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div
                    className="w-full rounded-t flex items-end justify-center"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: '14px',
                      background: color,
                      opacity: 0.9,
                    }}
                    title={s.styleAuditReason ? `${score}/100: ${s.styleAuditReason}` : `${score}/100`}
                  >
                    <span className="cinema-mono text-[9px] text-black/70 font-bold pb-0.5">{score}</span>
                  </div>
                  <span className="cinema-mono text-[10px] opacity-60">{s.shotNumber}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 cinema-mono text-[9px] opacity-50">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--cinema-green)' }} /> {t.projectView.styleStrong}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--cinema-amber)' }} /> {t.projectView.styleMid}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--cinema-red)' }} /> {t.projectView.styleWeak}
            </span>
            <span className="ml-auto inline-flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5" />vision auto-regen</span>
          </div>
        </div>
      )}

      {/* v2.24 C: dialogue-coverage sub-section */}
      {dialogueCoverage && dialogueCoverage.multiCharSceneCount > 0 && (
        <div className="cinema-card-hi p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="cinema-eyebrow flex items-center gap-1.5">
              <MessageCircle className="w-3 h-3" />
              {t.projectView.dialogueCoverage}
            </div>
            <span
              className={`cinema-mono text-[11px] font-bold ${
                dialogueCoverage.coverageScore >= 80 ? 'text-[var(--cinema-green)]'
                : dialogueCoverage.coverageScore >= 50 ? 'text-[var(--cinema-amber)]'
                : 'text-[var(--cinema-red)]'
              }`}
            >
              {dialogueCoverage.coverageScore}/100
            </span>
          </div>
          <div className="cinema-mono text-[10px] opacity-60 mb-2">
            {t.projectView.dialogueScenes.replace('{scenes}', String(dialogueCoverage.sceneCount)).replace('{multi}', String(dialogueCoverage.multiCharSceneCount))}
          </div>
          {dialogueCoverage.needsReverseShot.length > 0 && (
            <div className="mt-2">
              <div className="cinema-mono text-[10px] opacity-80 mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />{t.projectView.missingReverse.replace('{n}', String(dialogueCoverage.needsReverseShot.length))}
              </div>
              <ul className="space-y-0.5">
                {dialogueCoverage.needsReverseShot.slice(0, 5).map((s, i) => (
                  <li key={i} className="cinema-mono text-[10px] opacity-70">
                    {t.projectView.reverseHint.replace('{n}', String(s.startIndex + 1)).replace('{chars}', s.characters.join(' / '))}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dialogueCoverage.needsCloseUp.length > 0 && (
            <div className="mt-2">
              <div className="cinema-mono text-[10px] opacity-80 mb-1">
                {t.projectView.missingCU.replace('{n}', String(dialogueCoverage.needsCloseUp.length))}
              </div>
              <ul className="space-y-0.5">
                {dialogueCoverage.needsCloseUp.slice(0, 5).map((s, i) => (
                  <li key={i} className="cinema-mono text-[10px] opacity-70">
                    {t.projectView.cuHint.replace('{n}', String(s.startIndex + 1)).replace('{chars}', s.characters.join(' / '))}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dialogueCoverage.rewriteHints.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/5">
              <div className="cinema-mono text-[10px] opacity-60 mb-1">{t.projectView.rewriteHints}</div>
              <ul className="space-y-0.5">
                {dialogueCoverage.rewriteHints.slice(0, 3).map((h, i) => (
                  <li key={i} className="cinema-mono text-[10px] opacity-70">→ {h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* v12.279 pacing audit v2 — before warnings: it names shot numbers, more actionable than generic alerts */}
      {v2 && (
        <div className="cinema-card-hi p-4 space-y-3">
          <div className="cinema-eyebrow flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" />
            {t.projectView.pacingDiagV2}
          </div>

          {/* Curve shape */}
          {v2.shape && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="cinema-mono text-[10px] opacity-60">{t.projectView.curve}</span>
              <span
                className={`cinema-mono text-[11px] px-1.5 py-0.5 rounded ${
                  v2.shape.shape === 'escalating'
                    ? 'bg-[var(--cinema-green,#2ea44f)]/20 text-[var(--cinema-green,#2ea44f)]'
                    : 'bg-[var(--cinema-amber)]/20 text-[var(--cinema-amber)]'
                }`}
              >
                {v2.shape.shape === 'escalating' ? t.projectView.shapeEscalating : v2.shape.shape === 'front-loaded' ? t.projectView.shapeFrontLoaded : v2.shape.shape === 'no-climax' ? t.projectView.shapeNoClimax : t.projectView.shapeFlat}
              </span>
              <span className="cinema-mono text-[10px] opacity-60">
                {t.projectView.slopePeak.replace('{slope}', v2.shape.slope.toFixed(2)).replace('{n}', String(v2.shape.peakIndex))}
              </span>
            </div>
          )}

          {/* Draggy stretches — name the shot ranges first */}
          {v2.dragSegments && v2.dragSegments.length > 0 && (
            <div>
              <div className="cinema-mono text-[10px] opacity-60 mb-1">{t.projectView.dragSegments}</div>
              <div className="flex flex-wrap gap-1.5">
                {v2.dragSegments.map((d, i) => (
                  <span key={i} className="cinema-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--cinema-amber)]/20 text-[var(--cinema-amber)]">
                    {t.projectView.dragRange.replace('{from}', String(d.fromShot)).replace('{to}', String(d.toShot)).replace('{avg}', d.avgScore.toFixed(1))}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Opening density — completion rate is decided here */}
          {v2.opening && (
            <div className="cinema-mono text-[11px]">
              <span className="opacity-60">{t.projectView.opening} </span>
              <span className={v2.opening.passed ? 'opacity-80' : 'text-[var(--cinema-amber)]'}>
                {t.projectView.openingStats.replace('{n}', String(v2.opening.sampled)).replace('{avg}', v2.opening.avgScore.toFixed(1))}
                {v2.opening.passed ? ' ✓' : t.projectView.openingFailNote}
              </span>
            </div>
          )}

          {/* Duration rhythm */}
          {v2.durationRhythm && v2.durationRhythm.sampled >= 3 && (
            <div className="cinema-mono text-[11px]">
              <span className="opacity-60">{t.projectView.durationRhythm} </span>
              <span className={v2.durationRhythm.warning ? 'text-[var(--cinema-amber)]' : 'opacity-80'}>
                {t.projectView.cvLabel.replace('{cv}', v2.durationRhythm.cv.toFixed(2))}
                {v2.durationRhythm.warning ? ` — ${v2.durationRhythm.warning.replace(/^[^—]*—\s*/, '')}` : ' ✓'}
              </span>
            </div>
          )}

          {/* Actionable tips — each names a shot */}
          {v2.actionable && v2.actionable.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-white/10">
              {v2.actionable.map((a, i) => (
                <li key={i} className="cinema-mono text-[11px] leading-relaxed opacity-80">· {a}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="cinema-card-hi p-4 border-[var(--cinema-amber)]/40">
          <div className="cinema-eyebrow mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            WARNINGS ({warnings.length})
          </div>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="cinema-mono text-[11px] leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="cinema-card-hi p-4">
          <div className="cinema-eyebrow mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3" />
            SUGGESTIONS ({suggestions.length})
          </div>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="cinema-mono text-[11px] leading-relaxed opacity-80">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
