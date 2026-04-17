# Phase 19: Staging Directory Wiring - Research

**Researched:** 2026-04-16
**Domain:** Electron/React renderer — platform-guarded string and logic changes in mod_management, firststeps_dashlet, and gamemode_management extensions
**Confidence:** HIGH

## Summary

Phase 19 is four surgical Linux platform guards across five source files. All decisions are locked in CONTEXT.md — no new dependencies, no new abstractions. The work is wiring, not design: flip one condition, replace one Windows API call in a try/catch, add a device-walk, and add three conditional string branches.

The primary technical risk is the existing `todos.test.ts` assertion `expect(result).toBe(false)` for `minDiskSpace` on Linux — Phase 19 flips that to `true`, so the test must be updated in the same wave as the source change or CI breaks. A secondary risk is that `Settings.tsx:suggestPath()` (line 1140-1165) has its own `winapi.GetVolumePathName` call for the different-drive case that CONTEXT.md does not address explicitly — research confirms this is a separate UI code path from `discovery.ts:suggestStagingPath()` and may need its own Linux guard.

**Primary recommendation:** Implement in two waves — Wave 1: ONBRD-02a (todos condition flip + test update), ONBRD-02b (partition check statAsync walk), ONBRD-02c (string replacements). Wave 2: ONBRD-02d (device-aware suggestStagingPath). Keep each wave atomic so CI stays green.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `minDiskSpace()` on Linux returns `true` unconditionally (always show todo) — not checking actual disk space.
**D-02:** Both `download-location` and `mod-location` todos become always-visible on Linux.
**D-03:** Replace `winapi.GetVolumePathName(instPath)` + Windows error-code-2 check in `stagingDirectory.ts` with a statAsync walk up from `instPath` until an accessible ancestor is found. If no ancestor exists up to `/`, set `partitionExists = false`.
**D-04:** The statAsync walk is Linux-only — Windows keeps `winapi.GetVolumePathName` unchanged.
**D-05:** `suggestStagingPath()` on Linux: stat both `modPaths['']` (walking up on ENOENT) and `getVortexPath('userData')`. Same `stat.dev` → use `{USERDATA}/{game}/mods`. Different `stat.dev` → walk up from `modPaths['']` until `stat.dev` changes, then suggest `{mountpoint}/{suggestInstallPathDirectory}/{game}`.
**D-06:** Use `state.settings.mods.suggestInstallPathDirectory` (defaults to `'vortex_mods'`) for the folder name.
**D-07:** The mountpoint walk uses `statSync.dev` identity — walk parent dirs until `stat.dev` changes, step back one level.
**D-08:** Three locations get Linux path example replacements:
  - `texts.ts` downloads case: `C:\Users\Mike\AppData\Roaming\Vortex\Downloads\` → `~/.local/share/Vortex/downloads`
  - `texts.ts` modspath case: `d:\vortex_mods\{GAME}` → `~/.local/share/Vortex/mods/{GAME}`
  - `Settings.tsx` staging toggle tooltip: both `c:\Users\<username>...` and `<drive>:\{suggestionPattern}\<game id>` → `~/.local/share/Vortex/<game>` and `/{mountpoint}/vortex_mods/<game id>`
**D-09:** Platform guard pattern: `process.platform === 'linux'` wrapping the entire interpolated string.

### Claude's Discretion

- Exact wording of Linux example strings (`~/.local/share` preferred for readability).
- Whether to add `log('debug', ...)` at the `suggestStagingPath` Linux branch.
- Whether the statAsync walk in the partition check uses a loop or recursion.

### Deferred Ideas (OUT OF SCOPE)

- Actual disk-space check on Linux using `statfs()` (always-visible is sufficient for v7.0).
- `/proc/mounts` parsing for more accurate mountpoint detection.
- Full drive enumeration from `/proc/mounts` for getDriveList.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBRD-02a | `mod-location` and `download-location` todos visible on Linux | One-line change: `minDiskSpace()` returns `true` on Linux; existing value renderer already handles Linux path |
| ONBRD-02b | `stagingDirectory.ts` partition-exists check uses Linux-native statAsync (not Windows error code 2) | `fs.statAsync` already imported in stagingDirectory.ts; walk pattern modeled on `idModPath()` in discovery.ts |
| ONBRD-02c | Windows path examples in `texts.ts` and `Settings.tsx` replaced with Linux-appropriate paths under platform guard | Three `t()` call sites need conditional string; all within `process.platform === 'linux'` ternary |
| ONBRD-02d | `suggestStagingPath()` uses device-aware logic on Linux via `statSync.dev` comparison | `fs.statAsync` already used in discovery.ts; `idModPath()` pattern provides the walk skeleton |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Disk-space todo visibility (ONBRD-02a) | Renderer (React/Redux) | — | `todos.tsx` is a renderer extension; condition function runs in renderer process |
| Partition-exists check (ONBRD-02b) | Renderer (React/Redux) | — | `stagingDirectory.ts` runs in renderer process; uses renderer-side `fs.statAsync` wrapper |
| Path example strings (ONBRD-02c) | Renderer (React/Redux) | — | `texts.ts` and `Settings.tsx` are renderer UI code |
| Device-aware staging suggestion (ONBRD-02d) | Renderer (React/Redux) | — | `suggestStagingPath()` is a renderer utility function called from `stagingDirectory.ts` |

All four changes are purely within the renderer extension layer. No main-process IPC, no preload changes, no new cross-process communication.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `../../util/fs` (Vortex) | project-internal | `statAsync` for filesystem checks | Already imported in both target files; Bluebird-wrapped with Wine-prefix handling |
| `path` (Node) | built-in | `path.dirname` for parent walk | Already imported everywhere |
| `process.platform` | built-in | Linux guard | Established pattern across codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.0 | Test runner for renderer | All `.test.ts` files under `src/renderer/src/` |
| `vi.mock` | vitest | Mock `../../util/fs` for statAsync | Used when testing statAsync-dependent paths |

**Installation:** No new packages required.

## Architecture Patterns

### System Architecture Diagram

```
User opens Vortex on Linux
        |
        v
