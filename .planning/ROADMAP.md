# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Elevation Hardening + Save Transfer** — Phases 11–14 (shipped 2026-04-07) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 fomod-installer Linux Fixes** — Phase 15 (shipped 2026-04-09) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Infrastructure** — Phases 16–17 (shipped 2026-04-15) — [archive](milestones/v6.0-ROADMAP.md)
- ✅ **v7.0 First-Run Onboarding Wizard** — Phases 18–23 (shipped 2026-04-17) — [archive](milestones/v7.0-ROADMAP.md)
- ✅ **v8.0 Upstream v2.0.0 Sync** — Phases 24–30 (shipped 2026-05-22) — [archive](milestones/v8.0-ROADMAP.md)
- ⬜ **v8.1 Upstream v2.0.1 Sync** — Phases 31–37 (planning 2026-05-22)

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

- [x] Phase 24: Config bucket (8/8 plans) — completed 2026-05-15
- [x] Phase 25: Restore dropped scaffolding (4/4 plans) — completed 2026-05-15
- [x] Phase 26: Mod-management hot zone (10/10 plans) — completed 2026-05-15
- [x] Phase 27: Gamebryo + per-game extensions (9/9 plans) — completed 2026-05-21
- [x] Phase 28: Renderer + main spine (12/12 plans) — completed 2026-05-21
- [x] Phase 29: Build verification (11/11 plans) — completed 2026-05-22
- [x] Phase 30: Land + tag (9/9 plans) — completed 2026-05-22

Full phase details: [v8.0-ROADMAP.md](milestones/v8.0-ROADMAP.md). Tag: `v2.0.0-linux-rebased` at `f570149ea`. Linux-port HEAD: `6a28945d1`.

</details>

### v8.1 Upstream v2.0.1 Sync (Phases 31–37) — PLANNING

- [ ] **Phase 31: Config bucket** — first-resolve so the tree parses; `pnpm install` succeeds
- [ ] **Phase 32: Mod-management hot zone** — 7 files in `mod_management/` with playbook §6/§7a–d re-grep checkpoint per file
- [ ] **Phase 33: Gamebryo + per-game extensions** — gamebryo plugin/savegame, collections, bepinex, BG3/Morrowind/Witcher 3 with §1/§3 preserved
- [ ] **Phase 34: Renderer + main spine** — renderer infra, main/preload/shared, nexus_integration, fingerprints; playbook §2/§4/§8/§9 + v6.0 fs casefold layer preserved
- [ ] **Phase 35: Build verification** — zero conflict markers, typecheck/build/test green, AppImage + .deb produced, 5-min smoke
- [ ] **Phase 36: Land + tag + cherry-pick** — FF-merge PR #5, tag `v2.0.1-linux-rebased`, cherry-pick to `linux-port`, playbook post-mortem
- [ ] **Phase 37: Carry-forward UAT** — close v8.0 deferred items (SYNC-33-C local-boot evidence, SYNC-34 Skyrim SE walkthrough, SYNC-39 linux-port baseline drift)

## Phase Details

### Phase 31: Config bucket

**Goal**: Tree parses and `pnpm install` succeeds — unblocks every downstream phase.
**Depends on**: Nothing (first v8.1 phase; sits on top of v8.0 baseline at `b241b56c5`)
**Requirements**: SYNC-2.0.1-02, SYNC-2.0.1-03
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits within Bucket A files (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `eslint.config.mjs` family, `prepare-dist-package.mjs`, `tsconfig*.json`, `.vscode/extensions.json`, `docker/windows/Dockerfile`)
2. `pnpm install` succeeds on `sync/upstream-v2.0.1` and produces a regenerated `pnpm-lock.yaml`
3. `pnpm install --frozen-lockfile` succeeds on the resulting branch — committed lockfile is consistent
4. The IDE/TypeScript server loads the project tree without parser errors and resolves all workspace packages

**Plans**: TBD (target ~6–8 plans, mirroring v8.0 Phase 24)

### Phase 32: Mod-management hot zone

