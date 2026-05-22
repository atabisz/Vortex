---
phase: 27-gamebryo-per-game-extensions
reviewed: 2026-05-21T03:08:33Z
depth: deep
files_reviewed: 25
files_reviewed_list:
    - extensions/gamebryo-savegame-management/src/actions/session.ts
    - extensions/gamebryo-savegame-management/src/index.ts
    - extensions/gamebryo-plugin-management/src/util/gameSupport.ts
    - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
    - extensions/gamebryo-plugin-management/src/views/PluginList.tsx
    - extensions/gamebryo-plugin-management/src/index.ts
    - extensions/modtype-bepinex/src/bepInExDownloader.ts
    - extensions/modtype-bepinex/src/common.ts
    - extensions/modtype-bepinex/src/index.ts
    - extensions/collections/src/util/gameSupport/gamebryo.tsx
    - extensions/collections/src/eventHandlers.ts
    - extensions/collections/src/views/CollectionPageEdit/Instructions.tsx
    - extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx
    - extensions/collections/src/views/CollectionList/index.tsx
    - extensions/collections/src/index.ts
    - extensions/games/game-baldursgate3/src/cache.ts
    - extensions/games/game-baldursgate3/src/util.ts
    - extensions/games/game-baldursgate3/src/divineCore.ts
    - extensions/games/game-baldursgate3/src/divineWrapper.ts
    - extensions/games/game-baldursgate3/src/divineCore.test.ts
    - extensions/games/game-baldursgate3/src/loadOrder.ts
    - extensions/games/game-baldursgate3/src/index.tsx
    - extensions/games/game-morrowind/src/migrations.js
    - extensions/games/game-witcher3/src/installers.ts
    - extensions/games/game-witcher3/src/index.ts
findings:
    critical: 0
    warning: 0
    info: 1
    total: 1
status: clean
---

# Phase 27: Code Review Report

**Reviewed:** 2026-05-21T03:08:33Z
**Depth:** deep (cross-file: imports, async-API consistency, invariant preservation)
**Files Reviewed:** 25
**Status:** clean — no high-priority findings

## Summary

No high-priority findings — Phase 27 conflict resolutions are clean.

All 25 resolutions follow a consistent pattern: keep HEAD (fork-side), drop merge-driver
artefacts (duplicate imports, duplicate function bodies, duplicate code blocks, stale
indent/brace), and prefer fork's oxfmt-compliant inline form for cosmetic single/multi-line
wrapping decisions. This is exactly the conservative posture documented in D-27-01.

### Invariant verification (D-27-02 / D-27-03 / D-27-04)

| Invariant                                                                                                | File                                                                                          | Status                                                                                     |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| BG3 4 divine error classes (DivineExecMissing, DivineMissingDotNet, DivineTimedOut, DivineAborted)       | `divineCore.ts` lines 11–37                                                                   | preserved; DivinePakInvalid retained as 5th                                                |
| BG3 limiter retry filter excludes deterministic errors                                                   | `divineWrapper.ts` lines 24–31                                                                | preserved (3-class exclusion)                                                              |
| BG3 stable notification id `bg3-divine-missing` to coalesce parallel failures                            | `loadOrder.ts` line 754                                                                       | preserved                                                                                  |
| BG3 `return await` inside try/catch (not bare `return`) so rejection is caught                           | `loadOrder.ts` line 733 + comment lines 731–732                                               | preserved                                                                                  |
| Morrowind migrate103 catch warns + continues (not silent) with `modPath` context                         | `migrations.js` lines 39–45                                                                   | preserved                                                                                  |
| Collections gamebryo-only `skipPluginRules` toggle gate                                                  | `InstallStartDialog.tsx` line 270 (`isGamebryoGame(profile.gameId) ? ...`)                    | preserved                                                                                  |
| Collections gamebryo-only `excludePluginRules` toggle gate                                               | `Instructions.tsx` line 27 (`isGamebryoGame(gameId)`)                                         | preserved                                                                                  |
| Plugin-mgmt single (not duplicated) `onStateChange(["persistent","profiles"], ...)` handler              | `gamebryo-plugin-management/src/index.ts` line 1976                                           | preserved (only 4 onStateChange total: loadOrder, gameMode.discovered, mainPage, profiles) |
| Plugin-mgmt async ESPFile.open chain (fork-side native-addon work)                                       | `gamebryo-plugin-management/src/index.ts` lines 237, 1788, plus async `isBlueprintPlugin` API | preserved                                                                                  |
| Plugin-mgmt `swapUserlistForProfile` no `:Promise<void>` annotation (avoids TS1064 with bluebird import) | `gamebryo-plugin-management/src/index.ts` line 786                                            | preserved (no annotation; matches commit-msg claim)                                        |
| `testRulesUnfulfilled` not orphaned by upstream's stray opener                                           | `gamebryo-plugin-management/src/index.ts` line 1529 (defined) + line 714 (called)             | preserved                                                                                  |

