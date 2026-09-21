# Quickstart

Consuming Loom in a project: build your brand, sync it in, wire it up. Read this
once, linearly. [`substrate.md`](substrate.md) is the reference you come back to.

Requires Node >= 18.18.

---

## 1. Build your brand

Loom builds with no configuration at all — a fresh clone generates Loom's own look,
because the committed token set in `spec/config/base/` is a complete working default.
To build *your* brand, hand-author `spec/answers.json`. It is git-ignored, so copy the
committed template first:

```bash
cp spec/answers.example.json spec/answers.json
```

[`../spec/questionnaire.md`](../spec/questionnaire.md) is the full key reference. Then
run the three pipelines:

```bash
npm run configs      # spec/answers.json -> spec/config/local/  (git-ignored)
npm run generate     # -> React catalog (catalog/) + the four stylesheets
npm run figma        # -> Figma plugin scripts (paste into the Figma console)
```

Re-run them any time you change a value in `spec/answers.json` or a component schema
in `spec/config/components/`.

**Where your brand lands.** `npm run configs` writes to `spec/config/local/`, never to
the committed set, so generating a brand never dirties the Loom repo. Every generator
resolves each config file through `local/` first and falls back to `spec/config/base/`.
Two things follow: hand-edit `spec/config/local/` rather than `spec/config/base/`, which
fails the `base-config-provenance` check on the next generate; and deleting
`spec/config/local/` reverts you to Loom's default look.

**The `npm install` is only for the compile gate.** Generating Loom is pure Node with no
dependencies; the typecheck over `catalog/` skips itself when `node_modules` is absent
rather than failing a generate that is otherwise fine.

To check that a brand landed, open [`preview.html`](preview.html) after generating. No
dev server and no route in your project — a static file answers the question.

---

## 2. Install it into a project

Your project lives **alongside the Loom repo, not inside it** — Loom is the factory,
your app is a separate project it builds into. The clean layout is siblings:
`~/projects/loom` and `~/projects/my-loom-app`.

**Two tiers.** Both are `npm run sync`; the difference is one flag.

| Tier | You get | Use when |
|------|---------|----------|
| **tokens** (`--tokens`) | the stylesheets, nothing else — no components, no dependencies | You have your own components and want Loom's design decisions as values |
| **catalog** (default) | The tokens tier, plus the whole catalog and `ThemeProvider` | You want the components too |

```bash
# From the Loom repo, pointing at your project by path.

# Tokens tier — four stylesheets into <project>/src/, nothing else:
npm run sync -- ../my-loom-app --tokens --answers ../my-loom-app/loom-answers.json

# Catalog tier — the same, plus every component into <project>/src/components/loom/:
npm run sync -- ../my-loom-app --answers ../my-loom-app/loom-answers.json
```

**Keep your answers file in your project, and pass it with `--answers`.** Without it the
sync emits whichever brand is active in this checkout — the right default for a maintainer
and the wrong one for you. `spec/answers.json` here is a single slot, one brand at a time,
so a Loom repo used for two projects has forgotten the first one's brand. `--answers`
resolves yours into a throwaway config root, so the sync never writes to this repo and
never depends on what it was last used for.

**From the consumer side it is `npm run loom:sync`.** The first sync writes that script
into your project's `package.json` on both tiers, so a refresh runs from your own
directory. It is written rather than documented because the sync is the only thing that
knows the path between the two repos. It is deliberately **not** wired into `predev`: a
dev server that cannot start without a sibling repo present is a worse failure than a
stale stylesheet, and it lands on whoever clones the project next.

**Every delivered file is overwritten on every sync**, and each says so in a generated
header. There is no edit detection and nothing to force. A change you want to keep goes
at the call site — a className, a prop, a wrapper — which survives every resync by
construction. Deleting a component you do not want is temporary; it returns on the next
sync, deliberately ([why](catalog.md#install)).

The sync prints the `npm install` line for the packages those components import, taken
from their manifests; your project owns its lockfile, so Loom reports deps rather than
installing them. The components need React 19 and the packages their manifests name; they
need no CSS framework at all.

A sync always regenerates the substrate, so your tokens are current by construction; only
`catalog/*.tsx` can lag behind the schemas it was built from. The sync **reports** that in
one line rather than repairing it, because rebuilding the atoms runs the whole pipeline
including a typecheck, and refreshing a brand should not fail on a surface it has never
heard of. Pass `--refresh` when you do want them rebuilt.

---

## 3. Wire it in

Three things, once. **There is no app shell and no framework assumption** — Loom writes
nothing that presumes a router, a root layout or a `src/app/`. Where a provider mounts is
your framework's business.

1. **Wire the substrate in.** One `@import "./main.css"` in your global stylesheet —
   plain CSS, no build step. If you own your components, import the three directly in
   order and drop the `loom.components.css` line.
   [The order is load-bearing](substrate.md#the-four-files-and-the-layer-order).

2. **Wrap your own reset in `@layer loom.reset`** and import it before `tokens.css`.
   Loom declares that layer and leaves it empty; it is the weakest slot in the order, so
   a reset sitting in it loses to Loom's classes — which is what you want.

   ```css
   @layer loom.reset {
     button { font: inherit; background: none; border: none; cursor: pointer; }
   }
   ```

   Leave that same reset unlayered and it becomes the *strongest* rule on the page,
   because unlayered CSS beats layered CSS regardless of specificity. Your buttons then
   render with no background and no border. **This is the single most common way a Loom
   install looks broken** — [`substrate.md`](substrate.md#the-four-files-and-the-layer-order)
   has the order, [`gotchas.md`](gotchas.md#loom-ships-in-cascade-layers-so-anything-unlayered-outranks-all-of-it)
   has the symptom.

3. **Wire theme switching, which is two artifacts.** Paste the body of
   `components/loom/theme-init.js` into an inline `<script>` in `<head>`, before your
   stylesheet — it reads the stored choice and sets `data-theme` and `color-scheme` on the
   first frame. Then mount `ThemeProvider` at your app root; it persists changes and owns
   everything after that frame. Skip the snippet and the theme still works one frame late,
   so anyone on the non-default mode sees a flash of the default on every load. It cannot
   be a component: React renders after the first paint, so nothing it owns can set an
   attribute before that paint exists. Do not load it with `<script src>` — deferred it
   runs after the paint it exists to precede, undeferred it costs a round trip before it.

4. **Load your fonts.** Loom names them; you load the bytes. The questionnaire takes one
   family per role (`heading` / `body`) and `tokens.css` emits them as
   `'Your Family', system-ui, sans-serif` — so a `<link>`, an `@font-face`, `next/font`,
   an `@fontsource` package, whatever your framework prefers.

   **Loom recommends no typeface**; that is identity, and identity is yours. What it
   supplies is the ramp under it, six roles across two families
   ([the table](../spec/questionnaire.md#fonts--heading--body)). How to spell the family
   and which weights the ramp asks for are in that section. **Every way of getting it
   wrong fails silently on the code side** — nothing warns, by construction
   ([why](gotchas.md#fonts--two-pipelines-one-family-name)). Skip this step and the page
   renders in system sans, which is the brand not landing.

---

## Next

- **A Figma file from the same brand** — [`figma.md`](figma.md). A separate surface;
  nothing above depends on it.
- **What the stylesheets hold** — [`substrate.md`](substrate.md). The layer order, tones
  and treatments, the spacing categories, and reading the tokens somewhere with no CSS
  engine at all.
- **Something is silently wrong** — [`gotchas.md`](gotchas.md).
