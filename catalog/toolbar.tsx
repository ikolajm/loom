import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const toolbarVariants = cva(
  'flex items-center font-normal',
  {
    variants: {
      variant: {
        default: 'bg-surface-1 text-on-surface border-outline-subtle border',
      },
      size: {
        sm: 'px-2 py-1 gap-1 text-body-sm',
        md: 'px-3 py-2 gap-2 text-body-md',
        lg: 'px-5 py-3 gap-3 text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type ToolbarProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof toolbarVariants>
;

const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(toolbarVariants({ variant, size }), className)} {...props}>
        {children}
      </div>
    );
  }
);
Toolbar.displayName = 'Toolbar';

export { Toolbar, toolbarVariants };
