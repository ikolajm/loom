import { forwardRef, useState, createContext, useContext } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const fabMenuTriggerVariants = cva(
  'inline-flex items-center justify-center interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary-container',
      },
      size: {
        sm: 'size-ch-5 rounded-card shadow-[var(--shadow-2)]',
        md: 'size-ch-8 rounded-card shadow-[var(--shadow-3)]',
        lg: 'size-ch-9 rounded-card shadow-[var(--shadow-3)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const fabMenuActionVariants = cva(
  'inline-flex items-center justify-center interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary-container',
      },
      size: {
        sm: 'size-ch-3 rounded-card shadow-[var(--shadow-1)]',
        md: 'size-ch-5 rounded-card shadow-[var(--shadow-2)]',
        lg: 'size-ch-7 rounded-card shadow-[var(--shadow-2)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const fabMenuTriggerIconSize: Record<string, string> = {
  sm: 'size-icon-2',
  md: 'size-icon-3',
  lg: 'size-icon-4',
};

const fabMenuActionIconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-3',
};

const fabMenuStackGap: Record<string, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-3',
};

const FAB_LABEL_CLASSES = 'bg-surface-2 text-on-surface px-2 py-1 rounded-pill font-medium text-[12px] leading-[16px] tracking-[0.01em]';

type FabMenuSize = 'sm' | 'md' | 'lg';

const FabMenuContext = createContext<{ size: FabMenuSize }>({ size: 'md' });

type FabMenuProps = React.HTMLAttributes<HTMLDivElement>
  & Omit<VariantProps<typeof fabMenuTriggerVariants>, 'size'>
  & {
    size?: FabMenuSize;
    triggerIcon: React.ReactNode;
    triggerLabel?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  };

const FabMenu = forwardRef<HTMLDivElement, FabMenuProps>(
  ({ variant, size = 'md', triggerIcon, triggerLabel, open: openProp, defaultOpen = false, onOpenChange, className, children, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = openProp !== undefined ? openProp : internalOpen;

    const handleOpenChange = (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    };

    const triggerIconCls = fabMenuTriggerIconSize[size];
    const stackGap = fabMenuStackGap[size];

    return (
      <FabMenuContext.Provider value={{ size }}>
        <div ref={ref} className={cn('relative inline-flex flex-col items-end', className)} {...props}>
          {open && (
            <div className={cn('mb-3 flex flex-col items-end', stackGap)} role="menu">
              {children}
            </div>
          )}
          <button
            type="button"
            className={cn(fabMenuTriggerVariants({ variant, size }))}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => handleOpenChange(!open)}
          >
            <span className={cn('shrink-0 [&>svg]:size-full', triggerIconCls)}>{triggerIcon}</span>
            {triggerLabel && <span className="ml-2">{triggerLabel}</span>}
          </button>
        </div>
      </FabMenuContext.Provider>
    );
  }
);
FabMenu.displayName = 'FabMenu';

type FabActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & {
    icon: React.ReactNode;
    label?: string;
  };

const FabAction = forwardRef<HTMLButtonElement, FabActionProps>(
  ({ icon, label, className, ...props }, ref) => {
    const { size } = useContext(FabMenuContext);
    const actionIconCls = fabMenuActionIconSize[size];

    return (
      <div className="inline-flex items-center gap-2">
        {label && <span className={cn(FAB_LABEL_CLASSES)} aria-hidden="true">{label}</span>}
        <button
          ref={ref}
          type="button"
          className={cn(fabMenuActionVariants({ size }), className)}
          role="menuitem"
          aria-label={label}
          {...props}
        >
          <span className={cn('shrink-0 [&>svg]:size-full', actionIconCls)}>{icon}</span>
        </button>
      </div>
    );
  }
);
FabAction.displayName = 'FabAction';

export { FabMenu, FabAction, fabMenuTriggerVariants, fabMenuActionVariants };
