const { filterSizes } = require('./helpers');

function generateCommandPalette(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';

  // Build size maps from config
  const containerEntries = {};
  const inputEntries = {};
  const itemEntries = {};
  const groupLabelEntries = {};
  const iconEntries = {};

  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;

    // Container
    const cClasses = [];
    if (sz['max-width']) cClasses.push(`max-w-[${sz['max-width']}]`);
    if (sz.radius === 'radius/modal') cClasses.push('rounded-modal');
    else if (sz.radius === 'radius/card') cClasses.push('rounded-card');
    containerEntries[tier] = cClasses.join(' ');

    // Input
    const iClasses = [];
    if (sz['input-height']) iClasses.push(`h-${sz['input-height'].replace('height/', '')}`);
    const ipx = sz['input-x-padding']?.match(/\{scale\.(\d+)\}/);
    if (ipx) iClasses.push(`px-${ipx[1]}`);
    if (sz['input-font-size']) iClasses.push(`text-[${sz['input-font-size']}]`);
    if (sz['input-line-height']) iClasses.push(`leading-[${sz['input-line-height']}]`);
    inputEntries[tier] = iClasses.join(' ');

    // Item
    const tClasses = [];
    if (sz['item-height']) tClasses.push(`h-${sz['item-height'].replace('height/', '')}`);
    const tpx = sz['item-x-padding']?.match(/\{scale\.(\d+)\}/);
    if (tpx) tClasses.push(`px-${tpx[1]}`);
    const tgap = sz['item-gap']?.match(/\{scale\.(\d+)\}/);
    if (tgap) tClasses.push(`gap-${tgap[1]}`);
    if (sz['item-font-size']) tClasses.push(`text-[${sz['item-font-size']}]`);
    if (sz['item-line-height']) tClasses.push(`leading-[${sz['item-line-height']}]`);
    itemEntries[tier] = tClasses.join(' ');

    // Group label — prefix the cmdk-group-heading selector at GENERATION time so the
    // class strings are statically scannable by Tailwind. (Interpolating the prefix at
    // runtime produces classes the scanner never sees → the sizing silently no-ops.)
    const gClasses = [];
    if (sz['group-font-size']) gClasses.push(`[&_[cmdk-group-heading]]:text-[${sz['group-font-size']}]`);
    if (sz['group-line-height']) gClasses.push(`[&_[cmdk-group-heading]]:leading-[${sz['group-line-height']}]`);
    groupLabelEntries[tier] = gClasses.join(' ');

    // Icon
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
  }

  return `'use client';

import { forwardRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from './cn';

const containerSizeMap: Record<string, string> = {
${Object.entries(containerEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const inputSizeMap: Record<string, string> = {
${Object.entries(inputEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const itemSizeMap: Record<string, string> = {
${Object.entries(itemEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const groupLabelSizeMap: Record<string, string> = {
${Object.entries(groupLabelEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const iconSizeMap: Record<string, string> = {
${Object.entries(iconEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type SizeProps = { size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')} };

const CommandPalette = forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive> & SizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex w-full flex-col overflow-hidden bg-surface-1 text-on-surface border border-outline-subtle shadow-[var(--shadow-3)]',
      containerSizeMap[size],
      className,
    )}
    {...props}
  />
));
CommandPalette.displayName = 'CommandPalette';

const CommandPaletteInput = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>, 'size'> & SizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <div className="flex items-center border-b border-outline-subtle" cmdk-input-wrapper="">
    <Search className={cn('shrink-0 ml-3 text-on-surface-variant', iconSizeMap[size])} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex w-full bg-transparent outline-none placeholder:text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-50',
        inputSizeMap[size],
        className,
      )}
      {...props}
    />
  </div>
));
CommandPaletteInput.displayName = 'CommandPaletteInput';

const CommandPaletteList = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)} {...props} />
));
CommandPaletteList.displayName = 'CommandPaletteList';

const CommandPaletteEmpty = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty ref={ref} className={cn('py-6 text-center text-body-sm text-on-surface-variant', className)} {...props} />
));
CommandPaletteEmpty.displayName = 'CommandPaletteEmpty';

const CommandPaletteGroup = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & SizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-on-surface-variant [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.02em]',
      groupLabelSizeMap[size],
      className,
    )}
    {...props}
  />
));
CommandPaletteGroup.displayName = 'CommandPaletteGroup';

const CommandPaletteItem = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & SizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center select-none interactive cursor-pointer',
      'data-[selected=true]:bg-surface-2',
      'data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed',
      itemSizeMap[size],
      className,
    )}
    {...props}
  />
));
CommandPaletteItem.displayName = 'CommandPaletteItem';

const CommandPaletteSeparator = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-outline-subtle', className)} {...props} />
));
CommandPaletteSeparator.displayName = 'CommandPaletteSeparator';

const CommandPaletteShortcut = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('ml-auto text-body-sm tracking-widest text-on-surface-variant', className)} {...props} />
  )
);
CommandPaletteShortcut.displayName = 'CommandPaletteShortcut';

export {
  CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteEmpty,
  CommandPaletteGroup, CommandPaletteItem, CommandPaletteSeparator, CommandPaletteShortcut,
};
`;
}

module.exports = { generateCommandPalette };
