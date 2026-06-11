'use client';

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const tabsListVariants = cva(
  'flex items-center border-b border-outline-subtle',
  {
    variants: {
      size: {
        sm: 'h-ch-5 text-[12px] leading-[16px]',
        md: 'h-ch-7 text-[14px] leading-[20px]',
        lg: 'h-ch-8 text-[16px] leading-[24px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>(({ size, className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ size }), className)} {...props} />
));
TabsList.displayName = 'TabsList';

const triggerPaddingMap: Record<string, string> = {
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-6',
};

type TabsSizeProps = { size?: 'sm' | 'md' | 'lg' };

const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & TabsSizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'h-full font-medium tracking-[0.01em] cursor-pointer transition-colors',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'text-on-surface-variant hover:text-on-surface',
      'data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary',
      triggerPaddingMap[size],
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', className)} {...props} />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
