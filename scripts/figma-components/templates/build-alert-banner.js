// =============================================================================
// Alert Banner — Template Component Set
// =============================================================================
// 4 state variants: success, warning, error, info.
// Appended directly to page — no base/preview framing.
// =============================================================================

function buildAlertBanner(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primBW, primIconSize } = lookups;

  const captionStyle = figma.getLocalTextStyles().find(s => s.name === 'label/sm');
  const rad = semRadius['radius/component'];
  const bw2 = primBW['border-width/2'];
  const xp = primSpacing[resolveScale('{scale.4}')];
  const yp = primSpacing[resolveScale('{scale.2}')];
  const gap = primSpacing[resolveScale('{scale.1}')];

  const states = {
    success: { bg: 'color/success/success-container', border: 'color/success/success', fg: 'color/success/on-success-container', icon: 'icon/check-circle' },
    warning: { bg: 'color/warning/warning-container', border: 'color/warning/warning', fg: 'color/warning/on-warning-container', icon: 'icon/alert-triangle' },
    error:   { bg: 'color/error/error-container', border: 'color/error/error', fg: 'color/error/on-error-container', icon: 'icon/x-circle' },
    info:    { bg: 'color/info/info-container', border: 'color/info/info', fg: 'color/info/on-info-container', icon: 'icon/info' }
  };

  const variants = [];

  for (const [stateName, colors] of Object.entries(states)) {
    const comp = figma.createComponent();
    comp.name = `state=${stateName}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';

    const bgVar = semColors[colors.bg];
    if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
    )];

    const borderVar = semColors[colors.border];
    if (borderVar) {
      comp.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      if (bw2) comp.setBoundVariable('strokeWeight', bw2);
    }

    if (rad) { comp.setBoundVariable('topLeftRadius', rad); comp.setBoundVariable('topRightRadius', rad); comp.setBoundVariable('bottomLeftRadius', rad); comp.setBoundVariable('bottomRightRadius', rad); }
    if (xp) { comp.setBoundVariable('paddingLeft', xp); comp.setBoundVariable('paddingRight', xp); }
    if (yp) { comp.setBoundVariable('paddingTop', yp); comp.setBoundVariable('paddingBottom', yp); }
    if (gap) comp.setBoundVariable('itemSpacing', gap);

    const fgVar = semColors[colors.fg];
    const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === colors.icon);
    if (iconComp) {
      const iconInst = iconComp.createInstance();
      iconInst.name = 'icon';
      const iconSz = primIconSize['icon/1'];
      if (iconSz) { iconInst.setBoundVariable('width', iconSz); iconInst.setBoundVariable('height', iconSz); }
      if (fgVar) {
        const vecs = iconInst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
        const paint = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', fgVar
        )];
        for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
      }
      comp.appendChild(iconInst);
    }

    const text = figma.createText();
    text.name = 'text';
    text.characters = `${stateName.charAt(0).toUpperCase() + stateName.slice(1)} alert message.`;
    if (captionStyle) text.textStyleId = captionStyle.id;
    if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', fgVar
    )];
    comp.appendChild(text);
    text.layoutSizingHorizontal = 'FILL';

    variants.push(comp);
  }

  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  const set = figma.combineAsVariants(variants, sysFrame || page);
  set.name = 'template/alert-banner';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  return { name: 'Alert Banner', count: set.children.length };
}
