---
phase: 18-first-run-dashboard-foundation
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/renderer/src/extensions/firststeps_dashlet/todos.test.ts
  - src/renderer/src/extensions/firststeps_dashlet/todos.tsx
  - src/renderer/src/extensions/gamemode_management/util/getDriveList.test.ts
  - src/renderer/src/extensions/gamemode_management/util/getDriveList.ts
  - src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.test.tsx
  - src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx
  - src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts
  - src/renderer/src/extensions/gamemode_management/GameModeManager.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Phase 18 introduces three main additions: Linux platform guards in `todos.tsx` for winapi-dependent todo items, a `getDriveList.ts` rewrite with an injectable test seam and Linux fallback, and a Linux empty-state block in `NoGameDashlet.tsx` with a one-shot Steam detection retry in `GameModeManager.ts`.

The platform guards in `todos.tsx` and `getDriveList.ts` are well-structured — the `_setDrivelistLoader` / `_resetDrivelistLoader` injectable seam follows established project patterns, and test coverage is thorough. The new Linux empty-state UI block in `NoGameDashlet.tsx` is logically correct and well-tested.

Two pre-existing bugs are exposed by reading the changed files: an unguarded perpetual `setTimeout` loop in `NoGameDashlet` and a dropped promise chain in `postDiscovery`. Neither was introduced by this phase, but both are in files that were modified and are worth flagging for awareness. Three informational items cover minor code smells in unchanged logic.

---

## Warnings

### WR-01: Perpetual setTimeout loop in NoGameDashlet has no componentWillUnmount cleanup

**File:** `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx:119-131`
**Issue:** `refreshMore()` schedules itself with `setTimeout(this.refreshMore, 1000)` unconditionally. There is no `componentWillUnmount` lifecycle method to cancel the timer. After the component unmounts, the timer continues firing and `this.nextState.more = more` is called on an unmounted component, which produces React warnings and can interact with stale state. This is a pre-existing bug surfaced by the modified file.
**Fix:**
```typescript
private mRefreshTimer: ReturnType<typeof setTimeout> | undefined;

private refreshMore = () => {
  if (this.mRef === null || this.mInnerRef === null) {
    return;
  }
  const more =
    this.mInnerRef.getBoundingClientRect().width >
    this.mRef.getBoundingClientRect().width;
  if (more !== this.state.more) {
    this.nextState.more = more;
  }
  this.mRefreshTimer = setTimeout(this.refreshMore, 1000);
};

public componentWillUnmount() {
  if (this.mRefreshTimer !== undefined) {
    clearTimeout(this.mRefreshTimer);
  }
}
```

---

### WR-02: postDiscovery() drops its PromiseBB.map() result — errors silently swallowed

**File:** `src/renderer/src/extensions/gamemode_management/GameModeManager.ts:432-467`
**Issue:** `postDiscovery()` calls `PromiseBB.map(Object.keys(discovered), ...)` but does not `return` the resulting promise. The return type is effectively `void`. Callers in `startQuickDiscovery` (line 287) and `startSearchDiscovery` (line 413) call `this.postDiscovery()` without awaiting a result — which silently means any errors thrown inside the mapped callback beyond the inner `.catch()` on line 457 are unobservable. The Linux retry path at line 308 calls `this.postDiscovery()` in the same fire-and-forget manner. This is a pre-existing bug.
**Fix:**
```typescript
private postDiscovery(): PromiseBB<void> {
  const { discovered } = this.mStore.getState().settings.gameMode;
  this.mStore.dispatch(clearGameDisabled());
  return PromiseBB.map(Object.keys(discovered), (gameId) => {
    // ... rest unchanged
  }).then(() => undefined);
}
```
Callers in `startSearchDiscovery` that use `.finally(() => { ... return this.postDiscovery(); })` (line 412-416) already return the value from `.finally`, so adding `return` in `postDiscovery` would make that chain fully awaitable. Callers in `startQuickDiscovery` (line 287) would need `return this.postDiscovery()` to propagate.

---

## Info

### IN-01: Module-level freeSpace cache in todos.tsx is unbounded and never cleared

**File:** `src/renderer/src/extensions/firststeps_dashlet/todos.tsx:18`
**Issue:** The `freeSpace` object is a module-level singleton that caches disk-free results keyed by `"dlPath"` and `"instPath"`. It is replaced on path change but never evicted on application state reset, component unmount, or settings change. For a two-key cache this is harmless in practice, but if the path changes back and forth, stale data could briefly be served between writes. Additionally, the cache persists across test runs if the module is not re-imported.
**Fix:** Consider adding a cache TTL (e.g., 30 seconds) or clearing the cache entry on path change detection (already partially handled by the `freeSpace[key].path !== checkPath` check on line 30).

---

### IN-02: Error object mutation in download-location value handler

**File:** `src/renderer/src/extensions/firststeps_dashlet/todos.tsx:107`
**Issue:** `err["dlPath"] = props.dlPath;` mutates the caught error object by attaching a custom property before re-throwing. This is a mutable side effect on an external object. The intent is to enrich the error with context for the error reporter, which is a valid pattern — but the project convention in CLAUDE.md prefers `errorToReportableError()` for telemetry conversion. This is a minor style inconsistency in pre-existing code.
**Fix:** If this path is reached in production, consider wrapping the error before throwing:
```typescript
} catch (err) {
  const enriched = new Error(err.message);
  Object.assign(enriched, err, { dlPath: props.dlPath });
  throw enriched;
}
```

---

### IN-03: Linux one-shot retry in startQuickDiscovery has no concurrent-call guard

**File:** `src/renderer/src/extensions/gamemode_management/GameModeManager.ts:291-316`
**Issue:** The fire-and-forget `PromiseBB.delay(2000).then(...)` retry block (lines 299-314) has no guard against `startQuickDiscovery` being called a second time before the 2-second delay expires. If the user triggers a second discovery run (e.g., via the Refresh button), both the explicit call and the pending retry would be running concurrently, with each potentially calling `reloadStoreGames()` and `quickDiscovery()` simultaneously. The existing `mActiveSearch` guard only applies to `startSearchDiscovery`, not to quick discovery.
**Fix:** Store the retry timer reference and cancel it if `startQuickDiscovery` is called again, or check `process.platform === "linux"` only once and gate the retry on whether a new search has already been started:
```typescript
private mLinuxRetryTimer: ReturnType<typeof setTimeout> | undefined;

// In startQuickDiscovery, before scheduling retry:
if (this.mLinuxRetryTimer !== undefined) {
  clearTimeout(this.mLinuxRetryTimer);
}
this.mLinuxRetryTimer = undefined;

// Then use setTimeout wrapper around the PromiseBB.delay chain, or
// simply check this.mActiveSearch at the time the retry fires.
```

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
