# Loom

Loom generates a **design substrate** from one config file: a token set and a CSS
class layer that carry a brand's corners, focus rings, hover feel, surfaces and
states as named decisions instead of per-project choices.

The coherence is the product. Tokens name the values; the class layer names the
combinations, which is the part a values-only system cannot carry and the reason
everything built on Loom looks like one hand made it — a Next app, a Vite app and a
server-rendered template alike, the last with no framework under it at all.

Two things ride along. **Figma** takes the same substrate as variables, text styles
and effect styles, so the design surface and the code surface read from one source.
A small set of **React components** covers what CSS cannot express — focus traps,
portals, keyboard navigation, positioning — copied into your project rather than
installed from it, and yours to edit once they land.

Loom started as a personal engine for spinning up consistent projects. It is open
source for the model.

---

## The idea in one diagram

```
                        spec/answers.json
                                │
                                ▼
                          spec/config/         ← single source of truth
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
   tokens.css                                      class layer
   + Figma variables,                              appearance, states,
   text & effect styles                            interaction feel
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
                        behavior components
                        React, only where CSS cannot reach
                        (focus traps, portals, keyboard nav, positioning)
                                │
                                ▼
                         consuming project
                         (copy what you need, own the copies)
```

Change a value in `spec/answers.json` → regenerate → every output moves together,
because they read the same JSON. Figma takes the token half as variables and styles;
the class layer is CSS-only, since Figma has no notion of a class.

---

## See it run

Requires Node ≥ 18.18. A fresh clone builds Loom's own look with no configuration
at all — the committed token set in `spec/config/base/` is a complete working default.

```bash
npm install && npm run generate    # then open docs/preview.html
```

[`docs/preview.html`](docs/preview.html) renders the whole class layer and the token
half with the three stylesheets and nothing else underneath — no framework, no build
step, no utility layer. What renders there is what a consumer gets, so a brand lands
or does not land in one place.

---

## Where to go next

| You want to | Read |
|---|---|
| Use Loom in a project | [`docs/quickstart.md`](docs/quickstart.md) — build a brand, sync it in, the four wire-in steps |
| Look up what the stylesheets hold | [`docs/substrate.md`](docs/substrate.md) — the four CSS files, the layer order, tones and treatments, the spacing categories, reading the tokens with no CSS engine |
| Know what components ship, and their contracts | [`docs/catalog.md`](docs/catalog.md) — manifests, the install flow, the native-first recipes |
| Build the Figma file | [`docs/figma.md`](docs/figma.md) — the paste workflow, the console's failure modes, font availability |
| Extend or debug the generator | [`docs/pipeline.md`](docs/pipeline.md) — the derivation chain end to end, and where a symptom points |
| Author a component schema | [`docs/class-layer.md`](docs/class-layer.md) — what a schema can and cannot express, and how to review the emitted CSS |
| Get past something that is silently wrong | [`docs/gotchas.md`](docs/gotchas.md) — the traps: cascade layers, fonts, reduced motion, target size |
| Look up an answer key | [`spec/questionnaire.md`](spec/questionnaire.md) |

**If you are consuming Loom, the quickstart is the whole surface.** Everything else
is for extending the generator.

---

## Repo layout

```
spec/                  Single source of truth
  config/
    base/              ← Loom's committed default token set — the fallback
    local/             ← your generated brand (git-ignored; preferred over base/)
    components/        ← hand-authored component schemas, one file per group
    figma/             ← Figma variable-collection definitions
    presentation/      ← Figma documentation chrome (layout, templates)
  questionnaire.md     ← the tiered intake that drives base/ tokens
  answers.example.json ← committed template — copy to answers.json (git-ignored) and edit

scripts/               The two codegen pipelines
  code-templates/      ← React catalog + the four stylesheets
  figma-*/             ← Figma variables / styles / page layout
  assemble-figma.js    ← bundles the Figma plugin scripts
  sync.js              ← installs the catalog + substrate into a project (`npm run sync`)

catalog/               Generated output — per-atom .tsx + .manifest.json
generated/             The stylesheets and the Figma paste scripts (git-ignored)
docs/                  Everything in the table above, plus the generated preview page
```

---

## License

[MIT](LICENSE) © 2026 Jacob Ikola
