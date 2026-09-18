const { buildSizeStyles, cls } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

/**
 * Built-in close affordance, shared by Dialog and Sheet (both wrap @radix-ui/react-dialog).
 * `alias` is the imported primitive namespace (DialogPrimitive / SheetPrimitive); `pad` is the
 * leading indent for the block. Single source for the close-button markup + styling.
 */
function closeButton(alias, pad) {
  // Compose the iconOnly Button (house dismiss pattern, color="inherit" takes the surface
  // foreground). The wrapper div carries the absolute position — Button's `.interactive`
  // utility hard-sets position:relative, so positioning Button directly via className loses
  // the cascade (same footgun as the carousel arrows).
  return [
    `${pad}{showClose && (`,
    `${pad}  <div className="${cls('dialog-close', 'dialog')}">`,
    `${pad}    <${alias}.Close asChild>`,
    `${pad}      <Button iconOnly variant="ghost" color="inherit" size="sm" aria-label="Close">`,
    `${pad}        <X />`,
    `${pad}      </Button>`,
    `${pad}    </${alias}.Close>`,
    `${pad}  </div>`,
    `${pad})}`,
  ].join('\n');
}

/**
 * Appearance is the class layer's; this carries behavior. `size` and the variant travel
 * as data attributes rather than a cva of utility strings — those strings resolved only
 * through the `@theme` bridge, so after it went out the panel, overlay, header and
 * sizing all rendered as nothing while the typecheck stayed green.
 *
 * `.dialog-fixed` is applied here because a Radix `Content` is a plain div in a portal
 * and has to be placed. A native `<dialog>` takes `.dialog` alone and is placed by the UA.
 */
function generateRadixDialog(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const sizeUnion = Object.keys(sizes).map((s) => `'${s}'`).join(' | ');
  const defaultSize = config.default && config.default.size ? config.default.size : 'md';

  return `'use client';

import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from './cn';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn('${cls('dialog-overlay', 'dialog')}', className)} {...props} />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: ${sizeUnion}; showClose?: boolean }
>(({ size = '${defaultSize}', showClose = true, className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn('${cls('dialog dialog-fixed', 'dialog')}', className)}
      data-size={size}
      data-variant="default"
      {...props}
    >
      {children}
${closeButton('DialogPrimitive', '      ')}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('${cls('dialog-header', 'dialog')}', className)} {...props} />
  )
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('${cls('dialog-title', 'dialog')}', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('${cls('dialog-description', 'dialog')}', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogFooter = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('${cls('dialog-footer', 'dialog')}', className)} {...props} />
  )
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
};
`;
}


module.exports = { generateRadixDialog };
