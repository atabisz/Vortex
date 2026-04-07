---
phase: quick
plan: 260401-oz3
subsystem: mod-deployment
tags: [linux-compat, deployment, path-resolution, case-sensitivity]
dependency_graph:
  requires: []
  provides: [resolvePathCase-utility, case-correct-mod-deployment-linux]
  affects: [mod-deployment, LinkingDeployment, symlink-activator, hardlink-activator]
tech_stack:
  added: []
  patterns: [async-path-case-resolution, readdir-cache-per-cycle]
key_files:
  created:
    - src/renderer/src/extensions/mod_management/util/resolvePathCase.ts
    - src/renderer/src/extensions/mod_management/util/resolvePathCase.test.ts
  modified:
    - src/renderer/src/extensions/mod_management/LinkingDeployment.ts
decisions:
  - "resolvePathCase accepts optional Map<string, string[]> cache — caller manages lifecycle; new map per finalize() cycle"
  - "Filename (last segment) excluded from readdir resolution — only directory segments resolved"
  - "async/await in deployFile and removeDeployedFile — both already returned Promise so adding await is safe"
  - "truthy() filter used in removeDeployedFile relOutputPath join (matching existing target filter pattern)"
metrics:
  duration: "15min"
  completed: "2026-04-01"
  tasks: 2
  files: 3
---

# Quick Task 260401-oz3: Case-Folding Path Resolver in LinkingDeployment

**One-liner:** `resolvePathCase` walks directory segments via `readdirAsync` to match on-disk casing before linking/unlinking on Linux, preventing duplicate `data/` vs `Data/` directories.

## What Was Done

### Task 1: resolvePathCase utility (TDD)

Created `src/renderer/src/extensions/mod_management/util/resolvePathCase.ts`:

```ts
export async function resolvePathCase(
  rootDir: string,
  relPath: string,
  dirCache?: Map<string, string[]>,
): Promise<string>
```

Behavior:
- **win32:** Returns `path.join(rootDir, relPath)` immediately — no readdir calls.
- **Linux/macOS:** Splits `relPath` into segments. Strips the last segment (filename). For each directory segment, calls `fs.readdirAsync(currentDir)` and finds a case-insensitive match. If found, uses the on-disk casing; if not found or readdir throws, uses the original segment name (so `ensureDir` can create it later).
- **Cache:** Optional `Map<string, string[]>` passed by caller; populated on first readdir per directory; avoids redundant syscalls during batch deployment.

5 test cases written first (TDD RED), then implementation (GREEN), all passing:
1. Single segment: `data` → `Data` when `Data` exists
2. Multi-segment: `data/interface/file.swf` → `Data/Interface/file.swf`
3. win32 no-op: no readdirAsync calls on Windows
4. Missing root: returns path unchanged gracefully
5. readdir error: continues with original segment, no crash

### Task 2: Integration into LinkingDeployment

Modified `LinkingDeployment.ts`:

1. **Import:** Added `import { resolvePathCase } from "./util/resolvePathCase";`
2. **Field:** Added `private mReaddirCache: Map<string, string[]>;` alongside `mDirCache`
3. **Lifecycle:** Initialized as `new Map()` in `finalize()`, cleared to `undefined` in `finally()`
4. **deployFile:** Made `async`, builds `relOutputPath` from `[target, relPath].filter(truthy).join(sep)`, then `await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)` replaces the old array-join for `fullOutputPath`
5. **removeDeployedFile:** Made `async`, same pattern — resolves `outputPath` before `unlinkFile` and backup rename

Windows behavior is unchanged. `resolvePathCase` returns early on win32 without touching the filesystem.

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Commit | Hash | Description |
|--------|------|-------------|
| test(260401-oz3): add failing tests for resolvePathCase | 8d982eaf5 | TDD RED — 5 tests written before implementation |
| feat(260401-oz3): add resolvePathCase utility | 9ebee7c76 | TDD GREEN — all 5 tests pass |
| feat(260401-oz3): integrate resolvePathCase into LinkingDeployment | 32a9b021b | deployFile + removeDeployedFile wired |

All commits made to `linux-port` branch first, then merged to `master`.

## Known Stubs

None.

## Self-Check: PASSED

- `src/renderer/src/extensions/mod_management/util/resolvePathCase.ts` exists
- `src/renderer/src/extensions/mod_management/util/resolvePathCase.test.ts` exists
- All 5 tests pass (`pnpm vitest run` — confirmed green)
- `pnpm run build` succeeds without errors
- Commits 8d982eaf5, 9ebee7c76, 32a9b021b present on linux-port and master
