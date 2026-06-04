import { ProgressBar } from '../components/atoms/ProgressBar';

export const progressbarStory = {
  component: ProgressBar,
  name: 'Progress Bar',
  defaultProps: {
    variant: 'default',
    size: 'md',
    value: 60,
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'success', 'warning', 'error'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'value', label: 'Value (0-100)' },
  ],
};
