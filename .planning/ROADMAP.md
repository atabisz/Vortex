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
- ✅ **v8.1 Upstream v2.0.1 Sync** — Phases 31–37 (shipped 2026-05-23; tag `v2.0.1-linux-rebased`)
- ⏳ **v8.2 Upstream v2.0.2 Sync** — Phases 38–44 (in planning; source `fork/sync/upstream-v2.0.2` PR #6)

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

<details>
<summary>✅ v8.1 Upstream v2.0.1 Sync (Phases 31–37) — SHIPPED 2026-05-23</summary>

- [x] Phase 31: Config bucket (workspace + lockfile + root configs parse) — completed 2026-05-22
- [x] Phase 32: Mod-management hot zone (`InstallManager`, `LinkingDeployment`, `externalChanges`, mod_management) — completed 2026-05-22
- [x] Phase 33: Gamebryo + per-game extensions (gamebryo-{plugin,savegame}-mgmt, collections, BG3, Morrowind, Witcher 3) — completed 2026-05-23
- [x] Phase 34: Renderer + main spine (ExtensionManager, controls/Table, Application, cli, errorReporting, store) — completed 2026-05-23
- [x] Phase 35: Build verification (typecheck/lint/test/build all green; `packages/paths{,-node}/src/` master-restore contingency-fix) — completed 2026-05-23
- [x] Phase 36: Land + tag (FF-merge PR #5; tag `v2.0.1-linux-rebased`; cherry-pick to `linux-port`) — completed 2026-05-23
- [x] Phase 37: Carry-forward UAT (canonical AppImage + .deb + Skyrim walkthrough; playbook v8.1 deltas) — completed 2026-05-23

Detail archived: [milestones/v8.1-ROADMAP.md](milestones/v8.1-ROADMAP.md)

</details>

## Active Milestone — v8.2 Upstream v2.0.2 Sync

**Milestone goal:** Fold upstream v2.0.2 (PR #6 `sync/upstream-v2.0.2`, 41 upstream commits) into the fork on top of `v2.0.1-linux-rebased`. Every Linux fix preserved. `pnpm run build` and `pnpm run test` pass on master with the merged tree. Closing artifact is FF-merge of `sync/upstream-v2.0.2` tagged `v2.0.2-linux-rebased`.

**Branch:** `v8.2/sync-upstream-v2.0.2` to be cut from master `855fb3e1a`. Subsequent phases stack on top of this branch until the rebase + FF-merge in Phase 43.

**Conflict surface (probed 2026-05-23):** 108 source files / ~234 regions across the v8.0/v8.1 conflict buckets — smaller than v8.1's 109/365. Source of truth: `fork/sync/upstream-v2.0.2` HEAD `314ca807c`. Conflict tree: `3c032384cca696a9f578f392a6807ba3b0681675`.

### Phase 38: Config bucket (v2.0.2)

**Goal:** Workspace + lockfile + root configs parse; `pnpm install --frozen-lockfile` exits 0; cut branch `v8.2/sync-upstream-v2.0.2` from master.
**Requirements:** SYNC-38a, SYNC-38b
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.1-phases/31-config-bucket (v8.1 precedent)

### Phase 39: Mod-management + download-management hot zone (v2.0.2)

**Goal:** Resolve bucket D — `InstallManager.ts`, `LinkingDeployment.ts`, `externalChanges.ts`, `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx`, plus `download_management/` modules currently in fork — with playbook §6/§7/externalChanges sites preserved.
**Requirements:** SYNC-39a, SYNC-39b
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.1-phases/32-mod-management-hot-zone

### Phase 40: Gamebryo + per-game extensions (v2.0.2)

**Goal:** Resolve buckets E + F — gamebryo-{plugin,savegame,test-helpers}-mgmt, modtype-bepinex, gamebryo-ba2-support, collections, BG3, Morrowind, Witcher 3 (plus any per-game conflicts) — with playbook §1/§3/§10 preserved.
**Requirements:** SYNC-40a, SYNC-40b
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.1-phases/33-gamebryo

### Phase 41: Renderer + main spine + nexus + e2e (v2.0.2)

**Goal:** Resolve buckets G + H + I + J — ExtensionManager, controls/Table, Application, cli, errorReporting, autoupdater, TrayIcon, store/{DuckDBSingleton,LevelPersist}, preload/index, shared/{errors,errors.test,telemetry/spans}, nexus_integration, e2e — with bluebird-trap audit clean across all bluebird-importing async fns.
**Requirements:** SYNC-41a, SYNC-41b, SYNC-41c
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.1-phases/34-renderer-main-spine

### Phase 42: Build verification (v2.0.2)

**Goal:** typecheck/lint/test/build all green; bundledPlugins ≥ 130 floor invariant; `packages/paths{,-node}/src/` master-restore contingency-fix invoked if upstream drops them again.
**Requirements:** SYNC-42a, SYNC-42b, SYNC-42c, SYNC-42d, SYNC-42e
**Canonical refs:** .planning/milestones/v8.1-phases/35-build-verification

### Phase 43: Land + tag + cherry-pick (v2.0.2)

**Goal:** Rebase + FF-merge PR #6; SSH-signed tag `v2.0.2-linux-rebased`; cherry-pick Linux-only commits to `linux-port` via `--no-merges` filter; release-linux.yml AppImage + .deb with SHA256 manifest.
**Requirements:** SYNC-43a, SYNC-43b, SYNC-43c, SYNC-43d
**Canonical refs:** .planning/milestones/v8.1-phases/36-land-tag (v8.1 D-30-01/02/03 + cherry-pick `--no-merges` filter)

### Phase 44: Carry-forward UAT (v2.0.2)

**Goal:** Canonical AppImage + .deb local-boot + Skyrim SE walkthrough on `linux-port` HEAD; `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with any new playbook entries discovered during v8.2 conflict resolution.
**Requirements:** SYNC-44a, SYNC-44b
**Canonical refs:** VORTEX-LINUX-MERGE-PLAYBOOK.md, .planning/milestones/v8.1-phases/37-carry-forward-uat

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
| 35. Build verification (v2.0.1)                           | v8.1      | 8/8            | Complete | 2026-05-23 |
| 36. Land + tag (v2.0.1-linux-rebased)                     | v8.1      | 4/4            | Complete | 2026-05-23 |
| 37. Carry-forward UAT (v2.0.1)                            | v8.1      | 4/4            | Complete | 2026-05-23 |
| 38. Config bucket (v2.0.2)                                | v8.2      | —              | Pending  | —          |
| 39. Mod-management + download-management (v2.0.2)         | v8.2      | —              | Pending  | —          |
| 40. Gamebryo + per-game extensions (v2.0.2)               | v8.2      | —              | Pending  | —          |
| 41. Renderer + main spine + nexus + e2e (v2.0.2)          | v8.2      | —              | Pending  | —          |
| 42. Build verification (v2.0.2)                           | v8.2      | —              | Pending  | —          |
| 43. Land + tag (v2.0.2-linux-rebased)                     | v8.2      | —              | Pending  | —          |
| 44. Carry-forward UAT (v2.0.2)                            | v8.2      | —              | Pending  | —          |
