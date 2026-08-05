// =============================================================================
// FAB Menu — Frame Pattern Mock
// =============================================================================
// M3 speed-dial: a trigger FAB that expands into a vertical stack of action
// buttons (each an optional label + smaller circular button). Shown in the
// open state — the expand/collapse animation wraps via the motion library and is
// gated on that adoption decision (CATALOG_SPEC.md, "Scope").
// NOT a component — frame pattern for per-project application.
// =============================================================================

function buildFabMenu(lookups, defaultMode, page) {
  const { semColors, semRadius, primHeight, primIconSize, primSpacing } = lookups;
  const config = CONFIG.components['fab-menu'];
  const colors = config.variants.default;
  const bgVar = semColors[colors.bg];
  const fgVar = semColors[colors.fg];
  const labelCfg = config['action-label'];

  const frame = createSectionFrame('base.fab-menu', lookups);
  addHeader(frame, 'FAB Menu', 'Frame pattern — speed-dial. Trigger FAB expands into a stack of action buttons. Shown open; the expand animation is not built yet.');

  function getEffectStyle(configRef) {
    if (!configRef || configRef === 'none') return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === configRef.replace('effects/shadow-', 'shadow/')) || null;
  }

  function bindRadius(node, radVar) {
    if (!radVar) return;
    node.setBoundVariable('topLeftRadius', radVar);
    node.setBoundVariable('topRightRadius', radVar);
    node.setBoundVariable('bottomLeftRadius', radVar);
    node.setBoundVariable('bottomRightRadius', radVar);
  }

  // Circular icon button (trigger or action), sized from a height token.
  function circleButton(sz) {
    const comp = figma.createFrame();
    comp.name = 'fab-circle';
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';

    const hPath = resolveHeight(sz.size);
    const hVar = hPath ? primHeight[hPath] : null;
    if (hVar) {
      comp.setBoundVariable('width', hVar);
      comp.setBoundVariable('height', hVar);
      comp.primaryAxisSizingMode = 'FIXED';
      comp.counterAxisSizingMode = 'FIXED';
    }

    if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
    )];
    bindRadius(comp, semRadius[sz.radius]);
    const effectStyle = getEffectStyle(sz.shadow);
    if (effectStyle) comp.effectStyleId = effectStyle.id;

    const iconPath = resolveIcon(sz['icon-size']);
    const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
    const icon = makeIcon('icon/placeholder', fgVar, iconSizeVar);
    if (icon) { icon.name = 'icon'; comp.appendChild(icon); }
    return comp;
  }

  // Pill label rendered to the left of an action button.
  function actionLabel(text) {
    const pill = figma.createFrame();
    pill.name = 'action-label';
    pill.layoutMode = 'HORIZONTAL';
    pill.primaryAxisSizingMode = 'AUTO';
    pill.counterAxisSizingMode = 'AUTO';
    pill.counterAxisAlignItems = 'CENTER';

    const xpPath = resolveScale(labelCfg['x-padding']);
    if (xpPath) { const v = primSpacing[xpPath]; if (v) { pill.setBoundVariable('paddingLeft', v); pill.setBoundVariable('paddingRight', v); } }
    const ypPath = resolveScale(labelCfg['y-padding']);
    if (ypPath) { const v = primSpacing[ypPath]; if (v) { pill.setBoundVariable('paddingTop', v); pill.setBoundVariable('paddingBottom', v); } }

    const pillBg = semColors[labelCfg.bg];
    if (pillBg) pill.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', pillBg
    )];
    bindRadius(pill, semRadius[labelCfg.radius]);

    const txt = figma.createText();
    txt.name = 'label';
    txt.characters = text;
    applyTextStyle(txt, 'label', 'sm');
    const pillFg = semColors[labelCfg.fg];
    if (pillFg) txt.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', pillFg
    )];
    pill.appendChild(txt);
    return pill;
  }

  // Action row — label pill + action circle, right-aligned.
  function actionRow(text) {
    const row = figma.createFrame();
    row.name = 'action';
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 12;
    row.fills = [];
    row.clipsContent = false;
    row.appendChild(actionLabel(text));
    row.appendChild(circleButton(config['action-sizes'].md));
    return row;
  }

  // Open speed-dial stack — actions above, trigger at the bottom, right-aligned.
  const stack = figma.createFrame();
  stack.name = 'fab-menu-open';
  stack.layoutMode = 'VERTICAL';
  stack.primaryAxisSizingMode = 'AUTO';
  stack.counterAxisSizingMode = 'AUTO';
  stack.counterAxisAlignItems = 'MAX';
  stack.fills = [];
  stack.clipsContent = false;
  const gapPath = resolveScale(config['stack-spacing'].md);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) stack.setBoundVariable('itemSpacing', v); }

  stack.appendChild(actionRow('Share'));
  stack.appendChild(actionRow('Edit'));
  stack.appendChild(circleButton(config['trigger-sizes'].md));

  frame.appendChild(stack);
  setDefaultMode(frame, defaultMode);

  return { name: 'FAB Menu', count: 1 };
}
