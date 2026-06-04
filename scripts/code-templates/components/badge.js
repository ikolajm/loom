const { colorToClass, spacingToClass, radiusToClass, buildTypographyClasses } = require('../shared');
const { filterSizes } = require('./helpers');

function generateBadge(name, config, meta) {
  // Variant × state matrix — build per-combo class strings
  const variantsCfg = config.variants || {};
  const variantNames = Object.keys(variantsCfg).filter(k => !k.startsWith('$'));
  const stateNames = ['default', 'neutral', 'destructive', 'success', 'warning', 'info'];

  // For each variant × state combo, build the class string.
  // outline-mono collapses state — a single compound variant without `state` matches any state.
  // dot variant only sets bg (no fg/border).
  const buildStateClasses = (stateCfg) => {
    const classes = [];
    const bg = colorToClass(stateCfg.bg, 'bg');
    const fg = stateCfg.fg ? colorToClass(stateCfg.fg, 'text') : null;
    const border = stateCfg.border ? colorToClass(stateCfg.border, 'border') : null;
    if (bg) classes.push(bg);
    if (fg) classes.push(fg);
    if (border) classes.push(border, 'border');
    return classes.join(' ');
  };

  const compoundMatrix = [];
  for (const variantName of variantNames) {
    const variantCfg = variantsCfg[variantName];
    const states = variantCfg.states || {};
    const stateKeys = Object.keys(states).filter(k => !k.startsWith('$'));
    const onlyDefault = stateKeys.length === 1 && stateKeys[0] === 'default';

    if (onlyDefault) {
      compoundMatrix.push({ variant: variantName, state: null, classes: buildStateClasses(states.default) });
      continue;
    }

    for (const stateName of stateNames) {
      const stateCfg = states[stateName];
      if (!stateCfg) continue;
      compoundMatrix.push({ variant: variantName, state: stateName, classes: buildStateClasses(stateCfg) });
    }
  }

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

  // Dot sizes (square circles)
  const dotSizes = filterSizes(config['dot-sizes'] || {});
  const dotSizeClasses = {};
  for (const [tier, sz] of Object.entries(dotSizes)) {
    const classes = [];
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('icon/')) {
      classes.push(`size-${sz.size.replace('icon/', '')}`);
    }
    classes.push('rounded-pill');
    dotSizeClasses[tier] = classes.join(' ');
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

  const compoundLines = compoundMatrix.map(({ variant, state, classes }) => {
    if (state === null) return `      { variant: '${variant}', class: '${classes}' },`;
    return `      { variant: '${variant}', state: '${state}', class: '${classes}' },`;
  });
  const dotSizeCompoundLines = Object.entries(dotSizeClasses).map(
    ([k, v]) => `      { variant: 'dot', size: '${k}', class: '${v} !p-0 !gap-0' },`
  );

  return `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center ${typo}',
  {
    variants: {
      variant: {
${variantNames.map(v => `        '${v}': '',`).join('\n')}
      },
      state: {
${stateNames.map(s => `        ${s}: '',`).join('\n')}
      },
      size: {
${Object.entries(sizeClasses).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    compoundVariants: [
${compoundLines.join('\n')}
${dotSizeCompoundLines.join('\n')}
    ],
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

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = ${variantNames.map(v => `'${v}'`).join(' | ')};
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

    // Dot variant — no content, just a colored circle
    if (variant === 'dot') {
      const Comp = interactive ? 'button' : 'span';
      return (
        <Comp
          ref={ref as any}
          className={cn(computedClasses, interactive && INTERACTIVE_CLASSES, className)}
          onClick={interactive ? (onClick as any) : undefined}
          {...(props as any)}
        />
      );
    }

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

    // interactive + onRemove — two sibling buttons inside a span (avoids nested buttons)
    if (interactive && onRemove) {
      return (
        <span ref={ref as any} className={cn(computedClasses, className)} {...(props as any)}>
          <button
            type="button"
            className={INTERACTIVE_CLASSES}
            onClick={onClick as any}
            style={{ background: 'inherit', color: 'inherit', font: 'inherit', padding: 0, border: 0 }}
          >
            {content}
          </button>
          {closeButton}
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
