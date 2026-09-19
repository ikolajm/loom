#!/usr/bin/env node
/**
 * Code Templates Orchestrator
 *
 * Produces the complete generated/ bundle:
 *   tokens.css, components/, HANDOFF.md
 *
 * No app-shell target: the substrate is portable and wiring it into a framework is the
 * consumer's business. ThemeProvider is a catalog component, the selection and scrollbar
 * rules are in loom.base, and sync.js owns the `--tokens` tier and the loom:sync script.
 *
 * Each generator is a separate module with a generate(config, outputDir) function.
 *
 * Usage:
 *   node orchestrator.js                    — writes to generated/
 *   node orchestrator.js --output ./out     — writes to custom path
 *   node orchestrator.js --only components  — run a single generator
 *   node orchestrator.js --list             — list available generators
 */
const fs = require('fs');
const path = require('path');
const { loadAllConfigs, getComponentRegistry } = require('./shared');

// --- Load config once ---
const configs = loadAllConfigs();
const registry = getComponentRegistry(configs);

// --- Generator modules ---
const GENERATORS = {
  'tokens': {
    description: 'tokens.css + loom.css + loom.components.css + main.css (values, class layer, component classes, index)',
    run: (outputDir) => {
      const { generate, FILES } = require('./generate-tokens-css');
      const files = generate();
      for (const name of FILES) {
        fs.writeFileSync(path.join(outputDir, name), files[name]);
        console.log(`  ${name}`);
      }
    },
  },
  'components': {
    description: 'catalog/*.tsx + *.manifest.json + cn.ts + atoms.json (ignores --output; always catalog/)',
    run: (outputDir) => {
      const { generate } = require('./generate-components');
      return generate(registry, outputDir, configs);
    },
  },
  // Ignores outputDir on purpose: this page is read in the repo, not shipped in the
  // bundle, and it links ../generated/ rather than living beside it. It is the only
  // preview surface now — the TSX one retired with the Next app it lived in.
  'preview-html': {
    description: 'docs/preview.html (the substrate canvas as a static page — no framework under it)',
    run: () => {
      const { generate } = require('./generate-preview-html');
      const dir = path.resolve(__dirname, '../../docs');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'preview.html'), generate());
      console.log('  docs/preview.html');
    },
  },
  'handoff': {
    description: 'HANDOFF.md',
    run: (outputDir) => {
      const { generate } = require('./generate-handoff');
      generate(configs, registry, outputDir);
    },
  },
  // Not a generator — writes nothing. Runs last so a full `npm run generate` cannot
  // report success over broken output; exits non-zero on any failed invariant.
  'verify': {
    description: 'invariant checks over the emitted catalog (writes nothing; fails the run)',
    run: () => {
      require('./verify').verify();
    },
  },
};

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('Available generators:\n');
    for (const [name, gen] of Object.entries(GENERATORS)) {
      console.log(`  ${name.padEnd(16)} ${gen.description}`);
    }
    process.exit(0);
  }

  const outputDir = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : path.resolve(__dirname, '../../generated');

  const only = args.includes('--only')
    ? args[args.indexOf('--only') + 1]
    : null;

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n=== Generating → ${outputDir} ===\n`);

  // Copy answers.json as a receipt — the DNA of this generation. Only for a FULL run:
  // answers.json holds the brand and the project name, and a partial run is how it
  // reaches somewhere it should not be. `--only tokens --output <consumer>/src` is a
  // real invocation — sync.js uses it — and it
  // was dropping a private answers file into a consumer's source tree, where nothing
  // was ignoring it. A receipt belongs with the artifact set it documents, not beside
  // one file pulled out of it.
  const answersPath = path.resolve(__dirname, '../../spec/answers.json');
  if (!only && fs.existsSync(answersPath)) {
    fs.copyFileSync(answersPath, path.join(outputDir, 'answers.json'));
    console.log('[answers]\n  answers.json\n');
  }

  const toRun = only
    ? { [only]: GENERATORS[only] }
    : GENERATORS;

  if (only && !GENERATORS[only]) {
    console.error(`Unknown generator: "${only}". Use --list to see available generators.`);
    process.exit(1);
  }

  for (const [name, gen] of Object.entries(toRun)) {
    console.log(`[${name}]`);
    gen.run(outputDir);
    console.log('');
  }

  console.log('=== Done ===');
}

module.exports = { GENERATORS };
