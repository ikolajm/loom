'use client';

import { forwardRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const popoverContentVariants = cva(
  'z-[var(--z-popover)] flex flex-col bg-surface-1 text-on-surface shadow-[var(--shadow-2)] animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 gap-2 rounded-card text-body-sm',
        md: 'px-4 py-3 gap-3 rounded-card text-body-md',
        lg: 'px-6 py-4 gap-4 rounded-card text-body-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & VariantProps<typeof popoverContentVariants>
>(({ size, align = 'center', sideOffset = 4, className, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} className={cn(popoverContentVariants({ size }), className)} {...props} />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, popoverContentVariants };
