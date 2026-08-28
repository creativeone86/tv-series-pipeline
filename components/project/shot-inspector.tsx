'use client';

/**
 * v12.44 — Unified Shot Inspector.
 * Click a board → right drawer aggregates one shot: zoom preview + consistency
 * score + picture / dialogue / camera metadata + shot actions (cinema desk /
 * candidate grid · 4K re-render · rewrite prompt). Pulls entries that used to
 * live on board cards / workshop into one place. Full cinema design system.
 */

import { useEffect } from 'react';
import { X, FilmSlate, SquaresFour } from '@phosphor-icons/react';
import { TimecodeChip } from '@/components/cinema/primitives';
import { CameoBadge } from '@/components/cameo/CameoStoryboardWidgets';
import { useLocale } from '@/hooks/use-locale';

export interface InspectShot {
  shotNumber: number;
  imageUrl?: string;
  description?: string;
  dialogue?: string;
  emotion?: string;
  duration?: number;
  /** Passed through to CameoBadge (consistency / cameo score) */
  data?: Record<string, unknown>;
  /** describeShotSpec(curSpec) camera summary */
  specSummary?: string;
}

export function ShotInspector({
  shot,
  frameClass,
  onClose,
  onCinema,
  onWorkshop,
  onFrameInspect,
}: {
  shot: InspectShot;
  frameClass: string;
  onClose: () => void;
  /** Single-shot cinema desk (size / angle / move / focus) */
  onCinema: () => void;
  /** v12.330: frame inspect — flip frames to find the bad beat, hand off to segment retake */
  onFrameInspect: () => void;
  /** Go to workshop (candidate grid / 4K re-render / rewrite prompt) */
  onWorkshop: () => void;
}) {
  const { t: loc } = useLocale();
  const t = loc as typeof loc & { projectPanels: Record<string, string> };

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/55 z-40 animate-fade-up" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={t.projectPanels.inspectorAria.replace('{n}', String(shot.shotNumber))}
        className="fixed top-0 right-0 h-full w-[min(380px,92vw)] z-50 bg-[var(--cinema-surface)] border-l border-[var(--cinema-border-hi)] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-[var(--cinema-surface)] border-b border-[var(--cinema-border)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="cinema-mono text-[10px] tracking-widest text-[var(--cinema-amber)]">SHOT {String(shot.shotNumber).padStart(2, '0')}</span>
            {shot.duration ? <TimecodeChip seconds={shot.duration} /> : null}
          </div>
          <button onClick={onClose} className="cinema-btn-ghost !p-1.5" aria-label={t.projectPanels.closeInspector}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Zoom preview + consistency score */}
          <div className="relative cinema-card overflow-hidden">
            {shot.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot.imageUrl} alt={t.projectPanels.shotAlt.replace('{n}', String(shot.shotNumber))} className={`w-full ${frameClass} object-cover`} />
            ) : (
              <div className={`w-full ${frameClass} grid place-items-center bg-[var(--cinema-surface-2)] cinema-mono text-[11px] opacity-40`}>NO RENDER</div>
            )}
            <div className="absolute top-2 right-2"><CameoBadge data={shot.data || {}} /></div>
          </div>

          {shot.emotion ? <div className="cinema-mono text-[10px] opacity-50">{t.projectPanels.emotionLine.replace('{emotion}', shot.emotion)}</div> : null}

          <div>
            <div className="cinema-eyebrow !text-[9px] opacity-60 mb-1">{t.projectPanels.sceneDesc}</div>
            <p className="cinema-subhead text-sm opacity-90 leading-relaxed">{shot.description || t.projectPanels.emDash}</p>
          </div>

          {shot.dialogue ? (
            <div>
              <div className="cinema-eyebrow !text-[9px] opacity-60 mb-1">{t.projectPanels.dialogue}</div>
              <p className="text-sm text-[var(--cinema-blue)] italic">「{shot.dialogue}」</p>
            </div>
          ) : null}

          {shot.specSummary ? (
            <div>
              <div className="cinema-eyebrow !text-[9px] opacity-60 mb-1">{t.projectPanels.camera}</div>
              <p className="cinema-mono text-[11px] opacity-70 leading-relaxed">{shot.specSummary}</p>
            </div>
          ) : null}

          {/* Shot actions */}
          <div className="pt-3 border-t border-[var(--cinema-border)] space-y-2">
            <div className="cinema-eyebrow !text-[9px] opacity-50">{t.projectPanels.shotActions}</div>
            <button onClick={onCinema} className="cinema-btn-ghost !text-xs w-full !justify-start">
              <FilmSlate className="w-3.5 h-3.5" />{t.projectPanels.cinemaDesk}
            </button>
            {/* v12.330: v12.315 segment retake and v12.328 frame inspect were API-only */}
            <button onClick={onFrameInspect} className="cinema-btn-ghost !text-xs w-full !justify-start">
              <FilmSlate className="w-3.5 h-3.5" />{t.projectPanels.frameInspect}
            </button>
            <button onClick={onWorkshop} className="cinema-btn-ghost !text-xs w-full !justify-start">
              <SquaresFour className="w-3.5 h-3.5" />{t.projectPanels.workshopActions}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
