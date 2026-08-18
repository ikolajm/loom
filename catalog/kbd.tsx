import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const kbdVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-surface-1 text-on-surface border-outline border',
      },
      size: {
        sm: 'min-w-[20px] px-1 py-[2px] rounded-component border text-label-sm',
        md: 'min-w-[26px] px-1 py-1 rounded-component border text-label-md',
        lg: 'min-w-[30px] px-2 py-1 rounded-component border text-label-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type KbdProps = React.HTMLAttributes<HTMLElement>
  & VariantProps<typeof kbdVariants>
;

const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <kbd ref={ref} className={cn(kbdVariants({ variant, size }), className)} {...props}>
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = 'Kbd';

export { Kbd, kbdVariants };
