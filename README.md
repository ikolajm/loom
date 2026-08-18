# Loom

Loom generates a **design substrate** from one config file: a token set and a CSS
class layer that carry a brand's corners, focus rings, hover feel, surfaces and
states as named decisions instead of per-project choices.

The coherence is the product. Tokens name the values; the class layer names the
combinations, which is the part a values-only system cannot carry and the reason
everything built on Loom looks like one hand made it — a Next app, a Vite app, a
Django template and a generated invoice included.

Two things ride along. **Figma** takes the same substrate as variables, text
styles and effect styles, so the design surface and the code surface read from
one source. A small set of **React components** covers what CSS cannot express —
focus traps, portals, keyboard navigation, positioning — copied into your project
rather than installed from it (the shadcn model: own the files, no upstream sync).

**Where it runs.** Anything with a modern CSS engine takes the layer directly and
themes live. Engines without custom properties take a flattened build, one
stylesheet per theme. Email and React Native take `tokens.json` — the same values
as plain data — because no stylesheet survives Outlook's Word engine or a runtime
with no CSS at all.

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
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   tokens.css              class layer             tokens.json
   + Figma variables,      appearance, states,     plain values, no var()
   text & effect styles    interaction feel        email, React Native
        │                       │
        └───────────┬───────────┘
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

62 components across 8 groups, each generated as a `.tsx` file + a `.manifest.json` (its dependency/variant contract). The canonical, always-current pick list is generated to [`catalog/atoms.json`](catalog/atoms.json) — the table below is the readable view:

> **This is what ships today, not where it is going.** The class-layer rewrite moves appearance out of components and into CSS, which reduces this catalog to the entries that carry behavior. See [`docs/decisions/2026-08-18_class-layer-is-the-deliverable.md`](docs/decisions/2026-08-18_class-layer-is-the-deliverable.md).

**Two kinds, one catalog.** Every manifest carries a `kind`: **38 atoms** and **24 patterns**. An *atom* is a primitive you compose with — one control, one mark, one piece of content (`button`, `input`, `badge`, `avatar`). A *pattern* is an arrangement already composed for you, solving an assembly you would otherwise repeat (`command-palette`, `list-item`, `date-picker`, `form-field`). Both install identically and are equally first-class — the distinction is vocabulary, not a tier, and nothing in the pipeline branches on it. It earns its place by making "does this belong in the catalog?" answerable: an atom justifies itself by being unavoidable, a pattern by saving composition. `cn` is neither and is marked `utility`.

| Group | Atoms |
|-------|-------|
| **Buttons** | button, badge, dot, fab, fab-menu, toggle, toggle-group |
| **Forms** | input, select, textarea, checkbox, radio, switch, slider, combobox, date-picker, calendar, time-picker, file-upload, input-otp, label, helper-text, form-field |
| **Layout** | card, dialog, alert-dialog, sheet, table, separator, toolbar |
| **Feedback** | toast, banner, tooltip, popover, dropdown-menu, context-menu, hover-card, skeleton, spinner, progress-bar, empty-state |
| **Data display** | avatar, avatar-group, list-item, accordion, kbd, relative-time |
| **Navigation** | top-bar, sidebar, tabs, bottom-nav, breadcrumbs, pagination, navigation-menu, command-palette |
| **Composite** | stepper, carousel, tree-view |
| **Motion** | reveal, stagger, count-up, scroll-progress |

The motion atoms are **zero-dependency** — hand-rolled on `IntersectionObserver` / `requestAnimationFrame` / CSS, no animation library. Interactive primitives that genuinely warrant a library use one (carousel → embla, date-picker → Radix); simple atoms don't.

A few architectural choices worth noting:

- **Orthogonal `variant × color`.** Visual treatment (filled / outline / ghost) and color (brand / severity) are independent CVA (class-variance-authority) axes — the color axis sets CSS vars, each treatment consumes them. Adding a color or a treatment is one line, not an N×M matrix. The color axis is opt-in per atom.
- **Atoms are project-owned.** You don't `npm install` Loom. You pick a subset, the files are copied into your project, and you edit them freely — the shadcn model. There's no upstream auto-sync; a manual port-back is the deliberate path when an edit generalizes.
- **The substrate is a foundation, not a finished look.** Loom ships coherent tokens + atoms — clean, consistent, deliberately plain. The eye-catching, on-brand layer (hero treatments, decorative accents, per-section design) is project-owned, built on top. A scaffolded Loom project looks plain because the personality is yours to add, not because the system is unfinished — see [`docs/design-rationale/substrate-not-ambition.md`](docs/design-rationale/substrate-not-ambition.md).

---

## Quickstart

Requires Node ≥ 18.18. **Using Loom in a project? This Quickstart is everything you need** — the architecture spec and the `docs/` folder are internals for *extending* the generator, not for consuming it.

### Browse the catalog

