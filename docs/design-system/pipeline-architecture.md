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

**Why this works:** drift is impossible. Change a token, regenerate, both sides update. No more "the Figma file says one thing, the code says another."

## Component ownership model (Shadcn-style)

The design system is a *starter kit*, not a dependency. Downstream projects eject from day one.

| Layer | Lifecycle in downstream project |
|-------|--------------------------------|
| **Tokens** (`tokens.css`) | Safe to recopy. Components reference CSS variables — swapping tokens updates everything. |
| **Atoms** (`components/atoms/`) | Project-owned after scaffold. Edit in place. Cherry-pick generator improvements by diffing, not re-scaffolding. |
| **Molecules / organisms / pages** | Built downstream, never generated. The generator doesn't touch these directories. |

**Why this works:** no upgrade treadmill, no version pinning, no breaking changes. Agency clients own their code on delivery. Personal projects evolve independently.

## Surface elevation rule

Atoms default to `surface-1` as their base background. Composition-level concerns (cards inside dialogs, headers inside tables) override at the parent.

**Why this works:** prevents elevation logic from getting baked into atomic configs, which would make composition brittle. Each atom is a clean primitive.

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
- **Cherry-picking components from the manifest.** Cheaper to ship the full library and ignore unused atoms than to maintain a filter.
- **Re-scaffolding a running project.** Full regeneration is for new projects only. Once shipped, it's the consumer's code.

## Related

- [codegen-pattern.md](codegen-pattern.md) — when to hand-build vs. mechanize
- [figma-mcp.md](figma-mcp.md) — Figma Plugin API gotchas
