// =============================================================================
// Try Me Button — Template Component
// =============================================================================
// Uses the project primary color, so the preview reads as the consumer's own.
// Absolutely positioned in interactive previews.
// Appended directly to page — no base/preview framing.
// =============================================================================

function buildTryMeButton(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primIconSize } = lookups;

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

  const primaryVar = semColors['color/primary/primary'];
  if (primaryVar) comp.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.627, g: 0.384, b: 0.918 } }, 'color', primaryVar
  )];

  const effectStyles = figma.getLocalEffectStyles();
  const shadow2 = effectStyles.find(s => s.name === 'shadow/2');
  if (shadow2) comp.effectStyleId = shadow2.id;

  const onPrimaryVar = semColors['color/primary/on-primary'];

  const mouseIcon = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/mouse-pointer-click');
  if (mouseIcon) {
    const iconInst = mouseIcon.createInstance();
    iconInst.name = 'icon';
    const iconSz = primIconSize['icon/1'];
    if (iconSz) { iconInst.setBoundVariable('width', iconSz); iconInst.setBoundVariable('height', iconSz); }
    if (onPrimaryVar) {
      const vecs = iconInst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
      const paint = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.141, g: 0.059, b: 0.243 } }, 'color', onPrimaryVar
      )];
      for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
    }
    comp.appendChild(iconInst);
  }

  const label = figma.createText();
  label.name = 'label';
  label.characters = 'Try Me!';
  applyTextStyle(label, 'action', 'sm');
  if (onPrimaryVar) label.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.141, g: 0.059, b: 0.243 } }, 'color', onPrimaryVar
  )];
  comp.appendChild(label);

  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  if (sysFrame) sysFrame.appendChild(comp);
  else page.appendChild(comp);

  return { name: 'Try Me Button', count: 1 };
}
