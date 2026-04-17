---
phase: 18-first-run-dashboard-foundation
fixed_at: 2026-04-16T00:00:00Z
review_path: .planning/phases/18-first-run-dashboard-foundation/18-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 18: Code Review Fix Report

**Fixed at:** 2026-04-16T00:00:00Z
**Source review:** .planning/phases/18-first-run-dashboard-foundation/18-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: Perpetual setTimeout loop in NoGameDashlet has no componentWillUnmount cleanup

**Files modified:** `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx`
**Commit:** 6a41d88ba
**Applied fix:** Added `private mRefreshTimer: ReturnType<typeof setTimeout> | undefined` field to the class, added `public componentWillUnmount()` lifecycle method that calls `clearTimeout(this.mRefreshTimer)`, and changed the unconditional `setTimeout(this.refreshMore, 1000)` call inside `refreshMore` to assign the return value to `this.mRefreshTimer` so the timer can be cancelled on unmount.

### WR-02: postDiscovery() drops its PromiseBB.map() result — errors silently swallowed

**Files modified:** `src/renderer/src/extensions/gamemode_management/GameModeManager.ts`
**Commit:** 3e2c49312
**Applied fix:** Added explicit `return` to the `PromiseBB.map(...)` call in `postDiscovery()`, added `.then(() => undefined)` at the end of the chain to satisfy the `PromiseBB<void>` return type (since `map` returns `PromiseBB<void[]>`), and updated the method signature from implicit `void` to `private postDiscovery(): PromiseBB<void>`. The `.finally()` caller in `startSearchDiscovery` already returned the result, so that chain is now fully awaitable. The fire-and-forget call in `startQuickDiscovery` still does not await, but the promise is now returned so future callers can observe errors.

---

_Fixed: 2026-04-16T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
