'use client';

import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

const dialogContentVariants = cva(
  'fixed left-1/2 top-1/2 z-[var(--z-modal)] w-full -translate-x-1/2 -translate-y-1/2 flex flex-col bg-surface-1 text-on-surface shadow-[var(--shadow-3)]',
  {
    variants: {
      size: {
        sm: 'px-4 py-4 gap-4 rounded-modal max-w-[400px] text-body-sm',
        md: 'px-6 py-6 gap-6 rounded-modal max-w-[560px] text-body-md',
        lg: 'px-8 py-6 gap-6 rounded-modal max-w-[720px] text-body-lg',
        full: 'px-6 py-6 gap-6 rounded-component max-w-full',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-[var(--z-modal)] bg-scrim/60 data-[state=open]:animate-in data-[state=open]:fade-in-0', className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & VariantProps<typeof dialogContentVariants>
>(({ size, className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ size }), className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />
  )
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-title-md font-semibold', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-body-sm text-on-surface-variant', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogFooter = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-end gap-2', className)} {...props} />
  )
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  dialogContentVariants,
};