firststeps_dashlet/todos.tsx
  minDiskSpace(MIN_DISK_SPACE, key)
        |
   [platform check]
   process.platform === 'linux'
        |
        v (returns true always -- todo visible)
  condition: true -> todo card renders
  value: raw path from props (Phase 18)
        |
        v
User configures staging directory
        |
        v
mod_management/stagingDirectory.ts
  ensureStagingDirectoryImpl()
        |
   [platform check]
   process.platform === 'win32'?
   +-- YES -> winapi.GetVolumePathName (unchanged)
   +-- NO  -> statAsync walk up from instPath
              until accessible ancestor or '/'
              partitionExists = (ancestor found)
        |
        v
  (existing dialog logic -- unchanged)
        |
        v
User sees staging path suggestion
        |
        v
gamemode_management/util/discovery.ts
  suggestStagingPath()
        |
   [platform check -- Linux]
   stat modPaths[''] (walk up on ENOENT)
   stat userData
   same dev? -> {USERDATA}/{game}/mods
   diff dev?  -> walk up modPath until dev changes
               -> {mountpoint}/{suggestInstallPathDirectory}/{game}
        |
        v
mod_management/texts.ts (ONBRD-02c)
  t("... example path ...") calls
  process.platform === 'linux'
  ? "<linux example>"
  : "<windows example>"

mod_management/views/Settings.tsx (ONBRD-02c)
  staging toggle More tooltip
  process.platform === 'linux'
  ? "~/.local/share/Vortex/<game> ... /{mountpoint}/vortex_mods/<game id>"
  : "c:\\Users\\<username>... <drive>:\\{suggestionPattern}\\<game id>"
```

### Recommended Project Structure

No structural changes -- all work is modifications to existing files:

```
src/renderer/src/extensions/
+-- firststeps_dashlet/
|   +-- todos.tsx                    # ONBRD-02a: minDiskSpace() line 23 (false->true on linux)
|   +-- todos.test.ts                # update assertion: expects true not false on linux
+-- mod_management/
|   +-- stagingDirectory.ts          # ONBRD-02b: lines 155-167 partition check
|   +-- texts.ts                     # ONBRD-02c: lines 85-118 downloadspath + modspath cases
|   +-- views/Settings.tsx           # ONBRD-02c: lines 219-233 staging toggle tooltip
+-- gamemode_management/
    +-- util/discovery.ts            # ONBRD-02d: suggestStagingPath() lines 832-873
