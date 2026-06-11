#!/usr/bin/env node
/**
 * Design System Config Generator — Orchestrator
 *
 * Reads questionnaire answers (JSON) + direction-mappings.json + standards.json,
 * runs all 5 generators, and writes output to spec/config/base/.
 *
 * Usage:
 *   node index.js --input answers.json
 *   node index.js --primary "#53599A" --edges sharp --density comfortable --shadowDepth elevated --typeScale standard
 */
const fs = require('fs');
const path = require('path');

const { generate: generateColors } = require('./generate-colors');
const { generate: generateSpacing } = require('./generate-spacing');
const { generate: generateSizing } = require('./generate-sizing');
const { generate: generateTypography } = require('./generate-typography');
const { generate: generateEffects } = require('./generate-effects');

// --- Paths ---
const PIPELINE_ROOT = path.resolve(__dirname, '../../');
const CONFIG_ROOT = path.join(PIPELINE_ROOT, 'spec/config');
const STANDARDS_PATH = path.join(CONFIG_ROOT, 'standards.json');
const MAPPINGS_PATH = path.join(PIPELINE_ROOT, 'spec/direction-mappings.json');
const OUTPUT_DIR = path.join(CONFIG_ROOT, 'base');

// --- Parse CLI args ---
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].replace('--', '');
      const value = argv[i + 1];
      if (value && !value.startsWith('--')) {
        args[key] = value;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function loadAnswers(args) {
  // If --input provided, read from file
  if (args.input) {
    const inputPath = path.resolve(args.input);
    const answers = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    // defaultMode drives the standards.json propagation below; default it here so an
    // omitted key doesn't write `undefined` into standards. Matches the CLI-flag path.
    answers.defaultMode = answers.defaultMode || 'dark';
    return answers;
  }

  // Otherwise, build from CLI flags
  if (!args.primary) {
    console.error('Error: --primary "#hex" is required (or use --input answers.json)');
    process.exit(1);
  }

  return {
    // Tier 1 — intent (metadata, not consumed by generators)
    projectName: args.projectName || null,
    productType: args.productType || null,
    styleDirection: args.styleDirection || null,
    defaultMode: args.defaultMode || 'dark',
    // Tier 2 — implementation (drives config generation)
    primary: args.primary,
    secondary: args.secondary || null,
    accent: args.accent || null,
    heading: args.heading || 'Inter',
    body: args.body || 'Inter',
    edges: args.edges || 'sharp',
    density: args.density || 'comfortable',
    shadowDepth: args.shadowDepth || 'elevated',
    typeScale: args.typeScale || 'standard'
  };
}

// Soft, heuristic parity check (early placement). The authoritative font-availability
// check runs in Figma at paste time (figma.listAvailableFontsAsync); this just flags a
// font that's off the recommended Figma-parity shortlist so it isn't a surprise later.
function warnOffParitySafeFonts(answers) {
  let safe;
  try {
    safe = JSON.parse(fs.readFileSync(path.join(__dirname, '../../spec/parity-safe-fonts.json'), 'utf-8')).families;
  } catch { return; } // list optional — skip silently if absent
  const set = new Set(safe);
  for (const role of ['heading', 'body']) {
    const fam = answers[role] || 'Inter';
    if (!set.has(fam)) {
      console.warn(`  ⚠ ${role} font "${fam}" is off the parity-safe shortlist. Code loads it via Google Fonts <link>; the Figma build will substitute Inter if this Figma can't render it (the typography paste reports which). Pick from spec/parity-safe-fonts.json for guaranteed parity.`);
    }
  }
}

// --- Main ---
function main() {
  const args = parseArgs(process.argv);
  const answers = loadAnswers(args);

  console.log('=== Design System Config Generator ===');
  if (answers.projectName) console.log(`Project: ${answers.projectName}`);
  if (answers.productType) console.log(`Product Type: ${answers.productType}`);
  if (answers.styleDirection) console.log(`Style Direction: ${answers.styleDirection}`);
  console.log(`Default Mode: ${answers.defaultMode || 'dark'}`);
  console.log(`Primary: ${answers.primary}`);
  console.log(`Secondary: ${answers.secondary || '(auto-derive)'}`);
  console.log(`Accent: ${answers.accent || '(auto-derive)'}`);
  console.log(`Fonts: ${answers.heading || 'Inter'} / ${answers.body || 'Inter'}`);
  warnOffParitySafeFonts(answers);
  console.log(`Edges: ${answers.edges}, Density: ${answers.density}`);
  console.log(`Shadow: ${answers.shadowDepth}, Type Scale: ${answers.typeScale}`);
  console.log('');

  // Load dependencies
  const standards = JSON.parse(fs.readFileSync(STANDARDS_PATH, 'utf-8'));
  const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf-8'));

  // Propagate the questionnaire's default-mode into standards.json — the source the
  // token generator reads. Without this, answers.defaultMode is decorative and the two
  // can silently disagree. Idempotent: only writes when it actually differs.
  if (standards.colors['default-mode'] !== answers.defaultMode) {
    standards.colors['default-mode'] = answers.defaultMode;
    fs.writeFileSync(STANDARDS_PATH, JSON.stringify(standards, null, 2) + '\n');
    console.log(`  ✓ standards.json default-mode → ${answers.defaultMode}`);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Run generators
  const generators = [
    { name: 'colors', fn: generateColors, file: 'colors.json' },
    { name: 'spacing', fn: generateSpacing, file: 'spacing.json' },
    { name: 'sizing', fn: generateSizing, file: 'sizing.json' },
    { name: 'typography', fn: generateTypography, file: 'typography.json' },
    { name: 'effects', fn: generateEffects, file: 'effects.json' }
  ];

  for (const gen of generators) {
    try {
      const result = gen.fn(answers, standards, mappings);
      const outputPath = path.join(OUTPUT_DIR, gen.file);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');
      console.log(`  ✓ ${gen.file} generated`);
    } catch (err) {
      console.error(`  ✗ ${gen.file} FAILED: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('');
  console.log(`Output written to: ${OUTPUT_DIR}`);
  console.log('Done.');
}

main();
