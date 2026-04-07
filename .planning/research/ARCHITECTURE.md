# Architecture Research

**Domain:** Electron mod manager — native addon Linux port + Linux privilege elevation
**Researched:** 2026-04-01
**Milestone:** v3.0 — gamebryo-savegame Linux compilation + pkexec elevation
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

**`isSteamOS()` utility (new function, ~10 lines, new file `util/platform.ts`):**

```typescript
export function isSteamOS(): boolean {
  try {
    const release = require("fs").readFileSync("/etc/os-release", "utf8") as string;
    return /^ID=steamos$/m.test(release) || /^ID_LIKE=.*steamos/m.test(release);
  } catch {
    return false;
  }
}
```

This is a new file (or added to existing `util/` helpers). It is Linux-only code, called only
from within the `process.platform === "linux"` branch.

ELEV-02 is a follow-on to ELEV-01 — building it before ELEV-01 means working against a stub that
throws, making end-to-end testing impossible.

---

## Q4 — Build Order

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

## New vs. Modified Components

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

## Data Flow Changes

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

## Anti-Patterns to Avoid

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

**Do this instead:** `isSteamOS()` lives in `util/platform.ts` in the renderer workspace. It is
only called from within the `process.platform === "linux"` branch of `runElevated()`.

---

## Integration Points Summary (for roadmapper)

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

## Sources

All findings from direct source inspection (HIGH confidence):

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

---
*Architecture research for: Vortex Linux v3.0 — gamebryo-savegame + elevation*
*Researched: 2026-04-01*
