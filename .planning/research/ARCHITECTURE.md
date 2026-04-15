# Architecture Research

**Domain:** Electron mod manager — native addon Linux port + Linux privilege elevation
**Researched:** 2026-04-01 (v3.0), updated 2026-04-15 (v6.0)
**Milestone:** v3.0 — gamebryo-savegame Linux compilation + pkexec elevation (original)
**Milestone:** v6.0 — chattr+F dual-path fs layer + upstream rebase CI (added 2026-04-15)
**Confidence:** HIGH (all findings from direct source inspection)

---

## System Overview

```
┌───────────────────────────────────────────────────────────────┐
│                 Renderer Process (React/Redux)                 │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Extension: gamebryo-savegame-management               │   │
│  │    index.ts → refreshSavegames()                       │   │
│  │      → savegameLib.create(filePath, cb)  ← C++ addon   │   │
│  │         loaded in-process, no IPC crossing             │   │
│  │         returns parsed save data via Node-style cb     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  util/elevated.ts  — runElevated()                     │   │
│  │    Windows: ShellExecuteEx (UAC) + named pipe          │   │
│  │    Linux (ELEV-01): pkexec spawn + Unix socket         │   │
│  │    Linux (ELEV-02): isSteamOS() detection + sudo path  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  util/ipc.ts — getIPCPath(id)                          │   │
│  │    Windows: \\?\pipe\{id}                              │   │
│  │    Linux:   /tmp/vortex-{id}.sock  (already done v1)   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│            Preload (context bridge — no elevation code)       │
├───────────────────────────────────────────────────────────────┤
│                      Main Process                             │
│  Application.ts, ipcHandlers.ts, persistence                  │
│  (No save game or elevation logic lives here)                 │
└───────────────────────────────────────────────────────────────┘

Elevated child (Linux ELEV-01/02):
  pkexec → node --run /tmp/serialized-closure.js
    └── JsonSocket.connect("/tmp/vortex-{id}.sock")
         └── IPC protocol: initialised / command / completed / quit
```

### Component Responsibilities

| Component | Responsibility | Process |
|-----------|----------------|---------|
| `extensions/gamebryo-savegame-management/` | Save listing, screenshot, plugin restore UI | Renderer |
| `node-gamebryo-savegames` (native addon) | C++ parser for .ess/.fos save files | Renderer (in-process) |
| `util/elevated.ts` — `runElevated()` | Serialize closure to temp file, spawn elevated child, resolve after spawn | Renderer |
| `util/ipc.ts` — `getIPCPath()` | Platform-correct socket/pipe path | Renderer + child |
| `winapi-shim.ts` — `ShellExecuteEx` | Currently throws on Linux; replaced by pkexec branch in elevated.ts | Renderer |
| `symlink_activator_elevate/index.ts` | Elevated symlink deployment; already disabled on Linux via `isSupported()` | Renderer |
| `symlink_activator_elevate/remoteCode.ts` | Serialized child-process code; handles link-file/remove-link over IPC | Child process |

---

## Q1 — gamebryo-savegame Integration Points

### Where It Is Loaded

`gamebryo-savegame` is a C++ native addon (node-gyp, node-addon-api 7). It is loaded **directly
inside the renderer process** by the `gamebryo-savegame-management` extension:

```typescript
// extensions/gamebryo-savegame-management/src/util/refreshSavegames.ts
import * as savegameLib from "gamebryo-savegame";

savegameLib.create(filePath, !full, (err, sg) => {
  // parse result → Redux dispatch
});
```

**No IPC boundary is crossed.** The addon `.node` file is `require()`-ed in the renderer, executed inline,
and returns parsed data via a Node-style callback. Redux store updates happen directly from the callback.

The native addon is managed via `scripts/manage-node-modules.js` at path:
`extensions/gamebryo-savegame-management/node_modules/gamebryo-savegame`
Repository: `https://github.com/Nexus-Mods/node-gamebryo-savegames.git`

The built `.node` file is copied to `extensions/gamebryo-savegame-management/dist/` during the
`_native` build script step. On Linux, the `.dll` copy commands in that script are no-ops; the
`.node` file copy still needs to work once the addon compiles.

### Where the Linux Fix Must Land

The fix belongs in the **native addon repository** (`node-gamebryo-savegames`). Two separate
problems must be fixed:

**Problem 1 — MSVC-only exception constructor (`gamebryosavegame.cpp`)**

```cpp
// Current code (MSVC extension — not standard C++):
class MoreInfoException : public std::exception {
public:
  MoreInfoException(const char *message, ...)
    : std::exception(std::runtime_error(message))  // fails on GCC/Clang
```

`std::exception` has no constructor accepting another exception object on GCC/Clang.
Fix: inherit from `std::runtime_error` directly (same pattern used by `DataInvalid` in
`gamebryosavegame.h`). The message string then passes through `std::runtime_error::what()`.

The rest of the file is already Linux-compatible: `#ifdef _WIN32` guards cover `_wstat` and the
wide-char `fstream` open. `string_cast.h` already provides `std::string`-returning stubs for
`toWC`/`toMB` on non-Windows via its own `#else` branch. No changes needed in `string_cast.h`.

**Problem 2 — Missing Linux linker flags (`binding.gyp`)**

The current `conditions` block has only `'OS=="win"'`. There is no Linux block.
On Linux, the build succeeds but links without `lz4` or `zlib`, causing undefined symbols.

