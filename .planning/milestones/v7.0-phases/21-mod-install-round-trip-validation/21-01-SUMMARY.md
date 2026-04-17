---
phase: 21-mod-install-round-trip-validation
plan: 01
subsystem: testing
tags: [hardlink, deployment, isSupported, vitest, tdd, ENOENT]

requires:
  - phase: 19-mod-management-linux-compat
    provides: "stagingDirectory.test.ts mock patterns for vi.mock of winapi-bindings and @vortex/shared"

provides:
  - "ENOENT guard in hardlink_activator isSupported catch block — returns undefined (supported) on first-run"
  - "Vitest unit tests for isSupported ENOENT handling and non-ENOENT error preservation"
  - "Verification that symlink_activator isGamebryoGame blocklist includes skyrimse"

affects:
  - 21-mod-install-round-trip-validation
  - hardlink_activator
  - deploy-method auto-selection on first-run

tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN: failing test first, then surgical fix to make it pass"
    - "vi.mock hoisting pattern for heavy extension dependencies (winapi-bindings, bluebird, turbowalk, LinkingDeployment)"
    - "getDeploymentMethod() helper captures registered deployment method via mock context"

key-files:
  created:
    - src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts
  modified:
    - src/renderer/src/extensions/hardlink_activator/index.ts

key-decisions:
  - "ENOENT fix is cross-platform (no process.platform guard): ENOENT means staging dir missing on all platforms"
  - "getErrorCode already imported from @vortex/shared at line 3 — no new imports needed"
  - "Return undefined (supported) on ENOENT: device-comparison and canary test both require staging dir to exist; defer to deploy time"

patterns-established:
  - "symlink_activator blocklist test: use src.indexOf('private isGamebryoGame') to locate method definition, not call sites"
  - "Deployment method test isolation: mock LinkingDeployment base class to avoid native module cascade"

requirements-completed:
  - ONBRD-04

duration: 5min
completed: 2026-04-16
---

# Phase 21 Plan 01: Hardlink ENOENT First-Run Fix Summary

**`getErrorCode(err) === "ENOENT"` guard added to hardlink_activator isSupported catch block so hardlink is auto-selected on first game activation when the staging directory does not yet exist**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-16T20:21:53Z
- **Completed:** 2026-04-16T20:26:52Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Created `hardlink_activator.test.ts` with 3 Vitest tests covering the ENOENT first-run path, non-ENOENT error preservation, and symlink_activator Gamebryo blocklist
- Fixed the catch block in `hardlink_activator/index.ts` `isSupported`: ENOENT now returns `undefined` (supported) instead of the "not initialized" IUnavailableReason
- Full renderer test suite green (73 test files, 686 tests pass; pre-existing GameModeManager async-timing error confirmed unrelated)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Create hardlink_activator.test.ts with failing tests** - `d7079ed19` (test)
2. **Task 2: GREEN — Fix ENOENT catch block in hardlink_activator isSupported** - `86e2ff953` (fix)

_TDD plan: RED commit establishes failing test, GREEN commit makes all tests pass._

## Files Created/Modified

- `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` — 3 Vitest tests: ENOENT returns undefined, EACCES returns IUnavailableReason, symlink_activator blocklist includes skyrimse
- `src/renderer/src/extensions/hardlink_activator/index.ts` — ENOENT guard in isSupported catch block (6 lines added, no imports changed)

## Decisions Made

- **Cross-platform fix (no platform guard):** ENOENT in this context means "staging directory does not exist yet" on all platforms — no `process.platform === 'linux'` guard needed or appropriate.
- **Return undefined, not early success:** The fix defers device-comparison and canary test to deploy time when `ensureStagingDirectory()` has run — semantically correct per the D-01/D-05 design.
- **No new imports:** `getErrorCode` was already imported from `@vortex/shared` at line 3 of `index.ts`.

## Deviations from Plan

### Test 3 regex adjustment

**[Rule 1 - Bug] Fixed regex in symlink_activator blocklist test**
- **Found during:** Task 1 (RED — test run)
- **Issue:** Plan's regex `isGamebryoGame[\s\S]*?\{([\s\S]*?)\}` matched the first `{` at the call site in `isSupported`, not the private method definition body. Test failed with wrong content.
- **Fix:** Replaced regex with `src.indexOf("private isGamebryoGame")` to locate the method definition directly, then slice forward 600 chars into the body.
- **Files modified:** `hardlink_activator.test.ts`
- **Verification:** Test 3 passes, `"skyrimse"` found in the correct function body.
- **Committed in:** d7079ed19 (Task 1 commit, part of RED test)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in plan's regex)
**Impact on plan:** No scope change. The test intent is preserved; only the search approach was corrected.

## Issues Encountered

- Pre-existing error in `GameModeManager.test.ts` ("does NOT retry when games are found on linux") — async bluebird rejection after test completion. Confirmed pre-existing by stashing changes and re-running. Out of scope per deviation scope boundary rule.

## TDD Gate Compliance

- RED gate: `test(21-01)` commit `d7079ed19` — test 1 failed as required before fix
- GREEN gate: `fix(21-01)` commit `86e2ff953` — all 3 tests pass after fix

## Self-Check

Files exist:
- `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` — FOUND
- `src/renderer/src/extensions/hardlink_activator/index.ts` — FOUND (contains `getErrorCode(err) === "ENOENT"`)

Commits:
- `d7079ed19` test(21-01): add failing test for hardlink ENOENT in isSupported — FOUND
- `86e2ff953` fix(21-01): return supported on ENOENT in hardlink isSupported — FOUND

## Self-Check: PASSED

## Next Phase Readiness

- ONBRD-04 partial: hardlink deploy-method auto-selection no longer blocked on first-run by ENOENT
- Phase 21-02 (if it exists) can proceed with full deploy round-trip validation knowing isSupported is correct
- No blockers

---
*Phase: 21-mod-install-round-trip-validation*
*Completed: 2026-04-16*
