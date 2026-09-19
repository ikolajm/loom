# Invoice — the portable tier with nothing else

A printed document built on the substrate alone — it links `generated/main.css`, so all
three sheets, and `.badge` and `.label` come from the component sheet. No React, no build
step, no framework. It exists because the portable tier is the one with the fewest eyes on
it: anywhere a framework's own reset and utilities are in play, a gap in the tokens or
class tier hides behind them. This file has nothing to hide behind.

Four things in the layer were found by building this file, each with independent evidence
of having been written twice — that was the bar for admitting one.

- **A document base.** The portable tier styled no bare element at all. Invisible in an
  app whose framework resets for you; take the tokens tier into a Django template or a PDF
  and you get a white page, black text and a pile of unused custom properties.
  `border-box` and the body defaults — not a reset library.
- **`.text-on-surface` / `.text-on-surface-variant`.** The class layer set a colour on no
  text anywhere. Named after the tokens they read rather than shortened to `.text-muted`,
  so the class name states which role it paints.
- **`.numeric`.** Tabular figures anywhere; right-alignment only inside `.table`, because
  outside one the layout decides. Hand-written twice before it was a class.
- **`.surface`.** Levels 1, 2 and 3 had classes and the base plane did not — an
  incomplete ladder every consumer had been closing by hand.

The measurement is the argument. The first render needed document-specific CSS for three
things the substrate should have carried. With those closed, everything left in
`invoice.css` is `@page` setup and this document's own layout — no colour, no weight, no
type role. That is the signal: if a change to the layer puts one of those back, the layer
gave something up.

## Render it

The stylesheets are linked from `generated/`, which is not committed, so generate first:

```bash
npm run generate
python -m venv .venv && .venv/bin/pip install weasyprint   # Scripts/ not bin/ on Windows
.venv/bin/weasyprint docs/examples/invoice/invoice.html invoice.pdf
```

**WeasyPrint needs Pango, and `pip install` does not bring it.** On Linux it is usually
already there; on macOS it is `brew install pango`. On Windows the import fails with
`cannot load library 'libgobject-2.0-0'` until a GTK runtime is installed, so the
practical routes are the GTK3 runtime installer, MSYS2, or WSL. This is why a render is
a different kind of task from a build here, and why nothing runs it automatically.

It renders against whatever the generator just emitted, not against a copied snapshot.
Nothing runs it automatically. **The signal is `invoice.css`**: it holds `@page` setup
and this document's own layout, and nothing else. If a change to the layer makes this
file need a color, a weight or a rule back, the layer gave something up.

## WeasyPrint

It is not a browser. What the substrate needs from any non-browser engine, and the shapes
of difference worth expecting, are in [`../../gotchas.md`](../../gotchas.md). A render here
is not a clean-log check — real warnings share the channel with app-only properties the
engine drops.
