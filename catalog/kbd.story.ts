import { Kbd } from '../components/atoms/Kbd';

export const kbdStory = {
  component: Kbd,
  name: 'Kbd',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: '⌘K',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
