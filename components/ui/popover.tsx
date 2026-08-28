'use client';

/**
 * components/ui/popover (v2.13.5 · shadcn-style on Radix)
 *
 * Stronger than a hand-rolled dropdown:
 *   - auto-position (collision detection, flips at viewport edge)
 *   - portals to document.body so overflow-hidden parents cannot clip it
 *   - focus management + Esc to close + click-outside, full ARIA
 *
 * Usage:
 *   <Popover>
 *     <PopoverTrigger asChild><button>Details</button></PopoverTrigger>
 *     <PopoverContent align="end">
 *       <h4>SHOT 03</h4>
 *       <p>...</p>
 *     </PopoverContent>
 *   </Popover>
 */

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // Cinema card_hi: thick border + amber highlight + serif subtitle size
        'z-50 w-72 rounded-md border p-4 outline-none',
        'border-[var(--cinema-border-hi)] bg-[var(--cinema-surface)]',
        'text-[var(--cinema-text)]',
        'shadow-[0_8px_28px_-10px_rgba(0,0,0,0.65)]',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