### Cross-file consistency checks

- **Async-API contract at `IConnectedProps.isMediumMaster`** (`PluginList.tsx` line 80): typed as `Promise<boolean>`, awaited at line 803. Result feeds `IPluginParsed.isMedium: boolean` shape. Consistent.
- **Bluebird Promise import at `gamebryo-plugin-management/src/index.ts` line 6** (`import Promise from "bluebird"`): no `:Promise<void>` annotations introduced on `async` functions in this file (would cause TS1064 — "Type 'Bluebird<void>' is not assignable to type 'Promise<void>'"). Verified by grep + typecheck.
- **`Bluebird` (named) at `loadOrder.ts` line 3 + `eventHandlers.ts` line 4**: distinct from the bluebird-Promise override; no conflict introduced.
- **No stray `<<<<<<<` / `=======` / `>>>>>>>` markers** anywhere in the 7 extension trees touched by Phase 27.

### Resolution-gap audit

For each resolve commit, the kept HEAD side carries the fork's intended behaviour AND the
upstream side did not contribute net-new logic — every conflict region was either:

1. cosmetic (single-line vs wrapped, single quote vs double quote), or
2. a merge-driver artefact (duplicated import, duplicated block, stray opener), or
3. a real semantic divergence where the fork's async/native-addon evolution diverged from
   upstream's sync API and HEAD is the only valid resolution against the fork-side
   surrounding code.

No upstream-side logic was silently dropped. Verified by reading every conflict region
diff against `f15bbabb8..HEAD`.

### Build / test evidence

- `pnpm tsc` clean per-extension on: `gamebryo-plugin-management`, `gamebryo-savegame-management`, `collections`, `modtype-bepinex`, `game-baldursgate3`, `game-witcher3`. (`game-morrowind` is JS-only — no tsc.)
- `pnpm test` on `game-baldursgate3` (vitest): 4 pass / 11 skipped — all run-on-Linux divine tests pass with the resolved code.

## Info

### IN-01: bg3 `divineCore.test.ts` covers only 3 of 5 divine error classes

**File:** `extensions/games/game-baldursgate3/src/divineCore.test.ts:17-19`
**Issue:** Test imports `DivineAborted`, `DivineExecMissing`, `DivinePakInvalid` only — `DivineMissingDotNet` and `DivineTimedOut` are exercised by `translateDivineError` but no test asserts they're produced for their respective inputs (`.NET` install message, SIGTERM signal). Pre-existing gap, not introduced by Phase 27. D-27-02 invariant requires the _classes exist_, not _all are tested_ — so the resolve commit's claim ("preserves 4 divine error classes") is correct in source. Flagging only because the gap is now visible after walking the file in review depth.
**Fix:** Out of Phase 27 scope. If pursued later, add two unit tests against `translateDivineError({ message: "You must install or update .NET ..." }, "list-package", false)` → `DivineMissingDotNet` and `translateDivineError({ signal: "SIGTERM" }, "list-package", false)` → `DivineTimedOut`. Place in the existing `describe("translateDivineError", ...)` block at the bottom of the file (around line 185).

---

_Reviewed: 2026-05-21T03:08:33Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
