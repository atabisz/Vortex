---
phase: 27-gamebryo-per-game-extensions
plan: 05
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - bg3
    - phase-27
    - extension-conflict
    - divine-error-preservation
requirements:
    satisfied:
        - SYNC-19
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-04-SUMMARY.md (collections resolved; harness gates carry forward)
    provides:
        - Fifth Phase 27 extension fully resolved (22/25 conflict files done — 88%)
        - BG3 4-class divine error preservation invariant intact across the v2.0.0 sync
        - Heaviest extension by file count and per-file conflict surface (41 conflict regions across 7 files) cleared in one plan
    affects:
        - Plan 27-06 (game-morrowind — next in D-27-01 extension order; 1 file)
        - Plan 27-07 (game-witcher3 — last extension; 2 files)
        - Plan 27-08 (Phase 27 done-gate — 3/25 conflict files remaining after this plan lands)
tech_stack:
    added: []
    patterns:
        - "Cosmetic single-quote vs double-quote resolution stance (carried from plans 27-01..27-04, dominant pattern this plan): keep HEAD double-quote form — matches fork's prevailing style; avoids re-quoting churn that oxfmt would re-collapse next pass"
        - "Merge-driver dropped-imports artefact (recurrence — plan 27-04 CollectionList/index.tsx idiom): v2.0.0 side of divineWrapper.ts top-of-file imports listed only 4 of the 8 symbols the file body uses (dropped GAME_ID, DivineExecMissing, DivinePakInvalid, getLatestLSLibMod, logError). HEAD has the full set; v2.0.0 form would not compile (resolveExePath uses GAME_ID + getLatestLSLibMod; concurrency limiter retry filter checks DivineExecMissing + DivinePakInvalid; listPackage error handler uses logError)."
        - "Merge-driver duplicate-imports artefact (recurrence — Phase 26 LinkingDeployment.ts + plan 27-02 index.ts + plan 27-04 eventHandlers.ts idioms): v2.0.0 side of loadOrder.ts conflict region 1 re-imported 6 symbols (DivineAborted/DivineExecMissing/DivinePakInvalid from divineCore, the named util imports, PakInfoCache + ICacheEntry from cache) all already imported above the conflict region. v2.0.0 side of index.tsx re-imported 6 symbols (abortDivineOperations, isBG3SE/isLSLib/isLoose/isReplacer, the 8 loadOrder symbols, InfoPanelWrap, PakInfoCache) AND re-declared STOP_PATTERNS — all already present immediately above. HEAD is the only compilable form in both cases."
        - "Fork-side preservation in divineWrapper.ts ConcurrencyLimiter retry filter: HEAD's filter fails fast on 4 deterministic error classes (DivineAborted, DivineExecMissing, DivineMissingDotNet, DivinePakInvalid). v2.0.0 reverted to fail-fast on DivineAborted alone — would retry missing-exe / missing-.NET / pak-invalid 5 times each, multiplying log noise without changing outcome. Substantive HEAD win; fork-side is more defensive."
        - "Fork-side preservation in loadOrder.ts pak-loop catch handler: (a) `return await cache.getCacheEntry(...)` — without the await, the surrounding try/catch sees no rejection (catch becomes dead code, masking pak-load failures). (b) Stable notification id `bg3-divine-missing` — parallel pak failures collapse into one notification instead of N. Both are silent regressions in v2.0.0 form; HEAD wins on substance."
        - "BG3 4-class divine error preservation gate (CONTEXT D-27-02 / grep-checkpoint gate 10) — DivineExecMissing, DivineMissingDotNet, DivineTimedOut, DivineAborted, each `extends Error`, all 4 survive intact in divineCore.ts at lines 11/18/25/32. Gate clean before plan started (conflict markers wrapped only single-quote/double-quote diffs around the class declarations, not the declaration shape itself); gate clean after every commit; final count = 4."
        - "Bluebird-Promise trap pre-checked clean (per plan 27-02 D-27-04 footnote): `grep -ln 'import Promise from' extensions/games/game-baldursgate3/src/*` returned nothing across all 7 files. The trap does not apply. Did not add or touch any return-type annotations; left function signatures as-is from HEAD."
        - "Per-extension typecheck via build-as-typecheck (D-27-04 deviation): BG3 has no `typecheck` script; bare `tsc --noEmit` against the 7 source files surfaces vortex-api module-resolution errors that are infrastructure issues unrelated to our resolution work (the workspace-shimmed module isn't built standalone). Plan-permitted alternative — `pnpm run build` — succeeded, producing dist/index.cjs via rolldown. Rolldown refuses syntax/resolution errors at bundle time; clean bundle = clean resolution work."
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-05-SUMMARY.md
    modified:
        - extensions/games/game-baldursgate3/src/cache.ts
        - extensions/games/game-baldursgate3/src/util.ts
        - extensions/games/game-baldursgate3/src/divineCore.ts
        - extensions/games/game-baldursgate3/src/divineWrapper.ts
        - extensions/games/game-baldursgate3/src/divineCore.test.ts
        - extensions/games/game-baldursgate3/src/loadOrder.ts
        - extensions/games/game-baldursgate3/src/index.tsx