Fix — add an `'OS=="linux"'` conditions block:

```json
['OS=="linux"', {
  "libraries": ["<!@(pkg-config --libs liblz4 zlib)"],
  "cflags": ["<!@(pkg-config --cflags liblz4 zlib)"]
}]
```

`liblz4-dev` and `zlib1g-dev` are standard Ubuntu packages; both are available in the devcontainer.
The devcontainer already installs similar packages for the loot addon (`cmake`, `cargo`, etc.).

**Build script guard in `package.json`**

The extension's `build` and `dist` scripts early-exit on non-Windows:

```json
"build": "node -e \"if(process.platform==='win32')process.exit(1)\" || (pnpm run _build ...)"
```

This guard must be removed in the same commit that fixes `binding.gyp` so CI builds the Linux
addon. Removing it before the gyp fix would cause CI to attempt compiling the broken addon.

---

## Q2 — pkexec + Unix Domain Socket Elevation (ELEV-01)

### Current Architecture (Windows)

`runElevated()` in `util/elevated.ts` works as:

1. Serialize a JS closure + the `elevatedMain` harness into a temp `.js` file.
2. Call `winapi.ShellExecuteEx({ verb: "runas", file: process.execPath, parameters: "--run <tmpPath>" })`.
3. The elevated child spawns, connects to `getIPCPath(ipcPath)` (a named pipe on Windows).
4. The parent `net.Server` receives `{ message: "initialised" }` and unblocks.

On Linux, `ShellExecuteEx` throws (winapi-shim stub). The rest of the architecture is **already
correct for Linux**:

- `getIPCPath(id)` already returns `/tmp/vortex-{id}.sock` on Linux (implemented in v1.0).
- The `net.Server` / `JsonSocket` protocol works identically over Unix domain sockets.
- The temp file serialization is platform-neutral.
- `process.execPath` on Linux Electron is the Electron binary, which accepts `--run <script>`.

### IPC Handshake Protocol (unchanged on Linux)

```
Parent: net.Server.listen("/tmp/vortex-{id}.sock")
  Child connects (via JsonSocket)
  Child → Parent:  { message: "initialised", payload: { pid } }
  Parent resolves the startElevated() promise

  [For each operation:]
  Parent → Child:  { message: "link-file",    payload: { source, destination, num } }
  Child  → Parent: { message: "completed",    payload: { err: null, num } }

  Parent → Child:  { message: "quit" }
  Child closes socket, process.exit(0)
```

The `remoteCode.ts` (serialized child-process harness) is already correct — it uses only
`req("fs")`, `req("net")`, `req("json-socket")`, all available in the Electron runtime.

### Linux Branch Implementation

The single file change is in `util/elevated.ts`, replacing the `winapi.ShellExecuteEx(...)` call
with a platform branch:

```typescript
// After writing the temp file:
if (process.platform === "linux") {
  const { spawn } = require("child_process") as typeof import("child_process");
  const child = spawn("pkexec", [process.execPath, "--run", tmpPath], {
    detached: true,
    stdio: "ignore",
  });
  child.on("exit", (code) => {
    if (code === 126) {
      // pkexec exit 126 = user dismissed the polkit dialog
      // The IPC server will time out; callers handle rejection via their catch blocks
    }
  });
  child.unref();
  return resolve(tmpPath);
} else {
  winapi.ShellExecuteEx({
    verb: "runas",
    file: process.execPath,
    parameters: `--run ${tmpPath}`,
    directory: path.dirname(process.execPath),
    show: "shownormal",
  });
  return resolve(tmpPath);
}
```

**User-cancellation mapping:** On Windows, `ShellExecuteEx` throws `systemCode: 1223` when the
user dismisses UAC. pkexec exits with code `126` when the user cancels the polkit dialog. The
existing callers already wrap `runElevated()` with `.catch()` handlers checking for `UserCanceled`.
The Linux branch must emit a detectable signal — either via the `child.on("exit")` handler setting
a flag that causes the IPC server timeout to reject with `UserCanceled`, or by listening to the
pkexec process exit before the IPC server timeout fires.

**`symlink_activator_elevate` is already Linux-safe:** Its `isSupported()` method returns
`"Elevation not required on non-windows systems"` when `process.platform !== "win32"`. The
`context.once()` block also guards `process.platform === "win32"` before calling
`winapi.CheckYourPrivilege()`. No changes needed in `symlink_activator_elevate`.

**Other ELEV-01 call sites** (from grep of `runElevated` in renderer source):
- `util/fs.ts` — elevated filesystem operations for mod deployment (primary target for ELEV-01)
- `ExtensionManager.ts` — `runElevated()` for custom tool elevation
- `symlink_activator_elevate/index.ts` — already Windows-only guarded (no change needed)

---

## Q3 — SteamOS Polkit-Free Elevation (ELEV-02)

### Problem

SteamOS (Steam Deck) uses an immutable read-only OS partition. The `deck` user account is in
`wheel` but polkit authorization for arbitrary processes may not be configured in Gaming Mode.
More critically, `pkexec` on SteamOS requires unlocking the OS and is not reliably available
without user-initiated setup.

### Options Evaluated

**Option A: `sudo` with NOPASSWD**
Requires either a `/etc/sudoers.d/` entry (not writable on immutable OS) or user-manual setup.
Not reliable as an automatic path. Acceptable as opt-in fallback only.

