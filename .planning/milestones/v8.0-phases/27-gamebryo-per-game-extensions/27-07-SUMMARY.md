---
phase: 27-gamebryo-per-game-extensions
plan: 07
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - witcher3
    - phase-27
    - extension-conflict
    - leaf-first
requirements:
    satisfied:
        - SYNC-19
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-04-SUMMARY.md (per-extension wave-6 parallel — independent of 27-05/27-06)
    provides:
        - Last Phase 27 extension fully resolved (25/25 conflict files done — 100%)
        - game-witcher3 build-as-typecheck clean on the resolved tree
    affects:
        - Plan 27-08 (Phase 27 done-gate — 6 checks + force-with-lease push to fork/sync/upstream-v2.0.0)
tech_stack:
    added: []
    patterns:
        - "Cosmetic single-quote vs double-quote resolution stance (carried from plans 27-01..27-06): keep HEAD double-quote form per fork prevailing style"
        - "Cosmetic arg-wrapping resolution stance (oxfmt one-per-line with trailing comma at print-width=80): keep HEAD wrapped form per fork prevailing oxfmt-emitted shape"
        - "Per-extension typecheck via `pnpm run build` (rolldown bundler — refuses syntax/resolution errors at bundle time): game-witcher3 has no per-extension tsconfig.json AND no `typecheck` script in package.json. Same routing as BG3 plan 27-05 (D-27-04 deviation); bare `pnpm exec tsc --noEmit -p extensions/games/game-witcher3` fails with TS5057 (no tsconfig). Build succeeded (exit 0) — bundle copied to src/main/build/bundledPlugins/game-witcher3."
        - "Bluebird-Promise trap pre-checked clean: `grep -ln 'import Promise from' extensions/games/game-witcher3/src/*.ts` returned nothing. The file imports `Bluebird` as a named identifier (not aliased to Promise), so any existing `Promise<T>` annotations refer to the global Promise — safe to leave untouched. No annotations were added or removed."
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-07-SUMMARY.md
    modified:
        - extensions/games/game-witcher3/src/installers.ts
        - extensions/games/game-witcher3/src/index.ts
decisions:
    - "Kept HEAD on all 3 conflict regions (2 in installers.ts, 1 in index.ts). Every region was cosmetic — single-quote vs double-quote and oxfmt arg-wrapping (one-per-line with trailing comma at print-width=80 vs upstream pre-oxfmt inlined shape). Identical behaviour either way; HEAD wins per fork prevailing style across both files (every other string literal in installers.ts uses double quotes; every other registerInstaller in main() uses HEAD's wrapped shape on adjacent lines)."
    - "Per-extension typecheck routed via `pnpm run build` (build-as-typecheck per BG3 D-27-04 alternative). game-witcher3 has no per-extension `tsconfig.json` (bare `pnpm exec tsc --noEmit -p extensions/games/game-witcher3` returns TS5057) AND no `typecheck` script in package.json. Build succeeded — bundle.js produced via `node build.mjs` rolldown invocation, copied to `src/main/build/bundledPlugins/game-witcher3`. Same logic as BG3: bundler refuses to bundle on syntax/resolution errors, so build-as-typecheck is the meaningful syntax-gate equivalent. Acknowledged trade-off (catches syntax + resolution but not all TS errors); acceptable here because every conflict region was cosmetic."
    - "Bluebird-Promise trap not applicable. `index.ts` line 4 imports `Bluebird from 'bluebird'` as a *named* identifier, NOT `Promise from 'bluebird'`. `Promise<T>` annotations in the file (e.g. `findGame(): Bluebird<string>` uses Bluebird directly; `Promise.resolve(...)` calls use the global Promise) are unambiguous. installers.ts does not import bluebird at all. No annotations were added, modified, or removed during resolution. Trap pre-check (`grep -ln 'import Promise from' extensions/games/game-witcher3/src/*.ts`) returned no matches."
    - "oxfmt pre-commit hook (lint-staged → pnpm oxfmt) ran on both commits. Both commits show `1 file changed, N deletions(-)` only — no formatting touch-ups beyond the conflict-marker removal itself. Each commit touches exactly one file."
metrics:
    duration_minutes: 4
    completed: "2026-05-21"
    commit_count: 2
    task_count: 2
    file_count: 2
---

# Phase 27 Plan 07: game-witcher3 conflict resolution Summary

