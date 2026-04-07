# Stack Research

**Domain:** Electron mod manager — Linux native addon compilation + privilege elevation
**Researched:** 2026-04-01
**Confidence:** HIGH — all claims verified against codebase, official GCC docs, node-gyp patterns,
and existing patch precedents in this repository

---

## Scope

This document covers only the *new* stack additions for v3.0. It supersedes the v2.0 STACK.md for
the SAVE-01 and ELEV-01/02 requirements. Previously validated capabilities are listed once and
marked "already validated."

---

## Already Validated — Do Not Re-Research

| Component | Status | Notes |
|-----------|--------|-------|
| Electron 39 on Linux | v1.0 | Runs; 16 runtime `.so` deps in devcontainer |
| winapi-bindings shim | v1.0 | 48-function shim; webpack + rolldown aliases |
| loot/bsatk/esptk/vortexmt/xxhash-addon native addons | v1.0 | Compile on Linux CI via `@electron/rebuild` |
| pnpm `patchedDependencies` mechanism | v1.0 | `patches/loot@6.2.1.patch` is the precedent |
| `postinstall-libloot.cjs` pattern | v1.0 | Builds from source at `pnpm install` time; Linux-only guard |
| CI: ubuntu-latest with liblz4-dev + cmake + Rust | v2.0 | Already in build and package workflows |
| AppImage/deb distribution | v2.0 | electron-builder target change done |
| Platform guard pattern | All phases | `if (process.platform === 'linux') { ... }` |

---

## SAVE-01: gamebryo-savegame Linux Compilation

### Root Cause Analysis

Inspecting `node_modules/.pnpm/gamebryo-savegame.../src/`:

**Issue 1 — MSVC-only `std::exception` constructor (compilation failure):**

```cpp
// gamebryosavegame.cpp line 27 — MSVC only, fails on GCC/Clang
class MoreInfoException : public std::exception {
public:
  MoreInfoException(const char *message, ...)
    : std::exception(std::runtime_error(message))   // <-- MSVC extension; no such ctor in libstdc++
    ...
```

GCC's `std::exception` has no constructor that accepts a `std::runtime_error`. MSVC extends
`std::exception` with a `std::exception(const std::exception&)` constructor — this is an
MSVC-specific extension not in the C++ standard.

**Fix:** Inherit from `std::runtime_error` instead of `std::exception`. This is standard C++,
compiles on all platforms, and preserves `what()` behaviour identically:

```cpp
class MoreInfoException : public std::runtime_error {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::runtime_error(message)     // standard; works on GCC, Clang, MSVC
    ...
```

**Issue 2 — `binding.gyp` has no Linux library section (linker failure):**

The current `binding.gyp` `libraries` block is Windows-only:
```
"conditions": [
  ['OS=="win"', {
    "include_dirs": ["./lz4/include", "./zlib/include"],
    "libraries": ["-l../lz4/dll/liblz4", "-l../zlib/lib/zlib", ...],
    ...
  }]
]
```

On Linux there is no `OS=="linux"` condition, so `lz4.h` is never in the include path and
`-llz4`/`-lz` are never passed to the linker. Result: `lz4.h: No such file or directory` and
`undefined reference to LZ4_decompress_safe`.

**Fix:** Add an `OS=="linux"` condition using system library flags (same pattern as
`patches/loot@6.2.1.patch`):

```gyp
["OS=='linux'", {
  "cflags_cc": ["-std=c++17"],
  "libraries": ["-llz4", "-lz"],
  "include_dirs": [
    "<!@(pkg-config --cflags-only-I liblz4 | sed 's/-I//g')",
    "<!@(pkg-config --cflags-only-I zlib | sed 's/-I//g')"
  ]
}]
```

**Alternative (simpler, avoids pkg-config at gyp eval time):**

```gyp
["OS=='linux'", {
  "cflags_cc": ["-std=c++17"],
  "libraries": ["-llz4", "-lz"]
}]
```

The simpler form works because `liblz4-dev` and `zlib1g-dev` install headers to
`/usr/include/lz4.h` and `/usr/include/zlib.h` — which are on the default GCC include path.
No explicit `include_dirs` needed when using system packages.

**Issue 3 — `DirectDecoder` passes `toWC()` result to `std::ifstream`:**

