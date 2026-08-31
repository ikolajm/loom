# ADR — The focus ring belongs to the element, not to a class

**Status:** proposed

## Context

`:focus-visible` appears twice in all of Loom, and both occurrences are gated on
`.control`:

```css
.control:focus-visible { outline: … }
.control[aria-invalid="true"]:focus-visible { outline-color: var(--error); }
```

`.control` is the form-state class — it carries transitions and `aria-invalid`
border tones. `.interactive` is the pressable class — cursor, tap-highlight
suppression, and the `::after` hover/press overlay. Neither is wrong, but the
focus ring sits on only one of them, and it is not the one a consumer reaches
for when styling a button.

`.link` has `:hover` and no focus treatment at all. Nor does `<summary>`, nor a
scroll container that the browser has made keyboard-focusable — which Chrome and
Firefox now do by default so keyboard users can scroll a region with arrow keys.

The consumption evidence is a build of pb2 (Paperboy v2), which took the tokens
tier plus `loom.css` and `loom.components.css`. Every button in that app was
written as `class="button interactive"` — deliberately, by someone with
`loom.css` open, choosing `.interactive` on purpose for the press treatment. The
result was an application with **no focus ring on any element**: not the buttons,
not the search field, not the three selects, not the two links in the article
reader.

Nothing surfaced it. Lint passed, the build passed, and it looks correct with a
mouse. It was found only because the browser's own scroll-region focus ring
appeared around a reader pane and looked like a rendering bug — the accidental
ring was visible where the intentional ones were absent.

That is the shape of the defect: a mandatory accessibility affordance was made
opt-in, and parked on the class least likely to be reached for. When the reader
of the source misses it, the API is wrong rather than the reader.

## Decision

Promote the focus ring out of the class layer and onto the elements themselves,
in the base layer:

```css
:where(
  a[href],
  button,
  input,
  select,
  textarea,
  summary,
  [tabindex]:not([tabindex="-1"])
):focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

`:where()` holds specificity at zero, so any component or consumer rule still
overrides it without `!important`. `.control:focus-visible` stays as-is for the
`aria-invalid` variant, which is a genuine state distinction rather than a
baseline.

## Options rejected

**Merge `.interactive` and `.control`.** The first instinct, and wrong. They are
different axes: `.control` carries `aria-invalid` border tones a link must never
inherit, and `.interactive` carries a press overlay a text input must never
have. Merging makes every consumer of one inherit the other's semantics to fix a
problem that belongs to neither.

**Add `:focus-visible` to `.interactive` as well.** Halves the failure without
removing it. Links, `<summary>` and focusable scroll regions still get nothing,
and a consumer can still forget both classes.

**Document it in `gotchas.md`.** The trap is invisible to the person making the
mistake, so a note only helps someone who already suspects. A default that
cannot be forgotten beats a note that must be found.

## Consequences

Consumers who deliberately suppress focus rings will now need an explicit
override. That is the correct direction for the default to fail in, and
`:where()` makes the override a normal rule rather than a specificity fight.

Focusable scroll regions gain a ring they previously lacked. That will read as a
visual change in text-heavy layouts, and it is the browser's intent — a region
that can be scrolled by keyboard should say so when focused.

`.control` keeps a narrower job: form-state transitions and invalid styling. Its
name stops implying "the class that handles focus."

pb2 carries this rule as a local override in `src/app.css`, marked for removal
once it ships here.