decisions:
    - "Kept HEAD on every conflict region across all 7 files. 41 conflict regions total: 2 in cache.ts, 1 in util.ts, 17 in divineCore.ts, 5 in divineWrapper.ts, 13 in divineCore.test.ts, 2 in loadOrder.ts, 1 in index.tsx. Stance breakdown — 35 cosmetic (single-quote vs double-quote + minor wrapping), 4 merge-driver artefacts (1 dropped-imports in divineWrapper.ts, 2 duplicate-imports in loadOrder.ts + index.tsx, 1 duplicate-const in index.tsx), 2 fork-side substantive preservations (loadOrder.ts `return await` for catch visibility + stable notification id; divineWrapper.ts richer ConcurrencyLimiter retry filter)."
    - "BG3 4-class divine error preservation gate stayed clean throughout (CONTEXT D-27-02 / grep-checkpoint gate 10). Gate count was 4 before any divineCore.ts edit — conflict markers wrapped only the quote-style around the class declarations, not the declaration shape itself. Gate count remained 4 after the divineCore.ts commit and stayed at 4 through tasks 4-7. No re-resolution needed."
    - "Per-extension typecheck routed via build-as-typecheck per plan's stated alternative (D-27-04 deviation): bare `tsc --noEmit` against the 7 source files reports vortex-api module-resolution errors that are pre-existing infrastructure issues (the workspace shim isn't standalone-resolvable without a per-extension tsconfig). The plan explicitly permits `pnpm run build` as an acceptable substitute on the grounds that rolldown refuses syntax/resolution errors at bundle time. Build succeeded, producing `dist/index.cjs` and `src/main/build/bundledPlugins/game-baldursgate3/`. Choosing build-as-typecheck preserves signal (any actual compile error in the resolved files would surface) while sidestepping the pre-existing tsconfig gap."
    - "Bluebird-Promise trap pre-checked clean before any commit: `grep -ln 'import Promise from' extensions/games/game-baldursgate3/src/*` returned nothing across all 7 files. The trap does not apply. The fork's BG3 source uses `import Bluebird from 'bluebird'` consistently (named identifier, used as `Bluebird.resolve(...)` in loadOrder.ts and index.tsx), not `Promise from 'bluebird'`. Did not add or touch any `: Promise<T>` return-type annotations on async functions."
    - "oxfmt pre-commit hook ran on every commit (lint-staged piped through pnpm oxfmt). No formatting touch-ups recorded across any of the 7 commits — each commit's `git diff --stat` showed only deletions (the conflict markers themselves) on the resolved file. Each commit touches exactly one file. No behavioural changes from formatting."
