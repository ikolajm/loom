import { forwardRef } from 'react';
import { cn } from './cn';

const aspectMap: Record<string, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  'auto': '',
};

type VideoPlayerProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  fit?: 'cover' | 'contain';
};

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ aspectRatio = '16/9', fit = 'cover', controls = true, className, ...props }, ref) => (
    <div className={cn('overflow-hidden rounded-component bg-surface-1', aspectMap[aspectRatio], className)}>
      <video
        ref={ref}
        controls={controls}
        className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain')}
        {...props}
      />
    </div>
  )
);
VideoPlayer.displayName = 'VideoPlayer';

export { VideoPlayer };
