# Design System Pipeline

A token-first design system generator for a digital agency. Produces config JSONs, Figma variables/styles/components, CSS tokens, Tailwind theming, and React scaffolds — all from a tiered project questionnaire.

## Workflow

```
Questionnaire → Config JSONs → Figma (iterate with client) → Code Generation → Downstream Project
```

1. **Questionnaire** — fill out `spec/questionnaire.md` (3 tiers: intent, implementation, overrides)
2. **Generate configs** — `node scripts/generate-configs/index.js --input spec/answers.json` produces `spec/config/base/*.json`
3. **Assemble Figma scripts** — `node scripts/assemble-figma.js` (see Figma Scripts below)
4. **Build Figma file** — paste all 29 step scripts into the Figma console in order
5. **Iterate with client** — review in Figma, adjust configs, regenerate affected scripts, re-paste
6. **Generate code** — once design is approved, `node scripts/code-templates/orchestrator.js` produces `generated/`
7. **Push downstream** — `scaffold/setup.sh` bootstraps into the target Next.js project

Figma is the client-facing deliverable. Code generation happens last, after the design is locked.

## Central Config

Everything flows from `spec/config/`. Both pipelines (Figma + code) read from the same JSON files. Change a config → regenerate → both outputs update.

```
spec/config/
├── standards.json              ← locked universals (spacing scale, sizing, color roles, modes)
├── base/                       ← generated from questionnaire answers
│   ├── colors.json             ← palettes (50-900) + semantic roles (light/dark)
│   ├── spacing.json            ← 5 categories × default/compact
│   ├── sizing.json             ← border-radius semantic mappings
│   ├── typography.json         ← font families + 6 text style families × 3 tiers
│   └── effects.json            ← shadow values (flat or elevated)
├── components/                 ← hand-authored schemas (58 components across 7 files)
│   ├── button.json             ← button, icon-button, fab, badge, chip, toolbar, toggle, toggle-group
│   ├── form.json               ← text-field, input, select, textarea, date-picker, toggle-base, checkbox, radio, switch, combobox, slider, file-upload, input-otp, label, helper-text, calendar, input-group
│   ├── layout.json             ← card, dialog, alert-dialog, sheet, table, separator, scroll-area, resizable
│   ├── feedback.json           ← toast, banner, tooltip, popover, dropdown-menu, skeleton, progress-bar, empty-state, context-menu, hover-card, spinner
│   ├── data-display.json       ← avatar, list-item, accordion, kbd, collapsible
│   ├── navigation.json         ← top-bar, sidebar, tabs, bottom-nav, breadcrumbs, pagination, navigation-menu, command-palette
│   └── composite.json          ← stepper, carousel, tree-view
└── figma/                      ← Figma-specific presentation config
    ├── variable-collections.json
    ├── color-palette.json
    ├── layout.json
    └── templates.json
```

### What lives where

| File | Driven by | Changes when |
|------|-----------|-------------|
| `standards.json` | Nothing — locked | Never (universal primitives) |
| `base/*.json` | Questionnaire answers | Client changes brand color, font, density, edges, shadows |
| `components/*.json` | Hand-authored | Adding/modifying component variants, sizes, icon-slots, spacing |
| `figma/*.json` | Hand-authored | Changing documentation presentation (not client design) |

## The Questionnaire

Three tiers — each cascades into the next:

### Tier 1 — Intent
| Question | Drives |
|----------|--------|
| Product type (optional) | Suggests style direction defaults |
| Style direction | Pre-fills Tier 2 defaults (edges, density, shadows, type scale) |

### Tier 2 — Implementation
| Question | Drives |
|----------|--------|
| Primary color (hex) | Color palettes, all color roles |
| Secondary/accent color (optional) | Secondary + accent palettes |
| Font pairing (heading + body) | Typography config |
| Edge style (none / sharp / soft) | Border radius semantic mappings |
| Spacing density (compact / comfortable / airy) | Component-level spacing |
| Shadow depth (flat / elevated) | Shadow values (shadow-0 through shadow-3) |
| Type scale (compact / standard / dramatic) | Typography size presets |

