# The Figma side

Loom builds a Figma file from the same config set the stylesheets come from: **variables,
text styles, effect styles and the page layout** — the token half.

**Figma does not receive components.** It has no notion of a class, so the class layer has
no representation there. Build the components you need from the variables.

This is a separate surface from your app. Nothing in
[`quickstart.md`](quickstart.md) depends on it, and it does not depend on anything there
past a generated brand.

---

## Build the file

`npm run figma` writes `generated/figma-scripts/` — `00_shared-utils.js` plus the numbered
step scripts.

1. Open the target Figma file and open a plugin **console** (any dev plugin -> Plugins ->
   Development -> Open console).
2. Paste **`00_shared-utils.js` first** — it defines the helpers the steps reference.
3. Paste the step scripts **in numeric order**. Re-running one later only needs its own
   step script re-pasted.

Step `14` (text styles) runs the font-availability check and reports per family. A font
this Figma cannot render is substituted with Inter so the paste completes — see
[Fonts](#fonts-are-checked-here-and-nowhere-else) below.

---

## Build into a fresh file, or clear it first

The steps are **not idempotent**. Re-pasting onto a file that already has Loom variables
creates duplicate collections. Before a full rebuild on a used file, paste this reset into
the console first:

```js
// Clear variable collections
const collections = figma.variables.getLocalVariableCollections();
for (const col of collections) { try { col.remove(); } catch(e) {} }
// Clear styles
for (const s of figma.getLocalTextStyles()) { try { s.remove(); } catch(e) {} }
for (const s of figma.getLocalEffectStyles()) { try { s.remove(); } catch(e) {} }
// Clear pages — remove children first, then extra pages
for (const page of figma.root.children) {
  while (page.children.length > 0) { try { page.children[0].remove(); } catch(e) { break; } }
}
while (figma.root.children.length > 1) { try { figma.root.children[figma.root.children.length - 1].remove(); } catch(e) { break; } }
```

---

## The paste is a console session, not a build

Everything the Figma half does happens in a plugin console that keeps scope between
pastes, which is where its failure modes come from. What the API itself requires is
embodied in `scripts/figma-*/` and commented at the call site; what follows is only what
reading those files does not tell you.

**Plugin code has a 50,000-character maximum.** That limit is the whole reason for the
shared-utils architecture — paste `00_shared-utils.js` once, then run small step scripts
against the globals it defines — rather than emitting one self-contained script per step.

**A Figma deliverable only changes on re-paste.** Regenerating updates
`generated/figma-scripts/`, not any file you already built: an existing Figma file keeps
its old variables and styles until you run the paste again. "The generator is fixed" and
"the file is fixed" are separate claims, and only the second is checkable by looking.

**Re-pasting `00` into a console that has already run it silently halts.** Top-level
`const`/`let` cannot be redeclared, so the second paste dies at the first collision and
every helper below it never reloads — including the fix you just made. `assemble-figma.js`
emits the bundle with top-level declarations rewritten to `var` so re-pastes redefine
cleanly; the one case left is the first hop out of a `const`-era session, which needs a
console reload.

**Variable IDs are session-specific.** A step resolves the references it needs in its own
run. An ID carried across runs points at nothing, and does so without complaining.

---

## Fonts are checked here and nowhere else

Figma and a browser have **separate font availabilities** — Figma sees system fonts, its
own set and org uploads — so a family that loads fine in your app can be absent here. Only
this surface can check, and it does: `reportFontParity` / `resolveFamily` / `safeLoadFont`
in `scripts/figma-styles/_shared.js`, run by step `14`.

A family being available also says nothing about the weight you want. The ramp asks
400/500/600/700 and many families ship fewer, so `fontStyle()` snaps to the nearest weight
the family actually ships — ties heavier, italics excluded — which is what CSS font
matching already does on the page. `FONT_WEIGHT_OVERRIDES` pins a choice deliberately
unlike the browser's.

The code side warns about none of this, by construction.
[`gotchas.md`](gotchas.md#fonts--two-pipelines-one-family-name) has that half, and
[`../spec/questionnaire.md`](../spec/questionnaire.md#fonts--heading--body) has what the
answer does on each surface.

---

## Cross-references

- [`pipeline.md`](pipeline.md#stage-3--config-set--figma) — how the paste scripts are assembled
- [`quickstart.md`](quickstart.md) — the code side of the same substrate
