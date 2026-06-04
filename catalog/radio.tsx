'use client';

import { forwardRef } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const radioItemVariants = cva(
  'aspect-square rounded-full border-2 border-outline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
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

const radioDotSize: Record<string, string> = {
  sm: 'size-[6px]',
  md: 'size-[8px]',
  lg: 'size-[10px]',
};

const RadioGroup = forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
  & VariantProps<typeof radioItemVariants>;

const RadioGroupItem = forwardRef<React.ComponentRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  ({ size, className, ...props }, ref) => (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioItemVariants({ size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className={cn('rounded-full bg-primary', radioDotSize[size || 'md'])} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
);
RadioGroupItem.displayName = 'RadioGroupItem';

// Alias for story/registry compatibility
const Radio = RadioGroup;

export { RadioGroup, RadioGroupItem, Radio, radioItemVariants };
