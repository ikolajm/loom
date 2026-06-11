'use client';

import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-pill transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-1',
  {
    variants: {
      size: {
      sm: 'h-[20px] w-[36px]',
      md: 'h-[24px] w-[44px]',
      lg: 'h-[28px] w-[52px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const switchThumbConfig: Record<string, { size: string; translate: string }> = {
  sm: { size: 'size-[16px]', translate: 'data-[state=checked]:translate-x-[16px]' },
  md: { size: 'size-[20px]', translate: 'data-[state=checked]:translate-x-[20px]' },
  lg: { size: 'size-[24px]', translate: 'data-[state=checked]:translate-x-[24px]' },
};

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
  & VariantProps<typeof switchVariants>;

const Switch = forwardRef<React.ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ size, className, ...props }, ref) => {
    const thumb = switchThumbConfig[size || 'md'];
    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(switchVariants({ size }), className)}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block rounded-full transition-transform data-[state=unchecked]:translate-x-0.5',
            'data-[state=checked]:bg-on-primary data-[state=unchecked]:bg-on-surface-variant',
            thumb.size,
            thumb.translate,
          )}
        />
      </SwitchPrimitive.Root>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch, switchVariants };
