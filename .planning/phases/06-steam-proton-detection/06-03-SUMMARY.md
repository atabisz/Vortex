---
phase: 06-steam-proton-detection
plan: 03
subsystem: game-extensions
tags: [steam, proton, fallout4, skyrimse, cyberpunk2077, stardewvalley, winapi-bindings, linux]

# Dependency graph
requires:
  - phase: 06-02
    provides: getMyGamesPath() Wine prefix resolution + ini_prep STAM-04 Linux guard
provides:
  - "Fallout 4 extension loads on Linux without MODULE_NOT_FOUND (winapi-bindings dead import removed)"
  - "All top-4 game titles audited and confirmed Linux-compatible"
affects: [07-dist-packaging, future-game-extension-work]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Remove Windows-only dead imports from bundled JS extensions (not covered by webpack alias)"]

key-files:
  created: []
  modified:
    - extensions/games/game-fallout4/src/index.js

key-decisions:
  - "Fallout 4 winapi-bindings: dead import removed from source (dist is generated at build time, gitignored)"
  - "Cyberpunk 2077 is a registerGameStub with no imports — fully Linux safe"
  - "Stardew Valley uses platform-conditional requiredFiles/executable — native Linux binary already supported"
  - "Skyrim SE has no winapi-bindings; {mygames} INI paths resolved via STAM-04 Wine prefix fix in ini_prep"

patterns-established:
  - "Bundled game extensions use copyfiles (not webpack) — webpack alias does NOT cover them; check for Windows-only require() calls"

requirements-completed: [STAM-05]

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 06 Plan 03: Game Extensions Audit Summary

**Dead winapi-bindings require removed from Fallout 4; all 4 top-title game extensions confirmed Linux-compatible**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-31T22:16:00Z
- **Completed:** 2026-03-31T22:16:52Z
- **Tasks:** 1 of 2 (Task 2 = human-verify checkpoint, awaiting user)
- **Files modified:** 1

## Accomplishments

- Removed dead `const winapi = require('winapi-bindings')` from `game-fallout4/src/index.js` (variable never referenced, causes MODULE_NOT_FOUND on Linux at runtime since bundled extensions bypass webpack alias)
- Confirmed Cyberpunk 2077 is a pure `registerGameStub` with zero imports — fully Linux safe
- Confirmed Stardew Valley has native Linux executable detection (`requiredFiles: ["StardewValley"]` on non-win32, Linux `defaultPaths` included)
- Confirmed Skyrim SE has no winapi-bindings dependency and uses `{mygames}` template INI paths that inherit the STAM-04 Wine prefix fix from `ini_prep/gameSupport.ts`

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead winapi-bindings require from Fallout 4 and audit remaining 3 titles** - `942997faf` (fix)
2. **Task 2: Verify Steam/Proton detection end-to-end on Linux** - PENDING (checkpoint:human-verify)

## Files Created/Modified

- `extensions/games/game-fallout4/src/index.js` - Removed unused `const winapi = require('winapi-bindings')` on line 4

## Decisions Made

- **Bundled extension webpack alias gap**: Bundled game extensions under `extensions/games/` are distributed via `copyfiles` (not webpack bundle), so the webpack/rolldown alias for `winapi-bindings` does NOT intercept their `require()` calls at runtime. This means any remaining Windows-only `require()` in these JS files will fire unconditionally on Linux. Fix: remove dead imports from source.
- **Dist is gitignored**: `extensions/games/game-fallout4/dist/` is in `.gitignore`. Only `src/index.js` is committed; dist is regenerated at build time via `pnpm run _build`.

## Audit Findings

### Fallout 4
- **Issue**: Line 4 `const winapi = require('winapi-bindings')` — variable `winapi` is never referenced anywhere in the 141-line file
- **Fix**: Line removed from `src/index.js`
- **Other requires intact**: `bluebird`, `path`, `vortex-api` all present and used
- **Status**: FIXED — will load on Linux without MODULE_NOT_FOUND

### Cyberpunk 2077
- **Audit**: Pure stub (`registerGameStub`); only 17 lines with zero require/import statements
- **Status**: CONFIRMED CLEAN — no Windows-only dependencies

### Stardew Valley
- **Audit**: `StardewValleyGame.ts` uses `process.platform == "win32"` guards for `requiredFiles` and `executable()`; on Linux `requiredFiles: ["StardewValley"]` (native ELF binary); `defaultPaths` includes Linux paths (`~/.local/share/Steam/steamapps/...`)
- **Status**: CONFIRMED — native Linux support already present

### Skyrim SE
- **Audit**: `src/index.js` has no winapi-bindings import; uses `{mygames}` template paths for all INI files; `ini_prep/gameSupport.ts` resolves `{mygames}` to Wine prefix path via `getMyGamesPath(compatDataPath)` on Linux when `steamEntry.usesProton` is true (STAM-04 fix from plan 06-02)
- **Status**: CONFIRMED — inherits STAM-04 Wine prefix fix

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `extensions/games/game-fallout4/dist/` is gitignored, so `dist/index.js` could not be committed separately. Dist is regenerated via `pnpm run _build` (copyfiles from src). This is correct behavior — source is the canonical file.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All STAM-01 through STAM-05 requirements addressed across plans 06-01, 06-02, 06-03
- Task 2 (end-to-end human verification) is pending: user should run `pnpm run build && pnpm run start` on Linux, verify Steam games detected, confirm Fallout 4 loads without MODULE_NOT_FOUND
- Phase 07 (dist packaging) can proceed independently once STAM-05 verification passes

---
*Phase: 06-steam-proton-detection*
*Completed: 2026-03-31*
