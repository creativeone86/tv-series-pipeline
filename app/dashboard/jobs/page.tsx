'use client';

/**
 * /dashboard/jobs (v10.4.2) — pipeline job queue (progress / dead-letter visible; one-click requeue on failure).
 *
 * In queue mode (PIPELINE_QUEUE=1) create-stream enqueues; this page polls the job table:
 *   queued/running show the stage, failed shows last_error + a "Requeue" button —
 *   requeue keeps attempts → worker resumes from the breakpoint (skips stages that already have artifacts; no double generate/bill).
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowsClockwise as RefreshCw, Queue as QueueIcon, CircleNotch as Loader2 } from '@phosphor-icons/react';
import { getToken } from '@/lib/auth';
import { useLocale } from '@/hooks/use-locale';

interface JobItem {
  id: string;
  type: string;
  projectId: string;
  state: 'queued' | 'running' | 'done' | 'failed';
  step: string;
  attempts: number;
  lastError: string;
  createdAt: string;
  updatedAt: string;
  ideaPreview: string;
}

function authHeaders(): Record<string, string> {
  const tok = getToken();
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export default function JobsPage() {
  const { t: tRaw } = useLocale();
  const t = tRaw as typeof tRaw & { dashMore: Record<string, string> };
  const stateMeta: Record<JobItem['state'], { label: string; cls: string }> = {
    queued: { label: t.dashMore.queued, cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    running: { label: t.dashMore.running, cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    done: { label: t.dashProjects.statusCompleted, cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    failed: { label: t.dashMore.failedDead, cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  };
  const stepLabel: Record<string, string> = {
    director: t.dashMore.stepDirector, styleBible: t.dashMore.stepStyleBible, writer: t.dashMore.stepWriter, design: t.dashMore.stepDesign,
    storyboardPlan: t.product.phaseStoryboardPlans, storyboardRender: t.product.phaseStoryboards, video: t.dashMore.stepVideo,
    editor: t.product.phaseEdit, review: t.product.phaseReview, finalize: t.dashMore.stepFinalize,
  };
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [workerActive, setWorkerActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline-jobs', { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs || []);
      setWorkerActive(!!data.workerActive);
    } catch { /* ignore network jitter; next poll retries */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  const retry = async (id: string) => {
    setRetrying(id);
    try {
      await fetch(`/api/pipeline-jobs/${encodeURIComponent(id)}/retry`, { method: 'POST', headers: authHeaders() });
      await refresh();
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <QueueIcon className="w-5 h-5 text-[#E8C547]" /> {t.sidebar.jobs}
        </h1>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/70 border border-[var(--border)] hover:border-[var(--border-hover)] hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {t.usagePage.refreshTitle}
        </button>
      </div>
      <p className="text-sm text-[var(--muted)] mb-4">
        {t.dashMore.jobsSubtitle}
      </p>

      {!workerActive && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-sm">
          {t.dashMore.queueOffLead}<code className="text-amber-100">PIPELINE_QUEUE=1</code>{t.dashMore.queueOffTail}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/60 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t.common.loading}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-white/60 text-sm py-16 text-center border border-dashed border-[var(--border)] rounded-2xl">
          {t.dashMore.noJobs}
        </div>
      ) : (
        <div className="space-y-2.5">
          {jobs.map((j) => {
            const meta = stateMeta[j.state];
            return (
              <div key={j.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.cls}`}>{meta.label}</span>
                  <span className="text-[11px] text-white/60 font-mono">{j.id}</span>
                  {j.step && (
                    <span className="text-[11px] text-white/70">{t.dashMore.stagePrefix}{stepLabel[j.step] || j.step}</span>
                  )}
                  <span className="text-[11px] text-white/60">{t.dashMore.attemptsN.replace('{n}', String(j.attempts))}</span>
                  <span className="text-[11px] text-white/60 ml-auto">{new Date(j.updatedAt || j.createdAt).toLocaleString()}</span>
                </div>
                {j.ideaPreview && (
                  <p className="mt-1.5 text-xs text-white/70 truncate">{j.ideaPreview}</p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/projects/${encodeURIComponent(j.projectId)}`}
                    className="text-[11px] text-[#E8C547] hover:underline"
                  >
                    {t.dashMore.viewProject}
                  </Link>
                  {j.state === 'failed' && (
                    <>
                      <span className="text-[11px] text-rose-300/90 truncate max-w-[50%]" title={j.lastError}>
                        {j.lastError || t.dashMore.unknownError}
                      </span>
                      <button
                        onClick={() => retry(j.id)}
                        disabled={retrying === j.id}
                        className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-[#E8C547] text-[#0C0C0C] hover:bg-[#D4A830] disabled:opacity-50 transition-colors"
                      >
                        {retrying === j.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {t.dashMore.retryResume}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
