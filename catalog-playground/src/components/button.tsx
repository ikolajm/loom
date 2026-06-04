import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium tracking-[0.01em] interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary',
        secondary: 'bg-secondary text-on-secondary',
        destructive: 'bg-error text-on-error',
        success: 'bg-success text-on-success',
        warning: 'bg-warning text-on-warning',
        ghost: 'bg-transparent text-on-surface',
        outline: 'bg-transparent text-on-surface border-outline border',
      },
      size: {
        'sm': 'h-ch-3 px-3 py-1 gap-1 rounded-component text-action-sm',
        'md': 'h-ch-5 px-4 py-2 gap-2 rounded-component text-action-md',
        'lg': 'h-ch-7 px-6 py-3 gap-2 rounded-component text-action-lg',
        'icon-sm': 'size-ch-3 rounded-component',
        'icon-md': 'size-ch-5 rounded-component',
        'icon-lg': 'size-ch-7 rounded-component',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/** Icon sizing per size tier — applied to icon wrapper spans */
const buttonIconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-3',
};

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & Omit<VariantProps<typeof buttonVariants>, 'size'>
  & {
    size?: ButtonSize;
    asChild?: boolean;
    iconOnly?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    loading?: boolean;
  };

const LoadingSpinner = () => (
  <svg className="size-full animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const resolvedSize = iconOnly ? `icon-${size}` : size;
    const iconCls = buttonIconSize[size];
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size: resolvedSize as any }), className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {iconOnly ? (
          <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>
            {loading ? <LoadingSpinner /> : children}
          </span>
        ) : (
          <>
            {effectiveLeadingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{effectiveLeadingIcon}</span>}
            <Slottable>{children}</Slottable>
            {trailingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{trailingIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants, buttonIconSize };
