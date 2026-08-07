import { forwardRef } from 'react';
import { cn } from './cn';

const shapeMap: Record<string, string> = {
  text: 'h-2 w-full rounded-component',
  avatar: 'h-10 w-10 rounded-full',
  card: 'h-24 w-full rounded-card',
};

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  shape?: 'text' | 'avatar' | 'card';
};

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ shape, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-surface-1',
        shape ? shapeMap[shape] : 'h-4 w-full rounded-component',
        className,
      )}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
