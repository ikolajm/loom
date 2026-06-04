#!/usr/bin/env node
/**
 * Figma Primitives Orchestrator
 *
 * Reads config JSON files and assembles complete Figma Plugin API scripts
 * by injecting config data into the template scripts.
 *
 * Output: assembled script strings ready to be sent to use_figma MCP tool.
 *
 * Usage:
 *   node orchestrator.js                    — prints all 8 assembled scripts
 *   node orchestrator.js --collection color — prints a single collection script
 *   node orchestrator.js --list             — lists available collections
 */
const fs = require('fs');
const path = require('path');

// --- Paths ---
const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
const STANDARDS = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'standards.json'), 'utf-8'));
const COLORS = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'base/colors.json'), 'utf-8'));
const TYPOGRAPHY = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'base/typography.json'), 'utf-8'));
const EFFECTS = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'base/effects.json'), 'utf-8'));

// --- Collection definitions: map collection name → config data + template file ---
const COLLECTIONS = {
  'color': {
    config: COLORS.palette,
    template: 'color.js'
  },
  'spacing': {
    config: STANDARDS.spacing.scale,
    template: 'spacing.js'
  },
  'radius': {
    config: STANDARDS.sizing['border-radius'],
    template: 'radius.js'
  },
  'border-width': {
    config: STANDARDS.sizing['border-width'],
    template: 'border-width.js'
  },
  'component-height': {
    config: STANDARDS.sizing['component-height'],
    template: 'component-height.js'
  },
  'icon-size': {
    config: STANDARDS.sizing['icon-size'],
    template: 'icon-size.js'
  },
  'typography': {
    config: { families: TYPOGRAPHY.families, textStyles: TYPOGRAPHY.textStyles },
    template: 'typography.js'
  },
  'effects': {
    config: EFFECTS['shadow-properties'],
    template: 'effects.js'
  }
};

/**
 * Assemble a complete Figma script by injecting CONFIG into the template.
 */
function assembleScript(collectionName) {
  const def = COLLECTIONS[collectionName];
  if (!def) throw new Error(`Unknown collection: ${collectionName}`);

  const templatePath = path.join(__dirname, def.template);
  const template = fs.readFileSync(templatePath, 'utf-8');
  const configLine = `const CONFIG = ${JSON.stringify(def.config)};\n`;

  return `(async () => {\n${configLine}${template}\n})()`;
}

/**
 * Get all assembled scripts in execution order.
 */
function assembleAll() {
  const order = ['color', 'spacing', 'radius', 'border-width', 'component-height', 'icon-size', 'typography', 'effects'];
  return order.map(name => ({
    name,
    script: assembleScript(name)
  }));
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('Available collections:');
    for (const name of Object.keys(COLLECTIONS)) {
      console.log(`  ${name}`);
    }
    process.exit(0);
  }

  const buildIdx = args.indexOf('--build');
  const collectionIdx = args.indexOf('--collection');
  const writeOutput = args.includes('--output');
  const outputArgIdx = args.indexOf('--output');
  const outputDir = (writeOutput && args[outputArgIdx + 1] && !args[outputArgIdx + 1].startsWith('--'))
    ? path.resolve(args[outputArgIdx + 1])
    : path.resolve(__dirname, '../../generated/figma-scripts');

  const target = buildIdx !== -1 ? args[buildIdx + 1] : (collectionIdx !== -1 ? args[collectionIdx + 1] : null);

  if (target && target !== 'all') {
    const script = assembleScript(target);
    if (writeOutput) {
      fs.mkdirSync(outputDir, { recursive: true });
      const outPath = path.join(outputDir, `primitives_${target}.js`);
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
        const outPath = path.join(outputDir, `primitives_${name}.js`);
        fs.writeFileSync(outPath, script);
        console.log(`${name}: ${script.length} chars → ${outPath}`);
      } else {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`// Collection: ${name}`);
        console.log(`${'='.repeat(60)}\n`);
        console.log(script);
      }
    }
  }
}

module.exports = { assembleScript, assembleAll, COLLECTIONS };
