'use client';

/**
 * Cinema micro-motion components (v2.13.3 / v2.13.4, Aceternity-style)
 *
 * All framer-motion (already a dep) + plain CSS; no new packages.
 *
 * Includes:
 *   <NumberTicker>        — count up to a value (project counts / scores)
 *   <BorderBeam>          — rotating amber gradient border beam (Slate / primary CTA)
 *   <AnimatedShinyText>   — amber shine sweep on text (inspiration / hints)
 *   <Marquee>             — infinite horizontal marquee (inspiration / cases)
 *   <MovingBorderButton>  — v2.13.4 · amber highlight racing the border, for primary CTAs
 *   <TextGenerateEffect>  — v2.13.4 · word-level stagger reveal, for Slate subtitles
 *   <Spotlight>           — v2.13.4 · SVG cone spotlight, Slate top decoration
 */

import { useEffect, useRef, useState, useMemo, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion, useMotionValue, useSpring, useInView, useMotionTemplate, useAnimationFrame, useReducedMotion } from 'framer-motion';

// ────────────────────────────────────────────────
// NumberTicker — count to target
// ────────────────────────────────────────────────
export function NumberTicker({
  value,
  duration = 1.4,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30% 0px' });
  const reduce = useReducedMotion();
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, {
    damping: 28,
    stiffness: 80,
    duration: duration * 1000,
  });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    // v10.3.4 a11y: number spring is not transform/layout so MotionConfig will not disable it → jump to final value when reduce-motion
    if (reduce) { setDisplay(value.toFixed(decimals)); return; }
    motionVal.set(value);
  }, [inView, value, motionVal, reduce, decimals]);

  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      setDisplay(latest.toFixed(decimals));
    });
    return unsub;
  }, [spring, decimals]);

  return (
    <span ref={ref} className={`cinema-mono tabular-nums ${className}`}>
      {prefix}{display}{suffix}
    </span>
  );
}

