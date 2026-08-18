'use client';

import { Children, forwardRef, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from './cn';

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;
type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

const slidePad: Record<string, string> = {
  sm: 'pl-3',
  md: 'pl-4',
  lg: 'pl-6',
};

const trackOffset: Record<string, string> = {
  sm: '-ml-3',
  md: '-ml-4',
  lg: '-ml-6',
};

const arrowLeft: Record<string, string> = {
  sm: 'left-2',
  md: 'left-3',
  lg: 'left-4',
};

const arrowRight: Record<string, string> = {
  sm: 'right-2',
  md: 'right-3',
  lg: 'right-4',
};

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
  showArrows?: boolean;
  showDots?: boolean;
  loop?: boolean;
  opts?: EmblaOptions;
};

const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ size = 'md', showArrows = true, showDots = true, loop = false, opts, className, children, ...props }, ref) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop, ...opts });
    const [selected, setSelected] = useState(0);
    const [snaps, setSnaps] = useState<number[]>([]);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const onSelect = useCallback((api: EmblaApi) => {
      setSelected(api.selectedScrollSnap());
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    }, []);

    useEffect(() => {
      if (!emblaApi) return;
      const sync = () => { setSnaps(emblaApi.scrollSnapList()); onSelect(emblaApi); };
      sync();
      emblaApi.on('select', onSelect).on('reInit', sync);
      return () => { emblaApi.off('select', onSelect).off('reInit', sync); };
    }, [emblaApi, onSelect]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); emblaApi?.scrollPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); emblaApi?.scrollNext(); }
    }, [emblaApi]);

    return (
      <div
        ref={ref}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn('flex flex-col gap-4 rounded-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', className)}
        {...props}
      >
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden rounded-card">
            <div className={cn('flex', trackOffset[size])}>
              {Children.map(children, (child) => (
                <div className={cn('min-w-0 shrink-0 basis-full', slidePad[size])} role="group" aria-roledescription="slide">
                  {child}
                </div>
              ))}
            </div>
          </div>

          {showArrows && (
            <>
              {/* Wrapper carries the absolute position. This was required when .interactive was
                  unlayered and its position:relative outranked an absolute on the same
                  element; in @layer components it no longer is. Kept because it works and
                  collapsing it is an untested restructure, not because the constraint holds. */}
              <div className={cn('absolute top-1/2 z-10 -translate-y-1/2', arrowLeft[size])}>
                <Button
                  variant="ghost"
                  size="md"
                  iconOnly
                  onClick={() => emblaApi?.scrollPrev()}
                  disabled={!loop && !canPrev}
                  className="rounded-full bg-surface/80"
                  aria-label="Previous slide"
                >
                  <ChevronLeft />
                </Button>
              </div>
              <div className={cn('absolute top-1/2 z-10 -translate-y-1/2', arrowRight[size])}>
                <Button
                  variant="ghost"
                  size="md"
                  iconOnly
                  onClick={() => emblaApi?.scrollNext()}
                  disabled={!loop && !canNext}
                  className="rounded-full bg-surface/80"
                  aria-label="Next slide"
                >
                  <ChevronRight />
                </Button>
              </div>
            </>
          )}
        </div>

        {showDots && snaps.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  'size-2 rounded-full transition-colors cursor-pointer',
                  i === selected ? 'bg-primary' : 'bg-outline-subtle',
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === selected}
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
