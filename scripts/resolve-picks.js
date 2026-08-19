#!/usr/bin/env node
/**
 * resolve-picks.js — resolve a project's loom-picks.json to the full atom set.
 *
 * Reads `picks`, walks each atom's manifest `dependencies` transitively. Default: prints the
 * resolved atom names (one per line, excluding `cn` — copied unconditionally by sync.js).
 * With `--npm`: prints the union of the resolved set's `npmDependencies` (+ cn's), space-separated
 * — the install specifiers the consumer needs (report-only; sync.js prints, never installs).
 *
 * Unknown atom ids are a hard error. sync.js resolves before it copies, so a typo'd pick
 * leaves the consumer's project untouched instead of half-synced. This script is the only pre-flight the sync has: before it existed,
 * one mistyped id aborted the install mid-copy on a raw `cp: cannot stat`, leaving a project with
 * some atoms, no cn.ts, and no compile.
 *
 * Usage: node resolve-picks.js <loom-picks.json> <catalog-dir> [--npm]
 */
const fs = require('fs');
const path = require('path');


// Atoms whose appearance became a class. Naming the replacement matters more than a fuzzy
// match: "table — did you mean tabs?" sends someone looking for a component that was never
// the answer, when the answer is one class away.
const MOVED_TO_CLASS = new Set([
  'banner', 'bottom-nav', 'breadcrumbs', 'card', 'dot', 'empty-state', 'fab',
  'helper-text', 'input', 'kbd', 'label', 'list-item', 'skeleton', 'spinner', 'table',
  'textarea', 'toolbar', 'top-bar',
]);

/**
 * A resolution failure carries its own report. Thrown rather than printed-and-exited so
 * an in-process caller (sync.js) can render it without the module deciding to kill the
 * program — the CLI below still exits 1, which is what the shell version's `set -e` relied on.
 */
class PickError extends Error {
  constructor(lines) {
    super(lines[0]);
    this.lines = lines;
  }
}

function fail(lines) {
  throw new PickError(lines);
}

/**
 * @returns {{atoms: string[], npmDependencies: string[]}} the transitively resolved set
 * (excluding `cn`, which is delivered unconditionally) and the packages it imports.
 */
function resolvePicks(picksPath, catalogDir) {
  // --- Read the picks file -------------------------------------------------
  // Guarded field by field: this is the one file a consumer is guaranteed to hand-edit,
  // and an unguarded dereference here surfaces as a Node stack trace.
  let picks;
  {
    let raw;
    try {
      raw = fs.readFileSync(picksPath, 'utf8');
    } catch (e) {
      fail([`ERROR: cannot read ${picksPath}`, `  ${e.message}`]);
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      fail([`ERROR: ${picksPath} is not valid JSON`, `  ${e.message}`]);
    }
    picks = parsed?.loom?.picks;
    if (!Array.isArray(picks)) {
      fail([
        `ERROR: ${picksPath} has no "loom".picks array`,
        '',
        '  Expected shape:',
        '    { "loom": { "picks": ["button", "card"] } }',
      ]);
    }
    const nonStrings = picks.filter((p) => typeof p !== 'string');
    if (nonStrings.length) {
      fail([`ERROR: "loom".picks must contain only strings — found ${JSON.stringify(nonStrings[0])}`]);
    }
  }

  // --- Valid ids, for validation and for suggestions ------------------------
  // Globbed from the catalog rather than read from atoms.json: the manifest is what
  // the sync actually copies against, so this cannot disagree with the copy step.
  const validIds = fs
    .readdirSync(catalogDir)
    .filter((f) => f.endsWith('.manifest.json'))
    .map((f) => f.replace(/\.manifest\.json$/, ''))
    .filter((n) => n !== 'cn')
    .sort();

  function levenshtein(a, b) {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      }
    }
    return rows[a.length][b.length];
  }

  // A containment hit (`text-input` → `input`) scores as near-exact: the consumer had the
  // right atom and added or dropped a qualifier, which raw edit distance rates as far.
  function suggest(name) {
    return validIds
      .map((id) => ({
        id,
        score: id.includes(name) || name.includes(id) ? 1 : levenshtein(name, id),
      }))
      .filter((c) => c.score <= Math.max(3, Math.ceil(name.length * 0.4)))
      .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((c) => c.id);
  }

  // --- Resolve --------------------------------------------------------------
  const resolved = new Set();
  const unknown = new Map(); // id → the atom that declared it, or null for a top-level pick

  function visit(name, declaredBy) {
    if (resolved.has(name) || name === 'cn') return;
    const manifestPath = path.join(catalogDir, `${name}.manifest.json`);
    if (!fs.existsSync(manifestPath)) {
      if (!unknown.has(name)) unknown.set(name, declaredBy);
      return;
    }
    resolved.add(name);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const dep of manifest.dependencies || []) visit(dep, name);
  }

  for (const pick of picks) visit(pick, null);

  if (unknown.size) {
    const lines = [`ERROR: ${unknown.size === 1 ? 'unknown atom' : `${unknown.size} unknown atoms`} in ${picksPath}`, ''];
    let anyMoved = false;
    for (const [name, declaredBy] of unknown) {
      const origin = declaredBy ? ` (declared as a dependency of "${declaredBy}")` : '';
      if (MOVED_TO_CLASS.has(name)) {
        anyMoved = true;
        lines.push(`  "${name}"${origin} — now a class, not a component: .${name} in loom.components.css`);
        continue;
      }
      const hits = suggest(name);
      lines.push(`  "${name}"${origin}${hits.length ? ` — did you mean: ${hits.join(', ')}?` : ''}`);
    }
    if (anyMoved) {
      lines.push(
        '',
        'Those carried no behavior, so their appearance moved into the class layer — which is',
        'why they now work in a template or a printed page as well as in React. Drop them from',
        'loom-picks.json and use the class:',
        '',
        '  <div class="card" data-size="md" data-variant="default">…</div>',
        '',
        'Sizes ride on data-size, named looks on data-variant, color composes from the tone and',
        'treatment classes. Your installed copies keep working until you delete them.'
      );
    }
    lines.push('', `Valid ids: ${path.join(catalogDir, 'atoms.json')} (${validIds.length} atoms, grouped by category)`);
    fail(lines);
  }


  const npm = new Set();
  for (const name of [...resolved, 'cn']) {
    const manifestPath = path.join(catalogDir, `${name}.manifest.json`);
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const dep of manifest.npmDependencies || []) npm.add(dep);
  }
  return { atoms: [...resolved], npmDependencies: [...npm].sort() };
}

// --- CLI ---
if (require.main === module) {
  const [, , picksPath, catalogDir] = process.argv;
  const npmMode = process.argv.includes('--npm');
  if (!picksPath || !catalogDir) {
    console.error('Usage: node resolve-picks.js <loom-picks.json> <catalog-dir> [--npm]');
    process.exit(1);
  }
  let out;
  try {
    out = resolvePicks(picksPath, catalogDir);
  } catch (e) {
    if (!(e instanceof PickError)) throw e;
    console.error('');
    for (const line of e.lines) console.error(line);
    console.error('');
    console.error('Nothing was copied.');
    process.exit(1);
  }
  process.stdout.write(
    npmMode ? out.npmDependencies.join(' ') + '\n' : out.atoms.join('\n') + '\n'
  );
}

module.exports = { resolvePicks, PickError };
