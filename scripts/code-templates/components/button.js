const { buildSizeStyles, buildTypographyClasses, buildColorVars, buildToneLookup, cls, TREATMENT_CLASSES, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

function generateButton(name, config, meta) {
  // Three axes: variant = treatment, color = family, intensity = solid or soft.
  // Treatments consume the tone properties (--tone-bg/fg/text/border) set by the tone class.
  //
  // `color` and `intensity` cannot both be cva variants — see buildToneLookup. Button was
  // solid-only for the same reason badge was soft-only: the tone class came straight from
  // whichever role the schema's `bg` token named, so each atom could reach exactly one
  // intensity and neither could reach the other's.
  const treatments = config.treatments || ['filled', 'outline', 'ghost'];
  const intensities = config.intensities || ['solid', 'soft'];
  const { colorNames: colorKeys, toneClass, toneFamily } = buildColorVars(config.colors || {});
  const tones = buildToneLookup('button', colorKeys, toneFamily, toneClass);
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);
  const iconSizesConfig = filterSizes(config['icon-sizes'] || {});
  const iconSizeStyles = buildSizeStyles(iconSizesConfig);
  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

  // Merge regular sizes and icon-only sizes into one CVA dimension
  // icon-sm, icon-md, icon-lg are the square icon-only sizes
  const allSizeEntries = { ...sizeStyles };
  for (const [k, v] of Object.entries(iconSizeStyles)) {
    allSizeEntries[`icon-${k}`] = v;
  }

  // `variant` carries a treatment class and is the only cva axis; the tone is computed
  // from color and intensity together. Both are plain classes from loom.css — the tone
  // sets --tone-*, the treatment reads it.
  return `import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva('${cls('button interactive control', 'button')}', {
  variants: {
    variant: {
${treatments.map((k) => `      ${k}: '${cls(TREATMENT_CLASSES[k], 'button')}',`).join('\n')}
    },
  },
  defaultVariants: {
    variant: '${dflt.variant || 'filled'}',
  },
});

${tones.declaration}

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = ${treatments.map(v => `'${v}'`).join(' | ')};
type ButtonColor = ${colorKeys.map(c => `'${c}'`).join(' | ')};
type ButtonIntensity = ${intensities.map(i => `'${i}'`).join(' | ')};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & {
    variant?: ButtonVariant;
    color?: ButtonColor;
    intensity?: ButtonIntensity;
    size?: ButtonSize;
    asChild?: boolean;
    iconOnly?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    loading?: boolean;
  };

const LoadingSpinner = () => (
  <svg className="${cls('spinner', 'button')}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = '${dflt.variant || 'filled'}', color = '${dflt.color || 'primary'}', intensity = '${dflt.intensity || 'solid'}', size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const tone = ${tones.expression('color', 'intensity')};
    const resolvedSize = iconOnly ? \`icon-\${size}\` : size;
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant }), tone, className)}
        data-size={resolvedSize}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {iconOnly ? (
          <span className={'${cls(ICON_SLOT_CLASS, 'button')}'}>
            {loading ? <LoadingSpinner /> : children}
          </span>
        ) : (
          // An array, not a fragment. Slot finds Slottable with React.Children.toArray,
          // which flattens arrays but not fragments — wrapped in one, Slot saw a single
          // unrecognised child, cloned the fragment itself and put className on it. React
          // warns and drops it, so asChild rendered the consumer's element with none of
          // the button's classes: no display, no size, and a raw svg at intrinsic size.
          [
            effectiveLeadingIcon && <span key="lead" className={'${cls(ICON_SLOT_CLASS, 'button')}'}>{effectiveLeadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && <span key="trail" className={'${cls(ICON_SLOT_CLASS, 'button')}'}>{trailingIcon}</span>,
          ]
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
`;
}

module.exports = { generateButton };
