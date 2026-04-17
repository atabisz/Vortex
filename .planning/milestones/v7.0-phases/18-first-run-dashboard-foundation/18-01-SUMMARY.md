---
phase: 18-first-run-dashboard-foundation
plan: 01
subsystem: ui
tags: [linux, platform-guard, winapi, drivelist, vitest, firststeps_dashlet, todos]

requires:
  - phase: 02-winapi-bindings-shim
    provides: winapi-bindings shim — webpack/rolldown alias; 48-function shim for Linux

provides:
  - firststeps_dashlet todos render without crash on Linux (no winapi calls)
  - getDriveList returns ['/'] on Linux when drivelist fails (both error paths)
  - manual-scan todo always visible on Linux
  - injectable seam _setDrivelistLoader/_resetDrivelistLoader for testing

affects: [19-firststeps-steam-detection, 20-staging-directory-linux, 22-dialog-layout-steam-deck]

tech-stack:
  added: []
  patterns:
    - "Platform guard pattern: if (process.platform !== 'win32') return early in condition/value fns"
    - "Injectable seam pattern (_setDrivelistLoader) for modules using runtime require() — follows _setSpawner in elevated.ts"

key-files:
  created:
    - src/renderer/src/extensions/firststeps_dashlet/todos.test.ts
    - src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts
  modified:
    - src/renderer/src/extensions/firststeps_dashlet/todos.tsx
    - src/renderer/src/extensions/gamemode_management/util/getDriveList.ts

key-decisions:
  - "Injectable seam _setDrivelistLoader added to getDriveList.ts: Vitest vi.mock cannot intercept CJS require() inside function bodies; injectable seam follows _setSpawner pattern and is the correct testability fix"
  - "minDiskSpace guard placed as FIRST statement in inner closure: ensures no props[key] access before platform check"
  - "manual-scan condition uses ternary not if/else: consistent with single-expression condition pattern"
  - "log import added to getDriveList.ts: debug diagnostics for Linux fallback paths per threat register T-18-02"

patterns-established:
  - "TDD Red/Green with injectable seam: when production code uses runtime require(), add _setXxxLoader seam following elevated.ts pattern before writing tests"
  - "Platform guard placement: guard as first line in closure/value fn, before any Windows-specific API access"

requirements-completed: [ONBRD-01a, ONBRD-01b, ONBRD-01c]

duration: 9min
completed: 2026-04-16
---

# Phase 18 Plan 01: First-Run Dashboard Foundation Summary

**Platform guards in todos.tsx (4 sites) and getDriveList.ts (2 sites) prevent winapi/drivelist crashes on Linux first-run dashboard**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-16T00:57:18Z
- **Completed:** 2026-04-16T01:06:30Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments

- `todos.tsx` guarded at all 4 winapi call sites: `minDiskSpace` returns false on non-win32; `download-location` and `mod-location` value functions return raw paths on non-win32; `manual-scan` condition always returns true on Linux
- `getDriveList.ts` returns `['/']` with debug log on Linux in both the module-load-fail catch and the `.catch()` path; error notification suppressed on Linux
- 17 Vitest unit tests: 9 for todos platform guards, 8 for getDriveList fallback paths — all GREEN
- Injectable seam `_setDrivelistLoader`/`_resetDrivelistLoader` added, enabling reliable test isolation without CJS mock intercept issues

## Task Commits

1. **Task 1: Create test scaffolds (RED)** - `37b41357d` (test)
2. **Task 2: Add platform guards (GREEN)** - `5b30c6dc1` (feat)

## Files Created/Modified

- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` - 4 platform guard sites added (minDiskSpace, download-location value, mod-location value, manual-scan condition)
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` - 2 Linux fallback sites + log import + injectable seam exports
- `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` - 9 unit tests for todos platform guards
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts` - 8 unit tests for getDriveList fallback paths

## Decisions Made

- **Injectable seam for getDriveList testability:** `vi.mock("drivelist")` does NOT intercept CJS `require("drivelist")` calls inside function bodies — Vitest's mock system only intercepts ESM imports. Added `_setDrivelistLoader`/`_resetDrivelistLoader` following the `_setSpawner` pattern in `elevated.ts`. This is the correct solution: testable, minimal, consistent with codebase conventions.
- **log import in getDriveList.ts:** Debug-level logging added for both Linux fallback paths per threat model mitigation T-18-02 (DoS via drivelist module load failure).
- **minDiskSpace guard as first statement:** The guard must be before `props[key]` access — Windows path on a Linux machine would cause incorrect behavior, not just a crash risk.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added injectable seam to getDriveList.ts to make it testable**
- **Found during:** Task 1 (test scaffold creation)
- **Issue:** `getDriveList.ts` uses `require("drivelist")` inside a function body at runtime. Vitest's `vi.mock("drivelist")` only intercepts ES module imports, not CJS `require()` calls. The real drivelist module was being called in all tests, returning actual system drives (`/boot/efi`, `/boot`) and making all Linux-fallback tests impossible.
- **Fix:** Added `_setDrivelistLoader`/`_resetDrivelistLoader` injectable seam following `_setSpawner` pattern from `elevated.ts`. Tests use the seam; production code uses the default loader (original `require()` behavior unchanged).
- **Files modified:** `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts`
- **Verification:** All 8 getDriveList tests pass; production behavior unchanged (seam only activated in tests)
- **Committed in:** `37b41357d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - testability bug)
**Impact on plan:** Essential for test reliability. Production behavior is identical — the injectable seam is dormant unless activated by tests. No scope creep.

## Issues Encountered

- Vitest `vi.mock` CJS interception limitation: diagnosed via debug test showing mock was registered but `require()` in production code bypassed it entirely. Resolved by injectable seam pattern already established in codebase.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- First-run dashboard can render on Linux without crashing on winapi calls
- getDriveList returns a valid mount point on Linux regardless of drivelist availability
- manual-scan todo always visible on Linux
- Platform guard pattern and injectable seam pattern both established for Phase 18 continuation

## Threat Flags

No new threat surface introduced — all changes are defensive guards reducing existing attack surface (T-18-02 mitigated via Linux fallback in getDriveList catch paths).

## Self-Check

Files exist:
- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` — modified with 4 guards
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` — modified with 2 guards + log import + seam
- `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` — created
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts` — created

## Self-Check: PASSED

All files exist and all commits verified.

---
*Phase: 18-first-run-dashboard-foundation*
*Completed: 2026-04-16*
