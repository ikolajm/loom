# Deferred engineering (post-v2-ship)

Known engineering debt in the generator. Seven items, none a ship-blocker — the pipeline is correct and ships. Feature-level deferrals (wider motion families, motion-in-Figma, `marquee`) are separate and live in [`../CATALOG_SPEC.md`](../CATALOG_SPEC.md) § *Scope* and [`gotchas.md`](gotchas.md).

---

## 1. `setup.sh` overwrite-protection (content-hash-driven)

**Problem.** `setup.sh` re-copies picked atoms with a plain `cp` (no diff, no backup, no warning), so re-running it **silently overwrites a consumer's local edits** to an atom file (`src/components/*.tsx`), plus `cn.ts` and `tokens.css`. A system that markets "atoms are project-owned, edit freely" silently clobbering those edits on resync is a footgun. (shadcn's CLI prompts before overwriting modified files; ours does not.)

**Why it's not a blocker.** The intended override path is the **call site** — `className`/prop/variant, or a wrapper in the consumer's own app — which lives *outside* the atom file and survives every resync by construction. The silent overwrite only bites a consumer who forks an atom *file* and then resyncs that atom.

**That case is no longer hypothetical.** A consuming project had to patch `badge.tsx` for the dead-import defect, and two later `setup.sh` runs — adding `select`, then `form-field` — silently reverted it both times. Each reverted a fix for a defect Loom shipped, so the consumer re-broke on a resync they ran to fix a *different* Loom defect.

**The compounding case is now closed at the source, which is why this dropped to last.** The three defects that gave a consumer a reason to hand-patch a generated file all shipped fixes on 2026-08-04 (see the closing note). This item is now about the general footgun, not about that specific trap.

