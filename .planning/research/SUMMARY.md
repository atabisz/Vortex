# Project Research Summary

**Project:** Vortex Linux Support — v3.0 Save Games + Elevation
**Domain:** Electron mod manager — native C++ addon cross-compilation + Linux privilege escalation
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

Vortex v3.0 targets two independent capability areas explicitly deferred from earlier milestones: save game management for Bethesda titles on Linux, and privilege escalation for mod deployment operations requiring root. Both areas have well-understood, surgical solution paths. The gamebryo-savegame addon requires two targeted fixes (MSVC exception constructor portability + lz4/zlib linker flags), delivered via `pnpm patch` against the existing repository pattern. Elevation replaces the Windows-only `ShellExecuteEx` call with `pkexec` over the Unix domain socket IPC infrastructure already wired in v1.0 — the IPC plumbing is correct, only the launch mechanism changes.

The recommended approach is to implement SAVE-01 (C++ addon fix) and ELEV-01 (pkexec elevation) in parallel as Phase 1 — they share no files and have no runtime dependencies on each other. Phase 2 validates the save game UI layer (SAVE-02/03) and adds the SteamOS elevation specialization (ELEV-02). No new npm dependencies are needed for either area. No Windows code paths are touched. Total file change surface is narrow: one C++ source fix, one `binding.gyp` addition, one TypeScript platform branch in `elevated.ts`, one new `platform.ts` utility (~10 lines), and removal of one build guard in a `package.json`.

The primary risks are the socket-before-spawn race condition in the elevation path (the Unix domain socket server must be listening before `pkexec` is spawned), SteamOS polkit unavailability in Game Mode (pkexec hangs without a polkit agent — requiring `sudo -n` fallback or a skip-elevation notification), and silent patch invalidation on package version bumps. All three have clear, upfront mitigations that must be built into the initial implementation rather than retrofitted.

---

## Key Findings

### Recommended Stack

No new stack additions are needed for v3.0. All components are either already in the codebase or provided by system packages. The `gamebryo-savegame` fix uses `pnpm patch` (same pattern as `patches/loot@6.2.1.patch` already in this repository) and links against `liblz4-dev` + `zlib1g-dev`, both already in CI or trivially added. The elevation implementation uses `child_process.spawn` (Node.js built-in), `pkexec` (pre-installed on all major desktop Linux distros), and the existing `json-socket` + `net.Socket` Unix domain socket infrastructure from v1.0.

**Core technologies:**
- `pnpm patch`: deliver gamebryo-savegame C++ fixes — established pattern in this repo (`patches/loot@6.2.1.patch`); one-step, no new tooling
- `liblz4-dev` / `zlib1g-dev`: system packages for lz4/zlib linking — `liblz4-dev` already in CI; `zlib1g-dev` pre-installed on `ubuntu-latest`
- `pkexec` (system): Linux privilege escalation frontend — pre-installed on all major distros; standard polkit client
- `child_process` (Node.js built-in): spawn `pkexec` / `sudo` — zero new npm dependencies
- `net.Socket` + `json-socket` (existing): Unix domain socket IPC for elevated child communication — already wired in v1.0, IPC-01 through IPC-04

### Expected Features

**Must have (table stakes — v3.0 launch):**
- SAVE-01: `MoreInfoException` base class changed from `std::exception` to `std::runtime_error` — prerequisite for any Linux GCC/Clang build
- SAVE-01: `binding.gyp` `OS=="linux"` condition with `-llz4 -lz` linker flags — links gamebryo-savegame against system lz4/zlib
- SAVE-02: Save game manager UI loads and displays saves for Skyrim SE on Linux — depends on correct Wine prefix path resolution from STAM-04
- SAVE-03: Save game manager UI loads and displays saves for Fallout 4 on Linux — same path dependency as SAVE-02
- ELEV-01: `runElevated()` uses `pkexec` on Linux with socket-before-spawn ordering — platform branch replaces `ShellExecuteEx`; pkexec exit-126 mapped to `UserCanceled`
- ELEV-02: SteamOS detection + `sudo -n` fallback or skip-elevation notification — Steam Deck users must not encounter a hung UI

