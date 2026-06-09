const { buildVariantStyles, ICON_SLOT_CLASS } = require('../shared');
const { buildSizeStylesWithText, extractIconSizes, filterSizes } = require('./helpers');

// Banner — inline status/severity strip. Consolidates the old alert.
// Severity-only variant axis (info default) × size. Optional leading icon, a
// consumer-provided action node, and a STATELESS dismiss: pass `onDismiss` and a
// close button renders that fires it — the consumer owns visibility, so the atom
// stays presentational and RSC-safe. No internal state, no `dismissible` flag
// (its presence WAS the only way to get a dead close button — keying off onDismiss
// removes that footgun). The close affordance composes the iconOnly Button at
// color="inherit" so it takes the banner's foreground and gets the shared
// focus/hover treatment for free, instead of a hand-rolled button + raw svg.
function generateBanner(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);
  const iconSizes = extractIconSizes(sizes) || {};
  const dflt = config.default || {};
  const defaultSize = dflt.size || 'md';
  const role = meta.role || 'status';

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';
import { Button } from './button';
import { X } from 'lucide-react';

const bannerVariants = cva(
  'flex items-center',
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
      variant: '${dflt.variant || 'info'}',
      size: '${defaultSize}',
    },
  }
);

const bannerIconSize: Record<string, string> = {
${Object.entries(iconSizes).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type BannerProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof bannerVariants>
  & {
    leadingIcon?: React.ReactNode;
    action?: React.ReactNode;
    onDismiss?: () => void;
  };

const Banner = forwardRef<HTMLDivElement, BannerProps>(
  ({ variant, size, leadingIcon, action, onDismiss, className, children, ...props }, ref) => {
    return (
      <div ref={ref} role="${role}" className={cn(bannerVariants({ variant, size }), className)} {...props}>
        {leadingIcon && <span className={cn('${ICON_SLOT_CLASS}', bannerIconSize[size || '${defaultSize}'])}>{leadingIcon}</span>}
        <div className="flex-1 min-w-0">{children}</div>
        {action && <div className="shrink-0">{action}</div>}
        {onDismiss && (
          <Button
            iconOnly
            variant="ghost"
            color="inherit"
            size={size ?? '${defaultSize}'}
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-mr-1 shrink-0"
          >
            <X />
          </Button>
        )}
      </div>
    );
  }
);
Banner.displayName = 'Banner';

export { Banner, bannerVariants };
`;
}

module.exports = { generateBanner };
