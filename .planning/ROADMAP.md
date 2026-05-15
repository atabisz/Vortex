# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Elevation Hardening + Save Transfer** — Phases 11–14 (shipped 2026-04-07) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 fomod-installer Linux Fixes** — Phase 15 (shipped 2026-04-09) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Infrastructure** — Phases 16–17 (shipped 2026-04-15) — [archive](milestones/v6.0-ROADMAP.md)
- ✅ **v7.0 First-Run Onboarding Wizard** — Phases 18–23 (shipped 2026-04-17) — [archive](milestones/v7.0-ROADMAP.md)
- ⬜ **v8.0 Upstream v2.0.0 Sync** — Phases 24–30 (planning 2026-05-15)

## Phases

<details>
<summary>✅ v1.0 Linux Port Phase 1 (Phases 1–5) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Runtime Environment (1/1 plans) — completed 2026-03-30
- [x] Phase 2: winapi-bindings Shim (2/2 plans) — completed 2026-03-30
- [x] Phase 3: Native Addon Compilation (3/3 plans) — completed 2026-03-30
- [x] Phase 4: FOMOD Installer Integration (2/2 plans) — completed 2026-03-31
- [x] Phase 5: IPC and Elevation Audit (2/2 plans) — completed 2026-03-31

</details>

<details>
<summary>✅ v2.0 Usable on Linux (Phases 6–8) — SHIPPED 2026-04-01</summary>

- [x] Phase 6: Steam/Proton Detection (3/3 plans) — completed 2026-04-01
- [x] Phase 7: Linux Packaging (2/2 plans) — completed 2026-04-01
- [x] Phase 8: NXM Protocol Handler (2/2 plans) — completed 2026-04-01

</details>

<details>
<summary>✅ v3.0 Save Games + Elevation (Phases 9–10) — SHIPPED 2026-04-01</summary>

- [x] Phase 9: Native Addon Fix + Elevation Foundation (2/2 plans) — completed 2026-04-01
- [x] Phase 10: Save UI Validation + SteamOS + Polkit (2/2 plans) — completed 2026-04-01

</details>

<details>
<summary>✅ v4.0 Elevation Hardening + Save Transfer (Phases 11–14) — SHIPPED 2026-04-07</summary>

- [x] Phase 11: Persistent Elevation Token (1/1 plans) — completed 2026-04-07
- [x] Phase 12: Elevation End-to-End Validation + Steam Deck Error UX (1/1 plans) — completed 2026-04-07
- [x] Phase 13: Save Transfer (1/1 plans) — completed 2026-04-07
- [x] Phase 14: Linux Case-Folding fs Wrapper (2/2 plans) — completed 2026-04-07

</details>

<details>
<summary>✅ v5.0 fomod-installer Linux Fixes (Phase 15) — SHIPPED 2026-04-09</summary>

- [x] Phase 15: fomod-installer Linux Fixes + Vortex Cleanup (3/3 plans) — completed 2026-04-09

</details>

<details>
<summary>✅ v6.0 Infrastructure (Phases 16–17) — SHIPPED 2026-04-15</summary>

- [x] Phase 16: chattr+F Filesystem Layer (1/1 plans) — completed 2026-04-15
- [x] Phase 17: Upstream Rebase CI Workflow (1/1 plans) — completed 2026-04-15

</details>

<details>
<summary>✅ v7.0 First-Run Onboarding Wizard (Phases 18–23) — SHIPPED 2026-04-17</summary>

- [x] Phase 18: First-Run Dashboard Foundation (2/2 plans) — completed 2026-04-16
- [x] Phase 19: Staging Directory Wiring (3/3 plans) — completed 2026-04-16
- [x] Phase 20: Windows String Purge (2/2 plans) — completed 2026-04-16
- [x] Phase 21: Mod Install Round-Trip Validation (2/2 plans) — completed 2026-04-16
- [x] Phase 22: Steam Deck Layout (1/1 plans) — completed 2026-04-17
- [x] Phase 23: Help Links (2/2 plans) — completed 2026-04-17

</details>

### v8.0 Upstream v2.0.0 Sync (Phases 24–30) — PLANNING

