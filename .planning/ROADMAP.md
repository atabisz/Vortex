# Roadmap: Vortex Linux Port — Phase 1 Milestone

## Overview

Vortex is a Windows-only Electron mod manager. This milestone ports it to Linux — specifically getting `pnpm run start` to produce a visible window on a Linux machine without crashing, while keeping Windows CI green throughout. The five phases follow the research-verified dependency graph: runtime environment first, then the winapi-bindings shim (the single biggest crash blocker), then native addon CI compilation, then FOMOD packaging and validation, then IPC transport abstraction and elevation audit. Tracks 2 and 3 (native addons, FOMOD) are parallel with the critical path but gated on a bootable app for end-to-end validation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Runtime Environment** - Add Electron runtime libraries and fix Linux-broken paths so the app can be built and tested (completed 2026-03-30)
- [x] **Phase 2: winapi-bindings Shim** - Replace the Windows-only module with a Linux shim so the renderer loads without crashing (completed 2026-03-30)
- [x] **Phase 3: Native Addon Compilation** - Compile all C++ native addons for Linux in CI so they load at startup (completed 2026-03-30)
- [ ] **Phase 4: FOMOD Installer Integration** - Unpack Linux binaries from asar and validate the TCP transport end-to-end
- [ ] **Phase 5: IPC and Elevation Audit** - Abstract named pipe paths to platform-correct sockets and document elevation scope

## Phase Details

### Phase 1: Runtime Environment
**Goal**: Linux dev environment is buildable and ready to test — Electron can be invoked without missing library errors
**Depends on**: Nothing (first phase)
**Requirements**: RENV-01, RENV-02, RENV-03
**Success Criteria** (what must be TRUE):
  1. Running `pnpm run build` in the devcontainer completes without error on a Linux host
  2. `electron .` exits with a missing-library error only if winapi shim is absent — not due to missing runtime shared libraries (RENV-01 satisfied)
  3. `getVortexPath("localAppData")` returns a path under `~/.local/share` on Linux, not a broken `~/.config/../Local` path (RENV-02 satisfied)
  4. `electron-builder` dry-run on Linux does not fail with `ENOENT` for `.exe` extra resources (RENV-03 satisfied)
**Plans:** 1/1 plans complete
Plans:
- [x] 01-01-PLAN.md — Devcontainer libs, XDG path fix, electron-builder extraResources

### Phase 2: winapi-bindings Shim
**Goal**: The app reaches the renderer and a window appears on Linux — no MODULE_NOT_FOUND crash at startup
**Depends on**: Phase 1
**Requirements**: WAPI-01, WAPI-02, WAPI-03, WAPI-04, WAPI-05
**Success Criteria** (what must be TRUE):
  1. `pnpm run start` on Linux produces a visible Electron window (no crash before window creation)
  2. The first-run dashboard (`firststeps_dashlet`) renders without a white screen or error boundary — disk free space and volume path display correctly (WAPI-02, WAPI-03 satisfied)
  3. Opening the app on Linux with all 21 `winapi-bindings` import sites active produces no `MODULE_NOT_FOUND` or native binding load error in the console (WAPI-01 satisfied)
  4. Calling any registry, process-list, or file-ACL function on Linux returns a safe stub value rather than throwing an unhandled exception (WAPI-05 satisfied)
  5. Windows `pnpm run start` still works — no regression in Windows CI (WAPI-01 webpack alias is Linux build only)
**Plans:** 2/2 plans complete
Plans:
- [x] 02-01-PLAN.md — TDD: Create winapi-shim.ts with full export coverage (GetDiskFreeSpaceEx, GetVolumePathName, stubs)
- [x] 02-02-PLAN.md — Wire webpack and rolldown build aliases to resolve winapi-bindings to shim on Linux

**UI hint**: yes

