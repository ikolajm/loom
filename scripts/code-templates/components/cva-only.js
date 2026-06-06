const { colorToClass, ICON_SLOT_CLASS } = require('../shared');
const { buildCvaString, extractIconSizes, filterSizes } = require('./helpers');

function generateCvaOnly(name, config, meta) {
  // Handle acronyms (FAB → fab, not fAB)
  const lcName = name === name.toUpperCase()
    ? name.toLowerCase()
    : name.charAt(0).toLowerCase() + name.slice(1);
  const el = meta.element || 'div';
  const htmlType = meta.htmlType || 'HTMLAttributes<HTMLDivElement>';
  const selfClosing = meta.selfClosing || false;
  const role = meta.role || null;
  const inputType = meta.inputType || null;
  const hasIconSlots = !selfClosing && !meta.noIconSlots && !!config['icon-slots'];
  const isTextField = ['input', 'textarea'].includes(el) && !inputType;
  const isTextarea = el === 'textarea';

  // Omit size for input-like elements
  const inputLike = htmlType.includes('InputHTMLAttributes') || htmlType.includes('SelectHTMLAttributes') || htmlType.includes('TextareaHTMLAttributes');
  const omitSize = inputLike;

  // Build CVA
  const cva = buildCvaString(`${lcName}Variants`, config, meta);

  // Add w-full to base for text fields
  let extraBaseClasses = '';
  if (isTextField) extraBaseClasses = ' w-full';
  if (isTextarea && config.resize) extraBaseClasses += ` resize-${config.resize}`;

  // Icon sizes from config (per size tier)
  const iconSizes = hasIconSlots ? extractIconSizes(filterSizes(config.sizes)) : null;

  // Determine variant/size type names
  const variantNames = Object.keys(cva.variantStyles);
  const sizeNames = Object.keys(cva.sizeStyles);
  const hasVariants = variantNames.length > 0;
  const hasSizes = sizeNames.length > 0;

  // Imports
  const imports = [`import { forwardRef } from 'react';`];
  imports.push(`import { cva, type VariantProps } from 'class-variance-authority';`);
  imports.push(`import { cn } from './cn';`);
  if (name === 'Button') imports.push(`import { Slot } from '@radix-ui/react-slot';`);
  if (name === 'Spinner') imports.push(`import { Loader } from 'lucide-react';`);

  // Extend type
  const extendsType = omitSize ? `Omit<React.${htmlType}, 'size'>` : `React.${htmlType}`;

  // Extra props
  const extraProps = [];
  if (name === 'Button') extraProps.push('asChild?: boolean;');
  if (hasIconSlots) {
    const leading = config['icon-slots'].leading;
    const trailing = config['icon-slots'].trailing;
    if (leading && !leading.persistent) extraProps.push('leadingIcon?: React.ReactNode;');
    if (trailing && !trailing.persistent) extraProps.push('trailingIcon?: React.ReactNode;');
  }
  if (isTextField) extraProps.push(''); // placeholder comes from HTML attrs

  // Build file
  const lines = [];
  lines.push(imports.join('\n'));
  lines.push('');

  // CVA definition
  lines.push(cva.code);
  lines.push('');

  // Icon size map (if component has icon slots with per-size icon sizing)
  if (iconSizes) {
    lines.push(`const ${lcName}IconSize: Record<string, string> = {`);
    for (const [tier, cls] of Object.entries(iconSizes)) {
      lines.push(`  ${tier}: '${cls}',`);
    }
    lines.push(`};`);
    lines.push('');
  }

  // Type
  lines.push(`type ${name}Props = ${extendsType}`);
  lines.push(`  & VariantProps<typeof ${lcName}Variants>`);
  if (extraProps.length > 0) {
    lines.push(`  & {`);
    for (const p of extraProps) {
      if (p) lines.push(`    ${p}`);
    }
    lines.push(`  };`);
  } else {
    lines.push(`;`);
  }
  lines.push('');

  // Destructured props
  const destructured = [];
  if (hasVariants) destructured.push(cva.propName);
  if (hasSizes) destructured.push('size');
  if (name === 'Button') destructured.push('asChild = false');
  if (hasIconSlots) {
    const leading = config['icon-slots'].leading;
    const trailing = config['icon-slots'].trailing;
    if (leading && !leading.persistent) destructured.push('leadingIcon');
    if (trailing && !trailing.persistent) destructured.push('trailingIcon');
  }
  destructured.push('className');
  if (!selfClosing && name !== 'Spinner') destructured.push('children');
  destructured.push('...props');

  // Element to render
  let compEl = el;
  if (name === 'Button') compEl = 'Comp';

  // Ref type
  const refType = htmlType.match(/<(\w+)>/)?.[1] || 'HTMLElement';

  // Component body
  lines.push(`const ${name} = forwardRef<${refType}, ${name}Props>(`);
  lines.push(`  ({ ${destructured.join(', ')} }, ref) => {`);
  if (name === 'Button') {
    lines.push(`    const Comp = asChild ? Slot : '${el}';`);
  }

  // Build className
  const cnArgs = [`${lcName}Variants({ ${[hasVariants ? cva.propName : null, hasSizes ? 'size' : null].filter(Boolean).join(', ')} })`];
  if (extraBaseClasses) cnArgs.unshift(`'${extraBaseClasses.trim()}'`);

  // Build JSX
  const attrs = [];
  attrs.push('ref={ref}');
  if (role) attrs.push(`role="${role}"`);
  if (inputType) attrs.push(`type="${inputType}"`);
  if (name === 'Spinner') attrs.push('aria-label="Loading"');
  attrs.push(`className={cn(${cnArgs.join(', ')}, className)}`);
  attrs.push('{...props}');

  if (selfClosing) {
    lines.push(`    return <${compEl} ${attrs.join(' ')} />;`);
  } else if (isTextarea) {
    lines.push(`    return <${compEl} ${attrs.join(' ')} />;`);
  } else if (name === 'Spinner') {
    lines.push(`    return (`);
    lines.push(`      <${compEl} ${attrs.join(' ')}>`);
    lines.push(`        <Loader className="animate-spin w-full h-full" />`);
    lines.push(`      </${compEl}>`);
    lines.push(`    );`);
  } else {
    lines.push(`    return (`);
    lines.push(`      <${compEl} ${attrs.join(' ')}>`);
    const iconSlotCls = iconSizes
      ? `cn('${ICON_SLOT_CLASS}', ${lcName}IconSize[size || '${cva.defaults.size || 'md'}'])`
      : `'${ICON_SLOT_CLASS}'`;
    if (hasIconSlots && config['icon-slots'].leading && !config['icon-slots'].leading.persistent) {
      lines.push(`        {leadingIcon && <span className={${iconSlotCls}}>{leadingIcon}</span>}`);
    }
    lines.push(`        {children}`);
    if (hasIconSlots && config['icon-slots'].trailing && !config['icon-slots'].trailing.persistent) {
      lines.push(`        {trailingIcon && <span className={${iconSlotCls}}>{trailingIcon}</span>}`);
    }
    lines.push(`      </${compEl}>`);
    lines.push(`    );`);
  }

  lines.push(`  }`);
  lines.push(`);`);
  lines.push(`${name}.displayName = '${name}';`);
  lines.push('');
  lines.push(`export { ${name}, ${lcName}Variants };`);
  lines.push('');

  // Compound sub-components
  const compound = generateCompoundSubs(name, config, meta);
  if (compound) lines.push(compound);

  return lines.join('\n');
}

