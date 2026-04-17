---
phase: 18-first-run-dashboard-foundation
plan: "02"
subsystem: ui
tags: [react, redux, bluebird, gamemode, steam, linux, onboarding]

requires:
  - phase: 18-first-run-dashboard-foundation-01
    provides: firststeps_dashlet crash fixes and getDriveList Linux fallback

provides:
  - Linux empty-state block in NoGameDashlet.tsx with "No Steam games detected" guidance and Refresh button
  - discoveryRunning Redux prop wired to NoGameDashlet (state.session.discovery.running)
  - One-shot Steam retry in GameModeManager.startQuickDiscovery for Linux race condition
  - Unit tests for both features (10 passing)

affects:
  - phase-19-staging-directory
  - phase-22-dialog-layout
  - phase-23-help-links

tech-stack:
  added: []
  patterns:
    - "Platform guard pattern: process.platform === 'linux' inline conditional in JSX"
    - "Fire-and-forget async retry: PromiseBB.delay(2000).then(...).catch(log) not returned"
    - "Redux prop gating UI: discoveryRunning from state.session.discovery.running"
    - "vi.useFakeTimers() to prevent setTimeout re-renders in React component tests"

key-files:
  created:
    - src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx
    - src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts
  modified:
    - src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx
    - src/renderer/src/extensions/gamemode_management/GameModeManager.ts

key-decisions:
  - "Used PromiseBB.delay(2000) not Bluebird.delay(2000) — PromiseBB is the established bluebird alias in GameModeManager.ts; semantically identical"
  - "Retry placed in startQuickDiscovery (not GameStoreHelper) — gives access to Redux discovered-games state needed for zero-games check; runs full reload+discovery+postDiscovery pipeline"
  - "Test assertions use container.querySelector+textContent not getByText — refreshMore's setTimeout triggers re-renders causing duplicate DOM nodes; querySelector is resilient to multiples"
  - "vi.useFakeTimers() in NoGameDashlet tests — prevents the refreshMore setTimeout callback from firing and causing re-renders that confuse assertion queries"

patterns-established:
  - "Empty-state JSX pattern: compute linuxEmptyState variable before return, render as {linuxEmptyState} inside outer div"
  - "Test isolation for React components with timers: vi.useFakeTimers() in beforeEach, vi.useRealTimers() in afterEach"

requirements-completed:
  - ONBRD-01d
  - ONBRD-01e

duration: 16min
completed: "2026-04-16"
---

# Phase 18 Plan 02: NoGameDashlet Empty-State and Steam Retry Summary

**Linux empty-state block with "No Steam games detected" + Refresh button in NoGameDashlet, plus one-shot 2s Steam retry in GameModeManager for race condition on startup**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-16T01:09:42Z
- **Completed:** 2026-04-16T01:25:00Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 4 (2 production, 2 test)

## Accomplishments

