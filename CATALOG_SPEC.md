# Loom Catalog Spec

**Architectural reference for the v3 catalog model.** For each component's concrete contract — kind, dependencies, variants, tokens — see its `catalog/[name].manifest.json`.

The model in one paragraph: Loom ships 6 components — 5 atoms and `ThemeProvider` — plus `cn` and `theme-init`, which are delivered but are not components (see Kind). It is a **first-party component catalog copied into a project wholesale**. `npm run sync` writes every atom into `src/components/loom/`, every run. Deleting one does not stick — a removed file is indistinguishable from a never-installed one, so the next sync restores it. Unimported atoms are tree-shaken and cost nothing shipped, so the cost of carrying one you do not use is a file in your tree, not bytes in your build. Atoms are project-owned after install — edit freely, no upstream auto-flow. They land alongside any project-authored atoms; diffing them against `catalog/` is what surfaces changes worth porting back upstream. Tokens still ship as a single substrate bundle, unchanged.

A consuming project ships atom files and nothing else — no stories, no harness. Marketing characterization is handled by omission rather than a variant flag — see [Marketing characterization is project-owned](#marketing-characterization-is-project-owned).

## Kind: atoms and patterns

Every manifest carries a `kind` — **5 atoms**, **0 patterns**, and one each of `utility` (`cn`), `snippet` (`theme-init`) and `provider` (`theme-provider`).

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

## Native first

`dialog` and `select` wrap elements the browser already ships. They are the right call
when native cannot do the job, and the wrong one by default.

**Reach for the native recipe first.** Reach for the component when one of the named cases
below applies. Both recipes use the same class layer the components do, so moving between
them is a markup change and not a restyle.

### A dialog

```html
<dialog class="dialog" data-size="md">
  <div class="dialog-header">
    <span class="dialog-title">Delete this project</span>
    <span class="dialog-description">This cannot be undone.</span>
  </div>
  <form method="dialog" class="dialog-footer">
    <button class="button treat-outline tone-neutral interactive control" value="cancel">Cancel</button>
    <button class="button treat-filled tone-error interactive control" value="delete">Delete</button>
  </form>
</dialog>
```

`el.showModal()` opens it. What you get without writing any of it: a focus trap, the top
layer (so no `z-index` contest and no portal), Escape-to-close, and inertness for
everything behind.

- **The scrim is `dialog::backdrop`**, which Loom styles. `.dialog-overlay` is for the
  non-native path only; on a real `<dialog>` it is a second scrim you do not need.
- **`.dialog-fixed` is for the non-native path only, too.** The UA centres a modal
  `<dialog>` itself. `.dialog` is deliberately scoped off the native element for exactly
  this reason — see the comment in `loom.components.css`.
- **`returnValue` tells commit from dismiss** across Escape, the backdrop and a button,
  with no handler and no state. A submit button's `value` inside `method="dialog"` lands
  there. Replacing this by hand means a ref flag set at every exit, which is what a
  consumer had to write after converting.

**Use the `dialog` component when** the panel is not a `<dialog>` element — a portaled
panel that must escape an `overflow` or `transform` ancestor — or when you need a
non-modal or arbitrarily positioned surface. That path is what `.dialog-fixed` and
`.dialog-overlay` exist for.

### A select

```html
<label class="text-label-md" for="source">Source</label>
<select class="input control" id="source" data-size="sm">
  <option value="">All sources</option>
  <option value="npr">NPR</option>
</select>
```

- **`<label for>` labels it.** This is the one that has no workaround: a label cannot
  label the Radix trigger, because that trigger is a `<button>`.
- **`<option value="">` is an ordinary option.** Radix reserves the empty string for
  "nothing selected", so an "All" sentinel needs translating to a different value going in
  and back again coming out.
- **The UA keeps drawing the arrow**, because `loom.base` sets `appearance: none` on
  buttons only. That is the affordance, not a leak — and it follows the theme, because
  `theme-init.js` sets `color-scheme` on the root.
- **A native `<select>` works inside a native `<dialog>`. A Radix one does not**, because
  `showModal()` makes everything outside the dialog inert, including the portal target.
  **This is the one that cascades**: it is what forced a consumer to convert their dialog
  after converting their select.

**Use the `select` component when** you need a listbox with rich rows, grouping or search
— things `<option>` cannot hold, since it renders text and nothing else.

### What each one costs

Measured on a real consumer's production build, not estimated:

| | main chunk, gzip |
|---|---|
| atoms synced, none imported | 79.23 kB |
| plus Button and Badge | 81.21 kB |
| plus Dialog and Select | 110.52 kB |

Two kB against twenty-nine, on the critical path. Transitive package closures: `clsx` 1,
`cva` 2, `react-slot` 2, `react-dialog` 25, `react-select` 39. Install footprint is a
non-issue — 1.8 MB of `@radix-ui` against 233 MB of `node_modules` — so bytes on the
critical path are the cost worth counting, and both sheets sit behind triggers, which
makes `React.lazy` around the panels a real option.

None of this argues the components should go. A consumer should be told what they are
taking, and shown the native recipe first.

## Install

`npm run sync -- <project>` copies the whole catalog into the consuming project's
`src/components/loom/`, plus `cn`, and writes the four stylesheets into `src/`. Deleting an
atom you do not want does not stick — see the note on tree-shaking above.

**A directory of Loom's own, not `src/components/` itself.** Delivered files interleaved
with yours means nothing downstream can address one set without the other. The first
consumer's lint run produced 14 errors in files it had not written — every atom exports its
cva variants, which `react-refresh/only-export-components` objects to — and the only fix
available was an override naming each file, which the next atom arrives outside of.
`src/components/loom/` is one glob, now and after the catalog grows.

The manifests answer what the file tree cannot: `npmDependencies`
is how a consumer learns `button` needs `@radix-ui/react-slot` and
`class-variance-authority` without reverse-engineering it from imports, and the sync prints
the union of them as a single `npm install` line.

**A local edit in a delivered file is overwritten on the next sync** — there is no
detection and nothing to force. Keep a change at the call site instead, where it survives
by construction; see [Override mechanism](#override-mechanism-shadcn-pure-copy).
## Manifests

Every catalog atom ships with a sibling manifest declaring its contract. Manifest content is sourced from a `$catalog` block inside the per-component JSON (`spec/config/components/*.json`) — the orchestrator merges the `$catalog` metadata with derived fields (`variants` + `sizes` from the design-token half of the JSON).

`catalog/[component].manifest.json`:

```json
{
  "name": "badge",
  "kind": "atom",
  "category": "button",
  "file": "badge.tsx",
  "dependencies": ["cn"],
  "npmDependencies": ["@radix-ui/react-slot", "class-variance-authority"],
  "tokens": ["color", "typography", "spacing", "sizing"],
  "composition": "slot",
  "sizes": ["sm", "md", "lg"]
}
```

**Required:** `name`, `kind`, `category`, `file`, `dependencies`, `npmDependencies`, `tokens`, `composition`
**Optional:** `variants`, `sizes` (when applicable)

| Field | Purpose |
|---|---|
| `name` | The atom's exported component name |
| `kind` | `atom` / `pattern` / `utility` — vocabulary, not behaviour; all kinds install identically |
| `category` | Catalog browse grouping (button / form / layout / feedback / data-display / navigation / composite) |
| `file` | The delivered filename in `catalog/`, so nothing downstream infers it from the name |
| `dependencies` | Other catalog atoms this one imports |
| `npmDependencies` | Packages this atom imports; the sync prints their union as one `npm install` line |
| `tokens` | Which token sets the atom reads (informational — the substrate ships all-or-nothing) |
| `composition` | Slot pattern — how an atom hands its root or its children to a caller. Enum: `none` / `slot` / `slottable` / `children-as-function` |
| `variants` | Primary variant axis |
| `sizes` | Size axis |

What an atom is *for* is not a manifest field. It belongs in this document and in
`docs/preview.html`, written once rather than restated per manifest and left to drift.

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

1. Pick an atom — file lands in your project's `src/components/loom/`
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
| Install | `npm run sync` copies the whole catalog into the consuming project's `src/components/loom/`, and prints the union of the manifests' `npmDependencies` |

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

The compile gate is `tsc --noEmit` over `catalog/`; the gallery is the page above. Nothing
asserts that an atom is rendered somewhere — a static page cannot render TSX, and what
lives in the TSX is behavior (focus traps, portals, keyboard nav) that looking at a gallery
never verified either. The seam between appearance and behavior is closed at generation:
`cls()` resolves every class an atom applies against `classManifest()`, the set the
stylesheets actually emit, so a name the CSS does not define stops the build.
`atom-class-coverage` re-checks the emitted catalog as a backstop.

---

## Pipeline outputs

Every atom is produced through the same pipeline. The mechanical pieces:

1. **Catalog generation.** `orchestrator.js` writes per-atom files (`.tsx` + `.manifest.json`) into `catalog/`.
2. **Install-flow rewrite.** Copies the catalog into the consuming project's `src/components/loom/`, overwriting unconditionally. Tokens ship as a substrate bundle.
3. **No app shell.** Loom writes none and assumes no framework: the substrate is plain CSS and the components plain React. `ThemeProvider` is a catalog component, the `::selection` and scrollbar rules are in `loom.base`, and `sync.js` owns the `--tokens` tier and the `loom:sync` script. Mounting a provider and writing a root layout are the consuming framework's business.
4. **Preview page.** `docs/preview.html` — the class layer rendered on the three stylesheets and nothing else.
5. **Unconditional overwrite.** Delivered files carry a generated header saying so and are replaced on every sync — nothing compares an installed file against the catalog. A change worth keeping goes at the call site, where it survives by construction rather than by detection.

---

## Cross-references

- [`docs/gotchas.md`](docs/gotchas.md) — hard-won traps (Figma API, fonts, reduced motion, the target floor, cascade layers)