Resolved the two conflict files in `extensions/games/game-witcher3/src/` per D-27-01 leaf-first sub-order: `installers.ts` (1/2) → `index.ts` (2/2). Three cosmetic conflict regions total — all kept HEAD (fork double-quote style + oxfmt-wrapped args). Per-extension typecheck via `pnpm run build` (build-as-typecheck per BG3 D-27-04 alternative — game-witcher3 has no per-extension tsconfig.json and no `typecheck` script). 11-gate grep-checkpoint clean after each commit. Phase 27 progress: **25/25 conflict files resolved (100%)** — Phase 27 file work complete; only the done-gate plan (27-08) remains.

## What Got Resolved

**File 1 — `extensions/games/game-witcher3/src/installers.ts` (commit `ae13a4c5b`):** Two conflict regions, both cosmetic.

- **Region 1 (top-of-file imports, lines 2-14 pre-resolution):** Cosmetic single-quote vs double-quote on five `import` statements. HEAD wraps with double quotes (`import path from "path"`, `from "vortex-api"`, etc.) plus a blank line separating the path import from the vortex-api import; v2.0.0 used single quotes and inlined all five imports without a separator. HEAD wins per fork prevailing style — every other string literal in the file (and across the rest of the witcher3 source) uses double quotes.
- **Region 2 (`scriptMergerDummyInstaller`, lines 23-46 pre-resolution):** Three diffs in one region. (1) **Function signature wrap:** HEAD wraps the signature across 3 lines (`export function scriptMergerDummyInstaller(\n  api: types.IExtensionApi,\n): Promise<types.IInstallResult>`) per oxfmt print-width=80; v2.0.0 inlined it onto one line. (2) **Argument wrapping for `api.showErrorNotification?.()`:** HEAD wraps the multi-line message string with `+` operators at line start (`"text " +\n      "text " +\n      ...`); v2.0.0 used `+` at line end with extra indentation. (3) **Single-quote vs double-quote:** every string literal in the region carried the same diff, plus v2.0.0 used escaped single quotes (`'can\\'t'`, `'should\\'ve'`) where HEAD's double quotes need no escaping. All three favour HEAD per the prevailing oxfmt-emitted shape (one-per-line wrapped + double quotes).

