# Vortex Linux Support — Phase 1: Boot on Linux

## What This Is

Vortex is an Electron-based mod manager for Nexus Mods, currently targeting Windows and Linux. v1.0 shipped the full Linux boot milestone: `pnpm run start` produces a visible Electron window on Linux, all 22 requirements satisfied, Windows CI untouched throughout. The approach is surgical — platform-guarded additions, no refactors, every change additive or conditional.

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

### Active

- [ ] **ELEV-01**: `pkexec` + Unix domain socket elevation fully implemented for operations that require elevated privileges on Linux
- [ ] **ELEV-02**: Elevation works on Steam Deck (SteamOS) without requiring a polkit password
- [ ] **STAM-01–05**: Steam/Proton game detection: library VDF parsing, Flatpak paths, Proton prefix resolution, `{mygames}` → Wine prefix, top-4-title game extension audit
- [ ] **DIST-01–04**: AppImage + .deb packaging, GitHub Actions Linux CI artifacts, auto-updater `latest-linux.yml`
- [ ] **PROT-01–02**: NXM protocol handler validated on SteamOS/KDE Plasma

### Out of Scope

- pkexec / polkit implementation — deferred pending elevation audit; most Steam libraries are user-owned and need no elevation (confirmed v1.0 audit)
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

**v2.0 focus:** Steam/Proton game management, elevation model, packaging/distribution, protocol handler.

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

---
*Last updated: 2026-03-31 after v1.0 milestone complete*
