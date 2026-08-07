const { filterSizes } = require('./helpers');

// Sliding content container on an embla-carousel-react base (the registry-declared primitive).
// embla owns the hard interaction half — touch/drag inertia, snap points, loop — that a hand-rolled
// translateX index can't do honestly. Loom owns the chrome: ghost-button arrows, dot indicators,
// keyboard (arrow keys), and the token-driven gap/radius/inset. The motion variants (coverflow /
// parallax / lightbox / thumbnail) layer on top and are gated on the motion-library adoption
// decision — see CATALOG_SPEC.md, "Scope".
//
// Tailwind needs literal class strings (runtime-interpolated classes are scanner-blind), so the
// per-size gap + arrow insets are emitted as full literal classes, not composed at runtime.
function generateCarousel(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';
  const sizeUnion = Object.keys(sizes).map((k) => `'${k}'`).join(' | ') || "'sm' | 'md' | 'lg'";

  const slidePadEntries = {};
  const trackOffsetEntries = {};
  const leftEntries = {};
  const rightEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    const gap = sz.gap?.match(/\{scale\.(\d+)\}/);
    const gapN = gap ? gap[1] : '4';
    // Inter-slide spacing rides on each slide (pl) with the track offset (-ml) cancelling
    // the leading slide's pad — so the gap survives embla's loop wrap (CSS `gap` does not).
    slidePadEntries[tier] = `pl-${gapN}`;
    trackOffsetEntries[tier] = `-ml-${gapN}`;
    const off = sz['arrow-offset']?.match(/\{scale\.(\d+)\}/);
    const n = off ? off[1] : '3';
    leftEntries[tier] = `left-${n}`;
    rightEntries[tier] = `right-${n}`;
  }

  return `'use client';

import { Children, forwardRef, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from './cn';

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;
type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

const slidePad: Record<string, string> = {
${Object.entries(slidePadEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const trackOffset: Record<string, string> = {
${Object.entries(trackOffsetEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const arrowLeft: Record<string, string> = {
${Object.entries(leftEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const arrowRight: Record<string, string> = {
${Object.entries(rightEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: ${sizeUnion};
  showArrows?: boolean;
  showDots?: boolean;
  loop?: boolean;
  opts?: EmblaOptions;
};

const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ size = '${defaultSize}', showArrows = true, showDots = true, loop = false, opts, className, children, ...props }, ref) => {
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
                aria-label={\`Go to slide \${i + 1}\`}
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
`;
}

module.exports = { generateCarousel };
