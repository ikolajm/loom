// Reveal — scroll-reveal envelope on a hand-rolled IntersectionObserver (zero runtime dep).
//
// Holds children in an initial hidden state (motion-safe: opacity 0 + a small transform) and
// transitions them to the resting state when the element scrolls into view. The interesting
// half — observing viewport intersection — is ~15 lines of standard IO; pulling `motion` for it
// wouldn't earn its place (see CATALOG_AUDIT Motion: the lib threshold is the wider families).
//
// prefers-reduced-motion is handled PURELY in CSS: the from-state classes carry a `motion-safe:`
// prefix, so under reduce they never apply — content renders instantly, no JS branch needed.
//
// The from-state classes come from config (literal strings → Tailwind-scanner-safe). Duration and
// easing are inline-styled from the substrate CSS vars (--transition-*, --easing-*) so the prop
// values stay fully dynamic without scanner-blind runtime class interpolation. `stagger` composes
// this by driving `delay` per child.
function generateReveal(name, config, meta) {
  const variants = config.variants || {};
  const variantKeys = Object.keys(variants);
  const variantUnion = variantKeys.map((k) => `'${k}'`).join(' | ') || "'fade'";
  const fromEntries = variantKeys.map((k) => `  '${k}': '${variants[k].from}',`).join('\n');

  const def = config.default || {};
  const dVariant = def.variant || variantKeys[0] || 'fade';
  const dEasing = def.easing || 'decelerate';
  const dDuration = def.duration || 'slow';
  const dThreshold = def.threshold ?? 0;
  const dOnce = def.once ?? true;

  return `'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from './cn';

export type RevealVariant = ${variantUnion};
export type RevealEasing = 'standard' | 'decelerate' | 'accelerate' | 'emphasized' | 'spring-smooth' | 'spring-snappy' | 'spring-bounce';
export type RevealDuration = 'fast' | 'normal' | 'slow';

// Initial hidden transform per variant. motion-safe: prefix → under prefers-reduced-motion these
// never apply, so content is visible immediately (no JS reduced-motion branch needed).
const FROM_CLASS: Record<RevealVariant, string> = {
${fromEntries}
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
    variant = '${dVariant}',
    easing = '${dEasing}',
    duration = '${dDuration}',
    delay = 0,
    threshold = ${dThreshold},
    once = ${dOnce},
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
    transitionDuration: \`var(--transition-\${duration})\`,
    transitionTimingFunction: \`var(--easing-\${easing})\`,
    transitionDelay: delay ? \`\${delay}ms\` : undefined,
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
`;
}

module.exports = { generateReveal };
