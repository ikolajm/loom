# The substrate

What the four stylesheets hold, and the two things about them you have to get right:
the layer order and the spacing vocabulary. This is reference — come back to it.
[`quickstart.md`](quickstart.md) is the read-once path that wires it in.

---

## The four files, and the layer order

`npm run generate` emits four CSS files — three stylesheets and the index that imports
them. All are plain CSS with no framework at-rules.

| File | Holds | Layer |
|---|---|---|
| `tokens.css` | custom properties — color roles, spacing, radius, type role values | `loom.tokens` |
| `loom.css` | what you compose with — a document base, type ramp, text color roles, tones, treatments, control states, surfaces, elevation, links, tabular figures, the visually-hidden utility, keyframes, print rules | `loom.base`, `loom.components` |
| `loom.components.css` | what they compose into — named component classes, shape only | `loom.components` |
| `main.css` | the three above, imported in order. Three lines and no rules of its own | — |

**Import `main.css`, or the three directly in that order — the order is load-bearing.**
Everything Loom emits sits in a Loom-owned cascade layer:

```css
@layer loom.reset, loom.tokens, loom.base, loom.components;
```

`tokens.css` declares that line, which is why it goes first. Don't reorder the imports.
That one line sets the whole priority order — **later layers win, and anything unlayered
wins over all of them.** So the stack, weakest to strongest:

```
loom.reset  <  loom.tokens  <  loom.base  <  loom.components  <  your unlayered CSS
```

**`loom.reset` is an empty slot.** Loom declares the name and never puts a rule in it.
It is there so your reset has somewhere to sit *below* everything Loom ships, which is
what a reset is for. Wrap yours in `@layer loom.reset` and import it before `tokens.css`:

```css
@layer loom.reset {
  button { font: inherit; background: none; border: none; cursor: pointer; }
}
```

