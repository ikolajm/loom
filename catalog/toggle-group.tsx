'use client';

import { forwardRef, createContext, useContext } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
  sm: 'h-control-sm px-2 text-action-sm',
  md: 'h-control-md px-3 text-action-md',
  lg: 'h-control-lg px-4 text-action-lg',
};

type ToggleGroupSize = 'sm' | 'md' | 'lg';
type ToggleGroupVariant = 'segmented' | 'spaced';

// segmented = items touch, share borders, radius on container; spaced = gaps, each item owns border/radius.
const groupVariantClass: Record<ToggleGroupVariant, string> = {
  segmented: 'border border-outline-subtle rounded-component overflow-hidden divide-x divide-outline-subtle gap-0',
  spaced: 'gap-2',
};
const itemVariantClass: Record<ToggleGroupVariant, string> = {
  segmented: '',
  spaced: 'border border-outline-subtle rounded-component',
};

const ToggleGroupContext = createContext<{ variant: ToggleGroupVariant; size: ToggleGroupSize }>({ variant: 'segmented', size: 'md' });

type GroupProps = { variant?: ToggleGroupVariant; size?: ToggleGroupSize };

const ToggleGroup = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & GroupProps
>(({ variant = 'segmented', size = 'md', className, ...props }, ref) => (
  <ToggleGroupContext.Provider value={{ variant, size }}>
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-variant={variant}
      data-size={size}
      className={cn('inline-flex items-center', groupVariantClass[variant], className)}
      {...props}
    />
  </ToggleGroupContext.Provider>
));
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  const { variant, size } = useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium interactive cursor-pointer',
        'control',
        'data-[state=off]:text-on-surface-variant data-[state=on]:bg-primary-container data-[state=on]:text-on-primary-container',
        itemSizeMap[size],
        itemVariantClass[variant],
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
