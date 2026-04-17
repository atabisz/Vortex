---
phase: 18-first-run-dashboard-foundation
verified: 2026-04-16T02:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Launch Vortex on Linux with Steam not yet running; observe first-run dashboard renders without crash"
    expected: "Dashboard loads; todo list visible; no winapi crash; getDriveList returns ['/'] fallback"
    why_human: "Runtime crash detection requires actual Electron startup on Linux hardware"
  - test: "Launch Vortex on Linux with no Steam games detected; observe NoGameDashlet empty state"
    expected: "'.no-game-linux-empty-state' block visible with 'No Steam games detected' heading, guidance text, and Refresh button"
    why_human: "Requires Linux runtime with Steam installed but no games — can't verify DOM rendering without Electron on Linux"
  - test: "Click Refresh button in NoGameDashlet empty state; observe start-discovery event fires and discovery runs"
    expected: "Discovery progress indicator appears; game list refreshes after scan completes"
    why_human: "Event chain (Refresh -> start-discovery -> GameModeManager) requires full runtime"
  - test: "Launch Vortex on Linux when Steam is still loading; verify one-shot retry fires 2s after initial empty discovery"
    expected: "After first empty discovery, a second pass runs ~2s later; if Steam has finished loading, games appear"
    why_human: "Race condition timing requires real hardware with Steam startup delay"
---

# Phase 18: First-Run Dashboard Foundation — Verification Report

**Phase Goal:** The first-run dashboard renders without crashing and guides a fresh Linux user to their detected Steam games
**Verified:** 2026-04-16T02:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | firststeps_dashlet todo list renders without crashing on Linux (ONBRD-01a) | VERIFIED | `todos.tsx` guards `minDiskSpace`, `download-location` value, `mod-location` value at non-win32 check; 9/9 tests pass confirming no winapi calls on Linux |
| 2 | getDriveList returns `['/']` fallback on Linux (ONBRD-01b) | VERIFIED | Both module-load-fail catch (line 28-31) and `.catch()` path (line 60-63) in `getDriveList.ts` return `['/']` with debug log on Linux; error notification suppressed; 8/8 tests pass |
| 3 | manual-scan todo always visible on Linux (ONBRD-01c) | VERIFIED | `todos.tsx` line 171: `process.platform === "linux" ? true : props.searchPaths !== undefined`; 3/3 tests pass |
| 4 | Actionable guidance shown when no Steam games detected (ONBRD-01d) | VERIFIED | `NoGameDashlet.tsx` renders `.no-game-linux-empty-state` div with heading, guidance text, and Refresh button when `platform=linux && games.length===0 && !discoveryRunning`; `discoveryRunning` wired from Redux `state.session.discovery.running`; 7/7 tests pass |
| 5 | Steam detection retries once with delay on empty Linux result (ONBRD-01e) | VERIFIED | `GameModeManager.ts` lines 289-316: fire-and-forget `PromiseBB.delay(2000).then(reloadStoreGames).then(quickDiscovery).then(postDiscovery).catch(log)` guarded by `process.platform === "linux" && !hasGames`; 3/3 tests pass |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` | Platform guards at 4 winapi call sites | VERIFIED | minDiskSpace (line 22-24), download-location value (line 101-103), mod-location value (line 133-135), manual-scan condition (line 171) |
| `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` | Linux fallback in both error paths + injectable seam | VERIFIED | Module-load catch (28-31), .catch() path (60-63), `_setDrivelistLoader`/`_resetDrivelistLoader` exported at lines 11-17 |
| `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` | Linux empty-state block + discoveryRunning prop | VERIFIED | `linuxEmptyState` JSX (lines 58-73), `discoveryRunning` in IConnectedProps (line 20), `mapStateToProps` (line 158), `onRefresh` handler (line 115-117) |
| `src/renderer/src/extensions/gamemode_management/GameModeManager.ts` | One-shot retry in startQuickDiscovery | VERIFIED | `startQuickDiscovery` lines 289-316: platform guard, hasGames check, PromiseBB.delay(2000) fire-and-forget |
| `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | 9 unit tests for todos platform guards | VERIFIED | All 9 tests GREEN on latest run |
| `src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts` | 8 unit tests for getDriveList fallbacks | VERIFIED | All 8 tests GREEN on latest run |
| `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx` | 7 unit tests for Linux empty-state | VERIFIED | All 7 tests GREEN on latest run |
| `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` | 3 unit tests for retry logic | VERIFIED | All 3 tests GREEN on latest run |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `NoGameDashlet.tsx` | `state.session.discovery.running` | `mapStateToProps` | WIRED | Line 158: `discoveryRunning: state.session.discovery.running` typed `boolean` in `IConnectedProps` |
| `NoGameDashlet.onRefresh` | `start-discovery` event | `context.api.events.emit` | WIRED | Line 116: `this.context.api.events.emit("start-discovery")` |
| `GameModeManager.startQuickDiscovery` | `reloadStoreGames + quickDiscovery + postDiscovery` retry | `PromiseBB.delay(2000).then(...)` | WIRED | Lines 299-314: full pipeline called in retry chain |
| `getDriveList.ts` test | `_setDrivelistLoader` seam | `import { _setDrivelistLoader }` | WIRED | `getDriveList.test.ts` line 3: `import getDriveList, { _resetDrivelistLoader, _setDrivelistLoader }` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `NoGameDashlet.tsx` | `games` (filtered knownGames) | `state.session.gameMode.known` + `state.settings.gameMode.discovered` via `mapStateToProps` | Yes — real Redux state | FLOWING |
| `NoGameDashlet.tsx` | `discoveryRunning` | `state.session.discovery.running` via `mapStateToProps` | Yes — real Redux state | FLOWING |
| `todos.tsx` | `dlPath`, `instPath` | `selectors.downloadPath(state)`, `selectors.installPath(state)` via `props` | Yes — real selector calls | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 27 phase-18 unit tests pass | `pnpm vitest run --reporter=verbose` (renderer project) | 27/27 PASS; 1 unhandled rejection (test mock isolation, not assertion failure) | PASS |
| `_setDrivelistLoader` injectable seam exports | Module import check | `_setDrivelistLoader` and `_resetDrivelistLoader` exported in `getDriveList.ts` lines 11-17 | PASS |
| `linuxEmptyState` JSX conditionally null | Code review | Returns `null` on non-Linux or when `games.length > 0` or `discoveryRunning === true` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ONBRD-01a | Plan 01 (18-01-SUMMARY) | firststeps_dashlet renders without crash on Linux | SATISFIED | 4 platform guards in todos.tsx; 9 tests GREEN |
| ONBRD-01b | Plan 01 (18-01-SUMMARY) | getDriveList returns Linux mount points on error | SATISFIED | 2 fallback sites in getDriveList.ts; 8 tests GREEN |
| ONBRD-01c | Plan 01 (18-01-SUMMARY) | manual-scan todo visible unconditionally on Linux | SATISFIED | Ternary guard in todos.tsx line 171; 3 tests GREEN |
| ONBRD-01d | Plan 02 (18-02-SUMMARY) | Actionable guidance shown when no Steam games detected | SATISFIED | NoGameDashlet.tsx empty-state block; 7 tests GREEN |
| ONBRD-01e | Plan 02 (18-02-SUMMARY) | Steam detection retries once with 2s delay on empty result | SATISFIED | GameModeManager.ts startQuickDiscovery lines 289-316; 3 tests GREEN |

