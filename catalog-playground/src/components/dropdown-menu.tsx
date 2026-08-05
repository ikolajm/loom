'use client';

import { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { Square, CheckSquare, ChevronRight, Circle } from 'lucide-react';
import { cn } from './cn';

const dropdownMenuContentVariants = cva(
  'z-[var(--z-popover)] flex flex-col overflow-hidden bg-surface-1 text-on-surface shadow-[var(--shadow-2)] animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 gap-1 rounded-component text-body-sm',
        md: 'px-3 py-1 gap-1 rounded-component text-body-md',
        lg: 'px-4 py-2 gap-2 rounded-component text-body-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const itemSizeMap: Record<string, string> = {
  sm: 'h-ch-3 text-body-sm px-2',
  md: 'h-ch-4 text-body-md px-3',
  lg: 'h-ch-5 text-body-lg px-4',
};

const insetItemSizeMap: Record<string, string> = {
  sm: 'h-ch-3 text-body-sm pl-8 pr-2',
  md: 'h-ch-4 text-body-md pl-8 pr-3',
  lg: 'h-ch-5 text-body-lg pl-8 pr-4',
};

type SizeProps = { size?: 'sm' | 'md' | 'lg' };

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & VariantProps<typeof dropdownMenuContentVariants>
>(({ size, sideOffset = 4, className, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(dropdownMenuContentVariants({ size }), className)} {...props} />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & SizeProps & { inset?: boolean }
>(({ size = 'md', inset, className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 select-none interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      itemSizeMap[size],
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & SizeProps
>(({ size = 'md', className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 select-none interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      insetItemSizeMap[size],
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center text-on-surface-variant">
      {checked ? <CheckSquare className={'size-icon-2'} /> : <Square className={'size-icon-2'} />}
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & SizeProps
>(({ size = 'md', className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 select-none interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      insetItemSizeMap[size],
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label ref={ref} className={cn('px-2 py-1.5 text-body-sm font-semibold text-on-surface-variant', inset && 'pl-8', className)} {...props} />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-outline-subtle', className)} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('ml-auto text-body-sm tracking-widest text-on-surface-variant', className)} {...props} />
  )
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

const DropdownMenuSubTrigger = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & SizeProps & { inset?: boolean }
>(({ size = 'md', inset, className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex items-center gap-2 select-none interactive cursor-pointer',
      'data-[highlighted]:bg-surface-2',
      itemSizeMap[size],
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-icon-1" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & VariantProps<typeof dropdownMenuContentVariants>
>(({ size, className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent ref={ref} className={cn(dropdownMenuContentVariants({ size }), className)} {...props} />
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuPortal, DropdownMenuRadioGroup,
  dropdownMenuContentVariants,
};
