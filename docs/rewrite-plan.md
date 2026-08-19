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

- [x] **Component classes — first slice: `card`, `badge`, `input`.** Shape only:
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
- [x] **Thin the components.** Catalog 62 -> 44. Eighteen appearance-only atoms deleted;
      `button` and `badge` kept as thin wrappers.

      **The classification was wrong and inspection caught it.** `carousel`, `dialog` and
      `sheet` all import `Button` — deleting it would have broken three surviving
      behavior components. `button` was on the appearance list because it was sorted by
      dependency (`@radix-ui/react-slot` looked trivial) rather than by what it does:
      `Slot`/`Slottable` is `asChild` composition, which no class can express. Same for
      `badge`. Both now map props onto classes and pass `data-size` — button went 101
      lines to 82, and its size and icon ladders left the JS entirely.

      Two ladders that existed twice are now once: `--icon-size` is set by every size tier
      and read by a single `.icon-slot` rule, replacing the per-atom `buttonIconSize` /
      `badgeIconSize` lookup tables.

      **`resolve-picks.js` names the replacement.** A stale pick used to fuzzy-match —
      "table — did you mean tabs?" sends someone hunting a component that was never the
      answer. It now says `.table in loom.components.css` and prints the markup shape.
      jmi-finance and jmi-fitness each have three stale picks; my-loom-app has 22. Their
      installed copies keep working until deleted, which is the shadcn model behaving as
      designed rather than a breakage
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
- [x] **`sidebar`, `stepper` and `pagination` internals.** All three emit now; the catalog
      is at 25 classes. Less naming than expected — the parts were already named in the
      schemas (`rail`, `item`, `indicator`, `connector`, `label`), so the generic
      `<part>-<prop>` mechanism covered them once three defects were fixed.

      **`item-x-padding` was being dropped silently.** `splitParts` split on the last
      hyphen, making the part `item-x` and the prop `padding` — not a known prop, so the
      key vanished. Props contain hyphens; it now matches the longest known prop suffix.

      **Primitive tokens resolved to nothing.** `indicator-size: "height/ch-1"` emitted
      `var(--height-ch-1)`, which does not exist — the primitive is `--ch-1`. The emitter
      assumed every value was a semantic role; it now skips the namespace when the tail
      already carries a primitive scale name.

      **`rail-width` was not a part at all.** `rail` is a sidebar *variant*, so
      `.sidebar-rail` would have styled an element that does not exist. Renamed to
      `width-rail`, and the emitter now reads `<prop>-<variant>` as the mirror of
      `<part>-<prop>` — same property, one variant — emitting
      `.sidebar[data-size][data-variant="rail"]`. The distinction is not inferable from
      shape: `rail-width` and `item-height` look identical and mean opposite things, which
      is exactly how it nearly shipped wrong.

      `SUB_PART_KEYS` is now empty. It stays as the place to park a key the emitter
      genuinely cannot express, rather than half-emitting a component and saying nothing.

- [x] **`node scripts/sync.js`** — `setup.sh` (115 lines) and `scripts/refresh-test.sh`
      (30) deleted; `npm run sync -- <project>` replaces both, with `--force` and
      `--refresh`. The two helpers it called are now imported rather than shelled:
      `resolve-picks.js` and `check-local-edits.js` export functions and keep their CLI,
      and a resolution failure throws a `PickError` carrying its own report instead of
      exiting the process, so an in-process caller can render it.

      Verified by running both scripts against identical fixtures and diffing: **the
      installed file trees are byte-identical**, and the output differs by one banner line.
      Skip-on-local-edit, `--force` and `--refresh` each exercised.

      It also surfaced a live failure: the **playground's own `loom-picks.json` still
      listed all 18 dropped atoms**, so its resync had been erroring since the drop branch.
      `playground-parity` passed throughout because the files were already in place and
      matched. I had been piping those runs to `/dev/null`, which is why it went unseen —
      the same reason the class regression survived

