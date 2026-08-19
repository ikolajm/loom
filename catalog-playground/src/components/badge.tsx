import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { X } from 'lucide-react';
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

const badgeSegmentPad: Record<string, string> = {
  sm: 'px-1 py-[2px]',
  md: 'px-2 py-1',
  lg: 'px-3 py-1',
};

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'filled' | 'outline';
type BadgeState = 'default' | 'neutral' | 'destructive' | 'success' | 'warning' | 'info';

type BadgeProps = Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>
  & {
    variant?: BadgeVariant;
    state?: BadgeState;
    size?: BadgeSize;
    asChild?: boolean;
    interactive?: boolean;
    onClick?: React.MouseEventHandler<HTMLElement>;
    onRemove?: () => void;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

const INTERACTIVE_CLASSES = 'interactive cursor-pointer control';
const CLOSE_BUTTON_CLASSES = 'shrink-0 ml-1 inline-flex items-center justify-center rounded-component p-0.5 interactive opacity-(--opacity-muted) hover:opacity-100 transition-opacity cursor-pointer control';

const Badge = forwardRef<HTMLElement, BadgeProps>(
  ({ variant = 'filled', state = 'default', size = 'md', asChild = false, interactive = false, onClick, onRemove, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const computedClasses = badgeVariants({ variant, state });

    const content = (
      <>
        {leadingIcon && <span className={'icon-slot'}>{leadingIcon}</span>}
        {children}
        {trailingIcon && !onRemove && <span className={'icon-slot'}>{trailingIcon}</span>}
      </>
    );

    const closeButton = onRemove ? (
      <button
        key="close"
        type="button"
        className={CLOSE_BUTTON_CLASSES}
        onClick={onRemove}
        aria-label="Remove"
      >
        <span className={'icon-slot'}><X /></span>
      </button>
    ) : null;

    // asChild — Slot merges into the consumer-provided element. Behavior modes (interactive/onRemove) layer on top.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(computedClasses, interactive && INTERACTIVE_CLASSES, className)} data-size={size}
          {...props}
        >
          {/* Spelled out rather than reusing the shared content, and an array rather than a
              fragment. Slot locates the consumer's element through Slottable, and finds
              it with React.Children.toArray — which flattens arrays but not fragments.
              Wrapped in one, and with no Slottable to find at all, Slot cloned the
              fragment and put className on it: React warns and drops it, so asChild
              rendered the consumer's element carrying none of the badge's classes. */}
          {[
            leadingIcon && <span key="lead" className={'icon-slot'}>{leadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && !onRemove && <span key="trail" className={'icon-slot'}>{trailingIcon}</span>,
            closeButton,
          ]}
        </Slot>
      );
    }

    // interactive + onRemove — container carries the fill/radius; two transparent
    // segments split it, each padded like a button and rounded only on its outer edge,
    // for a uniform button-like split hover. Padding moves off the container (!p-0 !gap-0).
    // ref is narrowed per branch — a polymorphic span/button ref can't be expressed at the type level.
    if (interactive && onRemove) {
      const segPad = badgeSegmentPad[size];
      const segmentBase = 'inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-current/10 control';
      return (
        <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(computedClasses, '!p-0 !gap-0 inline-flex items-stretch', className)} data-size={size} {...props}>
          <button
            type="button"
            className={cn(segmentBase, 'rounded-l-[inherit]', segPad)}
            onClick={onClick}
          >
            {content}
          </button>
          <button
            type="button"
            className={cn(segmentBase, 'rounded-r-[inherit] border-l border-current/15', segPad)}
            onClick={onRemove}
            aria-label="Remove"
          >
            <span className={'icon-slot'}><X /></span>
          </button>
        </span>
      );
    }

    // interactive only — button
    if (interactive) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={cn(computedClasses, INTERACTIVE_CLASSES, className)} data-size={size}
          onClick={onClick}
          {...props}
        >
          {content}
        </button>
      );
    }

    // span (plain or onRemove only)
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(computedClasses, className)} data-size={size} {...props}>
        {content}
        {closeButton}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