metrics:
    duration_minutes: 5
    completed: "2026-05-21"
    commit_count: 7
    task_count: 7
    file_count: 7
---

# Phase 27 Plan 05: game-baldursgate3 conflict resolution Summary

Resolved all seven conflict files in `extensions/games/game-baldursgate3/src/` leaf-first per D-27-01 — `cache.ts` → `util.ts` → `divineCore.ts` → `divineWrapper.ts` → `divineCore.test.ts` → `loadOrder.ts` → `index.tsx`. Fork-side wins on every region (HEAD throughout). BG3 4-class divine error preservation gate (CONTEXT D-27-02 / grep-checkpoint gate 10) stayed clean across all seven commits. Per-extension build-as-typecheck (`pnpm run build`) succeeded after the seventh commit. 11-gate grep-checkpoint stays green after each commit. Phase 27 progress: **22/25 conflict files resolved (88%)** — three remain (Morrowind 1 + Witcher3 2).

## What Got Resolved

**File 1 — `cache.ts` (commit `ef52d47f2`):** Two conflict regions.

- Region 1 (`getCacheEntry` signature): cosmetic wrapped vs aligned-args; HEAD wraps three params one-per-line, v2.0.0 aligned them after the open paren. HEAD wins.
- Region 2 (`ENOENT` string compare): cosmetic double vs single quote; HEAD wins (file uses double quotes throughout — see lines 30, 108, 124, 136, 146).

**File 2 — `util.ts` (commit `d0f60cf3b`):** One conflict region.

- Region 1 (`extractPak(api, pakPath, metaPath, "*/meta.lsx")` glob): cosmetic double vs single quote; HEAD wins per fork style.

**File 3 — `divineCore.ts` (commit `de2a83f88`) — PRESERVATION-CRITICAL:** 17 conflict regions.

- All 17 regions were cosmetic single-quote vs double-quote differences (with two also showing minor `result.stdout?.toString() ?? ""` parens-wrapping diffs at lines 267-268 and a couple of multi-line vs single-line `translateDivineError` arg-list wraps at lines 275-279). HEAD form (double quotes + collapsed where under print-width=80) matches the fork's prevailing style.
- **Critical**: All 4 named error classes survive intact at the same line numbers as the f15bbabb8 base shape:
    - `DivineExecMissing extends Error` at line 11 (was wrapped by region 2-3)
    - `DivineMissingDotNet extends Error` at line 18 (was wrapped by region 4-5)
    - `DivineTimedOut extends Error` at line 25 (was wrapped by region 6-7)
    - `DivineAborted extends Error` at line 32 (was wrapped by region 8-9)
- Verified with `grep -cE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' divineCore.ts` returning **4** before staging the commit.

**File 4 — `divineWrapper.ts` (commit `2c744a559`):** Five conflict regions.

- Region 1 (top-of-file imports + `ConcurrencyLimiter` constructor): **merge-driver dropped-imports artefact + fork-side preservation**.
    - Dropped-imports: v2.0.0 side dropped `GAME_ID`, `DivineExecMissing`, `DivinePakInvalid`, `getLatestLSLibMod`, `logError` from imports — but the file body uses all five (`resolveExePath` line 64-69 uses `GAME_ID + getLatestLSLibMod`; the `concurrencyLimiter` retry filter uses `DivineExecMissing + DivinePakInvalid`; `listPackage` error handler line 155 uses `logError`).
    - Fork-side preservation: HEAD's `concurrencyLimiter` retry filter fails fast on 4 deterministic classes (`DivineAborted`, `DivineExecMissing`, `DivineMissingDotNet`, `DivinePakInvalid`); v2.0.0 reverted to filtering on `DivineAborted` alone, which would retry missing-exe / missing-.NET / pak-invalid 5 times each (the limiter's retry count) — multiplying log noise without changing the outcome. Inline comment `// Run 5 concurrent Divine processes. Retry on transient failures, but fail fast for deterministic ones` explicitly justifies the broader filter.
    - HEAD is the only compilable form (dropped imports) and the only sensible runtime behaviour (fail-fast filter).
