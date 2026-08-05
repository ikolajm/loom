#!/usr/bin/env node
/**
 * Figma Script Assembler
 *
 * Single entry point for producing all Figma Plugin API scripts.
 * Produces:
 *   00_shared-utils.js  — paste first, defines all helper functions globally
 *   01-30 step scripts  — slim files with just CONFIG + logic, wrapped in IIFE
 *
 * Usage:
 *   node scripts/assemble-figma.js                    — writes to generated/figma-scripts/
 *   node scripts/assemble-figma.js --output ./out     — writes to custom path
 *   node scripts/assemble-figma.js --list             — list all scripts
 */
const fs = require('fs');
const path = require('path');

// --- Paths ---
const ROOT = path.resolve(__dirname, '..');
const CONFIG_ROOT = path.join(ROOT, 'spec/config');
const SCRIPTS_DIR = __dirname;

// --- Load configs ---
// Prefers spec/config/local/ over the committed set — see scripts/config-paths.js.
const { loadConfig: load } = require('./config-paths');
const standards = load('standards.json');
const colors = load('base/colors.json');
const spacing = load('base/spacing.json');
const sizing = load('base/sizing.json');
const typography = load('base/typography.json');
const effects = load('base/effects.json');
const layout = load('presentation/layout.json');
const templates = load('presentation/templates.json');
const colorPalette = load('figma/color-palette.json');
const buttonConfig = load('components/button.json');
const formConfig = load('components/form.json');
const layoutConfig = load('components/layout.json');
const feedbackConfig = load('components/feedback.json');
const dataDisplayConfig = load('components/data-display.json');
const navigationConfig = load('components/navigation.json');
const compositeConfig = load('components/composite.json');

const defaultMode = layout['default-mode'] || 'light';
const { ICONS } = require('./figma-icons/orchestrator');

// --- Shared Utils Assembly ---

