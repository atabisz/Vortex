# Pitfalls Research

**Domain:** Native addon Linux cross-compilation + pkexec elevation in Electron (Vortex v3.0)
**Researched:** 2026-04-01
**Confidence:** HIGH — all pitfalls grounded in direct source inspection + Phase 3 audit artifacts

> **Scope note:** This document covers v3.0 only: SAVE-01 (gamebryo-savegame native addon
> Linux compilation) and ELEV-01/ELEV-02 (pkexec + Unix domain socket elevation). v2.0
> pitfalls (Steam detection, AppImage packaging, NXM protocol) are documented in the v2.0
> PITFALLS.md. Cross-references made where a prior decision creates a v3.0 trap.

---

## Critical Pitfalls

Mistakes that require rewrites or block entire feature areas.

---

### Pitfall 1: `std::exception` MSVC constructor inheritance — silently compiles on MSVC, hard error on GCC

**What goes wrong:**
`gamebryosavegame.cpp` line 27 contains:
```cpp
class MoreInfoException : public std::exception {
  MoreInfoException(const char* message)
    : std::exception(std::runtime_error(message)) { ... }
};
```
MSVC provides a non-standard `std::exception(const char*)` constructor and accepts
`std::exception(another_exception)` as an extension. GCC and Clang strictly follow the C++
standard where `std::exception` has only a default constructor and a copy constructor. GCC
emits: `error: no matching function for call to 'std::exception::exception(std::runtime_error)'`.

**Why it happens:**
The original gamebryo-savegame was written to target Windows/MSVC exclusively. MSVC's
non-standard `std::exception` extensions are well-known in Windows-only codebases. Developers
porting to GCC may not notice because the class is only instantiated on error paths — the
code compiles under MSVC and the test suite never exercises the error path, making the
non-portability invisible until a GCC compilation attempt.

**How to avoid:**
Change the inheritance chain from `std::exception` to `std::runtime_error` directly:
```cpp
// Before (MSVC-only):
class MoreInfoException : public std::exception {
  MoreInfoException(const char* msg) : std::exception(std::runtime_error(msg)) {}
};

// After (portable):
class MoreInfoException : public std::runtime_error {
  explicit MoreInfoException(const std::string& msg) : std::runtime_error(msg) {}
};
```
Apply via `patch-package` — do not fork the package. The patch persists across
`pnpm install` and is tracked in git.

**Warning signs:**
- `node-gyp` build output contains `error: no matching function for call to
  'std::exception::exception'`
- `nothing.a` stub file produced instead of `.node` in the build output
- Any C++ class that inherits from `std::exception` with a non-default constructor
  is a portability smell on Windows-only codebases

**Phase to address:** SAVE-01 — first task in the phase. Gate CI on compilation success
before any save game UI work begins.

---

### Pitfall 2: `binding.gyp` lz4/zlib linker flags only under `OS=="win"` — link failure on Linux

**What goes wrong:**
`gamebryo-savegame`'s `binding.gyp` structure:
```json
{
  "conditions": [
    ["OS=='win'", {
      "libraries": ["./lz4/dll/liblz4.lib", "./zlib/lib/zlib.lib"]
    }]
  ]
}
```
The `.cpp` source includes `<lz4.h>` and `<zlib.h>` unconditionally. On Linux, `node-gyp`
compiles successfully (headers found via system packages) but the link step fails with:
`undefined reference to 'LZ4_decompress_safe'` and `undefined reference to 'inflate'`.
The linker error occurs at `@electron/rebuild` time, not at compile time — compilation
passes, making the problem appear only in the final link step.

**Why it happens:**
The Windows `binding.gyp` bundles its own lz4 and zlib DLLs as local library files. On
Linux the convention is to link system-provided shared libraries via `-l` flags. The
original author added the `OS=="win"` condition for the bundled Windows libraries but
never added a corresponding Linux condition because the addon was never compiled on Linux.

**How to avoid:**
Add an `OS=="linux"` condition to `binding.gyp` that links system lz4 and zlib:
```json
["OS=='linux'", {
  "libraries": ["-llz4", "-lz"]
}]
```
Ensure `liblz4-dev` and `zlib1g-dev` are installed via `apt` in CI before the
`@electron/rebuild` step. `zlib1g-dev` is already present on `ubuntu-24.04`; `liblz4-dev`
must be explicitly added.

Apply via `patch-package`. The patch target is `node_modules/gamebryo-savegame/binding.gyp`.

