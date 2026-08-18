const { buildVariantStyles } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

function generateRadixToast(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  // Icon size map
  const iconSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconSizeEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
  }

  const defaultSize = config.default?.size || 'md';
  const defaultVariant = config.default?.variant || 'default';

  return `'use client';

import { forwardRef } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from './cn';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden shadow-[var(--shadow-3)] transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { variant: '${defaultVariant}', size: '${defaultSize}' },
  }
);

const iconSizeMap: Record<string, string> = {
${Object.entries(iconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 right-0 z-[var(--z-toast)] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col sm:max-w-[420px]',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

const Toast = forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ variant, size, className, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant, size }), className)} {...props} />
));
Toast.displayName = 'Toast';

const ToastTitle = forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('font-semibold', className)} {...props} />
));
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-body-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = 'ToastDescription';

const ToastAction = forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-component px-3 py-1 text-action-sm',
      'ring-1 ring-inset ring-current/20 interactive cursor-pointer',
      'control',
      'control',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = 'ToastAction';

const ToastClose = forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close> & { size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')} }
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'shrink-0 rounded-component p-1 interactive cursor-pointer opacity-(--opacity-muted) hover:opacity-100 transition-opacity',
      'control',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className={iconSizeMap[size] || '${iconSizeEntries[defaultSize] || 'size-icon-2'}'} />
  </ToastPrimitive.Close>
));
ToastClose.displayName = 'ToastClose';

export {
  ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose,
  toastVariants,
};
`;
}

module.exports = { generateRadixToast };
