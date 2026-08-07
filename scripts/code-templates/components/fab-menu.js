const { buildVariantStyles, buildSizeStyles, colorToClass, spacingToClass, radiusToClass, ICON_SLOT_CLASS } = require('../shared');
const { filterSizes, extractIconSizes, textRoleClass } = require('./helpers');

function generateFabMenu(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};

  const triggerSizes = filterSizes(config['trigger-sizes'] || {});
  const triggerSizeStyles = buildSizeStyles(triggerSizes);
  const triggerIconSizes = extractIconSizes(triggerSizes);

  const actionSizes = filterSizes(config['action-sizes'] || {});
  const actionSizeStyles = buildSizeStyles(actionSizes);
  const actionIconSizes = extractIconSizes(actionSizes);

  const stackSpacing = config['stack-spacing'] || {};
  const stackGapClasses = {};
  for (const [tier, val] of Object.entries(stackSpacing)) {
    if (tier.startsWith('$')) continue;
    const gap = spacingToClass(val, 'gap');
    if (gap) stackGapClasses[tier] = gap;
  }

  const labelCfg = config['action-label'] || {};
  const labelClasses = [];
  const labelBg = colorToClass(labelCfg.bg, 'bg');
  const labelFg = colorToClass(labelCfg.fg, 'text');
  if (labelBg) labelClasses.push(labelBg);
  if (labelFg) labelClasses.push(labelFg);
  const labelPx = spacingToClass(labelCfg['x-padding'], 'px');
  if (labelPx) labelClasses.push(labelPx);
  const labelPy = spacingToClass(labelCfg['y-padding'], 'py');
  if (labelPy) labelClasses.push(labelPy);
  const labelRad = radiusToClass(labelCfg.radius);
  if (labelRad) labelClasses.push(`rounded-${labelRad}`);
  const fwMap = { 400: 'font-normal', 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold' };
  if (labelCfg['font-weight'] && fwMap[labelCfg['font-weight']]) labelClasses.push(fwMap[labelCfg['font-weight']]);
  const labelRole = textRoleClass(labelCfg.text);
  if (labelRole) labelClasses.push(labelRole);
  if (labelCfg['letter-spacing'] && labelCfg['letter-spacing'] !== '0') labelClasses.push(`tracking-[${labelCfg['letter-spacing']}]`);
  const labelClassStr = labelClasses.join(' ');

  const dflt = config.default || {};

  return `import { forwardRef, useState, createContext, useContext } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const fabMenuTriggerVariants = cva(
  'inline-flex items-center justify-center interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(triggerSizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${dflt.variant || 'default'}',
      size: '${dflt.size || 'md'}',
    },
  }
);

const fabMenuActionVariants = cva(
  'inline-flex items-center justify-center interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-(--opacity-disabled) disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(actionSizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      variant: '${dflt.variant || 'default'}',
      size: '${dflt.size || 'md'}',
    },
  }
);

const fabMenuTriggerIconSize: Record<string, string> = {
${Object.entries(triggerIconSizes || {}).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const fabMenuActionIconSize: Record<string, string> = {
${Object.entries(actionIconSizes || {}).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const fabMenuStackGap: Record<string, string> = {
${Object.entries(stackGapClasses).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const FAB_LABEL_CLASSES = '${labelClassStr}';

type FabMenuSize = 'sm' | 'md' | 'lg';

const FabMenuContext = createContext<{ size: FabMenuSize }>({ size: 'md' });

type FabMenuProps = React.HTMLAttributes<HTMLDivElement>
  & Omit<VariantProps<typeof fabMenuTriggerVariants>, 'size'>
  & {
    size?: FabMenuSize;
    triggerIcon: React.ReactNode;
    triggerLabel?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  };

const FabMenu = forwardRef<HTMLDivElement, FabMenuProps>(
  ({ variant, size = 'md', triggerIcon, triggerLabel, open: openProp, defaultOpen = false, onOpenChange, className, children, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = openProp !== undefined ? openProp : internalOpen;

    const handleOpenChange = (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    };

    const triggerIconCls = fabMenuTriggerIconSize[size];
    const stackGap = fabMenuStackGap[size];

    return (
      <FabMenuContext.Provider value={{ size }}>
        <div ref={ref} className={cn('relative inline-flex flex-col items-end', className)} {...props}>
          {open && (
            <div className={cn('mb-3 flex flex-col items-end', stackGap)} role="menu">
              {children}
            </div>
          )}
          <button
            type="button"
            className={cn(fabMenuTriggerVariants({ variant, size }))}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => handleOpenChange(!open)}
          >
            <span className={cn('${ICON_SLOT_CLASS}', triggerIconCls)}>{triggerIcon}</span>
            {triggerLabel && <span className="ml-2">{triggerLabel}</span>}
          </button>
        </div>
      </FabMenuContext.Provider>
    );
  }
);
FabMenu.displayName = 'FabMenu';

type FabActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & {
    icon: React.ReactNode;
    label?: string;
  };

const FabAction = forwardRef<HTMLButtonElement, FabActionProps>(
  ({ icon, label, className, ...props }, ref) => {
    const { size } = useContext(FabMenuContext);
    const actionIconCls = fabMenuActionIconSize[size];

    return (
      <div className="inline-flex items-center gap-2">
        {label && <span className={cn(FAB_LABEL_CLASSES)} aria-hidden="true">{label}</span>}
        <button
          ref={ref}
          type="button"
          className={cn(fabMenuActionVariants({ size }), className)}
          role="menuitem"
          aria-label={label}
          {...props}
        >
          <span className={cn('${ICON_SLOT_CLASS}', actionIconCls)}>{icon}</span>
        </button>
      </div>
    );
  }
);
FabAction.displayName = 'FabAction';

export { FabMenu, FabAction, fabMenuTriggerVariants, fabMenuActionVariants };
`;
}

module.exports = { generateFabMenu };
