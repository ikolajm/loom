# Deferred engineering (post-v2-ship)

Known engineering debt in the generator, plus one presentation pass that is Jacob-led. Eight items, none a ship-blocker — the pipeline is correct and ships. Feature-level deferrals (wider motion families, motion-in-Figma, `marquee`) are separate and live in [`../CATALOG_SPEC.md`](../CATALOG_SPEC.md) § *Scope* and [`gotchas.md`](gotchas.md).

## What's next

| # | Item | Size |
|---|------|------|
| 15 | `setup.sh catalog-playground` writes a local brand into the tracked playground `tokens.css` | Small. The last leak path of item 9's class, found by testing for it |
| 14 | The generated app shell and the atom catalog share one directory, so resetting atoms deletes the shell | Small. One path change; found by breaking it |
| 12 | Figma has no `semantic.component-height` collection, so the paste lost a layer code now has | Medium. Needs a Figma paste to verify — belongs with item 10 |
| 8 | Install has two tiers by accident and names neither | A decision, not code. Blocks nothing |
| 10 | Figma + playground presentation, and whether a token service earns a place | **Jacob-led, and a gate on calling this arc done.** Needs his eyes and his own Figma template |
| 2 | Atom registration is scattered across ~15 sites | Medium. Friction and drift-risk, no defect today |
| 1 | `setup.sh` overwrites a consumer's local atom edits with no warning | Medium. Needs the per-atom content hash the manifests already carry |
| 11 | `calendar` declares a `cell-size` no template reads | Small. Dead config, found closing item 7 |

Ordered by what a consumer feels, not by number. Numbers are stable ids, so the gaps are closed items — see *Closed* at the bottom. Each entry below carries the reasoning; read it before re-deriving the problem.

---

## 8. Install has two tiers by accident and names neither

**Not yet decided — recorded so the shape is not re-derived.** `native/` is effectively a tokens-only install (`tokens.json` + `loom-native-preset.js`, no atoms, no scaffold), while `init.sh` is a full install (substrate, `globals.css`, `ThemeProvider`, `layout.tsx`, `/preview` route, four core deps, starter picker). Standard React has no tokens-only path, though it would be one flag. Making the tiers explicit would also settle where the generated `/preview` route belongs — it is 174 lines, imports no atoms, never overwrites, and its own header calls it "a token-landing check, not a component gallery," which is the only thing that catches a silently failed Tailwind v4 `@theme` wiring. Gate it to the full tier rather than cutting it. Separately, `styleDirection` was wired alongside `productType` when Tier 1 resolution shipped, for the reason recorded here: leaving one inert intent field beside a live one is how the next reader concludes it must matter.

---

## 15. `setup.sh` writes a local brand into the tracked playground tokens

**Problem.** `setup.sh:46` copies a freshly generated `tokens.css` into `<project>/src/tokens.css`, which is correct for a consumer project and wrong for one target: `catalog-playground/` is inside this repo and its `src/tokens.css` is **tracked**. So `./setup.sh catalog-playground` run by anyone holding a local brand writes their colors into a committed file. Verified 2026-08-05 by doing it — an orange `#b33300` landed in the tracked file, from `spec/config/local/`.

**Same class as item 9, one surface further out.** Item 9 closed the two write sites in `npm run configs`; this is a third, in a different script, reached through a command a maintainer runs routinely — the playground resync that `playground-parity` tells you to run every time the catalog changes.

**Why it was not fixed with item 9.** It needs a choice item 9 did not: the playground's committed atoms are deliberate — `playground-parity` exists to check them — so `tokens.css` being committed alongside them is consistent, not obviously wrong. Three ways out, and picking one is the work:

1. **Git-ignore `catalog-playground/src/tokens.css`.** Cheapest. Costs a fresh clone the ability to build the playground until `setup.sh` runs, which it already effectively requires.
2. **Check it, like the components are checked.** Extend `playground-parity` to assert the file matches what the **committed** config set generates. Needs `generate-tokens-css.js` to accept a root — it resolves through `config-paths.js` at module scope today, so it cannot currently be asked for the committed set.
3. **Have `setup.sh` refuse to write a tracked path**, which generalises past this one file.

(2) is the one that fits the repo's habit of turning a defect into a build-time invariant, and it is the most work. (1) closes the hole today.

---

## 10. Figma and playground presentation — the pass only Jacob can run

**Not engineering debt, and filed here anyway** because it is the last thing standing between this arc and "done," and the *What's next* table is where that gets read.

**The gap.** Both delivered surfaces are correct and neither has had a pass for legibility by someone who did not build them. The generated Figma file is assembled by `scripts/figma-components/**` and pasted in one run; `catalog-playground/` is the browse surface. A consumer's first real impression of Loom is one of these two, not the README — and everything shipped so far has optimized for the pipeline being right, not for the file being pleasant to open.

**Why it is not mine to do.** It needs a designer's eye on a rendered artifact and a comparison against a template file that exists only in Jacob's Figma account. Neither is checkable from this repo, and taste on a rendered surface is exactly what a generator cannot verify.

**The open question, unresearched.** Whether a token-management service — Tokens Studio was named as the candidate — earns a place in the pipeline. **Nobody has read its primary source yet**, so nothing here should be treated as a description of what it does. What has to be established before any adoption call: what it actually consumes and emits, whether that overlaps or replaces `tokens.json` and the Figma paste path, what it costs, and whether it survives the standing dependency gate (runtime first, then stability, then version-compat). The bar is the one this repo already holds tools to: concrete current friction, not theoretical future utility.