### Phase 3: Native Addon Compilation
**Goal**: All five C++ native addons compile for Linux in CI and load without error when the app starts
**Depends on**: Phase 1
**Requirements**: NADD-01, NADD-02, NADD-03, NADD-04, NADD-05, NADD-06
**Success Criteria** (what must be TRUE):
  1. GitHub Actions Linux runner completes `@electron/rebuild` for `bsatk`, `esptk`, `loot`, `bsdiff-node`, and `xxhash-addon` without error (NADD-01 through NADD-05 satisfied)
  2. The running app loads all five addons at startup without a native binding load error in the console
  3. `vortexmt` and `gamebryo-savegame` audit result is documented — either a Linux CI target is added (clean audit) or a clear disabled/shimmed error is wired (Windows-specific APIs found) (NADD-06 satisfied)
  4. Windows CI addon compilation continues to pass — no regression
**Plans:** 3/3 plans complete
Plans:
- [x] 03-01-PLAN.md — Build libloot 0.29.1 from source for Linux via postinstall script + CI Rust/cmake setup
- [x] 03-02-PLAN.md — Add @electron/rebuild CI step, verify-addons smoke test, NADD-06 audit documentation
- [x] 03-03-PLAN.md — Integration: fix loot RPATH, validate complete CI pipeline, human-verify CI green

### Phase 4: FOMOD Installer Integration
**Goal**: FOMOD mod installation completes end-to-end on Linux — the Linux binaries are unpacked and the TCP transport handshakes successfully
**Depends on**: Phase 2, Phase 3
**Requirements**: FOMD-01, FOMD-02, FOMD-03, FOMD-04
**Success Criteria** (what must be TRUE):
  1. `ModInstaller.Native.so` and `ModInstallerIPC` ELF are accessible on disk at runtime (not inside the asar archive) — verified by checking file paths after app launch (FOMD-01 satisfied)
  2. `dotnetprobe` ELF is accessible on disk at runtime and returns a valid .NET runtime detection result on Linux (FOMD-02 satisfied)
  3. The platform guard in `installer_dotnet/index.ts` that previously threw on Linux no longer fires — the Linux code path activates instead (FOMD-03 satisfied)
  4. Connecting a FOMOD mod against a test game on Linux completes without error — the `ModInstallerIPC` process starts, accepts a TCP connection, and responds to `TestSupported` (FOMD-04 satisfied)
**Plans:** 2 plans
Plans:
- [x] 04-01-PLAN.md — Add Linux FOMOD binary asarUnpack entries and fix VortexIPCConnection exe resolution
- [ ] 04-02-PLAN.md — Build verification and end-to-end FOMOD TCP transport validation on Linux

### Phase 5: IPC and Elevation Audit
**Goal**: Named pipe paths are replaced with platform-correct socket paths and the elevation scope for Phase 1 is documented
**Depends on**: Phase 2
**Requirements**: IPC-01, IPC-02, IPC-03, IPC-04
**Success Criteria** (what must be TRUE):
  1. `getIPCPath(id)` utility exists and returns `\\?\pipe\{id}` on Windows and `path.join(os.tmpdir(), 'vortex-{id}.sock')` on Linux (IPC-01 satisfied)
  2. The elevated.ts parent server `startIPCServer()` uses `getIPCPath()` — no hardcoded UNC pipe prefix appears in the Linux startup path (IPC-02 satisfied)
  3. The stringified `elevatedMain` closure connects to a Unix socket on Linux — the serialisation trap (`.toString()` child code) is patched as well as the parent call (IPC-03 satisfied)
  4. The elevation audit document exists and answers: whether `runElevated()` is called on any startup path and whether `pkexec` is needed for Phase 1 (IPC-04 satisfied)
**Plans:** 1/2 plans executed
Plans:
- [ ] 05-01-PLAN.md — Create getIPCPath utility and patch all IPC pipe path sites
- [x] 05-02-PLAN.md — Elevation audit document (runElevated scope and pkexec decision)

## Progress

**Execution Order:**
Phases 1 and 3 can begin in parallel. Phase 2 depends on Phase 1. Phase 4 depends on Phase 2 and Phase 3. Phase 5 depends on Phase 2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Runtime Environment | 1/1 | Complete   | 2026-03-30 |
| 2. winapi-bindings Shim | 2/2 | Complete   | 2026-03-30 |
| 3. Native Addon Compilation | 3/3 | Complete   | 2026-03-30 |
| 4. FOMOD Installer Integration | 0/2 | Planning complete | - |
| 5. IPC and Elevation Audit | 1/2 | In Progress|  |