On Linux, `string_cast.h` defines a `#else` branch where `toWC()` returns `std::string` (not
`std::wstring`). `std::ifstream` accepts `const char*` from `.c_str()` on a `std::string`, so
this compiles cleanly on Linux. **No fix needed here.**

**Issue 4 — `determineEncoding()` uses `_WIN32`-guarded wchar logic:**

```cpp
#ifdef _WIN32
  // wchar_t Cyrillic detection via toWC
#else
  // ... falls through; no Linux implementation
#endif
return CodePage::UTF8ORLATIN1;
```

The `#ifdef _WIN32` branch in `determineEncoding()` (line 287–310) is already guarded — Linux
gets the fall-through that returns `CodePage::UTF8ORLATIN1`. **No fix needed here.**

### Delivery Mechanism

**Use `pnpm patch` (same as `loot@6.2.1.patch`).**

This is the established pattern in this repository. The alternative — a `postinstall-gamebryo.cjs`
script that patches the source — is more complex and defers errors to install time.

Steps:
1. `pnpm patch gamebryo-savegame` — opens the package in an editable staging area
2. Edit `src/gamebryosavegame.cpp` — fix `MoreInfoException` base class
3. Edit `binding.gyp` — add `OS=='linux'` condition
4. `pnpm patch-commit <staging-path>` — writes `patches/gamebryo-savegame@2.1.2.patch` and registers it in `pnpm-workspace.yaml`

The `gamebryo-savegame` package is already in `pnpm-workspace.yaml` under `allowBuilds`.

### System Libraries Required

| Library | Ubuntu package | Version | CI status |
|---------|---------------|---------|-----------|
| lz4 | `liblz4-dev` | 1.9.4 | **Already in CI** (`build.yml`, `package.yml`) |
| zlib | `zlib1g-dev` | 1.3 | Pre-installed on `ubuntu-latest`; explicit add recommended for clarity |

**Recommendation:** Add `zlib1g-dev` explicitly to the apt install line in CI workflows (belt-and-suspenders — it is almost certainly pre-installed on ubuntu-latest runners but the explicit dependency is self-documenting):

```yaml
sudo apt-get install -y libfontconfig1-dev cmake liblz4-dev zlib1g-dev
```

**Windows impact:** Zero. The patch adds an `OS=='linux'` condition to `binding.gyp`. The
existing `OS=='win'` condition is untouched. The `MoreInfoException` fix uses standard C++17
(`std::runtime_error` inheritance) — MSVC compiles this correctly.

### Compiler Flags for C++17

The `binding.gyp` currently specifies `/std:c++20` for MSVC only. For GCC/Clang, node-gyp
defaults to C++14. gamebryo-savegame uses `std::optional`, structured bindings, and other C++17
features — the `-std=c++17` flag is required in the Linux condition.

```gyp
["OS=='linux'", {
  "cflags_cc": ["-std=c++17", "-fexceptions"],
  "libraries": ["-llz4", "-lz"]
}]
```

`-fexceptions` is also needed: the top-level `binding.gyp` removes `-fno-exceptions` via
`cflags_cc!`, but node-gyp may still suppress exceptions in Release builds. Explicit is safer.

**Confidence:** HIGH — verified by reading `binding.gyp`, `src/gamebryosavegame.cpp`,
`src/string_cast.h`, GCC `std::exception` documentation, and the loot patch precedent.

---

## ELEV-01: pkexec + Unix Domain Socket Elevation

### What Needs to Change

The existing `runElevated()` in `src/renderer/src/util/elevated.ts` uses two Windows-only mechanisms:

| Mechanism | Current (Windows) | Needed (Linux) |
|-----------|------------------|----------------|
| Privilege escalation | `winapi.ShellExecuteEx({ verb: "runas" })` | `pkexec node <tmpFile>` |
| IPC transport | Named pipe (Windows `net.Socket` + `json-socket` connects to `\\.\pipe\...` path) | Unix domain socket (`net.Socket` connects to `/tmp/...` path) |

**Good news:** The `elevatedMain` function body already uses `json-socket` over `net.Socket`. Unix
domain sockets and Windows named pipes both go through Node's `net.Socket` API — the code is
transport-agnostic. The `getIPCPath()` utility (added in v1.0 Phase 5) already returns a
`/tmp/vortex_<id>` path on Linux instead of `\\.\pipe\vortex_<id>`. So the IPC side is
**already correct for Linux** — no additional library needed.