**Should have (v3.x after validation):**
- Profile-scoped saves with INI patching inside Wine prefix — `SLocalSavePath` support on Linux; unblocked once SAVE-02/03 confirmed working
- Save transfer between profiles on Linux — pure Node.js file copy; trivial once paths are correct
- Polkit action file for `.deb` post-install (`io.nexusmods.vortex.policy`) — improves UX dialog branding; non-blocking, pkexec works without it

**Defer (v4.0+):**
- Steam cloud save conflict detection — requires Valve cloud API; substantial complexity
- Persistent elevation token (session-scoped polkit rule) — high complexity, low frequency need
- NXM handler via Steam Browser overlay on Steam Deck (PROT-03) — hardware unavailable for testing; deferred from v2.0

### Architecture Approach

Both v3.0 feature areas are self-contained within the renderer process — no main process changes required. The gamebryo-savegame addon loads directly in the renderer (no IPC boundary), so patching the native addon is sufficient to unblock the save UI with no extension TypeScript changes beyond removing the Windows-only build guard. Elevation lives entirely in `util/elevated.ts`; the Unix socket IPC plumbing from v1.0 (`getIPCPath()` returning `/tmp/vortex-{id}.sock`) is already correct. The SteamOS detection utility (`isSteamOS()`) is a new ~10-line helper in `util/platform.ts` — renderer-side, called only from within the `process.platform === "linux"` elevation branch.

**Major components (changed):**
1. `node-gamebryo-savegames` native addon — C++ parser for `.ess`/`.fos` save files; fix delivered via `pnpm patch` to `binding.gyp` and `gamebryosavegame.cpp`
2. `extensions/gamebryo-savegame-management/package.json` — build guard removal after SAVE-01 lands; no logic changes to the extension itself
3. `util/elevated.ts` — `runElevated()` receives a `process.platform === "linux"` branch with `pkexec` spawn; socket-before-spawn ordering required (see Pitfall 1)
4. `util/platform.ts` (new) — `isSteamOS()` helper; reads `/etc/os-release`; called only from Linux elevation branch

**Unchanged (confirmed no modifications needed):**
- `util/ipc.ts` — `getIPCPath()` already returns `/tmp/vortex-{id}.sock` on Linux (v1.0, IPC-01)
- `symlink_activator_elevate/index.ts` — already guarded with `isSupported()` returning false on non-Windows
- Main process, preload process — no save game or elevation logic lives there

### Critical Pitfalls

1. **Socket-before-spawn race condition (ELEV-01)** — `pkexec` returns asynchronously; if the `net.Server` is not bound before `spawn("pkexec", ...)` is called, the elevated child's `connect()` races against the server's `listen()`. Structure the Linux branch: `await server.listen(ipcPath)`, then spawn. Intermittent `ECONNREFUSED` in the elevated child's stderr is the warning sign.

2. **pkexec unavailable / hanging without polkit agent (ELEV-01/ELEV-02)** — On SteamOS Game Mode, polkit agent is not running; `pkexec` hangs indefinitely or exits with code 127. Mitigation: `which pkexec` pre-check; 5-second timeout on socket `connect` event; `child.on("exit")` handler for non-zero exit codes; ELEV-02 adds `isSteamOS()` detection with `sudo -n` fallback or skip-elevation notification.

3. **Missing lz4/zlib `OS=="linux"` block in `binding.gyp` (SAVE-01)** — The existing `conditions` block covers only `OS=="win"`. Compilation may pass (headers found via system default GCC path) but linking fails with `undefined reference to LZ4_decompress_safe`. Fix must be in the same `pnpm patch` commit as the `MoreInfoException` fix. Verify with `ldd gamebryo-savegame.node` after `@electron/rebuild`.

4. **`pnpm patch` silently skips on version bump (SAVE-01)** — Patch files are keyed to exact package versions (`gamebryo-savegame+2.1.2.patch`). If the upstream package updates, `pnpm install` emits only a warning and proceeds with unpatched source. Mitigation: pin `gamebryo-savegame` to an exact version in `package.json`; add a `postinstall` verification step.

5. **Save game path uses native `~/Documents` instead of Wine prefix (SAVE-02/03)** — The `gamebryo-savegame-management` extension calls `util.getVortexPath("documents")` directly. On Linux this must return the Proton Wine prefix path. Verify whether STAM-04 patched `getVortexPath("documents")` globally or only through the `{mygames}` variable resolver in `ini_prep`. If only the latter, a platform override is needed in `gamebryo-savegame-management/src/util/gameSupport.ts`.

