# The derivation chain

Where a value you typed ends up, and what decided it on the way.

`README.md` says what goes in and what comes out. [`spec/questionnaire.md`](../spec/questionnaire.md)
documents every answer key. This traces the middle: the three pipelines that turn
one answers file into stylesheets, a React catalog and a Figma paste set, and the
handful of places where a value is transformed rather than copied.

Read this to extend the generator or to debug an output that doesn't match what you
answered. Consuming Loom in a project needs none of it — the README Quickstart is
the whole surface.

---

## The three commands, and what each reads

| Command | Entry point | Reads | Writes |
|---|---|---|---|
| `npm run configs` | `scripts/generate-configs/index.js` | `spec/answers.json`, `spec/direction-mappings.json`, `spec/config/standards.json` | `spec/config/local/base/*.json` (git-ignored) |
| `npm run generate` | `scripts/code-templates/orchestrator.js` | the resolved config set | `generated/` — stylesheets, `tokens.json`, `components/`, `scaffold/`, `HANDOFF.md` — plus `catalog/` |
| `npm run figma` | `scripts/assemble-figma.js` | the resolved config set | `generated/figma-scripts/` — 17 paste scripts |

They are strictly ordered. `configs` writes the config set that the other two read;
running `generate` before it uses whatever config set is currently resolved, which on
a fresh clone is Loom's own committed look.

## Two roots, one resolution rule

Every generator reads through `scripts/config-paths.js`, never off a literal path:

```
spec/config/local/<rel>     ← your brand, written by `npm run configs`. GIT-IGNORED.
spec/config/<rel>           ← Loom's own look, committed. The fallback.
```

`resolve(rel)` returns the local path when that file exists and the committed one
otherwise, **per file**. A local set containing only `base/colors.json` takes your
colors and Loom's spacing, sizing, typography and effects. That is the mechanism
behind the stale-local-set gotcha — a `local/` directory left over from an older
generator version silently outranks a freshly regenerated committed set, one file at
a time. `sourceOf(rel)` reports which root won, which is why run logs name it.

Deleting `spec/config/local/` reverts you to Loom's default look with no other step.

Two files are never generated and have no local counterpart in practice:

- **`spec/config/standards.json`** — values locked across all projects: the spacing
  scale primitives, the radius/border-width/icon-size/component-height primitives,
  the color *role templates*, opacity, transitions, easing, focus ring. Generators
  read it for structure and fill it with your values. It is the reason
  `generate-spacing.js` is 25 lines: the scale already exists, and density only
  picks which scale steps each category points at.
- **`spec/config/components/*.json`** — the eight component schemas. Hand-authored,
  not derived from answers.

## Stage 1 — `answers.json` → config set

### Tier 1 resolves to Tier 2 before any generator runs

`scripts/generate-configs/resolve-intent.js`. Five keys are intent-derivable:

```
edges  density  shadowDepth  typeScale  controlHeight
```

Each resolves through three layers, most specific winning:

```
hand-written answer  >  styleDirection  >  DEFAULTS
```

`DEFAULTS` is `sharp / comfortable / elevated / standard / standard`. The middle
layer reads `spec/direction-mappings.json` → `style-direction` → your named
direction. `controlHeight` sits in the set but no direction supplies it — the
style-direction block carries no `control-height` key — so it comes from your
answers file or the default, and nothing infers a touch target for you.

The run log prints each resolved key with the layer that supplied it, because an
intent-derived value and a hand-written one are structurally identical in the output.

`resolveIntent()` returns `{answers, sources}` and **must** run before a generator
sees the answers. Two callers do this: the `configs` entry point, and
`base-config-provenance` in `verify.js`, which regenerates the committed set in
memory from `answers.example.json`. Those two paths must resolve identically or the
check fails on a leak that isn't there.

`productType` is refused with an error rather than ignored. It used to supply
`controlHeight`, so silently dropping it moved a touch product down to a 40px tap
target with no message anywhere.

### Five generators, five files

Each takes `(answers, standards, mappings)` and returns an object written as one
JSON file. Four of them are lookups; one computes.

| Generator | Answer keys consumed | Mapping block | Emits |
|---|---|---|---|
| `generate-colors.js` | `primary`, `secondary?`, `accent?`, `defaultMode` | — (reads `standards.colors.modes`) | `colors.json` |
| `generate-spacing.js` | `density` | `density` | `spacing.json` |
| `generate-sizing.js` | `edges`, `controlHeight` | `edges`, `control-height` | `sizing.json` |
| `generate-typography.js` | `typeScale`, `heading`, `body` | `type-scale` | `typography.json` |
| `generate-effects.js` | `shadowDepth` | `shadow-depth` | `effects.json` |

Every one writes a `$note` recording what produced it. Downstream, `$`-prefixed keys
are metadata and are stripped before reaching Figma (`omitNotes()` in
`assemble-figma.js`).

