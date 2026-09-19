# Loom Catalog Spec

**Architectural reference for the v3 catalog model.** For each component's concrete contract — kind, dependencies, variants, tokens — see its `catalog/[name].manifest.json`.

The model in one paragraph: Loom ships the components in [`catalog/atoms.json`](catalog/atoms.json) — atoms, plus `ThemeProvider` — and delivers `cn` and `theme-init` alongside them, which are not components. It is a **first-party component catalog copied into a project wholesale**. `npm run sync` writes every atom into `src/components/loom/`, every run — see [Install](#install) for what that costs and what it rules out. Atoms are project-owned after install — edit freely, no upstream auto-flow. They land alongside any project-authored atoms; diffing them against `catalog/` is what surfaces changes worth porting back upstream. Tokens still ship as a single substrate bundle, unchanged.

A consuming project ships atom files and nothing else — no stories, no harness. Marketing characterization is handled by omission rather than a variant flag — see [Marketing characterization is project-owned](#marketing-characterization-is-project-owned).

## Scope: what the catalog covers

The catalog covers the primitives, the infrastructure, and the static catalog.

**In the catalog.** Manifest schema, the `npm run sync` install flow, per-atom catalog generation, the static preview page, the Figma side for static atoms, and a designed primitive in every group. Motion tokens ship with the substrate (one duration, one easing). Composition patterns (`slot` / `asChild` / `children-as-function`) are standardized across atoms that warrant wrapping.

**Not in the catalog: an app shell.** Loom writes none and assumes no framework. Mounting a provider and writing a root layout are the consuming framework's business.

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
atom you do not want does not stick: a removed file is indistinguishable from a
never-installed one, so the next sync restores it. That is deliberate — an unimported atom
is tree-shaken and costs a file in your tree rather than bytes in your build, and a pick
list is a second place for the catalog to drift from itself.

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
by construction. There is no override config layer and no install-time
customization: the copy in your tree is the override mechanism.

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
| `kind` | `atom` / `provider` / `utility` / `snippet` — vocabulary, not behaviour. Nothing branches on it; it is not the `composition` field below |
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

---

## Templates remain the authoring tool

The authoring surface is `scripts/code-templates/` plus the schemas in
`spec/config/components/`. `catalog/` is output: every `npm run generate` rewrites each
`.tsx` and `.manifest.json` in it, so an edit made there is gone on the next run and a
change worth keeping goes in the template. That is what holds prop shape, cva
conventions and slot patterns consistent across the catalog without review on every
atom.

---

## Token bundle: substrate, all-or-nothing

Tokens are not in the catalog. They ship as a single substrate bundle, all-or-nothing, generated from `spec/config/base/*.json` — or from `spec/config/local/base/*.json` when you have run `npm run configs` for your own brand, which is git-ignored and takes precedence (see `scripts/config-paths.js`). Tokens are foundation; characterization is project-owned.

Motion lands with the substrate bundle as one duration and one easing — `--transition` and `--easing`, both plain custom properties a consumer overrides with any value, including their own timing function. The four bezier presets and three spring `linear()` approximations that shipped earlier were emitted and referenced by nothing; a second tier gets added when something needs it.

---

## Where a visual pass happens

[`docs/preview.html`](docs/preview.html) — one static page, generated, importing the three
stylesheets and nothing else. It renders the token half (ramps, roles, type, spacing,
radius) and the class layer (tones, treatments, surfaces, control states, every component
class).

The compile gate is `tsc --noEmit` over `catalog/`; the gallery is the page above. Nothing
asserts that an atom is rendered somewhere — a static page cannot render TSX, and what
lives in the TSX is behavior (focus traps, portals, keyboard nav) that looking at a gallery
never verified either. The seam between appearance and behavior is closed at generation:
`cls()` resolves every class an atom applies against `classManifest()`, the set the
stylesheets actually emit, so a name the CSS does not define stops the build.
`atom-class-coverage` re-checks the emitted catalog as a backstop.

---

## Cross-references

- [`docs/gotchas.md`](docs/gotchas.md) — hard-won traps (Figma API, fonts, reduced motion, the target floor, cascade layers)
