import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const helperTextVariants = cva(
  'flex items-center font-normal tracking-[0.02em]',
  {
    variants: {
      state: {
        default: 'text-on-surface-variant',
        error: 'text-error',
      },
      size: {
        sm: ' text-label-sm',
        md: ' text-label-md',
        lg: ' text-label-lg',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

type HelperTextProps = React.HTMLAttributes<HTMLParagraphElement>
  & VariantProps<typeof helperTextVariants>
;

const HelperText = forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ state, size, className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn(helperTextVariants({ state, size }), className)} {...props}>
        {children}
      </p>
    );
  }
);
HelperText.displayName = 'HelperText';

export { HelperText, helperTextVariants };