**Warning signs:**
- Build output shows `warning: implicit declaration of function 'LZ4_decompress_safe'` or
  succeeds with warnings but then dies at link with `undefined reference`
- `ldd` on a successfully built test binary shows `liblz4.so => not found`
- The `OS=="win"` condition in `binding.gyp` with no corresponding `OS=="linux"` block
  is an instant signal that linker flags need a Linux counterpart

**Phase to address:** SAVE-01 — same patch-package task as Pitfall 1. Both errors must
be fixed in the same `binding.gyp` + `gamebryosavegame.cpp` patch.

---

### Pitfall 3: `patch-package` patches break when the upstream package version changes

**What goes wrong:**
`patch-package` stores patches keyed to an exact package version string
(e.g., `gamebryo-savegame+1.2.3.patch`). If the upstream package version changes —
even a patch release — `pnpm install` prints a warning and the patch is silently
skipped. The build then proceeds with the unpatched source and the original compile
errors resurface, often with a confusing error message that looks like a new problem
rather than a missing patch.

**Why it happens:**
`patch-package` is designed for version-pinned scenarios. In a pnpm monorepo with a
strict lockfile (`pnpm-lock.yaml`), the version is effectively pinned — but developers
who run `pnpm update gamebryo-savegame` or the upstream maintainer releases a new
version will invalidate the patch without any build-time error (only a warning).

**How to avoid:**
1. Add a `postinstall` script or `prepare` hook that verifies the patch applied:
   ```json
   // package.json
   "scripts": {
     "postinstall": "patch-package && node scripts/verify-patches.js"
   }
   ```
2. In `verify-patches.js`, check that the patched file contains the expected post-patch
   content (e.g., `std::runtime_error` in `gamebryosavegame.cpp`).
3. Pin `gamebryo-savegame` explicitly in `package.json` with an exact version (no `^`
   or `~`) and add a comment referencing the patch.

**Warning signs:**
- CI log shows `patch-package: WARNING: patch file not found for gamebryo-savegame`
- Build succeeds but `require('gamebryo-savegame')` throws a module load error
- Patch file present in `patches/` directory but no `patch-package` in devDependencies

**Phase to address:** SAVE-01 — establish the patch-package pattern correctly the first
time so it survives future `pnpm update` runs.

---

### Pitfall 4: `winapi.ShellExecuteEx({ verb: "runas" })` throws on Linux — elevation blocks entire call site

**What goes wrong:**
`src/renderer/src/util/elevated.ts` `runElevated()` calls:
```typescript
winapi.ShellExecuteEx({
  verb: "runas",
  file: process.execPath,
  parameters: `--run ${tmpPath}`,
  ...
});
```
On Linux, `winapi-bindings` is shimmed to throw `NotImplemented` for `ShellExecuteEx`.
This means any call to `runElevated()` throws immediately, and the calling code in
`symlink_activator_elevate/index.ts` at lines 567, 817, 941, 1068 receives an uncaught
error that propagates up to the Redux error boundary.

The trap: adding a `process.platform === 'linux'` branch is necessary, but the replacement
must also handle the `ipcPath` parameter that `elevatedMain` uses for its socket connection.
The Linux elevated process connects back to the parent via the Unix domain socket at
`getIPCPath(id)` which resolves to `/tmp/vortex-{id}.sock`. The parent must be listening on
this socket BEFORE spawning the elevated child — if `pkexec` starts the child before the
`net.Server` is bound, the child's `connect()` call races with the parent's `listen()`.

**Why it happens:**
`runElevated()` was designed for the Windows pattern where `ShellExecuteEx` + UAC dialog
is blocking from the UX perspective. On Linux, `pkexec` prompts asynchronously via a
polkit agent. The Windows code creates the temp file, calls `ShellExecuteEx` (which blocks
until the user confirms or denies), and resolves the promise once the elevated process is
running. On Linux, `pkexec` returns immediately if a polkit agent is available — the
elevated Node.js process starts before the socket server may be ready if the server startup
is async.

**How to avoid:**
Structure the Linux elevation path as:
```typescript
if (process.platform === 'linux') {
  // 1. Start the Unix socket server FIRST
  const server = net.createServer(...);
  await new Promise<void>((res, rej) =>
    server.listen(ipcPath, () => res())
      .on('error', rej)
  );
  // 2. Only THEN spawn pkexec
  const proc = spawn('pkexec', ['node', tmpPath], { detached: true });
  proc.unref();
  return resolve(tmpPath);
}
```
This guarantees the socket exists before pkexec is called. The Windows path is unchanged.

