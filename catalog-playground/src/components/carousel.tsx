'use client';

import { Children, forwardRef, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from './cn';

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;
type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

const gapSize: Record<string, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
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
            <div className={cn('flex', gapSize[size])}>
              {Children.map(children, (child) => (
                <div className="min-w-0 shrink-0 basis-full" role="group" aria-roledescription="slide">
                  {child}
                </div>
              ))}
            </div>
          </div>

          {showArrows && (
            <>
              {/* Wrapper carries the absolute position — Button's .interactive utility forces
                  position:relative, so positioning the Button directly via className is overridden. */}
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
