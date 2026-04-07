# Phase 12: Elevation End-to-End Validation + Steam Deck Error UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 12-elevation-end-to-end-validation-steam-deck-error-ux
**Areas discussed:** Steam Deck notification UX, Error type architecture, Validation scope

---

## Steam Deck Notification UX

| Option | Description | Selected |
|--------|-------------|----------|
| In elevated.ts itself | Before rejecting on sudo -n failure, show notification directly. One place, always fires. | ✓ |
| At each call site | Each caller catches UserCanceled and shows notification. 5–6 call sites to touch. | |
| New error wrapper | Shared wrapper around runElevated shows notification before re-throw. | |

**User's choice:** Inject in elevated.ts itself

---

| Option | Description | Selected |
|--------|-------------|----------|
| Message + action button | Toast with message + dismiss-only action button | ✓ |
| Message only | Simple dismissable toast, no button | |
| Modal dialog | Blocking dialog, impossible to miss | |

**User's choice:** Message + action button

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dismiss only | Button labeled OK/Dismiss. Message explains recovery path. | ✓ |
| Open docs URL | Button opens Nexus Mods/Vortex Linux support page | |
| You decide | Claude picks approach | |

**User's choice:** Dismiss only

---

## Error Type Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Stay UserCanceled | Notification fires in elevated.ts before reject; callers swallow UserCanceled correctly. No changes needed. | ✓ |
| New ElevationUnavailableError | Subclasses UserCanceled; callers can detect specifically. More extensible. | |
| You decide | Claude picks simplest type. | |

**User's choice:** Stay UserCanceled

**Notes:** Since notification fires in elevated.ts before rejection, callers that do `if (!(err instanceof UserCanceled))` correctly suppress a second error notification. No new error types required.

---

## Validation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Code + tests + UAT checklist | Deliver notification code + Vitest tests + human UAT checklist. Live testing is a separate human activity. | |
| Code + fix bugs found | Also fix any elevation bugs found during live testing. Open-ended scope. | |
| Notification only | Just wire ELEV-06. ELEV-05 desktop validation is human UAT. | ✓ |

**User's choice:** Notification only

**Notes:** ELEV-05 is captured in a human UAT checklist (HUMAN-UAT.md), not a code fix deliverable. Phase 12 scope is ELEV-06 only.

---

## Claude's Discretion

- Notification API choice — how to dispatch a notification from elevated.ts without store/api access
- Test strategy — Vitest test confirming SteamOS UserCanceled message (existing pattern)

## Deferred Ideas

- ELEV-05 desktop Linux live validation — human UAT activity
- Bugs found during live testing — follow-on quick tasks or Phase 12.1
