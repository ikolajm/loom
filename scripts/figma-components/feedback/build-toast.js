// Toast descriptor — standard builder
// 5 variants (default, error, success, warning, info) × 3 sizes = 15 variants
// Leading + trailing icon slots, per-size shadow (effects/shadow-3)
module.exports = {
  name: 'Toast',
  configKey: 'toast',
  description: 'Notification message with variant colors. Shadow-3 on all sizes.',
  builder: 'standard',
  textFamily: 'action'
};
