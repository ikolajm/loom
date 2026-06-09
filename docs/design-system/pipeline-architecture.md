# Design System Pipeline Architecture

A reusable architecture pattern for token-driven design systems where Figma and code stay in sync without manual drift.

## The three-layer model

A pipeline has three distinct layers, each with a different purpose:

| Layer | Source | Drives | Lifecycle |
|-------|--------|--------|-----------|
| **Config** | JSON files in `spec/config/` | Both Figma and code outputs | Owned by the pipeline; regenerable |
| **CVA** (`class-variance-authority`) | Component templates | Variant management, TypeScript types, styling logic | Generated from configs |
| **Radix / lib primitives** | Behavior layer | Accessibility, keyboard, focus, portals | Imported, wrapped with config-derived styling |

Components that need behavior (Dialog, Select, DropdownMenu) wrap Radix. Components that are styled elements (Button, Card, Badge) use CVA only. Components that need a specialized dependency (Carousel→embla, Calendar→react-day-picker, Combobox→cmdk) are lib-wrapped with the same config-derived styling pattern.

## Config as single source of truth

The configs drive *both* Figma AND code. Same JSON, two pipelines:

```
spec/config/*.json
       │
       ├──► Figma scripts ──► Variables, text styles, component sets
       │
       └──► Code generators ──► tokens.css, components, stories
```

**Why this works:** token and value changes flow to both sides from one edit — change a token, regenerate, Figma and code update together.

**The caveat (hard-won):** the two pipelines are *separate codebases* interpreting the same config. Values flow for free; **structure does not**. A change to config *shape* — a new variant axis (orthogonal `variant × color`), a renamed key (badge's color axis is `state`, not `color`), an atom moved between groups (`toolbar` Buttons → Layout) — must be taught to **both** the Figma builders and the code generators. Skip one side and they drift: the side you edited regenerates clean, the side you didn't silently lags.

## Component ownership model (Shadcn-style)

The design system is a *starter kit*, not a dependency. Downstream projects eject from day one.

| Layer | Lifecycle in downstream project |
|-------|--------------------------------|
| **Tokens** (`tokens.css`) | Safe to recopy. Components reference CSS variables — swapping tokens updates everything. |
| **Atoms** (`components/`) | Picked per-project via `loom-picks.json` and copied in flat by `setup.sh`. Project-owned after install — edit in place. Pull generator improvements by diffing, not re-installing. |
| **Molecules / organisms / pages** | Built downstream, never generated. The generator doesn't touch these directories. |

**Why this works:** no upgrade treadmill, no version pinning, no breaking changes. Agency clients own their code on delivery. Personal projects evolve independently.

### Two delivery models, one config

The catalog model treats the two outputs asymmetrically — by role, not by accident:

| Surface | What it delivers | Scope |
|---------|------------------|-------|
| **Code** | Picked atoms copied into the consuming project (`loom-picks.json` → `setup.sh`) | Per-project subset — projects take only what they use |
| **Figma** | One canonical Loom file showing every catalog atom | All-atom browse reference; consumers don't get a filtered Figma file |

Figma's job is *browse* ("what's available"), so all-atom is correct there; per-project picking is a code-delivery concern Figma doesn't share. Both still regenerate from the same `spec/config/`.

## Surface elevation rule

Loom defines four surface levels: `surface` (page background) and `surface-1` / `-2` / `-3` (progressive elevation). **Atoms default to `surface-1`** — one step up from the page — so a bare atom dropped onto a page reads as a distinct surface with no configuration. The level controls the atom's background fill, and by extension the contrast its interactive states step *relative to*: an affordance sitting on `surface-1` steps its hover/selected state to `surface-2`, not back down to the page.

**Composition-level concerns override at the parent, not the atom.** A `Card` inside an already-elevated `Dialog` takes its surface from the dialog context; a header inside a table sets its own. The atom never encodes where it will be composed — it stays a clean primitive that the parent positions.

**Why default-at-the-atom, override-at-the-parent:** baking elevation logic into atomic configs would couple every atom to its eventual context and make composition brittle (every atom would need an elevation prop threaded through from wherever it lands). A sensible default plus parent override keeps atoms context-free and composition flexible.

## When to break which layer

| Need | Solution |
|------|----------|
| New token (color, spacing, type scale) | Edit `spec/config/`, regenerate |
| New component variant (e.g. `destructive` button) | Edit component config, regenerate |
| New component | Add to config, write template if it needs custom logic, regenerate |
| Behavior change (e.g. dialog should trap focus differently) | Modify the Radix wrapper template |
| Project-specific styling | Override at the consumer, not the template |

## Failure modes

- **Hand-built styles drift from configs.** If you eyeball a component, it will diverge from the config it's supposed to mirror. Always derive mechanically. See `codegen-pattern.md`.
- **Updating one pipeline but not the other.** Figma builders and code generators are separate code over shared config. A structural config change regenerates clean on the side you edited and silently lags on the side you didn't. Update both, then **visual-confirm Figma** — a green assemble only proves the scripts *run*, not that they match the catalog (a builder reading a now-removed config key throws at paste time; one reading a stale shape renders the wrong thing without erroring).
- **Re-scaffolding a running project.** Full regeneration is for new projects only. Once shipped, it's the consumer's code.

## Related

- [codegen-pattern.md](codegen-pattern.md) — when to hand-build vs. mechanize
- [figma-mcp.md](figma-mcp.md) — Figma Plugin API gotchas
