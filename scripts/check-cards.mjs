#!/usr/bin/env node
// Rejects any investigation name in a design card that is not in design/fixtures.json.
// The repo is public and the cards are pulled from Claude Design, where real names creep in;
// this is the gate that catches them. It reads the two shapes mockups use for an
// investigation: a numbered list row (<li><span>IV</span><div>Name<small>) and a crumb's
// current step after a chevron (›</span><span class="on">Name</span>).

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../design/', import.meta.url).pathname;
const allowed = new Set(JSON.parse(readFileSync(join(root, 'fixtures.json'), 'utf8')).investigations);
const shapes = [
  /<li><span>[IVXLC]+<\/span><div>([^<]+)<small>/g,
  /›<\/span><span class="on">([^<]+)<\/span>/g,
];

const files = ['index.html', ...readdirSync(join(root, 'cards')).map((f) => join('cards', f))];
let bad = 0;
for (const f of files) {
  const text = readFileSync(join(root, f), 'utf8');
  for (const re of shapes) {
    for (const [, name] of text.matchAll(re)) {
      if (!allowed.has(name.trim())) {
        console.error(`design/${f}: "${name.trim()}" is not a fixture name (design/fixtures.json)`);
        bad++;
      }
    }
  }
}
console.log(bad ? `${bad} non-fixture name(s)` : `design/: every investigation name is a fixture`);
process.exit(bad ? 1 : 0);
