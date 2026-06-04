import { BadgeDot } from '../components/atoms/BadgeDot';

export const badgedotStory = {
  component: BadgeDot,
  name: 'Badge Dot',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: '3',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Count' },
  ],
};
