---
phase: 15-fomod-installer-linux-fixes-vortex-cleanup
plan: 02
subsystem: mod_management/InstallManager
tags: [linux, fomod, ux, cleanup, platform-guard]
dependency_graph:
  requires: []
  provides: [CSharpScript-linux-warning, clean-copy-source-path]
  affects: [mod-installation-ux-linux]
tech_stack:
  added: []
  patterns: [process.platform-guard, filter-before-generic-handler]
key_files:
  modified:
    - src/renderer/src/extensions/mod_management/InstallManager.ts
decisions:
  - "CSharpScript notification uses type:warning (not info) — degraded install warrants user attention"
  - "platform guard is process.platform !== win32 (not === linux) — forward-compatible with other non-Windows platforms"
  - "destination replaceAll retained — path.join may reintroduce backslashes on Windows"
metrics:
  duration: ~8min
  completed: "2026-04-09T12:03:06Z"
  tasks_completed: 2
  files_changed: 1
---

# Phase 15 Plan 02: FOMOD Linux UX and Copy Path Cleanup Summary

Linux users installing C# script FOMADs now receive a clear platform-specific warning notification instead of a confusing generic "unimplemented functionality" dialog; redundant backslash normalization on copy source paths removed since Parser10 normalizes upstream.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add Linux-specific CSharpScript message to reportUnsupported | 7ba060faf | InstallManager.ts |
| 2 | Remove redundant replaceAll backslash normalization on copy source | 83468c712 | InstallManager.ts |

## What Was Built

### Task 1: Linux-specific CSharpScript warning in reportUnsupported

Modified `reportUnsupported` in `InstallManager.ts` to detect CSharpScript-specific unsupported instructions and show a platform-appropriate message on non-Windows systems.

**Change:** After the `length === 0` guard, filter `unsupported` into two buckets:
- `csharpUnsupported` — instructions where `instr.source === "CSharpScript"`
- `otherUnsupported` — all other unsupported instructions

If any CSharpScript instructions exist on a non-Windows platform, emit a `type: "warning"` notification explaining the mod uses a C# script that cannot run on Linux and was installed via basic file mapping. Then fall through to the existing generic dialog logic using `otherUnsupported` instead of the full `unsupported` array.

**Windows behavior:** Unchanged. The `process.platform !== "win32"` guard ensures Windows never fires the new notification path. On Windows, CSharpScript is handled by the C# runtime and never produces "unsupported" instructions.

### Task 2: Remove redundant replaceAll on copy source

Changed `const source = copy.source.replaceAll("\\", "/")` to `const source = copy.source` in the copy instruction processing loop.

**Rationale:** Parser10 in fomod-installer already normalizes all paths to forward slashes at XML parse time (TextUtil.NormalizePath with alternateSeparators=true). The replaceAll was dead code — the source always arrives pre-normalized. The destination `replaceAll` was retained as belt-and-suspenders since `path.join()` may reintroduce backslashes on Windows.

## Verification

```
grep "CSharpScript" InstallManager.ts           → matches in reportUnsupported (lines 4513, 4517, 4520)
grep 'const source = copy.source;' ...          → line 7949 (no replaceAll)
grep 'copy.destination.replaceAll' ...          → line 7950 (destination replaceAll preserved)
pnpm --filter @vortex/renderer run build        → webpack compiled successfully
pnpm --filter @vortex/renderer run lint         → 0 errors, 12285 warnings (all pre-existing)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary surfaces introduced.

## Self-Check: PASSED

- `src/renderer/src/extensions/mod_management/InstallManager.ts` — modified (exists)
- Commit `7ba060faf` — exists (feat: CSharpScript warning)
- Commit `83468c712` — exists (fix: remove redundant replaceAll)
- Build: webpack compiled successfully
- Lint: 0 errors
