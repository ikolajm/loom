# Catalog Audit — Working Scratchpad

Per-component decisions for the Loom catalog overhaul. See `CATALOG_SPEC.md` for the architectural reference; this doc is the execution-side working surface.

**Status:** Session 0 triage complete 2026-05-29. Status flags + consolidation specs (Badge, Banner) landed; remaining detailed audit blocks fill during per-group deep dives.

## How to use

Each atom gets a status, brief notes, and (when status is `refine` or `new`) a detailed audit block under the per-group "Detailed notes" section. The summary tables are the scan view; the detailed blocks are the design work.

When the arc closes, this doc gets archived. The durable output is the per-atom `loom/catalog/[component].manifest.json` files plus the atom files themselves.

## Sprint split

The arc executes in two sprints (see `CATALOG_SPEC.md` § Execution split):

- **Sprint 1 — primary scope of this audit.** All groups EXCEPT Motion. Marketing atoms triage their static markup here; their motion layer waits.
- **Sprint 2.** Motion group. Audit deferred until Sprint 1 ships. Motion tokens still land in Sprint 1 as substrate.

Motion is listed at the bottom for inventory completeness, but is not triaged in Session 0.

## Status legend

| Status | Meaning |
|---|---|
| pending | No decision yet (default) |
| keep | Catalog entry stays as-is |
| refine | Kept, but needs variant/override/composition changes — see detailed block |
| drop | Removed from catalog |
| new | Added to catalog (generalized from portfolio or designed fresh) — see detailed block |
| sprint-2 | Deferred to Sprint 2 (motion atoms; not triaged in Session 0) |

## Per-atom audit schema (for the detailed blocks)

When an atom is `refine` or `new`, capture:

- **Status** — keep / refine / drop / new
- **Category** — button / form / layout / feedback / data-display / navigation / composite / marketing / motion
- **Dependencies** — other catalog atoms this requires (registry deps for the manifest)
- **Token requirements** — which token sets it reads (color, typography, spacing, sizing, effects, motion)
- **Variants** — current + proposed additions, with rationale
- **Override surface** — what's exposed as props vs frozen
- **Composition notes** — patterns this composes well into (e.g., `Card + eyebrow = CalloutBlock`)
- **Open questions** — anything unresolved

## Group ordering for deep dives

1. **Session 0** — triage pass: every atom in Sprint 1 groups gets a status (no detailed blocks yet). Locks the manifest schema (including the `composition` field). Locks the catalog playground hosting choice. Sets the arc's scope.
2. **Buttons** — most familiar, highest leverage
3. **Layout** — `Card` carries the audit table's existing variant proposals (`bare` size etc.)
4. **Forms** — biggest cluster, most interdependencies
5. **Data display**
6. **Feedback**
7. **Navigation**
8. **Composite** — mostly review for catalog fit
9. **Marketing** — new to catalog; real design work to generalize from portfolio (static markup only — motion layer is Sprint 2)
10. **Motion** — **Sprint 2.** Motion tokens land in Sprint 1 as substrate; component audit + design deferred to Sprint 2.

---

## Buttons

Source: `spec/config/components/button.json`. Note: `icon-button` was merged into `button` per `[[project_loom]]`.

| Atom | Status | Notes |
|---|---|---|
| button | refine | Add `outline` variant + Slottable from portfolio |
| fab | keep | |
| fab-menu | new | FAB that expands into action menu (M3 speed-dial pattern) |
| badge | refine | Variant axes expanded — absorbs `chip` / `tag-chip` / `badge-dot`. See detailed notes |
| chip | drop | Consolidated into `badge` (interactive mode) |
| toolbar | keep | |
| toggle | keep | |
| toggle-group | refine | Absorb segmented-button as variant |

### Detailed notes — Buttons

**Session 1 deep dive complete (2026-05-29).** Per-atom blocks below capture the catalog contract for each Buttons-group atom. Cross-cutting decisions:

