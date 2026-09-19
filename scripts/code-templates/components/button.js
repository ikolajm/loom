const { buildTypographyClasses, buildColorVars, buildToneLookup, cls, TREATMENT_CLASSES, ICON_SLOT_CLASS } = require('../shared');

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
  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

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

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = '${dflt.variant || 'filled'}', color = '${dflt.color || 'primary'}', intensity = '${dflt.intensity || 'solid'}', size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const tone = ${tones.expression('color', 'intensity')};
    const resolvedSize = iconOnly ? \`icon-\${size}\` : size;
    // The ring is the class: it draws from the size tier's border-width and takes its
    // colour from currentColor, so the button's own text colour carries it.
    const spinner = <span className="${cls('spinner', 'button')}" data-size={size} aria-hidden="true" />;
    const effectiveLeadingIcon = loading ? spinner : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant }), tone, className)}
        data-size={resolvedSize}
        disabled={disabled}
        // Loading is transient and the user's focus is on this button, so it must not go
        // native-disabled: the disabled attribute drops the element out of the
        // accessibility tree and sends focus to body, which loses a keyboard user their
        // place and leaves aria-busy announcing to nothing. aria-disabled keeps it
        // focusable and announced; the click guard below is what actually stops the second
        // submit. The disabled prop still maps to the real attribute — that state is
        // persistent and nobody is standing on it. The class layer already styles
        // [aria-disabled="true"] alongside :disabled, so both render the same.
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
        {...props}
        onClick={(event) => {
          if (loading) { event.preventDefault(); return; }
          props.onClick?.(event);
        }}
      >
        {iconOnly ? (
          <span className={'${cls(ICON_SLOT_CLASS, 'button')}'}>
            {loading ? spinner : children}
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
