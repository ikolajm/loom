#!/usr/bin/env node
/**
 * Figma Component Build Orchestrator
 *
 * Assembles complete Figma Plugin API scripts from:
 *   - Per-component descriptor files (data-driven, in page folders)
 *   - Shared utility modules (in utils/ folder, selectively included)
 *   - Custom builder scripts (per-page composed/special components)
 *   - Config data (injected as constants)
 *
 * Assembly modes:
 *   1. Batched component pages — split into multiple scripts per page
 *      (selective builder inclusion, page clearing on first batch only,
 *      reflow on last batch only)
 *   2. Single component pages — all descriptors in one script (implicit single batch)
 *   3. Legacy templates — monolithic .js templates (templates, core-page)
 *
 * Usage:
 *   node orchestrator.js --list                    — list available builders
 *   node orchestrator.js --build buttons           — assemble buttons page script(s)
 *   node orchestrator.js --build all               — assemble all scripts in order
 *   node orchestrator.js --build forms --output    — write to /tmp/ files
 */
const fs = require('fs');
const path = require('path');

// --- Paths ---
const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
const UTILS_DIR = path.join(__dirname, 'utils');

// --- Load configs ---
function loadConfig(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, relativePath), 'utf-8'));
}

const { ICONS } = require('../figma-icons/orchestrator');
const standards = loadConfig('standards.json');
const colors = loadConfig('base/colors.json');
const spacing = loadConfig('base/spacing.json');
const sizing = loadConfig('base/sizing.json');
const typography = loadConfig('base/typography.json');
const effects = loadConfig('base/effects.json');
const layout = loadConfig('presentation/layout.json');
const templates = loadConfig('presentation/templates.json');
const colorPalette = loadConfig('figma/color-palette.json');
const buttonConfig = loadConfig('components/button.json');
const formConfig = loadConfig('components/form.json');
const layoutConfig = loadConfig('components/layout.json');
const feedbackConfig = loadConfig('components/feedback.json');
const dataDisplayConfig = loadConfig('components/data-display.json');
const navigationConfig = loadConfig('components/navigation.json');
const compositeConfig = loadConfig('components/composite.json');

// --- Utils module registry ---
// Base modules are always included. Builder modules are selectively included
// based on which builder types the batch's descriptors reference.
const BASE_MODULES = [
  'lookups.js',
  'resolvers.js',
  'frames.js',
  'reflow.js'
];

const BUILDER_MODULES = {
  'standard': 'builders/standard.js',
  'toggle': 'builders/toggle.js'
  // Future: 'pattern': 'builders/pattern.js'
};

/**
 * Strip comments from source code for inlining.
 * Removes // line comments, /* block comments, and collapses blank lines.
 */
function stripComments(src) {
  let result = src.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/^(\s*)\/\/.*$/gm, '');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

/**
 * Build selective utils source — base modules + only the builder modules
 * that the batch's descriptors actually reference.
 *
 * @param {Set<string>} builderTypes - Builder types used (e.g. "standard", "toggle")
 * @param {string[]|null} customScripts - Custom script paths to concatenate
 * @returns {string} Combined source
 */
function buildSelectiveUtils(builderTypes, customScripts) {
  const modules = [...BASE_MODULES];
  for (const type of builderTypes) {
    if (BUILDER_MODULES[type]) modules.push(BUILDER_MODULES[type]);
  }

  let source = modules
    .map(mod => stripComments(fs.readFileSync(path.join(UTILS_DIR, mod), 'utf-8')))
    .join('\n\n');

  if (customScripts) {
    source += '\n\n// --- CUSTOM BUILDERS ---';
    for (const sp of customScripts) {
      const fullPath = path.join(__dirname, sp);
      if (fs.existsSync(fullPath)) {
        source += '\n\n' + stripComments(fs.readFileSync(fullPath, 'utf-8'));
      }
    }
  }

  return source;
}

/**
 * Extract custom script function names from file paths.
 * Convention: build-form-field.js → buildFormField
 */