```

### Pattern 1: Linux platform guard (established, CLAUDE.md pattern)

**What:** `if (process.platform === 'linux') { ... }` or ternary `process.platform === 'linux' ? linuxStr : windowsStr`
**When to use:** Any code path that diverges between Linux and Windows
**Example:**
```typescript
// Source: src/renderer/src/extensions/firststeps_dashlet/todos.tsx (existing)
function minDiskSpace(required: number, key: string) {
  return (props) => {
    if (process.platform !== "win32") {
      return false;  // Phase 19: change to `return true`
    }
    // ... winapi path
  };
}
```

### Pattern 2: statAsync parent walk (established, discovery.ts idModPath pattern)

**What:** Recursively walk up directory tree using `fs.statAsync` until a condition is met or root is reached
**When to use:** When you need to find the nearest accessible ancestor or mountpoint boundary
**Example:**
```typescript
// Source: discovery.ts idModPath() -- ENOENT walk pattern
const idModPath = async (testPath: string) => {
  try {
    statModPath = await fs.statAsync(testPath);
  } catch (err) {
    const code = getErrorCode(err);
    if (code === "ENOENT") {
      await idModPath(path.dirname(testPath));
    } else {
      throw err;
    }
  }
};
```

For the partition-exists walk (ONBRD-02b), the termination condition is reaching `/` with no accessible ancestor -- stop when `path.dirname(current) === current` (root reached).

For the mountpoint-boundary walk (ONBRD-02d), the termination condition is `stat.dev` changing between current and parent -- the current dir is the mountpoint root.

### Pattern 3: String ternary with platform guard (established, Phase 18 pattern D-09)

**What:** Entire `t()` argument wrapped in ternary on `process.platform === 'linux'`
**When to use:** Help text or tooltip strings with OS-specific path examples
**Example:**
```typescript
// Pattern from CONTEXT.md D-09
return t(
  process.platform === 'linux'
    ? "Linux-specific text with ~/.local/share/Vortex/..."
    : "Windows text with C:\\Users\\Mike\\..."
);
```

### Anti-Patterns to Avoid

- **Per-substring substitution:** Do not replace `C:\Users\Mike` with `~/.local/share` inside the same string. Add a separate Linux branch; Windows text stays byte-for-byte identical to avoid staling locale caches (CLAUDE.md constraint).
- **Deleting Windows text:** Windows arm of every guard must be the unchanged original string -- platform guard is additive.
- **Using `process.platform !== 'win32'` for the ONBRD-02b guard:** CONTEXT.md D-04 uses `process.platform === 'win32'` to keep Windows path, so use `else` -- matches established codebase style.
- **Infinite recursion on `/`:** The partition walk must check `path.dirname(current) === current` to stop at filesystem root.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bluebird-wrapped stat | Custom promisify | `fs.statAsync` from `../../util/fs` | Already handles Wine prefix paths, retry logic |
| Platform string branching | Custom OS detection | `process.platform === 'linux'` | Node/Electron built-in -- zero deps |
| Parent dir traversal | Custom path manipulation | `path.dirname()` | Standard Node built-in; already imported |

**Key insight:** Every tool needed already exists in the codebase. No new imports in any file except where `path` might not be imported (check `stagingDirectory.ts` -- `path` is imported on line 1).

## Common Pitfalls

### Pitfall 1: Existing `todos.test.ts` assertion will fail after ONBRD-02a
**What goes wrong:** `todos.test.ts` line 78 expects `result` to be `false` on Linux for `minDiskSpace`. Changing `minDiskSpace()` to return `true` on Linux without updating the test breaks CI.
**Why it happens:** The test was written in Phase 18 to validate the `false` return. Phase 19 flips it.
**How to avoid:** Update the test assertion in the same commit as the source change.
**Warning signs:** CI failing with `AssertionError: expected false to be true` in `todos.test.ts`.

### Pitfall 2: Settings.tsx `suggestPath()` has its own `winapi.GetVolumePathName` call
**What goes wrong:** CONTEXT.md D-05 targets `discovery.ts:suggestStagingPath()` but `Settings.tsx:suggestPath()` (line 1156) also calls `winapi.GetVolumePathName(modPaths[''])` for the different-drive case. On Linux this would throw (or return undefined from shim), causing an unhandled error in the settings panel.
**Why it happens:** There are two independent code paths that compute staging path suggestions: one in `discovery.ts` (used at game setup time) and one in `Settings.tsx` (used when the user clicks "Suggest Path" manually in settings).
**How to avoid:** Add a Linux guard to `Settings.tsx:suggestPath()` as well. The device comparison logic at lines 1152-1157 already does `modPathStats.dev === userDataStats.dev` -- the Linux arm just needs to replace `winapi.GetVolumePathName(modPaths[''])` with the same mountpoint walk from `discovery.ts`.
**Warning signs:** Crash or error dialog when user clicks "Suggest Path" in Settings on Linux.

### Pitfall 3: `suggestStagingPath()` line 859 -- `process.platform !== 'win32'` short-circuit
**What goes wrong:** The current condition `statModPath.dev === statUserData.dev || process.platform !== 'win32'` always takes the `{USERDATA}` branch on Linux regardless of actual device. Phase 19 must replace the `|| process.platform !== 'win32'` part with actual Linux device logic.
**Why it happens:** The short-circuit was a placeholder -- it prevented the `winapi.GetVolumePathName` call on Linux (which would fail) but didn't implement correct behavior.
**How to avoid:** Replace the `if` condition entirely: on Linux, do the device walk; don't preserve the `|| process.platform !== 'win32'` short-circuit.
**Warning signs:** Users on multi-drive Linux setups always get `{USERDATA}` suggestion even when game is on a different device.

### Pitfall 4: statAsync walk recursion hitting root on Windows
**What goes wrong:** The `partitionExists` statAsync walk (ONBRD-02b) is Linux-only per D-04, so it only runs in the `else` branch. No risk on Windows. But on Linux, walking up from a path like `/mnt/games/staging` must stop at `/` -- `path.dirname('/')` returns `'/'` (same value), so the recursion termination check `path.dirname(current) === current` is the correct stop condition.
**Why it happens:** Infinite recursion if root-check is missed.
**How to avoid:** Always check `path.dirname(current) === current` before recursing.

### Pitfall 5: `texts.ts` -- `t()` calls must keep Linux string through `t()`, not raw string
**What goes wrong:** Adding a raw string without wrapping in `t()` breaks i18n -- even for platform-guarded strings.
**Why it happens:** UI-SPEC notes "All strings passed through `t()` -- i18n required even for platform-guarded arms."
**How to avoid:** Pattern: `t(process.platform === 'linux' ? "linux text" : "windows text")`. The ternary is INSIDE `t()`.

## Code Examples

Verified patterns from source files:

### ONBRD-02a: minDiskSpace flip (todos.tsx line 22-23)
```typescript
// Source: todos.tsx (current -- Phase 18 output)
function minDiskSpace(required: number, key: string) {
  return (props) => {
    if (process.platform !== "win32") {
      return false;  // Change to: return true;
    }
    // ... rest unchanged
  };
}
```

### ONBRD-02b: Partition-exists Linux walk (stagingDirectory.ts)
```typescript
// Source: stagingDirectory.ts lines 155-167 (current -- winapi call)
// Pattern after change:
let partitionExists = true;
if (process.platform === "win32") {
  try {
    winapi.GetVolumePathName(instPath);
  } catch (err) {
    if (isErrorWithSystemCode(err) && err.systemCode === 2) {
      partitionExists = false;
    }
  }
} else {
  // Linux: walk up until accessible ancestor or root
  const findAccessibleAncestor = async (checkPath: string): Promise<boolean> => {
    try {
      await fs.statAsync(checkPath);
      return true;
    } catch {
      const parent = path.dirname(checkPath);
      if (parent === checkPath) {
        // Reached filesystem root with no accessible dir
        return false;
      }
      return findAccessibleAncestor(parent);
    }
  };
  partitionExists = await findAccessibleAncestor(instPath);
}
```

Note: `ensureStagingDirectoryImpl` is already `async` so `await` works here.

### ONBRD-02d: suggestStagingPath device-aware logic (discovery.ts)
```typescript
// Source: discovery.ts lines 857-872 (current)
// Replace the if condition:
if (statModPath.dev === statUserData.dev) {
  // same device -- use userData subdirectory
  suggestion = path.join("{USERDATA}", "{game}", "mods");
} else if (process.platform !== "win32") {
  // Linux, different device -- find mountpoint of game drive
  const findMountpoint = async (checkPath: string): Promise<string> => {
    const parent = path.dirname(checkPath);
    if (parent === checkPath) return checkPath;
    const parentStat = await fs.statAsync(parent);
    if (parentStat.dev !== statModPath.dev) return checkPath;
    return findMountpoint(parent);
  };
  const mountpoint = await findMountpoint(modPaths[""]);
  suggestion = path.join(
    mountpoint,
    state.settings.mods.suggestInstallPathDirectory,
    "{game}",
  );
} else {
  // Windows, different drive
  const volume = winapi.GetVolumePathName(modPaths[""]);
  suggestion = path.join(
    volume,
    state.settings.mods.suggestInstallPathDirectory,
    "{game}",
  );
}
```

### ONBRD-02c: texts.ts string with Linux guard
```typescript
// Source: texts.ts lines 85-99 (current)
case "downloadspath": {
  return t(
    process.platform === "linux"
      ? "The downloads folder holds all mod archives you have downloaded with Vortex. It is shared across all " +
        "games and includes a subfolder for each of them. e.g. if your downloads folder is set to\n" +
        '"~/.local/share/Vortex/downloads", archive files for Skyrim will be stored in: "~/.local/share/Vortex/downloads/skyrim".\n' +
        "By default Vortex will select a user data directory that is guaranteed to have write access.\n" +
        "When changing the Downloads Folder, the downloads for all your games will be moved to the new location " +
        "automatically. Make sure the new location has plenty of available space and that you have permission " +
        "to write files to it.\n" +
        'You can use "variables" to save yourself some typing:\n' +
        " - {USERDATA} is replaced with your user data directory.\n" +
        "e.g. {USERDATA} is ~/.local/share/Vortex so {USERDATA}/downloads will be: ~/.local/share/Vortex/downloads"
      : "The downloads folder holds all mod archives..." // unchanged Windows text
  );
}
```

Note per UI-SPEC: ternary is INSIDE `t()`. The windows text is preserved byte-for-byte.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `minDiskSpace()` returns `false` on Linux (todos hidden) | Returns `true` (always visible) | Phase 19 | mod-location and download-location todos now show on Linux |
| `winapi.GetVolumePathName` for partition check | `statAsync` walk (Linux) | Phase 19 | Correct "missing directory" dialog on Linux |
| `process.platform !== 'win32'` short-circuit in `suggestStagingPath` | Device-aware walk | Phase 19 | Multi-drive Linux setups get correct staging suggestion |

**Deprecated/outdated after Phase 19:**
- `process.platform !== 'win32'` short-circuit in `suggestStagingPath()` line 859: replaced with real Linux logic

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Settings.tsx:suggestPath()` also needs a Linux guard for its `winapi.GetVolumePathName` call | Common Pitfalls #2, Code Examples | On Linux, clicking "Suggest Path" in Settings crashes or silently fails; not caught by CONTEXT.md decisions |

