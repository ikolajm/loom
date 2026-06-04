import { ToggleGroup, ToggleGroupItem } from '../components/atoms/ToggleGroup';

const ToggleGroupDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <ToggleGroup type="single" size={size}>
      <ToggleGroupItem value="a" size={size}>Option A</ToggleGroupItem>
      <ToggleGroupItem value="b" size={size}>Option B</ToggleGroupItem>
      <ToggleGroupItem value="c" size={size}>Option C</ToggleGroupItem>
    </ToggleGroup>
  );
};

export const togglegroupStory = {
  component: ToggleGroupDemo,
  name: 'Toggle Group',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
