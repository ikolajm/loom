// Descriptor: Textarea
// Standard shape — text-field base with min-height instead of fixed height.
// No icon slots. Vertical layout for text wrapping.
// state (default/error) × size (sm/md/lg) = 6 variants.
module.exports = {
  name: 'Textarea',
  configKey: 'textarea',
  description: 'Multi-line text input with min-height per size.',
  builder: 'standard',
  textFamily: 'input'
};
