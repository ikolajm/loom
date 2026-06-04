'use client';

import { forwardRef } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

const sheetSideVariants = cva(
  'fixed z-[var(--z-modal)] flex flex-col bg-surface-1 text-on-surface shadow-[var(--shadow-3)] transition-transform',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 w-full rounded-b-modal',
        bottom: 'inset-x-0 bottom-0 w-full rounded-t-modal',
        left: 'inset-y-0 left-0 h-full rounded-r-modal',
        right: 'inset-y-0 right-0 h-full rounded-l-modal',
      },
    },
    defaultVariants: { side: 'right' },
  }
);

/** Size applies as width for left/right, height for top/bottom */
const sheetSizeMap: Record<string, { padding: string; gap: string; horizontal: string; vertical: string }> = {
  sm: { padding: 'px-4 py-4', gap: 'gap-4', horizontal: 'w-[320px]', vertical: 'max-h-[80vh]' },
  md: { padding: 'px-6 py-6', gap: 'gap-6', horizontal: 'w-[400px]', vertical: 'max-h-[80vh]' },
  lg: { padding: 'px-8 py-6', gap: 'gap-6', horizontal: 'w-[560px]', vertical: 'max-h-[80vh]' },
};

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-[var(--z-modal)] bg-scrim/60', className)} {...props} />
));
SheetOverlay.displayName = 'SheetOverlay';

type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
  & VariantProps<typeof sheetSideVariants>
  & { size?: 'sm' | 'md' | 'lg' };

const SheetContent = forwardRef<React.ComponentRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', size = 'md', className, children, ...props }, ref) => {
    const s = sheetSizeMap[size];
    const isHorizontal = side === 'left' || side === 'right';
    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          ref={ref}
          className={cn(sheetSideVariants({ side }), s.padding, s.gap, isHorizontal ? s.horizontal : s.vertical, className)}
          {...props}
        >
          {children}
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  }
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-title-md font-semibold', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-body-sm text-on-surface-variant', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';

const SheetFooter = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center justify-end gap-2', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

export {
  Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose,
  SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
  sheetSideVariants,
};
