#!/usr/bin/env node
// Generates dist/ from tokens/family.json. No dependencies.
//
// dist/ is committed: consumers install this repo by git tag (no registry), so what the tag
// holds is what they get. The build refuses to run if package.json and the token source
// disagree on the version, because the tag, the package and the header must all say one thing.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'tokens/family.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (pkg.version !== src.version) {
  console.error(`version mismatch: package.json ${pkg.version}, tokens/family.json ${src.version}`);
  process.exit(1);
}
const out = join(root, 'dist');
mkdirSync(out, { recursive: true });

const P = '--rt-';

/** Flatten one token group into [name, value, note] rows. */
const rows = (group, prefix) =>
  Object.entries(group).map(([k, v]) => [`${P}${prefix}${k}`, v.value, v.note]);

const decl = ([name, value, note]) => `  ${name}: ${value};${note ? ` /* ${note} */` : ''}`;

/** The dark selectors each consumer already writes: Ledger data-scheme, Recordbench data-mode, Tailwind .dark. */
const DARK = ':root[data-scheme="dark"],\n:root[data-mode="dark"],\n.dark';

function css() {
  const light = [
    ...rows(src.color.light, ''),
    ...rows(src.font, 'font-'),
    ...rows(src.text, 'text-'),
    ...rows(src.space, 'space-'),
    ...rows(src.radius, 'radius-'),
    ...rows(src.chrome, ''),
  ];
  const dark = rows(src.color.dark, '');
  const bps = Object.entries(src.breakpoint)
    .map(([k, v]) => ` *   ${k.padEnd(7)} ${v.value}  ${v.note}`)
    .join('\n');
  return [
    '/*',
    ' * RAGtime family tokens. Generated from tokens/family.json in Lawfare-Media/ragtime-design.',
    ' * Do not edit: change the source, run `task build`, re-vendor.',
    ' *',
    ' * Breakpoints (media queries cannot read custom properties, so write the literal):',
    bps,
    ' */',
    '',
    ':root {',
    ...light.map(decl),
    '}',
    '',
    `${DARK} {`,
    ...dark.map(decl),
    '}',
    '',
  ].join('\n');
}

function tailwind() {
  // Tailwind v4: utilities named after the family (bg-rt-paper, text-rt-ink, font-rt-ui …),
  // resolved at runtime through the custom properties, so dark mode follows family.css.
  const color = Object.keys(src.color.light).map((k) => `  --color-rt-${k}: var(${P}${k});`);
  const font = Object.keys(src.font).map((k) => `  --font-rt-${k}: var(${P}font-${k});`);
  const text = Object.keys(src.text).map((k) => `  --text-rt-${k}: var(${P}text-${k});`);
  const radius = Object.keys(src.radius).map((k) => `  --radius-rt-${k}: var(${P}radius-${k});`);
  const bp = Object.entries(src.breakpoint).map(([k, v]) => `  --breakpoint-rt-${k}: ${v.value};`);
  return [
    '/*',
    ' * RAGtime family tokens as a Tailwind v4 theme. Import after family.css.',
    ' * Generated from tokens/family.json in Lawfare-Media/ragtime-design. Do not edit.',
    ' */',
    '',
    '@theme inline {',
    ...color,
    ...font,
    ...text,
    ...radius,
    ...bp,
    '}',
    '',
  ].join('\n');
}

const header = (c) => `${c} @lawfare/ragtime-design v${src.version} · generated from tokens/family.json · do not edit`;

// The faces the family ships rather than names: today only Inter, the chrome face every
// product shares (ruled 2026-10-15). A product that wants it imports family-fonts.css; the
// woff2 sits beside it under dist/fonts/, so the relative url resolves from the package.
function fonts() {
  return [
    '/* Inter (SIL Open Font License 1.1, fonts/inter/OFL.txt). One variable file covers 100-900. */',
    '@font-face {',
    "  font-family: 'Inter';",
    '  font-style: normal;',
    '  font-weight: 100 900;',
    '  font-display: swap;',
    "  src: url('./fonts/InterVariable.woff2') format('woff2');",
    '}',
    '',
  ].join('\n');
}

mkdirSync(join(out, 'fonts'), { recursive: true });
copyFileSync(join(root, 'fonts/inter/InterVariable.woff2'), join(out, 'fonts/InterVariable.woff2'));
copyFileSync(join(root, 'fonts/inter/OFL.txt'), join(out, 'fonts/Inter-OFL.txt'));

const files = {
  'family-fonts.css': `/*${header('')} */\n${fonts()}`,
  'family.css': `/*${header('')} */\n${css()}`,
  'family.tailwind.css': `/*${header('')} */\n${tailwind()}`,
  'family.json': JSON.stringify(src, null, 2) + '\n',
};

for (const [name, text] of Object.entries(files)) writeFileSync(join(out, name), text);
console.log(`built dist/ for v${src.version}: ${Object.keys(files).join(', ')}`);
