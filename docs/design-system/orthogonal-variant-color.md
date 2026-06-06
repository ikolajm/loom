# Orthogonal variant × color via CSS-var axes

How Loom expresses an atom that spans **two independent style axes** — a *treatment* (filled / outline / ghost) and a *color* (primary / destructive / neutral / …) — without the N×M blowup. Used by `Button` and `Badge`; the mechanism lives in `shared.js` (`buildColorVars` + `TREATMENT_CLASSES`).

## The failure mode it avoids

The obvious CVA encoding crosses the two axes with `compoundVariants` — one row per (treatment, color) cell:

```ts
compoundVariants: [
  { variant: 'filled',  color: 'primary',     class: 'bg-primary text-on-primary' },
  { variant: 'outline', color: 'primary',     class: 'border-primary text-primary' },
  // … 3 treatments × 6 colors = 18 hand-maintained rows, per atom
]
```

It works, but it's **N×M**: adding a color touches every treatment, the output is a wall of rows, and the two axes aren't actually independent (each cell is bespoke). A consumer who *owns* the file (shadcn-style) inherits the wall.

## The pattern: color sets vars, treatment consumes them

Make the two axes genuinely independent. The **color axis sets CSS variables**; the **treatment axis is a fixed consumer** of them. `transparent` carries the outline/ghost cases. No compound matrix — `variant` and `color` concatenate.

```ts
variants: {
  variant: {                                    // treatment — fixed consumers (TREATMENT_CLASSES)
    filled:  'bg-[color:var(--v-bg)] text-[color:var(--v-fg)]',
    outline: 'bg-transparent border border-[color:var(--v-border)] text-[color:var(--v-text)]',
    ghost:   'bg-transparent text-[color:var(--v-text)]',
  },
  color: {                                       // color — sets the vars (buildColorVars)
    primary: '[--v-bg:var(--primary)] [--v-fg:var(--on-primary)] [--v-text:var(--primary)] [--v-border:var(--primary)]',
    neutral: '[--v-bg:var(--neutral)] [--v-fg:var(--on-neutral)] [--v-text:var(--on-surface)] [--v-border:var(--outline)]',
    // … one line per color
  },
}
```

**N+M, not N×M.** Adding a color is one line; adding a treatment is one line. Each color declared once.

## The four-var contract

Three vars aren't enough — a single "accent" can't serve both the border and the text where they diverge. Four:

| Var | Drives | Filled uses | Outline/ghost use |
|---|---|---|---|
| `--v-bg` | solid fill background | ✓ | — (transparent) |
| `--v-fg` | text on the solid fill | ✓ | — |
| `--v-text` | line/label text color | — | ✓ |
| `--v-border` | outline border color | — | ✓ |

This split is what lets the special cases stay declarative, one color-line each:
- **Button `neutral`** — subtle line, readable text: `--v-text: on-surface`, `--v-border: outline` (not the same token).
- **Badge** — `filled` wants the *container* color but `outline`/`dot` want the *base*: `--v-bg: primary-container`, `--v-border: primary`. Same treatment vocabulary, different color values.

## Config shape

The per-component JSON declares the axes, not the cross product:

```json
"treatments": ["filled", "outline", "ghost"],
"colors": {
  "primary": { "bg": "color/primary/primary", "fg": "color/primary/on-primary",
               "text": "color/primary/primary", "border": "color/primary/primary" },
  "neutral": { "bg": "color/neutral/neutral",  "fg": "color/neutral/on-neutral",
               "text": "color/surface/on-surface", "border": "color/outline/outline" }
}
```

`buildColorVars` emits the var-declaration class per color; the template pulls its treatment strings from the shared `TREATMENT_CLASSES`.

## Gotchas

- **Reference `var(--role)`, not `var(--color-role)`.** Loom's `@theme` block is `@theme inline`, which inlines theme values into utilities and does **not** register `--color-*` on `:root`. The runtime variables are the bare role tokens (`--primary`, `--on-surface`, `--outline`). `var(--color-primary)` resolves to nothing.
- **Use the `[color:…]` hint** in arbitrary utilities (`bg-[color:var(--v-bg)]`) so Tailwind types it as a color; and the var-declaration form is an arbitrary *property* (`[--v-bg:var(--primary)]`).
- **One compound legitimately survives** — Badge's `dot × size` (a circle's dimensions genuinely depend on both). The point isn't "zero compounds," it's "no compound *matrix* for the color cross-product."

## When to reach for it

Only when an atom **genuinely spans colors**. Single-color atoms (FAB, Toggle, ToggleGroup, Toolbar) stay semantic-default — the color axis is **opt-in per atom**, not a catalog-wide mandate. Forcing the axis onto a one-color atom is speculative generality.

## Related

- [pipeline-architecture](pipeline-architecture.md) — config → CVA → tokens; this is how the CVA layer handles two style axes
- [tokens-as-tailwind-utilities](tokens-as-tailwind-utilities.md) — why role tokens are reachable as utilities (and the `@theme inline` detail behind the var-reference gotcha)
- [shadcn-style-catalog-pattern](shadcn-style-catalog-pattern.md) — atoms are consumer-owned, so output readability (N+M over N×M) is load-bearing
