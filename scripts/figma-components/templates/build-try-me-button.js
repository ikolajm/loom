// =============================================================================
// Try Me Button — Template Component
// =============================================================================
// Monochrome on purpose: it is chrome around a specimen, not a specimen.
// Absolutely positioned in interactive previews.
// Appended directly to page — no base/preview framing.
// =============================================================================

function buildTryMeButton(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primIconSize, primBW } = lookups;

  const comp = figma.createComponent();
  comp.name = 'template/try-me-button';
  comp.layoutMode = 'HORIZONTAL';
  comp.primaryAxisAlignItems = 'CENTER';
  comp.counterAxisAlignItems = 'CENTER';
  comp.primaryAxisSizingMode = 'AUTO';

  const hVar = heights['height/3'];
  if (hVar) { comp.setBoundVariable('height', hVar); comp.counterAxisSizingMode = 'FIXED'; }

  const xp = primSpacing[resolveScale('{scale.3}')];
  if (xp) { comp.setBoundVariable('paddingLeft', xp); comp.setBoundVariable('paddingRight', xp); }
  const yp = primSpacing[resolveScale('{scale.1}')];
  if (yp) { comp.setBoundVariable('paddingTop', yp); comp.setBoundVariable('paddingBottom', yp); }

  const gap = primSpacing[resolveScale('{scale.1}')];
  if (gap) comp.setBoundVariable('itemSpacing', gap);

  const rad = semRadius['radius/component'];
  if (rad) { comp.setBoundVariable('topLeftRadius', rad); comp.setBoundVariable('topRightRadius', rad); comp.setBoundVariable('bottomLeftRadius', rad); comp.setBoundVariable('bottomRightRadius', rad); }

  const surfaceVar = semColors['color/surface/surface'];
  if (surfaceVar) comp.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.949, g: 0.945, b: 0.953 } }, 'color', surfaceVar
  )];

  const onSurfaceVar = semColors['color/surface/on-surface'];
  if (onSurfaceVar) comp.strokes = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.098, g: 0.094, b: 0.106 } }, 'color', onSurfaceVar
  )];
  const bw1 = primBW['border-width/1'];
  if (bw1) comp.setBoundVariable('strokeWeight', bw1);

  const effectStyles = figma.getLocalEffectStyles();
  const shadow2 = effectStyles.find(s => s.name === 'shadow/2');
  if (shadow2) comp.effectStyleId = shadow2.id;

  const mouseIcon = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/mouse-pointer-click');
  if (mouseIcon) {
    const iconInst = mouseIcon.createInstance();
    iconInst.name = 'icon';
    const iconSz = primIconSize['icon/1'];
    if (iconSz) { iconInst.setBoundVariable('width', iconSz); iconInst.setBoundVariable('height', iconSz); }
    if (onSurfaceVar) {
      const vecs = iconInst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
      const paint = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.098, g: 0.094, b: 0.106 } }, 'color', onSurfaceVar
      )];
      for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
    }
    comp.appendChild(iconInst);
  }

  const label = figma.createText();
  label.name = 'label';
  label.characters = 'Try Me!';
  applyTextStyle(label, 'action', 'sm');
  if (onSurfaceVar) label.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.098, g: 0.094, b: 0.106 } }, 'color', onSurfaceVar
  )];
  comp.appendChild(label);

  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  if (sysFrame) sysFrame.appendChild(comp);
  else page.appendChild(comp);

  return { name: 'Try Me Button', count: 1 };
}
