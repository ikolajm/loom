// Styled native container around <video>. The browser owns the control chrome (native
// `controls`); Loom owns only the container — rounded clipping, aspect-ratio box, object-fit.
// No JS state, no deps. `ref` forwards to the <video> element (the useful handle); `className`
// styles the container so consumers size the box. Native video attrs spread onto the element.
function generateVideoPlayer(name, config, meta) {
  const defaultAspect = config.default?.aspectRatio || '16/9';
  const defaultFit = config.default?.fit || 'cover';

  return `import { forwardRef } from 'react';
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
  ({ aspectRatio = '${defaultAspect}', fit = '${defaultFit}', controls = true, className, ...props }, ref) => (
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
`;
}

module.exports = { generateVideoPlayer };
