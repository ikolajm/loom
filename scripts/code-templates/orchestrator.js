#!/usr/bin/env node
/**
 * Code Templates Orchestrator
 *
 * Produces the complete generated/ bundle:
 *   tokens.css, components/, scaffold/, HANDOFF.md
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
const { archetypePicks } = require('../generate-configs/resolve-intent');

// --- Load config once ---
const configs = loadAllConfigs();
const registry = getComponentRegistry(configs);

// --- Archetype pick-list for the starter loom-picks.json ---
// loadAllConfigs() reads token configs, not answers, so the archetype needs its own
// channel into this pipeline. spec/answers.json is git-ignored and absent in a fresh
// clone — no answers file means the scaffold falls back to its two-atom starter pair,
// which is what shipped before.
const ANSWERS_PATH = path.resolve(__dirname, '../../spec/answers.json');
const MAPPINGS_PATH = path.resolve(__dirname, '../../spec/direction-mappings.json');

function loadArchetypePicks() {
  if (!fs.existsSync(ANSWERS_PATH)) return null;
  const answers = JSON.parse(fs.readFileSync(ANSWERS_PATH, 'utf8'));
  const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
  try {
    return archetypePicks(answers, mappings);
  } catch (err) {
    // Same bad answers file that `npm run configs` rejects with one line. Without this
    // it surfaces here as a stack trace, so one defect gets two presentations and the
    // uglier one lands in the pipeline consumers run more often.
    console.error(`Error in spec/answers.json: ${err.message}`);
    process.exit(1);
  }
}

// --- Generator modules ---
const GENERATORS = {
  'tokens': {
    description: 'tokens.css',
    run: (outputDir) => {
      const { generate } = require('./generate-tokens-css');
      const output = generate();
      fs.writeFileSync(path.join(outputDir, 'tokens.css'), output);
      console.log('  tokens.css');
    },
  },
  'tokens-json': {
    description: 'tokens.json (neutral token data for non-web consumers — RN/NativeWind, native configs)',
    run: (outputDir) => {
      const { generate } = require('./generate-tokens-json');
      fs.writeFileSync(path.join(outputDir, 'tokens.json'), JSON.stringify(generate(), null, 2) + '\n');
      console.log('  tokens.json');
    },
  },
  'doc-layout': {
    description: 'doc-layout.css (gallery presentation layer — derived from presentation/layout.json)',
    run: (outputDir) => {
      const { generate } = require('./generate-doc-layout');
      fs.writeFileSync(path.join(outputDir, 'doc-layout.css'), generate());
      console.log('  doc-layout.css');
    },
  },
  'icons': {
    description: 'components/icons.ts (icon map + size classes)',
    run: (outputDir) => {
      const { generate } = require('./generate-icons');
      return generate(configs, outputDir);
    },
  },
  'components': {
    description: 'components/*.tsx + cn.ts',
    run: (outputDir) => {
      const { generate } = require('./generate-components');
      return generate(registry, outputDir, configs);
    },
  },
  'scaffold': {
    description: 'scaffold/ (init.sh, globals.css, ThemeProvider, layout)',
    run: (outputDir) => {
      const { generate } = require('./scaffold');
      generate(configs, outputDir, loadArchetypePicks());
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
  // real invocation — setup.sh and the playground's prebuild hook both use it — and it
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