- [x] **Phase 24: Config bucket** (complete 2026-05-15) — resolve tree-blocking config conflicts; `pnpm install` succeeds
- [x] **Phase 25: Restore dropped scaffolding** — bring back `packages/paths`, `paths-node`, `gamebryo-ba2-support`, chunking; deliberately drop Jest scaffolding (completed 2026-05-15)
- [x] **Phase 26: Mod-management hot zone** (complete 2026-05-15) — resolve 8 files in `mod_management/` with playbook re-grep checkpoint per file
- [ ] **Phase 27: Gamebryo + per-game extensions** — resolve gamebryo plugin/savegame, collections, bepinex, BG3/Morrowind/Witcher 3
- [ ] **Phase 28: Renderer + main spine** — resolve renderer infra, main/preload/shared, nexus_integration, scripts, fingerprints (pick-theirs)
- [ ] **Phase 29: Build verification** — typecheck, build, tests, AppImage + .deb produced, Linux smoke test passes
- [ ] **Phase 30: Land + tag** — Windows CI green, FF-merge PR #4, tag `v2.0.0-linux-rebased`, cherry-pick to `linux-port`, close PR #4

## Phase Details

### Phase 24: Config bucket

**Goal**: Tree parses and `pnpm install` succeeds — unblocks every downstream phase.
**Depends on**: Nothing (first v8.0 phase; sits on top of v7.0 baseline)
**Requirements**: SYNC-02, SYNC-03
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits within Bucket A files (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, four `eslint.config.mjs`, `prepare-dist-package.mjs`, `tsconfig.api.json`, `.vscode/extensions.json`, `docker/windows/Dockerfile`)
2. `pnpm install` succeeds on `sync/upstream-v2.0.0` and produces a regenerated `pnpm-lock.yaml`
3. `pnpm install --frozen-lockfile` succeeds on the resulting branch — committed lockfile is consistent
4. The IDE/TypeScript server loads the project tree without parser errors and resolves all workspace packages
   **Plans**: 8 plans

- [x] 24-01-PLAN.md — Bootstrap v8.0/config-bucket branch + baseline conflict-marker inventory (drift fix in CONTEXT: root → preload eslint config)
- [x] 24-02-PLAN.md — Resolve trivial-stance configs (.vscode/extensions.json D-08, docker/windows/Dockerfile D-09)
- [x] 24-03-PLAN.md — Resolve four eslint.config.mjs files via hand-merge per D-10
- [x] 24-04-PLAN.md — Resolve build-tooling configs (vitest.config.ts D-11, tsconfig.api.json + prepare-dist-package.mjs D-12)
- [x] 24-05-PLAN.md — Resolve package.json — keep HEAD scripts region per D-06/D-13/D-14/D-15
- [x] 24-06-PLAN.md — Resolve pnpm-workspace.yaml — keep HEAD allowBuilds region per D-07
- [x] 24-07-PLAN.md — Regenerate pnpm-lock.yaml + done-gate verification (D-16, D-17); BG3 package.json fix in-scope
- [x] 24-08-PLAN.md — Force-with-lease push to fork/sync/upstream-v2.0.0 per D-02 — pushed at 87784986d

### Phase 25: Restore dropped scaffolding

**Goal**: Tree contents match upstream `v2.0.0` except where the fork deliberately diverges; divergences are documented.
**Depends on**: Phase 24
**Requirements**: SYNC-11, SYNC-12, SYNC-13, SYNC-14, SYNC-15, SYNC-16
**Success Criteria** (what must be TRUE):

1. `packages/paths/` and `packages/paths-node/` are restored — `pnpm typecheck` passes for `@vortex/paths` and `@vortex/paths-node`
2. `extensions/gamebryo-ba2-support/` is restored with `skip-on-windows.mjs && _build` named-script form and a CI native-rebuild step modeled on `bsa-support`
3. `src/main/src/downloading/{chunking,chunking.test,downloader.test}.ts` are restored — required by v2.0.0 DownloadManager rewrite
4. Upstream Jest scaffolding (`src/renderer/jest.config.mjs`, `__mocks__/`, `__tests__/`) is NOT restored — divergence documented in `VORTEX-LINUX-MERGE-PLAYBOOK.md`
5. Other dropped non-test files (collections bsdiff-node test, missing `.github/workflows/*.yml` non-fingerprint files, flatpak docs, `AGENTS-DEBUGGING.md`) are restored unless an explicit drop reason is recorded
   **Plans**: 4 plans

- [x] 25-01-PLAN.md — Discovery diff + SHA pin verify + ba2tk catalog source decision (checkpoint to user)
- [x] 25-02-PLAN.md — Commit 1: restore packages/paths + packages/paths-node, lockfile install, typecheck
- [x] 25-03-PLAN.md — Commit 2: restore gamebryo-ba2-support (named-script form), ba2tk catalog, CI rebuild step, verify-addons assertion
- [x] 25-04-PLAN.md — Commits 3+4+5: chunking, missing CI workflows (deny-list provenance), docs + playbook §11 + commit-index row + done-gate + force-with-lease push

