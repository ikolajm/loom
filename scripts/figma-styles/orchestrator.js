#!/usr/bin/env node
/**
 * Figma Styles Orchestrator
 *
 * Reads config JSON files and assembles complete Figma Plugin API scripts
 * for text styles and effect styles.
 *
 * Usage:
 *   node orchestrator.js --collection text-styles
 *   node orchestrator.js --collection effect-styles
 *   node orchestrator.js --list
 */
const fs = require('fs');
const path = require('path');

// --- Paths ---
const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
const TYPOGRAPHY = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'base/typography.json'), 'utf-8'));
const EFFECTS = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'base/effects.json'), 'utf-8'));

// --- Collection definitions ---
const COLLECTIONS = {
  'text-styles': {
    config: { families: TYPOGRAPHY.families, textStyles: TYPOGRAPHY.textStyles },
    template: 'text-styles.js'
  },
  'effect-styles': {
    config: { shadow: EFFECTS.shadow, properties: EFFECTS['shadow-properties'] },
    template: 'effect-styles.js'
  }
};

function assembleScript(collectionName) {
  const def = COLLECTIONS[collectionName];
  if (!def) throw new Error(`Unknown style: ${collectionName}`);
  const templatePath = path.join(__dirname, def.template);
  const template = fs.readFileSync(templatePath, 'utf-8');
  return `(async () => {\nconst CONFIG = ${JSON.stringify(def.config)};\n${template}\n})()`;
}

function assembleAll() {
  return Object.keys(COLLECTIONS).map(name => ({ name, script: assembleScript(name) }));
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    console.log('Available styles:');
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
      const outPath = path.join(outputDir, `styles_${target}.js`);
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
        const outPath = path.join(outputDir, `styles_${name}.js`);
        fs.writeFileSync(outPath, script);
        console.log(`${name}: ${script.length} chars → ${outPath}`);
      } else {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`// Style: ${name} (${script.length} chars)`);
        console.log(`${'='.repeat(60)}\n`);
        console.log(script);
      }
    }
  }
}

module.exports = { assembleScript, assembleAll, COLLECTIONS };
