# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Elevation Hardening + Save Transfer** — Phases 11–14 (shipped 2026-04-07) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 fomod-installer Linux Fixes** — Phase 15 (shipped 2026-04-09) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Infrastructure** — Phases 16–17 (shipped 2026-04-15) — [archive](milestones/v6.0-ROADMAP.md)
- ✅ **v7.0 First-Run Onboarding Wizard** — Phases 18–23 (shipped 2026-04-17) — [archive](milestones/v7.0-ROADMAP.md)
- ✅ **v8.0 Upstream v2.0.0 Sync** — Phases 24–30 (shipped 2026-05-22) — [scope](milestones/v8.0-SCOPE-PROPOSAL.md)
- 🚧 **v8.1 Upstream v2.0.1 Sync** — Phases 31–37 (in progress; Phases 31–34 complete; 4/7 phases done)

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

<details>
<summary>✅ v8.0 Upstream v2.0.0 Sync (Phases 24–30) — SHIPPED 2026-05-22</summary>

- [x] Phase 24: Config bucket (config + lockfile parses; `pnpm install` works) — completed 2026-05-22
- [x] Phase 25: Restore dropped scaffolding (`packages/paths`, `packages/paths-node`, `gamebryo-ba2-support`, missing CI workflows) — completed 2026-05-22
- [x] Phase 26: Mod-management hot zone (`InstallManager`, `LinkingDeployment`, `externalChanges`, mod_management) — completed 2026-05-22
- [x] Phase 27: Gamebryo + per-game extensions (gamebryo-{plugin,savegame}-mgmt, collections, BG3, Morrowind, Witcher 3) — completed 2026-05-22
- [x] Phase 28: Renderer + main spine (ExtensionManager, controls/Table, Application, cli, errorReporting, store) — completed 2026-05-22
- [x] Phase 29: Build verification (typecheck/lint/test/build all green; RC `v2.0.0-linux-rebased-rc1`) — completed 2026-05-22
- [x] Phase 30: Land + tag (FF-merge PR #4; tag `v2.0.0-linux-rebased`; cherry-pick to `linux-port`) — completed 2026-05-22

</details>

## Active Milestone — v8.1 Upstream v2.0.1 Sync

**Milestone goal:** Fold upstream v2.0.1 (PR #5) into the fork on top of `v2.0.0-linux-rebased`. Every Linux fix preserved. `pnpm run build` and `pnpm run test` pass on master with the merged tree. Closing artifact is FF-merge of `sync/upstream-v2.0.1` tagged `v2.0.1-linux-rebased`.

**Branch:** `v8.1/config-bucket` (Phase 31 work; pushed to fork). Subsequent phases stack on top of this branch until the rebase + FF-merge in Phase 36.

### Phase 31: Config bucket (v2.0.1)

**Goal:** Workspace + lockfile + root configs parse; `pnpm install --frozen-lockfile` exits 0.
**Requirements:** SYNC-31a
**Status:** ✅ Complete 2026-05-22 (8/8 plans; pushed to fork as `v8.1/config-bucket`, 13 commits ahead of `fork/master`)
**Success criteria:**

1. `pnpm-workspace.yaml` parses; `@electron/rebuild`, `leveldown`, `levelup` retained per D-31-07/09
2. `pnpm-lock.yaml` regenerated; `pnpm install --frozen-lockfile` exits 0
3. `package.json`, `vitest.config.ts`, `prepare-dist-package.mjs` resolved keep-HEAD
4. Branch `v8.1/config-bucket` pushed to fork

### Phase 32: Mod-management hot zone (v2.0.1)

**Goal:** Resolve `InstallManager.ts`, `LinkingDeployment.ts`, `DownloadManager.ts`, `externalChanges.ts`, `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx` with playbook §6/§7/externalChanges sites preserved.
**Requirements:** SYNC-32a
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.0-phases/26-mod-management-hot-zone (v8.0 precedent)
**Success criteria:**

1. Every playbook §6/§7/externalChanges call site present and correctly placed in resolved files
2. `pnpm typecheck` clean for `@vortex/renderer` and `@vortex/main`
3. Atomic commit per resolved file with decision-anchored stance

**Plans:** 7/6 plans complete

Plans:

**Wave 1**

- [x] 32-01-PLAN.md — Wave 0: extract v8.0 harness, pre-flight verification, baseline capture, no-new-sites finding
- [x] 32-02-PLAN.md — Wave 1 leaf tier: 7 files (NotificationAggregator, util/{VersionFilter,removeMods,activationStore,externalChanges,deploy}, stagingDirectory)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 32-03-PLAN.md — Wave 2 mid tier: 5 files (modMerging, views/{DeactivationButton,Settings,ModList}, eventHandlers)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 32-04-PLAN.md — Wave 3 playbook-heavy: LinkingDeployment.ts (8 regions, fork-wins @212) + InstallManager.ts (40 regions, 6 dangerous fork-wins)

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 32-05-PLAN.md — Wave 4 barrel: index.ts (18 regions, smaller-diff)

**Wave 5** _(blocked on Wave 4 completion)_

- [x] 32-06-PLAN.md — Wave 5 verification: final harness (no skip), commit-body audit, VALIDATION sign-off, PHASE-SUMMARY

**Cross-cutting constraints:**

- Each file resolution is its own SSH-signed commit per D-32-08

### Phase 33: Gamebryo + per-game extensions (v2.0.1)

**Status:** ✅ Complete 2026-05-23 (10/10 plans; 193 SSH-signed commits 3b30563d9..HEAD on `v8.1/config-bucket`; harness 11/11 GREEN skip-mode; full-mode 12/12 GREEN since Wave E)
**Goal:** Resolve gamebryo-{plugin,savegame}-mgmt, collections, modtype-bepinex, BG3, Morrowind, Witcher 3 with playbook §1 (guards), §3 (LOOT casing), §10 (native binaries) preserved; re-add catalog entries pnpm dropped in Phase 31.
**Requirements:** SYNC-33a ✅, SYNC-33b ✅ (resolved as full deferral per D-33-13: 3/4 packages replaced by pure-TS workspace rewrites; 1/4 already satisfied via `workspace:*`)
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.0-phases/27-gamebryo-and-per-game-extensions
**Result:** 182 atomic file resolves + 1 harness checkpoint + 8 wave SUMMARYs + 2 D1 carryover fixes + 0 catalog (deferred); per-extension typecheck/build clean across 85 touched paths (12 Route-1 typecheck + 71 Route-2 build + 2 Route-3 node --check); 0 markers remaining in `extensions/`.
**Success criteria:**

1. ✅ Every playbook §1 (guards), §3 (LOOT casing), §10 (native binaries) site preserved
2. ✅ Each extension passes its own typecheck and build (85/85 paths clean per Wave 9 sweep)
3. ✅ Catalog entries: SYNC-33b satisfied via D-33-13 partial-application clause — pre-audit confirmed all 4 candidate packages either replaced by pure-TS workspace rewrites (esptk, gamebryo-savegame, native-errors) or already satisfied via `workspace:*` (exe-version)

**Plans:** 10/10 complete

Plans:

- [x] 33-00-harness-extension-PLAN.md — Wave 0: extend harness from 7 to 12 gates (1 commit; full-mode marker gate flipped GREEN at b83278732)
- [x] 33-01-wave-A-gamebryo-core-PLAN.md — Wave A gamebryo core (4 ext, 11 files, 11 commits)
- [x] 33-02-wave-B-bepinex-PLAN.md — Wave B modtype-bepinex (1 ext, 3 files, 3 commits)
- [x] 33-03-wave-C-collections-PLAN.md — Wave C collections (1 ext, 12 files, 12 commits)
- [x] 33-04-wave-D1-heavy-pergame-PLAN.md — Wave D1 heavy per-game (4 ext, 57 files, 57 commits; gate-10 BG3 active)
- [x] 33-05-wave-D2-medium-pergame-PLAN.md — Wave D2 medium per-game (7 ext, 28 files, 28 commits; gate-11 Morrowind active)
- [x] 33-06-wave-D3-light-pergame-PLAN.md — Wave D3 light per-game (60 ext, 60 files, 60 commits)
- [x] 33-07-wave-E-build-scaffolding-PLAN.md — Wave E build scaffolding (7 ext/scripts, 12 files, 12 commits; copy-extension.mjs API + copy-native.mjs Linux-rebased dist-fallback preserved)
- [x] 33-08-wave-F-catalog-readd-PLAN.md — Wave F catalog re-add (full deferral per D-33-13 + bg3 D1 parse fix-up; 0 catalog commits, 1 fix commit)
- [x] 33-09-done-gate-PLAN.md — Wave 9 6-criterion done gate (this entry; STATE+ROADMAP commit + master closeout SUMMARY)

### Phase 34: Renderer + main spine (v2.0.1)

**Status:** ✅ Complete 2026-05-23 (10/10 plans; 131 SSH-signed commits in v8.1/config-bucket~131..HEAD; harness 13/13 GREEN skip-mode; D-34-14 7-criterion done-gate GREEN with documented renderer-bucket scope adjustment — 9 errors all in deferred `extensions/download_management/`, filtered=0)
**Goal:** Resolve ExtensionManager, controls/Table, Application, cli, errorReporting, autoupdater, TrayIcon, store/{DuckDBSingleton,LevelPersist}, preload/index, shared/{errors,errors.test,telemetry/spans}, nexus_integration; document Jest `__mocks__/` decision (R2 carry-forward from 31-01).
**Requirements:** SYNC-34a ✅, SYNC-34b ✅ (R2 DROP via `git rm -r src/renderer/src/__mocks__/` — 23 dead Jest mocks removed in Wave H per D-34-15)
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.0-phases/28-renderer-main-spine
**Result:** 117 file resolves + 1 R2 DROP + 1 dist regen (ncc 0.38.4) + 9 wave SUMMARYs + 9 chore(state) markers + 2 closeout docs (STATE/ROADMAP + master SUMMARY); per-bucket typecheck clean for shared/preload/main/fingerprints/e2e (0 errors); renderer=9 errors all confined to `extensions/download_management/` (FileAssembler + SpeedCalculator missing modules + IDownload signature/type drift) — pre-existing v2.0.1 fallout deferred to Phase 35.
**Success criteria:**

1. ✅ Process-boot path resolved (Application, cli, errorReporting, autoupdater) with Linux platform guards intact
2. ✅ Jest `__mocks__/` decision documented (D-34-13 DROP; Wave H executed 2026-05-23)
3. ✅ `pnpm typecheck` clean across shared/preload/main/fingerprints/e2e workspaces; renderer-bucket clean modulo deferred `download_management/` scope (Phase 35)

**Plans:** 10/10 complete

Plans:

- [x] 34-00-PLAN.md — Wave 0: copy Phase 33 harness, add gate 13 (single-host `getIPCPath`)
- [x] 34-01-PLAN.md — Wave A shared (5 files: shared/types/{errors,state}, shared/errors{,test}, telemetry/spans)
- [x] 34-02-PLAN.md — Wave B preload (1 file: preload/src/index.ts)
- [x] 34-03-PLAN.md — Wave C main (9 files: Application, cli, errorReporting, autoupdater, TrayIcon, main, store/{LevelPersist,ReduxPersistorIPC,SubPersistor})
- [x] 34-04-PLAN.md — Wave D renderer leaves (20 files: contexts, hooks, reducers, store, telemetry, ui, util)
- [x] 34-05-PLAN.md — Wave E renderer extensions (30 files: nexus_integration heavy + health_check + others)
- [x] 34-06-PLAN.md — Wave F renderer views/pages + heaviest (18 files; D-34-17 trigger evaluated as branch (a) HEAD-empty)
- [x] 34-07-PLAN.md — Wave G repo-wide leaves (34 files: fingerprints + e2e + top-level docs + scripts; dist regen via ncc 0.38.4)
- [x] 34-08-PLAN.md — Wave H R2 DROP (`git rm -r src/renderer/src/__mocks__/`; SYNC-34b → [x])
- [x] 34-09-PLAN.md — Wave 9 7-criterion done-gate per D-34-14 (this entry; STATE+ROADMAP commit + master closeout SUMMARY)

### Phase 35: Build verification (v2.0.1)

**Goal:** typecheck/lint/test/build all green; reconcile orphan `electron-builder.config.json` (R3 carry-forward from 31-01).
**Requirements:** SYNC-35a, SYNC-35b, SYNC-35c, SYNC-35d, SYNC-35e
**Canonical refs:** .planning/milestones/v8.0-phases/29-build-verification
**Success criteria:**

1. `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build` all exit 0
2. Lint baseline-parity with `fork/master` (no new errors)
3. Orphan `electron-builder.config.json` removed or reconciled

### Phase 36: Land + tag + cherry-pick (v2.0.1)

**Goal:** Rebase + FF-merge PR #5; tag `v2.0.1-linux-rebased` SSH-signed; cherry-pick Linux-only commits to `linux-port`; release-linux.yml produces AppImage + deb.
**Requirements:** SYNC-36a, SYNC-36b, SYNC-36c, SYNC-36d
**Canonical refs:** .planning/milestones/v8.0-phases/30-land-tag (v8.0 D-30-01/02/03 playbook)
**Success criteria:**

1. `gh pr merge 5 --merge=fast-forward` succeeds
2. SSH-signed `v2.0.1-linux-rebased` tag pushed to origin + fork
3. `release-linux.yml` produces AppImage + .deb with SHA256 manifest
4. `linux-port` branch updated with cherry-picked Linux commits

### Phase 37: Carry-forward UAT (v2.0.1)

**Goal:** Document carry-forward of SYNC-33-C, SYNC-34, SYNC-39 from v8.0; update `VORTEX-LINUX-MERGE-PLAYBOOK.md` with new entries discovered during v8.1 conflict resolution.
**Requirements:** SYNC-37a, SYNC-37b
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md
**Success criteria:**

1. v8.0 carry-forward items (SYNC-33-C, SYNC-34, SYNC-39) closed or moved to Phase 999.1 backlog
2. Playbook updated with new conflict-resolution patterns from v8.1

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

| Phase                                                     | Milestone | Plans Complete | Status   | Completed  |
| --------------------------------------------------------- | --------- | -------------- | -------- | ---------- |
| 1. Runtime Environment                                    | v1.0      | 1/1            | Complete | 2026-03-30 |
| 2. winapi-bindings Shim                                   | v1.0      | 2/2            | Complete | 2026-03-30 |
| 3. Native Addon Compilation                               | v1.0      | 3/3            | Complete | 2026-03-30 |
| 4. FOMOD Installer Integration                            | v1.0      | 2/2            | Complete | 2026-03-31 |
| 5. IPC and Elevation Audit                                | v1.0      | 2/2            | Complete | 2026-03-31 |
| 6. Steam/Proton Detection                                 | v2.0      | 3/3            | Complete | 2026-04-01 |
| 7. Linux Packaging                                        | v2.0      | 2/2            | Complete | 2026-04-01 |
| 8. NXM Protocol Handler                                   | v2.0      | 2/2            | Complete | 2026-04-01 |
| 9. Native Addon Fix + Elevation Foundation                | v3.0      | 2/2            | Complete | 2026-04-01 |
| 10. Save UI Validation + SteamOS + Polkit                 | v3.0      | 2/2            | Complete | 2026-04-01 |
| 11. Persistent Elevation Token                            | v4.0      | 1/1            | Complete | 2026-04-07 |
| 12. Elevation End-to-End Validation + Steam Deck Error UX | v4.0      | 1/1            | Complete | 2026-04-07 |
| 13. Save Transfer                                         | v4.0      | 1/1            | Complete | 2026-04-07 |
| 14. Linux Case-Folding fs Wrapper                         | v4.0      | 2/2            | Complete | 2026-04-07 |
| 15. fomod-installer Linux Fixes + Vortex Cleanup          | v5.0      | 3/3            | Complete | 2026-04-09 |
| 16. chattr+F Filesystem Layer                             | v6.0      | 1/1            | Complete | 2026-04-15 |
| 17. Upstream Rebase CI Workflow                           | v6.0      | 1/1            | Complete | 2026-04-15 |
| 18. First-Run Dashboard Foundation                        | v7.0      | 2/2            | Complete | 2026-04-16 |
| 19. Staging Directory Wiring                              | v7.0      | 3/3            | Complete | 2026-04-16 |
| 20. Windows String Purge                                  | v7.0      | 2/2            | Complete | 2026-04-16 |
| 21. Mod Install Round-Trip Validation                     | v7.0      | 2/2            | Complete | 2026-04-16 |
| 22. Steam Deck Layout                                     | v7.0      | 1/1            | Complete | 2026-04-17 |
| 23. Help Links                                            | v7.0      | 2/2            | Complete | 2026-04-17 |
| 24. Config bucket                                         | v8.0      | —              | Complete | 2026-05-22 |
| 25. Restore dropped scaffolding                           | v8.0      | —              | Complete | 2026-05-22 |
| 26. Mod-management hot zone                               | v8.0      | —              | Complete | 2026-05-22 |
| 27. Gamebryo + per-game extensions                        | v8.0      | —              | Complete | 2026-05-22 |
| 28. Renderer + main spine                                 | v8.0      | —              | Complete | 2026-05-22 |
| 29. Build verification                                    | v8.0      | —              | Complete | 2026-05-22 |
| 30. Land + tag (v2.0.0-linux-rebased)                     | v8.0      | —              | Complete | 2026-05-22 |
| 31. Config bucket (v2.0.1)                                | v8.1      | 8/8            | Complete | 2026-05-22 |
| 32. Mod-management hot zone (v2.0.1)                      | v8.1      | 7/6            | Complete | 2026-05-22 |
| 33. Gamebryo + per-game extensions (v2.0.1)               | v8.1      | 10/10          | Complete | 2026-05-23 |
| 34. Renderer + main spine (v2.0.1)                        | v8.1      | 10/10          | Complete | 2026-05-23 |
| 35. Build verification (v2.0.1)                           | v8.1      | TBD            | Pending  | —          |
| 36. Land + tag (v2.0.1-linux-rebased)                     | v8.1      | TBD            | Pending  | —          |
| 37. Carry-forward UAT (v2.0.1)                            | v8.1      | TBD            | Pending  | —          |
