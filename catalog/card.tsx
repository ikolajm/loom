import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const cardVariants = cva(
  'flex flex-col',
  {
    variants: {
      variant: {
        default: 'bg-surface-1 text-on-surface border-outline-subtle border shadow-[var(--shadow-1)]',
        elevated: 'bg-surface-1 text-on-surface border-0 shadow-[var(--shadow-2)]',
        outline: 'bg-transparent text-on-surface border-outline border',
      },
      size: {
        sm: 'px-4 py-3 gap-3 rounded-card text-body-sm',
        md: 'px-6 py-4 gap-4 rounded-card text-body-md',
        lg: 'px-8 py-6 gap-6 rounded-card text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type CardProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof cardVariants>
;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant, size }), className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export { Card, cardVariants };

const CardHeader = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h3'>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-title-md font-semibold leading-none', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-body-sm text-on-surface-variant', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };