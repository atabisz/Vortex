---
phase: 16-chattr-f-filesystem-layer
plan: "01"
subsystem: fs-layer
tags: [chattr, casefold, ext4, linux, filesystem, testing]
dependency_graph:
  requires: []
  provides:
    - applyChattrCasefold function in src/renderer/src/util/fs.ts
    - _setChattr / _setChattrNotifier / _resetChattrState injectable seams
    - ext4CasefoldCache statfs result Map
    - _setChattrNotifier wired in renderer.tsx bootstrap
  affects:
    - src/renderer/src/util/fs.ts (ensureDirWritableAsync now calls applyChattrCasefold)
    - src/renderer/src/renderer.tsx (new import + bootstrap injection)
tech_stack:
  added: []
  patterns:
    - Injectable seam (_setChattr callback-style ExecFileFn, mirrors elevated.ts _setSpawner)
    - Module-level Map cache for statfs result per path (mirrors isSteamOS cache in elevated.ts)
    - Session-flag boolean for one-per-session notification dedup
    - TDD RED/GREEN cycle with vi.mock("node:fs/promises") factory for statfs/readdir/writeFile/access
key_files:
  created:
    - src/renderer/src/util/chattrCasefold.test.ts
  modified:
    - src/renderer/src/util/fs.ts
    - src/renderer/src/renderer.tsx
decisions:
  - "Use node:fs/promises import alias to avoid shadow from * as fs from fs-extra"
  - "ExecFileFn stays callback-style (not promisified) to match injectable seam contract"
  - "applyChattrCasefold exported as @internal for direct test access without wiring ensureDirWritableAsync"
  - "vi.mock node:fs/promises factory chosen over vi.spyOn to avoid getter non-configurable issue"
  - "_setChattrNotifier combined into existing setTFunction import line for single-import-per-module"
metrics:
  duration: "6 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  files_changed: 3
---

# Phase 16 Plan 01: applyChattrCasefold Implementation Summary

**One-liner:** chattr+F kernel casefold helper with injectable seams, statfs cache, and 13 Vitest tests covering all 7 CASE requirements wired into ensureDirWritableAsync.

## What Was Built

`applyChattrCasefold(dirPath)` is a new `async function` in `src/renderer/src/util/fs.ts` that applies kernel-level case-insensitivity (`chattr +F`) to freshly created, empty mod staging directories on ext4 filesystems. The function:

1. **Guards** against non-Linux platforms (D-04), Flatpak sandboxes (D-05), non-empty directories (D-03), and non-ext4 filesystems (D-06)
2. **Pre-flights** with `which chattr` before invoking `chattr +F dirPath` (D-09)
3. **Falls back silently** on any non-zero exit — EOPNOTSUPP is the common case (D-10)
4. **Verifies** casefold is active by writing an uppercase filename and reading it back lowercase (D-11)
5. **Notifies** the user once per session when ext4 is confirmed but casefold feature is absent (D-13/D-14)
6. **Never rejects** — all error paths call `resolve()` (D-02)

The function is wired into `ensureDirWritableAsync` as `.then(() => applyChattrCasefold(dirPath))` between `ensureDir` and the canary write (D-01).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for applyChattrCasefold | 7f427d2 | chattrCasefold.test.ts |
| 1 (GREEN) | Implement applyChattrCasefold with seams | d0287c8 | fs.ts |
| 2 | Wire _setChattrNotifier in renderer.tsx | 5020fa4 | renderer.tsx |

## Acceptance Criteria Verified

- fs.ts contains `async function applyChattrCasefold(dirPath: string): Promise<void>` — YES
- fs.ts contains `export function _setChattr(fn: ExecFileFn): void` — YES
- fs.ts contains `export function _setChattrNotifier(fn: NotifierFn | undefined): void` — YES
- fs.ts contains `export function _resetChattrState(): void` — YES
- fs.ts contains `const EXT4_MAGIC = 0xef53` — YES
- fs.ts contains `async function isExt4Filesystem(dirPath: string): Promise<boolean>` — YES
- fs.ts contains `async function verifyCasefold(dirPath: string): Promise<boolean>` — YES
- fs.ts contains `.then(() => applyChattrCasefold(dirPath))` inside `ensureDirWritableAsync` — YES
- fs.ts contains `import { execFile as execFileNative } from "child_process"` — YES
- fs.ts contains `import type { INotification } from "../types/INotification"` — YES
- fs.ts contains `const ext4CasefoldCache = new Map<string, boolean>()` — YES
- fs.ts contains `let hasShownCasefoldNotification = false` — YES
- chattrCasefold.test.ts exists and contains `describe("applyChattrCasefold"` — YES
- chattrCasefold.test.ts contains 13 `it(` test cases — YES
- `pnpm --filter renderer vitest run chattrCasefold.test.ts` exits 0 — YES (13/13 pass)
- `pnpm --filter renderer vitest run fs.test.ts` exits 0 — YES (22/22 pass)
- renderer.tsx contains `import { _setChattrNotifier, setTFunction } from "./util/fs"` — YES
- renderer.tsx contains `_setChattrNotifier((notification) =>` — YES
- renderer.tsx contains `CASE-11` comment near the injection — YES

## Test Results

```
Test Files  65 passed (65)
     Tests  641 passed | 9 skipped (650)
```

All 65 renderer test files pass. No regressions.

## Deviations from Plan

None — plan executed exactly as written.

The one minor implementation detail: `vi.mock("node:fs/promises", ...)` factory was used in the test file (rather than `vi.spyOn`) to mock `statfs`/`readdir`/`writeFile`/`access`. This is consistent with the PATTERNS.md guidance (preferred pattern for statfs mock) and avoids the "Cannot spy on getter" pitfall documented in RESEARCH.md Pitfall 4.

## Known Stubs

None. All code paths are wired to real implementations in production:
- `_chattr` defaults to `execFileNative` (child_process.execFile)
- `_chattrNotifier` is injected from renderer.tsx bootstrap — before injection, calls are no-ops via optional chaining

## Threat Flags

No new threat surface beyond what was analyzed in the plan's `<threat_model>`. All T-16-xx threats mitigated as planned:
- T-16-01: `execFile('chattr', ['+F', dirPath])` argument array form used — no shell interpolation
- T-16-04: `process.env.FLATPAK_ID` guard prevents any subprocess in Flatpak sandbox

## Self-Check: PASSED

Files created/modified:
- FOUND: src/renderer/src/util/chattrCasefold.test.ts
- FOUND: src/renderer/src/util/fs.ts (applyChattrCasefold present)
- FOUND: src/renderer/src/renderer.tsx (_setChattrNotifier injection present)

Commits:
- FOUND: 7f427d2 (test RED)
- FOUND: d0287c8 (feat GREEN)
- FOUND: 5020fa4 (feat renderer.tsx)