All 55 active components ship by default. The full library goes downstream — projects use what they need.

## Figma Scripts

The Figma pipeline produces assembled JavaScript files that run in the Figma Plugin API console. Scripts live in `generated/figma-scripts/` after assembly.

### Full Pipeline: Fresh Build from Zero

#### Step 0 — Generate configs + assemble scripts

From `loom/`:

```bash
# 1. Edit answers file with project values
#    spec/answers.json

# 2. Generate base configs from answers
node scripts/generate-configs/index.js --input spec/answers.json

# 3. Assemble all Figma scripts (shared utils + 29 step scripts)
node scripts/assemble-figma.js
```

This writes 30 files to `generated/figma-scripts/`. Scripts are numbered in execution order. Step scripts are slim (1-20k chars) because shared utilities are loaded separately.

To see all scripts and their sizes: `node scripts/assemble-figma.js --list`

#### Step 0b — Clear the Figma file

Open the Figma file. Open the console: Plugins > Development > Open Console. Paste:

```javascript
(async () => {
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
    return "Cleared";
})()
```

#### Step 1 — Paste shared utils

Paste `00_shared-utils.js` first. This defines all helper functions in the global console scope. All subsequent scripts depend on it. If the console resets (page reload, crash), paste this again before continuing.

#### Step 2 — Paste step scripts in order

Paste each file one at a time. Wait for the return message before pasting the next. Files are numbered — go in order.

```
01_primitives_color.js          08_primitives_effects.js
02_primitives_spacing.js        09_semantics_color.js
03_primitives_radius.js         10_semantics_spacing.js
04_primitives_border-width.js   11_semantics_radius.js
05_primitives_component-height  12_styles_text-styles.js
06_primitives_icon-size.js      13_styles_effect-styles.js
07_primitives_typography.js     14_layout.js

15_templates.js                 23_layout-page.js
16_core-page.js                 24_feedback_1-components.js
17_buttons_1-standard.js        25_feedback_2-patterns.js
18_buttons_2-custom.js          26_data-display.js
19_forms_1-text-fields.js       27_navigation_1-structural.js
20_forms_2-toggles.js           28_navigation_2-utility.js
21_forms_3-extended.js          29_composite.js
22_forms_4-composed.js
```

**Total: 30 scripts (1 shared utils + 29 steps). Each returns a confirmation message on success.**

## Making Changes

### Changing a brand value (color, font, density, edges, shadows)

These live in `spec/config/base/*.json` and are generated from questionnaire answers.

1. Re-run `generate-configs` with new answers (or edit the JSON directly)
2. Reassemble scripts: `node scripts/assemble-figma.js`
3. In Figma: clear the affected variable collections, then paste the affected step scripts
4. Once approved: regenerate code (`node scripts/code-templates/orchestrator.js`)

| Change | Config file | Figma scripts to re-paste |
|--------|------------|--------------------------|
| Brand color | `base/colors.json` | `01` + `09` + all component pages (17-30) |
| Font swap | `base/typography.json` | `07` + `12` + all component pages (17-30) |
| Density | `base/spacing.json` | `10` + all component pages (17-30) |
| Edge style | `base/sizing.json` | `11` + all component pages (17-30) |
| Shadow depth | `base/effects.json` | `08` + `13` + all component pages (17-30) |

### Changing a component (variants, sizes, spacing, icon-slots)

These live in `spec/config/components/*.json` and are hand-authored.

1. Edit the component's config directly
2. Reassemble scripts: `node scripts/assemble-figma.js`
3. In Figma: paste the affected component page scripts — they clear and rebuild their own pages
4. Once approved: regenerate code

| Change | Example | Scripts to re-paste |
|--------|---------|---------------------|
| Add a variant | New button variant | `17` + `18` (both buttons scripts) |
| Change padding | Wider card padding | `23` (layout-page) |
| Add icon-slots | Icons on badge | `17` + `18` (both buttons scripts) |
| New component | Add to config JSON | Add build script + register in orchestrator |

### Changing Figma presentation (documentation layer)

These live in `config/figma/*.json` and affect how the design system is displayed, not the client's product.

