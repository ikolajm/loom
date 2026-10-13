const { cls } = require('../shared');
const { filterSizes } = require('./helpers');

/**
 * Appearance is the class layer's; this carries behavior. `size` and the variant travel
 * as data attributes rather than a cva of utility strings.
 *
 * `.dialog-fixed` is applied here because a Radix `Content` is a plain div in a portal
 * and has to be placed. A native `<dialog>` takes `.dialog` alone and is placed by the UA.
 *
 * The close button belongs to the header, off unless asked for. It was absolute in the
 * panel's corner, reserved no space, and a long title or description ran under it; both
 * consumers turned it off and one rebuilt it beside its title by hand. In the header it
 * takes a grid column, so nothing can reach under it. Off by default because a dialog with
 * a Cancel in its footer would carry two controls for one intent; a dialog with no footer
 * button asks for it, since it is then the only visible way out.
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
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: ${sizeUnion} }
>(({ size = '${defaultSize}', className, children, ...props }, ref) => (
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
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { showClose?: boolean }>(
  ({ showClose = false, className, children, ...props }, ref) => (
    <div ref={ref} className={cn('${cls('dialog-header', 'dialog')}', className)} {...props}>
      {children}
      {showClose && (
        <DialogPrimitive.Close asChild>
          <Button className="${cls('dialog-close', 'dialog')}" iconOnly variant="ghost" color="inherit" size="sm" aria-label="Close">
            <X />
          </Button>
        </DialogPrimitive.Close>
      )}
    </div>
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
