'use client';

import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './cn';

const selectTriggerVariants = cva(
  'flex items-center justify-between w-full interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed data-[placeholder]:text-on-surface-variant',
  {
    variants: {
      state: {
        default: 'bg-surface text-on-surface border-outline-subtle border',
        error: 'bg-surface text-on-surface border-error border',
      },
      size: {
        sm: 'h-ch-3 px-3 py-1 gap-2 rounded-input text-input-sm',
        md: 'h-ch-5 px-4 py-2 gap-2 rounded-input text-input-md',
        lg: 'h-ch-7 px-4 py-3 gap-2 rounded-input text-input-lg',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & VariantProps<typeof selectTriggerVariants>
>(({ state, size, className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ state, size }), className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-on-surface-variant" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-[var(--z-popover)] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-input bg-surface-1 text-on-surface border border-outline-subtle shadow-[var(--shadow-2)] animate-fade-in',
        position === 'popper' && 'translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'w-full')}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full items-center rounded-component px-3 py-2 pr-8 text-action-sm cursor-pointer select-none',
      'focus:bg-surface-2 focus:text-on-surface focus:outline-none',
      'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-outline-subtle', className)} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

const SelectGroup = SelectPrimitive.Group;

const SelectLabel = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn('px-3 py-1.5 text-label-sm text-on-surface-variant font-semibold', className)} {...props} />
));
SelectLabel.displayName = 'SelectLabel';

export {
  Select, SelectValue, SelectTrigger, SelectContent,
  SelectItem, SelectSeparator, SelectGroup, SelectLabel,
  selectTriggerVariants,
};