**Option B: `flatpak-spawn --host`**
Only valid inside a Flatpak. Vortex distributes as AppImage. Not applicable.

**Option C: gamescope-session hooks**
No documented elevation mechanism. Not applicable.

**Option D: User-assisted sudo unlock (recommended for ELEV-02)**

The Steam Deck Desktop Mode setup allows unlocking the `deck` account and setting a sudo
password. Vortex can detect SteamOS and show a guided notification:
"Mod deployment to protected directories requires elevated privileges. On Steam Deck, follow
these steps to unlock sudo..."

Once the user has set a sudo password, elevation uses `spawn("sudo", [process.execPath, "--run", tmpPath])`.
The user is prompted by the system terminal/polkit agent at the OS level.

**Option E: Skip elevation on SteamOS when paths are user-owned (preferred first check)**

For Skyrim SE and Fallout 4 on Steam Deck, mod deployment targets are inside the Proton prefix
(`~/.steam/steam/steamapps/compatdata/...`) — fully user-owned. Elevation is only needed when
the game installation directory or staging folder requires root. For most Steam games on Steam
Deck this never happens. ELEV-02 should detect this case and skip elevation entirely.

### Recommended Architecture for ELEV-02

Layer the SteamOS detection as a pre-check inside the Linux branch:

```
runElevated() Linux branch (after ELEV-01):
  1. if isSteamOS() AND all affected paths are user-owned:
       → skip elevation, run closure directly as current user
         (wrap in a plain child_process.spawn without pkexec/sudo)
  2. if isSteamOS() AND elevation required:
       → offer sudo-based elevation with Steam Deck unlock notification
         (spawn("sudo", [process.execPath, "--run", tmpPath]))
  3. else (standard Linux):
       → pkexec spawn (ELEV-01 path)
```

**`isSteamOS()` — already implemented in `util/elevated.ts`:**

`isSteamOS()` lives at the top of `util/elevated.ts` (not a separate `util/platform.ts` — that
file does not exist). It reads `/etc/os-release`, caches the result in a module-level variable
`_isSteamOS`, and is called only from within the `process.platform === "linux"` branch.

ELEV-02 is a follow-on to ELEV-01 — building it before ELEV-01 means working against a stub that
throws, making end-to-end testing impossible.

---

## Q4 — Build Order (v3.0)

### Dependency Graph

```
SAVE-01 (binding.gyp + MoreInfoException fix)
    ↓ addon compiles on Linux CI
SAVE-02 (Skyrim SE save UI on Linux)
SAVE-03 (Fallout 4 save UI on Linux)

ELEV-01 (pkexec branch in elevated.ts)
    ↓ Linux elevation infrastructure exists
ELEV-02 (isSteamOS() + sudo/skip-elevation logic)
```

### Phase Structure

**Phase 1 — Parallel (no dependencies between tracks):**

| Track | Requirement | Files Changed |
|-------|-------------|---------------|
| A | SAVE-01: Fix binding.gyp + MoreInfoException | `node-gamebryo-savegames/binding.gyp`, `gamebryosavegame.cpp` |
| B | ELEV-01: pkexec branch in runElevated() | `util/elevated.ts`, possibly `winapi-shim.ts` comment update |

Track A touches only the native addon repo (C++, no TypeScript).
Track B touches only renderer TypeScript (no C++).
No shared files. Both can land on separate branches in `linux-port`.

**Phase 2 — Sequential (depends on Phase 1):**

| Requirement | Depends On | Files Changed |
|-------------|-----------|---------------|
| SAVE-02: Skyrim SE save UI | SAVE-01 (addon must load) | `gamebryo-savegame-management/package.json` build script guard removal |
| SAVE-03: Fallout 4 save UI | SAVE-01 (same addon, different save format) | Functional test only if SAVE-02 passes |
| ELEV-02: SteamOS path | ELEV-01 (Linux elevation infrastructure) | `util/elevated.ts`, new `util/platform.ts` |

**Why parallel in Phase 1:**

SAVE-01 is entirely in the native addon repo. ELEV-01 is entirely in main Vortex renderer
TypeScript. Neither blocks the other. Both ship as `linux-port` branch PRs.

**Why SAVE-02 after SAVE-01:**

The `gamebryo-savegame-management` build script exits early on Linux. The guard removal (the only
required TypeScript change for SAVE-02) only makes sense once the addon actually compiles.
After SAVE-01, SAVE-02 is primarily functional testing: does the save list render, does the
screenshot load, does plugin restore work. No new code is expected for SAVE-02 or SAVE-03
beyond removing the guard.

**Why ELEV-02 after ELEV-01:**

ELEV-02 adds `isSteamOS()` + alternate path inside the same `runElevated()` Linux branch created
by ELEV-01. Without ELEV-01 that branch does not exist.

---

## New vs. Modified Components (v3.0)

