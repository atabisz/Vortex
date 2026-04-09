# Vortex Linux Support — v5.0 Shipped

## Current State

**Shipped v5.0 on 2026-04-09.** Phase 15 complete: fomod-installer source path normalization (`TextUtil.NormalizePath` on `matchedFiles[0]`), Linux-specific CSharpScript unsupported warning in `reportUnsupported`, redundant `replaceAll` removed from copy source path, `vortex-api` declarations regenerated with `resolvePathCase`. All 7 FOMD-15-xx requirements satisfied. FOMOD end-to-end story on Linux is clean — no workarounds remain in Vortex; fork is PR-ready.

**Shipped v4.0 on 2026-04-07.** Elevation hardening complete: session-scoped polkit rules in `.deb` (AUTH_ADMIN_KEEP), Steam Deck Game Mode failure notification wired, save transfer picks up Wine prefix path casing via transparent fs shim. `resolvePathCase` promoted to vortex-api `util` namespace. `PluginPersistor` per-callsite workaround replaced by shim.

**A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, manage save games, and transfer saves between profiles — with elevation that works reliably on desktop Linux and fails gracefully on Steam Deck.**

**Human UAT pending** (tracked in Phase 999.1 backlog): ELEV-04 session caching, ELEV-05 desktop Linux E2E, ELEV-06 Steam Deck toast UX, SAVE-05 live save transfer.

## What This Is

Vortex is an Electron-based mod manager for Nexus Mods, targeting Windows and Linux. v1.0 shipped the Linux boot milestone — `pnpm run start` works on Linux. v2.0 makes Vortex actually usable on Linux: Steam/Proton game detection, distributable packages (AppImage + .deb), and the NXM "Download with Manager" flow. v3.0 completes save game management and elevation for Skyrim SE, Fallout 4, and Steam Deck users. v4.0 hardens elevation (persistent polkit token, Steam Deck failure UX), delivers save transfer between profiles, and adds a transparent Wine prefix case-folding shim to the fs layer. v5.0 closes the FOMD story: fomod-installer source path normalization, CSharpScript Linux warning, and regenerated vortex-api declarations — fork is upstream PR-ready.

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
- ✓ **ELEV-04**: Polkit rules file `10-vortex.rules` grants `AUTH_ADMIN_KEEP`; `.deb` packages it at `/etc/polkit-1/rules.d/`; AppImage deliberately excluded; README documents difference — v4.0 (infrastructure verified; live session caching UAT pending)
- ✓ **SAVE-05**: Save transfer between Vortex profiles on Linux — `copyAsync`/`renameAsync`/`ensureDirAsync` resolve Wine prefix path casing; empty-state guidance in transfer picker — v4.0 (code-verified; live runtime UAT pending)
- ✓ **CASE-01**: `resolvePathCase` promoted to `src/renderer/src/util/` and exported as `util.resolvePathCase` from vortex-api — v4.0
- ✓ **CASE-02**: `readFileAsync`, `writeFileAsync`, `statAsync` on Wine prefix paths auto-resolve on-disk casing via fs shim — v4.0
- ✓ **CASE-03**: `watch` on Wine prefix paths resolves on-disk casing synchronously before registering watcher — v4.0
- ✓ **CASE-04**: `PluginPersistor.resolvePluginsFilePath` removed; per-callsite workaround replaced by transparent fs shim — v4.0
- ✓ **FOMD-15-01**: CSharpScript OS guard in `ModFormatManager.cs` — confirmed pre-existing — v5.0
- ✓ **FOMD-15-02**: `XmlScriptInstaller` source path normalized via `TextUtil.NormalizePath(matchedFiles[0], false, true)` — v5.0
- ✓ **FOMD-15-03**: CI Linux IPC build pipeline (`build-packages.yml` linux-x64 matrix) — confirmed pre-existing — v5.0
- ✓ **FOMD-15-04**: Linux-specific CSharpScript unsupported warning in `reportUnsupported` — v5.0
- ✓ **FOMD-15-05**: Redundant `replaceAll("\\\\", "/")` on copy source path removed — v5.0
- ✓ **FOMD-15-06**: `vortex-api` `lib/api.d.ts` regenerated — `resolvePathCase` in public API surface — v5.0
- ✓ **B1**: `packages/vortex-api/lib/api.d.ts` regenerated with `resolvePathCase` — v5.0

### Active (v6.0)

- [ ] **ELEV-05**: All user-triggered elevation operations complete successfully on desktop Linux without crashing or hanging — code-complete (Phase 12); hardware UAT pending (Phase 999.1)
- [ ] **ELEV-06**: Steam Deck elevation failure shows actionable error notification with recovery path — code-complete (Phase 12); end-to-end Electron UX UAT pending (Phase 999.1)
- [ ] **D1**: Plugins tab behavioral difference between pnpm dev and .deb install — needs investigation
- [ ] **A1**: ELEV-05 hardware UAT — Phase 999.1 ready, needs real hardware execution
- [ ] **A2**: ELEV-04 live session caching test — AUTH_ADMIN_KEEP in .deb, no live test yet
- [ ] **A3**: PROT-01 live NXM download test on real AppImage/deb hardware
- [ ] **A4**: SAVE-05 live save transfer on real Proton/Linux install
- [ ] **E1**: Submit upstream PR from `linux-port` branch — commit classification completed 2026-04-08

