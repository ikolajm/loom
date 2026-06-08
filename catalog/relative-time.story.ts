import { RelativeTime } from '../components/atoms/RelativeTime';

export const relativetimeStory = {
  component: RelativeTime,
  name: 'Relative Time',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Relative Time',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