function buildSharedUtils() {
  const sources = [
    // Primitive helpers
    path.join(SCRIPTS_DIR, 'figma-primitives/_shared.js'),
    // Semantic helpers
    path.join(SCRIPTS_DIR, 'figma-semantics/_shared.js'),
    // Component helpers
    path.join(SCRIPTS_DIR, 'figma-components/utils/lookups.js'),
    path.join(SCRIPTS_DIR, 'figma-components/utils/resolvers.js'),
    path.join(SCRIPTS_DIR, 'figma-components/utils/frames.js'),
    path.join(SCRIPTS_DIR, 'figma-components/utils/reflow.js'),
    path.join(SCRIPTS_DIR, 'figma-components/utils/builders/standard.js'),
    path.join(SCRIPTS_DIR, 'figma-components/utils/builders/toggle.js'),
  ];

  // Read and strip comments from each source
  let combined = sources
    .map(p => {
      let src = fs.readFileSync(p, 'utf-8');
      // Strip block comments and line comments, collapse blank lines
      src = src.replace(/\/\*[\s\S]*?\*\//g, '');
      src = src.replace(/^(\s*)\/\/.*$/gm, '');
      src = src.replace(/\n{3,}/g, '\n\n');
      return src.trim();
    })
    .join('\n\n');

  // Add resolveValue (from semantics color — needed for semantic color script)
  combined += `\n\nfunction resolveValue(value, primitives) {
  if (typeof value === 'string' && value.startsWith('{palette.')) {
    const match = value.match(/\\{palette\\.(\\w+)\\.(\\w+)\\}/);
    if (match) {
      const primName = 'color/' + match[1] + '/' + match[2];
      const primVar = primitives[primName];
      if (primVar) return { alias: primVar };
      throw new Error('Primitive ' + primName + ' not found for value "' + value + '"');
    }
  }
  if (typeof value === 'string' && value.startsWith('#')) return { direct: hexToFigmaColor(value) };
  if (typeof value === 'string' && value.startsWith('rgba')) return { direct: rgbaToFigmaColor(value) };
  throw new Error('Cannot resolve color value: "' + value + '"');
}`;

  // weightToStyleName is now included via resolvers.js (with FONT_WEIGHT_OVERRIDES).
  // Alias with swapped arg order: text-styles calls weightToStyleName(familyName, weight),
  // resolvers defines fontStyle(weight, familyName).
  combined += `\n\nfunction weightToStyleName(familyName, weight) { return fontStyle(weight, familyName); }`;

  // Make the bundle re-runnable in a persistent console. The Figma plugin
  // console keeps scope across pastes, so a second paste of 00 (e.g. after a
  // utils edit mid-iteration) throws "redeclaration of const X" on the first
  // top-level const — and silently halts, so every later definition (and any
  // fix in it) never loads. Rewriting top-level (column-0) const/let to var
  // lets a re-paste redefine cleanly. Function-internal declarations are
  // indented, so they're untouched and stay block-scoped.
  combined = combined.replace(/^(const|let)\b/gm, 'var');

  // Deduplicate: buildLookup and bLookup are the same function.
  // The component utils use bLookup, semantic/style/layout use buildLookup.
  // Both are defined — no conflict since they have different names.
  // Just ensure both exist.

  return `// =============================================================================
// Shared Figma Plugin API Utilities
// Paste this FIRST. Defines all helper functions in the global console scope.
// All subsequent scripts access these functions.
// =============================================================================
${combined}`;
}

// --- Slim Script Builder ---

function slim(name, code) {
  return { name, script: `(async () => {\n${code}\n})()` };
}

function jsonLine(varName, data) {
  return `const ${varName} = ${JSON.stringify(data)};`;
}

// --- Step Definitions ---

function buildAllSteps() {
  const steps = [];

  // --- Primitives ---
  const primTemplateDir = path.join(SCRIPTS_DIR, 'figma-primitives');

  function primStep(num, collection, config, templateFile) {
    // Read template, strip the inlined _shared.js helpers (everything before "// --- Pipeline ---")
    let template = fs.readFileSync(path.join(primTemplateDir, templateFile), 'utf-8');
    const pipelineMarker = template.indexOf('// --- Pipeline ---');
    if (pipelineMarker !== -1) template = template.slice(pipelineMarker);
    steps.push(slim(`${String(num).padStart(2, '0')}_primitives_${collection}`, `${jsonLine('CONFIG', config)}\n${template}`));
  }

  primStep(1, 'color', colors.palette, 'color.js');
  primStep(2, 'spacing', standards.spacing.scale, 'spacing.js');
  primStep(3, 'radius', standards.sizing['border-radius'], 'radius.js');
  primStep(4, 'border-width', standards.sizing['border-width'], 'border-width.js');
  primStep(5, 'component-height', standards.sizing['component-height'], 'component-height.js');
  primStep(6, 'icon-size', standards.sizing['icon-size'], 'icon-size.js');
  primStep(7, 'typography', { families: typography.families, textStyles: typography.textStyles }, 'typography.js');
  primStep(8, 'effects', effects['shadow-properties'], 'effects.js');

  // --- Semantics ---
  const semTemplateDir = path.join(SCRIPTS_DIR, 'figma-semantics');

  function semStep(num, collection, config, templateFile) {
    let template = fs.readFileSync(path.join(semTemplateDir, templateFile), 'utf-8');
    const pipelineMarker = template.indexOf('// --- Pipeline ---');
    if (pipelineMarker !== -1) template = template.slice(pipelineMarker);
    steps.push(slim(`${String(num).padStart(2, '0')}_semantics_${collection}`, `${jsonLine('CONFIG', config)}\n${template}`));
  }

  semStep(9, 'color', { defaultMode: colors['default-mode'], modes: standards.colors.modes }, 'color.js');
  semStep(10, 'spacing', spacing.categories, 'spacing.js');
  semStep(11, 'radius', sizing['border-radius'], 'radius.js');

  // --- Styles ---
  const stylesDir = path.join(SCRIPTS_DIR, 'figma-styles');

  function styleStep(num, collection, config, templateFile) {
    let template = fs.readFileSync(path.join(stylesDir, templateFile), 'utf-8');
    const pipelineMarker = template.indexOf('// --- Pipeline ---');
    if (pipelineMarker !== -1) template = template.slice(pipelineMarker);
    steps.push(slim(`${String(num).padStart(2, '0')}_styles_${collection}`, `${jsonLine('CONFIG', config)}\n${template}`));
  }

  styleStep(12, 'text-styles', { families: typography.families, textStyles: typography.textStyles }, 'text-styles.js');
  styleStep(13, 'effect-styles', { shadow: effects.shadow, properties: effects['shadow-properties'] }, 'effect-styles.js');

  // --- Layout ---
  const layoutDir = path.join(SCRIPTS_DIR, 'figma-layout');
  {
    let template = fs.readFileSync(path.join(layoutDir, 'layout.js'), 'utf-8');
    const pipelineMarker = template.indexOf('// --- Pipeline ---');
    if (pipelineMarker !== -1) template = template.slice(pipelineMarker);
    steps.push(slim('14_layout', `${jsonLine('CONFIG', layout)}\n${template}`));
  }

  // --- Templates + Core Page ---
  // These use the component orchestrator's assembly logic for custom scripts
  const compOrch = require('./figma-components/orchestrator');

  // Templates: use the orchestrator but strip shared utils, keep custom builders
  {
    const scripts = compOrch.assembleScript('templates');
    for (const s of scripts) {
      let code = s.script;
      code = code.replace(/^\(async \(\) => \{/, '').replace(/\}\)\(\)$/, '');
      const utilsStart = code.indexOf('// --- INLINED UTILS ---');
      const customStart = code.indexOf('// --- CUSTOM BUILDERS ---');
      const pageStart = code.indexOf('// --- PAGE SCRIPT ---');
      if (utilsStart !== -1 && pageStart !== -1) {
        if (customStart !== -1) {
          code = code.slice(0, utilsStart) + code.slice(customStart);
        } else {
          code = code.slice(0, utilsStart) + code.slice(pageStart);
        }
      }
      steps.push(slim('15_templates', code.trim()));
    }
  }

  // Core page
  {
    const scripts = compOrch.assembleScript('core-page');
    for (const s of scripts) {
      let code = s.script;
      code = code.replace(/^\(async \(\) => \{/, '').replace(/\}\)\(\)$/, '');
      const utilsStart = code.indexOf('// --- INLINED UTILS ---');
      const buildStart = code.indexOf('// --- BUILD SCRIPT ---');
      if (utilsStart !== -1 && buildStart !== -1) {
        code = code.slice(0, utilsStart) + code.slice(buildStart);
      }
      steps.push(slim('16_core-page', code.trim()));
    }
  }

  // --- Component Pages ---
  const componentPages = [
    { name: 'buttons', num: 17 },
    { name: 'forms', num: null },
    { name: 'layout-page', num: null },
    { name: 'feedback', num: null },
    { name: 'data-display', num: null },
    { name: 'navigation', num: null },
    { name: 'composite', num: null },
  ];

  let stepNum = 17;
  for (const page of componentPages) {
    const scripts = compOrch.assembleScript(page.name);
    for (const s of scripts) {
      let code = s.script;
      // Remove IIFE wrapper
      code = code.replace(/^\(async \(\) => \{/, '').replace(/\}\)\(\)$/, '');
      // Remove shared utils but keep custom builders
      const utilsStart = code.indexOf('// --- INLINED UTILS ---');
      const customStart = code.indexOf('// --- CUSTOM BUILDERS ---');
      const pageStart = code.indexOf('// --- PAGE SCRIPT ---');
      if (utilsStart !== -1 && pageStart !== -1) {
        if (customStart !== -1) {
          // Has custom builders — strip from INLINED UTILS to CUSTOM BUILDERS, keep rest
          code = code.slice(0, utilsStart) + code.slice(customStart);
        } else {
          // No custom builders — strip from INLINED UTILS to PAGE SCRIPT
          code = code.slice(0, utilsStart) + code.slice(pageStart);
        }
      }
      const scriptName = scripts.length === 1 ? page.name : s.name;
      steps.push(slim(`${String(stepNum).padStart(2, '0')}_${scriptName}`, code.trim()));
      stepNum++;
    }
  }

  return steps;
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  const outputDir = args.includes('--output')
    ? (() => {
        const idx = args.indexOf('--output');
        return (args[idx + 1] && !args[idx + 1].startsWith('--'))
          ? path.resolve(args[idx + 1])
          : path.resolve(ROOT, 'generated/figma-scripts');
      })()
    : path.resolve(ROOT, 'generated/figma-scripts');

  if (args.includes('--list')) {
    const sharedUtils = buildSharedUtils();
    const steps = buildAllSteps();
    console.log(`00_shared-utils.js (${sharedUtils.length} chars) — paste first`);
    for (const s of steps) {
      console.log(`${s.name}.js (${s.script.length} chars)`);
    }
    console.log(`\nTotal: ${steps.length + 1} scripts`);
    process.exit(0);
  }

  // Build and write
  fs.mkdirSync(outputDir, { recursive: true });

  // Sweep stale outputs first — this dir is fully owned + regenerated, so a rename
  // or renumber must not leave orphans behind (the pre-numbering forms_*.js were
  // exactly that). Clear all .js, then write fresh.
  for (const f of fs.readdirSync(outputDir)) {
    if (f.endsWith('.js')) fs.unlinkSync(path.join(outputDir, f));
  }

  const sharedUtils = buildSharedUtils();
  const sharedPath = path.join(outputDir, '00_shared-utils.js');
  fs.writeFileSync(sharedPath, sharedUtils);
  console.log(`00_shared-utils: ${sharedUtils.length} chars`);

  const steps = buildAllSteps();
  for (const s of steps) {
    const outPath = path.join(outputDir, `${s.name}.js`);
    fs.writeFileSync(outPath, s.script);
    console.log(`${s.name}: ${s.script.length} chars`);
  }

  console.log(`\nTotal: ${steps.length + 1} scripts → ${outputDir}`);
}

module.exports = { buildSharedUtils, buildAllSteps };
