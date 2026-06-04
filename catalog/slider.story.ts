import { Slider } from '../components/atoms/Slider';

export const sliderStory = {
  component: Slider,
  name: 'Slider',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
