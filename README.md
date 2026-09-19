# Loom

Loom generates a **design substrate** from one config file: a token set and a CSS
class layer that carry a brand's corners, focus rings, hover feel, surfaces and
states as named decisions instead of per-project choices.

The coherence is the product. Tokens name the values; the class layer names the
combinations, which is the part a values-only system cannot carry and the reason
everything built on Loom looks like one hand made it — a Next app, a Vite app and a
[printed invoice](docs/examples/invoice/) included, the last with no framework under
it at all.

Two things ride along. **Figma** takes the same substrate as variables, text
styles and effect styles, so the design surface and the code surface read from
one source. A small set of **React components** covers what CSS cannot express —
focus traps, portals, keyboard navigation, positioning — copied into your project
rather than installed from it (the shadcn model: own the files, no upstream sync).

**Where it runs.** Anything with a CSS engine takes the layer directly and themes
live — Vite, Django, Next, static sites, and whatever renders your PDFs. That last
one is not a browser in disguise: the worked example goes through WeasyPrint, which
has its own layout implementation, and [`docs/gotchas.md`](docs/gotchas.md) records
where that shows. Email is the one target no stylesheet reaches — Outlook's Word
engine drops custom properties, so `var()` buys you nothing there. `tokens.css` is
still the source: it holds the resolved values as literal hex, to be copied in.

Loom started as a personal engine for spinning up consistent projects. It is open
source for the model.

---

## The idea in one diagram

```
                        spec/answers.json
                                │
                                ▼
                          spec/config/         ← single source of truth
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
   tokens.css                                      class layer
   + Figma variables,                              appearance, states,
   text & effect styles                            interaction feel
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
                        behavior components
                        React, only where CSS cannot reach
                        (focus traps, portals, keyboard nav, positioning)
                                │
                                ▼
                         consuming project
                         (copy what you need, own the copies)
```

Change a value in `spec/answers.json` → regenerate → every output moves together, because they read the same JSON. Figma takes the token half as variables and styles; the class layer is CSS-only, since Figma has no notion of a class.

---

## What's in the catalog

6 components across 3 groups — 5 atoms plus `ThemeProvider`, which is its own kind — each generated as a source file + a `.manifest.json` (its dependency/variant contract). `cn` and `theme-init` are delivered alongside them and are not counted as components. The canonical, always-current index is generated to [`catalog/atoms.json`](catalog/atoms.json) — the table below is the readable view. It is an inventory, not a pick list: the sync copies every atom, and there is no mechanism for taking a subset.

**The catalog is a worked example, not a component library.** Five references, one per distinct way of wiring something to the class layer: `button` and `badge` for tone x treatment x `data-size` plus `asChild`, `form-field` for the validity cascade into `.control`, `dialog` for a Radix portal, `select` for a Radix form control. Anything else you need, build — Radix is already the primitive layer, and what Loom uniquely owns is tokens to classes.

That is a measured position, not a taste. Across every project consuming Loom, the atoms actually installed were `badge`, `table`, `empty-state`, `top-bar` and `cn`; not one consumer imported a composite, and the two heaviest token consumers held no atoms at all. Forty components covered a surface nobody reached for.

**Appearance is not here at all.** A card, a badge's shape, an input's padding and a table's rules are classes in `loom.components.css` — plain CSS with nothing React-shaped in it, which is why the [printed invoice](docs/examples/invoice/) renders with no framework under it, and why a server-rendered template needs nothing from this directory either.

