---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: Elevation Hardening + Save Transfer
status: "v4.0 complete — shipped 2026-04-07. Run /gsd-new-milestone to start v5.0."
stopped_at: null
last_updated: "2026-04-08T00:00:00.000Z"
last_activity: 2026-04-08
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-07 after v4.0 milestone start)

**Core value:** A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — with elevation operations that work reliably
**Current focus:** v4.0 shipped — run /gsd-new-milestone to start v5.0

## Current Position

Phase: —
Plan: —
Status: v4.0 complete — shipped 2026-04-07
Last activity: 2026-04-08

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 11 | 1 | - | - |
| 12 | 1 | - | - |
| 14 | 2 | - | - |
| 13 | 1 | - | - |

**Recent Trend:**

- Last 5 plans: (none yet)
- Trend: -

*Updated after each plan completion*
| Phase 06-steam-proton-detection P01 | 3 | 2 tasks | 3 files |
| Phase 06-steam-proton-detection P02 | 15 | 2 tasks | 4 files |
| Phase 06-steam-proton-detection P03 | 5 | 1 tasks | 1 files |
| Phase 06-steam-proton-detection P03 | 20min | 2 tasks | 5 files |
| Phase 07-linux-packaging P02 | 5 | 1 tasks | 1 files |
| Phase 07-linux-packaging P01 | 2 | 2 tasks | 2 files |
| Phase 08-nxm-protocol-handler P02 | 5 | 1 tasks | 1 files |
| Phase 08-nxm-protocol-handler P01 | 8 | 2 tasks | 2 files |
| Phase 09 P01 | 2 | 2 tasks | 4 files |
| Phase 09 P02 | 7 | 1 tasks | 2 files |
| Phase 10-save-ui-validation-steamos-polkit P02 | 5 | 2 tasks | 4 files |
| Phase 10-save-ui-validation-steamos-polkit P01 | 8 | 3 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- FOMOD: recompile via .NET 9 (Linux binary already ships in npm packages — packaging only)
- winapi-bindings: webpack alias shim on Linux (one config change, catches all 21 import sites)
- Elevation: defer pkexec to v3.0 — shim ShellExecuteEx as throw; most Steam libs are user-owned
- IPC serialisation trap: extract `getIPCPath(id)` utility and patch BOTH parent server and stringified child closure
- [Phase 01-runtime-environment]: localAppData Linux branch: XDG_DATA_HOME ?? os.homedir()/.local/share using ?? not || to handle empty string correctly
- [Phase 01-runtime-environment]: electron-builder: Windows .exe redistributables scoped to win.extraResources; Linux packaging references only cross-platform entries
- [Phase 02-winapi-bindings-shim]: Test file at winapi-shim.test.ts (not __tests__/): renderer vitest.config.mts excludes __tests__/ pattern
- [Phase 02-winapi-bindings-shim]: RegGetValue returns undefined in production shim (not object as in Jest mock)
- [Phase 02-winapi-bindings-shim]: webpack/rolldown alias at bundle time catches all 18+ winapi-bindings import sites without source edits
- [Phase 02-winapi-bindings-shim]: SHIM_PATH uses import.meta.dirname for ESM-safe resolution in build.mjs
- [Phase 03-native-addon-compilation]: Build libloot 0.29.1 from source via cmake+cargo — LOOT dropped Linux prebuilts at 0.24.5; postinstall script delivers liblibloot.so to loot_api/
- [Phase 03-native-addon-compilation]: Rust toolchain step placed before pnpm install in CI — postinstall-libloot.cjs needs cargo on PATH during dependency installation
- [Phase 03-native-addon-compilation]: gamebryo-savegame disabled on Linux: two compile errors (MSVC exception constructor + lz4/zlib linker flags); NADD-06 clear error via ExtensionManager lazy-load failure
- [Phase 03-native-addon-compilation]: vortexmt confirmed clean for Linux: proper WIN32 guards, portable C++ — added to CI rebuild
- [Phase 03-native-addon-compilation]: xxhash-addon loads from NAPI prebuilds without rebuild (node-gyp-build handles linux-x64 glibc/musl)
- [Phase 03-native-addon-compilation]: LD_LIBRARY_PATH in-process + CI wrapper chosen over patch-package RPATH for loot.node runtime .so resolution
- [Phase 03-native-addon-compilation]: CI step ordering corrected: Rust toolchain before cmake/build-deps before pnpm install
- [Phase 03-native-addon-compilation]: loot binding.gyp patch: replace -l../loot_api/libloot with -L../loot_api -llibloot on Linux; add RPATH $ORIGIN/../../loot_api; cmake output is libloot.so.0 (not liblibloot.so due to PREFIX=)
- [Phase 03-native-addon-compilation]: verify-addons.cjs: loot verified via ldd not require() because Electron V8 headers (module v140) are incompatible with plain node (module v127); pnpm isolation requires workspace-relative require.resolve paths
- [Phase 04-fomod-installer-integration]: Explicit asarUnpack paths for Linux binaries (not broad globs) per D-01 decision
- [Phase 04-fomod-installer-integration]: platformExeName in VortexIPCConnection strips .exe on Linux; Windows behavior unchanged
- [Phase 04-fomod-installer-integration]: FOMD-03 dotnetprobe Linux branch already correct in installer_dotnet/index.ts — no code changes needed
- [Phase 05-ipc-and-elevation-audit]: pkexec not required for Phase 1 — all 6 runElevated call sites are user-triggered; startup path is clean
- [Phase 05-ipc-and-elevation-audit]: Static import + vi.spyOn used instead of dynamic import() for node16 moduleResolution compat in ipc.test.ts
- [Phase 05-ipc-and-elevation-audit]: baseFunc serialized closure in symlink_activator_elevate patched identically to elevatedMain in elevated.ts
- [Phase 06-steam-proton-detection]: findLinuxSteamPath() kept intact for backward compat; findAllLinuxSteamPaths() is additive
- [Phase 06-steam-proton-detection]: oslist as primary Proton signal when available — enables never-launched game detection without compatdata
- [Phase 06-steam-proton-detection]: Appid dedup uses Set<string> first-occurrence-wins after games reduce, before tap()
- [Phase 06-steam-proton-detection]: getMyGamesPath accepts compatDataPath string directly — simpler signature, callers already have path from Phase 06-01 work
- [Phase 06-steam-proton-detection]: PromiseBB.resolve(asyncFn()) wrapping at ini_prep call sites preserves two-arg .catch(UserCanceled) without rewriting error handlers
- [Phase 06-steam-proton-detection]: Bundled game extensions bypass webpack alias — Windows-only require() calls must be removed from source, not aliased
- [Phase 06-steam-proton-detection]: Fallout 4 dead winapi-bindings removed from src/index.js; dist is gitignored and regenerated at build time
- [Phase 06-steam-proton-detection]: steamPaths.ts: ~/.steam/root symlink resolved first; all roots read VDF for secondary library discovery
- [Phase 06-steam-proton-detection]: GameStoreHelper.ts: result.priority guard removed — Steam entries on Linux never set priority
- [Phase 06-steam-proton-detection]: transferPath.ts: win32-only guard removed from testPathTransfer(); diskusage.check() uses destination path on Linux
- [Phase 07-linux-packaging]: build-linux is a parallel sibling job (no needs:) — runs concurrently with Windows build
- [Phase 07-linux-packaging]: pnpm run package:nosign reused for Linux — electron-builder ignores Windows signing config on Linux automatically
- [Phase 07-linux-packaging]: linux.artifactName mirrors nsis.artifactName: vortex-setup-${version}.${ext}
- [Phase 07-linux-packaging]: Auto-updater gate: process.env.APPIMAGE only — zip/deb installs get managed (no updater)
- [Phase 08-nxm-protocol-handler]: Buffer args.download in mPendingDownload before startup; apply after startUi() resolves
- [Phase 08-nxm-protocol-handler]: generateWrapperScript appPath optional: AppImage self-contained, no Electron appPath needed; dev builds unaffected
- [Phase 08-nxm-protocol-handler]: kbuildsycoca6 ENOENT logged at debug level: absence expected on non-KDE desktops
- [Phase 09]: MoreInfoException: std::runtime_error base -- GCC rejects MSVC-specific std::exception(runtime_error) constructor form
- [Phase 09]: No RPATH in gamebryo-savegame patch: lz4 and zlib are system libs, not bundled
- [Phase 10-save-ui-validation-steamos-polkit]: SteamOS branch: spawn sudo -n before pkexec when isSteamOS() returns true — pkexec hangs without polkit agent in Game Mode
- [Phase 10-save-ui-validation-steamos-polkit]: isSteamOS() cached in module-level _isSteamOS after first call — avoids repeated file reads
- [Phase 10-save-ui-validation-steamos-polkit]: polkit action uses auth_admin (not auth_admin_keep) — prompt every time per D-10
- [Phase 10-save-ui-validation-steamos-polkit]: getSteamEntry uses GameStoreHelper.getGameStore('steam') — bundled extension constraint, can't import renderer src/
- [Phase 10-save-ui-validation-steamos-polkit]: ILocalSteamEntry local interface — ISteamEntry not exported by vortex-api; bundled extension constraint
- [Phase 10-save-ui-validation-steamos-polkit]: tsconfig.json excludes test/mock files — __mocks__ outside src/ causes TS6307; production typecheck must not traverse test infrastructure

