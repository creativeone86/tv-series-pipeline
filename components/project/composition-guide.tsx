'use client';

/**
 * components/project/composition-guide (v7.5) — composition overlay + camera-path
 * mini-viz (CineMatrix Composition Guide / Camera Movement Path).
 *
 * Given size / angle / move → rule-of-thirds grid (can overlay a preview) +
 * hints (subject / headroom / look room / balance) + camera-path diagram.
 */

import { computeCompositionHints, cameraPathPoints } from '@/lib/composition';
import type { ShotSize, CameraAngle, MovementId } from '@/lib/cinematography';
import { useLocale } from '@/hooks/use-locale';

export function CompositionGuide({ shotSize, angle, movement, imageUrl }: {
  shotSize?: ShotSize;
  angle?: CameraAngle;
  movement?: MovementId;
  imageUrl?: string;
}) {
  const { locale, t: loc } = useLocale();
  const t = loc as typeof loc & { projectMisc: Record<string, string> };
  const hints = computeCompositionHints({ shotSize, angle });
  const path = cameraPathPoints(movement || 'static');
  const moveLabel = (id: string) => ({
    'push-in': t.projectMisc.movePushIn,
    'pull-out': t.projectMisc.movePullOut,
    pan: t.projectMisc.movePan,
    tilt: t.projectMisc.moveTilt,
    dolly: t.projectMisc.moveDolly,
    crane: t.projectMisc.moveCrane,
    orbit: t.projectMisc.moveOrbit,
    handheld: t.projectMisc.moveHandheld,
    static: t.projectMisc.moveStatic,
  }[id] || path.label);
  const pathLabel = locale === 'en' ? moveLabel(movement || 'static') : path.label;
  const hintRows = [
    [t.projectMisc.hintSubject, hints.facePosition],
    [t.projectMisc.hintHeadroom, hints.headroom],
    [t.projectMisc.hintLookRoom, hints.lookRoom],
    [t.projectMisc.hintBalance, hints.balance],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Rule-of-thirds frame */}
      <div>
        <div className="cinema-eyebrow mb-1">{t.projectMisc.compositionFraming}</div>
        <div className="relative w-full rounded-md overflow-hidden border border-[var(--border)]" style={{ aspectRatio: '16 / 9' }}>
          {imageUrl
            ? <img loading="lazy" decoding="async" src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-[var(--surface)]" />}
          <svg viewBox="0 0 100 56" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {/* Thirds lines */}
            <line x1="33.3" y1="0" x2="33.3" y2="56" stroke="rgba(232,197,71,0.5)" strokeWidth="0.3" />
            <line x1="66.6" y1="0" x2="66.6" y2="56" stroke="rgba(232,197,71,0.5)" strokeWidth="0.3" />
            <line x1="0" y1="18.6" x2="100" y2="18.6" stroke="rgba(232,197,71,0.5)" strokeWidth="0.3" />
            <line x1="0" y1="37.3" x2="100" y2="37.3" stroke="rgba(232,197,71,0.5)" strokeWidth="0.3" />
            {/* Intersections (interest points) */}
            {[33.3, 66.6].flatMap((x) => [18.6, 37.3].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="rgba(232,197,71,0.85)" />
            )))}
          </svg>
        </div>
      </div>

      {/* Hints + camera path */}
      <div className="flex flex-col gap-2">
        <div className="cinema-eyebrow">{t.projectMisc.compositionHints}</div>
        <div className="grid grid-cols-2 gap-1.5">
          {hintRows.map(([k, v]) => (
            <div key={k} className="rounded-md border border-[var(--border)] px-2 py-1">
              <div className="cinema-mono text-[9px] opacity-50">{k}</div>
              <div className="text-[10px] leading-tight">{v}</div>
            </div>
          ))}
        </div>

        {/* Camera path */}
        <div className="cinema-eyebrow mt-1">{t.projectMisc.cameraPath.replace('{label}', pathLabel)}</div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-1">
          <svg viewBox="0 0 100 56" className="w-full" style={{ height: 56 }}>
            <defs>
              <marker id="cg-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
              </marker>
            </defs>
            <path d={path.path} fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" markerEnd="url(#cg-arrow)" />
            {/* Camera start */}
            <circle cx={path.startX} cy={path.startY} r="1.8" fill="var(--muted)" />
            {/* Focus */}
            <circle cx={path.focusX} cy={path.focusY} r="2.2" fill="none" stroke="var(--primary)" strokeWidth="0.8" />
            <circle cx={path.focusX} cy={path.focusY} r="0.8" fill="var(--primary)" />
          </svg>
          <div className="flex justify-between cinema-mono text-[9px] opacity-50 px-1">
            <span>● {t.projectMisc.cameraPos}</span><span className="text-[var(--primary)]">◎ {t.projectMisc.focusPoint}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
