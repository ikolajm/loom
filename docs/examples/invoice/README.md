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
file need a colour, a weight or a rule back, the layer gave something up.

## What WeasyPrint does and does not do

- `print-color-adjust: exact` is ignored as an unknown property, and backgrounds print
  anyway — WeasyPrint has no "economy" mode to opt out of. The OVERDUE badge prints as a
  real fill here for a different reason than it does in a browser.
- `box-shadow` is unsupported, so `.elevate-*` is inert in a PDF. Depth has to be carried
  by rules and surfaces in a document.
- Custom properties resolve inside `@page` margin boxes — the page context inherits from
  the root element — so the page counter reads `--on-surface-variant` rather than a hex.
- `@keyframes` and `isolation` warn and are dropped. Both are app concerns.
