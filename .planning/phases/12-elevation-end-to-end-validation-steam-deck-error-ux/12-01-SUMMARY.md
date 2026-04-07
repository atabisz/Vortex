---
phase: 12-elevation-end-to-end-validation-steam-deck-error-ux
plan: 01
subsystem: elevation/notification
tags: [linux, elevation, steamos, notification, ux]
dependency_graph:
  requires: [phase-11-persistent-elevation-token]
  provides: [ELEV-06-notification, ELEV-05-uat-checklist]
  affects: [src/renderer/src/util/elevated.ts, src/renderer/src/renderer.tsx]
tech_stack:
  added: []
  patterns: [injectable-callback-seam, optional-chaining-defensive]
key_files:
  created:
    - .planning/phases/12-elevation-end-to-end-validation-steam-deck-error-ux/12-HUMAN-UAT.md
  modified:
    - src/renderer/src/util/elevated.ts
    - src/renderer/src/util/elevated.test.ts
    - src/renderer/src/renderer.tsx
decisions:
  - "_setNotifier mirrors _setSpawner injectable seam pattern — consistent internal API"
  - "rejectWithSteamOSNotification helper DRYs both SteamOS error paths (close+error)"
  - "Optional chaining _notifier?.() satisfies T-12-03 denial-of-service mitigation"
  - "Registration placed after setStore() to ensure sendNotification is initialized"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-07"
  tasks_completed: 3
  files_modified: 4
requirements:
  - ELEV-05
  - ELEV-06
---

# Phase 12 Plan 01: SteamOS Elevation Error Notification Summary

**One-liner:** Injectable `_setNotifier` callback in `elevated.ts` fires visible error notification before rejecting with `UserCanceled` on SteamOS sudo -n failure, wired at renderer startup.

## What Was Built

Added ELEV-06: when `sudo -n` fails on SteamOS (Game Mode, no polkit agent), a visible dismissible error notification fires before the promise rejects with `UserCanceled`. Also created ELEV-05 human UAT checklist for desktop Linux elevation validation.

### elevated.ts changes

- Added `type NotifierFn = (notification: INotification) => void` and `let _notifier: NotifierFn | undefined`
- Exported `_setNotifier(fn)` — mirrors `_setSpawner` injectable seam pattern exactly
- Extracted `rejectWithSteamOSNotification(reject)` helper to DRY both SteamOS error paths
- Replaced the two duplicate inline `new UserCanceled()` blocks in the `close` and `error` handlers with calls to the helper
- Helper fires `_notifier?.({ type: "error", title: "Elevation unavailable", message: "..." })` before calling `reject(err)` — optional chaining ensures no crash when notifier not registered (T-12-03)

### elevated.test.ts changes

- Added `import type { INotification }` and `_setNotifier` to imports
- Added `_setNotifier(undefined)` to the existing SteamOS fallback `afterEach`
- Added new describe block `"runElevated — SteamOS notification on sudo -n failure"` with 5 tests:
  - Test A: exit code 1 fires notifier with `type: "error"` and message containing "Game Mode"
  - Test B: ENOENT spawn error fires notifier with same shape
  - Test C: notifier receives `title: "Elevation unavailable"`
  - Test D: error thrown is still `UserCanceled` (D-05 regression guard)
  - Test E: no crash when `_setNotifier` not registered

### renderer.tsx changes

- Added `import { _setNotifier } from "./util/elevated"`
- Registered callback after `extensions.setStore(store)` and before `setOutdated`:
  ```typescript
  _setNotifier((notification) => {
    extensions.getApi().sendNotification?.(notification);
  });
  ```

### 12-HUMAN-UAT.md

Created ELEV-05 human UAT checklist with structured checkboxes for:
- Desktop Linux (GNOME/KDE): 5 scenarios covering hardlinks, symlinks, permission repair, session token re-use, fresh session re-prompt
- Steam Deck Game Mode (ELEV-06): 3 scenarios covering notification appearance, dismissibility, and Vortex stability after dismiss

## Test Results

All 21 tests in `elevated.test.ts` pass:
- 16 pre-existing tests (isSteamOS detection, sudo -n fallback, pkexec branch, non-SteamOS Linux)
- 5 new notification tests

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Mirror `_setSpawner` pattern for `_setNotifier` | Consistency — both are internal injectable seams with `_` prefix convention |
| Extract `rejectWithSteamOSNotification` helper | DRYs two identical error blocks; plan Research Pitfall 2 explicitly called this out |
| Optional chaining `_notifier?.()` | Satisfies T-12-03 threat — no crash if notifier not registered at any point |
| Register after `setStore()` in renderer | `sendNotification` becomes available when ExtensionManager.setStore() wires it at line 1004 |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired. The notification fires via the real `sendNotification` API registered in renderer.tsx.

## Self-Check: PASSED

Files verified:
- `src/renderer/src/util/elevated.ts` — exists, contains `_setNotifier`, `rejectWithSteamOSNotification`, `_notifier?.(`
- `src/renderer/src/util/elevated.test.ts` — exists, contains all 5 new test descriptions
- `src/renderer/src/renderer.tsx` — exists, contains `_setNotifier` import and registration after `setStore`
- `.planning/phases/12-elevation-end-to-end-validation-steam-deck-error-ux/12-HUMAN-UAT.md` — exists, contains ELEV-05 and ELEV-06 content

Commits verified:
- `20ba7cca1` — feat(12-01): add _setNotifier callback and rejectWithSteamOSNotification helper
- `dd3d180ef` — feat(12-01): wire _setNotifier registration at renderer startup
- `83ba354f0` — docs(12-01): create ELEV-05 human UAT checklist
