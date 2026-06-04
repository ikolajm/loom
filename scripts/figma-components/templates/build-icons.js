// =============================================================================
// Icons — Lucide icon components
// =============================================================================
// 16x16 stroke-based vectors from Lucide SVG data.
// Built inside the "System Components" frame's Icons row.
// Icon data injected via CONFIG.icons by orchestrator.
// =============================================================================

function buildIcons(lookups, defaultMode, page) {
  const FRAME_SIZE = 16;

  // Find System Components frame
  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  if (!sysFrame) throw new Error('System Components frame not found — run build-system-frame first');

  // Create Icons row
  const iconsRow = figma.createFrame();
  iconsRow.name = 'Icons';
  iconsRow.layoutMode = 'HORIZONTAL';
  iconsRow.layoutWrap = 'WRAP';
  iconsRow.itemSpacing = 8;
  iconsRow.counterAxisSpacing = 8;
  iconsRow.primaryAxisSizingMode = 'AUTO';
  iconsRow.counterAxisSizingMode = 'AUTO';
  iconsRow.fills = [];
  sysFrame.appendChild(iconsRow);

  const icons = CONFIG.icons || [];
  let count = 0;

  for (const iconDef of icons) {
    const comp = figma.createComponent();
    comp.name = `icon/${iconDef.name}`;
    comp.resize(FRAME_SIZE, FRAME_SIZE);
    comp.fills = [];
    comp.clipsContent = true;

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_SIZE}" height="${FRAME_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconDef.svg}</svg>`;
    const node = figma.createNodeFromSvg(svgString);
    while (node.children.length > 0) { comp.appendChild(node.children[0]); }
    node.remove();

    for (const child of comp.children) {
      child.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    }

    comp.description = `Lucide icon: ${iconDef.name}`;
    iconsRow.appendChild(comp);
    count++;
  }

  return { name: 'Icons', count: count };
}
