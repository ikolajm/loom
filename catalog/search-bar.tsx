'use client';

import { forwardRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from './cn';

const sizeMap: Record<string, string> = {
  sm: 'h-control-sm text-input-sm',
  md: 'h-control-md text-input-md',
  lg: 'h-control-lg text-input-lg',
};

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type SearchBarProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'>
  & {
    value?: string;
    onValueChange?: (value: string) => void;
    size?: 'sm' | 'md' | 'lg';
    onClear?: () => void;
    // Leading icon. Defaults to the search glyph; pass null to drop it (text aligns to the edge).
    icon?: React.ReactNode | null;
  };

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onValueChange, size = 'md', onClear, icon, placeholder = 'Search...', disabled, className, ...props }, ref) => {
    const [internal, setInternal] = useState('');
    const controlled = value !== undefined;
    const current = controlled ? value : internal;
    const setValue = (v: string) => { if (!controlled) setInternal(v); onValueChange?.(v); };
    const clear = () => { setValue(''); onClear?.(); };
    const iconSize = iconSizeMap[size];
    const hasIcon = icon !== null;
    const leading = icon === undefined ? <Search /> : icon;

    return (
      <div className={cn('relative flex w-full items-center', className)}>
        {hasIcon && (
          <span className={cn('pointer-events-none absolute left-3 z-10 inline-flex shrink-0 text-on-surface-variant [&>svg]:size-full', iconSize)}>{leading}</span>
        )}
        <input
          ref={ref}
          type="search"
          value={current}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-input border border-outline-subtle bg-surface text-on-surface',
            'pr-9 interactive cursor-text placeholder:text-on-surface-variant',
            hasIcon ? 'pl-9' : 'pl-3',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[&::-webkit-search-cancel-button]:appearance-none',
            sizeMap[size],
          )}
          {...props}
        />
        {current && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className={cn('absolute right-3 inline-flex items-center justify-center text-on-surface-variant transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', iconSize)}
          >
            <X className="size-full" />
          </button>
        )}
      </div>
    );
  }
);
SearchBar.displayName = 'SearchBar';

export { SearchBar };
