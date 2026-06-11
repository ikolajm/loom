'use client';

import { forwardRef } from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

const collapsibleVariants = cva('flex flex-col', {
  variants: {
    variant: {
      default: 'bg-transparent border-0',
      bordered: 'bg-transparent border-outline-subtle border rounded-component',
    },
  },
  defaultVariants: { variant: 'default' },
});

const triggerSize: Record<string, string> = {
  sm: 'h-ch-5 px-3 gap-2 text-[14px] leading-[20px]',
  md: 'h-ch-7 px-4 gap-3 text-[16px] leading-[24px]',
  lg: 'h-ch-9 px-6 gap-4 text-[18px] leading-[28px]',
};

const chevronSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-3',
};

const contentPadding: Record<string, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const contentText: Record<string, string> = {
  sm: 'text-body-sm',
  md: 'text-body-md',
  lg: 'text-body-lg',
};

const Collapsible = forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> & VariantProps<typeof collapsibleVariants>
>(({ variant, className, ...props }, ref) => (
  <CollapsiblePrimitive.Root ref={ref} className={cn(collapsibleVariants({ variant }), className)} {...props} />
));
Collapsible.displayName = 'Collapsible';

const CollapsibleTrigger = forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & { size?: 'sm' | 'md' | 'lg' }
>(({ size = 'md', className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      'flex w-full items-center justify-between font-medium cursor-pointer transition-all rounded-[inherit]',
      'hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      '[&[data-state=open]>svg]:rotate-180',
      triggerSize[size],
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className={cn('shrink-0 transition-transform duration-200', chevronSize[size])} />
  </CollapsiblePrimitive.Trigger>
));
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

const CollapsibleContent = forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> & { size?: 'sm' | 'md' | 'lg' }
>(({ size = 'md', className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content ref={ref} className={cn('overflow-hidden', contentText[size])} {...props}>
    <div className={cn('text-on-surface-variant', contentPadding[size], className)}>{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent, collapsibleVariants };
