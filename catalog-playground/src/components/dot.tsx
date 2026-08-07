import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const dotVariants = cva(
  'inline-block shrink-0 rounded-pill',
  {
    variants: {
      state: {
        default: 'bg-primary',
        destructive: 'bg-error',
        success: 'bg-success',
        warning: 'bg-warning',
        info: 'bg-info',
      },
      size: {
        sm: 'size-icon-0',
        md: 'size-icon-1',
        lg: 'size-icon-2',
      },
    },
    defaultVariants: { state: 'default', size: 'md' },
  }
);

type DotProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof dotVariants>;

/** Status/severity indicator dot. Compose into badges, alerts, list items, headings, nav. */
const Dot = forwardRef<HTMLSpanElement, DotProps>(
  ({ state, size, className, ...props }, ref) => (
    <span ref={ref} className={cn(dotVariants({ state, size }), className)} {...props} />
  )
);
Dot.displayName = 'Dot';

export { Dot, dotVariants };