## The surface

- [x] **One preview canvas.** Generated token half (ramps, roles, type, spacing, radius —
      read from the configs, so the page cannot list a token set the build does not have)
      plus a hand-written class strip showing tone × treatment, surface × elevation,
      control states, sizes and the table. The strip is the class layer's only
      documentation, and it is markup you can copy into a template, not React-only prose.

      It is **not** a merge of the foundation page and the gallery — that item was written
      when the catalog was 62 appearance-heavy components and both showed appearance. The
      gallery now renders 40 behavior components, a different job. What was missing was a
      surface for the classes: before this branch, nothing anywhere rendered a single one.

      The page is self-contained (local `data-theme`, no ThemeProvider), so the same
      generated file mounts in the playground and in a scaffolded consumer.

      **Two bugs only looking at it could have found.**

      *Tailwind never scanned the page.* Its automatic source detection skips anything
      `.gitignore` covers, and the generated route is git-ignored — so the page rendered
      with none of its utilities and nothing failed. Fixed with an explicit `@source`
      rather than by tracking generated output.

      *Seventeen component classes had silently stopped being emitted.* The emitter
      enumerated from the component registry, and dropping the eighteen appearance-only
      atoms emptied it — so `.card`, `.input`, `.kbd` and fourteen more vanished with the
      atoms they were supposed to replace. Four classes shipped where nineteen should
      have. It now enumerates from the schemas, which survive the component: `card` has no
      `.tsx` any more and must still emit `.card`.

      A `class-coverage` check now guards it: every appearance-only component must either
      emit a class or appear on a stated skip list, and every planned class must actually
      be present in the output. Confirmed against both failure shapes — a component
      dropping out of the emitter, and one planned but not written
- [x] **Consumer refresh loop.** `init.sh` now writes a `loom:sync` script into the
      project's `package.json`, so a consumer refreshes with `npm run loom:sync` from its
      own directory instead of coming back here. It is written by `init.sh` rather than by
      hand because that is the only thing that knows the path between the two repos — it
      was invoked with it, and computes the relative form (`../loom/scripts/sync.js` in the
      sibling layout).

      **Deliberately not wired into `predev`.** The playground does that, but a consumer's
      dev server that cannot start without a sibling repo present is a worse failure than
      a stale stylesheet — and it is discovered by whoever clones the project next rather
      than by the person who set it up.

      **`--refresh` is not the default**, and the reasoning narrowed on inspection: a plain
      sync already regenerates the whole substrate, so tuning a brand is always current.
      `--refresh` only rebuilds `catalog/*.tsx`, which only matters when Loom's own
      templates changed — a flow that has already run `npm run generate`. Defaulting it
      would also end every consumer sync in `verify`, so refreshing a brand in jmi-finance
      could fail on a playground story it has never heard of.

      Instead the catalog carries a fingerprint of its inputs (`$inputs` in `atoms.json`,
      hashed over the component schemas and code templates) and the sync reports a
      mismatch in one line. Hashed rather than compared by mtime, which a `git checkout`
      rewrites — a warning that fires on every fresh clone is one people learn to ignore.
      Confirmed both ways: a schema edit warns, a brand change does not.

      Running the whole thing end to end also caught a live scaffold bug: `STARTER_PICKS`
      still listed `card`, so **every newly scaffolded project failed its first sync** on
      an unknown atom. Nothing caught it — the catalog checks verify what the catalog
      contains, and that list is a string inside a generator

## Not yet seen run

Everything below was verified statically — emitted, parsed, cross-checked against the
generated CSS. None of it has been watched working. Given that today's regressions were
found by running rather than reading (a dead `data-size`, seventeen vanished classes, a
failing playground sync, a starter pick naming a deleted atom), these are the last places
the same failure can hide.

