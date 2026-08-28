'use client';

/**
 * v3.4.1 — Vision Audit tab container.
 *
 * Wraps VisionAuditPanel + data fetch + "Run QC" button. Mounted on the
 * project page "Film QC" tab.
 * GET /api/projects/[id]/vision-audit reads history; POST .../run starts a new
 * round (burns tokens).
 */

import { useCallback, useEffect, useState } from 'react';
import { CircleNotch as Loader2, Scan as ScanEye, ArrowsClockwise as RefreshCw } from '@phosphor-icons/react';
import { VisionAuditPanel, type VisionAuditShot, type VisionAuditSummaryShape } from './vision-audit-panel';
import { PublishReadinessBadge } from './publish-readiness-badge';
import { ConsistencyReportPanel } from './consistency-report-panel';
import { LipSyncPanel } from './lipsync-panel';
import { useLocale } from '@/hooks/use-locale';

export function VisionAuditTab({ projectId, onJumpToWorkshop }: { projectId: string; onJumpToWorkshop?: (shotNumbers: number[]) => void }) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [audits, setAudits] = useState<VisionAuditShot[]>([]);
  const [summary, setSummary] = useState<VisionAuditSummaryShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [readyKey, setReadyKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/vision-audit`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setAudits(body.audits || []);
      setSummary(body.summary || null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const runAudit = useCallback(async () => {
    setRunning(true);
    setRunMsg(null);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('qfmj-token') : null;
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/vision-audit/run`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setAudits(body.audits || []);
      setSummary(body.summary || null);
      setRunMsg(
        t.projectMisc.auditDoneMsg.replace('{scored}', String(body.scored)).replace('{requested}', String(body.requested))
        + (body.skipped ? t.projectMisc.auditSkippedSuffix.replace('{n}', String(body.skipped)) : ''),
      );
      setReadyKey((k) => k + 1); // QC data changed → refresh publish-readiness badge
    } catch (e) {
      setError(e instanceof Error ? e.message : t.projectMisc.auditRunFailed);
    } finally {
      setRunning(false);
    }
  }, [projectId, t.projectMisc.auditDoneMsg, t.projectMisc.auditRunFailed, t.projectMisc.auditSkippedSuffix]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="cinema-eyebrow flex items-center gap-1.5">
          <ScanEye className="w-3.5 h-3.5" />
          {t.projectMisc.auditTabTitle}
        </div>
        <button
          onClick={runAudit}
          disabled={running}
          className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {running ? t.projectMisc.auditRunning : audits.length > 0 ? t.projectMisc.auditRerun : t.projectMisc.auditRun}
        </button>
      </div>

      {runMsg && <div className="text-[11px] text-emerald-400">{runMsg}</div>}
      {error && <div className="text-[11px] text-rose-400">✗ {error}</div>}

      <PublishReadinessBadge projectId={projectId} refreshKey={readyKey} />

      <ConsistencyReportPanel projectId={projectId} refreshKey={readyKey} />

      <LipSyncPanel projectId={projectId} onJumpToWorkshop={onJumpToWorkshop} />

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t.seriesDetail.loading}
        </div>
      ) : (
        <VisionAuditPanel
          audits={audits}
          summary={summary}
          onShotClick={(n) => onJumpToWorkshop?.([n])}
          onReshootWeak={(shots) => onJumpToWorkshop?.(shots)}
        />
      )}
    </div>
  );
}
