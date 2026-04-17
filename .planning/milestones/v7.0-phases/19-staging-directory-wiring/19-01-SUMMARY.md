---
phase: 19-staging-directory-wiring
plan: "01"
subsystem: staging-directory
tags: [linux, onboarding, platform-guard, tdd]
dependency_graph:
  requires: [19-00]
  provides: [ONBRD-02a, ONBRD-02b, ONBRD-02c]
  affects: [firststeps_dashlet, mod_management]
tech_stack:
  added: []
  patterns: [platform-guard-win32-else, statAsync-ancestor-walk, ternary-inside-t]
key_files:
  created: []
  modified:
    - src/renderer/src/extensions/firststeps_dashlet/todos.tsx
    - src/renderer/src/extensions/firststeps_dashlet/todos.test.ts
    - src/renderer/src/extensions/mod_management/stagingDirectory.ts
    - src/renderer/src/extensions/mod_management/texts.ts
    - src/renderer/src/extensions/mod_management/views/Settings.tsx
decisions:
  - "findAccessibleAncestor exported as named export for testability (lazyRequire proxy prevents tracking through production function per Phase 19 STATE.md note)"
  - "ternary is INSIDE t() call (not outside) per D-09 pattern — Windows string unchanged, Linux string added as new branch"
metrics:
  duration: "4 minutes"
  completed: "2026-04-16"
  tasks_completed: 2
  files_modified: 5
---

# Phase 19 Plan 01: Staging Directory Wiring Summary

One-liner: Platform-guarded Linux branches for minDiskSpace (true), partition-exists check (statAsync walk), and path examples (~/.local/share/Vortex) in texts.ts and Settings.tsx tooltip.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ONBRD-02a: flip minDiskSpace to return true on Linux | 8c721900b | todos.tsx, todos.test.ts |
| 2 | ONBRD-02b/02c: partition check + Linux path examples | 2f3ce8134 | stagingDirectory.ts, texts.ts, Settings.tsx |

## What Was Built

**Task 1 (ONBRD-02a):** In `todos.tsx`, the `minDiskSpace` condition function's non-win32 early return was flipped from `false` to `true`. This makes the `download-location` and `mod-location` todos always visible on Linux as informational items showing the raw path (already wired from Phase 18). The test was updated to match: description changed from "returns false" to "returns true", assertion updated from `toBe(false)` to `toBe(true)`. The `winapi.GetDiskFreeSpaceEx` not-called assertion remains unchanged — the function must not be called on Linux even though the result is now `true`.

**Task 2 (ONBRD-02b):** In `stagingDirectory.ts`, the bare `winapi.GetVolumePathName(instPath)` call was wrapped in `if (process.platform === "win32")`. A new exported async function `findAccessibleAncestor` was added that walks up the filesystem hierarchy via `fs.statAsync` calls until an accessible ancestor is found or the filesystem root is reached (detected via `path.dirname(x) === x`). The function is exported as a named export so the existing test stubs (from Wave 0 in 19-00) can import and test it directly. The `ensureStagingDirectoryImpl` else branch calls `await findAccessibleAncestor(instPath)` to set `partitionExists`.

**Task 2 (ONBRD-02c):** In `texts.ts`, both the `downloadspath` and `modspath` switch cases now wrap their `t()` argument in a `process.platform === "linux"` ternary. The Linux arms show `~/.local/share/Vortex/downloads` and `~/.local/share/Vortex/mods/{GAME}` path examples respectively; the Windows arms are byte-for-byte identical to the original source. In `Settings.tsx`, the staging-path-mode toggle tooltip uses the same ternary pattern: the Linux arm shows `~/.local/share/Vortex/<game>` and references "device" (not "drive"); the Windows arm is unchanged.

## Test Results

| Test File | Tests | Status |
|-----------|-------|--------|
| todos.test.ts | 9 | All pass |
| stagingDirectory.test.ts | 3 | All pass (Wave 0 stubs now green) |
| texts.test.ts | 4 | All pass (Wave 0 stubs now green) |
| **Total** | **16** | **All pass** |

## Decisions Made

- `findAccessibleAncestor` exported as a named export (not a module-internal closure) so the Wave 0 test stubs in `stagingDirectory.test.ts` can import and test it directly. This avoids the `lazyRequire` proxy issue noted in STATE.md Phase 19 decisions.
- Ternary placed INSIDE the `t()` call (not outside), per the D-09 pattern established in CONTEXT.md. Both arms pass through `t()` for i18n. Windows arms are verbatim copies of the original source strings.
- `findAccessibleAncestor` uses recursion (not a while loop) for the ancestor walk — matches the `idModPath` pattern in `discovery.ts` lines 841-852 and is idiomatic for the codebase.

## Deviations from Plan

None — plan executed exactly as written. The `findAccessibleAncestor` export location (before `writeStagingTag` rather than inline inside `ensureStagingDirectoryImpl`) was implied by the plan's test import requirement and is consistent with module design conventions.

## Known Stubs

None. All five modified files have their Linux branches fully wired. The `stagingDirectory.test.ts` Wave 0 stubs that were previously red (marked with RED TEST comments) are now green.

## Threat Flags

None. The `findAccessibleAncestor` recursive walk terminates at filesystem root via `path.dirname(x) === x` (T-19-01 mitigated as planned). No new network endpoints, auth paths, or trust boundary changes introduced.

## Self-Check

Files exist:
- src/renderer/src/extensions/firststeps_dashlet/todos.tsx — modified
- src/renderer/src/extensions/firststeps_dashlet/todos.test.ts — modified
- src/renderer/src/extensions/mod_management/stagingDirectory.ts — modified
- src/renderer/src/extensions/mod_management/texts.ts — modified
- src/renderer/src/extensions/mod_management/views/Settings.tsx — modified

Commits exist:
- 8c721900b — feat(19-01): ONBRD-02a flip minDiskSpace to return true on Linux
- 2f3ce8134 — feat(19-01): ONBRD-02b/02c partition check and Linux path examples

## Self-Check: PASSED
