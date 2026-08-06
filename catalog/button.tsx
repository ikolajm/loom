import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium tracking-[0.01em] interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        filled: 'bg-[color:var(--v-bg)] text-[color:var(--v-fg)]',
        outline: 'bg-transparent border border-[color:var(--v-border)] text-[color:var(--v-text)]',
        ghost: 'bg-transparent text-[color:var(--v-text)]',
      },
      color: {
        primary: '[--v-bg:var(--primary)] [--v-fg:var(--on-primary)] [--v-text:var(--primary)] [--v-border:var(--primary)]',
        secondary: '[--v-bg:var(--secondary)] [--v-fg:var(--on-secondary)] [--v-text:var(--secondary)] [--v-border:var(--secondary)]',
        destructive: '[--v-bg:var(--error)] [--v-fg:var(--on-error)] [--v-text:var(--error)] [--v-border:var(--error)]',
        success: '[--v-bg:var(--success)] [--v-fg:var(--on-success)] [--v-text:var(--success)] [--v-border:var(--success)]',
        warning: '[--v-bg:var(--warning)] [--v-fg:var(--on-warning)] [--v-text:var(--warning)] [--v-border:var(--warning)]',
        neutral: '[--v-bg:var(--neutral)] [--v-fg:var(--on-neutral)] [--v-text:var(--on-surface)] [--v-border:var(--outline)]',
        inherit: '[--v-fg:currentColor] [--v-text:currentColor] [--v-border:currentColor]',
      },
      size: {
        'sm': 'h-control-sm px-3 py-1 gap-1 rounded-component text-action-sm',
        'md': 'h-control-md px-4 py-2 gap-2 rounded-component text-action-md',
        'lg': 'h-control-lg px-6 py-3 gap-2 rounded-component text-action-lg',
        'icon-sm': 'size-control-sm rounded-component',
        'icon-md': 'size-control-md rounded-component',
        'icon-lg': 'size-control-lg rounded-component',
      },
    },
    defaultVariants: {
      variant: 'filled',
      color: 'primary',
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
  ({ variant, color, size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const resolvedSize = iconOnly ? `icon-${size}` : size;
    const iconCls = buttonIconSize[size];
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, color, size: resolvedSize as any }), className)}
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
