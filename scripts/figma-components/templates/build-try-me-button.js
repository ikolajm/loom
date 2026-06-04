// =============================================================================
// Try Me Button — Template Component
// =============================================================================
// Agency-branded button using layout/accent color.
// Absolutely positioned in interactive previews.
// Appended directly to page — no base/preview framing.
// =============================================================================

function buildTryMeButton(lookups, defaultMode, page) {
  const { layoutVars, semRadius, primSpacing, primHeight, primIconSize } = lookups;

  const comp = figma.createComponent();
  comp.name = 'template/try-me-button';
  comp.layoutMode = 'HORIZONTAL';
  comp.primaryAxisAlignItems = 'CENTER';
  comp.counterAxisAlignItems = 'CENTER';
  comp.primaryAxisSizingMode = 'AUTO';

  const hVar = primHeight['height/3'];
  if (hVar) { comp.setBoundVariable('height', hVar); comp.counterAxisSizingMode = 'FIXED'; }

  const xp = primSpacing[resolveScale('{scale.3}')];
  if (xp) { comp.setBoundVariable('paddingLeft', xp); comp.setBoundVariable('paddingRight', xp); }
  const yp = primSpacing[resolveScale('{scale.1}')];
  if (yp) { comp.setBoundVariable('paddingTop', yp); comp.setBoundVariable('paddingBottom', yp); }

  const gap = primSpacing[resolveScale('{scale.1}')];
  if (gap) comp.setBoundVariable('itemSpacing', gap);

  const rad = semRadius['radius/component'];
  if (rad) { comp.setBoundVariable('topLeftRadius', rad); comp.setBoundVariable('topRightRadius', rad); comp.setBoundVariable('bottomLeftRadius', rad); comp.setBoundVariable('bottomRightRadius', rad); }

  const accentVar = layoutVars['layout/accent'];
  if (accentVar) comp.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.91, g: 0.12, b: 0.55 } }, 'color', accentVar
  )];

  const effectStyles = figma.getLocalEffectStyles();
  const shadow2 = effectStyles.find(s => s.name === 'shadow/2');
  if (shadow2) comp.effectStyleId = shadow2.id;

  const onAccentVar = layoutVars['layout/on-accent'];

  const mouseIcon = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/mouse-pointer-click');
  if (mouseIcon) {
    const iconInst = mouseIcon.createInstance();
    iconInst.name = 'icon';
    const iconSz = primIconSize['icon/1'];
    if (iconSz) { iconInst.setBoundVariable('width', iconSz); iconInst.setBoundVariable('height', iconSz); }
    if (onAccentVar) {
      const vecs = iconInst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
      const paint = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', onAccentVar
      )];
      for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
    }
    comp.appendChild(iconInst);
  }

  const label = figma.createText();
  label.name = 'label';
  label.characters = 'Try Me!';
  applyTextStyle(label, 'action', 'sm');
  if (onAccentVar) label.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', onAccentVar
  )];
  comp.appendChild(label);

  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  if (sysFrame) sysFrame.appendChild(comp);
  else page.appendChild(comp);

  return { name: 'Try Me Button', count: 1 };
}
