# Tokens-driven design systems are substrate, not visual ambition

A tokens-driven design system (Loom, Material Design 3, hand-rolled) provides the **foundation** for any project that uses it: palette, type scale, atom components, CSS reset, semantic role tokens. That foundation is table-stakes for *modern and polished*. It is not visual ambition. It cannot be — tokens are tuned for cross-project reuse, which means tuning toward the median project type (usually dashboards).

The Awwwards-tier energy lives elsewhere. Anyone scaffolding a token-driven design system into a marketing or portfolio site needs to know this up front, or they will react to a bare skeleton and conclude the system is broken. It isn't broken. They just haven't started the characterization layer yet.

## What the substrate gives you

- A coherent color palette with role tokens (surface, on-surface, primary, outline, etc.)
- A consistent type scale across display/title/body/label
- 30–60 atom components — Button, Input, Select, Dialog, Card, etc. — built on the tokens
- Sensible defaults for spacing, radii, motion, focus rings
- Reasonable dark mode
- Theme-swap discipline

That's a working starting point. A scaffolded page using only these elements will look:
- Clean
- Consistent
- Professional
- **Plain**

For a dashboard, plain is good. For a marketing site, portfolio, or anything trying to *catch the eye*, plain is the failure mode.

## What you have to build on top

The visual ambition is project-owned. None of the following ship with the substrate; all of them are made per-project, post-scaffold, by the engineer building the consuming site:

- **Mono-accent vocabulary** — telemetry strips, bracket adornments, data chips, terminal-style labels. Texture and personality at small scales.
- **Decoration SVGs** — notched corners, section dividers, drift-trim, custom dividers, ASCII flourishes. Section-level personality.
- **Hero media** — 3D pieces, GIF reels, video loops, generative imagery. The expensive centerpiece move.
- **Per-section design passes** — each section gets its own treatment. Densities vary. Compositions vary. The page isn't one tone; it's a sequence of distinct moments.
- **Asymmetric layouts** — anchored content, off-center compositions, breaking the centered-`max-w-3xl` default.
- **Display typography composition** — not just bigger headings, but *placed* headings. Type as object, not just label.
- **Animation language** — ambient motion, snap interactions, scroll-driven reveals.
- **Photo treatments** — cut-out greyscale on dark, color-graded sequences, masked stickers.

For a portfolio or marketing site, expect this layer to consume **substantially more** time than the foundation work. The substrate is one day. The characterization is a sprint.

## The trap

A new contributor (or your future self after a context switch) scaffolds the design system into a new project, sees a bare semantic skeleton with token colors and font, and concludes: *this looks plain, the system isn't giving me anything.*

The system gave you exactly what it's supposed to give. The plain-ness is the absence of characterization, not a token-system failure.

The right response is not to:
- Try to push more visual ambition into the substrate (it'll break for other consumers)
- Abandon the system and hand-roll everything (loses every benefit of the foundation)
- Add custom CSS that overrides the tokens (defeats the whole point)

The right response is to **build the project-owned characterization layer**. The substrate isn't trying to make your portfolio Awwwards-worthy. It's making sure your portfolio's *foundation* doesn't actively hold it back.

## Dashboards vs. marketing — different ratios

- **Dashboards:** substrate may be ~80% of the design surface. Atoms compose into screens; characterization is minimal because clarity beats wow. Awwwards energy is the wrong target; effective state management and information density are the right ones.
- **Marketing / portfolio sites:** substrate is ~20% of the design surface. The rest is characterization. The site exists to make you *feel* something about the work; that's accomplished by texture, motion, personality, surprise — none of which the substrate provides.

Tokens-driven systems that try to do both end up tuned for neither. This is the production observation behind Loom v2's first-class marketing primitives + picker: a project pulls the substrate plus only the catalog atoms it needs, and authors its characterization on top.

## How to plan for the characterization work

When scoping a marketing or portfolio build that uses a tokens-driven design system:

1. Day 1: scaffold the substrate, get the foundation up. This is fast.
2. Then: list the characterization atoms the project needs — mono accents, decoration SVGs, per-section media, layout treatments. Expect 15–25 of them for a portfolio.
3. Build them in context as the page demands them, not speculatively. See `../design-system/ownership-lifecycle.md`.
4. Per-section design passes after atoms exist. Each section is its own composition.
5. The "is this Awwwards-worthy yet" question lives in the characterization layer's progress, never in the substrate's.

## Related

- `../design-system/pipeline-architecture.md` — three-layer model for token-driven systems
- `../design-system/ownership-lifecycle.md` — build atoms in context as the page demands them
