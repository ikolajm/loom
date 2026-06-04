// =============================================================================
// Input OTP — Custom Component Builder
// =============================================================================
// Row of square input cells for one-time passwords.
// 1 state × 3 sizes = 3 variants. Shows 6 cells with first 4 filled.
// =============================================================================

function buildInputOtp(lookups, defaultMode, page) {
  const { semColors, semRadius, primHeight, primSpacing, primBW } = lookups;
  const config = CONFIG.components['input-otp'];
  const state = config.state.default;
  const bgVar = semColors[state.bg];
  const fgVar = semColors[state.fg];
  const borderVar = semColors[state.border];
  const variants = [];

  for (const [sizeName, sz] of Object.entries(config.sizes)) {
    const comp = figma.createComponent();
    comp.name = `state=default, size=${sizeName}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.fills = [];

    const gapPath = resolveScale(sz.gap);
    if (gapPath) {
      const v = primSpacing[gapPath];
      if (v) comp.setBoundVariable('itemSpacing', v);
    }

    const cellPath = resolveHeight(sz['cell-size']);
    const cellVar = cellPath ? primHeight[cellPath] : null;
    const radVar = semRadius[sz.radius];
    const bwPath = sz['border-width'].replace('/bw-', '/');
    const bwVar = primBW[bwPath];

    const digits = ['1', '2', '3', '4', '', ''];

    for (let i = 0; i < 6; i++) {
      const cell = figma.createFrame();
      cell.name = `cell-${i}`;
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';

      if (cellVar) {
        cell.setBoundVariable('width', cellVar);
        cell.setBoundVariable('height', cellVar);
        cell.primaryAxisSizingMode = 'FIXED';
        cell.counterAxisSizingMode = 'FIXED';
      }

      if (bgVar) cell.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
      )];

      if (borderVar) {
        cell.strokes = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
        )];
        if (bwVar) cell.setBoundVariable('strokeWeight', bwVar);
        else cell.strokeWeight = 1;
      }

      if (radVar) {
        cell.setBoundVariable('topLeftRadius', radVar);
        cell.setBoundVariable('topRightRadius', radVar);
        cell.setBoundVariable('bottomLeftRadius', radVar);
        cell.setBoundVariable('bottomRightRadius', radVar);
      }

      if (digits[i]) {
        const text = figma.createText();
        text.name = 'digit';
        text.characters = digits[i];
        applyTextStyle(text, 'input', sizeName);
        text.textAlignHorizontal = 'CENTER';
        if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
        )];
        cell.appendChild(text);
      }

      comp.appendChild(cell);
    }

    variants.push(comp);
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Input OTP';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('input-otp', 'One-time password input. Row of square cells. Auto-advance on entry.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'state=default, size=md');
  createPreviewFrame('input-otp', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Input OTP', count: set.children.length };
}
