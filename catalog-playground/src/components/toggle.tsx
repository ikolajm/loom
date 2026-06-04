'use client';

import { forwardRef } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const toggleVariants = cva(
  'inline-flex items-center justify-center font-medium tracking-[0.01em] interactive cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=off]:bg-transparent data-[state=off]:text-on-surface-variant data-[state=off]:border-outline-subtle data-[state=off]:border data-[state=on]:bg-primary-container data-[state=on]:text-on-primary-container data-[state=on]:border-primary-container data-[state=on]:border',
  {
    variants: {
      size: {
        sm: 'h-ch-3 px-2 py-1 gap-1 rounded-component text-action-sm',
        md: 'h-ch-5 px-3 py-2 gap-2 rounded-component text-action-md',
        lg: 'h-ch-7 px-4 py-2 gap-2 rounded-component text-action-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const toggleIconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
  & VariantProps<typeof toggleVariants>
  & {
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

const Toggle = forwardRef<React.ComponentRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ size = 'md', leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const iconCls = toggleIconSize[size || 'md'] || '';
    return (
      <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ size }), className)} {...props}>
        {leadingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{trailingIcon}</span>}
      </TogglePrimitive.Root>
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle, toggleVariants };
