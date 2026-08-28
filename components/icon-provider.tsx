'use client';

/**
 * v8.3 P6.1 — global Phosphor icon default (ultra-thin Light weight).
 *
 * After lucide → Phosphor, 89 files inherit light weight from context (premium hairline)
 * so each usage need not set weight; explicit duotone/bold props on emphasized icons still win.
 */

import { IconContext } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export function IconProvider({ children }: { children: ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: 'light' }}>
      {children}
    </IconContext.Provider>
  );
}
