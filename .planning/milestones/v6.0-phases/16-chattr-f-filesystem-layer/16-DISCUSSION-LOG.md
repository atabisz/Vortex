# Phase 16: chattr+F Filesystem Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 16-chattr-f-filesystem-layer
**Areas discussed:** CASE-11 notification scope, statfs cache per-session, Test seam for execFile

---

## CASE-11 Notification Scope

| Option | Description | Selected |
|--------|-------------|----------|
| ext4 without casefold feature only | Only fire when confirmed on ext4 but casefold feature not enabled (EOPNOTSUPP). Educational — user could reformat. btrfs/XFS/ZFS get no notification. | ✓ |
| Any non-ext4 filesystem | Fire whenever statfs shows we're NOT on ext4. Notifies btrfs/XFS/ZFS users too — permanently noisy. | |
| Never — silent fallback only | Drop notification entirely. INFO/DEBUG logs sufficient. | |

**User's choice:** ext4 without casefold feature only
**Notes:** btrfs/XFS/ZFS users can never enable it, so notifying them would be permanent noise with no recourse.

---

## Session Flag for Notification (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Module-level boolean in fs.ts | `let hasShownCasefoldNotification = false` flag. Mirrors `_isSteamOS` cache pattern. Zero deps. | ✓ |
| Redux state / persisted flag | Store in Redux, show once ever. More complex: action + reducer + state hive. | |
| You decide | Claude picks the implementation. | |

**User's choice:** Module-level boolean in fs.ts

---

## Notification Dispatch Mechanism (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Injectable _setNotifier seam | `_setNotifier(fn)` in fs.ts, injected at renderer bootstrap. Mirrors elevated.ts Phase 12 pattern. Testable without Redux. | ✓ |
| Direct Redux store access | Import store singleton in fs.ts. Works but couples util to store — antipattern. | |
| Return signal, let caller dispatch | applyChattrCasefold returns result indicating first EOPNOTSUPP-on-ext4. More complex call site. | |

**User's choice:** Injectable _setNotifier seam

---

## statfs Cache Per-Session

| Option | Description | Selected |
|--------|-------------|----------|
| Module-level Map in fs.ts | `Map<string, boolean>` keyed on staging dir path. statfs ~1ms but called per mod install. | ✓ |
| Call statfs() every time | Cheap enough. No session state, simpler code. | |

**User's choice:** Module-level Map in fs.ts

---

## Test Seam for chattr execFile

| Option | Description | Selected |
|--------|-------------|----------|
| Injectable _setChattr seam | `_setChattr(fn)` in fs.ts. Same pattern as _setSpawner. Tests inject mock; production uses default. Fully consistent with codebase. | ✓ |
| vi.spyOn(child_process, 'execFile') | Spy on Node built-in. Simpler, couples to Node internals. Works in Vitest. | |
| You decide | Claude picks the test seam approach. | |

**User's choice:** Injectable _setChattr seam

---

## Test Seam for statfs (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| vi.spyOn(fs.promises, 'statfs') | Spy on Node.js built-in promise. Consistent with resolvePathCase.test.ts fs mocking pattern. | ✓ |
| Injectable _setStatfs seam | Another _set* seam. Consistent but over-engineered alongside _setChattr seam. | |
| You decide | Claude picks the statfs mock approach. | |

**User's choice:** vi.spyOn(fs.promises, 'statfs')

---

## Claude's Discretion

- commandExists pre-flight check implementation (execFile 'which' vs execFile 'chattr --version')
- Exact verify-casefold logic for CASE-10
- Vitest test case selection for chattrCasefold tests

## Deferred Ideas

- btrfs casefold — CASE-13, deferred to v2+ (kernel not supporting it yet)
- Migration of pre-existing staging directories — CASE-12, deferred to v2+
