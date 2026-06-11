const { colorToClass } = require('../shared');
const { filterSizes } = require('./helpers');

function generateDot(name, config, meta) {
  // Single-axis primitive: state → base-color fill. Always a circle.
  const stateCfg = config.state || {};
  const stateNames = Object.keys(stateCfg).filter((k) => !k.startsWith('$'));
  const stateClasses = {};
  for (const s of stateNames) {
    stateClasses[s] = colorToClass(stateCfg[s].bg, 'bg') || '';
  }

  const sizes = filterSizes(config.sizes || {});
  const sizeClasses = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('icon/')) {
      sizeClasses[tier] = `size-${sz.size.replace('icon/', '')}`;
    }
  }

  const dflt = config.default || {};

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const dotVariants = cva(
  'inline-block shrink-0 rounded-pill',
  {
    variants: {
      state: {
${stateNames.map((s) => `        ${s}: '${stateClasses[s]}',`).join('\n')}
      },
      size: {
${Object.entries(sizeClasses).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { state: '${dflt.state || 'default'}', size: '${dflt.size || 'md'}' },
  }
);

type DotProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof dotVariants>;

/** Status/severity indicator dot. Compose into badges, alerts, list items, headings, nav. */
const Dot = forwardRef<HTMLSpanElement, DotProps>(
  ({ state, size, className, ...props }, ref) => (
    <span ref={ref} className={cn(dotVariants({ state, size }), className)} {...props} />
  )
);
Dot.displayName = 'Dot';

export { Dot, dotVariants };
`;
}

module.exports = { generateDot };