- [x] **Paste the Figma scripts once.** All 17 run. Step 14 was indeed the one to watch,
      though not for the reason predicted — the `_shared.js` move was fine, and it died on
      `The font "Space Mono SemiBold" could not be loaded`.

      **A family being available says nothing about the weight you want.** `ensureFontIndex`
      kept only `f.fontName.family` from `listAvailableFontsAsync()` and discarded the
      style, so `fontStyle()` had to guess a style name and let `loadFontAsync` throw when
      the guess was wrong. `FONT_WEIGHT_OVERRIDES` was the workaround and it is a list of
      the four families someone had already crashed on — its own comment said to add a
      family after `loadFontAsync` "tells you about it by throwing". Space Mono ships
      Regular and Bold only against a ramp asking 400/500/600/700, so 600 threw and 500
      was next behind it. `reportFontParity` had reported `✓ Space Mono` three lines
      earlier, because it checked the family and not the weights.

      **The fix is parity, not a new policy.** Google Fonts answers
      `Space+Mono:wght@400;500;600;700` with a 200 and silently serves 400 and 700 only,
      so CSS font matching already resolves 600 → Bold and 500 → Regular on the page.
      Figma was the only side that refused to build rather than falling back. `fontStyle()`
      now snaps to the nearest weight the family ships — ties heavier, italics excluded —
      and the override table stays, checked first, as the way to pin a choice deliberately
      unlike the browser's. `reportFontParity` now reports the ramp's weights.

      Verified in node against representative style sets rather than in the app: Space Mono
      400/500/600/700 → Regular/Regular/Bold/Bold, Inter 600 → Semi Bold, Playfair 600 →
      SemiBold. Nothing had to be cleaned up in the Figma file — the font-load loop runs
      before the first `createTextStyle()`, so it threw having created nothing.

      Consequence of the brand rather than of the bug: with Space Mono on both heading and
      body, the four-weight ramp collapses to two. `display` and `title` both land on Bold
      and differ only in size; `body`, `input`, `action` and `label` all land on Regular.
      True on the page as well as in Figma
- [x] **Open the preview canvas in a browser.** Done, and it paid for itself twice over —
      the findings below are both things no amount of reading the CSS would have shown.
      What held up: focus rings consume `--focus-ring-*` and render correctly, disabled
      dims and blocks the cursor, the surface ladder is monotonic in both themes, tone ×
      treatment composes, the ruled table is right. Elevation renders as nothing, which is
      correct — `shadowDepth` is `flat` in this brand — but it does mean the canvas cannot
      demonstrate `.elevate-*` at all until a brand with depth is loaded

## The box model

The class layer had never rendered a button with an icon or a text field. Both were signed
off as verified statically; both were wrong the moment a page was looked at. One root cause.

- [x] **Give the classes a box.** The emitter read the sizing schema and nothing else, so
      each component's ladder survived the move to a class and the cva base string it
      ramped did not. `.button` emitted `gap` while computing `display: block`. `.input`
      emitted padding, height and radius with no border, background or text colour —
      Tailwind's preflight zeroes both on form controls — so a text field rendered as bare
      text on the page. `.icon-slot` set `width` and `height` on an inline span, which
      ignores both, so a 16px icon rendered at 55px and overflowed every button and badge
      carrying one. `.dot` lost its pill, `.skeleton` its width and its pulse,
      `helper-text` and `label` their text colour.

      `BASE_RULES` is the fix and the record: every line is recovered from the atom the
      class replaced, read out of `0e4547a^`, rather than redesigned. Faithful restore was
      the deliberate choice over a better-looking one — it cannot break something that
      rendered correctly before, and a judgement call here could not be checked in a
      browser. Two are worth a second look because they were odd in the atom and are odd
      now: `.input` and `.textarea` carry `justify-content: center`, inert on a real form
      control but wrong if someone hand-marks-up a `div.input`, and both carry
      `width: 100%`, which is what the atom did and which makes a bare row of them stack

