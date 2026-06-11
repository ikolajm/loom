'use client';

import { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const progressVariants = cva('relative w-full overflow-hidden bg-surface-1', {
  variants: {
    variant: {
      default: '',
      success: '',
      warning: '',
      error: '',
    },
    size: {
      sm: 'h-1 rounded-pill',
      md: 'h-2 rounded-pill',
      lg: 'h-3 rounded-pill',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

const fillVariants: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

const ProgressBar = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & VariantProps<typeof progressVariants>
>(({ variant = 'default', size, value, className, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn('h-full w-full flex-1 rounded-pill transition-all', fillVariants[variant || 'default'])}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar, progressVariants };