- Regions 2-5 (`resolveExePath` path quotes, `runDivine` signature wrapping, `extractPak` signature wrapping, `listPackage` call args, dotnet error notification body): all cosmetic single-quote vs double-quote + wrapping differences. HEAD wins per fork style.

**File 5 — `divineCore.test.ts` (commit `9406b7a25`):** 13 conflict regions.

- All 13 regions were cosmetic single-quote vs double-quote + minor wrapping differences (e.g. `expect(...).rejects.toBeInstanceOf(...)` collapsed to one line on HEAD vs split across two lines on v2.0.0; `describe.skipIf(!isWindows)("...", () => {...})` quotes; test-name string quotes). HEAD wins per fork prevailing style.
- The test imports `DivineAborted`, `DivineExecMissing`, `DivinePakInvalid` (lines 8-10 of the import block, just past the conflict regions) and asserts each via `.rejects.toBeInstanceOf(DivineExecMissing)` etc. — the 4-class preservation invariant is implicitly anchored here too. Test imports + assertions survive intact.
- Region 1 had a notable shape: HEAD imports `os` and `fs` together with the rest near the top of the file in alphabetical order; v2.0.0 split them across two separate import groups. HEAD's grouping matches fork style.

**File 6 — `loadOrder.ts` (commit `5610e02f5`):** Two conflict regions.

- Region 1 (post-import + `serialize` signature): **merge-driver duplicate-imports artefact**. v2.0.0 side re-imported `DivineAborted/DivineExecMissing/DivinePakInvalid` from `./divineCore`, the 8 named util imports (`findNode, forceRefresh, getActivePlayerProfile, getDefaultModSettingsFormat, getPlayerProfiles, logDebug, modsPath, profilesPath`), and `PakInfoCache + ICacheEntry` from `./cache` — all of which are already imported at lines 11/13/14/15-24 above the conflict region. HEAD form (no duplicate imports, just the `serialize` signature wrap) is the only compilable resolution. Same merge-driver re-paste pattern as Phase 26 LinkingDeployment.ts and prior plans 27-02 / 27-04.
- Region 2 (`readPaks` pak-loop catch handler): two substantive HEAD wins:
    - **`return await cache.getCacheEntry(api, pakPath, mod);`** — the explicit `await` is required so the surrounding try/catch sees rejected promises. v2.0.0's bare `return cache.getCacheEntry(...)` returns the promise to a callsite outside the try, making the entire catch block (DivineAborted suppression, DivinePakInvalid log-and-suppress, DivineExecMissing user-facing error notification) dead code. Inline comment `// 'return await' (not bare 'return') so this try/catch sees the promise rejection — without await, the catch is dead code.` explicitly documents why the await is intentional. Substantive bug-fix preservation (Phase 03 / Phase 26 work).
    - **Stable notification id `bg3-divine-missing`** — `api.showErrorNotification('Divine executable is missing', message, { id: 'bg3-divine-missing', allowReport: false })`. v2.0.0 dropped the `id` field, which would cause parallel pak failures (a real scenario when scanning hundreds of paks at game-detect time) to spawn N redundant notifications. Inline comment `// Stable id so parallel pak failures collapse into one notification.` documents the intent. Fork-side UX win.

**File 7 — `index.tsx` (commit `876b9a6b2`):** One conflict region.

- Single conflict region was a textbook **merge-driver duplicate-imports + duplicate-const artefact**. v2.0.0 side re-imported `abortDivineOperations` (already at line 28), `isBG3SE/isLSLib/isLoose/isReplacer` (already at line 55), the 8 loadOrder symbols (already at line 53), `InfoPanelWrap` (already at line 30), and `PakInfoCache` (already at line 19) — plus re-declared `STOP_PATTERNS` (already at line 77) — all immediately above the conflict region. Taking v2.0.0 would have produced 6+ duplicate-import errors plus a duplicate-const-declaration error at compile time. HEAD form (no duplicates, just the two const declarations `GOG_ID` and `STEAM_ID`) is the only compilable resolution.

