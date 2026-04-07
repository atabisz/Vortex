# Phase 9: Native Addon Fix + Elevation Foundation - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent tracks:

1. **SAVE track** — `gamebryo-savegame` native addon compiles and loads on Linux CI. Requires:
   - `MoreInfoException` base class changed from MSVC-only `std::exception(std::runtime_error(...))` to `std::runtime_error` in `gamebryosavegame.cpp`
   - `binding.gyp` gains `OS=="linux"` condition with system lz4/zlib linker flags
   - Both fixes delivered as a single `pnpm patch`, pinned to exact package version
   - CI apt step extended with build-time deps; `.deb` `depends` extended with runtime deps

2. **ELEV track** — `runElevated()` no longer crashes on Linux. Requires:
   - Linux branch that spawns `pkexec` instead of calling `winapi.ShellExecuteEx`
   - Socket server starts *before* `pkexec` is spawned (socket-before-spawn ordering)
   - `pkexec` exit code 126 maps to `UserCanceled`
   - Injectable spawner seam so CI tests can verify no `ECONNREFUSED` without a real pkexec

This phase does NOT cover save game UI, SteamOS/polkit handling, or `.deb` polkit action file — those are Phase 10.

</domain>

<decisions>
## Implementation Decisions

### SAVE track: lz4/zlib on Linux

- **D-01:** Use **system libraries** for lz4 and zlib on Linux — linker flags `-llz4 -lz` in the new `OS=="linux"` binding.gyp condition. No bundling; both are standard on any modern Linux distro.
- **D-02:** Add `liblz4-dev` and `zlib1g-dev` to the **existing** `apt-get install` step in `.github/workflows/main.yml` (same line as `libfontconfig1-dev`). One combined build-deps step, no new CI step.
- **D-03:** Add `liblz4-1` and `zlib1g` to the `.deb` `depends` array in `electron-builder.config.cjs` now (not Phase 10). Current: `["xdg-utils", "libasound2"]` → append `"liblz4-1"` and `"zlib1g"`. Ensures the `.node` file loads at runtime after `.deb` install.

### SAVE track: patch scope and version pin

- **D-04:** Deliver **one pnpm patch** for `gamebryo-savegame` that contains both fixes:
  - `src/gamebryosavegame.cpp` — `MoreInfoException` base class fix
  - `binding.gyp` — `OS=="linux"` condition with `-llz4 -lz` linker flags
  Single patch, applied once by `pnpm install`. Established pattern: see `patches/loot@6.2.1.patch`.
- **D-05:** Pin `gamebryo-savegame` to its **exact version** in `package.json` / catalog before creating the patch. Current version: `2.1.2`. Research pitfall: pnpm patch silently skips on version mismatch — pinning prevents silent no-op on future version bumps.

### ELEV track: pkexec Linux branch

- **Claude's Discretion:** The exact shape of the pkexec Linux branch in `runElevated()` — whether `if (process.platform === 'linux')` guards the entire spawn block or only the `ShellExecuteEx` call, and the exact `child_process.spawn` invocation signature.
- **Claude's Discretion:** Injectable spawner seam design — env var, module-level setter, or parameter. Planner chooses what satisfies "no `ECONNREFUSED` in CI tests" from ELEV-01 SC-4. The seam must not require changes to call sites outside `elevated.ts`.
- **Claude's Discretion:** Non-126 pkexec failure handling (ENOENT, unexpected exit codes). Phase 9 must not hang — throw a descriptive error for non-126 cases rather than silently swallowing. SteamOS-specific `sudo -n` fallback is Phase 10 (ELEV-02).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §SAVE-01, ELEV-01 — exact acceptance criteria for both tracks, including all four ELEV-01 success criteria

### SAVE track — files to patch
- `node_modules/.pnpm/gamebryo-savegame@https+++codeload.github.com+Nexus-Mods+node-gamebryo-savegames+tar.gz_c6b7381d1bdf4d24985e1f36f81fa81d/node_modules/gamebryo-savegame/src/gamebryosavegame.cpp` — `MoreInfoException` at line 24; MSVC `std::exception(std::runtime_error(message))` → `std::runtime_error(message)` base class
- `node_modules/.pnpm/gamebryo-savegame@https+++codeload.github.com+Nexus-Mods+node-gamebryo-savegames+tar.gz_c6b7381d1bdf4d24985e1f36f81fa81d/node_modules/gamebryo-savegame/binding.gyp` — add `OS=="linux"` condition alongside existing `OS=="win"` condition

### SAVE track — patch reference
- `patches/loot@6.2.1.patch` — established pnpm patch format; follow the same structure for the gamebryo-savegame patch

### SAVE track — CI and packaging
- `.github/workflows/main.yml` — Linux apt-get step (currently installs `libfontconfig1-dev`); add `liblz4-dev zlib1g-dev` here
- `src/main/electron-builder.config.cjs` — `deb.depends` at line 66; add `liblz4-1` and `zlib1g`

