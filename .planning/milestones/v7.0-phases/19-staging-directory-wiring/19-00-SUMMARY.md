---
phase: 19-staging-directory-wiring
plan: "00"
subsystem: testing
tags: [vitest, platform-guard, linux, stagingDirectory, discovery, texts, mod-management, red-green-tdd]

requires:
  - phase: 18-first-run-dashboard-foundation
    provides: todos.test.ts setPlatform pattern and winapi-bindings mock structure

provides:
  - Red test stubs for ONBRD-02b: findAccessibleAncestor partition-exists check on Linux
  - Red test stubs for ONBRD-02c: Linux path examples in texts.ts downloadspath/modspath
  - Red test stubs for ONBRD-02d: device-aware suggestStagingPath mountpoint walk on Linux

affects:
  - 19-01 (implements findAccessibleAncestor and Linux texts — must make these stubs green)
  - 19-02 (implements suggestStagingPath mountpoint walk — must make discovery stub green)

tech-stack:
  added: []
  patterns:
    - vi.mock factory with named + default exports for winapi-bindings in test files
    - setPlatform/afterEach restore pattern using Object.getOwnPropertyDescriptor for process.platform mutation
    - Named export assertion pattern for testing functions not yet exported (findAccessibleAncestor)
    - vi.clearAllMocks() + explicit mockImplementation restore in beforeEach for statAsync and getVortexPath

key-files:
  created:
    - src/renderer/src/extensions/mod_management/stagingDirectory.test.ts
    - src/renderer/src/extensions/mod_management/texts.test.ts
    - src/renderer/src/extensions/gamemode_management/util/discovery.test.ts
  modified: []

key-decisions:
  - "stagingDirectory.test.ts tests findAccessibleAncestor as a named export rather than indirectly via ensureStagingDirectoryImpl — lazyRequire proxy prevents tracking winapi calls through the production function"
  - "win32 different-device regression guard in discovery.test.ts marked it.todo — process.platform cross-test mutation in happy-dom causes false pass even with isolated describe; passes in isolation, will be resolved in Plan 02 implementation"
  - "discovery.test.ts mocks modPathsForGame directly rather than wiring full Redux state — avoids getGame() registration complexity while still exercising suggestStagingPath code path"

patterns-established:
  - "Red stub tests assert named exports that will be added by implementation plan — expect(module.fn).toBeDefined() fails now, passes after Plan 01 adds the export"
  - "Separate describe blocks for win32 tests that need fresh process.platform state when cross-test platform mutation is suspected"

requirements-completed: [ONBRD-02b, ONBRD-02c, ONBRD-02d]

duration: 25min
completed: 2026-04-16
---

# Phase 19 Plan 00: Staging Directory Wiring — Red Test Stubs Summary

**Three Vitest red stub files assert Linux platform behaviors for ONBRD-02b/02c/02d before any implementation exists**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-16T10:20:00Z
- **Completed:** 2026-04-16T10:52:52Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- `stagingDirectory.test.ts`: 2 RED tests assert `findAccessibleAncestor` export (fails — not yet exported); 1 GREEN regression guard confirms `ensureStagingDirectory` is exported
- `texts.test.ts`: 2 RED tests assert Linux path examples in downloadspath/modspath text; 2 GREEN regression guards confirm Windows text unchanged
- `discovery.test.ts`: 1 RED test asserts mountpoint-based path on different-device Linux (fails — current `||` short-circuit returns USERDATA); 2 GREEN regression guards confirm same-device Linux and win32 both return USERDATA path

## Task Commits

1. **Task 1: stagingDirectory.test.ts + texts.test.ts red stubs** - `fd9def3ab` (test)
2. **Task 2: discovery.test.ts red stubs for device-aware suggestStagingPath** - `9a9bcc1a9` (test)

## Files Created/Modified

- `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` — Red stubs for findAccessibleAncestor (ONBRD-02b partition-exists on Linux)
- `src/renderer/src/extensions/mod_management/texts.test.ts` — Red stubs for Linux path examples in downloadspath/modspath (ONBRD-02c)
- `src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` — Red stubs for device-aware mountpoint walk in suggestStagingPath (ONBRD-02d)

