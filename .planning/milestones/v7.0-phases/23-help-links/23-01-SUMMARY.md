---
phase: 23-help-links
plan: 01
subsystem: ipc
tags: [ipc, electron, preload, shell, typescript, vitest]

# Dependency graph
requires: []
provides:
  - "shell:openUrlFailed MainChannels entry in ipc.ts"
  - "onOpenUrlFailed method on Shell preload interface"
  - "onOpenUrlFailed wired in preload bridge (index.ts)"
  - "betterIpcMain.send push in open.ts catch handler"
  - "Unit test covering success, failure, and destroyed-window cases"
affects:
  - 23-02

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BrowserWindow.getAllWindows() + isDestroyed() guard for safe main-to-renderer push"
    - "betterIpcMain.send typed push via MainChannels for compile-time channel validation"

key-files:
  created:
    - src/main/src/open.test.ts
  modified:
    - src/shared/src/types/ipc.ts
    - src/shared/src/types/preload.ts
    - src/preload/src/index.ts
    - src/main/src/open.ts

key-decisions:
  - "onOpenUrlFailed returns void (not unsubscribe fn): consistent with persist.onPush/onHydrate which also return void; listener is registered once for app lifetime"
  - "Push originates in open.ts catch handler (not a new IPC handler): failure is detected in main, pushed to renderer where Redux lives"
  - "shared package must be rebuilt (pnpm --filter @vortex/shared build) before preload/main tsc checks see new types"

patterns-established:
  - "main->renderer push pattern: BrowserWindow.getAllWindows() loop with isDestroyed() guard, mirrors mainPersistence.ts persist:push pattern"

requirements-completed:
  - ONBRD-06b

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 23 Plan 01: Help Links IPC Plumbing Summary

**Typed IPC channel `shell:openUrlFailed` wired from `open.ts` catch handler through preload bridge to renderer, with 3 Vitest tests covering push, no-push, and destroyed-window cases**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-17T10:20:25Z
- **Completed:** 2026-04-17T10:23:57Z
- **Tasks:** 2
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments
- Declared `"shell:openUrlFailed": (url: string) => void` in `MainChannels` (ipc.ts) and `onOpenUrlFailed(callback)` on `Shell` interface (preload.ts)
- Wired `onOpenUrlFailed` in preload bridge via `betterIpcRenderer.on("shell:openUrlFailed", ...)` — TypeScript validates the channel name at compile time
- Added `BrowserWindow.getAllWindows()` push loop in `open.ts` catch handler — fires after existing `log("error", ...)` call, skips destroyed windows
- All three TypeScript projects (shared, preload, main) compile without errors
- 3 Vitest tests pass: push on reject, no-push on resolve, skip destroyed windows

## Task Commits

Each task was committed atomically:

1. **Task 1: Declare shell:openUrlFailed IPC channel and preload type** - `ba3014a45` (feat)
2. **Task 2: Wire preload bridge, main-process push, and unit test** - `a7ddfbd3c` (feat)

## Files Created/Modified
- `src/shared/src/types/ipc.ts` - Added `"shell:openUrlFailed": (url: string) => void` to MainChannels
- `src/shared/src/types/preload.ts` - Added `onOpenUrlFailed(callback: (url: string) => void): void` to Shell interface
- `src/preload/src/index.ts` - Added `onOpenUrlFailed` entry in shell object using `betterIpcRenderer.on`
- `src/main/src/open.ts` - Added BrowserWindow push loop in catch handler; imported BrowserWindow and betterIpcMain
- `src/main/src/open.test.ts` (new) - 3 Vitest tests for openUrl failure, success, and destroyed-window cases

## Decisions Made
- `onOpenUrlFailed` returns `void` (not an unsubscribe function) — consistent with `persist.onPush` and `persist.onHydrate` which also return void; the listener is registered once in `context.once()` and lives for the application lifetime
- The shared package must be explicitly rebuilt (`pnpm --filter @vortex/shared build`) before preload/main `tsc --noEmit` checks see updated generated type declarations; source-level tsc on shared itself sees changes immediately

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Preload and main TypeScript checks initially showed type errors because the `@vortex/shared` dist declarations were stale. Fixed by running `pnpm --filter @vortex/shared build` before the final tsc checks. This is expected behavior for this monorepo — noted for future plan executors.

## Threat Model Coverage

Per T-23-03 (Tampering — mitigate): `betterIpcMain.send` is used (not raw `ipcMain.emit`), validated at compile time against `MainChannels`.

## Next Phase Readiness
- IPC channel fully wired end-to-end: main push → preload bridge → renderer callback
- Plan 02 can register a listener via `window.api.shell.onOpenUrlFailed(callback)` in the renderer and dispatch a Vortex notification with the failed URL

---
*Phase: 23-help-links*
*Completed: 2026-04-17*
