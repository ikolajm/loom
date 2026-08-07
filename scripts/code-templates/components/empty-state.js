const { buildVariantStyles, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes, textRoleClass } = require('./helpers');

function generateEmptyState(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);

  // Build gap-only CVA sizes
  const gapEntries = {};
  const iconSizeEntries = {};
  const headingSizeEntries = {};
  const descSizeEntries = {};

  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    // Gap from config
    const gapMatch = sz.gap?.match(/\{scale\.(\d+)\}/);
    gapEntries[tier] = gapMatch ? `gap-${gapMatch[1]}` : 'gap-4';

    // Icon size
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconSizeEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }

    // Heading font size
    const hfs = [];
    const headRole = textRoleClass(sz['heading-text']);
    if (headRole) hfs.push(headRole);
    headingSizeEntries[tier] = hfs.join(' ');

    // Description font size
    const dfs = [];
    const descRole = textRoleClass(sz['description-text']);
    if (descRole) dfs.push(descRole);
    descSizeEntries[tier] = dfs.join(' ');
  }

  // Extract heading typography
  const ht = config['heading-typography'] || {};
  const headingWeight = ht['font-weight'] === 600 ? 'font-semibold' : ht['font-weight'] === 700 ? 'font-bold' : 'font-medium';
  const headingTracking = ht['letter-spacing'] && ht['letter-spacing'] !== '0' ? `tracking-[${ht['letter-spacing']}]` : '';

  // Extract variant colors for slots
  const defaultVariant = config.variants?.default || {};
  const iconFg = defaultVariant['icon-fg'] ? `text-on-surface-variant` : '';
  const headingFg = defaultVariant['heading-fg'] ? `text-on-surface` : '';
  const descFg = defaultVariant['description-fg'] ? `text-on-surface-variant` : '';

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const emptyStateVariants = cva(
  'flex flex-col items-center text-center',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v || ""}',`).join('\n')}
      },
      size: {
${Object.entries(gapEntries).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${config.default?.variant || 'default'}',
      size: '${config.default?.size || 'md'}',
    },
  }
);

const iconSize: Record<string, string> = {
${Object.entries(iconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const headingSize: Record<string, string> = {
${Object.entries(headingSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const descriptionSize: Record<string, string> = {
${Object.entries(descSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof emptyStateVariants>
  & {
    icon?: React.ReactNode;
    heading?: string;
    description?: string;
    action?: React.ReactNode;
  };

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ variant, size, icon, heading, description, action, className, children, ...props }, ref) => {
    const s = size || 'md';
    return (
      <div ref={ref} className={cn(emptyStateVariants({ variant, size }), className)} {...props}>
        {icon && <span className={cn('${iconFg} ${ICON_SLOT_CLASS}', iconSize[s])}>{icon}</span>}
        {heading && <h3 className={cn('${headingWeight} ${headingTracking} ${headingFg}', headingSize[s])}>{heading}</h3>}
        {description && <p className={cn('${descFg}', descriptionSize[s])}>{description}</p>}
        {action}
        {children}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateVariants };
`;
}

module.exports = { generateEmptyState };
