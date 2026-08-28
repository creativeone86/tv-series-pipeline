'use client';

/**
 * ClipWithAudio (v12.1.0 / v12.1.2) — clip preview with overlaid VO + audible-preview
 * toggle (phase 20 B).
 *
 * Pain: AI-generated raw clips have no audio track (audio is mixed only at final
 * assemble), so per-shot preview is silent. This component overlays a synced
 * `<audio>` (that shot's TTS / shot-audio) on a muted `<video>` so playing the
 * clip plays the line.
 *
 * v12.1.2 preview UX:
 *   · Three-state audio-ready badge — **VO** (TTS overlay) / **native track**
 *     (raw clip has audio, only when probed) / **no separate track** (final cut
 *     has score + VO). Honest: native is labeled only when evidence exists.
 *   · Per-shot “audible preview” toggle — mute / restore this shot's audio
 *     (overlay VO or native track).
 *
 * Design (adversarial review):
 *   - `video.muted` is **declarative only** `audioUrl ? true : !audible` plus
 *     useLayoutEffect fallback — no one-frame leak from React prop vs imperative
 *     v.muted fighting.
 *   - Changing clip (videoUrl/audioUrl) **resets** hasNativeAudio/audioBlocked.
 *   - VO overlay uses a separate `<audio>` synced to play/pause/seek/rate;
 *     autoplay blocked → surface a hint instead of swallowing it.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SpeakerHigh, SpeakerSlash, MusicNotes, WarningCircle } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

export function ClipWithAudio({
  videoUrl, audioUrl, className, overlay,
}: {
  videoUrl: string;
  audioUrl?: string | null;
  className?: string;
  overlay?: React.ReactNode;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // v12.13.2: display at the video's real aspect (bare <video> stretches into a fixed box).
  const [ratio, setRatio] = useState<number | null>(null);
  // v12.1.2 audible-preview toggle (on by default) + native-track probe + autoplay-blocked flag
  const [audible, setAudible] = useState(true);
  const [hasNativeAudio, setHasNativeAudio] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // video.muted owned declaratively (kills one-frame leak from prop vs imperative write)
  useLayoutEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = audioUrl ? true : !audible;
  }, [audioUrl, audible]);

  // Probe whether the raw clip has a native track; reset on clip change; drop timeupdate on hit
  useEffect(() => {
    setHasNativeAudio(false);
    setAudioBlocked(false);
    const v = videoRef.current;
    if (!v || audioUrl) return;
    const probe = () => {
      const native =
        (v as any).webkitAudioDecodedByteCount > 0 ||
        (v as any).mozHasAudio === true ||
        (((v as any).audioTracks?.length ?? 0) > 0);
      if (native) { setHasNativeAudio(true); v.removeEventListener('timeupdate', probe); }
    };
    v.addEventListener('loadeddata', probe);
    v.addEventListener('timeupdate', probe);
    return () => { v.removeEventListener('loadeddata', probe); v.removeEventListener('timeupdate', probe); };
  }, [audioUrl, videoUrl]);

  // Overlay VO sync (only when audioUrl exists): play/pause/seek/rate follow video
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;
    const tryPlay = () => {
      if (!audible) return;
      try {
        a.currentTime = v.currentTime;
        if (a.duration && a.currentTime >= a.duration) return; // VO shorter than picture and already finished
        a.play().then(() => setAudioBlocked(false)).catch((e: any) => { if (e?.name === 'NotAllowedError') setAudioBlocked(true); });
      } catch { /* ignore */ }
    };
    const onPlay = tryPlay;
    const onPause = () => a.pause();
    const onSeek = () => { try { a.currentTime = v.currentTime; if (!v.paused) tryPlay(); } catch { /* ignore */ } }; // resume line after seek
    const onRate = () => { a.playbackRate = v.playbackRate; };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeking', onSeek);
    v.addEventListener('ratechange', onRate);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeking', onSeek);
      v.removeEventListener('ratechange', onRate);
      a.pause();
    };
  }, [audioUrl, audible]);

  // Audible-preview toggle → overlay audio follows (video.muted is layout-effect owned)
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!a || !audioUrl) return;
    a.muted = !audible;
    if (!audible) { a.pause(); return; }
    if (v && !v.paused) {
      try {
        a.currentTime = v.currentTime;
        if (!(a.duration && a.currentTime >= a.duration)) {
          a.play().then(() => setAudioBlocked(false)).catch((e: any) => { if (e?.name === 'NotAllowedError') setAudioBlocked(true); });
        }
      } catch { /* ignore */ }
    }
  }, [audible, audioUrl]);

  const state: 'voiceover' | 'native' | 'none' = audioUrl ? 'voiceover' : hasNativeAudio ? 'native' : 'none';
  const canAudition = !!audioUrl || hasNativeAudio;

  return (
    <div className="relative">
      {/* video.muted declarative: always mute when overlay exists; else follow audible */}
      {/* v12.13.2: object-contain + real aspect when known (inline aspectRatio overrides fixed box) */}
      <video
        ref={videoRef} src={videoUrl} controls playsInline crossOrigin="anonymous"
        muted={audioUrl ? true : !audible}
        onLoadedMetadata={(e) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight); }}
        className={`${className || ''} object-contain bg-black`}
        style={ratio ? { aspectRatio: String(ratio) } : undefined}
      />
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" crossOrigin="anonymous" />}
      {overlay}
      {/* Three-state ready badge — reflects live mute; do not claim “with VO” while muted */}
      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px]" data-testid="clip-audio-badge" data-audio-state={state}>
        {state === 'voiceover' && (audible
          ? (<><SpeakerHigh className="w-3 h-3 text-emerald-300" /><span className="text-emerald-200">{t.projectPanels.withVoiceover}</span></>)
          : (<><SpeakerSlash className="w-3 h-3 text-white/40" /><span className="text-white/40">{t.projectPanels.voiceoverMuted}</span></>))}
        {state === 'native' && (audible
          ? (<><MusicNotes className="w-3 h-3 text-sky-300" /><span className="text-sky-200">{t.projectPanels.nativeTrack}</span></>)
          : (<><SpeakerSlash className="w-3 h-3 text-white/40" /><span className="text-white/40">{t.projectPanels.nativeMuted}</span></>))}
        {state === 'none' && (<><SpeakerSlash className="w-3 h-3 text-white/40" /><span className="text-white/40">{t.projectPanels.noIndependentTrack}</span></>)}
      </div>
      {/* Autoplay blocked by browser → honest hint (do not pretend there is sound) */}
      {audioBlocked && audible && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-100 text-[10px]" data-testid="clip-audio-blocked">
          <WarningCircle className="w-3 h-3" /><span>{t.projectPanels.audioBlocked}</span>
        </div>
      )}
      {/* Per-shot audible-preview toggle (only when a source exists; stable aria-label, aria-pressed carries state) */}
      {canAudition && (
        <button
          type="button"
          onClick={() => setAudible((x) => !x)}
          aria-pressed={audible}
          aria-label={t.projectPanels.audiblePreview}
          data-testid="clip-audio-toggle"
          title={audible ? t.projectPanels.audibleOnTitle : t.projectPanels.mutedTitle}
          className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border transition-colors ${
            audible ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-black/60 border-white/15 text-white/50'
          }`}
        >
          {audible ? <SpeakerHigh className="w-3 h-3" /> : <SpeakerSlash className="w-3 h-3" />}
          <span>{audible ? t.projectPanels.audiblePreview : t.projectPanels.muted}</span>
        </button>
      )}
    </div>
  );
}
