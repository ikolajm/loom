import { RadioGroup, RadioGroupItem } from '../components/atoms/Radio';
import { forwardRef } from 'react';

// Pre-composed Radio for playground — wraps RadioGroup + items
const labelSize: Record<string, string> = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' };

const RadioDemo = forwardRef<HTMLDivElement, { size?: 'sm' | 'md' | 'lg'; disabled?: boolean }>(
  ({ size = 'md', disabled, ...props }, ref) => (
    <RadioGroup ref={ref} defaultValue="option-1" disabled={disabled} {...props}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-1" size={size} id="r1" />
        <label htmlFor="r1" className={`${labelSize[size]} cursor-pointer`}>Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-2" size={size} id="r2" />
        <label htmlFor="r2" className={`${labelSize[size]} cursor-pointer`}>Option 2</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-3" size={size} id="r3" />
        <label htmlFor="r3" className={`${labelSize[size]} cursor-pointer`}>Option 3</label>
      </div>
    </RadioGroup>
  )
);
RadioDemo.displayName = 'RadioDemo';

export const radioStory = {
  component: RadioDemo,
  name: 'Radio',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },
  ],
};
