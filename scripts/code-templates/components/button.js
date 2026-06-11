const { buildSizeStyles, buildTypographyClasses, buildColorVars, TREATMENT_CLASSES, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes, extractIconSizes, buildSizeStylesWithText } = require('./helpers');

function generateButton(name, config, meta) {
  // Orthogonal model: variant (treatment) and color are independent axes.
  // Treatments consume per-color CSS vars (--v-bg/fg/text/border) set by the color axis.
  const treatments = config.treatments || ['filled', 'outline', 'ghost'];
  const { colorNames: colorKeys, varClass } = buildColorVars(config.colors || {});
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

  // Independent axes: `variant` carries the treatment consumer-classes; `color` sets the
  // CSS vars they read. CVA concatenates both — color sets --v-*, treatment consumes them.
  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from './cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center ${typo} interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
${treatments.map((k) => `        ${k}: '${TREATMENT_CLASSES[k]}',`).join('\n')}
      },
      color: {
${colorKeys.map((k) => `        ${k}: '${varClass[k]}',`).join('\n')}
      },
      size: {
${Object.entries(allSizeEntries).map(([k, v]) => `        '${k}': '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${dflt.variant || 'filled'}',
      color: '${dflt.color || 'primary'}',
      size: '${dflt.size || 'md'}',
    },
  }
);

/** Icon sizing per size tier — applied to icon wrapper spans */
const buttonIconSize: Record<string, string> = {
${Object.entries(allIconSizes).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & Omit<VariantProps<typeof buttonVariants>, 'size'>
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
    const iconCls = buttonIconSize[size];
    const isDisabled = disabled || loading;
    const effectiveLeadingIcon = loading ? <LoadingSpinner /> : leadingIcon;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, color, size: resolvedSize as any }), className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {iconOnly ? (
          <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>
            {loading ? <LoadingSpinner /> : children}
          </span>
        ) : (
          <>
            {effectiveLeadingIcon && <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>{effectiveLeadingIcon}</span>}
            <Slottable>{children}</Slottable>
            {trailingIcon && <span className={cn('${ICON_SLOT_CLASS}', iconCls)}>{trailingIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants, buttonIconSize };
`;
}

module.exports = { generateButton };
