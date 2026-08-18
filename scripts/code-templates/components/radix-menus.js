const { buildVariantStyles } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

/**
 * Shared generator for DropdownMenu and ContextMenu.
 * Both share identical Radix APIs and config shapes — only the primitive import differs.
 */
function generateRadixMenu(name, config, meta) {
  const prefix = name; // 'DropdownMenu' or 'ContextMenu'
  const isDropdown = name === 'DropdownMenu';
  const pkg = meta.primitive; // '@radix-ui/react-dropdown-menu' or '@radix-ui/react-context-menu'
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const contentSizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  // Build item size map from config: item-height, x-padding, text-family-tier
  const itemSizeEntries = {};
  const insetItemSizeEntries = {}; // For checkbox/radio items — pl-8 instead of px-*
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const base = [];
    // item-height: height/ch-N → h-ch-N
    if (sz['item-height']) {
      base.push(`h-${sz['item-height'].replace('height/', '')}`);
    }
    // text from family
    if (meta.textFamily) base.push(`text-${meta.textFamily}-${tier}`);
    // x-padding for standard items
    const pxMatch = sz['x-padding']?.match(/\{scale\.(\d+)\}/);
    const pxVal = pxMatch ? pxMatch[1] : '3';
    itemSizeEntries[tier] = [...base, `px-${pxVal}`].join(' ');
    // inset items: right padding from config, left padding fixed for indicator space
    insetItemSizeEntries[tier] = [...base, `pl-8 pr-${pxVal}`].join(' ');
  }

  // Icon size map (ContextMenu has icon-size, DropdownMenu may not)
  const iconSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconSizeEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
  }
  const hasIconSizes = Object.keys(iconSizeEntries).length > 0;

  const hoverBg = variantStyles.default?.includes('surface-2') ? 'bg-surface-2' : 'bg-surface-2';
  const defaultSize = config.default?.size || 'md';

  return `'use client';

import { forwardRef } from 'react';
import * as ${prefix}Primitive from '${pkg}';
import { cva, type VariantProps } from 'class-variance-authority';
import { Square, CheckSquare, ChevronRight, Circle } from 'lucide-react';
import { cn } from './cn';

const ${camelCase(prefix)}ContentVariants = cva(
  'z-[var(--z-popover)] flex flex-col overflow-hidden ${variantStyles.default || 'bg-surface-1 text-on-surface shadow-[var(--shadow-2)]'} animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
${Object.entries(contentSizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { size: '${defaultSize}' },
  }
);

const itemSizeMap: Record<string, string> = {
${Object.entries(itemSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const insetItemSizeMap: Record<string, string> = {
${Object.entries(insetItemSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};
${hasIconSizes ? `
const iconSizeMap: Record<string, string> = {
${Object.entries(iconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};
` : ''}
type SizeProps = { size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')} };

const ${prefix} = ${prefix}Primitive.Root;
const ${prefix}Trigger = ${prefix}Primitive.Trigger;
const ${prefix}Group = ${prefix}Primitive.Group;
const ${prefix}Sub = ${prefix}Primitive.Sub;
const ${prefix}RadioGroup = ${prefix}Primitive.RadioGroup;
const ${prefix}Portal = ${prefix}Primitive.Portal;

${isDropdown ? `const ${prefix}Content = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.Content> & VariantProps<typeof ${camelCase(prefix)}ContentVariants>
>(({ size, sideOffset = 4, className, ...props }, ref) => (
  <${prefix}Primitive.Portal>
    <${prefix}Primitive.Content ref={ref} sideOffset={sideOffset} className={cn(${camelCase(prefix)}ContentVariants({ size }), className)} {...props} />
  </${prefix}Primitive.Portal>
));` : `const ${prefix}Content = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.Content> & VariantProps<typeof ${camelCase(prefix)}ContentVariants>
>(({ size, className, ...props }, ref) => (
  <${prefix}Primitive.Portal>
    <${prefix}Primitive.Content ref={ref} className={cn(${camelCase(prefix)}ContentVariants({ size }), className)} {...props} />
  </${prefix}Primitive.Portal>
));`}
${prefix}Content.displayName = '${prefix}Content';

const ${prefix}Item = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.Item> & SizeProps & { inset?: boolean }
>(({ size = '${defaultSize}', inset, className, ...props }, ref) => (
  <${prefix}Primitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 select-none interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[highlighted]:${hoverBg} data-[disabled]:opacity-(--opacity-disabled) data-[disabled]:cursor-not-allowed',
      itemSizeMap[size],
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
${prefix}Item.displayName = '${prefix}Item';

const ${prefix}CheckboxItem = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.CheckboxItem> & SizeProps
>(({ size = '${defaultSize}', className, children, checked, ...props }, ref) => (
  <${prefix}Primitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 select-none interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[highlighted]:${hoverBg} data-[disabled]:opacity-(--opacity-disabled) data-[disabled]:cursor-not-allowed',
      insetItemSizeMap[size],
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center text-on-surface-variant">
      {checked ? <CheckSquare className={${hasIconSizes ? `iconSizeMap[size] || 'size-icon-2'` : `'size-icon-2'`}} /> : <Square className={${hasIconSizes ? `iconSizeMap[size] || 'size-icon-2'` : `'size-icon-2'`}} />}
    </span>
    {children}
  </${prefix}Primitive.CheckboxItem>
));
${prefix}CheckboxItem.displayName = '${prefix}CheckboxItem';

const ${prefix}RadioItem = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.RadioItem> & SizeProps
>(({ size = '${defaultSize}', className, children, ...props }, ref) => (
  <${prefix}Primitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 select-none interactive cursor-pointer',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'data-[highlighted]:${hoverBg} data-[disabled]:opacity-(--opacity-disabled) data-[disabled]:cursor-not-allowed',
      insetItemSizeMap[size],
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <${prefix}Primitive.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </${prefix}Primitive.ItemIndicator>
    </span>
    {children}
  </${prefix}Primitive.RadioItem>
));
${prefix}RadioItem.displayName = '${prefix}RadioItem';

const ${prefix}Label = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.Label>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <${prefix}Primitive.Label ref={ref} className={cn('px-2 py-1.5 text-body-sm text-on-surface-variant', inset && 'pl-8', className)} {...props} />
));
${prefix}Label.displayName = '${prefix}Label';

const ${prefix}Separator = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.Separator>
>(({ className, ...props }, ref) => (
  <${prefix}Primitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-outline-subtle', className)} {...props} />
));
${prefix}Separator.displayName = '${prefix}Separator';

const ${prefix}Shortcut = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('ml-auto text-body-sm tracking-widest text-on-surface-variant', className)} {...props} />
  )
);
${prefix}Shortcut.displayName = '${prefix}Shortcut';

const ${prefix}SubTrigger = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.SubTrigger> & SizeProps & { inset?: boolean }
>(({ size = '${defaultSize}', inset, className, children, ...props }, ref) => (
  <${prefix}Primitive.SubTrigger
    ref={ref}
    className={cn(
      'flex items-center gap-2 select-none interactive cursor-pointer',
      'data-[highlighted]:${hoverBg}',
      itemSizeMap[size],
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-icon-1" />
  </${prefix}Primitive.SubTrigger>
));
${prefix}SubTrigger.displayName = '${prefix}SubTrigger';

const ${prefix}SubContent = forwardRef<
  React.ComponentRef<typeof ${prefix}Primitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ${prefix}Primitive.SubContent> & VariantProps<typeof ${camelCase(prefix)}ContentVariants>
>(({ size, className, ...props }, ref) => (
  <${prefix}Primitive.SubContent ref={ref} className={cn(${camelCase(prefix)}ContentVariants({ size }), className)} {...props} />
));
${prefix}SubContent.displayName = '${prefix}SubContent';

export {
  ${prefix}, ${prefix}Trigger, ${prefix}Content, ${prefix}Item,
  ${prefix}CheckboxItem, ${prefix}RadioItem, ${prefix}Label,
  ${prefix}Separator, ${prefix}Shortcut, ${prefix}Group,
  ${prefix}Sub, ${prefix}SubTrigger, ${prefix}SubContent,
  ${prefix}Portal, ${prefix}RadioGroup,
  ${camelCase(prefix)}ContentVariants,
};
`;
}

/** Convert PascalCase to camelCase */
function camelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function generateRadixDropdownMenu(name, config, meta) {
  return generateRadixMenu(name, config, meta);
}

function generateRadixContextMenu(name, config, meta) {
  return generateRadixMenu(name, config, meta);
}

module.exports = { generateRadixDropdownMenu, generateRadixContextMenu };
