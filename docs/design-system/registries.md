# Design System Registries

Live reference endpoints for production design systems. Fetch on demand when building or speccing components — don't store snapshots.

---

## Shadcn/UI

**Philosophy:** Flat, sharp, developer-ergonomic. Copy-paste components built on Radix primitives + Tailwind.

| Endpoint | Returns |
|---|---|
| `https://ui.shadcn.com/r/index.json` | Full index — 87 components with dependencies, internal dep chains, doc links |
| `https://ui.shadcn.com/r/styles/new-york/{name}.json` | Single component — full source code, npm deps, registry deps |
| `https://ui.shadcn.com/schema/registry-item.json` | JSON schema for registry item format |

**Registry item structure:**
- `name` — component identifier
- `type` — item classification (12 types: ui, hook, theme, page, font, style, etc.)
- `dependencies` — npm packages
- `registryDependencies` — internal component dependencies
- `files[].content` — full source code
- `meta.links` — documentation URLs

**When to fetch:** When building a component's code implementation or checking how Shadcn handles a specific variant/pattern.

---

## Material Design 3

**Philosophy:** Layered, semantic, accessibility-first. Dynamic color, systematic token architecture, platform-aware.

| Resource | URL |
|---|---|
| Component guidelines | `https://m3.material.io/components/{name}` |
| Design tokens | `https://m3.material.io/styles` (color, typography, elevation, shape) |
| Theme builder | `https://www.figma.com/community/plugin/1034969338659738588` (Figma plugin) |
| Material Web (code) | `https://github.com/nickvdyck/material-web` or `https://material-web.dev` |

**When to fetch:** When speccing token structures, semantic color roles, accessibility requirements, or platform-adaptive patterns.

---

## ehmo/platform-design-skills

**Philosophy:** Platform-native rules. Apple HIG + Material Design 3 + WCAG 2.2 compiled into agent-readable format.

| Resource | URL |
|---|---|
| Android/Material skill | `https://raw.githubusercontent.com/ehmo/platform-design-skills/main/skills/android/SKILL.md` |
| Web/WCAG skill | `https://raw.githubusercontent.com/ehmo/platform-design-skills/main/skills/web/SKILL.md` |
| iOS skill | `https://raw.githubusercontent.com/ehmo/platform-design-skills/main/skills/ios/SKILL.md` |

**When to fetch:** When checking platform-specific guidelines or WCAG compliance rules.

---

## Vercel Web Interface Guidelines

**Philosophy:** Code-quality audit checklist. Accessibility, forms, performance, animation, theming.

| Resource | URL |
|---|---|
| Full guidelines | `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` |

**When to fetch:** When validating generated code output or reviewing component implementations.

---

## Usage Pattern

1. Our curated reference pages (`styles.md`, `components.md`, etc.) are the primary knowledge layer
2. These registries are live resources — fetch when actively building or speccing
3. If a fetch reveals something that improves our reference pages, update the pages
4. Don't store raw snapshots — they go stale