### Deferred (v5.0+)

- [ ] **DIST-05**: AppImage delta auto-update on SteamOS immutable filesystem
- [ ] **PROT-03**: NXM handler via Steam Browser overlay on Steam Deck — requires Nexus Mods web team + hardware

### Out of Scope

- Steam cloud save conflict detection — requires Valve cloud API; substantial new complexity
- Native Linux game support (GOG, itch.io) — separate track, deferred to v4.0+
- Heroic Launcher integration — deferred to v4.0+
- gamebryo-savegame for games beyond Skyrim SE and Fallout 4 — validate core path first
- Flatpak distribution — AppImage works; Flatpak sandbox restrictions need separate validation
- Wine wrapper for FOMOD — rejected; native Linux binaries exist in npm packages
- Large codebase refactors — Windows code paths must remain untouched; all Linux support is additive

## Context

**Shipped v5.0 on 2026-04-09.** 1 phase, 3 plans, 7/7 FOMD requirements satisfied. fomod-installer fork is PR-ready with source path normalization; Vortex has clean Linux CSharpScript UX; vortex-api declarations up to date.

**Technical state after v5.0:**
- fomod-installer: `XmlScriptInstaller.cs` normalizes source path via `TextUtil.NormalizePath(matchedFiles[0], false, true)` — lowercase forward-slash paths consistent with destination
- CSharpScript guard: `ModFormatManager.cs` wraps `CSharpScriptType` registration in `IsOSPlatform(OSPlatform.Windows)` at 2 call sites (pre-existing, confirmed)
- Vortex UX: `reportUnsupported` in `InstallManager.ts` separates CSharpScript instructions from generic unsupported; fires `type:warning` notification on non-Windows with actionable message
- Cleanup: `copy.source.replaceAll("\\", "/")` removed — Parser10 normalizes upstream; destination replaceAll retained
- vortex-api: `packages/vortex-api/lib/api.d.ts` regenerated — `resolvePathCase` appears in public API surface (2 occurrences); `etc/vortex.api.md` updated
- CI: `build-packages.yml` linux-x64 dotnet publish matrix confirmed (pre-existing)
- Elevation: `.deb` installs `build/linux/10-vortex.rules` to `/etc/polkit-1/rules.d/` granting `AUTH_ADMIN_KEEP`; AppImage excluded; `rejectWithSteamOSNotification` fires Redux notification on SteamOS Game Mode failure
- fs layer: `isWinePrefixPath()` + `resolveCaseIfWinePrefix()` wraps `readFileAsync`, `writeFileAsync`, `statAsync`, `watch`, `copyAsync`, `renameAsync`, `ensureDirAsync` — Wine prefix paths only
- Test coverage: `elevated.test.ts` (21 Vitest); `fs.test.ts` (22 Vitest); `resolvePathCase.test.ts` (6 Vitest)

**Platform guard pattern:** `if (process.platform === 'linux') { ... }` and `isWinePrefixPath()` used consistently — Windows paths always pass through unchanged.

**Known UAT pending:** PROT-01/PROT-02 live runtime tests; ELEV-04/05/06 hardware tests; SAVE-05 live transfer on Linux.

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
| 10-vortex.rules: no isInGroup guard | Simpler than group-based; consistent with .policy auth_admin semantics; all active desktop users may cache credential | ✓ Done — v4.0 Phase 11 |
| deb.extraFiles for rules (not linux.extraFiles) | AppImage must not receive the rules file — degraded elevation is correct for AppImage | ✓ Done — v4.0 Phase 11 |
| _setNotifier injectable seam (not global state) | Mirrors _setSpawner pattern; testable without mocking module internals; optional chaining prevents pre-init failure | ✓ Done — v4.0 Phase 12 |
| rejectWithSteamOSNotification helper DRYs both SteamOS paths | Both close (non-zero exit) and error (ENOENT spawn) paths must fire notification — shared helper prevents divergence | ✓ Done — v4.0 Phase 12 |
| isWinePrefixPath() three-way conjunction | platform===linux AND /compatdata/ AND /pfx/ — prevents false positives on non-Wine Linux paths | ✓ Done — v4.0 Phase 14 |
| resolvePathCase promoted to util/ (not @vortex/shared) | Avoids new shared package churn; util/ already exported via vortex-api; mod_management and bundled extensions can both import | ✓ Done — v4.0 Phase 14 |
| fs shim wraps at fs.ts level (not per-callsite) | 7+ callsites would each need patching; shim at source guarantees all future callers get case-folding automatically | ✓ Done — v4.0 Phase 14 |
| fileName.toLowerCase() in watch handler retained permanently | inotify event filenames arrive from OS, outside shim reach — toLowerCase fix must stay in watch handler | ✓ Done — v4.0 Phase 14 D-11 |

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
*Last updated: 2026-04-09 after v5.0 milestone completion — FOMD Linux fixes shipped, fork upstream PR-ready*
