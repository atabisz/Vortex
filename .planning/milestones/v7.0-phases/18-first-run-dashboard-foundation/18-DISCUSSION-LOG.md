# Phase 18: First-Run Dashboard Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 18-first-run-dashboard-foundation
**Areas discussed:** winapi crash boundary, getDriveList fallback, manual-scan condition, Empty state + retry UX

---

## winapi crash boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Suppress condition on Linux | Platform-guard minDiskSpace so it returns false on Linux — disk-space todos stay hidden. Phase 19 adds real statfs() check | ✓ |
| Add statfs() now in Phase 18 | Phase 18 also implements the Linux disk-space check — merges Phase 18 + 19 scope for these two todos | |

**User's choice:** Suppress condition on Linux

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show mount point path | On Linux, return the path itself (e.g. '/home/user/mods') as the drive value | ✓ |
| Hide the value field | Return null/undefined for the value on Linux — text only, no drive indicator | |

**User's choice:** Show mount point path

---

## getDriveList fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded ['/'] | Return ['/'] on Linux error — simple, always valid | ✓ |
| Parse /proc/mounts | Read /proc/mounts for real mounted filesystems | |
| os.homedir() prefix | Return [path.parse(os.homedir()).root] — portable but same effective result | |

**User's choice:** Hardcoded ['/']

---

| Option | Description | Selected |
|--------|-------------|----------|
| Silent fallback | Debug log only — consistent with existing Windows silent fallback | ✓ |
| Info notification | Brief notification that Vortex defaulted to '/' | |

**User's choice:** Silent fallback

---

## manual-scan condition

| Option | Description | Selected |
|--------|-------------|----------|
| Platform-guard on Linux only | On Linux, condition always returns true. Windows keeps existing searchPaths guard | ✓ |
| Wire searchPaths from state | Add searchPaths to props derivation — fixes cross-platform but touches more code | |

**User's choice:** Platform-guard on Linux only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible on Linux | Never auto-hides — Linux users need re-scanning for Flatpak Steam, newly installed games | ✓ |
| Hideable after one scan | Hides when discoveryRunning flips false | |

**User's choice:** Always visible on Linux

---

## Empty state + retry UX

| Option | Description | Selected |
|--------|-------------|----------|
| NoGameDashlet.tsx | Add Linux empty state to existing component: message + Refresh button on games.length === 0 | ✓ |
| New Linux-specific dashlet | New LinuxOnboardingDashlet component with registration boilerplate | |
| gamemode_management/index.ts | Add Refresh logic at extension index level — no UI change | |

**User's choice:** NoGameDashlet.tsx

---

| Option | Description | Selected |
|--------|-------------|----------|
| One-shot retry with delay | After allGames() returns empty on Linux, wait ~2s and retry once | ✓ |
| Poll until non-empty | Retry up to 3-5 times — more robust but may delay UX | |

**User's choice:** One-shot retry with delay

---

| Option | Description | Selected |
|--------|-------------|----------|
| Only after discovery completes | Show 'No games + Refresh' only when discoveryRunning === false AND games.length === 0 | ✓ |
| Show immediately if games is empty | Show message as soon as games.length === 0, even during scan | |

**User's choice:** Only after discovery completes

---

## Claude's Discretion

- Exact wording of "No Steam games detected" guidance text
- Retry delay duration (1500–3000ms range acceptable)
- Whether to add debug log at auto-retry site

## Deferred Ideas

- fs.statfs() disk-space check — Phase 19 (ONBRD-02a)
- /proc/mounts parsing for more accurate drive enumeration — Phase 19+
- Multi-retry polling behavior for Refresh button — out of scope
