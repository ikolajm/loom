#!/usr/bin/env node
/**
 * Show what a change does to the four emitted stylesheets.
 *
 * `generated/` is gitignored, and rightly — it holds literal hex from whichever brand is
 * active, the same reason `spec/answers.json` is ignored. But that makes the deliverable
 * invisible: `git diff` reports nothing for the file the class layer actually ships, so a
 * change to the emitter is reviewed by reading the emitter and trusting it.
 *
 * That is how `.helper-text-line`, `.label-line`, `.kbd-min`, `.textarea-min` and
 * `.spinner-border` lived in the layer — five classes for elements that do not exist. No
 * check failed and no page rendered wrong, because the real declaration also lands on the
 * element. They were found by reading the emitted CSS for an unrelated reason.
 *
 * So: generate the stylesheets at a ref and at the working tree, and diff them. The brand
 * is copied into the temp worktree so the output differs only where the generator does,
 * not because one side fell back to the committed base config.
 *
 *   node scripts/diff-emit.js            # working tree vs HEAD
 *   node scripts/diff-emit.js HEAD~3     # working tree vs an older ref
 *   node scripts/diff-emit.js --stat     # summary only
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['tokens.css', 'loom.css', 'loom.components.css', 'loom.tailwind.css'];
const BRAND = ['spec/answers.json', 'spec/config/local'];

const args = process.argv.slice(2);
const statOnly = args.includes('--stat');
const ref = args.find((a) => !a.startsWith('--')) || 'HEAD';

const run = (cmd, cmdArgs, cwd) =>
  execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function emitInto(cwd, out) {
  fs.mkdirSync(out, { recursive: true });
  run('node', ['scripts/code-templates/orchestrator.js', '--only', 'tokens', '--output', out], cwd);
  return out;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-diff-emit-'));
const worktree = path.join(tmp, 'ref');
let added = false;
try {
  run('git', ['worktree', 'add', '--detach', worktree, ref], ROOT);
  added = true;

  // The brand is untracked, so the worktree would otherwise fall back to the committed
  // base config and every token would read as changed.
  for (const rel of BRAND) {
    const from = path.join(ROOT, rel);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(worktree, rel), { recursive: true });
  }

  const before = emitInto(worktree, path.join(tmp, 'before'));
  const after = emitInto(ROOT, path.join(tmp, 'after'));

  let changed = 0;
  for (const f of FILES) {
    const a = path.join(before, f);
    const b = path.join(after, f);
    if (!fs.existsSync(a) || !fs.existsSync(b)) { console.log(`  ${f} — present on only one side`); changed++; continue; }
    let diff = '';
    try {
      execFileSync('diff', ['-u', '--label', `${ref}/${f}`, '--label', `worktree/${f}`, a, b], { encoding: 'utf8' });
    } catch (e) {
      diff = e.stdout || '';   // diff exits 1 when files differ
    }
    if (!diff) continue;
    changed++;
    const lines = diff.split('\n');
    const adds = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
    const dels = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
    console.log(`  ${f.padEnd(22)} +${adds} -${dels}`);
    if (!statOnly) console.log(diff.split('\n').map((l) => '    ' + l).join('\n'));
  }
  if (!changed) console.log(`  no change to the emitted stylesheets against ${ref}`);
} finally {
  if (added) { try { run('git', ['worktree', 'remove', '--force', worktree], ROOT); } catch {} }
  fs.rmSync(tmp, { recursive: true, force: true });
}
