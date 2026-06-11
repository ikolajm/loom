# answers.json — Schema Reference (read-only)

Loom's generators read one file: **`spec/answers.json`**, which you hand-author.
This document is the **key reference** — it does not get filled in. Copy the example
below into `spec/answers.json`, edit the values, then run the pipeline:

    npm run configs    # reads spec/answers.json → token configs
    npm run generate   # → React catalog + tokens.css
    npm run figma      # → Figma paste scripts

## Complete example

Every key, with illustrative values (your tokens will differ — this is an example set,
not Loom's "look"):

```json
{
  "projectName": "acme-dashboard",
  "productType": "dashboard",
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
  "typeScale": "standard"
}
```

## Field reference

| Key | Required | Allowed values | Default if omitted | Drives |
|-----|----------|----------------|--------------------|--------|
| `primary` | **yes** | hex `#RRGGBB` | — | brand color ramp; neutral hue |
| `secondary` | no | hex `#RRGGBB` | complementary of `primary` | secondary ramp |
| `accent` | no | hex `#RRGGBB` | triadic of `primary` | accent ramp (always generated) |
| `heading` | no | Google Fonts family name | `Inter` | heading text styles |
| `body` | no | Google Fonts family name | `Inter` | body/UI text styles |
| `edges` | no | `none` · `sharp` · `soft` | `sharp` | border-radius scale |
| `density` | no | `compact` · `comfortable` · `airy` | `comfortable` | spacing scale |
| `shadowDepth` | no | `flat` · `elevated` | `elevated` | shadow/elevation scale |
| `typeScale` | no | `compact` · `standard` · `dramatic` | `standard` | type size range |
| `defaultMode` | no | `dark` · `light` | `dark` | which color mode loads first |
| `projectName` | no | string | `null` | metadata only |
| `productType` | no | see list below | `null` | metadata only |
| `styleDirection` | no | see list below | `null` | metadata only |

Omit any optional key entirely — the generator falls back to the default above.
A value outside the allowed set fails loudly (e.g. `Unknown edges: "round". Valid: none, sharp, soft`).

## Colors

`primary` is the only required color; `secondary` and `accent` are **always generated** —
derived from `primary` (complementary and triadic, respectively) when you don't supply them.
Supply a hex to override the derivation. All three produce a full semantic ramp.

## Fonts — `heading` / `body`

**Use Google Fonts family names.** The generated `layout.tsx` loads fonts via a runtime
Google Fonts `<link>` (not `next/font`), so an unrecognized name **falls back silently to
system sans** rather than failing the build. To self-host or use a non-Google font, edit the
generated `layout.tsx` — it's project-owned.

**Design↔code parity.** Google Fonts and Figma's font set are not 1:1. For guaranteed parity,
pick from [`parity-safe-fonts.json`](parity-safe-fonts.json). Off-list fonts are allowed:
`npm run configs` flags them, and the Figma typography paste reports availability and
**substitutes Inter** for any font this Figma can't render (the build completes, logged once).

## Metadata fields — `productType`, `styleDirection`, `projectName`

These are **stored for downstream context only — the generators do not consume them.** They
record intent (and travel with the config for provenance); they do not change any token.
Setting `styleDirection` does **not** pre-fill the implementation values above — choose those explicitly.

**`productType`** — `dashboard` · `marketing` · `e-commerce` · `content` · `admin` ·
`consumer-mobile` · `portfolio` · `game` · `documentation` · `social` · `other`

**`styleDirection`** — the intended visual philosophy (reference points in parens):
`clean` (Linear, Notion) · `soft` (Material, Stripe) · `bold` (Spotify, Framer) ·
`editorial` (Medium, NYT) · `brutalist` (dev/art portfolios) · `corporate` (M365, Salesforce) ·
`glass` (macOS, Win11) · `retro` (Poolsuite, Teenage Engineering) · `luxury` (Aesop) ·
`playful` (Duolingo, game UIs)

---

All 66 atoms are available in the catalog; projects pick the subset they need
(see [`CATALOG_SPEC.md`](../CATALOG_SPEC.md)). The full pick list is generated to
[`catalog/atoms.json`](../catalog/atoms.json).
