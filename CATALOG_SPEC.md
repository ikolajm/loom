# Loom Catalog Spec

**Architectural reference for the v2 catalog model.** For each component's concrete contract — kind, dependencies, variants, tokens — see its `catalog/[name].manifest.json`.

The model in one paragraph: Loom ships 6 components — 5 atoms and `ThemeProvider`. It is a **first-party component catalog copied into a project wholesale**. `npm run sync` writes every atom into `src/components/`, every run. Deleting one does not stick — a removed file is indistinguishable from a never-installed one, so the next sync restores it. Unimported atoms are tree-shaken and cost nothing shipped, so the cost of carrying one you do not use is a file in your tree, not bytes in your build. Atoms are project-owned after install — edit freely, no upstream auto-flow. They land alongside any project-authored atoms; diffing them against `catalog/` is what surfaces changes worth porting back upstream. Tokens still ship as a single substrate bundle, unchanged.

A consuming project ships atom files and nothing else — no stories, no harness. Marketing characterization is handled by omission rather than a variant flag — see [Marketing characterization is project-owned](#marketing-characterization-is-project-owned).

## Kind: atoms and patterns

Every manifest carries a `kind` — **5 atoms**, **0 patterns**, and `cn` as `utility`.

**The distinction is currently vestigial and the count says so.** It was introduced to make "does this earn its place?" answerable across a 44-component catalog, where an atom justified itself by being unavoidable and a pattern by saving composition. A worked-example set of five does not need a vocabulary for triage. The field stays because manifests carry it and nothing branches on it; if patterns stays at zero, delete the kind rather than keep a word that classifies one thing.

- **atom** — a primitive you compose *with*. One control, one mark, one piece of content: `button`, `input`, `badge`, `avatar`, `label`. An atom earns its place by being unavoidable — you cannot build a form without an input.
- **pattern** — an arrangement already composed *for* you, solving an assembly a consumer would otherwise repeat: `command-palette`, `list-item`, `date-picker`, `sidebar`. A pattern earns its place by saving composition, and is judged against that bar rather than against inevitability.

**The distinction is vocabulary and nothing else.** Both kinds install identically, resolve dependencies identically, and are equally first-class; no generator, check, or install path branches on `kind`. Making it a second install tier was considered and rejected — it would owe consumers a migration and a second mental model to fix what was only a description problem.

**It is declared, not derived**, in `PATTERN_IDS` in `scripts/code-templates/shared.js`. Two mechanical derivations were tried and each measures a different axis. The Figma `build-pattern-*` prefix means "cannot be emitted by the standard variant × size builder," which is why `number` and `relative-time` carry it despite composing nothing. Manifest `dependencies` means "imports another atom," which makes `input` a composer — it imports `form-field` for error context — and a self-contained shell a primitive, since it reimplements an input inline rather than importing one. Both classify backwards. The test that holds: *could a competent consumer assemble this from other Loom components without inventing anything?*

Do not confuse `kind` with the neighbouring `composition` field, which records `asChild`/Slot mechanics — what a component *is* versus how it renders.

---

## Scope: what the catalog covers

The catalog covers the primitives, the infrastructure, and the static catalog.

**In the catalog.** Manifest schema, the `npm run sync` install flow, per-atom catalog generation, the static preview page, the Figma side for static atoms, and a designed primitive in every group. Motion tokens ship with the substrate (one duration, one easing). Composition patterns (`slot` / `asChild` / `children-as-function`) are standardized across atoms that warrant wrapping.

### Marketing characterization is project-owned

Marketing primitives (hero, media, stat, cross-link) are intentionally **not** catalog atoms: they read as project-specific *styling* (characterization), not generalizable *primitives*. Marketing characterization is project-owned: the substrate is the foundation, and the eye-catching layer is built per-project on top of it. A component-gap audit against shadcn confirms the catalog has no missing standard primitives, so the omission leaves no real gap.

---

## Two surfaces, two roles

| Surface | Role | Lives in |
|---|---|---|
| **The catalog** | `catalog/` in this repo — every atom in its blessed state, and what the preview page's class layer is built against. | This repo |
| **Production app** | Catalog + project-authored atom files only. No stories, no harness. | Consuming project |

`catalog/` is the canonical state. A consuming project holds its *own* atoms in *their current state* — synced atoms with whatever local edits it has applied, plus project-authored atoms that haven't been promoted to the catalog (yet).

Diffing a project's atoms against `catalog/` is the upstream-pitch surface. If the project's `Button` has grown variants the catalog `Button` doesn't have, that's the trigger for a manual upstream port.

---

## Install

`npm run sync -- <project>` copies the whole catalog into the consuming project's
`src/components/`, plus `cn` and the three stylesheets. Delete what you do not want.

There was a picker: a `loom-picks.json` in the consuming project listing atom names, and
a resolver that walked each name's manifest `dependencies` transitively. It went when the
catalog reached five. The entire dependency graph is that every atom needs `cn`, which the
sync copies unconditionally and outside the resolved set, so the walk returned what it had
been handed. Deleting a file you did not want is cheaper than maintaining a list of the
ones you did.

The manifests stay, because they answer a question picking never asked: `npmDependencies`
is how a consumer learns `button` needs `@radix-ui/react-slot` and
`class-variance-authority` without reverse-engineering it from imports, and the sync prints
the union of them as a single `npm install` line.

A local edit is still never overwritten — see [Override mechanism](#override-mechanism-shadcn-pure-copy). That guard is
independent of how files are chosen and is the more valuable half of the sync.
## Manifests

Every catalog atom ships with a sibling manifest declaring its contract. Manifest content is sourced from a `$catalog` block inside the per-component JSON (`spec/config/components/*.json`) — the orchestrator merges the `$catalog` metadata with derived fields (`variants` + `sizes` from the design-token half of the JSON, `version` stamp from generation time).

`catalog/[component].manifest.json`:

```json
{
  "name": "badge",
  "category": "button",
  "description": "Label with optional icon and severity. Never interactive — a chip you can click or dismiss is a Button.",
  "version": "a1b2c3d4e5f6",
  "dependencies": ["cn"],
  "tokens": ["color", "typography", "spacing", "sizing"],
  "composition": "slot",
  "sizes": ["sm", "md", "lg"]
}
```

**Required:** `name`, `category`, `dependencies`, `tokens`, `composition`
**Optional:** `description`, `version`, `variants`, `sizes` (when applicable)

| Field | Purpose |
|---|---|
| `name` | The atom's file stem in `catalog/` |
| `category` | Catalog browse grouping (button / form / layout / feedback / data-display / navigation / composite) |
| `description` | Playground UI label, browse summary |
| `version` | Content hash of the atom's generated source — changes only when the atom changes |
| `dependencies` | Other catalog atoms this one imports |
| `tokens` | Which token sets the atom reads (informational — the substrate ships all-or-nothing) |
| `composition` | Slot pattern — how an atom hands its root or its children to a caller. Enum: `none` / `slot` / `slottable` / `children-as-function` |
| `variants` | Primary variant axis |
| `sizes` | Size axis |

### `composition` enum

| Value | Meaning |
|---|---|
| `none` | Leaf atom, no slot pattern (e.g., `helper-text`) |
| `slot` | Radix Slot — supports `asChild` for root replacement (no sibling content) |
| `slottable` | Radix Slot + Slottable — supports `asChild` alongside sibling icons / content. The current `Button` pattern |
| `children-as-function` | Render-prop pattern |

### Deliberately not in the schema

- `states` / `slots` / `behaviorModes` — too granular; the component file + TypeScript types are the source of truth for props. Manifest is for discovery and install, not full prop documentation.
- `iconOnly` — Button-specific usage mode; absorbed into how the atom is documented, not a manifest field.
- `versionAdded` / `versionUpdated` — the per-atom content hash already signals when an atom changed; finer granularity is overkill for now.
- `deprecated` — add when the first atom needs it.

---

## Override mechanism: shadcn-pure copy

Atoms are project-owned after install. There is no override config layer, no per-project JSON merge, no install-time customization UI. The flow is:

1. Pick an atom — file lands in your project's `src/components/`
2. Edit the file freely
3. (Optionally) port the change back upstream when it's generalizable

Two costs accepted:

- **No upstream auto-flow.** Bug fixes and improvements in catalog atoms don't propagate to projects already synced. Each project has a frozen-at-sync-time copy. Multi-project consistency requires a deliberate resync.
- **No automatic dependency resolution beyond the manifest.** Picker reads `dependencies` from manifests and pulls in transitively. Anything deeper (e.g., "this atom assumes a `ThemeProvider` exists in the tree") is documented in the atom, not enforced.

These costs are the shadcn tradeoff. The alternative is owning a versioning + diff-merge system, which is too much for the value.

---

## Upstream-promote loop (manual)

When a project's edits to an atom are generalizable, the dev manually ports them back to `catalog/[component].tsx`. There is no automated submission tool.

Trigger: dev edits an atom in their project → recognizes "this change should be in the catalog" → opens both files → ports the diff.

Speculative future tooling (don't build until friction proves it): a `promote.sh button --from ../your-project` CLI that diffs the project's `Button` against the catalog `Button` and offers to merge the delta. Only worth building if manual port becomes a recurring drag.

Practice note: a candidate-for-promotion check is best made with some distance, once it's clear whether the change is generally useful or project-specific.

---

## Templates remain the authoring tool

The template pipeline (`scripts/code-templates/orchestrator.js` + the templates in `scripts/code-templates/components/`) is Loom's internal authoring surface. The output target is per-atom catalog files.

| Concern | How it works |
|---|---|
| Generation | Orchestrator produces `catalog/[component].tsx` + `[component].manifest.json` (per-atom files) |
| Install | `npm run sync` copies the whole catalog into the consuming project's `src/components/`, and prints the union of the manifests' `npmDependencies` |

Why templates instead of hand-authored:

- The 66-atom consistency Loom has is enforced by templates (twMerge groups, CVA conventions, prop shape, slot patterns). Hand-authoring invites drift.
- Catalog files are consumer-facing **output**, not the dev surface. The dev surface is the templates + configs in `spec/`.
- Re-running the generator to refresh `catalog/` is narrow, repeatable friction.
- Templates enforce the bulk consistency that hand-authoring a large catalog would let drift; they're the substitute for team-wide code review on every atom.

Hand-editing an individual catalog file is allowed for one-off polish, but the templates are the bulk-consistency tool.

---

## Token bundle: substrate, all-or-nothing

Tokens are not in the catalog. They ship as a single substrate bundle, all-or-nothing, generated from `spec/config/base/*.json` — or from `spec/config/local/base/*.json` when you have run `npm run configs` for your own brand, which is git-ignored and takes precedence (see `scripts/config-paths.js`). Tokens are foundation; characterization is project-owned.

Motion lands with the substrate bundle as one duration and one easing — `--transition` and `--easing`, both plain custom properties a consumer overrides with any value, including their own timing function. The four bezier presets and three spring `linear()` approximations that shipped earlier were emitted and referenced by nothing; a second tier gets added when something needs it.

---

## Where a visual pass happens

[`docs/preview.html`](docs/preview.html) — one static page, generated, importing the three
stylesheets and nothing else. It renders the token half (ramps, roles, type, spacing,
radius) and the class layer (tones, treatments, surfaces, control states, every component
class), plus a **Known gaps** section where a defect that is spec'd but not fixed renders
as itself.

There was a Next application here, `catalog-playground/`, doing two jobs. The compile gate
is now `tsc --noEmit` over `catalog/`, which asks the same question of a tenth of the files
and needs nine packages rather than thirty. The gallery is the page above.

It was cut on a specific ground, not on weight. The playground kept `tailwindcss` as a
devDependency after the bridge was removed, so stock utilities still resolved inside it
and a consumer's did not — it was the only rendering surface in the repo, and it flattered
the layer it existed to check. A static page standing on the three stylesheets cannot.

What went with it and has no replacement: `story-coverage`, which asserted every atom was
rendered somewhere. A static page cannot render TSX. After appearance moved into the class
layer the page does show everything an atom *looks* like, and what remains in the TSX is
behavior — focus traps, portals, keyboard nav — which a gallery never verified by being
looked at either. `atom-class-coverage` covers the seam between them: every class an atom
applies must exist in the CSS.

---

## Pipeline outputs

Every atom is produced through the same pipeline. The mechanical pieces:

1. **Catalog generation.** `orchestrator.js` writes per-atom files (`.tsx` + `.manifest.json`) into `catalog/` instead of producing a full `generated/components/` bundle.
2. **Install-flow rewrite.** Copies the catalog into the consuming project's `src/components/`. Tokens ship as a substrate bundle.
3. **No scaffold output.** There was a `scaffold/` tier — an `init.sh` writing a Next root layout, a `globals.css` and a provider mount into the consuming project, requiring `src/app/`. It was cut on the same ground as the playground: the substrate is plain CSS and the components plain React, so the only thing in the repo that assumed a framework was the script wiring them up, and the first consumer to take the reduced Loom is on Vite. `ThemeProvider` is a catalog component now, the `::selection` and scrollbar rules it used to write are in `loom.base`, and `sync.js` owns the `--tokens` tier and the `loom:sync` script. Mounting a provider and writing a root layout are the consuming framework's business.
4. **Preview page.** `docs/preview.html` — the class layer rendered on the three stylesheets and nothing else.
5. **Staleness stamp.** `generate` writes `$inputs` into `catalog/atoms.json` — a hash over the component schemas and code templates, the two things that decide what `catalog/*.tsx` contains. `sync.js` recomputes it and reports a mismatch. Hashed rather than compared by mtime because `git checkout` rewrites timestamps, so a fresh clone would warn on its first sync and every one after — the kind of false positive that trains people to ignore the message. Token configs are deliberately outside the hash: the substrate regenerates on every sync, so a brand change must not read as a stale catalog. Both sides import [`scripts/catalog-stamp.js`](scripts/catalog-stamp.js) so the definition of "the inputs" cannot drift between the thing that stamps and the thing that checks; the full reasoning is in that file's header rather than mirrored here.

---

## Cross-references

- [`docs/gotchas.md`](docs/gotchas.md) — hard-won traps (Figma API, Tailwind v4, fonts, reduced motion)
