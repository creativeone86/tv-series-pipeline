'use client';

/**
 * Cinema visual primitives — signature distance from oiioii
 *
 * All css vars from cinema-theme.css; only apply under .cinema-page.
 *
 * Design:
 *   - cinema / dashboard / Logic Pro visual mix
 *   - do not copy oiioii pink / blob mascot / dot canvas
 *   - high density, clear hierarchy
 */

import type { ComponentType, ReactNode } from 'react';
import { BorderBeam, Spotlight, TextGenerateEffect } from './effects';
import { useLocale } from '@/hooks/use-locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ──────────────────────────────────────────────────────────
// TimecodeChip — cinema timecode 00:00:05:12 (frame-accurate)
// ──────────────────────────────────────────────────────────
export function TimecodeChip({
  seconds,
  fps = 24,
  variant = 'default',
}: {
  seconds: number;
  fps?: number;
  variant?: 'default' | 'amber';
}) {
  const totalFrames = Math.round(seconds * fps);
  const f = totalFrames % fps;
  const total_s = Math.floor(totalFrames / fps);
  const s = total_s % 60;
  const m = Math.floor(total_s / 60) % 60;
  const h = Math.floor(total_s / 3600);
  const tc = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
  return (
    <span className={`cinema-chip ${variant === 'amber' ? 'cinema-chip-amber' : ''}`}>
      <span className="cinema-mono">{tc}</span>
    </span>
  );
}
function pad(n: number) { return n.toString().padStart(2, '0'); }

// ──────────────────────────────────────────────────────────
// AspectChip — aspect ratio (16:9 · 1.85:1 · 2.35:1)
// ──────────────────────────────────────────────────────────
export function AspectChip({ ratio }: { ratio: string }) {
  const cinemaName: Record<string, string> = {
    '16:9': 'WIDESCREEN',
    '9:16': 'VERTICAL',
    '1:1': 'SQUARE',
    '2.35:1': 'CINEMASCOPE',
    '1.85:1': 'STANDARD',
    '4:3': 'ACADEMY',
  };
  const label = cinemaName[ratio];
  return (
    <span className="cinema-chip">
      <span className="cinema-mono">{ratio}</span>
      {label && <span className="text-[8px] opacity-80 tracking-widest">· {label}</span>}
    </span>
  );
}

