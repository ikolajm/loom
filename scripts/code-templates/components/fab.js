const { buildVariantStyles, buildSizeStyles, buildTypographyClasses, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes, extractIconSizes, textRoleClass } = require('./helpers');

function generateFAB(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStyles(sizes);
  // Extended sizes inherit radius + shadow from base sizes
  const rawExtended = filterSizes(config.extended || {});
  const mergedExtended = {};
  for (const [tier, ext] of Object.entries(rawExtended)) {
    const base = sizes[tier] || {};
    mergedExtended[tier] = {
      ...ext,
      radius: ext.radius || base.radius,
      shadow: ext.shadow || base.shadow,
    };
  }
  // Extended sizes carry their own role rather than the atom's family: the label has to
  // scale with the icon, not with the family ceiling.
  const extendedSizeStyles = buildSizeStyles(mergedExtended);
  for (const [tier, sz] of Object.entries(mergedExtended)) {
    const role = textRoleClass(sz.text);
    if (role) extendedSizeStyles[tier] += ` ${role}`;
  }
  const iconSizes = extractIconSizes(sizes);
  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

  // Merge icon-only and extended sizes into one CVA dimension
  const allSizeEntries = {};
  for (const [k, v] of Object.entries(sizeStyles)) {
    allSizeEntries[k] = v;
  }
  for (const [k, v] of Object.entries(extendedSizeStyles)) {
    allSizeEntries[`ext-${k}`] = v;
  }

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const fabVariants = cva(
  'inline-flex items-center justify-center${typo ? ' ' + typo : ''} interactive control',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(allSizeEntries).map(([k, v]) => `        '${k}': '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${dflt.variant || 'default'}',
      size: '${dflt.size || 'md'}',
    },
  }
);

${iconSizes ? `const fabIconSize: Record<string, string> = {\n${Object.entries(iconSizes).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}\n};` : ''}

type FABSize = 'sm' | 'md' | 'lg';

type FABProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & Omit<VariantProps<typeof fabVariants>, 'size'>
  & {
    size?: FABSize;
    label?: string;
    icon?: React.ReactNode;
  };

const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ variant, size = 'md', label, icon, className, children, ...props }, ref) => {
    const extended = !!label;
    const resolvedSize = extended ? \`ext-\${size}\` : size;
    const iconCls = ${iconSizes ? `fabIconSize[size] || ''` : "''"};

    return (
      <button
        ref={ref}
        className={cn(fabVariants({ variant, size: resolvedSize as any }), className)}
        {...props}
      >
        {icon && <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>{icon}</span>}
        {!icon && children && <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>{children}</span>}
        {label && <span>{label}</span>}
      </button>
    );
  }
);
FAB.displayName = 'FAB';

export { FAB, fabVariants };
`;
}

module.exports = { generateFAB };
