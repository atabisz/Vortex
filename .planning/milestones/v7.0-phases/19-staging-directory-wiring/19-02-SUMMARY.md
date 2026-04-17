---
phase: 19-staging-directory-wiring
plan: 02
subsystem: ui
tags: [linux, staging, fs, winapi, platform-guard, stat-dev, mountpoint]

requires:
  - phase: 19-staging-directory-wiring
    provides: Wave 0 discovery.test.ts stubs for device-aware staging path suggestion

provides:
  - suggestStagingPath() in discovery.ts uses stat.dev mountpoint walk on Linux (different device returns mountpoint-based path)
  - Settings.tsx suggestPath() no longer crashes on Linux (winapi.GetVolumePathName guarded behind win32 check)

affects: [mod_management, gamemode_management, onboarding]

tech-stack:
  added: []
  patterns:
    - "stat.dev mountpoint walk: while(true) loop walking up path.dirname until parentStat.dev changes"
    - "Three-branch platform guard: same-device / linux-different-device / win32-different-drive"

key-files:
  created: []
  modified:
    - src/renderer/src/extensions/gamemode_management/util/discovery.ts
    - src/renderer/src/extensions/mod_management/views/Settings.tsx

key-decisions:
  - "Settings.tsx: stat modPaths[''] directly (not path.parse(modPaths['']).root) for correct device id on Linux"
  - "Settings.tsx: sequential awaits instead of Promise.all to allow await in mountpoint walk body"

patterns-established:
  - "Mountpoint walk pattern: start at modPaths[''], walk dirname until parentStat.dev !== baselineDev"

requirements-completed: [ONBRD-02d]

duration: 5min
completed: 2026-04-16
---

# Phase 19 Plan 02: Staging Directory Wiring Summary

**Device-aware Linux staging path suggestion via stat.dev mountpoint walk in both suggestStagingPath() and Settings.tsx suggestPath()**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-16T11:05:00Z
- **Completed:** 2026-04-16T11:07:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `suggestStagingPath()` in discovery.ts now uses a three-branch structure: same-device returns `{USERDATA}/{game}/mods`; Linux different-device walks `stat.dev` up the directory tree to find the mountpoint boundary and returns `{mountpoint}/vortex_mods/{game}`; Windows different-drive remains unchanged with `GetVolumePathName`
- Settings.tsx `suggestPath()` now guards `winapi.GetVolumePathName` behind `process.platform !== "win32"` — Linux path uses the same mountpoint walk pattern; no crash when user clicks "Suggest" on Linux
- Wave 0 discovery.test.ts: 3 tests green (including the previously-red different-device Linux test), 1 todo retained as expected

## Task Commits

Each task was committed atomically:

1. **Task 1: ONBRD-02d -- Device-aware suggestStagingPath in discovery.ts** - `b56a31b29` (feat)
2. **Task 2: Fix Settings.tsx suggestPath() Linux crash -- add mountpoint walk guard** - `a08459aa2` (feat)

## Files Created/Modified

- `src/renderer/src/extensions/gamemode_management/util/discovery.ts` - Three-branch suggestStagingPath: same-dev, Linux-mountpoint-walk, Windows-GetVolumePathName
- `src/renderer/src/extensions/mod_management/views/Settings.tsx` - Three-branch suggestPath: same-dev, Linux-mountpoint-walk, Windows-GetVolumePathName; stat modPaths[""] directly for correct device id

## Decisions Made

- **Settings.tsx: stat modPaths[""] directly, not path.parse(modPaths[""]).root** — The volume root stat gives the device id of `/` (root filesystem), not the actual mod directory device. On multi-device Linux systems where `/` and userData are on the same device but the game is on a separate mount, the old code would incorrectly take the same-device branch. Statting `modPaths[""]` directly gives the correct baseline dev.
- **Settings.tsx: sequential awaits instead of Promise.all** — The mountpoint walk body uses `await fs.statAsync(parent)` inside a while loop; this must be in an async context after the initial stats are resolved. Sequential awaits (userData first, then modDirStat) keeps the structure clean without restructuring the loop.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — no placeholder values, hardcoded paths, or unwired data sources introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced beyond what is already described in the plan's threat model (T-19-04, T-19-05, T-19-06 all mitigated by the mountpoint walk termination logic present in both implementations).

## Next Phase Readiness

- Both `suggestStagingPath` and `suggestPath` are now safe to call on Linux with multi-device setups
- Phase 19-03 (texts.ts i18n strings + Settings.tsx tooltip) can proceed — no blockers

---
*Phase: 19-staging-directory-wiring*
*Completed: 2026-04-16*
