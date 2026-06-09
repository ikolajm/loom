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
| toolbar | moved | → **Layout** group (it's a flex container, not a button). Config relocated `button.json`→`layout.json` during the Layout deep dive (2026-06-06) |
| toggle | keep | |
| toggle-group | refine | Absorb segmented-button as variant |

### Detailed notes — Buttons

**Session 1 deep dive complete (2026-05-29).** Per-atom blocks below capture the catalog contract for each Buttons-group atom. Cross-cutting decisions:

- **`icon-button` drops from `spec/config/components/button.json`** — already merged into `button` via `iconOnly` mode per `[[project_loom]]`. JSON cleanup task for the orchestrator pass.
- **`badge` JSON config refactor required** — current `variants` (6 colors) splits into orthogonal `state` (color) + `variants` (visual treatment: filled / outline / outline-mono / dot).
- **`toolbar` category review** — RESOLVED in the Layout deep dive (2026-06-06): toolbar is a Layout primitive; config moved `button.json`→`layout.json`, category button→layout, and it's now generated (was previously absent from the registry). See Layout § detailed notes.
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

**toolbar (moved → Layout)** — full detailed block now lives in the Layout § (config relocated to `layout.json`, category layout, generated 2026-06-06). Block below retained for history.

- **Category:** ~~button~~ → **layout** (moved 2026-06-06)
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
| card | refine | Added `flush` variant (transparent, no border/shadow — sits level with the surface; takes borders/padding back via override). No `asChild` — stays a plain div (Jacob's call) |
| dialog | refine | Built-in close X (`showClose`, default true); dropped dead `Button` import |
| alert-dialog | keep | Unchanged — no dismiss-X by design (explicit action only), no dead imports |
| sheet | refine | `side` prop already done; added built-in close X (`showClose`). Bottom drag-handle **deferred to Sprint 2** (handle without drag-to-dismiss is ornament) |
| table | refine | (1) Size set once on `<Table>`, propagates to cells via context; per-cell `size` overrides. Now `'use client'`. (2) Modern content-first treatment — no header fill, muted header, no zebra, light row borders + subtle hover, no outer grid |
| separator | keep | Unchanged |
| toolbar | new (moved) | Moved from Buttons (`button.json` → `layout.json`, category button→layout); was never generated — now in registry + generated |
| scroll-area | drop | Per `[[project_loom]]` — overflow-auto is sufficient |
| resizable | drop | Per `[[project_loom]]` — app-level layout concern |

Triage skipped: adaptive-panes (M3 — app-level concern), image-crop / image-zoom / glimpse (shadcn — domain utilities), video-player (moved to data-display).

### Detailed notes — Layout

**Layout deep dive complete (2026-06-06).** Confirmed with Jacob via decision round; implemented by editing config + generators (not the generated `catalog/*.tsx`) and regenerating. Validated by `next build` green in the standing portability harness (`loom-test-project`) with all Layout atoms picked + smoke-used; emitted CSS confirmed the new utilities survived purge.

Cross-cutting decisions:

- **Built-in close X on dialog + sheet (not alert-dialog).** Both templates imported `{ X }` + `{ Button }` but rendered neither (dead imports). Resolved by rendering a top-right close affordance via the Radix `Close` primitive + lucide `X`, behind a `showClose` prop (default true). Uses Radix `Close` directly, **not** the Button atom — keeps dialog/sheet dependency surface at just `cn`; dropped the `Button` import. Hover treatment is opacity (per `[[hover-defaults-opacity]]`). AlertDialog intentionally excluded — it has no dismiss-X by design and had no dead imports.
- **Toolbar category move.** Toolbar is structurally a horizontal flex container for grouped actions — a Layout primitive, not a Button. Config moved `button.json` → `layout.json` (`$catalog.category` button→layout) and a `Toolbar` registry entry added in `shared.js`. It had **never been generated** (absent from the registry) — this pass closes that gap. Dropped the config's fixed `height` (a container housing buttons should size to content, not clip them) and the inert `font-size`/`line-height` (cva-only reads neither — only `table`'s special generator does).

---

**card (refine)**

- **Status:** refine
- **Category:** layout
- **Dependencies:** `cn`
- **Tokens:** color, typography, spacing, sizing
- **Composition:** `none` — **no `asChild`** (Jacob's call). Card stays a plain `div`; consumer wraps in their own `<a>`/`<button>` for clickable-card cases. Keeps the surface small; matches shadcn.
- **Sizes:** sm / md / lg (unchanged).
- **Variants:** default / elevated / outline + new **`flush`** (transparent bg, `border-0`, no shadow). `flush` = a card that sits level with its background, no separating chrome.
  - *Naming history (resolved with Jacob via visual review):* first built as a `bare` **size** (zero padding) → Jacob: "that's a variant, not a size." Reframed to a variant. `bare` rejected as the name (a bare card *gaining* a border reads as a contradiction); `ghost` considered (vocab-consistent with Button) but **`flush`** chosen — a flush element taking a border later isn't an "offensive override," it just becomes outlined. Edge-to-edge media = `variant="flush"` + `className="p-0"` (atom is project-owned).
- **Override surface:** Props: `variant`, `size`, standard div attrs. Frozen-but-editable: subcomponent structure (Header/Title/Description/Content/Footer).
- **Open questions:** none.

---

**dialog (refine)**

- **Status:** refine (close affordance)
- **Category:** layout
- **Dependencies:** `cn` (+ `@radix-ui/react-dialog`, `lucide-react` at runtime)
- **Composition:** `none` (Radix Dialog primitive)
- **Sizes:** sm / md / lg / full (unchanged).
- **Change:** built-in close X behind `showClose` (default true) — see cross-cutting note. Dropped dead `Button` import.
- **Override surface:** Props: `size`, `showClose`, Radix Content props. Frozen: overlay/scrim, positioning, Radix a11y contract.
- **Open questions:** none.

---

**sheet (refine)**

- **Status:** refine
- **Category:** layout
- **Dependencies:** `cn` (+ `@radix-ui/react-dialog`, `lucide-react`)
- **Composition:** `none` (Radix Dialog primitive, used as an edge panel)
- **`side` prop:** top / right / bottom / left (already implemented prior to this pass — size applies as width for left/right, height for top/bottom).
- **Change:** built-in close X behind `showClose` (default true). Dropped dead `Button` import.
- **Deferred to Sprint 2:** bottom drag-handle. The JSON `handle` config exists but is **not rendered** — a handle without drag-to-dismiss is ornament; it lands with the gesture in the Sprint 2 interaction pass.
- **Override surface:** Props: `side`, `size`, `showClose`, Radix Content props. Frozen: overlay/scrim, edge-anchoring per side.
- **Open questions:** none.

---

**table (refine)**

- **Status:** refine (size propagation + visual treatment)
- **Category:** layout
- **Dependencies:** `cn`
- **Composition:** `none`
- **Change 1 — size propagation:** size is set once on `<Table size>` and flows to `TableHead`/`TableCell` through `TableSizeContext`; a cell's own `size` prop still overrides. Replaces the prior per-cell threading. **Cost:** context makes Table client-rendered (`'use client'`) — accepted to honor the per-cell-override requirement (the server-safe CSS-cascade alternative can't cleanly support override).
- **Change 2 — visual treatment (from visual review):** the original generated table over-signaled — filled header (`surface-2`) + zebra rows + full border grid all at once (design-research consensus: pick one structuring device). Reworked to the **modern content-first** idiom (shadcn / Linear / Vercel): no header fill, muted header text (`on-surface-variant`) + `font-medium`, no zebra, light row bottom-borders + subtle `hover:bg-surface-1`, no outer grid, `text-sm`. Header recedes (it's labels); cell data is full-strength. Config dropped `header-bg` / `row-bg` / `alt-row-bg`.
- **Sizes:** sm / md / lg.
- **Override surface:** Props: `size` (on Table; cascades), per-cell `size` (override). Frozen-but-editable: single `default` variant, the row-border/hover treatment.
- **Open questions:** none. (Zebra striping deliberately *not* offered as a variant — YAGNI until a long-data use demands it; best practice favors zebra only on long tables.)

---

**toolbar (new — moved from Buttons)**

- **Status:** new to catalog (config moved from Buttons; was never generated)
- **Category:** layout (was button)
- **Dependencies:** `cn`
- **Tokens:** color, typography, spacing, sizing
- **Composition:** `none` — layout primitive; children (buttons / toggles / separators / dropdowns) render as-is in a flex row.
- **Sizes:** sm / md / lg (padding + gap; **no fixed height** — sizes to content).
- **A11y:** no `role="toolbar"` in Sprint 1 — the ARIA toolbar role implies roving-tabindex/arrow-key nav this static container doesn't implement; claiming it would be a false signal (Senior-Engineer smell flag). Revisit with `@radix-ui/react-toolbar` in the Sprint 2 interaction pass. Children stay individually tab-focusable.
- **Variants:** `default` (surface-1 bg + on-surface text + subtle border).
- **Override surface:** Props: `variant`, `size`. Frozen: horizontal layout, positioning (consumer-side).
- **Open questions:** none.

---

**alert-dialog (keep) · separator (keep)** — unchanged this pass. AlertDialog: sm/md/lg + Action/Cancel, no dismiss-X by design. Separator: orientation prop, Radix-backed.

---

## Forms

Source: `spec/config/components/form.json`. Drops from `[[project_loom]]`: `input-group` (Input icon slots + composition cover it).

| Atom | Status | Notes |
|---|---|---|
| text-field | keep | `$base` for input/select/combobox |
| input | keep | Extends text-field. **+ error cascade** (reads `FormFieldContext.error`) |
| select | keep | Extends text-field. **+ error cascade** |
| textarea | keep | Extends text-field. **+ error cascade** |
| date-picker | keep | Composite — uses calendar. **+ error cascade** (trigger border) |
| toggle-base | keep | `$base` for checkbox/radio |
| checkbox | keep | Extends toggle-base. Uses always-visible Square/CheckSquare (not Radix ItemIndicator) |
| radio | keep | Extends toggle-base |
| switch | keep | |
| combobox | keep | Composite — uses input + popover + command. **+ error cascade** (trigger border) |
| slider | keep | |
| file-upload | refine | **Already dropzone** — refine is the selected-files affordance: stateless dropzone + `FileUploadItem` subcomponent. `dragover` demoted variant→internal state. + error cascade |
| input-otp | keep | |
| label | keep | |
| helper-text | refine | Inline field error rendering lives here (absorbs alert's use case). **+ error cascade** (reads `FormFieldContext.error`) |
| form-field | new | **Added to catalog** (was generated but untracked). Field-row primitive — provides `error` context the controls + helper-text cascade off |
| calendar | refine | Add `compact` size to absorb shadcn's mini-calendar pattern |
| input-group | drop | Per `[[project_loom]]` — Input icon slots + composition cover it |
| rating | new | Star/numeric rating — common user-facing input |
| time-picker | new | Distinct enough from date-picker to be its own atom (paired). Composes three `Select`s (hour/min/period) |
| search-bar | new | In-body search composite — distinct from command-palette (overlay). Static input shell Sprint 1 |

Triage skipped: color-picker (shadcn — too narrow; `react-colorful` is the standard reach when needed), mini-calendar (absorbed as calendar `compact` size).

### Detailed notes — Forms

**Forms deep dive complete (2026-06-08).** Confirmed with Jacob via decision round; implemented by editing config (`form.json`) + generators/templates and regenerating (never the generated `catalog/*.tsx`). Biggest group (18 atoms + the untracked `form-field`), but the design energy concentrated in ~7 — the text-input family and selection controls are clean `keep`s on the existing `$base`/extend model.

Cross-cutting decisions:

- **The error cascade (C).** `FormField` is promoted to a tracked catalog atom (it was already generated but absent from the audit table, with a dead `useFormField()` context nothing consumed). Wiring made real: `HelperText` and the text-control borders (`input` / `select` / `textarea` / `combobox` / `date-picker`) **default to reading `FormFieldContext.error`**, with the explicit `state`/`error` prop still overriding. One `<FormField error>` now cascades a red border + red helper text to the whole field; standalone use (no FormField wrapper) is unchanged. This is what makes "helper-text absorbed alert's inline-error job" true by construction.
- **file-upload was already a dropzone.** The audit's "consider dropzone variant" was stale. The honest refine is the **selected-files affordance**: the dropzone stays stateless (fires `onFilesSelected`, owns no file array), and a sibling **`FileUploadItem`** subcomponent (name + size + remove-X) ships as a frozen-but-editable piece the consumer maps over their own state — same composition pattern as Card/Table subcomponents, *not* a stateful black-box widget (Option 1, Jacob's call). `compact` size **deferred** (a single-row inline dropzone is a different layout, YAGNI). `dragover` **demoted** from the `variants` axis to an internal runtime state — it was never an author-time choice; file-upload is now single-variant.
- **Composite import casing fixed in passing.** `combobox` / `date-picker` imported PascalCase siblings (`./Popover`, `./Calendar`) while generated files are lowercase — resolved only on case-insensitive (macOS) filesystems and had never been built (gallery picked only Buttons+Layout). Corrected to lowercase to match the `./cn` convention; new composites (`time-picker`, `search-bar`) follow it.
- **Known latent gap (noted, not fixed):** composite manifests under-declare registry `dependencies` (e.g. `combobox` lists only `['cn']` despite composing Popover/Command). Inference can't see cross-atom deps. The new composites declare theirs correctly via `$catalog.dependencies`; back-filling the existing composites is a separate cleanup (flagged for the manifest-deps pass).

---

**Field-input family (input / select / textarea / date-picker / combobox) — keep + error cascade**

- **Status:** keep (model unchanged), + error cascade.
- **Category:** form. **Base:** `text-field` (input/select/textarea/date-picker/combobox all extend it).
- **Change:** each text control resolves its `state` from `FormFieldContext.error` when not explicitly set. `input`/`textarea` (cva-only) gain a `formControl` meta flag that imports `useFormField`; `select` (radix) resolves in its trigger; `combobox`/`date-picker` (bespoke) gain an `error` prop that flips the trigger border and also reads context.
- **Override surface:** unchanged props + the existing `state`/`error` override always wins over the cascade.
- **Open questions:** none.

**toggle-base / checkbox / radio / switch / slider — keep**

- Unchanged this pass. `toggle-base` is the `$base` for checkbox/radio; checkbox uses always-visible `Check` indicator; switch + slider are Radix-backed with hardcoded cohesive dimensions (intentional `$exception`). No catalog-contract change.

---

**form-field (new — promoted from untracked)**

- **Status:** new to the audit (the atom already generated; this tracks it + wires the dead context).
- **Category:** form. **Dependencies:** `cn`. **Composition:** `none`.
- **Role:** the field-row primitive — `flex flex-col` container that provides `FormFieldContext { error }`. Children (label / control / helper-text) cascade off it.
- **Override surface:** Props: `error`, standard div attrs. Frozen-but-editable: the row gap.
- **Open questions:** none.

**helper-text (refine — error cascade)**

- **Status:** refine. **Category:** form. **Dependencies:** `cn`, `form-field` (for `useFormField`).
- **Change:** `state` defaults to `error` when inside a `<FormField error>`; explicit `state` prop overrides. Owns inline field-error rendering for the catalog (absorbed from the dropped `alert`).
- **Override surface:** Props: `state`, `size`, standard `<p>` attrs.
- **Open questions:** none.

---

**file-upload (refine — selected-files affordance)**

- **Status:** refine. **Category:** form. **Dependencies:** `cn`. **Tokens:** color, typography, spacing, sizing.
- **Composition:** stateless dropzone + `FileUploadItem` subcomponent (frozen-but-editable). Consumer owns the `files[]` array.
- **`FileUploadItem`:** props `name`, `size?` (formatted string or bytes), `onRemove?` — renders a row with filename + size + a remove-X (hover = opacity per `[[hover-defaults-opacity]]`).
- **Variants:** single `default` (dragover is now internal state, not a variant).
- **Sizes:** sm / md / lg (compact deferred).
- **Override surface:** Props on dropzone: `size`, `accept`, `multiple`, `onFilesSelected`, `disabled`, `error` (reads FormFieldContext). Frozen-but-editable: default dropzone copy, `FileUploadItem` row structure.
- **Open questions:** none.

**calendar (refine — compact size)**

- **Status:** refine. **Category:** form. **Dependencies:** `cn` (+ `react-day-picker`).
- **Change:** add a `compact` size tier (narrower width, smaller cells/typography) — absorbs shadcn's mini-calendar. Pure config add; the generator maps all size keys.
- **Sizes:** compact / sm / md / lg.
- **Open questions:** none.

---

**rating (new)**

- **Status:** new. **Category:** form. **Dependencies:** `cn`. **Tokens:** color, sizing.
- **Composition:** `none`. Star icons (lucide `Star`), filled vs empty driven by value.
- **Override surface:** Props: `max` (default 5), `value` / `onValueChange`, `allowHalf`, `readOnly`, `icon` (swap star→heart etc.), `size` (sm/md/lg).
- **Frozen-but-editable:** the fill/track token mapping (filled = `primary` / `warning`; empty = `outline`).
- **Open questions:** none.

**time-picker (new — Option A)**

- **Status:** new. **Category:** form. **Dependencies:** `cn`, `select`. **Composition:** `none`.
- **Approach (Jacob's call — Option A):** three composed `Select`s — hour / minute / period (AM-PM). Composes the existing Select substrate; no masking logic; accessible by construction. `24h` prop drops the period select and switches the hour range.
- **Override surface:** Props: `value` / `onValueChange` (a `{hour, minute, period}` or `Date`), `size`, `minuteStep` (default 5), `use24Hour`, `disabled`.
- **Open questions:** none.

**search-bar (new — static shell Sprint 1)**

- **Status:** new. **Category:** form. **Dependencies:** `cn`. **Composition:** `none`.
- **Scope (Sprint 1):** the static input shell — leading `Search` icon + text input + clearable `X` (shows when non-empty). Distinct from `command-palette` (overlay). Live-results dropdown **deferred**.
- **Override surface:** Props: `value` / `onValueChange`, `placeholder`, `size`, `onClear`, `disabled`, standard input attrs.
- **Open questions:** results dropdown lands when a real in-body-search use demands it (not Sprint 1).

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
| avatar-group | new | Stacked avatars + `+N` overflow — composition over `avatar` |
| number | new | Formatted number primitive (`Intl.NumberFormat`, RSC-safe). Sprint 2 `CountUp` motion atom wraps it |
| relative-time | new | "2 hours ago" — `Intl.RelativeTimeFormat` + native `<time>` |
| video-player | new | Styled native container (browser owns controls) — see detailed notes |
| qr-code | drop | Cut at the deep dive (2026-06-08) — narrow utility; project pulls a lib directly if needed |

Triage skipped: kanban / gantt (shadcn — too complex / project-specific). qr-code dropped at deep dive (narrow leaf utility — substrate shouldn't carry a QR encoder; project adds `qrcode.react` itself if it needs one).

### Detailed notes — Data display

**Deep dive complete (2026-06-08).** 5 keeps confirmed schema-clean (no refine); 4 new atoms designed; qr-code dropped. Cross-cutting decisions:

- **Avatar stays single-variant** — initials bg is decorative, not semantic. Adding the orthogonal `variant × color` axis here would be ambition, not substrate. Deliberate omission.
- **All 4 new atoms are bespoke `lib` templates** — hand-authored `.tsx` emitted by a generator fn in `scripts/code-templates/components/`, each with a registry entry + a small `data-display.json` config block.
- **No new npm deps** — avatar-group composes `avatar`; number/relative-time use native `Intl`; video-player wraps native `<video>`. qr-code (the one lib candidate) was dropped.

---

**avatar-group (new)**

- **Category:** data-display
- **Dependencies:** `cn`, `avatar` (registry dep — picker pulls avatar transitively)
- **Tokens:** color, spacing, sizing
- **Composition:** `none`
- **Shape:** horizontal stack; overlap via negative margin + a ring in the surface/background color so adjacent edges read. `max` caps visible avatars; overflow renders a `+N` counter as a final Avatar-shaped fallback (reuses `Avatar`, so size/shape inherit).
- **Variants:** none (single shape). **Sizes:** forwarded to children (sm/md/lg/xl, matching `avatar`).
- **Override surface:**
  - Props: `max`, `size` (forwarded), `spacing` (overlap amount), children (Avatars)
  - Frozen: the ring/overlap mechanism, the `+N` fallback structure
- **Open questions:** none.

---

**number (new)**

- **Category:** data-display
- **Dependencies:** `cn`
- **Tokens:** typography (`tabular-nums`)
- **Composition:** `none` — **RSC-safe** (no hooks, deterministic). Sprint 2 `CountUp` wraps it.
- **Shape:** a `<span>` rendering `Intl.NumberFormat(locale, options).format(value)`, with `font-variant-numeric: tabular-nums` so digits don't jitter.
- **Override surface:**
  - Props: `value`, `format` (`decimal` | `currency` | `percent` | `unit`), `currency`, `unit`, `notation` (`standard` | `compact` | `scientific`), `locale`, plus escape-hatch `options` (raw `Intl.NumberFormatOptions`, spread last)
  - Frozen: the `<span>` + tabular-nums default
- **Open questions:** none — `Intl` over a formatting lib.

---

**relative-time (new)**

- **Category:** data-display
- **Dependencies:** `cn`
- **Tokens:** typography
- **Composition:** `none` — client component (`'use client'`); needs "now".
- **Shape:** renders `<time dateTime={iso}>` (SSR-stable anchor) and computes the relative string (`Intl.RelativeTimeFormat`) on the client after mount, avoiding server-now ≠ client-now hydration mismatch. Optional `live` prop ticks an interval (cleared on unmount) to keep the string fresh.
- **Override surface:**
  - Props: `date` (Date | string | number), `live` (bool, default false), `locale`, `numeric` (`auto` | `always`)
  - Frozen: the `<time>` element + mount-safe computation + interval cleanup
- **Open questions:** none — hydration handling is a conscious choice, flagged here.

---

**video-player (new)**

Scope decision (2026-06-08): **styled native container, not a custom player.** Loom is substrate — the project skins controls itself if it wants. Browser owns the control chrome via native `<video controls>`; Loom owns only the styled container. No JS state, no npm dep.

- **Category:** data-display
- **Dependencies:** `cn`
- **Tokens:** sizing (radius), spacing, effects (optional shadow)
- **Composition:** `none`
- **Shape:** wraps native `<video>` in a token-styled container — rounded clipping, aspect-ratio box, object-fit, poster pass-through.
- **Variants:** `aspectRatio` axis (`16/9` default | `4/3` | `1/1` | `auto`). **Sizes:** none (width-driven by container).
- **Override surface:**
  - Props: `src`, `poster`, `aspectRatio`, `fit` (`cover` | `contain`), `controls` (default true), plus native video attrs (`autoPlay`, `loop`, `muted`, `preload`, etc. via spread)
  - Frozen: the styled container + rounded clipping
- **Open questions:** none.

---

## Feedback

Source: `spec/config/components/feedback.json`. **Done — shipped 2026-06-08** (5 of 9 groups). 2 changes, 11 keeps.

| Atom | Status | Notes |
|---|---|---|
| toast | keep | |
| alert | drop | Renamed + refactored into `banner` (inline field errors live in `helper-text`) |
| banner | new | Consolidates alert. See detailed notes |
| tooltip | keep | |
| popover | keep | |
| dropdown-menu | keep | Shares `radix-menus.js` template with context-menu |
| skeleton | keep | |
| progress-bar | keep | |
| badge-dot | drop | **No fold.** `Dot` (blank indicator) + `Badge size="sm"` (count) cover it — removes the system's only sub-12px font exception |
| empty-state | keep | Structurally distinct (centered, illustration-anchored) — does NOT consolidate into banner |
| context-menu | keep | Shares `radix-menus.js` template with dropdown-menu |
| hover-card | keep | |
| spinner | keep | Shape-variant axis (`pulse-dots`/`jumping-dots`/`ripple`) deferred to Sprint 2 — they're inert without motion; `circle` works today via CSS spin, so Sprint 1 = no change |

Triage skipped: status (shadcn — absorb into badge), announcement (shadcn — banner covers it), M3 loading variants (→ spinner shape axis, Sprint 2).

Also landed this group (out of the Feedback scope, surfaced by the smell gate): **Button gained an `inherit` color** (`--v-text:currentColor`) so an iconOnly Button can serve an in-surface affordance that takes the parent's foreground — used by Banner's dismiss; `colorToVar` now passes `currentColor`/`transparent` literals through. **Badge** swapped its hand-rolled close-X SVG for lucide `X` (kills cross-atom duplication; Badge stays decoupled from Button because Button's `icon-sm = ch-3` size floor is too large for a chip-scale remove affordance).

### Detailed notes — Feedback

**Banner (new — renames + refactors alert)**

Renames `alert` → `banner` and folds the position/size/severity differences into variant axes on one atom; field-level inline errors stay with `helper-text` (which already has error state).

- **Category:** feedback
- **Dependencies:** `cn` + `button` (the dismiss affordance composes an iconOnly Button)
- **Tokens:** color, typography, spacing, sizing
- **Variants:** `info` | `success` | `warning` | `error` — severity axis only. `info` is the default (the old neutral-surface `default` was dropped; info subsumes it). **`promo` was NOT added** — a marketing strip is `variant="info"` + className or a Marketing-group atom, not a severity (keeps the axis meaning clean).
- **Sizes:** `sm` | `md` | `lg` — kept the system-wide scale rather than the audit's earlier `compact/standard/prominent` (cross-atom consistency over local descriptiveness).
- **Behavior:** **stateless dismiss keyed off `onDismiss` presence** (no `dismissible` flag — that flag could only ever produce a dead close button; keying off the handler removes the footgun and stays RSC-safe). Optional `action` slot (consumer-provided ReactNode).
- **Dismiss affordance:** composes `<Button iconOnly variant="ghost" color="inherit">` + lucide `X` — inherits the banner's foreground, reuses Button's focus/hover (the shared `interactive` opacity-hover), no hand-rolled button or SVG.
- **Slots:** leading-icon (consumer-provided node). A `trailing` dismiss-x slot is declared for the **Figma** reference (toggleable x, mirrors Toast); in **code** that slot is honored by the `onDismiss` Button, not a `trailingIcon` prop (asymmetric by role — `banner.js` ignores the slot).
- **Position:** consumer decides — top-of-page, in-form, inline. No `position` prop; banner is layout-agnostic. `role="status"` (polite), overridable via props.
- **Drops:** `alert` (renamed).

```tsx
<Banner variant="info" leadingIcon={<Info />}>Heads up — a new version is available.</Banner>
<Banner variant="error">Please fix the following errors before submitting.</Banner>
<Banner variant="warning" onDismiss={() => setShow(false)} action={<Button size="sm">Review</Button>}>Your trial ends in 3 days.</Banner>
```

**spinner (keep — shape axis deferred to Sprint 2)**

The shape-variant axis (`circle` / `pulse-dots` / `jumping-dots` / `ripple`, drawn from motion.dev's loading family) was reclassified from "refine" to a **Sprint 2 motion item**: rendered static, the dot/ripple shapes read as inert (they only make sense with motion). `circle` is already motion-legible today via CSS `animate-spin`, so Sprint 1 leaves spinner unchanged. M3's shape-morphing loading-indicator absorbs as another shape when motion lands.

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

Deep dive 2026-06-09. **6 keeps, 2 refines, 2 bug-fixes.** All atoms pre-existed; the dive refined the override surfaces and fixed two latent bugs the gallery/scanner surfaced.

**sidebar (refine — `rail` variant).** Added the icon-only collapsed variant (absorbs M3 navigation-rail). Mechanism decided in the sit-down (CSS group marker over context/per-item prop): rail width differs per size (56/64/72), so each size tier sets BOTH widths as namespaced CSS vars (`--sidebar-w` / `--sidebar-rail-w`) and the `variant` picks which to consume — keeping rail a single flat variant, not a compound `variant × size` matrix (which `buildCvaString` doesn't emit). `SidebarItem` labels collapse + icons center via the parent's `is-rail` group marker (`group-[.is-rail]:hidden` / `:justify-center` / `:px-0`) — pure CSS, no context, RSC-safe; set rail once on `<Sidebar>` and every item responds. **Outgrew the generic `cva-only` path → promoted to a dedicated `sidebar.js` generator module** (Sidebar + SidebarItem co-located; removed the old `Sidebar` entry from the cva-only SUBCOMPONENTS table). Custom-prop names namespaced `--sidebar-*` (not `--sb-*`) for collision-safety since atoms are copied into consumer code.

**breadcrumbs (refine — `BreadcrumbSeparator`).** Was Breadcrumbs + BreadcrumbItem only; the config's `separator: "/"` rendered nothing (consumer hand-placed). Added `BreadcrumbSeparator` — renders the config glyph by default, `children` override (e.g. a chevron), `role="presentation" aria-hidden` (matches shadcn). Implemented as a generic `separator` branch in the cva-only SUBCOMPONENTS renderer (reusable for future divider subs).

**navigation-menu (keep + refine).** `NavigationMenuLink` was exported as the raw `Radix.Link` — no hover/focus affordance, so dropdown panel links gave no pointer/keyboard feedback (caught at gallery confirm). Gave it a default affordance mirroring the trigger. **Surface-level finding:** the link's hover/focus steps to `surface-2`, NOT `surface-1` — links sit *on* the panel (`surface-1`), so a `surface-1` hover is invisible (same color as the panel); the trigger correctly uses `surface-1` because it sits on the page surface, a level below. Same container→item level-up precedent as `CommandPaletteItem` (`surface-1` list, `surface-2` selected). A standalone styled atom's default states must account for which surface it composes onto.

**command-palette (keep + fix).** `CommandPaletteGroup` built the group-heading font-size class by interpolating the `[&_[cmdk-group-heading]]:` prefix at **runtime** — Tailwind's static scanner never sees those classes, so the group-label sizing silently no-op'd. Fixed at the generator: prefix the heading classes at **generation** time so the strings are statically scannable.

**bottom-nav (keep + fix).** `lg` size used a raw `72px` height (a config `$exception`, not a `height/ch-*` token); `heightToClass` only handled token refs + `{scale.N}`, so it dropped the value and `lg` rendered heightless. Fixed `heightToClass` to emit an arbitrary value (`h-[72px]`) for raw CSS lengths — generic robustness, mirrors what `spacingToClass` already did, helps any raw-px size.

**top-bar / tabs / pagination — clean keeps.** top-bar: `variant default|elevated × size`, container only. tabs: Radix, `size` only, single underline variant (no color axis — deliberate, consistent with the color-axis-opt-in stance). pagination: `<a>`-link semantics (navigation, not buttons), full shadcn part-set.

**Both surfaces:** code catalog regenerated + playground synced (7 atoms added to picks; `@radix-ui/react-tabs` + `react-navigation-menu` installed). Figma: `build-pattern-sidebar.js` gained the rail column (default + rail side by side); scripts `27`/`28` reassembled. Smell gate (Senior Engineer, `code-core`+`code-react`): one flag (custom-prop naming), fixed at source.

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
