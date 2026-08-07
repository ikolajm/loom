import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const sidebarVariants = cva(
  'group flex flex-col',
  {
    variants: {
      variant: {
        default: 'bg-surface text-on-surface border-outline border-r w-[var(--sidebar-w)]',
        rail: 'bg-surface text-on-surface border-outline border-r is-rail w-[var(--sidebar-rail-w)]',
      },
      size: {
        sm: '[--sidebar-w:220px] [--sidebar-rail-w:56px] px-2',
        md: '[--sidebar-w:256px] [--sidebar-rail-w:64px] px-3',
        lg: '[--sidebar-w:300px] [--sidebar-rail-w:72px] px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type SidebarProps = React.HTMLAttributes<HTMLElement>
  & VariantProps<typeof sidebarVariants>
;

const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn(sidebarVariants({ variant, size }), className)} {...props}>
        {children}
      </nav>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export { Sidebar, sidebarVariants };

const sidebarItemSize: Record<string, string> = {
  sm: 'h-nav-item-sm px-3 gap-2 text-action-md',
  md: 'h-nav-item-md px-4 gap-3 text-action-md',
  lg: 'h-nav-item-lg px-4 gap-3 text-action-lg',
};

// Label hides + item centers when an ancestor <Sidebar variant="rail"> carries .is-rail.
const SidebarItem = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { active?: boolean; icon?: React.ReactNode; size?: 'sm' | 'md' | 'lg'; }>(
  ({ active = false, icon, size = 'md', className, children, ...props }, ref) => (
    <button ref={ref} type="button" className={cn(
      'flex items-center w-full rounded-component font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-on-surface-variant hover:bg-surface-1 hover:text-on-surface group-[.is-rail]:justify-center group-[.is-rail]:px-0',
      sidebarItemSize[size],
      active && 'bg-primary-container text-on-primary-container',
      className
    )} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1 truncate text-left group-[.is-rail]:hidden">{children}</span>
    </button>
  )
);
SidebarItem.displayName = 'SidebarItem';

export { SidebarItem };
