---
phase: 10-save-ui-validation-steamos-polkit
plan: "02"
subsystem: elevation
tags: [steamos, steam-deck, pkexec, sudo, polkit, electron-builder, deb]

# Dependency graph
requires:
  - phase: 09-native-addon-fix-elevation-foundation
    provides: pkexec elevation branch with injectable spawner seam in elevated.ts
provides:
  - isSteamOS() detection via /etc/os-release with caching
  - sudo -n fallback branch in runElevated() for SteamOS
  - UserCanceled with actionable Game Mode message on sudo -n failure
  - polkit action file io.nexusmods.vortex.policy in build/linux/
  - electron-builder linux.extraFiles routing policy to /usr/share/polkit-1/actions/
affects: [future-elevation-work, linux-packaging]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "/etc/os-release sync read + module-level cache for platform detection"
    - "sudo -n as pkexec fallback for polkit-agent-free environments"

key-files:
  created:
    - build/linux/io.nexusmods.vortex.policy
  modified:
    - src/renderer/src/util/elevated.ts
    - src/renderer/src/util/elevated.test.ts
    - src/main/electron-builder.config.cjs
    - .gitignore

key-decisions:
  - "SteamOS branch: spawn sudo -n before pkexec when isSteamOS() returns true — pkexec hangs without polkit agent in Game Mode"
  - "isSteamOS() cached in module-level _isSteamOS after first call — avoids repeated file reads"
  - "polkit action uses auth_admin (not auth_admin_keep) — prompt every time per D-10"
  - "build/linux/ gitignore exception added with !build/linux/ and !build/linux/** negation patterns + force-add"
  - "setupSyncMocks fixed to handle both (options, callback) and (callback) overloads of tmp.file — pre-existing bug"

patterns-established:
  - "isSteamOS cache reset helper _resetSteamOSCache() exported for tests; never call in production"
  - "SteamOS test suite: beforeEach mocks fs.readFileSync to return ID=steamos content; afterEach resets cache"

requirements-completed: [ELEV-02, ELEV-03]

# Metrics
duration: 5min
completed: 2026-04-01
---

# Phase 10 Plan 02: SteamOS Elevation + Polkit Action File Summary

**isSteamOS() detection with /etc/os-release caching, sudo -n fallback in runElevated(), and branded polkit action file packaged in .deb via electron-builder extraFiles**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-01T16:50:50Z
- **Completed:** 2026-04-01T16:55:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- isSteamOS() function reads /etc/os-release, checks ID=steamos and ID_LIKE=...steamos..., caches result; exported for tests with _resetSteamOSCache() reset helper
- runElevated() Linux block now branches: isSteamOS() → sudo -n fallback (UserCanceled with "Game Mode" message on failure); non-SteamOS → pkexec unchanged from Phase 9
- build/linux/io.nexusmods.vortex.policy created with io.nexusmods.vortex.run-elevated action and auth_admin for all three polkit contexts
- All 16 unit tests pass (5 isSteamOS + 3 SteamOS sudo-n + 1 non-SteamOS pkexec + 7 pkexec legacy)

## Task Commits

Each task was committed atomically:

1. **Task 1: isSteamOS() detection and sudo -n fallback** - `e002c3d5f` (feat)
2. **Task 2: Polkit action file and electron-builder wiring** - `f714f822d` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified
- `src/renderer/src/util/elevated.ts` - isSteamOS() function + _resetSteamOSCache() + SteamOS sudo -n branch in runElevated()
- `src/renderer/src/util/elevated.test.ts` - isSteamOS detection tests, SteamOS sudo-n tests, non-SteamOS pkexec test; fixed setupSyncMocks for (options, cb) overload
- `build/linux/io.nexusmods.vortex.policy` - PolicyKit 1.0 XML action file with io.nexusmods.vortex.run-elevated
- `src/main/electron-builder.config.cjs` - linux.extraFiles entry (already committed by plan 10-01 agent in parallel)
- `.gitignore` - !build/linux/ and !build/linux/** negation exceptions for the policy file asset

## Decisions Made
- isSteamOS() uses module-level `_isSteamOS: boolean | undefined` cache — sync readFileSync on cold path, then never reads again
- sudo -n failure path rejects with `new UserCanceled()` and sets `.message` to "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation." — callers already handle UserCanceled
- auth_admin (not auth_admin_keep) per D-10 — elevation prompts every time, appropriate for infrequent operation
- build/linux/ is gitignored by the top-level `build/` rule; added negation exceptions to make the source asset trackable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed setupSyncMocks to handle two-argument overload of tmp.file**
- **Found during:** Task 1 (adding SteamOS test cases)
- **Issue:** tmp.file is called as `tmp.file({ postfix: ".js" }, callback)` but setupSyncMocks mock was written for `tmp.file(callback)` — the callback argument was being received as options, causing `TypeError: cb is not a function` for all runElevated tests
- **Fix:** Updated mockImplementation to detect whether first arg is a function or an options object and extract the callback from the appropriate position
- **Files modified:** src/renderer/src/util/elevated.test.ts
- **Verification:** All 16 tests pass including the 7 pre-existing pkexec tests that were previously failing
- **Committed in:** e002c3d5f (Task 1 commit)

**2. [Rule 3 - Blocking] Added .gitignore negation exception for build/linux/**
- **Found during:** Task 2 (staging build/linux/io.nexusmods.vortex.policy)
- **Issue:** `build/` is in .gitignore; git add rejected the policy file
- **Fix:** Added `!build/linux/` and `!build/linux/**` negation patterns to .gitignore; used `git add -f` to force-add
- **Files modified:** .gitignore
- **Verification:** git add succeeded; file staged and committed
- **Committed in:** f714f822d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 pre-existing bug fix, 1 blocking issue)
**Impact on plan:** Both fixes necessary for correctness and task completion. No scope creep.

## Issues Encountered
- electron-builder.config.cjs extraFiles entry was already committed by the parallel plan 10-01 agent — no conflict, the working copy change was a no-op and git diff showed no diff vs HEAD for that file.

## Known Stubs
None — all plan outputs are fully wired.

## Next Phase Readiness
- ELEV-02 complete: SteamOS/Steam Deck users get actionable "Switch to Desktop Mode" message instead of hang
- ELEV-03 complete: .deb installs will deploy branded polkit dialog at /usr/share/polkit-1/actions/
- Remaining Phase 10 work: SAVE-02, SAVE-03, SAVE-04 (save game path resolution) — handled by plan 10-01

---
*Phase: 10-save-ui-validation-steamos-polkit*
*Completed: 2026-04-01*
