import { NumberDisplay } from '../components/atoms/NumberDisplay';

export const numberdisplayStory = {
  component: NumberDisplay,
  name: 'Number Display',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Number Display',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
