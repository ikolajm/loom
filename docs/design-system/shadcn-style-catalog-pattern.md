# Shadcn-style Catalog Pattern

A design system architecture pattern: a **first-party component catalog with a per-project picker**, where consuming projects pick the atoms they want, the picked files are copied into the project's source tree, and the consuming project owns those files after install. No runtime library, no upstream auto-flow, no override config layer — just curated source files that become yours.

Originated by [shadcn/ui](https://ui.shadcn.com). The same shape applies any time you have a design system you want consumed across multiple projects without coupling those projects to a versioned package.

## When to reach for it

This pattern fits when **all** are true:

- You author the catalog yourself (or as a small team) — you're not building a marketplace for third-party contributions
- The consuming projects benefit from owning + editing their installed components, not from receiving upstream updates
- You'd rather hand-roll consistency through authoring discipline than build a versioning + diff-merge system
- Project-specific divergence is expected and welcomed (each project's installed `Button` may evolve differently)

It does NOT fit when:

- Consumers need upstream bug fixes to propagate automatically — that's a library/package model (Material UI, Bootstrap, Radix Themes)
- Multi-project consistency must be enforced — that's a monorepo with shared workspace packages
- Consumers can't be trusted to maintain installed files (e.g., non-technical end users) — that's a build-time component injection system

The thing you're explicitly trading away: automatic propagation of upstream changes. The thing you're getting: maximal consumer autonomy + zero coupling.

## Core shape

Three surfaces, three roles:

| Surface | Role | Lives in |
|---|---|---|
| **Catalog browser** | Canonical, read-only view of every atom in its blessed state. The "what's available" surface. Has prop controls so users can see variant space before picking. | Catalog repo |
| **Project playground** | Live tinker surface in each consuming project. Shows only installed atoms (picked + project-authored). Full prop controls. Marks the surface where edits happen and where upstream-promotion candidates surface. Dev-only — not shipped to production. | Consuming project |
| **Production app** | Just the picked + project-authored atom files. Zero playground/stories footprint. | Consuming project |

The catalog browser is the "spec." The project playground is the "operational reality." Comparing them is the upstream-pitch surface.

## Picker mechanism

A small CLI or config file in the consuming project declares what's picked. shadcn uses CLI (`npx shadcn add button`). A declarative config file (`picks.json` listing component names) is the alternative — more honest about "what does this project contain" since it's a single source of truth in the repo, not in shell history.

Re-running install resyncs based on the config — so picks evolve via edit-and-rerun, not via re-typing CLI commands.

## Manifest per component

Every catalog item ships with a sibling manifest declaring its contract:

```json
{
  "name": "combobox",
  "dependencies": ["react"],
  "registryDependencies": ["input", "popover", "command"],
  "files": [
    { "name": "combobox.tsx", "type": "component" },
    { "name": "combobox.story.ts", "type": "story" }
  ]
}
```

| Field | Purpose |
|---|---|
| `name` | Canonical pick key |
| `dependencies` | npm packages required (informs the consumer's package.json) |
| `registryDependencies` | Other catalog items required — resolved transitively by the picker |
| `files` | What lands in the consumer's source tree |

shadcn's actual schema lives at `https://ui.shadcn.com/schema/registry-item.json` (see [[registries]] for the live endpoint reference). The pattern is the important part; the exact field set is shaped to your catalog's needs.

## Versioning stamp on installed files

Every installed file lands with a header comment like:

```tsx
// Installed from [catalog-name] @ 2026-05-28
// Edit freely — no upstream sync. To refresh, re-run install.
```

Cheap and load-bearing. Tells future-you (or a future-collaborator) how old the local fork is when they crack the file open. No automation, no upgrade path — just orientation.

## Upstream-promote loop (manual)

When a project's edits to an installed atom are generalizable, the maintainer manually ports them back to the catalog. There is no automated submission flow. The project playground is the staging surface — devs tinker, decide "this should be upstream," and port the diff by hand.

Speculative future tooling (don't build until friction proves it): a `promote` CLI that diffs an installed file against the catalog version and offers to merge the delta. Only worth building if manual port becomes a recurring drag.

## Costs accepted

The pattern explicitly trades:

- **No upstream auto-flow.** Bug fixes and improvements in catalog atoms don't propagate to projects that already picked. Each project has a frozen-at-pick-time copy. Multi-project consistency requires deliberate re-picking.
- **No automatic dependency resolution beyond the manifest.** The picker reads `registryDependencies` from manifests and pulls in transitively. Anything deeper (e.g., "this atom assumes a `ThemeProvider` exists in the tree") is documented in the atom, not enforced.

The alternative — owning a versioning + diff-merge system that propagates upstream changes — is too much for the value. shadcn lives with these costs deliberately.

## How this dissolves common adjacent problems

- **"Marketing variant" or "dashboard variant" flags on a bundled library.** Replaced by per-project picking — each project picks the atoms it needs; no variant-flag explosion.
- **"Playground / stories shipping with production code."** Replaced by a dev-only playground route in each consuming project (e.g., Next.js route group `(dev)/playground/` excluded from production builds). Production never compiles the playground.
- **"Should this catalog atom be configurable via prop X or hard-coded?"** Resolved post-install — the project edits the file directly. The catalog version stays opinionated; project versions diverge as needed.

## Catalog authoring options

How the catalog files themselves get authored is a separate question. Two paths:

1. **Hand-authored per file.** shadcn's model. Each component is its own source of truth. Per-component edits are free. Consistency lives in discipline (and code review for teams).
2. **Templates produce the catalog.** Catalog files are *generated* from internal templates. Per-component edits require regenerating from templates. Preserves consistency at the cost of indirection.

Hand-authored is right when the team is small enough that drift is managed by review, or when each component is bespoke. Template-driven is right when consistency patterns (prop conventions, class merging, slot composition) are load-bearing and a solo maintainer can't sustain hand-discipline across N atoms. The choice is independent of the catalog-with-picker pattern itself.

## Cross-references

- [[registries]] — live reference endpoints for shadcn (and Material, Radix, etc.) — includes shadcn's actual registry-item schema for the picker manifest pattern
- [[pipeline-architecture]] — three-layer model for token-driven design systems (config + CVA + Radix/lib) — this catalog pattern is what sits downstream of that pipeline when the consumer interface inverts from "ship all" to "pick what you need"
- [ownership-lifecycle.md](ownership-lifecycle.md) — the "atoms are project-owned, recopiable, never re-scaffold" lifecycle that this pattern operationalizes
- [[substrate-not-ambition]] — tokens are foundation regardless of catalog model; this pattern only changes how components are shipped, not how tokens are
- [[component-theft]] — related pattern (steal components, don't adopt frameworks) — this catalog pattern is the *production-grade* version of component theft, with consistency-enforcing authoring on the supply side
