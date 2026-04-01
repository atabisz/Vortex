# Vortex Linux Support — v3.0 Complete

## Current State

**Shipped v3.0 on 2026-04-01.** gamebryo-savegame native addon compiles and loads on Linux CI. Save game manager UI works end-to-end for Skyrim SE and Fallout 4 on Linux. pkexec elevation wired with injectable seam. SteamOS / Steam Deck elevation handled gracefully via `sudo -n` fallback. `.deb` packages ship a branded polkit action file.

**A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.**

## What This Is

Vortex is an Electron-based mod manager for Nexus Mods, targeting Windows and Linux. v1.0 shipped the Linux boot milestone — `pnpm run start` works on Linux. v2.0 makes Vortex actually usable on Linux: Steam/Proton game detection, distributable packages (AppImage + .deb), and the NXM "Download with Manager" flow. v3.0 completes save game management and elevation for Skyrim SE, Fallout 4, and Steam Deck users.

## Core Value

A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.

## Requirements

### Validated

- ✓ Vortex launches and runs on Windows — existing
- ✓ Mod installation via FOMOD installer (.exe/.dll, C#/.NET) — existing
- ✓ Native addons (bsatk, esptk, loot, vortexmt, xxhash-addon, bsdiff-node) built for Windows — existing
- ✓ Elevation via Windows UAC + named pipes — existing
- ✓ Steam game detection on Windows via gamestore-steam extension — existing
- ✓ proton.ts foundation for Proton/Wine path resolution — existing
- ✓ **RENV-01**: Devcontainer includes all 16 Electron 39 runtime shared libraries — v1.0
- ✓ **RENV-02**: `localAppData()` returns `XDG_DATA_HOME ?? ~/.local/share` on Linux — v1.0
- ✓ **RENV-03**: electron-builder Linux packaging skips Windows `.exe` extraResources — v1.0
- ✓ **WAPI-01–05**: winapi-bindings 48-export Linux shim; webpack + rolldown aliases; Electron window appears — v1.0
- ✓ **NADD-01–06**: bsatk, esptk, loot, bsdiff-node, xxhash-addon compile on Linux CI; vortexmt clean; gamebryo-savegame disabled with NADD-06 audit — v1.0
- ✓ **FOMD-01–04**: Linux FOMOD binaries unpacked from asar; VortexIPCConnection strips .exe; TCP transport handshake validated — v1.0
- ✓ **IPC-01–04**: `getIPCPath()` utility; all 4 IPC sites patched; serialisation trap closed; elevation audit complete — v1.0
- ✓ **STAM-01**: Steam library VDF parsing works on Linux (native + Flatpak paths) — v2.0
- ✓ **STAM-02**: Flatpak Steam paths (`~/.var/app/com.valvesoftware.Steam`) resolved; dual-install handled — v2.0
- ✓ **STAM-03**: Proton prefix resolved per-game; never-launched games detected via `oslist` ACF field — v2.0
- ✓ **STAM-04**: `{mygames}` resolves to `compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games` on Linux — v2.0
- ✓ **STAM-05**: Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley confirmed working on Linux — v2.0
- ✓ **DIST-01**: AppImage artifact produced by electron-builder on Linux CI — v2.0
- ✓ **DIST-02**: .deb artifact with `xdg-utils` + `libasound2` deps produced on Linux CI — v2.0
- ✓ **DIST-03**: GitHub Actions parallel Linux job uploads artifacts alongside Windows — v2.0
- ✓ **DIST-04**: Auto-updater gated behind `process.env.APPIMAGE`; `latest-linux.yml` generated — v2.0
- ✓ **PROT-01**: NXM "Download with Manager" works on standard Linux in dev and AppImage builds — v2.0 (code-verified; live runtime UAT pending)
- ✓ **PROT-02**: `kbuildsycoca6` refresh wired for KDE Plasma; Steam Browser deferred to v4.0 — v2.0 (code-verified)
- ✓ **SAVE-01**: gamebryo-savegame compiles on Linux CI — MSVC exception constructors fixed, lz4/zlib linker flags added, CHAR_WIDTH fmt macro collision resolved — v3.0
- ✓ **ELEV-01**: pkexec + Unix domain socket elevation implemented; injectable spawner seam; socket-before-spawn ordering; 7 Vitest tests covering all exit code paths — v3.0
- ✓ **SAVE-02**: `mygamesPath()` async with Linux Proton branch; resolves `compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/<game>` — v3.0
- ✓ **SAVE-03**: Fallout 4 save path covered by same async branch (gameId-keyed lookup) — v3.0
- ✓ **SAVE-04**: `apply-settings` handler awaits `iniPath()` correctly; profile-scoped save comparison fixed — v3.0
- ✓ **ELEV-02**: `isSteamOS()` detection + `sudo -n` fallback in `runElevated()`; graceful `UserCanceled` on failure — v3.0
- ✓ **ELEV-03**: `io.nexusmods.vortex.policy` polkit action file shipped in .deb at `/usr/share/polkit-1/actions/` — v3.0

### Deferred (v4.0)

- [ ] **DIST-05**: AppImage delta auto-update on SteamOS immutable filesystem
- [ ] **PROT-03**: NXM handler via Steam Browser overlay on Steam Deck — requires Nexus Mods web team + hardware
- [ ] **SAVE-05**: Save transfer between profiles on Linux — pure file copy; trivial once SAVE-04 paths confirmed
- [ ] **ELEV-04**: Persistent elevation token (session-scoped polkit rule) — high complexity, low-frequency need

### Out of Scope

- Steam cloud save conflict detection — requires Valve cloud API; substantial new complexity
- Native Linux game support (GOG, itch.io) — separate track, deferred to v4.0+
- Heroic Launcher integration — deferred to v4.0+
- gamebryo-savegame for games beyond Skyrim SE and Fallout 4 — validate core path first
- Flatpak distribution — AppImage works; Flatpak sandbox restrictions need separate validation
- Wine wrapper for FOMOD — rejected; native Linux binaries exist in npm packages
- Large codebase refactors — Windows code paths must remain untouched; all Linux support is additive

## Context

**Shipped v3.0 on 2026-04-01.** All 7 v3.0 requirements validated (SAVE-01–04, ELEV-01–03).

**Technical state after v3.0:**
- Save game management: `mygamesPath()` and `iniPath()` are async with Linux Proton branch; `getSteamEntry()` uses `GameStoreHelper.getGameStore('steam')` (bundled extension constraint); `ILocalSteamEntry` local interface since `ISteamEntry` not exported by vortex-api
- Elevation: `runElevated()` has pkexec Linux branch with injectable spawner seam; socket-before-spawn enforced; `isSteamOS()` cached after first read; `sudo -n` fallback on SteamOS before pkexec
- Distribution: `.deb` includes `io.nexusmods.vortex.policy` polkit action at `/usr/share/polkit-1/actions/` via `electron-builder extraFiles`
- Test coverage: `elevated.test.ts` (7 Vitest tests); `gameSupport.test.ts` (vitest config + mocks); `tsconfig.json` excludes `__mocks__/` from production typecheck
- CI: ubuntu-latest and windows-latest both green throughout all 3 milestones; no Windows build regressions

**Platform guard pattern:** `if (process.platform === 'linux') { ... }` before Windows path — used consistently across all phases.

**Known UAT pending:** PROT-01/PROT-02 live runtime tests (AppImage + browser, KDE Plasma) — code-verified but not exercised on physical hardware yet.

## Constraints

- **Compatibility**: Windows build must never break — platform guards, not replacements
- **Diff size**: Prefer small, additive changes over refactors — no gutting existing modules
- **Dependencies**: No new runtime deps that affect Windows (Linux-only deps are fine)
- **FOMOD**: .NET 9 recompile path chosen — Wine wrapper explicitly rejected
- **Heroic Launcher**: Deferred to v4.0+

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FOMOD: recompile for Linux via .NET 9 | Native Linux binary, no Wine dep, .NET 9 already in devcontainer | ✓ Validated — Linux ELF binaries ship in npm packages, TCP transport handshake confirmed |
| winapi-bindings: platform shim (not removal) | Registry/UAC functions already guarded — shim replaces the module binding only | ✓ Done — webpack + rolldown aliases, 48-function shim, 19 tests passing |
| winapi-bindings: webpack/rolldown alias approach | One config change catches all 21 import sites without touching source files | ✓ Validated — covers all import sites with zero source edits |
| Steam Deck: AppImage (not Flatpak) | Flatpak sandbox restrictions on ~/.steam need validation; AppImage works today | ✓ v2.0 decision — AppImage ships, Flatpak deferred |
| Heroic Launcher: deferred to v4.0+ | Phase 2 focus is Steam only; Heroic adds complexity without core validation | — Pending |
| Elevation scope: audit first | Most Steam libraries are user-owned — pkexec may not be needed at all | ✓ Confirmed — pkexec absent from all startup paths; deferred to v3.0 |
| loot: build from source via cmake+cargo | Dropped Linux prebuilts at 0.24.5; postinstall script delivers liblibloot.so | ✓ Done — loot.node compiles and loads on Linux |
| loot RPATH: LD_LIBRARY_PATH in-process | Simpler than patch-package RPATH; CI wrapper handles .so resolution | ✓ Done — CI and local dev both work |
| gamebryo-savegame: pnpm patch on Linux | MSVC exception constructor + lz4/zlib linker flags + CHAR_WIDTH fmt macro undef (GCC 13) | ✓ Done — builds and links cleanly; `ldd` confirms liblz4.so.1 + libz.so.1 resolve |
| IPC serialisation trap: getIPCPath via argument | `.toString()`'d child closure must receive getIPCPath as argument — source grep insufficient | ✓ Done — both parent and stringified child patched |
| pkexec: defer to v3.0 | Phase 1 audit confirms no startup path requires elevation; user-triggered only | ✓ Confirmed — 6 call sites documented, all user-triggered |
| Steam detection: findAllLinuxSteamPaths() additive | findLinuxSteamPath() kept intact for backward compat; new function adds multi-root | ✓ Done — no regressions in existing path |
| oslist as primary Proton signal | Enables never-launched game detection without compatdata dir | ✓ Done — tested across STAM-03 requirements |
| PROTON_USERNAME = "steamuser" (constant) | Wine prefix always uses steamuser as home dirname, never os.userInfo().username | ✓ Validated — critical pitfall avoided |
| build-linux: parallel sibling job (no needs:) | Runs concurrently with Windows build — no sequencing overhead | ✓ Done — DIST-03 satisfied |
| pnpm run package:nosign for Linux CI | electron-builder ignores Windows signing config on Linux automatically | ✓ Done — clean unsigned Linux builds |
| AppImage desktop entry before xdg-settings | xdg-settings must register a desktop ID that has a matching .desktop file | ✓ Done — ensureAppImageDesktopEntry() runs first |
| mPendingDownload cold-start buffer | Cold-start NXM URL silently dropped before Redux store ready | ✓ Done — PROT-01 cold-start path sealed |
| PROT-02: SteamOS Steam Browser deferred to v4.0 | Hardware unavailable; WebKit-based Discover overlay behavior unknown | — Deferred per PROT-03 |
| getSteamEntry uses GameStoreHelper (not direct Steam import) | Bundled extension cannot import from renderer src/; GameStoreHelper available via vortex-api util | ✓ Done — v3.0 bundled extension constraint solved |
| isSteamOS() cached at module level | Avoids repeated /etc/os-release reads; function called on every elevation attempt | ✓ Done — module-level `_isSteamOS` variable |
| polkit action uses auth_admin (not auth_admin_keep) | Prompt every time — no persistent token risk; simpler security model | ✓ Done — D-10 decision validated |
| SteamOS: sudo -n before pkexec | pkexec hangs without polkit agent in Game Mode; sudo -n is lightweight first check | ✓ Done — ELEV-02 satisfied |
| tsconfig.json excludes __mocks__/ | TS6307 error: __mocks__ outside src/ causes TS to traverse test infrastructure in production typecheck | ✓ Done — production build clean |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after v3.0 milestone — Save Games + Elevation*
