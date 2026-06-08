'use client';

import { forwardRef, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from './cn';

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-2',
  md: 'size-icon-3',
  lg: 'size-icon-4',
};

const gapMap: Record<string, string> = {
  sm: 'gap-1',
  md: 'gap-1',
  lg: 'gap-2',
};

type RatingProps = {
  max?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  allowHalf?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

const Rating = forwardRef<HTMLDivElement, RatingProps>(
  ({ max = 5, value = 0, onValueChange, allowHalf = false, readOnly = false, size = 'md', icon: Icon = Star, className }, ref) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const display = hovered ?? value;
    const iconSize = iconSizeMap[size];
    const interactive = !readOnly && !!onValueChange;

    const star = (i: number) => {
      const fraction = Math.max(0, Math.min(1, display - i));
      return (
        <span className={cn('relative block', iconSize)}>
          <Icon className={cn('fill-transparent text-outline', iconSize)} />
          {fraction > 0 && (
            <span className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
              <Icon className={cn('fill-primary text-primary', iconSize)} />
            </span>
          )}
        </span>
      );
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center', gapMap[size], className)}
        onMouseLeave={() => { if (interactive) setHovered(null); }}
      >
        {Array.from({ length: max }, (_, i) => {
          if (!interactive) return <span key={i} className="inline-flex">{star(i)}</span>;
          return (
            <span key={i} className="relative inline-flex">
              {star(i)}
              {allowHalf ? (
                <>
                  <button type="button" aria-label={`Rate ${i + 0.5}`} onMouseEnter={() => setHovered(i + 0.5)} onClick={() => onValueChange?.(i + 0.5)}
                    className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
                  <button type="button" aria-label={`Rate ${i + 1}`} onMouseEnter={() => setHovered(i + 1)} onClick={() => onValueChange?.(i + 1)}
                    className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
                </>
              ) : (
                <button type="button" aria-label={`Rate ${i + 1}`} onMouseEnter={() => setHovered(i + 1)} onClick={() => onValueChange?.(i + 1)}
                  className="absolute inset-0 z-10 cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
              )}
            </span>
          );
        })}
      </div>
    );
  }
);
Rating.displayName = 'Rating';

export { Rating };
