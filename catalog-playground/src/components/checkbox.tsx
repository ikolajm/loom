'use client';

import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { cn } from './cn';

const checkboxVariants = cva(
  'peer shrink-0 cursor-pointer rounded-component border border-outline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-on-primary',
  {
    variants: {
      size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const checkboxIconSize: Record<string, string> = {
  sm: 'size-[13px]',
  md: 'size-4',
  lg: 'size-[19px]',
};

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
  & VariantProps<typeof checkboxVariants>;

const Checkbox = forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ size, className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center')}>
        <Check className={checkboxIconSize[size || 'md']} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
