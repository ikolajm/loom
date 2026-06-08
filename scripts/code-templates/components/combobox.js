const { filterSizes } = require('./helpers');

function generateCombobox(name, config, meta) {
  const itemSizes = config.item?.sizes ? filterSizes(config.item.sizes) : {};
  const defaultSize = config.default?.size || 'md';

  // Item size map
  const itemEntries = {};
  for (const [tier, sz] of Object.entries(itemSizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    if (sz.height) classes.push(`h-${sz.height.replace('height/', '')}`);
    const px = sz['x-padding']?.match(/\{scale\.(\d+)\}/);
    if (px) classes.push(`px-${px[1]}`);
    const gap = sz.gap?.match(/\{scale\.(\d+)\}/);
    if (gap) classes.push(`gap-${gap[1]}`);
    if (sz['font-size']) classes.push(`text-[${sz['font-size']}]`);
    if (sz['line-height']) classes.push(`leading-[${sz['line-height']}]`);
    itemEntries[tier] = classes.join(' ');
  }

  return `'use client';

import { forwardRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from './cn';
import { useFieldError } from './form-field';

const itemSizeMap: Record<string, string> = {
${Object.entries(itemEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type ComboboxOption = { value: string; label: string };

type ComboboxProps = {
  size?: ${Object.keys(itemSizes).length > 0 ? Object.keys(itemSizes).map(k => `'${k}'`).join(' | ') : "'sm' | 'md' | 'lg'"};
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

const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(
  ({ size = '${defaultSize}', options, value, onValueChange, placeholder = 'Select...', searchPlaceholder = 'Search...', emptyMessage = 'No results found.', disabled, error, className }, ref) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);
    // Error border cascades off FormFieldContext unless an explicit error prop is given.
    const isError = useFieldError(error);

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
`;
}

module.exports = { generateCombobox };
