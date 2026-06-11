import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const topBarVariants = cva(
  'flex items-center',
  {
    variants: {
      variant: {
        default: 'bg-surface text-on-surface border-outline-subtle border-b',
        elevated: 'bg-surface-1 text-on-surface shadow-[var(--shadow-1)]',
      },
      size: {
        sm: 'h-ch-7 px-3 gap-2 text-title-sm',
        md: 'h-ch-8 px-4 gap-3 text-title-md',
        lg: 'h-ch-9 px-6 gap-4 text-title-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type TopBarProps = React.HTMLAttributes<HTMLElement>
  & VariantProps<typeof topBarVariants>
;

const TopBar = forwardRef<HTMLElement, TopBarProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <header ref={ref} className={cn(topBarVariants({ variant, size }), className)} {...props}>
        {children}
      </header>
    );
  }
);
TopBar.displayName = 'TopBar';

export { TopBar, topBarVariants };