**Fix direction.** Use the per-atom **content hash** that manifests already carry (it changes iff the atom's generated source changes). On resync, compare the consumer's local copy against the version `setup.sh` last delivered; if it was modified locally, **warn / skip / back up** before overwriting (`badge.tsx` was edited — overwrite? [y/N]). This is the concrete *job* for the per-atom version mechanism (the top-level `loom-picks` version stamp was cut for being an unenforced duplicate of this finer hash).

---

## 2. Centralize atom registration + derive catalog counts

**Problem (shotgun surgery).** Adding or cutting a single atom requires edits across ~15 sites: the generator import + dispatch `switch` (`scripts/code-templates/generate-components.js`), the `shared.js` registry, the figma orchestrator's page list, the component config, **and the hardcoded "N atoms" counts** across README / CATALOG_SPEC / questionnaire. Atom identity is scattered, and the counts are hand-maintained — which is why they drift.

**Evidence.** Cutting `video-player` touched every one of those sites; the doc counts (67→66) had to be hand-edited across several files. Count drift has recurred before. (`catalog/atoms.json` is now generated as the authoritative pick list — the next step is deriving the README table + counts *from* it.)

**The counts are correct as of 2026-08-04** — 67 manifests less `cn` is 66, which is what README, CATALOG_SPEC and the questionnaire all say. The drift risk is real; the drift is not present. Only the registration-scatter half is live — the counts half was retired 2026-08-04 by the `doc-counts` check in `scripts/code-templates/verify.js`, which fails the build if a hand-written count stops matching the catalog.

**Fix direction.** Centralize atom registration into **one source** that the import, dispatch, and figma page-list derive from; **derive the doc counts from the catalog** (one generated number) instead of hardcoding them per file.

**Why it's not a blocker.** The current pipeline is correct and ships; this is friction + drift-risk reduction for future atom adds/cuts.

---

## 3. Four atoms declare a dependency they never import

**Problem.** `fab-menu` declares `fab`, `toggle-group` declares `toggle`, and `stagger` and `count-up` each declare `cn` — none of the four is a static import in the generated source. `fab-menu` and `toggle-group` are the real ones: they copy a file the consumer does not need. The two `cn` entries have never done anything, since `resolve-picks.js` skips `cn` on the walk and `setup.sh` copies it unconditionally.

**Evidence.** Surfaced by the `declared but not imported` warning added in `aacc481` (2026-08-04), which fires on every `npm run generate` until they are resolved.

**Fix direction.** Decide per atom whether the declaration is intentional composition or stale, then strip the stale ones from `$catalog.dependencies` in `spec/config/components/`. Four config edits, one judgment call each — deliberately not folded into the bug-fix commit that surfaced them.

---

## 6. Tier 1 intent never reaches the generators

**Problem.** `spec/direction-mappings.json` carries a complete two-tier design — a `product-type` block with ten archetypes (each supplying `density`, `type-scale`, `shadow-depth`, `style-suggestions`, and a curated atom pick-list) and a `style-direction` block with ten styles supplying `edges`, `density`, `shadow-depth`, `type-scale`. Nothing consumes either. `scripts/generate-configs/index.js:75` marks them `// Tier 1 — intent (metadata, not consumed by generators)` and only prints them; `spec/questionnaire.md` documents all three intent fields as `metadata only`. The data layer was authored and the resolver between it and the generators was never written.

**Why it matters.** Answering `productType: "dashboard"` today changes no token. The two questions the archetype would answer — `density` and `typeScale` — are the two in the questionnaire that need taste and a mockup, while `productType` is answerable by anyone. The answer set does not shrink (thirteen fields to twelve); the hard questions get replaced by an easy one, which was the actual goal.

**Precedence, decided 2026-08-04.** General to specific, more specific wins: `productType` → `styleDirection` → the value written by hand. An explicitly written value is never overridden. This matters because the two Tier 1 blocks genuinely conflict — `dashboard` sets `type-scale: compact` while its own first style-suggestion `clean` sets `type-scale: standard`, and nothing currently says which applies.

**Fix direction.** A `resolveIntent()` pass between `loadAnswers()` and the generator loop, filling only keys the answers file left absent — which means the CLI-flag path must stop defaulting Tier 2 keys inline (`args.edges || 'sharp'`), or every run looks like an explicit answer and the archetype can never win. Print each resolved value with the source that supplied it. Seed `scaffold/init.sh`'s starter `loom-picks.json` from the archetype's pick-list in place of the hardcoded `["button", "card"]` — noting `init.sh` is generated from `scripts/code-templates/scaffold/setup-script.js`, whose `generate()` takes no arguments today, and that `loadAllConfigs()` does not carry the answers, so the archetype needs a channel into the second pipeline.

**Validate the pick-lists at generation time.** All ten archetypes named four atoms the catalog does not have (`icon-button`, `chip`, `text-input`, `alert`) — repaired 2026-08-04 against the manifests that absorbed them (`button` gained `iconOnly`, `badge` "consolidates prior chip / tag-chip", `banner` "consolidates the old alert", `input`). They had drifted since the v2 consolidation and would have written unresolvable picks into every consumer's `loom-picks.json`. Same shape as item 2 and the hand-maintained-mirror failure: fail the run on an unknown name rather than re-checking by hand.

---

## 7. Control heights are hardcoded, and `--touch-min` is decorative

**Problem.** `standards.json` declares `touch-target.min: 44px`, and it is emitted into `tokens.css` (`--touch-min`), `tokens.json`, and the NativeWind preset. **No atom in the catalog consumes it.** `button.tsx:25-27` hardcodes `h-ch-3 / h-ch-5 / h-ch-7` — 32 / 40 / 48px — so the default `md` button is 40px, under the minimum the repo itself declares.

**Why it matters.** It blocks a real `consumer-mobile` archetype. That archetype already exists in `direction-mappings.json` with `fab`, `bottom-nav` and `sheet` in its picks, but it can only reach `typeScale` and `density` — so a "mobile" design system would ship sub-44px controls and enforce nothing.

**Fix direction.** The pattern already ships for radii: `edges` → `generate-sizing.js` → `semantic-radius` → atoms write `rounded-component` rather than `br-4`. Apply it to heights — the archetype selects a ladder (`dashboard`: sm/md/lg → ch-3/ch-5/ch-7; `consumer-mobile`: ch-5/ch-6/ch-8), the generator emits semantic names into `@theme`, and atoms write `h-control-md`. Keep the names literal; Tailwind v4 scans source for literal class strings.

**Size.** 102 `ch-*` references across 26 of the 67 atom files. 77 are `h-ch-*` — control heights, mechanical to convert. The remaining `size-ch-*` need a judgment call each: on an icon button it is a touch target, on `avatar.tsx` it is a portrait size, and `size-ch-1` (24px) is not a control at all. **Do not shortcut this by shifting the `ch` ladder itself** — that needs no atom edits but drags avatars along, breaks the primitives-are-constants contract `standards.json` states, and ships archetype-dependent values under primitive names into `tokens.json` for native consumers.

**Sequencing.** This is the only item here that edits atom source. Paperboy's 57 atoms are hand-ported under PascalCase filenames (`Button.tsx` against the catalog's `button.tsx`) with no `loom-picks.json`, so it cannot take a `setup.sh` resync — running one would drop 67 kebab-case files alongside the existing 57 rather than updating them. Every atom-touching change widens that gap.

