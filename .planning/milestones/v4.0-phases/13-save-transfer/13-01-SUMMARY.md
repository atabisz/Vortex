---
phase: 13-save-transfer
plan: 01
subsystem: filesystem
tags: [wine, proton, case-folding, fs, linux, savegames, ui]

# Dependency graph
requires:
  - phase: 14-fs-case-folding
    provides: resolveCaseIfWinePrefix, isWinePrefixPath, resolvePathCase in fs.ts
provides:
  - copyAsync resolves Wine prefix src path casing before copying
  - renameAsync resolves Wine prefix sourcePath casing before renaming
  - ensureDirAsync resolves Wine prefix dirPath casing before directory creation
  - SavegameList transfer picker shows empty-state italicised helper message
affects: [save-transfer, gamebryo-savegame-management, fs-wrappers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wine prefix case-folding guard: isWinePrefixPath + resolveCaseIfWinePrefix wrapping pattern extended to copyAsync/renameAsync/ensureDirAsync"
    - "TDD: RED (failing test commit) then GREEN (implementation commit)"

key-files:
  created: []
  modified:
    - src/renderer/src/util/fs.ts
    - src/renderer/src/util/fs.test.ts
    - extensions/gamebryo-savegame-management/src/views/SavegameList.tsx

key-decisions:
  - "ensureDirAsync: resolvePathCase returns input unchanged for non-existent paths — no walk-up logic needed"
  - "copyAsync: case-fold src before selfCopyCheck so the check uses the resolved path"
  - "Empty-state condition: profileOptions.length === 0 && !activeHasLocalSaves (covers both no-other-profiles and no-global cases)"

patterns-established:
  - "Wine prefix case-folding: isWinePrefixPath guard + PromiseBB.resolve(resolveCaseIfWinePrefix) chain — same pattern for all three new functions"

requirements-completed: [SAVE-05]

# Metrics
duration: 15min
completed: 2026-04-07
---

# Phase 13 Plan 01: Save Transfer — fs.ts + UI Empty State Summary

**Wine prefix case-folding extended to copyAsync/renameAsync/ensureDirAsync; transfer picker shows italicised empty-state guidance when no eligible profiles exist**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-07T23:13:00Z
- **Completed:** 2026-04-07T23:17:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended Phase 14's Wine prefix case-folding pattern to three additional fs.ts functions: copyAsync, renameAsync, ensureDirAsync — closing the SAVE-05 gap for save profile transfer on Linux
- All three functions now transparently resolve on-disk casing for Wine/Proton prefix source paths on Linux before passing to underlying fs operations
- Transfer picker in SavegameList.tsx now shows an italicised helper message when no eligible profiles exist, guiding users to enable local saves in Profile Settings
- TDD: 3 failing tests committed first (RED), then implementation (GREEN) — all 22 tests pass

## Task Commits

1. **Task 1 (RED): Failing tests for copyAsync/renameAsync/ensureDirAsync** - `91acbc9e5` (test)
2. **Task 1 (GREEN): Extend fs.ts case-folding to three functions** - `e8f7ceaeb` (feat)
3. **Task 2: Empty-state message in save transfer picker** - `0788b2c01` (feat)

_Note: TDD task has two commits (test → feat)_

## Files Created/Modified

- `src/renderer/src/util/fs.ts` - Added case-folding guards to copyAsync, renameAsync, ensureDirAsync
- `src/renderer/src/util/fs.test.ts` - Added vi.mock fs-extra mocks (copy/rename/ensureDir/stat) and 9 new test cases in 3 describe blocks
- `extensions/gamebryo-savegame-management/src/views/SavegameList.tsx` - Added empty-state italicised helper message in renderTransfer()

## Decisions Made

- **ensureDirAsync**: resolvePathCase returns the input path unchanged when the directory does not yet exist on disk — no walk-up logic needed, per D-02 from plan context
- **copyAsync**: src is resolved before selfCopyCheck so the inode comparison uses the actual on-disk path
- **Empty-state condition**: `profileOptions.length === 0 && !activeHasLocalSaves` — covers the case where no other profiles have local saves AND the current profile has no global option, leaving the dropdown with only the placeholder

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Worktree lacked node_modules. Created symlinks from worktree to main repo's `node_modules` and `src/renderer/node_modules` so vitest could run. Tests must be run from `src/renderer/` directory (vitest.config.mts uses `./test-setup.ts` relative to that dir).

## Known Stubs

None.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are within existing Wine prefix path resolution logic.

## Next Phase Readiness

- SAVE-05 gaps closed: copyAsync/renameAsync/ensureDirAsync now resolve Wine prefix casing, and the transfer picker has empty-state UX guidance
- No blockers for phase completion

---
*Phase: 13-save-transfer*
*Completed: 2026-04-07*

## Self-Check: PASSED

- src/renderer/src/util/fs.ts: FOUND
- src/renderer/src/util/fs.test.ts: FOUND
- extensions/gamebryo-savegame-management/src/views/SavegameList.tsx: FOUND
- .planning/phases/13-save-transfer/13-01-SUMMARY.md: FOUND
- Commit 91acbc9e5 (test RED): FOUND
- Commit e8f7ceaeb (feat GREEN): FOUND
- Commit 0788b2c01 (feat Task 2): FOUND
