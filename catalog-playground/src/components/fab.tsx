import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const fabVariants = cva(
  'inline-flex items-center justify-center font-medium tracking-[0.01em] interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary-container',
      },
      size: {
        'sm': 'size-ch-5 rounded-card shadow-[var(--shadow-2)]',
        'md': 'size-ch-8 rounded-card shadow-[var(--shadow-3)]',
        'lg': 'size-ch-9 rounded-card shadow-[var(--shadow-3)]',
        'ext-sm': 'h-ch-5 px-3 gap-2 rounded-card shadow-[var(--shadow-2)] text-[12px] leading-[16px]',
        'ext-md': 'h-ch-8 px-4 gap-3 rounded-card shadow-[var(--shadow-3)] text-[14px] leading-[20px]',
        'ext-lg': 'h-ch-9 px-6 gap-3 rounded-card shadow-[var(--shadow-3)] text-[18px] leading-[28px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const fabIconSize: Record<string, string> = {
  sm: 'size-icon-2',
  md: 'size-icon-3',
  lg: 'size-icon-4',
};

type FABSize = 'sm' | 'md' | 'lg';

type FABProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & Omit<VariantProps<typeof fabVariants>, 'size'>
  & {
    size?: FABSize;
    label?: string;
    icon?: React.ReactNode;
  };

const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ variant, size = 'md', label, icon, className, children, ...props }, ref) => {
    const extended = !!label;
    const resolvedSize = extended ? `ext-${size}` : size;
    const iconCls = fabIconSize[size] || '';

    return (
      <button
        ref={ref}
        className={cn(fabVariants({ variant, size: resolvedSize as any }), className)}
        {...props}
      >
        {icon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{icon}</span>}
        {!icon && children && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{children}</span>}
        {label && <span>{label}</span>}
      </button>
    );
  }
);
FAB.displayName = 'FAB';

export { FAB, fabVariants };
