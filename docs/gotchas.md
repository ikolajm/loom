# Loom — Gotchas & hard-won notes

Traps the generated code embodies but can't explain. The code holds the *fix*; these hold the *why* — the landmines that produced the workarounds, kept so the next person (or future-you) doesn't re-pay the hours. The "how it works" is in the code; this is the part that isn't.

---

## Tailwind v4 — tokens must be registered as utilities, or they're ignored

For a tokens-driven system to actually get *used*, the tokens have to be ergonomic. In Tailwind v4 that means registering them in an `@theme` block so they generate utility classes. Without it, tokens exist as CSS variables but get practically ignored — the call-site syntax is ugly enough that engineers reach for `bg-black/40` instead, and the whole point of the design system is silently abandoned.

The raw-variable syntax (what you get without `@theme`):

```jsx
<div className="bg-[color:var(--surface)] border border-[color:var(--outline-subtle)]" />
```

Verbose, hard to remember, awkward with opacity. So `bg-black/40` wins — every component written in a Loom downstream project *before* this pattern was adopted defaulted to raw values, with the tokens sitting right there in `tokens.css`, unused.

**The fix** — register tokens in `@theme`, after the tokens import:

```css
@import "tailwindcss";
@import "../tokens.css";

@theme {
  --color-surface: var(--surface);
  --color-on-surface: var(--on-surface);
  --color-primary: var(--primary);
  --color-outline-subtle: var(--outline-subtle);
  /* …the role tokens that appear in your call sites */
}
```

Now `bg-surface`, `text-on-surface`, `border-outline-subtle/40` all exist — same ergonomics as `bg-black/40`, so the *named* utility becomes the path of least resistance. The double indirection (`--color-surface` → `--surface` → hex) is cheap and means a theme swap follows automatically with no Tailwind rebuild. Loom bakes this block into the scaffold's `globals.css`, so downstream projects get it on day one instead of re-discovering the anti-pattern. **Path of least resistance wins. Always. Design accordingly.**

---

## Tailwind v4 — two generated-code traps that build green

Both *looked* correct and compiled clean; both only showed up at visual-confirm. This is the standing case for visual-confirm being a non-optional step, not the build passing.

### `.interactive` position footgun (resolved)

**Symptom.** Carousel arrows passed `className="absolute …"` through `Button` fell into normal document flow and stacked at the top instead of pinning to the viewport edges.

**Root cause.** Button's base pulls Loom's `.interactive` utility, which **hard-sets `position: relative`**. When you pass `absolute` via Button's `className`, tailwind-merge keeps it — but tailwind-merge *cannot dedupe a custom utility class (`.interactive`) against a Tailwind position utility (`absolute`)*; it has no idea `.interactive` also sets `position`. Both land in the class list, and the cascade resolves `.interactive`'s `position: relative` as the winner — decisively, not narrowly: `tokens.css` is imported **unlayered** while Tailwind v4 puts its utilities in `@layer utilities`, and unlayered styles beat layered ones regardless of source order. The `absolute` is present in the DOM and silently overridden. General rule: **any base class that sets a CSS property via a custom (non-Tailwind) utility wins over a Tailwind utility for the same property passed through `className`** — tailwind-merge only knows Tailwind's own vocabulary.

**Fix — wrap, don't override.** Wrap the Button in a plain positioning `<div>`, inside a `relative` viewport:

```tsx
<div className="relative">              {/* viewport */}
  <div className="absolute left-2 top-1/2 -translate-y-1/2">
    <Button iconOnly>…</Button>         {/* keeps its own .interactive position:relative, harmlessly */}
  </div>
</div>
```

Applies to *any* `.interactive`-based atom you try to position via className.

### Custom-keyframe stripping (OPEN — root cause unresolved)

**Symptom.** The `marquee` atom defined a custom `@keyframes marquee` + `--animate-marquee` theme entry (the Tailwind v4 way to register a custom animation utility). In the playground build, Tailwind v4 **kept stripping the keyframes / never emitted `animate-marquee`** — static element, no animation, no error. Built green, did nothing.

