import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';
import { useFieldError } from './form-field';

const helperTextVariants = cva(
  'flex items-center',
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
    // Cascade off FormFieldContext.error unless an explicit state is given.
    const resolvedState = state ?? (useFieldError() ? 'error' : undefined);
    return (
      <p ref={ref} className={cn(helperTextVariants({ state: resolvedState, size }), className)} {...props}>
        {children}
      </p>
    );
  }
);
HelperText.displayName = 'HelperText';

export { HelperText, helperTextVariants };
