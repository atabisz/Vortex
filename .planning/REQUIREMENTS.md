# Requirements: Vortex Linux — v8.0 Upstream v2.0.0 Sync

**Defined:** 2026-05-15
**Core Value:** A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.

**Milestone scope:** Land upstream `v2.0.0` (PR #4) into master with all Linux fixes preserved and Windows CI green. The 109 conflict files plus 135 dropped-by-auto-merge files are the work surface. Detailed bucket inventory: `.planning/milestones/v8.0-SCOPE-PROPOSAL.md`.

## v8.0 Requirements

### Conflict Resolution

- [ ] **SYNC-01**: All 109 conflict markers on `sync/upstream-v2.0.0` resolved — `git grep '^<<<<<<< '` returns zero hits
- [ ] **SYNC-02**: Config bucket (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, four `eslint.config.mjs`, `prepare-dist-package.mjs`, `tsconfig.api.json`, `.vscode/extensions.json`, `docker/windows/Dockerfile`) resolved before any other bucket — tree must parse first
- [ ] **SYNC-03**: `pnpm-lock.yaml` regenerated cleanly; `pnpm install --frozen-lockfile` succeeds on the resulting branch
- [ ] **SYNC-04**: Mod-management hot zone resolved file-by-file with playbook re-grep checkpoint per file: `InstallManager.ts`, `LinkingDeployment.ts`, `externalChanges.ts`, `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx`
- [x] **SYNC-05**: Gamebryo extensions resolved: `gamebryo-plugin-management/{index,gameSupport,PluginPersistor,PluginList}`, `gamebryo-savegame-management/{index,session}`, `collections/*` (6 files), `modtype-bepinex/*` (3 files)
- [x] **SYNC-06**: Per-game extensions resolved: BG3 (7 files), Morrowind, Witcher 3 (2 files); BG3 divine error handling and Morrowind migrate103 fix preserved
- [ ] **SYNC-07**: Renderer infrastructure (28 files in `controls/`, `contexts/`, `hooks/`, `reducers/`, `ui/`, `util/`, `views/`, plus `ExtensionManager.ts` and 8 health_check/extension_manager/etc. extensions) resolved
- [ ] **SYNC-08**: Main / preload / shared spine resolved: `Application.ts`, `cli.ts`, `errorReporting.ts`, `autoupdater.ts`, `TrayIcon.ts`, `store/{DuckDBSingleton,LevelPersist}.ts`, `preload/index.ts`, `shared/{errors,errors.test,telemetry/spans}.ts`, `scripts/download-duckdb-extensions.{ts,test.ts}`
- [ ] **SYNC-09**: Nexus integration resolved: `eventHandlers.ts`, `index.tsx`, `util.ts`, `util/UIDs.ts`, `selectors.test.ts`, `views/FreeUserDLDialog.tsx`
- [ ] **SYNC-10**: Fork-disabled fingerprint action (11 files) resolved by picking upstream-side; fork-side workflow disablement preserved at the GitHub API layer

### Dropped-Content Restoration

- [x] **SYNC-11**: `packages/paths/` (49 files) restored — workspace resolves, `pnpm typecheck` passes for `@vortex/paths`
- [x] **SYNC-12**: `packages/paths-node/` (8 files) restored — depends on `@vortex/paths`, both pass typecheck
- [x] **SYNC-13**: `extensions/gamebryo-ba2-support/` (5 files) restored with named-script Linux guard (`skip-on-windows.mjs && _build` pattern) and CI native-rebuild step modeled on `bsa-support`
- [x] **SYNC-14**: `src/main/src/downloading/{chunking,chunking.test,downloader.test}.ts` restored — required by v2.0.0's DownloadManager rewrite
- [x] **SYNC-15**: Upstream Jest scaffolding (`src/renderer/jest.config.mjs`, ~25 `__mocks__/*` files, ~25 `__tests__/*` files) deliberately NOT restored — divergence noted in `VORTEX-LINUX-MERGE-PLAYBOOK.md`
- [x] **SYNC-16**: Other dropped non-test files reviewed: `extensions/collections/__tests__/bsdiff-node.test.ts`, missing `.github/workflows/{package,signing-test,update-api-tag,review-extension-issue-created}.yml`, `docs/flatpak-{maintenance,technical}.md`, `AGENTS-DEBUGGING.md` — restored unless an explicit reason to drop is documented

### Linux Playbook Compliance

- [x] **SYNC-17**: Playbook §1 — gamebryo-{plugin-mgmt,bsa-support,archive-support} have NO inline platform guard in `package.json`; bsa/plugin-mgmt build via CI native-rebuild pattern; xbox uses `skip-on-linux.mjs`
- [ ] **SYNC-18**: Playbook §2 — `src/renderer/webpack.config.cjs` `nodeExternals` allowlist includes `["winapi-bindings"]` on Linux
- [x] **SYNC-19**: Playbook §3 — All four LOOT call sites in `extensions/gamebryo-plugin-management/src/autosort.ts` use `path.basename(pluginList[id].filePath)` not `pluginName.toLowerCase()`
- [ ] **SYNC-20**: Playbook §4 — `testPathTransfer` in `src/renderer/src/util/transferPath.ts` has NO `if (platform !== "win32") reject(UnsupportedOperatingSystem)` guard
- [ ] **SYNC-21**: Playbook §5 — `pnpm run build:extensions` populates `src/main/build/bundledPlugins/` with ~132 entries
- [ ] **SYNC-22**: Playbook §6 — `stagingDirHasFiles` import + call present in `InstallManager.ts:doDownload`; sibling `util/stagingIntegrity.ts` exists
- [ ] **SYNC-23**: Playbook §7a–d — four-fix backslash/case cluster present in `InstallManager.ts`: `normalizeBackslashPaths` import + 2 calls, `mergeCaseConflictingDirs` import + 2 calls, `replaceAll("\\", "/")` on copy `source` AND `destination`, `resolvePathCase(tempPath, source, caseCache)` in `extractArchive` copy loop
- [ ] **SYNC-24**: Playbook §8 — `StarterInfo.ts` has `isPathPrefix()` helper, `shouldRunWithProton()` using it, `runToolWithProton()` with hide-instead-of-quit `onSpawned` behavior
- [ ] **SYNC-25**: Playbook §9 — `Steam.ts` `resolveSteamPaths()` calls `findAllLinuxSteamPaths()` and reads `libraryfolders.vdf` from every Steam root
- [ ] **SYNC-26**: Playbook §10 — `extensions/gamebryo-plugin-management/dist/` and `extensions/gamebryo-bsa-support/dist/` cross-compiled binaries handled by CI native-rebuild (no `.so`/`.node` checked into the tree on this branch)
- [ ] **SYNC-27**: `LinkingDeployment.ts` retains `140a57217` fix — `resolvePathCase(dataPath, relDataPath, dirCache)` calls in deploy/externalChanges flow

### Build & Test Verification

- [ ] **SYNC-28**: `pnpm run typecheck` passes across all workspaces (root + packages + extensions + extensions/games)
- [ ] **SYNC-29**: `pnpm run build` succeeds for the main + renderer + preload + shared chain
- [ ] **SYNC-30**: `pnpm run build:extensions` succeeds for every extension
- [ ] **SYNC-31**: `pnpm run test` (Vitest) passes; renderer divergence (no Jest) acknowledged
- [ ] **SYNC-32**: `pnpm run lint:ci` passes (or surfaces only pre-existing warnings — diff vs. master)
- [ ] **SYNC-33**: AppImage produced by `release-linux.yml` boots; `pnpm run start` boots from source
- [ ] **SYNC-34**: 5-minute manual smoke on Linux: detect a Steam game, install one mod, deploy, launch via Proton — no regressions vs. v2.0.0-linux

### Land & Cherry-Pick

- [ ] **SYNC-35**: Windows CI green on the resolved merge commit (master post-FF)
- [ ] **SYNC-36**: PR #4 (`atabisz/Vortex#4`) merged into master via fast-forward
- [ ] **SYNC-37**: Tag `v2.0.0-linux-rebased` created on the merge commit
- [ ] **SYNC-38**: Linux-only commits cherry-picked from master to `linux-port` branch per existing branch policy (excludes `.planning/`, fork CI, fingerprint disablement)
- [ ] **SYNC-39**: `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with any new gotchas surfaced during resolution; commit-index table updated with new master/linux-port hashes

## Out of Scope

| Feature                                       | Reason                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Upstream v2.0.1 sync (PR #5)                  | Sits on top of v2.0.0; PR #5 is queued as v8.1 / v9.0 once v8.0 ships                           |
| New Linux features beyond playbook items 1–10 | Sync milestone — feature work belongs in a future milestone                                     |
| Cherry-pick to `linux-port` during resolution | Happens once after master ships, not incrementally during the 7 phases                          |
| Refactoring inside conflict-resolution files  | Resolution-only — defer cleanup, even when a conflict region is obviously sloppy on either side |
| Restoring upstream Jest scaffolding           | Fork is Vitest-only by deliberate v3.0/v4.0 decision; documented in playbook                    |
| Heroic Launcher integration                   | Out of scope per project-wide constraint; deferred to v4.0+ track                               |

## Traceability

| Requirement | Phase    | Status                                                              |
| ----------- | -------- | ------------------------------------------------------------------- |
| SYNC-01     | Phase 29 | Complete                                                            |
| SYNC-02     | Phase 24 | Complete                                                            |
| SYNC-03     | Phase 24 | Complete                                                            |
| SYNC-04     | Phase 26 | Complete                                                            |
| SYNC-05     | Phase 27 | Complete                                                            |
| SYNC-06     | Phase 27 | Complete                                                            |
| SYNC-07     | Phase 28 | Complete                                                            |
| SYNC-08     | Phase 28 | Complete                                                            |
| SYNC-09     | Phase 28 | Complete                                                            |
| SYNC-10     | Phase 28 | Complete                                                            |
| SYNC-11     | Phase 25 | Complete                                                            |
| SYNC-12     | Phase 25 | Complete                                                            |
| SYNC-13     | Phase 25 | Complete                                                            |
| SYNC-14     | Phase 25 | Complete                                                            |
| SYNC-15     | Phase 25 | Complete                                                            |
| SYNC-16     | Phase 25 | Complete                                                            |
| SYNC-17     | Phase 27 | Complete                                                            |
| SYNC-18     | Phase 28 | Complete                                                            |
| SYNC-19     | Phase 27 | Complete                                                            |
| SYNC-20     | Phase 28 | Complete                                                            |
| SYNC-21     | Phase 29 | Complete                                                            |
| SYNC-22     | Phase 26 | Complete                                                            |
| SYNC-23     | Phase 26 | Complete                                                            |
| SYNC-24     | Phase 28 | Complete                                                            |
| SYNC-25     | Phase 28 | Complete                                                            |
| SYNC-26     | Phase 28 | Complete                                                            |
| SYNC-27     | Phase 26 | Complete                                                            |
| SYNC-28     | Phase 29 | Complete                                                            |
| SYNC-29     | Phase 29 | Complete                                                            |
| SYNC-30     | Phase 29 | Complete                                                            |
| SYNC-31     | Phase 29 | Complete                                                            |
| SYNC-32     | Phase 29 | Complete (D fix landed mid-Phase-30, see 30-TAG-EVIDENCE.md)        |
| SYNC-33     | Phase 29 | Complete (parts A+B; part C carry-forward DEFERRED → v8.1)          |
| SYNC-34     | Phase 29 | Complete (real-usage PASS via D-29-03; walkthrough DEFERRED → v8.1) |
| SYNC-35     | Phase 30 | Complete                                                            |
| SYNC-36     | Phase 30 | Complete                                                            |
| SYNC-37     | Phase 30 | Complete                                                            |
| SYNC-38     | Phase 30 | Complete (with SYNC-39 follow-up tracked → v8.1)                    |
| SYNC-39     | Phase 30 | Complete (linux-port baseline drift catch-up → v8.1)                |

**Coverage:**

- v8.0 requirements: 39 total
- Mapped to phases: 39 ✓
- Unmapped: 0

**Phase distribution:**

- Phase 24 (Config bucket): SYNC-02, SYNC-03 (2)
- Phase 25 (Restore dropped scaffolding): SYNC-11..16 (6)
- Phase 26 (Mod-management hot zone): SYNC-04, SYNC-22, SYNC-23, SYNC-27 (4)
- Phase 27 (Gamebryo + per-game extensions): SYNC-05, SYNC-06, SYNC-17, SYNC-19 (4)
- Phase 28 (Renderer + main spine): SYNC-07, SYNC-08, SYNC-09, SYNC-10, SYNC-18, SYNC-20, SYNC-24, SYNC-25, SYNC-26 (9)
- Phase 29 (Build verification): SYNC-01, SYNC-21, SYNC-28..34 (9)
- Phase 30 (Land + tag): SYNC-35..39 (5)

---

_Requirements defined: 2026-05-15_
_Last updated: 2026-05-15 — traceability populated; all 39 SYNC requirements mapped across Phases 24–30_
