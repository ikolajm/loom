import { Card } from '../components/atoms/Card';

export const cardStory = {
  component: Card,
  name: 'Card',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Card',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'elevated', 'outline'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
