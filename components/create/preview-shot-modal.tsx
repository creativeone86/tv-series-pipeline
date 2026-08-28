'use client';

/**
 * components/create/preview-shot-modal (v2.18 P1.3)
 *
 * "Try 1 shot" modal — hits /api/preview-shot, then shows the still + optional
 * 5s video + decide buttons.
 *
 * Path:
 *   create page, next to ROLL → this modal → 30–60s loading → still + video
 *   → user picks: "use this style for the full run" / "try another" / "abandon"
 */

import { useEffect, useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useLocale } from '@/hooks/use-locale';
import { X, CircleNotch as Loader2, ArrowsClockwise as RefreshCw, Check, Sparkle as Sparkles, Warning as AlertTriangle, Clock, Trash as Trash2 } from '@phosphor-icons/react';

interface RateLimit {
  tier: string;
  used: number;
  limit: number;
  remaining: number;
}

interface PreviewResult {
  imageUrl: string;
  videoUrl?: string;
  prompt: string;
  style: string;
  aspect: string;
  elapsedMs: number;
  warnings?: string[];
  rateLimit?: RateLimit;
  historyId?: string;
}

interface HistoryEntry {
  id: string;
  idea: string;
  style: string;
  aspect: string;
  imageUrl: string | null;
  videoUrl: string | null;
  elapsedMs: number;
  createdAt: string;
}

export interface PreviewShotModalProps {
  idea: string;
  style: string;
  aspect: string;
  videoToo?: boolean;
  /**
   * "Use this for the full run" → parent kicks off a complete ROLL.
   *
   * v2.19 P0.2: pass the preview still url up; parent forwards it to
   * /api/create-stream as `previewSeedImage` so shot 1 reuses this frame.
   * null = full run without a seed (e.g. fallback when the modal errors).
   */
  onAccept: (seed: { imageUrl: string; prompt: string } | null) => void;
  onCancel: () => void;
}

