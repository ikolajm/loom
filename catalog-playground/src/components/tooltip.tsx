'use client';

import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const tooltipContentVariants = cva(
  'z-[var(--z-tooltip)] overflow-hidden bg-surface-1 text-on-surface shadow-[var(--shadow-1)] animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
        sm: 'px-1 py-1 gap-1 rounded-component text-label-sm',
        md: 'px-2 py-1 gap-1 rounded-component text-label-md',
        lg: 'px-3 py-2 gap-2 rounded-component text-label-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & VariantProps<typeof tooltipContentVariants>
>(({ size, sideOffset = 4, className, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(tooltipContentVariants({ size }), className)} {...props} />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, tooltipContentVariants };
