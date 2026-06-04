# Provenance & Project Model

## What Loom is

Loom is a token-driven design system generator. From a tiered project questionnaire it produces a coherent token substrate — color, type, spacing, sizing, effects, motion — and emits it across three targets from a single config source: Figma variables/styles/components, CSS custom properties + Tailwind v4 theming, and React component scaffolds. One config change regenerates every output.

## v2 — catalog + picker

v2 moves Loom from "ship all ~55 atoms by default" to a **first-party component catalog with a per-project picker**. A consuming project declares the atoms it wants; only those are copied in, and they are project-owned after install (shadcn-style — edit freely, no upstream auto-sync). Tokens still ship as a single all-or-nothing substrate bundle.

Full architecture is in `CATALOG_SPEC.md`; per-atom decisions in `CATALOG_AUDIT.md`; the design-system engineering docs in `docs/design-system/`.

## Why this repo starts at a clean history

Loom was developed inside a personal monorepo and extracted here on 2026-06-04 via a fresh `git init` rather than a history filter — the monorepo's history interleaved unrelated work, so a clean cut was the honest option. Pre-extraction design decisions are preserved as **documentation** (this file, `CATALOG_SPEC.md`, `docs/`) rather than as commit history.

## Validation — substantiated in production

Loom's token substrate + atoms shipped three downstream products before the v2 overhaul:

| Project | Type | Loom atoms used | Pruned | Project-authored |
|---|---|---|---|---|
| Paperboy | dashboard | ~all 55 | ~0 | 1 |
| Party Wipe | dashboard | ~all 55 | ~0 | 2 + color layer |
| Portfolio | marketing | ~8 of 55 | 47 | 19 (marketing primitives) |

Dashboards keep ~all atoms; the marketing site kept ~15% and authored its own characterization layer on top. That split is the production evidence behind the v2 direction — first-class marketing primitives plus a picker so each project pulls only what it needs. The reasoning is in `docs/design-rationale/substrate-not-ambition.md`.
