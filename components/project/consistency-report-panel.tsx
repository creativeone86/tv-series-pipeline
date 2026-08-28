'use client';

/**
 * v9.4.5 — Project-level consistency report. Fetches
 * /api/projects/[id]/consistency (lib/consistency-report aggregate), shows
 * latest continuity/lighting/face scores + cross-round sparkline + trend
 * arrows + weakest dim. Mounted on the Film QC tab.
 */
import { useEffect, useState } from 'react';
import { ChartBar } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

type DimKey = 'continuity' | 'lighting' | 'face';
interface Trend { dimension: DimKey; label: string; latest: number; first: number; delta: number; direction: 'up' | 'down' | 'flat'; }
interface Report {
  rounds: number;
  latest: { overall: number; continuity: number; lighting: number; face: number } | null;
  trends: Trend[];
  weakest: { dimension: DimKey; label: string; score: number } | null;
  series: { overall: number; continuity: number; lighting: number; face: number }[];
  message: string;
}

const DIM_COLOR: Record<DimKey, string> = { continuity: '#5BA8FF', lighting: '#E8C547', face: '#4DE0C2' };

function scoreColor(s: number): string {
  if (s >= 75) return 'text-emerald-400';
  if (s >= 50) return 'text-amber-400';
  return 'text-rose-400';
}
function arrow(d: Trend['direction']): { ch: string; cls: string } {
  if (d === 'up') return { ch: '↑', cls: 'text-emerald-400' };
  if (d === 'down') return { ch: '↓', cls: 'text-rose-400' };
  return { ch: '→', cls: 'text-white/40' };
}

export function ConsistencyReportPanel({ projectId, refreshKey }: { projectId: string; refreshKey?: number }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/consistency`);
        const body = await res.json();
        if (alive && res.ok) setReport(body.report as Report);
      } catch { /* silent: enhancement */ }
    })();
    return () => { alive = false; };
  }, [projectId, refreshKey]);

  if (!report || report.rounds === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
          <ChartBar className="w-4 h-4" /> {t.projectMisc.consistencyTrend.replace('{n}', String(report.rounds))}
        </div>
        {report.weakest && (
          <span className="text-[11px] text-white/45">{t.projectMisc.weakestDim.replace('{label}', report.weakest.label).replace('{score}', String(report.weakest.score))}</span>
        )}
      </div>

      <div className="space-y-2.5">
        {report.trends.map((tr) => {
          const a = arrow(tr.direction);
          return (
            <div key={tr.dimension} className="flex items-center gap-3">
              <span className="text-xs text-white/60 w-12 shrink-0">{tr.label}</span>
              {/* sparkline: one bar per round (old → new) */}
              <div className="flex items-end gap-0.5 h-7 flex-1 min-w-0">
                {report.series.map((s, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[2px] rounded-sm"
                    style={{ height: `${Math.max(6, Math.min(100, s[tr.dimension]))}%`, backgroundColor: DIM_COLOR[tr.dimension], opacity: i === report.series.length - 1 ? 1 : 0.4 }}
                    title={t.projectMisc.roundN.replace('{n}', String(i + 1)).replace('{score}', String(s[tr.dimension]))}
                  />
                ))}
              </div>
              <span className={`text-sm font-semibold tabular-nums w-8 text-right ${scoreColor(tr.latest)}`}>{tr.latest}</span>
              {report.rounds > 1 && (
                <span className={`text-[11px] tabular-nums w-10 text-right ${a.cls}`}>
                  {a.ch}{tr.delta > 0 ? '+' : ''}{tr.delta}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-white/45">{report.message}</p>
    </div>
  );
}