- [x] **Make an invalid control look invalid.** `.control[aria-invalid="true"]` re-pointed
      `--tone-border` and `--tone-text` to the error role and nothing read them: only
      `.treat-outline` consumes those, and a text field carries no treatment. An invalid
      input was pixel-identical to a valid one. `.input`'s border now reads
      `var(--tone-border, var(--outline))`, so the re-point lands without the rule knowing
      anything about validity. `--tone-text` is deliberately still unread on an input — the
      atom reddened the border only, and red body text in a field is not the convention

- [x] **`class-box-model`.** `class-coverage` asks whether a class exists. Every class did
      exist, and seventeen still rendered wrong. The new check asks whether it declares a
      box, stated as the failure rather than as a list of names: any class setting `width`,
      `height` or `gap` anywhere in its ladder must declare a `display` somewhere in that
      same ladder, or name itself in `NO_BOX` with a reason. It also pins every recovered
      `BASE_RULES` line to the output.

      **The first version of it passed while the bug was still there.** It enumerated the
      emitter's plan, and the two worst instances — `.icon-slot` and the `<name>-icon`
      sub-parts — are written by the emitter directly and appear in no plan. Rewritten
      against the emitted CSS. Confirmed against five failure shapes: the emitter dropping
      `BASE_RULES`, a key that stops matching a class name, a sized class with no display
      and no reason, `.icon-slot` losing its display, and the sub-parts losing theirs

- [x] **Look at the fixed page.** Walked the playground and the canvas. Icons, badges,
      control chrome, the invalid state and the re-boxed control row all read correctly.
      One defect left: the `asChild (anchor)` button rendered jarringly large.

- [x] **`asChild` applied no classes at all.** Not a sizing bug — Radix `Slot` locates the
      consumer's element through `Slottable` using `React.Children.toArray`, which flattens
      arrays but **not** fragments. Wrapped in a `<>`, `Slot` saw one unrecognised child,
      cloned the fragment itself and set `className` on it; React warns and drops it. So
      the `<a>` rendered with no `display`, no size, and a raw 24-viewBox svg at intrinsic
      size. Both templates pass an array now.

      `badge` had the same bug and worse — it imported `Slot` without `Slottable` at all,
      so `badge asChild` had never applied classes either. No story exercises it, which is
      why it went unseen. This one predates the class layer: `0e4547a^` has the identical
      fragment.

      **Left alone deliberately: `asChild` + `iconOnly` together.** That mode wraps children
      in `span.icon-slot`, which becomes Slot's only child, so the classes land on the span
      and the consumer's element nests inside it. No story hits it, and the fix is not
      mechanical — the span exists to read `--icon-size`, so removing it means deciding how
      an icon is sized without one. A design call on component internals, parked visibly
      rather than guessed at

- [x] **Re-look at the anchor button.** Renders correctly.

## The catalog cut

- [x] **`catalog/` is a worked example, not a component library.** 44 components to 5:
      `button` and `badge` for tone × treatment × `data-size` and `asChild`, `form-field`
      for the validity cascade into `.control`, `dialog` for a Radix portal, `select` for a
      Radix form control, plus `cn`. 39 atoms and 33 generator modules deleted.

      **Decided on the measurement, not on taste.** Across every project consuming Loom the
      atoms actually installed were `badge`, `table`, `empty-state`, `top-bar` and `cn`. Not
      one consumer imported a composite, and paperboy and party-wipe — the two heaviest
      token consumers, ~100 files each — hold no atoms at all. Radix is already the
      primitive layer; what Loom uniquely owns is tokens to classes.

      Two numbers pointed opposite ways and both were weighed. Churn said the catalog was
      cheap: over the whole class-layer rewrite `catalog/` was 11% of changed lines and the
      42 per-atom generators were 2.6% of `scripts/` churn. Size said it was a lot of
      standing surface: ~11,000 lines across generators, catalog, stories, manifests and
      playground copies. The cost is latent rather than historical — paid whenever the
      layer moves and the atoms have to follow, which is what this week was.

      Three lines were priced and each closed over the import graph first, because the last
      cut deleted `button` while `carousel`, `dialog` and `sheet` imported it. Closure
      mattered: "drop the thin Radix wrappers" pulls `avatar`, `calendar` and `popover`
      straight back in, so it is a line with three immediate exceptions rather than a
      principle.

      **What the cut removed downstream.** The playground's install went from 29 npm
      packages to 7. `stories.tsx` went 952 lines to 134. The gallery shell no longer
      imports an atom for its own chrome — it hand-marks-up `.sidebar` / `.sidebar-item`,
      which is how a consumer would build it.

      **The atom/pattern vocabulary collapsed and the docs say so rather than restating a
      number.** `kind` now reads 5 atoms, 0 patterns. It existed to make "does this earn its
      place?" answerable across 44 components; a set of five does not need triage
      vocabulary. Left in place, flagged in `CATALOG_SPEC.md` — if patterns stays at zero,
      delete the kind rather than keep a word that classifies one thing.

      Recoverable: git has every deleted atom, and `resolve-picks.js` already names the
      class replacement for a stale pick by design.

