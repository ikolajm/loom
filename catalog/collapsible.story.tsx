import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/atoms/Collapsible';

const CollapsibleDemo = ({ variant, size = 'md' }: { variant?: 'default' | 'bordered'; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-md">
      <Collapsible variant={variant}>
        <CollapsibleTrigger size={size}>Additional details</CollapsibleTrigger>
        <CollapsibleContent size={size}>
          This section contains extra information that can be shown or hidden as needed. Useful for progressive disclosure.
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export const collapsibleStory = {
  component: CollapsibleDemo,
  name: 'Collapsible',
  defaultProps: {
    variant: 'bordered',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'bordered'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
