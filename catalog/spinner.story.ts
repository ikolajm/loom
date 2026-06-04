import { Spinner } from '../components/atoms/Spinner';

export const spinnerStory = {
  component: Spinner,
  name: 'Spinner',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'muted', 'inherit'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
