const { filterSizes, textRoleClass } = require('./helpers');

function generateStepper(name, config, meta) {
  const sizes = filterSizes(config.sizes);

  // Build indicator size classes
  const indicatorSizeEntries = {};
  const labelSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    // Indicator size from height token: height/ch-N → size-ch-N
    const indClasses = [];
    if (sz['indicator-size']) {
      const h = sz['indicator-size'].replace('height/', '');
      indClasses.push(`size-${h}`);
    }
    const indRole = textRoleClass(sz['label-text']);
    if (indRole) indClasses.push(indRole);
    indicatorSizeEntries[tier] = indClasses.join(' ');

    // Label size
    const lblClasses = [];
    const lblRole = textRoleClass(sz['label-text']);
    if (lblRole) lblClasses.push(lblRole);
    labelSizeEntries[tier] = lblClasses.join(' ');
  }

  // Build gap entries for the stepper container CVA
  const gapEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const gapMatch = sz.gap?.match(/\{scale\.(\d+)\}/);
    gapEntries[tier] = gapMatch ? `gap-${gapMatch[1]}` : 'gap-3';
  }

  // Step states from config
  const states = config['step-state'] || {};

  // Build indicator style map
  const indicatorStyles = {};
  const labelStyles = {};
  const connectorStyles = {};
  for (const [state, colors] of Object.entries(states)) {
    const indBg = colors['indicator-bg'] ? colors['indicator-bg'].split('/').pop() : '';
    const indFg = colors['indicator-fg'] ? colors['indicator-fg'].split('/').pop() : '';
    indicatorStyles[state] = `bg-${indBg} text-${indFg}`;

    const lblFg = colors['label-fg'] ? colors['label-fg'].split('/').pop() : '';
    const lblExtra = (state === 'active' || state === 'completed') ? ' font-medium' : (state === 'error' ? ' font-medium' : '');
    labelStyles[state] = `text-${lblFg}${lblExtra}`;

    const connColor = colors.connector ? colors.connector.split('/').pop() : 'outline-subtle';
    connectorStyles[state] = state === 'completed' ? 'bg-primary' : `bg-${connColor}`;
  }

  return `'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { cn } from './cn';

const stepperVariants = cva('flex items-center w-full', {
  variants: {
    size: {
${Object.entries(gapEntries).map(([k, v]) => `      ${k}: '${v}',`).join('\n')}
    },
  },
  defaultVariants: { size: '${config.default?.size || 'md'}' },
});

const indicatorSize: Record<string, string> = {
${Object.entries(indicatorSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const labelSize: Record<string, string> = {
${Object.entries(labelSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type StepState = ${Object.keys(states).map(s => `'${s}'`).join(' | ')};

const indicatorStyles: Record<StepState, string> = {
${Object.entries(indicatorStyles).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const labelStyles: Record<StepState, string> = {
${Object.entries(labelStyles).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const connectorStyles: Record<StepState, string> = {
${Object.entries(connectorStyles).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
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
  ({ state = 'incomplete', step, label, size = '${config.default?.size || 'md'}', showConnector = true, className, ...props }, ref) => (
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
`;
}

module.exports = { generateStepper };
