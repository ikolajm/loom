'use client';

import { forwardRef } from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const hoverCardContentVariants = cva(
  'z-[var(--z-popover)] flex flex-col overflow-hidden bg-surface-1 text-on-surface border-outline-subtle border shadow-[var(--shadow-2)] border border-outline-subtle animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 gap-2 rounded-card max-w-[240px] text-body-sm max-w-[240px]',
        md: 'px-4 py-3 gap-3 rounded-card max-w-[320px] text-body-md max-w-[320px]',
        lg: 'px-6 py-4 gap-4 rounded-card max-w-[400px] text-body-lg max-w-[400px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = forwardRef<
  React.ComponentRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & VariantProps<typeof hoverCardContentVariants>
>(({ size, sideOffset = 4, align = 'center', className, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content ref={ref} sideOffset={sideOffset} align={align} className={cn(hoverCardContentVariants({ size }), className)} {...props} />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = 'HoverCardContent';

export { HoverCard, HoverCardTrigger, HoverCardContent, hoverCardContentVariants };
