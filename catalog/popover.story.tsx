import { Popover, PopoverTrigger, PopoverContent } from '../components/atoms/Popover';
import { Button } from '../components/atoms/Button';

const titleSize = { sm: 'text-title-sm', md: 'text-title-md', lg: 'text-title-lg' } as const;
const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const PopoverDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="default" size={size}>Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent size={size}>
        <p className={`${titleSize[size]} font-semibold`}>Dimensions</p>
        <p className={`${bodySize[size]} text-on-surface-variant`}>Set the dimensions for the layer.</p>
      </PopoverContent>
    </Popover>
  );
};

export const popoverStory = {
  component: PopoverDemo,
  name: 'Popover',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
