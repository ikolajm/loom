import { Stepper, Step } from '../components/atoms/Stepper';

const StepperDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-lg">
      <Stepper size={size}>
        <Step state="completed" step={1} label="Account" size={size} />
        <Step state="active" step={2} label="Profile" size={size} />
        <Step state="incomplete" step={3} label="Review" size={size} showConnector={false} />
      </Stepper>
    </div>
  );
};

export const stepperStory = {
  component: StepperDemo,
  name: 'Stepper',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
