# Phase 12: Elevation End-to-End Validation + Steam Deck Error UX - Research

**Researched:** 2026-04-07
**Domain:** Electron renderer utility — notification injection from a store-less utility module
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Notification injected directly in `elevated.ts`, before the promise is rejected on `sudo -n` failure.
- **D-02:** Use `sendNotification` (or `api.showErrorNotification`) to display a toast notification.
- **D-03:** Dismiss-only action button ("OK" or "Dismiss"). No external URL. Message text explains recovery.
- **D-04:** Message text: "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation."
- **D-05:** SteamOS elevation failure stays as `UserCanceled`. No new error types. No call site changes.
- **D-06:** Phase 12 code deliverables scoped to ELEV-06 only. ELEV-05 is a human UAT checklist, not a code fix.

### Claude's Discretion

- **Notification API choice:** `elevated.ts` has no Redux store or `api` access. Determine the cleanest way to surface the notification — e.g., ensure callers that swallow `UserCanceled` actually show the message, or inject a notification callback, or emit a well-known event. Simplest approach preferred.
- **Test coverage:** Add at least 1 Vitest test confirming SteamOS `sudo -n` failure produces a `UserCanceled` with the correct message. Existing test patterns in `elevated.test.ts` apply.

### Deferred Ideas (OUT OF SCOPE)

- ELEV-05 desktop Linux live validation — human UAT activity, captured in HUMAN-UAT.md
- Bugs found during ELEV-05 live testing — follow-on quick tasks or Phase 12.1 if substantial
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELEV-05 | All user-triggered elevation operations complete successfully on desktop Linux without crashing or hanging | Human UAT only (HUMAN-UAT.md checklist); no code deliverable |
| ELEV-06 | When elevation fails on Steam Deck (no polkit agent in Game Mode), user sees actionable error notification with clear recovery path | Code deliverable: notification injection in `elevated.ts` SteamOS branch |
</phase_requirements>

---

## Summary

Phase 12's sole code deliverable is ELEV-06: a user-visible notification when `sudo -n` fails on SteamOS (Game Mode, no polkit agent). The existing `elevated.ts` already rejects with `UserCanceled` carrying the correct message string — the gap is that callers which swallow `UserCanceled` silently discard this rejection without showing any UI feedback.

The central design challenge is that `elevated.ts` is a plain Node utility with no access to the Redux store or `api`. The cleanest solution — verified by reading the call sites — is a **notification callback** pattern: `runElevated` accepts an optional `onNotify` callback that fires before the promise is rejected, allowing the call site (which has `api` access) to dispatch the notification. Alternatively, a module-level callback registration (similar to the existing `_setSpawner` test seam) lets callers register a notification handler once at startup and fires on every SteamOS failure — decoupled from individual call sites.

ELEV-05 is a human UAT activity: a HUMAN-UAT.md checklist that the developer exercises on real hardware. No code changes are required to satisfy it.

**Primary recommendation:** Add a module-level `_setNotifier` registration function mirroring `_setSpawner`. Register it at app startup from a context that has `api`. Fire it before `reject(err)` in both SteamOS error paths. This is the lowest-coupling approach and requires zero changes to call sites.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 4.1.0 | Test runner for renderer package | Already used in `elevated.test.ts` |
| `INotification` / `addNotification` | N/A (internal) | Vortex notification system | Already the project's only toast API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `UserCanceled` from `./CustomErrors` | N/A | Typed cancellation signal | Already used for SteamOS reject |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Module-level notifier callback | Pass `onNotify` as parameter to `runElevated` | Parameter approach changes call signature — requires updating all 6 call sites; module-level registration touches zero call sites |
| Module-level notifier callback | Electron IPC event emit | IPC adds async latency and cross-process complexity; notification needs to appear in renderer synchronously before promise rejects |

---

## Architecture Patterns

### Recommended Project Structure

No new files. Changes land in two existing files:
```
src/renderer/src/util/
├── elevated.ts          # +_setNotifier / notifier invocation in SteamOS branch
├── elevated.test.ts     # +1 Vitest test for notifier call on sudo -n failure
```

### Pattern 1: Module-Level Injectable Callback (mirroring `_setSpawner`)

**What:** A module-level `let _notifier` variable, a `_setNotifier(fn)` setter, and a `getNotifier()` accessor. Before each `reject(err)` in the SteamOS branch, call `getNotifier()?.(notification)`.

