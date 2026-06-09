import { ScrollProgress } from '../components/atoms/ScrollProgress';

export const scrollprogressStory = {
  component: ScrollProgress,
  name: 'Scroll Progress',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Scroll Progress',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
