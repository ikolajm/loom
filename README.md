# Loom

A token-driven design system generator. One config source produces two synchronized outputs — a **Figma file** (variables, styles, components) and a **React component catalog** (66 atoms on a shared token foundation) — so the design surface and the code surface never drift from each other.

Loom started as a personal engine for spinning up consistent design systems across projects. It's open source for the model: a single source of truth feeding two codegen pipelines, with a catalog you copy components *from* rather than depend *on* (the shadcn approach — own the files, no upstream sync).

---

## The idea in one diagram

```
                    spec/config/         ← single source of truth
                  (tokens + component schemas)
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
   Figma pipeline                 Code pipeline
   scripts/assemble-figma.js      scripts/code-templates/orchestrator.js
            │                           │
            ▼                           ▼
   Figma variables /            catalog/  →  66 React atoms
   styles / components          + tokens.css substrate
   (paste into plugin console)  + per-atom manifests
                                        │
                                        ▼
                              consuming project
                              (pick a subset, own the copies)
```

Change a value in `spec/config/` → regenerate → **both** the Figma file and the code catalog update. The two pipelines read the same JSON, so a brand color or a component spec is defined once.

---

## What's in the catalog

66 atoms across 8 groups, each generated as a `.tsx` component + a `.manifest.json` (its dependency/variant contract). The canonical, always-current pick list is generated to [`catalog/atoms.json`](catalog/atoms.json) — the table below is the readable view:

| Group | Atoms |
|-------|-------|
| **Buttons** | button, badge, dot, fab, fab-menu, toggle, toggle-group |
| **Forms** | input, select, textarea, checkbox, radio, switch, slider, combobox, date-picker, calendar, time-picker, file-upload, input-otp, label, helper-text, form-field, rating, search-bar |
| **Layout** | card, dialog, alert-dialog, sheet, table, separator, toolbar |
| **Feedback** | toast, banner, tooltip, popover, dropdown-menu, context-menu, hover-card, skeleton, spinner, progress-bar, empty-state |
| **Data display** | avatar, avatar-group, list-item, accordion, collapsible, kbd, number, relative-time |
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

### Configure and generate

Loom generates from one hand-authored file, **`spec/answers.json`** — your brand colors, fonts, and token choices. See [`spec/questionnaire.md`](spec/questionnaire.md) for the full key reference (copy its example to start). Then run the three pipelines:

```bash
npm run configs      # spec/answers.json → base token configs
npm run generate     # → React catalog (catalog/) + tokens.css
npm run figma        # → Figma plugin scripts (paste into the Figma console)
```

Re-run these any time you change a value in `spec/answers.json` or a component schema in `spec/config/`. `node scripts/code-templates/orchestrator.js --list` shows the individual code generators (`tokens`, `components`, `scaffold`, `handoff`, …); `--only <target>` runs one.

### Use Loom in a project

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

`init.sh` is the one-time app-shell step (atom-agnostic). `setup.sh` is the repeatable atom sync: it resolves each pick's dependencies transitively from its manifest (picking `combobox` pulls in `popover` + `form-field`), copies just those atoms into `your-project/src/components/`, and delivers a freshly generated `tokens.css` substrate. It prints the `npm install` line for the packages those atoms import — your project owns its lockfile, so Loom reports deps rather than installing them. Atoms require **Tailwind v4** + `@tailwindcss/postcss` and **`tailwind-merge` ≥ 3** (the generated `cn()` registers the token scales via tailwind-merge's v3 `theme` keys, so v2 silently breaks className overrides).

Fonts come from the questionnaire (`heading` / `body`) and load via a runtime Google Fonts `<link>` in the generated `layout.tsx` — use Google Fonts family names; an unrecognized name falls back to system sans rather than breaking the build (edit `layout.tsx` to self-host). Google Fonts and Figma's font set aren't 1:1, so the Figma typography paste reports availability and substitutes Inter for any font it can't render; pick from [`spec/parity-safe-fonts.json`](spec/parity-safe-fonts.json) for guaranteed design↔code parity.

### Apply the Figma scripts

`npm run figma` writes 30 scripts to `generated/figma-scripts/` — `00_shared-utils.js` (global helpers) + `01`–`29` step scripts (each a self-contained async IIFE). To build the Figma file:

1. Open the target Figma file and open a plugin **console** (any dev plugin → Plugins → Development → Open console).
2. Paste **`00_shared-utils.js` first** — it defines the helpers the steps reference.
3. Paste the step scripts **`01` → `29` in numeric order**. Re-running a single page later only needs its own step script re-pasted.

**Build into a fresh Figma file, or clear it first.** Component pages clear and rebuild themselves on re-paste, but the variable/style steps (`01`–`14`) are *not* idempotent — re-pasting them onto a file that already has Loom variables creates duplicate collections. Before a full rebuild on a used file, paste this reset into the console first:

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

Step `12` (text styles) runs the font-availability check and reports `✓`/`⚠` per family; a font this Figma can't render is substituted with Inter so the paste completes (see [`docs/gotchas.md`](docs/gotchas.md)).

---

## Repo layout

```
spec/                  Single source of truth
  config/
    base/              ← token configs, generated from questionnaire answers
    components/        ← hand-authored component schemas (8 group files)
    figma/             ← Figma variable-collection definitions
    presentation/      ← Figma documentation chrome (layout, templates)
  questionnaire.md     ← the tiered intake that drives base/ tokens
  answers.json         ← a worked example answer set

scripts/               The two codegen pipelines
  code-templates/      ← React catalog + tokens.css + scaffold
  figma-*/             ← Figma variables / styles / components
  assemble-figma.js    ← bundles the Figma plugin scripts
  resolve-picks.js     ← the picker's dependency resolver
  setup.sh             ← (repo root) installs picked atoms into a project

catalog/               Generated output — per-atom .tsx + .manifest.json + story
catalog-playground/    Next.js app that browses the whole catalog
docs/                  Design-system engineering docs (see below)
```

---

## How it's built

The full catalog model — surfaces, picker, manifests, override mechanism — is specified in [`CATALOG_SPEC.md`](CATALOG_SPEC.md); each atom's contract (dependencies, variants, tokens) lives in its `.manifest.json`. The hard-won traps behind the generator — Figma Plugin API, Tailwind v4 footguns, font parity, reduced-motion semantics — are in [`docs/gotchas.md`](docs/gotchas.md).

A note on generated code: some atoms with not-yet-wired Radix primitives carry an intentional `// TODO: wrap with <primitive>` marker in their generated output — those are deliberate fallback signals, not unfinished work.

---

## License

[MIT](LICENSE) © 2026 Jacob Ikola