**Inputs only Jacob has.** The template Figma file in his account, and the specific changes he wants to the scaffolded playground and Figma output for visual clarity.

---

## 14. The app shell and the atom catalog share one directory

**Problem.** `setup.sh:17` copies atoms into `$SRC/components`, and the generated init script writes the theme provider to `$SRC_DIR/components/providers/ThemeProvider.tsx` (`scripts/code-templates/scaffold/setup-script.js:65,77`). The scaffold and the catalog therefore own the same directory. Clearing `src/components/` — the obvious way to reset a project's atoms and re-run `setup.sh` — takes the app shell with it, and the resulting build failure names a missing provider rather than a missing atom, which reads like a code defect rather than the consequence of the reset.

**How it was found.** By doing it: a scratch project's `src/components/` was `rm -rf`'d to test a clean install on 2026-08-05, and the resulting failure was diagnosed as a defect in the generated code before it was recognised as an artifact of the test. Never filed at the time.

**Why it is not urgent.** No consumer has hit it in normal use — `setup.sh` is additive, so nothing forces a reset. It bites exactly the person doing what this repo asks a maintainer to do, which is run the consumer path cold.

**Fix direction.** Move the scaffold's provider out of the catalog's directory — `src/providers/` or `src/app/providers/` — so the two installs own disjoint paths and `src/components/` means "atoms, all of them project-owned" with no exception. That is a one-path change in `setup-script.js` plus the import it writes into `layout.tsx`. Worth pairing with item 8, which is the same question asked about the whole install rather than one file.

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

## Closed

One line each; the reasoning that outlived the fix is in the code it touched, and the history is in git.

- **Generating a brand dirtied the Loom working tree** *(2026-08-05)* — `npm run configs` now writes the git-ignored `spec/config/local/base/`, and every generator reads through `scripts/config-paths.js`, which prefers the local set and falls back to the committed `spec/config/base/`. A fresh clone builds Loom's own look with no answers file; a local brand never touches a tracked path. The second write site went away entirely: `colors.default-mode` moved out of `standards.json` into the generated `colors.json`, because `standards.json` declares itself locked across all projects and `index.js` was writing a per-project questionnaire answer into it — the file's own header was false. `--default-set` is the maintainer-only way to regenerate the committed set, and `base-config-provenance` reads that set by explicit path so it cannot be fooled by a local one. **A third write site in the same class survived** and is filed as item 15.
- **Control heights were hardcoded and `--touch-min` was decorative** *(2026-08-05)* — a `controlHeight` Tier 2 key (`compact` / `standard` / `touch`) selects a seven-role ladder in `direction-mappings.json`; `generate-sizing.js` emits it, atoms write `h-control-md`, and the `touch-target` check in `verify.js` fails the build if any tier of the `touch` ladder drops under the 44px minimum or if a mobile archetype stops resolving to it. `consumer-mobile` and `social` resolve to `touch`, `dashboard` and `admin` to `compact`. **The filed size measured the generated catalog, not the source** — 102 refs across 26 `catalog/*.tsx` files, which `npm run generate` rewrites; the source was 88 declarations across six `spec/config/components/*.json` files, organised as 29 ladders, plus 8 refs hardcoded in JS templates. `styleDirection` deliberately does not supply this key. Avatar portraits and stepper indicators stayed on `ch-*` primitives — they are not controls. `input-otp`'s square cell took `control` on Jacob's call, which is the pass's one deliberate value change: its cells were on a ch-5/7/9 ladder that matched `row` by coincidence rather than by meaning, and they shrink to 32/40/48px so that the role set names what a thing *is*. Under `touch` they land at 44/48/56px, which is the point.
- **Tier 1 intent never reached the generators** *(2026-08-05)* — `scripts/generate-configs/resolve-intent.js` fills the Tier 2 keys an answers file leaves absent, precedence `productType` → `styleDirection` → hand-written. Both intent fields wired; `productType` also seeds the starter `loom-picks.json`. Why the resolver is a shared module rather than a step inside `npm run configs` is commented in `verify.js`.
- **Four atoms declared a dependency they never import** *(2026-08-05)* — `fab-menu`/`fab` and `toggle-group`/`toggle` were copying a file the consumer never uses; `stagger`/`cn` and `count-up`/`cn` were inert. All four stripped from `spec/config/components/`.
- **The generator had no verification of its own output** *(2026-08-05, `e89f772`)* — `verify.js` now fails `npm run generate` on doc-count, playground-parity, manifest-dep, base-config-provenance and archetype-pick invariants; `catalog-playground` runs `noUnusedLocals` over every atom as the compile gate. The same commit reverted the brand half of `e935de3`, which had shipped a local dashboard's colors and fonts to `master` for a day.
- **A mistyped pick id aborted `setup.sh` mid-copy** *(2026-08-04, `512d891`)* — `resolve-picks.js` validates the whole resolved set against the catalog before anything is copied, naming every unknown id with near-match suggestions. Closed the 2026-06-11 proposal for an in-file `available` menu.
- **Three generator defects** *(2026-08-04)* — the `tailwind-merge` pin resolves through one map both install surfaces derive from (`e36c0f6`); `badge.tsx`'s dead `VariantProps` import dropped (`59eaf62`); manifest `dependencies` derived from source imports instead of hand-declared (`aacc481`), which had under-declared `form-field` across five atoms including `input`.
- **No neutral token artifact for non-web consumers** *(2026-07-16, `01665da`)* — `tokens.json` plus the NativeWind preset in [`../native/`](../native/README.md). The one open piece is consumer-side, tracked in that project's own backlog.
