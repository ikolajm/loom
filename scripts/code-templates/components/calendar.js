const { filterSizes } = require('./helpers');

function generateCalendar(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';

  // Build size maps from config
  const containerEntries = {};
  const cellEntries = {};
  const headerEntries = {};
  const navIconEntries = {};

  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;

    // Container
    const cClasses = [];
    if (sz.width) cClasses.push(`w-[${sz.width}]`);
    const px = sz['x-padding']?.match(/\{scale\.(\d+)\}/);
    if (px) cClasses.push(`p-${px[1]}`);
    if (sz.radius === 'radius/card') cClasses.push('rounded-card');
    containerEntries[tier] = cClasses.join(' ');

    // Cell (day button) — font + radius only, sizing handled by flex
    const dClasses = [];
    if (sz['day-font-size']) dClasses.push(`text-[${sz['day-font-size']}]`);
    if (sz['day-line-height']) dClasses.push(`leading-[${sz['day-line-height']}]`);
    if (sz['day-radius'] === 'radius/component') dClasses.push('rounded-component');
    cellEntries[tier] = dClasses.join(' ');

    // Header
    const hClasses = [];
    if (sz['header-font-size']) hClasses.push(`text-[${sz['header-font-size']}]`);
    if (sz['header-line-height']) hClasses.push(`leading-[${sz['header-line-height']}]`);
    headerEntries[tier] = hClasses.join(' ');

    // Nav icon
    if (sz['nav-icon'] && sz['nav-icon'].startsWith('icon/')) {
      navIconEntries[tier] = `size-${sz['nav-icon'].replace('icon/', '')}`;
    }
  }

  return `'use client';

import { forwardRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';

const containerSizeMap: Record<string, string> = {
${Object.entries(containerEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const cellSizeMap: Record<string, string> = {
${Object.entries(cellEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const headerSizeMap: Record<string, string> = {
${Object.entries(headerEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const navIconSizeMap: Record<string, string> = {
${Object.entries(navIconEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')};
};

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ size = '${defaultSize}', className, classNames, ...props }, _ref) => {
    const cellSize = cellSizeMap[size];
    const headerSize = headerSizeMap[size];
    const navIcon = navIconSizeMap[size] || 'size-icon-2';

    return (
      <DayPicker
        className={cn(
          'bg-surface-1 text-on-surface border border-outline-subtle shadow-[var(--shadow-2)]',
          containerSizeMap[size],
          className,
        )}
        classNames={{
          months: 'flex flex-col gap-2',
          month: 'flex flex-col gap-2',
          month_caption: cn('flex items-center justify-center font-semibold', headerSize),
          nav: 'flex items-center gap-1',
          button_previous: cn('absolute left-1 top-0 inline-flex items-center justify-center rounded-component interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', cellSize),
          button_next: cn('absolute right-1 top-0 inline-flex items-center justify-center rounded-component interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', cellSize),
          weekdays: 'flex w-full',
          weekday: cn('flex flex-1 items-center justify-center font-medium text-on-surface-variant aspect-square', cellSize),
          week: 'flex w-full',
          day: cn('flex flex-1 items-center justify-center p-0 aspect-square'),
          day_button: cn('inline-flex w-full h-full items-center justify-center interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', cellSize),
          selected: '[&>button]:bg-primary [&>button]:text-on-primary [&>button]:rounded-component [&>button]:font-semibold',
          today: '[&>button]:ring-1 [&>button]:ring-primary [&>button]:font-semibold',
          outside: '[&>button]:text-on-surface-variant/50',
          disabled: '[&>button]:text-on-surface-variant/30 [&>button]:cursor-not-allowed [&>button]:pointer-events-none',
          range_middle: '[&>button]:bg-primary-container [&>button]:text-on-primary-container [&>button]:rounded-none',
          range_start: '[&>button]:bg-primary [&>button]:text-on-primary [&>button]:rounded-l-component [&>button]:rounded-r-none',
          range_end: '[&>button]:bg-primary [&>button]:text-on-primary [&>button]:rounded-r-component [&>button]:rounded-l-none',
          hidden: 'invisible',
          ...classNames,
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === 'left'
              ? <ChevronLeft className={navIcon} />
              : <ChevronRight className={navIcon} />,
        }}
        {...props}
      />
    );
  }
);
Calendar.displayName = 'Calendar';

export { Calendar, type CalendarProps };
`;
}

module.exports = { generateCalendar };
