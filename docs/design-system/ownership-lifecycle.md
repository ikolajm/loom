# Ownership & lifecycle (Loom's downstream model)

How Loom's atoms relate to the projects that consume them. Relocated from working memory 2026-06-03 — Loom doctrine, loads when working on Loom, not at every JAMIE startup.

## Atoms are project-owned (the downstream lifecycle)

The generator is a **starter kit, not a dependency**. Downstream projects are ejected from day one — avoids the upgrade treadmill and version pinning; clients own their code on delivery; personal projects (Paperboy, Party Wipe) evolve independently.

Three layers, three lifecycles:
- **Tokens** (`tokens.css`) — safe to recopy from the generator. Components reference CSS variables, so swapping tokens updates everything without code changes.
- **Atoms** (`components/atoms/`) — project-owned after scaffold. Edit in place. Cherry-pick generator improvements by diffing, not re-scaffolding.
- **Molecules / organisms / pages** — built in the downstream project, never generated.

Rules: never re-run `setup.sh` on a running project (full regeneration is for new projects only); new reusable atoms get built in the project first, backported to the generator only once proven reusable across projects; no version tracking between generator and downstream — each project is independent after scaffold. This is the lifecycle the **shadcn-style catalog pattern** operationalizes.

## Atoms are production baselines (build quality)

Atom components are the baseline for every project's molecules and organisms — so each must be a *good* component, not a scaffold. Build the component file and its story together, top to bottom, noting what can generalize back into the generator. Use real patterns (CVA, proper structural markup, real props, design tokens), not demos. After each batch, extract the repeatable patterns back into the generator scripts so future projects inherit the quality automatically. (Component-level UI + schematic diagrams: hand-build first, mechanize once the pattern proves out — see `codegen-pattern.md`.)
