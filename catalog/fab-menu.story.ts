import { FabMenu } from '../components/atoms/FabMenu';

export const fabmenuStory = {
  component: FabMenu,
  name: 'Fab Menu',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Fab Menu',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