function generateCompoundSubs(name, config, meta) {
  const subs = {
    'Card': [
      { sub: 'CardHeader', el: 'div', classes: 'flex flex-col gap-1.5' },
      { sub: 'CardTitle', el: 'h3', classes: 'text-title-md font-semibold leading-none' },
      { sub: 'CardDescription', el: 'p', classes: 'text-body-sm text-on-surface-variant' },
      { sub: 'CardContent', el: 'div', classes: '' },
      { sub: 'CardFooter', el: 'div', classes: 'flex items-center gap-2' },
    ],
    'Table': [
      { sub: 'TableHeader', el: 'thead', classes: '' },
      { sub: 'TableBody', el: 'tbody', classes: '' },
      { sub: 'TableRow', el: 'tr', classes: 'border-b border-outline-subtle transition-colors hover:bg-surface-1' },
      { sub: 'TableHead', el: 'th', classes: 'h-ch-5 px-4 text-left align-middle font-medium text-on-surface-variant' },
      { sub: 'TableCell', el: 'td', classes: 'px-4 py-2 align-middle' },
    ],
    'Sidebar': [
      { sub: 'SidebarItem', el: 'button', classes: 'flex items-center w-full rounded-component font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-on-surface-variant hover:bg-surface-1 hover:text-on-surface', extraProps: 'active?: boolean; icon?: React.ReactNode; size?: \'sm\' | \'md\' | \'lg\';', activeClasses: 'bg-primary-container text-on-primary-container', sizeMap: { sm: 'h-ch-5 px-3 gap-2 text-[14px] leading-[20px]', md: 'h-ch-7 px-4 gap-3 text-[14px] leading-[20px]', lg: 'h-ch-8 px-4 gap-3 text-[16px] leading-[24px]' } },
    ],
    'BottomNav': [
      { sub: 'BottomNavItem', el: 'button', classes: 'flex flex-1 flex-col items-center justify-center gap-0.5 h-full px-3 interactive cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-on-surface-variant', extraProps: 'active?: boolean; icon?: React.ReactNode;', activeClasses: 'text-primary' },
    ],
    'Breadcrumbs': [
      { sub: 'BreadcrumbItem', el: 'span', classes: 'text-on-surface-variant hover:text-on-surface cursor-pointer', extraProps: 'current?: boolean;', activeClasses: 'text-on-surface font-medium cursor-default' },
    ],
  };

  const defs = subs[name];
  if (!defs) return null;

  const lines = [];
  for (const { sub, el, classes, extraProps, activeClasses, sizeMap } of defs) {
    const refType = el === 'th' || el === 'td' ? 'HTMLTableCellElement'
      : el === 'tr' ? 'HTMLTableRowElement'
      : el === 'thead' || el === 'tbody' ? 'HTMLTableSectionElement'
      : el === 'h3' ? 'HTMLHeadingElement'
      : el === 'p' ? 'HTMLParagraphElement'
      : el === 'button' ? 'HTMLButtonElement'
      : el === 'span' ? 'HTMLSpanElement'
      : 'HTMLDivElement';

    if (sizeMap) {
      // Emit size map before component
      lines.push(`const ${sub.charAt(0).toLowerCase() + sub.slice(1)}Size: Record<string, string> = {`);
      for (const [tier, cls] of Object.entries(sizeMap)) {
        lines.push(`  ${tier}: '${cls}',`);
      }
      lines.push(`};`);
      lines.push('');
    }

    if (activeClasses) {
      // Component with active/current state
      lines.push(`const ${sub} = forwardRef<${refType}, React.ComponentPropsWithoutRef<'${el}'> & { ${extraProps} }>(`);
      const activeProp = extraProps.includes('current') ? 'current' : 'active';
      const iconProp = extraProps.includes('icon') ? ', icon' : '';
      const sizeProp = sizeMap ? ", size = 'md'" : '';
      lines.push(`  ({ ${activeProp} = false${iconProp}${sizeProp}, className, children, ...props }, ref) => (`);
      lines.push(`    <${el} ref={ref}${el === 'button' ? ' type="button"' : ''} className={cn(`);
      lines.push(`      '${classes}',`);
      if (sizeMap) lines.push(`      ${sub.charAt(0).toLowerCase() + sub.slice(1)}Size[size],`);
      lines.push(`      ${activeProp} && '${activeClasses}',`);
      lines.push(`      className`);
      lines.push(`    )} {...props}>`);
      if (extraProps.includes('icon')) lines.push(`      {icon && <span className="shrink-0">{icon}</span>}`);
      lines.push(`      {children}`);
      lines.push(`    </${el}>`);
      lines.push(`  )`);
      lines.push(`);`);
    } else {
      lines.push(`const ${sub} = forwardRef<${refType}, React.ComponentPropsWithoutRef<'${el}'>>(`);
      lines.push(`  ({ className, ...props }, ref) => (`);
      lines.push(`    <${el} ref={ref} className={cn('${classes}', className)} {...props} />`);
      lines.push(`  )`);
      lines.push(`);`);
    }
    lines.push(`${sub}.displayName = '${sub}';`);
    lines.push('');
  }

  lines.push(`export { ${defs.map(d => d.sub).join(', ')} };`);
  return lines.join('\n');
}

module.exports = { generateCvaOnly, generateCompoundSubs };
