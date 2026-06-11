const { filterSizes } = require('./helpers');

// Star (or custom-icon) rating input. The base icon renders IN FLOW so every star box has real
// dimensions (an all-absolute box collapses its hit area); the filled overlay is clipped to value,
// and transparent click zones sit on top. Interactive (buttons + hover) unless readOnly / no handler.
function generateRating(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const iconEntries = {};
  const gapEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
    const gap = sz.gap && sz.gap.match(/\{scale\.(\d+)\}/);
    gapEntries[tier] = gap ? `gap-${gap[1]}` : 'gap-1';
  }
  const defaultSize = config.default?.size || 'md';
  const sizeUnion = Object.keys(sizes).map(k => `'${k}'`).join(' | ') || "'sm' | 'md' | 'lg'";

  return `'use client';

import { forwardRef, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from './cn';

const iconSizeMap: Record<string, string> = {
${Object.entries(iconEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const gapMap: Record<string, string> = {
${Object.entries(gapEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type RatingProps = {
  max?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  allowHalf?: boolean;
  readOnly?: boolean;
  size?: ${sizeUnion};
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

const Rating = forwardRef<HTMLDivElement, RatingProps>(
  ({ max = 5, value = 0, onValueChange, allowHalf = false, readOnly = false, size = '${defaultSize}', icon: Icon = Star, className }, ref) => {
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
            <span className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: \`\${fraction * 100}%\` }}>
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
                  <button type="button" aria-label={\`Rate \${i + 0.5}\`} onMouseEnter={() => setHovered(i + 0.5)} onClick={() => onValueChange?.(i + 0.5)}
                    className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
                  <button type="button" aria-label={\`Rate \${i + 1}\`} onMouseEnter={() => setHovered(i + 1)} onClick={() => onValueChange?.(i + 1)}
                    className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
                </>
              ) : (
                <button type="button" aria-label={\`Rate \${i + 1}\`} onMouseEnter={() => setHovered(i + 1)} onClick={() => onValueChange?.(i + 1)}
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
`;
}

module.exports = { generateRating };
