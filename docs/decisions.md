# Design decisions

Newest first. A decision made in a Claude Design chat or a meeting is recorded here, because those
are not kept.

## 2026-10-15 — round 2: synced to the Recordbench cuts (decision #250)

Recordbench cut its front-page variants and the Press's single field (Recordbench decision #250,
`press-page` branch). The cards follow the app; no family token changes.

- **The Press is a page of plates.** Each investigation draws its own plate at rest, in the page's
  flow: no camera, pan, zoom, dive, open state, focus lens or light pool. Hover traces a chain;
  the draw-in plays once a session over `--motion-settle` × 2.5. The descent into an investigation
  is the page change, and the plate grows into the overview's header. `recordbench-press` is
  re-ported from `PressPlate.svelte`, with `buildField` still verbatim.
- **Press tokens retired** (not family tokens, so no release): `--press-ink-3`, `--press-shade`,
  `--press-plate-bg`, `--press-plate-clear`, `--press-toner-solid`, `--press-c-lit`, `--press-pool`,
  `--press-pool-a`, `--press-grain-*`, `--press-night`, the `--press-k/-p/-arr/-cen` axes, and
  `--motion-live`. `--rt-press`, `--rt-accent` and `--rt-font-didot` stay.
- **One front page.** Cards, Desk and Cabinet, the dev design switch and every `--desk-*` token are
  gone. This settles the bench-design half of the round-1 open call; the four alternate looks are
  still open.
- **Bench root:** the find bar, the per-row hues, the PlateArt cards and the Plates dials in settings
  are gone. The inventory card drops the Cards/Desk/Cabinet row and Cabinet's sub-11px label.

## 2026-10-15 — v0.2.1

Inter italic now ships beside the upright, so sans italics stop rendering as a slanted imitation of the upright face. The licence path in `family-fonts.css` is also corrected. No token values change.

## 2026-10-15 — round 1 rulings (ratified by Thomas in Claude Design), v0.2.0

Source: `design/index.html`, `design/cards/type.html` and `design/cards/colour.html`, pulled the same
day.

- **Type roles are ratified.** All chrome uses Inter and the system mono in every product. Display
  and reading faces stay per product. The eight-step type scale, with nothing below 11px, is shared.
- **Recordbench keeps Iowan** as its reading face. Reading is per product.
- **The family palette is ratified**, light and dark, as in v0.1.0.
- **Inter now ships in the package** (v0.2.0) as `family-fonts.css` plus `fonts/InterVariable.woff2`,
  under the SIL Open Font License. Each consumer imports it once, so that "Inter for all chrome"
  holds without a separate font dependency in each product.
- **Mockups use fixture names only.** `design/fixtures.json` lists them, and `task check` rejects any
  other name.

**Still open:** whether Recordbench keeps its four looks as alternates. Breakpoints and spacing
remain a proposal.

## 2026-10-15 — Recordbench shell: Proposal C (ratified by Thomas in Claude Design)

Source: `cards/recordbench-shell.html`, pulled from the Claude Design project the same day.

- **No separate shell bar on the Press page.** The account avatar sits in the masthead row, to
  the right of the title, at every width.
- **Desktop:** agent, settings and account sit in one cluster at the right of the title row, in
  that order.
- **Phone (below the phone breakpoint):** the dock holds icon-only slots, agent on the left and
  settings on the right. Back and Find join the dock only on inner pages. Labels survive only as
  accessible names. The dock pads by `env(safe-area-inset-bottom)` when the app runs without
  browser chrome.
- **The agent icon is a robot with two states.** Connected: teal, with a green dot. Not
  connected: dashed and grey, with a pulsing amber dot that opens the connect flow when tapped.
- **Inner pages (the card was silent on these; this is the agent's default, which Thomas
  accepted):** with no Press masthead, the avatar sits at the right end of the crumb row. The
  phone dock has four slots: Back, Find, agent, settings.
- This supersedes Proposals A and B, and the interim two-slot Back/Find dock fix.

## 2026-10-15 — v0.1.0, round 1

**Decided (Thomas):**

- One family design system for RAGtime, The Ledger, Recordbench and Investigations, and not one
  system per product.
- The tokens live in this repo, which is public. Each consumer installs it as a dependency pinned to a release tag (`github:Lawfare-Media/ragtime-design#vX.Y.Z`). An earlier draft had each consumer keep a copy of `dist/`, guarded by a hash check, and that was dropped on the same day.
- The first pass wires all four products onto the tokens.

**Proposed, not yet ruled.** These are the v0.1.0 values. Each can change in a later version.

- **Palette:** Lawfare teal `#006a72` is the single accent. Warm paper `#f5f3ee` is the page, and
  `#fbfaf7` is for raised surfaces. Hairlines are warm (`#d8d4cb`). Dark mode follows the Ledger's
  dark values.
- **Type:** the chrome uses Inter and the system mono in every product. Each product keeps its own
  display and reading face: Garamond for RAGtime, Schola for the Ledger, and Iowan and Didot for
  Recordbench.
- **Scale:** there are eight type steps in rem, and nothing is smaller than 11px. There are eight
  spacing steps.
- **Radius:** 3px by default, 0 for press surfaces, and pill for search fields and avatars.
- **Breakpoints:** two shared widths, phone below 40rem and tablet from 40rem to 64rem. They
  replace the eleven breakpoints the products use today.

**Open:**

- Whether Recordbench's four looks remain as alternates.

**Ruled after review (Thomas, same day):** dark `sunk` is `#111416`, darker than dark paper, so sunk means recessed in both modes. The Ledger's dark wells get slightly darker as a result.
