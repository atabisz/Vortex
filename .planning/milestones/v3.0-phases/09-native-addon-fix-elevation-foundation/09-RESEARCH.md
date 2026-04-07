# Phase 9: Native Addon Fix + Elevation Foundation - Research

**Researched:** 2026-04-01
**Domain:** C++ native addon patching (binding.gyp / C++ exception fix) + Linux pkexec elevation IPC
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SAVE track: lz4/zlib on Linux**
- D-01: Use system libraries for lz4 and zlib on Linux — linker flags `-llz4 -lz` in the new `OS=="linux"` binding.gyp condition. No bundling; both are standard on any modern Linux distro.
- D-02: Add `liblz4-dev` and `zlib1g-dev` to the existing `apt-get install` step in `.github/workflows/main.yml` (same line as `libfontconfig1-dev`). One combined build-deps step, no new CI step.
- D-03: Add `liblz4-1` and `zlib1g` to the `.deb` `depends` array in `electron-builder.config.cjs` now (not Phase 10). Current: `["xdg-utils", "libasound2"]` → append `"liblz4-1"` and `"zlib1g"`. Ensures the `.node` file loads at runtime after `.deb` install.

**SAVE track: patch scope and version pin**
- D-04: Deliver one pnpm patch for `gamebryo-savegame` that contains both fixes: `src/gamebryosavegame.cpp` (MoreInfoException base class fix) and `binding.gyp` (OS=="linux" condition with `-llz4 -lz` linker flags). Single patch, applied once by `pnpm install`.
- D-05: Pin `gamebryo-savegame` to its exact version in `package.json` / catalog before creating the patch. Current version: `2.1.2`. Pitfall: pnpm patch silently skips on version mismatch.

**ELEV track: pkexec Linux branch**
- Claude's Discretion: The exact shape of the pkexec Linux branch in `runElevated()` — whether `if (process.platform === 'linux')` guards the entire spawn block or only the `ShellExecuteEx` call, and the exact `child_process.spawn` invocation signature.
- Claude's Discretion: Injectable spawner seam design — env var, module-level setter, or parameter. Planner chooses what satisfies "no `ECONNREFUSED` in CI tests" from ELEV-01 SC-4. The seam must not require changes to call sites outside `elevated.ts`.
- Claude's Discretion: Non-126 pkexec failure handling (ENOENT, unexpected exit codes). Phase 9 must not hang — throw a descriptive error for non-126 cases rather than silently swallowing. SteamOS-specific `sudo -n` fallback is Phase 10 (ELEV-02).

### Claude's Discretion
- Exact `if (process.platform === 'linux')` branch shape in `runElevated()`
- Injectable spawner seam design (env var vs. module-level setter vs. parameter)
- Non-126 pkexec exit code handling strategy

