# Phase 18: First-Run Dashboard Foundation - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix `firststeps_dashlet` crash paths and Steam detection gaps so the first-run dashboard renders without crashing on a fresh Linux install. No new UI components beyond what's needed to show empty-state guidance in `NoGameDashlet.tsx`. The disk-space todos (mod-location, download-location) remain hidden on Linux — Phase 19 wires their Linux-native disk-space checks.

**In scope:** ONBRD-01a, ONBRD-01b, ONBRD-01c, ONBRD-01d, ONBRD-01e
**Out of scope (Phase 19):** Linux statfs() disk-space checks, staging directory wiring

</domain>

<decisions>
## Implementation Decisions

### Crash Boundary (ONBRD-01a)

- **D-01:** `minDiskSpace()` returns `false` unconditionally on Linux via platform guard (`process.platform !== 'win32'`). The disk-space todos are hidden on Linux — Phase 19 adds the real `fs.statfs()` check.
- **D-02:** `GetVolumePathName` calls in `download-location` and `mod-location` value renderers are platform-guarded. On Linux, return the path itself (e.g. `/home/user/mods`) as the display value instead of the Windows drive letter.

### getDriveList Fallback (ONBRD-01b)

- **D-03:** When `drivelist` fails or errors on Linux, return `['/']` as the hardcoded fallback (not `['C:']`). Silent fallback — debug log only, no user notification. Consistent with existing Windows silent fallback pattern.
- **D-04:** The happy path (drivelist succeeds) already returns Linux mount points — no change needed there.

### Manual-Scan Visibility (ONBRD-01c)

- **D-05:** Platform-guard the `manual-scan` todo condition on Linux only: `process.platform === 'linux' ? true : props.searchPaths !== undefined`. Windows keeps the existing `searchPaths` guard unchanged.
- **D-06:** Manual-scan is always visible on Linux (never auto-hides) — Linux users need it for re-scanning (Flatpak Steam, newly installed games).

### Empty State + Retry UX (ONBRD-01d + ONBRD-01e)

- **D-07:** Empty state guidance lives in `NoGameDashlet.tsx`. When `games.length === 0` AND `discoveryRunning === false` AND `process.platform === 'linux'`, show: "No Steam games detected" message + guidance text + Refresh button that emits `start-discovery`.
- **D-08:** Refresh button is shown **only after discovery has completed** (`discoveryRunning === false`). During active discovery, show nothing (or existing spinner). This prevents user clicking Refresh while a scan is already running.
- **D-09:** Auto-retry in `GameStoreHelper.ts` (or the Steam game store's `allGames()` call site): after `allGames()` returns empty on Linux, wait ~2s and retry once. If still empty, proceed normally (NoGameDashlet handles the empty display state). One-shot only — no polling loop.
- **D-10:** `NoGameDashlet.tsx` needs `discoveryRunning` from Redux state (`state.session.discovery.running`) to gate the Refresh button display.

### Claude's Discretion

- The exact wording of the "No Steam games detected" guidance message (e.g. "Make sure Steam has finished loading, then click Refresh") — keep it concise and actionable.
- Whether the one-shot retry delay is exactly 2000ms or slightly different — any value in the 1500–3000ms range is fine.
- Whether to add a brief `log('debug', ...)` call at the auto-retry site.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §First-Run Dashboard (ONBRD-01) — all five sub-requirements for this phase

### Key Source Files
- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` — minDiskSpace(), GetVolumePathName calls, manual-scan condition
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` — error fallback returning 'C:'
- `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` — empty state component where Refresh button and guidance text go
- `src/renderer/src/util/GameStoreHelper.ts` — allGames() call site for the one-shot retry

### Patterns to Follow
- `src/renderer/src/util/fs.ts` — injectable seam pattern (`_setChattr`, `_setChattr*`) for testability
- `src/renderer/src/util/elevated.ts` — isSteamOS() module-level cache and platform guard pattern

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NoGameDashlet.tsx`: Already has `ComponentEx`, `connect`, `translate` wiring — add `discoveryRunning` to `IConnectedProps` and `mapStateToProps`
- `firststeps_dashlet/todos.tsx`: Platform guard slot exists implicitly — `process.platform` checks already used elsewhere in codebase
- `state.session.discovery.running`: Already available in Redux state (used in todos.tsx manual-scan props derivation)

### Established Patterns
- Platform guard: `if (process.platform === 'linux') { ... }` — used throughout fs.ts, elevated.ts
- Silent fallback: catch → debug log only (no user notification) — used in applyChattrCasefold fallback
- Injectable seam: `_setX` exported functions for test injection — if retry logic is non-trivial, follow this pattern for testability

### Integration Points
- `getDriveList.ts` catch block: add `if (process.platform === 'linux') return ['/'];` before existing `return ['C:']`
- `todos.tsx` `minDiskSpace()`: add early return `if (process.platform !== 'win32') return false;`
- `todos.tsx` value renderers: wrap `winapi.GetVolumePathName(props.X)` calls with platform guard
- `NoGameDashlet.tsx` render: add Linux empty-state branch after `const games = ...` filter

</code_context>

<specifics>
## Specific Ideas

- **Crash boundary**: D-01 and D-02 together mean Phase 18 makes `todos.tsx` safe on Linux for the crash path (`ONBRD-01a`). The disk-space todos stay hidden (condition always false), so they don't show the `GetVolumePathName` value. Phase 19 then makes them visible with a real statfs() check. Clean handoff.
- **getDriveList**: Hardcoded `['/']` is the right call here — it's a fallback within a fallback (drivelist already handles the happy path). Keep it trivial.
- **Retry**: One-shot retry in `GameStoreHelper.ts` (the `allGames()` call site for Steam) rather than in the UI component — keeps UI dumb, logic in the data layer.

</specifics>

<deferred>
## Deferred Ideas

- Full `fs.statfs()` disk-space check for the disk-space todos — Phase 19 (ONBRD-02a)
- Multi-drive getDriveList parsing from /proc/mounts for more accurate Linux drive enumeration — Phase 19 or later
- NoGameDashlet polling behavior (retry-on-button multiple times) — out of scope; one-shot is sufficient

</deferred>

---

*Phase: 18-first-run-dashboard-foundation*
*Context gathered: 2026-04-16*
