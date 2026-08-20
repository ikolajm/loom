# Invoice — the portable tier with nothing else

A printed document built on `tokens.css` and `loom.css` alone. No React, no build step,
no Tailwind. It exists because the portable tier is the one with the fewest eyes on it:
the catalog, the playground and both ported apps all run through a Tailwind build, so a
gap in the tokens or class tier can hide behind preflight and utilities. This file has
neither to hide behind.

The document base, `.text-on-surface`, `.text-on-surface-variant`, `.numeric` and
`.surface` were all found by building it — see the document-tier section of
[`../../rewrite-plan.md`](../../rewrite-plan.md).

## Render it

The stylesheets are linked from `generated/`, which is not committed, so generate first:

```
npm run generate
python -m venv .venv && .venv/bin/pip install weasyprint
.venv/bin/weasyprint docs/examples/invoice/invoice.html invoice.pdf
```

It renders against whatever the generator just emitted, not against a copied snapshot.
Nothing runs it automatically. **The signal is `invoice.css`**: it holds `@page` setup
and this document's own layout, and nothing else. If a change to the layer makes this
file need a color, a weight or a rule back, the layer gave something up.

## WeasyPrint

It is not a browser, and the differences bite — `box-shadow` does nothing, so
`.elevate-*` is inert on paper; `print-color-adjust` is ignored but backgrounds print
regardless. Both are written up in [`../../gotchas.md`](../../gotchas.md), which is where
engine traps live. A render here is not a clean-log check: real warnings share the
channel with `@keyframes` and `isolation` being dropped.