### ELEV track — files to modify
- `src/renderer/src/util/elevated.ts` — `runElevated()` at line 103; `winapi.ShellExecuteEx(...)` call at line 175 is the replacement target; `getIPCPath(ipcPath)` already injected at line 135 (socket path is correct)
- `src/renderer/src/util/winapi-shim.ts` — `ShellExecuteEx` at line 95 currently throws "not supported on Linux — elevation requires pkexec (deferred)"; this throw is what Phase 9 routes around
- `src/renderer/src/util/ipc.ts` — `getIPCPath()` utility; already returns Unix socket path on Linux — socket-before-spawn ordering can use this directly

### Prior phase patterns
- `.planning/phases/05-ipc-and-elevation-audit/05-CONTEXT.md` — IPC socket path decisions (D-01–D-04); serialization trap already resolved; pkexec deferred decision
- `.planning/phases/03-native-addon-compilation/03-CONTEXT.md` — addon CI patterns, pnpm catalog pins, `@electron/rebuild` setup

### Roadmap
- `.planning/ROADMAP.md` §Phase 9 — success criteria list (4 items)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/renderer/src/util/ipc.ts` — `getIPCPath(id)` returns `path.join(os.tmpdir(), 'vortex-${id}.sock')` on Linux; already called at `elevated.ts:135` during script injection — socket path is Linux-correct, no changes needed there
- `patches/loot@6.2.1.patch` — pnpm patch format reference; same workflow applies for gamebryo-savegame

### Established Patterns
- `process.platform === 'linux'` guard — used consistently across all prior phases; use the same pattern in `elevated.ts` for the pkexec branch
- pnpm catalog: `gamebryo-savegame` version `2.1.2` (git tarball) — must pin to exact version before patching
- `binding.gyp` conditions: `['OS=="win"', {...}]` pattern already in gamebryo-savegame; the Linux condition mirrors this structure

### gamebryo-savegame current state
- Version: `2.1.2` (git tarball from `codeload.github.com/Nexus-Mods/node-gamebryo-savegames`)
- C++ issue: `MoreInfoException(const char*, const char*, const std::string&, int)` at line 26 calls `std::exception(std::runtime_error(message))` — MSVC-only constructor; GCC rejects it
- binding.gyp issue: `OS=="win"` condition includes `./lz4/dll/liblz4` and `./zlib/lib/zlib`; no `OS=="linux"` condition exists

### elevated.ts current state (post-Phase 5)
- `getIPCPath(ipcPath)` already injected at line ~135: `let ipcPath = '${getIPCPath(ipcPath)}'`
- `elevatedMain` child function: `client.connect(ipcPath)` — already platform-correct (path is pre-resolved by parent)
- `winapi.ShellExecuteEx({verb: "runas", ...})` at line ~175 — this call throws on Linux (winapi-shim); Phase 9 adds a `if (process.platform === 'linux')` branch before this call that spawns pkexec instead

### Integration Points
- `src/main/electron-builder.config.cjs:66` — `deb.depends` array; add `"liblz4-1"` and `"zlib1g"`
- `.github/workflows/main.yml` — Linux apt-get step; add `liblz4-dev zlib1g-dev` alongside `libfontconfig1-dev`
- `elevated.ts:~175` — replace/guard the `winapi.ShellExecuteEx` call with Linux pkexec branch

</code_context>

<specifics>
## Specific Ideas

- The `MoreInfoException` fix is minimal: change `std::exception(std::runtime_error(message))` to `std::runtime_error(message)` as the base class initializer. The rest of the constructor body is unchanged.
- The binding.gyp `OS=="linux"` condition needs only: `"libraries": ["-llz4", "-lz"]`. The `cflags!` and `cflags_cc!` from the top-level target already enable exceptions; no MSVC-specific settings needed.
- The pkexec invocation: `pkexec node --run <tmpPath>` — `process.execPath` on Linux is the Electron binary, same as Windows. Socket server must be listening before `pkexec` is spawned (the IPC `net.Server.listen()` call must precede `child_process.spawn('pkexec', ...)`).
- pkexec exit code 126 = user dismissed the auth dialog → `UserCanceled`. Exit code 127 = pkexec not found or policy error → throw descriptive error (not UserCanceled). Other non-zero → throw with exit code in message.

</specifics>

<deferred>
## Deferred Ideas

- pkexec spawner seam specifics — planner decides (Claude's Discretion above)
- SteamOS `sudo -n` fallback and polkit-less hang prevention — ELEV-02, Phase 10
- `.deb` polkit action file (`io.nexusmods.vortex.policy`) — ELEV-03, Phase 10
- Save game UI validation — SAVE-02, SAVE-03, SAVE-04, Phase 10

None outside these — discussion stayed within Phase 9 scope.

</deferred>

---

*Phase: 09-native-addon-fix-elevation-foundation*
*Context gathered: 2026-04-01*
