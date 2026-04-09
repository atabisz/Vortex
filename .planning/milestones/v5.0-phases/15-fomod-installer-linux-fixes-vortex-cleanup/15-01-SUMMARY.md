---
phase: 15-fomod-installer-linux-fixes-vortex-cleanup
plan: "01"
subsystem: fomod-installer
tags: [fomod, linux, path-normalization, c-sharp]
dependency_graph:
  requires: []
  provides: [FOMD-15-02]
  affects: [fomod-installer/XmlScriptInstaller]
tech_stack:
  added: []
  patterns: [TextUtil.NormalizePath for archive path normalization]
key_files:
  created: []
  modified:
    - /home/alex/src/fomod-installer/src/InstallScripting/XmlScript/XmlScriptInstaller.cs
decisions:
  - "TextUtil.NormalizePath(matchedFiles[0], false, true) applied to source path: alternateSeparators=true gives forward slashes, toLower=true (default) gives lowercase"
  - "FOMD-15-01 (CSharpScript OS guard) confirmed in ModFormatManager.cs at 2 call sites"
  - "FOMD-15-03 (CI linux-x64 IPC build) confirmed in build-packages.yml with 13 linux-x64 references"
metrics:
  duration: "3 minutes"
  completed_date: "2026-04-09T11:59:17Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 15 Plan 01: fomod-installer Source Path Normalization Summary

## One-liner

XmlScriptInstaller source path normalized via TextUtil.NormalizePath(matchedFiles[0], false, true) to emit lowercase forward-slash paths consistent with destination.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Normalize source path in XmlScriptInstaller.cs | fa1761c (fomod-installer) | Done |
| 2 | Verify FOMD-15-01 and FOMD-15-03 already in place | read-only | Done |

## Changes Made

### Task 1: XmlScriptInstaller.cs — source path normalization

**File:** `/home/alex/src/fomod-installer/src/InstallScripting/XmlScript/XmlScriptInstaller.cs`

Two changes:
1. Added `using Utils;` to the using block (TextUtil lives in the `Utils` namespace)
2. Changed line 140: `string strSource = matchedFiles[0];` to `string strSource = TextUtil.NormalizePath(matchedFiles[0], false, true);`

The call signature:
- `dirTerminate=false` — no trailing separator on a file path
- `alternateSeparators=true` — uses `Path.AltDirectorySeparatorChar` (`/`) so paths are forward-slash on all platforms
- `toLower=true` (default) — lowercases the path

This makes the source path consistent with destination paths that already go through Parser10's `NormalizePath` at XML parse time. Eliminates case mismatches on Linux where the filesystem is case-sensitive.

### Task 2: Verification of FOMD-15-01 and FOMD-15-03

**FOMD-15-01 (CSharpScript OS guard) — CONFIRMED:**
- `ModFormatManager.cs` contains 2 occurrences of `IsOSPlatform(OSPlatform.Windows)` — one in `GetRequirements()`, one in `GetScriptType()`
- Both wrap `CSharpScriptType` registration inside `#if USE_CSHARP_SCRIPT` + Windows platform check
- `using System.Runtime.InteropServices;` present at top of file
- `verify-warning.spec.ts` exists and contains 3 references to `UnsupportedFunctionalityWarning`

**FOMD-15-03 (CI Linux IPC build) — CONFIRMED:**
- `build-packages.yml` contains 13 references to `linux-x64`
- `build-ipc` job matrix includes `ubuntu-22.04` / `linux-x64`
- Linux step runs `dotnet publish ... -r linux-x64 --self-contained true`
- `package-ipc` job downloads both `ipc-win32-x64` and `ipc-linux-x64` artifacts

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The NormalizePath change addresses threat T-15-01 (path tampering via case mismatch) as planned.

## Self-Check

### Files verified
- [x] `/home/alex/src/fomod-installer/src/InstallScripting/XmlScript/XmlScriptInstaller.cs` — contains `TextUtil.NormalizePath(matchedFiles[0], false, true)` and `using Utils;`

### Commits verified
- [x] `fa1761c` — fomod-installer repo

## Self-Check: PASSED
