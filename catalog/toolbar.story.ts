import { Toolbar } from '../components/atoms/Toolbar';

export const toolbarStory = {
  component: Toolbar,
  name: 'Toolbar',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Toolbar',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
