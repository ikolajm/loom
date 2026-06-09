# Scaffold Playground & Stories Patterns

Patterns surfaced while integrating the design system scaffold into Paperboy. Captured from `paperboy/docs/UPSTREAM_V1.md` so future generations and future projects bake these in from the start.

These apply to any generator that produces a component playground + Storybook-style story definitions consumed by an in-page design system browser.

## Integration procedure (three steps)

The scaffold lands in three steps:

1. Generate the bundle in the design-system repo (`tokens.css`, `atoms/`, `stories/`, `playground/`, `providers/`)
2. Copy the output into the target project's `frontend/src/`
3. Import `tokens.css` in the project's `globals.css`:
   ```css
   @import "tailwindcss";
   @import "../tokens.css";
   ```

`tokens.css` lives at `src/tokens.css` directly — no intermediate `generated/` directory. Flat path, fewer indirections.

## Bug patterns + fixes

### 1. Playground state bleed between stories

**Symptom:** Switching from one story to another keeps the previous story's prop values in the controls panel. A Button configured as `variant="destructive"` carries that state into the next component.

**Root cause:** `ComponentPlayground` uses `useState(story.defaultProps)`, which only initializes once. React doesn't re-initialize state when props change.

**Fix:** Add `key={storyKey}` to the `<ComponentPlayground>` element. React fully remounts when the key changes, resetting all state.

```tsx
<ComponentPlayground key={active} story={stories[active]} />
```

### 2. Void element children crash

**Symptom:** Playground crashes when rendering void elements (`<Input>`, `<Separator>`, `<Slider>`) — React errors about passing children to elements that don't accept them.

**Root cause:** The generated playground rendered all components uniformly with `{children}`, but void HTML elements can't receive children.

**Fix:** `resolveIconProps()` utility separates children from rest props. When `iconOnly` is active, replaces children with a placeholder icon element. Conditionally hides text/icon controls when they're incompatible with the current prop state.

```tsx
const hideWhenIconOnly = ['children', 'showLeadingIcon', 'showTrailingIcon'];
if (props.iconOnly && hideWhenIconOnly.includes(control.prop)) return null;
```

### 3. Selection components render empty

**Symptom:** Select, Combobox, and DropdownMenu components show empty dropdowns in the playground.

**Root cause:** The generated story definition doesn't include sample `<SelectItem>` children. Selection-type components are useless in a playground without sample items.

**Fix:** Stories for selection-type components must ship with sample items baked into the story definition — either in `defaultProps` or rendered directly by the story component wrapper.

## Improved patterns

### Icon prop convention

Stories use boolean controls (`showLeadingIcon`, `showTrailingIcon`) that map to ReactNode props (`leadingIcon`, `trailingIcon`) at render time. This avoids needing a ReactNode picker in the playground UI.

```tsx
function resolveIconProps(props: Record<string, any>): Record<string, any> {
  const resolved = { ...props };
  if (resolved.iconOnly) {
    resolved.children = createElement(Star, { size: 16 });
  }
  for (const key of Object.keys(resolved)) {
    if (key.startsWith('show') && key.endsWith('Icon') && resolved[key] === true) {
      const realProp = key.slice(4, 5).toLowerCase() + key.slice(5);
      resolved[realProp] = createElement(Star, { size: 16 });
      delete resolved[key];
    } else if (key.startsWith('show') && key.endsWith('Icon')) {
      delete resolved[key];
    }
  }
  return resolved;
}
```

### Functional category grouping (not atomic levels)

The original scaffold organized the design system page by atomic level (Atoms → Molecules). In practice that wasn't useful. Functional categories are better for browsing:

- **Actions** — Button, FAB, Badge, Chip, Toggle, ToggleGroup
- **Inputs** — Input, Select, Textarea, DatePicker, Checkbox, Radio, Switch, Combobox, Slider, FileUpload, InputOTP, Label, HelperText, FormField, Calendar
- **Layout** — Card, Dialog, Table, Sheet, Separator, AlertDialog
- **Feedback** — Toast, Banner, Tooltip, Popover, DropdownMenu, Skeleton, ProgressBar, EmptyState, ContextMenu, HoverCard, Spinner
- **Data Display** — Avatar, ListItem, Accordion, Kbd, Collapsible
- **Navigation** — TopBar, Sidebar, Tabs, BottomNav, Breadcrumbs, Pagination, NavigationMenu, CommandPalette
- **Composite** — Stepper, Carousel, TreeView

Future generations should use these as `storyCategories` and in the design system page sidebar. When building a form you look under Inputs, not "which atomic level is a datepicker?"

### Molecules directory pattern

The scaffold creates a `components/molecules/` directory. In practice it stays empty — downstream composed components are domain-specific (`digest/shell`, `digest/news`, `digest/scores`) rather than generic composites.

Keep `molecules/` as an empty scaffold directory for projects that need it, but don't expect it to be used universally. See [[pipeline-architecture]] — molecules are project-owned, never generated.

## Related

- [pipeline-architecture.md](pipeline-architecture.md) — the architecture pattern these scaffold patterns serve
- [codegen-pattern.md](codegen-pattern.md) — R&D-then-mechanize workflow
- [color-layers.md](../../../knowledge/design/patterns/color-layers.md) — extending generated tokens with project-specific color systems
