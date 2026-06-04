import { Toggle } from '../components/atoms/Toggle';

export const toggleStory = {
  component: Toggle,
  name: 'Toggle',
  defaultProps: {
    size: 'md',
    children: 'Toggle',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
    { type: 'boolean' as const, prop: 'showLeadingIcon', label: 'Leading Icon' },
    { type: 'boolean' as const, prop: 'showTrailingIcon', label: 'Trailing Icon' },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
