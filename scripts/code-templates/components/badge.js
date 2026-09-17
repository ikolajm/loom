const { spacingToClass, radiusToClass, buildTypographyClasses, buildColorVars, TREATMENT_CLASSES, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes } = require('./helpers');

function generateBadge(name, config, meta) {
  // Orthogonal axes (independent, no compound matrix — shared with Button via buildColorVars):
  // variant = treatment (filled/outline) consuming per-state CSS vars; state sets those vars.
  const treatments = config.treatments || ['filled', 'outline'];
  const { colorNames: stateNames, toneClass } = buildColorVars(config.colors || {});

  // Text-bearing sizes
  const sizes = filterSizes(config.sizes || {});
  const sizeClasses = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    // Padding and gap are not emitted here. `.badge[data-size]` in the class layer
    // already carries both from the same schema tier, so these were a second copy that
    // resolved only through the bridge — and after it went out, the only copy that
    // rendered was the one in CSS.
    const classes = [];
    // Type comes from the family ramp, not from literals in this config. Two reasons:
    // the literals did not ramp (sm and md were both 10px/14px, so md differed from sm
    // only in padding), and the Figma builder has always bound badge text to the
    // label/{tier} text style — so Figma rendered md at 12px while code rendered 10px.
    // Reading the same ramp both sides closes that drift and makes badge track a
    // project's typeScale, which a hardcoded pixel value can never do.
    const standardTier = ['sm', 'md', 'lg'].includes(tier);
    if (meta.textFamily && standardTier) {
      classes.push(`text-${meta.textFamily}-${tier}`);
    } else {
      if (sz['font-size']) classes.push(`text-[${sz['font-size']}]`);
      if (sz['line-height']) classes.push(`leading-[${sz['line-height']}]`);
    }
    const rad = radiusToClass(sz.radius);
    if (rad) classes.push(`rounded-${rad}`);
    sizeClasses[tier] = classes.join(' ');
  }

  // Icon wrapper classes per text size
  const iconClasses = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    const iconToken = sz.icon || sz['icon-size'];
    if (iconToken && typeof iconToken === 'string' && iconToken.startsWith('icon/')) {
      iconClasses[tier] = `size-${iconToken.replace('icon/', '')}`;
    }
  }

  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

  return `import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const badgeVariants = cva('badge', {
  variants: {
    variant: {
${treatments.map(v => `      '${v}': '${TREATMENT_CLASSES[v]}',`).join('\n')}
    },
    state: {
${stateNames.map(s => `      ${s}: '${toneClass[s]}',`).join('\n')}
    },
  },
  defaultVariants: {
    variant: '${dflt.variant || 'filled'}',
    state: '${dflt.state || 'default'}',
  },
});

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = ${treatments.map(v => `'${v}'`).join(' | ')};
type BadgeState = ${stateNames.map(s => `'${s}'`).join(' | ')};

type BadgeProps = React.HTMLAttributes<HTMLElement>
  & {
    variant?: BadgeVariant;
    state?: BadgeState;
    size?: BadgeSize;
    asChild?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

/**
 * A badge is a label. It is never a target.
 *
 * If a thing can be clicked it is a Button — a removable filter reads as one control
 * ("remove this filter"), not as a label with a second control buried inside it, and
 * splitting it into two targets meant two tab stops and two names for one intent.
 * Compose a Button with a trailing icon instead.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'filled', state = 'default', size = 'md', asChild = false, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const computedClasses = badgeVariants({ variant, state });

    if (asChild) {
      return (
        <Slot ref={ref} className={cn(computedClasses, className)} data-size={size} {...props}>
          {/* Spelled out rather than reusing a shared fragment, and an array rather than a
              fragment. Slot locates the consumer's element through Slottable, and finds
              it with React.Children.toArray — which flattens arrays but not fragments.
              Wrapped in one, and with no Slottable to find at all, Slot cloned the
              fragment and put className on it: React warns and drops it, so asChild
              rendered the consumer's element carrying none of the badge's classes. */}
          {[
            leadingIcon && <span key="lead" className={'${ICON_SLOT_CLASS}'}>{leadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && <span key="trail" className={'${ICON_SLOT_CLASS}'}>{trailingIcon}</span>,
          ]}
        </Slot>
      );
    }

    return (
      <span ref={ref} className={cn(computedClasses, className)} data-size={size} {...props}>
        {leadingIcon && <span className={'${ICON_SLOT_CLASS}'}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={'${ICON_SLOT_CLASS}'}>{trailingIcon}</span>}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
`;
}

module.exports = { generateBadge };
