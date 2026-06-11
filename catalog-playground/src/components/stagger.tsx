'use client';

import { Children, forwardRef, isValidElement, type HTMLAttributes } from 'react';
import { Reveal, type RevealVariant, type RevealEasing, type RevealDuration } from './reveal';

export interface StaggerProps extends HTMLAttributes<HTMLDivElement> {
  /** Milliseconds between consecutive children. */
  step?: number;
  /** Base delay before the first child reveals, in ms. */
  delay?: number;
  /** Enter animation, forwarded to every child. */
  variant?: RevealVariant;
  /** Easing token, forwarded to every child. */
  easing?: RevealEasing;
  /** Duration token, forwarded to every child. */
  duration?: RevealDuration;
  /** IO threshold, forwarded to every child. */
  threshold?: number;
  /** Reveal once vs re-run on re-enter, forwarded to every child. */
  once?: boolean;
}

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(function Stagger(
  {
    step = 80,
    delay = 0,
    variant = 'fade-up',
    easing = 'decelerate',
    duration = 'slow',
    threshold = 0,
    once = true,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div ref={ref} className={className} {...props}>
      {Children.toArray(children).map((child, i) => (
        <Reveal
          key={isValidElement(child) && child.key != null ? child.key : i}
          delay={delay + i * step}
          variant={variant}
          easing={easing}
          duration={duration}
          threshold={threshold}
          once={once}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
});
