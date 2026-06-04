'use client';

import { forwardRef, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Calendar } from './Calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from './cn';

const triggerSizeMap: Record<string, string> = {
  sm: 'h-ch-3 px-2 text-input-sm',
  md: 'h-ch-5 px-3 text-input-md',
  lg: 'h-ch-7 px-4 text-input-lg',
};

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type DatePickerProps = {
  size?: 'sm' | 'md' | 'lg';
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ size = 'md', value, onValueChange, placeholder = 'Pick a date', disabled, className }, ref) => {
    const [open, setOpen] = useState(false);

    const formatted = value
      ? value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            className={cn(
              'flex items-center justify-between w-full border border-outline-subtle bg-surface text-on-surface rounded-input interactive cursor-pointer',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              triggerSizeMap[size],
              className,
            )}
          >
            <span className={cn(!formatted && 'text-on-surface-variant')}>
              {formatted || placeholder}
            </span>
            <CalendarIcon className={cn('shrink-0 text-on-surface-variant', iconSizeMap[size])} />
          </button>
        </PopoverTrigger>
        <PopoverContent size={size} className="w-auto p-0" align="start">
          <Calendar
            size={size}
            mode="single"
            selected={value}
            onSelect={(date) => {
              onValueChange?.(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
