const { spacingToClass, radiusToClass, buildTypographyClasses, buildColorVars, TREATMENT_CLASSES } = require('../shared');
const { filterSizes } = require('./helpers');

function generateBadge(name, config, meta) {
  // Orthogonal axes (independent, no compound matrix — shared with Button via buildColorVars):
  // variant = treatment (filled/outline/dot) consuming per-state CSS vars; state sets those vars.
  const treatments = config.treatments || ['filled', 'outline'];
  const { colorNames: stateNames, varClass } = buildColorVars(config.colors || {});

  // Text-bearing sizes
  const sizes = filterSizes(config.sizes || {});
  const sizeClasses = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    const classes = [];
    const px = spacingToClass(sz['x-padding'], 'px');
    if (px) classes.push(px);
    // y-padding may be a raw value (e.g. "2px" — see badge sm $exception note)
    const yp = sz['y-padding'];
    if (yp) {
      if (typeof yp === 'string' && yp.match(/^\d/)) classes.push(`py-[${yp}]`);
      else {
        const py = spacingToClass(yp, 'py');
        if (py) classes.push(py);
      }
    }
    const gap = spacingToClass(sz.gap, 'gap');
    if (gap) classes.push(gap);
    if (sz['font-size']) classes.push(`text-[${sz['font-size']}]`);
    if (sz['line-height']) classes.push(`leading-[${sz['line-height']}]`);
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

  // Segment padding per size — used by the interactive+onRemove split layout, where
  // padding moves off the container onto the two button segments.
  const segmentPad = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    const cls = [];
    const px = spacingToClass(sz['x-padding'], 'px');
    if (px) cls.push(px);
    const yp = sz['y-padding'];
    if (yp) {
      if (typeof yp === 'string' && yp.match(/^\d/)) cls.push(`py-[${yp}]`);
      else { const py = spacingToClass(yp, 'py'); if (py) cls.push(py); }
    }
    segmentPad[tier] = cls.join(' ');
  }

  const typo = buildTypographyClasses(config);
  const dflt = config.default || {};

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center ${typo}',
  {
    variants: {
      variant: {
${treatments.map(v => `        '${v}': '${TREATMENT_CLASSES[v]}',`).join('\n')}
      },
      state: {
${stateNames.map(s => `        ${s}: '${varClass[s]}',`).join('\n')}
      },
      size: {
${Object.entries(sizeClasses).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${dflt.variant || 'filled'}',
      state: '${dflt.state || 'default'}',
      size: '${dflt.size || 'md'}',
    },
  }
);

const badgeIconSize: Record<string, string> = {
${Object.entries(iconClasses).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const badgeSegmentPad: Record<string, string> = {
${Object.entries(segmentPad).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = ${treatments.map(v => `'${v}'`).join(' | ')};
type BadgeState = ${stateNames.map(s => `'${s}'`).join(' | ')};

type BadgeProps = Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>
  & {
    variant?: BadgeVariant;
    state?: BadgeState;
    size?: BadgeSize;
    asChild?: boolean;
    interactive?: boolean;
    onClick?: React.MouseEventHandler<HTMLElement>;
    onRemove?: () => void;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
  };

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={cn(className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const INTERACTIVE_CLASSES = 'interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
const CLOSE_BUTTON_CLASSES = 'shrink-0 ml-1 opacity-70 hover:opacity-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

const Badge = forwardRef<HTMLElement, BadgeProps>(
  ({ variant = 'filled', state = 'default', size = 'md', asChild = false, interactive = false, onClick, onRemove, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    const iconCls = badgeIconSize[size];
    const computedClasses = badgeVariants({ variant, state, size });

    const content = (
      <>
        {leadingIcon && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{leadingIcon}</span>}
        {children}
        {trailingIcon && !onRemove && <span className={cn('shrink-0 [&>svg]:size-full', iconCls)}>{trailingIcon}</span>}
      </>
    );

    const closeButton = onRemove ? (
      <button
        type="button"
        className={CLOSE_BUTTON_CLASSES}
        onClick={onRemove}
        aria-label="Remove"
      >
        <CloseIcon className={iconCls} />
      </button>
    ) : null;

    // asChild — Slot merges into the consumer-provided element. Behavior modes (interactive/onRemove) layer on top.
    if (asChild) {
      return (
        <Slot
          ref={ref as any}
          className={cn(computedClasses, interactive && INTERACTIVE_CLASSES, className)}
          {...(props as any)}
        >
          <>
            {content}
            {closeButton}
          </>
        </Slot>
      );
    }

    // interactive + onRemove — container carries the fill/radius; two transparent
    // segments split it, each padded like a button and rounded only on its outer edge,
    // for a uniform button-like split hover. Padding moves off the container (!p-0 !gap-0).
    if (interactive && onRemove) {
      const segPad = badgeSegmentPad[size];
      const segmentBase = 'inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
      return (
        <span ref={ref as any} className={cn(computedClasses, '!p-0 !gap-0 inline-flex items-stretch', className)} {...(props as any)}>
          <button
            type="button"
            className={cn(segmentBase, 'rounded-l-[inherit]', segPad)}
            onClick={onClick as any}
          >
            {content}
          </button>
          <button
            type="button"
            className={cn(segmentBase, 'rounded-r-[inherit] border-l border-current/15', segPad)}
            onClick={onRemove}
            aria-label="Remove"
          >
            <CloseIcon className={iconCls} />
          </button>
        </span>
      );
    }

    // interactive only — button
    if (interactive) {
      return (
        <button
          ref={ref as any}
          type="button"
          className={cn(computedClasses, INTERACTIVE_CLASSES, className)}
          onClick={onClick as any}
          {...(props as any)}
        >
          {content}
        </button>
      );
    }

    // span (plain or onRemove only)
    return (
      <span ref={ref as any} className={cn(computedClasses, className)} {...(props as any)}>
        {content}
        {closeButton}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants, badgeIconSize };
`;
}

module.exports = { generateBadge };