| Component | Status | Change |
|-----------|--------|--------|
| `node-gamebryo-savegames/binding.gyp` | **MODIFIED** | Add `'OS=="linux"'` block with `pkg-config` lz4/zlib flags |
| `node-gamebryo-savegames/src/gamebryosavegame.cpp` | **MODIFIED** | Fix `MoreInfoException` — inherit from `std::runtime_error` instead of calling `std::exception(runtime_error(...))` |
| `src/renderer/src/util/elevated.ts` | **MODIFIED** | Add `process.platform === "linux"` branch replacing `ShellExecuteEx` with `pkexec` spawn; add pkexec exit-126 → UserCanceled mapping |
| `src/renderer/src/util/platform.ts` | **NEW** | `isSteamOS()` helper (ELEV-02) |
| `src/renderer/src/util/elevated.ts` | **MODIFIED** (second pass) | Add ELEV-02: `isSteamOS()` check + user-owned path test + sudo fallback |
| `extensions/gamebryo-savegame-management/package.json` | **MODIFIED** | Remove `process.platform === 'win32'` early-exit guard from `build`/`dist` scripts |
| `src/renderer/src/util/winapi-shim.ts` | **MINOR UPDATE** | Update `ShellExecuteEx` stub comment (no longer "deferred" — now handled in elevated.ts) |
| `src/renderer/src/util/ipc.ts` | **UNCHANGED** | Already correct; Linux returns `/tmp/vortex-{id}.sock` since v1.0 |
| `src/renderer/src/extensions/symlink_activator_elevate/index.ts` | **UNCHANGED** | Already guarded — `isSupported()` returns "Elevation not required" on non-Windows |

---

## Data Flow Changes (v3.0)

### Save Game Load (after SAVE-01 + SAVE-02)

No data flow change. The flow is identical to Windows:

```
Profile change / window focus event
  → updateSaves(store, savesPath)
    → refreshSavegames(savesPath, onAddSavegame, ...)
      → turbowalk() discovers .ess/.fos files
        → savegameLib.create(filePath, callback)   ← C++ addon, in-process
          → callback({ saveNumber, characterName, level, plugins, ... })
            → store.dispatch(setSavegames([...]))
              → Redux state update → React re-render
```

The only change: `savegameLib.create()` succeeds on Linux instead of throwing at module load.

### Elevation Flow (after ELEV-01)

```
Elevation request (e.g. elevated symlink deploy, elevated fs op)
  → runElevated(ipcPath, func, args)
    → write serialized closure + elevatedMain harness to /tmp/vortex-xxxx.js
    → platform branch:
        Windows: winapi.ShellExecuteEx({ verb: "runas", file: process.execPath, ... })
        Linux:   child_process.spawn("pkexec", [process.execPath, "--run", tmpPath])
    → net.Server.listen("/tmp/vortex-{ipcPath}.sock")
    → child process connects → sends { message: "initialised", payload: { pid } }
    → parent sends commands:
        { message: "link-file", payload: { source, dest, num } }
    → child executes fs.symlink() → sends { message: "completed", payload: { err, num } }
    → parent sends { message: "quit" }
    → child closes socket → process.exit(0)
    → server closes
```

The IPC protocol is **completely unchanged** from Windows. The only change is the spawn mechanism.

### SteamOS Elevation Flow (after ELEV-02)

```
Elevation request on SteamOS (Linux branch):
  → isSteamOS() returns true
    → check if affected paths are user-owned
        → if yes: run closure as current user (no elevation)
        → if no:
            → show Steam Deck unlock notification
            → on user confirmation: spawn("sudo", [process.execPath, "--run", tmpPath])
            → same IPC handshake as ELEV-01
  → isSteamOS() returns false → pkexec path (ELEV-01)
```

---

## Anti-Patterns to Avoid (v3.0)

### Anti-Pattern 1: Removing the Build Guard Before Fixing binding.gyp

**What people do:** Remove the `process.platform === 'win32'` early-exit from the build script to
unblock CI, then fix the native addon separately.

**Why it's wrong:** CI will attempt to compile the unfixed addon and fail the Linux build job
before the gyp fix lands. The Windows build is unaffected but the Linux track is broken.

**Do this instead:** Remove the guard in the same atomic commit/PR that fixes `binding.gyp` and
`gamebryosavegame.cpp`. SAVE-01 is a single PR to `node-gamebryo-savegames`.

### Anti-Pattern 2: Expecting pkexec to Find `node` in a Stripped PATH

**What people do:** Call `spawn("pkexec", ["node", "--run", tmpPath])` expecting the system `node`
to be found in PATH.

**Why it's wrong:** pkexec strips the calling environment (including `PATH`) before exec. `node`
may not be at a system-known location if installed via nvm/volta.

**Do this instead:** Use `process.execPath` — the Electron binary — which is an absolute path and
can execute `--run <script>` because Electron embeds Node. This mirrors exactly what Windows does
(`file: process.execPath` in the existing `ShellExecuteEx` call).

### Anti-Pattern 3: Catching pkexec Exit Code in the Wrong Place

**What people do:** Add `.catch({ code: 126 }, ...)` to the `runElevated()` return value.

**Why it's wrong:** `runElevated()` resolves **immediately after spawn** (same as Windows where
`ShellExecuteEx` returns before the UAC dialog is dismissed). The pkexec exit code arrives
asynchronously on the `child.on("exit")` handler, not at the point where `runElevated` returns.
The IPC server will time out waiting for `"initialised"` if the user cancels.

**Do this instead:** The `child.on("exit", code => { if (code === 126) reject(UserCanceled) })`
handler must be set up **before** calling `resolve(tmpPath)`, and the reject callback must close
the IPC server. Alternatively, use a `Promise.race` between the IPC server `"initialised"` event
and a pkexec-exit listener.

### Anti-Pattern 4: Adding `isSteamOS()` to the Main Process

**What people do:** Detect SteamOS in `Application.ts` or `main.ts` and pass a flag to the
renderer.

