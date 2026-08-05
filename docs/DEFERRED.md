# Deferred engineering (post-v2-ship)

Known engineering debt in the generator. Three items, none a ship-blocker — the pipeline is correct and ships. Feature-level deferrals (wider motion families, motion-in-Figma, `marquee`) are separate and live in [`../CATALOG_SPEC.md`](../CATALOG_SPEC.md) § *Scope* and [`gotchas.md`](gotchas.md).

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

---

*Brand-leak provenance closed 2026-08-05, and it started as a wrong diagnosis worth recording. A playground resync produced a 194-line `tokens.css` diff; it was read as a local brand overwriting the committed one, and reverted. The direction was backwards. `tokens.css` derives from `spec/config/base/`, not from `answers.json` — and `spec/config/base/` is itself a **generated artifact that is committed**, produced by `npm run configs` from the git-ignored `spec/answers.json`. Commit `e935de3` ("Repair stale archetype pick names", whose real work was 36 lines in `direction-mappings.json`) had swept a local dashboard's brand into it: primary `#731DD8` → `#FF5714`, fonts Finlandica → Space Mono, 208 lines in `colors.json`. The playground's tokens were not stale — they were the last artifact still carrying Loom's brand. The leak was live on `master` for a day, so every consumer who ran `setup.sh` in that window got the wrong brand. The brand half of `e935de3` is reverted; its `direction-mappings.json` work is kept. This was the second occurrence — an Availo brand-gen diff was left dirty on master 2026-07-16 — and that session's fix git-ignored the **input**, which is why the **output** kept drifting. `base-config-provenance` now regenerates all five base configs in memory from the committed `answers.example.json` and compares, plus checks `standards.json`'s default-mode; the generators are pure, so it needs no temp files and no prose parsing. Verified by restoring `e935de3`'s configs, which fails the check by name on both files.*

---

*The invariant gate closed 2026-08-05. The generator had no verification of its own output, and two defect classes reached a consumer undetected. The fix was mostly wiring what already existed: `catalog-playground` compiles the catalog with the real TypeScript compiler, but ran `strict` without `noUnusedLocals`, picked only 57 of 66 atoms, and had silently drifted from the catalog — so it was verifying a stale, partial catalog. It now enables `noUnusedLocals` + `noUnusedParameters`, picks all 66 (a synced atom is typechecked whether or not it has a gallery story), and `scripts/code-templates/verify.js` runs last in `npm run generate`, failing the run on three invariants a compiler cannot see: hand-written counts matching the catalog, the playground's synced copies matching what the generator emits, and every relative import being declared. The playground is checked, never auto-synced — copying into it from here would make it a hand-maintained mirror, which is the failure mode item 2 describes. Each check reports its denominator, because a check whose scope silently shrank reads identically to one that passed. Verified by injecting each defect in turn: a reintroduced unused import fails the run on parity and then the compiler catches it by name, a hand-edited count fails with file and line, an under-declared manifest fails on two checks at once, and a dropped atom fails on coverage.*

---

*Pick validation closed 2026-08-04, filed and fixed the same day. Running the consumer path cold — fresh `create-next-app`, `init.sh`, hand-edited picks, `setup.sh` — showed that one mistyped pick id (`text-input` for `input`) aborted the sync mid-copy on a raw `cp: cannot stat`, leaving the project with some atoms, no `cn.ts`, and no compile. `scripts/resolve-picks.js` now validates the whole resolved set against the catalog before anything is copied, reports every unknown id at once with near-match suggestions and the atom that declared it, and fails clean; `setup.sh` needed no change, because it resolves before it copies and `set -e` does the rest. The 2026-06-11 proposal for an in-file `available` menu is closed into this: the error names the valid ids at the moment the consumer is wrong, which is where that gap actually bit. Verified end-to-end — a bad pick now leaves a real project byte-identical, and the corrected picks still install and build clean.*

---

*Three items closed 2026-08-04 as three commits — `e36c0f6` (the `tailwind-merge` pin now resolves through one map, `scripts/code-templates/npm-pins.js`, that both `init.sh` and `setup.sh`'s printed line derive from), `59eaf62` (`badge.tsx`'s unused `VariantProps` import dropped at the template), and `aacc481` (manifest `dependencies` derived from the source's relative imports instead of hand-declared, with config-declared deps unioned in and a warning on any declared-but-not-imported). **Two corrections the entries had wrong.** The manifest under-declaration was filed against `select` alone; it was five atoms — `input`, `textarea`, `select`, `helper-text`, `file-upload` — all missing `form-field`, and `input` is among the most-picked atoms in the catalog. The badge entry asked whether the dead-import shape was worth a catalog-wide sweep; it was run, and badge was the only instance. Verified against a scratch consumer: `setup.sh` install typechecks clean under `strict` + `noUnusedLocals`, and removing `form-field.tsx` reproduces `TS2307` across seven files.*

*An earlier item — emit a neutral (non-CSS) token artifact for non-web consumers — **shipped 2026-07-16** as `tokens.json` plus the NativeWind preset in [`../native/`](../native/README.md). The one piece still open is consumer-side: a native project migrating off its hand-mirrored token copy onto `tokens.json`, tracked in that project's own backlog. A shipped item kept in a file named "deferred" is the false signal this file exists to avoid.*
