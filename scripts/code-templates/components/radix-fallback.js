const { generateCvaOnly } = require('./cva-only');

function generateRadix_fallback(name, config, meta) {
  console.warn(`  ${name}: Using cva-only fallback (Radix template: ${meta.primitive} pending)`);
  return `// TODO: Wrap with ${meta.primitive} for full behavior\n` + generateCvaOnly(name, config, meta);
}

function generateLib(name, config, meta) {
  console.warn(`  ${name}: Using cva-only fallback (lib template: ${meta.primitive} pending)`);
  return `// TODO: Wrap with ${meta.primitive} for full behavior\n` + generateCvaOnly(name, config, meta);
}

function generateRadixScrollArea(n, c, m) { return generateRadix_fallback(n, c, m); }

module.exports = {
  generateRadix_fallback,
  generateLib,
  generateRadixScrollArea,
};
