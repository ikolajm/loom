import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium tracking-[0.02em]',
  {
    variants: {
      variant: {
        'filled': '',
        'outline': '',
        'outline-mono': '',
        'dot': '',
      },
      state: {
        default: '',
        neutral: '',
        destructive: '',
        success: '',
        warning: '',
        info: '',
      },
      size: {
        sm: 'px-1 py-[2px] gap-1 text-[10px] leading-[14px] rounded-pill',
        md: 'px-2 py-1 gap-1 text-[10px] leading-[14px] rounded-pill',
        lg: 'px-3 py-1 gap-1 text-[12px] leading-[16px] rounded-pill',
      },
    },
    compoundVariants: [
      { variant: 'filled', state: 'default', class: 'bg-primary-container text-on-primary-container' },
      { variant: 'filled', state: 'neutral', class: 'bg-neutral-container text-on-neutral-container' },
      { variant: 'filled', state: 'destructive', class: 'bg-error-container text-on-error-container' },
      { variant: 'filled', state: 'success', class: 'bg-success-container text-on-success-container' },
      { variant: 'filled', state: 'warning', class: 'bg-warning-container text-on-warning-container' },
      { variant: 'filled', state: 'info', class: 'bg-info-container text-on-info-container' },
      { variant: 'outline', state: 'default', class: 'bg-transparent text-primary border-primary border' },
      { variant: 'outline', state: 'neutral', class: 'bg-transparent text-neutral border-neutral border' },
      { variant: 'outline', state: 'destructive', class: 'bg-transparent text-error border-error border' },
      { variant: 'outline', state: 'success', class: 'bg-transparent text-success border-success border' },
      { variant: 'outline', state: 'warning', class: 'bg-transparent text-warning border-warning border' },
      { variant: 'outline', state: 'info', class: 'bg-transparent text-info border-info border' },
      { variant: 'outline-mono', class: 'bg-transparent text-on-surface border-outline-subtle border' },
      { variant: 'dot', state: 'default', class: 'bg-primary' },
      { variant: 'dot', state: 'neutral', class: 'bg-neutral' },
      { variant: 'dot', state: 'destructive', class: 'bg-error' },
      { variant: 'dot', state: 'success', class: 'bg-success' },
      { variant: 'dot', state: 'warning', class: 'bg-warning' },
      { variant: 'dot', state: 'info', class: 'bg-info' },
      { variant: 'dot', size: 'sm', class: 'size-icon-0 rounded-pill !p-0 !gap-0' },
      { variant: 'dot', size: 'md', class: 'size-icon-1 rounded-pill !p-0 !gap-0' },
      { variant: 'dot', size: 'lg', class: 'size-icon-2 rounded-pill !p-0 !gap-0' },
    ],
    defaultVariants: {
      variant: 'filled',
      state: 'default',
      size: 'md',
    },
  }
);

const badgeIconSize: Record<string, string> = {
  sm: 'size-icon-0',
  md: 'size-icon-1',
  lg: 'size-icon-2',
};

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'filled' | 'outline' | 'outline-mono' | 'dot';
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

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={cn(className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const INTERACTIVE_CLASSES = 'interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
const CLOSE_BUTTON_CLASSES = 'shrink-0 ml-1 opacity-70 hover:opacity-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

const Badge = forwardRef<HTMLElement, BadgeProps>(
  ({ variant = 'filled', state = 'default', size = 'md', asChild = false, interactive = false, onClick, onRemove, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const iconCls = badgeIconSize[size];
    const computedClasses = badgeVariants({ variant, state, size });

    // Dot variant — no content, just a colored circle
    if (variant === 'dot') {
      const Comp = interactive ? 'button' : 'span';
      return (
        <Comp
          ref={ref as any}
          className={cn(computedClasses, interactive && INTERACTIVE_CLASSES, className)}
          onClick={interactive ? (onClick as any) : undefined}
          {...(props as any)}
        />
      );
    }

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
        <CloseIcon className={iconCls} />
      </button>
    ) : null;

    // asChild — Slot merges into the consumer-provided element. Behavior modes (interactive/onRemove) layer on top.
    if (asChild) {
      return (
        <Slot
          ref={ref as any}
          className={cn(computedClasses, interactive && INTERACTIVE_CLASSES, className)}
          {...(props as any)}
        >
          <>
            {content}
            {closeButton}
          </>
        </Slot>
      );
    }

    // interactive + onRemove — two sibling buttons inside a span (avoids nested buttons)
    if (interactive && onRemove) {
      return (
        <span ref={ref as any} className={cn(computedClasses, className)} {...(props as any)}>
          <button
            type="button"
            className={INTERACTIVE_CLASSES}
            onClick={onClick as any}
            style={{ background: 'inherit', color: 'inherit', font: 'inherit', padding: 0, border: 0 }}
          >
            {content}
          </button>
          {closeButton}
        </span>
      );
    }

    // interactive only — button
    if (interactive) {
      return (
        <button
          ref={ref as any}
          type="button"
          className={cn(computedClasses, INTERACTIVE_CLASSES, className)}
          onClick={onClick as any}
          {...(props as any)}
        >
          {content}
        </button>
      );
    }

    // span (plain or onRemove only)
    return (
      <span ref={ref as any} className={cn(computedClasses, className)} {...(props as any)}>
        {content}
        {closeButton}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants, badgeIconSize };