The three lookup generators are thin on purpose. `density` selects a
`spacing-categories` block; `edges` selects `semantic-radius`; `controlHeight`
selects `semantic-height`; `shadowDepth` selects a shadow set. The primitives they
point at live in `standards.json` and are not duplicated. `generate-typography.js`
merges two halves: the scale-specific families (`display`, `title`) from your chosen
scale, and the universal families (`body`, `action`, `label`, `input`) from
`$shared`.

`generate-effects.js` does one transform worth knowing: it parses each CSS shadow
shorthand into `{offset-x, offset-y, blur, spread, alpha}` as `shadow-properties`,
because Figma binds effect variables per property and cannot take a shorthand string.
Under `flat` every shadow is `none`, so `shadow-properties` comes out empty.

### The one real computation: color

`generate-colors.js` is where a single hex becomes the whole system.

**Palettes.** `primary` generates a ramp. `secondary` and `accent` are yours if you
gave them and otherwise derived as analogous rotations — `+30°` and `+60°`, small and
on the same side of the wheel. `neutral` is tinted from the primary's hue, so the
greys belong to the brand. The four status families are generated from fixed hues
(`error 0`, `success 145`, `warning 40`, `info 210`) and do not move with your brand.

A derived family produces a ramp and role set structurally identical to a chosen one.
Nothing downstream can tell them apart, which is why two records exist: the prose
`$note`, and `$derived: {secondary: bool, accent: bool}` — the machine-readable half,
read by the Figma pipeline so every invented hue gets a description on its variable.
The Figma ramp is where an invented hue looks most like a decision someone made.

**Roles, in two passes.** `standards.colors.modes` holds role templates.
`{palette.family.shade}` resolves directly to hex. `{fill.family.shade}` cannot — a
fill has to read the label it will carry — so pass one reserves the key as `null` and
pass two fills it. (Reserving rather than appending keeps emitted JSON key order
stable; creating the key in pass two turned a handful of changed values into a
70-line diff.)

**The fill resolver.** Pass two walks outward from the intent shade to the *nearest*
shade whose contrast against the already-resolved `on-<role>` label clears AA (4.5).
Nearest rather than a fixed direction, because standard ramps darken as the number
rises while the neutral ramp lightens — a hardcoded direction is wrong for one of
them. If nothing clears AA the intent shade is kept and the `contrast` check in
`verify.js` fails the build.

The discarded alternative was letting the label chase the fill per role. It optimizes
each pair and produces a patchwork — a row of filled buttons with one odd label out
reads as a bug, not a system. Label polarity is now fixed per mode by declaration:
white in light, the family's dark tone in dark. The fill moves to meet it.

**`$fillShades`** records which shade each fill role actually landed on, per mode.
This exists for Figma. The Figma steps alias semantic colors to primitive variables
*by name*, so they need the resolved shade — handing them the intent shade would alias
`primary/600` in Figma while code shipped `primary/700`, which is precisely the
design↔code divergence the whole model exists to prevent.

`default-mode` also lands here rather than in `standards.json`, because it is a
per-project answer and `standards.json` declares itself locked across projects.

---

## Stage 2 — config set → code

`scripts/code-templates/orchestrator.js`. Loads all configs once via
`loadAllConfigs()` in `shared.js`, builds the component registry, then runs each
generator in order. `--list` names them, `--only <target>` runs one, `--output <dir>`
redirects.

| Target | Emits |
|---|---|
| `tokens` | `tokens.css`, `loom.css`, `loom.components.css`, `loom.tailwind.css` |
| `tokens-json` | `tokens.json` — same values as neutral data, no `var()` |
| `doc-layout` | `doc-layout.css` from `presentation/layout.json` |
| `icons` | `components/icons.ts` |
| `components` | `components/*.tsx` + `cn.ts` |
| `preview` | `app/preview/page.tsx` |
| `scaffold` | `init.sh`, `globals.css`, `ThemeProvider`, `layout` |
| `handoff` | `HANDOFF.md` |
| `verify` | nothing — runs the invariant checks and fails the run |

`loadAllConfigs()` reads six token/standards files plus the eight component schemas.
On the way in it applies **`$constant` expansion**: a component's `sizes.$constant`
block is merged into every size tier, with a value declared on a tier winning. This
happens at load so every generator downstream sees fully-populated tiers. The point
is legibility in the schema — `radius` was declared three identical times in 25 of 26
components, and hoisting it means the tier blocks hold only what actually ramps.

`answers.json` is copied into the output as a receipt, but **only on a full run**. A
partial run is how a private brand file reaches somewhere it shouldn't:
`--only tokens --output <consumer>/src` is a real invocation — `sync.js` and the
playground's prebuild hook both use it — and it was dropping an answers file into
consumer source trees with nothing ignoring it.

### `verify` is the gate, and it runs last

The checks, in order: `doc-counts`, `playground-parity`, `manifest-deps`,
`interactive-implies-control`, `class-coverage`, `class-box-model`, `phantom-parts`,
`variant-keys`, `base-config-provenance`, `touch-target`, `contrast`,
`composited-contrast`, `story-coverage`, `typecheck`. Any failure exits non-zero, so
a full `npm run generate` cannot report success over broken output.

