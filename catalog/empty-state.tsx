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
  sm: 'text-[16px] leading-[24px]',
  md: 'text-[20px] leading-[28px]',
  lg: 'text-[24px] leading-[32px]',
};

const descriptionSize: Record<string, string> = {
  sm: 'text-[14px] leading-[20px]',
  md: 'text-[16px] leading-[24px]',
  lg: 'text-[18px] leading-[28px]',
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
        {icon && <span className={cn('text-on-surface-variant [&>svg]:size-full', iconSize[s])}>{icon}</span>}
        {heading && <h3 className={cn('font-semibold tracking-[-0.01em] text-on-surface', headingSize[s])}>{heading}</h3>}
        {description && <p className={cn('text-on-surface-variant', descriptionSize[s])}>{description}</p>}
        {action}
        {children}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateVariants };
