import { HelperText } from '../components/atoms/HelperText';

export const helpertextStory = {
  component: HelperText,
  name: 'Helper Text',
  defaultProps: {
    state: 'default',
    size: 'md',
    children: 'Helper Text',
  },
  controls: [
    { type: 'select' as const, prop: 'state', label: 'State', options: ['default', 'error'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
