'use client';

/**
 * /dashboard/comic · comic-to-video panel desk (v12.250 UI → v12.247 /api/comic/panels)
 *
 * Front door for comic-to-video: upload a page → backend projection detects
 * **panels** (bounding boxes) → this page overlays boxes on the original.
 *
 * Honest scope: detect → **crop** (v12.252, sharp crops each panel) → each crop
 * goes to I2V (u2v) for motion → beat-cut into a motion comic. This page does
 * detect + crop + one-click handoff to u2v; stitch reuses video-composer (next).
 * Projection is accurate on strip/regular grids; irregular/spanning layouts
 * miss (needs CV, not supported); backend hint will say so.
 */

import { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, GridFour, Warning as AlertTriangle, CircleNotch as Loader2, Rows, Scissors, FilmReel, Download, FilmSlate, X, Sparkle as Sparkles } from '@phosphor-icons/react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';

interface Panel { x: number; y: number; w: number; h: number; row: number; col: number; }
interface CroppedPanel extends Panel { url: string; }

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

// Panel-box palette (adjacent panels get different colors so they are easy to count).
const BOX_COLORS = ['#E8C547', '#4A7EBB', '#3F8F7A', '#C4576D', '#9B6DC4', '#D4883B'];

export default function ComicPanelsPage() {
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [summary, setSummary] = useState('');
  const [hint, setHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  // v12.252 crop state
  const [cropping, setCropping] = useState(false);
  const [cropped, setCropped] = useState<CroppedPanel[] | null>(null);
  const [cropError, setCropError] = useState('');
  // v12.256 real clips → motion comic: paste I2V clips in panel order, then stitch
  const [dramaClips, setDramaClips] = useState<string[]>([]);
  const [clipDraft, setClipDraft] = useState('');
  const [dramaMusic, setDramaMusic] = useState('');
  const [composing, setComposing] = useState(false);
  const [dramaUrl, setDramaUrl] = useState('');
  const [dramaMusicDropped, setDramaMusicDropped] = useState(false); // music skipped (bad format / >64MB) → honest hint
  const [dramaError, setDramaError] = useState('');
  const { showToast } = useToast();

  const addDramaClip = () => {
    const u = clipDraft.trim();
    if (!u) return;
    if (!/^(https?:\/\/|\/api\/serve-file)/.test(u)) { showToast({ title: t.dashPages.clipUrlInvalid, type: 'error' }); return; }
    setDramaClips((prev) => (prev.includes(u) ? prev : [...prev, u]).slice(0, 30));
    setClipDraft('');
  };

  const composeDrama = async () => {
    if (dramaClips.length < 2) { showToast({ title: t.dashPages.needTwoClips, type: 'error' }); return; }
    setComposing(true);
    setDramaUrl(''); setDramaMusicDropped(false); setDramaError('');
    try {
      const res = await fetch('/api/comic/compose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoClips: dramaClips, musicUrl: dramaMusic.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const msg = body?.message || t.dashPages.composeFailedHttp.replace('{status}', String(res.status));
        setDramaError(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      setDramaUrl(body.finalVideoUrl || '');
      setDramaMusicDropped(!!body.musicDropped);
      showToast({ title: body.musicDropped ? t.dashPages.dramaDoneNoMusic : t.dashPages.dramaDone, type: body.musicDropped ? 'warning' : 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.composeNetwork;
      setDramaError(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setComposing(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast({ title: t.dashPages.imagesOnly, type: 'error' }); return; }
    if (file.size > 10 * 1024 * 1024) { showToast({ title: t.dashPages.imageTooLargeMb.replace('{n}', '10'), type: 'error' }); return; }
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload/character-face', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { showToast({ title: body.error || t.product.dropFailed, type: 'error' }); return; }
      resetResult();
      setImageUrl(body.url);
      setImagePreview(body.url);
    } catch (e) {
      // Transport/offline: fetch throws; without a catch it is a silent rejection.
      showToast({ title: e instanceof Error ? e.message : t.dashPages.uploadNetwork, type: 'error' });
    }
  };

  const acceptUrl = async () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) { showToast({ title: t.dashPages.urlMustHttp, type: 'error' }); return; }
    try {
      const res = await fetch('/api/upload/character-face', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: trimmed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { showToast({ title: body.error || t.dashPages.urlFetchFailed, type: 'error' }); return; }
      resetResult();
      setImageUrl(body.url);
      setImagePreview(body.url);
      setShowUrlInput(false);
      setUrlDraft('');
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : t.dashPages.urlFetchNetwork, type: 'error' });
    }
  };

  const resetResult = () => { setPanels(null); setSummary(''); setHint(''); setErrorMsg(''); setNatural(null); setCropped(null); setCropError(''); };

  const detect = async () => {
    if (!imageUrl) { showToast({ title: t.dashPages.needComicImage, type: 'error' }); return; }
    setDetecting(true);
    setPanels(null); setErrorMsg(''); setHint(''); setCropped(null); setCropError('');
    try {
      const res = await fetch('/api/comic/panels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.message || t.dashPages.panelFailedHttp.replace('{status}', String(res.status));
        setErrorMsg(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      setPanels(body.panels || []);
      setSummary(body.summary || '');
      setHint(body.hint || '');
      showToast({ title: t.dashPages.panelsDetected.replace('{n}', String(body.panelCount)), type: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.panelNetwork;
      setErrorMsg(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setDetecting(false);
    }
  };

  /** Crop each detected panel from the original so it can feed I2V. */
  const crop = async () => {
    if (!imageUrl) return;
    setCropping(true);
    setCropped(null); setCropError('');
    try {
      const res = await fetch('/api/comic/crop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const msg = body?.message || t.dashPages.cropFailedHttp.replace('{status}', String(res.status));
        setCropError(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      const list: CroppedPanel[] = Array.isArray(body.panels) ? body.panels : [];
      setCropped(list);
      if (list.length === 0) {
        // 0 panels is not "successfully cropped 0" — surface the backend hint as warning.
        const msg = body.hint || t.dashPages.cropNoneHint;
        setCropError(msg); showToast({ title: t.dashPages.cropNone, type: 'warning' });
      } else {
        showToast({ title: t.dashPages.croppedN.replace('{n}', String(body.count)), type: 'success' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.cropNetwork;
      setCropError(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GridFour className="w-6 h-6 text-[#E8C547]" weight="duotone" />
          {t.dashPages.comicTitle}
        </h1>
        <p className="text-sm text-[var(--soft)] mt-1">
          {t.dashPages.comicSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.comicImage}</label>
          <div
            onClick={() => !imagePreview && fileRef.current?.click()}
            className={`aspect-[3/4] max-h-[420px] rounded-xl overflow-hidden flex items-center justify-center border relative ${
              imagePreview ? 'border-[#E8C547]/30 bg-black/20' : 'cursor-pointer border-dashed border-white/15 bg-white/[0.02] hover:bg-white/5'
            }`}
          >
            {imagePreview ? (
              // Original + panel boxes. Boxes use percent so they scale with any display size.
              <div className="relative w-full h-full">
                <img
                  loading="lazy" decoding="async" src={imagePreview} alt="comic"
                  className="w-full h-full object-contain"
                  onLoad={e => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                />
                {panels && natural && natural.w > 0 && natural.h > 0 && panels.map((p, i) => (
                  <div
                    key={i}
                    className="absolute border-2 grid place-items-start"
                    style={{
                      left: `${(p.x / natural.w) * 100}%`, top: `${(p.y / natural.h) * 100}%`,
                      width: `${(p.w / natural.w) * 100}%`, height: `${(p.h / natural.h) * 100}%`,
                      borderColor: BOX_COLORS[i % BOX_COLORS.length],
                      boxShadow: `inset 0 0 0 9999px ${BOX_COLORS[i % BOX_COLORS.length]}12`,
                    }}
                  >
                    <span className="text-[10px] font-mono font-bold px-1 rounded-br" style={{ background: BOX_COLORS[i % BOX_COLORS.length], color: '#000' }}>
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[var(--soft)]">
                <Upload className="w-7 h-7 mx-auto mb-1 opacity-50" />
                <div className="text-xs">{t.dashPages.clickOrUrl}</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); if (fileRef.current) fileRef.current.value = ''; }} />
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> {t.dashPages.uploadFile}
            </button>
            <button onClick={() => setShowUrlInput(v => !v)} className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center justify-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" /> {t.dashPages.useUrl}
            </button>
          </div>
          {showUrlInput && (
            <div className="flex gap-1">
              <input type="url" value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') acceptUrl(); }} placeholder="https://..."
                className="flex-1 px-2 py-1 text-xs bg-black/30 border border-white/10 rounded focus:outline-none focus:border-[#E8C547]/50" />
              <button onClick={acceptUrl} disabled={!urlDraft.trim()} className="px-3 py-1 text-xs rounded bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547]/25 disabled:opacity-40">{t.dashPages.fetchUrl}</button>
            </div>
          )}

          <button
            onClick={detect}
            disabled={detecting || !imageUrl}
            className="w-full px-4 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center justify-center gap-2"
          >
            {detecting ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.detecting}</>) : (<><Rows className="w-4 h-4" weight="bold" /> {t.dashPages.autoDetect}</>)}
          </button>
        </div>

        {/* Result */}
        <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5">
          <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.panelResult}</label>
          {errorMsg ? (
            <div className="mt-3 text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
              <div className="text-sm text-rose-300 mb-1">{t.dashPages.panelFailed}</div>
              <div className="text-[11px] text-white/50">{errorMsg}</div>
            </div>
          ) : panels ? (
            <div className="mt-3">
              <div className="text-sm text-white font-medium mb-3">{summary}</div>
              {panels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs tabular-nums">
                    <thead>
                      <tr className="text-[var(--soft)] text-left border-b border-white/10">
                        <th className="py-1.5 pr-3 font-medium">{t.dashPages.colPanel}</th>
                        <th className="py-1.5 pr-3 font-medium">{t.dashPages.colRowCol}</th>
                        <th className="py-1.5 pr-3 font-medium">x,y</th>
                        <th className="py-1.5 font-medium">{t.dashPages.colSize}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {panels.map((p, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="py-1.5 pr-3">
                            <span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: BOX_COLORS[i % BOX_COLORS.length] }} />
                            <span className="text-white align-middle">{i + 1}</span>
                          </td>
                          <td className="py-1.5 pr-3 text-[var(--muted)]">{p.row}/{p.col}</td>
                          <td className="py-1.5 pr-3 text-[var(--muted)]">{p.x},{p.y}</td>
                          <td className="py-1.5 text-[var(--muted)]">{p.w}×{p.h}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[13px] text-[var(--soft)] py-4">{t.dashPages.noPanels}</div>
              )}
              {hint && <p className="text-[11px] text-amber-300/80 mt-3 leading-relaxed">⚠ {hint}</p>}

              {/* v12.252 crop: real images per panel, then one-click I2V */}
              {panels.length > 0 && (
                <button
                  onClick={crop}
                  disabled={cropping}
                  className="mt-4 w-full px-4 py-2 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center justify-center gap-2 text-sm"
                >
                  {cropping ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.cropping}</>) : (<><Scissors className="w-4 h-4" weight="bold" /> {t.dashPages.cropPanels}</>)}
                </button>
              )}
              {cropError && <div className="mt-2 text-[12px] text-rose-300">✕ {cropError}</div>}

              {cropped && cropped.length > 0 && (
                <div className="mt-4">
                  <div className="text-[12px] text-white font-medium mb-2">{t.dashPages.croppedList.replace('{n}', String(cropped.length))}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cropped.map((c, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        <img loading="lazy" decoding="async" src={c.url} alt={t.dashPages.panelAlt.replace('{n}', String(i + 1))} className="w-full h-auto object-contain bg-black/30" />
                        <div className="flex items-center justify-between px-2 py-1.5 gap-1">
                          <span className="text-[10px] text-[var(--soft)]">{t.dashPages.panelN.replace('{n}', String(i + 1))}</span>
                          <div className="flex items-center gap-1.5">
                            <a href={c.url} target="_blank" rel="noopener" title={t.dashPages.downloadPanel} className="text-[var(--soft)] hover:text-white"><Download className="w-3.5 h-3.5" /></a>
                            <Link
                              href={`/dashboard/u2v?image=${encodeURIComponent(c.url)}`}
                              title={t.dashPages.sendToU2v}
                              className="inline-flex items-center gap-1 text-[10px] text-[#E8C547] hover:text-[#E8C547]/80"
                            >
                              <FilmReel className="w-3.5 h-3.5" /> {t.dashPages.motionFx}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-[var(--soft)] mt-3 opacity-70 leading-relaxed">
                {t.dashPages.comicFlowHint}
              </p>

              {/* v12.256 real clips → motion comic: paste I2V clips in reading order + optional music */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <FilmSlate className="w-4 h-4 text-[#E8C547]" weight="duotone" />
                  <span className="text-sm text-white font-medium">{t.dashPages.dramaTitle}</span>
                </div>
                <p className="text-[11px] text-[var(--soft)] mb-3 opacity-70 leading-relaxed">
                  {t.dashPages.dramaHint}
                </p>

                {dramaClips.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {dramaClips.map((u, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] bg-black/25 rounded px-2 py-1">
                        <span className="w-4 h-4 rounded bg-[#E8C547]/15 text-[#E8C547] grid place-items-center font-mono shrink-0">{i + 1}</span>
                        <span className="flex-1 truncate text-[var(--muted)]" title={u}>{u}</span>
                        <button onClick={() => setDramaClips((prev) => prev.filter((_, j) => j !== i))} title={t.dashPages.remove} className="text-[var(--soft)] hover:text-rose-300"><X className="w-3 h-3" /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="url" value={clipDraft} onChange={e => setClipDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addDramaClip(); }}
                    placeholder={t.dashPages.clipUrlPh}
                    className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded text-xs focus:outline-none focus:border-[#E8C547]/50"
                  />
                  <button onClick={addDramaClip} disabled={!clipDraft.trim()} className="px-3 py-1 text-xs rounded bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547]/25 disabled:opacity-40">{t.dashPages.addClip}</button>
                </div>
                <input
                  type="url" value={dramaMusic} onChange={e => setDramaMusic(e.target.value)}
                  placeholder={t.dashPages.musicUrlPh}
                  className="w-full px-3 py-2 mb-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-xs"
                />
                <button
                  onClick={composeDrama}
                  disabled={composing || dramaClips.length < 2}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center justify-center gap-2 text-sm"
                >
                  {composing ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.stitching}</>) : (<><FilmSlate className="w-4 h-4" weight="bold" /> {t.dashPages.composeDrama.replace('{n}', String(dramaClips.length))}</>)}
                </button>
                {dramaError && <div className="mt-2 text-[12px] text-rose-300">✕ {dramaError}</div>}
                {dramaUrl && (
                  <div className="mt-4">
                    <div className="text-[12px] text-emerald-400 mb-2 inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" weight="duotone" /> {t.dashPages.dramaReady}</div>
                    {dramaMusicDropped && (
                      <div className="text-[11px] text-amber-300/85 mb-2">{t.dashPages.musicDroppedHint}</div>
                    )}
                    <video src={dramaUrl} controls className="w-full rounded-xl bg-black/40 max-h-[460px]" />
                    <a href={dramaUrl} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white">
                      <Download className="w-3.5 h-3.5" /> {t.dashPages.openDownloadDrama}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-center text-[var(--soft)] text-sm opacity-60 py-10">
              {t.dashPages.comicEmpty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