1. Edit the figma config
2. `node scripts/figma-layout/orchestrator.js --output` (if layout.json changed)
3. `node scripts/figma-components/orchestrator.js --build templates --output` (if templates.json changed)
4. Paste affected scripts

## Clearing and Rebuilding

### Full reset (start from zero)

In Figma: delete all pages, all variable collections, all text styles, all effect styles. Then paste shared utils + all 29 step scripts in order.

Or use this clear script in the Figma console first:

```javascript
// Clear everything
const collections = figma.variables.getLocalVariableCollections();
for (const col of collections) col.remove();
for (const s of figma.getLocalTextStyles()) s.remove();
for (const s of figma.getLocalEffectStyles()) s.remove();
const pages = figma.root.children;
while (pages.length > 1) pages[pages.length - 1].remove();
while (pages[0].children.length > 0) pages[0].children[0].remove();
```

### Selective clear (rebuild one layer)

**Clear and rebuild primitives only:**
Delete the specific primitive collection in Figma's variable panel, then paste the replacement script. Downstream semantics that alias those primitives will update automatically.

**Clear and rebuild a component page:**
Just paste the component page script — each one clears its own page before building. No manual deletion needed.

**Clear and rebuild styles:**
Delete text styles or effect styles in Figma's style panel, then paste the styles scripts.

### Rebuild after config change

The most common operation during client iteration:

1. Edit `spec/config/base/*.json` or `spec/config/components/*.json`
2. `node scripts/assemble-figma.js`
3. Paste the affected step scripts in Figma (shared utils are already loaded)
4. Review visually
5. Repeat until approved

