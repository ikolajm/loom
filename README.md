# Loom

A token-driven design system generator. One config source produces two synchronized outputs — a **Figma file** (variables, styles, components) and a **React component catalog** (67 atoms on a shared token foundation) — so the design surface and the code surface never drift from each other.

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
   Figma variables /            catalog/  →  67 React atoms
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

67 atoms across 8 groups, each generated as a `.tsx` component + a `.manifest.json` (its dependency/variant contract) + a story file:

| Group | Atoms |
|-------|-------|
| **Buttons** | button, badge, dot, fab, fab-menu, toggle, toggle-group |
| **Forms** | input, select, textarea, checkbox, radio, switch, slider, combobox, date-picker, calendar, time-picker, file-upload, input-otp, label, helper-text, form-field, rating, search-bar |
| **Layout** | card, dialog, alert-dialog, sheet, table, separator, toolbar |
| **Feedback** | toast, banner, tooltip, popover, dropdown-menu, context-menu, hover-card, skeleton, spinner, progress-bar, empty-state |
| **Data display** | avatar, avatar-group, list-item, accordion, collapsible, kbd, number, relative-time, video-player |
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

Requires Node ≥ 18.18.

### Browse the catalog

The catalog playground is a Next.js app that picks every atom and renders them with prop controls:

```bash
cd catalog-playground
npm install
npm run dev          # → http://localhost:3000
```

### Use Loom in a project

Consumption is shadcn-style — declare what you want, copy it in. Bring your own Next.js + Tailwind v4 project (with `src/app/`); two commands, two jobs.

```bash
# 1. Bootstrap the app shell once — ThemeProvider, root layout + fonts, globals,
#    token substrate, and core deps. Generate the scaffold, then run init.sh:
npm run generate
./generated/scaffold/init.sh /path/to/your-project

# 2. In your project, declare the atoms you want in loom-picks.json:
#    { "loom": { "version": "2026-06-04", "picks": ["button", "card", "combobox"] } }

# 3. From the Loom repo, sync the picked atoms in (re-run anytime to resync):
./setup.sh /path/to/your-project
```

`init.sh` is the one-time app-shell step (atom-agnostic). `setup.sh` is the repeatable atom sync: it resolves each pick's dependencies transitively from its manifest (picking `combobox` pulls in `popover` + `form-field`), copies just those atoms into `your-project/src/components/`, and delivers a freshly generated `tokens.css` substrate. It prints the `npm install` line for the packages those atoms import — your project owns its lockfile, so Loom reports deps rather than installing them. Atoms require **Tailwind v4** + `@tailwindcss/postcss` and **`tailwind-merge` ≥ 3** (the generated `cn()` registers the token scales via tailwind-merge's v3 `theme` keys, so v2 silently breaks className overrides).

Fonts come from the questionnaire (`heading` / `body`) and load via a runtime Google Fonts `<link>` in the generated `layout.tsx` — use Google Fonts family names; an unrecognized name falls back to system sans rather than breaking the build (edit `layout.tsx` to self-host). Google Fonts and Figma's font set aren't 1:1, so the Figma typography paste reports availability and substitutes Inter for any font it can't render; pick from [`spec/parity-safe-fonts.json`](spec/parity-safe-fonts.json) for guaranteed design↔code parity.

### Regenerate from config

Both pipelines read `spec/config/`. After editing a token or a component schema:

```bash
npm run configs      # regenerate base token configs from spec/answers.json
npm run generate     # regenerate the code catalog (catalog/ + tokens.css)
npm run figma        # assemble the Figma plugin scripts (paste into Figma console)
```

`node scripts/code-templates/orchestrator.js --list` shows the individual generators (`tokens`, `components`, `scaffold`, `handoff`, …); `--only <target>` runs one.

### Apply the Figma scripts

`npm run figma` writes 30 scripts to `generated/figma-scripts/` — `00_shared-utils.js` (global helpers) + `01`–`29` step scripts (each a self-contained async IIFE). To build the Figma file:

1. Open the target Figma file and open a plugin **console** (any dev plugin → Plugins → Development → Open console).
2. Paste **`00_shared-utils.js` first** — it defines the helpers the steps reference.
3. Paste the step scripts **`01` → `29` in numeric order**. Re-running a single page later only needs its own step script re-pasted (see [`CONTEXT.md`](CONTEXT.md) for the per-change subset).

Step `12` (text styles) runs the font-availability check and reports `✓`/`⚠` per family; a font this Figma can't render is substituted with Inter so the paste completes (see [`docs/design-system/fonts.md`](docs/design-system/fonts.md)).

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

The deeper architecture lives in [`docs/design-system/`](docs/design-system/index.md):

- [`pipeline-architecture.md`](docs/design-system/pipeline-architecture.md) — the three-layer model (config → CVA → Radix/lib), config-as-truth, component ownership
- [`shadcn-style-catalog-pattern.md`](docs/design-system/shadcn-style-catalog-pattern.md) — the catalog + per-project picker model
- [`orthogonal-variant-color.md`](docs/design-system/orthogonal-variant-color.md) — the independent treatment × color axes
- [`tokens-as-tailwind-utilities.md`](docs/design-system/tokens-as-tailwind-utilities.md) — registering token vars in Tailwind v4 `@theme`
- [`figma-mcp.md`](docs/design-system/figma-mcp.md) — Figma Plugin API gotchas and validated patterns

The full catalog model is specified in [`CATALOG_SPEC.md`](CATALOG_SPEC.md); the per-atom design decisions (every keep / change / drop) are logged in [`CATALOG_AUDIT.md`](CATALOG_AUDIT.md).

A note on generated code: some atoms with not-yet-wired Radix primitives carry an intentional `// TODO: wrap with <primitive>` marker in their generated output — those are deliberate fallback signals, not unfinished work.

---

## Status

Solo project, v2, catalog content-complete. The Figma pipeline runs by pasting assembled scripts into the Figma plugin console (there's no published plugin). Deferred: wider motion families (behind an animation-library adoption decision) and motion-in-Figma.

## License

[MIT](LICENSE) © 2026 Jacob Ikola
