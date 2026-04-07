# Feature Research: Vortex Linux v3.0 — Save Games + Elevation

**Domain:** Electron mod manager — save game management + privilege escalation on Linux
**Researched:** 2026-04-01
**Confidence:** HIGH — all claims based on direct codebase inspection
**Milestone scope:** SAVE-01 through SAVE-03, ELEV-01, ELEV-02

---

## Prerequisite: What Is Already Built

Before detailing v3.0 features, these v1.0/v2.0 foundations are assumed complete and in scope
as dependencies:

- `{mygames}` resolves to `compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games`
  on Linux (STAM-04 — confirmed working)
- Skyrim SE and Fallout 4 detected and manageable on Linux via Steam/Proton (STAM-05)
- gamebryo-savegame addon is DISABLED on Linux with a clear error via lazy-load failure (NADD-06)
- `runElevated()` in `elevated.ts` calls `winapi.ShellExecuteEx` which currently throws on Linux
  (ShellExecuteEx shim raises NotImplemented)
- `symlink_activator_elevate` extension already returns `isSupported() = false` on non-win32
- `IPC path` uses Unix domain sockets on Linux (already patched in v1.0, IPC-01 through IPC-04)

---

## Category 1: Save Game Manager — C++ Addon Compilation (SAVE-01)

### What Is Linux-Incompatible in gamebryo-savegame

Exactly two blockers prevent the addon from compiling on Linux. Both are in the C++ source or
build configuration.

**Blocker 1: MSVC exception constructor extension**

In `gamebryosavegame.cpp`, `MoreInfoException` inherits `std::exception` and calls:

```cpp
MoreInfoException(...) : std::exception(std::runtime_error(message)) { ... }
```

This is an MSVC extension — GCC and Clang do not allow a string or `std::exception` argument
to the `std::exception` constructor. Fix: call `std::runtime_error` directly as the base class,
or store message in `m_Message` and override `what()`. The fix is ~5 lines in
`gamebryosavegame.cpp` with no behavioral change.

**Blocker 2: lz4 and zlib linker flags are Windows-only**

`binding.gyp` contains a single `conditions: [['OS=="win"', { ... }]]` block that provides:
- Include dirs for lz4 and zlib headers (`./lz4/include`, `./zlib/include`)
- Library flags: `-l../lz4/dll/liblz4`, `-l../zlib/lib/zlib`

These are Windows DLL pre-built binaries downloaded by `download_lz4.js` (only runs on
`process.platform === "win32"`). Linux has no equivalent condition block in `binding.gyp`.
Fix: add `OS=="linux"` condition block linking against system liblz4 and zlib (`-llz4 -lz`),
which are available as `liblz4-dev` and `zlib1g-dev` on Debian/Ubuntu.

### What Is Already Cross-Platform

| Component | Status | Notes |
|-----------|--------|-------|
| `string_cast.h` Linux stub | Ready | On non-Win32: `toWC()` returns `const char*` as `std::string`; `toMB()` same — no-op pass-through |
| `determineEncoding()` Cyrillic detection | Benign on Linux | `#ifdef _WIN32` around Cyrillic heuristic; Linux always returns `UTF8ORLATIN1` — correct default |
| Binary file I/O (all `read*` methods) | Fully portable | Standard `std::ifstream` with POSIX `stat()` fallback already in place |
| LZ4Decoder, ZlibDecoder | Portable once linked | Uses standard `LZ4_decompress_safe()` and `z_stream` APIs — platform-independent |
| Screenshot decoding (RGB→RGBA) | Fully portable | Standard `memcpy` loop |
| Plugin list parsing | Fully portable | String operations only |
| File mtime fallback (`m_CreationTime`) | Already guarded | `#ifdef _WIN32 _wstat / #else stat()` already present in `read()` |
| NAPI async thread callback | Fully portable | `Napi::ThreadSafeFunction` is cross-platform |
| Save format detection (Oblivion/Skyrim/FO3/FO4 headers) | Fully portable | Pure binary header matching |
| `DirectDecoder` file open | Portable after fix | `toWC().c_str()` on Linux returns `const char*` — `std::ifstream(const char*)` is standard |

