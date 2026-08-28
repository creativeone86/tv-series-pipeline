'use client';

/**
 * AudioPlayerModal — player dedicated to music assets.
 *
 * The asset library used to play music with only `new Audio(url).play()`:
 *   1) no UI feedback — the user cannot tell if playback started
 *   2) no progress bar, cannot seek
 *   3) cannot pause without refreshing the page
 *
 * This component is a minimal music player: play/pause, progress, timeline,
 * drag-to-seek, Esc to close, Space to toggle play/pause.
 *
 * Why not native <audio controls>: it works, but the chrome is inconsistent
 * across browsers (Safari stretches the whole bar) and clashes with the site's
 * dark glass look. A thin shell gives us style control.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, MusicNotes as Music } from '@phosphor-icons/react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title?: string;
  /** Optional description/tag (e.g. "MV Mode · 110bpm") */
  subtitle?: string;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function AudioPlayerModal({ open, onOpenChange, src, title, subtitle }: Props) {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Stop playback on close
  const handleClose = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Space toggles play/pause (Escape is handled by useFocusTrap)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        // Avoid scrolling the page
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        togglePlay();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, handleClose]);

  // Auto-load + try play when opened
  useEffect(() => {
    if (!open || !src) return;
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    const a = audioRef.current;
    if (!a) return;
    a.src = src;
    a.load();
    // Autoplay may be blocked (needs a user gesture), so swallow the rejection
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    return () => {
      a.pause();
    };
  }, [open, src]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch((e) => {
        setError(e?.message || t.kitUi.playFailed);
      });
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [t]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const pct = Number(e.target.value);
    const next = (pct / 100) * duration;
    a.currentTime = next;
    setCurrentTime(next);
  };

  // v10.3.6 a11y: Escape + focus trap + restore focus
  const dialogRef = useFocusTrap<HTMLDivElement>(open && mounted, handleClose);

  if (!open || !mounted) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        style={{ animation: 'fadeIn 0.15s ease' }}
        onClick={handleClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || t.kitUi.musicPreview}
        tabIndex={-1}
        className="relative w-[92vw] max-w-md rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-2xl outline-none"
        style={{ animation: 'zoomIn 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-indigo-500/15 text-indigo-400 shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-white truncate">{title || t.kitUi.musicDefault}</h3>
              {subtitle ? (
                <p className="text-[11px] text-[var(--muted)] truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title={t.kitUi.closeEsc}
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Playback controls */}
        <div className="p-6 flex flex-col gap-4">
          {/* Large play button */}
          <div className="flex justify-center">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-[#E8C547]/90 hover:bg-[#E8C547] text-black grid place-items-center transition-all hover:scale-105 active:scale-95"
              aria-label={playing ? t.kitUi.pause : t.kitUi.play}
            >
              {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </button>
          </div>

          {/* Progress */}
          <div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={pct}
              onChange={handleSeek}
              disabled={!duration}
              className="w-full accent-[#E8C547] cursor-pointer"
              style={{
                background: `linear-gradient(to right, #E8C547 ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
                height: '4px',
                borderRadius: '4px',
                appearance: 'none',
                outline: 'none',
              }}
            />
            <div className="flex justify-between text-[11px] text-[var(--muted)] mt-2 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {error ? (
            <div className="text-center text-[12px] text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {error}
            </div>
          ) : null}

          <p className="text-[10px] text-center text-[var(--muted)] tracking-wider">
            {t.kitUi.spacePlayEsc}
          </p>
        </div>

        {/* Hidden real audio element */}
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={() => setPlaying(false)}
          onError={() => setError(t.kitUi.audioLoadFail)}
          preload="metadata"
        />
      </div>
    </div>,
    document.body,
  );
}