---

## Implications for Roadmap

The dependency graph from ARCHITECTURE.md directly drives the phase structure: two parallel Phase 1 tracks with no shared files, followed by sequential Phase 2 work that depends on both Phase 1 tracks.

### Phase 1: Native Addon Fix + Elevation Foundation (Parallel Tracks)

**Rationale:** SAVE-01 (C++ addon fix in the `node-gamebryo-savegames` repo) and ELEV-01 (TypeScript change in `elevated.ts`) share no files and have no runtime dependency on each other. Both target the `linux-port` branch per the project branch strategy. Both can be reviewed and merged simultaneously.

**Delivers:**
- Track A (SAVE-01): `gamebryo-savegame.node` compiles, links, and loads on Linux CI without linker errors; `pnpm patch` pattern established
- Track B (ELEV-01): `runElevated()` no longer throws on Linux; pkexec elevation path functional with socket-before-spawn ordering, cancel/timeout handling, and injectable spawner seam for CI testing

**Addresses:** SAVE-01, ELEV-01

**Avoids:** Socket-before-spawn race (Pitfall 1), pkexec hang (Pitfall 2), missing lz4/zlib linker flags (Pitfall 3), patch management (Pitfall 4), `@electron/rebuild` pnpm virtual store miss

**Files changed:**
- `node-gamebryo-savegames/binding.gyp` — add `OS=="linux"` condition with `-llz4 -lz`
- `node-gamebryo-savegames/src/gamebryosavegame.cpp` — change `MoreInfoException` base to `std::runtime_error`
- `src/renderer/src/util/elevated.ts` — add Linux branch with pkexec spawn, socket-before-spawn ordering, exit code handling, injectable spawner seam

### Phase 2: Save UI Validation + SteamOS Elevation

**Rationale:** Both items require Phase 1 to be complete. SAVE-02/03 need SAVE-01 (addon must compile before the save UI can be tested; build guard removal only makes sense after the addon works). ELEV-02 extends the Linux elevation branch created by ELEV-01.

**Delivers:**
- Save game manager displays character name, level, location, timestamp, screenshot for Skyrim SE and Fallout 4 on Linux (SAVE-02/03)
- SteamOS detected; `sudo -n` fallback or skip-elevation notification prevents hung UI on Steam Deck (ELEV-02)

**Addresses:** SAVE-02, SAVE-03, ELEV-02

**Avoids:** Wine prefix path error (Pitfall 5 — save games scanning `~/Documents` instead of Proton prefix), SteamOS polkit unavailability

**Files changed:**
- `extensions/gamebryo-savegame-management/package.json` — remove `process.platform === 'win32'` early-exit guard from build/dist scripts
- `src/renderer/src/util/elevated.ts` — add `isSteamOS()` check + SteamOS sub-path
- `src/renderer/src/util/platform.ts` (new) — `isSteamOS()` helper

### Phase Ordering Rationale

- SAVE-01 must precede SAVE-02/03: removing the build guard before the addon compiles causes CI to attempt building broken C++ code. The atomic commit rule (guard removal in the same PR as the addon fix) prevents this.
- ELEV-01 must precede ELEV-02: ELEV-02 adds a sub-branch inside the Linux elevation block that ELEV-01 creates. Without the ELEV-01 branch, ELEV-02 has nothing to extend and end-to-end testing is impossible.
- Phase 1 tracks A and B are parallel because their file sets are fully disjoint: C++ addon repo vs. renderer TypeScript. Different reviewers, different PRs, zero merge conflicts.
- SAVE-02/03 are primarily functional validation: the only TypeScript change is the build guard removal; the substance is confirming STAM-04 path resolution covers the savegame extension's `getVortexPath("documents")` call.

### Research Flags

**Phases with well-documented patterns (skip research-phase):**
- **Phase 1 Track A (SAVE-01):** Patch approach fully specified — exact `binding.gyp` diff, exact C++ change, exact `pnpm patch` commands. No additional research needed.
- **Phase 1 Track B (ELEV-01):** Socket-before-spawn ordering, pkexec exit-code handling, and injectable spawner design all specified in PITFALLS.md and ARCHITECTURE.md. No additional research needed.

