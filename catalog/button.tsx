import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva('button interactive control', {
  variants: {
    variant: {
      filled: 'treat-filled',
      outline: 'treat-outline',
      ghost: 'treat-ghost',
    },
  },
  defaultVariants: {
    variant: 'filled',
  },
});

// The family behind each colour; `intensity` picks the suffix. One declaration in the
// schema therefore reaches both tone classes, instead of pinning this component to
// whichever one its `bg` token happened to name.
const buttonTone: Record<string, string> = {
  primary: 'primary',
  secondary: 'secondary',
  destructive: 'error',
  success: 'success',
  warning: 'warning',
  neutral: 'neutral',
  info: 'info',
};

// Colours with no family. These paint nothing and read currentColor, so they resolve to
// one class and ignore `intensity` — there is no soft form of "no colour".
const buttonToneFixed: Record<string, string> = {
  inherit: 'tone-inherit',
};

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'filled' | 'outline' | 'ghost';
type ButtonColor = 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'neutral' | 'info' | 'inherit';
type ButtonIntensity = 'solid' | 'soft';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & {
    variant?: ButtonVariant;
    color?: ButtonColor;
    intensity?: ButtonIntensity;
    size?: ButtonSize;
    asChild?: boolean;
    iconOnly?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    loading?: boolean;
  };

const LoadingSpinner = () => (
  <svg className="spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'filled', color = 'primary', intensity = 'solid', size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const tone = buttonToneFixed[color] ?? 'tone-' + buttonTone[color] + (intensity === 'soft' ? '-soft' : '');
    const resolvedSize = iconOnly ? `icon-${size}` : size;
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant }), tone, className)}
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
          // An array, not a fragment. Slot finds Slottable with React.Children.toArray,
          // which flattens arrays but not fragments — wrapped in one, Slot saw a single
          // unrecognised child, cloned the fragment itself and put className on it. React
          // warns and drops it, so asChild rendered the consumer's element with none of
          // the button's classes: no display, no size, and a raw svg at intrinsic size.
          [
            effectiveLeadingIcon && <span key="lead" className={'icon-slot'}>{effectiveLeadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && <span key="trail" className={'icon-slot'}>{trailingIcon}</span>,
          ]
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
