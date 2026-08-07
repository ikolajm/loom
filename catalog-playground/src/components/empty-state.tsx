import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const emptyStateVariants = cva(
  'flex flex-col items-center text-center',
  {
    variants: {
      variant: {
        default: '',
      },
      size: {
        sm: 'gap-3',
        md: 'gap-4',
        lg: 'gap-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const iconSize: Record<string, string> = {
  sm: 'size-icon-3',
  md: 'size-icon-4',
  lg: 'size-icon-4',
};

const headingSize: Record<string, string> = {
  sm: 'text-title-sm',
  md: 'text-title-md',
  lg: 'text-title-lg',
};

const descriptionSize: Record<string, string> = {
  sm: 'text-body-sm',
  md: 'text-body-md',
  lg: 'text-body-lg',
};

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof emptyStateVariants>
  & {
    icon?: React.ReactNode;
    heading?: string;
    description?: string;
    action?: React.ReactNode;
  };

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ variant, size, icon, heading, description, action, className, children, ...props }, ref) => {
    const s = size || 'md';
    return (
      <div ref={ref} className={cn(emptyStateVariants({ variant, size }), className)} {...props}>
        {icon && <span className={cn('text-on-surface-variant shrink-0 [&>svg]:size-full', iconSize[s])}>{icon}</span>}
        {heading && <h3 className={cn('font-semibold  text-on-surface', headingSize[s])}>{heading}</h3>}
        {description && <p className={cn('text-on-surface-variant', descriptionSize[s])}>{description}</p>}
        {action}
        {children}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateVariants };
