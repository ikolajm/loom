// =============================================================================
// File Upload — Frame Pattern Mock
// =============================================================================
// Dropzone variant — dashed border area with upload icon and instructions.
// Shows default and dragover states side by side.
// =============================================================================

function buildPatternFileUpload(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primIconSize, layoutVars } = lookups;
  const config = CONFIG.components['file-upload'];
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-file-upload', lookups);
  addHeader(frame, 'File Upload', 'Frame pattern — dropzone with dashed border. Default and dragover states.');

  const examples = figma.createFrame();
  examples.name = 'file-upload-examples';
  examples.layoutMode = 'HORIZONTAL';
  examples.primaryAxisSizingMode = 'AUTO';
  examples.counterAxisSizingMode = 'AUTO';
  examples.fills = [];
  const groupGapVar = layoutVars['layout/spacing/component-group-gap'];
  if (groupGapVar) examples.setBoundVariable('itemSpacing', groupGapVar);

  for (const [variantName, colors] of Object.entries(config.variants)) {
    const zone = figma.createFrame();
    zone.name = `dropzone-${variantName}`;
    zone.layoutMode = 'VERTICAL';
    zone.primaryAxisSizingMode = 'AUTO';
    zone.counterAxisSizingMode = 'FIXED';
    zone.primaryAxisAlignItems = 'CENTER';
    zone.counterAxisAlignItems = 'CENTER';
    zone.resize(240, zone.height);

    const bgVar = semColors[colors.bg];
    if (bgVar) zone.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
    )];

    const borderVar = semColors[colors.border];
    if (borderVar) {
      zone.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      zone.dashPattern = [6, 4];
      zone.strokeWeight = 2;
    }

    const radVar = semRadius[md.radius];
    if (radVar) {
      zone.setBoundVariable('topLeftRadius', radVar);
      zone.setBoundVariable('topRightRadius', radVar);
      zone.setBoundVariable('bottomLeftRadius', radVar);
      zone.setBoundVariable('bottomRightRadius', radVar);
    }

    const xpPath = resolveScale(md['x-padding']);
    if (xpPath) { const v = primSpacing[xpPath]; if (v) { zone.setBoundVariable('paddingLeft', v); zone.setBoundVariable('paddingRight', v); } }
    const ypPath = resolveScale(md['y-padding']);
    if (ypPath) { const v = primSpacing[ypPath]; if (v) { zone.setBoundVariable('paddingTop', v); zone.setBoundVariable('paddingBottom', v); } }
    const gapPath = resolveScale(md.gap);
    if (gapPath) { const v = primSpacing[gapPath]; if (v) zone.setBoundVariable('itemSpacing', v); }

    const fgVar = semColors[colors.fg];
    const iconFgVar = semColors[colors['icon-fg']];

    // Icon placeholder
    const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');
    if (iconComp) {
      const inst = iconComp.createInstance();
      inst.name = 'upload-icon';
      const iconPath = resolveIcon(md['icon-size']);
      const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
      if (iconSizeVar) { inst.setBoundVariable('width', iconSizeVar); inst.setBoundVariable('height', iconSizeVar); }
      if (iconFgVar) {
        const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
        const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', iconFgVar)];
        for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
      }
      zone.appendChild(inst);
    }

    const label = figma.createText();
    label.name = 'label';
    label.characters = variantName === 'dragover' ? 'Drop file here' : 'Drag & drop or click to upload';
    applyTextStyle(label, 'body', 'md');
    label.textAlignHorizontal = 'CENTER';
    if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    zone.appendChild(label);
    label.layoutSizingHorizontal = 'FILL';

    examples.appendChild(zone);
  }

  frame.appendChild(examples);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern File Upload', count: 2 };
}
