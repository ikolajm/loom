# Class-layer rewrite — plan

The decision and its costs are in
[`decisions/2026-08-18_class-layer-is-the-deliverable.md`](decisions/2026-08-18_class-layer-is-the-deliverable.md).
This page is only the sequence. It lives here rather than in the hub so a commit can
tick its own box; the plan and the work drifted while they sat in separate repos.

One branch per group. Tick the boxes in the same commit that satisfies them.

## Done

- [x] **Thesis** — README opening and diagram rewritten around the substrate
- [x] **One intent supplier** — `productType` cut; `styleDirection` is the only intent
      field, `controlHeight` is answered or defaults. The removed key is refused with a
      migration message rather than ignored, because ignoring it silently drops a phone
      product from the touch ladder
- [x] **Emit split** — `tokens.css` (values), `loom.css` (class layer), and
      `loom.tailwind.css` (`@theme inline` + `@utility`). Only the third is
      framework-bound, which makes the tokens tier's portability claim true
- [x] **Figma components cut** — `scripts/figma-components` and `scripts/figma-icons`
      deleted; primitives, semantics, styles and layout kept. Pulled ahead of the layer
      work because it depended on none of it: `npm run figma` is a separate entry point
      and nothing under `code-templates/` or `generate-configs/` referenced those
      directories. The step list went 32 → 17

## The layer

- [x] **Layer the classes** — `.text-*` and `.interactive` moved into `@layer components`
      so Tailwind utilities override them. Unlayered they beat every utility, which had
      voided ten authored overrides across nine components: `font-semibold` on dialog,
      alert-dialog, sheet and card titles, on menu and select labels, `leading-none` on
      the card title, `font-medium` on the toast action. All ten were deleted rather than
      activated — the ramp owns weight and leading, so a component that wants a different
      weight is asking for a different role. Six were no-ops against the ramp anyway; the
      four that differed keep rendering as they do today. `fab-menu` emitted the same
      duplication from config and now emits a weight utility only when no text role
      carries one
- [x] **Treatment × tone** — `.tone-{family}` / `.tone-{family}-soft` and `.treat-filled`
      / `-outline` / `-ghost` / `-dot` emitted into `loom.css`. Fifteen tones and four
      treatments, still orthogonal, and no longer Tailwind-only: the axis was already
      custom properties, just spelled as arbitrary-property utilities
      (`[--v-bg:var(--primary)]` consumed by `bg-[color:var(--tone-bg)]`), a syntax that
      exists only inside a Tailwind build.

      The vocabulary comes from the color roles rather than from the two atoms that had
      an axis. Those disagreed: button's fills read the base roles, badge's read the
      containers, and each named them separately — so `destructive` meant a solid error
      fill in one and a soft container fill in the other. Every family carries both, so
      that is one axis (intensity) and `-soft` is its container end. Button and badge now
      map their own prop names onto shared tones, derived from the token paths already in
      their schemas, so neither atom's public API changed. Coverage grew for free: button
      gains `info`, badge gains `secondary`. No vendor prefix — the first segment already
      names the dimension, and Loom's output is the only design layer in a consuming
      project, so there is no second stylesheet to collide with
- [x] **Form-control states and validity** — `.control` in `loom.css`: focus ring,
      ARIA-driven validity, disabled. Validity keys off `aria-invalid`, which has to be
      right for assistive tech anyway, so styling cannot drift from it; it re-points
      `--tone-border` and `--tone-text` rather than setting colors, so an invalid control
      keeps its treatment. 52 hardcoded utility strings across 18 generator files
      collapsed into one class — 37 focus rings, 15 disabled pairs
- [x] **Surfaces, table, link** — `.surface-1/2/3`, `.elevate-0..3`, `.table`, `.link`.
      Surface and elevation are separate axes because the catalog uses them separately:
      `bg-surface-1` pairs with shadow-1, -2 and -3 in different atoms, so a class
      bundling them would be wrong two times in three. The table is ruled, rows shade on
      hover, and its colors, rule and text weights come from its own schema rather than
      being hardcoded in the layer. `.link` reads `--tone-text` with a brand fallback, so
      it composes with tones the way treatments do.

      **Not yet adopted by the atoms.** The ~30 atoms still carry `bg-surface-1` and
      `shadow-[var(--shadow-2)]` utilities; only `table` was migrated, because it had
      real duplication to collapse (`[&_tr:hover]:bg-surface-1` and friends). Swapping the
      rest belongs to the thinning pass below, not here — the classes exist now so the
      portable consumer has them, since `shadow-[var(--shadow-2)]` is Tailwind-only syntax
- [x] **Print block** — two halves. `tokens.css` forces the light roles under
      `@media print` for both `:root` and `[data-theme="dark"]`, so a document prints as a
      document whatever the app is showing and whether or not the viewer has toggled;
      everything downstream reads the roles, so tones, treatments and surfaces need no
      print-aware branch. `loom.css` carries the structure: `print-color-adjust: exact`
      on the fills that *are* the information (`.treat-filled`, `.treat-dot` — a filled
      badge reading OVERDUE must not print as bare text), `break-inside: avoid` on
      surfaces and rows, shadows off, hover shading off, and
      `thead { display: table-header-group }` so a long table repeats its header instead
      of leaving every page after the first as unlabelled columns.

      The structure block sits **outside** `@layer components` on purpose: layered, a
      `shadow-lg` or `hover:bg-*` utility would outrank the print override and survive
      onto the page. Print is the one place the layer ordering has to invert
