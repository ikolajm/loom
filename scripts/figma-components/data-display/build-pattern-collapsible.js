// =============================================================================
// Collapsible — Frame Pattern Mock
// =============================================================================
// Single collapsible panel with trigger + content. Simpler than accordion.
// Demonstrates md size in open state with chevron indicator.
// =============================================================================

function buildPatternCollapsible(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primIconSize } = lookups;
  const config = CONFIG.components.collapsible;
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-collapsible', lookups);
  addHeader(frame, 'Collapsible', 'Frame pattern — single expandable panel. Trigger + content area.');

  const wrapper = figma.createFrame();
  wrapper.name = 'collapsible-mock';
  wrapper.layoutMode = 'VERTICAL';
  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'FIXED';
  wrapper.resize(320, wrapper.height);
  wrapper.fills = [];
  wrapper.itemSpacing = 0;

  if (colors.border && colors.border !== 'none') {
    const borderVar = semColors[colors.border];
    if (borderVar) { wrapper.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', borderVar)]; wrapper.strokeWeight = 1; }
  }

  // Trigger row
  const trigger = figma.createFrame();
  trigger.name = 'trigger';
  trigger.layoutMode = 'HORIZONTAL';
  trigger.primaryAxisSizingMode = 'AUTO';
  trigger.counterAxisSizingMode = 'AUTO';
  trigger.primaryAxisAlignItems = 'SPACE_BETWEEN';
  trigger.counterAxisAlignItems = 'CENTER';
  trigger.fills = [];

  const hVar = primSpacing[resolveHeight(md['trigger-height'])];
  if (hVar) trigger.setBoundVariable('height', hVar);
  const txp = resolveScale(md['trigger-x-padding']); if (txp) { const v = primSpacing[txp]; if (v) { trigger.setBoundVariable('paddingLeft', v); trigger.setBoundVariable('paddingRight', v); } }

  const fgVar = semColors['color/surface/on-surface'];
  const triggerText = figma.createText();
  triggerText.name = 'trigger-label';
  triggerText.characters = 'More details';
  applyTextStyle(triggerText, 'action', 'md');
  if (fgVar) triggerText.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', fgVar
  )];
  trigger.appendChild(triggerText);

  // Chevron indicator — same pattern as accordion
  const chevronComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/chevron-down');
  if (chevronComp) {
    const chevron = chevronComp.createInstance();
    chevron.name = 'indicator';
    const iconPath = resolveIcon(md.indicator);
    const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
    if (iconSizeVar) { chevron.setBoundVariable('width', iconSizeVar); chevron.setBoundVariable('height', iconSizeVar); }
    if (fgVar) {
      const vecs = chevron.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
      const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar)];
      for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
    }
    trigger.appendChild(chevron);
  }
  wrapper.appendChild(trigger);
  trigger.layoutSizingHorizontal = 'FILL';

  // Content area (open state)
  const content = figma.createFrame();
  content.name = 'content';
  content.layoutMode = 'VERTICAL';
  content.primaryAxisSizingMode = 'AUTO';
  content.counterAxisSizingMode = 'AUTO';
  content.fills = [];

  const cp = resolveScale(md['content-padding']); if (cp) { const v = primSpacing[cp]; if (v) { content.setBoundVariable('paddingLeft', v); content.setBoundVariable('paddingRight', v); content.setBoundVariable('paddingTop', v); content.setBoundVariable('paddingBottom', v); } }

  const contentFg = semColors['color/surface/on-surface-variant'];
  const contentText = figma.createText();
  contentText.name = 'content-text';
  contentText.characters = 'Expanded content goes here. This area accepts any child content.';
  applyTextStyle(contentText, 'body', 'md');
  // text wraps within parent width
  if (contentFg) contentText.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }, 'color', contentFg
  )];
  content.appendChild(contentText);
  contentText.layoutSizingHorizontal = 'FILL';
  wrapper.appendChild(content);
  content.layoutSizingHorizontal = 'FILL';

  frame.appendChild(wrapper);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Collapsible', count: 1 };
}
