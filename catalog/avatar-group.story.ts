import { AvatarGroup } from '../components/atoms/AvatarGroup';

export const avatargroupStory = {
  component: AvatarGroup,
  name: 'Avatar Group',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Avatar Group',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
