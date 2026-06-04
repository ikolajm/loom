const { buildVariantStyles } = require('../shared');
const { filterSizes } = require('./helpers');

function generateBadgeDot(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);

  // Build custom size classes: fixed dimensions + tiny font sizes + padding
  const sizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = ['rounded-pill'];
    // Fixed dimensions from scale — min-w for horizontal stretch with count, h for fixed height
    if (sz.size) {
      const m = sz.size.match(/\{scale\.(\d+)\}/);
      if (m) {
        classes.push(`min-w-${m[1]}`);
        classes.push(`h-${m[1]}`);
      }
    }
    // Custom font sizes (8-10px, below preset minimum)
    if (sz['font-size']) classes.push(`text-[${sz['font-size']}]`);
    if (sz['line-height']) classes.push(`leading-[${sz['line-height']}]`);
    // Horizontal padding for count text
    const scale = sz.size?.match(/\{scale\.(\d+)\}/)?.[1];
    if (scale) classes.push(`px-[${Math.max(2, parseInt(scale))}px]`);
    sizeEntries[tier] = classes.join(' ');
  }

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const badgeDotVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-pill',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(sizeEntries).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${config.default?.variant || 'default'}',
      size: '${config.default?.size || 'md'}',
    },
  }
);

type BadgeDotProps = React.HTMLAttributes<HTMLSpanElement>
  & VariantProps<typeof badgeDotVariants>
;

const BadgeDot = forwardRef<HTMLSpanElement, BadgeDotProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeDotVariants({ variant, size }), className)} {...props}>
        {children}
      </span>
    );
  }
);
BadgeDot.displayName = 'BadgeDot';

export { BadgeDot, badgeDotVariants };
`;
}

module.exports = { generateBadgeDot };