**Note:** A1 is a gap in CONTEXT.md scope. The decisions cover `discovery.ts:suggestStagingPath()` but `Settings.tsx:suggestPath()` has an independent call. The planner should decide whether to include this in Phase 19 scope or defer to Phase 20.

## Open Questions (RESOLVED)

1. **Does `Settings.tsx:suggestPath()` need a Linux guard in Phase 19?**
   - What we know: The method at line 1140 calls `winapi.GetVolumePathName(modPaths[''])` (line 1156) for the different-drive case. On Linux, `winapi` is shimmed and this call may throw or return undefined.
   - What's unclear: Whether the method is reachable in the current Linux flow (user would have to manually click a "Suggest Path" button if it exists in the Settings UI). Check `Settings.tsx` for whether the suggest path button is exposed on Linux.
   - Recommendation: Check if the "Suggest Path" UI button is behind a platform guard or accessible on Linux. If accessible, add the Linux guard in Phase 19 to avoid a crash.
   - **RESOLVED:** Settings.tsx `suggestPath()` guard included in Phase 19 (Plan 02 Task 2). The "Suggest" button is not behind a platform guard and is reachable on Linux. The Linux guard adds a `stat.dev` mountpoint walk mirroring the discovery.ts pattern, with `modDirStat = await fs.statAsync(modPaths[""])` for correct device detection.

