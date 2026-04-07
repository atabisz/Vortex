---
phase: 14-linux-case-folding-fs-wrapper
plan: 01
subsystem: filesystem
tags: [linux, wine, proton, case-folding, fs, util]

# Dependency graph
requires:
  - phase: 06-steam-proton-detection
    provides: proton prefix path patterns (/compatdata/<id>/pfx/)
provides:
  - resolvePathCase promoted to src/renderer/src/util/ and exported via util namespace in vortex-api
  - Wine prefix case-folding shim in fs.ts covering readFileAsync, writeFileAsync, statAsync, watch
  - PluginPersistor simplified: resolvePluginsFilePath removed, shim handles path resolution
affects:
  - mod_management (LinkingDeployment, InstallManager now import from util/)
  - any bundled extension using fs.readFileAsync/writeFileAsync/statAsync on Wine prefix paths
  - gamebryo-plugin-management (PluginPersistor cleanup)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wine prefix detection: process.platform === linux && path.includes(/compatdata/) && path.includes(/pfx/)"
    - "TDD: RED commit (failing tests) then GREEN commit (implementation)"
    - "fs shim pattern: Raw variant + wrapped variant, wrapping with resolvePathCase before delegation"

key-files:
  created:
    - src/renderer/src/util/resolvePathCase.ts
    - src/renderer/src/util/resolvePathCase.test.ts
  modified:
    - src/renderer/src/util/fs.ts
    - src/renderer/src/util/fs.test.ts
    - src/renderer/src/util/api.ts
    - src/renderer/src/extensions/mod_management/LinkingDeployment.ts
    - src/renderer/src/extensions/mod_management/InstallManager.ts
    - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts

key-decisions:
  - "resolvePathCase moved from mod_management/util/ to src/renderer/src/util/ — accessible as util.resolvePathCase from vortex-api"
  - "isWinePrefixPath uses O(1) string check: process.platform===linux + /compatdata/ + /pfx/ — no regex needed"
  - "No dirCache at shim layer (D-09): individual call overhead acceptable; bulk deployment loops already use resolvePathCase directly with cache"
  - "watch wrapped synchronously via resolvePathCaseSync using readdirSync — fs.watch is synchronous so async resolution not possible"
  - "PluginPersistor.resolvePluginsFilePath removed: shim transparently resolves casing; simple path.join(dir, plugins.txt) suffices"
  - "fileName.toLowerCase() watch fix kept permanently: inotify event filenames from OS are outside shim reach"

patterns-established:
  - "Wine prefix shim pattern: isWinePrefixPath() guard + resolveCaseIfWinePrefix() async wrapper before delegating to Raw variant"
  - "Sync watch wrapper: resolvePathCaseSync() iterates path segments using readdirSync, catches errors to preserve original path"

requirements-completed: [CASE-01, CASE-02, CASE-03]

# Metrics
duration: 5min
completed: 2026-04-07
---

# Phase 14 Plan 01: Linux Case-Folding fs Wrapper Summary

**resolvePathCase promoted to util/, fs.ts transparently resolves Wine prefix path casing for readFileAsync/writeFileAsync/statAsync/watch on Linux**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-07T12:12:00Z
- **Completed:** 2026-04-07T12:17:06Z
- **Tasks:** 2 (Task 1: promote + export; Task 2: TDD shim)
- **Files modified:** 6 (+ 2 created, 2 deleted)

## Accomplishments

- `resolvePathCase` promoted from `mod_management/util/` to `src/renderer/src/util/` and exported as `util.resolvePathCase` in the vortex-api `util` namespace
- `fs.ts` now transparently applies Wine prefix case-folding for `readFileAsync`, `writeFileAsync`, `statAsync`, and `watch` — all callers get case-aware behavior without source changes
- `PluginPersistor.resolvePluginsFilePath` removed — the fs shim makes per-callsite workarounds redundant; serialize/deserialize simplified to `path.join(dir, "plugins.txt")`
- 19 tests pass: 6 resolvePathCase unit tests + 7 Wine prefix shim tests + 6 readFileBOM tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Promote resolvePathCase and export via util namespace** - `441b0860c` (feat)
2. **Task 2: RED — failing tests for Wine prefix shim** - `27591a96e` (test)
3. **Task 2: GREEN — wire Wine prefix shim + PluginPersistor cleanup** - `4e4d2e3e5` (feat)

_Note: TDD task has two commits (test RED → feat GREEN)_

## Files Created/Modified

- `src/renderer/src/util/resolvePathCase.ts` - Promoted case-folding resolver (was in mod_management/util/)
- `src/renderer/src/util/resolvePathCase.test.ts` - Migrated tests (mock path updated to ./fs)
- `src/renderer/src/util/fs.ts` - isWinePrefixPath(), resolveCaseIfWinePrefix(), wrapped async functions, wrapped watch
- `src/renderer/src/util/fs.test.ts` - Added Wine prefix shim tests alongside existing readFileBOM tests
- `src/renderer/src/util/api.ts` - Import + export of resolvePathCase in util namespace
- `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` - Import updated to ../../util/resolvePathCase
- `src/renderer/src/extensions/mod_management/InstallManager.ts` - Import updated to ../../util/resolvePathCase
- `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` - Removed resolvePluginsFilePath, simplified path joins

## Decisions Made

- `isWinePrefixPath` uses two `includes()` calls: `/compatdata/` and `/pfx/` — O(1), no regex needed per D-04
- No `dirCache` at shim layer (D-09): shim is a scatter-call safety net; bulk deployment loops that need performance already call `resolvePathCase` directly with a cache
- `watch` wrapped synchronously using `readdirSync` — `fs.watch()` is a sync API so async resolution is not possible; sync readdir only fires for Wine prefix paths (rare, 1-2 calls per game session)
- PluginPersistor cleanup (D-12): `resolvePluginsFilePath` method entirely removed; `path.join(dir, "plugins.txt")` passes through `fs.readFileAsync`/`fs.writeFileAsync`/`fs.statAsync` which now handle case-folding transparently

## Deviations from Plan

None — plan executed exactly as written. PluginPersistor cleanup was in-scope per D-10/D-11/D-12.

## Issues Encountered

None — the fs.test.ts already existed with readFileBOM tests. The vi.mock("./resolvePathCase") was hoisted correctly and coexisted cleanly with the existing fs-extra mock.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `resolvePathCase` is now accessible as `util.resolvePathCase` from vortex-api for any future bundled extensions
- Wine prefix fs calls are transparently case-aware — future callers do not need per-callsite fixes
- Phase 14 Plan 02 can proceed: PluginPersistor cleanup is complete, watch wrapper is live

## Self-Check: PASSED

All files present. All commits verified.

---
*Phase: 14-linux-case-folding-fs-wrapper*
*Completed: 2026-04-07*
