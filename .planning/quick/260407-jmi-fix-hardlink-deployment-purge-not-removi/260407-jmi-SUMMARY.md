---
phase: quick
plan: 260407-jmi
subsystem: hardlink-deployment
tags: [linux, hardlink, purge, turbowalk, lstat, inode]
dependency_graph:
  requires: []
  provides: [hardlink-purge-linux]
  affects: [mod-deployment]
tech_stack:
  added: []
  patterns: [platform-guard, lstat-enrichment]
key_files:
  modified:
    - src/renderer/src/extensions/hardlink_activator/index.ts
decisions:
  - enrichLinuxEntries uses fs.lstatAsync (async) with Promise.all so walk.js awaits the callback; no blocking lstatSync
  - IEntry fields are plain object properties — in-place mutation is safe
  - The helper is module-level (not a class method) since it has no class dependency
metrics:
  duration: ~10min
  completed: 2026-04-07
  tasks_completed: 2
  files_changed: 1
---

# Quick Task 260407-jmi: Fix Hardlink Deployment Purge Not Removing Files on Linux — Summary

**One-liner:** Linux-guarded `enrichLinuxEntries` patches turbowalk entries with `lstatAsync` ino/nlink so inode purge set is non-empty.

## What Was Done

On Linux, `turbowalk` falls back to a pure-JS walker (`walk.js`) that only populates `filePath`, `isDirectory`, `size`, and `mtime`. The `purgeLinks()` method in `DeploymentMethod` checks `entry.linkCount > 1 && entry.idStr !== undefined` before adding entries to the staging inode set and before unlinking game-directory files. Both checks evaluate to false on every entry, so purge silently removes nothing.

Added `enrichLinuxEntries(entries: IEntry[]): Promise<void>` above the class. On Linux it calls `fs.lstatAsync` for each non-directory entry and writes `stat.nlink` → `entry.linkCount` and `String(stat.ino)` → `entry.idStr`. Both turbowalk callbacks in `purgeLinks` now `await enrichLinuxEntries(entries)` before the inode-set and unlink logic runs.

The helper is guarded by `if (process.platform !== "linux") return` so it resolves immediately on Windows — zero behavioral change to the Windows code path.

## Commits

| Hash | Message |
|------|---------|
| `517d9ea` | fix(hardlink): enrich turbowalk entries with lstat on Linux for purge |

## Deviations from Plan

None — plan executed exactly as written. Syntax error from the trailing comma in the second turbowalk callback was caught and fixed during TypeScript compilation verification (Rule 1 auto-fix, same task).

## Known Stubs

None.

## Threat Flags

None. No new trust boundaries introduced — `enrichLinuxEntries` operates on local filesystem paths already managed by Vortex.

## Self-Check

- [x] `/home/alex/src/Vortex/.claire/worktrees/agent-a8a1579f/src/renderer/src/extensions/hardlink_activator/index.ts` exists with fix
- [x] Commit `517d9ea` exists in worktree branch
- [x] `tsc --noEmit` exits clean
