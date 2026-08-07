import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { X } from 'lucide-react';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium',
  {
    variants: {
      variant: {
        'filled': 'bg-[color:var(--v-bg)] text-[color:var(--v-fg)]',
        'outline': 'bg-transparent border border-[color:var(--v-border)] text-[color:var(--v-text)]',
      },
      state: {
        default: '[--v-bg:var(--primary-container)] [--v-fg:var(--on-primary-container)] [--v-text:var(--primary)] [--v-border:var(--primary)]',
        neutral: '[--v-bg:var(--neutral-container)] [--v-fg:var(--on-neutral-container)] [--v-text:var(--neutral)] [--v-border:var(--neutral)]',
        destructive: '[--v-bg:var(--error-container)] [--v-fg:var(--on-error-container)] [--v-text:var(--error)] [--v-border:var(--error)]',
        success: '[--v-bg:var(--success-container)] [--v-fg:var(--on-success-container)] [--v-text:var(--success)] [--v-border:var(--success)]',
        warning: '[--v-bg:var(--warning-container)] [--v-fg:var(--on-warning-container)] [--v-text:var(--warning)] [--v-border:var(--warning)]',
        info: '[--v-bg:var(--info-container)] [--v-fg:var(--on-info-container)] [--v-text:var(--info)] [--v-border:var(--info)]',
      },
      size: {
        sm: 'px-1 py-[2px] gap-1 text-label-sm rounded-component',
        md: 'px-2 py-1 gap-1 text-label-md rounded-component',
        lg: 'px-3 py-1 gap-1 text-label-lg rounded-component',
      },
    },
    defaultVariants: {
      variant: 'filled',
      state: 'default',
      size: 'md',
    },
  }
);

const badgeIconSize: Record<string, string> = {
  sm: 'size-icon-0',
  md: 'size-icon-0',
  lg: 'size-icon-1',
};

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

const INTERACTIVE_CLASSES = 'interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
const CLOSE_BUTTON_CLASSES = 'shrink-0 ml-1 inline-flex items-center justify-center rounded-component p-0.5 interactive opacity-(--opacity-muted) hover:opacity-100 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

const Badge = forwardRef<HTMLElement, BadgeProps>(
  ({ variant = 'filled', state = 'default', size = 'md', asChild = false, interactive = false, onClick, onRemove, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const iconCls = badgeIconSize[size];
    const computedClasses = badgeVariants({ variant, state, size });

    const content = (
      <>
        {leadingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{leadingIcon}</span>}
        {children}
        {trailingIcon && !onRemove && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{trailingIcon}</span>}
      </>
    );

    const closeButton = onRemove ? (
      <button
        type="button"
        className={CLOSE_BUTTON_CLASSES}
        onClick={onRemove}
        aria-label="Remove"
      >
        <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}><X /></span>
      </button>
    ) : null;

    // asChild — Slot merges into the consumer-provided element. Behavior modes (interactive/onRemove) layer on top.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(computedClasses, interactive && INTERACTIVE_CLASSES, className)}
          {...props}
        >
          <>
            {content}
            {closeButton}
          </>
        </Slot>
      );
    }

    // interactive + onRemove — container carries the fill/radius; two transparent
    // segments split it, each padded like a button and rounded only on its outer edge,
    // for a uniform button-like split hover. Padding moves off the container (!p-0 !gap-0).
    // ref is narrowed per branch — a polymorphic span/button ref can't be expressed at the type level.
    if (interactive && onRemove) {
      const segPad = badgeSegmentPad[size];
      const segmentBase = 'inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
      return (
        <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(computedClasses, '!p-0 !gap-0 inline-flex items-stretch', className)} {...props}>
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
            <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}><X /></span>
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
          className={cn(computedClasses, INTERACTIVE_CLASSES, className)}
          onClick={onClick}
          {...props}
        >
          {content}
        </button>
      );
    }

    // span (plain or onRemove only)
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(computedClasses, className)} {...props}>
        {content}
        {closeButton}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants, badgeIconSize };
