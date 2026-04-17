# Phase 18: First-Run Dashboard Foundation — Research

**Researched:** 2026-04-16
**Domain:** Electron/React renderer — platform guards, Redux state, Steam detection retry
**Confidence:** HIGH

---

## Summary

Phase 18 is a surgical patching phase. Five targeted file edits fix crash paths and
UX gaps in the first-run dashboard for Linux. There are no new subsystems, no new
dependencies, and no architectural changes. The work is entirely additive: platform
guards, one fallback string replacement, one Redux prop addition, and one data-layer
one-shot retry.

The crash root cause is straightforward: `todos.tsx` calls `winapi.GetDiskFreeSpaceEx`
and `winapi.GetVolumePathName` unconditionally. Both are Windows-only; both throw on
Linux. The fix for `minDiskSpace()` is an early-return guard; the fix for the value
renderers is the same pattern. On Linux these todos stay hidden (condition returns
`false`), so the value function is never called — but the guard is required defensively
anyway.

The empty-state UX (ONBRD-01d) is the only net-new rendered surface. It lives entirely
in `NoGameDashlet.tsx` and requires adding one Redux prop (`discoveryRunning`) plus a
conditional JSX block as specified in the UI-SPEC.

**Primary recommendation:** Implement all five changes as a single atomic wave — each
change is tiny, they share no cross-file dependency, and shipping them together reduces
the risk of a partially-fixed state being committed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `minDiskSpace()` returns `false` unconditionally on Linux via platform guard
(`process.platform !== 'win32'`). The disk-space todos are hidden on Linux — Phase 19
adds the real `fs.statfs()` check.

**D-02:** `GetVolumePathName` calls in `download-location` and `mod-location` value
renderers are platform-guarded. On Linux, return the path itself (e.g.
`/home/user/mods`) as the display value instead of the Windows drive letter.

**D-03:** When `drivelist` fails or errors on Linux, return `['/']` as the hardcoded
fallback (not `['C:']`). Silent fallback — debug log only, no user notification.
Consistent with existing Windows silent fallback pattern.

**D-04:** The happy path (drivelist succeeds) already returns Linux mount points — no
change needed there.

**D-05:** Platform-guard the `manual-scan` todo condition on Linux only:
`process.platform === 'linux' ? true : props.searchPaths !== undefined`. Windows keeps
the existing `searchPaths` guard unchanged.

**D-06:** Manual-scan is always visible on Linux (never auto-hides) — Linux users need
it for re-scanning (Flatpak Steam, newly installed games).

**D-07:** Empty state guidance lives in `NoGameDashlet.tsx`. When `games.length === 0`
AND `discoveryRunning === false` AND `process.platform === 'linux'`, show: "No Steam
games detected" message + guidance text + Refresh button that emits `start-discovery`.

**D-08:** Refresh button is shown only after discovery has completed
(`discoveryRunning === false`). During active discovery, show nothing (or existing
spinner). This prevents user clicking Refresh while a scan is already running.

**D-09:** Auto-retry in `GameStoreHelper.ts` (or the Steam game store's `allGames()`
call site): after `allGames()` returns empty on Linux, wait ~2s and retry once. If
still empty, proceed normally (NoGameDashlet handles the empty display state).
One-shot only — no polling loop.

**D-10:** `NoGameDashlet.tsx` needs `discoveryRunning` from Redux state
(`state.session.discovery.running`) to gate the Refresh button display.

### Claude's Discretion

- The exact wording of the "No Steam games detected" guidance message — keep it
  concise and actionable.
- Whether the one-shot retry delay is exactly 2000ms or slightly different — any value
  in the 1500–3000ms range is fine.
- Whether to add a brief `log('debug', ...)` call at the auto-retry site.

### Deferred Ideas (OUT OF SCOPE)

- Full `fs.statfs()` disk-space check for the disk-space todos — Phase 19 (ONBRD-02a)
- Multi-drive getDriveList parsing from /proc/mounts for more accurate Linux drive
  enumeration — Phase 19 or later
