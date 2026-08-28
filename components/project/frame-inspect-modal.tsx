'use client';

/**
 * Per-frame inspect modal — v12.330.
 *
 * Why this revision is “wiring”, not a new feature
 * v12.315 built clip retake (API + take history), v12.328 built frame inspect
 * (API) — **both backend-only**. Shipping capability with no UI is the same
 * failure. This revision wires them together as **one thing**:
 *
 *   flip frames → box the bad beat → hand off to retake (range from server
 *   `retakeHint`, not computed on the client)
 *
 * Deliberate restraint: the client does not convert time
 * Frame → seconds is **all server-side** (`frameRangeToSeconds`, shared with
 * `planSegmentRetake` via the same `snapToFrame`). If the client did `i / fps`
 * it would be a third snap convention — user clicks frame 47, server cuts from
 * 46.5, and the error is invisible except a one-frame hitch. So we send
 * **frame numbers**; seconds always come back from the server.
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

interface FrameItem {
  frameIndex: number;
  atSec: number;
  url: string;
}

interface StripResponse {
  shotNumber: number;
  durationS: number;
  fps: number;
  thinned: boolean;
  step: number;
  frames: FrameItem[];
  failedFrames: number[];
  retakeHint: { fromS: number; toS: number } | null;
}

export interface FrameInspectModalProps {
  projectId: string;
  shotNumber: number;
  shotTitle?: string;
  onClose: () => void;
  /** Confirm retake — range comes from the server, not computed here */
  onRetake?: (range: { fromS: number; toS: number; fromFrame: number; toFrame: number }) => void;
}

export function FrameInspectModal({
  projectId, shotNumber, shotTitle, onClose, onRetake,
}: FrameInspectModalProps) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const [data, setData] = useState<StripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /** Selection endpoints (frame numbers); a single click = one frame */
  const [anchor, setAnchor] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [range, setRange] = useState<{ fromS: number; toS: number } | null>(null);
  const [ranging, setRanging] = useState(false);

  const load = useCallback(async (from?: number, to?: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ shot: String(shotNumber) });
      if (from != null) qs.set('from', String(from));
      if (to != null) qs.set('to', String(to));
      const r = await fetch(`/api/projects/${projectId}/frame-strip?${qs}`);
      const j = await r.json();
      if (!r.ok) { setError(j?.error || t.projectPanels.loadFailedHttp.replace('{status}', String(r.status))); setData(null); return; }
      setData(j as StripResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.projectPanels.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [projectId, shotNumber, t.projectPanels]);

  useEffect(() => { void load(); }, [load]);

  const lo = anchor != null && focus != null ? Math.min(anchor, focus) : anchor;
  const hi = anchor != null && focus != null ? Math.max(anchor, focus) : anchor;

  /** After frames are picked, ask the server for the second range — client does no conversion */
  const resolveRange = useCallback(async () => {
    if (lo == null || hi == null || !data) return;
    setRanging(true);
    try {
      const qs = new URLSearchParams({
        shot: String(shotNumber),
        from: String(lo / data.fps),
        to: String((hi + 1) / data.fps),
        max: '2',
      });
      const r = await fetch(`/api/projects/${projectId}/frame-strip?${qs}`);
      const j = await r.json();
      if (r.ok && j?.retakeHint) setRange(j.retakeHint);
      else setError(j?.error || t.projectPanels.rangeFailed);
    } finally {
      setRanging(false);
    }
  }, [lo, hi, data, projectId, shotNumber, t.projectPanels]);

  useEffect(() => { setRange(null); }, [anchor, focus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-white/10 bg-neutral-950 text-neutral-100">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <h2 className="text-base font-medium">
              {t.projectPanels.inspectTitle.replace('{n}', String(shotNumber))}
              {shotTitle ? <span className="ml-2 text-sm text-neutral-400">{shotTitle}</span> : null}
            </h2>
            {data && (
              <p className="mt-1 text-xs text-neutral-400">
                {data.durationS.toFixed(3)}s · {data.fps}fps
                {/* Thinning must be stated, or users think they are seeing every frame */}
                {data.thinned && <span className="ml-2 text-amber-400">{t.projectPanels.thinned.replace('{n}', String(data.step))}</span>}
                {data.failedFrames.length > 0 && (
                  <span className="ml-2 text-amber-400">{t.projectPanels.decodeFailed.replace('{n}', String(data.failedFrames.length))}</span>
                )}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-neutral-400 hover:bg-white/10" aria-label={t.product.close}>✕</button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {loading && <p className="text-sm text-neutral-400">{t.projectPanels.extracting}</p>}
          {error && (
            <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          {data && data.frames.length === 0 && !loading && !error && (
            <p className="text-sm text-neutral-400">{t.projectPanels.noFrames}</p>
          )}
          {data && data.frames.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
              {data.frames.map((f) => {
                const selected = lo != null && hi != null && f.frameIndex >= lo && f.frameIndex <= hi;
                return (
                  <button
                    key={f.frameIndex}
                    onClick={() => {
                      if (anchor == null || (anchor != null && focus != null)) { setAnchor(f.frameIndex); setFocus(null); }
                      else setFocus(f.frameIndex);
                    }}
                    className={`overflow-hidden rounded border text-left transition ${
                      selected ? 'border-amber-400 ring-1 ring-amber-400' : 'border-white/10 hover:border-white/30'
                    }`}
                    aria-pressed={selected}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={t.projectPanels.frameAlt.replace('{n}', String(f.frameIndex))} className="block w-full" loading="lazy" />
                    <span className="block px-1.5 py-1 font-mono text-[11px] text-neutral-400">
                      #{f.frameIndex} · {f.atSec.toFixed(3)}s
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-white/10 px-5 py-3">
          <span className="text-xs text-neutral-400">
            {lo == null
              ? t.projectPanels.pickStart
              : hi !== lo
                ? t.projectPanels.selectedRange.replace('{lo}', String(lo)).replace('{hi}', String(hi))
                : t.projectPanels.selectedOne.replace('{lo}', String(lo))}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {lo != null && (
              <button onClick={() => { setAnchor(null); setFocus(null); }}
                className="rounded border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">{t.projectPanels.clearSelection}</button>
            )}
            {lo != null && !range && (
              <button onClick={() => void resolveRange()} disabled={ranging}
                className="rounded border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50">
                {ranging ? t.projectPanels.ranging : t.projectPanels.resolveRange}
              </button>
            )}
            {range && (
              <>
                <span className="font-mono text-xs text-amber-300">
                  {range.fromS.toFixed(3)}s → {range.toS.toFixed(3)}s
                </span>
                <button
                  onClick={() => onRetake?.({ ...range, fromFrame: lo!, toFrame: hi! })}
                  className="rounded bg-amber-400 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-amber-300"
                >
                  {t.projectPanels.useForRetake}
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
