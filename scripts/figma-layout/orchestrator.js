#!/usr/bin/env node
/**
 * Figma Layout Orchestrator
 *
 * Reads layout.json and assembles the figma.layout collection script.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
const LAYOUT = JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, 'figma/layout.json'), 'utf-8'));

const COLLECTIONS = {
  'layout': {
    config: LAYOUT,
    template: 'layout.js'
  }
};

function assembleScript(collectionName) {
  const def = COLLECTIONS[collectionName];
  if (!def) throw new Error(`Unknown: ${collectionName}`);
  const templatePath = path.join(__dirname, def.template);
  const template = fs.readFileSync(templatePath, 'utf-8');
  return `(async () => {\nconst CONFIG = ${JSON.stringify(def.config)};\n${template}\n})()`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const writeOutput = args.includes('--output');
  const outputArgIdx = args.indexOf('--output');
  const outputDir = (writeOutput && args[outputArgIdx + 1] && !args[outputArgIdx + 1].startsWith('--'))
    ? path.resolve(args[outputArgIdx + 1])
    : path.resolve(__dirname, '../../generated/figma-scripts');

  const script = assembleScript('layout');
  if (writeOutput) {
    fs.mkdirSync(outputDir, { recursive: true });
    const outPath = path.join(outputDir, 'layout.js');
    fs.writeFileSync(outPath, script);
    console.log(`layout: ${script.length} chars → ${outPath}`);
  } else {
    console.log(script);
  }
}

module.exports = { assembleScript, COLLECTIONS };
