import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/atoms/Select';
import { forwardRef } from 'react';

// Pre-composed Select for playground — wraps Radix parts into a single component
const SelectDemo = forwardRef<HTMLButtonElement, { state?: 'default' | 'error'; size?: 'sm' | 'md' | 'lg'; placeholder?: string; disabled?: boolean }>(
  ({ state, size, placeholder = 'Select an option...', disabled, ...props }, ref) => (
    <Select disabled={disabled}>
      <SelectTrigger ref={ref} state={state} size={size} className="w-full" {...props}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option-1">Option 1</SelectItem>
        <SelectItem value="option-2">Option 2</SelectItem>
        <SelectItem value="option-3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  )
);
SelectDemo.displayName = 'SelectDemo';

export const selectStory = {
  component: SelectDemo,
  name: 'Select',
  defaultProps: {
    state: 'default',
    size: 'md',
    placeholder: 'Select an option...',
    children: 'Select',
  },
  controls: [
    { type: 'select' as const, prop: 'state', label: 'State', options: ['default', 'error'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
