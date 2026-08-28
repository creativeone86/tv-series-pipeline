'use client';

/**
 * /dashboard/mv · MV beat-plan desk (v12.250 UI → v12.246 /api/mv/plan)
 *
 * Front door for MV mode: music duration + BPM (+ optional sections) → backend
 * builds a **beat-locked shot timeline** (each shot lands on a beat, chorus
 * densifies, last shot hugs the end). This page visualizes it as a color strip + table.
 *
 * Honest scope: this page only outputs **shot planning** (cut points). Picture
 * per shot → beat-cut assemble reuses generateImage / u2v / video-composer (next;
 * labeled as such in-page).
 */

import { useEffect, useRef, useState } from 'react';
import { MusicNotes, Sparkle as Sparkles, Waveform, Warning as AlertTriangle, CircleNotch as Loader2, Upload, Images, FilmSlate, Download, X } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast-provider';
import { useLocale } from '@/hooks/use-locale';

interface MvShot {
  index: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  section: string;
  onBeat: boolean;
}

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

// Section colors — chorus brightest (gold), verse next, bridge/intro/outro cooler (matches "chorus densify").
const SECTION_COLOR: Record<string, string> = {
  chorus: '#E8C547',
  verse: '#4A7EBB',
  bridge: '#9B6DC4',
  intro: '#3F8F7A',
  outro: '#8A6D3B',
  unknown: '#555',
};

