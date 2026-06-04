const { buildVariantStyles, buildSizeStyles, buildTypographyClasses, colorToClass } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

function generateRadixTooltip(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  return `'use client';

import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const tooltipContentVariants = cva(
  'z-[var(--z-tooltip)] overflow-hidden ${variantStyles.default || 'bg-surface-1 text-on-surface shadow-[var(--shadow-1)]'} animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { size: '${config.default?.size || 'md'}' },
  }
);

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & VariantProps<typeof tooltipContentVariants>
>(({ size, sideOffset = 4, className, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(tooltipContentVariants({ size }), className)} {...props} />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, tooltipContentVariants };
`;
}

function generateRadixPopover(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  return `'use client';

import { forwardRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const popoverContentVariants = cva(
  'z-[var(--z-popover)] flex flex-col ${variantStyles.default || 'bg-surface-1 text-on-surface shadow-[var(--shadow-2)]'} animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { size: '${config.default?.size || 'md'}' },
  }
);

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & VariantProps<typeof popoverContentVariants>
>(({ size, align = 'center', sideOffset = 4, className, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} className={cn(popoverContentVariants({ size }), className)} {...props} />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, popoverContentVariants };
`;
}

function generateRadixSeparator(name, config, meta) {
  return `import { forwardRef } from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from './cn';

const Separator = forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-outline-subtle',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

export { Separator };
`;
}

function generateRadixAvatar(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  // Build size classes with explicit font sizes from config
  const sizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    // Size token (height/ch-N → size-ch-N)
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('height/')) {
      classes.push(`size-${sz.size.replace('height/', '')}`);
    }
    // Explicit font sizes from config
    if (sz['font-size']) classes.push(`text-[${sz['font-size']}]`);
    if (sz['line-height']) classes.push(`leading-[${sz['line-height']}]`);
    sizeEntries[tier] = classes.join(' ');
  }

  // Shape variants from config
  const shapes = config.shapes || {};
  const shapeEntries = {};
  for (const [shapeName, shapeDef] of Object.entries(shapes)) {
    if (shapeDef.radius === 'radius/pill') shapeEntries[shapeName] = 'rounded-full';
    else if (shapeDef.radius === 'radius/component') shapeEntries[shapeName] = 'rounded-component';
    else if (shapeDef.radius === 'radius/card') shapeEntries[shapeName] = 'rounded-card';
    else shapeEntries[shapeName] = 'rounded-full';
  }
  // Fallback if no shapes defined
  if (Object.keys(shapeEntries).length === 0) shapeEntries.circle = 'rounded-full';

  return `'use client';

import { forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden bg-primary-container text-on-primary-container font-semibold uppercase',
  {
    variants: {
      size: {
${Object.entries(sizeEntries).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      shape: {
${Object.entries(shapeEntries).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { size: '${config.default?.size || 'md'}', shape: '${config.default?.shape || 'circle'}' },
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
`;
}

function generateRadixProgress(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStyles(sizes);

  // Extract fill colors from variant track-bg/fill-bg pattern
  const fillColors = {};
  if (config.variants) {
    for (const [vName, vDef] of Object.entries(config.variants)) {
      const fill = colorToClass(vDef['fill-bg'], 'bg');
      fillColors[vName] = fill || 'bg-primary';
    }
  }

  return `'use client';

import { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const progressVariants = cva('relative w-full overflow-hidden bg-surface-1', {
  variants: {
    variant: {
${Object.entries(fillColors).map(([k, v]) => `      ${k}: '',`).join('\n')}
    },
    size: {
${Object.entries(sizeStyles).map(([k, v]) => `      ${k}: '${v}',`).join('\n')}
    },
  },
  defaultVariants: { variant: '${config.default?.variant || 'default'}', size: '${config.default?.size || 'md'}' },
});

const fillVariants: Record<string, string> = {
${Object.entries(fillColors).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const ProgressBar = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & VariantProps<typeof progressVariants>
>(({ variant = 'default', size, value, className, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn('h-full w-full flex-1 rounded-pill transition-all', fillVariants[variant || 'default'])}
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
    />
  </ProgressPrimitive.Root>
));
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar, progressVariants };
`;
}

function generateRadixHoverCard(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  // Extract max-width per size tier
  const maxWidths = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (sz['max-width']) maxWidths[tier] = sz['max-width'];
  }

  // Detect border from variant
  const hasBorder = variantStyles.default?.includes('outline-subtle') || config.variants?.default?.border;

  return `'use client';

import { forwardRef } from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const hoverCardContentVariants = cva(
  'z-[var(--z-popover)] flex flex-col overflow-hidden ${variantStyles.default || 'bg-surface-1 text-on-surface shadow-[var(--shadow-2)]'}${hasBorder ? ' border border-outline-subtle' : ''} animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
${Object.entries(sizeStyles).map(([k, v]) => {
    const mw = maxWidths[k] ? ` max-w-[${maxWidths[k]}]` : '';
    return `        ${k}: '${v}${mw}',`;
  }).join('\n')}
      },
    },
    defaultVariants: { size: '${config.default?.size || 'md'}' },
  }
);

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = forwardRef<
  React.ComponentRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & VariantProps<typeof hoverCardContentVariants>
>(({ size, sideOffset = 4, align = 'center', className, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content ref={ref} sideOffset={sideOffset} align={align} className={cn(hoverCardContentVariants({ size }), className)} {...props} />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = 'HoverCardContent';

export { HoverCard, HoverCardTrigger, HoverCardContent, hoverCardContentVariants };
`;
}

module.exports = {
  generateRadixTooltip,
  generateRadixPopover,
  generateRadixSeparator,
  generateRadixAvatar,
  generateRadixProgress,
  generateRadixHoverCard,
};
