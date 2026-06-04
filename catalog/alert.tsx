import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const alertVariants = cva(
  'flex items-center font-normal',
  {
    variants: {
      variant: {
        default: 'bg-surface-1 text-on-surface',
        error: 'bg-error-container text-on-error-container',
        success: 'bg-success-container text-on-success-container',
        warning: 'bg-warning-container text-on-warning-container',
        info: 'bg-info-container text-on-info-container',
      },
      size: {
        sm: 'px-3 py-2 gap-1 rounded-component text-body-sm',
        md: 'px-4 py-3 gap-2 rounded-component text-body-md',
        lg: 'px-6 py-4 gap-3 rounded-component text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const alertIconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-3',
};

type AlertProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof alertVariants>
  & {
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant, size, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant, size }), className)} {...props}>
        {leadingIcon && <span className={`shrink-0 ${alertIconSize[size || 'md']} [&>svg]:size-full`}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={`shrink-0 ${alertIconSize[size || 'md']} [&>svg]:size-full`}>{trailingIcon}</span>}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert, alertVariants };