The catalog playground is a Next.js app that picks every atom and renders them with prop controls:

```bash
cd catalog-playground
npm install
npm run dev          # → http://localhost:3000
```

This works on a bare clone with no configuration — see *Configure and generate* below. The playground regenerates its token substrate on every `dev` / `build`, so it renders Loom's default look until you generate a brand, and yours from then on.

### Configure and generate

**Loom builds with no configuration at all.** A fresh clone generates Loom's own look, because the committed token set in `spec/config/base/` is a complete working default — that is why the playground above runs before you have configured anything. You still run the generators below; what you don't need is an answers file. (`catalog/` is committed, so the atoms are there on clone. `generated/` is not — the Figma scripts and `init.sh` exist only after you run the commands in this section.)

To build *your* brand, hand-author **`spec/answers.json`** — your brand colors, fonts, and token choices. It's git-ignored (it's your brand, not Loom's), so copy the committed template first, then edit it:

```bash
cp spec/answers.example.json spec/answers.json
```

See [`spec/questionnaire.md`](spec/questionnaire.md) for the full key reference. Then run the three pipelines:

```bash
npm run configs      # spec/answers.json → spec/config/local/  (git-ignored)
npm run generate     # → React catalog (catalog/) + the three stylesheets + tokens.json
npm run figma        # → Figma plugin scripts (paste into the Figma console)
```

**Where your brand lands.** `npm run configs` writes to `spec/config/local/`, never to the committed set — so generating a brand never dirties the Loom repo. Every generator resolves each config file through `local/` first and falls back to `spec/config/base/`. Two things follow. Hand-edit `spec/config/local/`, not `spec/config/base/`: a local file of the same name overrides the committed one anyway, and editing the committed set fails the `base-config-provenance` check on the next `npm run generate`. And deleting `spec/config/local/` reverts you to Loom's default look.

Re-run these any time you change a value in `spec/answers.json` or a component schema in `spec/config/components/`. `node scripts/code-templates/orchestrator.js --list` shows the individual code generators (`tokens`, `tokens-json`, `components`, `scaffold`, `handoff`, …); `--only <target>` runs one.

`generate` emits three stylesheets, and only one is framework-bound: **`tokens.css`** (custom properties), **`loom.css`** (the class layer — type ramp, interactive states, keyframes), and **`loom.tailwind.css`** (the `@theme inline` bridge and `@utility` shorthands, Tailwind v4 only). Import them in that order; a non-Tailwind build skips the third rather than silently dropping it.

Alongside them, `generate` emits **`tokens.json`** — the same token values as neutral, engine-agnostic data (no CSS `var()`), for consumers without a CSS runtime. If you're targeting **React Native / NativeWind**, that plus the preset in [`native/`](native/README.md) is your path — see below.

### Use Loom in a project

**Two install tiers.** Pick before you start; the difference is what Loom is allowed to put in your project.

| Tier | You get | Use when |
|------|---------|----------|
| **tokens** | the three stylesheets + `tokens.json`, nothing else — no atoms, no app shell, no dependencies | You have your own components and want Loom's design decisions as values. This is the only tier a non-web runtime can take: [`native/`](native/README.md) is this tier, consumed through the NativeWind preset |
| **catalog** | The tokens tier, plus the app shell (`ThemeProvider`, root layout, `globals.css`, a `/preview` route), the core dependencies, and the atoms you pick | You want the components too. This is what the quickstart below installs |

The `/preview` route belongs to the **catalog** tier: it renders the token substrate — swatches, type, spacing, radius — and is the one thing that catches a silently failed Tailwind v4 `@theme` wiring. Its own header calls it a token-landing check, not a component gallery. Delete it once your brand has landed.

Both tiers are first-class on web:

```bash
./generated/scaffold/init.sh ../my-app --tokens   # tokens tier — writes the three stylesheets + src/tokens.json, nothing else
./generated/scaffold/init.sh ../my-app            # catalog tier — the quickstart below
```

The tokens tier assumes nothing about your framework beyond a `src/` directory: no `npm install`, no layout, no `loom-picks.json`. Wire `tokens.css` and `loom.css` into your global stylesheet — both are plain CSS and need no build step — then add `loom.tailwind.css` after the `tailwindcss` import if you are on Tailwind. Use the token vocabulary in your own components; `tokens.json` is the same data for anything without a CSS runtime. Re-run without `--tokens` to move up to the catalog tier.

Consumption is shadcn-style — declare what you want, copy it in. You need a Next.js + Tailwind v4 project with `src/app/` that lives **alongside the Loom repo, not inside it** — Loom is the factory; your app is a separate project it builds into. The clean layout is siblings: `~/projects/loom` and `~/projects/my-loom-app`.

**Don't have one?** From your workspace (not inside the Loom repo), this spins up a correctly-configured project — Next.js + Tailwind v4 + TypeScript + `src/app/`, no prompts:

