import { forwardRef } from 'react';
import { cn } from './cn';

type NumberFormat = 'decimal' | 'currency' | 'percent' | 'unit';

type NumberDisplayProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  value: number;
  format?: NumberFormat;
  currency?: string;
  unit?: string;
  notation?: Intl.NumberFormatOptions['notation'];
  locale?: string;
  options?: Intl.NumberFormatOptions;
};

const NumberDisplay = forwardRef<HTMLSpanElement, NumberDisplayProps>(
  ({ value, format = 'decimal', currency, unit, notation, locale, options, className, ...props }, ref) => {
    // currency needs a code, unit needs a unit; if the caller omitted it, degrade to a plain
    // number rather than letting Intl throw (symmetric — neither format is special-cased).
    const style =
      (format === 'currency' && !currency) || (format === 'unit' && !unit) ? 'decimal' : format;
    const formatted = new Intl.NumberFormat(locale, {
      style,
      currency: style === 'currency' ? currency : undefined,
      unit: style === 'unit' ? unit : undefined,
      notation,
      ...options,
    }).format(value);
    return (
      <span ref={ref} className={cn('tabular-nums', className)} {...props}>
        {formatted}
      </span>
    );
  }
);
NumberDisplay.displayName = 'NumberDisplay';

export { NumberDisplay };
