import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const inputVariants = cva(
  'inline-flex items-center justify-center font-normal interactive cursor-text placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      state: {
        default: 'bg-surface text-on-surface border-outline-subtle border',
        error: 'bg-surface text-on-surface border-error border',
      },
      size: {
        sm: 'h-ch-3 px-3 py-1 gap-2 rounded-input text-input-sm',
        md: 'h-ch-5 px-4 py-2 gap-2 rounded-input text-input-md',
        lg: 'h-ch-7 px-4 py-3 gap-2 rounded-input text-input-lg',
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
    return <input ref={ref} className={cn('w-full', inputVariants({ state, size }), className)} {...props} />;
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
