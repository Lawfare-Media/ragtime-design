#!/usr/bin/env node
// Reports which ragtime-design tag each consumer depends on, on its default branch.
// Reads each consumer's package.json through `gh api`; needs a gh login that can read them.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const NAME = '@lawfare/ragtime-design';
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const { consumers } = JSON.parse(readFileSync(new URL('../consumers.json', import.meta.url)));

console.log(`source: v${version}`);
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
    state = !spec ? 'not a consumer yet' : tag ? `v${tag}${tag === version ? '' : '  (behind)'}` : spec;
  } catch {
    state = 'unreadable';
  }
  console.log(`${c.name.padEnd(15)} ${state}`);
}