**Warning signs:**
- Linux elevated process exits immediately with `Connection refused` or `ENOENT` for
  the socket path
- `ECONNREFUSED` in the elevated child's stderr (Node process exits 1)
- Intermittent failures only — the race condition manifests based on OS scheduler timing

**Phase to address:** ELEV-01 — the socket-before-spawn ordering is the core architectural
constraint for the entire Linux elevation implementation.

---

### Pitfall 5: `/tmp` Unix domain socket path — path too long or cleaned up by systemd-tmpfiles

**What goes wrong:**
`getIPCPath()` returns `/tmp/vortex-{id}.sock`. Unix domain socket paths are limited to
107 characters on Linux (the `sun_path` field in `struct sockaddr_un` is 108 bytes, with
the null terminator consuming one). If `id` contains a long string — for example, the
IPC path for symlink deployment includes a session timestamp + random component — the
path can silently truncate.

Additionally, on modern systemd-based distributions (Ubuntu 20.04+, Fedora, SteamOS),
`systemd-tmpfiles-clean.service` runs a timer (`systemd-tmpfiles-clean.timer`) that
deletes files in `/tmp` older than a configured age (default: 10 days, but SteamOS sets
this to 1 day to conserve limited SSD space). For long-running elevated operations, this
is not an issue, but socket files left behind by crashed elevated processes may be cleaned
mid-session if Vortex is left running for extended periods.

A separate concern: the `XDG_RUNTIME_DIR` (`/run/user/1000/`) is the preferred location
for runtime socket files on modern Linux. It is guaranteed writable, guaranteed cleaned
on logout, and not subject to `tmpfiles.d` sweeps. However, `XDG_RUNTIME_DIR` has a
storage quota of 10% of RAM by default — irrelevant for socket files (inodes, no data)
but relevant if socket files multiply from repeated elevation attempts without cleanup.

**Why it happens:**
`os.tmpdir()` returns `/tmp` on all Linux distributions. This is correct and portable.
The `XDG_RUNTIME_DIR` preference is a newer convention (systemd 2012+) that is not
universally available (non-systemd distros like Alpine, Void Linux with runit) and
whose absence causes `$XDG_RUNTIME_DIR` to be undefined. Using `/tmp` as the default
is the safe fallback.

**How to avoid:**
Keep `/tmp` as the socket directory (already implemented correctly). Add a path length
assertion in `getIPCPath()` to catch `id` values that would produce paths over 107 chars:
```typescript
const p = path.join(os.tmpdir(), `vortex-${id}.sock`);
if (process.platform === 'linux' && p.length > 107) {
  throw new Error(`IPC socket path too long (${p.length}): ${p}`);
}
return p;
```
Use `XDG_RUNTIME_DIR` as a preferred override when available:
```typescript
const base = process.env.XDG_RUNTIME_DIR ?? os.tmpdir();
```
Clean up socket files after the elevated process exits by unlink-ing the socket path in
the `close` or `error` handler of the Unix socket server.

**Warning signs:**
- `EINVAL` when calling `server.listen(socketPath)` — path too long
- `EADDRINUSE` on second elevation attempt — previous socket file not cleaned up
- Stale `.sock` files in `/tmp` from crashed sessions

**Phase to address:** ELEV-01 — socket lifecycle management must be part of the initial
implementation, not a cleanup task.

---

### Pitfall 6: `pkexec` is not universally available on Linux — and SteamOS ships it non-functional by default

**What goes wrong:**
`pkexec` (from the `polkit` package) is the standard Linux privilege escalation tool for
desktop environments. On a standard Ubuntu/Debian desktop system, `pkexec` is present and
functional. On SteamOS (Steam Deck), the polkit daemon (`polkitd`) is present but the
standard polkit authentication agent is NOT running in Game Mode — it only runs in KDE
Plasma Desktop Mode. Without a polkit agent, `pkexec` hangs indefinitely waiting for
agent registration or immediately exits with `authorization failed`.

Additional environments where `pkexec` is absent or non-functional:
- Minimal Docker/CI containers (no polkit installed)
- Alpine Linux (uses musl; polkit package exists but is less commonly installed)
- Systems running Wayland compositors without a polkit agent (Sway, Hyprland bare installs)

The failure mode: `spawn('pkexec', ...)` succeeds (process starts), but the elevated
child never connects back to the Unix socket. From the parent's perspective, the promise
never resolves and the UI hangs waiting for the elevated process.

