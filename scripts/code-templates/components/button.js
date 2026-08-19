const { buildSizeStyles, buildTypographyClasses, buildColorVars, TREATMENT_CLASSES, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes, extractIconSizes, buildSizeStylesWithText } = require('./helpers');

function generateButton(name, config, meta) {
  // Orthogonal model: variant (treatment) and color are independent axes.
  // Treatments consume the tone properties (--tone-bg/fg/text/border) set by the tone class.
  const treatments = config.treatments || ['filled', 'outline', 'ghost'];
  const { colorNames: colorKeys, toneClass } = buildColorVars(config.colors || {});
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);
  const iconSizesConfig = filterSizes(config['icon-sizes'] || {});
  const iconSizeStyles = buildSizeStyles(iconSizesConfig);
  const iconSizes = extractIconSizes(sizes);
  const iconOnlyIconSizes = extractIconSizes(iconSizesConfig);
  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

  // Merge regular sizes and icon-only sizes into one CVA dimension
  // icon-sm, icon-md, icon-lg are the square icon-only sizes
  const allSizeEntries = { ...sizeStyles };
  for (const [k, v] of Object.entries(iconSizeStyles)) {
    allSizeEntries[`icon-${k}`] = v;
  }

  const allIconSizes = { ...iconSizes, ...iconOnlyIconSizes };

  // Independent axes: `variant` carries a treatment class, `color` carries a tone class.
  // Both are plain classes from loom.css — the tone sets --tone-*, the treatment reads it.
  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva('button interactive control', {
  variants: {
    variant: {
${treatments.map((k) => `      ${k}: '${TREATMENT_CLASSES[k]}',`).join('\n')}
    },
    color: {
${colorKeys.map((k) => `      ${k}: '${toneClass[k]}',`).join('\n')}
    },
  },
  defaultVariants: {
    variant: '${dflt.variant || 'filled'}',
    color: '${dflt.color || 'primary'}',
  },
});

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants>
  & {
    size?: ButtonSize;
    asChild?: boolean;
    iconOnly?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    loading?: boolean;
  };

const LoadingSpinner = () => (
  <svg className="size-full animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, color, size = 'md', asChild = false, iconOnly = false, leadingIcon, trailingIcon, loading = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const resolvedSize = iconOnly ? \`icon-\${size}\` : size;
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, color }), className)}
        data-size={resolvedSize}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {iconOnly ? (
          <span className={'${ICON_SLOT_CLASS}'}>
            {loading ? <LoadingSpinner /> : children}
          </span>
        ) : (
          // An array, not a fragment. Slot finds Slottable with React.Children.toArray,
          // which flattens arrays but not fragments — wrapped in one, Slot saw a single
          // unrecognised child, cloned the fragment itself and put className on it. React
          // warns and drops it, so asChild rendered the consumer's element with none of
          // the button's classes: no display, no size, and a raw svg at intrinsic size.
          [
            effectiveLeadingIcon && <span key="lead" className={'${ICON_SLOT_CLASS}'}>{effectiveLeadingIcon}</span>,
            <Slottable key="label">{children}</Slottable>,
            trailingIcon && <span key="trail" className={'${ICON_SLOT_CLASS}'}>{trailingIcon}</span>,
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
