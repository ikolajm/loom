# Code Generation Pattern: R&D Then Mechanize

A workflow for building generators that produce production-quality output.

## The problem

When you build a generator from scratch, you don't know what good output looks like yet. You guess at the patterns. The output is mediocre because the generator is fighting two unknowns at once: *what should the output look like* AND *how do I produce it programmatically*.

## The pattern

Two phases, in order:

1. **Hand-build phase (R&D).** Build a representative subset of components by hand. Treat them as production code, not demos. Document patterns as they emerge: prop signatures, structural markup, token usage, edge cases.
2. **Generator phase (mechanize).** Once patterns are proven, encode them as generator templates. The generator now has a clear target: produce *this exact pattern* from *this config shape*.

The hand-built work isn't throwaway — it's the spec.

## When to flip from phase 1 to phase 2

Flip when the patterns stop changing. If you're still discovering structural decisions on every new component, keep hand-building. If you've built 5–10 components and they all look the same shape, mechanize.

Signs you should have flipped already:

- Hand-built components are starting to drift from each other (style mappings done by eye)
- The "rules" for how to build component X are getting clearer than the components themselves
- You're copy-pasting between components rather than designing each one

## Why hand-building drifts

Eyeballed style mappings will diverge from the config that's supposed to drive them. A developer reads "primary color, medium size, ghost variant" and intuits a result — the intuition won't match what mechanical extraction produces. The generator forces the question: *what does the config actually say?*

This is why "configs as source of truth" only works if the path from config to output is mechanical, not interpretive.

## Trap: skipping phase 1

If you skip the hand-build and go straight to generator: you'll generate uniform mediocrity. Every component will be wrong in the same way, and you'll ship that mistake at scale.

Hand-build first. Mechanize once you know what you're trying to produce.

## Related

- [pipeline-architecture.md](pipeline-architecture.md) — the design system this pattern was used to build
