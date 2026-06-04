import { Separator } from '../components/atoms/Separator';

export const separatorStory = {
  component: Separator,
  name: 'Separator',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
