#!/usr/bin/env node
/**
 * Figma Script Assembler
 *
 * Single entry point for producing all Figma Plugin API scripts.
 * Produces:
 *   00_shared-utils.js  — paste first, defines all helper functions globally
 *   01-16 step scripts  — slim files with just CONFIG + logic, wrapped in IIFE
 *
 * Figma receives the token half: variables, text styles, effect styles, and the page
 * layout that holds them. It does not receive components. Figma has no notion of a
 * class, so the class layer has no representation here — and a Figma component was
 * only ever a snapshot of one combination, not the rule that generates it. See
 * docs/decisions/2026-08-18_class-layer-is-the-deliverable.md.
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

const defaultMode = layout['default-mode'] || 'light';

// --- Shared Utils Assembly ---

function buildSharedUtils() {
  const sources = [
    // Primitive helpers
    path.join(SCRIPTS_DIR, 'figma-primitives/_shared.js'),
    // Semantic helpers
    path.join(SCRIPTS_DIR, 'figma-semantics/_shared.js'),
    // Font resolution + weight mapping, used by the text-styles step
    path.join(SCRIPTS_DIR, 'figma-styles/_shared.js'),
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

  // text-styles calls weightToStyleName(familyName, weight); figma-styles/_shared.js
  // defines fontStyle(weight, familyName). Alias with the arguments swapped.
  combined += `\n\nfunction weightToStyleName(familyName, weight) { return fontStyle(weight, familyName); }`;

  // Make the bundle re-runnable in a persistent console. The Figma plugin
  // console keeps scope across pastes, so a second paste of 00 (e.g. after a
  // utils edit mid-iteration) throws "redeclaration of const X" on the first
  // top-level const — and silently halts, so every later definition (and any
  // fix in it) never loads. Rewriting top-level (column-0) const/let to var
  // lets a re-paste redefine cleanly. Function-internal declarations are
  // indented, so they're untouched and stay block-scoped.
  combined = combined.replace(/^(const|let)\b/gm, 'var');

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

function omitNotes(o) {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('$')));
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

  primStep(1, 'color', { palette: colors.palette, derived: colors.$derived || {} }, 'color.js');
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

  // Opacity leads the semantics because it is the only one that aliases nothing —
  // it has no primitive layer to be pasted after.
  semStep(9, 'opacity', omitNotes(standards.effects.opacity), 'opacity.js');
  // Substitute each {fill.family.shade} with the shade the generator actually landed on
  // (colors.$fillShades). The Figma step aliases roles to primitive colour variables by
  // name, so it cannot resolve {fill.*} itself — and must not guess the intent shade,
  // because the resolver moves it whenever AA demands.
  //
  // A missing entry throws here rather than emitting the raw template. It happened once:
  // a stale spec/config/local/ predating $fillShades took precedence over a freshly
  // regenerated committed set, and the unresolved template travelled all the way into
  // the Figma console before anything complained. Failing in Node names the cause and
  // the fix; failing in the plugin console names neither.
  const resolvedModes = {};
  for (const [mode, groups] of Object.entries(standards.colors.modes)) {
    resolvedModes[mode] = {};
    for (const [group, roles] of Object.entries(groups)) {
      resolvedModes[mode][group] = {};
      for (const [role, template] of Object.entries(roles)) {
        if (typeof template === 'string' && template.startsWith('{fill.')) {
          const landed = colors.$fillShades && colors.$fillShades[mode] && colors.$fillShades[mode][role];
          if (!landed) {
            throw new Error(
              `No $fillShades entry for ${mode}.${role} (template ${template}).\n` +
                `  The active colors.json predates the fill resolver — regenerate it:\n` +
                `    npm run configs                 (your brand, spec/config/local/)\n` +
                `    npm run configs -- --input spec/answers.example.json --default-set   (maintainers)`
            );
          }
          resolvedModes[mode][group][role] = `{palette.${landed}}`;
        } else {
          resolvedModes[mode][group][role] = template;
        }
      }
    }
  }
  semStep(10, 'color', { defaultMode: colors['default-mode'], modes: resolvedModes }, 'color.js');
  semStep(11, 'spacing', spacing.categories, 'spacing.js');
  semStep(12, 'radius', sizing['border-radius'], 'radius.js');
  semStep(13, 'component-height', sizing['component-height'], 'component-height.js');

  // --- Styles ---
  const stylesDir = path.join(SCRIPTS_DIR, 'figma-styles');

  function styleStep(num, collection, config, templateFile) {
    let template = fs.readFileSync(path.join(stylesDir, templateFile), 'utf-8');
    const pipelineMarker = template.indexOf('// --- Pipeline ---');
    if (pipelineMarker !== -1) template = template.slice(pipelineMarker);
    steps.push(slim(`${String(num).padStart(2, '0')}_styles_${collection}`, `${jsonLine('CONFIG', config)}\n${template}`));
  }

  styleStep(14, 'text-styles', { families: typography.families, textStyles: typography.textStyles }, 'text-styles.js');
  styleStep(15, 'effect-styles', { shadow: effects.shadow, properties: effects['shadow-properties'] }, 'effect-styles.js');

  // --- Layout ---
  const layoutDir = path.join(SCRIPTS_DIR, 'figma-layout');
  {
    let template = fs.readFileSync(path.join(layoutDir, 'layout.js'), 'utf-8');
    const pipelineMarker = template.indexOf('// --- Pipeline ---');
    if (pipelineMarker !== -1) template = template.slice(pipelineMarker);
    steps.push(slim('16_layout', `${jsonLine('CONFIG', layout)}\n${template}`));
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
