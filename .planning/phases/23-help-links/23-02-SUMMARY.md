---
phase: 23-help-links
plan: 02
subsystem: extension/documentation
tags: [extension, platform-guard, notification, ipc, renderer, linux]

# Dependency graph
requires:
  - "shell:openUrlFailed MainChannels entry (23-01)"
  - "onOpenUrlFailed preload bridge method (23-01)"
provides:
  - "LINUX_WIKI_URL constant in documentation extension"
  - "Linux platform guard routing Help > Knowledge Base to Linux-specific wiki"
  - "Browser failure notification listener (ONBRD-06b renderer side)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "process.platform === \"linux\" ternary for platform-specific URL fallback"
    - "(window as any).api.shell pattern for preload access from bundled extensions"
    - "sendNotification with replace:{} template substitution and fixed id for deduplication"

key-files:
  created: []
  modified:
    - extensions/documentation/src/index.tsx

key-decisions:
  - "(window as any).api.shell used instead of getPreloadApi(): documentation extension is a bundled extension that imports from vortex-api, not from src/renderer/src/; avoids new intra-renderer dependency"
  - "Notification id open-url-failed is fixed (not URL-dependent) to deduplicate rapid failures per T-23-06 mitigation"

patterns-established: []

requirements-completed:
  - ONBRD-06a
  - ONBRD-06b

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 23 Plan 02: Linux Wiki URL Guard and Browser-Failure Notification Summary

**Linux platform guard routes Help > Knowledge Base to https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux; browser failure on any platform shows warning notification with URL**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-17T00:26:49Z
- **Completed:** 2026-04-17T00:28:49Z
- **Tasks:** 1 of 2 auto-executed (Task 2 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- Added `LINUX_WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux"` constant after `WIKI_URL`
- Replaced `const url = generateUrl(wikiId) ?? WIKI_URL` with `fallbackUrl` ternary — Linux gets `LINUX_WIKI_URL`, all other platforms get `WIKI_URL`
- Registered `window.api.shell.onOpenUrlFailed` listener inside `context.once()` — fires on any platform when `shell.openExternal` fails and dispatches a `type: "warning"` notification with the URL
- Existing `WIKI_URL`, `WIKI_TOPICS`, and `isModernLayout === false` else branch all unchanged
- Full test suite: 34 files, 416 tests, all passed

## Task Commits

1. **Task 1: Add Linux wiki URL guard and browser-failure notification listener** - `d17563edf` (feat)

## Files Created/Modified

- `extensions/documentation/src/index.tsx` - Added `LINUX_WIKI_URL` constant, platform guard on fallback URL, and `onOpenUrlFailed` notification listener in `context.once()`

## Deviations from Plan

None - plan executed exactly as written.

## Threat Model Coverage

- T-23-04 (Spoofing - accept): callback URL comes from trusted main process via typed IPC; no code mitigation needed
- T-23-05 (Info Disclosure - accept): URL was user-initiated; showing it in notification is safe
- T-23-06 (DoS - mitigate): `id: "open-url-failed"` fixed string causes notification deduplication; rapid failures overwrite the same notification slot

## Known Stubs

None.

## Pending

**Task 2 (checkpoint:human-verify):** Human must launch Vortex on Linux, click Help > Knowledge Base, and confirm:
1. Browser opens `https://github.com/Nexus-Mods/Vortex/wiki/Vortex-on-Linux` (not the generic wiki)
2. If browser fails to open, a warning notification appears with the URL displayed

## Self-Check: PASSED

- FOUND: extensions/documentation/src/index.tsx
- FOUND: .planning/phases/23-help-links/23-02-SUMMARY.md
- FOUND commit: d17563edf

---

*Phase: 23-help-links*
*Completed: 2026-04-17*