**Why it's wrong:** The elevation code is renderer-side. Adding an IPC round-trip to check the
OS release file adds unnecessary complexity. Reading `/etc/os-release` is a synchronous 1-line
file read — safe to do in the renderer's platform check branch.

**Do this instead:** `isSteamOS()` lives in `util/elevated.ts` (module-level cached variable) in
the renderer workspace. It is only called from within the `process.platform === "linux"` branch
of `runElevated()`.

---

## Integration Points Summary — v3.0 (for roadmapper)

| Integration Point | Change Type | Phase |
|------------------|------------|-------|
| Native addon repo: `binding.gyp` | MODIFIED in addon repo | Phase 1 / SAVE-01 |
| Native addon repo: `gamebryosavegame.cpp` | MODIFIED in addon repo | Phase 1 / SAVE-01 |
| `util/elevated.ts`: pkexec spawn branch | MODIFIED | Phase 1 / ELEV-01 |
| `extensions/gamebryo-savegame-management/package.json`: remove build guard | MODIFIED | Phase 2 / SAVE-02 |
| `util/platform.ts`: `isSteamOS()` | NEW | Phase 2 / ELEV-02 |
| `util/elevated.ts`: SteamOS path | MODIFIED (second pass) | Phase 2 / ELEV-02 |
| `util/ipc.ts` | UNCHANGED | — |
| `symlink_activator_elevate/` | UNCHANGED | — |

**What can be parallelized:** SAVE-01 (C++ addon) and ELEV-01 (TypeScript elevation) have no shared
files and no runtime dependencies on each other. They can be developed and reviewed simultaneously
on separate branches.

**What is strictly sequential:** SAVE-02/03 require SAVE-01 (addon must compile before testing the
save UI). ELEV-02 requires ELEV-01 (the Linux elevation branch must exist before adding the SteamOS
sub-path).

---

---

# v6.0 Architecture: chattr+F + Upstream Rebase CI

**Added:** 2026-04-15
**Confidence:** HIGH (all findings from direct source inspection)

---

## Q5 — chattr+F Dual-Path Filesystem Layer (CASE-05 / CASE-06)

### Existing fs Architecture

The renderer's filesystem entry point is `src/renderer/src/util/fs.ts`. This file:

- Re-exports most fs/fs-extra functions with retry, backtracing, and user-interaction wrappers.
- Since v4.0 wraps `readFileAsync`, `writeFileAsync`, `statAsync`, `watch`, `copyAsync`,
  `renameAsync`, and `ensureDirAsync` with `isWinePrefixPath()` + `resolveCaseIfWinePrefix()`.
- Exposes `ensureDirAsync(dirPath, onDirCreatedCB?)` — the only directory-creation API
  used by staging setup code.

`src/main/src/filesystem/fs.ts` is a **separate** backend used by the new `@vortex/fs` package
(the future architecture). It implements `FileSystemBackendImpl.createDirectory()` using
`node:fs/promises mkdir`. It does NOT contain the Wine-prefix shim and is not yet the primary
path for extension code. All staging directory creation goes through renderer's `util/fs.ts`.

### Staging Directory Creation — Full Call Chain

The path from "user selects staging dir" to "directory is created":

```
User sets mod staging folder in Settings → Mods
  → Redux dispatch: setInstallPath(gameId, path)

Profile activation / first-time game management
  → profile_management/index.ts: ensureStagingDirectory(api, undefined, gameId)
    → stagingDirectory.ts: ensureStagingDirectoryImpl()
      → if directory missing and no prior mods:
          fs.ensureDirWritableAsync(instPath, confirmCB)
      → else (reinitialization):
          fs.ensureDirWritableAsync(instPath)
      → fs.writeFileAsync(path.join(instPath, STAGING_DIR_TAG), JSON.stringify(data))

ensureDirWritableAsync(dirPath, confirmCB):
  → fs.ensureDir(dirPath)          ← creates the directory
  → canary file test (write + delete)
  → if EPERM/EBADF: elevate via runElevated() with permissions.allow()
```

The **only function that creates a staging directory from scratch** is `ensureDirWritableAsync`
in `src/renderer/src/util/fs.ts` (line 1224). It calls `fs.ensureDir(dirPath)` (fs-extra).

### Where chattr+F Must Be Injected

`ensureDirWritableAsync` is the single correct injection point. The sequence must be:

```
ensureDirWritableAsync(dirPath):
  1. fs.ensureDir(dirPath)                      ← existing: create directory
  2. [NEW] applyChattrCasefold(dirPath)          ← new: attempt chattr +F
  3. canary write + delete test                 ← existing: verify writable
  4. if permission error: elevate               ← existing: UAC/pkexec
```

`applyChattrCasefold` is a new function. It must:

1. Detect whether the filesystem at `dirPath` supports casefold (is ext4 with `casefold` feature,
   or btrfs). Detection approach: attempt `chattr +F dirPath`; if it succeeds, the FS supports it;
   if it fails with EOPNOTSUPP/EINVAL, silently fall through to the existing shim.
2. If `chattr +F` succeeds: set a flag so `ensureDirAsync` skips the Wine-prefix case-folding
   shim for this path (the kernel handles it). Alternatively, the shim's `isWinePrefixPath()` check
   already gates on `/compatdata/` — staging dirs are not Wine prefix paths — so the shim already
   does not apply to staging dirs. No change needed in the shim.
