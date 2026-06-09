// Banner descriptor — standard builder (consolidates the old alert)
// 4 variants (info, success, warning, error) × 3 sizes = 12 variants
// Leading icon slot only — dismiss is a composed iconOnly Button in code, not an
// icon-slot, so it isn't a Figma variant axis here (Figma is the browse reference;
// code owns the composition).
module.exports = {
  name: 'Banner',
  configKey: 'banner',
  description: 'Inline status/severity message with variant colors. Optional leading icon; dismiss + action are composed in code.',
  builder: 'standard',
  textFamily: 'action'
};
