'use client';

import { forwardRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';

const containerSizeMap: Record<string, string> = {
  compact: 'w-[208px] p-1 rounded-card',
  sm: 'w-[240px] p-2 rounded-card',
  md: 'w-[280px] p-3 rounded-card',
  lg: 'w-[320px] p-4 rounded-card',
};

const cellSizeMap: Record<string, string> = {
  compact: 'text-action-sm rounded-component',
  sm: 'text-action-sm rounded-component',
  md: 'text-action-md rounded-component',
  lg: 'text-action-lg rounded-component',
};

const headerSizeMap: Record<string, string> = {
  compact: 'text-action-sm',
  sm: 'text-action-md',
  md: 'text-action-md',
  lg: 'text-action-lg',
};

const navIconSizeMap: Record<string, string> = {
  compact: 'size-icon-1',
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

const navSizeMap: Record<string, string> = {
  compact: 'h-[16px] w-[16px]',
  sm: 'h-[20px] w-[20px]',
  md: 'h-[20px] w-[20px]',
  lg: 'h-[24px] w-[24px]',
};

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  size?: 'compact' | 'sm' | 'md' | 'lg';
};

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ size = 'md', className, classNames, ...props }, _ref) => {
    const cellSize = cellSizeMap[size];
    const headerSize = headerSizeMap[size];
    const navIcon = navIconSizeMap[size] || 'size-icon-2';
    const navSize = navSizeMap[size];

    return (
      <DayPicker
        navLayout="around"
        className={cn(
          'bg-surface-1 text-on-surface border border-outline-subtle shadow-[var(--shadow-2)]',
          containerSizeMap[size],
          className,
        )}
        classNames={{
          months: 'flex flex-col gap-2',
          // One flex row: navLayout=around puts the buttons either side of the caption in
          // source order, so the trio needs no ordering. The grid takes w-full and wraps
          // onto its own line. RDP's own stylesheet does this with absolute positioning,
          // which needs a containing block the atom never established.
          month: 'flex flex-wrap items-center gap-2',
          month_caption: cn('flex flex-1 items-center justify-center', headerSize),
          nav: 'flex items-center gap-1',
          button_previous: cn('inline-flex shrink-0 items-center justify-center rounded-component interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', navSize),
          button_next: cn('inline-flex shrink-0 items-center justify-center rounded-component interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', navSize),
          month_grid: 'w-full',
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
