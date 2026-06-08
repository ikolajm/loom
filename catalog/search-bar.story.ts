import { SearchBar } from '../components/atoms/SearchBar';

export const searchbarStory = {
  component: SearchBar,
  name: 'Search Bar',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Search Bar',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
