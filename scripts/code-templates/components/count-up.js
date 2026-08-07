// CountUp — leaf motion atom. Animates a number from `from` to `value` when scrolled into view.
//
// Own IntersectionObserver triggers the count; requestAnimationFrame interpolates the value with
// easeOutCubic. Formats through Intl.NumberFormat directly — separators, decimals, currency and
// compact notation — so the animated value and its formatting stay in one place.
//
// NO spring/overshoot axis: a stat animating 97 -> 104 -> 99 reads as a data error, not delight.
// Reduced-motion is a JS matchMedia check (a leaf that animates a JS value can't use the pure-CSS
// motion-safe gate reveal/stagger use) — under reduce it snaps straight to the target.
// `decimals` defaults to the target's own precision so the count doesn't jitter through fractions.
function generateCountUp(name, config, meta) {
  const def = config.default || {};
  const dFrom = def.from ?? 0;
  const dDuration = def.duration ?? 1200;
  const dEasing = def.easing || 'ease-out';
  const dThreshold = def.threshold ?? 0;
  const dOnce = def.once ?? true;

  return `'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { cn } from './cn';

type CountUpFormat = 'decimal' | 'currency' | 'percent' | 'unit';

export interface CountUpProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Target value to count to. */
  value: number;
  /** Start value. */
  from?: number;
  /** Count duration in ms (content-dependent — not the --transition-* token axis). */
  duration?: number;
  /** Interpolation curve. No spring: numeric overshoot reads as a data error. */
  easing?: 'ease-out' | 'linear';
  /** Fraction of the element visible before counting starts (0-1). */
  threshold?: number;
  /** Count once then stop observing, or re-run each time it re-enters view. */
  once?: boolean;
  /** Fraction digits held steady during the count. Defaults to the target value's own precision. */
  decimals?: number;
  // --- Intl formatting ---
  format?: CountUpFormat;
  currency?: string;
  unit?: string;
  notation?: Intl.NumberFormatOptions['notation'];
  locale?: string;
  options?: Intl.NumberFormatOptions;
}

const EASE: Record<NonNullable<CountUpProps['easing']>, (t: number) => number> = {
  'ease-out': (t) => 1 - Math.pow(1 - t, 3),
  linear: (t) => t,
};

// Decimal places in a number literal — so the count holds the target's precision instead of
// jittering through Intl's default fraction digits.
function precisionOf(n: number): number {
  if (Number.isInteger(n)) return 0;
  const s = String(n);
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : s.length - dot - 1;
}

export const CountUp = forwardRef<HTMLSpanElement, CountUpProps>(function CountUp(
  {
    value,
    from = ${dFrom},
    duration = ${dDuration},
    easing = '${dEasing}',
    threshold = ${dThreshold},
    once = ${dOnce},
    decimals,
    format,
    currency,
    unit,
    notation,
    locale,
    options,
    className,
    ...props
  },
  forwardedRef,
) {
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const [current, setCurrent] = useState(from);

  const setRefs = useCallback(
    (node: HTMLSpanElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setCurrent(value); // snap to target, skip the count
      return;
    }

    let raf = 0;
    let start = 0;
    const ease = EASE[easing];
    const tick = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      setCurrent(from + (value - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start = 0;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(tick);
          if (once) observer.disconnect();
        } else if (!once) {
          cancelAnimationFrame(raf);
          setCurrent(from);
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [value, from, duration, easing, threshold, once]);

  const dec = decimals ?? precisionOf(value);

  // currency needs a code, unit needs a unit; if the caller omitted it, degrade to a plain
  // number rather than letting Intl throw (symmetric — neither format is special-cased).
  const style =
    (format === 'currency' && !currency) || (format === 'unit' && !unit) ? 'decimal' : format;
  const formatted = new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    unit: style === 'unit' ? unit : undefined,
    notation,
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    ...options,
  }).format(current);

  return (
    <span ref={setRefs} className={cn('tabular-nums', className)} {...props}>
      {formatted}
    </span>
  );
});
`;
}

module.exports = { generateCountUp };
