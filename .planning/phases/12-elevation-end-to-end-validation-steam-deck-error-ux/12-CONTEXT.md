# Phase 12: Elevation End-to-End Validation + Steam Deck Error UX - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire ELEV-06: the Steam Deck elevation failure notification. When `sudo -n` fails on SteamOS, show a visible, actionable notification to the user before rejecting the promise. ELEV-05 desktop Linux end-to-end validation is a human UAT activity — it is not a code deliverable of this phase.

</domain>

<decisions>
## Implementation Decisions

### Steam Deck Notification — Injection Point
- **D-01:** The notification is injected directly in `elevated.ts`, before the promise is rejected on `sudo -n` failure. This fires regardless of which call site triggered elevation — one place to change, always visible.

### Steam Deck Notification — UX
- **D-02:** Use `sendNotification` (or `api.showErrorNotification` if available at the injection point) to display a toast notification with the failure message.
- **D-03:** The notification includes a dismiss-only action button ("OK" or "Dismiss"). No external URL. The message text itself explains the recovery path.
- **D-04:** Message text: "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation." (matches the existing string already in `elevated.ts`).

### Error Type
- **D-05:** SteamOS elevation failure stays as `UserCanceled`. The notification is already shown in `elevated.ts` before the reject — callers that swallow `UserCanceled` will not suppress the notification. No new error types needed. No call site changes needed.

### Validation Scope
- **D-06:** Phase 12 code deliverables are scoped to ELEV-06 only (Steam Deck notification). ELEV-05 ("all user-triggered elevation operations validated on desktop Linux") is satisfied by the UAT checklist in `12-HUMAN-UAT.md` — this is a human testing activity, not a code fix phase. If live testing reveals bugs, those are addressed in a follow-on quick task or phase, not within Phase 12 scope.

### Claude's Discretion
- Notification API choice: `elevated.ts` currently has no access to the Redux store or `api`. Claude should determine the cleanest way to surface a notification from `elevated.ts` — either by making the error message prominent enough that callers' `showErrorNotification` naturally shows it, or by emitting a well-known event, or by injecting a notification callback. The simplest approach that works without requiring store access in `elevated.ts` is preferred (e.g., ensure callers that currently swallow `UserCanceled` actually show the message).
- Test coverage: Add at least 1 Vitest test confirming the SteamOS sudo -n failure produces a `UserCanceled` with the correct message. Existing test patterns in `elevated.test.ts` apply.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ELEV-05 and ELEV-06 acceptance criteria

### Elevation Implementation
- `src/renderer/src/util/elevated.ts` — `runElevated()`: SteamOS branch (lines ~216–244); `isSteamOS()` cached detection; `_setSpawner` test seam; `UserCanceled` throw with existing message string
- `src/renderer/src/util/elevated.test.ts` — existing 7-test Vitest suite; pattern for new SteamOS notification tests

### Call Sites (where runElevated is invoked)
- `src/renderer/src/util/fs.ts:1079` — file operation elevation; catches and maps error codes
- `src/renderer/src/ExtensionManager.ts:2610,2661` — custom tool runner elevation
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts:567,817,941,1068` — symlink activation (deploy path); uses `showErrorNotification` for non-UserCanceled errors

### Notification API
- `src/renderer/src/types/INotification.ts` — `INotification`, `NotificationType`, `INotificationAction` interfaces
- `src/renderer/src/actions/notifications.ts` — `addNotification()`, `startNotification()`, etc.
- `src/renderer/src/types/IExtensionContext.ts:503` — `sendNotification?: (notification: INotification) => string` on the extension API

### Prior Phase Context
- `.planning/phases/11-persistent-elevation-token/11-CONTEXT.md` — D-07: no changes to `runElevated()` call sites for ELEV-04; Phase 12 changes are additive to the SteamOS branch only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/renderer/src/util/elevated.ts` `isSteamOS()`: Already detects the SteamOS path. The notification injection point is inside the `if (isSteamOS()) { ... }` branch, after `proc.on("error", ...)` and `proc.on("close", ...)` callbacks produce non-zero exit.
- `src/renderer/src/util/elevated.test.ts` `_setSpawner` + `_resetSteamOSCache`: Test infrastructure already in place for mocking the SteamOS path.

### Established Patterns
- `api.showErrorNotification(title, err)` at call sites in `symlink_activator_elevate`: Shows a toast for non-UserCanceled errors. Since Steam Deck failure is UserCanceled, this won't fire at those call sites — which is correct (notification already fires in `elevated.ts`).
- `sendNotification({ type: "error", message: "...", actions: [...] })` pattern: Available via the extension API for in-process notification dispatch.

### Integration Points
- The challenge: `elevated.ts` is a utility module with no direct access to the Redux store or `api`. The cleanest injection approach needs to be researched (see Claude's Discretion above). One known approach: the caller could pass a notification callback; another: emit a Node event; another: ensure the `UserCanceled` message is not swallowed and is rendered at call sites.

</code_context>

<specifics>
## Specific Ideas

- The existing message in `elevated.ts` — "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation." — should be preserved verbatim as the notification body text.
- Phase is scoped to ELEV-06 only. Keep it tight.

</specifics>

<deferred>
## Deferred Ideas

- ELEV-05 desktop Linux live validation — human UAT activity, not a code deliverable; captured in HUMAN-UAT.md
- Any bugs found during ELEV-05 live testing — follow-on quick tasks or Phase 12.1 if substantial

</deferred>

---

*Phase: 12-elevation-end-to-end-validation-steam-deck-error-ux*
*Context gathered: 2026-04-07*