### Research Context (v3.0)

Key findings from research/SUMMARY.md affecting Phase 9–10 execution:

- SAVE track: gamebryo-savegame needs MoreInfoException base changed to std::runtime_error + binding.gyp OS=="linux" linker flags; pnpm patch pattern is established (see patches/loot@6.2.1.patch)
- ELEV track: runElevated() needs Linux branch with pkexec spawn; IPC socket path already correct from v1.0 IPC-01; socket-before-spawn ordering is critical (Pitfall 1)
- Critical pitfall: pkexec hangs without polkit agent on SteamOS Game Mode — sudo -n fallback or skip-elevation notification required
- Critical pitfall: pnpm patch silently skips on version bump — pin exact version in package.json
- STAM-04 scope gap: whether getVortexPath("documents") was globally patched or only via ini_prep variable resolver is unconfirmed — must verify before Phase 10 save path work
- SAVE-04: SLocalSavePath INI patching depends on STAM-04 scope — verify during Phase 10 execution

### Pending Todos

None.

### Blockers/Concerns

- STAM-04 getVortexPath("documents") scope unconfirmed — must read src/renderer/src/util/util.ts and STAM-04 commit diff before Phase 10 save path implementation

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-m5m | fix blank game version in mismatch dialog on Linux | 2026-04-01 | e3d6638 | [260401-m5m-fix-blank-game-version-in-mismatch-dialo](./quick/260401-m5m-fix-blank-game-version-in-mismatch-dialo/) |
| 260401-mvp | normalize backslashes in FOMOD copy source/destination paths | 2026-04-01 | 926255819 | [260401-mvp-normalize-backslashes-in-fomod-copy-sour](./quick/260401-mvp-normalize-backslashes-in-fomod-copy-sour/) |
| 260401-oz3 | case-folding path resolver in LinkingDeployment for Linux | 2026-04-01 | 32a9b021b | [260401-oz3-case-folding-path-resolver-in-linkingdep](./quick/260401-oz3-case-folding-path-resolver-in-linkingdep/) |
| 260401-scf | FOMOD case-sensitivity in InstallManager.extractArchive | 2026-04-01 | 6e56ba5bf | [260401-scf-fix-fomod-case-sensitivity-error-in-inst](./quick/260401-scf-fix-fomod-case-sensitivity-error-in-inst/) |
| 260402-1b1 | Wine-era deployment manifest detection in loadActivation | 2026-04-02 | 5b2420f | [260402-1b1-implement-wine-era-deployment-manifest-d](./quick/260402-1b1-implement-wine-era-deployment-manifest-d/) |
| 260402-iko | fix hardlink undeploy orphan when manifest missing | 2026-04-02 | ca5fffb | [260402-iko-fix-hardlink-undeploy-orphan-when-manife](./quick/260402-iko-fix-hardlink-undeploy-orphan-when-manife/) |
| 260407-grv | Fix NXM download bugs: cli.ts argv slice and no-sandbox propagation | 2026-04-07 | d9986f6 | [260407-grv-fix-nxm-download-bug-cli-ts-argv-slice-a](./quick/260407-grv-fix-nxm-download-bug-cli-ts-argv-slice-a/) |
| 260407-icu | Remove Linux-disabled guard from NXM toggle in Settings.tsx | 2026-04-07 | b3c474bcc | [260407-icu-remove-the-linux-disabled-guard-from-the](./quick/260407-icu-remove-the-linux-disabled-guard-from-the/) |
| 260407-iv0 | Patch Firefox profiles with nxm expose pref during Linux NXM registration | 2026-04-07 | 35ba35ccb | [260407-iv0-patch-firefox-profiles-with-nxm-expose-p](./quick/260407-iv0-patch-firefox-profiles-with-nxm-expose-p/) |
| 260407-h9r | Clear Firefox handlers.json nxm entry on registration | 2026-04-07 | e08518b20 | — |
| 260408-haq | Set deb/AppImage version to major.minor.YYYYMMDDHHMM | 2026-04-08 | 53033d808 | [260408-haq-set-deb-package-version-to-major-minor-f](./quick/260408-haq-set-deb-package-version-to-major-minor-f/) |
| 260408-mvp | Speed up GH Actions builds: rust cache, workflow_run chain, paths-ignore | 2026-04-08 | 30436ef73 | [260408-mvp-speed-up-gh-actions-builds-rust-cache-wo](./quick/260408-mvp-speed-up-gh-actions-builds-rust-cache-wo/) |
| 260408-ms8 | Update planning docs with current state after v4.0 backlog analysis | 2026-04-08 | — | [260408-ms8-update-planning-docs-with-current-state-](./quick/260408-ms8-update-planning-docs-with-current-state-/) |

## Session Continuity

Last session: 2026-04-08
Stopped at: v4.0 backlog analysis complete — 9 items in PROJECT.md Active (v5.0), ready to /gsd-new-milestone
Resume file: .planning/PROJECT.md
