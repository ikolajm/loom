# Tokens as Tailwind v4 utilities

For tokens-driven design systems to actually get used, the tokens must be ergonomic. In Tailwind v4, that means registering them in an `@theme` block so they generate utility classes alongside the built-ins. Without this step, tokens are technically available as CSS variables but practically ignored because the syntax to use them is ugly enough that engineers default to `bg-black/N` instead.

## The failure mode

A typical token pipeline (Loom, Material Design 3, or hand-rolled) emits a CSS file with role tokens as variables:

```css
:root {
  --surface: #181a1b;
  --on-surface: #e4e6e7;
  --primary: #4da7ff;
  --outline-subtle: #474d52;
}
```

Available, semantically correct, fully theme-aware. But in Tailwind v4, using them in components requires the arbitrary-value syntax:

```jsx
<div className="bg-[color:var(--surface)] border border-[color:var(--outline-subtle)]" />
```

That syntax is:
- Verbose (28 characters for one bg vs. 7 for `bg-black`)
- Hard to remember (which var name? which casing?)
- Hard to compose with opacity (`bg-[color:var(--surface)]/40` works but is even uglier)
- Slow to type

So the engineer reaches for `bg-black/40`, `border-white/10`, `text-white` instead. Fast, reflexive, ergonomic — and tokens never get used. The whole point of having a tokens-driven design system is silently abandoned at the call site.

This is real-world. Every component written in a Loom downstream project before this pattern was adopted defaulted to raw values instead of tokens. The tokens were *right there in tokens.css*, imported into globals.css, available everywhere — and still ignored.

**Path of least resistance wins. Always. Design accordingly.**

## The fix

Register tokens in a Tailwind v4 `@theme` block. The block lives in your global stylesheet, after the tokens.css import, and aliases each token as a color (or font, or radius, etc.) for Tailwind's utility generator.

```css
@import "tailwindcss";
@import "../tokens.css";

@theme {
  /* Role tokens registered as Tailwind color utilities. */
  --color-surface: var(--surface);
  --color-surface-1: var(--surface-1);
  --color-on-surface: var(--on-surface);
  --color-on-surface-variant: var(--on-surface-variant);
  --color-primary: var(--primary);
  --color-on-primary: var(--on-primary);
  --color-outline: var(--outline);
  --color-outline-subtle: var(--outline-subtle);
  --color-scrim: var(--scrim);
}
```

After this, Tailwind generates utility classes for every registered token:

```jsx
<div className="bg-surface-1/40 border border-outline-subtle text-on-surface" />
```

Same ergonomic as `bg-black/40`. Same length. Same speed to type. Now there is no reason to reach for the raw value — the named utility *is* the path of least resistance.

## How the indirection works

`@theme { --color-surface: var(--surface); }` registers `--color-surface` as a theme color and generates utilities at build time (`bg-surface`, `text-surface`, `border-surface`, etc.). The generated CSS reads `background-color: var(--color-surface);`, which resolves at runtime to `var(--surface)`, which resolves to `#181a1b`.

Two CSS-variable hops, but both are cheap. The double indirection has a real benefit: if `--surface` changes (e.g., theme swap to light mode), every utility class follows automatically without a Tailwind rebuild.

## What to register

The minimum useful set for a token-driven system:

- **Surface family** — `surface`, `surface-1`, `surface-2`, `surface-3`, `on-surface`, `on-surface-variant`. Covers all background and text needs.
- **Accent family** — `primary`, `on-primary`, `primary-container`, `on-primary-container`. State changes and focused elements.
- **Outline family** — `outline`, `outline-subtle`. Borders and dividers.
- **Overlay** — `scrim` for dim layers.
- **Status family** — `error`, `success`, `warning`, `info` pairs.

The full Material Design 3 role token set if you have it, but at minimum: the ones that appear in your call sites. Audit your existing code for `bg-black/N`, `border-white/N`, `text-white` — every instance is a token you should be using instead.

## When to do this

Do it on day one of a new project that imports tokens.css. The cost is ~10 lines in `globals.css` and the muscle-memory cost of swapping a few existing arbitrary values. The benefit compounds across every component, every refactor, every theme variant, for the project's entire life.

Doing it later is also fine — retrofit is straightforward, but you'll have already accumulated technical debt in the form of `bg-black/40`-style raw values scattered through components. Plan to grep and swap.

## Upstream into the scaffold

If you maintain a generator (like Loom) that scaffolds downstream projects, **add the `@theme` block to the scaffold's `globals.css` template**. Otherwise every downstream project repeats the same anti-pattern until someone notices. The retrofit work scales with the number of consuming projects; the upstream fix is one edit. See [pipeline-architecture.md](pipeline-architecture.md) for the broader principle.

## Related

- [pipeline-architecture.md](pipeline-architecture.md) — three-layer model for token-driven systems
- [codegen-pattern.md](codegen-pattern.md) — when to hand-build vs. mechanize
- **Design before build** — foundation work pays off when set up before features
