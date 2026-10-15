#!/usr/bin/env node
// Reports which ragtime-design tag each consumer depends on, on its default branch.
// Reads each consumer's package.json through `gh api`; needs a gh login that can read them.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const NAME = '@lawfare/ragtime-design';
// The version on main, not in this checkout, which may be behind it.
execFileSync('git', ['fetch', '-q', 'origin', 'main']);
const { version } = JSON.parse(execFileSync('git', ['show', 'origin/main:package.json'], { encoding: 'utf8' }));
const { consumers } = JSON.parse(readFileSync(new URL('../consumers.json', import.meta.url)));
const cmp = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};
const mark = (tag) => (cmp(tag, version) < 0 ? '  (behind)' : cmp(tag, version) > 0 ? '  (ahead of main)' : '');

console.log(`main: v${version}`);
for (const c of consumers) {
  let state;
  try {
    const b64 = execFileSync('gh', ['api', `repos/${c.repo}/contents/${c.manifest}`, '--jq', '.content'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const pkg = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const spec = { ...pkg.dependencies, ...pkg.devDependencies }[NAME];
    const tag = spec?.match(/#v?(\d+\.\d+\.\d+)$/)?.[1];
    state = !spec ? 'not a consumer yet' : tag ? `v${tag}${mark(tag)}` : spec;
  } catch {
    state = 'unreadable';
  }
  console.log(`${c.name.padEnd(15)} ${state}`);
}
