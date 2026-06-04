import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const badgeDotVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-pill',
  {
    variants: {
      variant: {
        default: 'bg-error text-on-error',
      },
      size: {
        sm: 'rounded-pill min-w-2 h-2 text-[8px] leading-[8px] px-[2px]',
        md: 'rounded-pill min-w-3 h-3 text-[10px] leading-[10px] px-[3px]',
        lg: 'rounded-pill min-w-4 h-4 text-[10px] leading-[10px] px-[4px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type BadgeDotProps = React.HTMLAttributes<HTMLSpanElement>
  & VariantProps<typeof badgeDotVariants>
;

const BadgeDot = forwardRef<HTMLSpanElement, BadgeDotProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeDotVariants({ variant, size }), className)} {...props}>
        {children}
      </span>
    );
  }
);
BadgeDot.displayName = 'BadgeDot';

export { BadgeDot, badgeDotVariants };
