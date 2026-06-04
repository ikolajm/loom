const { buildVariantStyles, buildSizeStyles, buildTypographyClasses } = require('../shared');
const { filterSizes, extractIconSizes, buildSizeStylesWithText, prefixClasses } = require('./helpers');

function generateRadixToggle(name, config, meta) {
  const resolved = config;
  const stateStyles = resolved.state ? buildVariantStyles(resolved.state) : {};
  const sizes = filterSizes(resolved.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);
  const iconSizes = extractIconSizes(sizes);
  const typo = buildTypographyClasses(resolved);

  return `'use client';

import { forwardRef } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const toggleVariants = cva(
  'inline-flex items-center justify-center ${typo} interactive cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${prefixClasses('data-[state=off]', stateStyles.unpressed || 'bg-transparent text-on-surface-variant border border-outline-subtle')} ${prefixClasses('data-[state=on]', stateStyles.pressed || 'bg-primary-container text-on-primary-container')}',
  {
    variants: {
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { size: '${resolved.default?.size || 'md'}' },
  }
);

const toggleIconSize: Record<string, string> = {
${Object.entries(iconSizes || {}).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
  & VariantProps<typeof toggleVariants>
  & {
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

const Toggle = forwardRef<React.ComponentRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ size = 'md', leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const iconCls = toggleIconSize[size || 'md'] || '';
    return (
      <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ size }), className)} {...props}>
        {leadingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{trailingIcon}</span>}
      </TogglePrimitive.Root>
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle, toggleVariants };
`;
}

function generateRadixToggleGroup(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';

  // Build item size map: height from group config, padding/text from toggle's sizes (shared family)
  const itemSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    if (sz.height) classes.push(`h-${sz.height.replace('height/', '')}`);
    // Padding and text from the toggle config's sizes (they share the action family)
    // Use scale mapping: sm→px-2, md→px-3, lg→px-4
    const pxMap = { sm: 'px-2', md: 'px-3', lg: 'px-4' };
    classes.push(pxMap[tier] || 'px-3');
    classes.push(`text-action-${tier}`);
    itemSizeEntries[tier] = classes.join(' ');
  }

  return `'use client';

import { forwardRef } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
${Object.entries(itemSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type SizeProps = { size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')} };

const ToggleGroup = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & SizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    data-size={size}
    className={cn('inline-flex items-center border border-outline-subtle rounded-component overflow-hidden divide-x divide-outline-subtle', className)}
    {...props}
  />
));
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & SizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center font-medium interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[state=off]:text-on-surface-variant data-[state=on]:bg-primary-container data-[state=on]:text-on-primary-container',
      itemSizeMap[size],
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
`;
}

module.exports = { generateRadixToggle, generateRadixToggleGroup };
