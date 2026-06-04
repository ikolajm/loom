import { Combobox } from '../components/atoms/Combobox';
import { useState } from 'react';

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'svelte', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
];

const ComboboxDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [value, setValue] = useState('');
  return (
    <div className="w-full max-w-xs">
      <Combobox
        size={size}
        options={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search framework..."
      />
    </div>
  );
};

export const comboboxStory = {
  component: ComboboxDemo,
  name: 'Combobox',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