**Why it happens:**
`pkexec` is designed for interactive desktop sessions with a polkit agent. When invoked
in an environment without an agent, it writes to stderr and exits non-zero, but the
parent spawn listener must explicitly watch for non-zero exit codes to detect this.
Without exit code handling, the parent hangs on the `net.Server` waiting for a client
connection that never arrives.

**How to avoid:**
1. Before calling `pkexec`, check its availability:
   ```typescript
   import { execSync } from 'child_process';
   function isPkexecAvailable(): boolean {
     try {
       execSync('which pkexec', { stdio: 'ignore' });
       return true;
     } catch { return false; }
   }
   ```
2. Set a timeout on the socket server `connect` event. If no client connects within
   5 seconds of spawning `pkexec`, reject the promise with a user-readable error.
3. Watch the `pkexec` child process `exit` event — non-zero exit code means the user
   denied elevation or polkit is unavailable.
4. For SteamOS (ELEV-02), implement an alternative that does not require a polkit agent:
   - Option A: Use `sudo` with NOPASSWD for specific commands (configured via `/etc/sudoers.d/`
     during first-run setup). SteamOS ships with `sudo` for the `deck` user with NOPASSWD
     for `steamos-readonly` — the same pattern can be used for Vortex.
   - Option B: Use `sudo --askpass` with a custom askpass program. On SteamOS without an
     X11/Wayland display in Game Mode, this also fails.
   - Option C: Detect SteamOS and skip elevation entirely — on Steam Deck, mod directories
     under `~/.steam/steamapps/` are user-writable without elevation. Elevation may not
     be needed at all on Steam Deck.

**Warning signs:**
- `pkexec` child process exits with code 127 (`command not found`) or 1 (`authorization failed`)
- Vortex UI hangs indefinitely when user clicks "Deploy Mods"
- Log shows `pkexec spawned` but no `elevated process connected`
- On SteamOS: `pkexec` is present but `polkitd` is not running in Game Mode

**Phase to address:** ELEV-01 for standard Linux (timeout + exit code handling), ELEV-02
for SteamOS (alternative path or elevation bypass).

---

### Pitfall 7: Electron sandbox (`nodeIntegration: true`) requires the elevated temp script to use `__non_webpack_require__`

**What goes wrong:**
The elevated temp file generated by `runElevated()` is executed in a plain Node.js process
spawned by `pkexec`. This process does not run inside Electron — it is a bare `node`
binary. The temp file already addresses the webpack `require` transformation issue by
aliasing `__non_webpack_require__ = require` at the top of the generated script.

However, the existing `elevated.ts` serializes the `elevatedMain` function body via
`.toString()`. If TypeScript compilation transforms the function body (e.g., class property
initializers, optional chaining `?.`, or nullish coalescing `??` that are transpiled to
ES5 by the TypeScript target), the serialized code may use helpers like `_asyncToGenerator`
or `__awaiter` that are not defined in the bare Node.js context.

The current codebase uses TypeScript targeting ES2020 or later — async/await, optional
chaining, and `??` are natively supported by Node 22 without transpilation. This is not
currently a problem. But if the TypeScript `target` is ever lowered below `ES2020`
(e.g., for a compatibility reason), the serialized function body will contain
`__awaiter(this, void 0, void 0, function*() {...})` helpers that the bare Node process
does not have.

**Why it happens:**
The `elevated.ts` pattern is fundamentally fragile: it relies on `.toString()` of a
function to serialize code into a temp file. This pattern only works when the serialized
function body is self-contained and does not rely on any outer scope, transpiled helpers,
or Electron-specific globals. On Windows, this has been working because the TypeScript
target has been ES2020+ throughout the Electron 39 era. On Linux, any change to the
TypeScript compilation target reintroduces the problem.

**How to avoid:**
Add a comment in `elevated.ts` explicitly documenting the TypeScript target constraint:
```typescript
// IMPORTANT: elevatedMain is serialized via .toString() and executed in a plain
// Node process (not Electron). The serialized body must be self-contained:
// - No outer-scope references
// - No transpiled TypeScript helpers (requires tsconfig target >= ES2020)
// - No webpack-transformed requires (uses __non_webpack_require__ alias)
// If the TypeScript target is ever lowered below ES2020, this will break silently.
```
Add a CI smoke test that runs the generated temp file directly with `node <tmpfile>`
to verify it executes without `ReferenceError` or missing helper errors.

