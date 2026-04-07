---
phase: quick
plan: 260401-m5m
subsystem: collections/exe-version
tags: [linux, collections, game-version, patch]
dependency_graph:
  requires: []
  provides: [blank-game-version-fix]
  affects: [extensions/collections]
tech_stack:
  added: [patches/exe-version@2.3.0.patch]
  patterns: [pnpm-patch]
key_files:
  created:
    - patches/exe-version@2.3.0.patch
  modified:
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - extensions/collections/src/util/InstallDriver.ts
decisions:
  - "Return '0.0.0' instead of '' on Linux in exe-version to distinguish unknown from absent"
  - "Guard InstallDriver mismatch dialog to skip when gameVersion is empty/undefined"
metrics:
  duration: 15min
  completed: 2026-04-01T05:06:55Z
---

# Quick 260401-m5m: Fix Blank Game Version in Mismatch Dialog Summary

**One-liner:** pnpm patch for exe-version returning 0.0.0 on Linux + defensive empty-string guard in InstallDriver to suppress false mismatch dialogs.

## What Was Done

Fixed a Linux-specific UX bug where the "Game version mismatch" dialog showed a blank "Your game version:" field when installing collections.

**Root cause:** `exe-version` (the Nexus fork) returns `''` (empty string) for `getFileVersion()` and `getProductVersion()` on non-Windows platforms. This empty string propagated as a valid version through `getInstalledVersion()` and hit the mismatch dialog check, where it never matched any known game version.

**Two-pronged fix:**

1. **pnpm patch for exe-version:** Changed `return '';` to `return '0.0.0';` for both `getFileVersion` and `getProductVersion` on non-Windows. This gives a well-defined sentinel value instead of an empty string that looks like valid data.

2. **Guard in InstallDriver.ts:** Added `gameVersion !== undefined && gameVersion !== '' &&` at the start of the version mismatch condition. This defensive guard ensures that even if exe-version or any future version provider returns empty/undefined, the mismatch dialog is skipped rather than showing a confusing blank version.

## Commits

- `cb1347584` (linux-port): fix(260401-m5m): patch exe-version to return 0.0.0 on Linux; guard blank-version mismatch dialog
- `e3d661383` (master): fix(260401-m5m): patch exe-version to return 0.0.0 on Linux; guard blank-version mismatch dialog
- `9922c1be0` (linux-port): feat(08-01): async registerProtocol + Promise<boolean> return type (phase 08 uncommitted changes also committed)

## Verification

All checks passed:

1. `grep -c "return '0.0.0'" src/main/node_modules/exe-version/index.js` → `2` (both functions patched)
2. `grep "exe-version" pnpm-workspace.yaml` → `exe-version@2.3.0: patches/exe-version@2.3.0.patch` (registered)
3. `grep "gameVersion !== undefined" extensions/collections/src/util/InstallDriver.ts` → present
4. `pnpm install` → succeeded with no errors on both linux-port and master

## Deviations from Plan

### Additional work

**Phase 08 uncommitted changes committed:**
- `src/renderer/src/extensions/nexus_integration/index.tsx` and `src/renderer/src/types/IExtensionContext.ts` had uncommitted NXM protocol async changes from phase 08 that were staged locally. These were committed to linux-port as `feat(08-01)` commit `9922c1be0`.

### Branch strategy notes

Due to significant divergence between `linux-port` and `master` branches (master has phase 08–09 commits not yet merged to linux-port), a direct merge produced conflicts. Approach used:
- Committed fix to `linux-port` directly
- Re-applied the same changes to `master` manually (patch file copied from linux-port, same code edits applied)
- Both branches now have the fix committed independently

## Known Stubs

None. Both changes are complete and functional.