---

## 8. Install has two tiers by accident and names neither

**Not yet decided — recorded so the shape is not re-derived.** `native/` is effectively a tokens-only install (`tokens.json` + `loom-native-preset.js`, no atoms, no scaffold), while `init.sh` is a full install (substrate, `globals.css`, `ThemeProvider`, `layout.tsx`, `/preview` route, four core deps, starter picker). Standard React has no tokens-only path, though it would be one flag. Making the tiers explicit would also settle where the generated `/preview` route belongs — it is 174 lines, imports no atoms, never overwrites, and its own header calls it "a token-landing check, not a component gallery," which is the only thing that catches a silently failed Tailwind v4 `@theme` wiring. Gate it to the full tier rather than cutting it. Separately, `styleDirection` stays `metadata only` after item 6 lands unless it is wired too — leaving one inert intent field beside a live one is how the next reader concludes it must matter.

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

*A third item — emit a neutral (non-CSS) token artifact for non-web consumers — **shipped 2026-07-16** and its entry was cut 2026-08-01. It had three homes by then: the lesson at the hand-maintained-mirror failure, the gate-jump decision in the project record, and the one piece still open (Taulu migrating onto it) in that project's own tracker at `~/jmi-projects/taulu/backlog/taulu/todo.md` §8. A shipped item kept in a file named "deferred" is the false signal this folder exists to avoid.*

---

*The brand leak was reverted and a detector added 2026-08-05 — **the structural fix is item 9 and stays open.** It started as a wrong diagnosis worth recording. A playground resync produced a 194-line `tokens.css` diff; it was read as a local brand overwriting the committed one, and reverted. The direction was backwards. `tokens.css` derives from `spec/config/base/`, not from `answers.json` — and `spec/config/base/` is itself a **generated artifact that is committed**, produced by `npm run configs` from the git-ignored `spec/answers.json`. Commit `e935de3` ("Repair stale archetype pick names", whose real work was 36 lines in `direction-mappings.json`) had swept a local dashboard's brand into it: primary `#731DD8` → `#FF5714`, fonts Finlandica → Space Mono, 208 lines in `colors.json`. The playground's tokens were not stale — they were the last artifact still carrying Loom's brand. The leak was live on `master` for a day, so every consumer who ran `setup.sh` in that window got the wrong brand. The brand half of `e935de3` is reverted; its `direction-mappings.json` work is kept. This was the second occurrence — an Availo brand-gen diff was left dirty on master 2026-07-16 — and that session's fix git-ignored the **input**, which is why the **output** kept drifting. `base-config-provenance` now regenerates all five base configs in memory from the committed `answers.example.json` and compares, plus checks `standards.json`'s default-mode; the generators are pure, so it needs no temp files and no prose parsing. Verified by restoring `e935de3`'s configs, which fails the check by name on both files. **This detects; it does not prevent.** Item 9 — already filed 2026-08-04, a day before this rediscovery — is the fix: stop `npm run configs` writing a tracked path at all. Rediscovering a filed item cost most of a session and is its own lesson.*

