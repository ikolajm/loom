'use client';

import { forwardRef } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
  sm: 'h-ch-3 px-2 text-action-sm',
  md: 'h-ch-5 px-3 text-action-md',
  lg: 'h-ch-7 px-4 text-action-lg',
};

type SizeProps = { size?: 'sm' | 'md' | 'lg' };

const ToggleGroup = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    data-size={size}
    className={cn('inline-flex items-center border border-outline-subtle rounded-component overflow-hidden divide-x divide-outline-subtle', className)}
    {...props}
  />
));
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center font-medium interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[state=off]:text-on-surface-variant data-[state=on]:bg-primary-container data-[state=on]:text-on-primary-container',
      itemSizeMap[size],
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