**Warning signs:**
- `ReferenceError: __awaiter is not defined` in elevated process stderr
- `ReferenceError: _asyncToGenerator is not defined` in elevated process stderr
- The `syntaxErrors` check in `elevatedMain`'s `handleError` fires on startup
- TypeScript `tsconfig.json` `target` changed to ES5 or ES2015

**Phase to address:** ELEV-01 — document the constraint in source; the existing
pattern is safe for the current TypeScript target.

---

## Moderate Pitfalls

---

### Pitfall 8: `@electron/rebuild` does not rebuild addons in pnpm virtual store without `--module-dir`

**What goes wrong:**
`pnpm` hoists packages into a `.pnpm/` virtual store with content-addressable paths like
`.pnpm/gamebryo-savegame@1.2.3/node_modules/gamebryo-savegame/`. The top-level
`node_modules/gamebryo-savegame/` is a symlink into this virtual store. `@electron/rebuild`
in some versions (prior to 4.x) follows symlinks but in others traverses the directory and
finds no native addons at the symlink destination.

The result: `@electron/rebuild` completes without error but the addon in the virtual store
remains compiled against the system Node ABI. At runtime, Electron fails to load the addon
with `The module was compiled against a different Node.js version`.

**Prevention:**
Run `@electron/rebuild` with the `-f` flag (force rebuild) and verify the output lists
all expected addons. If `gamebryo-savegame` and `vortexmt` do not appear in the rebuild
output, add `--module-dir node_modules/.pnpm/gamebryo-savegame@.../node_modules/gamebryo-savegame/`
explicitly, or use `pnpm list --json` to locate the actual path dynamically.
The Phase 3 research documents this as a known pnpm workspace concern.

**Phase:** SAVE-01 — verify gamebryo-savegame appears in `@electron/rebuild` output.

---

### Pitfall 9: Save game path on Linux requires Proton Wine prefix, not native `~/Documents`

**What goes wrong:**
The `gamebryo-savegame-management` extension likely calls `app.getPath("documents")` or
a path helper to locate save game files. On Linux with Proton-run games, Bethesda save
files live in the Wine prefix:
```
~/.steam/steam/steamapps/compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/
```
Not in the native `~/Documents/My Games/` that Electron returns via `app.getPath("documents")`.
The save game manager will report zero saves found even though saves exist at the Wine prefix
path.

This is a generalization of the v2.0 Pitfall 3 (`{mygames}` path resolution) applied to
the save game viewer. The fix was deferred to v3.0 explicitly.

**Prevention:**
Before scanning for save files, check `process.platform === 'linux'` and resolve the
per-game Proton prefix using the `getProtonInfo()` helper already in `proton.ts`. Use
`PROTON_USERNAME = "steamuser"` (the constant from the v2.0 work) for the username
component of the Wine prefix path. Never use `os.userInfo().username` for paths inside
a Wine prefix.

**Phase:** SAVE-02/03 — must fix before save game UI validation on Skyrim SE and Fallout 4.

---

### Pitfall 10: Elevated process inherits environment variables from Electron — some variables confuse Node

**What goes wrong:**
`pkexec` by default resets most environment variables for the elevated process (for security
reasons — this is the standard polkit behavior). However, the Electron process sets several
environment variables that the child process should NOT inherit: `ELECTRON_RUN_AS_NODE`,
`ELECTRON_NO_ASAR`, and Electron-specific `NODE_*` variables.

If the elevated process runs as the same user (same UID, different capabilities — which
is not standard `pkexec` behavior; `pkexec` always runs as root unless explicitly configured
otherwise), it inherits the full Electron environment. `ELECTRON_RUN_AS_NODE=1` causes the
node binary to behave as a pure Node.js runtime (stripping Electron-specific behavior),
which is actually correct for the elevated process. `ELECTRON_NO_ASAR=1` disables ASAR
support in the child — also correct. But if these variables are NOT set and the child
is inadvertently using Electron's `node` binary instead of system `node`, the ASAR
module resolver may intercept `require()` calls in the temp script.

**Prevention:**
The existing `elevated.ts` calls `process.execPath` as the executable — this is the
Electron binary. On Linux, the elevated process should use the system `node` binary, not
the Electron binary (which bundles additional native modules). Change the Linux branch to:
```typescript
const nodeExecutable = process.platform === 'linux'
  ? process.execPath.replace(/\/resources\/app\.asar$/, '').replace(/vortex$/, 'node')
  // Better: use 'node' from PATH via 'which node'
  : process.execPath;
```
The cleanest approach: on Linux, spawn `pkexec node <tmpFile>` using the system `node`
binary from `$PATH`. This avoids all Electron-specific contamination.

