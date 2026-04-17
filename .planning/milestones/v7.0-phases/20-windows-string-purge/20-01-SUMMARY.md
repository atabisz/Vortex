---
phase: 20-windows-string-purge
plan: 01
subsystem: ui
tags: [platform-guard, dialog, electron, ternary, i18n]

# Dependency graph
requires:
  - phase: 19-staging-directory-wiring
    provides: process.platform === "linux" ternary guard pattern used here
provides:
  - Platform-guarded raiseUACDialog message in fs.ts (Linux arm: pkexec copy)
  - Platform-guarded confirmElevate dialog text and button label in Settings.tsx
  - Static analysis tests for both ternaries in fs.test.ts
affects: [20-02, verifier]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-arm ternary for platform-conditional string: process.platform === 'linux' ? Linux arm : Windows arm"
    - "Static analysis test pattern: readFileSync + path.resolve(__dirname) to assert source contains expected strings"

key-files:
  created: []
  modified:
    - src/renderer/src/util/fs.ts
    - src/renderer/src/extensions/download_management/views/Settings.tsx
    - src/renderer/src/util/fs.test.ts

key-decisions:
  - "Static test approach: readFileSync(path.resolve(__dirname, './fs.ts')) preferred over import.meta.url (not file:// in happy-dom)"
  - "Both ternary arms of raiseUACDialog wrapped in t() for i18n consistency"
  - "confirmElevate text and button label: plain string (no t()), matching existing Windows arm pattern"

patterns-established:
  - "Static analysis test: assert source file contains expected string using readFileSync + path.resolve — avoids exporting private functions"
  - "import.meta.url is not file:// scheme in vitest happy-dom environment; use path.resolve(__dirname) instead"

requirements-completed:
  - ONBRD-03a
  - ONBRD-03b

# Metrics
duration: 5min
completed: 2026-04-16
---

# Phase 20 Plan 01: Windows String Purge — raiseUACDialog and confirmElevate Summary

**Platform-guarded raiseUACDialog (pkexec copy on Linux) and confirmElevate (elevated permissions copy + button label) with static analysis tests for both ternaries**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-16T12:35:50Z
- **Completed:** 2026-04-16T12:39:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `raiseUACDialog` in `fs.ts`: Linux arm shows "You will be asked for your password." instead of "Windows will show an UAC dialog." — both arms wrapped in `t()` for i18n
- `confirmElevate` in `Settings.tsx`: Linux arm shows "This directory is not writable. Vortex can create it with elevated permissions." instead of Windows account language
- `confirmElevate` button label: Linux arm "Create with elevated permissions" instead of "Create as Administrator"
- Windows arms preserved byte-for-byte unchanged in all three changes
- 5 static analysis tests added to `fs.test.ts`; all 27 tests pass GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Add platform-guard tests for raiseUACDialog and confirmElevate** - `00af1daf3` (test)
2. **Task 2: Add Linux arm ternaries to raiseUACDialog and confirmElevate** - `aaba63210` (feat)

## Files Created/Modified

- `src/renderer/src/util/fs.ts` - raiseUACDialog message field: two-arm ternary with Linux pkexec copy
- `src/renderer/src/extensions/download_management/views/Settings.tsx` - confirmElevate: two-arm ternaries on text field and button label
- `src/renderer/src/util/fs.test.ts` - Static analysis tests for both ternaries (5 new tests)

## Decisions Made

- **Static test approach:** `import.meta.url` is not a `file://` URL in happy-dom (Vitest renderer environment); fell back to `path.resolve(__dirname, ...)` which works correctly. Matches the plan's documented fallback option.
- **Both raiseUACDialog arms use `t()`:** The existing Windows arm uses `t()` for i18n — the Linux arm must match for translation pipeline consistency (per CONTEXT.md D-01 and RESEARCH.md Pattern 2).
- **confirmElevate text/button: no `t()` wrapping:** The existing Windows arm is a plain string literal (no `t()`); Linux arm matches this pattern (per RESEARCH.md Open Question 1 resolution).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] import.meta.url URL scheme incompatibility in happy-dom**
- **Found during:** Task 1 (RED test run)
- **Issue:** `new URL("./fs.ts", import.meta.url)` threw "The URL must be of scheme file" — Vitest happy-dom does not expose a `file://` `import.meta.url`
- **Fix:** Replaced all `new URL(..., import.meta.url)` calls with `path.resolve(__dirname, ...)` — the plan's documented fallback
- **Files modified:** `src/renderer/src/util/fs.test.ts`
- **Verification:** All 5 new tests pass, no URL errors
- **Committed in:** `00af1daf3` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: import.meta.url fallback applied)
**Impact on plan:** Fix necessary for tests to run; fallback was pre-documented in the plan. No scope creep.

## Issues Encountered

None beyond the import.meta.url fallback documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ONBRD-03a and ONBRD-03b satisfied
- ONBRD-03c and ONBRD-03d: pre-audited in RESEARCH.md as already clean (`nativeErrors.ts` line 13 guard, `symlink_activator_elevate` line 49 guard) — no code changes needed
- Phase 20 Plan 02 can proceed: covers any remaining Windows string sites if identified

---
*Phase: 20-windows-string-purge*
*Completed: 2026-04-16*

## Self-Check: PASSED

- FOUND: .planning/phases/20-windows-string-purge/20-01-SUMMARY.md
- FOUND: src/renderer/src/util/fs.ts
- FOUND: src/renderer/src/extensions/download_management/views/Settings.tsx
- FOUND: src/renderer/src/util/fs.test.ts
- FOUND: commit 00af1daf3 (task 1 — test)
- FOUND: commit aaba63210 (task 2 — feat)
