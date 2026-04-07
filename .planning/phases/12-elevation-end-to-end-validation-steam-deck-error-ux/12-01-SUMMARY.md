---
phase: 12-elevation-end-to-end-validation-steam-deck-error-ux
plan: "01"
subsystem: elevation
tags: [linux, steamos, steam-deck, notifications, elevation, ELEV-06]
dependency_graph:
  requires:
    - Phase 11 ELEV-04 (persistent polkit session token in .deb)
    - src/renderer/src/util/elevated.ts (SteamOS sudo -n branch from Phase 10)
  provides:
    - _setNotifier export in elevated.ts
    - rejectWithSteamOSNotification helper
    - ELEV-06 notification wired at renderer startup
    - ELEV-05 human UAT checklist
  affects:
    - src/renderer/src/renderer.tsx (startup wiring)
    - src/renderer/src/util/elevated.ts (new exports)
    - src/renderer/src/util/elevated.test.ts (5 new tests)
tech_stack:
  added: []
  patterns:
    - Injectable callback seam (_setNotifier mirrors _setSpawner pattern)
    - Optional chaining for safety when notifier is not registered
key_files:
  created:
    - .planning/phases/12-elevation-end-to-end-validation-steam-deck-error-ux/12-HUMAN-UAT.md
  modified:
    - src/renderer/src/util/elevated.ts
    - src/renderer/src/util/elevated.test.ts
    - src/renderer/src/renderer.tsx
decisions:
  - "_setNotifier callback seam mirrors _setSpawner: same trust level, same test pattern, no architectural change"
  - "rejectWithSteamOSNotification() helper DRYs both SteamOS error paths (close non-zero, spawn ENOENT)"
  - "Optional chaining _notifier?.() ensures no crash if notifier not registered at startup"
  - "Registration placed after setStore() which initializes sendNotification on the api"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-07"
  tasks_completed: 3
  files_modified: 4
---

# Phase 12 Plan 01: Steam Deck Elevation Notification Summary

**One-liner:** `_setNotifier` injectable callback in elevated.ts fires a visible "Elevation unavailable" error notification on SteamOS sudo -n failure, wired to sendNotification at renderer startup.

## What Was Built

ELEV-06 is now fully implemented. When Vortex runs on SteamOS in Game Mode and an elevation operation is triggered, `sudo -n` fails — and instead of silently swallowing the `UserCanceled`, a visible error notification now fires with:
- **Title:** "Elevation unavailable"
- **Message:** "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation."
- **Type:** `"error"` (red notification, dismissible)

The implementation uses an injectable callback seam (`_setNotifier`) that exactly mirrors the existing `_setSpawner` test seam pattern. The `rejectWithSteamOSNotification()` helper DRYs both SteamOS error paths (non-zero exit code and spawn ENOENT).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add _setNotifier to elevated.ts and write failing tests | 76b7dbf6e | elevated.ts, elevated.test.ts |
| 2 | Wire _setNotifier registration at renderer startup | d1157906d | renderer.tsx |
| 3 | Create ELEV-05 human UAT checklist | 4a6f56c05 | 12-HUMAN-UAT.md |

## Acceptance Criteria Verification

- [x] `elevated.ts` exports `_setNotifier`
- [x] `elevated.ts` contains `rejectWithSteamOSNotification` helper
- [x] `elevated.ts` contains `_notifier?.({` (safe optional chaining)
- [x] `elevated.ts` contains `type: "error"` in notification
- [x] `elevated.ts` contains `title: "Elevation unavailable"` in notification
- [x] No duplicate `new UserCanceled()` blocks in SteamOS branch (both replaced by helper)
- [x] `elevated.test.ts` imports `_setNotifier`
- [x] All 5 new notification tests pass
- [x] All 16 existing tests still pass (21 total)
- [x] `renderer.tsx` imports `_setNotifier` from `./util/elevated`
- [x] `renderer.tsx` registration appears after `setStore` and before `setOutdated`
- [x] `12-HUMAN-UAT.md` exists with ELEV-05 and ELEV-06 checklists

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — notification wiring is complete end-to-end. The ELEV-05 human UAT checklist intentionally requires manual testing; this is by design per D-06, not a stub.

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model (T-12-01, T-12-02, T-12-03 all accepted/mitigated).

## Self-Check: PASSED

Files exist:
- `src/renderer/src/util/elevated.ts` — modified (FOUND)
- `src/renderer/src/util/elevated.test.ts` — modified (FOUND)
- `src/renderer/src/renderer.tsx` — modified (FOUND)
- `.planning/phases/12-elevation-end-to-end-validation-steam-deck-error-ux/12-HUMAN-UAT.md` — created (FOUND)

Commits exist:
- `76b7dbf6e` feat(12-01): add _setNotifier callback and rejectWithSteamOSNotification helper (FOUND)
- `d1157906d` feat(12-01): wire _setNotifier registration at renderer startup (FOUND)
- `4a6f56c05` docs(12-01): create ELEV-05 human UAT checklist (FOUND)
