# Scripts

102 JS files across 10 directories. Two pipelines: **code generation** (produces `generated/` bundle) and **Figma generation** (produces variables, styles, components in a Figma file via MCP).

## Code Pipeline

```
generate-configs/          questionnaire answers → config JSONs
                           Entry: node generate-configs/index.js

code-templates/            config JSONs → generated/ bundle
                           Entry: node code-templates/orchestrator.js
  ├── orchestrator.js      Runs all generators, writes to generated/
  ├── shared.js            Config loading, Tailwind mappers, component registry
  ├── generate-tokens-css  tokens.css (CSS vars + text family classes + @theme)
  ├── generate-components  components/*.tsx (text-{family}-${size} interpolation)
  └── generate-handoff     HANDOFF.md
```

## Figma Pipeline

Executed via MCP `use_figma` tool. Each directory has an `orchestrator.js` that assembles scripts from config + templates. Scripts run in this order:

```
1. figma-primitives/       Primitive variable collections (color, spacing, radius, etc.)
                           One script per collection. Orchestrator assembles + injects config.

2. figma-semantics/        Semantic variable collections (color with light/dark modes, spacing, radius)
                           References primitive variables via aliases.

3. figma-styles/           Text styles + effect styles
                           Text styles: 6 families × 3 tiers (action/sm, title/lg, etc.)
                           Bound to primitives.typography variables.

4. figma-layout/           Documentation layout variables (frame colors, spacing, accent)
                           Independent of project design system — presentation layer only.

5. figma-components/       Component builds, batched per page
                           Entry: node figma-components/orchestrator.js --build <page>
   ├── utils/              Shared code inlined into assembled scripts
   │   ├── lookups.js      Variable collection lookups
   │   ├── resolvers.js    Config value → Figma path resolution + font weight mapping
   │   ├── frames.js       Base/preview frame builders
   │   ├── reflow.js       Canvas layout
   │   └── builders/
   │       ├── standard.js Label-in-box components (binds textStyleId from descriptor.textFamily)
   │       └── toggle.js   Binary controls (checkbox, radio, switch)
   ├── templates/          Core page templates (header, alert-banner, try-me, divider, icons)
   ├── buttons/            Button, Badge, Chip descriptors + Icon Button, FAB custom builders
   ├── forms/              Input, Select, Textarea, etc. descriptors + custom builders
   ├── feedback/           Toast, Alert descriptors + pattern mocks
   ├── data-display/       Kbd, Avatar + pattern mocks
   ├── navigation/         Pattern mocks (top-bar, sidebar, tabs, etc.)
   └── composite/          Pattern mocks (stepper, carousel, etc.)

6. figma-icons/            Icon components (Lucide SVGs as Figma components)
                           Called by figma-components/templates, not run standalone.
```

## Text Style Binding

**Rule: every text node must bind a Figma text style via `applyTextStyle(node, family, tier)`.** No raw `fontSize`/`lineHeight` — the pipeline eats its own dog food. Text styles are created in step 12 (`text-styles.js`) and available to all subsequent scripts.

Standard builder components use `textFamily` from their descriptor. Pattern mocks call `applyTextStyle` directly. The only exception is Avatar initials (line-height = font-size for centering).

### Family mapping

| Family | Standard builder | Pattern mocks |
|--------|-----------------|---------------|
| action | Button, Label, Toast, Alert | Tabs triggers, toggles, menu items, links, accordion triggers |
| label  | Badge, Chip, HelperText, Kbd | Tier annotations, tooltips, shortcuts, steppers, bottom-nav |
| body   | — | Content text, descriptions, table data, calendar days |
| title  | — | Dialog/card/sheet titles, top-bar, headings |
| input  | Input, Select, Date Picker, Textarea | Search fields, OTP digits |
| display | — | (not used in pattern mocks) |

## Font Weight Mapping

Default mapping (covers most Google Fonts): 400→Regular, 500→Medium, 600→SemiBold, 700→Bold.

Only fonts with non-standard Figma style names need overrides in `FONT_WEIGHT_OVERRIDES` (defined in `resolvers.js` and `text-styles.js`):

| Font | Override | Reason |
|------|----------|--------|
| JetBrains Mono | 600→Medium | No SemiBold weight |
| Inter | 600→Semi Bold | Space in style name |
| Space Grotesk | 600→Bold | No 600 weight (jumps 500→700) |

If Figma's `loadFontAsync` throws for a new font, add an override entry for the failing weight.
