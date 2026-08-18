import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const listItemVariants = cva(
  'flex items-center interactive cursor-pointer control',
  {
    variants: {
      variant: {
        default: 'bg-transparent border-0',
        bordered: 'bg-transparent border-outline border',
      },
      size: {
        sm: 'h-row-sm px-3 gap-2 text-body-sm',
        md: 'h-row-md px-4 gap-3 text-body-md',
        lg: 'h-row-lg px-6 gap-4 text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type ListItemProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof listItemVariants>
  & {
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
  };

const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ variant, size, leading, trailing, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(listItemVariants({ variant, size }), className)} {...props}>
        {leading && <span className="shrink-0">{leading}</span>}
        <span className="flex-1 min-w-0">{children}</span>
        {trailing && <span className="shrink-0">{trailing}</span>}
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

export { ListItem, listItemVariants };
