const { buildVariantStyles } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

function generateListItem(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  // Type sits on the container, not on the content slot, so it is inherited rather
  // than imposed: a bare string scales with the row, and any child carrying its own
  // text-* class still wins. That keeps the three-slot shell contract while giving
  // the size ladder a visible effect on content.
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const listItemVariants = cva(
  'flex items-center interactive cursor-pointer control',
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
