import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const badgeVariants = cva('badge', {
  variants: {
    variant: {
      'filled': 'treat-filled',
      'outline': 'treat-outline',
    },
    state: {
      default: 'tone-primary-soft',
      neutral: 'tone-neutral-soft',
      destructive: 'tone-error-soft',
      success: 'tone-success-soft',
      warning: 'tone-warning-soft',
      info: 'tone-info-soft',
    },
  },
  defaultVariants: {
    variant: 'filled',
    state: 'default',
  },
});

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'filled' | 'outline';
type BadgeState = 'default' | 'neutral' | 'destructive' | 'success' | 'warning' | 'info';

type BadgeProps = React.HTMLAttributes<HTMLElement>
  & {
    variant?: BadgeVariant;
    state?: BadgeState;
    size?: BadgeSize;
    asChild?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

/**
 * A badge is a label. It is never a target.
 *
 * If a thing can be clicked it is a Button — a removable filter reads as one control
 * ("remove this filter"), not as a label with a second control buried inside it, and
 * splitting it into two targets meant two tab stops and two names for one intent.
 * Compose a Button with a trailing icon instead.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'filled', state = 'default', size = 'md', asChild = false, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const computedClasses = badgeVariants({ variant, state });

    if (asChild) {
      return (
        <Slot ref={ref} className={cn(computedClasses, className)} data-size={size} {...props}>
          {/* Spelled out rather than reusing a shared fragment, and an array rather than a
              fragment. Slot locates the consumer's element through Slottable, and finds
              it with React.Children.toArray — which flattens arrays but not fragments.
              Wrapped in one, and with no Slottable to find at all, Slot cloned the
              fragment and put className on it: React warns and drops it, so asChild
              rendered the consumer's element carrying none of the badge's classes. */}
          {[
            leadingIcon && <span key="lead" className={'icon-slot'}>{leadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && <span key="trail" className={'icon-slot'}>{trailingIcon}</span>,
          ]}
        </Slot>
      );
    }

    return (
      <span ref={ref} className={cn(computedClasses, className)} data-size={size} {...props}>
        {leadingIcon && <span className={'icon-slot'}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={'icon-slot'}>{trailingIcon}</span>}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