---

*The invariant gate closed 2026-08-05. The generator had no verification of its own output, and two defect classes reached a consumer undetected. The fix was mostly wiring what already existed: `catalog-playground` compiles the catalog with the real TypeScript compiler, but ran `strict` without `noUnusedLocals`, picked only 57 of 66 atoms, and had silently drifted from the catalog — so it was verifying a stale, partial catalog. It now enables `noUnusedLocals` + `noUnusedParameters`, picks all 66 (a synced atom is typechecked whether or not it has a gallery story), and `scripts/code-templates/verify.js` runs last in `npm run generate`, failing the run on three invariants a compiler cannot see: hand-written counts matching the catalog, the playground's synced copies matching what the generator emits, and every relative import being declared. The playground is checked, never auto-synced — copying into it from here would make it a hand-maintained mirror, which is the failure mode item 2 describes. Each check reports its denominator, because a check whose scope silently shrank reads identically to one that passed. Verified by injecting each defect in turn: a reintroduced unused import fails the run on parity and then the compiler catches it by name, a hand-edited count fails with file and line, an under-declared manifest fails on two checks at once, and a dropped atom fails on coverage.*

---

*Pick validation closed 2026-08-04, filed and fixed the same day. Running the consumer path cold — fresh `create-next-app`, `init.sh`, hand-edited picks, `setup.sh` — showed that one mistyped pick id (`text-input` for `input`) aborted the sync mid-copy on a raw `cp: cannot stat`, leaving the project with some atoms, no `cn.ts`, and no compile. `scripts/resolve-picks.js` now validates the whole resolved set against the catalog before anything is copied, reports every unknown id at once with near-match suggestions and the atom that declared it, and fails clean; `setup.sh` needed no change, because it resolves before it copies and `set -e` does the rest. The 2026-06-11 proposal for an in-file `available` menu is closed into this: the error names the valid ids at the moment the consumer is wrong, which is where that gap actually bit. Verified end-to-end — a bad pick now leaves a real project byte-identical, and the corrected picks still install and build clean.*

---

*Three items closed 2026-08-04 as three commits — `e36c0f6` (the `tailwind-merge` pin now resolves through one map, `scripts/code-templates/npm-pins.js`, that both `init.sh` and `setup.sh`'s printed line derive from), `59eaf62` (`badge.tsx`'s unused `VariantProps` import dropped at the template), and `aacc481` (manifest `dependencies` derived from the source's relative imports instead of hand-declared, with config-declared deps unioned in and a warning on any declared-but-not-imported). **Two corrections the entries had wrong.** The manifest under-declaration was filed against `select` alone; it was five atoms — `input`, `textarea`, `select`, `helper-text`, `file-upload` — all missing `form-field`, and `input` is among the most-picked atoms in the catalog. The badge entry asked whether the dead-import shape was worth a catalog-wide sweep; it was run, and badge was the only instance. Verified against a scratch consumer: `setup.sh` install typechecks clean under `strict` + `noUnusedLocals`, and removing `form-field.tsx` reproduces `TS2307` across seven files.*

*An earlier item — emit a neutral (non-CSS) token artifact for non-web consumers — **shipped 2026-07-16** as `tokens.json` plus the NativeWind preset in [`../native/`](../native/README.md). The one piece still open is consumer-side: a native project migrating off its hand-mirrored token copy onto `tokens.json`, tracked in that project's own backlog. A shipped item kept in a file named "deferred" is the false signal this file exists to avoid.*
