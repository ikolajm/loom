const { buildVariantStyles, buildSizeStyles, buildTypographyClasses, resolveBase } = require('../shared');

/** Prefix every class in a space-separated string with a Tailwind variant prefix.
 *  e.g. prefixClasses('data-[state=off]', 'bg-transparent text-muted') → 'data-[state=off]:bg-transparent data-[state=off]:text-muted' */
function prefixClasses(prefix, classString) {
  return classString.split(' ').filter(Boolean).map(cls => `${prefix}:${cls}`).join(' ');
}

/** Get the variant prop name from config key */
function getVariantPropName(variantKey) {
  if (variantKey === 'variants') return 'variant';
  if (variantKey === 'checked') return 'checked';
  if (variantKey === 'step-state') return 'step';
  return variantKey; // state, active, item — use as-is
}

/** Detect the variant key in config */
function detectVariantKey(config, meta) {
  if (meta.variantKey) return meta.variantKey;
  if (config.state) return 'state';
  if (config.variants) return 'variants';
  if (config.checked) return 'checked';
  if (config.active) return 'active';
  if (config['step-state']) return 'step-state';
  return 'variants';
}

/** Build layout base class from registry */
function layoutClass(meta) {
  if (meta.layout === 'stack') return 'flex flex-col';
  if (meta.layout === 'row') return 'flex items-center';
  if (meta.layout === 'block') return '';
  return 'inline-flex items-center justify-center';
}

/** Extract icon size classes per size tier from config. Uses design token classes (size-icon-*), not spacing scale. */
function extractIconSizes(sizes) {
  if (!sizes) return null;
  const map = {};
  let hasAny = false;
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const iconToken = sz['icon-size'] || sz.icon;
    if (iconToken && typeof iconToken === 'string' && iconToken.startsWith('icon/')) {
      // icon/icon-2 → size-icon-2 (references --size-icon-2 from @theme → --icon-2 from standards)
      const iconKey = iconToken.replace('icon/', '');
      map[tier] = `size-${iconKey}`;
      hasAny = true;
    }
  }
  return hasAny ? map : null;
}

/** A per-slot type role, "action/md" -> "text-action-md".
 *  buildSizeStylesWithText binds ONE family to an atom's root size class, so any atom
 *  with a second text role (a heading beside a description, a label beside a step
 *  indicator) fell out of it and declared raw px instead. This is the per-slot form. */
function textRoleClass(ref) {
  return typeof ref === 'string' && ref.includes('/') ? `text-${ref.replace('/', '-')}` : null;
}

/** Build size styles with text family class appended. Only appends for standard tiers (sm/md/lg). */
function buildSizeStylesWithText(sizes, textFamily) {
  const base = buildSizeStyles(sizes);
  if (!textFamily) return base;
  const standardTiers = new Set(['sm', 'md', 'lg']);
  const result = {};
  for (const [name, classes] of Object.entries(base)) {
    result[name] = standardTiers.has(name) ? `${classes} text-${textFamily}-${name}` : classes;
  }
  return result;
}

/** Resolve config with $base inheritance */
function resolveConfig(source, key, baseKey) {
  if (baseKey) {
    // resolveBase needs the full config object and the key
    return resolveBase(source, key);
  }
  return source[key];
}

/** Extract flat variants from config (handles nested state objects) */
function extractVariants(config, variantKey) {
  const variantDefs = config[variantKey];
  if (!variantDefs) return null;
  // Handle nested: item.state, day.state, etc.
  if (variantDefs.state && typeof variantDefs.state === 'object') return variantDefs.state;
  return variantDefs;
}

/** Filter size entries (remove $exception, $note keys) */
function filterSizes(sizes) {
  if (!sizes) return {};
  return Object.fromEntries(Object.entries(sizes).filter(([k]) => !k.startsWith('$')));
}

/**
 * Build a CVA definition string from config.
 * This is the core config → code translation.
 */
function buildCvaString(varName, config, meta) {
  const variantKey = detectVariantKey(config, meta);
  const propName = getVariantPropName(variantKey);
  const flatVariants = extractVariants(config, variantKey);
  const variantStyles = flatVariants ? buildVariantStyles(flatVariants) : {};
  let sizes = filterSizes(config.sizes);
  // Strip keys the component doesn't want in size styles (e.g. Spinner doesn't use border-width)
  if (meta.sizeSkipKeys && meta.sizeSkipKeys.length > 0) {
    const filtered = {};
    for (const [tier, sz] of Object.entries(sizes)) {
      const copy = { ...sz };
      for (const k of meta.sizeSkipKeys) delete copy[k];
      filtered[tier] = copy;
    }
    sizes = filtered;
  }
  const sizeStyles = Object.keys(sizes).length > 0
    ? buildSizeStylesWithText(sizes, meta.textFamily)
    : {};

  // Base classes
  const base = [];
  base.push(layoutClass(meta));
  if (meta.baseExtra) base.push(meta.baseExtra);
  const typo = buildTypographyClasses(config);
  if (typo) base.push(typo);
  if (!meta.noInteractive) {
    base.push('interactive');
    // Text inputs should use text cursor, not pointer, and match Select placeholder color
    const isTextInput = ['input', 'textarea'].includes(meta.element) && !meta.inputType;
    if (isTextInput) base.push('cursor-text placeholder:text-on-surface-variant');
    base.push('control');
  }
  const baseStr = base.filter(Boolean).join(' ');

  // Default variants
  const dflt = config.default || {};
  const defaults = {};
  if (propName !== 'variant' && dflt[variantKey]) defaults[propName] = dflt[variantKey];
  else if (dflt.variant) defaults.variant = dflt.variant;
  else if (dflt.state) defaults.state = dflt.state;
  else if (dflt.checked) defaults.checked = dflt.checked;
  else if (dflt.active) defaults.active = dflt.active;
  if (dflt.size) defaults.size = dflt.size;

  // Build
  const lines = [];
  lines.push(`const ${varName} = cva(`);
  lines.push(`  '${baseStr}',`);
  lines.push(`  {`);
  lines.push(`    variants: {`);

  if (Object.keys(variantStyles).length > 0) {
    lines.push(`      ${propName}: {`);
    for (const [name, classes] of Object.entries(variantStyles)) {
      lines.push(`        ${name}: '${classes}',`);
    }
    lines.push(`      },`);
  }

  if (Object.keys(sizeStyles).length > 0) {
    lines.push(`      size: {`);
    for (const [name, classes] of Object.entries(sizeStyles)) {
      lines.push(`        ${name}: '${classes}',`);
    }
    lines.push(`      },`);
  }

  lines.push(`    },`);
  lines.push(`    defaultVariants: {`);
  for (const [k, v] of Object.entries(defaults)) {
    lines.push(`      ${k}: '${v}',`);
  }
  lines.push(`    },`);
  lines.push(`  }`);
  lines.push(`);`);

  return { code: lines.join('\n'), propName, variantStyles, sizeStyles, defaults };
}

module.exports = {
  prefixClasses,
  getVariantPropName,
  detectVariantKey,
  layoutClass,
  extractIconSizes,
  buildSizeStylesWithText,
  textRoleClass,
  resolveConfig,
  extractVariants,
  filterSizes,
  buildCvaString,
};
