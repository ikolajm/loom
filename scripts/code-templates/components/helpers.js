const { resolveBase } = require('../shared');

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
  filterSizes,
  resolveConfig,
};