export default function MvPlanPage() {
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const sectionLabel = (sec: string) => t.dashPages[`mvSec_${sec}`] || sec;
  const [durationSec, setDurationSec] = useState(60);
  const [bpm, setBpm] = useState(120);
  const [beatsPerShot, setBeatsPerShot] = useState(8);
  const [planning, setPlanning] = useState(false);
  const [shots, setShots] = useState<MvShot[] | null>(null);
  const [summary, setSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  // v12.253 compose state
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  // v12.254 real video clips: if set, each clip is beat-cut; else ken-burns stills
  const [videoClips, setVideoClips] = useState<string[]>([]);
  const [clipDraft, setClipDraft] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [composing, setComposing] = useState(false);
  const [mvUrl, setMvUrl] = useState('');
  const [mvDuration, setMvDuration] = useState(0); // actual duration vs planned (short clips shorten the film)
  const [mvMusicDropped, setMvMusicDropped] = useState(false); // music skipped (bad format / >64MB) → honest hint
  const [composeError, setComposeError] = useState('');
  // Compose uses a **snapshot of params at plan time**, not live inputs — otherwise
  // changing BPM without re-planning yields a shot count that does not match the strip
  // yet still toasts "compose done" (review medium).
  const [plannedParams, setPlannedParams] = useState<{ durationSec: number; bpm: number; beatsPerShot: number } | null>(null);
  const imgRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  // v12.255: support ?clip=<url> prefill (I2V result page "add to MV").
  // Read window.location to avoid useSearchParams Suspense; only serve-file / http(s) (no data: for video).
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('clip');
      if (q && /^(\/api\/serve-file|https?:)/.test(q)) {
        setVideoClips((prev) => (prev.includes(q) ? prev : [...prev, q]).slice(0, 40));
      }
    } catch { /* noop */ }
  }, []);

  const plan = async () => {
    setPlanning(true);
    setErrorMsg('');
    setShots(null);
    setMvUrl(''); setMvDuration(0); setMvMusicDropped(false); setComposeError('');
    try {
      const res = await fetch('/api/mv/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicDurationSec: durationSec, bpm, beatsPerShot }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.message || t.dashPages.planFailedHttp.replace('{status}', String(res.status));
        setErrorMsg(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      setShots(body.shots || []);
      setSummary(body.summary || '');
      setPlannedParams({ durationSec, bpm, beatsPerShot }); // snapshot: compose uses this, matches the strip
      showToast({ title: t.dashPages.plannedShots.replace('{n}', String(body.shotCount)), type: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.planNetwork;
      setErrorMsg(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setPlanning(false);
    }
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, 40)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) { showToast({ title: t.dashPages.fileTooLargeSkip.replace('{name}', file.name), type: 'warning' }); continue; }
        const form = new FormData();
        form.append('file', file);
        try {
          const res = await fetch('/api/upload/character-face', { method: 'POST', body: form });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body.url) added.push(body.url);
          else showToast({ title: body.error || t.dashPages.fileUploadFailed.replace('{name}', file.name), type: 'error' });
        } catch { showToast({ title: t.dashPages.fileUploadNetwork.replace('{name}', file.name), type: 'error' }); }
      }
      if (added.length) setImages((prev) => [...prev, ...added].slice(0, 40));
    } finally {
      setUploading(false);
    }
  };

  const addClip = () => {
    const u = clipDraft.trim();
    if (!u) return;
    if (!/^(https?:\/\/|\/api\/serve-file)/.test(u)) { showToast({ title: t.dashPages.clipUrlInvalid, type: 'error' }); return; }
    setVideoClips((prev) => (prev.includes(u) ? prev : [...prev, u]).slice(0, 40));
    setClipDraft('');
  };

  const useRealClips = videoClips.length > 0;

  const compose = async () => {
    if (!shots || shots.length === 0 || !plannedParams) { showToast({ title: t.dashPages.needTimeline, type: 'error' }); return; }
    if (!useRealClips && images.length === 0) { showToast({ title: t.dashPages.needPicturesOrClips, type: 'error' }); return; }
    setComposing(true);
    setMvUrl(''); setMvDuration(0); setMvMusicDropped(false); setComposeError('');
    try {
      // Snapshot params so composed shot count == the strip (not possibly-edited live inputs).
      // Real clips → beat-cut each clip; else ken-burns stills.
      const res = await fetch('/api/mv/compose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicDurationSec: plannedParams.durationSec, bpm: plannedParams.bpm, beatsPerShot: plannedParams.beatsPerShot,
          ...(useRealClips ? { videoClips } : { imageUrls: images }),
          musicUrl: musicUrl.trim() || undefined, aspect: '9:16',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const msg = body?.message || t.dashPages.composeFailedHttp.replace('{status}', String(res.status));
        setComposeError(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      setMvUrl(body.finalVideoUrl || '');
      setMvDuration(Number(body.duration) || 0);
      setMvMusicDropped(!!body.musicDropped);
      showToast({ title: body.musicDropped ? t.dashPages.mvDoneNoMusic : t.dashPages.mvDone, type: body.musicDropped ? 'warning' : 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.dashPages.composeNetwork;
      setComposeError(msg); showToast({ title: msg, type: 'error' });
    } finally {
      setComposing(false);
    }
  };

  const total = shots && shots.length ? shots[shots.length - 1].endSec : durationSec;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MusicNotes className="w-6 h-6 text-[#E8C547]" weight="duotone" />
          {t.dashPages.mvTitle}
        </h1>
        <p className="text-sm text-[var(--soft)] mt-1">
          {t.dashPages.mvSubtitle}
        </p>
      </div>

      {/* Input */}
      <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.musicDurationSec}</label>
            <input
              type="number" min={1} max={600} value={durationSec}
              onChange={e => setDurationSec(Number(e.target.value))}
              className="mt-2 w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.bpmLabel}</label>
            <input
              type="number" min={1} max={400} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="mt-2 w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.beatsPerShot}</label>
            <input
              type="number" min={1} max={64} value={beatsPerShot}
              onChange={e => setBeatsPerShot(Number(e.target.value))}
              className="mt-2 w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-sm tabular-nums"
            />
            <div className="text-[10px] text-[var(--soft)] mt-1 opacity-60">{t.dashPages.beatsHint}</div>
          </div>
        </div>

        <button
          onClick={plan}
          disabled={planning || !(durationSec > 0) || !(bpm > 0) || !(beatsPerShot > 0)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center justify-center gap-2"
        >
          {planning ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.planning}</>) : (<><Waveform className="w-4 h-4" weight="bold" /> {t.dashPages.genTimeline}</>)}
        </button>
      </div>

      {/* Result */}
      <div className="mt-5">
        {errorMsg ? (
          <div className="bg-[rgba(255,255,255,0.04)] border border-rose-500/20 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <div className="text-sm text-rose-300 mb-1">{t.dashPages.planFailed}</div>
            <div className="text-[11px] text-white/50">{errorMsg}</div>
          </div>
        ) : shots && shots.length === 0 ? (
          // Planned OK but zero shots (e.g. BPM too high): distinguish from "not clicked yet".
          <div className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-2xl p-6 text-center">
            <div className="text-sm text-[var(--muted)] mb-1">{summary || t.dashPages.noPlannedShots}</div>
            <div className="text-[11px] text-[var(--soft)]">{t.dashPages.planEmptyHint}</div>
          </div>
        ) : shots && shots.length > 0 ? (
          <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#E8C547]" weight="duotone" />
              <span className="text-sm text-white font-medium">{summary}</span>
            </div>

            {/* Beat strip: each shot colored by duration share + section */}
            <div className="flex w-full h-9 rounded-lg overflow-hidden border border-white/10 mb-2" role="img" aria-label={t.dashPages.timelineAria}>
              {shots.map((s) => (
                <div
                  key={s.index}
                  title={t.dashPages.shotStripTitle
                    .replace('{n}', String(s.index))
                    .replace('{start}', s.startSec.toFixed(2))
                    .replace('{end}', s.endSec.toFixed(2))
                    .replace('{sec}', sectionLabel(s.section) || s.section)}
                  style={{ width: `${(s.durationSec / total) * 100}%`, background: SECTION_COLOR[s.section] || SECTION_COLOR.unknown }}
                  className="h-full border-r border-black/30 last:border-r-0 grid place-items-center text-[9px] font-mono text-black/70 overflow-hidden"
                >
                  {(s.durationSec / total) > 0.05 ? s.index : ''}
                </div>
              ))}
            </div>
            {/* Section legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-[10px] text-[var(--soft)]">
              {Array.from(new Set(shots.map(s => s.section))).map(sec => (
                <span key={sec} className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SECTION_COLOR[sec] || SECTION_COLOR.unknown }} />
                  {sectionLabel(sec) || sec}
                </span>
              ))}
            </div>

            {/* Detail table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[var(--soft)] text-left border-b border-white/10">
                    <th className="py-1.5 pr-3 font-medium">{t.dashPages.colShot}</th>
                    <th className="py-1.5 pr-3 font-medium">{t.dashPages.colStart}</th>
                    <th className="py-1.5 pr-3 font-medium">{t.dashPages.colEnd}</th>
                    <th className="py-1.5 pr-3 font-medium">{t.dashPages.colDur}</th>
                    <th className="py-1.5 pr-3 font-medium">{t.dashPages.colSection}</th>
                    <th className="py-1.5 font-medium">{t.dashPages.colOnBeat}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {shots.map((s) => (
                    <tr key={s.index} className="border-b border-white/5 last:border-0">
                      <td className="py-1.5 pr-3 text-white">{s.index}</td>
                      <td className="py-1.5 pr-3 text-[var(--muted)]">{s.startSec.toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-[var(--muted)]">{s.endSec.toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-[var(--muted)]">{s.durationSec.toFixed(2)}</td>
                      <td className="py-1.5 pr-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm" style={{ background: SECTION_COLOR[s.section] || SECTION_COLOR.unknown }} />
                          {sectionLabel(s.section) || s.section}
                        </span>
                      </td>
                      <td className="py-1.5 text-emerald-400">{s.onBeat ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* v12.253 compose: pictures → ken-burns on the beat timeline + hard cuts + music */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <FilmSlate className="w-4 h-4 text-[#E8C547]" weight="duotone" />
                <span className="text-sm text-white font-medium">{t.dashPages.composeTitle}</span>
              </div>
              <p className="text-[11px] text-[var(--soft)] mb-3 opacity-70">
                {t.dashPages.composeSourcesLead}<br />
                · <b className="text-white/80">{t.dashPages.composeRealClips}</b> {t.dashPages.composeRealClipsDesc}<br />
                · <b className="text-white/80">{t.dashPages.composeStills}</b> {t.dashPages.composeStillsDesc}<br />
                {t.dashPages.composeSourcesTail}
              </p>

              {/* v12.254 real clips (preferred) */}
              <div className="mb-4">
                <div className="text-[11px] text-[var(--soft)] uppercase tracking-wider mb-1.5">{t.dashPages.realClipsLabel}</div>
                {videoClips.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {videoClips.map((u, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] bg-black/25 rounded px-2 py-1">
                        <span className="w-4 h-4 rounded bg-[#E8C547]/15 text-[#E8C547] grid place-items-center font-mono shrink-0">{i + 1}</span>
                        <span className="flex-1 truncate text-[var(--muted)]" title={u}>{u}</span>
                        <button onClick={() => setVideoClips((prev) => prev.filter((_, j) => j !== i))} title={t.dashPages.remove} className="text-[var(--soft)] hover:text-rose-300"><X className="w-3 h-3" /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-1.5">
                  <input
                    type="url" value={clipDraft} onChange={e => setClipDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addClip(); }}
                    placeholder={t.dashPages.videoClipUrlPh}
                    className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded text-xs focus:outline-none focus:border-[#E8C547]/50"
                  />
                  <button onClick={addClip} disabled={!clipDraft.trim()} className="px-3 py-1 text-xs rounded bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547]/25 disabled:opacity-40">{t.dashPages.addClip}</button>
                </div>
              </div>

              {/* Stills (used when no real clips) */}
              <div className="flex flex-wrap gap-2 mb-3">
                {images.map((u, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                    <img loading="lazy" decoding="async" src={u} alt={t.dashPages.pictureAlt.replace('{n}', String(i + 1))} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      title={t.dashPages.remove} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
                    ><X className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
                <button
                  onClick={() => imgRef.current?.click()}
                  disabled={uploading}
                  className="w-16 h-16 rounded-lg border border-dashed border-white/20 grid place-items-center text-[var(--soft)] hover:bg-white/5 disabled:opacity-40"
                  title={t.dashPages.uploadPictures}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
                <input ref={imgRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files?.length) uploadImages(e.target.files); if (imgRef.current) imgRef.current.value = ''; }} />
              </div>

              {/* Music (optional) */}
              <input
                type="url" value={musicUrl} onChange={e => setMusicUrl(e.target.value)}
                placeholder={t.dashPages.musicUrlPh}
                className="w-full px-3 py-2 mb-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-xs"
              />

              <button
                onClick={compose}
                disabled={composing || (!useRealClips && images.length === 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center justify-center gap-2 text-sm"
              >
                {composing
                  ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t.dashPages.composingWait}</>)
                  : useRealClips
                    ? (<><FilmSlate className="w-4 h-4" weight="bold" /> {t.dashPages.genMvClips.replace('{clips}', String(videoClips.length)).replace('{shots}', String(shots.length))}</>)
                    : (<><Images className="w-4 h-4" weight="bold" /> {t.dashPages.genMvStills.replace('{pics}', String(images.length)).replace('{shots}', String(shots.length))}</>)}
              </button>

              {composeError && <div className="mt-2 text-[12px] text-rose-300">✕ {composeError}</div>}
              {mvUrl && (
                <div className="mt-4">
                  <div className="text-[12px] text-emerald-400 mb-2 inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" weight="duotone" /> {t.dashPages.mvReady}</div>
                  {mvMusicDropped && (
                    <div className="text-[11px] text-amber-300/85 mb-2">{t.dashPages.musicDroppedHint}</div>
                  )}
                  {/* Honest: if a clip is shorter than its shot window, composeVideo can only use the whole clip. */}
                  {mvDuration > 0 && total > 0 && mvDuration < total * 0.9 && (
                    <div className="text-[11px] text-amber-300/85 mb-2 leading-relaxed">
                      {t.dashPages.mvShortHint.replace('{actual}', mvDuration.toFixed(1)).replace('{planned}', total.toFixed(1))}
                    </div>
                  )}
                  <video src={mvUrl} controls className="w-full rounded-xl bg-black/40 max-h-[460px]" />
                  <a href={mvUrl} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white">
                    <Download className="w-3.5 h-3.5" /> {t.dashPages.openDownloadMv}
                  </a>
                </div>
              )}
              <p className="text-[11px] text-[var(--soft)] mt-3 opacity-60 leading-relaxed">
                {t.dashPages.mvClipHint}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-[var(--soft)] text-sm opacity-60 py-10">
            {t.dashPages.mvEmpty}
          </div>
        )}
      </div>
    </div>
  );
}
