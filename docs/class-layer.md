# The class layer

What a component schema can and cannot express, and the rules the emitter holds you to.
Read this before authoring or changing a file in `spec/config/components/`.

The authoring surface is those schemas plus the templates in `scripts/code-templates/`.
`generated/*.css` and `catalog/*.tsx` are output — every `npm run generate` rewrites
them.

---

## A schema describes a ladder, not a box

A schema declares **values that ramp**: what `padding`, `height`, `gap`, `radius` and
`font-size` become at each size tier, and what a variant re-points. That is all it
declares.

It cannot declare a **box**. `display`, `flex-direction`, `align-items`,
`justify-content` and the rest do not ramp, so there is nowhere in a schema to put them.
They live in `BASE_RULES` in `generate-tokens-css.js`, keyed by class name.

The failure this creates is silent. `gap` is inert on a block container, so a class with
`gap` and no `display` emits, parses, and renders with the gap doing nothing — an icon
and its label stack instead of sitting side by side. `width` and `height` do not apply to
an inline box at all, so an inline `<span>` sized in a schema renders at its intrinsic
size.

**The rule, enforced by `class-box-model`:** any class that sets `width`, `height` or
`gap` anywhere in its ladder must declare a `display` somewhere in that same ladder, or
name itself in `NO_BOX` with a reason.

---

## Sub-parts need their own display

A sub-part — `.sidebar-item` and `.pagination-item` are the two that need one today —
gets a `display` of its own in `SUB_PART_RULES`. It does not inherit one from context.

Inside an atom a sub-part usually sits in a flex parent, which blockifies its children —
so `height` applies, `gap` quietly does not, and the class looks correct. Hand-marked up
outside that parent, which is how a consumer will use it, an inline box ignores every
dimension you gave it.

Declaring a `display` changes nothing inside the old flex parents. It makes the class
stand up outside them.

`class-box-model` keys on the element a rule styles, not the first class in the selector,
so `.sidebar[data-size="sm"] .sidebar-item { gap }` is checked against `.sidebar-item`.

---

## A schema key that is itself a property is not a part

The part splitter reads `<part>-<prop>`, so a key whose own name ends in a known property
suffix is read as a part unless it is declared otherwise.

| Key | Misread as | Actually |
|---|---|---|
| `line-height` | part `line` | a property on the element |
| `min-width` | part `min` | a property on the element |
| `border-width` | part `border` | a property on the element |

Left alone, those emit classes for elements that do not exist:

```css
.helper-text[data-size="sm"] .helper-text-line { height: var(--height-16px); }  /* nothing is .helper-text-line */
```

Nothing renders wrong, because `decls()` also puts the real declaration on the element —
which is why no page and no visual pass will show you this.

**The rule:** a key `decls()` consumes is never split. `SELF_PROPS` is the list;
`phantom-parts` fails the build on a class emitted for an element no schema declares.

---

## Every variant key must be consumed

The variant emitter reads declared keys by name. A key it does not read is not ignored —
the fallback writes the property's zero value, which actively removes the rule. A
`border-bottom` that goes unread emits `border: 0`, and the element loses the border it
had.

Edge-specific borders are separate keys from `border`:

```json
"top-bar":    { "border-bottom": "color/outline/outline" },
"sidebar":    { "border-right":  "color/outline/outline" },
"bottom-nav": { "border-top":    "color/outline/outline" }
```

**The rule, enforced by `variant-keys`:** every key a variant declares is either consumed
by the emitter or parked by name in `UNCONSUMED_VARIANT_KEYS` with a reason. A key the
emitter cannot express yet is fine. A key that vanishes is not.

---

## The UA styles anything you don't

A reset you leave out is not absent — it is inherited from the UA, and the UA's defaults
are not neutral. Form elements arrive with a border and a background that no Loom class
sets and therefore no Loom class clears.

`loom.base` carries a Form Controls block for this, low enough in the cascade that a
treatment wanting a border still wins. Don't write UA-clearing declarations into a
component schema: a class that happens to set the property masks the gap for every class
that doesn't.

---

## Review the emitted CSS, not the emitter

`generated/` is git-ignored — it holds literal hex from whichever brand is active — so
`git diff` reports **nothing** for the four stylesheets a schema change actually ships.

```bash
npm run diff-emit                 # working tree vs HEAD
npm run diff-emit -- HEAD~3       # vs an older ref
npm run diff-emit -- --stat       # summary only
```

It builds a temp worktree at the ref, copies the active brand in so the two sides differ
only where the *generator* does, emits both, and diffs.

Read the emitted CSS rather than the emitter's plan. `.icon-slot` and the `<name>-icon`
sub-parts are written by the emitter directly and never appear in the plan at all.

---

## Cross-references

- [`catalog.md`](catalog.md#templates-remain-the-authoring-tool) — the authoring surface these schemas feed
- [`pipeline.md`](pipeline.md#verify-is-the-gate-and-it-runs-last) — every check, in the order it runs
- [`substrate.md`](substrate.md) — what the emitted classes are, from the consuming side
- [`gotchas.md`](gotchas.md) — the traps that are not about schemas