Three of them delegate to `catalog-playground/`, which is why that app is the compile
gate rather than a gallery: `typecheck` is its `tsc --noEmit` under `strict` +
`noUnusedLocals` and is the only thing that reads emitted `.tsx` **as code** rather
than as text; `playground-parity` confirms its synced copies match what the generator
just emitted; `story-coverage` confirms every atom is rendered somewhere, so none can
change unverifiably. Generated TSX with a syntax error passed every regex-level check
twice before this gate existed.

`base-config-provenance` is the one that guards the committed set. It regenerates
`spec/config/base/` in memory from `answers.example.json` and fails if the tracked
files no longer match — which is what makes hand-editing the committed set an error
rather than a silent divergence. It reads the committed root through `COMMITTED_ROOT`
directly, never through `resolve()`; a provenance check that reads whatever is local
checks nothing.

### Writing the committed set

`npm run configs -- --default-set` is the only path that writes tracked
`spec/config/base/`, and it is a maintainer action. It pins its input to
`spec/answers.example.json` and *ignores* `--input` and `--primary` rather than
honoring them, announcing what it dropped. Without that pin, the npm script's baked-in
`--input spec/answers.json` would write whatever brand you were testing into the
committed set — the mechanism that put a local dashboard's orange on master for a day.

---

## Stage 3 — config set → Figma

`scripts/assemble-figma.js` emits `00_shared-utils.js` (helpers, defined globally,
pasted first) plus the numbered step scripts, each a self-contained async IIFE carrying its
own `CONFIG` object inlined as JSON.

Assembly is mechanical: read the template, slice everything before its
`// --- Pipeline ---` marker (that prefix is the `_shared.js` helper copy, already in
`00`), prepend the config line. Three template directories, three tiers:

```
01–08  figma-primitives/   color · spacing · radius · border-width
                           component-height · icon-size · typography · effects
09–13  figma-semantics/    opacity · color · spacing · radius · component-height
14–15  figma-styles/       text-styles · effect-styles
16     figma-layout/       page layout
```

Order is a dependency chain: primitives create the variables that semantics alias, so
a semantics paste before its primitive has nothing to point at. Opacity leads the
semantics because it is the only one that aliases nothing.

Step `09` is where `$fillShades` is consumed. Each `{fill.*}` template in
`standards.colors.modes` is substituted with `{palette.<landed shade>}` before the
config is inlined. The Figma step aliases by name and cannot resolve `{fill.*}`
itself — and must not guess the intent shade, because the resolver moves it whenever
AA demands. A missing `$fillShades` entry throws in Node rather than emitting the raw
template: that failure shipped once, a stale `spec/config/local/` predating the fill
resolver outranking a fresh committed set, and the unresolved template reached the
Figma console before anything complained. Failing in Node names the cause and the fix;
failing in the plugin console names neither.

Figma receives the token half only. No components: it has no notion of a class, so the
class layer has no representation there, and a Figma component was only ever a snapshot
of one combination rather than the rule that generates it.

---

## The consumer path

`npm run sync <project-dir> [--force] [--refresh]` — `scripts/sync.js`.

1. `--refresh` regenerates the catalog first.
2. `resolve-picks.js` reads the project's `loom-picks.json` and walks each picked
   atom's manifest `dependencies` transitively. Unknown ids are a hard error **before
   any copy**, so a typo leaves the project untouched instead of half-synced. An id in
   `MOVED_TO_CLASS` gets told which class replaced it rather than a fuzzy did-you-mean.
3. The resolved atoms copy in, plus `cn.ts` unconditionally, plus the four
   stylesheets.
4. An atom the consumer has edited locally is **skipped and named in the summary**,
   never overwritten without `--force`. Skipping rather than prompting is deliberate:
   this runs unattended in CI and in the playground resync inside `npm run generate`,
   where a `[y/N]` prompt hangs a build instead of protecting anything.

`--npm` on `resolve-picks.js` prints the union of required npm specifiers. It reports;
`sync.js` never installs.

---

## Debugging by symptom

| Symptom | Look at |
|---|---|
| A value you answered didn't take | The `configs` run log — it names the source layer per Tier 2 key |
| Output doesn't match a config you edited | `sourceOf()` / a stale `spec/config/local/`; resolution is per file |
| A fill color isn't the shade you named | The AA fill resolver moved it; `$fillShades` says where it landed |
| Figma colors differ from code colors | `$fillShades` missing or stale — regenerate configs |
| A font renders as Inter in Figma | Off the parity-safe shortlist; step `14` reports per family |
| `npm run generate` fails at the end | `verify` — the check name and its failures print inline |
| Committed configs suddenly fail the build | `base-config-provenance`; repair with `--default-set` |
| A consumer's atom didn't update | It has local edits and was skipped; the summary names it |

## Cross-references

- [`../spec/questionnaire.md`](../spec/questionnaire.md) — every answer key
- [`../CATALOG_SPEC.md`](../CATALOG_SPEC.md) — manifests, the picker, the override mechanism
- [`gotchas.md`](gotchas.md) — the traps, including config resolution and Figma Plugin API
- [`decisions/`](decisions/) — why the class layer is the deliverable
