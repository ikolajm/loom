# Deferred engineering (post-v2-ship)

Known engineering debt in the generator, plus one presentation pass that is Jacob-led. Seven items, none a ship-blocker — the pipeline is correct and ships. Feature-level deferrals (wider motion families, motion-in-Figma, `marquee`) are separate and live in [`../CATALOG_SPEC.md`](../CATALOG_SPEC.md) § *Scope* and [`gotchas.md`](gotchas.md).

## What's next

| # | Item | Size |
|---|------|------|
| 12 | Figma has no `semantic.component-height` collection, so the paste lost a layer code now has | Medium. Needs a Figma paste to verify — belongs with item 10 |
| 8 | Install has two tiers by accident and names neither | A decision, not code. Blocks nothing |
| 10 | Figma + playground presentation, and whether a token service earns a place | **Jacob-led, and a gate on calling this arc done.** Needs his eyes and his own Figma template |
| 2 | Atom registration is scattered across ~15 sites | Medium. Friction and drift-risk, no defect today |
| 1 | `setup.sh` overwrites a consumer's local atom edits with no warning | Medium. Needs the per-atom content hash the manifests already carry |
| 11 | `calendar` declares a `cell-size` no template reads | Small. Dead config, found closing item 7 |
| 9 | `npm run configs` writes tracked paths, so generating a brand dirties the working tree | Medium. Structural; a detector exists, the fix does not |

Ordered by what a consumer feels, not by number. Numbers are stable ids, so the gaps are closed items — see *Closed* at the bottom. Each entry below carries the reasoning; read it before re-deriving the problem.

---

## 8. Install has two tiers by accident and names neither

**Not yet decided — recorded so the shape is not re-derived.** `native/` is effectively a tokens-only install (`tokens.json` + `loom-native-preset.js`, no atoms, no scaffold), while `init.sh` is a full install (substrate, `globals.css`, `ThemeProvider`, `layout.tsx`, `/preview` route, four core deps, starter picker). Standard React has no tokens-only path, though it would be one flag. Making the tiers explicit would also settle where the generated `/preview` route belongs — it is 174 lines, imports no atoms, never overwrites, and its own header calls it "a token-landing check, not a component gallery," which is the only thing that catches a silently failed Tailwind v4 `@theme` wiring. Gate it to the full tier rather than cutting it. Separately, `styleDirection` was wired alongside `productType` when Tier 1 resolution shipped, for the reason recorded here: leaving one inert intent field beside a live one is how the next reader concludes it must matter.

---

## 10. Figma and playground presentation — the pass only Jacob can run

**Not engineering debt, and filed here anyway** because it is the last thing standing between this arc and "done," and the *What's next* table is where that gets read.

**The gap.** Both delivered surfaces are correct and neither has had a pass for legibility by someone who did not build them. The generated Figma file is assembled by `scripts/figma-components/**` and pasted in one run; `catalog-playground/` is the browse surface. A consumer's first real impression of Loom is one of these two, not the README — and everything shipped so far has optimized for the pipeline being right, not for the file being pleasant to open.

**Why it is not mine to do.** It needs a designer's eye on a rendered artifact and a comparison against a template file that exists only in Jacob's Figma account. Neither is checkable from this repo, and taste on a rendered surface is exactly what a generator cannot verify.

**The open question, unresearched.** Whether a token-management service — Tokens Studio was named as the candidate — earns a place in the pipeline. **Nobody has read its primary source yet**, so nothing here should be treated as a description of what it does. What has to be established before any adoption call: what it actually consumes and emits, whether that overlaps or replaces `tokens.json` and the Figma paste path, what it costs, and whether it survives the standing dependency gate (runtime first, then stability, then version-compat). The bar is the one this repo already holds tools to: concrete current friction, not theoretical future utility.

**Inputs only Jacob has.** The template Figma file in his account, and the specific changes he wants to the scaffolded playground and Figma output for visual clarity.

---

## 12. Figma has no `semantic.component-height` collection

**Problem.** Code and Figma both carry a primitives layer (`primitives.component-height`, `ch-0`..`ch-9`) and both carry a semantic radius layer (`semantic.radius`). Item 7 added a semantic height layer to code — `--height-control-md` and the role ladder behind it — with no Figma counterpart, so the pasted file states heights as raw `ch-N` primitives while the code states them as roles. A designer reading the Figma file cannot see that `button/md` and `text-field/md` are the same decision.

**Fix direction.** Mirror `semantic.radius` exactly: a `semantic.component-height` collection in `spec/config/figma/variable-collections.json`, a generator under `scripts/figma-primitives/`, aliasing each `<role>/<tier>` to its `primitives.component-height` variable, and a lookup in `scripts/figma-components/utils/lookups.js` so the component builders bind to the role rather than the primitive.

**Why it is filed rather than done.** It is only verifiable by pasting into Figma and looking, which is the same gate as item 10 and needs Jacob's file. Building it blind is the failure this repo has recorded before. **Do it inside item 10's pass**, not before it.

---

## 2. Centralize atom registration + derive catalog counts

