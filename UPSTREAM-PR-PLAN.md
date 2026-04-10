# Upstream PR Plan — Linux Port Incremental Submission

Status: IN PROGRESS
Last updated: 2026-04-10

## Upstream Sync Log

| Date | Upstream PRs merged | Impact on plan |
|---|---|---|
| 2026-04-10 | #22319 fix/7z-linux — bumped node-7z to b75def8 (ships x86_64 7z-bin) | Our 7z-bin override reverted; no PR needed |
| 2026-04-10 | #22316 + #22330 task/app-254/256 — download retry infra (new retry.ts, downloader/manager refactor) | No plan overlap — isolated to src/main/src/downloading/ |
| 2026-04-10 | #22320 feat/app-257 — InstallManager preserveChoices + void this.process() lint fixes | **PR-F and PR-M must rebase before submit** (same file, no logic conflict) |

---

## Context

The upstream Nexus Mods team rejected the full linux-port PR (95 commits) as too large.
They want narrow, reviewable PRs submitted incrementally.

Key issues they raised:
- Too many unrelated concerns bundled together
- Binary artifacts committed to git (already fixed: `981a55f66` — gamebryo .so now compiled from source)
- Overlap with ongoing upstream work (filesystem handling, bluebird removal)

## Upstream Response Draft

> Thanks for the detailed feedback — the scope concern is completely fair. We'll break this
> into incremental PRs following your suggested categories. Before submitting the
> filesystem/case-folding work, we'd appreciate a quick sync on what your filesystem refactor
> covers so we don't overlap or conflict. Happy to coordinate asynchronously on GitHub or
> however works best for you.

## Coordination Needed Before Submitting

**Filesystem/case-folding (PR-N):** Their active refactor may subsume our `resolvePathCase` /
`fs.ts` case-folding work entirely. Ask before submitting:

> "Are you refactoring `fs.ts` / `@vortex/fs`? We have a case-folding shim for Linux Wine
> prefixes — does your refactor cover this or is it out of scope?"

**Elevation/polkit (PR-J):** Ask if they have a preferred elevation mechanism before submitting.

---

## fomod-installer Dependency Chain

Some PR-F commits depend on fomod-installer PRs landing first. Precise relationships:

| Vortex commit | Depends on | Status | Action |
|---|---|---|---|
| `ca8e99941` normalize backslashes in copy source/destination | fi-1 (XML parse normalization) | **Redundant after fi-1 merges** | Drop from PR-F once fi-1 is merged |
| `cbff6b891` resolve FOMOD paths case-insensitively in extractArchive | fi-2 (archive-case emission) | **Defensive — submit now, works best after fi-2** | Include in PR-F; keep as fallback even after fi-2 |
| `0ac7942ca` CSharpScript unsupported warning in reportUnsupported | fi-3 (warning emission) | **Load-bearing — handler for fi-3's warning** | Hold until fi-3 merges; submit as separate small PR or split PR-F |
| `673d0629f` Linux FOMD binary asarUnpack + exe resolution | fi-4 (Linux IPC ELF binary) | **Load-bearing — binary must exist** | Hold until fi-4 merges AND `@nexusmods/fomod-installer-ipc` dep is bumped in Vortex |

**Result: PR-F splits into three parts** (see PR-F below).

---

## PR Sequence

### Wave 1 — Submit Now (standalone, no overlap risk)

