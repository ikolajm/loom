const { buildTypographyClasses, buildColorVars, buildToneLookup, cls, TREATMENT_CLASSES, ICON_SLOT_CLASS } = require('../shared');

function generateBadge(name, config, meta) {
  // Three orthogonal axes: variant = treatment, color = family, intensity = solid or soft.
  //
  // color and intensity cannot both be cva variants. Each cva axis contributes its own
  // class independently, and what is needed here is ONE class built from two choices —
  // `tone-error` against `tone-error-soft`. A compound matrix would express that at six
  // colours times two intensities; a lookup on the family is the same thing without the
  // twelve entries, so cva keeps the treatment and the tone is computed.
  //
  // Before this, badge's schema declared its fills as containers (`bg:
  // color/primary/primary-container`), and buildColorVars derives the tone class from
  // that token — so the component could reach `tone-primary-soft` and nothing else, while
  // Button, declaring the base role, could reach only the solid one. A consumer wanting a
  // solid count badge had no prop for it. The schema now declares the base role the way
  // Button's does, and `intensity` picks the suffix.
  const treatments = config.treatments || ['filled', 'outline'];
  const intensities = config.intensities || ['solid', 'soft'];
  const { colorNames, toneFamily, toneClass } = buildColorVars(config.colors || {});
  // Shared with button, so the two cannot drift apart the way they did before.
  const tones = buildToneLookup('badge', colorNames, toneFamily, toneClass);

  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

  return `import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const badgeVariants = cva('${cls('badge', 'badge')}', {
  variants: {
    variant: {
${treatments.map(v => `      '${v}': '${cls(TREATMENT_CLASSES[v], 'badge')}',`).join('\n')}
    },
  },
  defaultVariants: {
    variant: '${dflt.variant || 'filled'}',
  },
});

${tones.declaration}

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = ${treatments.map(v => `'${v}'`).join(' | ')};
type BadgeColor = ${colorNames.map(c => `'${c}'`).join(' | ')};
type BadgeIntensity = ${intensities.map(i => `'${i}'`).join(' | ')};

type BadgeProps = React.HTMLAttributes<HTMLElement>
  & {
    variant?: BadgeVariant;
    color?: BadgeColor;
    intensity?: BadgeIntensity;
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
 *
 * \`color\` selects the family, \`intensity\` its strength. Solid is the default: it is what
 * a badge is in every system that ships one, and a count on a trigger exists to be
 * noticed. Soft is the low-emphasis status form. Outline ignores intensity entirely —
 * \`.tone-X\` and \`.tone-X-soft\` set the same \`--tone-text\` and \`--tone-border\`, and
 * outline reads only those two.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = '${dflt.variant || 'filled'}', color = '${dflt.color || 'primary'}', intensity = '${dflt.intensity || 'solid'}', size = '${dflt.size || 'md'}', asChild = false, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const tone = ${tones.expression('color', 'intensity')};
    const computedClasses = cn(badgeVariants({ variant }), tone);

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
            leadingIcon && <span key="lead" className={'${cls(ICON_SLOT_CLASS, 'badge')}'}>{leadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && <span key="trail" className={'${cls(ICON_SLOT_CLASS, 'badge')}'}>{trailingIcon}</span>,
          ]}
        </Slot>
      );
    }

    return (
      <span ref={ref} className={cn(computedClasses, className)} data-size={size} {...props}>
        {leadingIcon && <span className={'${cls(ICON_SLOT_CLASS, 'badge')}'}>{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className={'${cls(ICON_SLOT_CLASS, 'badge')}'}>{trailingIcon}</span>}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
`;
}

module.exports = { generateBadge };