**Phase:** ELEV-01 — the executable used for the elevated process is a key architectural
decision that must be made in the initial implementation.

---

### Pitfall 11: CI testing of elevation without root — mock strategy

**What goes wrong:**
CI runs on `ubuntu-latest` as a non-root user. There is no polkit agent. Tests that call
`runElevated()` will hang indefinitely (socket wait without pkexec succeeding) or fail with
`pkexec: authorization failed`. If the test suite is not structured to handle the Linux
elevation path gracefully, the CI job hangs and times out after 6 hours.

**Prevention:**
Structure the elevation code for testability with a seam:
```typescript
// In elevated.ts, export the platform-specific spawn function for testing
export type ElevatedSpawner = (
  executable: string,
  args: string[],
  ipcPath: string
) => Promise<void>;

// Default implementation uses pkexec
export const defaultElevatedSpawner: ElevatedSpawner = ...;

// runElevated accepts an optional spawner override
export function runElevated(
  ipcPath: string,
  func: ...,
  args?: ...,
  spawner: ElevatedSpawner = defaultElevatedSpawner
): Promise<string>
```
In tests, inject a mock spawner that immediately connects a fake client to the socket:
```typescript
const mockSpawner: ElevatedSpawner = async (_, __, ipcPath) => {
  const client = new JsonSocket(new net.Socket());
  client.connect(ipcPath);
  // Simulate successful elevated execution
};
```
For CI, also add a `VORTEX_SKIP_ELEVATION` environment variable check — if set, skip
elevation with a clear log message rather than hanging:
```typescript
if (process.env.VORTEX_SKIP_ELEVATION === '1') {
  throw new UserCanceled();
}
```
Set `VORTEX_SKIP_ELEVATION=1` in CI environment for the Linux job.

**Phase:** ELEV-01 — the injectable spawner pattern must be designed in from the start;
retrofitting it after tests are written is harder.

---

### Pitfall 12: SteamOS immutable filesystem and polkit policy installation

**What goes wrong:**
Standard polkit setups involve writing a policy file to `/usr/share/polkit-1/actions/`
(e.g., `com.nexusmods.vortex.policy`). On SteamOS, `/usr/share/` is part of the
read-only `ostree` root filesystem. Writing to this path fails with `EROFS`. Additionally,
SteamOS's `ostree`-managed system is reset to the base image on OS updates — even if
`steamos-readonly disable` was used to write a policy file, the file will be erased on
the next SteamOS update.

The consequence: polkit-based elevation is not a viable long-term solution for SteamOS
unless the policy file is stored in `/home/` (which polkit does not read by default in
older versions, though polkit 0.119+ supports `~/.local/share/polkit-1/actions/` for
user-local policies).

**Prevention:**
For ELEV-02, do not use a polkit policy file approach on SteamOS. Instead:
1. Detect SteamOS by checking `os.release()` for `steamos` or checking for the presence
   of `/etc/os-release` containing `ID=steamos`.
2. On SteamOS, audit whether elevation is actually needed. Steam Deck's mod directories
   under `~/.steam/` and `~/` are user-writable. The need for elevation arises from
   writing to system directories (e.g., `/usr/`, `/etc/`). On Steam Deck, users do not
   install games to system paths — elevation may be a no-op requirement.
3. If elevation IS needed on SteamOS, use `sudo` with a NOPASSWD entry written to
   `~/.local/share/` equivalent — but there is no supported mechanism for this.
   The pragmatic answer: on SteamOS, show a notification explaining that elevated
   operations are not supported and require Desktop Mode with polkit configured.

**Warning signs:**
- Any code that writes to `/usr/share/polkit-1/` will fail on SteamOS
- `polkitd --version` succeeds but `pkexec <command>` hangs on SteamOS in Game Mode
- `/etc/os-release` contains `ID=steamos` or `VARIANT_ID=steamdeck`

