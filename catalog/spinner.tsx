import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';
import { Loader } from 'lucide-react';

const spinnerVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'text-primary',
        muted: 'text-on-surface-variant',
        inherit: 'text-current',
      },
      size: {
        sm: 'size-icon-1',
        md: 'size-icon-2',
        lg: 'size-icon-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type SpinnerProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof spinnerVariants>
;

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <div ref={ref} aria-label="Loading" className={cn(spinnerVariants({ variant, size }), className)} {...props}>
        <Loader className="animate-spin w-full h-full" />
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants };
