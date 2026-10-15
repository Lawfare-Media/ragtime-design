# ragtime-design

Shared design tokens and design-system source for the RAGtime family:

| Product | Repo | Depends on it from |
|---|---|---|
| RAGtime | `benjaminwittes/ragtime` | `app/package.json` |
| The Ledger (blog reader) | `Lawfare-Media/lawfare-web` | `package.json` |
| Recordbench | `Lawfare-Media/recordbench` | `frontend/package.json` |
| Investigations | `Lawfare-Media/ragtime-investigations` | `packages/look/package.json` |

The products share foundations and chrome: colour, the UI and mono faces, the type and spacing
scales, radius, breakpoints and the shape of the top bar. Each product keeps its own voice in
display and reading type.

## Layout

```
tokens/family.json   the one source of truth
dist/                generated and committed: family.css, family.tailwind.css, family.json
cards/               design-system cards (HTML), the source of the Claude Design project "RAGtime Family"
docs/decisions.md    what was decided, when and why. Design chats are not a record
consumers.json       each consumer and the package.json that depends on this
```

## Installing

The package is installed straight from this public repo, pinned to a release tag. There is no
registry and no token.

```sh
npm install github:Lawfare-Media/ragtime-design#v0.1.0     # or: pnpm add …
```

The dependency appears in package.json as
`"@lawfare/ragtime-design": "github:Lawfare-Media/ragtime-design#v0.1.0"`, and the lockfile pins
the exact commit.

- **Plain CSS** (Recordbench, the Ledger, Investigations): `@import '@lawfare/ragtime-design/family.css';`.
  Then map the product's own token names onto `--rt-*` in the product's stylesheet. The mapping
  belongs to the product. This repo never names a product's internals.
- **Tailwind v4** (RAGtime): import `family.css`, then `family.tailwind.css`. This adds `rt-*`
  utilities such as `bg-rt-paper`, `text-rt-ink`, `font-rt-ui` and `rounded-rt-default`.
- **Dark mode** follows the attribute the product already writes: `data-scheme="dark"`,
  `data-mode="dark"` or the `.dark` class. Nothing here reads `prefers-color-scheme`. A product
  that follows the OS sets its own attribute.
- **Breakpoints** cannot be custom properties inside `@media`, so write the literal: phone `40rem`,
  tablet `64rem`.
- **Fonts** are named here but not shipped. Each product self-hosts the faces it uses. Where a face
  is not loaded, the stacks fall back cleanly.

## Changing a token

1. Edit `tokens/family.json`. Bump `version` there and in `package.json`. Use minor for a value
   change and major for a rename or removal. The build refuses to run if the two versions differ.
2. Run `task build`, then commit the source and `dist/` together. `task check` is the gate, and CI
   runs it. It fails if `dist/` is not exactly what the source generates.
3. Log the decision in `docs/decisions.md`.
4. After the merge, tag the release on `main`: `gh release create v0.2.0`.
5. In each consumer, bump the tag in its package.json and reinstall, as one PR per repo.
   `task status` shows which tag each consumer is on.
