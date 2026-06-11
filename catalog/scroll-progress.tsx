'use client';

import { forwardRef, useCallback, useEffect, useRef, type HTMLAttributes, type RefObject } from 'react';
import { cn } from './cn';

type ScrollProgressPosition = 'top' | 'bottom' | 'inline';

export interface ScrollProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Scroll source to track. Omit to track the whole page (window). */
  target?: RefObject<HTMLElement | null>;
  /** Fixed top/bottom bar, or inline (the consumer positions it). */
  position?: ScrollProgressPosition;
  /** Render the unfilled track behind the fill. */
  showTrack?: boolean;
}

const POSITION_CLASS: Record<ScrollProgressPosition, string> = {
  top: 'fixed inset-x-0 top-0 z-50',
  bottom: 'fixed inset-x-0 bottom-0 z-50',
  inline: 'relative w-full',
};

export const ScrollProgress = forwardRef<HTMLDivElement, ScrollProgressProps>(function ScrollProgress(
  { target, position = 'top', showTrack = false, className, ...props },
  forwardedRef,
) {
  const barRef = useRef<HTMLDivElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      barRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const el = target?.current ?? null; // null → track the page
    const scroller: HTMLElement | Window = el ?? window;

    let raf = 0;
    const measure = () => {
      raf = 0;
      let scrolled: number;
      let scrollable: number;
      if (el) {
        scrolled = el.scrollTop;
        scrollable = el.scrollHeight - el.clientHeight;
      } else {
        const doc = document.documentElement;
        scrolled = doc.scrollTop || document.body.scrollTop;
        scrollable = doc.scrollHeight - doc.clientHeight;
      }
      const p = scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;
      bar.style.setProperty('--progress', String(p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target]);

  return (
    <div
      ref={setRefs}
      className={cn(POSITION_CLASS[position], 'h-[3px] overflow-hidden', showTrack && 'bg-surface-2', className)}
      {...props}
    >
      <div
        className="h-full w-full origin-left bg-primary"
        style={{ transform: 'scaleX(var(--progress, 0))' }}
      />
    </div>
  );
});
