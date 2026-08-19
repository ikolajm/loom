/**
 * A fingerprint of everything that decides what `catalog/*.tsx` contains.
 *
 * The sync needs to answer "are these atoms stale?" and mtimes cannot: a `git checkout`
 * rewrites every timestamp, so a fresh clone would warn on the first sync and every clone
 * after, which is the kind of false positive that trains people to ignore the message.
 *
 * Hashing the inputs instead is deterministic and survives checkout. The stamp is written
 * into `catalog/atoms.json` at generate time and recomputed at sync time; a mismatch means
 * the templates or schemas moved after the catalog was last built.
 *
 * Both sides import this, so the definition of "the inputs" cannot drift between the
 * thing that stamps and the thing that checks — which is the failure this file exists to
 * avoid repeating, having already shipped a hand-maintained mirror twice.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// Component output is a function of the component schemas and the code templates. Token
// configs are deliberately absent: the substrate is regenerated on every sync regardless,
// so a brand change must not read as a stale catalog.
const INPUT_DIRS = [
  path.join(ROOT, 'spec/config/components'),
  path.join(ROOT, 'scripts/code-templates'),
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|json|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function inputHash() {
  const h = crypto.createHash('sha256');
  for (const file of INPUT_DIRS.flatMap((d) => walk(d))) {
    h.update(path.relative(ROOT, file));
    h.update(fs.readFileSync(file));
  }
  return h.digest('hex').slice(0, 12);
}

module.exports = { inputHash };