**Bluebird-Promise trap pre-check (per plan 27-02 D-27-04 footnote):** `grep -ln 'import Promise from' extensions/games/game-baldursgate3/src/*` returned nothing across all 7 files. The fork's BG3 source uses `import Bluebird from "bluebird"` as a named identifier (used as `Bluebird.resolve(func())` in loadOrder.ts:783 and `Bluebird` type elsewhere). The trap does not apply. Did not add or touch any return-type annotations on async functions.

## Verification

After Task 1 commit (`ef52d47f2`): `grep -c '^<<<<<<< ' extensions/games/game-baldursgate3/src/cache.ts` = 0; grep-checkpoint PASSED 11 gates (gate 10 already clean — divineCore.ts unchanged at this point).

After Task 2 commit (`d0f60cf3b`): file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 3 commit (`de2a83f88`) — PRESERVATION-CRITICAL: `grep -cE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' divineCore.ts` = 4 (gate 10 explicit pass); file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 4 commit (`2c744a559`): file conflict-clean; grep-checkpoint PASSED 11 gates (gate 10 still 4).

After Task 5 commit (`9406b7a25`): file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 6 commit (`5610e02f5`): file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 7 commit (`876b9a6b2`):

```
$ git grep -l '^<<<<<<< ' extensions/games/game-baldursgate3/
(empty — entire extension clean)

$ grep -cE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
    extensions/games/game-baldursgate3/src/divineCore.ts
4

$ pnpm run build  (in extensions/games/game-baldursgate3, build-as-typecheck per D-27-04 alt)
> game-baldursgate3@1.5.9 build /home/alex/src/Vortex/extensions/games/game-baldursgate3
> pnpm run _build && node ../../copy-extension.mjs
... (rolldown bundle succeeds; assets + tools copied; copy-extension to bundledPlugins) ...
exit=0

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... (all 11 gates OK including gate 10) ...
CHECKPOINT PASSED — 11 gate(s) clean

$ git log --oneline v8.0/config-bucket -7 | grep -cE 'resolve\(bg3\):'
7
```

All acceptance criteria from the plan met:

- Seven atomic commits matching `resolve(bg3): <file> — <stance>` ✓
- Each commit touches exactly one file ✓
- All seven files conflict-marker free ✓
- Entire extension conflict-marker free (`git grep -l '^<<<<<<< ' extensions/games/game-baldursgate3/` empty) ✓
- BG3 4-class divine error preservation gate (count ≥ 4 on `divineCore.ts`) clean throughout, explicitly verified after Task 3 commit ✓
- Per-extension typecheck (via `pnpm run build` build-as-typecheck per D-27-04 alternative) exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 after each commit ✓
- §1/§3/§10 + BG3 + Morrowind preservation gates all stayed green throughout ✓

## Commits

| Commit      | Title                                                                                                                                      | Files                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `ef52d47f2` | `resolve(bg3): cache.ts — keep HEAD (wrapped signature + double quotes per fork style)`                                                    | `extensions/games/game-baldursgate3/src/cache.ts`           |
| `d0f60cf3b` | `resolve(bg3): util.ts — keep HEAD (double quotes per fork style)`                                                                         | `extensions/games/game-baldursgate3/src/util.ts`            |
| `de2a83f88` | `resolve(bg3): divineCore.ts — keep HEAD (double quotes per fork style; preserves 4 divine error classes per D-27-02)`                     | `extensions/games/game-baldursgate3/src/divineCore.ts`      |
| `2c744a559` | `resolve(bg3): divineWrapper.ts — keep HEAD (drop merge-driver dropped-imports artefact + fork-side limiter retry filter + double quotes)` | `extensions/games/game-baldursgate3/src/divineWrapper.ts`   |
| `9406b7a25` | `resolve(bg3): divineCore.test.ts — keep HEAD (double quotes per fork style)`                                                              | `extensions/games/game-baldursgate3/src/divineCore.test.ts` |
| `5610e02f5` | `resolve(bg3): loadOrder.ts — keep HEAD (drop merge-driver duplicate-imports artefact + preserve fork-side fixes)`                         | `extensions/games/game-baldursgate3/src/loadOrder.ts`       |
| `876b9a6b2` | `resolve(bg3): index.tsx — keep HEAD (drop merge-driver duplicate-imports + duplicate-const artefact)`                                     | `extensions/games/game-baldursgate3/src/index.tsx`          |