- [x] **Give the sub-part classes a box too.** Found by the cut, not by a check.
      Hand-marking-up `.sidebar-item` in the rebuilt gallery shell exposed that it sets
      `gap` with no `display` — and `class-box-model` passed it, because the check keyed on
      the first class in a selector, so `.sidebar[data-size="sm"] .sidebar-item` was
      credited to `.sidebar`. Eleven classes were behind that hole. The atoms hid it for a
      related reason: every sub-part sat inside a flex parent, which blockifies children,
      so height applied and gap silently did not.

      Five of the eleven turned out not to be parts at all. `line-height` ends in `height`,
      `min-width` and `border-width` end in `width`, so the splitter read them as parts
      `line`, `min` and `border` and emitted `.helper-text-line`, `.label-line`, `.kbd-min`,
      `.textarea-min` and `.spinner-border` — classes for elements that do not exist.
      Nothing rendered wrong, because the real declaration also lands on the element, which
      is why nothing could have caught it. `SELF_PROPS` now guards it.

      The other four are real parts and got their display recovered from the atom that
      rendered them, at the commit before the cut: `sidebar-item`, `pagination-item`,
      `stepper-indicator`, `stepper-connector`.

      Both checks were fixed rather than just satisfied. `class-box-model` now keys on the
      last class in the selector — the element the rule actually styles — and `phantom-parts`
      is new, because `class-box-model` catches a phantom but tells you to give it a display,
      which would entrench the class rather than delete it. Confirmed against both shapes.

      **That is twice this check passed while the bug it was written for was in the tree.**
      First it enumerated the emitter's plan and missed everything the emitter writes
      directly; then it read the wrong end of a descendant selector. Both times it was found
      by using the output, not by running the check

- [ ] **Look at the trimmed gallery.** Five stories and a rebuilt shell, verified only by
      typecheck and the checks — not watched. The shell's nav items are the first thing in
      the repo to use `.sidebar-item` as a consumer would

## Consumers

- [x] **Wire the synced projects** — jmi-finance and jmi-fitness now carry the four
      stylesheets, corrected imports and pruned picks, and both build. (my-loom-app was a
      create-next-app scratch project from June and was deleted rather than wired.) The
      change is in their working trees; it is theirs to commit
- [ ] **Hand-port jmi-finance and jmi-fitness** off their pre-layer atoms — `table.tsx`,
      `empty-state.tsx`, `top-bar.tsx`, four call-site files each. `badge.tsx` is current
      and stays. Nothing auto-syncs by design, so this is manual — and it is the real test
      of whether the layer covers what those apps actually needed. It also clears a live
      regression: those stale copies use `.interactive` without `.control`, so a disabled
      control in them renders at full opacity with a normal cursor
- [ ] **Scaffold into a handful of ported projects** — the broader test of the substrate
      against apps that did not grow up with it
