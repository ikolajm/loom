import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const sidebarVariants = cva(
  'flex flex-col',
  {
    variants: {
      variant: {
        default: 'bg-surface text-on-surface border-outline-subtle border-r',
      },
      size: {
        sm: 'px-2 w-[220px]',
        md: 'px-3 w-[256px]',
        lg: 'px-3 w-[300px]',
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
  sm: 'h-ch-5 px-3 gap-2 text-[14px] leading-[20px]',
  md: 'h-ch-7 px-4 gap-3 text-[14px] leading-[20px]',
  lg: 'h-ch-8 px-4 gap-3 text-[16px] leading-[24px]',
};

const SidebarItem = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { active?: boolean; icon?: React.ReactNode; size?: 'sm' | 'md' | 'lg'; }>(
  ({ active = false, icon, size = 'md', className, children, ...props }, ref) => (
    <button ref={ref} type="button" className={cn(
      'flex items-center w-full rounded-component font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-on-surface-variant hover:bg-surface-1 hover:text-on-surface',
      sidebarItemSize[size],
      active && 'bg-primary-container text-on-primary-container',
      className
    )} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
);
SidebarItem.displayName = 'SidebarItem';

export { SidebarItem };