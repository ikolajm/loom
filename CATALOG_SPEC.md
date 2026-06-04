# Loom Catalog Spec

**Status:** Architectural reference for the catalog overhaul. Designed 2026-05-28; execution begins on a new branch.

The model in one paragraph: Loom stops shipping all ~55 atoms by default and instead becomes a **first-party component catalog with a per-project picker**. Consuming projects declare which atoms they want in a `loom-picks.json` file; `setup.sh` copies just those files in. Atoms are project-owned after install — edit freely, no upstream auto-flow. Picks land alongside any project-authored atoms in a dev-only `/design-system` route that serves as the surface for tinkering and surfacing changes worth porting back upstream. Tokens still ship as a single substrate bundle, unchanged.

This dissolves the L1 (marketing variant flag) and L2 (playground separation) backlog items previously tracked in `[[project_loom]]`. Marketing primitives become first-class catalog items; the playground/production split is solved structurally by the dev-only route group.

---

## Execution split: Sprint 1 (primitives) and Sprint 2 (motion)

The arc executes in two sprints. Sprint 1 lands the primitives, infrastructure, and static side of the catalog. Sprint 2 layers motion on top.

**Sprint 1 — Primitives + infrastructure.** Manifest schema, picker, dependency resolution, `setup.sh` rewrite, catalog generation update, catalog playground in `loom/`, project `/design-system` route as a `(dev)` route group with `.story.ts` auto-discovery, Figma side resolved for static atoms, and per-atom triage + design across every group EXCEPT motion. Motion tokens still ship as substrate in Sprint 1 — per `[[loom-is-substrate-not-design]]` — so Sprint 2's components have a stable token foundation. Composition patterns (`slot` / `asChild` / `children-as-function`) get standardized across atoms that warrant wrapping, so Sprint 2's envelopes have a stable contract to compose against.

**Sprint 2 — Motion library.** The motion atom catalog (`Reveal`, `CountUp`, `Stagger`, `TextScramble`, scroll-tied wrappers, etc.), sub-categorization within the motion group (`motion:scroll`, `motion:text`, `motion:cursor`, `motion:layout`), motion-in-Figma resolution (or explicit deferral), the motion layer for marketing atoms that ship statically in Sprint 1, and the performance + accessibility contract (`prefers-reduced-motion`, IntersectionObserver disposal, `will-change` hygiene).

### Motion atoms are envelopes, not pre-composed pairs

Motion atoms wrap arbitrary children via the composition patterns established in Sprint 1. We do not ship `AnimatedButton` parallel to `Button`. Consumers compose: `<Reveal><Card>...</Card></Reveal>`, `<CountUp value={42} />`, `<Stagger><HeroBlock /></Stagger>`. N primitives × M motion wrappers = N+M atoms, not N×M.

Pre-composed molecules (e.g., a stat-trend display combining `Number` + caption + trend arrow + `CountUp` + `Reveal`) live in the consuming project as project-authored composition; they only graduate to catalog atoms if a stable shape emerges across projects. This matches `[[component-handbuild-approach]]` — hand-author molecules in the project, generalize only when the pattern holds.

### Marketing atoms straddle the split

Marketing primitives ship as static markup in Sprint 1. Atoms with native motion (`MediaGallery`'s auto-advancing crossfade, `SectionAnchor`'s drag-out animation) move to Sprint 2 for their motion layer; their structural markup may land statically in Sprint 1 or wait, decided per atom during triage. `Reveal` is a pure motion atom — it lives entirely in Sprint 2.

---

## Three surfaces, three roles