```bash
npx create-next-app@latest my-loom-app \
  --ts --tailwind --app --src-dir --eslint \
  --import-alias "@/*" --use-npm --no-turbopack --no-agents-md
```

`--no-agents-md` skips the generic `AGENTS.md` / `CLAUDE.md` agent-rules files create-next-app would otherwise drop in — your project starts clean.

Already made one (or have one)? The next two commands run **from the Loom repo**, pointing at your project by path:

```bash
# 1. Bootstrap the app shell once — ThemeProvider, root layout + fonts, globals,
#    token substrate, and core deps. Run from the Loom repo, pointing at your project:
./generated/scaffold/init.sh ../my-loom-app

# 2. init.sh wrote a starter loom-picks.json in your project — edit its `picks`.
#    Valid pick ids: catalog/atoms.json (generated) — or the catalog table above.

# 3. From the Loom repo, sync the picked atoms in (re-run anytime to resync):
./setup.sh ../my-loom-app

# 4. Run your app and open /preview to confirm your brand landed:
#    cd ../my-loom-app && npm run dev   → http://localhost:3000/preview
#    init.sh scaffolds that route (token swatches, type, spacing, radius);
#    delete src/app/preview/ once you've confirmed.
```

`init.sh` is the one-time app-shell step (atom-agnostic). `setup.sh` is the repeatable atom sync: it resolves each pick's dependencies transitively from its manifest (picking `combobox` pulls in `popover` + `form-field`), copies just those atoms into `your-project/src/components/`, and delivers a freshly generated substrate (`tokens.css`, `loom.css`, `loom.tailwind.css`). It prints the `npm install` line for the packages those atoms import — your project owns its lockfile, so Loom reports deps rather than installing them. **An atom you have edited is skipped, not overwritten** — atoms are yours after install, so a resync names what it kept and prints the diff command; pass `--force` to take the catalog version instead. Atoms require **Tailwind v4** + `@tailwindcss/postcss` and **`tailwind-merge` ≥ 3** (the generated `cn()` registers the token scales via tailwind-merge's v3 `theme` keys, so v2 silently breaks className overrides).

Fonts come from the questionnaire (`heading` / `body`) and load via a runtime Google Fonts `<link>` in the generated `layout.tsx` — use Google Fonts family names; an unrecognized name falls back to system sans rather than breaking the build (edit `layout.tsx` to self-host). Google Fonts and Figma's font set aren't 1:1, so the Figma typography paste reports availability and substitutes Inter for any font it can't render; pick from [`spec/parity-safe-fonts.json`](spec/parity-safe-fonts.json) for guaranteed design↔code parity.

### Apply the Figma scripts

`npm run figma` writes 17 scripts to `generated/figma-scripts/` — `00_shared-utils.js` (global helpers) + `01`–`16` step scripts (each a self-contained async IIFE). They build **variables, text styles, effect styles and the page layout** — the token half. Figma does not receive components: it has no notion of a class, so the class layer has no representation there, and a Figma component was only ever a snapshot of one combination rather than the rule that generates it ([why](docs/decisions/2026-08-18_class-layer-is-the-deliverable.md)). Build the components you need from the variables. To build the Figma file:

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
    components/        ← hand-authored component schemas (8 group files)
    figma/             ← Figma variable-collection definitions
    presentation/      ← Figma documentation chrome (layout, templates)
  questionnaire.md     ← the tiered intake that drives base/ tokens
  answers.example.json ← committed template — copy to answers.json (git-ignored) and edit

scripts/               The two codegen pipelines
  code-templates/      ← React catalog + the three stylesheets + scaffold
  figma-*/             ← Figma variables / styles / page layout
  assemble-figma.js    ← bundles the Figma plugin scripts
  resolve-picks.js     ← the picker's dependency resolver
  setup.sh             ← (repo root) installs picked atoms into a project

catalog/               Generated output — per-atom .tsx + .manifest.json (stories live in catalog-playground/src/gallery/)
catalog-playground/    Next.js app that browses the whole catalog
native/                React Native / NativeWind bridge — tokens.json + preset (see native/README.md)
docs/                  Design-system engineering docs (see below)
```

---

## How it's built

The full catalog model — surfaces, picker, manifests, override mechanism — is specified in [`CATALOG_SPEC.md`](CATALOG_SPEC.md); each atom's contract (dependencies, variants, tokens) lives in its `.manifest.json`. The hard-won traps behind the generator — Figma Plugin API, Tailwind v4 footguns, font parity, reduced-motion semantics — are in [`docs/gotchas.md`](docs/gotchas.md).

A note on generated code: when an atom's Radix primitive has no template wired, the generator falls back to CVA-only output and marks it `// TODO: wrap with <primitive>`. That marker is a deliberate fallback signal, not unfinished work. No atom in the current catalog carries one.

---

## License

[MIT](LICENSE) © 2026 Jacob Ikola