**What's strange.** `accordion` uses an identically-shaped pattern (custom `@keyframes` + `--animate-*`) and it **works**. Root cause not isolated — candidates not ruled out: scanner not seeing the utility reference, `@theme` vs `@theme inline` placement, keyframe name collision, playground-specific build order.

**Current call.** `marquee` was pulled from the catalog and deferred to a project with real consuming context (a normal app build, not the playground harness). Revisit there.

---

## Figma Plugin API

Operational reference for the Figma Plugin API — data formats, gotchas, validated patterns.

**Data formats**
- **Color values are 0–1 floats**, not 0–255. `#3B82F6` → `{ r: 0.231, g: 0.51, b: 0.965, a: 1 }`.
- **Line height** takes an object: `{ value: 24, unit: "PIXELS" }`, not a bare number.
- **Letter spacing** takes an object: `{ value: 0.01, unit: "PERCENT" }` or `{ …, unit: "PIXELS" }`.
- **Font weight binding uses FLOAT** (400, 500, 600, 700), not STRING.

**Font loading**
- Must `await figma.loadFontAsync(...)` before setting any font-dependent property.
- Style names are font-specific (Inter: "Semi Bold" with a space; JetBrains Mono has no SemiBold, 600→"Medium"; Source Sans 3: "SemiBold" no space).
- **Always load Inter Regular as fallback** — `figma.createText()` needs it before `.characters` can be set, even if you override the font after.

**Script limits & architecture**
- Plugin code has a **50,000-character max**. Batch large operations.
- **Shared-utils architecture:** paste the utils bundle once, then run small step scripts that reference globals — 50–70% size reduction per script.
- Variable IDs are session-specific. Get references in the same script; don't hardcode IDs across runs.
- Wrap step scripts in async IIFEs (console scope collisions are real).
- **A Figma deliverable only changes on re-paste.** Regenerating the scripts updates `generated/figma-scripts/`, not any file you already built — an existing Figma file keeps the old variables, styles and components until you re-run the paste. So "the generator is fixed" and "the file is fixed" are separate claims, and only the second one is checkable by looking.
- **Re-pasting the shared-utils bundle throws `redeclaration of const X` and *silently halts*.** Console scope persists across pastes, and top-level `const`/`let` can't be redeclared — so a second paste of `00` dies at the first collision and every helper below it never reloads (a fix you just made silently won't take). `assemble-figma.js` emits the bundle with top-level `const`/`let` rewritten to `var` so re-pastes redefine cleanly. One exception: the first hop *out of* a `const`-era console session still needs a reload (a `var` can't redeclare an existing `const`).

**API quirks**
- **`setBoundVariable()` does NOT work on effect styles** — set `boundVariables` directly on the effect object, then reassign the whole array.
- **`clipsContent` on frames clips shadows** — set `clipsContent = false` on documentation/section frames where shadows must show.
- **`figma.currentPage` is read-only** — use `await figma.setCurrentPageAsync(page)`.
- **No shadow variables** — shadows are effect styles only (individual offset/blur/spread *can* bind to FLOAT vars).
- **`primaryAxisSizingMode`** — `'FILL'` is invalid; use `'FIXED'` / `'AUTO'`, or layout sizing on the parent.
- **Text overflow in fixed parents** — `textAutoResize` won't help; set `layoutSizingHorizontal = 'FILL'` on the text node.
- **Free-plan mode limit** — free accounts may allow only 1 mode per collection.

**Validated patterns**

| Pattern | Mechanism |
|---------|-----------|
| Variable aliasing across collections | `setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: var.id })` |
| Text style binding | `style.setBoundVariable("fontSize", var)` (fontSize, lineHeight, fontFamily, fontWeight) |
| Effect style binding | set `boundVariables` on the effect object, reassign array to style |
| Code syntax | `variable.setVariableCodeSyntax("WEB", "var(--name)")` |
| Component boolean props | `comp.addComponentProperty(name, 'BOOLEAN', default)` + `node.componentPropertyReferences = { visible: propKey }` |
| Slash naming = folder grouping | `color/primary/500` groups as `color/ > primary/ > 500` in the Variables panel |

---

## Figma — master components resolve variables at the collection's *default* mode

**Symptom.** The same component looked different in two places: the master `template/try-me-button` on the Core page rendered with dark text on a darker purple, while every instance of it inside the doc-page preview frames rendered with light text on a lighter purple. Same component, two appearances — looks like a build bug.

**Root cause.** A node's mode-dependent variables resolve against whatever mode is set on the **frame/page that contains it**, via `setExplicitVariableModeForCollection`. The doc preview frames each call `setDefaultMode(frame, defaultMode)` (the doc layer's `light` mode), so instances inside them resolve `color/primary/on-primary` → the light-mode value. The **master** sat in the "System Components" frame, which never set a mode — so it fell back to the `semantic.color` collection's *own* default mode (`dark`), resolving the same token to a different value. This is invisible as long as the component only uses **mode-independent** paints (a direct hex, or a `layout/*` variable with one mode). It only surfaced when the try-me button was switched from `layout/on-accent` (direct hex, one value everywhere) to `color/primary/on-primary` (a two-mode semantic alias).

