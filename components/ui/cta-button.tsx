'use client';

import { cn } from '@/lib/utils';
import { ArrowRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

/**
 * CtaButton (v8.3 P2) — Nested CTA (Button-in-Button)
 *
 * Taste Skill: the primary CTA's trailing arrow/icon NEVER sits naked — nest it
 * in its own circular "island". Full-pill radius; the island hugs the right inset
 * and nudges right on hover.
 *
 *   <CtaButton onClick={…}>Create with this plan</CtaButton>
 *   <CtaButton variant="ghost" icon={<Sparkle/>}>Optimize</CtaButton>
 */
export function CtaButton({
  children,
  variant = 'gold',
  icon,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'ghost';
  icon?: ReactNode;
}) {
  return (
    <button className={cn('cta', variant === 'ghost' ? 'cta--ghost' : 'cta--gold', className)} {...props}>
      <span>{children}</span>
      <span className="cta__island" aria-hidden>
        {icon ?? <ArrowRight size={16} weight="bold" />}
      </span>
    </button>
  );
}