- **`icon-button` drops from `spec/config/components/button.json`** — already merged into `button` via `iconOnly` mode per `[[project_loom]]`. JSON cleanup task for the orchestrator pass.
- **`badge` JSON config refactor required** — current `variants` (6 colors) splits into orthogonal `state` (color) + `variants` (visual treatment: filled / outline / outline-mono / dot).
- **`toolbar` category review** — toolbar is structurally a Layout primitive, not a Button. Source-of-truth JSON is currently button.json; revisit category move when we hit Layout deep dive.
- **Catalog metadata source** — `$catalog` blocks inside the existing per-component JSON. See `CATALOG_SPEC.md` § Manifests.

---

**button (refine)**

- **Category:** button
- **Dependencies:** `cn-helper`
- **Tokens:** color, typography, spacing, sizing
- **Composition:** `slottable` (Slot + Slottable — ported from portfolio per `[[radix-slot-slottable-pattern]]`; current template uses `Slot` only, refine includes the Slottable upgrade)
- **Variants:** current 6 (default, secondary, destructive, success, warning, ghost) + new `outline` (transparent fill + neutral border + surface text, per portfolio). Total: 7
- **Sizes:** sm, md, lg
- **Icon mode:** `iconOnly` prop — square, no padding, icon centers via flex. Absorbs former `icon-button`
- **`loading` state:** explicit boolean prop. Disables interaction, replaces leadingIcon with built-in spinner. Adds first-class loading affordance without consumer composing `<Spinner />`
- **Override surface:**
  - Props: `variant`, `size`, `iconOnly`, `disabled`, `asChild`, `leadingIcon`, `trailingIcon`, `loading`, standard button HTML attrs
  - Frozen: token mappings, DOM structure (button > span [leading] > Slottable > span [trailing])
- **Open questions:** none.

---

**fab (keep)**

