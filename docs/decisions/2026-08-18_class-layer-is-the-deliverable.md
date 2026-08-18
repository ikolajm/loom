# ADR — Loom's deliverable is a portable class layer, not a React catalog

**Status:** accepted

## Context

Loom shipped two synchronized outputs: a React catalog of 62 generated
components and a Figma file built by hand-authored per-component scripts. The
catalog's stated job was "see what's available."

The repo measured 46,563 tracked lines. `scripts/figma-components` was 7,361
across 71 files — a second implementation of every component's visual contract,
written against the Figma Plugin API, with no test loop and verified only by
pasting 31 scripts into a plugin console in order. `scripts/code-templates` was
9,188, the generated catalog 6,744, `spec/` 3,390. The playground's own code was
1,347; the rest of `catalog-playground/src` was a self-install of all 62 atoms.

Consumption told a different story than the catalog did. Eight projects under
`~/jmi-projects` carried `tokens.css`. Two real consumers carried
`loom-picks.json`, and both picked the same four atoms — `table`, `badge`,
`empty-state`, `top-bar`. Four projects took the tokens tier and hand-built
their own `atoms/`, `molecules/`, `organisms/`. Sixty-two generated components,
a real-world install count of four.

The property that made Loom worth having was never the count. It was that
anything scaffolded from it feels like a single app — corners match, focus and
hover carry the brand, states resolve through the same tokens. That coherence
was an *emergent* property of 62 components independently getting it right,
which is why holding it cost 46k lines and why it could not be read whole.

The components themselves were shadcn primitives with Loom classing over them.
The classing was the part that was Loom's.

## Decision

**Loom's primary output is a CSS class layer**, authored as plain CSS against
the token variables and emitted into `@layer components`. Appearance, states,
and interaction feel are named once, in one file, readable in a sitting.

React components survive only where behavior cannot be expressed in CSS — focus
traps, portals, keyboard navigation, positioning. Everything that was appearance
with a component wrapper around it becomes a class or an element default. CVA
stays, on that smaller surface, doing variant selection for behavior wrappers.

The layer is consumed in two modes:

| Mode | Surface | What ships |
|---|---|---|
| Live vars | Vite, Django, Next, static sites, headless Chrome | the layer, runtime theming |
| Data | email, React Native | `tokens.json`, values inlined |

*A third "resolved" mode was specified here and later cut — see the appends.*

## Options rejected

- **Tokens only, no classes** — cuts the orthogonal `variant × color` axis, the
  one idea in Loom not available elsewhere. And a values-only tier cannot
  deliver "feels like one app": values do not name combinations, and the
  combinations are the coherence being bought.

- **Keep the catalog, trim the count** — trimming leaves the double
  implementation intact. Every surviving atom still needs a Figma builder, a
  manifest, and a story, and coherence stays emergent across whatever remains.
  The count was the symptom; the architecture was the cost.

- **A frameworkless output target emitting HTML/CSS/JS** — priced in
  `backlog/loom-frameworkless-tier.md` as every atom's variant logic, state and
  composition contract existing twice. Correct for behavior, wrong for
  appearance. Splitting the two makes the appearance half portable for free and
  leaves nothing in the behavior half that needs porting.

- **`@apply` inside the layer** — binds the stylesheet to Tailwind's build,
  forfeiting the Django, print, and non-Tailwind consumers that are the point of
  the change. Plain CSS against `var()` costs nothing and travels.

- **Rewriting `setup.sh` in Python** — 145 lines of bash exist in the repo, and
  `setup.sh` is glue around four Node calls into `resolve-picks.js`,
  `check-local-edits.js`, and the orchestrator. In a repo where 164 script files
  are JS and the Figma scripts must be JS, Python is the less auditable choice,
  not the more. The bash folds into `node scripts/sync.js` instead.

- **Keeping the Figma component pipeline** — with a stylesheet as the
  deliverable it has no target. Figma mirrors the layer through variables, text
  styles, and effect styles; a designer rebuilds a button in ten minutes and
  cannot rebuild a variable collection at all.

## Consequences

**Easier.** The coherence claim becomes a stated property in one file instead of
an emergent one across 62. Loom's output runs anywhere CSS runs — Vite, Django
templates, generated invoices and documents — without a second output target.
`native/` stops being a bolt-on and becomes the same consumption mode as email.
The Figma pipeline loses three quarters of its weight. The playground shrinks
close to 1:1 with the catalog.

**Harder, and the costs are real.**

- **Email is not the same stylesheet.** Custom properties do not survive
  Outlook's Word engine, and Gmail's apps mangle or strip `<style>`. Email is
  mode 3: `tokens.json`, resolved at build, inlined as `style=""`. The portable
  claim is about the token vocabulary, not one artifact.

- **Documents need print rules in the layer.** Backgrounds drop by default in
  print; `print-color-adjust: exact` plus page-break behavior on surfaces and
  tables belongs in the layer, not re-derived per project.

- **Specificity is load-bearing.** The layer must sit in `@layer components` so
  utilities still override it. Written as unlayered plain CSS it beats every
  utility and turns each override into a specificity fight.