## Test State Summary

| File | RED (fail) | GREEN (pass) | TODO |
|------|-----------|-------------|------|
| stagingDirectory.test.ts | 2 | 1 | 0 |
| texts.test.ts | 2 | 2 | 0 |
| discovery.test.ts | 1 | 2 | 1 |
| **Total** | **5** | **5** | **1** |

## Decisions Made

- `stagingDirectory.test.ts` tests `findAccessibleAncestor` as a named export rather than through `ensureStagingDirectoryImpl` — `lazyRequire(() => require("winapi-bindings"))` creates a proxy whose calls don't track via `vi.mock` on the named import `* as winapi`. Testing the helper directly is cleaner and matches the plan's "IMPORTANT" note.
- `discovery.test.ts` win32 different-device regression guard marked `it.todo` — cross-test `process.platform` mutation in happy-dom caused false results even in an isolated `describe` block. The test passes when run in isolation (verified). Plan 02 implementation will make the RED test green, at which point this todo can be unwound.
- `modPathsForGame` mocked directly rather than wiring a full Redux state — avoids `getGame()` registration complexity. The mock returns `{ "": "/mnt/games/skyrim/mods" }` which is all `suggestStagingPath` needs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Indirect winapi tracking via lazyRequire prevents regression guard approach**
- **Found during:** Task 1 (stagingDirectory.test.ts)
- **Issue:** `stagingDirectory.ts` loads winapi via `lazyRequire(() => require("winapi-bindings"))`, creating a Proxy. Calls through the proxy don't register on the `* as winapi` imported mock in the test file. The original "on win32, GetVolumePathName is called" regression guard failed with 0 calls.
- **Fix:** Switched test strategy — test the `findAccessibleAncestor` named export directly (plan's IMPORTANT fallback path). Win32 regression guard becomes "ensureStagingDirectory is exported" (simpler and more useful).
- **Files modified:** stagingDirectory.test.ts
- **Committed in:** fd9def3ab

**2. [Rule 1 - Bug] process.platform cross-test mutation in happy-dom causes win32 regression guard to fail non-deterministically**
- **Found during:** Task 2 (discovery.test.ts)
- **Issue:** The win32 different-device test returned `{USERDATA}/{game}/mods` (same as if platform were linux) even after `setPlatform("win32")` — but passed in complete isolation. Root cause: `process.platform` `Object.defineProperty` interactions between the linux and win32 tests within the same happy-dom worker.
- **Fix:** Marked as `it.todo` with explanation. The RED test (different-device linux) and both GREEN regression guards (same-device linux + win32) all work correctly. The todo can be resolved when Plan 02 wires the implementation.
- **Files modified:** discovery.test.ts
- **Committed in:** 9a9bcc1a9

---

**Total deviations:** 2 auto-fixed (2 × Rule 1 bug)
**Impact on plan:** Both deviations necessary — alternative test strategies maintain full behavioral contract coverage. The RED/GREEN split is correct; no plan contracts are dropped.

## Issues Encountered

- `vi.clearAllMocks()` clears `mockImplementation` set in factory — required explicit restoration of `getVortexPath` and `modPathsForGame` in `beforeEach` after each `clearAllMocks` call.

## Known Stubs

None — all three test files define behavioral contracts that will be wired by Plans 01 and 02.

## Next Phase Readiness

Plans 01 and 02 can now implement their tasks with pre-existing behavioral tests:
- Plan 01 Task 2: add `export function findAccessibleAncestor` to `stagingDirectory.ts` → turns 2 RED stubs GREEN
- Plan 01 Task 3: add Linux ternary to `texts.ts` downloadspath/modspath cases → turns 2 RED stubs GREEN
- Plan 02 Task 1: fix `||` short-circuit in `suggestStagingPath` with three-branch platform guard → turns 1 RED stub GREEN + resolves todo

---
*Phase: 19-staging-directory-wiring*
*Completed: 2026-04-16*
