# Requirements: Vortex Linux — v8.1 Upstream v2.0.1 Sync

**Defined:** 2026-05-22
**Core Value:** A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.

**Milestone scope:** Land upstream `v2.0.1` (PR #5) into master with all Linux fixes preserved and Windows CI green. Sync branch `sync/upstream-v2.0.1` carries 264 upstream commits, ~469 changed files, ~330 files with conflict markers preserved on the merge commit. Same playbook shape as v8.0; the v8.0 5D post-mortem deltas are already encoded.

**Carry-forward absorbed from v8.0:** SYNC-33-C local-boot evidence, SYNC-34 Skyrim SE 4-screenshot walkthrough, SYNC-39 `linux-port` baseline drift catch-up.

## v8.1 Requirements

### Conflict Resolution

- [ ] **SYNC-2.0.1-01**: All conflict markers on `sync/upstream-v2.0.1` resolved — `git grep '^<<<<<<< '` returns zero hits
- [ ] **SYNC-2.0.1-02**: Config bucket (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `eslint.config.mjs` family, `prepare-dist-package.mjs`, `tsconfig*.json`, `.vscode/extensions.json`, `docker/windows/Dockerfile`) resolved before any other bucket — tree must parse first
- [ ] **SYNC-2.0.1-03**: `pnpm-lock.yaml` regenerated cleanly; `pnpm install --frozen-lockfile` succeeds on the resulting branch
- [ ] **SYNC-2.0.1-04**: Mod-management hot zone (`InstallManager.ts`, `LinkingDeployment.ts`, `externalChanges.ts`, `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx`) resolved file-by-file with playbook re-grep checkpoint per file
- [ ] **SYNC-2.0.1-05**: Gamebryo extensions resolved: plugin-management, savegame-management, collections, modtype-bepinex
- [ ] **SYNC-2.0.1-06**: Per-game extensions resolved with prior fixes preserved (BG3 divine error handling, Morrowind migrate103, Witcher 3)
- [ ] **SYNC-2.0.1-07**: Renderer infrastructure resolved (`controls/`, `contexts/`, `hooks/`, `reducers/`, `ui/`, `util/`, `views/`, `ExtensionManager.ts`, health_check / extension_manager extensions)
- [ ] **SYNC-2.0.1-08**: Main / preload / shared spine resolved (`Application.ts`, `cli.ts`, `errorReporting.ts`, `autoupdater.ts`, `TrayIcon.ts`, `store/{DuckDBSingleton,LevelPersist}.ts`, `preload/index.ts`, `shared/{errors,errors.test,telemetry/spans}.ts`)
- [ ] **SYNC-2.0.1-09**: Nexus integration resolved (`eventHandlers.ts`, `index.tsx`, `util.ts`, `util/UIDs.ts`, `views/FreeUserDLDialog.tsx`)
- [ ] **SYNC-2.0.1-10**: Fork-disabled fingerprint action resolved by picking upstream-side; fork-side workflow disablement preserved at the GitHub API layer

### Linux Playbook Compliance (re-grep clean post-rebase)

- [ ] **SYNC-2.0.1-11**: Playbook §1 — gamebryo-{plugin-mgmt,bsa-support,archive-support,ba2-support} have no inline platform guard in `package.json`; CI native-rebuild pattern intact; xbox uses `skip-on-linux.mjs`
- [ ] **SYNC-2.0.1-12**: Playbook §2 — `src/renderer/webpack.config.cjs` `nodeExternals` allowlist includes `["winapi-bindings"]` on Linux
- [ ] **SYNC-2.0.1-13**: Playbook §3 — All four LOOT call sites in `extensions/gamebryo-plugin-management/src/autosort.ts` use `path.basename(pluginList[id].filePath)` not `pluginName.toLowerCase()`
- [ ] **SYNC-2.0.1-14**: Playbook §4 — `testPathTransfer` in `src/renderer/src/util/transferPath.ts` has no `if (platform !== "win32") reject(UnsupportedOperatingSystem)` guard
- [ ] **SYNC-2.0.1-15**: Playbook §5 — `pnpm run build:extensions` populates `src/main/build/bundledPlugins/` with the expected entry count for v2.0.1
- [ ] **SYNC-2.0.1-16**: Playbook §6 — `stagingDirHasFiles` import + call present in `InstallManager.ts:doDownload`; sibling `util/stagingIntegrity.ts` exists
- [ ] **SYNC-2.0.1-17**: Playbook §7 — backslash/case cluster present in `InstallManager.ts`: `normalizeBackslashPaths` + `mergeCaseConflictingDirs` imports + calls, `replaceAll("\\", "/")` on copy source AND destination, `resolvePathCase(tempPath, source, caseCache)` in `extractArchive`
- [ ] **SYNC-2.0.1-18**: Playbook §8 — `StarterInfo.ts` has `isPathPrefix()`, `shouldRunWithProton()`, `runToolWithProton()` with hide-instead-of-quit `onSpawned`
- [ ] **SYNC-2.0.1-19**: Playbook §9 — `Steam.ts` `resolveSteamPaths()` calls `findAllLinuxSteamPaths()` and reads `libraryfolders.vdf` from every Steam root
- [ ] **SYNC-2.0.1-20**: Playbook §10 — gamebryo `dist/` cross-compiled binaries handled by CI native-rebuild; no `.so`/`.node` checked into the tree
- [ ] **SYNC-2.0.1-21**: `LinkingDeployment.ts` retains `resolvePathCase(dataPath, relDataPath, dirCache)` calls in deploy/externalChanges flow
- [ ] **SYNC-2.0.1-22**: v6.0 fs casefold layer intact: `applyChattrCasefold`, statfs cache, injectable seams (`_setChattr`, `_setChattrNotifier`, `_resetChattrState`), Flatpak/platform guards, post-chattr verify

### Build & Test Verification

- [ ] **SYNC-2.0.1-23**: `pnpm run typecheck` passes across all workspaces (root + packages + extensions + extensions/games)
- [ ] **SYNC-2.0.1-24**: `pnpm run build` succeeds for the main + renderer + preload + shared chain
- [ ] **SYNC-2.0.1-25**: `pnpm run build:extensions` succeeds for every extension
- [ ] **SYNC-2.0.1-26**: `pnpm run test` (Vitest) passes; renderer Jest divergence remains acknowledged
- [ ] **SYNC-2.0.1-27**: `pnpm run lint:ci` passes (or surfaces only pre-existing warnings — diff vs. master)

### Carry-Forward UAT (deferred from v8.0)

- [ ] **SYNC-33-C**: Local-boot evidence captured — `pnpm run start` boots from source on Linux dev host with screenshots/console logs in evidence file
- [ ] **SYNC-34**: 5-minute manual smoke on Linux — detect a Steam game, install one mod via Skyrim SE, deploy, launch via Proton — 4 screenshots captured (game detected, mod installed, deployed, launched)
- [ ] **SYNC-39**: `linux-port` branch baseline drift catch-up — diff `linux-port` against master Linux-relevant commits; cherry-pick or rebase any missed deltas; commit-index table refreshed

### Land & Cherry-Pick

- [ ] **SYNC-2.0.1-28**: Windows CI green on the resolved merge commit (master post-FF)
- [ ] **SYNC-2.0.1-29**: PR #5 (`atabisz/Vortex#5`) merged into master via fast-forward
- [ ] **SYNC-2.0.1-30**: Tag `v2.0.1-linux-rebased` created on the merge commit (SSH-signed)
- [ ] **SYNC-2.0.1-31**: `release-linux.yml` produces AppImage + .deb on the tag; SHA256s captured in evidence
- [ ] **SYNC-2.0.1-32**: Linux-only commits cherry-picked from master to `linux-port` per branch policy (excludes `.planning/`, fork CI, fingerprint disablement)
- [ ] **SYNC-2.0.1-33**: `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with any new gotchas surfaced during resolution; commit-index table updated with new master / linux-port hashes

## Out of Scope

| Feature                                       | Reason                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Upstream v2.0.2 sync (PR #6)                  | Sits on top of v2.0.1; queued for v8.2 once v8.1 ships                                          |
| New Linux features beyond playbook items 1–10 | Sync milestone — feature work belongs in a future milestone                                     |
| Cherry-pick to `linux-port` during resolution | Happens once after master ships, not incrementally during phases                                |
| Refactoring inside conflict-resolution files  | Resolution-only — defer cleanup, even when a conflict region is obviously sloppy on either side |
| Hardware UAT for ELEV-04/05/06                | Phase 999.1 backlog; requires Steam Deck + desktop Linux hardware coordination                  |
| Heroic Launcher integration                   | Deferred to v9.0+                                                                               |

## Future Requirements (deferred)

- DIST-05: AppImage delta auto-update on SteamOS immutable filesystem
- PROT-03: NXM handler via Steam Browser overlay on Steam Deck — requires Nexus Mods web team + hardware
- ELEV-04 / ELEV-05 / ELEV-06: hardware UAT closure (Phase 999.1 backlog)
- SAVE-05: live save transfer UAT on Linux

## Traceability

Filled by roadmap.

| REQ-ID            | Phase |
| ----------------- | ----- |
| (pending roadmap) | —     |
