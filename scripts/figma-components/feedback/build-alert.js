// Alert descriptor — standard builder
// 5 variants (default, error, success, warning, info) × 3 sizes = 15 variants
// Leading + trailing icon slots, no shadow
module.exports = {
  name: 'Alert',
  configKey: 'alert',
  description: 'Inline feedback message with variant colors. Dismissible via trailing icon.',
  builder: 'standard',
  textFamily: 'action'
};