- NoGameDashlet polling behavior (retry-on-button multiple times) — out of scope;
  one-shot is sufficient

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBRD-01a | `firststeps_dashlet` todo list renders without crashing on a fresh Linux install (fix `todos.tsx` undefined `instPath`/`dlPath` crash before `GetVolumePathName`) | D-01/D-02 guards confirmed; exact crash path verified in todos.tsx lines 29–37, 99–103, 128–133 |
| ONBRD-01b | `getDriveList.ts` returns Linux mount points on error fallback (not hardcoded `"C:"`) | D-03 fallback confirmed; two fallback sites in getDriveList.ts lines 22–23 and 45–47 |
| ONBRD-01c | `manual-scan` todo is visible unconditionally on Linux (not gated on `searchPaths !== undefined`) | D-05 condition confirmed; line 161 of todos.tsx is the exact guard to replace |
| ONBRD-01d | When no Steam games are detected after initial discovery, an actionable "Refresh" or guidance message is shown (not a blank screen) | D-07/D-08/D-10 confirmed; NoGameDashlet.tsx games array + discoveryRunning Redux state path verified |
| ONBRD-01e | Steam detection retries once with a short delay if initial `allGames()` result is empty on Linux (handles Steam still loading at Vortex launch) | D-09 confirmed; Steam.ts mCache pattern + reloadGames() method verified; GameStoreHelper.reloadGames() available |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Crash guard for `winapi` calls | Renderer (extension) | — | `todos.tsx` is a renderer extension; platform guard applied at function/value level |
| Drive list fallback | Renderer (utility) | — | `getDriveList.ts` is a renderer-side util; no IPC needed |
| Manual-scan condition | Renderer (extension) | — | Condition evaluated in renderer state; pure logic change |
| Empty-state UX | Renderer (React component) | Redux state | `NoGameDashlet.tsx` is a React component; reads from Redux `session.discovery.running` |
| Steam detection retry | Renderer (utility) | — | `GameStoreHelper.ts` is a renderer singleton; retry happens before cache is populated |

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-bootstrap | 0.33.0 | `<Button bsStyle="primary">` for Refresh button | Project standard, already in use everywhere |
| bluebird | 3.7.2 | Promise-based `delay()` for one-shot retry | Already used in `GameStoreHelper.ts` and `Steam.ts` |
| vitest | 4.1.0 | Unit tests for todos.tsx guards, getDriveList fallback, retry logic | Project standard test runner for renderer workspace |