### Table Stakes for SAVE-01

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `MoreInfoException` compiles on GCC/Clang | Prerequisite for any Linux build | LOW | ~5-line change: replace `std::exception(message)` base call |
| lz4/zlib linked via system packages on Linux | Build system parity with loot addon pattern | LOW | Add `OS=="linux"` block to `binding.gyp`; use `-llz4 -lz` |
| Linux build dependencies declared in CI | Developer environment reproducibility | LOW | `liblz4-dev` and `zlib1g-dev` in CI apt-get step |
| `GamebryoSave.node` produced by `node-gyp rebuild` on Linux | Addon functional | LOW | Follows from above two fixes |
| CI step verifies `.node` loads without linker errors | Confidence in ship artifact | LOW | `ldd GamebryoSave.node` check, consistent with loot pattern |

---

## Category 2: Save Game Manager UI (SAVE-02, SAVE-03)

### What the UI Must Do

The `gamebryo-savegame-management` extension registers a "Save Games" main page via
`context.registerMainPage("savegame", "Save games", SavegameList, ...)`. The page is already
built and works on Windows. The question for Linux is path resolution and save file location.

**Save file location on Linux for Proton games:**

On Windows: `%USERPROFILE%\Documents\My Games\<Game>\Saves\`
On Linux (Proton): `~/.local/share/Steam/steamapps/compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/<Game>/Saves/`

The `mygamesPath()` function in `gamebryo-savegame-management/src/util/gameSupport.ts` calls:

```typescript
path.join(util.getVortexPath("documents"), "My Games", gameSupport.get(gameMode, "mygamesPath"))
```

On Linux, `getVortexPath("documents")` must return the Wine prefix documents path (not
`~/Documents`) for Proton games. This was solved by STAM-04 — the `{mygames}` variable
resolution redirects to the Wine prefix path. However, the `mygamesPath()` in the savegame
extension calls `getVortexPath("documents")` directly, not through the `{mygames}` variable
resolver. Verify whether STAM-04 also patched `getVortexPath("documents")` or only the
`ini_prep/gameSupport.ts` variable substitution.

**Per-game `mygamesPath` values (already in gameSupport.ts):**

| Game | `mygamesPath` value | Full Linux path (relative to Wine prefix docs) |
|------|--------------------|-------------------------------------------------|
| Skyrim SE | `Skyrim Special Edition` | `.../steamuser/Documents/My Games/Skyrim Special Edition/Saves/` |
| Fallout 4 | `Fallout4` | `.../steamuser/Documents/My Games/Fallout4/Saves/` |

**Save file formats:**

| Game | Extension | Format header |
|------|-----------|---------------|
| Skyrim SE | `.ess` + `.skse` | `TESV_SAVEGAME` |
| Fallout 4 | `.fos` + `.f4se` | `FO4_SAVEGAME` |

The addon reads both — no Linux-specific format differences.

**UI components (already implemented, require no changes for Linux):**

- `SavegameList.tsx` — table view with sortable columns
- `ScreenshotCanvas.tsx` — renders screenshot from `Uint8ClampedArray` buffer
- `savegameAttributes.tsx` — character name, level, location, playtime, creation time, plugins
- `PluginList.tsx` — list of plugins loaded at save time
- `Settings.tsx` — local saves per-profile toggle

### Table Stakes for SAVE-02 / SAVE-03

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Save list loads for Skyrim SE on Linux (SAVE-02) | Core save manager function | MEDIUM | Depends on correct save path resolution via STAM-04 |
| Save list loads for Fallout 4 on Linux (SAVE-03) | Core save manager function | MEDIUM | Same path dependency |
| Character name displayed correctly (UTF-8) | Users identify saves by character | LOW | C++ `toMB()` stub on Linux is pass-through — no encoding issue for UTF-8 names |
| Character level displayed | Users identify saves by progression | LOW | Integer field — no platform difference |
| Save location (in-game area name) displayed | Users identify saves by context | LOW | String field — no platform difference |
| Save timestamp displayed | Users sort saves chronologically | LOW | Uses POSIX `stat().st_mtime` fallback — works on Linux |
| Playtime displayed | Users identify saves by session | LOW | String field from binary format |
| Screenshot thumbnail rendered in list | Users identify saves visually | LOW | RGBA buffer decoded by C++ — works once addon compiles |
| Plugin list visible for a selected save | Users verify mod compatibility | LOW | Plugin array from binary format — no platform difference |
| "Open Save Games" button opens correct directory | Users manage files externally | MEDIUM | Path must resolve to Wine prefix docs path |
| "Refresh" button reloads saves | Live session management | LOW | Debouncer + turbowalk — no platform dependency |
| Corrupted save shown with error state | Partial file tolerance | LOW | `CORRUPTED_NAME` sentinel already in code |
| "Remove save" deletes both `.ess` and `.skse` | Save integrity | LOW | `saveFiles()` returns both extensions — no platform difference |
| Save manager page hidden when game not supported | Extension discoverability | LOW | `gameSupported()` guard already exists |

### Differentiators for Save Management

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Profile-scoped saves on Linux | Per-modlist save isolation | MEDIUM | Already implemented for Windows; requires `SLocalSavePath` INI patching in Wine prefix |
| Transfer saves between profiles on Linux | Modlist migration | MEDIUM | `transferSavegames()` is pure Node.js file copy — works once path is correct |
| "Restore plugins" from save on Linux | Reproduce exact load order | LOW | `restoreSavegamePlugins()` calls `api.events.emit("set-plugin-list")` — no platform dependency |

### Anti-Features for Save Management

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Creating Wine prefix documents path | Proton manages prefix; Vortex creating it can interfere with game first-launch | Check for existence, return `ENOENT`-safe empty list |
| Scanning global `~/Documents/My Games/` on Linux for saves | Wrong path for Proton games | Always use Wine prefix path from STAM-04 resolution |
| Supporting non-Proton Linux game saves (native Bethesda builds) | Bethesda games do not have native Linux builds | No action needed |
| Steam Deck cloud sync conflict management | Complex; requires Valve's cloud save API | Defer — not in v3.0 scope |

---

## Category 3: Elevation (ELEV-01, ELEV-02)

### What Elevation Is For

On Windows, `runElevated()` in `util/elevated.ts` serializes a JavaScript closure into a
temp file, then launches a new Node process elevated via `ShellExecuteEx` with `verb: "runas"`.
The elevated process communicates results back over a named pipe / Unix domain socket.

On Linux the mechanism uses `ShellExecuteEx` (Windows API) to trigger the UAC dialog — which
does not exist. The shim throws, causing `runElevated()` to reject with an error.

**Known call sites (from v1.0 audit — 6 total, all user-triggered):**

1. `util/fs.ts`: `elevatedUnlock()` — grants `rwx` permission on a locked path via `permissions` module
2. `util/fs.ts`: `elevated()` — generic wrapper used by `elevatedUnlock`
3. `extensions/symlink_activator_elevate/index.ts`: `startElevated()` / `stopElevated()` — symlink deployment service management
4. `extensions/symlink_activator_elevate/index.ts`: `removeTask()` — clean up Windows scheduled task
5. `util/runElevatedCustomTool.ts` — run a game tool (e.g., SKSE) elevated
6. `ExtensionManager.ts` — one call site for extension-triggered elevation

**Which call sites actually fire on Linux:**

- `symlink_activator_elevate`: `isSupported()` returns false on non-win32 → symlink deployment
  never activates → `startElevated()`/`stopElevated()`/`removeTask()` never called
- `removeTask()`: Explicitly gated `if (process.platform !== "win32") return undefined`
- `elevatedUnlock()` in `fs.ts`: Fires on `EPERM` from file operations — THIS CAN FIRE on Linux
  when deploying mods to a path the user does not own (e.g., system-installed game directory)
- `runElevatedCustomTool.ts`: Can fire if user launches an external tool with elevation checked

**The realistic Linux elevation need:**

Most Steam games are installed to `~/.local/share/Steam/steamapps/common/` — user-owned, no
elevation needed. Elevation on Linux is only needed when:
1. The game is installed to a system path (e.g., `/opt/Steam/` — rare but valid)
2. A deployment destination path requires root (e.g., custom mods folder on a root-owned mount)
3. A user requests an elevated tool launch

**ELEV-01: pkexec + Unix domain socket elevation**

The Linux analog to `ShellExecuteEx verb:runas` is `pkexec` (PolicyKit Execute). The pattern:
1. Write the serialized JS closure to a temp file (same as today)
2. Instead of `ShellExecuteEx`, run: `pkexec <node-executable> --run <tmpPath>`
3. pkexec displays an authentication dialog (polkit agent — graphical on GNOME/KDE)
4. The elevated Node process connects back via the already-working Unix domain socket

The existing IPC infrastructure (Unix domain socket) is already correct for Linux (patched in
v1.0, IPC-01 through IPC-04). Only the launch mechanism needs replacing.

**ELEV-02: Steam Deck / SteamOS polkit-free elevation**

Steam Deck runs as user `deck`. The account has a blank password by default and can `sudo`
without a password. The polkit agent in Gaming Mode may not be present. Options:
1. `sudo -n` (non-interactive) — works if NOPASSWD is set in sudoers
2. `pkexec --disable-internal-agent` + pre-configured polkit rule granting Vortex elevation
3. Detect SteamOS and fall back to `sudo -n` before trying pkexec

### Table Stakes for ELEV-01

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `runElevated()` on Linux uses `pkexec` instead of `ShellExecuteEx` | Core elevation mechanism | MEDIUM | Platform guard in `elevated.ts`; `pkexec` is standard on all major distros |
| Elevated Node process runs the serialized closure | Parity with Windows behavior | LOW | Same closure serialization; only launcher changes |
| Result returned via Unix domain socket | IPC already works | LOW | Socket path already correct from IPC-01 patch |
| User cancellation detected (pkexec exit code 126) | UX — cancel ≠ error | LOW | pkexec exits 126 when user cancels auth dialog; map to `UserCanceled` |
| Auth failure detected (pkexec exit code 127) | UX — distinguish cancel from failure | LOW | pkexec exits 127 on auth failure; map to error with user message |
| pkexec unavailable handled gracefully | Headless / minimal systems | LOW | Check for pkexec in PATH at call site; show "elevation not available" |
| Elevated process receives correct `node_modules` paths | Closure requires npm packages | LOW | Same `moduleRoot` injection as Windows; already in `elevatedMain` |
| `elevated()` function in `fs.ts` uses new Linux path | `elevatedUnlock()` works on Linux | LOW | The `elevated()` function wraps `runElevated()` — benefit is automatic |

### Table Stakes for ELEV-02

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| SteamOS detected (check `/etc/os-release` `ID=steamos`) | Different elevation strategy needed | LOW | One-time detection at startup |
| `sudo -n` attempted on SteamOS before pkexec | Steam Deck user has NOPASSWD sudo | LOW | `deck` account has passwordless sudo by design |
| Graceful fallback when `sudo -n` fails | Not all SteamOS setups are default | LOW | Fall through to pkexec if `sudo -n` exits non-zero |
| No polkit dialog shown on Steam Deck when NOPASSWD works | UX — seamless on Deck | LOW | `sudo -n` is non-interactive by definition |
| Elevation path documented for custom SteamOS setups | Power user transparency | LOW | Error message suggests `pkexec` / polkit setup |

### Differentiators for Elevation

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| GUI polkit agent auto-detected (GNOME/KDE) | Correct dialog shown based on DE | LOW | pkexec invokes installed agent automatically — no extra work |
| Elevation prompt includes operation description | Users understand what they're authorizing | MEDIUM | pkexec supports `--action-id` for polkit rules with descriptions |
| Persistent elevation token (one auth per session) | Fewer password prompts | HIGH | Requires polkit rule with session-scoped authorization — complex; defer |
| `kdesu` / `gksu` fallback for legacy systems | Older distros without pkexec | LOW | Detect pkexec absence, try kdesu/gksu — LOW value, not in v3.0 |

### Anti-Features for Elevation

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Running Vortex itself as root | Security hazard; Electron as root is dangerous | Always run Vortex as user; elevate only specific operations |
| `sudo` with stored password | Password storage in app is a security risk | Use pkexec / polkit agent only |
| Requiring root for mod deployment to user-owned paths | Breaks most common setup (user-installed Steam) | Check path ownership first; only elevate when actually needed |
| Windows scheduled task pattern on Linux | Tasks API doesn't exist on Linux | On Linux, the elevated process exits after its operation — no persistent service |
| Silently retrying EPERM without elevation prompt | UX — user should know elevation is happening | Always show polkit/pkexec dialog before elevated operation |

---

## Feature Dependencies

```
SAVE-01 (addon compiles on Linux)
  └── SAVE-02 (Skyrim SE save list) — addon must load for refreshSavegames() to work
  └── SAVE-03 (Fallout 4 save list) — same dependency