- ~~**Flattened per-theme emit**~~ — **cut, not done.** It had no consumer: no project
      here generates a document, and custom properties have been universal in browsers
      since 2017, so the population it served was wkhtmltopdf and nothing else. It existed
      to make a three-row table look complete. The reasoning and the do-not-re-propose
      condition are in the ADR appends

## The cuts

These are the ones that *do* depend on the layer — a component cannot shed its
appearance until there is a class to shed it to. Ordering them after the layer work is
deliberate, not backlog inertia.

- [~] **Component classes — first slice done: `card`, `badge`, `input`.** Shape only:
      padding, radius, gap, height and the type role, on `[data-size]` modifiers. Color
      composition stays out — a badge takes `.tone-error-soft .treat-filled`, an input
      takes `.control`. Folding a default tone into `.badge` would re-couple the axes
      just separated, and the shorter call site is not worth losing "adding a tone is one
      rule". The exception is a named vocabulary with no layer equivalent: `card`'s
      default/elevated/outline/flush are background + border + shadow combinations with
      no border class to compose from, so they became `[data-variant]` modifiers.

      **What the slice forced, and it was the point of slicing.** A class cannot apply
      another class, so a component class needing `body/md` would have restated font-size
      and line-height — two sources for type, the exact drift removed three branches ago.
      Type roles are now also emitted as custom properties (`--type-body-md-size` and
      friends); `.text-body-md` reads them and so does `.card[data-size="md"]`, so a
      card's padding tier and its type tier cannot disagree. The family comes from the
      component registry, the same source the atoms read.

- [x] **Component classes — fan-out.** 19 classes emitted from the registry. Not the loop
      it looked like: 19 of the 26 appearance-only entries were covered once the emitter
      learned seven more generic keys (`size`, `width`, `min-width`, `line-height`,
      `border-width`, `shadow`, `icon-size` — the last as a `--icon-size` property rather
      than a descendant rule, so the class does not assume what element holds the icon).

      **Seven are deliberately not emitted, and the file says so.** `form-field`,
      `separator` and `avatar-group` declare nothing — a class for them is an empty rule
      carrying a name, worse than a utility. `sidebar`, `stepper`, `empty-state` and
      `pagination` declare sub-part vocabularies (`item-height`, `indicator-size`,
      `heading-text`, `item-size`); naming a component's internals is a design decision
      per component, not a loop, so they wait. `table` is excluded for a third reason: its
      size keys describe cells, so they emit as `.table[data-size] :is(th, td)` alongside
      the other table rules — on the element element they would have padded the frame and
      left every cell untouched.

      Two repetition fixes fell out: declarations identical across all tiers are lifted to
      the base rule (`$constant` is expanded by the loader before the emitter sees it, so
      it had to be re-detected), and the four card variants no longer each restate their
      shared color.

- [x] **Split the layer into legible files.** `loom.css` is what you compose with — type
      roles, tones, treatments, control states, surfaces, elevation, links, keyframes,
      print. `loom.components.css` is what those compose into, and is the larger,
      churn-prone half. A project that owns its own components takes the first and skips
      the second, which makes the tokens tier a file boundary rather than a paragraph.
      Four stylesheets now: 486 / 477 / 773 / 272 lines
- [ ] **Thin the components** — surviving atoms become a primitive import with layer
      classes; the appearance-only entries stop being components
- [x] **Size axis** — **not cut; the ADR's reasoning did not survive wider evidence.**
      The decision rested on four `size="sm"` uses across two dashboards. Across all
      seven consumers, paperboy and party-wipe use `sm`/`md`/`lg`/`xl` heavily — on
      components hand-built on Loom's tokens, since neither holds a Loom atom. Given a
      blank page and this substrate, the full ladder is the shape reached for. The
      emitted-CSS argument also dissolved once component classes were settled on
      `[data-size]` modifiers, which cost one selector per tier rather than 3x the classes.

      Retargeting it at shared spacing ladders failed too: `x-padding`, `y-padding` and
      `gap` each have 8-9 distinct ladders and components mix across them freely, so a
      family reference produced a 46% override rate — indirection that makes the config
      harder to read, not easier.

      What shipped instead is the narrow, measured win: **38 declarations that repeated
      the same value in every tier** are hoisted to `sizes.$constant`, expanded back at
      load so no generator changed. `radius` alone was declared identically three times
      in 25 of the 26 components that set it. Tier blocks now hold only what ramps, and
      the one component that genuinely ramps its radius is visible instead of buried.
      Verified by byte-identical catalog output
- [ ] **`node scripts/sync.js`** — fold `setup.sh` and `scripts/refresh-test.sh` into the
      Node pipeline they already shell out to. All the logic is in `resolve-picks.js` and
      the orchestrator; the shell is glue

## The surface

- [ ] **One preview canvas** — ramps above roles, then type, spacing, radius, and a strip
      proving treatment × tone, surface elevation, control states and small-size type.
      Replaces the split between the scaffolded `/preview` page and the playground gallery
- [ ] **Consumer refresh loop** — `/preview` in a project renders whatever substrate was
      last copied in; refreshing means returning here and re-running the sync. If the
      preview surface is the point, that round trip is the friction to remove

## Consumers

- [ ] **Wire the three synced projects** — jmi-finance, jmi-fitness and my-loom-app hold a
      pre-split `globals.css` importing `tokens.css` alone. Two `@import` lines each. No
      guard was left in `setup.sh` for this: the failure is an unstyled page on first
      load, which is loud enough for a population of three
- [ ] **Hand-port jmi-finance and jmi-fitness** off their pre-layer atoms. Nothing
      auto-syncs by design, so this is manual — and it is the real test of whether the
      layer covers what those apps actually needed