What is here earns a file one of two ways. Most **carry behavior neither CSS nor HTML can express** — and HTML is in the frame, because a native `<dialog>` supplies a focus trap, a top-layer portal and Escape-to-close for free. Measured against that bar, `theme-provider` passes cleanly, `form-field` passes on its error context, `button` and `badge` pass on the composition contract rather than on behaviour, and `dialog` and `select` pass only **conditionally** — see [Native first](CATALOG_SPEC.md#native-first) before reaching for either. `badge` is the exception and is deliberate: it carries no behavior at all, and exists because its class contract has enough independent axes — treatment, tone, size — that composing them from memory at every call site is the failure mode. A typed prop is the cheaper contract. `card`, `table` and `skeleton` get no file because they have neither: one class, no axes, nothing to forget.

A label is not interactive, but it is one of the handful of things every app needs on day one, and this is a scaffold for getting one off the ground.

| Group | Atoms |
|-------|-------|
| **Buttons** | badge, button |
| **Forms** | form-field, select |
| **Layout** | dialog |

Interactive primitives that genuinely warrant a library use one (carousel → embla, date-picker → Radix); simple atoms don't.

A few architectural choices worth noting:

- **Orthogonal tone × treatment.** Tone (`.tone-primary`, `.tone-error-soft`, …) re-points the `--tone-*` custom properties; treatment (`.treat-filled` / `-outline` / `-ghost`) consumes them, each through a fallback — so a treatment with no tone renders a neutral version of itself rather than nothing, and `badge tone-primary` with no treatment is filled, because `.badge` carries a tone default at zero specificity. Adding either is one line, not an N×M matrix, and every family carries a `-soft` container end so intensity is one axis rather than two vocabularies. **The label colour is resolved, not assumed.** `--tone-text` reads a per-family text role that the generator walks to the nearest ramp shade clearing AA against the most raised surface tier, per mode — so an outline or ghost badge is legible wherever it lands, not only on plain `surface`. It is a separate role from the fill, so your solid buttons keep the brand colour at full strength; only what `.treat-outline`, `.treat-ghost` and `.link` paint moves. `--tone-border` deliberately stays at the base role, because a border is a non-text boundary at 3:1 under WCAG 1.4.11 and the brand line is most of what an outline is for. A brand whose ramp cannot produce a legible label fails the build rather than shipping. Both are plain classes in `loom.css`, which is what makes the portability claim above true. Tone is opt-in per atom: `button` and `badge` carry the full axis, `dialog` and `form-field` none.
- **Atoms are project-owned.** You don't `npm install` Loom. You pick a subset, the files are copied into your project, and you edit them freely — the shadcn model. There's no upstream auto-sync; a manual port-back is the deliberate path when an edit generalizes.
- **The substrate is a foundation, not a finished look.** Loom ships coherent tokens + atoms — clean, consistent, deliberately plain. The eye-catching, on-brand layer (hero treatments, decorative accents, per-section design) is project-owned, built on top. A fresh Loom project looks plain because the personality is yours to add, not because the system is unfinished.

---

## Quickstart

Requires Node ≥ 18.18. **Using Loom in a project? This Quickstart is everything you need** — the architecture spec and the `docs/` folder are internals for *extending* the generator, not for consuming it.

### Browse the substrate — and the compile gate

[`docs/preview.html`](docs/preview.html) is the surface you look at. Open it after
`npm run generate` and it renders the whole class layer with the three stylesheets and
nothing else underneath — no framework, no build step, no utility layer, which is the
point: what renders there is what a consumer gets. It carries the token half too, so a
brand lands or does not land in one place.

The compile gate is separate and smaller. The atoms are TypeScript and nothing else in
this repo compiles them, so `verify.js` ends in `tsc --noEmit` over `catalog/` with
`strict` and `noUnusedLocals`. That is the only thing reading the emitted `.tsx` **as
code** rather than as text — generated TSX with a syntax error passed every regex-level
check twice before a compiler was in the loop.

```bash
npm install     # typescript, @types/react, and the seven packages the atoms import
npm run generate
```

**The install is only for that gate.** Generating Loom is pure Node with no
dependencies, and `typecheck` skips itself when `node_modules` is absent rather than
failing a generate that is otherwise fine.

### Configure and generate

**Loom builds with no configuration at all.** A fresh clone generates Loom's own look, because the committed token set in `spec/config/base/` is a complete working default — that is why the preview page above renders before you have configured anything. You still run the generators below; what you don't need is an answers file. (`catalog/` is committed, so the components are there on clone. `generated/` is not — the stylesheets and the Figma scripts exist only after you run the commands in this section.)

To build *your* brand, hand-author **`spec/answers.json`** — your brand colors, fonts, and token choices. It's git-ignored (it's your brand, not Loom's), so copy the committed template first, then edit it:

```bash
cp spec/answers.example.json spec/answers.json
```

See [`spec/questionnaire.md`](spec/questionnaire.md) for the full key reference. Then run the three pipelines:

```bash
npm run configs      # spec/answers.json → spec/config/local/  (git-ignored)
npm run generate     # → React catalog (catalog/) + the four stylesheets
npm run figma        # → Figma plugin scripts (paste into the Figma console)
```

**Where your brand lands.** `npm run configs` writes to `spec/config/local/`, never to the committed set — so generating a brand never dirties the Loom repo. Every generator resolves each config file through `local/` first and falls back to `spec/config/base/`. Two things follow. Hand-edit `spec/config/local/`, not `spec/config/base/`: a local file of the same name overrides the committed one anyway, and editing the committed set fails the `base-config-provenance` check on the next `npm run generate`. And deleting `spec/config/local/` reverts you to Loom's default look.

Re-run these any time you change a value in `spec/answers.json` or a component schema in `spec/config/components/`. `node scripts/code-templates/orchestrator.js --list` shows the individual code generators (`tokens`, `components`, `preview-html`, `handoff`, `verify`); `--only <target>` runs one.

`generate` emits four CSS files — three stylesheets and the index that imports them. All are plain CSS with no framework at-rules:

| File | Holds | Layer |
|---|---|---|
| `tokens.css` | custom properties — color roles, spacing, radius, type role values | `loom.tokens` |
| `loom.css` | what you compose with — a document base, type ramp, text color roles, tones, treatments, control states, surfaces, elevation, links, tabular figures, keyframes, print rules | `loom.base`, `loom.components` |
| `loom.components.css` | what they compose into — named component classes, shape only | `loom.components` |
| `main.css` | the three above, imported in order. Three lines and no rules of its own | — |

**Import `main.css`, or the three directly in that order — the order is load-bearing.** Everything Loom emits sits in a Loom-owned cascade layer:

```css
@layer loom.reset, loom.tokens, loom.base, loom.components;
```

`tokens.css` declares that line, which is why it goes first. Two things follow, and both are the point.

**Your own CSS wins by default.** Unlayered rules outrank every layer regardless of specificity, so a plain `.card { border-radius: 0 }` in your stylesheet beats Loom's `.card` without `!important` and without a specificity fight. Override by writing normal CSS.

**Your reset goes in `@layer loom.reset`, imported before `tokens.css`.** An unlayered reset outranks the entire class layer — every rule Loom ships, silently ([why](docs/gotchas.md)). The `loom.reset` slot exists so it loses instead.

One caveat that decides how you wire this up: a minifier drops an `@layer` statement as redundant, after which precedence falls back to first-appearance order. The import sequence reproduces the same order on its own, which is why it is the mechanism and the statement is documentation. Don't reorder the imports.

A project that owns its own components can skip `loom.components.css`. Before wiring `loom.css` into an app that already has a stylesheet, know that it is the only file touching bare elements — `box-sizing` and the `body` defaults — so a page with no reset of its own still gets a background, a text color and the body type role. Those sit in `loom.base`, below everything else Loom ships.

### Use Loom in a project

**Two install tiers.** Both are `npm run sync`; the difference is one flag, and what Loom is allowed to put in your project.

| Tier | You get | Use when |
|------|---------|----------|
| **tokens** (`--tokens`) | the stylesheets, nothing else — no components, no dependencies | You have your own components and want Loom's design decisions as values |
| **catalog** (default) | The tokens tier, plus the whole catalog and `ThemeProvider` | You want the components too |

**There is no app shell, and no framework assumption.** The stylesheets are plain CSS and the components plain React; Loom writes nothing that presumes a router, a root layout or a `src/app/`. `ThemeProvider` is a catalog component, the `::selection` and scrollbar rules are in the class layer, and `sync.js` owns the `--tokens` tier and the `loom:sync` script. Where a provider mounts and what your root layout looks like are your framework's business — Vite, Next, Remix, or a hand-rolled `index.html`.

To check that a brand landed, open [`docs/preview.html`](docs/preview.html) in this repo after generating. No dev server and no route in your project — a static file answers the question.

Consumption is shadcn-style: the files are copied in and become yours. Your project lives **alongside the Loom repo, not inside it** — Loom is the factory, your app is a separate project it builds into. The clean layout is siblings: `~/projects/loom` and `~/projects/my-loom-app`.

```bash
# From the Loom repo, pointing at your project by path.

# Tokens tier — four stylesheets into <project>/src/, nothing else:
npm run sync -- ../my-loom-app --tokens --answers ../my-loom-app/loom-answers.json

# Catalog tier — the same, plus every component into <project>/src/components/loom/:
npm run sync -- ../my-loom-app --answers ../my-loom-app/loom-answers.json
```

**Keep your answers file in your project, and pass it with `--answers`.** Without it the sync emits whichever brand is active in this checkout, which is the right default for a maintainer and the wrong one for you. `spec/answers.json` here is a single slot — one brand at a time — so a Loom repo that has been used for two projects has forgotten the first one's brand, and the only record left is the emitted CSS. `--answers` resolves your brand into a throwaway config root, so the sync never writes to this repo and never depends on what it was last used for. The first sync writes the flag into your `loom:sync` script, so a refresh from your own directory stays reproducible.


Then three things, once:

1. **Wire the substrate in.** One `@import "./main.css"` in your global stylesheet — plain CSS, no build step. If you own your components, import the three directly and drop the `loom.components.css` line.
2. **Put your own reset in `@layer loom.reset`** and import it before `tokens.css`, or it will silently outrank the entire class layer ([why](docs/gotchas.md)). This is the single most common way a Loom install looks broken.
3. **Wire theme switching, which is two artifacts.** Paste the body of `components/loom/theme-init.js` into an inline `<script>` in `<head>`, before your stylesheet — it reads the stored choice and sets `data-theme` and `color-scheme` on the first frame. Then mount `ThemeProvider` at your app root; it persists changes and owns everything after that frame. Skip the snippet and the theme still works one frame late, so anyone on the non-default mode sees a flash of the default on every load. It cannot be a component: React renders after the first paint, so nothing it owns can set an attribute before that paint exists. Do not load it with `<script src>` — deferred it runs after the paint it exists to precede, undeferred it costs a round trip before it.

`npm run sync` is repeatable — re-run it any time a token or a schema changes. It copies the whole catalog into `your-project/src/components/loom/` — a directory of Loom's own, so one glob scopes your lint config at files you did not write — and delivers a freshly generated substrate into `src/`. **Every delivered file is overwritten**, and each one says so in a generated header. There is no edit detection and nothing to force: these files are Loom's, and a change you want to keep goes at the call site — a className, a prop, a wrapper — which survives every resync by construction. **Deleting a component you do not want is temporary** — it returns on the next sync, which is deliberate rather than unfortunate: an unimported component is tree-shaken, so it costs nothing in your bundle, and a pick list is a second place for the catalog to drift from itself. It prints the `npm install` line for the packages those components import, taken from their manifests; your project owns its lockfile, so Loom reports deps rather than installing them. The components need React 19 and the packages their manifests name; they need no CSS framework at all.

**From the consumer side it is `npm run loom:sync`.** The first sync writes that script into your project's `package.json` on both tiers, so a refresh runs from your own directory instead of from this repo. It is written rather than documented because the sync is the only thing that knows the path between the two repos — it is invoked with one and lives in the other, so it computes the relative form (`../loom/scripts/sync.js` in the sibling layout). It is deliberately **not** wired into `predev`: a consumer's dev server that cannot start without a sibling repo present is a worse failure than a stale stylesheet, and it lands on whoever clones the project next rather than on the person who set it up.

A sync always regenerates the substrate, so your tokens are current by construction; only `catalog/*.tsx` can lag behind the schemas and templates it was built from. The sync **reports** that in one line rather than repairing it — rebuilding the atoms runs the whole pipeline, including a typecheck, so refreshing a brand in your project could fail on a surface it has never heard of. Pass `--refresh` when you do want them rebuilt.

**Fonts are named here and loaded by you.** The questionnaire takes one family per role (`heading` / `body`) and `tokens.css` emits them as `'Your Family', system-ui, sans-serif`. **Loom recommends no typeface** — that is identity, and identity is yours; what Loom supplies is the ramp under it, six roles across two families ([the table](spec/questionnaire.md#fonts--heading--body)). It also loads nothing: add a `<link>`, an `@font-face`, `next/font` or an `@fontsource` package yourself. **Skip it and nothing breaks or warns** — the page renders in the fallback, and it looks right to anyone with the family installed locally ([why that is the trap](docs/gotchas.md)). Spell the family exactly as your provider does; the string is matched literally on both surfaces. The ramp asks for weights 400/500/600/700, so check your family ships four. The Figma typography paste substitutes Inter for any family that Figma cannot render, logged.

### Read the values somewhere Loom cannot reach

A surface with no CSS engine — an email, a templating language, a report builder — can
still use Loom's decisions by reading `tokens.css` as a table of values rather than
linking it as a stylesheet. It is already in that shape: nearly every declaration is a
resolved literal on the line, and the aliases that are not resolve in one hop, never a
chain. The semantic names (`--primary`, `--on-surface-variant`, `--space-6`, `--br-md`)
are the interface worth designing against; the numbered palette underneath them moves
when a brand changes.

**A PDF renderer is not this case.** WeasyPrint implements enough CSS to take the
substrate directly, cascade layers and custom properties included — link `main.css` and
use the classes. [`docs/examples/invoice/`](docs/examples/invoice/) is a worked example,
and [`docs/gotchas.md`](docs/gotchas.md) has the engine differences that bite. Reach for
raw values only where nothing can consume a stylesheet at all, which in practice means
email: Outlook's Word engine ignores custom properties, so values have to arrive already
resolved and inlined.

**Values you copy do not track brand changes.** This is the whole cost of the approach
and there is no mechanism against it: regenerate with a different brand and the hexes
move, while your template keeps the old ones and nothing in either repo knows it exists.
Loom ships no generator, no JSON tier and no recommended templating approach for this —
it is a use case the substrate supports, not a tier it delivers, and keeping the copy
honest is the downstream author's problem to solve however suits them.

### Apply the Figma scripts

`npm run figma` writes 17 scripts to `generated/figma-scripts/` — `00_shared-utils.js` (global helpers) + `01`–`16` step scripts (each a self-contained async IIFE). They build **variables, text styles, effect styles and the page layout** — the token half. Figma does not receive components: it has no notion of a class, so the class layer has no representation there, and a Figma component was only ever a snapshot of one combination rather than the rule that generates it. Build the components you need from the variables. To build the Figma file:

1. Open the target Figma file and open a plugin **console** (any dev plugin → Plugins → Development → Open console).
2. Paste **`00_shared-utils.js` first** — it defines the helpers the steps reference.
3. Paste the step scripts **`01` → `16` in numeric order**. Re-running one later only needs its own step script re-pasted.

**Build into a fresh Figma file, or clear it first.** The steps are *not* idempotent — re-pasting them onto a file that already has Loom variables creates duplicate collections. Before a full rebuild on a used file, paste this reset into the console first:

```js
// Clear variable collections
const collections = figma.variables.getLocalVariableCollections();
for (const col of collections) { try { col.remove(); } catch(e) {} }
// Clear styles
for (const s of figma.getLocalTextStyles()) { try { s.remove(); } catch(e) {} }
for (const s of figma.getLocalEffectStyles()) { try { s.remove(); } catch(e) {} }
// Clear pages — remove children first, then extra pages
for (const page of figma.root.children) {
  while (page.children.length > 0) { try { page.children[0].remove(); } catch(e) { break; } }
}
while (figma.root.children.length > 1) { try { figma.root.children[figma.root.children.length - 1].remove(); } catch(e) { break; } }
```

Step `14` (text styles) runs the font-availability check and reports `✓`/`⚠` per family; a font this Figma can't render is substituted with Inter so the paste completes (see [`docs/gotchas.md`](docs/gotchas.md)).

---

## Repo layout

```
spec/                  Single source of truth
  config/
    base/              ← Loom's committed default token set — the fallback
    local/             ← your generated brand (git-ignored; preferred over base/)
    components/        ← hand-authored component schemas (7 group files)
    figma/             ← Figma variable-collection definitions
    presentation/      ← Figma documentation chrome (layout, templates)
  questionnaire.md     ← the tiered intake that drives base/ tokens
  answers.example.json ← committed template — copy to answers.json (git-ignored) and edit

scripts/               The two codegen pipelines
  code-templates/      ← React catalog + the four stylesheets
  figma-*/             ← Figma variables / styles / page layout
  assemble-figma.js    ← bundles the Figma plugin scripts
  scripts/sync.js      ← installs the catalog + substrate into a project (`npm run sync`)

catalog/               Generated output — per-atom .tsx + .manifest.json; `tsc --noEmit` over it is verify.js's typecheck
docs/                  Design-system engineering docs (see below)
  pipeline.md          ← the derivation chain: answers.json → every output
```

---

## How it's built

[`docs/pipeline.md`](docs/pipeline.md) traces the derivation chain end to end — the three commands, how a config file is resolved, what each generator transforms rather than copies, and where a symptom points. Start there to extend the generator or to debug an output that doesn't match the answers.

The full catalog model — surfaces, manifests, override mechanism — is specified in [`CATALOG_SPEC.md`](CATALOG_SPEC.md); each atom's contract (dependencies, variants, tokens) lives in its `.manifest.json`. The hard-won traps behind the generator — Figma Plugin API, cascade-layer and reset ordering, font loading and parity, reduced-motion semantics, WeasyPrint's differences from a browser — are in [`docs/gotchas.md`](docs/gotchas.md).

A note on generated code: when an atom's Radix primitive has no template wired, the generator falls back to CVA-only output and marks it `// TODO: wrap with <primitive>`. That marker is a deliberate fallback signal, not unfinished work. No atom in the current catalog carries one.

---

## License

[MIT](LICENSE) © 2026 Jacob Ikola
