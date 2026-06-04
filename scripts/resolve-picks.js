#!/usr/bin/env node
/**
 * resolve-picks.js — resolve a project's loom-picks.json to the full atom set.
 *
 * Reads `picks`, walks each atom's manifest `dependencies` transitively, and prints the
 * resolved atom names (one per line, excluding `cn` — copied unconditionally by setup.sh).
 *
 * Usage: node resolve-picks.js <loom-picks.json> <catalog-dir>
 */
const fs = require('fs');
const path = require('path');

const [, , picksPath, catalogDir] = process.argv;
if (!picksPath || !catalogDir) {
  console.error('Usage: node resolve-picks.js <loom-picks.json> <catalog-dir>');
  process.exit(1);
}

const picks = JSON.parse(fs.readFileSync(picksPath, 'utf8')).loom.picks;
const resolved = new Set();

function visit(name) {
  if (resolved.has(name) || name === 'cn') return;
  resolved.add(name);
  const manifestPath = path.join(catalogDir, `${name}.manifest.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`  WARN: no manifest for picked/dep atom "${name}" — skipping its deps`);
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const dep of manifest.dependencies || []) visit(dep);
}

picks.forEach(visit);
process.stdout.write([...resolved].join('\n') + '\n');