// ──────────────────────────────────────────────────────────
// FilmStripDivider — decorative film-sprocket divider
// ──────────────────────────────────────────────────────────
export function FilmStripDivider({ label }: { label?: string }) {
  if (!label) return <div className="cinema-filmstrip" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="cinema-filmstrip flex-1" />
      <span className="cinema-eyebrow whitespace-nowrap">{label}</span>
      <div className="cinema-filmstrip flex-1" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// TechReadout — mono technical readout, Notion-code feel
// ──────────────────────────────────────────────────────────
export function TechReadout({
  pairs,
}: {
  pairs: Array<[string, ReactNode]>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 cinema-mono text-[11px]">
      {pairs.map(([k, v], i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="opacity-50">{k}</span>
          <span className="cinema-inline-code">{v}</span>
        </span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Eyebrow — mono micro label (RUNNING / READY / CUE)
// ──────────────────────────────────────────────────────────
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="cinema-eyebrow">{children}</span>;
}

// ──────────────────────────────────────────────────────────
// SlateCard — clapperboard-style card header
// Inspired by writing title + scene on a slate before a take; project title becomes the slate
// ──────────────────────────────────────────────────────────
export function SlateCard({
  title,
  scene,
  take,
  director,
  notes,
  beam = true,
  spotlight = true,
  animateNotes = true,
}: {
  title: string;
  scene?: string;
  take?: string;
  director?: string;
  notes?: string;
  /** v2.13.3: Whether to add an amber rotating beam on the card edge (Aceternity-style, default on) */
  beam?: boolean;
  /** v2.13.4: Whether to add the Aceternity Spotlight SVG cone (default on) */
  spotlight?: boolean;
  /** v2.13.4: Whether notes use word-level stagger (default on; safe for short / non-CJK text) */
  animateNotes?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="cinema-card-hi p-5 relative overflow-hidden cinema-spotlight">
      {spotlight && <Spotlight position="top-right" fill="rgba(201, 163, 94, 0.18)" />}
      {beam && <BorderBeam size={220} duration={9} colorTo="rgba(201, 163, 94, 0.55)" />}
      {/* top stripe decoration — black/white slate */}
      <div
        className="absolute top-0 left-0 right-0 h-2 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(45deg, var(--cinema-text), var(--cinema-text) 8px, var(--cinema-bg) 8px, var(--cinema-bg) 16px)',
        }}
      />
      {/* v2.13.5: SCENE / TAKE explained with Radix Tooltip — instead of a raw title="...",
          accessible + long-press on touch, no mobile hover pollution */}
      <TooltipProvider delayDuration={200}>
        <div className="pt-3 grid grid-cols-[auto_1fr_auto_auto] gap-x-6 gap-y-2 items-baseline relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help"><Eyebrow>SCENE</Eyebrow></span>
            </TooltipTrigger>
            <TooltipContent side="top">{t.sharedUi.sceneTooltip}</TooltipContent>
          </Tooltip>
          <span className="cinema-mono text-sm">{scene || '—'}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help"><Eyebrow>TAKE</Eyebrow></span>
            </TooltipTrigger>
            <TooltipContent side="top">{t.sharedUi.takeTooltip}</TooltipContent>
          </Tooltip>
          <span className="cinema-mono text-sm">{take || '—'}</span>
        </div>
      </TooltipProvider>
      <h1 className="cinema-headline text-3xl mt-3 mb-1 relative">{title}</h1>
      {director && (
        <div className="cinema-mono text-[11px] opacity-60 relative">
          DIR · {director}
        </div>
      )}
      {notes && (
        animateNotes ? (
          <p className="cinema-subhead text-sm mt-2 opacity-75 relative">
            <TextGenerateEffect text={notes} stagger={35} duration={280} />
          </p>
        ) : (
          <p className="cinema-subhead text-sm mt-2 opacity-75 relative">{notes}</p>
        )
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// StatusBar — Logic Pro-style bottom status bar
// ──────────────────────────────────────────────────────────
export function StatusBar({
  items,
}: {
  items: Array<{
    label: string;
    value?: ReactNode;
    status?: 'green' | 'amber' | 'red' | 'neutral';
  }>;
}) {
  const dotColor = (s?: string) =>
    s === 'green' ? 'var(--cinema-green)' :
    s === 'amber' ? 'var(--cinema-amber)' :
    s === 'red' ? 'var(--cinema-red)' :
    'var(--cinema-text-3)';
  return (
    <div className="cinema-statusbar">
      {items.map((it, i) => (
        <span key={i} className="cinema-statusbar-item">
          {it.status && (
            <span
              className="cinema-statusbar-dot"
              style={{ background: dotColor(it.status) }}
            />
          )}
          <span className="opacity-50">{it.label}</span>
          {it.value !== undefined && (
            <span className="opacity-90">{it.value}</span>
          )}
          {i < items.length - 1 && <span className="opacity-20 ml-3">│</span>}
        </span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// MeterBar — 0-100 meter (Cameo consistency / cw strength)
// ──────────────────────────────────────────────────────────
export function MeterBar({
  value,
  max = 100,
  label,
  variant,
}: {
  value: number;
  max?: number;
  label?: string;
  variant?: 'amber' | 'red' | 'auto';
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const v = variant === 'auto' ? (value < 60 ? 'red' : 'amber') : (variant || 'amber');
  return (
    <div className="flex items-center gap-2">
      {label && <span className="cinema-eyebrow w-12">{label}</span>}
      <div className="cinema-meter flex-1">
        <div
          className={`cinema-meter-fill ${v === 'red' ? 'cinema-meter-fill-red' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="cinema-mono text-[11px] w-8 text-right opacity-80">{Math.round(value)}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// EmptyState — shared empty state (icon + title + optional hint + optional CTA)
// Replaces scattered "plain text / no icon / render nothing" empties with one cinema language.
// ──────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className = '',
}: {
  icon?: ComponentType<{ className?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}>
      {Icon && <Icon className="w-8 h-8 text-[var(--cinema-amber)] opacity-40 mb-3" weight="duotone" />}
      <p className="cinema-subhead text-sm opacity-80">{title}</p>
      {hint && <p className="cinema-mono text-[11px] opacity-45 mt-1.5 max-w-sm leading-relaxed">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