Phase 27 progress after this plan: **22 / 25 conflict files resolved (88%)**. Next plan (27-06) tackles `game-morrowind` (1 file: `migrations.js` — Morrowind `migrate103` warning preservation gate territory). After that, plan 27-07 closes out with `game-witcher3` (2 files).

## Deviations from Plan

**Deviation 1 (Rule 3 — auto-fix blocking issue): bare `tsc --noEmit` route blocked by pre-existing infrastructure gap; routed to plan-permitted alternative.**

The plan task spec for Task 7 said:

> game-baldursgate3 has no `typecheck` script in `package.json`. Run typecheck directly:
> `pnpm exec tsc --noEmit --project extensions/games/game-baldursgate3`
> or, if no per-extension tsconfig.json exists: `pnpm exec tsc --noEmit --target es2020 --module commonjs --jsx react --esModuleInterop --skipLibCheck <files>`

Both forms surface 40+ `TS2305: Module '"vortex-api"' has no exported member` errors and a `TS2307: Cannot find module '../../../src/renderer/api'` error originating in `packages/vortex-api/src/index.ts`. These are pre-existing infrastructure errors about how the vortex-api workspace shim resolves when invoked outside the renderer/main webpack/rolldown contexts — entirely unrelated to our resolution work. Every BG3 source file would emit them regardless of the merge state.

The plan explicitly permits an alternative:

> **Alternative acceptable executor stance:** `pnpm -F game-baldursgate3 build` (rolldown bundler — produces `dist/index.cjs`; bundler errors surface here). Build-as-typecheck is acceptable for BG3 because esbuild/rolldown will refuse to bundle on syntax/resolution errors.

Routed to the alternative: `pnpm run build` (executed inside `extensions/games/game-baldursgate3`) succeeded — rolldown bundled `src/index.tsx` to `dist/index.cjs` with no syntax or resolution errors, then copied the extension to `src/main/build/bundledPlugins/game-baldursgate3/`. Clean bundle = clean resolution work.

**Trade-off (acknowledged in the plan):** build-as-typecheck does NOT catch all TypeScript errors (only syntax + resolution). For this plan it's fine because every conflict region was either (a) cosmetic quote-style differences that can't introduce type errors, (b) merge-driver duplicate/dropped-import artefacts that rolldown does catch as resolution errors, or (c) the two fork-side substantive preservations in loadOrder.ts which were `await`-keyword + notification-id-string changes — neither type-relevant.

No re-resolution required.

## Issues Encountered

None. The four merge-driver artefact patterns now well-characterised across Phase 26-27 (duplicate-block / duplicate-import / dropped-import / duplicate-const) all recurred in this extension:

- **Dropped-imports**: divineWrapper.ts region 1 (5 symbols dropped, all used in body).
- **Duplicate-imports**: loadOrder.ts region 1 (6 symbols re-imported above existing imports), index.tsx region 1 (6 symbols + 1 const re-declared above existing declarations).
- **Duplicate-const**: index.tsx region 1 (`STOP_PATTERNS` re-declared).

All four caught by reading both the conflict region AND the surrounding ~5-30 lines of pre-conflict context. The pattern at this point: when v2.0.0's "side" of a conflict region duplicates a block, drops imports, or shifts indentation in a way that disagrees with the surrounding declarations, HEAD is always the only valid resolution.

