'use client';

/**
 * v9.4.1 / v9.7.14 — Publish readiness badge (PublishReadinessBadge).
 *
 * Self-contained: GET /api/projects/[id]/publish-readiness, fold the film quality
 * gate into a pass/warn/block bar + reasons + **4-dim quality detail**
 * (picture vs script / consistency / lip-sync ready / measured lip-sync).
 * Mounted at the top of the Film QC tab. Non-destructive: display only.
 * refreshKey change → refetch.
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Warning, XCircle, ShieldCheck } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

interface GateResult {
  level: 'pass' | 'warn' | 'block';
  ready: boolean;
  reasons: string[];
  weakestShots: Array<{ shotNumber: number; score: number }>;
  failedDimensions: string[];
  message: string;
}
interface ReadinessBody {
  gate: GateResult;
  hasAudit?: boolean;
  hasQualityScore?: boolean;
  hasLipSync?: boolean;
  lipSync?: { lines: number; readiness: number; level: string } | null;
  hasLipAudioAlign?: boolean;
  lipAudioAlign?: { measuredShots: number; weakShots: number; avgScore: number } | null;
}

const LEVEL_CFG: Record<GateResult['level'], { cls: string; Icon: typeof CheckCircle }> = {
  pass: { cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', Icon: CheckCircle },
  warn: { cls: 'text-amber-400 border-amber-500/40 bg-amber-500/10', Icon: Warning },
  block: { cls: 'text-rose-400 border-rose-500/40 bg-rose-500/10', Icon: XCircle },
};

type DimStatus = 'ok' | 'weak' | 'na';
const DIM_DOT: Record<DimStatus, string> = { ok: 'bg-emerald-400', weak: 'bg-amber-400', na: 'bg-white/20' };
/** Backend still emits these dimension names; keep matching without Han in source. */
const FD_VISUAL_VS_SCRIPT = '\u753b\u9762\u5bf9\u5267\u672c';
const FD_CONSISTENCY_RE = /\u8fde\u8d2f|\u5149\u5f71|\u8138|\u6210\u7247\u7efc\u5408/;

export function PublishReadinessBadge({ projectId, refreshKey }: { projectId: string; refreshKey?: number }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const DIM_TEXT: Record<DimStatus, string> = { ok: t.projectMisc.dimOk, weak: t.projectMisc.dimWeak, na: t.projectMisc.dimNa };
  const [body, setBody] = useState<ReadinessBody | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/publish-readiness`);
        const b = await res.json();
        if (alive && res.ok) {
          setBody(b as ReadinessBody);
          setShow(Boolean(b.hasAudit || b.hasQualityScore || b.hasLipSync || b.hasLipAudioAlign));
        }
      } catch { /* silent: badge is enhancement */ } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [projectId, refreshKey]);

  if (loading || !body || !show) return null;
  const gate = body.gate;
  const cfg = LEVEL_CFG[gate.level];
  const { Icon } = cfg;
  const fd = body.gate.failedDimensions || [];
  const ls = body.lipSync;
  const la = body.lipAudioAlign;
  const dims = [
    {
      label: t.projectMisc.dimVisualVsScript,
      status: (!body.hasAudit ? 'na' : fd.includes(FD_VISUAL_VS_SCRIPT) ? 'weak' : 'ok') as DimStatus,
    },
    {
      label: t.projectMisc.dimConsistency,
      status: (!body.hasQualityScore ? 'na' : fd.some((d) => FD_CONSISTENCY_RE.test(d)) ? 'weak' : 'ok') as DimStatus,
    },
    {
      label: t.projectMisc.dimLipAlignable,
      status: (!ls || ls.lines === 0 ? 'na' : ls.level === 'pass' ? 'ok' : 'weak') as DimStatus,
      detail: ls && ls.lines > 0 ? t.projectMisc.dimReadyN.replace('{n}', String(ls.readiness)) : undefined,
    },
    {
      label: t.projectMisc.dimLipMeasured,
      status: (!la || la.measuredShots === 0 ? 'na' : (la.weakShots > 0 || la.avgScore < 75) ? 'weak' : 'ok') as DimStatus,
      detail: la && la.measuredShots > 0 ? t.projectMisc.dimAvgScore.replace('{n}', String(la.avgScore)) : undefined,
    },
  ];

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${cfg.cls}`}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span className="text-[10px] uppercase tracking-wider opacity-60">{t.projectMisc.publishGateTitle}</span>
        {!gate.ready && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">{t.projectMisc.notPublishReady}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <Icon className="w-4 h-4 shrink-0" weight="fill" />
        <span className="text-xs font-medium">{gate.message}</span>
      </div>

      {/* v9.7.14 four-dim quality detail */}
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {dims.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DIM_DOT[d.status]}`} />
            <span className="text-white/60">{d.label}</span>
            <span className="ml-auto text-white/40 tabular-nums">{d.detail || DIM_TEXT[d.status]}</span>
          </div>
        ))}
      </div>

      {gate.reasons.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {gate.reasons.slice(0, 4).map((r, i) => (
            <li key={i} className="text-[11px] text-white/60 flex gap-1.5"><span className="opacity-40 shrink-0">·</span><span>{r}</span></li>
          ))}
        </ul>
      )}
      {gate.weakestShots.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-white/40">{t.projectMisc.weakestShotsLabel}</span>
          {gate.weakestShots.map((s) => (
            <span key={s.shotNumber} className="text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">#{s.shotNumber} · {s.score}</span>
          ))}
        </div>
      )}
    </div>
  );
}
