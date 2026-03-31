---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Linux Port Phase 1
status: v1.0 milestone complete
stopped_at: Completed 05-01-PLAN.md
last_updated: "2026-03-31T01:37:21.787Z"
last_activity: 2026-03-31
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 10
  completed_plans: 10
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** `pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine
**Current focus:** Planning v2.0 milestone — Steam/Proton game management, elevation model, packaging

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** `pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine
**Current focus:** Phase 05 — ipc-and-elevation-audit

## Current Position

Phase: 05
Plan: Not started
All 3 plans complete. All UAT passed.
Last activity: 2026-03-31

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
| Phase 01-runtime-environment P01 | 4 | 3 tasks | 4 files |
| Phase 02-winapi-bindings-shim P01 | 3 | 1 tasks | 2 files |
| Phase 02-winapi-bindings-shim P02 | 15 | 2 tasks | 3 files |
| Phase 03-native-addon-compilation P01 | 3 | 2 tasks | 3 files |
| Phase 03-native-addon-compilation P02 | 4 | 1 tasks | 4 files |
| Phase 03-native-addon-compilation P03 | 10 | 2 tasks | 2 files |
| Phase 04-fomod-installer-integration P01 | 8 | 2 tasks | 2 files |
| Phase 05-ipc-and-elevation-audit P02 | 5 | 1 tasks | 1 files |
| Phase 05-ipc-and-elevation-audit P01 | 10 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- FOMOD: recompile via .NET 9 (Linux binary already ships in npm packages — packaging only)
- winapi-bindings: webpack alias shim on Linux (one config change, catches all 21 import sites)
- Elevation: defer pkexec to Phase 2 — shim ShellExecuteEx as throw; most Steam libs are user-owned
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

### Pending Todos

None yet.

### Blockers/Concerns

- IPC-03 serialisation trap: elevated.ts `.toString()`'d closure must be patched — source grep alone is insufficient, must inspect stringified child code path
- NADD-06 (vortexmt/gamebryo-savegame): conditional on audit; may slip to Phase 2 if Windows-specific APIs found

## Session Continuity

Last session: 2026-03-31T01:13:41.086Z
Stopped at: Completed 05-01-PLAN.md
Resume file: None