3. If `chattr +F` fails: log at `debug` level, proceed. The existing userspace shim in
   `ensureDirAsync` remains active for Wine prefix paths.

**Detection strategy — try-and-catch beats statfs:**

Using `child_process.execFile("chattr", ["+F", dirPath])` and catching EOPNOTSUPP is simpler and
more reliable than calling `statfs(2)` to get the filesystem magic number. The `chattr` binary is
part of `e2fsprogs` and available on all Debian/Ubuntu systems. On btrfs, `chattr +F` has been
supported since kernel 5.14 (released 2021). The EOPNOTSUPP error path covers XFS, ZFS, tmpfs,
and all other non-casefold-capable filesystems cleanly.

**New function location:**

The function belongs in `src/renderer/src/util/fs.ts` alongside the existing shim functions
(`isWinePrefixPath`, `resolveCaseIfWinePrefix`). It is Linux-only code behind a
`process.platform === "linux"` guard, consistent with the pattern throughout the file.

```typescript
// New — in src/renderer/src/util/fs.ts
async function applyChattrCasefold(dirPath: string): Promise<void> {
  if (process.platform !== "linux") return;
  return new Promise<void>((resolve) => {
    const { execFile } = require("child_process") as typeof import("child_process");
    execFile("chattr", ["+F", dirPath], (err) => {
      if (err) {
        // EOPNOTSUPP or EINVAL: filesystem does not support casefold — silent fallthrough
        log("debug", "chattr +F not supported on this filesystem", { dirPath, err: err.message });
      }
      resolve(); // always resolve — this is best-effort
    });
  });
}
```

**ensureDirWritableAsync modification:**

```typescript
export function ensureDirWritableAsync(
  dirPath: string,
  confirm?: () => PromiseLike<void>,
): PromiseBB<void> {
  // ... existing setup ...
  return PromiseBB.resolve(fs.ensureDir(dirPath))
    .then(() => applyChattrCasefold(dirPath))   // NEW LINE — best-effort, never rejects
    .then(() => {
      const canary = path.join(dirPath, "__vortex_canary");
      return ensureFileAsync(canary).then(() => removeAsync(canary));
    })
    // ... existing error handling unchanged ...
```

### What Is New vs. Modified

| Component | Status | Change |
|-----------|--------|--------|
| `src/renderer/src/util/fs.ts` | **MODIFIED** | Add `applyChattrCasefold()` function; call it inside `ensureDirWritableAsync` after `fs.ensureDir` |
| `src/renderer/src/util/fs.test.ts` | **MODIFIED** | Add test cases: chattr succeeds → no error; chattr returns EOPNOTSUPP → resolves without throw; non-Linux → no-op |

No new files. No changes to:
- `stagingDirectory.ts` — injection point is below this layer
- `ensureDirAsync` — not the staging creation path; chattr belongs at directory creation, not generic dir-ensure
- `LinkingDeployment.ts` — its `ensureDir` creates deployment target dirs, not staging dirs; chattr+F not needed there
- `isWinePrefixPath` / `resolveCaseIfWinePrefix` — staging dirs are never Wine prefix paths; shim already does not apply

### Data Flow: User Sets Staging Directory

```
User → Settings UI → setInstallPath(gameId, path)
    ↓
profile_management/index.ts: ensureStagingDirectory()
    ↓
stagingDirectory.ts: ensureDirWritableAsync(instPath)
    ↓
src/renderer/src/util/fs.ts:
  fs.ensureDir(instPath)            ← creates dir (unchanged)
  applyChattrCasefold(instPath)     ← NEW: chattr +F if ext4/btrfs
  canary write+delete               ← verify writable (unchanged)
  if EPERM → elevate via pkexec     ← unchanged
    ↓
fs.writeFileAsync(__vortex_staging_folder)  ← tag file (unchanged)
```

On ext4 with `casefold` feature: kernel enforces case-insensitive lookups for the directory tree.
The Wine-prefix userspace shim (`isWinePrefixPath`) never fires for staging dirs — staging dirs
are not under `/compatdata/`. The two mechanisms operate on orthogonal path trees.

---

## Q6 — Upstream Rebase CI (REBASE-01 / REBASE-02)

### Problem

`nexus-mods/Vortex` releases new tags (e.g. `v1.13.8`). The fork (`atabisz/Vortex`, `master`
branch) carries a Linux-specific patch set. Currently, rebasing onto a new upstream tag is a
manual operation. REBASE-01/02 automate this.

### Trigger Selection

Three options exist for detecting a new upstream release:

| Trigger | How it works | Trade-offs |
|---------|-------------|------------|
| `schedule` (cron) | Poll on a fixed interval (e.g. daily) | Simple, no webhooks needed; lag of up to 24h |
| `repository_dispatch` | Upstream sends a webhook to the fork | Requires nexus-mods cooperation — not available |
| `workflow_dispatch` + `schedule` | Cron daily; also triggerable manually | Best option for a fork: autonomous + overridable |

**Recommendation: `schedule` + `workflow_dispatch`.**

The workflow runs on a schedule (e.g. `0 6 * * *` — daily at 06:00 UTC). It also accepts manual
dispatch so a contributor can trigger it immediately after an upstream release. There is no
`repository_dispatch` from `nexus-mods/Vortex` because the fork does not control that repo.

```yaml
on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:
    inputs:
      upstream_ref:
        description: "Upstream ref to rebase onto (default: latest tag)"
        required: false
        type: string
```

