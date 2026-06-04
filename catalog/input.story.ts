import { Input } from '../components/atoms/Input';

export const inputStory = {
  component: Input,
  name: 'Input',
  defaultProps: {
    state: 'default',
    size: 'md',
    placeholder: 'Enter text...',
  },
  controls: [
    { type: 'select' as const, prop: 'state', label: 'State', options: ['default', 'error'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
