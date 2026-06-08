import { TimePicker } from '../components/atoms/TimePicker';

export const timepickerStory = {
  component: TimePicker,
  name: 'Time Picker',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Time Picker',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
