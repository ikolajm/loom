'use client';

import { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

const accordionVariants = cva('flex flex-col', {
  variants: {
    variant: {
      default: 'bg-transparent border-outline-subtle border',
      filled: 'bg-surface-1 border-0',
    },
  },
  defaultVariants: { variant: 'default' },
});

const Accordion = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & VariantProps<typeof accordionVariants>
>(({ variant, className, ...props }, ref) => (
  <AccordionPrimitive.Root ref={ref} className={cn(accordionVariants({ variant }), className)} {...props} />
));
Accordion.displayName = 'Accordion';

const AccordionItem = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn(className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

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

const AccordionTrigger = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & { size?: 'sm' | 'md' | 'lg' }
>(({ size = 'md', className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between font-medium cursor-pointer transition-all',
        'hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        '[&[data-state=open]>svg]:rotate-180',
        triggerSize[size],
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn('shrink-0 transition-transform duration-200', chevronSize[size])} />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & { size?: 'sm' | 'md' | 'lg' }
>(({ size = 'md', className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn('overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down', contentText[size])}
    {...props}
  >
    <div className={cn('text-on-surface-variant', contentPadding[size], className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, accordionVariants };