**Fix.** Apply the documentation default-mode to *every* frame that holds components — including the masters' container, not just the per-atom preview frames. `build-system-frame.js` now calls `setDefaultMode(sysFrame, defaultMode)` so masters resolve identically to their instances.

**The rule:** any frame that contains components bound to mode-dependent variables must declare its mode explicitly. Don't rely on the collection default — a master in an unmoded frame will silently drift from its instances the moment it uses a multi-mode token.

---

## Fonts — two pipelines, one family name

Fonts are the one token where the two surfaces have **different capabilities**, so they get explicit handling instead of a straight pass-through. The questionnaire takes one family name per role (`heading` / `body`); both pipelines consume it, but they can render different sets:

| Surface | Loads via | Failure mode (raw) |
|---|---|---|
| **Code** | runtime Google Fonts `<link>` in `layout.tsx` | unknown name → **silent** fallback to system sans |
| **Figma** | `figma.loadFontAsync({ family, style })` | unavailable family → **throws**, crashes the paste |

Google Fonts and Figma's font set are **not 1:1** (Figma = system fonts + a Google subset + org uploads), so a name can load in code yet be absent in Figma. The handling checks each surface against its *own* authoritative source rather than a maintained "GF ∩ Figma" list (which drifts and is environment-specific):

- **Code side** — the Google Fonts `<link>` *is* the proof. `layout.tsx` builds the URL from the family name. Self-host by editing the project-owned `layout.tsx`.
- **Figma side** — `figma.listAvailableFontsAsync()` at paste time is authoritative; any missing family **substitutes Inter** (logged) so the build completes instead of throwing.

Both placements: a soft config-time warning against [`spec/parity-safe-fonts.json`](../spec/parity-safe-fonts.json) (`npm run configs`), and the authoritative Figma preflight (`resolvers.js`: `reportFontParity` / `resolveFamily` / `safeLoadFont`). **Non-standard style names** (`"Semi Bold"` vs `"SemiBold"`) map through `FONT_WEIGHT_OVERRIDES` in `resolvers.js` — `loadFontAsync` throws on a wrong style name, so add the family there when a new font trips it.

---

## Reduced motion is per-atom, not a blanket rule

`prefers-reduced-motion` is not a global switch you flip on every animated atom. Whether an atom honors it — and how — depends on **what kind of motion it is**. The dividing line is who drives the motion.

| Kind | The motion is… | `prefers-reduced-motion` | Loom atoms |
|------|----------------|--------------------------|------------|
| **Autonomous** | plays on its own, user didn't trigger it | **Honor it** — suppress or snap to end state | `reveal`, `stagger`, `count-up` |
| **Direct-manipulation** | the user is driving it; motion reflects their own action | **Do NOT honor it** — suppressing breaks the feedback | `scroll-progress` |

A scroll-progress bar frozen "to respect reduced-motion" would just be broken — you can't reduce the motion of a thing the user is actively moving. Implementation also varies per atom: `reveal` honors it in pure CSS (a media query lands the final state, no JS); `count-up` uses `matchMedia('(prefers-reduced-motion: reduce)')` to skip the rAF loop and set the final value (CSS can't intercept a JS animation); `scroll-progress` **deliberately** omits any handling — documented as intentional so a future reader doesn't "fix" the missing handler and break it.

