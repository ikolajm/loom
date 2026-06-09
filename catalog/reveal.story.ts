import { Reveal } from '../components/atoms/Reveal';

export const revealStory = {
  component: Reveal,
  name: 'Reveal',
  defaultProps: {
    variant: 'fade-up',
    size: 'md',
    children: 'Reveal',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
