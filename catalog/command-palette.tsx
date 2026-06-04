'use client';

import { forwardRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from './cn';

const containerSizeMap: Record<string, string> = {
  sm: 'max-w-[480px] rounded-modal',
  md: 'max-w-[560px] rounded-modal',
  lg: 'max-w-[640px] rounded-modal',
};

const inputSizeMap: Record<string, string> = {
  sm: 'h-ch-7 px-3 text-[16px] leading-[24px]',
  md: 'h-ch-8 px-4 text-[18px] leading-[28px]',
  lg: 'h-ch-9 px-6 text-[20px] leading-[28px]',
};

const itemSizeMap: Record<string, string> = {
  sm: 'h-ch-5 px-3 gap-2 text-[14px] leading-[20px]',
  md: 'h-ch-7 px-4 gap-3 text-[14px] leading-[20px]',
  lg: 'h-ch-8 px-4 gap-3 text-[16px] leading-[24px]',
};

const groupLabelSizeMap: Record<string, string> = {
  sm: 'text-[10px] leading-[14px]',
  md: 'text-[12px] leading-[16px]',
  lg: 'text-[12px] leading-[16px]',
};

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type SizeProps = { size?: 'sm' | 'md' | 'lg' };

const CommandPalette = forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex w-full flex-col overflow-hidden bg-surface-1 text-on-surface border border-outline-subtle shadow-[var(--shadow-3)]',
      containerSizeMap[size],
      className,
    )}
    {...props}
  />
));
CommandPalette.displayName = 'CommandPalette';

const CommandPaletteInput = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>, 'size'> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <div className="flex items-center border-b border-outline-subtle" cmdk-input-wrapper="">
    <Search className={cn('shrink-0 ml-3 text-on-surface-variant', iconSizeMap[size])} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex w-full bg-transparent outline-none placeholder:text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-50',
        inputSizeMap[size],
        className,
      )}
      {...props}
    />
  </div>
));
CommandPaletteInput.displayName = 'CommandPaletteInput';

const CommandPaletteList = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)} {...props} />
));
CommandPaletteList.displayName = 'CommandPaletteList';

const CommandPaletteEmpty = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty ref={ref} className={cn('py-6 text-center text-body-sm text-on-surface-variant', className)} {...props} />
));
CommandPaletteEmpty.displayName = 'CommandPaletteEmpty';

const CommandPaletteGroup = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-on-surface-variant [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.02em]',
      groupLabelSizeMap[size] && `[&_[cmdk-group-heading]]:${groupLabelSizeMap[size].split(' ').join(' [&_[cmdk-group-heading]]:')} `,
      className,
    )}
    {...props}
  />
));
CommandPaletteGroup.displayName = 'CommandPaletteGroup';

const CommandPaletteItem = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & SizeProps
>(({ size = 'md', className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center select-none interactive cursor-pointer',
      'data-[selected=true]:bg-surface-2',
      'data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed',
      itemSizeMap[size],
      className,
    )}
    {...props}
  />
));
CommandPaletteItem.displayName = 'CommandPaletteItem';

const CommandPaletteSeparator = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-outline-subtle', className)} {...props} />
));
CommandPaletteSeparator.displayName = 'CommandPaletteSeparator';

const CommandPaletteShortcut = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('ml-auto text-body-sm tracking-widest text-on-surface-variant', className)} {...props} />
  )
);
CommandPaletteShortcut.displayName = 'CommandPaletteShortcut';

export {
  CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteEmpty,
  CommandPaletteGroup, CommandPaletteItem, CommandPaletteSeparator, CommandPaletteShortcut,
};
