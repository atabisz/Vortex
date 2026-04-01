# Milestones

## v2.0 Usable on Linux (Shipped: 2026-04-01)

**Phases completed:** 3 phases, 7 plans, 11 tasks

**Key accomplishments:**

- Multi-root Steam scanning (native + Flatpak) with oslist-based Proton detection for never-launched Windows-only games
- Proton Wine prefix INI path resolution fixed: PROTON_USERNAME constant, getMyGamesPath() helper, async iniFiles() with Linux guard, and "My Documents" -> "Documents" bug corrected across two gameSupport files
- Dead winapi-bindings require removed from Fallout 4; all 4 top-title game extensions confirmed Linux-compatible
- electron-builder AppImage + deb targets configured and auto-updater gated behind process.env.APPIMAGE on Linux
- Parallel build-linux job added to package.yml — produces AppImage, .deb, and latest-linux.yml alongside Windows artifacts
- AppImage .desktop entry + KDE kbuildsycoca6 refresh wired for NXM protocol handler registration on Linux

---

## v1.0 Linux Port Phase 1 (Shipped: 2026-03-31)

**Phases completed:** 5 phases, 10 plans, 16 tasks

**Key accomplishments:**

- XDG path in localAppData(), 16 Electron runtime libs in devcontainer, and .exe extraResources scoped to win block — Linux dev environment is buildable
- winapi-bindings Linux shim with 48 exports — statfsSync/statSync for disk ops, throwing stub for ShellExecuteEx, no-ops for all registry/ACL/privilege APIs, dual import support, 19 tests passing
- webpack resolve.alias and rolldown createConfig alias parameter redirect `winapi-bindings` to `winapi-shim.ts` on Linux at bundle time — Electron window confirmed appearing without MODULE_NOT_FOUND crash
- postinstall-libloot.cjs builds libloot 0.29.1 from source via cmake+cargo on Linux, placing liblibloot.so in loot_api/ so loot.node can compile; CI gets Rust toolchain and cmake before pnpm install
- @electron/rebuild 4.0.3 added to CI with verify-addons.cjs smoke test covering 6 addons; vortexmt clean for Linux, gamebryo-savegame disabled with documented NADD-06 audit
- loot.node LD_LIBRARY_PATH fallback added and CI step ordering corrected; ubuntu-latest and windows-latest both green with all 6 native addons verified end-to-end
- Three Linux FOMOD binary asarUnpack entries added and VortexIPCConnection strips .exe on Linux for ModInstallerIPC ELF resolution
- FOMD-04 verified: FOMOD installer dialog appears on Linux, TCP transport handshake succeeded
- getIPCPath() utility + 4 IPC site patches: Unix sockets on Linux, named pipes on Windows — all startup paths clean
- Audit confirms runElevated() is absent from all startup paths — pkexec deferred to v2, 6 call sites documented

---