**When to use:** When a utility module needs to produce side effects (notifications, logging) that require external infrastructure (Redux store) without taking a hard dependency on it.

**Example (verified from `elevated.ts` existing pattern):**
```typescript
// Source: src/renderer/src/util/elevated.ts — modeled on _setSpawner

type NotifierFn = (notification: INotification) => void;
let _notifier: NotifierFn | undefined;

/** Register a notification handler for elevation failures. */
export function _setNotifier(fn: NotifierFn | undefined): void {
  _notifier = fn;
}

// In SteamOS branch, before reject():
const err = new UserCanceled();
(err as any).message =
  "Elevation is not available in Steam Game Mode. " +
  "Switch to Desktop Mode to perform this operation.";
_notifier?.({
  type: "error",
  title: "Elevation Unavailable",
  message: (err as any).message,
  noDismiss: false,
});
reject(err);
```

**Registration site (at renderer startup, where `api` is available):**
```typescript
// Source: pattern from sendNotification usage in symlink_activator_elevate
import { _setNotifier } from "../util/elevated";
_setNotifier((notification) => api.sendNotification(notification));
```

**Important:** `_setNotifier` is an escape hatch for wiring, not part of the public API. The `_` prefix signals internal/test-only, consistent with `_setSpawner` and `_resetSteamOSCache`.

### Pattern 2: Caller-Visible Error Message (Fallback — ALREADY PARTIALLY IN PLACE)

**What:** The `UserCanceled` error already carries the Steam Deck message. Callers using `showErrorNotification` for non-`UserCanceled` errors will miss it; callers that re-throw or log will preserve it. This is not sufficient on its own because several call sites explicitly swallow `UserCanceled` silently.

**When to use:** As belt-and-suspenders alongside Pattern 1. The message already exists on the thrown error — if a call site opts to display `UserCanceled` messages, it gets the right text for free.

### Anti-Patterns to Avoid

- **Store import from `elevated.ts`:** Circular dependency risk; `elevated.ts` is a leaf utility, store is a root. [VERIFIED: codebase inspection]
- **Direct Redux dispatch in `elevated.ts`:** Same circular risk, and elevated.ts runs code that's serialized into a temp file — any imports it uses must survive serialization. [VERIFIED: `elevatedMain` comment in elevated.ts]
- **Changing call signatures of `runElevated`:** Six call sites across three files; any signature change forces coordinated edits across all. The module-level notifier avoids this entirely. [VERIFIED: grep of call sites]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification UI | `INotification` + `api.sendNotification` | Already project-standard; dispatch handled by reducer |
| Error typing for Steam Deck | New `SteamDeckElevationError` class | `UserCanceled` with message | D-05 explicitly locks this; callers already handle `UserCanceled` |

---

## Common Pitfalls

### Pitfall 1: Notifier Registered After First Elevation Attempt

**What goes wrong:** `_setNotifier` is wired at app startup, but if elevation is attempted during extension init (before the startup wire-up), `_notifier` is still `undefined` and no notification fires.
**Why it happens:** Module load order in Electron renderer is not strictly sequential.
**How to avoid:** Register `_setNotifier` in the earliest possible hook where `api.sendNotification` is available — typically in the core extension's `once('gameMode.activated')` or main renderer bootstrap, not in an extension's lazy init.
**Warning signs:** Test passes but manual test on hardware shows no notification. Add a `log("warn", ...)` as a fallback when `_notifier` is undefined and the SteamOS error fires.

### Pitfall 2: Both SteamOS Error Paths Must Fire the Notifier

**What goes wrong:** The notification is added to the `close` handler (non-zero exit code) but forgotten in the `error` handler (`sudo` not on PATH).
**Why it happens:** Two separate event handlers in the SteamOS branch — `proc.on("close", ...)` and `proc.on("error", ...)`.
**How to avoid:** Extract a helper `rejectWithSteamNotification(reject)` that fires notifier then calls reject, and call it from both handlers. [VERIFIED: elevated.ts lines 226–244]
**Warning signs:** Missing notification on machines where `sudo` binary is absent vs. present.

### Pitfall 3: `INotification.noDismiss` Defaults to False — Test It

