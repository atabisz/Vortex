# Vortex Linux Port — Milestone v8.2 Requirements

**Milestone:** v8.2 — Upstream v2.0.2 Sync
**Goal:** Fold upstream Nexus-Mods/Vortex `v2.0.2` (PR #6 `sync/upstream-v2.0.2`, 41 upstream commits) into the fork on top of `v2.0.1-linux-rebased`. Every Linux fix from `VORTEX-LINUX-MERGE-PLAYBOOK.md` preserved. `pnpm run build` and `pnpm run test` pass on master with the merged tree. Closing artifact is a fast-forward merge of `sync/upstream-v2.0.2` into `master`, tagged `v2.0.2-linux-rebased`.

This milestone is the brownfield repeat of v8.0 / v8.1. Phase numbering continues: v8.0 (24–30) → v8.1 (31–37) → v8.2 (38–44).

**Conflict surface (probed 2026-05-23):** 108 source files / ~234 regions across the v8.0/v8.1 conflict buckets — smaller than v8.1's 109/365.

**Source of truth:** `fork/sync/upstream-v2.0.2` HEAD `314ca807c`. Conflict tree from `git merge-tree --write-tree fork/master fork/sync/upstream-v2.0.2`: `3c032384cca696a9f578f392a6807ba3b0681675`.

---

## v8.2 Requirements

### Tree resolution

- [ ] **SYNC-38a**: Workspace + lockfile + root configs (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `vitest.config.ts`, `prepare-dist-package.mjs`, root TS configs) resolved and `pnpm install --frozen-lockfile` exits 0 — Phase 38
- [ ] **SYNC-38b**: Branch `v8.2/sync-upstream-v2.0.2` cut from master `855fb3e1a`; Phase 38 commits stack on it; `pnpm-workspace.yaml` catalog (per v8.1 D-31 lessons) + lockfile regen pattern (per v8.1 D-31 lessons) honored — Phase 38
- [ ] **SYNC-39a**: Mod-management + download-management hot zone (bucket D — `InstallManager.ts`, `LinkingDeployment.ts`, `externalChanges.ts`, `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx`, plus `download_management/` modules currently shipping in fork) resolved with every playbook §6/§7/externalChanges site preserved — Phase 39
- [ ] **SYNC-39b**: R1 dead-code carry-forward — confirm v8.1's Wave-1 `DownloadManager`/`DownloadObserver` deletion remains intact (no upstream resurrection of the dead modules) — Phase 39
- [ ] **SYNC-40a**: Gamebryo bucket (bucket E — `gamebryo-{plugin-mgmt,savegame-mgmt,test-helpers}`, `modtype-bepinex`, `gamebryo-ba2-support` if touched) resolved with playbook §1 (guards), §3 (LOOT casing), §10 (native binaries) preserved — Phase 40
- [ ] **SYNC-40b**: Per-game extensions (bucket F — collections, BG3, Morrowind, Witcher 3, Skyrim/Skyrim SE/FO4 if conflicted) resolved; native binary postinstall scripts (loot, esptk, bsdiff-node) preserved — Phase 40
- [ ] **SYNC-41a**: Renderer + main spine (buckets G + H — `ExtensionManager`, `controls/Table`, `Application`, `cli`, `errorReporting`, `autoupdater`, `TrayIcon`, `store/{DuckDBSingleton,LevelPersist}`, `preload/index`, `shared/{errors,errors.test,telemetry/spans}`) resolved with bluebird-trap audit clean across all bluebird-importing async fns — Phase 41
- [ ] **SYNC-41b**: Nexus + e2e (buckets I + J — `nexus_integration/{eventHandlers,util,index}`, e2e tests, residual conflict files) resolved with fork-only `AlreadyDownloaded` + `DownloadIsHTML` error types preserved — Phase 41
- [ ] **SYNC-41c**: R2/R3 carry-forward — Jest `__mocks__/` confirmed dropped (per v8.1 D-34-13 precedent); orphan `electron-builder.config.json` confirmed absent (per v8.1 SYNC-35e); any new orphans introduced by v2.0.2 reconciled or removed — Phase 41

### Build verification

- [ ] **SYNC-42a**: `pnpm run typecheck` exits 0 across all workspaces; per-bucket (shared/preload/main/renderer/fingerprints/e2e) all 0 — Phase 42
- [ ] **SYNC-42b**: `pnpm lint:ci` baseline-parity with `fork/master` (no new errors introduced by sync) — Phase 42
- [ ] **SYNC-42c**: `pnpm run test` exits 0 (Vitest invocation); Jest orphan disposition documented (per v8.1 precedent) — Phase 42
- [ ] **SYNC-42d**: `pnpm run build` + `pnpm run build:extensions` both exit 0; bundledPlugins ≥ 130 floor invariant honored (target match v8.1's 132 with margin) — Phase 42
- [ ] **SYNC-42e**: R4 carry-forward — `packages/paths{,-node}/src/` master-restore contingency-fix invoked if v2.0.2 drops the directories again (per v8.1 Wave-2 pattern) — Phase 42

### Land + tag + cherry-pick

- [ ] **SYNC-43a**: `sync/upstream-v2.0.2` rebased onto `master` HEAD; `gh pr merge 6 --merge=fast-forward` succeeds — Phase 43
- [ ] **SYNC-43b**: SSH-signed annotated tag `v2.0.2-linux-rebased` on the post-FF master HEAD; pushed to `fork` (atabisz/Vortex) — Phase 43
- [ ] **SYNC-43c**: Linux-only commits cherry-picked from post-FF master to `linux-port` branch via the `--no-merges` path-based filter from D-30-03 / v8.1 SYNC-36c (excluding `.planning/`, fork CI, fork tooling) — Phase 43
- [ ] **SYNC-43d**: `release-linux.yml` runs on tag push and produces AppImage + .deb artifacts with SHA256 manifest — Phase 43

### Carry-forward UAT

- [ ] **SYNC-44a**: Canonical AppImage + .deb local-boot smoke + Skyrim SE walkthrough on `linux-port` HEAD (real-usage roll-up per v8.1 D-37-02 default) — Phase 44
- [ ] **SYNC-44b**: `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with any new playbook entries discovered during v8.2 conflict resolution; SSH-signed commit on master mirroring v8.1's `b0037bf1e` shape — Phase 44

### Out of scope (v8.2)

- Upstream v2.0.3+ sync — separate milestone
- New Linux features beyond playbook protection
- Refactoring inside files we're conflict-resolving (resolution only)
- Phase 999.1 manual hardware UAT (BACKLOG, not v8.2 scope)

---

## Traceability

| Requirement                  | Phase                         | Plans             | Status |
| ---------------------------- | ----------------------------- | ----------------- | ------ |
| SYNC-38a, SYNC-38b           | 38 (config bucket)            | TBD by plan-phase | —      |
| SYNC-39a, SYNC-39b           | 39 (mod-mgmt + download)      | TBD by plan-phase | —      |
| SYNC-40a, SYNC-40b           | 40 (gamebryo + per-game)      | TBD by plan-phase | —      |
| SYNC-41a, SYNC-41b, SYNC-41c | 41 (renderer + spine + nexus) | TBD by plan-phase | —      |
| SYNC-42a–e                   | 42 (build verification)       | TBD by plan-phase | —      |
| SYNC-43a–d                   | 43 (land + tag + cherry-pick) | TBD by plan-phase | —      |
| SYNC-44a, SYNC-44b           | 44 (carry-forward UAT)        | TBD by plan-phase | —      |