**The rule:** before reaching for `prefers-reduced-motion`, ask *"did the user trigger this, or is it playing on its own?"* Autonomous → honor it (pick the mechanism). Direct-manipulation → don't, and leave a comment saying so.

---

## Tailwind v4 — there is no `--opacity-*` theme namespace

**Symptom.** You add `--opacity-disabled: 0.5` to `@theme` expecting an `opacity-disabled` utility, the way `--radius-card` gives you `rounded-card`. The variable is emitted. The utility never generates. Nothing errors.

**Root cause.** v4's namespace list is closed, and opacity isn't in it: `--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--tab-size-*`, `--breakpoint-*`, `--container-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*`, `--blur-*`, `--perspective-*`, `--zoom-*`, `--aspect-*`, `--ease-*`, `--animate-*`. That's the whole set. Reach for `@theme` here and it *appears* to work — which is the trap.

**Fix.** Emit the variable into `tokens.css` and use v4's custom-property syntax at the call site:

```jsx
<button className="disabled:opacity-(--opacity-disabled)" />
```

The role-ladder pattern that works for `h-control-md` and `rounded-card` **does not transfer** to opacity. Verified against a real v4.3.3 build before any code was written.

---

## Opacity cannot preserve a contrast threshold

**Symptom.** A border token measured at 3.2:1 renders at 1.80:1. The token is compliant; a gate reading it passes; the rendered pixel fails.

**Root cause.** `opacity` composites the element toward whatever sits behind it. A compliant colour at `opacity: 0.5` is, on screen, the midpoint between that colour and its background — and contrast is a property of the rendered pixel, not the declared token.

**Consequences for gates.** A contrast check that reads token values is blind to every opacity role an atom applies. Loom's `composited-contrast` check exists for exactly this: it re-composites each `on-X`/`X` pair at the `muted` role and measures the result. Two things follow:

- **Never soften a compliant border with opacity.** It silently drops below the threshold the token was chosen to clear. Pick a lighter token instead.
- **`disabled` is deliberately not gated.** WCAG 1.4.3 exempts inactive components, and dimming is the point.

---

## Line endings — a pristine Windows clone fails the build

**Symptom.** `npm run generate` fails 2 of its checks on a *fresh clone with no local changes*, and `setup.sh` skips every atom as "locally edited". Both on a tree nobody has touched.

**Root cause.** The repo carried no `.gitattributes`, so git's Windows default (`core.autocrlf=true`) checks out CRLF while the generator emits LF. Every byte comparison then differs. Concretely: **0 of 67 manifest hashes matched** — and all 67 matched once LF-normalised.

**Fix.** `* text=auto eol=lf` in `.gitattributes`, plus a worktree refresh. The refresh matters and is easy to get wrong: `git add --renormalize .` stages **nothing**, because the index is already LF — it's the *worktree* that's wrong. Use:

```bash
git rm --cached -r .
git reset --hard
```

**The general shape:** any check that compares bytes rather than parsed content is a line-endings check too, whether you meant it to be or not.

---

## Config resolution — a stale local set silently outranks a fresh committed one

**Symptom.** You change a value in `spec/direction-mappings.json`, regenerate the committed base, confirm the new value in `spec/config/base/`, and the emitted `tokens.css` still carries the old one. Everything reports success.

**Root cause.** `scripts/config-paths.js` resolves every config through `local/` first, falling back to the committed set — which is what lets a fresh clone build with no answers file. `--default-set` writes only the *committed* set. If `spec/config/local/` exists, it keeps winning, and nothing announces which set is in play.

**Fix.** After changing anything upstream of the configs, regenerate **both**:

```bash
node scripts/generate-configs/index.js --default-set   # committed default
npm run configs                                        # your local brand
```

**Verify on the emitted artifact, not the config.** The config being right proves nothing about what rendered — check `tokens.css` (or the generated atom) for the value you expect. `sourceOf()` in `config-paths.js` reports which root a file actually came from.
