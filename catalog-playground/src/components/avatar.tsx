'use client';

import { forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden bg-primary-container text-on-primary-container font-semibold uppercase',
  {
    variants: {
      size: {
        sm: 'size-ch-1 text-[10px] leading-[10px]',
        md: 'size-ch-3 text-[12px] leading-[12px]',
        lg: 'size-ch-5 text-[14px] leading-[14px]',
        xl: 'size-ch-7 text-[16px] leading-[16px]',
      },
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-component',
      },
    },
    defaultVariants: { size: 'md', shape: 'circle' },
  }
);

const Avatar = forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>
>(({ size, shape, className, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} className={cn(avatarVariants({ size, shape }), className)} {...props} />
));
Avatar.displayName = 'Avatar';

const AvatarImage = forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square size-full', className)} {...props} />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback ref={ref} className={cn('flex size-full items-center justify-center', className)} {...props} />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
