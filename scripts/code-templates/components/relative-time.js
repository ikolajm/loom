// Relative timestamp ("2 hours ago") via Intl.RelativeTimeFormat. Client component because it
// needs "now". The <time dateTime> renders an SSR-stable UTC date (iso.slice(0,10)) on the
// server and first client paint — identical on both, so no hydration mismatch — then swaps to
// the relative string after mount. `live` re-computes every minute (interval cleared on unmount).
function generateRelativeTime(name, config, meta) {
  return `'use client';

import { forwardRef, useEffect, useState } from 'react';
import { cn } from './cn';

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

function formatRelative(date: Date, locale: string | undefined, numeric: 'auto' | 'always') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), 'years');
}

type RelativeTimeProps = Omit<React.TimeHTMLAttributes<HTMLTimeElement>, 'children'> & {
  date: Date | string | number;
  live?: boolean;
  locale?: string;
  numeric?: 'auto' | 'always';
};

const RelativeTime = forwardRef<HTMLTimeElement, RelativeTimeProps>(
  ({ date, live = false, locale, numeric = 'auto', className, ...props }, ref) => {
    const target = date instanceof Date ? date : new Date(date);
    const valid = !Number.isNaN(target.getTime());
    const iso = valid ? target.toISOString() : '';
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
      if (!valid) return;
      const update = () => setLabel(formatRelative(target, locale, numeric));
      update();
      if (!live) return;
      const id = setInterval(update, 60_000);
      return () => clearInterval(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iso, valid, live, locale, numeric]);

    // Invalid date in → render the raw input rather than throwing on toISOString().
    if (!valid) {
      return <time ref={ref} className={cn(className)} {...props}>{String(date)}</time>;
    }

    return (
      <time ref={ref} dateTime={iso} className={cn(className)} {...props}>
        {label ?? iso.slice(0, 10)}
      </time>
    );
  }
);
RelativeTime.displayName = 'RelativeTime';

export { RelativeTime };
`;
}

module.exports = { generateRelativeTime };