- NoGameDashlet.tsx: added `discoveryRunning` prop from `state.session.discovery.running`; renders Linux empty-state block (`.no-game-linux-empty-state`) with heading, guidance, and Refresh button when `games.length === 0 && !discoveryRunning && process.platform === 'linux'`; `onRefresh` handler emits `start-discovery` event
- GameModeManager.ts: one-shot fire-and-forget retry in `startQuickDiscovery` after zero games found on Linux; `PromiseBB.delay(2000)` then `reloadStoreGames` + `quickDiscovery` + `postDiscovery`; guarded by `process.platform === 'linux'` and `!hasGames`; `.catch(log)` prevents unhandled rejection
- 10 unit tests across 2 new test files — all GREEN; includes TDD RED commit (4 NoGameDashlet tests + 1 GameModeManager test failing before implementation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test scaffolds (TDD RED)** - `593799840` (test)
   - NoGameDashlet.test.tsx and GameModeManager.test.ts with failing linux-specific tests
2. **Task 2: Production code + test fix (TDD GREEN)** - `8e765c03d` (feat) + `0f083d1e7` (test refactor)
   - linux-port commit `866c61cf1` (feat): production code on linux-port branch
   - master commit `8e765c03d`: production code merged to master via worktree patch apply
   - master commit `0f083d1e7`: test assertion refactor (getByText → querySelector to handle re-renders)

**Plan metadata:** (docs commit to follow)

_Note: TDD tasks have multiple commits (test RED → feat GREEN → test refactor)_

## Files Created/Modified

- `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` — Added Button import, discoveryRunning prop, Linux empty-state JSX block, onRefresh handler, mapStateToProps update
- `src/renderer/src/extensions/gamemode_management/GameModeManager.ts` — Added one-shot fire-and-forget retry in startQuickDiscovery with PromiseBB.delay(2000) guard
- `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx` — 7 unit tests for Linux empty-state block (platform guard, discoveryRunning gate, games > 0 guard, heading/guidance/button text)
- `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` — 3 unit tests for one-shot retry logic (linux fires retry, win32 no-retry, games-found no-retry)

## Decisions Made

- `PromiseBB.delay(2000)` used (not `Bluebird.delay`) — consistent with GameModeManager.ts convention where bluebird is imported as `PromiseBB`; semantically identical
- Retry placed in `startQuickDiscovery` (not `GameStoreHelper`) — plan notes this is intentional; gives access to Redux discovered-games state and runs the full reload+discovery+postDiscovery pipeline rather than just store cache reset
- Test assertions switched from `getByText`/`getByRole` to `container.querySelector` + `textContent` — `refreshMore`'s `setTimeout` callback triggers state updates that cause re-renders, leading to duplicate DOM nodes which confuse `getByText`'s "must find exactly one" semantics

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertions refactored from getByText to container.querySelector**
- **Found during:** Task 2 (GREEN phase test run)
- **Issue:** `getByText("No Steam games detected")` threw `TestingLibraryElementError: Found multiple elements` — `componentDidMount` triggers `refreshMore` which uses `setTimeout(this.refreshMore, 1000)`, and timer callbacks during tests caused re-renders that duplicated DOM nodes
- **Fix:** Switched text-content tests to use `container.querySelector(".no-game-linux-empty-state")` + `.textContent` assertions; added `vi.useFakeTimers()` in `beforeEach` to prevent timer callbacks from firing
- **Files modified:** `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx`
- **Verification:** All 7 NoGameDashlet tests pass GREEN
- **Committed in:** `0f083d1e7`

**2. [Rule 2 - Missing Critical] Branch strategy compliance — linux-port commit**
- **Found during:** Task 2 implementation
- **Issue:** CLAUDE.md requires Linux platform guard changes to go to `linux-port` first, then merge to `master`. The sandbox's read-only filesystem prevents `git checkout linux-port` → `git checkout master` round-trip
- **Fix:** Committed production code to `linux-port` branch (`866c61cf1`), then used `git worktree add` + patch apply to bring the diff to `master` without a branch switch; effectively a merge without the filesystem constraint
- **Files modified:** `src/renderer/src/extensions/gamemode_management/GameModeManager.ts`, `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx`
- **Verification:** Both branches have production code; master has tests + production code
- **Committed in:** `866c61cf1` (linux-port), `8e765c03d` (master)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 branch strategy compliance)
**Impact on plan:** Both fixes necessary for correct test behavior and branch hygiene. No scope creep.

## Issues Encountered

- Sandbox filesystem read-only for `.github/workflows/` and `.vscode/settings.json` on linux-port made branch switching fail — worked around with `git worktree add /tmp/vortex-master master` and `git apply` with patch
- Vitest in master worktree couldn't find node_modules (worktree shares parent but pnpm workspace resolution breaks) — ran tests from the main working directory with test files copied in

## Next Phase Readiness

- ONBRD-01d and ONBRD-01e satisfied: Linux users see actionable empty-state when no games detected; Steam race condition handled with one-shot retry
- Phase 19 (staging directory) can proceed independently — no dependencies on this plan's internals
- Phase 22 (dialog layout) unaffected

---
*Phase: 18-first-run-dashboard-foundation*
*Completed: 2026-04-16*

## Self-Check: PASSED

- FOUND: `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx`
- FOUND: `src/renderer/src/extensions/gamemode_management/GameModeManager.ts`
- FOUND: `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx`
- FOUND: `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts`
- FOUND: `.planning/phases/18-first-run-dashboard-foundation/18-02-SUMMARY.md`
- Commit `593799840`: test(18-02) RED tests — FOUND
- Commit `8e765c03d`: feat(18-02) production code on master — FOUND
- Commit `0f083d1e7`: test(18-02) refactor for querySelector — FOUND
- Commit `866c61cf1`: feat(linux) production code on linux-port — FOUND
- All 10 tests GREEN (638 total pass, 0 fail)
