'use client';

import { forwardRef } from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

const triggerSizeMap: Record<string, string> = {
  sm: 'h-ch-5 px-3 text-body-sm',
  md: 'h-ch-7 px-4 text-body-md',
  lg: 'h-ch-8 px-6 text-body-lg',
};

const listGapMap: Record<string, string> = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

type SizeProps = { size?: 'sm' | 'md' | 'lg' };

const NavigationMenu = forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> & SizeProps
>(({ size = 'md', className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root ref={ref} className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)} {...props}>
    {children}
    <NavigationMenuViewport size={size} />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = 'NavigationMenu';

const NavigationMenuList = forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <NavigationMenuPrimitive.List ref={ref} className={cn('group flex flex-1 list-none items-center', listGapMap[size], className)} {...props} />
));
NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const NavigationMenuTrigger = forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger> & SizeProps
>(({ size = 'md', className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      'group inline-flex items-center justify-center gap-1.5 rounded-component font-medium',
      'text-on-surface interactive cursor-pointer',
      'hover:bg-surface-1 data-[state=open]:bg-surface-1',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      triggerSizeMap[size],
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className="size-icon-1 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

const NavigationMenuContent = forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto',
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = 'NavigationMenuContent';

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <div className="absolute left-0 top-full flex justify-center">
    <NavigationMenuPrimitive.Viewport
      ref={ref}
      className={cn(
        'origin-top-center relative mt-1.5 overflow-hidden rounded-card bg-surface-1 text-on-surface shadow-[var(--shadow-2)]',
        'h-[var(--radix-navigation-menu-viewport-height)] w-full md:w-[var(--radix-navigation-menu-viewport-width)]',
        'data-[state=open]:animate-in data-[state=open]:zoom-in-90 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95',
        className,
      )}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = 'NavigationMenuViewport';

const NavigationMenuIndicator = forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn('top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=visible]:fade-in data-[state=hidden]:fade-out', className)}
    {...props}
  >
    <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-surface-1 shadow-[var(--shadow-1)]" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = 'NavigationMenuIndicator';

export {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
  NavigationMenuViewport, NavigationMenuIndicator,
};
