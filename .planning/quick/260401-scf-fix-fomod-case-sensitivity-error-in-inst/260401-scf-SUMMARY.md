---
phase: quick
plan: 260401-scf
subsystem: mod_management
tags: [linux, fomod, case-sensitivity, fix]
dependency_graph:
  requires: [resolvePathCase utility (260401-oz3)]
  provides: [case-insensitive FOMOD source path resolution in extractArchive]
  affects: [InstallManager.ts extractArchive]
tech_stack:
  added: []
  patterns: [resolvePathCase with dirCache per-call caching]
key_files:
  modified:
    - src/renderer/src/extensions/mod_management/InstallManager.ts
decisions:
  - "Used existing resolvePathCase utility, consistent with LinkingDeployment pattern"
  - "dirCache created once per extractArchive call — avoids repeated readdirAsync per directory"
metrics:
  duration: ~5min
  completed: 2026-04-01
---

# Quick Task 260401-scf: Fix FOMOD Case-Sensitivity in extractArchive Summary

**One-liner:** Resolve FOMOD source paths case-insensitively in extractArchive via resolvePathCase with per-call dirCache.

## What Was Done

FOMOD installers emit source paths using XML metadata casing, which often mismatches extracted filenames on Linux's case-sensitive filesystem. `extractArchive` in InstallManager.ts was using `path.join(tempPath, source)` directly, causing ENOENT errors on Linux.

Applied the same fix pattern used in `LinkingDeployment.ts`: import `resolvePathCase` and call it with a `dirCache` Map that's created once per `extractArchive` invocation (shared across loop iterations to avoid repeated `readdir` calls for the same directory).

## Changes

| File | Change |
|------|--------|
| `src/renderer/src/extensions/mod_management/InstallManager.ts` | Add import, add dirCache, replace path.join with await resolvePathCase |

## Commits

| Branch | Hash | Message |
|--------|------|---------|
| linux-port | 6e56ba5bf | fix(linux): resolve FOMOD source paths case-insensitively in extractArchive |
| master | 890e58909 | Merge branch 'linux-port' |

## Verification

- `grep -n "resolvePathCase"` shows import at line 204 and usage at line 7804
- `grep -n "dirCache"` shows Map creation at line 7780 and usage in resolvePathCase call
- No `path.join(tempPath, source)` matches remain
- `pnpm run build` completed successfully (webpack compiled successfully)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- File modified: `/home/alex/src/Vortex/src/renderer/src/extensions/mod_management/InstallManager.ts` — FOUND
- Commit 6e56ba5bf — FOUND
- Import, dirCache, and resolvePathCase call verified via grep