### Workflow Structure

The workflow lives at `.github/workflows/sync-upstream.yml`. It is fork-only — analogous to
`release-linux.yml` which already carries a comment `# Runs on this fork only. Not intended for upstream.`

**Steps:**

```
1. actions/checkout@v4 (fetch-depth: 0 for full history + tags)
2. Configure git identity (github-actions[bot])
3. Add nexus-mods/Vortex as "upstream" remote
4. git fetch upstream --tags
5. Determine target ref:
     - if workflow_dispatch.inputs.upstream_ref is set: use that
     - else: git tag --sort=-version:refname | grep '^v' | head -1
6. git checkout master (the fork's integration branch)
7. git rebase upstream/<target_ref> --onto master
8. If rebase succeeds: git push origin master (or to a temp branch)
   If rebase fails: git rebase --abort, exit with failure
9. gh pr create (draft PR describing the rebase)
```

**Authentication for git operations:**

GitHub Actions `GITHUB_TOKEN` has read access to the current repo but cannot push to it by
default in a fork without explicit `contents: write` permission. The workflow needs:

```yaml
permissions:
  contents: write
  pull-requests: write
```

With these permissions, `GITHUB_TOKEN` can push branches and create PRs within the fork. The
`GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` env var enables `gh pr create`.

No additional secrets are needed for reading `nexus-mods/Vortex` — it is a public repo; `git
fetch` over HTTPS works without auth.

**Pushing strategy:**

Rather than force-pushing `master`, the workflow creates a branch `rebase/upstream-<tag>` and
opens a draft PR. This is safer: the PR goes through CI, and a human reviews the diff before
merging. Force-pushing master would skip review and could break the rolling `latest-linux` release.

```bash
BRANCH="rebase/upstream-${TARGET_TAG}"
git checkout -b "$BRANCH"
git rebase "upstream/${TARGET_TAG}"
git push --force-with-lease origin "$BRANCH"
gh pr create \
  --base master \
  --head "$BRANCH" \
  --title "chore: rebase onto upstream ${TARGET_TAG}" \
  --draft \
  --body "..."
```

**Idempotency — avoid duplicate PRs:**

Before creating a PR, the workflow checks whether one already exists for this branch:

```bash
if ! gh pr list --head "$BRANCH" --base master --json number --jq '.[0].number' | grep -q .; then
  gh pr create ...
fi
```

This pattern is already used in `.github/scripts/cherry-pick.sh` (the existing cherry-pick
workflow).

**REBASE-02: Running CI before PR is created:**

The PR creation triggers `main.yml` via `pull_request` event (which already runs on PRs to
`master`). No additional workflow step needed. The rebase PR is created as draft; the author
confirms CI is green before marking ready for review.

### Workflow File Location and Relation to Existing Workflows

| File | Trigger | Purpose | Fork-only? |
|------|---------|---------|------------|
| `.github/workflows/main.yml` | push master, PR, workflow_dispatch | Build + test (Windows + Linux) | No (upstream too) |
| `.github/workflows/release-linux.yml` | workflow_run after main, push tags | AppImage + .deb release | Yes |
| `.github/workflows/cherry-pick.yml` | pull_request_target closed v2* | Cherry-pick to v2 branches | No (upstream too) |
| `.github/workflows/sync-upstream.yml` | schedule daily + workflow_dispatch | NEW: detect upstream tags, open rebase PR | Yes |

### New vs. Modified Components (REBASE-01/02)

| Component | Status | Change |
|-----------|--------|--------|
| `.github/workflows/sync-upstream.yml` | **NEW** | Schedule + workflow_dispatch trigger; fetch upstream tags; rebase onto target; push branch; create draft PR |
| `.github/scripts/sync-upstream.sh` | **NEW** | Shell script containing the git operations (same pattern as `cherry-pick.sh`) |

No existing workflows are modified.

### Data Flow: Upstream Release Detection

```
Cron fires (daily 06:00 UTC) OR manual workflow_dispatch
    ↓
sync-upstream.yml: actions/checkout@v4 (fetch-depth: 0)
    ↓
git remote add upstream https://github.com/nexus-mods/Vortex.git
git fetch upstream --tags
    ↓
TARGET=$(git tag --sort=-version:refname | grep '^v' | head -1)
    ↓
Existing rebase PR for "rebase/upstream-${TARGET}" already open?
  YES → exit 0 (idempotent, no duplicate PR)
  NO → continue
    ↓
git checkout -b "rebase/upstream-${TARGET}" origin/master
git rebase "upstream/${TARGET}"
    ↓
Rebase clean?
  YES → git push --force-with-lease origin "rebase/upstream-${TARGET}"
        gh pr create --draft --base master ...
  NO  → git rebase --abort
        gh issue create OR workflow failure notification
        exit 1
```

### Secrets Required

| Secret | Source | Purpose |
|--------|--------|---------|
| `GITHUB_TOKEN` | Auto-provided by Actions | Push branch to fork, create PR |

No additional PAT or app credentials needed. `nexus-mods/Vortex` is public, so reading it requires
no auth. The `GITHUB_TOKEN` for `atabisz/Vortex` can push to the fork with `contents: write`.

---

## Q7 — Build Order (v6.0)

### Dependency Graph