**Problem (shotgun surgery).** Adding or cutting a single atom requires edits across ~15 sites: the generator import + dispatch `switch` (`scripts/code-templates/generate-components.js`), the `shared.js` registry, the figma orchestrator's page list, the component config, **and the hardcoded "N atoms" counts** across README / CATALOG_SPEC / questionnaire. Atom identity is scattered, and the counts are hand-maintained — which is why they drift.

**Evidence.** Cutting `video-player` touched every one of those sites; the doc counts (67→66) had to be hand-edited across several files. Count drift has recurred before. (`catalog/atoms.json` is now generated as the authoritative pick list — the next step is deriving the README table + counts *from* it.)

**The counts are correct as of 2026-08-04** — 67 manifests less `cn` is 66, which is what README, CATALOG_SPEC and the questionnaire all say. The drift risk is real; the drift is not present. Only the registration-scatter half is live — the counts half was retired 2026-08-04 by the `doc-counts` check in `scripts/code-templates/verify.js`, which fails the build if a hand-written count stops matching the catalog.

**Fix direction.** Centralize atom registration into **one source** that the import, dispatch, and figma page-list derive from; **derive the doc counts from the catalog** (one generated number) instead of hardcoding them per file.

**Why it's not a blocker.** The current pipeline is correct and ships; this is friction + drift-risk reduction for future atom adds/cuts.

---

## 1. `setup.sh` overwrite-protection (content-hash-driven)

**Problem.** `setup.sh` re-copies picked atoms with a plain `cp` (no diff, no backup, no warning), so re-running it **silently overwrites a consumer's local edits** to an atom file (`src/components/*.tsx`), plus `cn.ts` and `tokens.css`. A system that markets "atoms are project-owned, edit freely" silently clobbering those edits on resync is a footgun. (shadcn's CLI prompts before overwriting modified files; ours does not.)

**Why it's not a blocker.** The intended override path is the **call site** — `className`/prop/variant, or a wrapper in the consumer's own app — which lives *outside* the atom file and survives every resync by construction. The silent overwrite only bites a consumer who forks an atom *file* and then resyncs that atom.

**That case is no longer hypothetical.** A consuming project had to patch `badge.tsx` for the dead-import defect, and two later `setup.sh` runs — adding `select`, then `form-field` — silently reverted it both times. Each reverted a fix for a defect Loom shipped, so the consumer re-broke on a resync they ran to fix a *different* Loom defect.

**The compounding case is now closed at the source, which is why this dropped to last.** The three defects that gave a consumer a reason to hand-patch a generated file all shipped fixes on 2026-08-04 (see the closing note). This item is now about the general footgun, not about that specific trap.

