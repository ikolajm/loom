import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/atoms/Tooltip';
import { Button } from '../components/atoms/Button';

const TooltipDemo = ({ size, children }: { size?: 'sm' | 'md' | 'lg'; children?: string }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="default" size={size}>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent size={size}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const tooltipStory = {
  component: TooltipDemo,
  name: 'Tooltip',
  defaultProps: {
    size: 'md',
    children: 'Save changes',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