`.treat-filled` now outranks that `button` rule and your buttons paint. Leave the same
reset unlayered and it lands in the strongest slot instead, beating every class Loom
ships — buttons render with no background, no border and inherited text. That is the
most common way an install looks broken;
[`gotchas.md`](gotchas.md#loom-ships-in-cascade-layers-so-anything-unlayered-outranks-all-of-it)
has the full symptom.

**Everything else you write stays unlayered**, and that is what the last slot is for. A
plain `.card { border-radius: 0 }` in your stylesheet beats Loom's `.card` without
`!important` and without a specificity fight. Override Loom by writing normal CSS; put
only your reset in a layer.

**The names Loom occupies are published.** [`../catalog/classes.json`](../catalog/classes.json)
lists every class the stylesheets define, generated from the emitted CSS on each run.
Reusing one is a deliberate override when you meant it and a quiet merge when you did
not — check the list before naming a class of your own.

**A project that owns its own components can skip `loom.components.css`.** Before wiring
`loom.css` into an app that already has a stylesheet, know that it is the only file
touching bare elements — `box-sizing` and the `body` defaults — so a page with no reset
of its own still gets a background, a text color and the body type role. Those sit in
`loom.base`, below everything else Loom ships.

---

## Spacing is five nesting levels, not one scale

`tokens.css` emits padding and gap under five category names. They are a vocabulary for
*how far apart two things sit given what contains them*, not five arbitrary sizes.
Reading inward:

| Category | What it spaces | Emits |
|---|---|---|
| `--screen-*` | the page against the viewport — the gutter outside everything | `x-padding`, `y-padding` |
| `--content-*` | the column the page's reading matter sits in | `+ gap`, `+ max-width` |
| `--section-*` | related groups under one heading — a card's contents, a form's fieldsets | `+ gap` |
| `--group-*` | controls that read as one unit — a row of buttons, a field and its label | `+ gap` |
| `--component-*` | the inside of one control — a button's padding, its icon-to-label gap | `+ gap` |

The gaps descend as you move inward — `--content-gap` through `--component-gap` step down
the scale — so nesting one level inside the next reads as hierarchy without anyone picking
numbers at the call site. Paddings are a choice per level rather than a ramp: a screen
gutter and a section's inset answer different questions. `density` in your answers file
moves the whole set together, so a compact product is one answer rather than five
decisions.

**Every category has a `compact` twin** — `--section-compact-gap` beside `--section-gap`.
The set is complete rather than partial, which is why `--content-compact-max-width`
carries the same value as `--content-max-width`: compact is a statement about padding and
gap, and the column a page reads in does not get narrower because the spacing inside it
tightened. Every var has a twin, so switching a context over never needs a list of
exceptions.

This is the density mechanism Loom ships that is *not* a build-time answer: point a rule
at the compact value where the context is tight — a dense table, a dialog footer, a narrow
viewport — and the hierarchy holds at a smaller step instead of collapsing. Loom does not
choose when that happens and ships no breakpoints to hang it on, because the width at
which a layout gets tight is a property of your layout, not of the substrate. (Custom
properties are not valid in a media query condition, so a breakpoint could not be a token
here even if Loom had an opinion about the value.)

---

## Tone and treatment are two independent axes

Tone (`.tone-primary`, `.tone-error-soft`, ...) re-points the `--tone-*` custom
properties. Treatment (`.treat-filled` / `-outline` / `-ghost`) consumes them. You
compose one of each:

```html
<span class="badge treat-outline tone-error">Failed</span>
```

Each treatment reads its tone through a fallback, so **either class works alone**: a
treatment with no tone renders a neutral version of itself, and `badge tone-primary`
with no treatment is filled, because `.badge` carries a tone default at zero
specificity. Every family carries a `-soft` container end, so intensity is one axis
rather than two vocabularies. Adding a tone or a treatment is one line, not an N x M
matrix.

**The label colour is resolved, not assumed.** `--tone-text` reads a per-family text
role that the generator walks to the nearest ramp shade clearing AA against the most
raised surface tier, per mode — so an outline or ghost badge is legible wherever it
lands, not only on plain `surface`. It is a separate role from the fill, so solid
buttons keep the brand colour at full strength; only what `.treat-outline`,
`.treat-ghost` and `.link` paint moves. `--tone-border` stays at the base role, since a
border is a non-text boundary at 3:1 under WCAG 1.4.11. A brand whose ramp cannot
produce a legible label fails the build.

Tone is opt-in per atom: `button` and `badge` carry the full axis, `dialog` and
`form-field` none.

**Tone is a hue signal, so it cannot carry meaning by itself.** The semantic roles sit
at matched luminance on purpose — that is what lets every `on-*` pairing resolve the
same way and what keeps a filled error and a filled success reading at the same weight
beside each other. The cost is that they separate by hue and very little else, so in
greyscale, or to a viewer with red-green colour blindness, an error and a success
render as the same swatch. The container ends are closer still than the fills.

Which means a status that matters needs a second channel — an icon, a word, a
treatment — and tone alone is decoration on top of it. Loom cannot check this for you:
it emits the roles, and whether colour is the only thing carrying your meaning is a
fact about your markup. **The states Loom does ship are already safe.** Hover and
active are a `currentColor` overlay, disabled is opacity, focus is a ring and a link's
hover thickens its underline — every one of them a change in lightness or shape rather
than hue, so they survive the same conditions the tones do not.

---

## Motion is one duration and one easing

`--transition` and `--easing`, both plain custom properties a consumer overrides with any
value, including their own timing function. Every transition the class layer emits reads
`--transition` and nothing else, which is what makes the reduced-motion answer one line —
see [`gotchas.md`](gotchas.md#reduced-motion-is-one-line-and-the-spinner-is-exempt-from-it)
for that line and for the two classes deliberately outside it.

The four bezier presets and three spring `linear()` approximations that shipped earlier
were emitted and referenced by nothing. A second tier gets added when something needs it.

---

## Tokens ship all-or-nothing

There is no token subsetting and no pick list. Tokens are generated from
`spec/config/base/*.json`, or from `spec/config/local/base/*.json` once you have run
`npm run configs` for your own brand — git-ignored, and it takes precedence per file
(`scripts/config-paths.js`). Tokens are the foundation; characterization is project-owned.

[`pipeline.md`](pipeline.md) traces how a value you answered becomes a line in
`tokens.css`.

---

## Read the values somewhere with no CSS engine

A surface with no CSS engine — an email, a templating language, a report builder — can
still use Loom's decisions by reading `tokens.css` as a table of values rather than linking
it as a stylesheet. It is already in that shape: nearly every declaration is a resolved
literal on the line, and the aliases that are not resolve in one hop, never a chain. The
semantic names (`--primary`, `--on-surface-variant`, `--space-6`, `--br-md`) are the
interface worth designing against; the numbered palette underneath them moves when a brand
changes.

**An engine with a CSS implementation is not this case**, whatever it renders to — link
`main.css` and use the classes.
[`gotchas.md`](gotchas.md#documents--what-the-substrate-needs-from-a-non-browser-engine)
states what the substrate needs from one. Reach for raw values only where nothing can
consume a stylesheet at all, which in practice means email: Outlook's Word engine ignores
custom properties, so values have to arrive already resolved and inlined.

**Values you copy do not track brand changes.** This is the whole cost of the approach and
there is no mechanism against it: regenerate with a different brand and the hexes move,
while your template keeps the old ones and nothing in either repo knows it exists. Loom
ships no generator, no JSON tier and no recommended templating approach for this — it is a
use case the substrate supports, not a tier it delivers.

