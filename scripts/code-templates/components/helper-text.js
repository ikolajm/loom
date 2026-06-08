const { buildVariantStyles, buildTypographyClasses } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

// HelperText is the catalog's inline field-error surface (absorbed from the dropped `alert`).
// Bespoke (not cva-only) so it can default `state` from FormFieldContext.error — wrapping a
// field in <FormField error> turns its helper text red without threading state to each control.
// An explicit `state` prop always overrides the cascade.
function generateHelperText(name, config, meta) {
  const stateStyles = config.state ? buildVariantStyles(config.state) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);
  const typo = buildTypographyClasses(config);
  const base = ['flex items-center', typo].filter(Boolean).join(' ');
  const defaultState = config.default?.state || 'default';
  const defaultSize = config.default?.size || 'md';

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';
import { useFieldError } from './form-field';

const helperTextVariants = cva(
  '${base}',
  {
    variants: {
      state: {
${Object.entries(stateStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      state: '${defaultState}',
      size: '${defaultSize}',
    },
  }
);

type HelperTextProps = React.HTMLAttributes<HTMLParagraphElement>
  & VariantProps<typeof helperTextVariants>
;

const HelperText = forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ state, size, className, children, ...props }, ref) => {
    // Cascade off FormFieldContext.error unless an explicit state is given.
    const resolvedState = state ?? (useFieldError() ? 'error' : undefined);
    return (
      <p ref={ref} className={cn(helperTextVariants({ state: resolvedState, size }), className)} {...props}>
        {children}
      </p>
    );
  }
);
HelperText.displayName = 'HelperText';

export { HelperText, helperTextVariants };
`;
}

module.exports = { generateHelperText };