STAM-04 ({mygames} in Wine prefix) — already completed v2.0
  └── SAVE-02 (correct save path) — mygamesPath() must resolve to Wine prefix docs
  └── SAVE-03 (correct save path) — same

ELEV-01 (pkexec elevation)
  └── ELEV-02 (Steam Deck path) — ELEV-02 is a specialization of ELEV-01's mechanism

IPC-01 through IPC-04 (Unix socket IPC) — already completed v1.0
  └── ELEV-01 — elevated process communicates over already-correct Unix socket

SAVE-01 ──independent──> ELEV-01  (no dependency between them)
```

### Dependency Notes

- **SAVE-02/SAVE-03 require STAM-04:** The save manager calls `mygamesPath(gameMode)` which
  calls `util.getVortexPath("documents")`. On Linux this must return the Wine prefix docs path.
  Verify whether STAM-04 patched `getVortexPath("documents")` globally or only through the
  `{mygames}` variable resolver in `ini_prep`. If global, SAVE-02/03 get it for free. If only
  via `ini_prep`, savegame extension needs its own Linux override.

- **ELEV-02 extends ELEV-01:** The pkexec mechanism from ELEV-01 must exist before ELEV-02 can
  add the `sudo -n` pre-check for SteamOS. Both can be implemented in the same phase.

---

## MVP Definition for v3.0

### Launch With (v3.0)

- [ ] SAVE-01: `MoreInfoException` + lz4/zlib linking fixed; `GamebryoSave.node` compiles on Linux CI
- [ ] SAVE-02: Save list loads for Skyrim SE; character name, level, location, timestamp visible
- [ ] SAVE-03: Save list loads for Fallout 4; same attributes visible
- [ ] ELEV-01: `runElevated()` uses `pkexec` on Linux; cancel (126) mapped to `UserCanceled`
- [ ] ELEV-02: SteamOS detection; `sudo -n` pre-check before pkexec on Steam Deck

### Add After Validation (v3.x)

- [ ] Profile-scoped saves with INI patching inside Wine prefix — trigger: SAVE-02/03 confirmed working
- [ ] Save transfer between profiles — trigger: profile saves working
- [ ] Elevation operation description via polkit action-id — trigger: ELEV-01 in use

### Future Consideration (v4.0+)

- [ ] Steam cloud save conflict detection for Linux — deferred; requires Valve cloud API
- [ ] Persistent elevation token (session-scoped polkit rule) — high complexity, low frequency need
- [ ] `kdesu`/`gksu` legacy fallback — minimal user value given pkexec ubiquity since 2012

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SAVE-01: addon compiles | HIGH | LOW | P1 |
| SAVE-02: Skyrim SE saves visible | HIGH | MEDIUM | P1 |
| SAVE-03: Fallout 4 saves visible | HIGH | MEDIUM | P1 |
| ELEV-01: pkexec mechanism | MEDIUM | MEDIUM | P1 |
| ELEV-02: Steam Deck sudo path | MEDIUM | LOW | P1 |
| Profile-scoped saves (Linux INI) | MEDIUM | MEDIUM | P2 |
| Save transfer between profiles | LOW | LOW | P2 |
| Polkit action-id description | LOW | MEDIUM | P3 |
| Persistent elevation token | LOW | HIGH | P3 |

**Priority key:** P1 = in v3.0, P2 = after v3.0 validation, P3 = future

---

## Linux-Specific Behavioral Notes

### Save paths: Wine prefix vs native

On Windows, saves are at `%USERPROFILE%\Documents\My Games\<Game>\Saves\`.
On Linux (Proton games), saves are at:
`~/.local/share/Steam/steamapps/compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/<Game>/Saves/`

The `gamebryo-savegame-management` extension has no concept of Wine prefixes — it only calls
`util.getVortexPath("documents")`. If STAM-04 made `getVortexPath("documents")` return the
Wine prefix path when a Proton game is active, the savegame extension works transparently.
If not, a platform guard is needed in `mygamesPath()` inside the extension.

### pkexec dialog UX by desktop environment

- **GNOME**: `gnome-polkit` agent (installed by default) shows a lock-icon password dialog
- **KDE Plasma**: `polkit-kde-authentication-agent-1` shows a KDE-styled dialog
- **XFCE / minimal DEs**: `lxpolkit` or similar; may not be installed — `pkexec` falls back to
  terminal prompt if no graphical agent found
- **Steam Deck Gaming Mode**: No graphical polkit agent active; `sudo -n` (ELEV-02) is the
  only viable path without requiring the user to set up a polkit agent

### pkexec security note

pkexec 0.105 (CVE-2021-4034 "PwnKit") was patched in most distros by early 2022. Modern
systems (Ubuntu 22.04+, Fedora 35+, Debian 11+) are safe. The security concern is historical;
current pkexec usage is standard practice for GUI elevation.

---

## Sources

- Codebase: `/home/alex/src/Vortex/node_modules/.pnpm/node_modules/gamebryo-savegame/src/gamebryosavegame.cpp`
- Codebase: `/home/alex/src/Vortex/node_modules/.pnpm/node_modules/gamebryo-savegame/src/gamebryosavegame.h`
- Codebase: `/home/alex/src/Vortex/node_modules/.pnpm/node_modules/gamebryo-savegame/src/string_cast.h`
- Codebase: `/home/alex/src/Vortex/node_modules/.pnpm/node_modules/gamebryo-savegame/binding.gyp`
- Codebase: `/home/alex/src/Vortex/extensions/gamebryo-savegame-management/src/index.ts`
- Codebase: `/home/alex/src/Vortex/extensions/gamebryo-savegame-management/src/util/gameSupport.ts`
- Codebase: `/home/alex/src/Vortex/extensions/gamebryo-savegame-management/src/util/refreshSavegames.ts`
- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/elevated.ts`
- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/fs.ts` (elevatedUnlock, elevated functions)
- Codebase: `/home/alex/src/Vortex/src/renderer/src/extensions/symlink_activator_elevate/index.ts`
- Codebase: `/home/alex/src/Vortex/.planning/PROJECT.md` (ELEV-01/ELEV-02 requirements, v1.0 audit)
- Codebase: `/home/alex/src/Vortex/.planning/STATE.md` (v1.0 phase 05 elevation audit findings)
- Confidence: HIGH — all claims based on direct codebase inspection, no training-data assertions

---
*Feature research for: Vortex Linux v3.0 — Save Games + Elevation*
*Researched: 2026-04-01*
