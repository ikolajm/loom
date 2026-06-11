import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';
import { Button } from './button';
import { X } from 'lucide-react';

const bannerVariants = cva(
  'flex items-center',
  {
    variants: {
      variant: {
        info: 'bg-info-container text-on-info-container',
        success: 'bg-success-container text-on-success-container',
        warning: 'bg-warning-container text-on-warning-container',
        error: 'bg-error-container text-on-error-container',
      },
      size: {
        sm: 'px-3 py-2 gap-1 rounded-component text-body-sm',
        md: 'px-4 py-3 gap-2 rounded-component text-body-md',
        lg: 'px-6 py-4 gap-3 rounded-component text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'md',
    },
  }
);

const bannerIconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-3',
};

type BannerProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof bannerVariants>
  & {
    leadingIcon?: React.ReactNode;
    action?: React.ReactNode;
    onDismiss?: () => void;
  };

const Banner = forwardRef<HTMLDivElement, BannerProps>(
  ({ variant, size, leadingIcon, action, onDismiss, className, children, ...props }, ref) => {
    return (
      <div ref={ref} role="status" className={cn(bannerVariants({ variant, size }), className)} {...props}>
        {leadingIcon && <span className={cn('shrink-0 [&>svg]:size-full', bannerIconSize[size || 'md'])}>{leadingIcon}</span>}
        <div className="flex-1 min-w-0">{children}</div>
        {action && <div className="shrink-0">{action}</div>}
        {onDismiss && (
          <Button
            iconOnly
            variant="ghost"
            color="inherit"
            size={size ?? 'md'}
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-mr-1 shrink-0"
          >
            <X />
          </Button>
        )}
      </div>
    );
  }
);
Banner.displayName = 'Banner';

export { Banner, bannerVariants };
