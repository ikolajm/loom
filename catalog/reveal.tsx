'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from './cn';

export type RevealVariant = 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale';
export type RevealEasing = 'standard' | 'decelerate' | 'accelerate' | 'emphasized' | 'spring-smooth' | 'spring-snappy' | 'spring-bounce';
export type RevealDuration = 'fast' | 'normal' | 'slow';

// Initial hidden transform per variant. motion-safe: prefix → under prefers-reduced-motion these
// never apply, so content is visible immediately (no JS reduced-motion branch needed).
const FROM_CLASS: Record<RevealVariant, string> = {
  'fade': 'motion-safe:opacity-0',
  'fade-up': 'motion-safe:opacity-0 motion-safe:translate-y-4',
  'fade-down': 'motion-safe:opacity-0 motion-safe:-translate-y-4',
  'fade-left': 'motion-safe:opacity-0 motion-safe:translate-x-4',
  'fade-right': 'motion-safe:opacity-0 motion-safe:-translate-x-4',
  'scale': 'motion-safe:opacity-0 motion-safe:scale-95',
};

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** Enter animation — selects the initial hidden transform. */
  variant?: RevealVariant;
  /** Easing token: a bezier (standard/decelerate/accelerate/emphasized) or a spring (smooth/snappy/bounce). */
  easing?: RevealEasing;
  /** Transition duration token. */
  duration?: RevealDuration;
  /** Delay before the transition starts, in ms. Stagger drives this per child. */
  delay?: number;
  /** Fraction of the element visible before it reveals (0-1). 0 fires on first pixel — safe for elements taller than the viewport. */
  threshold?: number;
  /** Reveal once then stop observing, or re-run each time the element re-enters view. */
  once?: boolean;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  {
    variant = 'fade-up',
    easing = 'decelerate',
    duration = 'slow',
    delay = 0,
    threshold = 0,
    once = true,
    className,
    style,
    children,
    ...props
  },
  forwardedRef,
) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Merge the IO ref with the forwarded ref, stable across renders (no per-render detach/reattach).
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    // No IO support (old engines, some test envs) → reveal rather than trap content hidden.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  const motionStyle: CSSProperties = {
    transitionDuration: `var(--transition-${duration})`,
    transitionTimingFunction: `var(--easing-${easing})`,
    transitionDelay: delay ? `${delay}ms` : undefined,
    // will-change only while a transition is pending — dropped once revealed (hygiene).
    willChange: revealed ? undefined : 'opacity, transform',
    ...style,
  };

  return (
    <div
      ref={setRefs}
      data-state={revealed ? 'revealed' : 'hidden'}
      className={cn('transition', revealed ? '' : FROM_CLASS[variant], className)}
      style={motionStyle}
      {...props}
    >
      {children}
    </div>
  );
});
