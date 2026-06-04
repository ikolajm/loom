import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const bottomNavVariants = cva(
  'flex items-center justify-around w-full',
  {
    variants: {
      variant: {
        default: 'bg-surface border-outline-subtle border-t',
      },
      size: {
        sm: 'h-ch-8 gap-1 text-label-sm',
        md: 'h-ch-9 gap-1 text-label-md',
        lg: 'gap-1 text-label-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type BottomNavProps = React.HTMLAttributes<HTMLElement>
  & VariantProps<typeof bottomNavVariants>
;

const BottomNav = forwardRef<HTMLElement, BottomNavProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn(bottomNavVariants({ variant, size }), className)} {...props}>
        {children}
      </nav>
    );
  }
);
BottomNav.displayName = 'BottomNav';

export { BottomNav, bottomNavVariants };

const BottomNavItem = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { active?: boolean; icon?: React.ReactNode; }>(
  ({ active = false, icon, className, children, ...props }, ref) => (
    <button ref={ref} type="button" className={cn(
      'flex flex-1 flex-col items-center justify-center gap-0.5 h-full px-3 interactive cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-on-surface-variant',
      active && 'text-primary',
      className
    )} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
);
BottomNavItem.displayName = 'BottomNavItem';

export { BottomNavItem };