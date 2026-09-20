#!/usr/bin/env node
/**
 * provenance.test.js — check that sync.js can always name the Loom it is delivering.
 *
 *   node scripts/provenance.test.js
 *
 * Weighted toward the cases that go wrong silently. A provenance string that is
 * right when everything is normal proves little; the failure worth catching is
 * `undefined` or a clean-looking hash stamped into ninety delivered files from a
 * tree that was not clean.
 *
 * Exits 1 if any case is wrong.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { provenance } = require('./sync.js');

let failures = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ok    ${label}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${label}`);
    console.log(`        ${error.message.split('\n')[0]}`);
  }
}

/** Make a throwaway repo with a commit in it, and return its path. */
function repoWith(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-prov-'));
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), body);
  }
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: 'ignore' });
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--no-verify', '-m', 'x');
  return root;
}

console.log('provenance');

check("names Loom's own version and a short hash", () => {
  assert.match(provenance(), /^\d+\.\d+\.\d+ \([0-9a-f]{7,}(-dirty)?\)$/);
});

check('marks a dirty producing tree', () => {
  const root = repoWith({ 'package.json': '{"version":"9.9.9"}', 'a.txt': 'one' });
  assert.strictEqual(provenance(root), '9.9.9 (' + short(root) + ')');
  fs.writeFileSync(path.join(root, 'a.txt'), 'two');
  assert.strictEqual(provenance(root), '9.9.9 (' + short(root) + '-dirty)');
});

check('names an unknown commit rather than undefined outside a repo', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-prov-'));
  fs.writeFileSync(path.join(root, 'package.json'), '{"version":"1.2.3"}');
  assert.strictEqual(provenance(root), '1.2.3 (unknown-commit)');
});

check('names an unknown version rather than undefined without a package.json', () => {
  const root = repoWith({ 'a.txt': 'one' });
  assert.strictEqual(provenance(root), 'unknown-version (' + short(root) + ')');
});

check('never returns undefined in any part of the string', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-prov-'));
  assert.doesNotMatch(provenance(root), /undefined/);
});

/** The short hash git itself would print for a repo, so the test does not reimplement it. */
function short(root) {
  return execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
}

console.log(failures ? 'failed' : 'pass');
process.exit(failures ? 1 : 0);