### Deferred Ideas (OUT OF SCOPE)
- pkexec spawner seam specifics — planner decides (Claude's Discretion above)
- SteamOS `sudo -n` fallback and polkit-less hang prevention — ELEV-02, Phase 10
- `.deb` polkit action file (`io.nexusmods.vortex.policy`) — ELEV-03, Phase 10
- Save game UI validation — SAVE-02, SAVE-03, SAVE-04, Phase 10
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAVE-01 | `gamebryo-savegame` native addon compiles and loads on Linux CI — MoreInfoException base class ported from MSVC `std::exception(std::runtime_error(...))` to `std::runtime_error`; `binding.gyp` gains `OS=="linux"` condition with `-llz4 -lz` linker flags; `pnpm patch` applied and pinned to exact package version; `@electron/rebuild` verifies `.node` loads without linker errors | C++ fix verified against actual source; pnpm patch format confirmed from loot@6.2.1.patch; CI apt step missing zlib1g-dev; deb depends missing both runtime libs |
| ELEV-01 | `runElevated()` uses `pkexec` on Linux — Unix domain socket server listens before `pkexec` is spawned (socket-before-spawn ordering enforced); pkexec exit code 126 maps to `UserCanceled`; injectable spawner seam for CI testing; no elevation-related hangs or crashes on Linux | elevated.ts source fully reviewed; IPC server pattern confirmed from symlink_activator_elevate; UserCanceled import path confirmed; existing Jest test in `__tests__/elevated.test.js` uses winapi-bindings mock |
</phase_requirements>

---

## Summary

Phase 9 has two independent tracks. The SAVE track is a surgical C++ patch to `gamebryo-savegame`: one line of C++ changes `MoreInfoException`'s base class from the MSVC-only `std::exception(std::runtime_error(message))` constructor call to the standard-compliant `std::runtime_error(message)` directly, and `binding.gyp` gains an `OS=="linux"` condition block mirroring the existing `OS=="win"` block with `-llz4` and `-lz` linker flags for system libraries. This is delivered as a single pnpm patch pinned to version `2.1.2`, following the exact pattern of the existing `patches/loot@6.2.1.patch`.

The ELEV track adds a `if (process.platform === 'linux')` branch inside `runElevated()` at `elevated.ts:174`, immediately before the `winapi.ShellExecuteEx(...)` call. The branch spawns `pkexec` with `child_process.spawn`, using the already-written script at `tmpPath` as the argument. The IPC socket server is already started by callers in `symlink_activator_elevate/index.ts` before `runElevated()` is called — the socket-before-spawn ordering requirement is satisfied at the call site, not inside `elevated.ts`. Exit code 126 maps to `UserCanceled`; other non-zero codes throw a descriptive error.

**Primary recommendation:** Create the gamebryo-savegame patch via `pnpm patch`, implement the pkexec Linux branch in `elevated.ts`, add an injectable spawner seam via a module-level function setter, write a new Vitest test in `src/renderer/src/util/elevated.test.ts` (not the Jest `__tests__/` file which is excluded from Vitest), and update CI apt and deb depends.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pnpm patch | (pnpm 10.33.0) | Apply source patches to node_modules packages | Established project pattern — loot@6.2.1.patch exists as reference |
| @electron/rebuild | 4.0.3 | Recompile native addons against Electron headers | Already in allowBuilds + catalog; used in Phase 3 CI |
| child_process (Node built-in) | Node 22.22.0 | Spawn pkexec on Linux | Standard Node API; no new dependency |
| net (Node built-in) | Node 22.22.0 | IPC server (already used by callers) | Already in symlink_activator_elevate |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| liblz4-dev | 1.9.4 (system) | Build-time lz4 headers for native addon | CI apt step only |
| zlib1g-dev | 1.3 (system) | Build-time zlib headers for native addon | CI apt step only |
| liblz4-1 | 1.9.4 (system) | Runtime lz4 shared lib | deb depends runtime |
| zlib1g | 1.3 (system) | Runtime zlib shared lib | deb depends runtime |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pnpm patch | Fork the GitHub repo | Patching avoids repo ownership; fork requires upstream coordination |
| system lz4/zlib | Bundle lz4/zlib sources in package | D-01 locked to system libs — bundling rejected |
| child_process.spawn | execFile or spawnSync | spawn with 'close' event is non-blocking and gives exit code; matches async `runElevated` contract |

**Installation:** No new dependencies. liblz4-dev and zlib1g-dev added to CI apt step only.

---

## Architecture Patterns

### SAVE Track: pnpm Patch Pattern

The existing `patches/loot@6.2.1.patch` shows the exact format required:

```
diff --git a/binding.gyp b/binding.gyp
index f73f16d..d8b1865 100644
--- a/binding.gyp
+++ b/binding.gyp
@@ ... @@
   ["OS=='linux'", {
+    "libraries": ["-L../loot_api", "-llibloot"],
+    "ldflags": ["-Wl,-rpath,'$$ORIGIN/../../loot_api'"]
   }]
```

The gamebryo-savegame patch must follow this format. The `patchedDependencies` key uses `name@version` format (e.g., `gamebryo-savegame@2.1.2: patches/gamebryo-savegame@2.1.2.patch`).

**Critical:** The catalog entry for `gamebryo-savegame` is a git tarball URL, not a semver. pnpm uses the `version` field from `package.json` inside the package for the `patchedDependencies` key — confirmed as `2.1.2`.

### SAVE Track: C++ Fix

The `MoreInfoException` class at `gamebryosavegame.cpp:23-31` currently reads:

```cpp
class MoreInfoException : public std::exception {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::exception(std::runtime_error(message))  // MSVC-only: passes runtime_error to exception ctor
```

The fix: change the base class from `std::exception` to `std::runtime_error`, update the initializer list accordingly:

```cpp
class MoreInfoException : public std::runtime_error {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::runtime_error(message)  // Standard C++: runtime_error ctor takes const char*
```

This is GCC-compatible because `std::runtime_error` inherits from `std::exception`, so all callers catching `std::exception` still work.

### SAVE Track: binding.gyp Linux Condition

The existing `binding.gyp` has only a `OS=="win"` condition block. The Linux condition to add mirrors the loot patch pattern:

```json
["OS=='linux'", {
    "libraries": ["-llz4", "-lz"]
}]
```

Note: No RPATH needed (unlike loot) because lz4 and zlib are system libraries loaded from standard paths. No `cflags!` or `cflags_cc!` changes needed — those are already at the target level.

### ELEV Track: runElevated Linux Branch

The insertion point is `elevated.ts:174` — immediately before the `winapi.ShellExecuteEx(...)` call inside the `fs.write` callback. Structure:

```typescript
// Source: elevated.ts inspection + CONTEXT.md specifics section
if (process.platform === 'linux') {
  // socket server is already listening (started by callers before runElevated)
  const spawner = getSpawner(); // injectable seam
  const proc = spawner('pkexec', [process.execPath, '--run', tmpPath]);
  proc.on('close', (code) => {
    if (code === 126) {
      return reject(new UserCanceled());
    }
    if (code !== 0) {
      return reject(new Error(`pkexec exited with code ${code}`));
    }
    // code 0: elevation accepted, process ran and exited normally
  });
  return resolve(tmpPath);
}
// existing winapi.ShellExecuteEx path follows
```

**Socket-before-spawn ordering:** The IPC server is started by call sites in `symlink_activator_elevate/index.ts` via `startIPCServer()` and `.listen(getIPCPath(ipcPath))` BEFORE calling `runElevated()`. The `net.Server.listen()` is synchronous-start (the server begins listening when `listen()` returns, before the `listening` event fires). This means `resolve(tmpPath)` can be returned immediately after `spawn()` — the socket is guaranteed to be listening before pkexec runs the child script that calls `client.connect(ipcPath)`.

### ELEV Track: Injectable Spawner Seam

Module-level setter pattern (Claude's Discretion — recommended):

```typescript
// Source: elevated.ts design
import { spawn, SpawnSyncReturns } from 'child_process';
import type { ChildProcess } from 'child_process';

type SpawnerFn = (cmd: string, args: string[]) => ChildProcess;

let _spawner: SpawnerFn = spawn;

/** Override the spawn function — for testing only. Do not call in production. */
export function _setSpawner(fn: SpawnerFn): void {
  _spawner = fn;
}

function getSpawner(): SpawnerFn {
  return _spawner;
}
```

This design:
- Does not change the `runElevated` function signature
- Does not require changes to call sites in `symlink_activator_elevate/index.ts` or anywhere else
- Is resettable in tests via `_setSpawner(originalSpawn)` in `afterEach`
- The seam export name uses `_` prefix per project convention for internal/test-only exports

### ELEV Track: UserCanceled Import

`UserCanceled` is in `src/renderer/src/util/CustomErrors.ts` which re-exports from `@vortex/shared/errors`. The import in `elevated.ts` should use:

```typescript
import { UserCanceled } from "./CustomErrors";
```

(Same pattern as `symlink_activator_elevate/index.ts:28`.)

### ELEV Track: pkexec Exit Codes

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | resolve(tmpPath) |
| 126 | User dismissed auth dialog | reject(new UserCanceled()) |
| 127 | pkexec not found / policy error | reject(new Error(`pkexec exited with code 127`)) |
| Other | Unexpected failure | reject(new Error(`pkexec exited with code ${code}`)) |

### Test Pattern: Vitest for elevated.ts

The existing test at `src/renderer/src/__tests__/elevated.test.js` uses **Jest** (jest.mock, require). The renderer Vitest config (`src/renderer/vitest.config.mts`) includes `src/**/*.test.{ts,tsx}` but **excludes** `src/**/__tests__/*`. A new Vitest test for the pkexec branch must be placed at:

```
src/renderer/src/util/elevated.test.ts
```

(Not in `__tests__/` — Vitest excludes that directory.)

### Anti-Patterns to Avoid

- **Do NOT add socket-before-spawn logic inside `elevated.ts`:** The IPC server is started by callers before `runElevated()` is called. Adding a second `net.Server.listen()` inside `elevated.ts` would create a race or double-bind.
- **Do NOT use `spawnSync` for pkexec:** It blocks the Node event loop. `runElevated` is async; use `spawn` with the `'close'` event.
- **Do NOT use `execFile` for pkexec:** Same concern; `spawn` is simpler and sufficient.
- **Do NOT catch UserCanceled in the pkexec branch:** Let it propagate. Callers in `symlink_activator_elevate/index.ts` already handle `UserCanceled` (e.g., lines 612-613 show `.catch({ code: 5 }, () => reject(new UserCanceled()))`).
- **Do NOT forget to call `resolve(tmpPath)` synchronously on Linux:** The Windows path calls `resolve(tmpPath)` inside the `ShellExecuteEx` try block after the call succeeds. The Linux path must resolve immediately after spawning (not after the process exits) so the caller receives the tmpPath for cleanup.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Applying C++ source fix to npm package | Manual node_modules edit | pnpm patch | pnpm patch is idempotent, version-pinned, applied on `pnpm install` — manual edits are lost on reinstall |
| lz4/zlib on Linux | Bundle static libs in package | system `-llz4 -lz` | liblz4-dev and zlib1g-dev are standard on all Linux dev/CI environments; D-01 locked this |
| pkexec spawn | Shell script wrapper | child_process.spawn | Direct spawn gives typed exit codes and process handle; no intermediate shell quoting issues |
| CI apt packages | New CI job | Extend existing apt-get install line | D-02 locked: one combined build-deps step, no new CI step |

---

## Common Pitfalls

### Pitfall 1: pnpm patch silently skips on version mismatch
**What goes wrong:** If `pnpm-workspace.yaml` catalog has `gamebryo-savegame: git+https://...#hash` without a semver version and the `patchedDependencies` key doesn't match, pnpm applies the patch to 0 packages without warning.
**Why it happens:** pnpm matches `patchedDependencies` keys by `name@version` from the package's own `package.json`. If the catalog entry is a git URL without version, pnpm may not resolve the match.
**How to avoid:** The package's `package.json` reports `version: 2.1.2`. Use `gamebryo-savegame@2.1.2: patches/gamebryo-savegame@2.1.2.patch` as the key. Verify with `pnpm install --frozen-lockfile=false` and check that `pnpm list gamebryo-savegame` shows the patched state.
**Warning signs:** `pnpm install` completes without mentioning the patch; `node_modules` still contains the original C++ source.

### Pitfall 2: zlib1g-dev missing from CI apt step
**What goes wrong:** The CI apt step currently has `libfontconfig1-dev cmake liblz4-dev` — `zlib1g-dev` is NOT there. zlib.h is required at compile time. The addon will fail to compile with "zlib.h: No such file or directory".
**Why it happens:** liblz4-dev was already added in Phase 3; zlib1g-dev was overlooked because zlib1g (runtime) is pre-installed on Ubuntu runners but zlib1g-dev (headers) is not.
**How to avoid:** Add `zlib1g-dev` to the existing apt-get install line per D-02.
**Warning signs:** CI build error mentioning `zlib.h` not found.

### Pitfall 3: pkexec exits before socket is ready (false alarm)
**What goes wrong:** Test or documentation concern about ECONNREFUSED because pkexec child tries to connect before socket is ready.
**Why it happens:** In production, the IPC server is started before `runElevated()` is called (confirmed: `symlink_activator_elevate/index.ts:797-817` starts server then calls `runElevated`). But in tests, if the spawner seam isn't set, a real pkexec call would fail.
**How to avoid:** Use the injectable spawner seam `_setSpawner()` in tests to provide a mock spawner that never actually spawns pkexec. This fulfills ELEV-01 SC-4 without requiring polkit in CI.
**Warning signs:** Tests with real pkexec calls hanging or ECONNREFUSED in CI where pkexec is not available / polkit agent absent.

### Pitfall 4: resolve(tmpPath) called after pkexec 'close' instead of after spawn
**What goes wrong:** If `resolve(tmpPath)` is placed inside the pkexec `'close'` handler instead of immediately after `spawn()`, the caller's code won't receive the tmpPath until elevation completes. This breaks the contract — callers expect `runElevated` to resolve after the process is *started*, not after it finishes.
**Why it happens:** Developer follows analogy with Windows where `ShellExecuteEx` is fire-and-forget but visible return value is the path.
**How to avoid:** Call `resolve(tmpPath)` immediately after `const proc = spawner(...)`, before attaching the `'close'` handler. If pkexec fails (126 or other), emit an error through a separate channel (or have the caller listen for the IPC server disconnecting). For phase 9, the `'close'` handler only needs to handle the error/cancel path that the caller can't observe through IPC.
**Warning signs:** `runElevated` promise hangs until pkexec finishes; timeout in tests.

### Pitfall 5: MoreInfoException needs `what()` override
**What goes wrong:** After changing base from `std::exception` to `std::runtime_error`, the inherited `what()` from `std::runtime_error` returns the message passed to the constructor. This is correct. However, if the original code had a `what()` override — check there is none — it could shadow the runtime_error's message.
**Why it happens:** The MSVC-only pattern `std::exception(std::runtime_error(message))` relies on MSVC's non-standard `std::exception` constructor accepting a char*; GCC's `std::exception` has no such constructor.
**How to avoid:** Inspect the full class definition. Confirmed in source: no `what()` override. The fix is complete as a base-class change.
**Warning signs:** `what()` returning empty string or "Unknown exception" after the fix.

---

## Code Examples

### Gamebryo-savegame binding.gyp Linux condition (verified from source)

Current (line 22-end):
```json
// Source: node_modules/gamebryo-savegame/binding.gyp (inspected directly)
"conditions": [
    ['OS=="win"', {
        "include_dirs": ["./lz4/include", "./zlib/include"],
        "libraries": ["-l../lz4/dll/liblz4", "-l../zlib/lib/zlib", "-DelayLoad:node.exe"],
        ...
    }]
]
```

After patch adds Linux condition:
```json
"conditions": [
    ['OS=="win"', { ... }],
    ['OS=="linux"', {
        "libraries": ["-llz4", "-lz"]
    }]
]
```

### MoreInfoException fix (verified from source at line 23-31)

Before:
```cpp
class MoreInfoException : public std::exception {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::exception(std::runtime_error(message))
```

After:
```cpp
class MoreInfoException : public std::runtime_error {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::runtime_error(message)
```

### pnpm-workspace.yaml patchedDependencies entry (following loot pattern)

```yaml
patchedDependencies:
  playwright-core@1.58.2: patches/playwright-core@1.58.2.patch
  loot@6.2.1: patches/loot@6.2.1.patch
  gamebryo-savegame@2.1.2: patches/gamebryo-savegame@2.1.2.patch  # ADD THIS
```

### CI apt step (add zlib1g-dev)

Before:
```yaml
run: sudo apt-get update && sudo apt-get install -y libfontconfig1-dev cmake liblz4-dev
```

After:
```yaml
run: sudo apt-get update && sudo apt-get install -y libfontconfig1-dev cmake liblz4-dev zlib1g-dev
```

### electron-builder.config.cjs deb.depends (add runtime libs)

Before:
```js
deb: {
  depends: ["xdg-utils", "libasound2"],
```

After:
```js
deb: {
  depends: ["xdg-utils", "libasound2", "liblz4-1", "zlib1g"],
```

### elevated.ts pkexec branch (placement and shape)

```typescript
// Source: elevated.ts:174 insertion point; CONTEXT.md Specific Ideas section
// Insert BEFORE the existing try { winapi.ShellExecuteEx... } block

if (process.platform === 'linux') {
  const proc = getSpawner()('pkexec', [process.execPath, '--run', tmpPath]);
  proc.on('close', (code: number | null) => {
    if (code === 126) {
      reject(new UserCanceled());
    } else if (code !== null && code !== 0) {
      reject(new Error(`pkexec exited with code ${code}`));
    }
    // code 0: normal exit; IPC handles results
  });
  return resolve(tmpPath);
}
```

### elevated.ts spawner seam (module-level, injectable for tests)

```typescript
// Source: design per CONTEXT.md Claude's Discretion; project convention for internal exports
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

type SpawnerFn = (cmd: string, args: string[]) => ChildProcess;
let _spawner: SpawnerFn = spawn;

export function _setSpawner(fn: SpawnerFn): void {
  _spawner = fn;
}

function getSpawner(): SpawnerFn {
  return _spawner;
}
```

### New Vitest test file location

```
src/renderer/src/util/elevated.test.ts
```

**Not** `src/renderer/src/__tests__/elevated.test.js` (that's a Jest file, excluded from Vitest by the `exclude: ["node_modules", "src/**/__tests__/*"]` rule in `src/renderer/vitest.config.mts`).

---

## Runtime State Inventory

Phase 9 is not a rename/refactor/migration phase. No runtime state inventory required.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pkexec | ELEV-01 runtime testing | Yes | 124 (polkit) | — (needed for production; tests use spawner seam) |
| liblz4-dev | SAVE-01 compile (CI) | Yes (dev machine) | 1.9.4 | — (must be in CI apt step) |
| zlib1g-dev | SAVE-01 compile (CI) | Yes (dev machine) | 1.3 | — (NOT in current CI apt step — must add) |
| liblz4-1 | SAVE-01 runtime (deb) | Yes | 1.9.4 | — (deb depends required) |
| zlib1g | SAVE-01 runtime (deb) | Yes | 1.3 | — (deb depends required) |
| @electron/rebuild | SAVE-01 verify | Yes (4.0.3 in catalog) | 4.0.3 | — |

**Missing dependencies with no fallback:**
- `zlib1g-dev` not in current CI apt-get install step — blocks gamebryo-savegame compile on CI. Must be added to `.github/workflows/main.yml` line 50.

**Missing dependencies with fallback:**
- None. All other items are available.

---

## Validation Architecture

nyquist_validation is enabled in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (renderer project) |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm vitest run src/renderer/src/util/elevated.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-01 | `gamebryo-savegame.node` loads without linker errors | smoke (ldd verify) | `ldd node_modules/.pnpm/gamebryo-savegame*/node_modules/gamebryo-savegame/build/Release/GamebryoSave.node` | ❌ Wave 0 (shell command, not a test file) |
| SAVE-01 | pnpm patch applies without warnings | integration | `pnpm install --frozen-lockfile=false 2>&1 \| grep -v Warning` | ❌ Wave 0 (CI step verification) |
| ELEV-01 | pkexec spawned on Linux (not ShellExecuteEx) | unit | `pnpm vitest run src/renderer/src/util/elevated.test.ts` | ❌ Wave 0 |
| ELEV-01 | Exit code 126 → UserCanceled thrown | unit | `pnpm vitest run src/renderer/src/util/elevated.test.ts` | ❌ Wave 0 |
| ELEV-01 | Non-126 non-zero → descriptive Error thrown | unit | `pnpm vitest run src/renderer/src/util/elevated.test.ts` | ❌ Wave 0 |
| ELEV-01 | resolve(tmpPath) returned immediately after spawn | unit | `pnpm vitest run src/renderer/src/util/elevated.test.ts` | ❌ Wave 0 |
| ELEV-01 | Spawner seam injectable (no ECONNREFUSED in CI) | unit | `pnpm vitest run src/renderer/src/util/elevated.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/renderer/src/util/elevated.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/renderer/src/util/elevated.test.ts` — covers ELEV-01 (pkexec branch, exit codes 0/126/other, spawner seam, resolve timing)
- [ ] SAVE-01 ldd verification is a shell command in a CI step, not a test file; planner should add it as a CI verification step after `@electron/rebuild`

---

## Open Questions

1. **resolve(tmpPath) timing on Linux — should it fire before or after pkexec exits?**
   - What we know: Windows path calls `resolve(tmpPath)` immediately after `ShellExecuteEx` succeeds (which is fire-and-forget). Callers use the tmpPath for deferred cleanup.
   - What's unclear: Whether callers ever need to know the process exited (they get results via IPC). The `symlink_activator_elevate` code ignores the resolved `tmpPath` in the `.then()` callback on line 569-572.
   - Recommendation: Resolve immediately after spawn (matching Windows semantics). The `'close'` handler only needs to reject for error cases (126, other non-zero).

2. **UserCanceled import in elevated.ts — which module?**
   - What we know: `UserCanceled` is in `src/renderer/src/util/CustomErrors.ts` (re-exports from `@vortex/shared/errors`). `elevated.ts` currently imports `{ getErrorCode, getErrorMessageOrDefault, unknownToError }` from `@vortex/shared`.
   - Recommendation: Add `import { UserCanceled } from "./CustomErrors";` — the same relative import used in symlink_activator_elevate.

---

## Sources

### Primary (HIGH confidence)
- Direct source inspection: `src/renderer/src/util/elevated.ts` — full runElevated implementation reviewed
- Direct source inspection: `src/renderer/src/util/winapi-shim.ts` — ShellExecuteEx throw confirmed at line 95-99
- Direct source inspection: `src/renderer/src/util/ipc.ts` — getIPCPath confirmed correct for Linux
- Direct source inspection: `node_modules/gamebryo-savegame/src/gamebryosavegame.cpp` — MoreInfoException at line 24 confirmed
- Direct source inspection: `node_modules/gamebryo-savegame/binding.gyp` — no Linux condition confirmed
- Direct source inspection: `patches/loot@6.2.1.patch` — pnpm patch format reference
- Direct source inspection: `pnpm-workspace.yaml` — catalog entry, patchedDependencies format, gamebryo-savegame version
- Direct source inspection: `.github/workflows/main.yml:50` — current apt step (liblz4-dev present, zlib1g-dev absent)
- Direct source inspection: `src/main/electron-builder.config.cjs:65-68` — current deb.depends
- Direct source inspection: `src/renderer/src/extensions/symlink_activator_elevate/index.ts` — IPC server start + runElevated call ordering confirmed
- Direct source inspection: `src/renderer/src/__tests__/elevated.test.js` — existing Jest test; winapi-bindings mock pattern
- Direct source inspection: `src/renderer/vitest.config.mts` — Vitest include/exclude patterns
- Environment probe: pkexec 124, liblz4-dev 1.9.4, zlib1g-dev 1.3, liblz4-1 1.9.4, zlib1g 1.3 — all available locally

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 3 decision log: gamebryo-savegame disabled on Linux with two compile errors identified
- `.planning/phases/09-native-addon-fix-elevation-foundation/09-CONTEXT.md` — canonical implementation decisions D-01 through D-05 and ELEV specifics

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools (pnpm patch, child_process, @electron/rebuild) are existing project tools; no new dependencies
- Architecture: HIGH — source files read directly; C++ fix is minimal and verifiable; pkexec exit codes are documented POSIX behavior
- Pitfalls: HIGH — each pitfall verified against actual source state (zlib1g-dev missing from CI confirmed by reading main.yml; pnpm patch version format confirmed by inspecting loot patch and package.json)

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable tools; no fast-moving dependencies)
