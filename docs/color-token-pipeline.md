# Color Token Pipeline: Config → Component → Playground

## The Flow

```
button.json (config)
  ↓  colorToClass() in shared.js
  ↓  buildVariantStyles() in shared.js
  ↓  generateButton() / buildCvaString() in generate-components.js
  ↓
Button.tsx (generated component)
  ↓
ComponentPlayground.tsx (generated playground)
```

## Step-by-step

### 1. Config (source of truth)

`spec/config/components/button.json`

```json
"default": { "bg": "color/primary/primary", "fg": "color/primary/on-primary" }
```

The path format is: `color/{role-group}/{token-name}`

### 2. Token → Tailwind class

`scripts/code-templates/shared.js` — `colorToClass()`

Extracts the **last segment** of the path and prepends the CSS prefix:

```
colorToClass("color/primary/on-primary", "text")
→ last segment: "on-primary"
→ output: "text-on-primary"

colorToClass("color/primary/primary", "bg")
→ last segment: "primary"
→ output: "bg-primary"
```

### 3. Variant object → class string

`scripts/code-templates/shared.js` — `buildVariantStyles()`

Iterates each variant, calls `colorToClass` for bg and fg, joins them:

```
{ bg: "color/primary/primary", fg: "color/primary/on-primary" }
→ "bg-primary text-on-primary"
```

### 4. Class strings → CVA definition

`scripts/code-templates/generate-components.js`

- **Button** uses `generateButton()` (special-cased for iconOnly + icon-sizes)
- **Everything else** uses `buildCvaString()` → `generateCvaOnly()` or `generateRadix()`

Output in Button.tsx:
```tsx
variant: {
  default: 'bg-primary text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  destructive: 'bg-error text-on-error',
  ...
}
```

### 5. Tailwind class → CSS custom property

`generated/tokens.css`

Tailwind resolves `text-on-primary` via the color mapping layer:

```css
/* Mapping layer (theme-independent) */
--color-on-primary: var(--on-primary);

/* Dark mode (default) */
:root { --on-primary: #132d3a; }

/* Light mode */
[data-theme="light"] { --on-primary: #FFFFFF; }
```

### 6. Playground

`scripts/code-templates/generate-playground.js` → `generated/playground/ComponentPlayground.tsx`

Reads the same registry from `shared.js` → `getComponentRegistry()`. Variant names and size names are pulled from the config to generate the controls.

## Two legitimate color patterns

| Pattern | Background | Foreground | Use case |
|---------|-----------|------------|----------|
| **Filled** | `{role}` | `on-{role}` | CTAs, filled buttons, indicators |
| **Container** | `{role}-container` | `on-{role}-container` | Badges, chips, toggles, soft fills |

Both adapt per theme. Never mix them within a single variant axis. Never use `color/common/on-color` (static white, does not adapt).

## Key files

| File | Role |
|------|------|
| `spec/config/components/*.json` | Source of truth for all component colors |
| `spec/config/base/colors.json` | Palette + role definitions (light/dark) |
| `scripts/code-templates/shared.js` | `colorToClass`, `buildVariantStyles`, registry |
| `scripts/code-templates/generate-components.js` | Config → .tsx generation |
| `scripts/code-templates/generate-tokens-css.js` | Config → tokens.css generation |
| `generated/tokens.css` | CSS custom properties (consumed by Tailwind) |
| `generated/components/*.tsx` | Generated components (do not edit) |
