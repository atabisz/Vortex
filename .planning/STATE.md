---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Usable on Linux
status: verifying
stopped_at: Completed 06-03-PLAN.md — STAM-05 verified
last_updated: "2026-04-01T00:09:42.071Z"
last_activity: 2026-04-01
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** `pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine
**Current focus:** Phase 06 — steam-proton-detection

## Current Position

Phase: 7
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-01

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: (none yet)
- Trend: -

*Updated after each plan completion*
| Phase 06-steam-proton-detection P01 | 3 | 2 tasks | 3 files |
| Phase 06-steam-proton-detection P02 | 15 | 2 tasks | 4 files |
| Phase 06-steam-proton-detection P03 | 5 | 1 tasks | 1 files |
| Phase 06-steam-proton-detection P03 | 20min | 2 tasks | 5 files |

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

### Research Context (v2.0)

Key findings from research/SUMMARY.md affecting Phase 6–8 execution:

- STAM track: ~80% done. Primary new code = `getMyGamesPath()` in `proton.ts` + platform guard in `gameSupport.ts`
- DIST track: Two config edits in `electron-builder.config.json` + one CI job in `package.yml`
- PROT track: Two code gaps — `ensureAppImageDesktopEntry()` in `nxm.ts` + `pendingDownload` field in `Application.ts`
- Critical pitfall: Wine prefix always uses `steamuser` as home dirname — never `os.userInfo().username`
- Critical pitfall: Cold-start NXM URL silently dropped before Redux store ready — `pendingDownload` fix required
- Critical pitfall: AppImage `xdg-settings` registers non-existent desktop ID unless `.desktop` file written first
- PROT-02 SteamOS Steam Browser behavior unknown — may defer to v3.0 if hardware unavailable

### Pending Todos

None.

### Blockers/Concerns

- PROT-02: SteamOS Steam Browser NXM behavior undocumented — requires Steam Deck hardware; defer to v3.0 if unavailable

## Session Continuity

Last session: 2026-04-01T00:03:12.833Z
Stopped at: Completed 06-03-PLAN.md — STAM-05 verified
Resume file: None