2. **Should `suggestStagingPath()` mountpoint walk be a loop or recursion?**
   - What we know: CONTEXT.md says Claude's Discretion. `idModPath()` uses recursion.
   - What's unclear: Whether Bluebird/Electron has any stack depth concerns for deep paths (unlikely on real filesystems).
   - Recommendation: Use a `while` loop for the mountpoint walk -- clearer termination condition and avoids any tail-call concerns.
   - **RESOLVED:** `while` loop chosen for mountpoint walk (Claude's discretion per CONTEXT.md). Used in both discovery.ts and Settings.tsx. Clearer termination and no tail-call concerns.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies -- all changes are platform-guarded code modifications to existing files; no new CLI tools, services, or runtimes required)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` |
| Quick run command | `pnpm vitest run src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` |
| Full suite command | `pnpm vitest run --project renderer` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-02a | `minDiskSpace()` returns `true` on Linux | unit | `pnpm vitest run src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | Yes (update existing) |
| ONBRD-02a | `minDiskSpace()` still returns `false` on win32 when space sufficient | unit | same | Yes (update existing) |
| ONBRD-02b | `partitionExists` set `false` when no ancestor accessible on Linux | unit | `pnpm vitest run src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` | Wave 0 (19-00-PLAN) |
| ONBRD-02b | Windows partition check unchanged (winapi path still taken on win32) | unit | same | Wave 0 (19-00-PLAN) |
| ONBRD-02c | `texts.ts` downloadspath returns Linux path example on Linux | unit | `pnpm vitest run src/renderer/src/extensions/mod_management/texts.test.ts` | Wave 0 (19-00-PLAN) |
| ONBRD-02c | `texts.ts` downloadspath returns Windows path example on win32 | unit | same | Wave 0 (19-00-PLAN) |
| ONBRD-02d | `suggestStagingPath()` returns `{USERDATA}` path when same device | unit | `pnpm vitest run src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` | Wave 0 (19-00-PLAN) |
| ONBRD-02d | `suggestStagingPath()` returns mountpoint-based path when different device | unit | same | Wave 0 (19-00-PLAN) |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/renderer/src/extensions/firststeps_dashlet/todos.test.ts`
- **Per wave merge:** `pnpm vitest run --project renderer`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` -- covers ONBRD-02b (partition check Linux path)
- [ ] `src/renderer/src/extensions/mod_management/texts.test.ts` -- covers ONBRD-02c (string platform guards)
- [ ] `src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` -- covers ONBRD-02d (device-aware suggestStagingPath)

**Existing tests requiring update (not Wave 0 gaps):**
- [ ] `todos.test.ts` lines 70-80 -- assertion `expect(result).toBe(false)` must become `expect(result).toBe(true)` for Linux minDiskSpace

## Security Domain

This phase contains no authentication, session management, cryptography, or access control changes. All changes are UI-layer string swaps and pure fs.stat calls (read-only filesystem queries). No ASVS categories apply.

V5 Input Validation: N/A -- no user-supplied input is parsed or stored by any of the four changes.

## Sources

### Primary (HIGH confidence)
- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` -- Read directly; lines 20-42 (minDiskSpace), 93-160 (download-location, mod-location todos)
- `src/renderer/src/extensions/mod_management/stagingDirectory.ts` -- Read directly; lines 155-167 (partition check)
- `src/renderer/src/extensions/gamemode_management/util/discovery.ts` -- Read directly; lines 832-873 (suggestStagingPath)
- `src/renderer/src/extensions/mod_management/texts.ts` -- Read directly; lines 85-118 (downloadspath, modspath)
- `src/renderer/src/extensions/mod_management/views/Settings.tsx` -- Read directly; lines 219-233 (tooltip), lines 1140-1165 (suggestPath method)
- `src/renderer/src/util/fs.ts` -- Read directly; lines 810-822 (statAsync), line 38 (node:fs/promises import)
- `src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` -- Read directly; lines 70-80 (minDiskSpace Linux assertion)
- `.planning/phases/19-staging-directory-wiring/19-CONTEXT.md` -- Locked decisions D-01 through D-09
- `.planning/phases/19-staging-directory-wiring/19-UI-SPEC.md` -- Approved copywriting contract

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` -- Accumulated context; Phase 18 decisions confirming `minDiskSpace` was deliberately set to `false` on Linux

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in project, verified by source reads
- Architecture: HIGH -- source files read directly, no inference required
- Pitfalls: HIGH (Pitfalls 1-4) / MEDIUM (Pitfall 5 `Settings.tsx:suggestPath`) -- direct code reading vs. inference about code path reachability

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable codebase; no upstream churn expected in these files)