// ────────────────────────────────────────────────
// BorderBeam — rotating border beam
// ────────────────────────────────────────────────
export function BorderBeam({
  size = 200,
  duration = 8,
  delay = 0,
  colorFrom = 'rgba(201, 163, 94, 0.0)',
  colorTo = 'rgba(201, 163, 94, 0.85)',
}: {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        // hand CSS variables to the keyframes
        ['--size' as any]: `${size}px`,
        ['--duration' as any]: `${duration}s`,
        ['--delay' as any]: `${delay}s`,
        ['--from' as any]: colorFrom,
        ['--to' as any]: colorTo,
      }}
    >
      <span
        className="absolute aspect-square"
        style={{
          width: 'var(--size)',
          background: 'transparent',
          backgroundImage:
            'conic-gradient(from 0deg, var(--from) 0deg, var(--to) 30deg, var(--from) 60deg)',
          mask: 'linear-gradient(black, black), linear-gradient(black, black)',
          maskComposite: 'exclude',
          padding: '1px',
          inset: 0,
          animation: 'cinema-beam-rotate var(--duration) linear var(--delay) infinite',
          offsetPath: 'rect(0px 100% 100% 0px round 4px)',
          offsetRotate: '0deg',
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────
// AnimatedShinyText — shine sweep on text
// ────────────────────────────────────────────────
export function AnimatedShinyText({
  children,
  className = '',
  shimmerWidth = 100,
}: {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg,
          var(--cinema-text-2) 30%,
          var(--cinema-amber) 50%,
          var(--cinema-text-2) 70%
        )`,
        backgroundSize: `${shimmerWidth * 2}% 100%`,
        WebkitBackgroundClip: 'text',
        animation: 'cinema-shimmer 3.6s ease-in-out infinite',
      }}
    >
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────
// Marquee — infinite horizontal scroll
// ────────────────────────────────────────────────
export function Marquee({
  children,
  speed = 30,
  pauseOnHover = true,
  className = '',
}: {
  children: ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className={`relative flex overflow-hidden ${className}`}
      style={{ ['--marquee-speed' as any]: `${speed}s` }}
    >
      <motion.div
        className="flex shrink-0 gap-3"
        // v10.3.4 a11y: do not scroll when reduce-motion — show the first screen still
        animate={reduce ? { x: '0%' } : { x: ['0%', '-100%'] }}
        transition={reduce ? { duration: 0 } : { duration: speed, repeat: Infinity, ease: 'linear' }}
        whileHover={!reduce && pauseOnHover ? { x: '0%' } : undefined}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────
 // MovingBorderButton — Aceternity-style primary CTA
//
// amber highlight racing the edge + built-in button, for "boot / ROLL / polish / gen video"
// these "end of the happy path" buttons. SVG <rect> samples the stroke and places a glow.
// ────────────────────────────────────────────────
export function MovingBorderButton({
  children,
  duration = 3500,
  borderRadius = 6,
  containerClassName = '',
  borderClassName = '',
  className = '',
  disabled,
  ...rest
}: {
  children: ReactNode;
  /** milliseconds for one lap of the highlight */
  duration?: number;
  borderRadius?: number;
  containerClassName?: string;
  borderClassName?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  // highlight position, driven by framer
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue(0);
  const reduce = useReducedMotion();

  useAnimationFrame((time) => {
    // v10.3.4 a11y: manual rAF is outside MotionConfig → stop the border highlight when reduce-motion
    if (disabled || reduce) return;
    const length = pathRef.current?.getTotalLength?.() ?? 0;
    if (length === 0) return;
    const pxPerMs = length / duration;
    const distance = (time * pxPerMs) % length;
    progress.set(distance);
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  useEffect(() => {
    return progress.on('change', (v) => {
      const point = pathRef.current?.getPointAtLength?.(v);
      if (point) {
        x.set(point.x);
        y.set(point.y);
      }
    });
  }, [progress, x, y]);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <button
      disabled={disabled}
      className={`relative overflow-hidden rounded-md p-[1.5px] ${containerClassName}`}
      style={{ borderRadius }}
      {...rest}
    >
      {/* SVG sampling path (hidden) */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute h-full w-full"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <rect
            ref={pathRef}
            fill="none"
            width="100%"
            height="100%"
            rx={borderRadius}
            ry={borderRadius}
          />
        </svg>
        {!disabled && !reduce && (
          <motion.div
            className={`absolute top-0 left-0 h-12 w-12 ${borderClassName}`}
            style={{
              transform,
              background:
                'radial-gradient(rgba(201, 163, 94, 0.85) 0%, rgba(201, 163, 94, 0) 70%)',
            }}
          />
        )}
      </div>

      {/* inner real button surface */}
      <span
        className={`relative flex h-full w-full items-center justify-center ${className}`}
        style={{ borderRadius: borderRadius - 1 }}
      >
        {children}
      </span>
    </button>
  );
}

// ────────────────────────────────────────────────
// TextGenerateEffect — word-level stagger reveal
//
// Split text into words and fade them in when in-view (ChatGPT-like stream feel).
// No LLM; front-end animation only. Good for Slate notes / guide copy.
// ────────────────────────────────────────────────
export function TextGenerateEffect({
  text,
  className = '',
  /** ms between word fades */
  stagger = 60,
  /** ms for each word to appear */
  duration = 320,
}: {
  text: string;
  className?: string;
  stagger?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
    // CJK: split per character; Latin: split on spaces
  const words = useMemo(() => splitForReveal(text), [text]);

  return (
    <span ref={ref} className={className}>
      {/* v10.3.3 a11y: aria-label cannot sit on a span with no role; use sr-only real text for AT, animate words aria-hidden */}
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          // v10.3.4 a11y: show everything at once when reduce-motion (no stagger / move / blur)
          initial={reduce ? false : { opacity: 0, filter: 'blur(6px)', y: 4 }}
          animate={
            reduce
              ? { opacity: 1 }
              : inView
                ? { opacity: 1, filter: 'blur(0px)', y: 0 }
                : { opacity: 0, filter: 'blur(6px)', y: 4 }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: duration / 1000, delay: (i * stagger) / 1000, ease: [0.2, 0.8, 0.2, 1] }
          }
          aria-hidden="true"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/** Mixed CJK/Latin stagger split: CJK per char, Latin on spaces, punctuation stays with the prior word */
function splitForReveal(text: string): string[] {
  const out: string[] = [];
  let buf = '';
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = '';
    }
  };
  for (const ch of text) {
    // CJK / JK characters — per char (CJK Unified + half/fullwidth forms + CJK punctuation)
    if (/[\u3000-\u9fff\uff00-\uffef]/.test(ch)) {
      flush();
      out.push(ch);
    } else if (ch === ' ') {
      flush();
      out.push(' ');
    } else {
      buf += ch;
    }
  }
  flush();
  return out;
}

// ────────────────────────────────────────────────
// Spotlight — Aceternity-style SVG cone light
//
// Background decoration for hero / Slate cards (top-right / top-left; default top-right).
// Does not affect layout; pointer-events:none; parent should be relative + overflow-hidden.
// ────────────────────────────────────────────────
export function Spotlight({
  className = '',
  fill = 'rgba(201, 163, 94, 0.45)',
  position = 'top-right',
}: {
  className?: string;
  fill?: string;
  position?: 'top-right' | 'top-left' | 'top-center';
}) {
  // ellipse center as a percent
  const cx = position === 'top-left' ? 18 : position === 'top-center' ? 50 : 82;

  return (
    <svg
      className={`pointer-events-none absolute -top-12 z-0 h-[120%] w-full opacity-90 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={`cinema-spot-${position}`}
          cx={`${cx}%`}
          cy="0%"
          r="55%"
          fx={`${cx}%`}
          fy="0%"
        >
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <rect
        width="100"
        height="100"
        fill={`url(#cinema-spot-${position})`}
      />
    </svg>
  );
}
