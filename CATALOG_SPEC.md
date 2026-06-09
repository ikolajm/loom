# Loom Catalog Spec

**Status:** Architectural reference for the v2 catalog model — *as built*. Designed 2026-05-28; catalog content-complete 2026-06-09. For the per-atom decisions behind the current catalog, see [`CATALOG_AUDIT.md`](CATALOG_AUDIT.md).

The model in one paragraph: Loom does not ship all 67 atoms by default. It is a **first-party component catalog with a per-project picker**. Consuming projects declare which atoms they want in a `loom-picks.json` file; `setup.sh` copies just those files in. Atoms are project-owned after install — edit freely, no upstream auto-flow. Picks land alongside any project-authored atoms in a dev-only `/design-system` route that serves as the surface for tinkering and for surfacing changes worth porting back upstream. Tokens still ship as a single substrate bundle, unchanged.

This dissolved the two backlog items previously tracked for Loom: the marketing-variant flag and the playground/production separation. The playground/production split is solved structurally by the dev-only route group (below). The marketing-variant idea was retired differently than first planned — see [Marketing: evaluated and cut](#marketing-evaluated-and-cut).

---

## Execution split: Sprint 1 (primitives) and Sprint 2 (motion remainder)

The arc executed in two sprints. **Sprint 1 is complete** — it landed the primitives, infrastructure, the static catalog, *and* the zero-dependency motion core. Sprint 2 is the deferred motion remainder.

**Sprint 1 — primitives, infrastructure, and motion core (DONE).** Manifest schema, picker, dependency resolution, the `setup.sh` rewrite, per-atom catalog generation, the catalog playground in `catalog-playground/`, the project `/design-system` route as a `(dev)` route group with `.story` auto-discovery, the Figma side resolved for static atoms, and per-atom triage + design across every group. Motion tokens shipped with the substrate (easings + spring `linear()` presets), and the **motion core was built zero-dependency**: `reveal`, `stagger`, `count-up`, `scroll-progress` — hand-rolled on `IntersectionObserver` / `requestAnimationFrame` / CSS, no `motion` library. Composition patterns (`slot` / `asChild` / `children-as-function`) are standardized across atoms that warrant wrapping.

**Sprint 2 — wider motion families (DEFERRED).** The wider motion families behind a `motion`-library adoption decision (spring physics, layout morph, scroll-transform, text effects), sub-categorization within the motion group, motion-in-Figma resolution (or explicit deferral), and any motion layer for atoms that ship statically today. Sprint 2 is gated on a real adoption decision, not scheduled — the zero-dep core covers the common cases without it.

### Motion atoms are envelopes or leaves, not pre-composed pairs

The wrapping motion atoms compose arbitrary children via the Sprint-1 composition patterns. We do not ship `AnimatedButton` parallel to `Button`. Consumers compose: `<Reveal><Card>…</Card></Reveal>`, `<Stagger><List/></Stagger>`. The leaf motion atoms take their own props: `<CountUp value={42} />`, `<ScrollProgress />`. N primitives × M wrappers = N+M atoms, not N×M.

Pre-composed molecules (e.g., a stat-trend display combining `NumberDisplay` + caption + trend arrow + `CountUp` + `Reveal`) live in the consuming project as project-authored composition; they graduate to catalog atoms only if a stable shape emerges across projects — hand-author molecules in the project, generalize only when the pattern holds.

### Marketing: evaluated and cut

The original plan promoted marketing primitives (hero, media, stat, cross-link) into the catalog as first-class atoms. During the catalog build they were **cut**: they read as project-specific *styling* (portfolio characterization), not generalizable catalog *primitives* — the same generalizable-vs-styling lens that dropped `stat-cards`, `comparison`, and `cross-link-section`. Marketing characterization is project-owned, per [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md): the substrate is foundation; the eye-catching layer is built per-project. A `shadcn` component-gap audit (2026-06-09) confirmed the catalog has no missing-standard primitives, so cutting Marketing left no real gap.

---

## Three surfaces, three roles

| Surface | Role | Lives in |
|---|---|---|
| **Loom catalog playground** | Canonical browse — read-only, all catalog atoms, full prop controls. The "what's available" surface. | `catalog-playground/` (this repo) |
| **Project `/design-system` route** | Live tinker surface — full interactive playground, auto-discovers from `src/components/`, includes both picked and project-authored atoms. Dev-only route group, not compiled into production builds. | Consuming project |
| **Production app** | Picked + project-authored atom files only. Zero playground/stories footprint. | Consuming project |

The Loom catalog playground is the canonical view of every atom in its blessed state. The project `/design-system` route is *this project's* atoms in *their current state* — picked atoms with whatever local edits the project has applied, plus project-authored atoms that haven't been promoted to the catalog (yet).

Comparing the two is the upstream-pitch surface. If the project's `Button` has grown variants the catalog `Button` doesn't have, that's the trigger for a manual upstream port.

---

## Picker

`loom-picks.json` lives in the consuming project. Lists picked components by name. Single source of truth for "what this project picked." Re-running `setup.sh` resyncs.

Shape:

```json
{
  "loom": {
    "version": "2026-06-04",
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

The `version` field is a date stamp — when the picks were last resolved. Used for the per-file versioning stamp (below) and to flag "your picks are old, the catalog has moved since."

---

## Manifests

Every catalog atom ships with a sibling manifest declaring its contract. Manifest content is sourced from a `$catalog` block inside the per-component JSON (`spec/config/components/*.json`) — the orchestrator merges the `$catalog` metadata with derived fields (`variants` + `sizes` from the design-token half of the JSON, `version` stamp from generation time).

`catalog/[component].manifest.json`:

```json
{
  "name": "badge",
  "category": "button",
  "description": "Small styled label with optional icon, severity, interactive/removable modes",
  "version": "2026-06-04",
  "dependencies": ["cn"],
  "tokens": ["color", "typography", "spacing", "sizing"],
  "composition": "slottable",
  "variants": ["filled", "outline", "outline-mono", "dot"],
  "sizes": ["sm", "md", "lg"],
  "stories": "badge.story.ts"
}
```

**Required:** `name`, `category`, `dependencies`, `tokens`, `composition`, `stories`
**Optional:** `description`, `version`, `variants`, `sizes` (when applicable)

| Field | Purpose |
|---|---|
| `name` | Pick key in `loom-picks.json` |
| `category` | Catalog browse grouping (button / form / layout / feedback / data-display / navigation / composite / motion) |
| `description` | Playground UI label, browse summary |
| `version` | Date stamp — when this atom was last generated; matches `loom-picks.json` `version` stamp pattern |
| `dependencies` | Other catalog atoms required (registry deps; picker resolves transitively) |
| `tokens` | Which token sets the atom reads (informational — substrate ships all-or-nothing, but useful in playground for filter-by-token-set) |
| `composition` | Slot pattern — the contract for motion envelopes. Enum: `none` / `slot` / `slottable` / `children-as-function` |
| `variants` | Primary variant axis — drives playground prop controls |
| `sizes` | Size axis — drives playground prop controls |
| `stories` | Sibling story file (`.story.ts` / `.story.tsx`) for auto-discovery |

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
- `versionAdded` / `versionUpdated` — `loom-picks.json` already tracks resolution version; per-atom granularity is overkill for now.
- `deprecated` — add when the first atom needs it.

---

## Auto-discovery in `/design-system`

The project `/design-system` route auto-discovers atoms by reading sibling story files in `src/components/`. Story file = the contract for "this component appears in the playground."

Two consequences:

1. **Picked atoms arrive with their story files.** `setup.sh` copies both the atom file and its sibling story file from `catalog/`.
2. **Project-authored atoms get story files too.** When the project authors a new atom (e.g., a `HeroBlock` for a marketing site), the convention is: write a story file next to it. The story file is what makes it appear in `/design-system` with prop controls — and what marks it as a candidate for upstream promotion.

This carries over the Paperboy stories+registry pattern (`generate-stories.js` already produces story files). The pattern carries over; what changes is filtering. See [`docs/design-system/scaffold-playground-patterns.md`](docs/design-system/scaffold-playground-patterns.md).

---

## Override mechanism: shadcn-pure copy

Atoms are project-owned after install. There is no override config layer, no per-project JSON merge, no picker-time customization UI. The flow is:

1. Pick an atom — file lands in your project's `src/components/`
2. Edit the file freely
3. (Optionally) port the change back upstream when it's generalizable

Two costs accepted:

- **No upstream auto-flow.** Bug fixes and improvements in catalog atoms don't propagate to projects that already picked. Each project has a frozen-at-pick-time copy. Multi-project consistency requires deliberate re-picking.
- **No automatic dependency resolution beyond the manifest.** Picker reads `dependencies` from manifests and pulls in transitively. Anything deeper (e.g., "this atom assumes a `ThemeProvider` exists in the tree") is documented in the atom, not enforced.

These costs are the shadcn tradeoff. The alternative is owning a versioning + diff-merge system, which is too much for the value. This aligns with the project-owned, recopiable lifecycle in [`docs/design-system/ownership-lifecycle.md`](docs/design-system/ownership-lifecycle.md).

---

## Upstream-promote loop (manual)

When a project's edits to a picked atom are generalizable, the dev manually ports them back to `catalog/[component].tsx`. There is no automated submission tool.

Trigger: dev tinkers in `/design-system` → recognizes "this change should be in the catalog" → opens both files → ports the diff.

Speculative future tooling (don't build until friction proves it): a `promote.sh button --from ../portfolio-site` CLI that diffs the project's `Button` against the catalog `Button` and offers to merge the delta. Only worth building if manual port becomes a recurring drag.

Practice note: candidate-for-promotion checks belong at session-close or retro time, when distance reveals whether the change is generally useful or project-specific.

---

## Versioning stamp on picked files

Every picked file lands with a header comment:

```tsx
// Picked from Loom @ 2026-06-04
// Edit freely — no upstream sync. To refresh, re-pick via setup.sh.
```

Cheap. Tells future-you (or a future collaborator) how old the local fork is when they open the file. No automation, no upgrade path — just orientation.

---

## Templates remain the authoring tool

The template pipeline (`scripts/code-templates/orchestrator.js` + the templates in `scripts/code-templates/components/`) is Loom's internal authoring surface. The output target is per-atom catalog files.

| Concern | How it works |
|---|---|
| Generation | Orchestrator produces `catalog/[component].tsx` + `[component].manifest.json` + `[component].story.*` (per-atom files) |
| Install | `setup.sh` reads `loom-picks.json`, resolves dependencies via manifests, copies only the picked subset into the consuming project's `src/components/` |
| Stories | Ship inline with the catalog atom; arrive at the consuming project alongside their atom; render in `/design-system` only, not in production routes |

Why templates instead of hand-authored:

- The 67-atom consistency Loom has is enforced by templates (twMerge groups, CVA conventions, prop shape, slot patterns). Hand-authoring invites drift.
- Catalog files are consumer-facing **output**, not the dev surface. The dev surface is the templates + configs in `spec/`.
- Re-running the generator to refresh `catalog/` is narrow, repeatable friction.
- shadcn can hand-author because they're a team with code review; this is a solo project and templates serve that role.

Hand-editing an individual catalog file is allowed for one-off polish, but the templates are the bulk-consistency tool.

---

## Token bundle: substrate, not picked

Tokens are not in the catalog. They ship as a single substrate bundle, all-or-nothing, generated from `spec/config/base/*.json`. Per [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md): tokens are foundation; characterization is project-owned.

Motion tokens land with the substrate bundle — easings (`standard` / `decelerate` / `accelerate` / `emphasized`) and spring `linear()` presets sampled from real physics. They shipped before the motion components so the atoms had a stable token foundation, and so a consuming project's animations draw from the substrate rather than hard-coded values.

---

## `/design-system` as a dev-only route group

The project `/design-system` route ships as a Next.js route group: `src/app/(dev)/design-system/`. The `(dev)` group is excluded from production builds via Next.js config (or equivalent build-time filter). Result: production builds literally do not compile the route. No env branching at runtime, no dead code paths, no risk of the gate failing.

This is the structural resolution of the playground-separation problem. The old framing was "scrub stories before ship." The catalog model's framing is "stories never enter production builds in the first place."

---

## Catalog playground hosting

The catalog playground in `catalog-playground/` is itself a consuming project that picks every atom. Same Next.js scaffold, same `(dev)/design-system` route group, same story auto-discovery harness as any downstream project — but its `loom-picks.json` lists every catalog atom.

Structure:

```
loom/
  catalog/
    button.tsx
    button.manifest.json
    button.story.ts
    …
  catalog-playground/             ← Next.js, consuming-project-of-itself
    loom-picks.json               ← picks every catalog atom
    src/
      components/                 ← populated by setup.sh from catalog/
      gallery/                    ← the browse harness
    next.config.ts
    tokens.css                    ← substrate bundle
```

Implications:

- **One story format** used identically by catalog and consuming projects.
- **One playground renderer.** Catalog and consuming projects render through the same harness — pattern transfer is automatic.
- **Dogfooding.** The catalog playground exercises `setup.sh` and the install ceremony every time it refreshes.
- **No second engineering surface.** The catalog playground is the consuming-project scaffold pointed at `catalog/`.

Costs accepted:

- Another Next.js app to maintain inside the repo. Dev startup and build times scale with catalog size. Mitigation when it bites: filter `loom-picks.json` to a working subset during dev, or move to per-group browse routes. Not built preemptively.

Hosting deferred to a separate downstream decision. Local-only is fine; a static export to Netlify (`output: 'export'`) at a `loom.ikolajm.com` subdomain is a candidate for later.

The governing principle is **story-harness parity**: the catalog playground and every consuming project render through the same story format and the same `(dev)/design-system` harness, so a pattern proven in one transfers to the others for free. That parity is the requirement — and it's what rules out **Vite** (a custom playground shell would diverge from consuming projects) and **Storybook** (its CSF format would diverge from the story harness, putting two story formats on every atom). The tools aren't rejected on preference; they're rejected because they break same-harness-everywhere.

---

## Migration: what the execution arc did

The execution arc walked every existing atom through the audit framework (see [`CATALOG_AUDIT.md`](CATALOG_AUDIT.md)). The mechanical migration steps that fell out:

1. **Catalog generation.** `orchestrator.js` writes per-atom files (`.tsx` + `.manifest.json` + `.story.*`) into `catalog/` instead of producing a full `generated/components/` bundle.
2. **`setup.sh` rewrite.** Reads `loom-picks.json`, resolves manifest dependencies, copies the picked subset into the consuming project's `src/components/`. Tokens ship as a substrate bundle.
3. **Scaffold output.** The generated `src/app/` scaffold includes the `(dev)/design-system/` route group with the auto-discovery harness.
4. **Catalog playground.** `catalog-playground/` — a Next.js consuming-project-of-itself with `loom-picks.json` picking every atom.

---

## Open items (intentionally unresolved here)

- **Motion-in-Figma.** The motion core ships code-only. How motion maps into the Figma file (Smart Animate doesn't map cleanly to web motion tokens) is deferred — its own decision, part of the Sprint-2 remainder.
- **Wider motion families.** Gated on a `motion`-library adoption decision (see the execution split). The zero-dep core does not force it.

---

## Cross-references

- [`CATALOG_AUDIT.md`](CATALOG_AUDIT.md) — the per-atom decisions; source of truth for what shipped
- [`docs/design-system/ownership-lifecycle.md`](docs/design-system/ownership-lifecycle.md) — atoms are project-owned, recopiable (the lifecycle this spec's install ceremony aligns to)
- [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md) — tokens are substrate; characterization is project-owned
- [`docs/design-system/scaffold-playground-patterns.md`](docs/design-system/scaffold-playground-patterns.md) — the stories/registry and playground patterns that carry over
