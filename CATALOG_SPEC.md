# Loom Catalog Spec

**Architectural reference for the v2 catalog model.** For each atom's concrete contract — dependencies, variants, tokens — see its `catalog/[name].manifest.json`.

The model in one paragraph: Loom does not ship all 66 atoms by default. It is a **first-party component catalog with a per-project picker**. Consuming projects declare which atoms they want in a `loom-picks.json` file; `setup.sh` copies just those files in. Atoms are project-owned after install — edit freely, no upstream auto-flow. Picks land alongside any project-authored atoms in the project's `src/components/`; comparing them against the catalog playground is what surfaces changes worth porting back upstream. Tokens still ship as a single substrate bundle, unchanged.

The model resolves the playground/production split structurally: the canonical playground lives in this repo (`catalog-playground/`), so consuming projects ship only picked atom files, with zero playground/stories footprint. Marketing characterization is handled by omission rather than a variant flag — see [Marketing characterization is project-owned](#marketing-characterization-is-project-owned).

---

## Scope: the catalog today, and the deferred motion remainder

The catalog covers the primitives, the infrastructure, the static catalog, and a zero-dependency motion core; a wider motion remainder is deferred behind a library-adoption decision.

**In the catalog.** Manifest schema, picker, dependency resolution, the `setup.sh` install flow, per-atom catalog generation, the catalog playground in `catalog-playground/`, the Figma side for static atoms, and a designed primitive in every group. Motion tokens ship with the substrate (easings + spring `linear()` presets), and the **motion core is zero-dependency**: `reveal`, `stagger`, `count-up`, `scroll-progress` — hand-rolled on `IntersectionObserver` / `requestAnimationFrame` / CSS, no `motion` library. Composition patterns (`slot` / `asChild` / `children-as-function`) are standardized across atoms that warrant wrapping.

**Deferred — wider motion families.** Spring physics, layout morph, scroll-transform, and text effects sit behind a `motion`-library adoption decision, along with sub-categorization within the motion group and motion-in-Figma resolution. The remainder is gated on a real adoption decision, not scheduled — the zero-dep core covers the common cases without it.

### Motion atoms are envelopes or leaves, not pre-composed pairs

The wrapping motion atoms compose arbitrary children via the standard composition patterns. Loom does not ship `AnimatedButton` parallel to `Button`. Consumers compose: `<Reveal><Card>…</Card></Reveal>`, `<Stagger><List/></Stagger>`. The leaf motion atoms take their own props: `<CountUp value={42} />`, `<ScrollProgress />`. N primitives × M wrappers = N+M atoms, not N×M.

Pre-composed molecules (e.g., a stat-trend display combining `NumberDisplay` + caption + trend arrow + `CountUp` + `Reveal`) live in the consuming project as project-authored composition; they graduate to catalog atoms only if a stable shape emerges across projects — hand-author molecules in the project, generalize only when the pattern holds.

### Marketing characterization is project-owned

Marketing primitives (hero, media, stat, cross-link) are intentionally **not** catalog atoms: they read as project-specific *styling* (characterization), not generalizable *primitives*. Marketing characterization is project-owned, per [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md): the substrate is the foundation; the eye-catching layer is built per-project. A component-gap audit against shadcn confirms the catalog has no missing standard primitives, so the omission leaves no real gap.

---

## Two surfaces, two roles

| Surface | Role | Lives in |
|---|---|---|
| **Loom catalog playground** | Canonical browse — all catalog atoms in their blessed state, full prop controls. The "what's available" surface. | `catalog-playground/` (this repo) |
| **Production app** | Picked + project-authored atom files only. Zero playground/stories footprint. | Consuming project |

The Loom catalog playground is the canonical view of every atom in its blessed state. A consuming project holds its *own* atoms in *their current state* — picked atoms with whatever local edits it has applied, plus project-authored atoms that haven't been promoted to the catalog (yet).

Comparing a project's atoms against the catalog playground is the upstream-pitch surface. If the project's `Button` has grown variants the catalog `Button` doesn't have, that's the trigger for a manual upstream port.

---

## Picker

`loom-picks.json` lives in the consuming project. Lists picked components by name. Single source of truth for "what this project picked." Re-running `setup.sh` resyncs.

Shape:

```json
{
  "loom": {
    "picks": [
      "button",
      "card",
      "input",
      "combobox",
      "table",
      "toast"
    ]
  }
}
```

Dependencies are resolved automatically from per-atom manifests (see below). Picking `combobox` pulls in `input`, `popover`, and `command-palette` without the consumer having to list them.

---

## Manifests

Every catalog atom ships with a sibling manifest declaring its contract. Manifest content is sourced from a `$catalog` block inside the per-component JSON (`spec/config/components/*.json`) — the orchestrator merges the `$catalog` metadata with derived fields (`variants` + `sizes` from the design-token half of the JSON, `version` stamp from generation time).

`catalog/[component].manifest.json`:

```json
{
  "name": "badge",
  "category": "button",
  "description": "Small styled label with optional icon, severity, interactive/removable modes",
  "version": "a1b2c3d4e5f6",
  "dependencies": ["cn"],
  "tokens": ["color", "typography", "spacing", "sizing"],
  "composition": "slottable",
  "variants": ["filled", "outline", "outline-mono", "dot"],
  "sizes": ["sm", "md", "lg"]
}
```

**Required:** `name`, `category`, `dependencies`, `tokens`, `composition`
**Optional:** `description`, `version`, `variants`, `sizes` (when applicable)

| Field | Purpose |
|---|---|
| `name` | Pick key in `loom-picks.json` |
| `category` | Catalog browse grouping (button / form / layout / feedback / data-display / navigation / composite / motion) |
| `description` | Playground UI label, browse summary |
| `version` | Content hash of the atom's generated source — changes only when the atom changes |
| `dependencies` | Other catalog atoms required (registry deps; picker resolves transitively) |
| `tokens` | Which token sets the atom reads (informational — substrate ships all-or-nothing, but useful in playground for filter-by-token-set) |
| `composition` | Slot pattern — the contract for motion envelopes. Enum: `none` / `slot` / `slottable` / `children-as-function` |
| `variants` | Primary variant axis — drives playground prop controls |
| `sizes` | Size axis — drives playground prop controls |

### `composition` enum

| Value | Meaning |
|---|---|
| `none` | Leaf atom, no slot pattern (e.g., `helper-text`) |
| `slot` | Radix Slot — supports `asChild` for root replacement (no sibling content) |
| `slottable` | Radix Slot + Slottable — supports `asChild` alongside sibling icons / content. The current `Button` pattern |
| `children-as-function` | Render-prop pattern |

### Deliberately not in the schema

- `states` / `slots` / `behaviorModes` — too granular; the component file + TypeScript types are the source of truth for props. Manifest is for discovery + resolution + playground hints, not full prop documentation.
- `iconOnly` — Button-specific usage mode; absorbed into how the atom is documented, not a manifest field.
- `versionAdded` / `versionUpdated` — the per-atom content hash already signals when an atom changed; finer granularity is overkill for now.
- `deprecated` — add when the first atom needs it.

---

## Override mechanism: shadcn-pure copy

Atoms are project-owned after install. There is no override config layer, no per-project JSON merge, no picker-time customization UI. The flow is:

1. Pick an atom — file lands in your project's `src/components/`
2. Edit the file freely
3. (Optionally) port the change back upstream when it's generalizable

Two costs accepted:

- **No upstream auto-flow.** Bug fixes and improvements in catalog atoms don't propagate to projects that already picked. Each project has a frozen-at-pick-time copy. Multi-project consistency requires deliberate re-picking.
- **No automatic dependency resolution beyond the manifest.** Picker reads `dependencies` from manifests and pulls in transitively. Anything deeper (e.g., "this atom assumes a `ThemeProvider` exists in the tree") is documented in the atom, not enforced.

These costs are the shadcn tradeoff. The alternative is owning a versioning + diff-merge system, which is too much for the value.

---

## Upstream-promote loop (manual)

When a project's edits to a picked atom are generalizable, the dev manually ports them back to `catalog/[component].tsx`. There is no automated submission tool.

Trigger: dev edits a picked atom in their project → recognizes "this change should be in the catalog" → opens both files → ports the diff.

Speculative future tooling (don't build until friction proves it): a `promote.sh button --from ../your-project` CLI that diffs the project's `Button` against the catalog `Button` and offers to merge the delta. Only worth building if manual port becomes a recurring drag.

Practice note: a candidate-for-promotion check is best made with some distance, once it's clear whether the change is generally useful or project-specific.

---

## Templates remain the authoring tool

The template pipeline (`scripts/code-templates/orchestrator.js` + the templates in `scripts/code-templates/components/`) is Loom's internal authoring surface. The output target is per-atom catalog files.

| Concern | How it works |
|---|---|
| Generation | Orchestrator produces `catalog/[component].tsx` + `[component].manifest.json` (per-atom files) |
| Install | `setup.sh` reads `loom-picks.json`, resolves dependencies via manifests, copies only the picked subset into the consuming project's `src/components/` |

Why templates instead of hand-authored:

- The 66-atom consistency Loom has is enforced by templates (twMerge groups, CVA conventions, prop shape, slot patterns). Hand-authoring invites drift.
- Catalog files are consumer-facing **output**, not the dev surface. The dev surface is the templates + configs in `spec/`.
- Re-running the generator to refresh `catalog/` is narrow, repeatable friction.
- Templates enforce the bulk consistency that hand-authoring a large catalog would let drift; they're the substitute for team-wide code review on every atom.

Hand-editing an individual catalog file is allowed for one-off polish, but the templates are the bulk-consistency tool.

---

## Token bundle: substrate, not picked

Tokens are not in the catalog. They ship as a single substrate bundle, all-or-nothing, generated from `spec/config/base/*.json`. Per [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md): tokens are foundation; characterization is project-owned.

Motion tokens land with the substrate bundle — easings (`standard` / `decelerate` / `accelerate` / `emphasized`) and spring `linear()` presets sampled from real physics. They shipped before the motion components so the atoms had a stable token foundation, and so a consuming project's animations draw from the substrate rather than hard-coded values.

---

## Catalog playground hosting

The catalog playground in `catalog-playground/` is itself a consuming project that picks every atom: its `loom-picks.json` lists the full catalog, and `setup.sh` populates `src/components/` from `catalog/` exactly as it would for any downstream project. The browse surface is a hand-authored gallery (`src/gallery/`), not a generated harness.

Structure:

```
loom/
  catalog/
    button.tsx
    button.manifest.json
    …
  catalog-playground/             ← Next.js, consuming-project-of-itself
    loom-picks.json               ← picks every catalog atom
    src/
      components/                 ← populated by setup.sh from catalog/
      gallery/                    ← hand-authored browse harness (shell + stories)
    next.config.ts
    tokens.css                    ← substrate bundle
```

Implications:

- **Dogfooding.** The catalog playground exercises `setup.sh` and the install ceremony every time it refreshes — the same path a downstream consumer runs.
- **No second engineering surface.** It's the consuming-project scaffold pointed at `catalog/`, not a bespoke build.

Costs accepted:

- Another Next.js app to maintain inside the repo. Dev startup and build times scale with catalog size. Mitigation when it bites: filter `loom-picks.json` to a working subset during dev, or move to per-group browse routes. Not built preemptively.

Hosting is a separate downstream decision. Local-only is fine; a static export (e.g. Netlify, `output: 'export'`) is a candidate for later.

**Why a hand-authored gallery, not Storybook or Vite:** the playground is a single internal browse app, so a bespoke gallery (`src/gallery/`) is the lighter choice — no extra dependency, no second component/story format to maintain alongside the atoms, and full control over the gallery shell. Storybook's CSF would put a parallel story format on every atom for one internal app; a separate Vite shell would add a build surface the existing Next.js consuming-project scaffold already covers.

---

## Pipeline outputs

Every atom is produced through the same pipeline. The mechanical pieces:

1. **Catalog generation.** `orchestrator.js` writes per-atom files (`.tsx` + `.manifest.json`) into `catalog/` instead of producing a full `generated/components/` bundle.
2. **`setup.sh` rewrite.** Reads `loom-picks.json`, resolves manifest dependencies, copies the picked subset into the consuming project's `src/components/`. Tokens ship as a substrate bundle.
3. **Scaffold output.** `init.sh` bootstraps the atom-agnostic app shell — ThemeProvider, root layout (+ fonts), globals, and the token substrate — into the consuming project.
4. **Catalog playground.** `catalog-playground/` — a Next.js consuming-project-of-itself with `loom-picks.json` picking every atom.

---

## Open items (intentionally unresolved here)

- **Motion-in-Figma.** The motion core ships code-only. How motion maps into the Figma file (Smart Animate doesn't map cleanly to web motion tokens) is deferred — its own decision, part of the motion remainder.
- **Wider motion families.** Gated on a `motion`-library adoption decision (see the execution split). The zero-dep core does not force it.

---

## Cross-references

- [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md) — tokens are substrate; characterization is project-owned
- [`docs/gotchas.md`](docs/gotchas.md) — hard-won traps (Figma API, Tailwind v4, fonts, reduced motion)
