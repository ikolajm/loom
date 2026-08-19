const { buildVariantStyles, heightToClass, spacingToClass, radiusToClass } = require('../shared');
const { filterSizes, textRoleClass } = require('./helpers');

// Sidebar — vertical app-navigation panel. Two variants on one axis:
//   default — full width with labels
//   rail    — narrow icon-only column; labels collapse, items center
//
// Rail width differs per size (56/64/72), so a single `rail` variant class can't
// carry it. Instead each size tier sets BOTH widths as CSS vars (--sb-w / --sb-rail-w)
// and the variant picks which var to consume — keeping rail one flat variant rather
// than a compound (variant × size) matrix the CVA generator doesn't emit.
//
// SidebarItem labels collapse in rail via the parent's `is-rail` group marker (pure
// CSS, no context, no 'use client') — set rail once on <Sidebar>, every item responds.
function generateSidebar(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const colors = buildVariantStyles(config.variants); // default + rail share the surface
  const dfltVariant = config.default?.variant || 'default';
  const dfltSize = config.default?.size || 'md';

  const variantStyles = {
    default: `${colors.default} w-[var(--sidebar-w)]`,
    rail: `${colors.rail} is-rail w-[var(--sidebar-rail-w)]`,
  };

  const sizeStyles = {};
  const itemSize = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    // Root: both widths as vars + horizontal padding
    const root = [];
    if (sz.width) root.push(`[--sidebar-w:${sz.width}]`);
    if (sz['width-rail']) root.push(`[--sidebar-rail-w:${sz['width-rail']}]`);
    const rootPx = spacingToClass(sz['x-padding'], 'px');
    if (rootPx) root.push(rootPx);
    sizeStyles[tier] = root.join(' ');

    // Item: height + padding + gap + type
    const item = [];
    const h = heightToClass(sz['item-height']);
    if (h) item.push(`h-${h}`);
    const itemPx = spacingToClass(sz['item-x-padding'], 'px');
    if (itemPx) item.push(itemPx);
    const itemGap = spacingToClass(sz['item-gap'], 'gap');
    if (itemGap) item.push(itemGap);
    const itemRole = textRoleClass(sz.text);
    if (itemRole) item.push(itemRole);
    itemSize[tier] = item.join(' ');
  }

  const itemRadius = radiusToClass(sizes[dfltSize]?.['item-radius']) || 'component';

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const sidebarVariants = cva(
  'group flex flex-col',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${dfltVariant}',
      size: '${dfltSize}',
    },
  }
);

type SidebarProps = React.HTMLAttributes<HTMLElement>
  & VariantProps<typeof sidebarVariants>
;

const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn(sidebarVariants({ variant, size }), className)} {...props}>
        {children}
      </nav>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export { Sidebar, sidebarVariants };

const sidebarItemSize: Record<string, string> = {
${Object.entries(itemSize).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

// Label hides + item centers when an ancestor <Sidebar variant="rail"> carries .is-rail.
const SidebarItem = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { active?: boolean; icon?: React.ReactNode; size?: 'sm' | 'md' | 'lg'; }>(
  ({ active = false, icon, size = '${dfltSize}', className, children, ...props }, ref) => (
    <button ref={ref} type="button" className={cn(
      'flex items-center w-full rounded-${itemRadius} font-medium cursor-pointer transition-colors control text-on-surface-variant hover:bg-surface-1 hover:text-on-surface group-[.is-rail]:justify-center group-[.is-rail]:px-0',
      sidebarItemSize[size],
      active && 'bg-primary-container text-on-primary-container',
      className
    )} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1 truncate text-left group-[.is-rail]:hidden">{children}</span>
    </button>
  )
);
SidebarItem.displayName = 'SidebarItem';

export { SidebarItem };
`;
}

module.exports = { generateSidebar };
