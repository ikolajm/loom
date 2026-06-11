import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const labelVariants = cva(
  'flex items-center font-medium tracking-[0.01em]',
  {
    variants: {
      state: {
        default: 'text-on-surface',
      },
      size: {
        sm: ' text-action-sm',
        md: ' text-action-md',
        lg: ' text-action-lg',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>
  & VariantProps<typeof labelVariants>
;

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ state, size, className, children, ...props }, ref) => {
    return (
      <label ref={ref} className={cn(labelVariants({ state, size }), className)} {...props}>
        {children}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Label, labelVariants };
