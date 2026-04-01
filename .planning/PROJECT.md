# Vortex Linux Support — Phase 2: Usable on Linux

## Current Milestone: v2.0 Usable on Linux

**Goal:** A Linux user can install Vortex, detect their Steam/Proton games, and download mods via NXM link.

**Target features:**
- Steam/Proton game detection (VDF parsing, Flatpak paths, Proton prefix resolution, `{mygames}` Wine prefix)
- AppImage + .deb packaging, GitHub Actions CI artifacts, auto-updater `latest-linux.yml`
- NXM protocol handler on SteamOS/KDE Plasma

## What This Is

Vortex is an Electron-based mod manager for Nexus Mods, targeting Windows and Linux. v1.0 shipped the Linux boot milestone: `pnpm run start` produces a visible Electron window on Linux, all 22 requirements satisfied, Windows CI untouched. v2.0 makes Vortex actually usable — Steam game detection, distributable packages, and the NXM "Download with Manager" flow.

## Core Value

`pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine.

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

### Active (v2.0)

- [ ] **STAM-01**: Steam library VDF parsing works on Linux (standard and Flatpak Steam paths)
- [ ] **STAM-02**: Flatpak Steam paths (`~/.var/app/com.valvesoftware.Steam`) resolved correctly
- [ ] **STAM-03**: Proton prefix path resolved per-game from `steamapps/compatdata/`
- [ ] **STAM-04**: `{mygames}` variable resolves to correct path inside Wine prefix on Linux
- [ ] **STAM-05**: Top-4-title game extensions (Skyrim, Fallout 4, Cyberpunk 2077, Stardew Valley) audited and work on Linux
- [ ] **DIST-01**: AppImage artifact produced by electron-builder on Linux CI
- [ ] **DIST-02**: `.deb` artifact produced by electron-builder on Linux CI
- [ ] **DIST-03**: GitHub Actions workflow uploads Linux artifacts alongside Windows artifacts
- [ ] **DIST-04**: Auto-updater `latest-linux.yml` generated and references AppImage artifact
- [ ] **PROT-01**: NXM protocol handler registered and functional on standard Linux (xdg-open)
- [ ] **PROT-02**: NXM protocol handler validated on SteamOS/KDE Plasma

### Deferred

- [ ] **ELEV-01**: `pkexec` + Unix domain socket elevation fully implemented for operations that require elevated privileges on Linux
- [ ] **ELEV-02**: Elevation works on Steam Deck (SteamOS) without requiring a polkit password

### Out of Scope

- pkexec / polkit implementation — deferred to v3.0; v1.0 audit confirms not needed for Steam library operations
- Native Linux game support (GOG, itch.io) — separate track, deferred to Phase 4+
- Heroic Launcher integration — deferred to Phase 4
- Steam Deck Flatpak distribution — AppImage works in Desktop Mode; Flatpak sandbox restrictions on `~/.steam` need validation before investing
- Wine wrapper for FOMOD — rejected; Linux binaries already exist in npm packages
- Large codebase refactors — Windows code paths must remain untouched; all Linux support is additive
- gamebryo-savegame Linux compilation — uses MSVC exception constructors and lz4/zlib linker flags; deferred to Phase 2 or later

## Context

**Shipped v1.0 on 2026-03-31.** The app boots on Linux — a developer can `pnpm run start` and see a visible Electron window.

**Technical state after v1.0:**
- winapi-bindings shim: 48 exports, statfsSync/statSync for disk ops, all registry/ACL/privilege functions no-ops
- Native addons: 5 addons CI-compiled for Linux (`loot` via libloot 0.29.1 built from source); loot.node uses LD_LIBRARY_PATH fallback
- FOMOD: Linux ELF binaries unpacked from asar; TCP transport handshake validated end-to-end
- IPC: `getIPCPath()` utility routes to Unix sockets on Linux, named pipes on Windows
- Elevation: pkexec deferred — confirmed not on any startup path; 6 call sites documented
- CI: ubuntu-latest and windows-latest both green

**Platform guard pattern established:** `if (process.platform === 'linux') { ... }` before Windows path — used consistently across all 5 phases.

**v2.0 focus:** Steam/Proton game management, packaging/distribution, NXM protocol handler. Elevation deferred to v3.0.

## Constraints

- **Compatibility**: Windows build must never break — platform guards, not replacements
- **Diff size**: Prefer small, additive changes over refactors — no gutting existing modules
- **Dependencies**: No new runtime deps that affect Windows (Linux-only deps are fine)
- **FOMOD**: .NET 9 recompile path chosen — Wine wrapper explicitly rejected
- **Heroic Launcher**: Deferred to Phase 4 (not Phase 2)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FOMOD: recompile for Linux via .NET 9 | Native Linux binary, no Wine dep, .NET 9 already in devcontainer | ✓ Validated — Linux ELF binaries ship in npm packages, TCP transport handshake confirmed |
| winapi-bindings: platform shim (not removal) | Registry/UAC functions already guarded — shim replaces the module binding only | ✓ Done — webpack + rolldown aliases, 48-function shim, 19 tests passing |
| winapi-bindings: webpack/rolldown alias approach | One config change catches all 21 import sites without touching source files | ✓ Validated — covers all import sites with zero source edits |
| Steam Deck: AppImage (not Flatpak) | Flatpak sandbox restrictions on ~/.steam need validation; AppImage works today | — Pending v2.0 |
| Heroic Launcher: deferred to Phase 4 | Phase 2 focus is Steam only; Heroic adds complexity without core validation | — Pending |
| Elevation scope: audit first | Most Steam libraries are user-owned — pkexec may not be needed at all | ✓ Confirmed — pkexec absent from all startup paths; deferred to v2 |
| loot: build from source via cmake+cargo | Dropped Linux prebuilts at 0.24.5; postinstall script delivers liblibloot.so | ✓ Done — loot.node compiles and loads on Linux |
| loot RPATH: LD_LIBRARY_PATH in-process | Simpler than patch-package RPATH; CI wrapper handles .so resolution | ✓ Done — CI and local dev both work |
| gamebryo-savegame: disabled on Linux | MSVC exception constructor + lz4/zlib linker flags — Windows-specific; clear error via lazy-load | ✓ Done — NADD-06 audit documented |
| IPC serialisation trap: getIPCPath via argument | `.toString()`'d child closure must receive getIPCPath as argument — source grep insufficient | ✓ Done — both parent and stringified child patched |
| pkexec: defer to v2 | Phase 1 audit confirms no startup path requires elevation; user-triggered only | ✓ Confirmed — 6 call sites documented, all user-triggered |
| Milestone scope: Phase 1 only | Ship "boots on Linux" before planning Phases 2-3; validate feasibility first | ✓ Validated — all 22 requirements shipped in ~1 day |

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
*Last updated: 2026-04-01 — Phase 07 complete: electron-builder produces AppImage+.deb, CI build-linux job parallel with Windows, DIST-01–DIST-04 validated*