**What goes wrong:** Setting `noDismiss: true` accidentally makes the notification non-dismissible, trapping Vortex in broken state. D-03 requires dismiss-only.
**Why it happens:** Confusion between `noDismiss` (suppresses auto-dismiss button) and `displayMS` (auto-dismiss timer).
**How to avoid:** Omit `noDismiss` (or set `false`), omit `displayMS`. The notification stays visible until user dismisses. [VERIFIED: INotification.ts interface]

### Pitfall 4: Vitest Test Needs `_setNotifier` Reset in `afterEach`

**What goes wrong:** A test that registers a mock notifier pollutes subsequent tests if the module-level `_notifier` is not reset.
**Why it happens:** Module-level state persists across Vitest tests in the same worker unless explicitly cleared.
**How to avoid:** Follow the existing pattern — `_resetSteamOSCache()` is already called in `afterEach` in `elevated.test.ts`. Add `_setNotifier(undefined)` to the same `afterEach` hooks. [VERIFIED: elevated.test.ts afterEach blocks]

### Pitfall 5: `INotification.actions` Callback Not Serializable

**What goes wrong:** The `INotification` object is dispatched through Redux (which serializes state to JSON). Action callbacks are stripped. At notification render time, `fireNotificationAction` looks them up by index from module-level `notificationActions` map.
**Why it happens:** `addNotification` in `notifications.ts` does `JSON.parse(JSON.stringify(noti))` and replaces actions with `{title, icon}` stubs.
**How to avoid:** If using `actions` array, understand that the action function is stored in the module-level map — it is NOT serialized. This is normal behavior. Do NOT put complex state in the action closure. For a dismiss-only notification, no `actions` array is needed — the default dismiss button is always present unless `noDismiss: true`. [VERIFIED: notifications.ts addNotification implementation]

---

## Code Examples

### SteamOS Failure Notification Pattern

```typescript
// Source: VERIFIED from elevated.ts lines 226-244 and INotification.ts

// Module-level injectable (mirrors _setSpawner pattern in this file):
type NotifierFn = (notification: INotification) => void;
let _notifier: NotifierFn | undefined;
export function _setNotifier(fn: NotifierFn | undefined): void {
  _notifier = fn;
}

// Helper to keep both error paths DRY:
function rejectWithSteamOSNotification(reject: (err: UserCanceled) => void): void {
  const err = new UserCanceled();
  (err as any).message =
    "Elevation is not available in Steam Game Mode. " +
    "Switch to Desktop Mode to perform this operation.";
  _notifier?.({
    type: "error",
    title: "Elevation unavailable",
    message: (err as any).message,
  });
  reject(err);
}

// In close handler (non-zero exit):
proc.on("close", (code: number | null) => {
  if (code !== null && code !== 0) {
    rejectWithSteamOSNotification(reject);
  }
});
// In error handler (sudo not on PATH):
proc.on("error", (_spawnErr: Error) => {
  rejectWithSteamOSNotification(reject);
});
```

### Vitest Test Pattern (new test)

```typescript
// Source: VERIFIED from elevated.test.ts beforeEach/afterEach patterns

import { _setNotifier } from "./elevated";
import type { INotification } from "../types/INotification";

describe("runElevated — SteamOS notification on sudo -n failure", () => {
  let capturedNotification: INotification | undefined;

  beforeEach(() => {
    _resetSteamOSCache();
    capturedNotification = undefined;
    _setNotifier((n) => { capturedNotification = n; });
    // ... platform and os-release mocks (same as existing SteamOS suite)
  });

  afterEach(() => {
    _resetSteamOSCache();
    _setNotifier(undefined);   // <-- mandatory cleanup
    vi.clearAllMocks();
  });

  it("fires notifier with error type and Game Mode message on sudo -n exit 1", async () => {
    setupSyncMocks(FAKE_TMP);
    _setSpawner(makeEarlyCloseSpawner(1));

    const err = await runElevated("ipc-notify-1", vi.fn()).catch((e) => e);
    expect(err).toBeInstanceOf(UserCanceled);
    expect(capturedNotification).toBeDefined();
    expect(capturedNotification?.type).toBe("error");
    expect(capturedNotification?.message).toContain("Game Mode");
  });
});
```

### Registration at Startup