**Note:** REQUIREMENTS.md traceability table still marks ONBRD-01d and ONBRD-01e as "Pending" (checkboxes `[ ]` and status column "Pending"). Implementation and tests are complete — this is a documentation update gap. REQUIREMENTS.md should be updated to mark these as complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `NoGameDashlet.tsx` | 2 | `import { IDiscoveryState }` — unused import, missing `type` keyword | Warning | ESLint `@typescript-eslint/consistent-type-imports` is configured as "error"; `IDiscoveryState` is imported but not used as a type annotation anywhere in the file. Lint may flag this. Does NOT affect runtime behavior. |
| `GameModeManager.test.ts` | (runtime) | Unhandled rejection from `postDiscovery` → `getNormalizeFunc` in "does NOT retry when games are found on linux" test | Info | The test mock does not stub `getNormalizeFunc` for the `postDiscovery` flow when a game path is present. All 3 test assertions pass — the rejection is a test isolation gap, not a production code bug. |

### Human Verification Required

#### 1. First-Run Dashboard — No Crash on Linux

**Test:** Install Vortex on a fresh Linux machine (or DevContainer with Steam absent). Launch with `pnpm run start`. Navigate to the dashboard.
**Expected:** Dashboard renders; firststeps todo list appears; no crash from winapi (GetDiskFreeSpaceEx / GetVolumePathName); getDriveList logs debug message and returns ['/'].
**Why human:** Electron startup and actual winapi-bindings shim behavior requires a running Electron process on Linux hardware.

#### 2. NoGameDashlet Empty State Visible

**Test:** On Linux with Steam installed but no discovered games (or with discovery completed), observe the NoGameDashlet.
**Expected:** The `.no-game-linux-empty-state` block appears with "No Steam games detected" heading, guidance message "Make sure Steam has finished loading, then click Refresh.", and a Refresh button. The block does NOT appear during active discovery.
**Why human:** Requires Linux Electron runtime; component rendering in a real Redux store with actual `state.session.discovery.running` state transitions.

#### 3. Refresh Button Triggers Re-Discovery

**Test:** Click the Refresh button in the NoGameDashlet empty state on Linux.
**Expected:** `start-discovery` event fires; discovery progress appears; after scan completes, if Steam games are present they appear in the game list.
**Why human:** Full event chain (UI click → api.events.emit → GameModeManager → Redux state update → UI re-render) requires Electron on Linux.

#### 4. Steam Startup Race Condition Retry

**Test:** Launch Vortex on Linux when Steam daemon is still starting (before its library is loaded). Observe behavior 2-4 seconds after launch.
**Expected:** After initial empty discovery, a second discovery pass fires ~2s later. If Steam finishes loading during that window, games appear without user action.
**Why human:** Race condition timing requires real hardware and Steam startup behavior; not reproducible in unit tests.

### Gaps Summary

No functional gaps found. All 5 ONBRD requirements are implemented and unit-tested.

Two non-blocking issues noted:
1. **REQUIREMENTS.md documentation gap**: Traceability table not updated for ONBRD-01d and ONBRD-01e. Should be updated to mark as "Complete" before milestone close.
2. **Unused import lint warning**: `NoGameDashlet.tsx` line 2 imports `IDiscoveryState` without `type` keyword; unused. Should be removed to pass ESLint's `consistent-type-imports` rule.

Human verification is required for runtime behavior on Linux — all automated checks pass.

---

_Verified: 2026-04-16T02:00:00Z_
_Verifier: Claude (gsd-verifier)_
