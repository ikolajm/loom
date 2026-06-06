import { Dot } from '../components/atoms/Dot';

export const dotStory = {
  component: Dot,
  name: 'Dot',
  defaultProps: {
    state: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'state', label: 'State', options: ['default', 'neutral', 'destructive', 'success', 'warning', 'info'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
