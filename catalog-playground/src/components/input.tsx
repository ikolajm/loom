import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';
import { useFieldError } from './form-field';

const inputVariants = cva(
  'inline-flex items-center justify-center font-normal interactive cursor-text placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed',
  {
    variants: {
      state: {
        default: 'bg-surface text-on-surface border-outline-subtle border',
        error: 'bg-surface text-on-surface border-error border',
      },
      size: {
        sm: 'h-control-sm px-3 py-1 gap-2 rounded-input text-input-sm',
        md: 'h-control-md px-4 py-2 gap-2 rounded-input text-input-md',
        lg: 'h-control-lg px-4 py-3 gap-2 rounded-input text-input-lg',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>
  & VariantProps<typeof inputVariants>
  & {
  };

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ state, size, className, ...props }, ref) => {
    const resolvedState = state ?? (useFieldError() ? 'error' : undefined);
    return <input ref={ref} className={cn('w-full', inputVariants({ state: resolvedState, size }), className)} {...props} />;
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
