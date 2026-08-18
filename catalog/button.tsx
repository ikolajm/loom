import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva('button interactive control', {
  variants: {
    variant: {
      filled: 'treat-filled',
      outline: 'treat-outline',
      ghost: 'treat-ghost',
    },
    color: {
      primary: 'tone-primary',
      secondary: 'tone-secondary',
      destructive: 'tone-error',
      success: 'tone-success',
      warning: 'tone-warning',
      neutral: 'tone-neutral',
      inherit: 'tone-inherit',
    },
  },
  defaultVariants: {
    variant: 'filled',
    color: 'primary',
  },
});

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants>
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
  ({ variant, color, size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const resolvedSize = iconOnly ? `icon-${size}` : size;
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, color }), className)}
        data-size={resolvedSize}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {iconOnly ? (
          <span className={'icon-slot'}>
            {loading ? <LoadingSpinner /> : children}
          </span>
        ) : (
          <>
            {effectiveLeadingIcon && <span className={'icon-slot'}>{effectiveLeadingIcon}</span>}
            <Slottable>{children}</Slottable>
            {trailingIcon && <span className={'icon-slot'}>{trailingIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