```
CASE-05/06 (chattr+F in fs.ts)
  Depends on: existing fs shim (already shipped v4.0)
  Blocks: nothing downstream

REBASE-01 (sync-upstream.yml + script)
  Depends on: nothing in the Vortex codebase
  Blocks: REBASE-02 (CI validation is the PR trigger)

REBASE-02 (CI validation of rebase PR)
  Depends on: REBASE-01 (needs the PR to exist)
  Depends on: main.yml (pre-existing CI that validates the PR)
```

CASE-05/06 and REBASE-01 are **fully independent**. They touch non-overlapping files and have no
runtime dependency on each other. They can be developed and reviewed in parallel.

### Suggested Phase Order

**Phase 1 (parallel tracks, no blocking dependency):**

| Track | Requirements | Files |
|-------|-------------|-------|
| A | CASE-05, CASE-06: chattr+F injection | `src/renderer/src/util/fs.ts`, `fs.test.ts` |
| B | REBASE-01: CI workflow + shell script | `.github/workflows/sync-upstream.yml`, `.github/scripts/sync-upstream.sh` |

**Phase 2 (sequential, validates Phase 1):**

| Requirement | Depends On | Validation |
|-------------|-----------|------------|
| REBASE-02: first live rebase PR | REBASE-01 (workflow must exist) | Trigger manually; confirm CI green on rebase PR |

**Why CASE-05/06 is a single phase:**

CASE-06 (filesystem type detection) is embedded in the `applyChattrCasefold` try-and-catch
strategy. It is not a separate component — detection happens by attempting chattr and catching
the error. There is no separate "detect" phase before "apply".

---

## Integration Points Summary — v6.0

| Integration Point | Change Type | Requirement |
|------------------|------------|-------------|
| `src/renderer/src/util/fs.ts`: `applyChattrCasefold()` (new function) | NEW (added to existing file) | CASE-05, CASE-06 |
| `src/renderer/src/util/fs.ts`: `ensureDirWritableAsync()` (add one `.then()` call) | MODIFIED | CASE-05 |
| `src/renderer/src/util/fs.test.ts` | MODIFIED | CASE-05, CASE-06 |
| `.github/workflows/sync-upstream.yml` | NEW | REBASE-01 |
| `.github/scripts/sync-upstream.sh` | NEW | REBASE-01 |

**What is unchanged:**
- `stagingDirectory.ts` — no change; injection is below this layer
- `isWinePrefixPath()` / `resolveCaseIfWinePrefix()` — staging dirs never match the Wine prefix check
- `ensureDirAsync` in `LinkingDeployment.ts` — used for deployment target dirs, not staging dirs
- All existing workflows (`main.yml`, `release-linux.yml`, `cherry-pick.yml`)
- Windows code paths — `applyChattrCasefold` is guarded by `process.platform !== "linux"` return

---

## Sources

All findings from direct source inspection (HIGH confidence):

**v3.0 sources:**
- `extensions/gamebryo-savegame-management/node_modules/gamebryo-savegame/binding.gyp`
- `extensions/gamebryo-savegame-management/node_modules/gamebryo-savegame/src/gamebryosavegame.cpp`
- `extensions/gamebryo-savegame-management/node_modules/gamebryo-savegame/src/gamebryosavegame.h`
- `extensions/gamebryo-savegame-management/node_modules/gamebryo-savegame/src/string_cast.h`
- `extensions/gamebryo-savegame-management/node_modules/gamebryo-savegame/package.json`
- `extensions/gamebryo-savegame-management/src/util/refreshSavegames.ts`
- `extensions/gamebryo-savegame-management/src/index.ts`
- `extensions/gamebryo-savegame-management/package.json`
- `src/renderer/src/util/elevated.ts`
- `src/renderer/src/util/ipc.ts`
- `src/renderer/src/util/winapi-shim.ts`
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts`
- `src/renderer/src/extensions/symlink_activator_elevate/remoteCode.ts`
- `scripts/manage-node-modules.js` (gamebryo-savegame path/repo reference)
- `.planning/PROJECT.md` (v3.0 requirements and v2.0 state)

**v6.0 sources:**
- `src/renderer/src/util/fs.ts` (full file — ensureDirWritableAsync, ensureDirAsync, isWinePrefixPath pattern)
- `src/renderer/src/util/elevated.ts` (isSteamOS implementation — lives here, not platform.ts)
- `src/renderer/src/extensions/mod_management/stagingDirectory.ts` (ensureStagingDirectoryImpl call chain)
- `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` (ensureDir/onDirCreatedCB pattern)
- `src/renderer/src/extensions/profile_management/index.ts` (ensureStagingDirectory call site)
- `src/main/src/filesystem/fs.ts` (new @vortex/fs backend — does not affect staging path)
- `src/main/src/filesystem/paths.linux.ts` (XDG path provider — does not affect staging path)
- `.github/workflows/main.yml` (CI structure, GITHUB_TOKEN usage pattern)
- `.github/workflows/release-linux.yml` (fork-only workflow pattern, workflow_run trigger)
- `.github/workflows/cherry-pick.yml` (git operations in Actions, gh pr create pattern)
- `.github/scripts/cherry-pick.sh` (idempotent PR creation pattern)
- `.planning/PROJECT.md` (v6.0 requirements CASE-05, CASE-06, REBASE-01, REBASE-02)

---
*Architecture research for: Vortex Linux v3.0 — gamebryo-savegame + elevation (original)*
*v6.0 additions: chattr+F dual-path fs layer + upstream rebase CI*
*Updated: 2026-04-15*