export function PreviewShotModal({
  idea, style, aspect, videoToo = true, onAccept, onCancel,
}: PreviewShotModalProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { workshopCreate: Record<string, string> };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [tryWithVideo, setTryWithVideo] = useState(videoToo);
  // v2.18 P2.2: history panel
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [quota, setQuota] = useState<RateLimit | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);

  const refreshHistory = async () => {
    try {
      const res = await fetch('/api/preview-shot/history?limit=20');
      const body = await res.json();
      if (Array.isArray(body?.entries)) setHistory(body.entries);
      if (body?.quota) setQuota(body.quota);
    } catch (e) {
      console.warn('[preview-modal] history fetch failed:', e);
    }
  };

  const fetchPreview = async (withVideo: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRateLimitMsg(null);
    try {
      const res = await fetch('/api/preview-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, style, aspect, videoToo: withVideo }),
      });
      const body = await res.json();
      if (res.status === 429) {
        // Quota exhausted — special copy; still show quota
        setRateLimitMsg(body.error || t.workshopCreate.previewQuotaDone);
        if (body.rateLimit) setQuota(body.rateLimit);
        return;
      }
      if (!res.ok) {
        setError(body.error || t.workshopCreate.requestFailed.replace('{status}', String(res.status)));
        return;
      }
      setResult(body);
      if (body.rateLimit) setQuota(body.rateLimit);
      // Refresh history after success (new row should be first)
      refreshHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.workshopCreate.previewFailed);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    if (!confirm(t.workshopCreate.deletePreviewConfirm)) return;
    try {
      await fetch(`/api/preview-shot/history?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshHistory();
    } catch (e) {
      console.warn('[preview-modal] delete history failed:', e);
    }
  };

  useEffect(() => {
    fetchPreview(tryWithVideo);
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea, style, aspect]);

  // v10.3.6 a11y: Escape + focus trap + restore focus (no prior keyboard close path)
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onCancel);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={t.workshopCreate.previewTitle}
      tabIndex={-1}
    >
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-[var(--cinema-surface)] border border-[var(--cinema-border-hi)] shadow-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="px-5 py-3 border-b border-[var(--cinema-border)] bg-[var(--cinema-surface-2)] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[var(--cinema-amber)] shrink-0" />
            <h3 className="text-sm font-semibold text-[var(--cinema-text)] truncate">
              {t.workshopCreate.previewTitle}
            </h3>
            {result && (
              <span className="cinema-mono text-[10px] opacity-60 hidden sm:inline">
                {(result.elapsedMs / 1000).toFixed(1)}s · {result.style} · {result.aspect}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* v2.18 P2.1: quota chip */}
            {quota && (
              <span
                className={`cinema-chip cinema-mono text-[10px] ${
                  quota.remaining === 0
                    ? 'cinema-chip-amber'
                    : quota.remaining <= 2
                      ? 'cinema-chip-amber'
                      : ''
                }`}
                title={t.workshopCreate.quotaChipTitle.replace('{tier}', quota.tier).replace('{limit}', String(quota.limit))}
              >
                {quota.used}/{quota.limit} · {quota.tier}
              </span>
            )}
            {/* History toggle */}
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`cinema-btn !px-2 !py-1 !text-[11px] inline-flex items-center gap-1 ${showHistory ? 'cinema-btn-primary' : ''}`}
              title={t.workshopCreate.toggleHistory}
            >
              <Clock className="w-3 h-3" />
              {t.workshopCreate.history} {history.length > 0 && `(${history.length})`}
            </button>
            <button
              onClick={onCancel}
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* v2.18 P2.1: quota-exhausted callout */}
          {rateLimitMsg && (
            <div className="cinema-card p-4 border-[var(--cinema-amber)]/50">
              <div className="flex items-center gap-2 cinema-mono text-[12px] text-[var(--cinema-amber)]">
                <AlertTriangle className="w-4 h-4" />
                {rateLimitMsg}
              </div>
              <p className="cinema-mono text-[10px] opacity-60 mt-2">
                {t.workshopCreate.quotaRefreshBefore} <a href="/dashboard/billing" className="underline">{t.workshopCreate.upgradeAccount}</a>{' '}
                {t.workshopCreate.quotaRefreshAfter}
              </p>
            </div>
          )}

          {error && (
            <div className="cinema-card p-4 border-[var(--cinema-red)]/40">
              <div className="flex items-center gap-2 cinema-mono text-[12px] text-[var(--cinema-red)]">
                <AlertTriangle className="w-4 h-4" />
                ✗ {error}
              </div>
              <button
                onClick={() => fetchPreview(tryWithVideo)}
                className="cinema-btn !text-[11px] mt-3 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {t.errors.retry}
              </button>
            </div>
          )}

          {/* v2.18 P2.2: preview history drawer */}
          {showHistory && (
            <div className="cinema-card-hi p-3">
              <div className="cinema-mono text-[10px] tracking-widest opacity-60 mb-2 flex items-center justify-between">
                <span>{t.workshopCreate.historyHeading.replace('{n}', String(history.length))}</span>
                <button
                  onClick={refreshHistory}
                  className="cinema-mono text-[10px] hover:text-[var(--cinema-amber)]"
                >
                  ⟳ {t.workshopCreate.refresh}
                </button>
              </div>
              {history.length === 0 ? (
                <div className="cinema-mono text-[11px] opacity-50">{t.workshopCreate.noHistory}</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {history.map((h) => (
                    <div key={h.id} className="relative group">
                      <div className="aspect-video bg-black/40 rounded overflow-hidden border border-[var(--cinema-border)]">
                        {h.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img loading="lazy" decoding="async" src={h.imageUrl} alt={h.idea.slice(0, 30)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center cinema-mono text-[9px] opacity-40">{t.workshopCreate.noImage}</div>
                        )}
                      </div>
                      <div className="cinema-mono text-[9px] opacity-60 truncate mt-0.5" title={h.idea}>
                        {h.style} · {(h.elapsedMs / 1000).toFixed(0)}s
                      </div>
                      <div className="cinema-mono text-[8px] opacity-40 truncate" title={h.createdAt}>
                        {h.createdAt.slice(5, 16).replace('T', ' ')}
                      </div>
                      <button
                        onClick={() => deleteHistoryEntry(h.id)}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white/70 hover:text-[var(--cinema-red)] opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center gap-3 text-[var(--cinema-text-2)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--cinema-amber)]" />
              <p className="cinema-mono text-[11px] opacity-70">
                {tryWithVideo ? t.workshopCreate.previewLoadingVideo : t.workshopCreate.previewLoadingImage}
              </p>
              <p className="cinema-mono text-[10px] opacity-40">
                {t.workshopCreate.previewLoadingHint}
              </p>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="cinema-card-hi p-3">
                <div className="cinema-mono text-[10px] opacity-50 tracking-widest mb-2">SHOT PREVIEW</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async" 
                  src={result.imageUrl}
                  alt={t.workshopCreate.previewImageAlt}
                  className="w-full rounded border border-[var(--cinema-border)]" />
                {result.videoUrl && (
                  <div className="mt-3">
                    <div className="cinema-mono text-[10px] opacity-50 tracking-widest mb-2">5s VIDEO</div>
                    <video
                      src={result.videoUrl}
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full rounded border border-[var(--cinema-border)]"
                    />
                  </div>
                )}
              </div>

              {result.warnings && result.warnings.length > 0 && (
                <div className="cinema-card p-3 border-[var(--cinema-amber)]/40">
                  <div className="cinema-mono text-[10px] tracking-widest opacity-60 mb-1">WARNINGS</div>
                  {result.warnings.map((w, i) => (
                    <div key={i} className="cinema-mono text-[11px] text-[var(--cinema-amber)]">⚠️ {w}</div>
                  ))}
                </div>
              )}

              <div className="cinema-card p-3">
                <div className="cinema-mono text-[10px] tracking-widest opacity-60 mb-1">USED PROMPT</div>
                <p className="cinema-mono text-[11px] opacity-80 leading-relaxed">{result.prompt}</p>
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-[var(--cinema-border)] bg-[var(--cinema-surface-2)] flex items-center justify-between gap-2 flex-wrap">
          <label className="cinema-mono text-[10px] opacity-60 inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={tryWithVideo}
              onChange={(e) => setTryWithVideo(e.target.checked)}
              disabled={loading}
            />
            {t.workshopCreate.includeVideo}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPreview(tryWithVideo)}
              disabled={loading}
              className="cinema-btn !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {t.workshopCreate.tryAgain}
            </button>
            <button
              onClick={onCancel}
              className="cinema-btn !px-3 !py-1.5 !text-[11px]"
            >
              {t.workshopCreate.abandon}
            </button>
            <button
              onClick={() => {
                if (!result) {
                  onAccept(null);
                  return;
                }
                // v2.19 P0.2: treat this still as shot 1's storyboard so the
                // orchestrator skips the matching Midjourney call on the full run.
                onAccept({ imageUrl: result.imageUrl, prompt: result.prompt });
              }}
              disabled={!result || loading || !!error}
              className="cinema-btn cinema-btn-primary !px-3 !py-1.5 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40"
              title={t.workshopCreate.acceptPreviewHint}
            >
              <Check className="w-3 h-3" />
              {t.workshopCreate.acceptPreview}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
