import { cn } from '@/lib/utils';

/**
 * BezelCard (v8.3 P2) — a real double-bezel card (machined tray around a glass panel)
 *
 * Mirrors Taste Skill "high-end-visual-design" Doppelrand / Nested Architecture:
 *   outer shell (.bezel-shell, 6px padding + hairline + gold glow) wraps
 *   inner core (.bezel-core, its own fill + top-edge highlight + concentric radius).
 *
 * For high-value surfaces (dashboard hero / key cards). Layout className (col-span/grid…)
 * goes on the shell; content padding is defaulted on the core (override with coreClassName).
 */
export function BezelCard({
  className,
  coreClassName,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { coreClassName?: string }) {
  return (
    <div className={cn('bezel-shell', className)} {...props}>
      <div className={cn('bezel-core p-6', coreClassName)}>{children}</div>
    </div>
  );
}
