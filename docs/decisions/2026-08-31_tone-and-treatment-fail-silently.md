# ADR — A tone without a treatment, or a treatment without a tone, must not fail silently

**Status:** proposed

## Context

Colour in Loom is two orthogonal classes. A tone sets custom properties:

```css
.tone-primary {
  --tone-bg: var(--primary);
  --tone-fg: var(--on-primary);
  --tone-text: var(--primary);
  --tone-border: var(--primary);
}
```

A treatment consumes them:

```css
.treat-filled  { background-color: var(--tone-bg); color: var(--tone-fg); }
.treat-outline { border: var(--bw-1) solid var(--tone-border); color: var(--tone-text); }
```

The split is right. Fifteen tones times four treatments is sixty classes if they
are fused, and the orthogonality is what keeps the system small. The defect is
that using either half alone produces no error, no warning, and no visual hint
that half a rule is missing — and the two halves fail in different ways, both
invisible.

**A tone without a treatment sets four custom properties nobody reads.** The
element renders with no background and no border. Nothing is wrong in the
markup's own terms; `class="badge tone-primary"` reads as complete.

**A treatment without a tone references undefined custom properties.** `var(--tone-bg)`
with nothing to resolve makes the declaration invalid at computed-value time, so
the whole declaration is dropped rather than falling back. `treat-outline` alone
renders no border at all — not a default border, none.

## Consumption evidence

pb2 (Paperboy v2), consuming the tokens tier plus `loom.css` and
`loom.components.css`.

A filter button carried a count badge written `class="badge tone-primary"`. It
shipped with no background. The reported symptom was "no primary coloring coming
through, and it being fairly blocky" — the second half because `--radius-pill`
resolves to `--br-0: 0px` in that theme, so the badge was a square with no fill,
and read as a broken component rather than an unstyled one.

The sharper evidence is what happened next. The author diagnosed the tone/treatment
split correctly, wrote a source comment explaining it, fixed the badge to
`badge tone-primary treat-filled` — and in the same edit wrote three buttons as
`treat-outline` with no tone class. Same system, opposite direction, minutes
apart, by someone who had just finished reading the mechanism and writing it down.

An API that catches its reader immediately after they have understood it is not
being misread.

## Decision

**Give the treatments tone fallbacks.** This is already the house pattern in
`loom.components.css`, which twice writes `var(--tone-border, var(--outline))`.
The treatments are the outliers for not doing it:

```css
.treat-filled  { background-color: var(--tone-bg, var(--surface-2));
                 color: var(--tone-fg, var(--on-surface)); }
.treat-outline { border: var(--bw-1) solid var(--tone-border, var(--outline));
                 color: var(--tone-text, var(--on-surface));
                 background-color: transparent; }
.treat-ghost   { background-color: transparent;
                 color: var(--tone-text, currentColor); }
.treat-dot     { background-color: var(--tone-border, currentColor); }
```

A treatment used alone then renders a neutral version of itself — visibly
present, visibly unstyled, and obviously missing something. That is a failure a
consumer can see.

**Give conventionally-filled components a default treatment.** `.badge` is
filled in every design system that has one; a badge with no background is not a
variant anyone wants. Setting `background-color: var(--tone-bg, transparent)`
and `color: var(--tone-fg, inherit)` on `.badge` itself makes `badge tone-primary`
correct as written, which is how it will keep being written.

## Options rejected

**Fuse tone and treatment into single classes.** `.filled-primary`,
`.outline-neutral`, and so on. Removes the failure by removing the axis, at a
cost of sixty classes and no way to change tone and treatment independently.
The orthogonality is the good part of this design.

**Document it in `gotchas.md`.** Same argument as the focus ring: the trap is
invisible to the person making the mistake, so a note reaches only someone who
already suspects. The evidence above is one person making both halves of the
mistake while holding the documentation open.

**Lint for it.** A rule requiring `tone-*` and `treat-*` to co-occur would work
for a consumer running Loom's lint config, which is not most of them, and it
does nothing for a class list built at runtime.

## Consequences

Correct existing usage is unchanged. A `var()` fallback applies only when the
custom property is unset, so every element already carrying both classes
resolves identically.

`treat-*` used alone changes from invisible to neutral. In an app that has been
relying on a treatment silently doing nothing, borders and backgrounds will
appear. That is the intended direction — the alternative is a rule that lies
about being applied.

`.badge` gains a background where a tone is present and none where it is not,
which is what `data-size` already implies about the component having opinions.

pb2 currently works around this by spelling both classes everywhere. Nothing
there needs reverting once this ships; the workaround is the correct usage.
