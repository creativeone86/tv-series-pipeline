'use client';

/**
 * v3.x P0.3 E.3 — ReviewStatusBadge
 *
 * Shows the project's review status + actions (submit / approve / request changes / withdraw).
 * Embedded on the right of the project page nav bar.
 */

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle as CheckCircle2, Warning as AlertTriangle, CircleNotch as Loader2, PaperPlaneTilt as Send, X as XIcon, Eye, ArrowCounterClockwise as RotateCcw } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocale } from '@/hooks/use-locale';

type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'changes_requested';

interface ReviewStatusData {
  projectId: string;
  status: ReviewStatus;
  submittedByUserId: string | null;
  submittedAt: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  updatedAt: string;
}

interface ReviewStatusBadgeProps {
  projectId: string;
  currentUserId?: string | null;
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'DRAFT', color: 'opacity-60', icon: RotateCcw },
  in_review: { label: 'IN REVIEW', color: 'text-[var(--cinema-amber)]', icon: Eye },
  approved: { label: 'APPROVED', color: 'text-[var(--cinema-green)]', icon: CheckCircle2 },
  changes_requested: { label: 'CHANGES REQUESTED', color: 'text-[var(--cinema-red)]', icon: AlertTriangle },
};

export function ReviewStatusBadge({ projectId, currentUserId }: ReviewStatusBadgeProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [data, setData] = useState<ReviewStatusData | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/review-status`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const transit = async (action: 'submit' | 'approve' | 'request_changes' | 'withdraw') => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/review-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || t.seriesDetail.resumeFailStatus.replace('{status}', String(res.status)));
        return;
      }
      setData(body);
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t.seriesDetail.requestFailed);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return null;
  const cfg = STATUS_CONFIG[data.status];
  const Icon = cfg.icon;
  const isSubmitter = currentUserId && currentUserId === data.submittedByUserId;
  const canApprove = data.status === 'in_review' && !isSubmitter;
  const canRequestChanges = data.status === 'in_review' && !isSubmitter;
  const canSubmit = data.status === 'draft' || data.status === 'changes_requested';
  const canWithdraw = data.status === 'in_review' && isSubmitter;

  return (
    <Popover>
      <PopoverTrigger
        className={`cinema-chip inline-flex items-center gap-1 cursor-pointer hover:bg-white/5 ${cfg.color}`}
        title={t.projectMisc.reviewStatusTitle.replace('{label}', cfg.label)}
      >
        <Icon className="w-3 h-3" />
        <span className="cinema-mono text-[10px]">{cfg.label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-2">
        <div className="cinema-eyebrow flex items-center gap-1">
          <Icon className="w-3 h-3" />
          REVIEW STATE
        </div>
        <div className="cinema-mono text-[10px] opacity-70 space-y-0.5">
          <div>{t.projectMisc.currentLabel}<span className={cfg.color}>{cfg.label}</span></div>
          {data.submittedAt && (
            <div>{t.projectMisc.submittedLabel}{new Date(data.submittedAt).toLocaleString()}</div>
          )}
          {data.reviewedAt && (
            <div>{t.projectMisc.reviewedLabel}{new Date(data.reviewedAt).toLocaleString()}</div>
          )}
          {data.reviewNote && (
            <div className="mt-1 p-1.5 bg-white/5 rounded">
              <div className="opacity-60">{t.projectMisc.reviewNoteLabel}</div>
              <div className="text-white/80">{data.reviewNote}</div>
            </div>
          )}
        </div>

        {/* note input (approve or request changes) */}
        {(canApprove || canRequestChanges || canWithdraw) && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            rows={2}
            maxLength={500}
            placeholder={canRequestChanges ? t.projectMisc.changesNoteRequired : t.projectMisc.noteOptional}
            className="w-full px-2 py-1 cinema-mono text-[11px] bg-[var(--cinema-surface-2)] border border-[var(--cinema-border)] rounded resize-y focus:outline-none focus:border-[var(--cinema-amber)] disabled:opacity-50"
          />
        )}

        {error && (
          <div className="cinema-mono text-[10px] text-[var(--cinema-red)]">{error}</div>
        )}

        <div className="flex flex-wrap gap-1">
          {canSubmit && (
            <button
              onClick={() => transit('submit')}
              disabled={busy}
              className="cinema-btn cinema-btn-primary !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
              {t.projectMisc.submitReview}
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => transit('approve')}
              disabled={busy}
              className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-40 text-[var(--cinema-green)]"
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              {t.visionAudit.passLabel}
            </button>
          )}
          {canRequestChanges && (
            <button
              onClick={() => transit('request_changes')}
              disabled={busy || !note.trim()}
              className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-40 text-[var(--cinema-red)]"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {t.projectMisc.requestChanges}
            </button>
          )}
          {canWithdraw && (
            <button
              onClick={() => transit('withdraw')}
              disabled={busy}
              className="cinema-btn !px-2 !py-1 !text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
            >
              <XIcon className="w-2.5 h-2.5" />
              {t.projectMisc.withdraw}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