**Phase:** ELEV-02 — SteamOS elevation alternative must be decided before implementation.
The pragmatic answer (skip elevation + user notification) may be the only viable option.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `patch-package` for gamebryo-savegame | Avoids forking the package | Patch breaks silently on version bump; must re-verify after any gamebryo-savegame update | Acceptable for v3.0; plan to upstream the fix or fork with a Linux-maintained fork |
| Hardcode `pkexec` path as `"pkexec"` | Simpler spawn call | Fails if pkexec is not in `$PATH` (minimal containers, some embedded distros) | Acceptable; `pkexec` is in `/usr/bin/pkexec` on all standard desktops; add `which pkexec` pre-check |
| Use `/tmp` for socket path instead of `XDG_RUNTIME_DIR` | Portable across all distros | `/tmp` may be memory-backed tmpfs with size limits on some distros; `XDG_RUNTIME_DIR` is better for sessions | Acceptable for v3.0; existing `getIPCPath()` uses `/tmp` already and is correct |
| Skip elevation on SteamOS (show notification) | No SteamOS-specific complexity | Users on SteamOS cannot use symlink deployment | Acceptable for v3.0 given polkit constraints; document clearly in UI |
| `VORTEX_SKIP_ELEVATION=1` CI escape hatch | Unblocks CI without mock infrastructure | Not a real test of the elevation code path | Never acceptable as permanent; requires mock spawner pattern as follow-up |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `pkexec` + `net.Server` | Start socket server after spawning pkexec — race condition | Listen on socket FIRST, then spawn pkexec |
| `pkexec` + environment | Pass full parent env to elevated process — security and contamination risk | `pkexec` strips env by default; the child should receive only what it needs |
| `patch-package` + pnpm | Patch file keyed to wrong package path format | pnpm patches use `+` separator: `patches/gamebryo-savegame+1.2.3.patch` |
| `@electron/rebuild` + pnpm virtual store | Rebuild finds no addons in `.pnpm/` virtual store | Verify addons appear in rebuild output; use `--module-dir` if missing |
| node-gyp `OS=="linux"` condition | Misspelling `"OS=='linux'"` (single quote inside double quote is correct; do not use double inside double) | Test locally: `node-gyp configure && cat build/config.gypi` to confirm the condition is parsed |
| `std::runtime_error` patch | Only fixing the constructor — leaving `what()` implementation using MSVC-specific `_what` | Replace entire class; verify `e.what()` returns the message on GCC |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Writing arbitrary user-controlled content into elevated temp file | Code injection — attacker controls what runs as root | The temp file is generated from `func.toString()` (developer-controlled) and `args` (JSON-serialized). Ensure `args` values are JSON-serialized (not interpolated raw strings) before writing to the script |
| Reusing the same `ipcPath` across elevation calls | Second elevation attempt attaches to previous session's socket | Generate a unique `ipcPath` per `runElevated()` call using `crypto.randomUUID()` or timestamp+PID |
| Leaving the Unix domain socket file after process exit | Subsequent processes can connect to a stale listener | Unlink the socket file in the server `close` handler; also unlink on process `exit` and `SIGTERM` |
| Storing elevated temp file in world-writable `/tmp` without restrictive permissions | Another process overwrites the temp script before pkexec executes it | `tmp.file()` uses `0600` permissions by default; verify this is the case in the `tmp` package version in use |

---

## "Looks Done But Isn't" Checklist

- [ ] **gamebryo-savegame compilation:** Often missing the `binding.gyp` Linux linker flags — verify
  with `node -e "require('gamebryo-savegame')"` after `@electron/rebuild`, not just `node-gyp build` exit code
- [ ] **patch-package install:** Often the patch is authored correctly but `patch-package` is not in
  devDependencies and not called in `postinstall` — verify `pnpm install` from scratch triggers the patch
- [ ] **pkexec elevation:** Often tested with `pkexec echo hello` which succeeds, but the actual
  flow (pkexec → node → Unix socket → callback) is never end-to-end tested — verify with a real
  elevated operation in a Linux desktop session with a polkit agent running
- [ ] **Socket cleanup:** The `net.Server` appears to close correctly in tests, but the `.sock` file
  persists in `/tmp` — verify `fs.unlink(ipcPath)` is called in the server close handler
- [ ] **SteamOS detection:** `ID=steamos` check works for SteamOS 3.x but Steam Deck running a
  custom distro may use a different ID — also check for `VARIANT_ID=steamdeck` in `/etc/os-release`
