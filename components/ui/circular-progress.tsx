'use client';

/**
 * v5.0.2 — circular progress (SVG ring).
 *
 * Controllable value (0-100). Visual feedback for long tasks (I2V generation, etc.).
 * Display only — no timer. The caller feeds progress (real or time-estimated).
 */

export interface CircularProgressProps {
  /** 0-100. */
  value: number;
  /** Diameter in px. */
  size?: number;
  /** Ring width in px. */
  stroke?: number;
  /** Center primary label (defaults to the percentage). */
  label?: string;
  /** Center secondary label (small type). */
  sublabel?: string;
  /** Progress color. */
  color?: string;
  /** Track color. */
  trackColor?: string;
  /** Soft pulse on the ring while a task is running. */
  pulse?: boolean;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function CircularProgress({
  value,
  size = 132,
  stroke = 9,
  label,
  sublabel,
  color = '#E8C547',
  trackColor = 'rgba(255,255,255,0.10)',
  pulse = false,
}: CircularProgressProps) {
  const v = clamp(value);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - v / 100);
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={pulse ? 'animate-pulse-slow' : ''} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{label ?? `${Math.round(v)}%`}</span>
        {sublabel && <span className="text-[10px] text-white/50 mt-0.5 px-2">{sublabel}</span>}
      </div>
    </div>
  );
}
