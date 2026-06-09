'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { cn } from './cn';

const stepperVariants = cva('flex items-center w-full', {
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
    },
  },
  defaultVariants: { size: 'md' },
});

const indicatorSize: Record<string, string> = {
  sm: 'size-ch-1 text-[12px] leading-[16px]',
  md: 'size-ch-3 text-[14px] leading-[20px]',
  lg: 'size-ch-5 text-[16px] leading-[24px]',
};

const labelSize: Record<string, string> = {
  sm: 'text-[12px] leading-[16px]',
  md: 'text-[14px] leading-[20px]',
  lg: 'text-[16px] leading-[24px]',
};

type StepState = 'incomplete' | 'active' | 'completed' | 'error';

const indicatorStyles: Record<StepState, string> = {
  incomplete: 'bg-surface-1 text-on-surface-variant',
  active: 'bg-primary text-on-primary',
  completed: 'bg-primary text-on-primary',
  error: 'bg-error text-on-error',
};

const labelStyles: Record<StepState, string> = {
  incomplete: 'text-on-surface-variant',
  active: 'text-on-surface font-medium',
  completed: 'text-on-surface font-medium',
  error: 'text-error font-medium',
};

const connectorStyles: Record<StepState, string> = {
  incomplete: 'bg-outline-subtle',
  active: 'bg-outline-subtle',
  completed: 'bg-primary',
  error: 'bg-outline-subtle',
};

type StepperProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof stepperVariants>;

const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ size, className, children, ...props }, ref) => (
    <div ref={ref} className={cn(stepperVariants({ size }), className)} {...props}>
      {children}
    </div>
  )
);
Stepper.displayName = 'Stepper';

type StepProps = {
  state?: StepState;
  step?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showConnector?: boolean;
};

const Step = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & StepProps>(
  ({ state = 'incomplete', step, label, size = 'md', showConnector = true, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 flex-1 min-w-0', className)} {...props}>
      <div className="flex flex-col items-center gap-1">
        <span className={cn(
          'shrink-0 rounded-full flex items-center justify-center font-semibold',
          indicatorSize[size],
          indicatorStyles[state],
        )}>
          {state === 'completed' ? <Check className="size-[60%]" /> : step}
        </span>
        {label && <span className={cn('truncate', labelSize[size], labelStyles[state])}>{label}</span>}
      </div>
      {showConnector && <span className={cn('flex-1 h-px', connectorStyles[state])} />}
    </div>
  )
);
Step.displayName = 'Step';

export { Stepper, Step, stepperVariants };
