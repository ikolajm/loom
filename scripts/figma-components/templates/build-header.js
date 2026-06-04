// =============================================================================
// Header — Template Component Set
// =============================================================================
// 4 variants: size (sm/lg) × divider (on/off)
// Title + optional description + optional divider instance.
// Appended directly to page — no base/preview framing.
// =============================================================================

function buildHeader(lookups, defaultMode, page) {
  const { layoutVars, primSpacing } = lookups;

  const titleColorVar = layoutVars['layout/page-foreground'];
  const descColorVar = layoutVars['layout/page-foreground-muted'];
  const descGapVar = primSpacing[resolveScale('{scale.1}')];

  const textStyles = figma.getLocalTextStyles();
  const titleStyleObj = textStyles.find(s => s.name === 'title/lg');
  const subtitleStyleObj = textStyles.find(s => s.name === 'title/md');
  const bodyStyleObj = textStyles.find(s => s.name === 'body/md');

  const dividerComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'template/divider');

  const variants = [];

  for (const size of ['sm', 'lg']) {
    for (const divOn of ['off', 'on']) {
      const comp = figma.createComponent();
      comp.name = `size=${size}, divider=${divOn}`;
      comp.layoutMode = 'VERTICAL';
      comp.primaryAxisSizingMode = 'AUTO';
      comp.counterAxisSizingMode = 'AUTO';
      if (descGapVar) comp.setBoundVariable('itemSpacing', descGapVar);
      comp.fills = [];

      const titleText = figma.createText();
      titleText.name = 'title';
      titleText.characters = 'Section Title';
      const tStyle = size === 'lg' ? titleStyleObj : subtitleStyleObj;
      if (tStyle) titleText.textStyleId = tStyle.id;
      if (titleColorVar) titleText.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', titleColorVar
      )];
      comp.appendChild(titleText);

      const descText = figma.createText();
      descText.name = 'description';
      descText.characters = 'Section description text.';
      if (bodyStyleObj) descText.textStyleId = bodyStyleObj.id;
      if (descColorVar) descText.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }, 'color', descColorVar
      )];
      comp.appendChild(descText);
      descText.layoutSizingHorizontal = 'FILL';

      const showDescKey = comp.addComponentProperty('showDescription', 'BOOLEAN', true);
      descText.componentPropertyReferences = { 'visible': showDescKey };

      if (divOn === 'on' && dividerComp) {
        const divInst = dividerComp.createInstance();
        divInst.name = 'divider';
        comp.appendChild(divInst);
        divInst.layoutSizingHorizontal = 'FILL';
      }

      variants.push(comp);
    }
  }

  const sysFrame = page.findChild(n => n.name === 'System Components' && n.type === 'FRAME');
  const set = figma.combineAsVariants(variants, sysFrame || page);
  set.name = 'template/header';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  return { name: 'Header', count: set.children.length };
}
