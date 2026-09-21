# Loom — Gotchas & hard-won notes

Traps the generated code embodies but can't explain. The code holds the *fix*; these hold the *why* — the landmines that produced the workarounds, kept so the next person (or future-you) doesn't re-pay the hours. The "how it works" is in the code; this is the part that isn't.

Two surfaces have their own files, because their traps are a workflow rather than a
scattering: schema authoring is [`class-layer.md`](class-layer.md), and the Figma console
is [`figma.md`](figma.md).

---

## Radix `Slot` — `asChild` silently applies no classes when children are wrapped in a fragment

`Slot` locates the consumer's element through `Slottable` using `React.Children.toArray`,
which flattens **arrays but not fragments**. Wrapped in a `<>`, `Slot` sees one
unrecognised child, clones the fragment itself and sets `className` on it — React warns
and drops it. The result renders with no `display`, no size, and a raw 24-viewBox svg at
intrinsic size. **Pass an array, not a fragment.**

This fails silently in the direction that matters: the component renders, so a typecheck
and a build both pass. `badge` carried the same bug in a worse form — it imported `Slot`
without `Slottable` at all, so `badge asChild` had never applied classes in any version.
No story exercised it, which is why it went unseen. Any generated component wiring
`asChild` needs a story that actually exercises it.

**Parked deliberately: `asChild` + `iconOnly` together.** That mode wraps children in
`span.icon-slot`, which becomes Slot's only child, so the classes land on the span and the
consumer's element nests inside it. The fix is not mechanical — the span exists to read
`--icon-size`, so removing it means deciding how an icon is sized without one. A design
call on component internals, parked visibly rather than guessed at.

---

## Fonts — two pipelines, one family name

Fonts are the one token where the two surfaces have **different capabilities**, so they get explicit handling instead of a straight pass-through. The questionnaire takes one family name per role (`heading` / `body`); both pipelines consume it, but they can render different sets:

| Surface | Loads via | Failure mode (raw) |
|---|---|---|
| **Code** | nothing — **you load it** | not loaded → **silent** fallback to system sans |
| **Figma** | `figma.loadFontAsync({ family, style })` | unavailable family → **throws**, crashes the paste |

A page's fonts and Figma's fonts are **separate availabilities** (Figma = system fonts + its own set + org uploads), so a name can load in code yet be absent in Figma. Each surface is checked against its *own* authoritative source. There is deliberately **no curated shortlist**: one was shipped and cut, because it drifts, it is environment-specific, and naming safe typefaces is Loom having an opinion about brand. It also promised more than it held — Space Mono was *on* it and still killed a paste on a missing weight.

