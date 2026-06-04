const { buildVariantStyles, buildSizeStyles, buildTypographyClasses, spacingToClass, ICON_SLOT_CLASS } = require('../shared');
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
        {leadingIcon && <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>{trailingIcon}</span>}
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
  const defaultVariant = config.default?.variant || 'segmented';
  const variantsCfg = config.variants || {};

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

  // Gap per variant (from config) — spaced uses it; segmented joins items (gap-0 + divide).
  const variantGap = {};
  for (const [v, cfg] of Object.entries(variantsCfg)) {
    if (v.startsWith('$')) continue;
    const gap = spacingToClass(cfg.gap, 'gap');
    variantGap[v] = gap || 'gap-0';
  }

  return `'use client';

import { forwardRef, createContext, useContext } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
${Object.entries(itemSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type ToggleGroupSize = ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')};
type ToggleGroupVariant = ${Object.keys(variantGap).map(v => `'${v}'`).join(' | ')};

// segmented = items touch, share borders, radius on container; spaced = gaps, each item owns border/radius.
const groupVariantClass: Record<ToggleGroupVariant, string> = {
  segmented: 'border border-outline-subtle rounded-component overflow-hidden divide-x divide-outline-subtle ${variantGap.segmented || 'gap-0'}',
  spaced: '${variantGap.spaced || 'gap-2'}',
};
const itemVariantClass: Record<ToggleGroupVariant, string> = {
  segmented: '',
  spaced: 'border border-outline-subtle rounded-component',
};

const ToggleGroupContext = createContext<{ variant: ToggleGroupVariant; size: ToggleGroupSize }>({ variant: '${defaultVariant}', size: '${defaultSize}' });

type GroupProps = { variant?: ToggleGroupVariant; size?: ToggleGroupSize };

const ToggleGroup = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & GroupProps
>(({ variant = '${defaultVariant}', size = '${defaultSize}', className, ...props }, ref) => (
  <ToggleGroupContext.Provider value={{ variant, size }}>
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-variant={variant}
      data-size={size}
      className={cn('inline-flex items-center', groupVariantClass[variant], className)}
      {...props}
    />
  </ToggleGroupContext.Provider>
));
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  const { variant, size } = useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium interactive cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        'data-[state=off]:text-on-surface-variant data-[state=on]:bg-primary-container data-[state=on]:text-on-primary-container',
        itemSizeMap[size],
        itemVariantClass[variant],
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
`;
}

module.exports = { generateRadixToggle, generateRadixToggleGroup };
