'use client';

import { forwardRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from './cn';

const gapSize: Record<string, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
  showArrows?: boolean;
  showDots?: boolean;
};

const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ size = 'md', showArrows = true, showDots = true, className, children, ...props }, ref) => {
    const [current, setCurrent] = useState(0);
    const items = Array.isArray(children) ? children : [children];
    const count = items.length;

    const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);
    const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);

    return (
      <div ref={ref} className={cn('relative flex flex-col', gapSize[size], className)} {...props}>
        <div className="overflow-hidden rounded-card">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {items.map((child, i) => (
              <div key={i} className="w-full shrink-0">
                {child}
              </div>
            ))}
          </div>
        </div>

        {showArrows && count > 1 && (
          <>
            <Button
              variant="ghost"
              size="md"
              iconOnly
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/80"
              aria-label="Previous slide"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="md"
              iconOnly
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/80"
              aria-label="Next slide"
            >
              <ChevronRight />
            </Button>
          </>
        )}

        {showDots && count > 1 && (
          <div className="flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={cn(
                  'size-2 rounded-full transition-colors cursor-pointer',
                  i === current ? 'bg-primary' : 'bg-outline-subtle',
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
Carousel.displayName = 'Carousel';

export { Carousel };
