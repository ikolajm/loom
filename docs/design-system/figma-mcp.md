# Figma Plugin API via MCP

Operational reference for working with the Figma Plugin API through MCP — data formats, gotchas, and validated patterns.

## Data formats

- **Color values are 0–1 floats**, not 0–255. Hex `#3B82F6` → `{ r: 0.231, g: 0.51, b: 0.965, a: 1 }`
- **Line height takes an object:** `{ value: 24, unit: "PIXELS" }`, not a bare number
- **Letter spacing takes an object:** `{ value: 0.01, unit: "PERCENT" }` or `{ value: 0.16, unit: "PIXELS" }`
- **Font weight binding uses FLOAT** (400, 500, 600, 700), not STRING ("Regular", "Medium")

## Font loading

- Must `await figma.loadFontAsync(...)` before setting any font-dependent properties
- Font style names are font-specific:
  - Inter: "Semi Bold" (with space), "Extra Bold" (with space)
  - JetBrains Mono: no SemiBold at all (600 → "Medium"), no ExtraBold
  - Source Sans 3: "SemiBold" (no space)
  - Cinzel: 500→Regular, 600→Bold (no SemiBold available)
- **Always load Inter Regular as fallback.** Figma uses it for default text nodes — `figma.createText()` requires Inter Regular loaded before `.characters` can be set, even if you'll override the font afterward.

## Script limits and architecture

- `use_figma` code has a **50,000 character max**. Batch large operations across multiple calls.
- A naive utils block (~10k chars) repeats in every call — stateless execution, unavoidable in a single-script approach.
- **Shared utils architecture:** paste utils once at session start, then run small step scripts that reference globals. 50–70% size reduction per script. See the `assemble-figma.js` orchestrator pattern.
- Variable IDs are session-specific. Get references in the same script — don't hardcode IDs across runs.
- Console scope collisions between scripts are real. Wrap step scripts in async IIFEs.
- **Re-pasting the shared-utils bundle throws `redeclaration of const X` and *silently halts*.** The console scope persists across pastes, and top-level `const`/`let` can't be redeclared — so on a second paste of `00`, execution dies at the first collision and every helper defined *below* it never reloads (a fix you just made silently won't take). `assemble-figma.js` emits the bundle with top-level `const`/`let` rewritten to `var` so re-pastes redefine cleanly. The one exception: the first hop *out of* a `const`-era session still needs a console reload, because a `var` can't redeclare an existing `const` of the same name. After that, re-pasting `00` after a utils edit is friction-free — no reload, no re-pasting 01–16 (the file keeps its variables/styles/components).

## API quirks

- **`setBoundVariable()` does NOT work on effect styles.** Must set `boundVariables` directly on the effect object within the effects array, then reassign the whole array.
- **`clipsContent` on frames clips shadows.** Set `clipsContent = false` on all documentation/section frames where shadows need to be visible.
- **`figma.currentPage` is read-only.** Use `await figma.setCurrentPageAsync(page)` instead.
- **Mode limits on free plans.** Free Figma accounts may only allow 1 mode per collection.
- **No shadow variables.** Shadows are effect styles only. Individual shadow properties (offsetY, blur, spread) CAN be bound to FLOAT variables.
- **`primaryAxisSizingMode` enums** — `'FILL'` is invalid; use `'FIXED'`, `'AUTO'`, or layout sizing on parent frame.
- **Text overflow inside fixed parents** — `textAutoResize` won't help. Set `layoutSizingHorizontal = 'FILL'` on the text node instead.

## Validated patterns

| Pattern | Mechanism |
|---------|-----------|
| Variable aliasing across collections | `setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: var.id })` |
| Text style binding | `style.setBoundVariable("fontSize", var)` — works for fontSize, lineHeight, fontFamily, fontWeight |
| Effect style binding | Set `boundVariables` on effect object, reassign array to style |
| Code syntax | `variable.setVariableCodeSyntax("WEB", "var(--name)")` |
| Component boolean properties | `comp.addComponentProperty(name, 'BOOLEAN', default)` + `node.componentPropertyReferences = { visible: propKey }` |
| Slash naming = folder grouping | `color/primary/500` groups as `color/ > primary/ > 500` in Variables panel |
| Shared utils | Paste utils block once, step scripts reference globals via async IIFE |

## Component page conventions

- Each component gets a **base + preview frame pair**, stacked vertically with 64px gap
- Base frame: Header LG + component set (vertical layout, 8px itemSpacing)
- Preview frame: Header LG (no description) + interactive preview with default instance
- Floating panels (dropdown, popover) match the radius of their trigger when adjacent
- Pattern mocks show md size only — size variation proven by atomic components
- All documentation frames use `clipsContent = false`
- Tier labels (sm/md/lg) use `layout/spacing/label-gap` (8px) and `layout/page-foreground-muted` via wrapper frames — not raw text dumped into section-gap spacing

## Related

- [pipeline-architecture.md](pipeline-architecture.md) — the design system pipeline this is part of
