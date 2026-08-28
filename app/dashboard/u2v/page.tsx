'use client';

/**
 * /dashboard/u2v · Sprint C.1 — image → video standalone tool
 *
 * Not on the main project pipeline; a standalone tool:
 *   1. User pastes an image URL or uploads a file
 *   2. Writes a short motion description
 *   3. Picks duration (5s / 6s)
 *   4. Generate → wait 1–3 min → inline video player + download
 */

import { useEffect, useRef, useState } from 'react';
import { useFileDrop } from '@/components/ui/DropZone';
import { useLocale } from '@/hooks/use-locale';

// v12.339: upload limits live here only — the hook's on-disk check and
// uploadFile's fallback share this constant. Two copies would drift.
const U2V_ACCEPT = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] };
const U2V_MAX = 10 * 1024 * 1024;
import { Upload, Link as LinkIcon, Play, Download, CircleNotch as Loader2, Sparkle as Sparkles, Warning as AlertTriangle, ArrowCounterClockwise as RotateCcw, FilmSlate } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast-provider';
import { CameraLanguagePicker } from '@/components/create/camera-language-picker';
import { CircularProgress } from '@/components/ui/circular-progress';

type DashT = ReturnType<typeof useLocale>['t'] & { dashPages: Record<string, string> };

// v5.0.2: expected seconds per duration — progress-ring estimate (fallback when no real events)
const EXPECTED_SEC: Record<number, number> = { 5: 120, 6: 120, 10: 150, 15: 180 };
function fmtMMSS(s: number): string {
  const m = Math.floor(s / 60); const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

// v2.14 P0.4: long-shot tiers — 5/6s Minimax I2V-01, 10s Kling Master, 15s Vidu Q3 Pro.
// Client sees one option list; /api/u2v picks the model from duration (see P0.4 route).
type DurationOption = 5 | 6 | 10 | 15;
const DURATION_OPTIONS: Array<{ value: DurationOption; label: string; engineHint: string }> = [
  { value: 5,  label: '5s',  engineHint: 'Minimax I2V-01' },
  { value: 6,  label: '6s',  engineHint: 'Minimax I2V-01' },
  { value: 10, label: '10s', engineHint: 'Kling Master' },
  { value: 15, label: '15s', engineHint: 'Vidu Q3 Pro' },
];

export default function U2VPage() {
  const { t: loc } = useLocale();
  const t = loc as DashT;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const tailFileRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  // v12.339: these dropzones already look like drop targets ("click to upload")
  // but only handled click. Reuse useFileDrop behavior (validate + drop), keep
  // this page's look — the generic grey skin would clash with the cinema theme.
  const [imagePreview, setImagePreview] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  // v2.14 P0.3: first/last-frame fusion — when tailImageUrl is set, route to /api/u2v-flf
  const [tailImageUrl, setTailImageUrl] = useState('');
  const [tailImagePreview, setTailImagePreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<DurationOption>(5);
  // v2.14 P0.2: camera-language preset id (from CAMERA_LANGUAGE_PRESETS)
  const [cameraPreset, setCameraPreset] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  // v5.0.2: progress ring + error state
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();
  const isFlfMode = !!tailImageUrl;

  // Clear timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // v12.252: support ?image=<url> prefill (comic-panel desk → I2V handoff).
  // Read window.location to avoid useSearchParams Suspense; only same-origin serve-file / data / http(s).
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('image');
      if (q && /^(\/api\/serve-file|data:|https?:)/.test(q)) {
        setImageUrl(q);
        setImagePreview(q);
      }
    } catch { /* noop */ }
  }, []);

  /** Start estimated progress: asymptote toward 95%; caller snaps to 100 on real result. */
  const startProgressTimer = (durationSel: number) => {
    const expected = EXPECTED_SEC[durationSel] || 120;
    const t0 = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(2); setElapsed(0);
    timerRef.current = setInterval(() => {
      const sec = (Date.now() - t0) / 1000;
      setElapsed(sec);
      // Asymptote: 95*(1-e^(-t/(0.4*expected))) — always climbing toward 95, never stalls
      const pct = 95 * (1 - Math.exp(-sec / (0.4 * expected)));
      setProgress(Math.max(2, pct));
    }, 250);
  };
  const stopProgressTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  /**
   * Upload to /api/upload/character-face, then write the URL into first / tail.
   * v2.14 P0.3: slot distinguishes main (I2V or first frame) vs tail frame.
   */
  const uploadFile = async (file: File, slot: 'first' | 'tail' = 'first') => {
    if (!file.type.startsWith('image/')) {
      showToast({ title: t.dashPages.imagesOnly, type: 'error' });
      return;
    }
    if (file.size > U2V_MAX) {
      showToast({ title: t.dashPages.imageTooLargeMb.replace('{n}', String(U2V_MAX / 1048576)), type: 'error' });
      return;
    }
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload/character-face', { method: 'POST', body: form });
    const body = await res.json();
    if (!res.ok) {
      showToast({ title: body.error || t.product.dropFailed, type: 'error' });
      return;
    }
    if (slot === 'first') {
      setImageUrl(body.url);
      setImagePreview(body.url);
    } else {
      setTailImageUrl(body.url);
      setTailImagePreview(body.url);
    }
  };

  // First / tail each get drop behavior; look stays as-is, drop is extra.
  const firstDrop = useFileDrop({
    onFiles: (fs) => { if (fs[0]) return uploadFile(fs[0], 'first'); },
    accept: U2V_ACCEPT, maxSize: U2V_MAX,
    onError: (msg) => showToast({ title: msg, type: 'error' }),
  });
  const tailDrop = useFileDrop({
    onFiles: (fs) => { if (fs[0]) return uploadFile(fs[0], 'tail'); },
    accept: U2V_ACCEPT, maxSize: U2V_MAX,
    onError: (msg) => showToast({ title: msg, type: 'error' }),
  });

  const acceptUrl = async () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      showToast({ title: t.dashPages.urlMustHttp, type: 'error' });
      return;
    }
    const res = await fetch('/api/upload/character-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: trimmed }),
    });
    const body = await res.json();
    if (!res.ok) {
      showToast({ title: body.error || t.dashPages.urlFetchFailed, type: 'error' });
      return;
    }
    setImageUrl(body.url);
    setImagePreview(body.url);
    setShowUrlInput(false);
    setUrlDraft('');
  };

  const generate = async () => {
    if (!imageUrl || !prompt.trim()) {
      showToast({ title: t.dashPages.needImageAndPrompt, type: 'error' });
      return;
    }
    setGenerating(true);
    setResultUrl('');
    setErrorMsg('');
    setProgress(2);
    setElapsed(0);
    // v4.1.4: single-image (non-FLF) uses SSE progress; FLF is still sync (not streamed yet)
    if (!isFlfMode) {
      await generateViaSSE();
      return;
    }
    startProgressTimer(duration);
    const ctrl = new AbortController();
    const hardTimeout = setTimeout(() => ctrl.abort(), 360_000);
    try {
      const res = await fetch('/api/u2v-flf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstFrameUrl: imageUrl, lastFrameUrl: tailImageUrl, prompt,
          duration: duration === 5 || duration === 6 ? 5 : 10, cameraPreset,
        }),
        signal: ctrl.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.error || t.dashPages.generateFailedHttp.replace('{status}', String(res.status));
        setErrorMsg(msg); showToast({ title: msg, type: 'error' });
        return;
      }
      stopProgressTimer(); setProgress(100); setResultUrl(body.videoUrl);
      showToast({ title: `${t.dashPages.generateOk}${body.model ? ' · ' + body.model : ''}`, type: 'success' });
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      const msg = aborted ? t.dashPages.generateTimeout : (e instanceof Error ? e.message : t.dashPages.generateNetwork);
      setErrorMsg(msg); showToast({ title: msg, type: 'error' });
    } finally {
      clearTimeout(hardTimeout); stopProgressTimer(); setGenerating(false);
    }
  };

  /** v4.1.4: SSE progress stream — drive the ring from progress/done/error frames. */
  const generateViaSSE = async () => {
    const t0 = Date.now();
    const ctrl = new AbortController();
    const hardTimeout = setTimeout(() => ctrl.abort(), 380_000);
    try {
      const { parseSSEChunk } = await import('@/lib/sse');
      const res = await fetch('/api/u2v/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, prompt, duration, cameraPreset }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: rdone } = await reader.read();
        if (rdone) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSSEChunk(buffer);
        buffer = parsed.rest;
        for (const ev of parsed.events) {
          if (ev.event === 'progress') {
            if (typeof ev.data?.pct === 'number') setProgress(ev.data.pct);
            setElapsed((Date.now() - t0) / 1000);
          } else if (ev.event === 'done') {
            setProgress(100);
            setResultUrl(ev.data.videoUrl);
            showToast({ title: `${t.dashPages.generateOk}${ev.data.model ? ' · ' + ev.data.model : ''}`, type: 'success' });
            done = true;
          } else if (ev.event === 'error') {
            throw new Error(ev.data?.error || t.dashPages.generateFailed);
          }
        }
      }
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      const msg = aborted ? t.dashPages.generateTimeout : (e instanceof Error ? e.message : t.dashPages.generateNetwork);
      setErrorMsg(msg);
      showToast({ title: msg, type: 'error' });
    } finally {
      clearTimeout(hardTimeout);
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#E8C547]" />
          {t.dashPages.u2vTitle}
        </h1>
        <p className="text-sm text-[var(--soft)] mt-1">
          {t.dashPages.u2vSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.inputImage}</label>
            <div
              {...firstDrop.dropProps}
              onClick={() => !imagePreview && fileRef.current?.click()}
              className={`mt-2 aspect-video rounded-xl overflow-hidden flex items-center justify-center border ${
                firstDrop.isDragging ? 'border-[#E8C547] bg-[#E8C547]/10' : imagePreview ? 'border-[#E8C547]/30 bg-black/20' : 'cursor-pointer border-dashed border-white/15 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              {imagePreview ? (
                <img loading="lazy" decoding="async" src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[var(--soft)]">
                  <Upload className="w-7 h-7 mx-auto mb-1 opacity-50" />
                  <div className="text-xs">{firstDrop.isDragging ? t.dashPages.dropToUpload : t.dashPages.clickOrDropOrUrl}</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, 'first');
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {t.dashPages.uploadFile}
              </button>
              <button
                onClick={() => setShowUrlInput(v => !v)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {t.dashPages.useUrl}
              </button>
            </div>
            {showUrlInput && (
              <div className="mt-2 flex gap-1">
                <input
                  type="url"
                  value={urlDraft}
                  onChange={e => setUrlDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') acceptUrl(); }}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1 text-xs bg-black/30 border border-white/10 rounded focus:outline-none focus:border-[#E8C547]/50"
                />
                <button
                  onClick={acceptUrl}
                  disabled={!urlDraft.trim()}
                  className="px-3 py-1 text-xs rounded bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547]/25 disabled:opacity-40"
                >
                  {t.dashPages.fetchUrl}
                </button>
              </div>
            )}
          </div>

          {/* v2.14 P0.3: optional tail-frame slot — set → route /api/u2v-flf */}
          {imageUrl && (
            <div>
              <label className="text-xs text-[var(--soft)] uppercase tracking-wider flex items-center justify-between">
                <span>{t.dashPages.tailFrameOptional}</span>
                {isFlfMode && (
                  <button
                    onClick={() => { setTailImageUrl(''); setTailImagePreview(''); }}
                    className="text-[10px] text-[#E8C547] hover:underline"
                  >
                    {t.dashPages.clear}
                  </button>
                )}
              </label>
              <div
                {...tailDrop.dropProps}
                onClick={() => !tailImagePreview && tailFileRef.current?.click()}
                className={`mt-2 aspect-video rounded-xl overflow-hidden flex items-center justify-center border ${
                  tailDrop.isDragging ? 'border-[#E8C547] bg-[#E8C547]/10' : tailImagePreview ? 'border-[#E8C547]/30 bg-black/20' : 'cursor-pointer border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                {tailImagePreview ? (
                  <img loading="lazy" decoding="async" src={tailImagePreview} alt="tail preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-[var(--soft)]">
                    <Upload className="w-5 h-5 mx-auto mb-1 opacity-40" />
                    <div className="text-[11px]">{tailDrop.isDragging ? t.dashPages.dropTail : t.dashPages.clickOrDropTail}</div>
                  </div>
                )}
              </div>
              <input
                ref={tailFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, 'tail');
                  if (tailFileRef.current) tailFileRef.current.value = '';
                }}
              />
              {isFlfMode && (
                <div className="mt-1 text-[10px] text-[#E8C547]/80">
                  {t.dashPages.flfModeHint}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.describeMotion}</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t.dashPages.motionPlaceholder}
              maxLength={500}
              rows={3}
              className="mt-2 w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[#E8C547]/50 text-sm resize-none"
            />
            <div className="text-[10px] text-[var(--soft)] mt-1 text-right">{prompt.length} / 500</div>
          </div>

          {/* v2.14 P0.2: camera-language chips — optional single-select */}
          <CameraLanguagePicker value={cameraPreset} onChange={setCameraPreset} disabled={generating} />

          <div>
            <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.duration}</label>
            <div className="mt-2 flex gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  disabled={generating}
                  title={t.dashPages.durationEngineHint.replace('{label}', opt.label).replace('{engine}', opt.engineHint)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition ${
                    duration === opt.value
                      ? 'bg-[#E8C547] text-black font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-[var(--soft)] mt-1 opacity-60">
              {DURATION_OPTIONS.find(o => o.value === duration)?.engineHint}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating || !imageUrl || !prompt.trim()}
            className="w-full px-4 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold inline-flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.dashPages.generatingPct.replace('{pct}', String(Math.round(progress))).replace('{time}', fmtMMSS(elapsed))}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t.dashPages.generateVideo}
              </>
            )}
          </button>
        </div>

        {/* Result */}
        <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-2xl p-5">
          <label className="text-xs text-[var(--soft)] uppercase tracking-wider">{t.dashPages.resultPreview}</label>
          <div className="mt-2 aspect-video rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
            {resultUrl ? (
              <video src={resultUrl} controls autoPlay loop className="w-full h-full object-contain" />
            ) : generating ? (
              // v5.0.2: ring — time estimate, asymptote 95%, snap to 100% on result
              <div className="flex flex-col items-center justify-center gap-3">
                <CircularProgress
                  value={progress}
                  sublabel={t.dashPages.waited.replace('{time}', fmtMMSS(elapsed))}
                />
                <div className="text-center text-[var(--soft)] text-xs">
                  {t.dashPages.engineGenerating.replace('{engine}', DURATION_OPTIONS.find(o => o.value === duration)?.engineHint || '')}
                  <div className="text-[10px] opacity-50 mt-0.5">{t.dashPages.progressEstimateHint}</div>
                </div>
              </div>
            ) : errorMsg ? (
              // v5.0.2: fail visibly in-panel + retry (no silent spinner)
              <div className="text-center px-6">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
                <div className="text-sm text-rose-300 mb-1">{t.dashPages.generateFailed}</div>
                <div className="text-[11px] text-white/50 mb-3">{errorMsg}</div>
                <button
                  onClick={generate}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t.errors.retry}
                </button>
              </div>
            ) : (
              <div className="text-center text-[var(--soft)] text-sm opacity-60">
                {t.dashPages.resultsHere}
              </div>
            )}
          </div>
          {resultUrl && (
            <div className="mt-3 flex gap-2">
              <a
                href={resultUrl}
                download={`u2v-${Date.now()}.mp4`}
                target="_blank"
                rel="noopener"
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {t.dashPages.downloadMp4}
              </a>
              {/* v12.255: one-click send this clip into MV beats as a real clip */}
              <a
                href={`/dashboard/mv?clip=${encodeURIComponent(resultUrl)}`}
                className="flex-1 px-4 py-2 rounded-xl bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547]/25 text-sm inline-flex items-center justify-center gap-1.5"
                title={t.dashPages.addToMvTitle}
              >
                <FilmSlate className="w-3.5 h-3.5" weight="bold" />
                {t.dashPages.addToMv}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
