# Vortex Linux Port — Milestone v8.1 Requirements

**Milestone:** v8.1 — Upstream v2.0.1 Sync
**Goal:** Fold upstream Nexus-Mods/Vortex `v2.0.1` (~PR #5) into the fork on top of `v2.0.0-linux-rebased`. Every Linux fix from `VORTEX-LINUX-MERGE-PLAYBOOK.md` preserved. `pnpm run build` and `pnpm run test` pass on master with the merged tree. Closing artifact is a fast-forward merge of `sync/upstream-v2.0.1` into `master`, tagged `v2.0.1-linux-rebased`.

This milestone is the brownfield repeat of v8.0 (which folded `v2.0.0`). Phase numbering continues from v7.0 → v8.0 (24-30) → v8.1 (31-37).

---

## v8.1 Requirements

### Tree resolution

- [x] **SYNC-31a**: Workspace + lockfile + root configs (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `vitest.config.ts`, `prepare-dist-package.mjs`) parse and `pnpm install --frozen-lockfile` exits 0 — Phase 31
- [ ] **SYNC-32a**: Mod-management hot zone (`InstallManager.ts`, `LinkingDeployment.ts`, `DownloadManager.ts`, `externalChanges.ts`, `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx`) resolved with every playbook §6/§7/externalChanges site preserved — Phase 32
- [x] **SYNC-33a**: Gamebryo + per-game extensions (`gamebryo-{plugin-mgmt,savegame-mgmt}`, collections, modtype-bepinex, BG3, Morrowind, Witcher 3) resolved with playbook §1 (guards), §3 (LOOT casing), §10 (native binaries) preserved — Phase 33
- [x] **SYNC-33b**: Catalog entries dropped by pnpm `cleanupUnusedCatalogs` in Phase 31 (`esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`) re-added when their consumer extensions become workspace members — Phase 33 (resolved as full deferral per D-33-13: 3 packages replaced by pure-TS workspace rewrites during v8.0/v8.1 port; 1 satisfied via workspace package; 0 catalog re-adds warranted)
- [ ] **SYNC-34a**: Renderer + main + shared spine (`ExtensionManager`, `controls/Table`, `Application`, `cli`, `errorReporting`, `autoupdater`, `TrayIcon`, `store/{DuckDBSingleton,LevelPersist}`, `preload/index`, `shared/{errors,errors.test,telemetry/spans}`, nexus_integration) resolved — Phase 34
- [x] **SYNC-34b**: R2 carry-forward — Jest `__mocks__/` reintroduction decision documented (likely keep dropped per v8.0 precedent) — Phase 34 — done in 34-08 (R2 DROP 6c41da31b, renderer typecheck unchanged at 9 errors all in deferred download_management/ scope)

### Build verification

- [ ] **SYNC-35a**: `pnpm run typecheck` exits 0 across all workspaces — Phase 35
- [ ] **SYNC-35b**: `pnpm run lint` baseline-parity with `fork/master` (no new errors introduced by sync) — Phase 35
- [ ] **SYNC-35c**: `pnpm run test` exits 0 (Vitest + Jest) — Phase 35
- [ ] **SYNC-35d**: `pnpm run build` exits 0 (renderer webpack + main rolldown + extensions) — Phase 35
- [ ] **SYNC-35e**: R3 carry-forward — orphan `electron-builder.config.json` reconciled or removed — Phase 35

### Land + tag + cherry-pick

- [ ] **SYNC-36a**: `sync/upstream-v2.0.1` rebased onto `master` HEAD; `gh pr merge 5 --merge=fast-forward` succeeds — Phase 36
- [ ] **SYNC-36b**: SSH-signed annotated tag `v2.0.1-linux-rebased` on the post-FF master HEAD; pushed to `origin` (Nexus-Mods/Vortex) and `fork` (atabisz/Vortex) — Phase 36
- [ ] **SYNC-36c**: Linux-only commits cherry-picked from post-FF master to `linux-port` branch via the path-based filter from D-30-03 (excluding `.planning/`, fork CI, fork tooling) — Phase 36
- [ ] **SYNC-36d**: `release-linux.yml` runs on tag push and produces AppImage + .deb artifacts with SHA256 manifest — Phase 36

### Carry-forward UAT

- [ ] **SYNC-37a**: SYNC-33-C, SYNC-34, SYNC-39 deferred items from v8.0 documented in Phase 999.1 backlog or resolved — Phase 37
- [ ] **SYNC-37b**: `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with any new playbook entries discovered during v8.1 conflict resolution — Phase 37

### Out of scope (v8.1)

- Upstream v2.0.2+ sync — separate milestone
- New Linux features beyond playbook protection
- Refactoring inside files we're conflict-resolving (resolution only)
- Phase 999.1 manual hardware UAT (BACKLOG, not v8.1 scope)

---

## Traceability

| Requirement        | Phase                         | Plans                           | Status                                       |
| ------------------ | ----------------------------- | ------------------------------- | -------------------------------------------- |
| SYNC-31a           | 31 (config-bucket)            | 11 atomic resolutions + 8 plans | ✓ shipped to `v8.1/config-bucket` 2026-05-22 |
| SYNC-32a           | 32 (mod-management hot zone)  | TBD by plan-phase               | —                                            |
| SYNC-33a, SYNC-33b | 33 (gamebryo + per-game)      | TBD by plan-phase               | —                                            |
| SYNC-34a, SYNC-34b | 34 (renderer + main spine)    | TBD by plan-phase               | —                                            |
| SYNC-35a–e         | 35 (build verification)       | TBD by plan-phase               | —                                            |
| SYNC-36a–d         | 36 (land + tag + cherry-pick) | TBD by plan-phase               | —                                            |
| SYNC-37a, SYNC-37b | 37 (carry-forward UAT)        | TBD by plan-phase               | —                                            |