No new packages are needed for this phase. [VERIFIED: codebase scan]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Bluebird.delay()` for retry | `setTimeout()` wrapped in a Promise | Bluebird is already imported in the files involved; `Bluebird.delay()` is cleaner and consistent |
| `process.platform === 'linux'` guard | Runtime feature detection | Feature detection is more resilient but overkill here — the winapi module is shimmed on Linux so process.platform is the correct signal |

---

## Architecture Patterns

### System Architecture Diagram

```
User opens Vortex on Linux (first run)
         │
         ▼
  firststeps_dashlet/index.ts
  registerDashlet() → condition check
         │
         ├─► todos() called with state
         │     │
         │     ├─► minDiskSpace() ─── [GUARD D-01] → returns false on Linux
         │     │                                       disk-space todos hidden
         │     │
         │     ├─► GetVolumePathName() ── [GUARD D-02] → returns path directly on Linux
         │     │
         │     └─► manual-scan condition ── [GUARD D-05] → always true on Linux
         │
         ▼
  getDriveList.ts (game search)
         │
         ├─► drivelist.list() happy path → returns Linux mount points (no change needed)
         └─► error / module load fail ── [FIX D-03] → returns ['/'] on Linux
                                                        was ['C:']
         │
         ▼
  Steam.ts allGames() → mCache (Bluebird promise)
         │
         ├─► parseManifests() reads steamapps/*.acf
         └─► returns [] if Steam still loading
                    │
                    └─► [RETRY D-09] in GameStoreHelper.ts
                        Bluebird.delay(2000).then(reloadGames())
                        one-shot only
         │
         ▼
  NoGameDashlet.tsx render()
         │
         ├─► games.length > 0 → show game thumbnails (existing)
         └─► games.length === 0 AND discoveryRunning === false AND linux
                    │
                    └─► [NEW D-07/D-08] Linux empty-state block
                        heading + body + Refresh <Button>
                        onClick → emits "start-discovery"
```

### Recommended Project Structure (files changed in this phase)

```
src/renderer/src/
├── extensions/
│   ├── firststeps_dashlet/
│   │   └── todos.tsx              # D-01, D-02, D-05
│   └── gamemode_management/
│       ├── util/
│       │   └── getDriveList.ts    # D-03
│       └── views/
│           └── NoGameDashlet.tsx  # D-07, D-08, D-10
└── util/
    └── GameStoreHelper.ts         # D-09
```

### Pattern 1: Platform Guard — Early Return

**What:** Insert `if (process.platform !== 'win32') return <safe_value>;` before any
Windows-API call.

**When to use:** Any function that calls winapi, Win32 APIs, or Windows-only system
calls. Always guard at the top of the function or inline before the problematic call.

**Example (from codebase):**
```typescript
// Source: src/renderer/src/util/elevated.ts (isSteamOS pattern)
// Pattern: early return with cached result
export function isSteamOS(): boolean {
  if (_isSteamOS !== undefined) {
    return _isSteamOS;
  }
  // ... platform-specific logic
}

// Applied to minDiskSpace (D-01):
function minDiskSpace(required: number, key: string) {
  return (props) => {
    if (process.platform !== 'win32') {
      return false;
    }
    const checkPath = props[key];
    if (checkPath === undefined) {
      return false;
    }
    // ... existing winapi call
  };
}
```

### Pattern 2: Platform Guard — Inline Value Branch

**What:** Inline `process.platform` check at the call site of a platform-specific value
function.

**When to use:** `value` functions in todo descriptors that call `winapi` to format a
display string.

**Example (applied to D-02 for `download-location`):**
```typescript
// Source: todos.tsx value renderer pattern
value: (t: TFunction, props: any) => {
  if (process.platform !== 'win32') {
    return props.dlPath ?? t('<No download folder>');
  }
  try {
    return winapi.GetVolumePathName(props.dlPath);
  } catch (err) {
    err["dlPath"] = props.dlPath;
    throw err;
  }
},
```

### Pattern 3: Redux Props Addition in ComponentEx

**What:** Add a new field to `IConnectedProps`, read it from `state` in
`mapStateToProps`.

**When to use:** When a component needs a new piece of Redux state.

**Example (applied to NoGameDashlet for D-10):**
```typescript
// Source: NoGameDashlet.tsx pattern (existing IConnectedProps extension)
interface IConnectedProps {
  knownGames: IGameStored[];
  discoveredGames: { [id: string]: IDiscoveryResult };
  discoveryRunning: boolean;   // ADD THIS
}

function mapStateToProps(state: IState): IConnectedProps {
  return {
    knownGames: state.session.gameMode.known,
    discoveredGames: state.settings.gameMode.discovered,
    discoveryRunning: state.session.discovery.running,  // ADD THIS
  };
}
```

### Pattern 4: Silent Fallback with Debug Log

**What:** In a catch block, return a safe fallback value and log at `debug` level only.
No user-facing notification.

**When to use:** Non-critical fallbacks where the user doesn't need to know — consistent
with `applyChattrCasefold` fallback pattern in this codebase.

**Example (applied to getDriveList D-03):**
```typescript
// Source: existing getDriveList.ts catch pattern
.catch((err) => {
  if (process.platform === 'linux') {
    log('debug', 'drivelist failed on Linux, using fallback', err);
    return ['/'];
  }
  api.showErrorNotification(/* ... */);
  return ['C:'];
});
```

Note: The `require('drivelist')` error notification at lines 13–22 also needs the
fallback change (return `['/']` on Linux instead of `['C:']`) — this is the
module-load-fail path, separate from the `.catch()` path at line 40–47.

### Pattern 5: One-Shot Retry with Bluebird.delay

**What:** After a Steam `allGames()` returns empty on Linux, delay and reload once.

**When to use:** D-09 — handles the Steam-still-loading race condition at Vortex
startup.

**Where:** The correct hook point is in `GameStoreHelper.reloadGames()` or at the
`allGames()` call site. Given the CONTEXT.md specifies `GameStoreHelper.ts` as the
location, the retry should be placed in `reloadGames()` or wrapped around the initial
discovery trigger.

**Critical caching detail:** `Steam.allGames()` populates `this.mCache` on first call
and returns the same promise on subsequent calls. To trigger a retry, `reloadGames()`
must be called — it resets `this.mCache` to a new `parseManifests()` call (line 218 of
Steam.ts). The retry delay must happen before `reloadGames()` is invoked, not after.

```typescript
// Pattern:
if (process.platform === 'linux') {
  Bluebird.delay(2000).then(() => instance.reloadGames(api));
}
```

### Anti-Patterns to Avoid

- **Editing existing `t("...")` literals in-place:** Breaks Windows wording and stales
  locale caches. Always add a NEW conditional branch with new `t("...")` literals for
  Linux strings.
- **Calling `reloadGames()` synchronously on startup:** Steam.ts mCache is populated
  asynchronously; the retry needs the delay to allow Steam daemon time to finish
  initializing.
- **Polling loop for retry:** D-09 specifies one-shot. A loop would keep hammering the
  filesystem unnecessarily.
- **Using `process.platform === 'win32'` as the guard in manual-scan condition:** The
  fix is `process.platform === 'linux' ? true : props.searchPaths !== undefined` — not
  negating the existing condition.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Promise delay | Custom setTimeout wrapper | `Bluebird.delay(ms)` | Already in scope; consistent with codebase |
| Redux connected component | Custom subscription | `connect()` from ComponentEx | Project standard; already wired in NoGameDashlet |
| Drive list retrieval | Custom `/proc/mounts` parser | `drivelist` (happy path already works) | CONTEXT.md: happy path already correct; deferred to Phase 19 |

---

## Common Pitfalls

### Pitfall 1: Two Fallback Sites in getDriveList.ts

**What goes wrong:** Fixing only the `.catch()` at line 40–47 but missing the
`require()` error path at lines 13–22 (the module-load-fail path). After the fix, only
the `.catch()` path returns `['/']`; the module-load path still returns `['C:']`.

**Why it happens:** There are two separate fallback returns in the same file for
different failure modes (module unavailable vs. module call throws).

**How to avoid:** Both fallback `return Promise.resolve(['C:'])` and
`return ['C:']` sites must be changed. Read the full file before patching.

**Warning signs:** On a system where `drivelist` binary is missing/corrupted, the
module-load path is hit instead of the `.catch()` path.

### Pitfall 2: Steam.allGames() Cache Never Resets

**What goes wrong:** Calling `allGames()` twice in sequence doesn't retry — the second
call returns the same cached `mCache` promise immediately.

**Why it happens:** `Steam.allGames()` at line 200–205 returns `this.mCache` on all
subsequent calls. The cache is only reset by `reloadGames()` (line 216–221).

**How to avoid:** The retry must call `reloadGames()` which resets `this.mCache`.
Calling `allGames()` a second time without first calling `reloadGames()` is a no-op.

**Warning signs:** Log shows "done reading steam libraries" exactly once during
startup, and the retry appears to succeed but returns the same empty result.

### Pitfall 3: Refresh Button Visible During Discovery

**What goes wrong:** Showing the Refresh button while `discoveryRunning === true`,
causing the user to click it and trigger a second concurrent discovery run.

**Why it happens:** Missing the `discoveryRunning` guard on the empty-state JSX block.

**How to avoid:** The entire Linux empty-state block (heading + body + button) must be
conditional on `discoveryRunning === false`. D-08 is explicit: the block only renders
when discovery has finished.

**Warning signs:** Two "start-discovery" events emitted in rapid succession in the
event log.

### Pitfall 4: minDiskSpace Guard Placement

**What goes wrong:** Placing the guard inside the inner closure but after the
`props[key]` access, so `undefined` guard passes but winapi call still runs.

**Why it happens:** The `minDiskSpace(required, key)` function returns a closure
`(props) => { ... }`. The guard must be at the top of this inner closure.

**How to avoid:** The `process.platform !== 'win32'` check must be the FIRST line of
the returned closure (before the `props[key]` check, which is already there).

**Warning signs:** The guard for `undefined` at line 23 passes but the winapi call at
line 31 still throws on Linux.

### Pitfall 5: `mod-location` value calls winapi even when instPath is undefined

**What goes wrong:** In `todos.tsx` `mod-location` value renderer, the existing code
(lines 128–133) already handles `instPath === undefined` with a safe return, but the
`GetVolumePathName` call at line 132 would still throw on Linux for defined paths.

**Why it happens:** The `undefined` guard is inside the try block before the winapi
call, but the try/catch just translates the error to `t("<Invalid Drive>")` — it
doesn't prevent the crash when winapi module itself is absent.

**How to avoid:** Add `if (process.platform !== 'win32') return props.instPath;` before
the winapi call, not inside the existing try/catch.

---

## Code Examples

### todos.tsx — minDiskSpace platform guard (D-01)

```typescript
// Source: CONTEXT.md D-01 + verified todos.tsx structure
function minDiskSpace(required: number, key: string) {
  return (props) => {
    if (process.platform !== 'win32') {
      return false;
    }
    const checkPath = props[key];
    if (checkPath === undefined) {
      return false;
    }
    if (freeSpace[key] === undefined || freeSpace[key].path !== checkPath) {
      try {
        freeSpace[key] = {
          path: checkPath,
          free: winapi.GetDiskFreeSpaceEx(checkPath).freeToCaller,
        };
      } catch (err) {
        return false;
      }
    }
    return freeSpace[key].free < required;
  };
}
```

### todos.tsx — manual-scan condition (D-05)

```typescript
// Source: CONTEXT.md D-05 + verified todos.tsx line 161
condition: (props) =>
  process.platform === 'linux' ? true : props.searchPaths !== undefined,
