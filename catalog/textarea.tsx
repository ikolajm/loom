import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const textareaVariants = cva(
  'inline-flex items-center justify-center font-normal interactive cursor-text placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      state: {
        default: 'bg-surface text-on-surface border-outline-subtle border',
        error: 'bg-surface text-on-surface border-error border',
      },
      size: {
        sm: 'min-h-[80px] px-3 py-2 gap-2 rounded-input text-input-sm',
        md: 'min-h-[120px] px-4 py-3 gap-2 rounded-input text-input-md',
        lg: 'min-h-[160px] px-4 py-3 gap-2 rounded-input text-input-lg',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>
  & VariantProps<typeof textareaVariants>
  & {
  };

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ state, size, className, children, ...props }, ref) => {
    return <textarea ref={ref} className={cn('w-full resize-vertical', textareaVariants({ state, size }), className)} {...props} />;
  }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
