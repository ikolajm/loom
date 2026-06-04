const { buildVariantStyles } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

function generateListItem(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  // No text family — structural shell, content fills the slots
  const sizeStyles = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    if (sz.height && sz.height.startsWith('height/')) classes.push(`h-${sz.height.replace('height/', '')}`);
    const pxMatch = sz['x-padding']?.match(/\{scale\.(\d+)\}/);
    if (pxMatch) classes.push(`px-${pxMatch[1]}`);
    const gapMatch = sz.gap?.match(/\{scale\.(\d+)\}/);
    if (gapMatch) classes.push(`gap-${gapMatch[1]}`);
    sizeStyles[tier] = classes.join(' ');
  }

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const listItemVariants = cva(
  'flex items-center interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
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
      variant: '${config.default?.variant || 'default'}',
      size: '${config.default?.size || 'md'}',
    },
  }
);

type ListItemProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof listItemVariants>
  & {
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
  };

const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ variant, size, leading, trailing, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(listItemVariants({ variant, size }), className)} {...props}>
        {leading && <span className="shrink-0">{leading}</span>}
        <span className="flex-1 min-w-0">{children}</span>
        {trailing && <span className="shrink-0">{trailing}</span>}
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

export { ListItem, listItemVariants };
`;
}

module.exports = { generateListItem };