```

### getDriveList.ts — dual fallback fix (D-03)

```typescript
// Source: CONTEXT.md D-03 + verified getDriveList.ts structure
// Module-load fail path (was: return Promise.resolve(['C:']))
return Promise.resolve(process.platform === 'linux' ? ['/'] : ['C:']);

// .catch() path (was: return ['C:'])
.catch((err) => {
  if (process.platform === 'linux') {
    log('debug', 'drivelist failed on Linux, using root fallback', err);
    return ['/'];
  }
  api.showErrorNotification(/* ... */, err, { allowReport: false });
  return ['C:'];
});
```

### NoGameDashlet.tsx — empty state block (D-07/D-08/D-10)

```typescript
// Source: CONTEXT.md D-07/D-08/D-10 + 18-UI-SPEC.md + verified component structure
// In render(), after `const games = knownGames.filter(...)`:
const linuxEmptyState =
  process.platform === 'linux' &&
  games.length === 0 &&
  !discoveryRunning ? (
  <div className="no-game-linux-empty-state">
    <h4 className="empty-state-heading">{t('No Steam games detected')}</h4>
    <p className="empty-state-body">
      {t('Make sure Steam has finished loading, then click Refresh.')}
    </p>
    <Button bsStyle="primary" onClick={this.onRefresh}>
      {t('Refresh')}
    </Button>
  </div>
) : null;
```

### GameStoreHelper.ts — one-shot retry (D-09)

```typescript
// Source: CONTEXT.md D-09 + verified Steam.ts mCache + reloadGames() contract
// Placed at the discovery initiation call site, after initial allGames() returns empty:
if (process.platform === 'linux') {
  Bluebird.delay(2000).then(() => {
    log('debug', 'Steam detection retry after delay');
    return instance.reloadGames(api);
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `findLinuxSteamPath()` | `findAllLinuxSteamPaths()` added | Phase 06 | Multiple Steam library roots supported |
| `result.priority` guard removed | Steam entries on Linux never set priority | Phase 06 | allGames() results include all Linux games |
| getDriveList returns `['C:']` on all platforms | To be fixed in Phase 18 | Phase 18 | Linux game search uses valid mount points |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `showErrorNotification` call in `getDriveList.ts` module-load-fail path (lines 13–22) should be silenced on Linux (not just the return value changed) | getDriveList Pitfall 1 | Low: worst case a debug-level notification fires on Linux — still non-blocking |
| A2 | The one-shot retry placement is `GameStoreHelper.reloadGames()` called after the initial discovery cycle, not inside `Steam.ts` itself | Code Examples — retry | Medium: if retry fires too early (before discovery cycle reads games), it may silently no-op |

---

## Open Questions (RESOLVED)

1. **Where exactly is the retry trigger point in GameStoreHelper.ts?**
   - What we know: `reloadGames()` exists (line 348–377 of GameStoreHelper.ts),
     resets all store caches and emits a notification "Loading game stores..."
   - What's unclear: The CONTEXT.md says "after `allGames()` returns empty on Linux" —
     the discovery cycle trigger is in `gamemode_management/util/discovery.ts`, not
     `GameStoreHelper.ts`. The retry may need to be placed in the discovery flow, not
     the helper itself.
   - Recommendation: Planner should read `discovery.ts` and identify where
     `allGames()` is called during the initial scan, then place the retry call there
     or in the `firststeps_dashlet` index.ts after `start-discovery` event completes.
   - **RESOLVED:** Retry is placed in `GameModeManager.startQuickDiscovery()`, not
     `GameStoreHelper.ts` directly. The discovery cycle runs through
     `startQuickDiscovery()` which calls `this.reloadStoreGames()` (delegating to
     `GameStoreHelper.reloadGames()`). After `quickDiscovery()` returns with zero
     discovered games on Linux, the retry fires a delayed
     `reloadStoreGames() -> quickDiscovery()` sequence. This is the correct hook
     point because it has access to the discovered-games state and the full
     rediscovery pipeline.

2. **Should the `getDriveList` module-load-fail notification be suppressed on Linux?**
   - What we know: D-03 says "debug log only, no user notification" for the fallback.
   - What's unclear: The module-load path (lines 13–22) currently calls
     `api.showErrorNotification`. On Linux this would fire before the fallback return.
   - Recommendation: Wrap the entire module-load error block with
     `if (process.platform !== 'linux')` to suppress the notification on Linux, then
     add a `log('debug', ...)` and return `['/']`.
   - **RESOLVED:** Yes. Both getDriveList fallback sites (module-load-fail and
     .catch() path) are wrapped with platform guards per D-03. On Linux, the
     notification is suppressed entirely and replaced with a `log("debug", ...)`
     call before returning `["/"]`. Plan 18-01 Task 2 implements both sites.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 18 is entirely code and logic changes within existing files.
No external tools, CLIs, services, or runtimes beyond Node.js and pnpm (already
present) are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm run test --project src/renderer` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-01a | `minDiskSpace()` returns false on Linux | unit | `pnpm run test --project src/renderer -- todos` | ❌ Wave 0 |
| ONBRD-01a | `GetVolumePathName` value renderer returns path on Linux | unit | `pnpm run test --project src/renderer -- todos` | ❌ Wave 0 |
| ONBRD-01b | `getDriveList` returns `['/']` on Linux module-load-fail | unit | `pnpm run test --project src/renderer -- getDriveList` | ❌ Wave 0 |
| ONBRD-01b | `getDriveList` returns `['/']` on Linux `.catch()` path | unit | `pnpm run test --project src/renderer -- getDriveList` | ❌ Wave 0 |
| ONBRD-01c | `manual-scan` condition is always `true` on Linux | unit | `pnpm run test --project src/renderer -- todos` | ❌ Wave 0 |
| ONBRD-01d | `NoGameDashlet` renders empty-state block when `games=0, running=false, linux` | unit | `pnpm run test --project src/renderer -- NoGameDashlet` | ❌ Wave 0 |
| ONBRD-01d | `NoGameDashlet` does NOT render empty-state when `discoveryRunning=true` | unit | `pnpm run test --project src/renderer -- NoGameDashlet` | ❌ Wave 0 |
| ONBRD-01d | `NoGameDashlet` does NOT render empty-state on Windows | unit | `pnpm run test --project src/renderer -- NoGameDashlet` | ❌ Wave 0 |
| ONBRD-01e | One-shot retry calls `reloadGames()` after 2s on Linux when allGames empty | unit | `pnpm run test --project src/renderer -- GameModeManager` | ❌ Wave 0 |
| ONBRD-01e | One-shot retry does NOT fire on Windows | unit | `pnpm run test --project src/renderer -- GameModeManager` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm run test --project src/renderer`
- **Per wave merge:** `pnpm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` — covers ONBRD-01a, ONBRD-01c
- [ ] `src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts` — covers ONBRD-01b
- [ ] `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx` — covers ONBRD-01d
- [ ] `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` — covers ONBRD-01e

Existing test infrastructure (`vitest.config.mts`, `test-setup.ts`) covers all new
files — no framework setup needed.

---

## Security Domain

The changes in Phase 18 are platform guards, one fallback string replacement, a Redux
prop addition, and a data-layer retry. No new authentication, session management, access
control, cryptography, or network calls are introduced.

ASVS categories V2/V3/V4/V6 do not apply. V5 (input validation) does not apply — the
phase reads from Redux state and the filesystem; no external user input is processed.

No threat patterns are introduced.

---

## Sources

### Primary (HIGH confidence)

- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` — verified crash paths,
  existing condition structure, import of winapi-bindings
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` — verified
  both fallback sites (lines 22–23 and 45–47)
- `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` — verified
  component structure, IConnectedProps, mapStateToProps
- `src/renderer/src/util/GameStoreHelper.ts` — verified reloadGames() contract
- `src/renderer/src/util/Steam.ts` — verified mCache pattern, reloadGames() resets
  cache, allGames() returns cached promise
- `src/renderer/src/types/IState.ts` — verified `state.session.discovery.running:
  boolean` (IDiscoveryState line 388–391)
- `.planning/phases/18-first-run-dashboard-foundation/18-CONTEXT.md` — locked decisions
- `.planning/phases/18-first-run-dashboard-foundation/18-UI-SPEC.md` — copywriting
  contract, exact JSX layout, Button component spec

### Secondary (MEDIUM confidence)

- `src/renderer/src/util/elevated.ts` — platform guard and module-level cache pattern
  (isSteamOS()) used as reference for D-01/D-10 guard placement
- `src/renderer/src/extensions/firststeps_dashlet/reducers.test.ts` — confirms Vitest
  is the correct runner for firststeps_dashlet files
- `src/renderer/vitest.config.mts` — confirms `src/**/*.test.{ts,tsx}` glob, happy-dom
  environment, test-setup.ts

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; all libraries already in use
- Architecture: HIGH — all five change sites verified in source code
- Pitfalls: HIGH — each pitfall derived from reading actual code, not from general
  knowledge
- Test mapping: HIGH — vitest config verified; test file locations confirmed as missing

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable codebase; no fast-moving deps in scope)