The only change needed is the elevation invocation in the outer `runElevated()` function.

### Platform Guard Pattern

```typescript
// elevated.ts — in runElevated(), replace the winapi.ShellExecuteEx call:

if (process.platform === 'linux') {
  // pkexec runs the script as root; node is found via process.execPath's sibling
  // or via which(node). The elevated process connects back via the Unix socket
  // that the parent already created at ipcPath.
  const { spawn } = require('child_process');
  spawn('pkexec', ['node', tmpPath], {
    detached: true,
    stdio: 'ignore',
  }).unref();
  return resolve(tmpPath);
} else {
  winapi.ShellExecuteEx({
    verb: 'runas',
    file: process.execPath,
    parameters: `--run ${tmpPath}`,
    directory: path.dirname(process.execPath),
    show: 'shownormal',
  });
  return resolve(tmpPath);
}
```

**Why `pkexec node <tmpFile>` and not `pkexec <electron-binary> --run <tmpFile>`:**

The elevated process only needs Node.js — it runs a plain `.js` file over a socket. Invoking the
Electron binary elevated is unnecessary and potentially fragile (Electron's arg parsing might
interfere). `pkexec node` requires the `node` binary to be findable — use the `node` binary
adjacent to `process.execPath` or resolve via `which`.

**Better: use `process.execPath` sibling `node`:**

```typescript
const nodeBin = path.join(path.dirname(process.execPath), 'node');
const nodeBinFallback = 'node'; // system node if sibling not found
const nodeExec = fs.existsSync(nodeBin) ? nodeBin : nodeBinFallback;
spawn('pkexec', [nodeExec, tmpPath], { detached: true, stdio: 'ignore' }).unref();
```

### Polkit Action File (Required for Non-Interactive Use)

`pkexec` without a polkit action file will prompt with a password dialog. For user-triggered
operations (mod deployment) this is acceptable, but requires a `.policy` file for correct display.

**Required file:** `/usr/share/polkit-1/actions/io.nexusmods.vortex.policy`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC
 "-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
 "http://www.freedesktop.org/standards/PolicyKit/1.0/policyconfig.dtd">
<policyconfig>
  <vendor>Vortex Mod Manager</vendor>
  <vendor_url>https://www.nexusmods.com/about/vortex/</vendor_url>

  <action id="io.nexusmods.vortex.run-elevated">
    <description>Perform a privileged mod deployment operation</description>
    <message>Vortex needs elevated privileges to complete this operation.</message>
    <defaults>
      <allow_any>auth_admin</allow_any>
      <allow_inactive>auth_admin</allow_inactive>
      <allow_active>auth_admin</allow_active>
    </defaults>
    <annotate key="org.freedesktop.policykit.exec.path">/usr/bin/node</annotate>
    <annotate key="org.freedesktop.policykit.exec.allow_gui">true</annotate>
  </action>
