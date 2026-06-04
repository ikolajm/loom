// =============================================================================
// Divider — Template Component
// =============================================================================
// Horizontal separator line for documentation layout.
// layout/outline color, border-width/1 height.
// Appended directly to page — no base/preview framing.
// =============================================================================

function buildDivider(lookups, defaultMode, page) {
  const { layoutVars, primBW } = lookups;

  const comp = figma.createComponent();
  comp.name = 'template/divider';
  comp.resize(200, 1);

  const outlineVar = layoutVars['layout/outline'];
  if (outlineVar) comp.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', outlineVar
  )];

  const bw1 = primBW['border-width/1'];
  if (bw1) comp.setBoundVariable('height', bw1);

  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  if (sysFrame) sysFrame.appendChild(comp);
  else page.appendChild(comp);

  return { name: 'Divider', count: 1 };
}
