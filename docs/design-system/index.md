# Loom — Design-System Engineering Docs

How Loom works: the architecture, catalog model, and the codegen/Figma/scaffold knowledge behind the generator. Relocated from `knowledge/design/` (2026-06-03) — these document Loom specifically, not general design (general design patterns + reference stay in [`knowledge/design/`](../../../knowledge/design/index.md)).

## Patterns & architecture

| Doc | What it covers |
|-----|----------------|
| [pipeline-architecture](pipeline-architecture.md) | The three-layer model (Config + CVA + Radix/lib), config-as-truth, component ownership — Loom's architecture |
| [shadcn-style-catalog-pattern](shadcn-style-catalog-pattern.md) | First-party catalog + per-project picker — the model Loom v2 implements |
| [codegen-pattern](codegen-pattern.md) | R&D-then-mechanize — when to hand-build vs. generate |
| [tokens-as-tailwind-utilities](tokens-as-tailwind-utilities.md) | Register `tokens.css` vars in Tailwind v4 `@theme` so utilities actually get used |
| [figma-mcp](figma-mcp.md) | Figma Plugin API gotchas, data formats, validated patterns, shared-utils architecture |
| [scaffold-playground-patterns](scaffold-playground-patterns.md) | Playground/stories bug fixes + conventions (from Paperboy upstream feedback) |

## Catalog substrate (data)

| File | Role |
|------|------|
| [components.json](components.json) | The component catalog — 48 components × variant/state/token anatomy. The available-components manifest; reconcile with [`CATALOG_AUDIT.md`](../../CATALOG_AUDIT.md). |
| [registries.md](registries.md) | Live fetch endpoints for component source (Shadcn, Material, Vercel) — fetch on demand, don't snapshot |

Loom's project-level specs are one level up: [`CATALOG_SPEC.md`](../../CATALOG_SPEC.md) · [`CATALOG_AUDIT.md`](../../CATALOG_AUDIT.md).
