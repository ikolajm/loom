import { Alert } from '../components/atoms/Alert';

export const alertStory = {
  component: Alert,
  name: 'Alert',
  defaultProps: {
    variant: 'info',
    size: 'md',
    children: 'Your session will expire in 5 minutes.',
    showLeadingIcon: true,
    showTrailingIcon: true,
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'error', 'success', 'warning', 'info'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
    { type: 'boolean' as const, prop: 'showLeadingIcon', label: 'Leading Icon' },
    { type: 'boolean' as const, prop: 'showTrailingIcon', label: 'Trailing Icon' },
  ],
};
