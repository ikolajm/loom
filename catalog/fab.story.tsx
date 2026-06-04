import { FAB } from '../components/atoms/FAB';
import { createElement } from 'react';
import { Plus } from 'lucide-react';

export const fabStory = {
  component: FAB,
  name: 'FAB',
  defaultProps: {
    variant: 'default',
    size: 'md',
    icon: createElement(Plus, { size: 20 }),
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'label', label: 'Label (Extended)' },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
