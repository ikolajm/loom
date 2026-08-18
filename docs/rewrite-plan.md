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
- [ ] **The rest of the element list** — surfaces, form-control states and validity,
      tables, links. This list is closeable; a component list is not
- [ ] **Print block** — `print-color-adjust: exact`, page-break behavior on surfaces and
      tables. Belongs in the layer, not re-derived per project
- [ ] **Flattened per-theme emit** — one stylesheet per theme with color roles resolved,
      for engines without custom-property support. Only color roles vary by theme;
      spacing, radius and transitions are theme-invariant

## The cuts

These are the ones that *do* depend on the layer — a component cannot shed its
appearance until there is a class to shed it to. Ordering them after the layer work is
deliberate, not backlog inertia.

- [ ] **Thin the components** — surviving atoms become a primitive import with layer
      classes; the appearance-only entries stop being components
- [ ] **Size axis** — a default plus one opt-in, not a universal three
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