You do NOT need to clear collections when rebuilding primitives or semantics — the scripts create new collections. If a collection with the same name already exists, delete it first (Figma won't overwrite).

## Code Generation

Run after the Figma design is approved. Produces everything a downstream project needs.

```bash
node scripts/code-templates/orchestrator.js
```

`generated/` does not exist at rest. It is created on demand and contains:

| Output | Contents |
|--------|----------|
| `tokens.css` | CSS custom properties + dark mode + text family classes + Tailwind @theme |
| `components/` | 61 React .tsx scaffolds with variant/size class maps |
| `stories/` | 61 story definitions + registry.ts |
| `playground/` | ComponentPlayground.tsx |
| `scaffold/` | setup.sh, layout.tsx, ThemeProvider, ThemeToggle, globals.css, /design-system route |
| `figma-scripts/` | 30 assembled Figma Plugin API scripts |
| `HANDOFF.md` | Design system documentation for the downstream agent |
| `PRODUCT-CONTEXT.md` | Product decisions (IA, flows, routing) — if generated via skill |

### Bootstrapping a downstream project

```bash
# From generated/:
./scaffold/setup.sh ./path-to-frontend

# Then:
cd ./path-to-frontend
npm install lucide-react
npm run dev
# Visit /design-system
```

### Selective generation

```bash
node scripts/code-templates/orchestrator.js --only components   # one generator
node scripts/code-templates/orchestrator.js --only tokens       # just tokens.css
node scripts/code-templates/orchestrator.js --list              # show all generators
```

Available targets: `tokens`, `components`, `stories`, `playground`, `scaffold`, `handoff`

### Validation Workflow

Test the code pipeline in a real Next.js project before pushing downstream. This mirrors the Figma paste-and-check sequence — hand-fired, step-by-step, with observable output at each step.

#### Phase 0 — Generate + Deploy (one-time)

```bash
# 1. Generate code bundle
node scripts/code-templates/orchestrator.js

# 2. Create test project (skip if lab/ds-test already exists)
cd lab
npx create-next-app@latest ds-test --typescript --tailwind --eslint --app --src-dir --use-npm
cd ..

# 3. Scaffold into test project
bash generated/scaffold/setup.sh lab/ds-test

# 4. Install icon dependency
cd lab/ds-test && npm install lucide-react
```

#### Phase 1 — Build

```bash
cd lab/ds-test && npm run build
```

Each build error traces to a generator or config:

| Error type | Likely root | Fix location |
|------------|-------------|-------------|
| Import not found | Story import path or missing export | `generate-stories.js` or `generate-components.js` |
| Type error in component | Props interface or style map | `generate-components.js` |
| Type error in story | Control doesn't match component props | `generate-stories.js` |
| CSS parse error | Malformed token or @theme block | `generate-tokens-css.js` |
| Module not found | Path alias or scaffold wiring | `scaffold/` generators or tsconfig |

#### Phase 2 — Visual Verification

```bash
cd lab/ds-test && npm run dev
# Visit http://localhost:3000/design-system
```

For each component in the sidebar:
- Does it render without crashing?
- Do variant controls change appearance?
- Do size controls (sm/md/lg) change dimensions?
- Do icon toggles show icons? (if applicable)

Theme toggle check (light → dark → system):
- Do all semantic colors flip?
- Are surfaces, text, and borders distinguishable in both modes?
- Does the cycle work (light → dark → system → light)?

#### Phase 3 — Fix Cycle

Fix a generator → regenerate → re-deploy → rebuild. The `refresh-test.sh` script handles regeneration + re-deploy in one command.

```bash
# Full regenerate + re-deploy:
bash scripts/refresh-test.sh lab/ds-test

# Targeted (only regenerate one layer):
bash scripts/refresh-test.sh lab/ds-test --only components

# Then rebuild:
cd lab/ds-test && npm run build
```

#### Error Triage

| Symptom | Root cause | Fix | Regen target |
|---------|-----------|-----|-------------|
| TS error in component .tsx | Generator template | `generate-components.js` | `--only components` |
| TS error in story .ts | Story generator | `generate-stories.js` | `--only stories` |
| Component looks wrong | Variant/size style maps | `generate-components.js` or component config | `--only components` |
| Token value wrong | Token generator or config JSON | `generate-tokens-css.js` or `spec/config/base/*.json` | `--only tokens` |
| Tailwind class not resolving | @theme inline block | `generate-tokens-css.js` | `--only tokens` |
| Theme toggle broken | Scaffold template | `scaffold/theme-provider.js` | `--only scaffold` |
| Layout/routing broken | Scaffold template | `scaffold/layout.js` or `scaffold/design-system-page.js` | `--only scaffold` |
| Wrong text style on component | Text family binding | Registry in `shared.js` | `--only components` |

#### Validation Checklist

- [ ] `npm run build` passes with zero errors
- [ ] All 61 components render on `/design-system`
- [ ] Variant controls change appearance for all applicable components
- [ ] Size controls (sm/md/lg) change dimensions for all components
- [ ] Icon toggles render icons (icon-slot components)
- [ ] Theme toggle cycles light → dark → system
- [ ] Semantic colors flip correctly in both modes
- [ ] Surface levels (surface, surface-1, surface-2, surface-3) visually distinct
- [ ] Typography renders correct font, weight, and size per family/tier
- [ ] Token values match Figma output (spot-check primary, spacing, radius)

## Key Concepts

**Standards vs. Directions**: `standards.json` holds values that never change (spacing scale, icon sizes, touch targets, color role structure, dark mode mappings). `direction-mappings.json` holds values that shift based on questionnaire answers.

**Tier cascade**: Product type suggests a style direction. Style direction pre-fills implementation defaults. User overrides any value that doesn't fit.

**Sizing rule**: All components define sm, md, lg sizes. No gaps — prevents mismatched sizing when composing components.

**Semantic variant model**: Buttons use semantic variants (default, secondary, destructive, success, warning) — variant implies color. Icon-button includes ghost as default for structural actions.

**$base inheritance**: Components like input, select, combobox extend text-field. Checkbox/radio extend toggle-base. Change the base, all inheritors update.

**Icon-slots**: Button, Badge, Chip, Toggle, Toast, Banner, and text-field-derived components support optional leading/trailing icons via boolean toggles in Figma and optional props in code.

**Component spacing shape**: Every component config defines `x-padding`, `y-padding`, and `gap`. Enforced across all component files.

**Surface elevation**: `surface` (page bg), `surface-1` through `surface-3` (progressive elevation). Four levels, each clearly distinguishable.

**Brightness modes**: Light and dark are equal mapping schemes in `standards.json`. `default-mode` determines which loads first.
