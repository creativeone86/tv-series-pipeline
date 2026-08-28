'use client';

/**
 * DecisionLogPanel (v12.199) — per-shot auditable decision log.
 *
 * GET /api/projects/:id/decision-log (v12.37: per-shot engine/cost/consistency
 * + project quality) had no consumer. This panel folds into Monitor: a table of
 * shot / engine / cost / consistency for director / client review.
 * Login required (cookie); no data → quiet empty, no nag.
 */

import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

interface ShotDecision {
  shotNumber: number;
  videoEngine?: string;
  costCny: number;
  engines: string[];
  consistencyScore?: number;
}
interface DecisionLogResp {
  ok?: boolean;
  shots?: ShotDecision[];
  totals?: { totalCostCny: number; shotCount: number };
  quality?: { overall?: number } | null;
}

export function DecisionLogPanel({ projectId }: { projectId: string }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<DecisionLogResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/decision-log`);
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || t.usagePage.loadFailed);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.usagePage.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const shots = data?.shots || [];

  return (
    <div className="cinema-card p-3">
      <button
        type="button"
        onClick={() => { const o = !open; setOpen(o); if (o && !data) void load(); }}
        className="cinema-btn-ghost !text-[11px] !py-1 w-full text-left"
      >
        🧾 {t.projectMisc.decisionLogTitle}
        {data?.totals ? t.projectMisc.decisionLogMeta.replace('{n}', String(data.totals.shotCount)).replace('{cost}', String(data.totals.totalCostCny)) : ''}
        {open ? ' ▲' : ' ▼'}
      </button>
      {open && loading && <div className="mt-2 cinema-mono text-[10px] opacity-60">{t.projectMisc.querying}</div>}
      {open && err && <div className="mt-2 cinema-mono text-[10px] text-[var(--cinema-red)]">{err}</div>}
      {open && !loading && !err && shots.length === 0 && (
        <div className="mt-2 cinema-mono text-[10px] opacity-60">{t.projectMisc.noDecisionData}</div>
      )}
      {open && shots.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[11px] cinema-mono">
            <thead>
              <tr className="opacity-55 text-left">
                <th className="py-1 pr-3">{t.projectMisc.colShot}</th>
                <th className="py-1 pr-3">{t.projectMisc.colEngine}</th>
                <th className="py-1 pr-3">{t.projectMisc.colCost}</th>
                <th className="py-1">{t.projectMisc.colConsistency}</th>
              </tr>
            </thead>
            <tbody>
              {shots.map((s) => (
                <tr key={s.shotNumber} className="border-t border-white/10">
                  <td className="py-1 pr-3">S{s.shotNumber}</td>
                  <td className="py-1 pr-3">{s.videoEngine || s.engines.join('/') || '—'}</td>
                  <td className="py-1 pr-3">¥{s.costCny}</td>
                  <td className="py-1">{typeof s.consistencyScore === 'number' ? s.consistencyScore : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {typeof data?.quality?.overall === 'number' && (
            <div className="mt-2 text-[10px] opacity-70">{t.projectMisc.projectQualityScore.replace('{n}', String(data.quality.overall))}</div>
          )}
        </div>
      )}
    </div>
  );
}
