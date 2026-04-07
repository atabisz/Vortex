---
phase: quick
plan: 260401-mvp
subsystem: fomod-installer
tags: [linux-compat, fomod, path-normalization]
dependency_graph:
  requires: []
  provides: [fomod-backslash-normalization]
  affects: [mod-installation]
tech_stack:
  added: []
  patterns: [replaceAll-before-path-join]
key_files:
  modified:
    - src/renderer/src/extensions/mod_management/InstallManager.ts
decisions:
  - "Normalize backslashes at loop entry, not at XML parse time — minimal blast radius"
  - "replaceAll is no-op on backslash-free paths — safe for Windows"
metrics:
  duration: "5min"
  completed: "2026-04-01"
  tasks: 1
  files: 1
---

# Quick Task 260401-mvp: Normalize Backslashes in FOMOD copy Source/Destination

**One-liner:** Two `replaceAll("\\", "/")` locals fix ENOENT for Windows-path FOMOD XML on Linux.

## What Was Done

In `InstallManager.ts`, the `for (const copy of sorted)` loop at line 7795 used `copy.source` and `copy.destination` directly in `path.join()` and `endsWith()` calls. On Linux, `path.join` treats backslashes as literal characters, so FOMOD XML entries like `Data\skse\plugins\file.dll` caused ENOENT file-not-found errors.

Added two normalization variables at the top of the loop body:

```ts
const source = copy.source.replaceAll("\\", "/");
const destination = copy.destination.replaceAll("\\", "/");
```

All downstream uses of `copy.source` and `copy.destination` within the loop replaced with `source` and `destination`. The `endsWith` folder-copy detection was simplified to only check `"/"` (backslash direction already normalized away).

## Branch Strategy

- Committed to `linux-port` first (commit `926255819`) — upstream PR eligible
- Merged into `master` (commit `e98993ab3`) via no-ff merge

## Commits

| Hash | Branch | Message |
|------|--------|---------|
| `926255819` | linux-port | fix(fomod): normalize backslashes in copy source/destination paths |
| `e98993ab3` | master | merge(linux-port): normalize backslashes in FOMOD copy source/destination paths |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `926255819` exists in git log
- `e98993ab3` exists in git log
- `replaceAll("\\", "/")` present for both source and destination at lines 7796-7797
- No raw `copy.source`/`copy.destination` references remain inside loop path operations
- `pnpm run build` completed successfully (webpack compiled in ~19s)
