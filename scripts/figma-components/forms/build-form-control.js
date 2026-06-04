// =============================================================================
// Form Control — Composed Component Builder
// =============================================================================
// Horizontal row: Toggle + text-stack (Label over Helper Text).
// checked (false/true) × size (sm/md/lg) = 6 variants.
//
// Structure:
//   Form Control (HORIZONTAL)
//     ├── Toggle (checkbox default, instance-swappable)
//     └── text-stack (VERTICAL)
//         ├── Label
//         └── Helper Text (boolean-toggled, default hidden)
//
// Helper text aligns under the label, not under the toggle.
//
// Must run AFTER all atomic form components are built on the page.
// =============================================================================

function buildFormControl(lookups, defaultMode, page) {
  const { primSpacing } = lookups;
  const rowGapVar = primSpacing['spacing/2']; // scale.2 = 8px gap between toggle and text-stack
  const stackGapVar = primSpacing['spacing/1']; // scale.1 = 4px gap between label and helper text

  // Find component sets built earlier on this page
  const checkboxSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Checkbox');
  const labelSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Label');
  const helperSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Helper Text');

  if (!checkboxSet || !labelSet || !helperSet) {
    return { name: 'Form Control', count: 0 };
  }

  const checkedStates = ['false', 'true'];
  const sizes = ['sm', 'md', 'lg'];
  const variants = [];

  for (const checked of checkedStates) {
    for (const size of sizes) {
      const comp = figma.createComponent();
      comp.name = `checked=${checked}, size=${size}`;
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisSizingMode = 'AUTO';
      comp.counterAxisSizingMode = 'AUTO';
      comp.primaryAxisAlignItems = 'MIN';
      comp.counterAxisAlignItems = 'MIN';
      if (rowGapVar) comp.setBoundVariable('itemSpacing', rowGapVar);

      // Toggle instance — checkbox default, instance-swappable
      const toggleVariant = checkboxSet.findChild(n => n.name === `checked=${checked}, size=${size}`);
      if (toggleVariant) {
        const toggleInst = toggleVariant.createInstance();
        toggleInst.name = 'toggle';
        comp.appendChild(toggleInst);
      }

      // Text stack: Label + Helper Text (vertical column)
      const textStack = figma.createFrame();
      textStack.name = 'text-stack';
      textStack.layoutMode = 'VERTICAL';
      textStack.primaryAxisSizingMode = 'AUTO';
      textStack.counterAxisSizingMode = 'AUTO';
      textStack.primaryAxisAlignItems = 'MIN';
      textStack.counterAxisAlignItems = 'MIN';
      textStack.fills = [];
      if (stackGapVar) textStack.setBoundVariable('itemSpacing', stackGapVar);

      // Label instance — size-matched
      const labelVariant = labelSet.findChild(n => n.name === `state=default, size=${size}`);
      if (labelVariant) {
        const labelInst = labelVariant.createInstance();
        labelInst.name = 'label';
        textStack.appendChild(labelInst);
      }

      // Helper Text — added to textStack before appending to comp
      const helperVariant = helperSet.findChild(n => n.name === `state=default, size=${size}`);
      let helperInst = null;
      if (helperVariant) {
        helperInst = helperVariant.createInstance();
        helperInst.name = 'helper-text';
        textStack.appendChild(helperInst);
        helperInst.visible = false;
      }

      // Append text-stack to component BEFORE setting property ref
      // (helper must be a sublayer of the component for componentPropertyReferences)
      comp.appendChild(textStack);

      // Boolean toggle for helper text visibility
      if (helperInst) {
        const propKey = comp.addComponentProperty('showHelperText', 'BOOLEAN', false);
        helperInst.componentPropertyReferences = { 'visible': propKey };
      }

      variants.push(comp);
    }
  }

  // Combine into component set
  const set = figma.combineAsVariants(variants, page);
  set.name = 'Form Control';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  // Base frame
  createBaseFrame('form-control', 'Composed Toggle + Label + Helper Text. Toggle instance swappable. Helper text toggleable.', set, lookups, defaultMode);

  // Preview — unchecked, md size
  const defaultVariant = set.findChild(n => n.name === 'checked=false, size=md');
  createPreviewFrame('form-control', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Form Control', count: set.children.length };
}
