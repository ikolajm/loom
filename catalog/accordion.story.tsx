import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/atoms/Accordion';

const AccordionDemo = ({ variant, size = 'md' }: { variant?: 'default' | 'filled'; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-md">
      <Accordion type="single" collapsible variant={variant}>
        <AccordionItem value="item-1">
          <AccordionTrigger size={size}>Is it accessible?</AccordionTrigger>
          <AccordionContent size={size}>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger size={size}>Is it styled?</AccordionTrigger>
          <AccordionContent size={size}>Yes. It comes with default styles from the design system tokens.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger size={size}>Is it animated?</AccordionTrigger>
          <AccordionContent size={size}>Yes. It uses CSS animations for smooth open and close transitions.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const accordionStory = {
  component: AccordionDemo,
  name: 'Accordion',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'filled'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
