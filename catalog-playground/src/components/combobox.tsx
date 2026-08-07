'use client';

import { forwardRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from './cn';
import { useFieldError } from './form-field';

const itemSizeMap: Record<string, string> = {
  sm: 'h-menu-item-sm px-2 gap-1 text-action-sm',
  md: 'h-menu-item-md px-3 gap-2 text-action-md',
  lg: 'h-menu-item-lg px-4 gap-2 text-action-lg',
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
  error?: boolean;
  className?: string;
};

const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(
  ({ size = 'md', options, value, onValueChange, placeholder = 'Select...', searchPlaceholder = 'Search...', emptyMessage = 'No results found.', disabled, error, className }, ref) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);
    // Error border cascades off FormFieldContext unless an explicit error prop is given.
    const isError = useFieldError(error);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex items-center justify-between w-full border border-outline-subtle bg-surface text-on-surface rounded-input interactive cursor-pointer',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              'disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed',
              'h-control-md px-3 text-input-md',
              size === 'sm' && 'h-control-sm px-2 text-input-sm',
              size === 'lg' && 'h-control-lg px-4 text-input-lg',
              isError && 'border-error',
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
                className={cn('flex w-full bg-transparent py-3 outline-none placeholder:text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled)', size === 'sm' ? 'h-control-sm text-body-sm' : size === 'lg' ? 'h-control-lg text-body-lg' : 'h-control-md text-body-md')}
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
