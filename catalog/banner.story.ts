import { Banner } from '../components/atoms/Banner';

export const bannerStory = {
  component: Banner,
  name: 'Banner',
  defaultProps: {
    variant: 'info',
    size: 'md',
    children: 'Your session will expire in 5 minutes.',
    showLeadingIcon: true,
    showDismiss: true,
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['info', 'success', 'warning', 'error'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
    { type: 'boolean' as const, prop: 'showLeadingIcon', label: 'Leading Icon' },
    { type: 'boolean' as const, prop: 'showDismiss', label: 'Dismissible' },
  ],
};
