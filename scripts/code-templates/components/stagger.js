// Stagger — cascade envelope. Reveals its children one-by-one with an incremental delay.
//
// Composes Reveal: each child is wrapped in a Reveal at delay = base + index*step. The entire
// hidden->shown machinery (IntersectionObserver, prefers-reduced-motion, will-change hygiene) is
// inherited from Reveal — Stagger adds exactly one thing, the per-child delay. Zero duplication.
//
// The Stagger element is itself the layout container, so a consumer writes
// <Stagger className="flex gap-4">...</Stagger> and the children cascade in within that layout.
// variant/easing/duration/threshold/once forward to every child.
function generateStagger(name, config, meta) {
  const def = config.default || {};
  const dStep = def.step ?? 80;
  const dDelay = def.delay ?? 0;
  const dVariant = def.variant || 'fade-up';
  const dEasing = def.easing || 'decelerate';
  const dDuration = def.duration || 'slow';
  const dThreshold = def.threshold ?? 0;
  const dOnce = def.once ?? true;

  return `'use client';

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
    step = ${dStep},
    delay = ${dDelay},
    variant = '${dVariant}',
    easing = '${dEasing}',
    duration = '${dDuration}',
    threshold = ${dThreshold},
    once = ${dOnce},
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
`;
}

module.exports = { generateStagger };