function extractFuncName(scriptPath) {
  const baseName = path.basename(scriptPath, '.js');
  const camel = baseName.replace(/^build-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return 'build' + camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Extract configKey from custom script path.
 * Convention: build-form-field.js → form-field
 */
function extractConfigKey(scriptPath) {
  return path.basename(scriptPath, '.js').replace(/^build-/, '');
}

// --- Builder definitions ---
const BUILDERS = {
  'templates': {
    description: 'System Components frame, icons, and template components on Core page',
    pageName: 'Core',
    config: { templates, layout, icons: ICONS },
    customScripts: [
      'templates/build-system-frame.js',
      'templates/build-icons.js',
      'templates/build-divider.js',
      'templates/build-header.js',
      'templates/build-try-me-button.js',
      'templates/build-alert-banner.js'
    ]
  },
  'core-page': {
    description: 'Core page (color palette, typography, icons frame)',
    config: { colors, typography, layout, colorPalette },
    template: 'build-core-page.js'
  },
  'buttons': {
    description: 'Buttons page (button, badge, dot, fab, fab-menu, toggle, toggle-group)',
    pageName: 'Buttons',
    config: { components: buttonConfig, layout },
    batches: [
      {
        name: 'standard',
        description: 'Button, Badge, Toggle (standard builder)',
        components: [
          require('./buttons/build-button'),
          require('./buttons/build-badge'),
          require('./buttons/build-toggle')
        ]
      },
      {
        name: 'custom',
        description: 'Dot, FAB, FAB Menu, Toggle Group (custom builders)',
        customScripts: [
          'buttons/build-dot.js',
          'buttons/build-fab.js',
          'buttons/build-fab-menu.js',
          'buttons/build-pattern-toggle-group.js'
        ]
      }
    ]
  },
  'forms': {
    description: 'Forms page (input, select, date-picker, textarea, combobox, slider, file-upload, input-otp, label, helper-text, checkbox, radio, switch, form-field, form-control)',
    pageName: 'Forms',
    config: { components: formConfig, layout },
    batches: [
      {
        name: 'text-fields',
        description: 'Text input components (input, select, date-picker, textarea, label, helper-text)',
        components: [
          require('./forms/build-input'),
          require('./forms/build-select'),
          require('./forms/build-date-picker'),
          require('./forms/build-textarea'),
          require('./forms/build-label'),
          require('./forms/build-helper-text')
        ]
      },
      {
        name: 'toggles',
        description: 'Toggle controls (checkbox, radio, switch)',
        components: [
          require('./forms/build-checkbox'),
          require('./forms/build-radio'),
          require('./forms/build-switch')
        ]
      },
      {
        name: 'extended',
        description: 'Extended input components (slider, input-otp, combobox, file-upload, time-picker)',
        customScripts: [
          'forms/build-slider.js',
          'forms/build-input-otp.js',
          'forms/build-pattern-combobox.js',
          'forms/build-pattern-file-upload.js',
          'forms/build-pattern-time-picker.js',
        ]
      },
      {
        name: 'composed',
        description: 'Composed form patterns (form-field, form-control, calendar)',
        customScripts: [
          'forms/build-form-field.js',
          'forms/build-form-control.js',
          'forms/build-pattern-calendar.js'
        ]
      }
    ]
  },
  'layout-page': {
    description: 'Layout page (separator, card, toolbar, dialog, alert-dialog, sheet, table pattern mocks)',
    pageName: 'Layout',
    config: { components: layoutConfig, layout },
    customScripts: [
      'layout/build-separator.js',
      'layout/build-pattern-card.js',
      'layout/build-toolbar.js',
      'layout/build-pattern-table.js',
      'layout/build-pattern-dialog.js',
      'layout/build-pattern-sheet.js',
      'layout/build-pattern-alert-dialog.js'
    ]
  },
  'feedback': {
    description: 'Feedback page (toast, banner, progress-bar, empty-state + pattern mocks)',
    pageName: 'Feedback',
    config: { components: feedbackConfig, layout },
    batches: [
      {
        name: 'components',
        description: 'Toast, Banner (standard builder) + Progress Bar (custom)',
        components: [
          require('./feedback/build-toast'),
          require('./feedback/build-banner')
        ],
        customScripts: [
          'feedback/build-progress-bar.js'
        ]
      },
      {
        name: 'patterns',
        description: 'Tooltip, Popover, Dropdown Menu, Skeleton, Empty State, Context Menu, Hover Card pattern mocks',
        customScripts: [
          'feedback/build-pattern-tooltip.js',
          'feedback/build-pattern-popover.js',
          'feedback/build-pattern-dropdown.js',
          'feedback/build-pattern-skeleton.js',
          'feedback/build-pattern-empty-state.js',
          'feedback/build-pattern-context-menu.js',
          'feedback/build-pattern-hover-card.js'
        ]
      }
    ]
  },
  'data-display': {
    description: 'Data Display page (avatar, kbd + list-item/accordion/avatar-group pattern mocks)',
    pageName: 'Data Display',
    config: { components: dataDisplayConfig, layout },
    components: [
      require('./data-display/build-kbd')
    ],
    customScripts: [
      'data-display/build-avatar.js',
      'data-display/build-pattern-list-item.js',
      'data-display/build-pattern-accordion.js',
      'data-display/build-pattern-avatar-group.js',
    ]
  },
  'navigation': {
    description: 'Navigation page (top-bar, sidebar, tabs, bottom-nav, breadcrumbs, pagination, nav-menu, command-palette)',
    pageName: 'Navigation',
    config: { components: navigationConfig, layout },
    batches: [
      {
        name: 'structural',
        description: 'Top Bar, Sidebar, Tabs, Bottom Nav',
        customScripts: [
          'navigation/build-pattern-top-bar.js',
          'navigation/build-pattern-sidebar.js',
          'navigation/build-pattern-tabs.js',
          'navigation/build-pattern-bottom-nav.js'
        ]
      },
      {
        name: 'utility',
        description: 'Breadcrumbs, Pagination, Nav Menu, Command Palette',
        customScripts: [
          'navigation/build-pattern-breadcrumbs.js',
          'navigation/build-pattern-pagination.js',
          'navigation/build-pattern-nav-menu.js',
          'navigation/build-pattern-command-palette.js'
        ]
      }
    ]
  },
  'composite': {
    description: 'Composite page (stepper, carousel, tree-view pattern mocks)',
    pageName: 'Composite',
    config: { components: compositeConfig, layout },
    customScripts: [
      'composite/build-pattern-stepper.js',
      'composite/build-pattern-carousel.js',
      'composite/build-pattern-tree-view.js'
    ]
  }
};

// Execution order for full build
const BUILD_ORDER = [
  'templates',
  'core-page',
  'buttons',
  'forms',
  'layout-page',
  'feedback',
  'data-display',
  'navigation',
  'composite'
];

/**
 * Normalize a builder definition into an array of batches.
 * Pages with explicit `batches` use them directly.
 * Pages with `components` (no batches) become a single implicit batch.
 * Returns null for legacy template pages.
 */
function normalizeBatches(def) {
  if (def.batches) return def.batches;
  if (def.components || def.customScripts) {
    return [{
      name: 'all',
      description: def.description,
      components: def.components || null,
      customScripts: def.customScripts
    }];
  }
  return null;
}

/**
 * Collect the full component order across all batches for reflow.
 * Includes both descriptor configKeys and custom script configKeys.
 */
function collectFullOrder(batches) {
  const order = [];
  for (const batch of batches) {
    if (batch.components) {
      for (const desc of batch.components) {
        order.push(desc.configKey);
      }
    }
    if (batch.customScripts) {
      for (const sp of batch.customScripts) {
        order.push(extractConfigKey(sp));
      }
    }
  }
  return order;
}

/**
 * Assemble a single batch script for a component page.
 *
 * @param {object} def - Builder definition (pageName, config)
 * @param {object} batch - Batch definition (components, customScripts)
 * @param {boolean} isFirst - Whether this is the first batch (clears page)
 * @param {boolean} isLast - Whether this is the last batch (reflows)
 * @param {string[]} fullOrder - Full component order across all batches (for reflow)
 * @returns {string} Assembled script
 */
function assembleBatch(def, batch, isFirst, isLast, fullOrder) {
  const configJSON = JSON.stringify(def.config);
  const descriptorsJSON = batch.components ? JSON.stringify(batch.components) : '[]';
  const defaultMode = layout['default-mode'] || 'light';

  // Determine which builder types this batch needs
  const builderTypes = new Set();
  if (batch.components) {
    for (const desc of batch.components) {
      builderTypes.add(desc.builder);
    }
  }

  // Build selective utils
  const selectiveUtils = buildSelectiveUtils(builderTypes, batch.customScripts);

  // Custom script invocations
  let customInvocations = '';
  if (batch.customScripts) {
    for (const sp of batch.customScripts) {
      const fn = extractFuncName(sp);
      customInvocations += `const ${fn}Result = ${fn}(lookups, DEFAULT_MODE, page);\n`;
      customInvocations += `results.push(${fn}Result.name + ": " + ${fn}Result.count);\n`;
      customInvocations += `order.push(${fn}Result.name.toLowerCase().replace(/ /g, "-"));\n`;
    }
  }

  // Page setup — first batch creates/clears, subsequent batches just find
  const pageSetup = isFirst
    ? [
        `let page = figma.root.children.find(p => p.name === "${def.pageName}");`,
        `if (!page) { page = figma.createPage(); page.name = "${def.pageName}"; }`,
        `await figma.setCurrentPageAsync(page);`,
        `while (page.children.length > 0) page.children[0].remove();`,
        `page.backgrounds = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];`
      ].join('\n')
    : [
        `const page = figma.root.children.find(p => p.name === "${def.pageName}");`,
        `await figma.setCurrentPageAsync(page);`
      ].join('\n');

  // Reflow after every batch — allows visual verification during stepped testing
  // and costs negligible time (just repositions existing frames)
  const reflowCode = `reflowPaired(page, ${JSON.stringify(fullOrder)});`;

  // Builder dispatch — only include branches for builders in this batch
  let dispatchBlock = '';
  if (builderTypes.has('standard')) {
    dispatchBlock += `  if (desc.builder === "standard") {\n`;
    dispatchBlock += `    const r = buildStandardComponent(desc, compConfig, lookups, DEFAULT_MODE, page);\n`;
    dispatchBlock += `    results.push(desc.name + ": " + r.count);\n`;
    dispatchBlock += `    order.push(desc.configKey);\n`;
    dispatchBlock += `  }\n`;
  }
  if (builderTypes.has('toggle')) {
    const prefix = builderTypes.has('standard') ? 'else if' : 'if';
    dispatchBlock += `  ${prefix} (desc.builder === "toggle") {\n`;
    dispatchBlock += `    const r = buildToggleComponent(desc, compConfig, lookups, DEFAULT_MODE, page);\n`;
    dispatchBlock += `    results.push(desc.name + ": " + r.count);\n`;
    dispatchBlock += `    order.push(desc.configKey);\n`;
    dispatchBlock += `  }\n`;
  }

  const batchLabel = batch.name === 'all' ? def.pageName : `${def.pageName} [${batch.name}]`;

  // Top-level await — Figma Plugin API supports this directly.
  // Do NOT wrap in (async () => { ... })() — the MCP won't capture the return value.
  // Generate font loading from typography config — font-specific weight names
  const FONT_WEIGHT_OVERRIDES = {
    "JetBrains Mono": { 600: "Medium" },
    "Inter": { 600: "Semi Bold" },
    "Space Grotesk": { 600: "Bold" },
    "Cinzel": { 500: "Regular", 600: "Bold" },
  };
  function resolveStyle(family, weight) {
    const overrides = FONT_WEIGHT_OVERRIDES[family];
    if (overrides && overrides[weight]) return overrides[weight];
    if (weight >= 700) return 'Bold';
    if (weight >= 600) return 'SemiBold';
    if (weight >= 500) return 'Medium';
    return 'Regular';
  }
  const fontFamilies = Object.values(typography.families);
  const allWeights = new Set();
  for (const ts of Object.values(typography.textStyles)) allWeights.add(ts.weight);
  const fontLoadSet = new Set();
  for (const family of fontFamilies) {
    for (const w of allWeights) {
      const style = resolveStyle(family, w);
      fontLoadSet.add(`await safeLoadFont("${family}", "${style}");`);
    }
  }
  // Ensure Regular weight is loaded for all project fonts (fallback text nodes).
  // safeLoadFont substitutes Inter for any family this Figma can't render.
  for (const family of fontFamilies) {
    fontLoadSet.add(`await safeLoadFont("${family}", "Regular");`);
  }
  // Always load Inter Regular — Figma's default font for new text nodes.
  // createText() nodes start as Inter Regular, and .characters assignment
  // requires the current font to be loaded before you can set text content.
  fontLoadSet.add(`await figma.loadFontAsync({ family: "Inter", style: "Regular" });`);
  const fontLoadLines = [...fontLoadSet];

  const pageScript = `
${fontLoadLines.join('\n')}

const lookups = getAllLookups();

${pageSetup}

const results = [];
const order = [];

for (const desc of DESCRIPTORS) {
  const compConfig = resolveBase(CONFIG.components, desc.configKey);
${dispatchBlock}}

${customInvocations}
${reflowCode}
return "${batchLabel}: " + results.join(", ");
`;

  return [
    '(async () => {',
    `const CONFIG = ${configJSON};`,
    `const DEFAULT_MODE = "${defaultMode}";`,
    `const CONFIG_FONTS = ${JSON.stringify(typography.families)};`,
    `const DESCRIPTORS = ${descriptorsJSON};`,
    '',
    '// --- INLINED UTILS ---',
    selectiveUtils,
    '',
    '// --- PAGE SCRIPT ---',
    pageScript,
    '})()'
  ].join('\n');
}

/**
 * Assemble all scripts for a component page (batched or single).
 * Returns an array of { name, description, script } objects.
 */
function assembleComponentPage(builderName, def) {
  const batches = normalizeBatches(def);
  const fullOrder = collectFullOrder(batches);
  const isSingle = batches.length === 1 && batches[0].name === 'all';

  return batches.map((batch, i) => {
    const isFirst = i === 0;
    const isLast = i === batches.length - 1;
    const script = assembleBatch(def, batch, isFirst, isLast, fullOrder);

    return {
      name: isSingle ? builderName : `${builderName}_${i + 1}-${batch.name}`,
      description: batch.description || def.description,
      script
    };
  });
}

/**
 * Assemble a legacy template-based script.
 * Returns a single-element array for consistency.
 */
function assembleLegacyTemplate(builderName, def) {
  const templatePath = path.join(__dirname, def.template);
  let script;

  if (!fs.existsSync(templatePath)) {
    script = `// TODO: ${def.template} not yet implemented\n// Config: ${JSON.stringify(Object.keys(def.config))}\n`;
  } else {
    const template = fs.readFileSync(templatePath, 'utf-8');
    const configLine = `const CONFIG = ${JSON.stringify(def.config)};\n`;
    const defaultModeLine = `const DEFAULT_MODE = "${layout['default-mode'] || 'light'}";\n`;
    const fontsLine = `const CONFIG_FONTS = ${JSON.stringify(typography.families)};\n`;
    // Legacy templates get all utils (can't selectively include)
    const allUtils = [...BASE_MODULES, ...Object.values(BUILDER_MODULES)]
      .map(mod => stripComments(fs.readFileSync(path.join(UTILS_DIR, mod), 'utf-8')))
      .join('\n\n');
    script = `(async () => {\n${configLine}${defaultModeLine}${fontsLine}\n// --- INLINED UTILS ---\n${allUtils}\n\n// --- BUILD SCRIPT ---\n${template}\n})()`;
  }

  return [{ name: builderName, description: def.description, script }];
}

/**
 * Assemble all scripts for a builder.
 * Always returns an array of { name, description, script }.
 * Batched pages return multiple entries; others return one.
 */
function assembleScript(builderName) {
  const def = BUILDERS[builderName];
  if (!def) throw new Error(`Unknown builder: ${builderName}`);

  if (def.batches || def.components || def.customScripts) {
    return assembleComponentPage(builderName, def);
  }
  return assembleLegacyTemplate(builderName, def);
}

/**
 * Assemble all scripts in build order.
 * Expands batched pages into their individual scripts.
 */
function assembleAll() {
  const results = [];
  for (const name of BUILD_ORDER) {
    results.push(...assembleScript(name));
  }
  return results;
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('Available builders (execution order):\n');
    for (const name of BUILD_ORDER) {
      const def = BUILDERS[name];
      const batches = normalizeBatches(def);

      if (batches) {
        const isSingle = batches.length === 1 && batches[0].name === 'all';
        if (isSingle) {
          const b = batches[0];
          const compCount = b.components ? b.components.length : 0;
          const customCount = b.customScripts ? b.customScripts.length : 0;
          const parts = [];
          if (compCount) parts.push(`${compCount} components`);
          if (customCount) parts.push(`${customCount} custom`);
          console.log(`  ${name} (descriptors) [${parts.join(' + ')}]`);
          console.log(`    ${def.description}\n`);
        } else {
          console.log(`  ${name} (${batches.length} batches)`);
          console.log(`    ${def.description}`);
          for (let i = 0; i < batches.length; i++) {
            const b = batches[i];
            const compCount = b.components ? b.components.length : 0;
            const customCount = b.customScripts ? b.customScripts.length : 0;
            const parts = [];
            if (compCount) parts.push(`${compCount} components`);
            if (customCount) parts.push(`${customCount} custom`);
            console.log(`      ${i + 1}. ${b.name} [${parts.join(' + ')}]`);
          }
          console.log('');
        }
      } else {
        const tp = path.join(__dirname, def.template);
        const status = fs.existsSync(tp) ? '' : ' (template missing)';
        console.log(`  ${name} (template)${status}`);
        console.log(`    ${def.description}\n`);
      }
    }
    process.exit(0);
  }

  const buildIdx = args.indexOf('--build');
  if (buildIdx === -1) {
    console.log('Usage: node orchestrator.js --list | --build <name|all> [--output]');
    process.exit(1);
  }

  const target = args[buildIdx + 1];
  const writeOutput = args.includes('--output');
  const outputIdx = args.indexOf('--output');
  const outputDir = (writeOutput && args[outputIdx + 1] && !args[outputIdx + 1].startsWith('--'))
    ? path.resolve(args[outputIdx + 1])
    : path.resolve(__dirname, '../../generated/figma-scripts');

  const scripts = target === 'all' ? assembleAll() : assembleScript(target);

  for (const { name, description, script } of scripts) {
    if (writeOutput) {
      fs.mkdirSync(outputDir, { recursive: true });
      const outPath = path.join(outputDir, `${name}.js`);
      fs.writeFileSync(outPath, script);
      console.log(`${name}: ${script.length} chars → ${outPath}`);
    } else {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`// Builder: ${name} (${script.length} chars)`);
      console.log(`// ${description}`);
      console.log(`${'='.repeat(60)}\n`);
      console.log(script);
    }
  }
}

module.exports = { assembleScript, assembleAll, BUILDERS, BUILD_ORDER };
