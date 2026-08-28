'use client';

/**
 * components/project/cover-candidates-panel (v9.1.3) — AI vertical cover candidates.
 *
 * One-click 3× 9:16 covers from title + lead + look (MiniMax image-01), each in
 * a 9:16 frame with a dashed title-safe overlay + title preview (title is not
 * burned in). Toggle overlay + per-image download.
 * On mount GET backfills already-stored covers.
 */

import { useEffect, useState } from 'react';
import { ImageSquare, DownloadSimple, Sparkle, Eye, EyeSlash, WarningCircle as AlertCircle, CircleNotch } from '@phosphor-icons/react';
import { getTitleSafeArea, type CoverCandidate, type TitleSafeArea } from '@/lib/cover-candidates';
import { useLocale } from '@/hooks/use-locale';

export function CoverCandidatesPanel({ projectId, title: titleProp }: { projectId: string; title?: string }) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const [candidates, setCandidates] = useState<CoverCandidate[]>([]);
  const [safeArea, setSafeArea] = useState<TitleSafeArea>(getTitleSafeArea());
  const [title, setTitle] = useState(titleProp || '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [degraded, setDegraded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const coverLabel = (c: CoverCandidate) => {
    if (locale !== 'en') return c.label;
    const en: Record<string, string> = {
      portrait: t.projectMisc.coverPortrait,
      dramatic: t.projectMisc.coverDramatic,
      symbolic: t.projectMisc.coverSymbolic,
    };
    return en[c.key] || c.label;
  };

  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/covers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        setCandidates(d.candidates || []);
        if (d.safeArea) setSafeArea(d.safeArea);
        if (d.title) setTitle(d.title);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [projectId]);

  async function generate() {
    setLoading(true); setErr(''); setDegraded(false);
    try {
      const r = await fetch(`/api/projects/${projectId}/covers`, { method: 'POST' });
      const d = await r.json().catch(() => ({} as any));
      if (!r.ok) {
        setErr(d?.error || t.projectMisc.genFailedRetry);
        if (Array.isArray(d?.candidates)) setCandidates(d.candidates);
      } else {
        setCandidates(d.candidates || []);
        if (d.safeArea) setSafeArea(d.safeArea);
        setDegraded(!!d.degraded);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.projectMisc.genFailed);
    } finally {
      setLoading(false);
    }
  }

  const hasImages = candidates.some((c) => c.imageUrl);

  return (
    <div className="cinema-card !p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <span className="cinema-eyebrow flex items-center gap-1.5"><ImageSquare size={13} className="text-[var(--primary)]" /> {t.projectMisc.coverPanelTitle}</span>
        <div className="flex items-center gap-2">
          {hasImages && (
            <button onClick={() => setShowOverlay((v) => !v)} className="cinema-btn-ghost !text-[11px]">
              {showOverlay ? <EyeSlash size={13} /> : <Eye size={13} />} {showOverlay ? t.projectMisc.hideSafeArea : t.projectMisc.showSafeArea}
            </button>
          )}
          <button onClick={generate} disabled={loading} className="cinema-btn-primary !text-[11px]">
            {loading ? <CircleNotch size={13} className="animate-spin" /> : <Sparkle size={13} />}
            {candidates.length ? t.projectMisc.regenCovers : t.projectMisc.genCoverCandidates}
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-1.5 text-[var(--secondary)] text-xs mb-2"><AlertCircle size={13} />{err}</div>}
      {degraded && <div className="cinema-mono text-[10px] text-[var(--primary)] mb-2 opacity-80">{t.projectMisc.coverDegraded}</div>}

      {candidates.length === 0 && !loading && (
        <div className="cinema-mono text-[11px] opacity-50">{t.projectMisc.coverEmptyHint}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {candidates.map((c) => (
          <div key={c.key} className="flex flex-col gap-1.5">
            <div className="relative w-full rounded-lg overflow-hidden border border-[var(--border)] bg-black" style={{ aspectRatio: '9 / 16' }}>
              {c.imageUrl ? (
                <img loading="lazy" decoding="async" src={c.imageUrl} alt={coverLabel(c)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 text-center">
                  <span className="cinema-mono text-[10px] text-[var(--secondary)]">{c.error || t.projectMisc.imageFailed}</span>
                </div>
              )}
              {/* Title-safe overlay (dashed band + title preview; title not burned in) */}
              {c.imageUrl && showOverlay && (
                <div
                  className="absolute border border-dashed border-white/60 flex items-center justify-center px-2 pointer-events-none"
                  style={{ top: `${safeArea.topPct}%`, left: `${safeArea.leftPct}%`, width: `${safeArea.widthPct}%`, height: `${safeArea.heightPct}%` }}
                >
                  <span
                    className="text-white font-bold text-center leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
                    style={{ fontSize: 'clamp(11px, 3vw, 20px)' }}
                  >
                    {title || t.projectMisc.titleSafeZone}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="cinema-mono text-[10px] opacity-60">{coverLabel(c)}</span>
              {c.imageUrl && (
                <a href={c.imageUrl} download target="_blank" rel="noreferrer" className="cinema-btn-ghost !text-[10px] !py-0.5"><DownloadSimple size={12} /> {t.common.download}</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
