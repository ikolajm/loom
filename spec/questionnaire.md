# Describing your design system — `answers.json`

**This is where you tell Loom what your product should look like.** You answer up to
thirteen questions in one small file, and Loom generates the rest: a color system in
light and dark, a type ramp, spacing, radii, shadows, a React component catalog, and a
matching Figma file.

**Only one answer is required** — your `primary` brand color. Everything else has a
sensible default or is derived from what you did answer, so the shortest useful answers
file is three lines.

## Start here

Copy the template, edit it, run three commands:

    cp spec/answers.example.json spec/answers.json    # 1. your copy, git-ignored

Open `spec/answers.json` in any text editor and change the values (the reference below
explains each one). Then:

    npm run configs     # 2. turn your answers into token configs
    npm run generate    # 3. build the React catalog + tokens.css
    npm run figma       # 4. build the Figma paste scripts

Re-run those three any time you change an answer. **This document is a reference, not a
worksheet** — you never fill in this file, you fill in your copy of the template.

Your `answers.json` is git-ignored on purpose: it holds *your* brand, not Loom's, so it
never rides along in a commit to this repo.

## Complete example

Every key, with illustrative values (your tokens will differ — this is an example set,
not Loom's "look"):

```json
{
  "projectName": "acme-dashboard",
  "styleDirection": "clean",
  "defaultMode": "dark",
  "primary": "#1E90FF",
  "secondary": "#EE8D2F",
  "accent": "#F42990",
  "heading": "Space Grotesk",
  "body": "Inter",
  "edges": "sharp",
  "density": "comfortable",
  "shadowDepth": "flat",
  "typeScale": "standard",
  "controlHeight": "standard"
}
```

## Field reference

| Key | Required | Allowed values | Default if omitted | Drives |
|-----|----------|----------------|--------------------|--------|
| `primary` | **yes** | hex `#RRGGBB` | — | brand color ramp; neutral hue |
| `secondary` | no | hex `#RRGGBB` | analogous +30° from `primary`, marked derived | secondary ramp |
| `accent` | no | hex `#RRGGBB` | analogous +60° from `primary`, marked derived | accent ramp (always generated) |
| `heading` | no | Google Fonts family name | `Inter` | heading text styles |
| `body` | no | Google Fonts family name | `Inter` | body/UI text styles |
| `edges` | no | `none` · `sharp` · `soft` | `sharp` | border-radius scale |
| `density` | no | `compact` · `comfortable` · `airy` | `comfortable` | spacing scale |
| `shadowDepth` | no | `flat` · `elevated` | `elevated` | shadow/elevation scale |
| `typeScale` | no | `compact` · `standard` · `dramatic` | `standard` | type size range |
| `controlHeight` | no | `compact` · `standard` · `touch` | `standard` | height of buttons, inputs, rows, bars |
| `defaultMode` | no | `dark` · `light` | `dark` | which color mode loads first |
| `projectName` | no | string | `null` | metadata only |
| `styleDirection` | no | see list below | `null` | Tier 2 defaults |

Omit any optional key entirely — the generator falls back to the default above,
**unless `styleDirection` supplies one first** (see the section below).
A value outside the allowed set fails loudly (e.g. `Unknown edges: "round". Valid: none, sharp, soft`).

## Colors

`primary` is the only required color; `secondary` and `accent` are **always generated** —
derived from `primary` by a small hue rotation (analogous, +30° and +60°) when you don't
supply them. Supply a hex to override the derivation. All three produce a full semantic ramp.

**A derived color is a placeholder, not a decision.** The generated ramp is structurally
identical to a chosen one, so nothing downstream can tell them apart — which is why the
generated `colors.json` records which is which in its `$note` and `$derived` fields, and
every derived variable in Figma carries a description saying so. The rotation is deliberately
small: complementary and triadic derivations are correct color theory and the wrong default,
because a teal primary produced a fire-engine red secondary that shipped into the tokens
looking exactly as intentional as the primary. Supply your own the moment you have one.

## Fonts — `heading` / `body`

**Use Google Fonts family names.** The generated `layout.tsx` loads fonts via a runtime
Google Fonts `<link>` (not `next/font`), so an unrecognized name **falls back silently to
system sans** rather than failing the build. To self-host or use a non-Google font, edit the
generated `layout.tsx` — it's project-owned.

**Design↔code parity.** Google Fonts and Figma's font set are not 1:1. For guaranteed parity,
pick from [`parity-safe-fonts.json`](parity-safe-fonts.json). Off-list fonts are allowed:
`npm run configs` flags them, and the Figma typography paste reports availability and
**substitutes Inter** for any font this Figma can't render (the build completes, logged once).

## The five look-and-feel answers, in plain terms

These are the ones that need taste. Each is a word, not a number — Loom turns it into the
actual scale. **You can skip four of the five** and let `styleDirection` supply them
(next section). `controlHeight` is not one of them — see below.

- **`edges`** — how rounded corners are. `none` is square, `sharp` is a slight round,
  `soft` is generous. Applies to buttons, cards, inputs, everything.
- **`density`** — how much breathing room between and inside elements. `compact` fits more
  on screen (dashboards, admin tools), `airy` gives things space (marketing, portfolios),
  `comfortable` sits between.
- **`shadowDepth`** — whether surfaces lift off the page. `flat` separates with borders and
  color only; `elevated` uses real shadows.
- **`typeScale`** — the size gap between your biggest heading and body text. `compact` keeps
  headings close to body size, `dramatic` makes them large, `standard` is a normal
  editorial ramp.
- **`controlHeight`** — how tall the things you click are: buttons, inputs, list rows, menu
  items, nav bars. `compact` is for dense pointer-driven screens, `standard` is the desktop
  norm, and `touch` holds every one of them at or above the 44px minimum a finger needs.
  **If the product ships to a phone, answer `touch`.** Nothing infers this. Height is
  ergonomics, not style, so `styleDirection` does not supply it and no default will
  discover it for you — omit the key and you get `standard`, which is a 40px tap target.

## Intent field — `styleDirection`

This answers the four style questions above **for you**, so you can skip the two that need
taste and a mockup (`density`, `typeScale`). It maps to Tier 2 values in
[`direction-mappings.json`](direction-mappings.json).

**Precedence — general to specific, more specific wins:**

    styleDirection  <  the value you write

A value you write is **never** overridden. Omit `edges` / `density` / `shadowDepth` /
`typeScale` to let `styleDirection` supply them; the built-in defaults apply only when
nothing else does. `npm run configs` prints each resolved value with the layer that
supplied it.

There was a second intent field, `productType`, supplying the same four values plus
`controlHeight` and a starter pick-list. Two suppliers for one value meant the resolved
scale could not be stated without running the generator and reading which layer won — and
the blocks genuinely conflicted, `dashboard` saying `type-scale: compact` against its own
suggested `clean` saying `standard`. It was cut. An answers file that still names it fails
with a message saying what to set instead; it is refused rather than ignored, because
ignoring it would silently drop a phone product from the touch ladder.

`projectName` remains metadata only: it travels with the config for provenance and changes
no token.

**`styleDirection`** — the intended visual philosophy (reference points in parens):
`clean` (Linear, Notion) · `soft` (Material, Stripe) · `bold` (Spotify, Framer) ·
`editorial` (Medium, NYT) · `brutalist` (dev/art portfolios) · `corporate` (M365, Salesforce) ·
`glass` (macOS, Win11) · `retro` (Poolsuite, Teenage Engineering) · `luxury` (Aesop) ·
`playful` (Duolingo, game UIs)

---

All 44 components are available in the catalog; projects pick the subset they need
(see [`CATALOG_SPEC.md`](../CATALOG_SPEC.md)). The full pick list is generated to
[`catalog/atoms.json`](../catalog/atoms.json).
