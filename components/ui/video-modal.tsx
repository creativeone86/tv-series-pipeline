'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, WarningCircle as AlertCircle, ArrowsOutSimple as Maximize2, SpeakerHigh as Volume2, SpeakerSlash as VolumeX } from '@phosphor-icons/react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title?: string;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image')) return false;
  if (url.startsWith('data:')) return false;
  // Local API serve endpoint (FFmpeg composed videos)
  if (url.startsWith('/api/serve-file')) return true;
  // Real video file extensions
  if (/\.(mp4|webm|mov|avi|mkv|m3u8|ts)(\?|#|$)/i.test(url)) return true;
  // Known video CDN patterns
  if (/oss.*aliyuncs\.com|cos\..+myqcloud\.com|vod\.|video\./i.test(url)) return true;
  // HTTP URLs that are NOT image extensions → likely video
  if (url.startsWith('http') && !/\.(jpg|jpeg|png|gif|svg|webp|bmp|ico|tiff)(\?|#|$)/i.test(url)) return true;
  return false;
}

export function VideoModal({ open, onOpenChange, src, title }: Props) {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const [videoError, setVideoError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset error state when src changes
  useEffect(() => {
    setVideoError(false);
  }, [src]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Pause video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    onOpenChange(false);
  }, [onOpenChange]);

  const handleVideoError = () => {
    console.warn('[VideoModal] Video playback failed:', src?.slice(0, 100));
    setVideoError(true);
  };

  // v10.3.6 a11y: Escape + focus trap + restore focus (replaces the old document Escape listener)
  const dialogRef = useFocusTrap<HTMLDivElement>(open && mounted, handleClose);

  if (!open || !mounted) return null;

  const isVideo = isVideoUrl(src);

  // Portal straight to body so React Flow CSS transforms cannot affect it
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop — click to close */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.15s ease' }}
        onClick={handleClose}
      />

      {/* Video frame */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || t.product.videoPreview}
        tabIndex={-1}
        className="relative w-[90vw] max-w-5xl rounded-2xl overflow-hidden bg-black border border-white/8 shadow-2xl outline-none"
        style={{ animation: 'zoomIn 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top chrome */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
          {title && (
            <span className="text-xs text-white/80 font-medium px-2">{title}</span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {isVideo && !videoError && src.startsWith('http') && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={t.product.openNewWindow}
              >
                <Maximize2 className="w-3.5 h-3.5 text-white/70" />
              </a>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title={t.product.close}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Video / image body */}
        {isVideo && !videoError ? (
          <video
            ref={videoRef}
            key={src}
            src={src}
            controls
            autoPlay
            playsInline
            className="w-full aspect-video bg-black"
            onError={handleVideoError}
          />
        ) : isVideo && videoError ? (
          <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-3 px-8 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-500/60" />
            <p className="text-sm text-gray-300 font-medium">{t.product.videoLoadFail}</p>
            {/* v2.12 fix: give a concrete next step, not just a failure */}
            <div className="text-xs text-gray-400 leading-relaxed max-w-md">
              {src.startsWith('/api/serve-file?path=') ? (
                <>
                  {t.kitUi.localComposeGone}
                  {src.includes('/tmp/') || src.includes('/var/folders/') ? (
                    <>
                      <br />
                      <span className="text-yellow-300/70">
                        {t.kitUi.oldTmpCompose}
                      </span>
                    </>
                  ) : null}
                  <br />
                  <span className="text-yellow-300/70">{t.kitUi.fixRerunWorkshop}</span>
                </>
              ) : src.includes('minimax') || src.includes('aliyuncs') ? (
                <>
                  {t.kitUi.cdnExpired}
                  <br />
                  <span className="text-yellow-300/70">{t.kitUi.fixRegenShot}</span>
                </>
              ) : !src ? (
                <>
                  {t.kitUi.emptyComposeUrl}
                  <br />
                  <span className="text-yellow-300/70">{t.kitUi.fixCheckBilling}</span>
                </>
              ) : (
                <>{t.kitUi.sourceUnreachable}</>
              )}
            </div>
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                {t.kitUi.openVideoNewWindow}
              </a>
            )}
          </div>
        ) : (
          <img loading="lazy" decoding="async" src={src} alt={title || ''} className="w-full aspect-video object-contain bg-black" />
        )}
      </div>
    </div>,
    document.body
  );
}