**Phases needing validation during execution:**
- **Phase 2 SAVE-02/03:** STAM-04's `getVortexPath("documents")` scope (global vs. ini_prep-only) is unconfirmed. Must read the STAM-04 implementation before writing any save path override. See Gaps.
- **Phase 2 ELEV-02:** SteamOS `sudo -n` passwordless behavior is documentation-verified but not hardware-tested. Design for graceful fallback regardless; UAT on physical Steam Deck hardware required before shipping.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against actual files in the repository; exact `binding.gyp` diff confirmed; zero speculative dependencies |
| Features | HIGH | All feature completion states verified via direct source inspection; 6 elevation call sites audited in v1.0 with results in `.planning/phases/05-ipc-and-elevation-audit/` |
| Architecture | HIGH | Data flow diagrams derived from actual source; component boundaries confirmed; IPC protocol traced end-to-end through `elevated.ts` and `remoteCode.ts` |
| Pitfalls | HIGH (standard Linux) / MEDIUM (SteamOS) | Standard Linux pitfalls grounded in source + C++ standard references; SteamOS elevation behavior based on Valve documentation, not hardware testing |

**Overall confidence:** HIGH

### Gaps to Address

- **STAM-04 scope for `getVortexPath("documents")`:** STAM-04 resolved `{mygames}` via the `ini_prep` variable resolver. It is unconfirmed whether `getVortexPath("documents")` was also patched globally. The `gamebryo-savegame-management` extension calls it directly. Resolution before Phase 2: read `src/renderer/src/util/util.ts` and the STAM-04 commit diff to determine whether a platform override is needed in the savegame extension.

- **SteamOS `sudo -n` hardware validation:** The `deck` user having passwordless sudo is documented by Valve but has not been tested on physical Steam Deck hardware in this project. ELEV-02 must be designed with graceful fallback (show notification, do not hang) so that if `sudo -n` also fails, the user receives an actionable message.

- **`@electron/rebuild` pnpm virtual store behavior:** Pitfall 8 documents that `@electron/rebuild` may silently skip addons in `.pnpm/` virtual store paths. During SAVE-01 execution: verify `gamebryo-savegame` appears explicitly in the `@electron/rebuild` output log. If absent, add `--module-dir` pointing to the virtual store path.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `node_modules/.pnpm/gamebryo-savegame.../src/gamebryosavegame.cpp` — `MoreInfoException` MSVC bug confirmed
- `node_modules/.pnpm/gamebryo-savegame.../binding.gyp` — missing Linux condition confirmed
- `node_modules/.pnpm/gamebryo-savegame.../src/string_cast.h` — Linux stubs for `toWC`/`toMB` confirmed
- `patches/loot@6.2.1.patch` — established `pnpm patch` pattern; `OS=='linux'` gyp condition format
- `src/renderer/src/util/elevated.ts` — `runElevated()` with `ShellExecuteEx` call confirmed
- `src/renderer/src/util/ipc.ts` — `getIPCPath()` Unix socket path confirmed from v1.0
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts` — `isSupported()` Linux guard confirmed
- `extensions/gamebryo-savegame-management/src/util/refreshSavegames.ts` — addon call site confirmed
- `.planning/phases/05-ipc-and-elevation-audit/05-ELEVATION-AUDIT.md` — all 6 `runElevated()` call sites
- `.planning/phases/03-native-addon-compilation/03-RESEARCH.md` — NADD-06 audit, both errors identified
- `.planning/PROJECT.md` — v3.0 requirements, v1.0/v2.0 validated state

### Secondary (MEDIUM confidence)

- polkit upstream documentation — environment stripping by `pkexec`; exit code behavior without polkit agent
- freedesktop.org `/etc/os-release` specification — `ID=steamos` for Steam Deck detection
- Valve Steam Deck developer documentation — `deck` user passwordless sudo in Desktop Mode
- `man 7 unix` — `sun_path` is 108 bytes on Linux; maximum path 107 chars
- `patch-package` README — patches keyed to exact version; mismatch is a warning, not a build error

### Tertiary (LOW confidence)

- SteamOS issue tracker community reports — polkit agent not running in Game Mode; not Valve official documentation

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
