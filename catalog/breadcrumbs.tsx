import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const breadcrumbsVariants = cva(
  'flex items-center font-normal',
  {
    variants: {
      variant: {
        default: '',
      },
      size: {
        sm: 'gap-1 text-body-sm',
        md: 'gap-2 text-body-md',
        lg: 'gap-2 text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type BreadcrumbsProps = React.HTMLAttributes<HTMLElement>
  & VariantProps<typeof breadcrumbsVariants>
;

const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn(breadcrumbsVariants({ variant, size }), className)} {...props}>
        {children}
      </nav>
    );
  }
);
Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs, breadcrumbsVariants };

const BreadcrumbItem = forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'> & { current?: boolean; }>(
  ({ current = false, className, children, ...props }, ref) => (
    <span ref={ref} className={cn(
      'text-on-surface-variant hover:text-on-surface cursor-pointer',
      current && 'text-on-surface font-medium cursor-default',
      className
    )} {...props}>
      {children}
    </span>
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export { BreadcrumbItem };