'use client';

import { forwardRef } from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { Square, CheckSquare, ChevronRight, Circle } from 'lucide-react';
import { cn } from './cn';

const contextMenuContentVariants = cva(
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

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type SizeProps = { size?: 'sm' | 'md' | 'lg' };

const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuContent = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content> & VariantProps<typeof contextMenuContentVariants>
>(({ size, className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content ref={ref} className={cn(contextMenuContentVariants({ size }), className)} {...props} />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = 'ContextMenuContent';

const ContextMenuItem = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & SizeProps & { inset?: boolean }
>(({ size = 'md', inset, className, ...props }, ref) => (
  <ContextMenuPrimitive.Item
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
ContextMenuItem.displayName = 'ContextMenuItem';

const ContextMenuCheckboxItem = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem> & SizeProps
>(({ size = 'md', className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
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
      {checked ? <CheckSquare className={iconSizeMap[size] || 'size-icon-2'} /> : <Square className={iconSizeMap[size] || 'size-icon-2'} />}
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

const ContextMenuRadioItem = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem> & SizeProps
>(({ size = 'md', className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
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
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';

const ContextMenuLabel = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label ref={ref} className={cn('px-2 py-1.5 text-body-sm font-semibold text-on-surface-variant', inset && 'pl-8', className)} {...props} />
));
ContextMenuLabel.displayName = 'ContextMenuLabel';

const ContextMenuSeparator = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-outline-subtle', className)} {...props} />
));
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

const ContextMenuShortcut = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('ml-auto text-body-sm tracking-widest text-on-surface-variant', className)} {...props} />
  )
);
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

const ContextMenuSubTrigger = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & SizeProps & { inset?: boolean }
>(({ size = 'md', inset, className, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
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
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';

const ContextMenuSubContent = forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent> & VariantProps<typeof contextMenuContentVariants>
>(({ size, className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent ref={ref} className={cn(contextMenuContentVariants({ size }), className)} {...props} />
));
ContextMenuSubContent.displayName = 'ContextMenuSubContent';

export {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel,
  ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup,
  ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
  ContextMenuPortal, ContextMenuRadioGroup,
  contextMenuContentVariants,
};
