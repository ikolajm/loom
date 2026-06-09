# Tailwind v4 + tailwind-merge gotchas in generated atoms

Two ways Tailwind bit the catalog where the generated code *looked* correct and the build was green. One is resolved with a reusable fix; one is still open. Both were caught at visual-confirm, not by typecheck — build-green hid them.

## 1. `.interactive` position footgun (resolved)

**Symptom.** Carousel arrows passed `className="absolute ..."` through `Button` fell into normal document flow and stacked at the top instead of pinning to the viewport edges.

**Root cause.** Button's base pulls Loom's `.interactive` utility, which **hard-sets `position: relative`**. When you pass `absolute` via Button's `className`, tailwind-merge keeps it — but tailwind-merge *cannot dedupe a custom utility class (`.interactive`) against a Tailwind position utility (`absolute`)*. It has no idea `.interactive` also sets `position`. So both land in the class list, and the cascade resolves `.interactive`'s `position: relative` as the winner. The `absolute` is present in the DOM and silently overridden.

This is general: **any base class that sets a CSS property via a custom (non-Tailwind) utility will win over a Tailwind utility for the same property passed through `className`**, because tailwind-merge only knows about Tailwind's own class vocabulary.

**Fix — wrap, don't override.** Don't try to absolutely-position a Button via `className`. Wrap it in a plain `<div className="absolute ...">` (no `.interactive`), scoped inside a `relative` viewport wrapper:

```tsx
<div className="relative">            {/* viewport */}
  <div className="absolute left-2 top-1/2 -translate-y-1/2">
    <Button iconOnly>…</Button>      {/* Button keeps its own .interactive position:relative, harmlessly */}
  </div>
</div>
```

Applies to *any* Button (or any `.interactive`-based atom) you try to position via className.

## 2. Tailwind v4 custom-keyframe stripping (OPEN — root cause unresolved)

**Status: unresolved.** Documented here so the next attempt starts informed; not yet a solved pattern.

**Symptom.** The `marquee` atom defined a custom `@keyframes marquee` + an `--animate-marquee` theme entry (the Tailwind v4 way to register a custom animation utility). In the playground build, Tailwind v4 **kept stripping the keyframes / never emitted the `animate-marquee` utility** — the element rendered static, no animation, no error. Built green, did nothing.

**What's strange.** `accordion` uses an identically-shaped pattern (custom `@keyframes` + `--animate-*` theme token) and it **works**. marquee's didn't. The two looked the same; only one emitted. Root cause not isolated — candidates not ruled out: scanner not seeing the utility reference, `@theme` vs `@theme inline` placement, keyframe name collision, build-order in the playground specifically.

**Current call.** marquee was **pulled from the catalog** and deferred downstream to a project with real consuming context (where the build is a normal app build, not the playground harness). Revisit there. If you root-cause it, this section graduates from "open gotcha" to a solved pattern in [tokens-as-tailwind-utilities.md](tokens-as-tailwind-utilities.md).

## Why both escaped the build

Neither is a type error or a compile failure — a kept-but-overridden class and a silently-not-emitted utility both produce valid, green builds. They only show up when you *look* at the rendered result. This is the standing case for visual-confirm being a non-optional step, not the build passing.

## Related

- [tokens-as-tailwind-utilities.md](tokens-as-tailwind-utilities.md) — registering custom CSS so Tailwind v4 emits it (the mechanism gotcha #2 fails at)
- [scaffold-playground-patterns.md](scaffold-playground-patterns.md) — other build-green-but-broken patterns the playground surfaced