[`spec/questionnaire.md`](../spec/questionnaire.md#fonts--heading--body) states what the
answer does on each surface. What belongs here is why only one of them warns.

There is one check, and it is authoritative rather than heuristic: the Figma preflight
(`scripts/figma-styles/_shared.js`: `reportFontParity` / `resolveFamily` / `safeLoadFont`).
**Nothing warns on the code side, at any point** — that was the config-time check against
the shortlist, and it went with it. The code-side failure is silent by construction rather
than by omission, which is why it is written down here instead of gated: Loom loads no
webfont on purpose, because nothing framework-agnostic can and guessing wrong costs a
render-blocking request. Checking it means loading the page on a machine without the
family, or reading the computed font family rather than the custom property — the token
is correct either way.

**A family being available says nothing about the weight you want.** `listAvailableFontsAsync()` answers with family *and* style; keeping only the family leaves `fontStyle()` guessing a style name and `loadFontAsync` throwing when the guess is absent. The ramp asks 400/500/600/700 and many families ship fewer; Space Mono ships Regular and Bold — `reportFontParity` reported the family present three lines before the paste died on the missing 600, because it checked the family and not the weights. `fontStyle()` now snaps to the nearest weight the family actually ships (ties heavier, italics excluded), which is what CSS font matching already does on the page; Figma was the only surface refusing to build rather than falling back. `FONT_WEIGHT_OVERRIDES` is still checked first, now as the way to pin a choice deliberately unlike the browser's rather than as the workaround for a crash.

---

## Reduced motion is one line, and the spinner is exempt from it

No browser honors `prefers-reduced-motion` on its own. It suppresses nothing; it is a
media query you author, and unauthored it does nothing at all.

Loom authors it once, in `tokens.css`:

```css
@media (prefers-reduced-motion: reduce) {
  :root { --transition: 0.01ms; }
}
```

That is the whole answer for transitions, because every transition the class layer emits
reads `--transition` and nothing else. `0.01ms` rather than `0s` keeps `transitionend`
firing for anything that waits on it.

**`.spinner` is deliberately outside it.** It animates on the `spin` keyframe, not on
`--transition`, so the block above does not reach it — by design. An indeterminate
progress indicator is essential motion: frozen, it does not read as calm, it reads as a
hung app. Suppressing it trades a small discomfort for a false signal. Don't "fix" the
spinner by adding it to that block.

`.skeleton` is static for the same family of reasons — it reserves layout and shows the
shape of what is coming, and it does both without moving, so there is nothing to suppress.

**The rule:** before reaching for `prefers-reduced-motion`, ask *"did the user trigger this, or is it playing on its own?"* Autonomous → honor it (pick the mechanism). Direct-manipulation → don't, and leave a comment saying so.

---

## The target floor moves between a laptop and a phone, and your CSS does not say so

**Symptom.** A `data-size="sm"` button renders at its declared height on your laptop and
at the target floor on your phone. Same build, same stylesheet, no breakpoint you wrote. A dense table of small
controls looks right in review and loosens up on the device.

Loom authors it once, in the class layer:

```css
@layer loom.components {
  @media (pointer: coarse) {
    .interactive,
    .control { min-height: var(--touch-min); }
  }
}
```

`--touch-min` carries WCAG 2.2 SC 2.5.5 Target Size (Enhanced), the AAA figure, which is
also what Apple's HIG asks. `height` still ramps underneath; this only clamps.

**Why it is conditioned rather than always on.** The three `controlHeight` ladders already
encode the split. `compact` and `standard` clear SC 2.5.8 Target Size (Minimum) — the AA
figure — at their smallest tier without help, and only `touch` is built to the AAA figure.
Clamping unconditionally imposed AAA on two ladders built to AA, and overrode the
`controlHeight` answer, which is the mechanism a product has for stating its own input
context.

**The hole, which is deliberate and not an oversight.** `pointer` reports the *primary*
pointer. A touchscreen laptop is `pointer: fine` with `any-pointer: coarse`, so a finger
on that screen gets the fine ladder and its smallest target. `any-pointer: coarse` would
catch it — and would also resolve nearly every current laptop to the floor, which takes
the dense case away from the hardware most likely to want it. No media query separates *can be touched*
from *is being touched*.

If you need the floor guaranteed on every pointer, that is what answering `controlHeight:
touch` is for. It is a product decision, not a device test.

**Taking it back.** The block is layered, so any unlayered rule of yours outranks it
whatever the specificity:

```css
.interactive, .control { min-height: 0; }
```

Your ladder's declared heights render again on every pointer. That is a deliberate
affordance — a target size is a decision a consumer may legitimately take back, unlike
the print and reduced-motion blocks, which stay unlayered precisely so you cannot beat
them casually.

**The rule:** if the small tier has to stay small under a finger, say so in the answers
file, not in a media query of your own. Overriding the floor per-breakpoint reintroduces
exactly the build that is compliant on one device and not on another.

---

## Config resolution — a stale local set silently outranks a fresh committed one

**Symptom.** You change a value in `spec/direction-mappings.json`, regenerate the committed base, confirm the new value in `spec/config/base/`, and the emitted `tokens.css` still carries the old one. Everything reports success.

**Root cause.** `scripts/config-paths.js` resolves every config through `local/` first, falling back to the committed set — which is what lets a fresh clone build with no answers file. `--default-set` writes only the *committed* set. If `spec/config/local/` exists, it keeps winning, and nothing announces which set is in play.

**Fix.** After changing anything upstream of the configs, regenerate **both**:

```bash
node scripts/generate-configs/index.js --default-set   # committed default
npm run configs                                        # your local brand
```

**Verify on the emitted artifact, not the config.** The config being right proves nothing about what rendered — check `tokens.css` (or the generated atom) for the value you expect. `sourceOf()` in `config-paths.js` reports which root a file actually came from.

---

## Documents — what the substrate needs from a non-browser engine

The only non-React consumer that *links* the stylesheets is a document renderer. A surface
with no CSS engine reads the resolved values instead, which is a different path and has
its own note in [`substrate.md`](substrate.md#read-the-values-somewhere-with-no-css-engine).

Loom's emitted CSS makes two demands on whatever renders it. Both are worth checking
before you commit to an engine, because the first fails silently and totally.

**Cascade layers must resolve.** Every component rule sits inside `@layer loom.components`,
so an engine without layer support does not degrade — it renders the page unstyled. An
unknown at-rule with a block is consumed and discarded, contents and all. Loom emits the
multi-name statement, the named block form and dotted names, and relies on unlayered author
CSS outranking every layer so a document stylesheet can override Loom without declaring a
layer of its own.

**Custom properties must resolve, including inside `@page` margin boxes.** The page context
inherits from the root element, so a running header or a page counter reads
`var(--on-surface-variant)` like anything else. A hex in document CSS is a mistake, not a
workaround.

Past that, engine differences are yours to check rather than Loom's to catalogue — which
CSS an engine implements is the engine's business and moves with its version.

---

## `hidden` does not hide anything Loom gives a `display` to

`[hidden] { display: none }` lives in the UA stylesheet, and **any** author rule beats a
UA rule regardless of specificity or layer. `.dialog` sets `display: flex`. So this
renders permanently:

```html
<div class="dialog dialog-fixed" hidden>...</div>
```

The overlay beside it hides correctly, because `.dialog-overlay` sets no `display` — which
makes the symptom worse than a plain no-op: the scrim disappears and the panel stays,
which reads as a stuck dialog rather than as a CSS problem.

Every class that declares a `display` carries this, not only `.dialog`. `class-box-model`
requires one on anything sized, so the set is large by design.

**Fix it in your own layer**, not by removing the attribute:

```css
[hidden] { display: none !important; }
```

`!important` rather than specificity, because your rule and Loom's are both author rules
and Loom's may be more specific. In a layered sheet an `!important` declaration in the
*earliest* layer wins, which is the opposite of the normal order — so if you layer this,
put it where you mean it.

Found in Loom's own preview page, where the portaled-dialog demo had been stuck open
since the day it was written. It was toggled with `hidden` specifically to avoid adding
page-local CSS that might flatter the classes under test; the reasoning was right and the
mechanism does not work. `preview-coverage` did not catch it either: the class was
rendered, which is all that check asserts — it was just never hidden.

---

## Loom ships in cascade layers, so anything unlayered outranks all of it

Everything Loom emits sits in a Loom-owned layer — `loom.tokens`, `loom.base`, `loom.components`.
Unlayered CSS beats layered CSS **regardless of specificity** — that is the cascade
working as specified, and it inverts the intuition that a more specific selector wins.

So the reset every project already has:

```css
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; }
```

outranks `.treat-filled`, `.treat-outline` and every other class Loom ships, on an
element selector at 0-0-1 against a class at 0-1-0. Buttons render with no background,
no border and inherited text colour.

The symptom is the problem: nothing errors, the classes are present in the DOM, the
rules are present in the stylesheet, and the custom properties resolve correctly.
Reading computed styles on an affected button shows `--tone-bg` holding the right
colour while `background-color` computes to `rgba(0, 0, 0, 0)`. It reads as "the
treatment classes are broken."

**Put the reset in `@layer loom.reset`.** Loom declares that slot for exactly this, first
in its own order, and never writes to it. A consuming project's own rules can stay
unlayered if it wants them to be the last word:

```
@layer loom.reset (yours)  →  loom.tokens → loom.base → loom.components  →  unlayered (your app)
```

**And establish the order structurally, not with a layer statement.** The
`@layer a, b;` form is correct CSS and minifiers drop it as redundant, after which
precedence silently falls back to first appearance. That applies to the statement in
`tokens.css` too. If the reset block sits after the Loom imports in source, removing that
one line reverses the whole cascade. A reset file that wraps itself in `@layer loom.reset`
and is imported before `tokens.css` cannot be minified into the wrong order.

Found in a consuming app. The buttons had correct tone and treatment classes and were
diagnosed twice as a markup problem before anyone looked at the layer.

**The symptom tells you which defect it is**, because treatments carry tone fallbacks: a
treatment used alone renders a neutral fill or the outline role rather than nothing. If `background-color` computes to transparent on an element whose `--tone-*`
properties are resolving, a class is not missing; something unlayered is outranking the
layer.

**The same rule bites from the other direction, through your own classes.** Ship
`.card-actions { position: relative }` unlayered and it outranks *everything* Loom layers
for `position`, including where you meant Loom's rule to hold — `.interactive` hard-sets
`position: relative`, so an element carrying both gets yours and nothing reports it. No
class-merging helper can catch it: it sees two names from different vocabularies and has
no idea both set the same property. Put your own classes in a layer too, and the cascade
order is something you state rather than something you discover.
