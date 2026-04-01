---
phase: 10-save-ui-validation-steamos-polkit
plan: "01"
subsystem: gamebryo-savegame-management
tags: [linux, proton, save-management, async, steam]
dependency_graph:
  requires: []
  provides: [async-mygames-path, linux-proton-save-path, save-04-fix]
  affects: [save-game-ui, ini-path-comparison]
tech_stack:
  added: []
  patterns:
    - async-function-with-linux-branch
    - GameStoreHelper.getGameStore-pattern
    - getSteamEntry-mirroring-ini_prep
key_files:
  created:
    - extensions/gamebryo-savegame-management/vitest.config.ts
    - extensions/gamebryo-savegame-management/__mocks__/vortex-api.ts
    - extensions/gamebryo-savegame-management/src/util/gameSupport.test.ts
  modified:
    - extensions/gamebryo-savegame-management/src/util/gameSupport.ts
    - extensions/gamebryo-savegame-management/src/index.ts
    - extensions/gamebryo-savegame-management/tsconfig.json
decisions:
  - key: getSteamEntry uses GameStoreHelper (not direct Steam import)
    reason: bundled extension cannot import from renderer src/; GameStoreHelper available via vortex-api util
  - key: getMyGamesPath inlined
    reason: bundled extension constraint; function is a simple path.join
  - key: ILocalSteamEntry local interface
    reason: ISteamEntry not exported by vortex-api; bundled extension constraint
  - key: tsconfig.json excludes test/mock files
    reason: __mocks__ directory outside src/ caused TS6307; test files excluded from production typecheck
  - key: async IIFE for synchronous callback contexts
    reason: onStateChange and onProfilesModified are sync callbacks; async IIFE wraps mygamesPath calls
metrics:
  duration: "~8 minutes"
  completed: "2026-04-01"
  tasks_completed: 3
  files_changed: 6
---

# Phase 10 Plan 01: Async mygamesPath with Linux Proton Branch Summary

**One-liner:** Async mygamesPath() with getSteamEntry helper returns Wine prefix compatdata path for Proton games on Linux, fixing SAVE-02/03/04.

## What Was Built

Made `mygamesPath()`, `iniPath()`, and `prefIniPath()` in the gamebryo-savegame-management extension async, adding a Linux Proton branch that returns the Wine prefix path (`compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/<game>`) when the game is detected as a Proton Steam game. All callers in `index.ts` were updated to `await` the result.

The SAVE-04 root cause fix: the `apply-settings` handler now compares `filePath` against `await iniPath(prof.gameId)` instead of the sync result, ensuring the ini path comparison works correctly on Linux where the path is inside the Wine prefix.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | Create vitest config and unit test stubs | d7338cfa9 | vitest.config.ts, __mocks__/vortex-api.ts, gameSupport.test.ts |
| 1 | Make mygamesPath/iniPath/prefIniPath async with Linux Proton branch | 5fc0b4adb | gameSupport.ts |
| 2 | Update all callers in index.ts to async | a42470f42 | index.ts, tsconfig.json |

## Verification Results

- TypeScript compiles with zero errors: PASS
- All 5 unit tests pass (vitest): PASS
- No bare synchronous `mygamesPath(` calls in index.ts: PASS
- Linux guard `process.platform === "linux"` present: PASS
- Wine prefix path `pfx/.../steamuser` constructed: PASS
- SAVE-04 fix `await iniPath(prof.gameId)` in apply-settings: PASS

## Behavioral Contract (Test Coverage)

1. **Test 1** (SAVE-02/03): `mygamesPath("skyrimse")` on Linux with Proton entry returns `compatdata/489830/pfx/drive_c/users/steamuser/Documents/My Games/Skyrim Special Edition`
2. **Test 2** (SAVE-02 fallback): Non-Proton Linux (GOG store) returns `Documents/My Games/...` fallback
3. **Test 2b** (SAVE-02 fallback): Windows returns `Documents/My Games/...` fallback
4. **Test 3** (SAVE-04): `iniPath("skyrimse")` on Linux with Proton returns Wine prefix path + `/Skyrim.ini`
5. **Test 4** (guard): On Windows, `mockAllGames` is never called — platform guard short-circuits before Steam lookup

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `getSteamEntry` uses `util.GameStoreHelper.getGameStore("steam")` | Bundled extensions can't import `steam` from renderer src/; GameStoreHelper is available via vortex-api |
| `getMyGamesPath` logic inlined | Simple `path.join`; not worth a cross-boundary import |
| `ILocalSteamEntry` local interface | `ISteamEntry` not exported by vortex-api; avoids renderer src/ import |
| `tsconfig.json` excludes test/mock files | `__mocks__` outside `src/` causes TS6307; production typecheck should not traverse test infrastructure |
| Async IIFE in synchronous callbacks | `onStateChange` and `onProfilesModified` are sync callbacks; IIFE wraps async mygamesPath calls |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] tsconfig.json excludes test/mock files**
- **Found during:** Task 2 verification
- **Issue:** TypeScript raised TS6307 because `__mocks__/vortex-api.ts` was outside the `src/` include pattern but referenced by the test file inside `src/`
- **Fix:** Added `"exclude": ["src/**/*.test.ts", "__mocks__"]` to tsconfig.json
- **Files modified:** `extensions/gamebryo-savegame-management/tsconfig.json`
- **Commit:** a42470f42

## Known Stubs

None — all data flows are wired. The `mygamesPath()` function resolves the actual Wine prefix path from the Steam store at runtime.

## Self-Check

Checking created files and commits...

## Self-Check: PASSED

All created files verified present. All task commits verified in git history.