### Phase 26: Mod-management hot zone

**Goal**: All Linux fixes that the playbook §6, §7a–d, and the externalChanges/`140a57217` entry protect are present in their correct call sites after resolution.
**Depends on**: Phase 25
**Requirements**: SYNC-04, SYNC-22, SYNC-23, SYNC-27
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits within `src/renderer/src/extensions/mod_management/` (8 files: `InstallManager.ts`, `LinkingDeployment.ts`, `externalChanges.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `index.ts`, `eventHandlers.ts`, `views/ModList.tsx`)
2. Per-file checkpoint: after EACH of the 8 files is resolved and committed, the playbook §6 and §7a–d grep commands re-run clean against `InstallManager.ts` (or remain clean if untouched)
3. `LinkingDeployment.ts` retains the `140a57217` `resolvePathCase(dataPath, relDataPath, dirCache)` calls in the deploy/externalChanges flow — `git grep -n 'resolvePathCase' src/renderer/src/extensions/mod_management/LinkingDeployment.ts src/renderer/src/extensions/mod_management/externalChanges.ts` shows hits
4. `pnpm typecheck` for `@vortex/renderer` passes after the bucket is fully resolved
   **Plans**: 10/10 plans complete

- [x] 26-01-PLAN.md — Author scripts/grep-checkpoint.sh harness encoding playbook §6 + §7a–d + 140a57217 + conflict-marker gates; commit as commit 0
- [x] 26-02-PLAN.md — Resolve views/ModList.tsx (leaf 1/8); typecheck + checkpoint
- [x] 26-03-PLAN.md — Resolve eventHandlers.ts (leaf 2/8); typecheck + checkpoint
- [x] 26-04-PLAN.md — Resolve util/deploy.ts (leaf 3/8); typecheck + checkpoint
- [x] 26-05-PLAN.md — Resolve stagingDirectory.ts (leaf 4/8); typecheck + checkpoint
- [x] 26-06-PLAN.md — Resolve util/externalChanges.ts (5/8); ordinary leaf-first, no pre-snapshot needed (D-26-03a — `140a57217` lives in LinkingDeployment.ts only)
- [x] 26-07-PLAN.md — Resolve LinkingDeployment.ts (6/8); run-time grep gate verifies `resolvePathCase(dataPath, …)` at :523/:742/:799 preserved
- [x] 26-08-PLAN.md — Resolve InstallManager.ts (7/8) — playbook hot zone §6 + §7a–d; full per-file checkpoint
- [x] 26-09-PLAN.md — Resolve index.ts (8/8 barrel); first full checkpoint with conflict-marker gate enabled
- [x] 26-10-PLAN.md — D-26-05 done-gate (5 checks) + force-with-lease push (orchestrator-driven) + ROADMAP/STATE update

### Phase 27: Gamebryo + per-game extensions

**Goal**: All gamebryo, collections, bepinex, and per-game extensions resolve cleanly with playbook §1 (extension build guards), §3 (LOOT casing), and §10 (native binaries) preserved.
**Depends on**: Phase 26
**Requirements**: SYNC-05, SYNC-06, SYNC-17, SYNC-19
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits within `extensions/gamebryo-{plugin-management,savegame-management}/`, `extensions/collections/`, `extensions/modtype-bepinex/`, `extensions/games/game-baldursgate3/`, `extensions/games/game-morrowind/`, `extensions/games/game-witcher3/`
2. Playbook §1 re-grep clean: `grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json` only matches `gamestore-xbox` (skip-on-linux); gamebryo `bsa-support`/`plugin-management`/`archive-support` carry no inline guards
3. Playbook §3 re-grep clean: all four LOOT call sites in `extensions/gamebryo-plugin-management/src/autosort.ts` use `path.basename(pluginList[id].filePath)` — `git grep -n 'pluginName.toLowerCase\|filePath' extensions/gamebryo-plugin-management/src/autosort.ts` confirms
4. Per-game fixes preserved: BG3 divine error handling present in `divineCore.ts`; Morrowind `migrate103` fix present
5. Each touched extension passes its own `pnpm -F <ext> typecheck`
   **Plans**: TBD

### Phase 28: Renderer + main spine

**Goal**: All remaining 47+ source-conflict files (renderer infra, main/preload/shared, nexus_integration, scripts, fingerprints action) resolve to a tree that builds and links cleanly.
**Depends on**: Phase 27
**Requirements**: SYNC-07, SYNC-08, SYNC-09, SYNC-10, SYNC-18, SYNC-20, SYNC-24, SYNC-25, SYNC-26
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits across `src/renderer/`, `src/main/`, `src/preload/`, `src/shared/`, `extensions/nexus_integration/`, `scripts/`, `.github/actions/fingerprints/` (fingerprints picked from upstream side wholesale)
2. Playbook §2 re-grep clean: `src/renderer/webpack.config.cjs` `nodeExternals` allowlist contains `["winapi-bindings"]` on Linux
3. Playbook §4 re-grep clean: `testPathTransfer` in `src/renderer/src/util/transferPath.ts` carries NO `if (platform !== "win32") reject(UnsupportedOperatingSystem)` guard
4. Playbook §8 re-grep clean: `StarterInfo.ts` retains `isPathPrefix()`, `shouldRunWithProton()`, and `runToolWithProton()` with hide-instead-of-quit `onSpawned`
5. Playbook §9 re-grep clean: `Steam.ts` `resolveSteamPaths()` calls `findAllLinuxSteamPaths()` and reads `libraryfolders.vdf` from every Steam root
6. Playbook §10 honoured: gamebryo `dist/` cross-compiled native binaries are handled by CI native-rebuild — no stray conflict-marker .so/.node files committed on this branch
   **Plans**: TBD

### Phase 29: Build verification

**Goal**: Every check that the milestone definition-of-done depends on passes locally and in CI; AppImage + .deb boot and pass a 5-minute manual smoke test.
**Depends on**: Phase 28
**Requirements**: SYNC-01, SYNC-21, SYNC-28, SYNC-29, SYNC-30, SYNC-31, SYNC-32, SYNC-33, SYNC-34
**Success Criteria** (what must be TRUE):

1. Final zero-conflict check: `git grep '^<<<<<<< '` returns zero hits across the entire `sync/upstream-v2.0.0` working tree (SYNC-01)
2. Full toolchain green: `pnpm install`, `pnpm run typecheck`, `pnpm run build`, `pnpm run build:extensions`, and `pnpm run test` (Vitest) all succeed; `pnpm run lint:ci` only surfaces pre-existing warnings
3. Playbook §5 re-grep clean: `ls src/main/build/bundledPlugins | wc -l` returns ~132 entries after `pnpm run build:extensions`
4. AppImage and .deb produced via `release-linux.yml` boot from a clean install; `pnpm run start` boots from source on Linux
5. 5-minute manual smoke passes: detect a Steam game, install one mod, deploy via hardlink, launch via Proton — no regressions vs. shipped v2.0.0-linux behaviour
   **Plans**: TBD

### Phase 30: Land + tag

**Goal**: Master is fast-forwarded onto the resolved merge, tagged, mirrored to `linux-port`, and the merge experience is captured in the playbook for the next sync.
**Depends on**: Phase 29
**Requirements**: SYNC-35, SYNC-36, SYNC-37, SYNC-38, SYNC-39
**Success Criteria** (what must be TRUE):

1. Windows CI (`main.yml` windows-latest matrix) is green on the resolved merge commit
2. PR #4 (`atabisz/Vortex#4`) is fast-forward merged into `master` and closed (merged)
3. Tag `v2.0.0-linux-rebased` exists on the merge commit and is pushed to `origin`
4. The Linux subset of the merge is cherry-picked onto `linux-port` per existing branch policy (excludes `.planning/`, fork-only CI, fingerprint disablement) — `linux-port` history stays Linux-only
5. `VORTEX-LINUX-MERGE-PLAYBOOK.md` is updated with any new gotchas surfaced during resolution; the commit-index table reflects the new master and linux-port hashes for the affected fixes
   **Plans**: TBD

## Backlog

### Phase 999.1: Manual UAT — ELEV-05/ELEV-06 Desktop Linux + Steam Deck Elevation (BACKLOG)

**Goal:** Manually validate Phase 12 elevation UX on real hardware — desktop Linux ELEV-05 checklist (hardlinks, permission repair, session token re-use, fresh session re-prompt) and Steam Deck Game Mode ELEV-06 notification UX. Also confirm Windows CI green via `main.yml` windows-latest matrix push.
**Context:** Symlink deployment item skipped (not exposed in current UI). Automated Vitest coverage exists for ELEV-06 notifier; this validates end-to-end Electron rendering. Phase 11 polkit rule prerequisite for ELEV-05.
**Requirements:** ELEV-05, ELEV-06, ONBRD-04
**Plans:** 2/2 plans complete

ONBRD-04 UAT checklist (code-complete Phase 21; hardware UAT pending):

1. Launch Vortex on Linux with Steam and Skyrim SE installed via Proton
2. Activate Skyrim SE as the managed game in Vortex
3. Confirm hardlink_activator is auto-selected as the deployment method (check Settings -> Mods -> Deployment Method)
4. Download a mod via NXM link (or use manual install with a test archive)
5. Install the mod through the FOMOD wizard (if applicable) or simple install
6. Confirm the mod appears in the Mods list
7. Click Deploy to deploy the mod via hardlink to the Skyrim SE Data directory
8. Verify deployed files appear in the game's Data/ directory (e.g., `~/.steam/steam/steamapps/common/Skyrim Special Edition/Data/`)
9. Enable the mod in the load order (if applicable)
10. Launch Skyrim SE via Vortex and confirm the game starts without errors

## Progress

| Phase                                                     | Milestone | Plans Complete | Status      | Completed  |
| --------------------------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Runtime Environment                                    | v1.0      | 1/1            | Complete    | 2026-03-30 |
| 2. winapi-bindings Shim                                   | v1.0      | 2/2            | Complete    | 2026-03-30 |
| 3. Native Addon Compilation                               | v1.0      | 3/3            | Complete    | 2026-03-30 |
| 4. FOMOD Installer Integration                            | v1.0      | 2/2            | Complete    | 2026-03-31 |
| 5. IPC and Elevation Audit                                | v1.0      | 2/2            | Complete    | 2026-03-31 |
| 6. Steam/Proton Detection                                 | v2.0      | 3/3            | Complete    | 2026-04-01 |
| 7. Linux Packaging                                        | v2.0      | 2/2            | Complete    | 2026-04-01 |
| 8. NXM Protocol Handler                                   | v2.0      | 2/2            | Complete    | 2026-04-01 |
| 9. Native Addon Fix + Elevation Foundation                | v3.0      | 2/2            | Complete    | 2026-04-01 |
| 10. Save UI Validation + SteamOS + Polkit                 | v3.0      | 2/2            | Complete    | 2026-04-01 |
| 11. Persistent Elevation Token                            | v4.0      | 1/1            | Complete    | 2026-04-07 |
| 12. Elevation End-to-End Validation + Steam Deck Error UX | v4.0      | 1/1            | Complete    | 2026-04-07 |
| 13. Save Transfer                                         | v4.0      | 1/1            | Complete    | 2026-04-07 |
| 14. Linux Case-Folding fs Wrapper                         | v4.0      | 2/2            | Complete    | 2026-04-07 |
| 15. fomod-installer Linux Fixes + Vortex Cleanup          | v5.0      | 3/3            | Complete    | 2026-04-09 |
| 16. chattr+F Filesystem Layer                             | v6.0      | 1/1            | Complete    | 2026-04-15 |
| 17. Upstream Rebase CI Workflow                           | v6.0      | 1/1            | Complete    | 2026-04-15 |
| 18. First-Run Dashboard Foundation                        | v7.0      | 2/2            | Complete    | 2026-04-16 |
| 19. Staging Directory Wiring                              | v7.0      | 3/3            | Complete    | 2026-04-16 |
| 20. Windows String Purge                                  | v7.0      | 2/2            | Complete    | 2026-04-16 |
| 21. Mod Install Round-Trip Validation                     | v7.0      | 2/2            | Complete    | 2026-04-16 |
| 22. Steam Deck Layout                                     | v7.0      | 1/1            | Complete    | 2026-04-17 |
| 23. Help Links                                            | v7.0      | 2/2            | Complete    | 2026-04-17 |
| 24. Config bucket                                         | v8.0      | 8/8            | Complete    | 2026-05-15 |
| 25. Restore dropped scaffolding                           | v8.0      | 4/4            | Complete    | 2026-05-15 |
| 26. Mod-management hot zone                               | v8.0      | 10/10          | Complete    | 2026-05-15 |
| 27. Gamebryo + per-game extensions                        | v8.0      | 0/0            | Not started | -          |
| 28. Renderer + main spine                                 | v8.0      | 0/0            | Not started | -          |
| 29. Build verification                                    | v8.0      | 0/0            | Not started | -          |
| 30. Land + tag                                            | v8.0      | 0/0            | Not started | -          |
