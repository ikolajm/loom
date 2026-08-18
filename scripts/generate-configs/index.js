#!/usr/bin/env node
/**
 * Design System Config Generator — Orchestrator
 *
 * Reads questionnaire answers (JSON) + direction-mappings.json + standards.json,
 * runs all 5 generators, and writes output to the git-ignored spec/config/local/base/.
 *
 * Usage:
 *   node index.js --input answers.json
 *   node index.js --primary "#53599A" --edges sharp --density comfortable --shadowDepth elevated --typeScale standard
 *   node index.js --default-set   (maintainers only — always reads spec/answers.example.json)
 */
const fs = require('fs');
const path = require('path');

const { generate: generateColors } = require('./generate-colors');
const { generate: generateSpacing } = require('./generate-spacing');
const { generate: generateSizing } = require('./generate-sizing');
const { generate: generateTypography } = require('./generate-typography');
const { generate: generateEffects } = require('./generate-effects');
const { resolveIntent, TIER2_KEYS } = require('./resolve-intent');

// --- Paths ---
// Output goes to the git-ignored local set, never to the committed one. Writing into
// spec/config/base/ is what let a local brand ride into two commits; see
// scripts/config-paths.js for the full account and the fallback rule.
const { COMMITTED_ROOT: CONFIG_ROOT, LOCAL_ROOT } = require('../config-paths');
const PIPELINE_ROOT = path.resolve(__dirname, '../../');
const STANDARDS_PATH = path.join(CONFIG_ROOT, 'standards.json');
const MAPPINGS_PATH = path.join(PIPELINE_ROOT, 'spec/direction-mappings.json');

// `--default-set` is the one way to write the COMMITTED spec/config/base/, and it is a
// maintainer action: it regenerates Loom's own look from answers.example.json. Without
// it the redirect would make the committed set unreachable, since the ordinary command
// now writes only to the ignored local set — and an artifact nothing can regenerate
// drifts from its source by construction. `base-config-provenance` in verify.js is what
// notices if it does; this is the repair the failure message names.
function outputDir(args) {
  return args['default-set'] ? path.join(CONFIG_ROOT, 'base') : path.join(LOCAL_ROOT, 'base');
}

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
  // `--default-set` is the only path that writes the tracked spec/config/base/, so its
  // input is pinned to the tracked answers.example.json and every brand-bearing flag is
  // ignored rather than honoured. Without this, `npm run configs -- --default-set` writes
  // whatever brand you are testing into the committed set: the npm script bakes in
  // `--input spec/answers.json`, which is git-ignored precisely because it holds your
  // brand and not Loom's. That is the mechanism of e935de3, which put a local dashboard's
  // colors on master for a day — the redirect to spec/config/local/ closed the ordinary
  // write path and left this one open.
  if (args['default-set']) {
    const example = path.join(PIPELINE_ROOT, 'spec/answers.example.json');
    const overridden = [
      args.input && path.resolve(args.input) !== example ? `--input ${args.input}` : null,
      args.primary ? `--primary ${args.primary}` : null,
    ].filter(Boolean);
    if (overridden.length) {
      console.log(`Note: --default-set ignores ${overridden.join(' and ')} — reading spec/answers.example.json`);
    }
    args.input = example;
  }

  // If --input provided, read from file
  if (args.input) {
    const inputPath = path.resolve(args.input);
    if (!fs.existsSync(inputPath)) {
      // answers.json is git-ignored (it holds your brand, not Loom's) — a fresh
      // clone has only the committed template. Point the user at the copy step
      // instead of a raw ENOENT.
      console.error(
        `Error: ${args.input} not found.\n` +
          `  Copy the template first:  cp spec/answers.example.json spec/answers.json\n` +
          `  then edit its values and re-run.`
      );
      process.exit(1);
    }
    const answers = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    // defaultMode lands in the generated colors.json; default it here so an omitted key
    // doesn't emit `undefined`. Matches the CLI-flag path.
    answers.defaultMode = answers.defaultMode || 'dark';
    return answers;
  }

  // Otherwise, build from CLI flags
  if (!args.primary) {
    console.error('Error: --primary "#hex" is required (or use --input answers.json)');
    process.exit(1);
  }

  return {
    // Tier 1 — intent; resolveIntent() turns these into Tier 2 values below
    projectName: args.projectName || null,
    styleDirection: args.styleDirection || null,
    defaultMode: args.defaultMode || 'dark',
    // Tier 2 — implementation (drives config generation)
    primary: args.primary,
    secondary: args.secondary || null,
    accent: args.accent || null,
    heading: args.heading || 'Inter',
    body: args.body || 'Inter',
    // The Tier 2 keys are deliberately left absent when no flag was passed. Defaulting
    // them here (`args.edges || 'sharp'`) made every flagless run look like an explicit
    // answer, so styleDirection could never win. The fallback is the last layer of
    // resolveIntent(), which produces the same values it used to.
    ...(args.edges ? { edges: args.edges } : {}),
    ...(args.density ? { density: args.density } : {}),
    ...(args.shadowDepth ? { shadowDepth: args.shadowDepth } : {}),
    ...(args.typeScale ? { typeScale: args.typeScale } : {}),
    // controlHeight has no intent supplier — it is answered or it defaults, so the CLI
    // path needs its own flag or it is unreachable outside an answers file.
    ...(args.controlHeight ? { controlHeight: args.controlHeight } : {})
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
  const raw = loadAnswers(args);

  // Load dependencies
  const standards = JSON.parse(fs.readFileSync(STANDARDS_PATH, 'utf-8'));
  const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf-8'));

  // Tier 1 → Tier 2. Must run before any generator sees the answers.
  let answers, sources;
  try {
    ({ answers, sources } = resolveIntent(raw, mappings));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  console.log('=== Design System Config Generator ===');
  if (answers.projectName) console.log(`Project: ${answers.projectName}`);
  if (answers.styleDirection) console.log(`Style Direction: ${answers.styleDirection}`);
  console.log(`Default Mode: ${answers.defaultMode || 'dark'}`);
  console.log(`Primary: ${answers.primary}`);
  console.log(`Secondary: ${answers.secondary || '(auto-derive)'}`);
  console.log(`Accent: ${answers.accent || '(auto-derive)'}`);
  console.log(`Fonts: ${answers.heading || 'Inter'} / ${answers.body || 'Inter'}`);
  warnOffParitySafeFonts(answers);
  // Each Tier 2 value with the layer that supplied it — an intent-derived value and a
  // hand-written one are indistinguishable in the output, so the run log says which.
  for (const key of Object.keys(TIER2_KEYS)) {
    console.log(`${key}: ${answers[key]}  (from ${sources[key]})`);
  }
  console.log('');

  // defaultMode used to be propagated into standards.json here. It now rides in
  // generate-colors.js's output instead: standards.json is locked across projects and
  // this is a per-project answer, so writing it there made the file's own header false
  // and put a second generator write on a tracked path. One write target now, below.

  // Ensure output directory exists
  const OUTPUT_DIR = outputDir(args);
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
  console.log(
    args['default-set']
      ? '  (the COMMITTED default set — this is Loom\'s own look and it is tracked; commit it deliberately)'
      : '  (git-ignored — the committed spec/config/base/ is untouched and stays Loom\'s own look)'
  );
  console.log('Done.');
}

main();