- **Existing consumers hold pre-layer atoms.** jmi-finance and jmi-fitness have
  installed files that will not match the new model. Nothing auto-syncs — that
  is the shadcn model working as designed — so those are hand ports.

- **This runs against Tailwind's grain** and will read as Bootstrap to some.
  Utility-first optimizes for per-project expressiveness; Loom optimizes for
  cross-project coherence, and something has to name the combinations. The
  difference from Bootstrap is that the defaults are generated from
  `spec/answers.json` rather than fixed.

- **The layer has a size discipline or it becomes the catalog again.** If it
  ever needs an index to navigate, the reduction has been undone in a different
  syntax.

---

**Appends.**

- **2026-08-18** — Rewriting the README thesis surfaced a gap the record did not
  answer: the class layer has **no Figma representation**. Figma has variables
  and styles but no notion of a class, so the "one source, two surfaces" claim
  now holds for the token half only. This is an accepted loss, not a reason to
  keep `scripts/figma-components`. Those builders never represented combinations
  either — a Figma component is a snapshot of one combination, not the rule that
  generates it, and every rule change meant re-authoring the snapshots by hand.
  Keeping them buys a stale mirror at 7,361 lines. Variables and styles are the
  part that is genuinely the same object as the tokens; a designer composes the
  combinations from those, the same way the layer does.

- **2026-08-18** — The coverage unit in the backlog was wrong. Writing "the class
  layer names the combinations" made it clear the closeable list is **element ×
  axis**, not element alone — a button is treatment × tone, an input is state ×
  validity. Still finite, but larger than first scoped.

- **2026-08-18** — Answering the three open questions turned up two facts that
  make the rewrite smaller than the record assumed.

  **The class layer already ships, unnamed.** `generated/tokens.css` carries the
  full `.text-{family}-{tier}` ramp and `.interactive` — transition, a
  `::after` overlay at 0.12 hover and 0.16 active, disabled keyed to `:disabled`
  and `[aria-disabled]`. And `spec/config/components/*.json` already declares
  every entry as `treatments × colors × sizes` with token refs. The layer needs a
  second emitter off schemas that exist, not a new authoring format.

  **`tokens.css` is not portable today**, which contradicts the tokens tier's
  own claim to assume nothing beyond a `src/` directory. Roughly 265 of its 829
  lines are Tailwind v4 `@utility` and `@theme inline` at-rules, and they ship to
  every consumer — a non-Tailwind consumer drops them silently. The emit
  therefore splits three ways: `tokens.css` (custom properties, portable),
  `loom.css` (the class layer, portable), `loom.tailwind.css` (the bridge,
  framework-bound). That split is the first cut and is worth doing on its own
  merits, independent of the rest of the rewrite.

- **2026-08-18** — Scoping how much variance the system should offer. The
  **intake is already the compact form** — `answers.json` is fourteen keys, one
  required, and the five look-and-feel answers are words rather than numbers
  (`density`, `typeScale`, `edges`, `shadowDepth`, `controlHeight`), with
  `styleDirection` seeded from named references. Reducing there would cut the
  part that works. The variance sits in two places the questionnaire does not
  surface.

  **Two suppliers for one value.** Precedence runs `productType <
  styleDirection < explicit`, with eleven product types and ten style directions
  filling the same four fields — 110 archetype pairs, and the questionnaire
  documents its own conflict (`dashboard` sets `typeScale: compact`, its own
  suggested `clean` sets `standard`). Nothing can state what a project received
  without running `npm run configs` and reading which layer won. **Decision:
  collapse to one intent supplier.** This breaks `answers.json`, so it lands
  before the emit split.

  **Axes hidden behind props.** 48 entries declare sizes, 147 size variants
  across the catalog, button alone 3 treatments × 7 colors × 3 sizes. As props
  the cost is invisible; as emitted CSS it is 63 button classes before anything
  else. Measured consumption across the two projects that install atoms: four
  `size="sm"`, one `variant="filled"` (the default), no use of the color axis or
  of `lg` — two consumers, both dashboards, so directional and not conclusive.
  **Decision: cut the size axis to a default plus one opt-in.**

- **2026-08-18** — **The "resolved" mode is cut.** It was specified above as the
  layer with its variables flattened per theme, for engines without
  custom-property support, and it was never built.

  No consumer exists. Nothing under `~/jmi-projects` uses puppeteer, playwright,
  wkhtmltopdf, weasyprint, pdfkit, jspdf, react-pdf, Electron or a WebView; no
  project generates a document at all. Nor is the population plausible in
  general: custom properties have shipped in every major browser since roughly
  2017, and the headless browser that would render a PDF supports them fully.
  The realistic consumer was wkhtmltopdf, a WebKit fork from 2012.

  It was invented to complete a table. Three modes read as a survey of the
  possibility space, and the middle row was the one with no name behind it. The
  cost was not the unwritten emitter — it was the consequence entry above, "the
  layer must be authored to be resolvable," which shaped how the layer got
  written for a return that could never arrive.

  **Do not re-propose without naming the consumer first.** A flattened emit is a
  permanent second output to keep in sync with the first, and a second output
  that ships to nobody drifts from the one that does.