**Fix direction.** Use the per-atom **content hash** that manifests already carry (it changes iff the atom's generated source changes). On resync, compare the consumer's local copy against the version `setup.sh` last delivered; if it was modified locally, **warn / skip / back up** before overwriting (`badge.tsx` was edited — overwrite? [y/N]). This is the concrete *job* for the per-atom version mechanism (the top-level `loom-picks` version stamp was cut for being an unenforced duplicate of this finer hash).

---

## 11. `calendar` declares a `cell-size` that no template reads

**Problem.** `spec/config/components/form.json` gives `calendar` a four-tier `cell-size` ladder (`height/ch-2` through `height/ch-7`), and `scripts/code-templates/components/calendar.js` never reads the key. Day cells take their width from `flex-1` across seven columns of a fixed-width container and their height from `aspect-square`, so the declaration has never affected a rendered pixel. The template says so at line 24 — *"font + radius only, sizing handled by flex"* — which is why the key survived: the comment documents the behaviour and nobody re-read the config against it.

**Found closing item 7**, and it is the same shape as the item that found it: a declared value with no consumer, sitting one layer away from a comment that quietly explains why. The `compact` tier declares a 28px cell, so a reader sizing up a touch archetype would have concluded calendar ships a sub-minimum tap target. It does not ship one either way.

**Fix direction.** Decide which the calendar wants and make the config say it: either wire `cell-size` into `calendar.js` so the day grid is token-driven and the role ladder reaches it, or cut the key from all four tiers. Wiring it is the larger change — the grid's flex layout would have to give up `flex-1` — and is what a touch archetype would want, since a phone calendar is fourteen tap targets in a row. Left undecided on purpose; it is a design call, not a defect fix.

---

## 9. Generating a brand dirties the Loom working tree

**Problem.** `spec/config/base/*.json` is tracked *and* is the generator's write target, so `npm run configs` overwrites Loom's committed default look with whatever brand it was handed. Exactly two write sites reach tracked paths: `scripts/generate-configs/index.js:160` writes the five `base/` configs, and `:138` mutates `spec/config/standards.json` to propagate `defaultMode`. Everything else under `spec/config/` (`components/`, `figma/`, `presentation/`) is hand-authored source and correctly committed. `generated/` and `spec/answers.json` are both already ignored — the leak is one layer below the rules that exist.

**The `.gitignore` already promises what the layout defeats.** Its comment on `spec/answers.json` reads *"Keeping it out of the repo means generating your brand never dirties the Loom working tree."* That is false as written: the rule covers the pipeline's input and misses its output.

**Evidence — second occurrence.** Found 2026-08-04 with `colors.json` dirty from `#731DD8` purple to `#FF5714` orange and `typography.json` from Finlandica to Space Mono, matching the brand recorded in `generated/answers.json`. The first was the abandoned Availo brand-gen diff left on master, recorded in the project record and reverted 2026-07-16. That fix ignored `answers.json`, which stopped the *input* leaking and left the output leaking.

**Why a `.gitignore` line is the wrong fix.** `loadAllConfigs()` in `scripts/code-templates/shared.js` reads those five files, so `npm run generate` depends on them existing. Ignoring them makes a fresh clone unbuildable until it runs `npm run configs`, which needs `spec/answers.json` — also ignored.

**Fix direction.** Apply the pattern the repo already uses for answers, one layer down: `answers.example.json` is committed and `answers.json` is ignored. Keep a committed default config set holding Loom's own look, point `npm run configs` at a gitignored output path, and have `loadAllConfigs()` prefer the generated set and fall back to the committed default. A fresh clone then builds Loom's look with no answers file, and generating a brand never touches a tracked file — which is what the comment already claims.

**A detector now exists, and is not the fix.** `base-config-provenance` in `scripts/code-templates/verify.js` (2026-08-05) fails `npm run generate` when the committed base configs stop matching what `answers.example.json` generates. It catches the leak after it happens; this item is to stop it happening.

**`standards.json` needs separate thought.** It is hand-authored and `index.js:138` mutates one key inside it, so it cannot simply be redirected. Either `defaultMode` reaches the token generator by another route, or the file splits into a static part and a generated part.

---

## Closed

One line each; the reasoning that outlived the fix is in the code it touched, and the history is in git.

- **Control heights were hardcoded and `--touch-min` was decorative** *(2026-08-05)* — a `controlHeight` Tier 2 key (`compact` / `standard` / `touch`) selects a seven-role ladder in `direction-mappings.json`; `generate-sizing.js` emits it, atoms write `h-control-md`, and the `touch-target` check in `verify.js` fails the build if any tier of the `touch` ladder drops under the 44px minimum or if a mobile archetype stops resolving to it. `consumer-mobile` and `social` resolve to `touch`, `dashboard` and `admin` to `compact`. **The filed size measured the generated catalog, not the source** — 102 refs across 26 `catalog/*.tsx` files, which `npm run generate` rewrites; the source was 88 declarations across six `spec/config/components/*.json` files, organised as 29 ladders, plus 8 refs hardcoded in JS templates. `styleDirection` deliberately does not supply this key. Avatar portraits and stepper indicators stayed on `ch-*` primitives — they are not controls. `input-otp`'s square cell took `control` on Jacob's call, which is the pass's one deliberate value change: its cells were on a ch-5/7/9 ladder that matched `row` by coincidence rather than by meaning, and they shrink to 32/40/48px so that the role set names what a thing *is*. Under `touch` they land at 44/48/56px, which is the point.
- **Tier 1 intent never reached the generators** *(2026-08-05)* — `scripts/generate-configs/resolve-intent.js` fills the Tier 2 keys an answers file leaves absent, precedence `productType` → `styleDirection` → hand-written. Both intent fields wired; `productType` also seeds the starter `loom-picks.json`. Why the resolver is a shared module rather than a step inside `npm run configs` is commented in `verify.js`.
- **Four atoms declared a dependency they never import** *(2026-08-05)* — `fab-menu`/`fab` and `toggle-group`/`toggle` were copying a file the consumer never uses; `stagger`/`cn` and `count-up`/`cn` were inert. All four stripped from `spec/config/components/`.
- **The generator had no verification of its own output** *(2026-08-05, `e89f772`)* — `verify.js` now fails `npm run generate` on doc-count, playground-parity, manifest-dep, base-config-provenance and archetype-pick invariants; `catalog-playground` runs `noUnusedLocals` over every atom as the compile gate. The same commit reverted the brand half of `e935de3`, which had shipped a local dashboard's colors and fonts to `master` for a day.
- **A mistyped pick id aborted `setup.sh` mid-copy** *(2026-08-04, `512d891`)* — `resolve-picks.js` validates the whole resolved set against the catalog before anything is copied, naming every unknown id with near-match suggestions. Closed the 2026-06-11 proposal for an in-file `available` menu.
- **Three generator defects** *(2026-08-04)* — the `tailwind-merge` pin resolves through one map both install surfaces derive from (`e36c0f6`); `badge.tsx`'s dead `VariantProps` import dropped (`59eaf62`); manifest `dependencies` derived from source imports instead of hand-declared (`aacc481`), which had under-declared `form-field` across five atoms including `input`.
- **No neutral token artifact for non-web consumers** *(2026-07-16, `01665da`)* — `tokens.json` plus the NativeWind preset in [`../native/`](../native/README.md). The one open piece is consumer-side, tracked in that project's own backlog.
