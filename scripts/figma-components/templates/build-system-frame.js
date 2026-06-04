// =============================================================================
// System Components Frame
// =============================================================================
// Creates the "System Components" container frame on Core page.
// Uses layout variables for styling. Must run FIRST.
// =============================================================================

function buildSystemFrame(lookups, defaultMode, page) {
  const { layoutVars, semRadius, primSpacing } = lookups;

  const sysFrame = figma.createFrame();
  sysFrame.name = 'System Components';
  sysFrame.layoutMode = 'VERTICAL';
  sysFrame.primaryAxisSizingMode = 'AUTO';
  sysFrame.counterAxisSizingMode = 'AUTO';

  // Background
  const bgVar = layoutVars['layout/frame-background'];
  if (bgVar) sysFrame.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.96, g: 0.96, b: 0.96 } }, 'color', bgVar
  )];

  // Padding
  const padVar = layoutVars['layout/frame-padding'];
  if (padVar) {
    sysFrame.setBoundVariable('paddingTop', padVar);
    sysFrame.setBoundVariable('paddingRight', padVar);
    sysFrame.setBoundVariable('paddingBottom', padVar);
    sysFrame.setBoundVariable('paddingLeft', padVar);
  }

  // Radius
  const radVar = layoutVars['layout/frame-radius'];
  if (radVar) {
    sysFrame.setBoundVariable('topLeftRadius', radVar);
    sysFrame.setBoundVariable('topRightRadius', radVar);
    sysFrame.setBoundVariable('bottomLeftRadius', radVar);
    sysFrame.setBoundVariable('bottomRightRadius', radVar);
  }

  // Gap
  const gapVar = layoutVars['layout/spacing/section-gap'];
  if (gapVar) sysFrame.setBoundVariable('itemSpacing', gapVar);

  page.appendChild(sysFrame);

  return { name: 'System Frame', count: 1 };
}