Two genuinely substantive HEAD wins beyond the artefact patterns:

- **divineWrapper.ts ConcurrencyLimiter retry filter** — fork's filter is more defensive (4 fail-fast classes vs upstream's 1). Inline code comment justifies the choice.
- **loadOrder.ts pak-loop catch handler** — `return await` (so catch sees rejections; without await, catch is dead code) and stable notification id (so parallel pak failures don't spawn N notifications). Both fixes are documented with inline comments, which made HEAD-side stance unambiguous.

## Next Phase Readiness

- **Plan 27-06 (game-morrowind, 1 file: `migrations.js`) ready** — Morrowind `migrate103` warning preservation gate (CONTEXT D-27-02 / grep-checkpoint gate 11) is the load-bearing invariant. Same defensiveness shape as BG3 4-class gate but with a substring match (`'morrowind migrate103: mod directory missing'`) and threshold ≥ 1. Independent of all other Phase 27 extensions — no cross-extension dependency.
- **Plan 27-07 (game-witcher3, 2 files: `installers.ts` → `index.ts`)** — leaf-first per D-27-01. No preservation gate; standard hand-resolution.
- Conflict-marker tail count: **3 of 25 Phase 27 files remain** (12%). No additional remote refs touched (no push performed; D-27-00 push happens at phase end with `--force-with-lease`).
- For plans 27-06 / 27-07: bluebird-Promise trap pre-check still recommended (plan 27-02 D-27-04 footnote). For Witcher3 specifically: `grep -ln 'import Promise from' extensions/games/game-witcher3/src/*` before adding any `: Promise<T>` annotations.
- For plans 27-06 / 27-07: `pnpm --filter <bare-pkg-name> typecheck` form when scripts exist; build-as-typecheck via `pnpm run build` as fallback per the BG3 D-27-04 alternative pattern established here.

## Self-Check: PASSED

- File exists: `extensions/games/game-baldursgate3/src/cache.ts` — FOUND
- File exists: `extensions/games/game-baldursgate3/src/util.ts` — FOUND
- File exists: `extensions/games/game-baldursgate3/src/divineCore.ts` — FOUND
- File exists: `extensions/games/game-baldursgate3/src/divineWrapper.ts` — FOUND
- File exists: `extensions/games/game-baldursgate3/src/divineCore.test.ts` — FOUND
- File exists: `extensions/games/game-baldursgate3/src/loadOrder.ts` — FOUND
- File exists: `extensions/games/game-baldursgate3/src/index.tsx` — FOUND
- Commit exists: `ef52d47f2` — FOUND on `v8.0/config-bucket`
- Commit exists: `d0f60cf3b` — FOUND on `v8.0/config-bucket`
- Commit exists: `de2a83f88` — FOUND on `v8.0/config-bucket`
- Commit exists: `2c744a559` — FOUND on `v8.0/config-bucket`
- Commit exists: `9406b7a25` — FOUND on `v8.0/config-bucket`
- Commit exists: `5610e02f5` — FOUND on `v8.0/config-bucket`
- Commit exists: `876b9a6b2` — FOUND on `v8.0/config-bucket`
- All seven commits touch exactly one file each — VERIFIED
- All seven commit titles match `resolve(bg3): <file> — <stance>` — VERIFIED
- Per-extension build-as-typecheck (`pnpm run build`) exit 0 — VERIFIED
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after each commit — VERIFIED
- BG3 4-class divine error preservation gate (gate 10) explicit pass after Task 3 commit, count = 4 — VERIFIED
- 7 commits visible via `git log v8.0/config-bucket -7 | grep -cE 'resolve\(bg3\):'` — VERIFIED
- §1 platform guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved — VERIFIED via grep-checkpoint OK lines after every commit

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 05_
_Completed: 2026-05-21_
