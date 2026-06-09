import { Stagger } from '../components/atoms/Stagger';

export const staggerStory = {
  component: Stagger,
  name: 'Stagger',
  defaultProps: {
    variant: 'fade-up',
    size: 'md',
    children: 'Stagger',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
