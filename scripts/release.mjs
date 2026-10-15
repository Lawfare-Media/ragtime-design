#!/usr/bin/env node
// `task release`: tag the version that is on main, then open one bump PR in each consumer that is
// behind it. Runs on this machine with the operator's own gh login, so no token is stored in this
// public repo, and it reaches consumers under any owner that login can push to.
//
//   task release                       tag (if needed) and bump every consumer that is behind
//   task release -- --dry-run          do everything in temp clones, push and open nothing
//   task release -- --only RAGtime,Recordbench
//
// It refuses rather than guesses: no tag unless main's `check` run passed on the exact commit, and
// no PR unless the lockfile moved to the tag's commit and changed nothing but this package.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = 'Lawfare-Media/ragtime-design';
const NAME = '@lawfare/ragtime-design';
const GATE = 'check';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? new Set((args[onlyAt + 1] ?? '').split(',').map((s) => s.trim().toLowerCase())) : null;

const run = (cmd, argv, opts = {}) =>
  execFileSync(cmd, argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const ok = (cmd, argv, opts = {}) => {
  try {
    run(cmd, argv, opts);
    return true;
  } catch {
    return false;
  }
};
const die = (msg) => {
  console.error(`release: ${msg}`);
  process.exit(1);
};
const parts = (v) => v.split('.').map(Number);
const cmp = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

// -- 1. the version on main, and its gate ------------------------------------------------------

run('git', ['fetch', '-q', 'origin', 'main']);
const head = run('git', ['rev-parse', 'origin/main']);
const version = JSON.parse(run('git', ['show', 'origin/main:package.json'])).version;
const tag = `v${version}`;
console.log(`source: ${tag} on main at ${head.slice(0, 7)}${dry ? '  (dry run)' : ''}`);

let target;
if (ok('gh', ['release', 'view', tag, '-R', REPO])) {
  target = run('gh', ['api', `repos/${REPO}/commits/${tag}`, '--jq', '.sha']);
  console.log(`release ${tag} exists at ${target.slice(0, 7)}`);
} else {
  const runs = JSON.parse(
    run('gh', ['api', `repos/${REPO}/commits/${head}/check-runs`, '--jq', '[.check_runs[] | {name, status, conclusion}]']),
  );
  const gate = runs.find((r) => r.name === GATE);
  if (!gate) die(`no '${GATE}' run on ${head.slice(0, 7)}: the gate never started, so nothing is tagged`);
  if (gate.status !== 'completed' || gate.conclusion !== 'success')
    die(`'${GATE}' on ${head.slice(0, 7)} is ${gate.status}/${gate.conclusion ?? 'pending'}: nothing is tagged`);
  target = head;
  if (dry) console.log(`would release ${tag} at ${head.slice(0, 7)}`);
  else {
    run('gh', ['release', 'create', tag, '-R', REPO, '--target', head, '--title', tag, '--generate-notes']);
    console.log(`released ${tag} at ${head.slice(0, 7)}`);
  }
}

// -- 2. each consumer ---------------------------------------------------------------------------

const { consumers } = JSON.parse(readFileSync(new URL('../consumers.json', import.meta.url)));
const spec = `github:${REPO}#${tag}`;
const branch = `design-${tag}`;
const notes = `https://github.com/${REPO}/releases/tag/${tag}`;

/** npm: the lockfile with every trace of this package removed, for a like-for-like comparison. */
function npmRest(text) {
  const lock = JSON.parse(text);
  for (const [path, entry] of Object.entries(lock.packages ?? {})) {
    if (path.includes('ragtime-design')) delete lock.packages[path];
    else for (const k of ['dependencies', 'devDependencies']) if (entry[k]) delete entry[k][NAME];
  }
  return JSON.stringify(lock);
}

function bump(c) {
  const manifest = JSON.parse(
    Buffer.from(run('gh', ['api', `repos/${c.repo}/contents/${c.manifest}`, '--jq', '.content']), 'base64').toString(),
  );
  const current = { ...manifest.dependencies, ...manifest.devDependencies }[NAME];
  const from = current?.match(/#v?(\d+\.\d+\.\d+)$/)?.[1];
  if (!from) return `skipped: pin is ${current ?? 'absent'}, not a release tag`;
  if (cmp(from, version) >= 0) return `already on v${from}`;
  const open = run('gh', ['pr', 'list', '-R', c.repo, '--head', branch, '--state', 'open', '--json', 'url', '--jq', '.[0].url']);
  if (open) return `bump PR already open: ${open}`;

  const dir = mkdtempSync(join(tmpdir(), 'rt-release-'));
  run('gh', ['repo', 'clone', c.repo, dir, '--', '--depth', '1', '-q']);
  const git = (...a) => run('git', ['-C', dir, ...a]);
  git('switch', '-q', '-c', branch);

  const oldPin = `${REPO}#v${from}`;
  const pinned = git('grep', '-l', '-F', oldPin).split('\n').filter(Boolean);

  const lockDir = join(dir, c.lockDir ?? '.');
  const pnpm = existsSync(join(lockDir, 'pnpm-lock.yaml'));
  const lockFile = join(lockDir, pnpm ? 'pnpm-lock.yaml' : 'package-lock.json');
  if (!existsSync(lockFile)) throw new Error(`no lockfile in ${c.lockDir ?? '.'}`);
  const before = readFileSync(lockFile, 'utf8');

  // Name the package at the new tag: a plain install after editing the tag keeps the old commit.
  const ws = c.workspace ? (pnpm ? ['--filter', `./${c.workspace}`] : ['-w', c.workspace]) : [];
  if (pnpm) run('pnpm', ['add', `${NAME}@${spec}`, '--lockfile-only', '--ignore-scripts', ...ws], { cwd: lockDir });
  else run('npm', ['install', `${NAME}@${spec}`, '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', ...ws], { cwd: lockDir });

  // The package manager reformats manifests; put them back and move the pin by hand.
  const touched = git('diff', '--name-only').split('\n').filter((f) => f.endsWith('package.json'));
  if (touched.length) git('checkout', '--', ...touched);
  for (const f of pinned) {
    const p = join(dir, f);
    writeFileSync(p, readFileSync(p, 'utf8').split(oldPin).join(`${REPO}#${tag}`));
  }

  const after = readFileSync(lockFile, 'utf8');
  if (!after.includes(target)) throw new Error(`lockfile did not move to ${tag}'s commit ${target.slice(0, 7)}`);
  if (pnpm) {
    const changed = git('diff', '-U0', '--', lockFile).split('\n').filter((l) => /^[+-][^+-]/.test(l));
    if (changed.length > 24 || !changed.some((l) => l.includes('ragtime-design')))
      throw new Error(`lockfile changed ${changed.length} lines, more than this package; inspect ${dir}`);
  } else if (npmRest(before) !== npmRest(after)) {
    throw new Error(`lockfile changed entries other than ${NAME}; inspect ${dir}`);
  }

  const files = git('diff', '--name-only').split('\n').filter(Boolean);
  if (dry) return `would open a PR from ${dir}, changing ${files.join(', ')}`;

  git('add', '--', ...files);
  git('commit', '-q', '-m', `Design tokens from ragtime-design ${tag}`, '-m', `Moves ${NAME} from v${from} to ${tag}. Release notes: ${notes}`);
  git('push', '-q', '-u', 'origin', `${branch}:${branch}`);
  const body = [
    `Moves \`${NAME}\` from v${from} to **${tag}**. What changed: ${notes}`,
    '',
    `Files: ${files.map((f) => `\`${f}\``).join(', ')}. The lockfile moved to ${tag}'s commit (${target.slice(0, 7)}) and changed nothing but this package.`,
    '',
    "Opened by `task release` in ragtime-design. This repository's own CI is the gate.",
  ].join('\n');
  return run('gh', ['pr', 'create', '-R', c.repo, '--head', branch, '--title', `Design tokens from ragtime-design ${tag}`, '--body', body]);
}

let failed = 0;
for (const c of consumers) {
  if (only && !only.has(c.name.toLowerCase())) continue;
  let line;
  try {
    line = bump(c);
  } catch (err) {
    failed += 1;
    line = `FAILED: ${String(err.stderr || err.message).trim().split('\n').slice(-3).join(' / ')}`;
  }
  console.log(`${c.name.padEnd(15)} ${line}`);
}
process.exit(failed ? 1 : 0);
