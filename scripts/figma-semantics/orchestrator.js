#!/usr/bin/env node
/**
 * Figma Semantics Orchestrator
 *
 * Reads config JSON files and assembles complete Figma Plugin API scripts
 * by injecting config data into semantic template scripts.
 *
 * Usage:
 *   node orchestrator.js --collection color    — prints assembled color script
 *   node orchestrator.js --list                — lists available collections
 */
const fs = require('fs');
const path = require('path');

// --- Paths ---
const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
// Prefers spec/config/local/ over the committed set — see scripts/config-paths.js.
const { loadConfig } = require('../config-paths');
const STANDARDS = loadConfig('standards.json');
const COLORS = loadConfig('base/colors.json');
const SPACING = loadConfig('base/spacing.json');
const SIZING = loadConfig('base/sizing.json');

// --- Collection definitions ---
const COLLECTIONS = {
  'color': {
    config: {
      defaultMode: COLORS['default-mode'],
      modes: STANDARDS.colors.modes
    },
    template: 'color.js'
  },
  'spacing': {
    config: SPACING.categories,
    template: 'spacing.js'
  },
  'radius': {
    config: SIZING['border-radius'],
    template: 'radius.js'
  },
};

function assembleScript(collectionName) {
  const def = COLLECTIONS[collectionName];
  if (!def) throw new Error(`Unknown collection: ${collectionName}`);
  const templatePath = path.join(__dirname, def.template);
  const template = fs.readFileSync(templatePath, 'utf-8');
  return `(async () => {\nconst CONFIG = ${JSON.stringify(def.config)};\n${template}\n})()`;
}

function assembleAll() {
  const order = ['color', 'spacing', 'radius'];
  return order.map(name => ({ name, script: assembleScript(name) }));
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    console.log('Available semantic collections:');
    for (const name of Object.keys(COLLECTIONS)) console.log(`  ${name}`);
    process.exit(0);
  }
  const buildIdx = args.indexOf('--build');
  const idx = args.indexOf('--collection');
  const writeOutput = args.includes('--output');
  const outputArgIdx = args.indexOf('--output');
  const outputDir = (writeOutput && args[outputArgIdx + 1] && !args[outputArgIdx + 1].startsWith('--'))
    ? path.resolve(args[outputArgIdx + 1])
    : path.resolve(__dirname, '../../generated/figma-scripts');

  const target = buildIdx !== -1 ? args[buildIdx + 1] : (idx !== -1 ? args[idx + 1] : null);

  if (target && target !== 'all') {
    const script = assembleScript(target);
    if (writeOutput) {
      fs.mkdirSync(outputDir, { recursive: true });
      const outPath = path.join(outputDir, `semantics_${target}.js`);
      fs.writeFileSync(outPath, script);
      console.log(`${target}: ${script.length} chars → ${outPath}`);
    } else {
      console.log(script);
    }
  } else {
    const all = assembleAll();
    for (const { name, script } of all) {
      if (writeOutput) {
        fs.mkdirSync(outputDir, { recursive: true });
        const outPath = path.join(outputDir, `semantics_${name}.js`);
        fs.writeFileSync(outPath, script);
        console.log(`${name}: ${script.length} chars → ${outPath}`);
      } else {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`// Semantic collection: ${name} (${script.length} chars)`);
        console.log(`${'='.repeat(60)}\n`);
        console.log(script);
      }
    }
  }
}

module.exports = { assembleScript, assembleAll, COLLECTIONS };
