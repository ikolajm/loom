# Loom — Design-System Engineering Docs

How Loom works: the architecture, catalog model, and the codegen/Figma/scaffold knowledge behind the generator. Relocated from `knowledge/design/` (2026-06-03) — these document Loom specifically, not general design (general design patterns + reference stay in [`knowledge/design/`](../../../knowledge/design/index.md)).

## Patterns & architecture

| Doc | What it covers |
|-----|----------------|
| [pipeline-architecture](pipeline-architecture.md) | The three-layer model (Config + CVA + Radix/lib), config-as-truth, component ownership — Loom's architecture |
| [orthogonal-variant-color](orthogonal-variant-color.md) | Two independent style axes (treatment × color) via CSS-var axes — N+M, not an N×M compound matrix (Button/Badge) |
| [shadcn-style-catalog-pattern](shadcn-style-catalog-pattern.md) | First-party catalog + per-project picker — the model Loom v2 implements |
| [codegen-pattern](codegen-pattern.md) | R&D-then-mechanize — when to hand-build vs. generate |
| [tokens-as-tailwind-utilities](tokens-as-tailwind-utilities.md) | Register `tokens.css` vars in Tailwind v4 `@theme` so utilities actually get used |
| [figma-mcp](figma-mcp.md) | Figma Plugin API gotchas, data formats, validated patterns, shared-utils architecture |
| [scaffold-playground-patterns](scaffold-playground-patterns.md) | Playground/stories bug fixes + conventions (from Paperboy upstream feedback) |
| [reduced-motion-semantics](reduced-motion-semantics.md) | `prefers-reduced-motion` is per-atom: autonomous motion honors it, direct-manipulation (scroll-progress) deliberately doesn't |
| [tailwind-v4-gotchas](tailwind-v4-gotchas.md) | `.interactive` position footgun (tailwind-merge can't dedupe custom vs position utility — resolved) + custom-keyframe stripping (marquee — OPEN) |

## Catalog substrate (data)

| File | Role |
|------|------|
| [components.json](components.json) | The component catalog — 48 components × variant/state/token anatomy. The available-components manifest; reconcile with [`CATALOG_AUDIT.md`](../../CATALOG_AUDIT.md). |
| [registries.md](registries.md) | Live fetch endpoints for component source (Shadcn, Material, Vercel) — fetch on demand, don't snapshot |

Loom's project-level specs are one level up: [`CATALOG_SPEC.md`](../../CATALOG_SPEC.md) · [`CATALOG_AUDIT.md`](../../CATALOG_AUDIT.md).