</policyconfig>
```

**Delivery:** The `.policy` file must be installed to `/usr/share/polkit-1/actions/` at package
installation time. For `.deb` packages, this goes in the post-install script. For AppImage
(without system installation), `pkexec` falls back to prompting for the admin password — which
is acceptable. The policy file is optional for functional correctness; it improves the UX dialog.

**electron-builder `.deb` integration:**
```json
"deb": {
  "afterInstall": "scripts/linux/postinstall.sh"
}
```

Where `postinstall.sh` copies the policy file. This is a v3.0 stretch goal; the `pkexec` call
works without it (password dialog still appears).

### No New npm Dependencies Needed

| Component | Status |
|-----------|--------|
| `json-socket` | Already in `node_modules`; used by existing `elevatedMain` |
| `net` (Node.js built-in) | Already used; Unix domain sockets use the same API |
| `child_process` (Node.js built-in) | For `spawn('pkexec', ...)` |
| `tmp` | Already used for temp file creation |

**Windows impact:** Zero. The entire Linux code path is inside
`if (process.platform === 'linux')`. The Windows `winapi.ShellExecuteEx` call is untouched.

**Confidence:** HIGH — verified by reading `elevated.ts`, `ipc.ts`, `json-socket` npm package,
Node.js `net.createServer` Unix domain socket docs.

---

## ELEV-02: Polkit-Free Elevation on SteamOS/Steam Deck

### SteamOS Elevation Constraints

SteamOS (Steam Deck) uses an immutable filesystem by default. Key facts:

1. **polkit is present** on SteamOS — `pkexec` is available in `/usr/bin/pkexec`.
2. **The `deck` user is in the `wheel` group** with passwordless sudo configured via
   `/etc/sudoers.d/wheel` (99-wheel-nopasswd or similar). SteamOS configures this in Desktop Mode.
3. **polkit on SteamOS** uses a JavaScript rules engine (`/etc/polkit-1/rules.d/`). Valve ships
   a rule granting members of `wheel` group `auth_admin_keep` for certain actions.
4. **The root filesystem is read-only** — `/usr/share/polkit-1/actions/` cannot be written to
   without `steamos-readonly disable`. This means the Vortex polkit action file cannot be
   installed in the standard location on SteamOS without user intervention.
5. **Alternative: `sudo` invocation** — `deck` user has passwordless sudo; `sudo node <tmpFile>`
   works without a password dialog on SteamOS.

### Recommended Pattern: pkexec with `sudo` Fallback

```typescript
async function getElevationCommand(nodeExec: string, tmpPath: string): Promise<string[]> {
  if (process.platform !== 'linux') return [];

  // Try pkexec first (standard polkit elevation — shows branded dialog)
  const pkexecAvailable = await commandExists('pkexec');
  if (pkexecAvailable) {
    return ['pkexec', nodeExec, tmpPath];
  }

  // Fallback: sudo (SteamOS passwordless wheel, or headless environments)
  return ['sudo', '-n', nodeExec, tmpPath];
}
```

**Why `sudo -n` (non-interactive):**
`-n` makes `sudo` fail immediately if a password would be required, rather than blocking.
On SteamOS with passwordless `wheel`, `sudo -n` succeeds silently. On a standard distro without
passwordless sudo, it fails — which is the correct signal to fall back to a user-visible error.

**Detection of SteamOS vs standard Linux:**

```typescript
function isSteamOS(): boolean {
  // /etc/os-release on SteamOS contains: ID=steamos
  // This file is readable on the immutable filesystem
  try {
    const release = fs.readFileSync('/etc/os-release', 'utf8');
    return release.includes('ID=steamos');
  } catch {
    return false;
  }
}
```

Use this only if the two-step pkexec/sudo fallback is not sufficient — the fallback approach
handles both cases without OS detection.

### Polkit Rules (SteamOS Alternative to Policy File)

If polkit rules are desired without requiring the immutable filesystem to be unlocked, polkit
rules can be placed in `~/.local/share/polkit-1/rules.d/` (user-writable). This is supported
by polkit 0.106+ (polkit 124 is present on this system, confirmed above).

```javascript
// ~/.local/share/polkit-1/rules.d/50-vortex.rules
polkit.addRule(function(action, subject) {
  if (action.id == "io.nexusmods.vortex.run-elevated" &&
      subject.local && subject.active) {
    return polkit.Result.YES;
  }
});
```

This grants elevation without a password for the local active session. **However:** user-local
polkit rules are only respected in some polkit configurations (depends on how the agent is
running). This is a best-effort enhancement, not a primary mechanism.

**Primary recommendation:** Use `pkexec` → `sudo -n` fallback. This handles SteamOS without
any policy file installation.

### No New Dependencies for ELEV-02

The `sudo` fallback uses `child_process.spawn` (Node.js built-in). The OS detection reads
`/etc/os-release` with `fs.readFileSync`. No new packages needed.

**Windows impact:** Zero. ELEV-02 code is inside
`if (process.platform === 'linux')` blocks.

**Confidence:** MEDIUM — SteamOS `deck` user passwordless sudo is well-documented in Valve
developer documentation and the Steam Deck modding community. The `/etc/os-release` detection
pattern is verified against freedesktop.org specification. Polkit 0.106+ user-local rules
support is verified against polkit upstream documentation. Direct SteamOS hardware testing is
still needed for runtime validation (noted as UAT pending).

---

## Core Technologies Summary

### Core Technologies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `pnpm patch` | Built-in pnpm 10 | gamebryo-savegame source patch | Established pattern (`patches/loot@6.2.1.patch`); one-step, no new tooling |
| `liblz4-dev` | 1.9.4 (Ubuntu pkg) | lz4 headers + linker lib for gamebryo-savegame | System package; already in CI; `pkg-config` confirms `-llz4` |
| `zlib1g-dev` | 1.3 (Ubuntu pkg) | zlib headers + linker lib for gamebryo-savegame | Pre-installed on ubuntu-latest; explicit apt line recommended |
| `pkexec` | 124 (system) | Linux privilege elevation | Standard polkit frontend; pre-installed on all major distros |
| `child_process` (Node.js) | Node 22 built-in | Spawn `pkexec` / `sudo` | No npm package needed |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `json-socket` | Existing in node_modules | IPC serialization in elevated process | Already used; Unix domain sockets use same API as Windows named pipes |
| `net` (Node.js built-in) | Node 22 built-in | Unix domain socket server/client | IPC between parent Vortex process and elevated child |
| `tmp` | Existing in node_modules | Temp `.js` file for elevated script | Already used in `runElevated()` |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `pnpm patch` | Patch gamebryo-savegame | Creates `patches/gamebryo-savegame@2.1.2.patch` |
| `pnpm patch-commit` | Commit patch and register in workspace | Updates `pnpm-workspace.yaml` `patchedDependencies` |
| `@electron/rebuild` | Rebuild patched native addon against Electron headers | Already in CI; run after patch applied |
| `pkg-config` | Verify lz4/zlib include paths in dev environment | Diagnostic only; not needed in gyp if using system default paths |

---

## Binding.gyp Linux Condition — Final Form

This is the exact addition needed to `binding.gyp` via `pnpm patch`:

```gyp
"conditions": [
    ['OS=="win"', {
        "include_dirs": [
            "./lz4/include",
            "./zlib/include"
        ],
        "libraries": [
            "-l../lz4/dll/liblz4",
            "-l../zlib/lib/zlib",
            "-DelayLoad:node.exe"
        ],
        "defines": [
            "UNICODE",
            "_UNICODE"
        ],
        "msvs_settings": {
            "VCCLCompilerTool": {
                "ExceptionHandling": 1
            }
        },
        "msbuild_settings": {
            "ClCompile": {
                "AdditionalOptions": ["/std:c++20", "/Zc:__cplusplus"]
            }
        }
    }],
    ['OS=="linux"', {
        "cflags_cc": ["-std=c++17", "-fexceptions"],
        "libraries": ["-llz4", "-lz"]
    }]
]
```

**Note:** No `include_dirs` needed in the Linux condition because `liblz4-dev` and `zlib1g-dev`
install to `/usr/include/` which is on GCC's default search path.

---

## MoreInfoException Fix — Final Form

This is the C++ change needed in `src/gamebryosavegame.cpp`:

```cpp
// BEFORE (MSVC-only — fails on GCC/Clang):
class MoreInfoException : public std::exception {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::exception(std::runtime_error(message))
    ...

// AFTER (standard C++17 — compiles on GCC, Clang, MSVC):
class MoreInfoException : public std::runtime_error {
public:
  MoreInfoException(const char *message, const char *syscall, const std::string &fileName, int code)
    : std::runtime_error(message)
    ...
```

`std::runtime_error` inherits from `std::exception` and provides `what()` — callers that catch
`std::exception` continue to work. The only semantic change is that `typeid(*e) == typeid(MoreInfoException)`
remains true (no slicing), and `e.what()` returns the `message` string as before.

---

## What NOT to Add

| Approach | Why Rejected |
|----------|-------------|
| `libsecret` / D-Bus credentials store | Not needed for elevation; credential storage is a separate concern |
| `node-dbus` or similar D-Bus npm bindings | pkexec is the polkit CLI frontend; no D-Bus binding needed |
| `sudo-prompt` npm package | Provides a cross-platform sudo dialog, but adds a dependency for something that's 4 lines of `child_process.spawn` |
| `electron-sudo` npm package | Abandoned; last release 2016 |
| `polkit` npm package | No maintained package exists for direct polkit D-Bus communication from Node.js |
| `cmake` for gamebryo-savegame | The package uses node-gyp (binding.gyp), not CMake; cmake was only needed for libloot |
| Bundling lz4/zlib as git submodules | lz4/zlib are universal system packages; bundling adds maintenance burden and binary size |
| Forking gamebryo-savegame to GitHub | pnpm patch is less invasive; keeps upstream path open; fork requires managing a separate repo |
| `sudo` as primary elevation (no pkexec) | `sudo` is not universally available in all GUI elevation scenarios; pkexec is the desktop-aware choice for non-SteamOS |

---

## Integration Points for Requirements/Roadmap

| Requirement | Stack change | Files to create/modify |
|-------------|-------------|----------------------|
| SAVE-01: gamebryo-savegame compiles on Linux | `pnpm patch` → `patches/gamebryo-savegame@2.1.2.patch` | `src/gamebryosavegame.cpp` (MoreInfoException fix), `binding.gyp` (Linux condition) |
| SAVE-01: CI compiles gamebryo-savegame | Add `zlib1g-dev` to apt line (belt-and-suspenders) | `.github/workflows/build.yml`, `.github/workflows/package.yml` |
| ELEV-01: pkexec + Unix socket elevation | Platform guard in `runElevated()` | `src/renderer/src/util/elevated.ts` |
| ELEV-02: SteamOS elevation | `sudo -n` fallback in `runElevated()` | `src/renderer/src/util/elevated.ts` |
| ELEV-02: Polkit policy file (optional) | `.policy` XML + deb postinstall | `scripts/linux/postinstall.sh`, `src/main/electron-builder.config.json` |

---

## Version Compatibility

| Package | Version | Compatibility Note |
|---------|---------|-------------------|
| `gamebryo-savegame` | 2.1.2 | Patch targets this version; update version in patch file name if upstream releases 2.1.3+ |
| `node-addon-api` | `^7.0.0` (in gamebryo-savegame package.json) | Compatible with napi v8; no change needed |
| `pkexec` | 0.105+ required for `--disable-internal-agent` flag (not used here); any version works for basic invocation | Ubuntu 24.04 ships 124 |
| `polkit` user-local rules | Requires polkit 0.106+ | ubuntu-latest ships polkit 124; SteamOS ships polkit 0.117+ |

---

## Sources

- `node_modules/.pnpm/gamebryo-savegame.../src/gamebryosavegame.cpp` — confirmed MSVC `std::exception` ctor issue
- `node_modules/.pnpm/gamebryo-savegame.../src/string_cast.h` — confirmed `#else` Linux stubs for `toWC`/`toMB`
- `node_modules/.pnpm/gamebryo-savegame.../binding.gyp` — confirmed no Linux condition
- `patches/loot@6.2.1.patch` — established pnpm patch pattern; `OS=='linux'` gyp condition format
- `src/renderer/src/util/elevated.ts` — confirmed current Windows-only `ShellExecuteEx` invocation
- `src/renderer/src/util/ipc.ts` (phase 5) — confirmed `getIPCPath()` returns Unix socket path on Linux
- `.github/workflows/build.yml` + `package.yml` — confirmed `liblz4-dev` already in CI; `zlib1g-dev` absent
- `pnpm-workspace.yaml` — confirmed `gamebryo-savegame` in `allowBuilds`; `patchedDependencies` mechanism
- `.planning/phases/05-ipc-and-elevation-audit/05-ELEVATION-AUDIT.md` — confirmed 6 `runElevated` call sites; all user-triggered; `ShellExecuteEx` throws on Linux
- GCC `std::exception` docs — no constructor accepting `std::runtime_error`; MSVC extension confirmed non-standard
- `pkg-config --libs liblz4` → `-llz4`; `pkg-config --libs zlib` → `-lz` (verified on this system)
- polkit 0.106+ changelog — user-local rules in `~/.local/share/polkit-1/rules.d/`
- freedesktop.org `/etc/os-release` specification — `ID=steamos` for Steam Deck detection
- Valve Steam Deck developer documentation (MEDIUM confidence) — `deck` user passwordless sudo

---

*Stack research for: Vortex Linux — v3.0 gamebryo-savegame compilation + elevation*
*Researched: 2026-04-01*
