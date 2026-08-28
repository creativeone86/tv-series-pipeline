'use client';

/**
 * components/ui/tooltip (v2.13.5 · shadcn-style on Radix)
 *
 * Stronger than native title="...":
 *   - customizable placement that follows the cursor (top/bottom/left/right + sideOffset)
 *   - touch: long-press only, so it does not pollute mobile
 *   - real ARIA aria-describedby for screen readers
 *
 * Usage:
 *   <TooltipProvider>
 *     <Tooltip>
 *       <TooltipTrigger asChild><button>SHOT 03</button></TooltipTrigger>
 *       <TooltipContent>Shot 3 · Cameo 92 / Edit cut</TooltipContent>
 *     </Tooltip>
 *   </TooltipProvider>
 *
 * Page-wide: wrap the layout root in <TooltipProvider delayDuration={300}>;
 * local: wrap just the cluster that needs it.
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // Cinema: black field, amber frame + cinema-mono
      'z-50 overflow-hidden rounded-md border px-2.5 py-1.5',
      'border-[var(--cinema-border-hi)] bg-[var(--cinema-surface-hi)]',
      'cinema-mono text-[10.5px] tracking-wide text-[var(--cinema-text)]',
      'shadow-[0_4px_18px_-6px_rgba(0,0,0,0.55)]',
      'animate-in fade-in-0 zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
      'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