- [x] **PR-A: Linux devcontainer bootstrap** — [Nexus-Mods/Vortex#22310](https://github.com/Nexus-Mods/Vortex/pull/22310) | branch: `pr-a-linux-devcontainer-bootstrap`
  - `800641e38` add Electron 39 runtime shared libraries to devcontainer Dockerfile
  - `fac18babc` fix libgtk-3-0 missing from Electron runtime libs list
  - `433d620af` use libgtk-3-0t64 (Ubuntu 24.04 t64 package name)
  - `da19fc562` add --no-sandbox to dev start script for root container use
  - `e69ee23b5` fix app startup when launched from VSCode or other Electron apps
  > Note: crafted as clean patch on origin/master (2 commits); cherry-pick not used due to accumulated changes on shared files

- [ ] **PR-B: XDG path support in localAppData** — [Nexus-Mods/Vortex#22342](https://github.com/Nexus-Mods/Vortex/pull/22342) | branch: `pr-b-xdg-path-support`
  - `a5f0f5da3` implement Linux XDG path in localAppData with unit tests
  - `7fd6fdebe` adapt @vortex/fs XDG path constants into linux port
  - `da093b6d8` fix path.posix.join in XDG fallback paths

- [ ] **PR-C: winapi-bindings Linux shim** — [Nexus-Mods/Vortex#22343](https://github.com/Nexus-Mods/Vortex/pull/22343) | branch: `pr-c-winapi-shim`
  - `2aa42b9c1` implement winapi-bindings Linux shim with full export coverage
  - `946940e76` add Linux winapi-bindings alias to webpack and rolldown build configs
  - `a3682b49a` remove dead winapi-bindings require from Fallout 4
  - `c0c4bf2a8` add winapi-bindings to neverBuiltDependencies on Linux
  - `754784cd8` exclude winapi-bindings from dist package.json on Linux

- [ ] **PR-D: IPC pipe path abstraction** — [Nexus-Mods/Vortex#22344](https://github.com/Nexus-Mods/Vortex/pull/22344) | branch: `pr-d-ipc-path-utility`
  - `5b8a552c3` add getIPCPath platform utility with Vitest tests
  - `ecef5fafc` patch all IPC pipe path sites to use getIPCPath()
  - `8fd69eab9` add Linux IPC path guard to loot package patch
  - `6cc8cbf2a` restore binding.gyp patch to loot@6.2.1 alongside IPC guards

---

### Wave 2 — After Wave 1 merges

- [ ] **PR-E: Native addon compilation (loot)**
  - `7b33e01ed` add postinstall-libloot.cjs and wire into package.json
  - `2da043461` add ~/.cargo/bin to PATH in postinstall-libloot for local dev
  - `b02712cd7` add @electron/rebuild devDep and native addon smoke test
  - `4ac58245c` fix loot RPATH and addon verification for Linux
  - `3a6488b9b` prepend loot lib dir to LD_LIBRARY_PATH at startup
  - `3bbdd99a9` restore libloot.so.0 and wstring_stub copy in _native

- [ ] **PR-F1: FOMOD path fixes** ⚠️ rebase onto master before submitting (upstream #22320 added preserveChoices to InstallManager.ts — no logic conflict, line shifts only)
  - `cbff6b891` resolve FOMOD source paths case-insensitively in extractArchive ← defensive; works best after fomod-installer fi-2 merges
  - ~~`ca8e99941`~~ normalize backslashes in copy source/destination ← **drop once fomod-installer fi-1 merges**; include only if submitting before fi-1 lands

- [ ] **PR-F2: CSharpScript unsupported warning handler** ⛔ hold until fomod-installer fi-3 merges
  - `0ac7942ca` Linux-specific CSharpScript unsupported warning in reportUnsupported
  > fi-3 emits the warning; this is the Vortex-side handler. No point submitting without fi-3 merged.

- [ ] **PR-F3: Linux FOMD binary wiring** ⛔ hold until fomod-installer fi-4 merges + `@nexusmods/fomod-installer-ipc` dep bumped in Vortex
  - `673d0629f` add Linux FOMD binary asarUnpack entries and fix exe resolution
  > Linux ELF binary must exist in the npm package before this lands. Bump the dep first, then submit.

- [ ] **PR-G: Steam/Proton game discovery**
  - `36e7416e0` add findAllLinuxSteamPaths() and wire multi-root Steam scanning
  - `7feb823a1` add oslist-aware Proton detection for never-launched games
  - `f64cca071` add PROTON_USERNAME + getMyGamesPath(); fix 'My Documents' path bug
  - `4139d862b` async iniFiles() with Linux Proton guard; update all 4 call sites
  - `a1f4b0a99` fix three Linux game discovery and staging bugs
  - `d4ef4df9a` fix test: use path.join in gameSupport assertions for Windows CI compat
  - `c310d6550` add vitest config and gameSupport test stubs
  - `c5d5cf3ce` make mygamesPath/iniPath/prefIniPath async with Linux Proton branch
  - `3b66a5b7d` await all mygamesPath/iniPath callers in index.ts
  - `67e76655b` add unit tests for proton, steamPaths, nxm, and protocol common helpers

- [ ] **PR-H: Linux auto-updater gate + NXM protocol handler**
  - `e93fa7408` add Linux branch to identifyInstallType() for auto-updater gate
  - `207e3b4a1` add ensureAppImageDesktopEntry and wire PACKAGE_DESKTOP_ID branch
  - `aa03d7810` async registerProtocol + Promise<boolean> return type
  - `241402b2b` buffer cold-start NXM URL in mPendingDownload field
  - `0d75228a4` fix NXM download bugs in dev mode
  - `f2f6e06d6` fix NXM second-instance lock by using correct app path
  - `809d4b80a` enable NXM toggle on Linux — remove stale disabled guard
  - `4db4bc46e` clear Firefox handlers.json nxm entry on registration
  - `207d59f58` revert Firefox-specific profile patching
  - `37e2ad7c7` add homepage to dist package.json for deb packaging
  - `0ccaff0ed` replace neverBuiltDependencies with electron-builder files exclusion

---

### Wave 3 — After Wave 2 / after coordination on elevation

- [ ] **PR-I: exe-version Linux fix**
  - `de1a960d7` implement pure-JS PE resource parser for Linux/Mac
  - `ce2cdad00` patch exe-version to return 0.0.0 on Linux; guard blank-version mismatch dialog

- [ ] **PR-J: Elevation foundation / polkit** ⚠️ ask upstream about preferred mechanism first
  - `c0511b612` add pkexec Linux branch + injectable spawner seam to runElevated
  - `6515a54a9` add isSteamOS() detection and sudo -n fallback to elevated.ts
  - `89b9645e5` create polkit action file and wire into electron-builder config
  - `a913f5c06` add polkit rules file granting AUTH_ADMIN_KEEP for Vortex elevation
  - `3467dd421` add pkexec error handler; fix Jest elevated test on Linux

- [ ] **PR-K: Elevation UX / Steam Deck error notifications** (depends on PR-J)
  - `9856e00f7` add _setNotifier callback and rejectWithSteamOSNotification helper
  - `113b9d05a` wire _setNotifier registration at renderer startup

- [ ] **PR-L: Gamebryo extension Linux support** ⚠️ note: no committed binary
  - `d0ff6f1f0` add pnpm patch for gamebryo-savegame Linux compilation
  - `0539ed4b4` fix CHAR_WIDTH undef to gamebryo-savegame fmt patch (GCC 13 macro collision)
  - `886f33e11` add gamebryo Linux support, LD_LIBRARY_PATH, pnpm-lock update
  - `e8f05bedb` fix inverted platform guard in gamebryo-savegame-management
  - `77fdabb67` fix: use || not && so Linux exit(0) skips the savegame build
  - `40582a21d` test: add setSafe/deleteOrNop to gamebryo-savegame vortex-api mock
  - `bfa772411` fix gamebryo build/dist guards for Linux
  - `fdf5c52c9` fix gamebryo ba2/bsa Windows CI by exiting 0 on skip
  - `ddf98fdcb` fix gamebryo-plugin-management Windows CI build guard
  - `3ed99a366` replace committed .so binary with compile-from-source ← call this out in PR description

- [ ] **PR-M: Deployment & activation Linux fixes** ⚠️ rebase onto master before submitting (same InstallManager.ts concern as PR-F)
  - `6f47dbf2b` detect Wine-era deployment manifests in loadActivation
  - `7e4034b77` check backup manifests on ENOENT and guard mods null in deployment
  - `0748357d6` synthesise deployment manifest when undeploy manifest is missing
  - `728c91a85` normalise backslash-in-filename paths after extraction
  - `e9769a08b` hardlink: use sync callback + promise queue for staging scan on Linux
  - `e67c502ba` hardlink: enrich turbowalk entries with lstat on Linux for purge
  - `c6b86d4c4` transferPath: resolve existing ancestor for disk checks on Linux
  - `e9f22c92d` local-gamesettings: skip GloPro/GloBac copy when .base is missing
  - `90ae4aac1` ini-prep: skip purge gracefully when .base file is missing

---

### Wave 4 — HOLD: coordinate with upstream first

- [ ] **PR-N: Case-folding fs abstractions** ⛔ DO NOT SUBMIT until upstream confirms no conflict
  - `8ca5b882d` add resolvePathCase utility for Linux case-insensitive path matching
  - `3d556af84` test: add failing tests for resolvePathCase utility
  - `bbf7c8f39` resolve filename segment case in resolvePathCase
  - `8292efe2f` integrate resolvePathCase into LinkingDeployment
  - `bed04f36c` extend fs.ts case-folding to copyAsync, renameAsync, ensureDirAsync
  - `52f5e86c9` promote resolvePathCase to util/, export via util namespace
  - `a8c13a6e7` wire Wine prefix case-folding shim into fs.ts, clean up PluginPersistor

---

## fomod-installer PRs

Separate repo: [Nexus-Mods/fomod-installer](https://github.com/Nexus-Mods/fomod-installer) | Fork: `fork/linux-port` (15 commits, clean — no planning artifacts, no prebuilt binaries)

Suggested sequence (each is independent, submit in order):

| PR | Title | Commits | Status |
|---|---|---|---|
| fi-1 | fix: normalize XML path separators at parse time | `c17366b` | **draft PR submitted** — [fomod-installer#45](https://github.com/Nexus-Mods/fomod-installer/pull/45) |
| fi-2 | fix: emit real archive case in copy instructions | `17d3785`, `b44d7e7` | ready (depends fi-1) |
| fi-3 | feat: C# script guard + UnsupportedFunctionalityWarning with reason/platform | `e9669a9`, `a53ae6b`, `28b4fe5`, `ffb9ca9`, `c7efe62`, `e6abf2e`, `cd0e68a` | ready |
| fi-4 | ci: Linux IPC build pipeline + platform-aware process cleanup | `57711a9`, `92f54f3`, `27609c2`, `test updates` | ready |
| fi-5 | docs: Linux notes in README | `de4dd40` | ready (can land with fi-3/4) |

---

## Progress

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| A | devcontainer bootstrap | **submitted** | [#22310](https://github.com/Nexus-Mods/Vortex/pull/22310) |
| B | XDG paths | **draft** | [#22342](https://github.com/Nexus-Mods/Vortex/pull/22342) |
| C | winapi shim | **draft** | [#22343](https://github.com/Nexus-Mods/Vortex/pull/22343) |
| D | IPC path utility | **draft** | [#22344](https://github.com/Nexus-Mods/Vortex/pull/22344) |
| E | loot native addon | pending | |
| F1 | FOMOD path fixes | pending | submit when ready; drop ca8e99941 after fi-1 merges |
| F2 | CSharpScript warning handler | HOLD | wait for fomod-installer fi-3 |
| F3 | FOMD binary wiring | HOLD | wait for fomod-installer fi-4 + dep bump |
| G | Steam/Proton discovery | pending | |
| H | NXM + packaging | pending | |
| I | exe-version | pending | |
| J | elevation/polkit | pending | coordinate first |
| K | elevation UX | pending | depends J |
| L | gamebryo addon | pending | |
| M | deployment fixes | pending | |
| N | case-folding fs | HOLD | coordinate first |
