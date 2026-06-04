'use client';

import { forwardRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
  sm: 'h-ch-3 px-2 gap-1 text-[12px] leading-[16px]',
  md: 'h-ch-4 px-3 gap-2 text-[14px] leading-[20px]',
  lg: 'h-ch-5 px-4 gap-2 text-[16px] leading-[24px]',
};

type ComboboxOption = { value: string; label: string };

type ComboboxProps = {
  size?: 'sm' | 'md' | 'lg';
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
};

const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(
  ({ size = 'md', options, value, onValueChange, placeholder = 'Select...', searchPlaceholder = 'Search...', emptyMessage = 'No results found.', disabled, className }, ref) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref as any}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex items-center justify-between w-full border border-outline-subtle bg-surface text-on-surface rounded-input interactive cursor-pointer',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'h-ch-5 px-3 text-input-md',
              size === 'sm' && 'h-ch-3 px-2 text-input-sm',
              size === 'lg' && 'h-ch-7 px-4 text-input-lg',
              className,
            )}
          >
            <span className={cn(!selected && 'text-on-surface-variant')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 shrink-0 size-icon-1 text-on-surface-variant" />
          </button>
        </PopoverTrigger>
        <PopoverContent size={size} className="p-0 w-[var(--radix-popover-trigger-width)]">
          <CommandPrimitive className="flex flex-col overflow-hidden">
            <div className={cn('flex items-center border-b border-outline-subtle', size === 'sm' ? 'px-2' : size === 'lg' ? 'px-4' : 'px-3')}>
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                className={cn('flex w-full bg-transparent py-3 outline-none placeholder:text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-50', size === 'sm' ? 'h-ch-3 text-body-sm' : size === 'lg' ? 'h-ch-7 text-body-lg' : 'h-ch-5 text-body-md')}
              />
            </div>
            <CommandPrimitive.List className="max-h-[200px] overflow-y-auto overflow-x-hidden p-1">
              <CommandPrimitive.Empty className="py-4 text-center text-body-sm text-on-surface-variant">
                {emptyMessage}
              </CommandPrimitive.Empty>
              {options.map((option) => (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange?.(option.value === value ? '' : option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex items-center select-none interactive cursor-pointer rounded-component',
                    'data-[selected=true]:bg-surface-2',
                    itemSizeMap[size],
                  )}
                >
                  <Check className={cn('mr-2 size-icon-1', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>
    );
  }
);
Combobox.displayName = 'Combobox';

export { Combobox, type ComboboxOption };
