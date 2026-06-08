import { VideoPlayer } from '../components/atoms/VideoPlayer';

export const videoplayerStory = {
  component: VideoPlayer,
  name: 'Video Player',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Video Player',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