**Goal**: All Linux fixes that the playbook §6, §7a–d, and the `LinkingDeployment.ts` `140a57217` entry protect are present in their correct call sites after resolution of the v2.0.1 conflict set.
**Depends on**: Phase 31
**Requirements**: SYNC-2.0.1-04, SYNC-2.0.1-16, SYNC-2.0.1-17, SYNC-2.0.1-21
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits within `src/renderer/src/extensions/mod_management/` (the v2.0.1 hot-zone file set: `InstallManager.ts`, `LinkingDeployment.ts`, `externalChanges.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `index.ts`, `eventHandlers.ts`, `views/ModList.tsx`)
2. Per-file checkpoint: after EACH hot-zone file is resolved and committed, `scripts/grep-checkpoint.sh` (Phase 26 harness, reused) re-runs clean against `InstallManager.ts` and the bucket
3. Playbook §6 re-grep clean: `stagingDirHasFiles` import + call present in `InstallManager.ts:doDownload`; sibling `util/stagingIntegrity.ts` exists
4. Playbook §7a–d re-grep clean in `InstallManager.ts`: `normalizeBackslashPaths` + `mergeCaseConflictingDirs` imports + calls, `replaceAll("\\", "/")` on copy source AND destination, `resolvePathCase(tempPath, source, caseCache)` in `extractArchive`
5. `LinkingDeployment.ts` retains the `140a57217` `resolvePathCase(dataPath, relDataPath, dirCache)` calls in the deploy/externalChanges flow — `git grep -n 'resolvePathCase' src/renderer/src/extensions/mod_management/LinkingDeployment.ts` shows hits
6. `pnpm typecheck` for `@vortex/renderer` passes after the bucket is fully resolved

**Plans**: TBD (target ~8–10 plans, mirroring v8.0 Phase 26)

### Phase 33: Gamebryo + per-game extensions

**Goal**: All gamebryo, collections, bepinex, and per-game extension conflicts in v2.0.1 resolve cleanly with playbook §1 (extension build guards), §3 (LOOT casing), and §10 (native binaries) preserved.
**Depends on**: Phase 32
**Requirements**: SYNC-2.0.1-05, SYNC-2.0.1-06, SYNC-2.0.1-11, SYNC-2.0.1-13
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits within `extensions/gamebryo-{plugin-management,savegame-management}/`, `extensions/collections/`, `extensions/modtype-bepinex/`, and the per-game extensions touched by v2.0.1 (`game-baldursgate3/`, `game-morrowind/`, `game-witcher3/`)
2. Playbook §1 re-grep clean: `grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json` only matches `gamestore-xbox` (skip-on-linux); gamebryo `bsa-support`/`plugin-management`/`archive-support`/`ba2-support` carry no inline guards
3. Playbook §3 re-grep clean: all four LOOT call sites in `extensions/gamebryo-plugin-management/src/autosort.ts` use `path.basename(pluginList[id].filePath)` not `pluginName.toLowerCase()`
4. Per-game fixes preserved: BG3 4-class divine error handling present in `divineCore.ts` / `divineWrapper.ts` / `loadOrder.ts`; Morrowind `migrate103` warning preserved
5. Each touched extension passes its own `pnpm --filter <ext> typecheck` (or `pnpm run build` fallback for extensions without per-package typecheck — BG3, Morrowind, Witcher 3 per v8.0 D-27-04)

**Plans**: TBD (target ~7–9 plans, mirroring v8.0 Phase 27)

### Phase 34: Renderer + main spine

**Goal**: All remaining source-conflict files (renderer infra, main/preload/shared, nexus_integration, fork-disabled fingerprints action) resolve to a tree that builds and links cleanly, with playbook §2/§4/§8/§9 + v6.0 fs casefold layer intact.
**Depends on**: Phase 33
**Requirements**: SYNC-2.0.1-07, SYNC-2.0.1-08, SYNC-2.0.1-09, SYNC-2.0.1-10, SYNC-2.0.1-12, SYNC-2.0.1-14, SYNC-2.0.1-18, SYNC-2.0.1-19, SYNC-2.0.1-20, SYNC-2.0.1-22
**Success Criteria** (what must be TRUE):

1. `git grep '^<<<<<<< '` shows zero hits across `src/renderer/`, `src/main/`, `src/preload/`, `src/shared/`, `extensions/nexus_integration/`, `scripts/`, `.github/actions/fingerprints/` (fingerprints picked from upstream side wholesale per SYNC-2.0.1-10; fork workflow disablement preserved at the GitHub API layer)
2. Playbook §2 re-grep clean: `src/renderer/webpack.config.cjs` `nodeExternals` allowlist contains `["winapi-bindings"]` on Linux
3. Playbook §4 re-grep clean: `testPathTransfer` in `src/renderer/src/util/transferPath.ts` carries NO `if (platform !== "win32") reject(UnsupportedOperatingSystem)` guard
4. Playbook §8 re-grep clean: `StarterInfo.ts` retains `isPathPrefix()`, `shouldRunWithProton()`, and `runToolWithProton()` with hide-instead-of-quit `onSpawned`
5. Playbook §9 re-grep clean: `Steam.ts` `resolveSteamPaths()` calls `findAllLinuxSteamPaths()` and reads `libraryfolders.vdf` from every Steam root
6. v6.0 fs casefold layer intact (SYNC-2.0.1-22): `applyChattrCasefold`, statfs cache, injectable seams (`_setChattr`, `_setChattrNotifier`, `_resetChattrState`), Flatpak/platform guards, post-chattr verify all present and unmodified by the merge
7. Per-bucket typechecks pass: `@vortex/shared`, `@vortex/preload`, `@vortex/main`, `@vortex/renderer`

**Plans**: TBD (target ~9–11 plans, mirroring v8.0 Phase 28; smaller because v2.0.1 diff < v2.0.0)

### Phase 35: Build verification

**Goal**: Every check the milestone definition-of-done depends on passes locally and in CI; AppImage + .deb boot and pass a 5-minute manual smoke test on the resolved branch.
**Depends on**: Phase 34
**Requirements**: SYNC-2.0.1-01, SYNC-2.0.1-15, SYNC-2.0.1-23, SYNC-2.0.1-24, SYNC-2.0.1-25, SYNC-2.0.1-26, SYNC-2.0.1-27
**Success Criteria** (what must be TRUE):

1. Final zero-conflict check: `git grep '^<<<<<<< '` returns zero hits across the entire `sync/upstream-v2.0.1` working tree (SYNC-2.0.1-01)
2. Full toolchain green: `pnpm install`, `pnpm run typecheck`, `pnpm run build`, `pnpm run build:extensions`, and `pnpm run test` (Vitest) all succeed; `pnpm run lint:ci` only surfaces pre-existing warnings (diff vs. master)
3. Playbook §5 re-grep clean: `pnpm run build:extensions` populates `src/main/build/bundledPlugins/` with the expected entry count for v2.0.1
4. AppImage and .deb produced via `release-linux.yml` (or local electron-builder run) boot from a clean install; `pnpm run start` boots from source on Linux
5. 5-minute manual smoke passes: detect a Steam game, install one mod, deploy via hardlink, launch via Proton — no regressions vs. shipped v8.0/v2.0.0-linux behaviour

**Plans**: TBD (target ~8–11 plans, mirroring v8.0 Phase 29)

### Phase 36: Land + tag + cherry-pick

**Goal**: Master is fast-forwarded onto the resolved merge, tagged, mirrored to `linux-port`, and the merge experience is captured in the playbook for the next sync (v8.2 / upstream v2.0.2).
**Depends on**: Phase 35
**Requirements**: SYNC-2.0.1-28, SYNC-2.0.1-29, SYNC-2.0.1-30, SYNC-2.0.1-31, SYNC-2.0.1-32, SYNC-2.0.1-33
**Success Criteria** (what must be TRUE):

1. Windows CI (`main.yml` windows-latest matrix) is green on the resolved merge commit
2. PR #5 (`atabisz/Vortex#5`) is fast-forward merged into `master` and closed (merged); FF parents-count = 1
3. Tag `v2.0.1-linux-rebased` exists on the merge commit, is SSH-signed, and is pushed to `origin`
4. `release-linux.yml` produces AppImage + .deb on the tag; SHA256s captured in evidence
5. The Linux subset of the merge is cherry-picked onto `linux-port` per existing branch policy (excludes `.planning/`, fork-only CI, fingerprint disablement) — `linux-port` history stays Linux-only
6. `VORTEX-LINUX-MERGE-PLAYBOOK.md` is updated with any new gotchas surfaced during resolution; the commit-index table reflects the new master and linux-port hashes for the affected fixes

**Plans**: TBD (target ~7–9 plans, mirroring v8.0 Phase 30)

### Phase 37: Carry-forward UAT

**Goal**: Close the three deferred-not-skipped items from v8.0 now that v2.0.1 has shipped on Linux — local-boot evidence, Skyrim SE 4-screenshot walkthrough, and `linux-port` baseline drift catch-up.
**Depends on**: Phase 36 (must run on the shipped v8.1 build, not pre-merge)
**Requirements**: SYNC-33-C, SYNC-34, SYNC-39
**Success Criteria** (what must be TRUE):

1. SYNC-33-C: Local-boot evidence captured — `pnpm run start` boots from source on a Linux dev host with screenshots/console-log capture committed to the v8.1 evidence directory
2. SYNC-34: Skyrim SE 4-screenshot walkthrough captured on Linux — game detected, mod installed, mod deployed, game launched via Proton — all four artefacts committed to evidence
3. SYNC-39: `linux-port` baseline drift catch-up complete — diff `linux-port` against master Linux-relevant commits since v8.0 close (`6a28945d1`); cherry-pick or rebase any missed deltas; commit-index table refreshed
4. Playbook updated (or confirmed unchanged) with the carry-forward UAT outcome so v8.2 inherits a clean baseline

**Plans**: TBD (target ~3–4 plans — one per requirement plus a wrap)

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
| 27. Gamebryo + per-game extensions                        | v8.0      | 9/9            | Complete    | 2026-05-21 |
| 28. Renderer + main spine                                 | v8.0      | 12/12          | Complete    | 2026-05-21 |
| 29. Build verification                                    | v8.0      | 11/11          | Complete    | 2026-05-22 |
| 30. Land + tag                                            | v8.0      | 9/9            | Complete    | 2026-05-22 |
| 31. Config bucket                                         | v8.1      | 0/0            | Not started | -          |
| 32. Mod-management hot zone                               | v8.1      | 0/0            | Not started | -          |
| 33. Gamebryo + per-game extensions                        | v8.1      | 0/0            | Not started | -          |
| 34. Renderer + main spine                                 | v8.1      | 0/0            | Not started | -          |
| 35. Build verification                                    | v8.1      | 0/0            | Not started | -          |
| 36. Land + tag + cherry-pick                              | v8.1      | 0/0            | Not started | -          |
| 37. Carry-forward UAT                                     | v8.1      | 0/0            | Not started | -          |
