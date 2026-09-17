const { buildSizeStyles, resolveBase } = require('../shared');

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

/** Filter size entries (remove $exception, $note keys) */
function filterSizes(sizes) {
  if (!sizes) return {};
  return Object.fromEntries(Object.entries(sizes).filter(([k]) => !k.startsWith('$')));
}

// What is left after cva-only.js. It was the only consumer of buildCvaString and
// extractIconSizes, and buildCvaString was the only consumer of getVariantPropName,
// detectVariantKey, layoutClass and extractVariants — the whole generic
// "styled element plus CVA variants" path, which nothing ever dispatched to.
module.exports = {
  buildSizeStylesWithText,
  filterSizes,
  resolveConfig,
};