| Surface | Role | Lives in |
|---|---|---|
| **Loom catalog playground** | Canonical browse — read-only, all catalog atoms, full prop controls. The "what's available" surface. | `loom/` (this workspace) |
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
    "version": "2026-05-28",
    "picks": [
      "button",
      "card",
      "input",
      "hero-block",
      "media-block",
      "media-gallery",
      "section-anchor"
    ]
  }
}
```

Dependencies are resolved automatically from per-atom manifests (see below). Picking `combobox` pulls in `input`, `popover`, `command` without the consumer having to list them.

The `version` field is a date stamp — when the picks were last resolved. Used for the per-file versioning stamp (below) and to flag "your picks are old, the catalog has moved since."

---

## Manifests

Every catalog atom ships with a sibling manifest declaring its contract. Schema locked Session 0 of Sprint 1 (2026-05-29). Manifest content is sourced from a `$catalog` block inside the existing per-component JSON (`spec/config/components/*.json`) — the orchestrator merges the `$catalog` metadata with derived fields (`variants` + `sizes` from the design-token half of the JSON, `version` stamp from generation time).

`loom/catalog/[component].manifest.json`:

```json
{
  "name": "badge",
  "category": "button",
  "description": "Small styled label with optional icon, severity, interactive/removable modes",
  "version": "2026-05-29",
  "dependencies": ["cn-helper"],
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
| `category` | Catalog browse grouping (button / layout / form / data-display / feedback / navigation / composite / marketing / motion) |
| `description` | Playground UI label, browse summary |
| `version` | Date stamp — when this atom was last generated; matches `loom-picks.json` `version` stamp pattern |
| `dependencies` | Other catalog atoms required (registry deps; picker resolves transitively) |
| `tokens` | Which token sets the atom reads (informational — substrate ships all-or-nothing, but useful in playground for filter-by-token-set) |
| `composition` | Slot pattern — the Sprint 2 contract for motion envelopes. Enum: `none` / `slot` / `slottable` / `children-as-function` |
| `variants` | Primary variant axis — drives playground prop controls |
| `sizes` | Size axis — drives playground prop controls |
| `stories` | Sibling story file (`.story.ts`) for auto-discovery |

### `composition` enum

| Value | Meaning |
|---|---|
| `none` | Leaf atom, no slot pattern (e.g., `helper-text`) |
| `slot` | Radix Slot — supports `asChild` for root replacement (no sibling content) |
| `slottable` | Radix Slot + Slottable — supports `asChild` alongside sibling icons / content. Current `Button` pattern per `[[radix-slot-slottable-pattern]]` |
| `children-as-function` | Render-prop pattern |

### Deliberately not in the schema

- `states` / `slots` / `behaviorModes` — too granular; the component file + TypeScript types are the source of truth for props. Manifest is for discovery + resolution + playground hints, not full prop documentation.
- `iconOnly` — Button-specific usage mode; absorbed into how the atom is documented, not a manifest field.
- `versionAdded` / `versionUpdated` — `loom-picks.json` already tracks resolution version; per-atom granularity is overkill for now.
- `deprecated` — add when the first atom needs it.

---

## Auto-discovery in `/design-system`

The project `/design-system` route auto-discovers atoms by reading sibling `.story.ts` files in `src/components/`. Story file = the contract for "this component appears in the playground."

Two consequences:

1. **Picked atoms arrive with their story files.** `setup.sh` copies both the atom file and its sibling story file from `loom/catalog/`.
2. **Project-authored atoms get story files too.** When the project authors a new atom (e.g., `HeroBlock` for a marketing site), the convention is: write a story file next to it. The story file is what makes it appear in `/design-system` with prop controls — and what marks it as a candidate for upstream promotion.

This matches the existing Paperboy stories+registry pattern (`scripts/code-templates/components/` already produces `.story.ts` files via `generate-stories.js`). The pattern carries over; what changes is filtering.

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

This aligns with `[[downstream-lifecycle]]` (atoms are project-owned, recopiable) — the lifecycle was already declared; the install ceremony just didn't match it yet.

---

## Upstream-promote loop (manual)

When a project's edits to a picked atom are generalizable, the dev manually ports them back to `loom/catalog/[component].tsx`. There is no automated submission tool.

Trigger: dev tinkers in `/design-system` → recognizes "this change should be in the catalog" → opens both files → ports the diff.

Speculative future tooling (don't build until friction proves it): a `bash loom/promote.sh button --from ../portfolio-site` CLI that diffs the project's `Button` against the catalog `Button` and offers to merge the delta. Only worth building if manual port becomes a recurring drag.

Practice note: candidate-for-promotion checks belong at session-close or retro time, when distance reveals whether the change is generally useful or project-specific.

---

## Versioning stamp on picked files

Every picked file lands with a header comment:

```tsx
// Picked from Loom @ 2026-05-28
// Edit freely — no upstream sync. To refresh, re-pick via setup.sh.
```

Cheap. Tells future-you (or future-collaborator) how old the local fork is when they open the file. No automation, no upgrade path — just orientation.

---

## Templates remain the authoring tool

The current template pipeline (`scripts/code-templates/orchestrator.js` + the templates in `scripts/code-templates/components/`) stays as Loom's internal authoring surface. What changes is the output target.

| Today | Catalog model |
|---|---|
| Orchestrator produces `generated/components/*.tsx` (full bundle) | Orchestrator produces `loom/catalog/[component].tsx` + `[component].manifest.json` + `[component].story.ts` (per-atom files) |
| `setup.sh` copies the full bundle into the consuming project | `setup.sh` reads `loom-picks.json`, resolves dependencies via manifests, copies only the picked subset |
| Stories ship inline with production atoms | Stories ship inline with the catalog atom; arrive at the consuming project alongside their atom; rendered in `/design-system` only, not in production routes |

Why templates instead of hand-authored:

- The 55-atom consistency Loom has today is enforced by templates (twMerge groups, CVA conventions, prop shape, slot patterns). Hand-authoring invites drift.
- Catalog files are consumer-facing **output**, not the dev surface. The dev surface is still the templates + configs in `spec/`.
- Re-running the generator to refresh `loom/catalog/` is the same friction as today, just narrower output.
- shadcn can hand-author because they're a team with code review; we're solo and templates serve that role.

Hand-editing an individual catalog file is allowed for one-off polish, but the templates are the bulk-consistency tool.

---

## Token bundle: substrate, not picked

Tokens are not in the catalog. They ship as a single substrate bundle, all-or-nothing, generated from `spec/config/base/*.json` exactly as today. Per `[[loom-is-substrate-not-design]]`: tokens are foundation; characterization is project-owned.

**One scope addition:** motion tokens land with the substrate bundle now, even before motion components exist in the catalog. Durations, easings, spring presets. The portfolio's animations were all hard-coded — that's a substrate gap. Adding motion tokens now is structurally honest and unblocks the eventual motion atoms (`Reveal`, `TextScramble`, stagger wrappers) without requiring a second substrate pass later.

Motion token shape — locked in during Session 0 of the execution arc.

---

## `/design-system` as a dev-only route group

The project `/design-system` route ships as a Next.js route group: `src/app/(dev)/design-system/`. The `(dev)` group is excluded from production builds via Next.js config (or equivalent build-time filter). Result: production builds literally do not compile the route. No env branching at runtime, no dead code paths, no risk of the gate failing.

This is the structural resolution of L2 ("playground separation from production"). The old framing was "scrub stories before ship." The catalog model's framing is "stories never enter production builds in the first place."

---

## Catalog playground hosting

The catalog playground in `loom/` is itself a consuming project that picks every atom. Same Next.js scaffold, same `(dev)/design-system` route group, same `.story.ts` auto-discovery harness as any downstream project — but its `loom-picks.json` lists every catalog atom.

Structure:

```
loom/
  catalog/
    button.tsx
    button.manifest.json
    button.story.ts
    ...
  catalog-playground/             ← Next.js, consuming-project-of-itself
    loom-picks.json               ← picks every catalog atom
    src/
      app/(dev)/design-system/    ← same route group as consuming projects
      components/                 ← populated by setup.sh from loom/catalog/
    next.config.ts
    package.json
    tokens.css                    ← substrate bundle
```

Implications:

- **One story format.** `.story.ts`, used identically by catalog and consuming projects.
- **One playground renderer.** Catalog and consuming projects render through the same `(dev)/design-system` route — pattern transfer is automatic.
- **Dogfooding.** The catalog playground exercises `setup.sh` and the install ceremony every time it refreshes.
- **No second engineering surface.** Building the catalog playground is mostly free — the consuming-project scaffold + harness gets built anyway; the catalog playground is that scaffold pointed at `loom/catalog/`.

Costs accepted:

- Another Next.js app to maintain inside `loom/`. Dev startup and build times scale with catalog size. Mitigation when it bites: filter `loom-picks.json` to a working subset during dev, or move to per-group browse routes. Not built preemptively.

Hosting deferred to a separate downstream decision. Local-only is fine for Sprint 1; static-export to Netlify (per `[[nextjs-netlify-static-export]]`) at `loom.ikolajm.com` is a candidate for later.

This rules out **Vite** (custom playground shell diverges from consuming projects) and **Storybook** (CSF format diverges from the `.story.ts` harness; two story formats per atom).

---

## Marketing primitives: catalog candidates from portfolio

The portfolio shipped 19 project-authored atoms. ~10 read as catalog-promotable after generalization (Sprint 1 — static markup; motion layer for atoms that need it is Sprint 2):

| Candidate | Notes |
|---|---|
| `HeroBlock` | Display heading + sub + CTA |
| `MediaBlock` | Bordered figure + caption |
| `MediaGallery` | Auto-advancing fade gallery (static markup Sprint 1; crossfade motion Sprint 2) |
| `CrossLinkSection` | Self-omitting cross-link card grid |
| `BracketLabel` | `[ NAV ]` mono treatment |
| `SectionAnchor` | `[ LABEL ] ────` section headers (static Sprint 1; drag-out animation Sprint 2) |
| `TextLink` | Inline prose link |
| `StatCards` | By-the-numbers stat displays |
| `TagChip` | Mono outline chip |
| `CompanyLogo` | CSS-mask logo treatment |

`Reveal` was previously cross-listed here as a marketing candidate; per the execution split, it's a pure motion atom and lives entirely in Sprint 2.

Each was authored against the portfolio's specific tokens and aesthetic. Promotion to catalog requires generalization — removing project-specific quirks, broadening variant space, possibly redesigning. A real design pass per atom; not a single sweep.

The remaining 9 portfolio atoms (case-study wrappers, logos, project-specific shapes) stay project-owned and don't promote.

---

## Migration overview

The execution arc walks every existing atom through the audit framework (see `CATALOG_AUDIT.md`). Mechanical migration steps fall out of the per-atom decisions:

1. **Catalog generation update.** `orchestrator.js` (or a new dispatcher) writes per-atom files (`.tsx` + `.manifest.json` + `.story.ts`) into `loom/catalog/` instead of producing the full `generated/components/` bundle.
2. **`setup.sh` rewrite.** Reads `loom-picks.json`, resolves manifest dependencies, copies the picked subset into the consuming project's `src/components/`. Tokens ship as today (substrate bundle).
3. **Scaffold output update.** Generated `src/app/` scaffold includes `(dev)/design-system/` route group with the auto-discovery harness.
4. **Catalog playground.** `loom/catalog-playground/` — Next.js consuming-project-of-itself with `loom-picks.json` picking every atom. Detailed in § Catalog playground hosting.
5. **The three phase-1 items** (`@theme` registration, `generate-icons` mkdir, shadow-depth docs) are absorbed into the relevant per-atom or scaffold work; not separately tracked.

---

## Open items (intentionally unresolved here)

- **Figma side.** Today's Figma pipeline produces all-atom representations. How Figma maps to the catalog model is **deferred to the execution branch.** Sprint 1 resolves it for static atoms only — the catalog browse role probably belongs to Loom's Figma file (parallel to the catalog playground), and consuming projects probably don't get a filtered Figma file. Motion-in-Figma defers to Sprint 2 (Smart Animate doesn't map cleanly to web motion tokens; warrants its own decision).
- **Motion token shape.** Categories (durations, easings, springs) are the rough scope; specific values + naming lock during Sprint 1 (substrate ships before motion atoms exist). Motion atom design is Sprint 2.

---

## Cross-references

- `[[project_loom]]` — project state, supersedes L1 + L2 backlog items
- `[[downstream-lifecycle]]` — atoms are project-owned, recopiable (the lifecycle this spec aligns the install ceremony to)
- `[[loom-is-substrate-not-design]]` — tokens are substrate; characterization is project-owned
- `[[scaffold-playground-patterns]]` — Paperboy patterns that carry over (stories registry, void-element handling, etc.)
- `[[component-handbuild-approach]]` — hand-built atoms as production baselines (project-authored atoms in `/design-system` are the in-the-wild expression of this)
