import { CountUp } from '../components/atoms/CountUp';

export const countupStory = {
  component: CountUp,
  name: 'Count Up',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Count Up',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