- [ ] **Save game path:** The UI shows "0 saves found" on Linux even though saves exist — verify
  the path resolution uses the Proton Wine prefix, not `~/Documents`

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| MSVC exception constructor not patched | LOW | Write `patches/gamebryo-savegame+{version}.patch`; add `patch-package` to `postinstall`; re-run `pnpm install` |
| Missing lz4/zlib linker flags | LOW | Extend the same patch to modify `binding.gyp`; add `liblz4-dev` to CI apt step |
| Socket race condition (pkexec before listen) | MEDIUM | Refactor `runElevated` Linux branch; re-test with timing delays to confirm race is closed |
| pkexec hangs in CI | LOW | Add `VORTEX_SKIP_ELEVATION=1` check; add timeout on socket server; fix immediately when discovered |
| SteamOS polkit unavailable | LOW | Show "elevation not supported on SteamOS" notification; do not hang UI |
| Elevated process uses Electron binary instead of node | MEDIUM | Change `process.execPath` to system `node` in Linux branch; re-test elevated operations end-to-end |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| MSVC exception constructor in gamebryosavegame.cpp | SAVE-01 | `node-gyp build` exits 0; `require('gamebryo-savegame')` loads without error |
| Missing lz4/zlib linker flags in binding.gyp | SAVE-01 | Same as above; `ldd gamebryo-savegame.node` shows liblz4 and libz resolved |
| patch-package breaks on version bump | SAVE-01 | `pnpm install` from scratch produces patched source; `verify-patches.js` script passes |
| Socket-before-spawn ordering | ELEV-01 | End-to-end test: elevated Node process connects to socket within 2s of pkexec spawn |
| `/tmp` socket path length + cleanup | ELEV-01 | `ls /tmp/*.sock` clean after elevation completes; path length assertion in `getIPCPath()` |
| pkexec availability + hang | ELEV-01 | `which pkexec` check; 5s timeout on socket connect; child exit code monitoring |
| SteamOS polkit not running | ELEV-02 | SteamOS detection check; UI notification path; no UI hang |
| Elevated process using Electron binary | ELEV-01 | Elevated process stderr clean; system `node --version` matches expected |
| CI hang without polkit agent | ELEV-01 | `VORTEX_SKIP_ELEVATION=1` set in CI; test suite completes without timeout |
| Save game path uses native ~/Documents | SAVE-02/03 | Save game manager shows saves for Skyrim SE on Linux with Proton |
| TypeScript transpiled helpers in serialized function | ELEV-01 | Smoke test: run generated temp file with `node <tmpfile>` directly; no ReferenceError |

---

## Sources

- Codebase audit (HIGH confidence):
  - `node_modules/.pnpm/gamebryo-savegame/.../src/gamebryosavegame.cpp` — MoreInfoException MSVC bug (Phase 3 RESEARCH.md confirmed)
  - `node_modules/.pnpm/gamebryo-savegame/.../binding.gyp` — missing Linux lz4/zlib linker flags (Phase 3 RESEARCH.md confirmed)
  - `src/renderer/src/util/elevated.ts` — full `runElevated()` implementation including `ShellExecuteEx` call site
  - `src/renderer/src/util/ipc.ts` — `getIPCPath()` returns `/tmp/vortex-{id}.sock` on Linux
  - `src/renderer/src/extensions/symlink_activator_elevate/index.ts` — 6 `runElevated()` call sites confirmed (Phase 5 elevation audit)
  - `src/main/src/MainWindow.ts` — `nodeIntegration: true`, `contextIsolation: false` confirmed (Electron sandbox not active for main window)
  - `.planning/phases/05-ipc-and-elevation-audit/05-ELEVATION-AUDIT.md` — all 6 call sites documented, startup path confirmed clean
  - `.planning/phases/03-native-addon-compilation/03-RESEARCH.md` — NADD-06 audit: both errors precisely identified
- C++ standard (HIGH confidence):
  - `std::exception` standard constructor list (ISO C++17 §18.8.1): only default, copy, and `const char*` constructors — `std::exception(another_exception)` is MSVC extension
- Linux `sockaddr_un` (HIGH confidence):
  - `man 7 unix`: `sun_path` is 108 bytes on Linux; maximum path length is 107 chars + null terminator
- `pkexec` / polkit behavior (MEDIUM confidence):
  - polkit upstream documentation: without a registered authentication agent, `pkexec` returns `exit code 127` or hangs
  - SteamOS issue tracker: multiple confirmed reports of polkit agent not running in Game Mode
  - `man pkexec`: environment stripping behavior documented
- systemd-tmpfiles (MEDIUM confidence):
  - `man systemd-tmpfiles`: default `/tmp` aging policy 10 days on standard distributions
  - SteamOS Wiki: SteamOS uses shorter `/tmp` retention; `/home` is the recommended persistent location
- `patch-package` behavior (HIGH confidence):
  - `patch-package` README: patches keyed to exact version; mismatch produces warning but does not fail build

---

*Pitfalls research for: Vortex v3.0 — gamebryo-savegame Linux compilation + pkexec elevation*
*Researched: 2026-04-01*
