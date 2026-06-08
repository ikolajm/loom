import { Rating } from '../components/atoms/Rating';

export const ratingStory = {
  component: Rating,
  name: 'Rating',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Rating',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