```typescript
// Source: VERIFIED from sendNotification usage in symlink_activator_elevate/index.ts line 872
// and IExtensionContext.ts:503

// In a renderer-side init function that receives api:
import { _setNotifier } from "../util/elevated";

function initElevatedNotifications(api: IExtensionApi): void {
  _setNotifier((notification) => api.sendNotification?.(notification));
}
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm --filter src/renderer run test -- --reporter=verbose src/renderer/src/util/elevated.test.ts` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ELEV-06 | SteamOS sudo -n exit non-zero fires notifier with error type | unit | `pnpm --filter src/renderer run test -- src/renderer/src/util/elevated.test.ts` | Wave 0: add test |
| ELEV-06 | SteamOS sudo ENOENT fires notifier with error type | unit | same | Wave 0: add test |
| ELEV-06 | Notifier receives message containing "Game Mode" | unit | same | Wave 0: add test |
| ELEV-06 | Error thrown is still UserCanceled (D-05) | unit | same | Already covered by existing test |
| ELEV-05 | Desktop Linux elevation operations complete | manual | HUMAN-UAT.md | N/A — manual only |

### Sampling Rate
- **Per task commit:** `pnpm --filter src/renderer run test -- src/renderer/src/util/elevated.test.ts`
- **Per wave merge:** `pnpm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Add `_setNotifier` notification test cases to `src/renderer/src/util/elevated.test.ts`
- [ ] Create `src/renderer/src/extensions/core/util/elevatedNotifications.ts` (or inline in main init) for `_setNotifier` registration — determine exact registration point during execution

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Message is a string literal, not user input |
| V6 Cryptography | no | — |

No security-sensitive changes. The notification message is a hardcoded string literal.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 12 is a code-only change. No external tools beyond `pnpm run test` and `pnpm run build` are required, both of which are already confirmed available in the project.

---

## Open Questions (RESOLVED)

1. **Where exactly to register `_setNotifier`?**
   RESOLVED: Register in `renderer.tsx` after `extensions.setStore(store)` and before `setOutdated(extensions.getApi())`. This is the earliest point where `api.sendNotification` is available. Specified in Plan 12-01 Task 2.

2. **Should HUMAN-UAT.md be created as part of this phase?**
   RESOLVED: Yes — Plan 12-01 Task 3 creates `12-HUMAN-UAT.md` with structured checklists for ELEV-05 desktop Linux validation and ELEV-06 Steam Deck UX verification.

---

## Sources

### Primary (HIGH confidence)
- `src/renderer/src/util/elevated.ts` — VERIFIED: complete SteamOS branch implementation, both error paths, existing `_setSpawner` pattern
- `src/renderer/src/util/elevated.test.ts` — VERIFIED: 7-test Vitest suite, `_setSpawner` + `_resetSteamOSCache` patterns, `makeEarlyCloseSpawner` + `makeFakeProc` helpers, `afterEach` teardown patterns
- `src/renderer/src/types/INotification.ts` — VERIFIED: `INotification` interface, `noDismiss`, `actions`, `type` fields
- `src/renderer/src/actions/notifications.ts` — VERIFIED: `addNotification` dispatch pattern, actions serialization behavior
- `src/renderer/src/types/IExtensionContext.ts:503` — VERIFIED: `sendNotification?: (notification: INotification) => string` signature
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts` — VERIFIED: `sendNotification` call patterns, UserCanceled swallow pattern at lines 1001/1010
- `src/renderer/src/ExtensionManager.ts:2661–2673` — VERIFIED: `runElevated` call site, `.catch((err) => reject(err))` swallows all errors including UserCanceled
- `src/renderer/src/util/fs.ts:1079` — VERIFIED: `runElevated` call site, maps to `UserCanceled` for code 5/1223 on Windows but not on Linux

### Secondary (MEDIUM confidence)
- `.planning/phases/12-elevation-end-to-end-validation-steam-deck-error-ux/12-CONTEXT.md` — locked decisions D-01 through D-06 (user decisions, authoritative)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — INotification/sendNotification are project-internal; verified by reading actual source
- Architecture: HIGH — `_setSpawner` pattern confirmed in same file; notifier callback is exact same shape
- Pitfalls: HIGH — all identified by reading actual code paths, not assumption
- Test patterns: HIGH — verified from existing test file structure

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable internal code; changes only if elevated.ts is modified)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Registration of `_setNotifier` can happen after module import and before first elevation attempt | Architecture Patterns / Pitfall 1 | If elevation fires before registration (during extension init), no notification — add defensive log warn |
| A2 | `api.sendNotification` is always available at the registration point chosen | Open Questions | If not available, notification silently no-ops — verify at execution time |

**All other claims were VERIFIED by direct codebase inspection in this session.**
