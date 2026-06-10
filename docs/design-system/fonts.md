# Fonts: two pipelines, one family name

Fonts are the one token where the two surfaces have **different capabilities**, so they get explicit handling instead of a straight pass-through. The questionnaire takes a single family name per role (`heading` / `body`); both pipelines consume it, but they can render different sets:

| Surface | Loads via | Failure mode (raw) |
|---|---|---|
| **Code** | runtime Google Fonts `<link>` in `layout.tsx` | unknown name → **silent** fallback to system sans |
| **Figma** | `figma.loadFontAsync({ family, style })` | unavailable family → **throws**, crashes the paste |

Google Fonts and Figma's font set are **not 1:1** (Figma = system fonts + a Google subset + org-uploaded). So a name can load in code yet be absent in Figma. Left raw, one surface fails silent and the other fails loud-and-ugly.

## The handling: check each surface against its own authoritative source

No maintained "GF ∩ Figma" list — it drifts and is environment-specific. Instead:

- **Code side** — the Google Fonts `<link>` *is* the proof. `layout.tsx` builds the URL from the family name (`family=Space+Grotesk:wght@…`, spaces encoded). Self-host by editing the project-owned `layout.tsx`.
- **Figma side** — Figma knows its own fonts. `figma.listAvailableFontsAsync()` is queried at paste time (the authoritative moment), and any missing family **substitutes Inter** (which Figma hosts) so the build completes instead of throwing.

## Where it lives (both placements)

- **Config time (soft, heuristic):** `npm run configs` checks `heading`/`body` against [`spec/parity-safe-fonts.json`](../../spec/parity-safe-fonts.json) — a curated set of Google Fonts Figma reliably hosts — and warns on off-list fonts. Early heads-up, not a gate.
- **Figma paste time (authoritative):** `resolvers.js` carries `reportFontParity` / `resolveFamily` / `safeLoadFont`. `12_styles_text-styles` calls `reportFontParity(families)` up front (the ✓/⚠ report), and every font load resolves through `resolveFamily` → missing family substitutes Inter, logged once. Inlined into component pages via `BASE_MODULES`.

## Why name-input, not a Google Fonts link

A link would guarantee a valid GF font, but Figma and the CSS variable both need the *name* (so you'd parse it back out), and `layout.tsx` already builds the correct `<link>` from the name. The warning system catches the silent-fallback risk directly, so the link adds parsing for no robustness it doesn't already provide. (If per-font weight selection is ever needed, the link earns its place then.)

## Gotcha: non-standard style names

Some families name weights oddly (`"Semi Bold"` vs `"SemiBold"`). `FONT_WEIGHT_OVERRIDES` in `resolvers.js` maps those; `loadFontAsync` throws on a wrong style name, so add the family there when a new font trips it.
