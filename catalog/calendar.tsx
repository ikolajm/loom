'use client';

import { forwardRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';

const containerSizeMap: Record<string, string> = {
  sm: 'w-[240px] p-2 rounded-card',
  md: 'w-[280px] p-3 rounded-card',
  lg: 'w-[320px] p-4 rounded-card',
};

const cellSizeMap: Record<string, string> = {
  sm: 'text-[12px] leading-[16px] rounded-component',
  md: 'text-[14px] leading-[20px] rounded-component',
  lg: 'text-[16px] leading-[24px] rounded-component',
};

const headerSizeMap: Record<string, string> = {
  sm: 'text-[14px] leading-[20px]',
  md: 'text-[14px] leading-[20px]',
  lg: 'text-[16px] leading-[24px]',
};

const navIconSizeMap: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  size?: 'sm' | 'md' | 'lg';
};

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ size = 'md', className, classNames, ...props }, _ref) => {
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
