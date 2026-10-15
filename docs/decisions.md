# Design decisions

Newest first. A decision made in a Claude Design chat or a meeting is recorded here, because those
are not kept.

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

- The Recordbench phone shell. Proposal A paints the chrome in the page's paper and moves settings
  into the dock. Proposal B removes the top bar on a phone. See `cards/recordbench-shell.html`.
- Whether RAGtime keeps Lato or uses Inter for its UI.
- Whether Recordbench reads in Iowan or EB Garamond.
- Whether Recordbench's four looks remain as alternates.
