# Loom

Token-driven design system generator + Figma pipeline. Produces config JSONs, Figma variables/styles/components, CSS tokens, and React scaffolds from a tiered project questionnaire.

**Consumed by:** any Next.js + Tailwind v4 project (atoms install via `setup.sh`)

## What to Load

| Task | Load These |
|------|-----------|
| Full system overview | `README.md` |
| Start a new project | `README.md` (Workflow section) + `spec/questionnaire.md` |
| Modify configs | `README.md` (Making Changes section) + config JSONs in `spec/config/` |
| Build/rebuild Figma | `README.md` (Figma Scripts + Clearing and Rebuilding sections) |
| Generate code bundle | `README.md` (Code Generation section) |
| Validate code pipeline | `README.md` (Validation Workflow section) |
| Refresh test project | `bash scripts/refresh-test.sh <project-dir>` |

## Workflow Summary

```
Questionnaire → Config JSONs → Figma (iterate with client) → Code Generation → Downstream
```

Figma first. Code gen last. Both pipelines read from the same `spec/config/` directory.

## Generation Commands

### Figma scripts (assemble to `generated/figma-scripts/`)

```bash
node scripts/assemble-figma.js
```

30 scripts (1 shared utils + 29 steps). Paste `00_shared-utils.js` first, then step scripts in order. See `README.md` for full execution order.

### Code bundle (produces `generated/`)

```bash
node scripts/code-templates/orchestrator.js
```

`generated/` does not exist at rest — created on demand when producing output for a downstream project.

| Generator | Output | Selective command |
|-----------|--------|-------------------|
| tokens | `generated/tokens.css` | `--only tokens` |
| components | `generated/components/*.tsx` (67 scaffolds) | `--only components` |
| scaffold | `generated/scaffold/` (init.sh, layout, theme, globals) | `--only scaffold` |
| handoff | `generated/HANDOFF.md` | `--only handoff` |

## Config Architecture

```
spec/config/
├── standards.json          ← locked universals (never changes per project)
├── base/                   ← generated from questionnaire answers
│   ├── colors.json         ├── spacing.json
│   ├── sizing.json         ├── typography.json
│   └── effects.json
├── components/             ← hand-authored (67 atoms across 8 files)
│   ├── button.json         ├── form.json         ├── layout.json
│   ├── feedback.json       ├── data-display.json  ├── navigation.json
│   ├── composite.json      └── motion.json
├── figma/                  ← Figma variable-collection definitions
│   ├── variable-collections.json  └── color-palette.json
└── presentation/           ← documentation layout + templates (Figma chrome)
    ├── layout.json                └── templates.json
```

## Quick Reference — Making Changes

| Change | Edit | Then |
|--------|------|------|
| Brand color | `config/base/colors.json` | Reassemble + paste `primitives_color` + `semantics_color` + component pages |
| Font | `config/base/typography.json` | Reassemble + paste `primitives_typography` + `styles_text-styles` + component pages |
| Component variant/size/spacing | `config/components/*.json` | Reassemble + paste that component's page script |
| Full reset | — | Clear all in Figma (see README), paste shared utils + 29 step scripts |

See `README.md` Making Changes and Clearing and Rebuilding sections for full details.

## Design Rules

- **All components have sm, md, lg sizes** — no gaps
- **Orthogonal variant × color where an atom spans colors** — `variant` is visual treatment (filled/outline/ghost), `color`/`state` is severity/brand; the two are **truly independent CVA axes** (Button, Badge). Mechanism: the color axis sets four CSS vars (`--v-bg`/`--v-fg`/`--v-text`/`--v-border`) declared once per color; each treatment is a fixed consumer of those vars (shared `TREATMENT_CLASSES` + `buildColorVars` in `shared.js`). No N×M compound matrix — adding a color or treatment is one line. Single-color atoms (FAB, Toggle, ToggleGroup, Toolbar) stay semantic-default — the color axis is opt-in, not forced. (Retires the old "variant implies color" rule.)
- **$base inheritance** — input/select/combobox extend text-field; checkbox/radio extend toggle-base
- **Icon-slots** — Button, Badge, Toggle, Toast, Banner support optional leading/trailing icons
- **Component spacing shape** — every component defines x-padding, y-padding, gap

## How to Continue

1. Read `README.md` for the full operations manual
2. Figma MCP gotchas: `docs/design-system/figma-mcp.md`
