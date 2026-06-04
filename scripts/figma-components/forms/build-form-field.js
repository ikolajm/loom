// =============================================================================
// Form Field — Composed Component Builder
// =============================================================================
// Vertical stack: Label + Input + Helper Text
// state (default/error) × size (sm/md/lg) = 6 variants.
//
// - Helper text visibility toggled via boolean property (hidden on default)
// - Input instance is swappable (for select, textarea, date-picker)
// - Uses hidden-instance-sizing workaround for FILL on toggled children
//
// Must run AFTER all atomic form components are built on the page.
// =============================================================================

function buildFormField(lookups, defaultMode, page) {
  const { primSpacing } = lookups;
  const gapVar = primSpacing['spacing/1']; // scale.1 = 4px gap between elements

  // Find component sets built earlier on this page
  const labelSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Label');
  const inputSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Input');
  const helperSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Helper Text');

  if (!labelSet || !inputSet || !helperSet) {
    return { name: 'Form Field', count: 0 };
  }

  const states = ['default', 'error'];
  const sizes = ['sm', 'md', 'lg'];
  const variants = [];

  for (const state of states) {
    for (const size of sizes) {
      const comp = figma.createComponent();
      comp.name = `state=${state}, size=${size}`;
      comp.layoutMode = 'VERTICAL';
      comp.primaryAxisSizingMode = 'AUTO';
      comp.counterAxisSizingMode = 'FIXED';
      comp.primaryAxisAlignItems = 'MIN';
      comp.counterAxisAlignItems = 'MIN';
      // Match input width so FILL children stretch correctly
      comp.resize(parsePx(CONFIG.components['text-field'].width) || 280, comp.height);
      if (gapVar) comp.setBoundVariable('itemSpacing', gapVar);

      // Label instance — size-matched, single state
      const labelVariant = labelSet.findChild(n => n.name === `state=default, size=${size}`);
      if (labelVariant) {
        const labelInst = labelVariant.createInstance();
        labelInst.name = 'label';
        comp.appendChild(labelInst);
        labelInst.layoutSizingHorizontal = 'FILL';
      }

      // Input instance — size-matched, state-matched, instance-swappable
      const inputVariant = inputSet.findChild(n => n.name === `state=${state}, size=${size}`);
      if (inputVariant) {
        const inputInst = inputVariant.createInstance();
        inputInst.name = 'input';
        comp.appendChild(inputInst);
        inputInst.layoutSizingHorizontal = 'FILL';
      }

      // Helper text instance — size-matched, state-matched, boolean toggle
      const helperState = state === 'error' ? 'error' : 'default';
      const helperVariant = helperSet.findChild(n => n.name === `state=${helperState}, size=${size}`);
      if (helperVariant) {
        const helperInst = helperVariant.createInstance();
        helperInst.name = 'helper-text';

        // Hidden-instance-sizing workaround:
        // Figma doesn't allow layoutSizingHorizontal = "FILL" on hidden instances.
        // 1. Append visible, set FILL, then hide and connect boolean.
        comp.appendChild(helperInst);
        helperInst.layoutSizingHorizontal = 'FILL';

        // Default visibility: shown on error, hidden on default
        const showHelper = state === 'error';
        helperInst.visible = false;

        // Add boolean property for helper text visibility
        const propKey = comp.addComponentProperty('showHelperText', 'BOOLEAN', showHelper);
        helperInst.componentPropertyReferences = { 'visible': propKey };
      }

      variants.push(comp);
    }
  }

  // Combine into component set
  const set = figma.combineAsVariants(variants, page);
  set.name = 'Form Field';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  // Base frame
  createBaseFrame('form-field', 'Composed Label + Input + Helper Text. Helper text toggleable.', set, lookups, defaultMode);

  // Preview — default state, md size
  const defaultVariant = set.findChild(n => n.name === 'state=default, size=md');
  createPreviewFrame('form-field', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Form Field', count: set.children.length };
}
