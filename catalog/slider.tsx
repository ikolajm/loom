'use client';

import { forwardRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from './cn';

const sliderSizeConfig: Record<string, { track: string; thumb: string }> = {
  sm: { track: 'h-1', thumb: 'size-4' },
  md: { track: 'h-1', thumb: 'size-5' },
  lg: { track: 'h-2', thumb: 'size-6' },
};

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  size?: 'sm' | 'md' | 'lg';
};

const Slider = forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const s = sliderSizeConfig[size];
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[disabled]:pointer-events-none', className)}
        {...props}
      >
        <SliderPrimitive.Track className={cn('relative w-full grow overflow-hidden rounded-pill bg-surface-1', s.track)}>
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className={cn('block rounded-full bg-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', s.thumb)} />
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
