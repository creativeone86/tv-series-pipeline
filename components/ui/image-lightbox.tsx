'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { createPortal } from 'react-dom';
import { X, CaretLeft as ChevronLeft, CaretRight as ChevronRight, MagnifyingGlassPlus as ZoomIn, ImageBroken as ImageOff, ArrowsClockwise as RefreshCw } from '@phosphor-icons/react';
import { useLocale } from '@/hooks/use-locale';

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

/**
 * Shared image zoom viewer.
 *
 * Two usages:
 *
 * 1) ZoomableImage — owns its own open state; the usual "click img to enlarge"
 *    <ZoomableImage src={url} alt="lead" title="Character" />
 *
 * 2) ImageLightboxModal — controlled; good for galleries (parent owns index + prev/next)
 *    <ImageLightboxModal src={currentUrl} title="..." onClose={...} onPrev={...} onNext={...} />
 *
 * Provenance:
 *   - mature ImagePreviewModal in assets/page.tsx (ESC/arrows/z-index=99999/backdrop-blur)
 *   - extracted to ui/ so every call site does not rewrite it
 */

interface LightboxProps {
  src: string;
  title?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  /** Optional top-right "download / save as" or other custom action */
  extraAction?: ReactNode;
}

export function ImageLightboxModal({
  src, title, onClose, onPrev, onNext, hasPrev, hasNext, extraAction,
}: LightboxProps) {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  // v10.3.5 a11y: focus trap + document-level Escape + restore focus; arrow paging stays in the effect below
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape is handled by useFocusTrap
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    document.addEventListener('keydown', handler, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      // Stop React Flow (and other parents) from receiving pointer events
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || t.kitUi.imagePreview}
        tabIndex={-1}
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center outline-none"
      >
        <div className="absolute -top-10 right-0 flex items-center gap-2">
          {extraAction}
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
            aria-label={t.product.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <img loading="lazy" decoding="async" 
          src={src}
          alt={title || ''}
          className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
          draggable={false} />
        {title ? <div className="text-white/70 text-sm mt-3">{title}</div> : null}
        {hasPrev && onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-[-50px] top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
            aria-label={t.kitUi.prevImage}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && onNext && (
          <button
            onClick={onNext}
            className="absolute right-[-50px] top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
            aria-label={t.kitUi.nextImage}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface ZoomableImageProps {
  src: string;
  alt?: string;
  title?: string;
  /** Outer wrapper className (applied to the trigger div) */
  className?: string;
  /** className on the img itself */
  imgClassName?: string;
  /** Show the hover magnifier (default true) */
  showHoverIcon?: boolean;
  /** Custom trigger (replaces the default <img>) */
  children?: ReactNode;
  /** Disable click-to-zoom (default false) */
  disabled?: boolean;
}

/**
 * Click-to-zoom image that owns its open/close state. The usual form.
 *
 * e.g. <ZoomableImage src={c.mediaUrls[0]} alt={c.name} title={c.name} className="aspect-[16/9]" />
 */
export function ZoomableImage({
  src, alt, title, className, imgClassName, showHoverIcon = true, children, disabled = false,
}: ZoomableImageProps) {
  const { t: loc } = useLocale();
  const t = loc as KitT;
  const [open, setOpen] = useState(false);
  // v2.19 P1.1: image-load fallback — onError swaps in a placeholder + retry.
  // retryNonce is appended as a cache-buster so the browser does not reuse a 404.
  const [errored, setErrored] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  // New src → reset error (e.g. parent regenerated imageUrl)
  useEffect(() => {
    setErrored(false);
    setRetryNonce(0);
  }, [src]);

  const handleClick = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    if (disabled || !src || errored) return;
    // Stop bubbling to React Flow nodes (otherwise it starts a drag / select)
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, [disabled, src, errored]);

  // Pointer-events version — React Flow treats pointerDown as a drag start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrored(false);
    setRetryNonce((n) => n + 1);
  }, []);

  // Cache-bust only on retry — do not pollute the normal URL
  const effectiveSrc = retryNonce > 0
    ? `${src}${src.includes('?') ? '&' : '?'}retry=${retryNonce}`
    : src;

  return (
    <>
      <div
        className={`relative group ${errored ? '' : 'cursor-zoom-in'} ${className || ''}`}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        {errored ? (
          <div className="w-full h-full bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-1.5 p-2 rounded-[inherit]">
            <ImageOff className="w-5 h-5 text-white/40" />
            <span className="cinema-mono text-[10px] opacity-50 text-center px-2 leading-tight">
              {t.kitUi.imageLoadFail}
            </span>
            <button
              onClick={handleRetry}
              className="cinema-mono text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 transition-colors"
              title={t.kitUi.retryLoad}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              {t.errors.retry}
            </button>
          </div>
        ) : (
          children || (
            <img
              src={effectiveSrc}
              alt={alt || title || ''}
              className={imgClassName || 'w-full h-full object-cover'}
              draggable={false}
              onError={() => setErrored(true)}
            />
          )
        )}
        {showHoverIcon && !disabled && !errored && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none rounded-[inherit]">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
      {open && !errored && (
        <ImageLightboxModal
          src={effectiveSrc}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