**File 2 — `extensions/games/game-witcher3/src/index.ts` (commit `cbfcc1804`):** Single conflict region (lines 178-207 pre-resolution) wrapping the six `registerInstaller` calls in the extension's `main()` function. HEAD wraps each call's args one-per-line with trailing comma per oxfmt print-width=80; v2.0.0 inlined each call onto one long line with single quotes. Identical behaviour either way — six installers register on the same priorities (15, 20, 25, 30, 50, 60) for `scriptmergerdummy`, `witcher3menumodroot`, `witcher3mixed`, `witcher3tl`, `witcher3content`, and `witcher3dlcmod`. HEAD wins per the prevailing oxfmt shape that surrounds the conflict region (every adjacent `registerModType` call on lines 209-244 already uses HEAD's wrapped form).

**Bluebird-Promise trap (per plan 27-02 D-27-04 footnote):** Not applicable. `index.ts` line 4 imports `Bluebird from "bluebird"` as a _named_ identifier, not `Promise from "bluebird"`. Existing `Promise.resolve()` and `Promise.reject()` call sites in the file refer to the global Promise; `findGame(): Bluebird<string>` and `() => Bluebird.resolve(false)` use the Bluebird namespace explicitly. `installers.ts` does not import bluebird at all. The trap (which targets `: Promise<T>` annotations on async functions in files that ES-import bluebird as Promise) doesn't apply here. Pre-check `grep -ln 'import Promise from' extensions/games/game-witcher3/src/*.ts` returned no matches before resolution started; no annotations were added, modified, or removed during resolution.

## Verification

After Task 1 commit (`ae13a4c5b`):

```
$ grep -c '^<<<<<<< ' extensions/games/game-witcher3/src/installers.ts
0

$ git log -1 --format=%s
resolve(witcher3): installers.ts — keep HEAD (double quotes + oxfmt-wrapped args per fork style)

$ git show --stat --format= HEAD | tail -3
 extensions/games/game-witcher3/src/installers.ts | 19 -------------------
 1 file changed, 19 deletions(-)

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... 11 gates OK ...
CHECKPOINT PASSED — 11 gate(s) clean
exit=0
```

After Task 2 commit (`cbfcc1804`):

```
$ grep -c '^<<<<<<< ' extensions/games/game-witcher3/src/index.ts
0

$ git grep -l '^<<<<<<< ' extensions/games/game-witcher3/
(empty — exit 1)

$ git log -1 --format=%s
resolve(witcher3): index.ts — keep HEAD (double quotes + oxfmt-wrapped registerInstaller calls per fork style)

$ git show --stat --format= HEAD | tail -3
 extensions/games/game-witcher3/src/index.ts | 9 ---------
 1 file changed, 9 deletions(-)

$ cd extensions/games/game-witcher3 && pnpm run build
> game-witcher3@1.7.4 build
> pnpm run _build && node ../../copy-extension.mjs
... rolldown bundles cleanly ...
Extension: games/game-witcher3
Copied 5 files to /home/alex/src/Vortex/src/main/build/bundledPlugins/game-witcher3
(exit 0)

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... 11 gates OK ...
CHECKPOINT PASSED — 11 gate(s) clean
exit=0

$ git log --oneline v8.0/config-bucket -10 | grep -cE 'resolve\(witcher3\):'
2
```

All acceptance criteria from the plan met:

- Two atomic commits matching `resolve(witcher3): <file> — <stance>` ✓
- Each commit touches exactly one file ✓
- Both files conflict-marker free; entire `extensions/games/game-witcher3/` directory clean ✓
- Per-extension typecheck (build-as-typecheck via `pnpm run build`) exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 — 11 gates clean after each commit ✓
- §1 extension build guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved (gates 7, 8, 9, 10, 11 OK) ✓
- 25/25 Phase 27 conflict files resolved cumulatively ✓

## Commits

| Commit      | Title                                                                                                            | Files                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `ae13a4c5b` | `resolve(witcher3): installers.ts — keep HEAD (double quotes + oxfmt-wrapped args per fork style)`               | `extensions/games/game-witcher3/src/installers.ts` |
| `cbfcc1804` | `resolve(witcher3): index.ts — keep HEAD (double quotes + oxfmt-wrapped registerInstaller calls per fork style)` | `extensions/games/game-witcher3/src/index.ts`      |

Phase 27 progress after this plan: **25 / 25 conflict files resolved (100%)**. The Phase 27 file work is complete. Plan 27-08 runs the D-27-05 done-gate (six checks: zero conflict markers across the seven Phase 27 directories; grep-checkpoint passes; per-extension typecheck for each touched extension; full-repo `pnpm typecheck`; 25 atomic resolve commits visible on `v8.0/config-bucket`; force-with-lease push to `fork/sync/upstream-v2.0.0`).

## Deviations from Plan

**Deviation 1 (Rule 3 — auto-fix blocking issue / D-27-04 alternative): per-extension typecheck routed via `pnpm run build` (build-as-typecheck) instead of the plan's preferred `pnpm exec tsc --noEmit -p extensions/games/game-witcher3`.**

The plan offered two acceptable typecheck options:

1. `pnpm exec tsc --noEmit --project extensions/games/game-witcher3` (preferred); plan acknowledges fallback to bare-flag form if no per-extension tsconfig.json exists.
2. `pnpm -F game-witcher3 build` (build-as-typecheck — rolldown bundler refuses to bundle on errors).

`pnpm exec tsc --noEmit -p extensions/games/game-witcher3` failed with `error TS5057: Cannot find a tsconfig.json file at the specified directory`. game-witcher3 has no per-extension `tsconfig.json` (the extension extends the workspace tsconfig via `vortex-api` workspace import only). The bare-flag fallback (`pnpm exec tsc --noEmit --target es2020 --module commonjs --jsx react --esModuleInterop --skipLibCheck …`) would surface the same vortex-api workspace shim resolution noise that plan 27-05 documented for BG3 — pre-existing TS2305 errors unrelated to resolution work, swamping the signal we actually need.

Routed instead to alternative 2 (`pnpm run build`). Rolldown's `build.mjs` invocation refuses to bundle on syntax/resolution errors — the build either succeeds (exit 0) or surfaces a real error. Build succeeded after the second commit; the bundle was copied to `src/main/build/bundledPlugins/game-witcher3` per the extension's standard `copy-extension.mjs` step. Same routing decision as BG3 plan 27-05 (which also surfaced the bare-tsc noise problem and routed to build-as-typecheck). Acknowledged trade-off (catches syntax + resolution errors but not all TS errors); acceptable here because every conflict region was cosmetic quote-style or oxfmt arg-wrapping — neither type-relevant.

The plan explicitly framed both options as "acceptable" — this is a routing-within-spec decision, not a deviation from intent.

No re-resolution required.

## Issues Encountered

None. The two cosmetic conflict patterns now well-characterised across plans 27-01..27-06 (single/double-quote, arg-wrapping) both recurred:

- **Single/double-quote:** every string literal in all three regions carried the same diff. HEAD's double quotes match the fork prevailing style (every other string literal in both witcher3 source files uses double quotes); v2.0.0's single quotes are the upstream pre-oxfmt shape. Witcher3 picks up the same idiom as morrowind, BG3, plugin-mgmt, savegame-mgmt, modtype-bepinex, and collections.
- **Arg-wrapping:** the `scriptMergerDummyInstaller` signature, its `api.showErrorNotification?.()` call, and the six `registerInstaller` calls in `main()` all showed the same multi-line-on-HEAD vs inline-on-v2.0.0 pattern (oxfmt print-width=80 wraps args one-per-line with trailing comma; the upstream pre-oxfmt shape inlined them). HEAD wins per surrounding-context match.

No merge-driver artefacts (no duplicate-imports, no dropped-imports, no duplicate-const, no stray phantom blocks). The two files are small enough (~393 lines installers.ts, ~337 lines index.ts) that the merge driver had no surrounding mass to confuse it. Single conflict region per scope only; installers.ts had two regions but they don't touch each other.

## Next Phase Readiness

- **Plan 27-08 (Phase 27 done-gate + force-with-lease push) ready** — all 25 conflict files now resolved on `v8.0/config-bucket`. Done-gate runs the six D-27-05 checks: (1) zero conflict markers across all seven Phase 27 directories, (2) `scripts/grep-checkpoint.sh` exits zero (covers §1/§3/§10 + BG3 + Morrowind + Phase 26 gates — 12 total), (3) each touched extension passes its own typecheck route (savegame-mgmt + plugin-mgmt + modtype-bepinex + collections via `pnpm --filter <pkg> typecheck`; BG3 + witcher3 via `pnpm run build`; morrowind via `node --check`), (4) full-repo `pnpm typecheck` (final cross-extension drift check — Phase 28 territory may still surface errors but they should be in `src/renderer/`, `src/main/`, etc. — not in the Phase 27 extension dirs), (5) 25 atomic resolve commits visible via `git log --oneline v8.0/config-bucket | grep -cE '^[0-9a-f]+ resolve\\([a-z-]+\\):'`, (6) `--force-with-lease` push to `fork/sync/upstream-v2.0.0`.
- **All 11 grep-checkpoint gates clean throughout this plan** — §6, §7a, §7b, §7c, §7d, 140a57217, §1, §3, §10, BG3 4-class divine, Morrowind migrate103. No regressions introduced. Conflict-marker gate (gate 12) skipped per `--skip-conflict-check` during resolution; will run unsuppressed in plan 27-08's done-gate.
- **No additional remote refs touched** — no push performed. D-27-00 push happens at phase end with `--force-with-lease` (plan 27-08).
- **Phase 28 readiness signal:** with all 25 Phase 27 files clean, the next conflict-marker scan should narrow to renderer + main spine territory only (`src/renderer/`, `src/main/`, `src/preload/`, `src/shared/`, `extensions/nexus_integration/`, `scripts/`, `.github/actions/fingerprints/`). Phase 27 has no remaining file work.

## Self-Check: PASSED

- File exists: `extensions/games/game-witcher3/src/installers.ts` — FOUND
- File exists: `extensions/games/game-witcher3/src/index.ts` — FOUND
- File exists: `.planning/phases/27-gamebryo-per-game-extensions/27-07-SUMMARY.md` — FOUND
- Commit exists: `ae13a4c5b` — FOUND on `v8.0/config-bucket`
- Commit exists: `cbfcc1804` — FOUND on `v8.0/config-bucket`
- Each commit touches exactly one file — VERIFIED (`installers.ts | 19 -------`; `index.ts | 9 ---------`)
- Commit titles match `resolve(witcher3): <file> — <stance>` — VERIFIED for both
- Per-extension typecheck via `pnpm run build` (build-as-typecheck) exit 0 — VERIFIED
- `extensions/games/game-witcher3/` directory conflict-marker free — VERIFIED (`git grep -l '^<<<<<<< ' extensions/games/game-witcher3/` returns empty)
- All 7 Phase 27 extension directories conflict-marker free — VERIFIED (global `git grep -l` across the seven dirs returns empty)
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after each commit — VERIFIED
- §1 extension build guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved — VERIFIED via grep-checkpoint OK lines
- 2 witcher3 commits visible via `git log v8.0/config-bucket -10 | grep -cE 'resolve\\(witcher3\\):'` — VERIFIED (count = 2)

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 07_
_Completed: 2026-05-21_
