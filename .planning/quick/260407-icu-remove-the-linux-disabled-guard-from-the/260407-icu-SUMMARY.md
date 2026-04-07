---
phase: quick
plan: 260407-icu
subsystem: nexus_integration
tags: [linux, nxm, settings, ui]
dependency_graph:
  requires: [Phase 08 xdg-settings/xdg-mime NXM registration]
  provides: [NXM toggle enabled on Linux in Settings UI]
  affects: [nexus_integration Settings.tsx]
tech_stack:
  added: []
  patterns: [platform guard removal]
key_files:
  modified:
    - src/renderer/src/extensions/nexus_integration/views/Settings.tsx
decisions:
  - Remove disabled guard once platform support exists — no stub needed
metrics:
  duration: 5min
  completed: 2026-04-07
---

# Quick Task 260407-icu Summary

**One-liner:** Removed stale Linux-disabled guard from NXM toggle — xdg-settings support (Phase 08) makes it fully functional.

## What Was Done

Removed two stale Linux-specific guards from `Settings.tsx` in the `nexus_integration` extension:

1. `disabled={process.platform === "linux"}` prop removed from the `<Toggle>` component
2. Conditional `<HelpBlock><Alert bsStyle="info">{t("Not supported on Linux")}</Alert></HelpBlock>` block removed (9 lines)

Phase 08 implemented full `xdg-settings`/`xdg-mime` NXM protocol registration on Linux, making these guards obsolete. Linux users can now toggle NXM association from the Settings UI just like Windows users.

## Commits

| Branch | Hash | Message |
|--------|------|---------|
| linux-port | b3c474bcc | fix(linux): enable NXM toggle on Linux — remove stale disabled guard |
| master | 167099a47 | Merge branch 'linux-port' |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `grep 'process.platform.*linux' Settings.tsx` → 0 matches
- [x] `grep 'Not supported on Linux' Settings.tsx` → 0 matches
- [x] `grep 'disabled=' Settings.tsx` → 0 matches
- [x] TypeScript: `pnpm --filter @vortex/renderer exec tsc --noEmit` → clean
- [x] Committed to linux-port: b3c474bcc
- [x] Merged to master: 167099a47

## Self-Check: PASSED
