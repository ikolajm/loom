import { Label } from '../components/atoms/Label';

export const labelStory = {
  component: Label,
  name: 'Label',
  defaultProps: {
    state: 'default',
    size: 'md',
    children: 'Label',
  },
  controls: [
    { type: 'select' as const, prop: 'state', label: 'State', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
