'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * v10.3.4 a11y: global framer-motion reduced-motion switch.
 * reducedMotion="user" follows the OS "reduce motion" setting: turns off transform /
 * layout animations on motion.* (vestibular-sensitive move/scale/rotate) while keeping
 * opacity/color fades. Does not cover manual useAnimationFrame, number springs, or
 * autoplay video — those fall back via useReducedMotion() in each component.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