- **Category:** button
- **Dependencies:** `cn-helper`
- **Tokens:** color, typography, spacing, sizing, effects (shadow-2 / shadow-3)
- **Composition:** `slot` (asChild for wrap-in-link; no Slottable since icon position is structural — always first child)
- **Variants:** `default` (primary-container). Single by design — multiple variants would dilute FAB's role as primary screen action
- **Sizes:** sm, md, lg + `extended` mode (md / lg only — sm too small for text)
- **Override surface:**
  - Props: `size`, `extended`, `icon` (required), `label` (when extended), `asChild`
  - Frozen: variant (one), positioning (consumer-side — FAB doesn't manage own position)
- **Open questions:** none.

---

**fab-menu (new)**

- **Category:** button
- **Dependencies:** `fab`, `cn-helper` (Sprint 1 uses CSS positioning; revisit adding `popover` if overflow/portal friction emerges)
- **Tokens:** color, typography, spacing, sizing, effects
- **Composition:** `slot` on trigger; `FabAction` subcomponent for action items (children pattern)
- **Variants:** `default` (matches fab)
- **Sizes:** sm, md, lg (matches fab)
- **Structure:** trigger FAB + expanded vertical stack of smaller circular action buttons above. Each action: icon + optional label
- **Backdrop:** no scrim by default. Consumer adds Dialog/Sheet if focus management is needed
- **Motion:** static open/closed states only in Sprint 1. Expand animation wraps via `Stagger` envelope in Sprint 2
- **Override surface:**
  - Props: `size`, `triggerIcon`, `triggerLabel`, controlled `open` / `onOpenChange`
  - Children: `<FabAction>` items — icon + label + onClick
  - Frozen: positioning relationship (actions above trigger), expand direction
- **Open questions:** none.

---

**badge (refine — consolidation)**

Consolidates `badge` + `chip` + `tag-chip` (marketing candidate) + `badge-dot` (feedback) into one umbrella atom. Follows shadcn convention (one Badge); the MUI/M3 split was naming overhead — the actual visual + behavior space is variant axes inside one atom.

- **Category:** button
- **Dependencies:** `cn-helper`
- **Tokens:** color, typography, spacing, sizing
- **Composition:** `slot` (asChild for wrap-in-link when used as navigational badge)
- **Variants (visual treatment):**
  - `filled` (default, container-fill — current badge behavior)
  - `outline` (transparent fill + colored border + colored text)
  - `outline-mono` (transparent fill + mono outline + mono text — absorbs tag-chip)
  - `dot` (small filled circle, no text — absorbs badge-dot)
- **State (color — orthogonal axis):** `default`, `neutral`, `destructive`, `success`, `warning`, `info`
- **Sizes:** sm, md, lg
- **Icon slots:** leading, trailing (suppressed for `dot`)
- **Behavior modes:**
  - `interactive` — renders `<button>` instead of `<span>`, adds focus-visible + hover, supports `onClick`
  - `onRemove` — renders trailing close affordance (small X), absorbs chip's removable token use case
  - Combining `interactive` + `onRemove` valid (filter chip with remove)
- **Override surface:**
  - Props: `variant`, `state`, `size`, `interactive`, `onRemove`, `leadingIcon`, `trailingIcon`, `asChild`
  - Frozen: color token mappings, structural DOM shape
- **JSON config refactor required:** current `variants` (6 colors) becomes `state`; new `variants` axis added for visual treatment. Migration is straightforward; flag for orchestrator pass
- **Drops:** `chip` (consolidated), `tag-chip` candidate (consolidated as `outline-mono`), `badge-dot` (consolidated as `dot`)
- **Open questions:** chip's selected/unselected toggle semantics — NOT in badge. Toggle handles that case. Document in atom

---

**toolbar (keep)**

- **Category:** button (revisit when we hit Layout deep dive — possibly belongs in Layout group; source-of-truth JSON is currently button.json, not moving config until then)
- **Dependencies:** `cn-helper`
- **Tokens:** color (surface-1, on-surface, outline-subtle), typography, spacing, sizing
- **Composition:** `none` — layout primitive. Children render as-is in flex row
- **Variants:** `default` (single)
- **Sizes:** sm, md, lg
- **Override surface:**
  - Props: `size`
  - Frozen: layout direction (horizontal), positioning (consumer-side)
- **Open questions:** vertical variant? No — vertical layouts are sidebars, not toolbars

---

**toggle (keep)**

- **Category:** button
- **Dependencies:** `cn-helper`, `@radix-ui/react-toggle`
- **Tokens:** color (primary container, on-primary-container, surface variant, outline-subtle), typography, spacing, sizing
- **Composition:** `none` (Radix Toggle primitive handles internal structure)
- **State:** unpressed, pressed (Radix-driven, `aria-pressed`)
- **Sizes:** sm, md, lg
- **Icon slots:** leading, trailing
- **Override surface:**
  - Props: `size`, controlled `pressed` / `onPressedChange`, `disabled`, `leadingIcon`, `trailingIcon`
  - Frozen: state styling, Radix accessibility contract
- **Open questions:** none.

---

**toggle-group (refine)**

- **Category:** button
- **Dependencies:** `toggle`, `cn-helper`, `@radix-ui/react-toggle-group`
- **Tokens:** color (transparent + outline-subtle border), spacing, sizing
- **Composition:** `none` (Radix ToggleGroup primitive)
- **Variants:**
  - `segmented` (default — current shared-borders behavior; absorbs M3 segmented-button)
  - `spaced` (new — visible gaps between toggles for looser visual grouping)
- **Sizes:** sm, md, lg
- **Mode:** `type="single" | "multiple"` (Radix prop)
- **Override surface:**
  - Props: `variant`, `size`, `type`, controlled `value` / `onValueChange`
  - Frozen: Radix accessibility contract
- **Open questions:** none.

---

## Layout

Source: `spec/config/components/layout.json`. Drops from `[[project_loom]]`: `scroll-area` (overflow-auto sufficient), `resizable` (app-level concern).

| Atom | Status | Notes |
|---|---|---|
| card | refine | Add `bare` size variant — closes 4 of 5 portfolio shadowing pairs |
| dialog | keep | |
| alert-dialog | keep | |
| sheet | refine | Single Sheet with `side` prop (top / right / bottom / left) — absorbs M3 bottom-sheet + side-sheet |
| table | keep | |
| separator | keep | |
| scroll-area | drop | Per `[[project_loom]]` — overflow-auto is sufficient |
| resizable | drop | Per `[[project_loom]]` — app-level layout concern |

Triage skipped: adaptive-panes (M3 — app-level concern), image-crop / image-zoom / glimpse (shadcn — domain utilities), video-player (moved to data-display).

### Detailed notes — Layout

*(Empty — filled during deep dive)*

---

## Forms

Source: `spec/config/components/form.json`. Drops from `[[project_loom]]`: `input-group` (Input icon slots + composition cover it).

| Atom | Status | Notes |
|---|---|---|
| text-field | keep | `$base` for input/select/combobox |
| input | keep | Extends text-field |
| select | keep | Extends text-field |
| textarea | keep | |
| date-picker | keep | Composite — uses calendar |
| toggle-base | keep | `$base` for checkbox/radio |
| checkbox | keep | Extends toggle-base. Uses always-visible Square/CheckSquare (not Radix ItemIndicator) |
| radio | keep | Extends toggle-base |
| switch | keep | |
| combobox | keep | Composite — uses input + popover + command |
| slider | keep | |
| file-upload | refine | Consider dropzone-style drag-and-drop variant |
| input-otp | keep | |
| label | keep | |
| helper-text | keep | Inline field error rendering lives here (absorbs the use case alert previously covered) |
| calendar | refine | Add `compact` size to absorb shadcn's mini-calendar pattern |
| input-group | drop | Per `[[project_loom]]` — Input icon slots + composition cover it |
| rating | new | Star/numeric rating — common user-facing input |
| time-picker | new | Distinct enough from date-picker to be its own atom (paired) |
| search-bar | new | In-body search composite — distinct from command-palette (overlay) |

Triage skipped: color-picker (shadcn — too narrow; `react-colorful` is the standard reach when needed), mini-calendar (absorbed as calendar `compact` size).

### Detailed notes — Forms

*(Empty — filled during deep dive)*

---

## Data display

Source: `spec/config/components/data-display.json`.

| Atom | Status | Notes |
|---|---|---|
| avatar | keep | |
| list-item | keep | |
| accordion | keep | |
| kbd | keep | |
| collapsible | keep | |
| avatar-group | new | Stacked avatars — distinct enough from single avatar |
| number | new | Formatted number primitive (static). Sprint 2 `CountUp` motion atom wraps it |
| relative-time | new | "2 hours ago" temporal display |
| video-player | new | Media display primitive |
| qr-code | new | Generator utility |

Triage skipped: kanban / gantt (shadcn — too complex / project-specific).

### Detailed notes — Data display

*(Empty — filled during deep dive)*

---

## Feedback

Source: `spec/config/components/feedback.json`.

| Atom | Status | Notes |
|---|---|---|
| toast | keep | |
| alert | drop | Consolidated into `banner` (inline field errors live in `helper-text`) |
| banner | new | Consolidates alert. See detailed notes |
| tooltip | keep | |
| popover | keep | |
| dropdown-menu | keep | Shares `radix-menus.js` template with context-menu |
| skeleton | keep | |
| progress-bar | keep | |
| badge-dot | drop | Consolidated into `badge` (variant `dot`) |
| empty-state | keep | Structurally distinct (centered, illustration-anchored) — does NOT consolidate into banner |
| context-menu | keep | Shares `radix-menus.js` template with dropdown-menu |
| hover-card | keep | |
| spinner | refine | Static shape variants: `circle` (default) / `pulse-dots` / `jumping-dots` / `ripple`. Motion behavior is Sprint 2 |

Triage skipped: status (shadcn — absorb into badge), announcement (shadcn — banner covers it), M3 loading variants (absorb into spinner variant axis).

### Detailed notes — Feedback

**Banner consolidation (new — consolidates alert)**

Consolidates `alert` + `banner` into one umbrella atom. The functional differences (position, size, severity) are variant axes inside one atom; field-level inline errors stay with `helper-text` (which already has error state).

- **Category:** feedback
- **Dependencies:** `cn-helper`, optional `button` (for action slot)
- **Tokens:** color, typography, spacing, sizing
- **Variants:** `info` | `success` | `warning` | `error` | `promo`
- **Sizes:** `compact` (current alert default) | `standard` | `prominent`
- **Behavior:** `dismissible` prop (renders close affordance), optional `action` slot (button / link)
- **Slots:** leading-icon | trailing
- **Position:** consumer decides — top-of-page, inside-form, inline section. No `position` prop; banner is layout-agnostic
- **Drops:** `alert` (consolidated)

Composition examples for the consuming dev (not catalog metadata; just for the deep-dive reference):

```tsx
<Banner variant="promo" dismissible>Save 20% this weekend.</Banner>
<Banner variant="error" size="compact">Please fix the following errors before submitting.</Banner>
<Banner variant="warning">This section is in beta.</Banner>
```

**spinner (refine)**

Static shape variants land in Sprint 1; motion behavior wraps them in Sprint 2 via the motion library. Shape variant axis:

- `circle` (default — current spinner)
- `pulse-dots`
- `jumping-dots`
- `ripple`

Drawn from motion.dev's loading family. M3's shape-morphing loading-indicator absorbs as another variant when motion lands in Sprint 2.

---

## Navigation

Source: `spec/config/components/navigation.json`.

| Atom | Status | Notes |
|---|---|---|
| top-bar | keep | |
| sidebar | refine | Add `rail` variant (narrow icon-only collapsed state) — absorbs M3 navigation-rail |
| tabs | keep | |
| bottom-nav | keep | |
| breadcrumbs | keep | |
| pagination | keep | Uses `<a>` links (navigation semantics) with `interactive` class, not `<button>` |
| navigation-menu | keep | |
| command-palette | keep | |

Triage skipped: navigation-rail (absorbed → sidebar variant), bottom-app-bar (= bottom-nav), mega-menu (→ navigation-menu variant), dock / macOS-dock / radial-menu (too specialized).

### Detailed notes — Navigation

*(Empty — filled during deep dive)*

---

## Composite

Source: `spec/config/components/composite.json`.

| Atom | Status | Notes |
|---|---|---|
| stepper | keep | |
| carousel | refine | Base structure Sprint 1; motion variants (coverflow / parallax / lightbox / thumbnail) wait for Sprint 2 |
| tree-view | keep | |
| comparison | new | Before/after slider — useful for case studies and design comparison |

Triage skipped: dev-tools cluster (code-block / code-editor / terminal / sandbox) — catalog audience is product/marketing builders, not dev-tool builders. Revisit if scope changes.

### Detailed notes — Composite

*(Empty — filled during deep dive)*

---

## Marketing — new catalog candidates

Triage applied the "generalizable pattern vs portfolio styling" lens. Survivors below; portfolio atoms that read as project-specific styling stay project-owned.

| Atom | Status | Notes |
|---|---|---|
| hero-block | new | Display heading + sub + CTA — generalizable marketing pattern |
| media-block | new | Bordered figure + caption — generalizable |
| media-gallery | new | Auto-advancing fade gallery (static markup Sprint 1; crossfade motion Sprint 2) |
| text-link | new | Inline prose link with affordance |
| device-frame | new | iPhone / Safari / Android mockups as one atom with `variant` prop — useful for product showcase pages |

**Dropped during triage (project-owned, not catalog-promoted):**

| Atom | Reason |
|---|---|
| cross-link-section | Self-omitting cross-link grid is bound to portfolio's case-study IA — not a pattern other sites have |
| bracket-label | `[ NAV ]` is portfolio styling, not a component shape — styling on existing primitives |
| section-anchor | `[ LABEL ] ────` + drag-out is stylized for portfolio — structural anchored-section-header pattern is real but visual treatment is project-specific |
| stat-cards | Molecule (number + caption + maybe icon), not atom — composition of primitives in the project (`Number` + caption per the molecule-vs-atom framing in `CATALOG_SPEC.md`) |
| tag-chip | Consolidated into `badge` (variant `outline-mono`) |
| company-logo | Just `<img>` + Tailwind utility (`mask-image` + `bg-current`) — doesn't need its own atom |

### Detailed notes — Marketing

*(Empty — filled during deep dive)*

---

## Motion

**Sprint 2.** Motion tokens (durations, easings, springs) ship with the substrate bundle in Sprint 1; the motion atom catalog is designed in Sprint 2 after Sprint 1 establishes the composition patterns (`slot` / `asChild`) that envelopes wrap against.

Per spec, motion atoms are **envelopes, not pre-composed pairs** — consumers compose `<Reveal><Card /></Reveal>`, `<CountUp value={42} />`, `<Stagger><HeroBlock /></Stagger>`. No `AnimatedButton` parallels.

Provisional inventory (to be expanded with the wider candidate set from motion.dev during Sprint 2 triage — scroll family, text family, cursor family, drag family, spring primitives, layout/shared transitions, etc.):

| Atom | Status | Notes |
|---|---|---|
| reveal | sprint-2 | Scroll-reveal IntersectionObserver wrapper — pure motion atom |
| text-scramble | sprint-2 | Animated character substitution — portfolio's eyebrow treatment |
| stagger | sprint-2 | Wrapper for staggered child animations — pattern used across portfolio sections |
| ... | sprint-2 | Wider candidate set surfaced during Sprint 2 triage |

### Detailed notes — Motion

*(Empty — Sprint 2)*

---

## Cross-cutting open questions

Things that span multiple atoms or aren't atom-specific. Captured here so they don't get lost in per-atom blocks.

- **Manifest schema final lock** — schema in `CATALOG_SPEC.md` is provisional. Locks during Session 0 of Sprint 1, including the `composition` field (`slot` / `asChild` / `children-as-function` / `none`) so Sprint 2 envelopes have a stable contract.
- **Composition pattern standardization** — atoms that warrant wrapping (Button uses Radix Slot + Slottable today) get a consistent slot pattern across the catalog in Sprint 1 so Sprint 2 envelopes compose against a stable surface.
- **Motion token shape** — categories (durations, easings, springs) are scoped; specific values + naming lock during Sprint 1 (substrate ships before motion atoms exist).

**Resolved during Session 0 triage:**

- ~~`chip` vs `tag-chip`~~ — consolidated into `badge` (variants `outline-mono` + `interactive` + `onRemove`). `badge-dot` also consolidated.
- ~~Catalog playground hosting~~ — Next.js consuming-project-of-itself in `loom/catalog-playground/`. See `CATALOG_SPEC.md` § Catalog playground hosting.
- ~~`reveal` lives in two categories~~ — pure motion atom; Sprint 2 only.
- **Three phase-1 items** (from earlier `project_loom` backlog) absorbed into per-atom or scaffold work, not separately tracked:
  - `@theme` registration of role tokens — folded into token bundle output
  - `generate-icons.js` mkdir bug — fixed in passing during catalog migration
  - `--shadowDepth` options docs — addressed during token/effects work

---

## Cross-references

- `CATALOG_SPEC.md` — architectural reference (this audit operationalizes it)
- `[[project_loom]]` — project state, supersedes L1 + L2 backlog
- `[[reference_portfolio-site]]` — source for marketing candidates
- `[[scaffold-playground-patterns]]` — Paperboy-derived patterns that inform `/design-system` auto-discovery
