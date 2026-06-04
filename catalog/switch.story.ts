import { Switch } from '../components/atoms/Switch';

export const switchStory = {
  component: Switch,
  name: 'Switch',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
