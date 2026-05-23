---
phase: 34
plan: 05
wave: E
status: complete
files_resolved: 30
commits: 32
typecheck_filtered: 0
markers_delta: -74
markers_pre: 140
markers_post: 66
harness_gates: 12
harness_state: GREEN
bluebird_trap_audit: clean
linux_guard_preserved:
    - extensions/symlink_activator_elevate/index.ts: §1 platform guards (10× process.platform branches + 3× getIPCPath call sites) preserved post-resolve
    - extensions/hardlink_activator/index.ts: §3 Linux turbowalk enrichment (enrichLinuxEntries) + cross-volume hardlink detection (installPathForGame + fs.statSync .dev compare)
    - extensions/installer_fomod_ipc/utils/VortexIPCConnection.ts: §3 Linux .NET 9 ELF executable path (process.platform === "linux" exe-name strip in getExecutablePaths)
    - extensions/gamemode_management/index.ts: adaptor bridge fallback for info.json-less registrations (helps Linux adaptor-bridge games)
key-files:
    modified:
        - src/renderer/src/extensions/nexus_integration/types/IValidateKeyData.ts
        - src/renderer/src/extensions/nexus_integration/util/UIDs.ts
        - src/renderer/src/extensions/nexus_integration/util/oauth.ts
        - src/renderer/src/extensions/nexus_integration/util.ts
        - src/renderer/src/extensions/nexus_integration/eventHandlers.ts
        - src/renderer/src/extensions/nexus_integration/views/FreeUserDLDialog.tsx
        - src/renderer/src/extensions/nexus_integration/views/GoPremiumDashlet.tsx
        - src/renderer/src/extensions/nexus_integration/selectors.test.ts
        - src/renderer/src/extensions/nexus_integration/index.tsx
        - src/renderer/src/extensions/health_check/types.ts
        - src/renderer/src/extensions/health_check/api/triggers.ts
        - src/renderer/src/extensions/health_check/checks/modRequirementsCheck.ts
        - src/renderer/src/extensions/health_check/components/mod_requirement/ModRequirement.tsx
        - src/renderer/src/extensions/health_check/views/HealthCheckDetailPage.tsx
        - src/renderer/src/extensions/health_check/views/HealthCheckPage.tsx
        - src/renderer/src/extensions/profile_management/selectors.ts
        - src/renderer/src/extensions/profile_management/views/ProfileView.tsx
        - src/renderer/src/extensions/profile_management/index.ts
        - src/renderer/src/extensions/gamemode_management/views/GameRow.tsx
        - src/renderer/src/extensions/gamemode_management/index.ts
        - src/renderer/src/extensions/starter_dashlet/actions.ts
        - src/renderer/src/extensions/starter_dashlet/Tools.tsx
        - src/renderer/src/extensions/installer_fomod_ipc/utils/VortexIPCConnection.ts
        - src/renderer/src/extensions/installer_fomod_native/installer.ts
        - src/renderer/src/extensions/browse_nexus/views/BrowseNexusPage.tsx
        - src/renderer/src/extensions/category_management/index.ts
        - src/renderer/src/extensions/extension_manager/installExtension.ts
        - src/renderer/src/extensions/file_based_loadorder/UpdateSet.ts
        - src/renderer/src/extensions/hardlink_activator/index.ts
        - src/renderer/src/extensions/symlink_activator_elevate/index.ts
---

# Phase 34 Plan 05: Wave E (Renderer Extensions) Summary

Resolved all 30 renderer-extension conflict files in three sub-batches (E1 nexus_integration: 9 → E2 health_check: 6 → E3 misc: 15), 0 filtered renderer typecheck errors against Wave-E-resolved files, harness 12/12 GREEN throughout, bluebird-trap audit clean for all 4 risk files (eventHandlers.ts, util.ts, hardlink_activator/index.ts, symlink_activator_elevate/index.ts), §1 + §3 Linux-guard surface preserved verbatim.

## Sub-batch order

- **E1 — nexus_integration (9 files, sequential leaf-first)**: types/IValidateKeyData.ts → util/UIDs.ts → util/oauth.ts → util.ts → eventHandlers.ts → views/FreeUserDLDialog.tsx → views/GoPremiumDashlet.tsx → selectors.test.ts → index.tsx
- **E2 — health_check (6 files, sequential leaf-first)**: types.ts → api/triggers.ts → checks/modRequirementsCheck.ts → components/mod_requirement/ModRequirement.tsx → views/HealthCheckDetailPage.tsx → views/HealthCheckPage.tsx
- **E3 — misc (15 files, sequential leaf-first)**: profile_management/{selectors,ProfileView,index} → gamemode_management/{GameRow,index} → starter_dashlet/{actions,Tools} → installer_fomod_ipc → installer_fomod_native → browse_nexus → category_management → extension_manager → file_based_loadorder → hardlink_activator → symlink_activator_elevate

## Per-file region tally + stance

| #     | File                                                       | Regions | Stance                                                                                                                                       |
| ----- | ---------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| E1.1  | types/IValidateKeyData.ts                                  | 1       | smaller-diff HEAD-wins (line-wrap)                                                                                                           |
| E1.2  | util/UIDs.ts                                               | 1       | Rule-1 dup-import HEAD-empty                                                                                                                 |
| E1.3  | util/oauth.ts                                              | 3       | smaller-diff HEAD-wins (×3 line-wrap)                                                                                                        |
| E1.4  | util.ts                                                    | 6       | hybrid (HEAD shared/errors path + upstream handleGraphError feature)                                                                         |
| E1.5  | eventHandlers.ts                                           | 11      | hybrid (HEAD shared/errors path + upstream handleGraphError adoptions)                                                                       |
| E1.6  | views/FreeUserDLDialog.tsx                                 | 2       | Rule-1 dup-import + HEAD-wins (IValidateKeyDataV2 type)                                                                                      |
| E1.7  | views/GoPremiumDashlet.tsx                                 | 1       | smaller-diff HEAD-wins (line-wrap)                                                                                                           |
| E1.8  | selectors.test.ts                                          | 1       | smaller-diff HEAD-wins (line-wrap)                                                                                                           |
| E1.9  | index.tsx                                                  | 7       | hybrid (HEAD shared/errors path + Rule-1 dup-import + HEAD-wins line-wraps); +1 fix commit for linter dups                                   |
| E2.1  | health_check/types.ts                                      | 1       | smaller-diff HEAD-wins (line-wrap on Omit<...>)                                                                                              |
| E2.2  | health_check/api/triggers.ts                               | 3       | Rule-1 dup-import + smaller-diff HEAD-wins                                                                                                   |
| E2.3  | health_check/checks/modRequirementsCheck.ts                | 2       | hybrid (R1 upstream-wins fixes HEAD's enabledMods typo → checkableMods; R2 HEAD-wins because upstream uses requiredModId before declaration) |
| E2.4  | health_check/components/mod_requirement/ModRequirement.tsx | 1       | HEAD-wins (type import required)                                                                                                             |
| E2.5  | health_check/views/HealthCheckDetailPage.tsx               | 1       | HEAD-wins (shouldShowPremiumAd import required)                                                                                              |
| E2.6  | health_check/views/HealthCheckPage.tsx                     | 1       | Rule-1 dup-import HEAD-empty                                                                                                                 |
| E3.1  | profile_management/selectors.ts                            | 1       | HEAD-wins (line-wrap)                                                                                                                        |
| E3.2  | profile_management/views/ProfileView.tsx                   | 2       | HEAD-wins (line-wrap × 2)                                                                                                                    |
| E3.3  | profile_management/index.ts                                | 2       | HEAD-wins (line-wrap × 2)                                                                                                                    |
| E3.4  | gamemode_management/views/GameRow.tsx                      | 2       | HEAD-wins (logoPath defensive guard + import block); +1 fix commit for linter dups                                                           |
| E3.5  | gamemode_management/index.ts                               | 2       | HEAD-wins (adaptor bridge fallback + line-wrap)                                                                                              |
| E3.6  | starter_dashlet/actions.ts                                 | 1       | HEAD-wins (formatting)                                                                                                                       |
| E3.7  | starter_dashlet/Tools.tsx                                  | 1       | Rule-1 dup-import HEAD-empty                                                                                                                 |
| E3.8  | installer_fomod_ipc/utils/VortexIPCConnection.ts           | 1       | HEAD-wins (path import required)                                                                                                             |
| E3.9  | installer_fomod_native/installer.ts                        | 5       | HEAD-wins (formatting × 5)                                                                                                                   |
| E3.10 | browse_nexus/views/BrowseNexusPage.tsx                     | 3       | HEAD-wins (line-wrap × 3)                                                                                                                    |
| E3.11 | category_management/index.ts                               | 1       | HEAD-wins (line-wrap)                                                                                                                        |
| E3.12 | extension_manager/installExtension.ts                      | 8       | HEAD-wins (formatting × 8)                                                                                                                   |
| E3.13 | file_based_loadorder/UpdateSet.ts                          | 1       | HEAD-wins (line-wrap)                                                                                                                        |
| E3.14 | hardlink_activator/index.ts                                | 1       | HEAD-wins (fs + installPathForGame imports required)                                                                                         |
| E3.15 | symlink_activator_elevate/index.ts                         | 1       | Rule-1 dup-import HEAD-empty                                                                                                                 |

**Region totals:** 73 regions across 30 files. Distribution by stance: HEAD-wins (full) = 50 regions in 22 files; HEAD-empty / Rule-1 dup-import = 6 regions in 6 files; hybrid = 17 regions in 5 files (util.ts + eventHandlers.ts + index.tsx + modRequirementsCheck.ts + FreeUserDLDialog.tsx); upstream-wins (full) = 1 region (modRequirementsCheck.ts R1).

**Note on hybrid resolutions:** The two large hybrid files (util.ts and eventHandlers.ts) preserved Wave A's `@vortex/shared/errors` path for `AlreadyDownloaded` / `DownloadIsHTML` (HEAD fork-wins) while adopting upstream's new `handleGraphError` interface and call-site refactors (upstream-wins for the v2.0.1 feature). This is the canonical D-34-02 hybrid pattern: §1 playbook fork-wins for the path, v2.0.1 feature upstream-wins for new behaviour. modRequirementsCheck.ts (R1+R2) is also hybrid but for opposite reasons — fixed a HEAD typo (enabledMods → checkableMods, upstream-wins) and rejected an upstream use-before-declaration bug (requiredModId referenced before declaration, HEAD-wins).

## Bluebird-trap audit

The plan flagged 4 risk files (imports `bluebird` AND upstream-touched code paths). Audit results:

| File                               | Bluebird import | `:Promise<void>` annotations                                                                                                                                                                                                                                                                                  | Trap status |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| nexus_integration/eventHandlers.ts | yes (line 29)   | 0 introduced post-resolve                                                                                                                                                                                                                                                                                     | clean       |
| nexus_integration/util.ts          | yes (line 40)   | 0 introduced post-resolve                                                                                                                                                                                                                                                                                     | clean       |
| hardlink_activator/index.ts        | yes (line 9)    | 2 (enrichLinuxEntries:35, linkFile:335). enrichLinuxEntries is a new async helper awaited directly. linkFile body chains via this.ensureDir() (parent returns native Promise<boolean>) so the chain produces native Promise. Parent abstract declares PromiseLike<void> which native Promise<void> satisfies. | clean       |
| symlink_activator_elevate/index.ts | yes (line 11)   | 4 (linkFile:280, removeTask:910, ensureTaskDeleted:941, ensureTask:972). linkFile chains via this.ensureDir() (native Promise) — clean. removeTask chains runElevated which returns native Promise<string> — clean. ensureTaskDeleted and ensureTask are async functions returning native Promise — clean.    | clean       |

No TS1064 traps introduced. The bluebird type-leak pattern (declaring `Promise<void>` on an async function whose body returns a `PromiseBB` chain) does not appear in any post-resolve file.

## Linux-guard preservation

Wave E touched several files that contain §1 platform guards or §3 Linux-only code paths from the fork playbook. Verified preserved:

- **symlink_activator_elevate/index.ts (§1 platform guards)**: 10× `process.platform` branches at lines 50, 241, 696, 899, 995, 1107, 1120 etc. + 3× `getIPCPath()` call sites at 94, 769. All intact post-resolve. The single resolved region was the import block — no body changes.
- **hardlink_activator/index.ts (§3 Linux paths)**: `enrichLinuxEntries` Linux-branch at line 39 (turbowalk JS-fallback hydrates linkCount + idStr via lstat) and cross-volume hardlink detection at line 140 (`installPathForGame` + `fs.statSync(...).dev` compare). Both preserved by taking HEAD-wins for the import region (fs + installPathForGame) — the upstream branch was empty there.
- **installer_fomod_ipc/utils/VortexIPCConnection.ts (§3 Linux .NET 9 path)**: `process.platform === "linux"` branch at line 90 in `getExecutablePaths` (strips `.exe` suffix because Linux runs the .NET 9 self-contained ELF binary directly, not via mono). Preserved — the resolved region was the import block, body untouched.
- **gamemode_management/index.ts (adaptor bridge fallback)**: HEAD's `fsExtra.existsSync(infoPath)` guard with `{final: true, version: '1.0.0'}` defaults preserved. Adaptor-registered games (which don't ship info.json) won't crash registerGame on Linux or any platform. Took HEAD-wins for R2.

## Filtered renderer typecheck

Filter: errors in src/renderer/ excluding the 18 still-conflicted Wave F files (controls/Table, ExtensionManager, renderer.tsx, views/components/Header/{IconButton, Notifications/useNotificationFiltering}, views/components/Menu/{DownloadsMenuContent, ToolsSection, useTools}, views/components/Spine/{GameButton, index, SpineContext, utils}, views/layout/ToastContainer, views/pages/Tools/{index, ToolRow, toolStarters, useToolsData, useToolsPage}).

Total errors in unfiltered output: 494 (all TS1185 merge-conflict-marker errors emanating from the 18 Wave F files).
Errors against Wave E surface: **0**.
Wave-close gate: GREEN.

## Harness state

`grep-checkpoint.sh --skip-conflict-check`: 12/12 gates green after every commit. Run at wave close confirms continued green state.

## Marker delta

- Pre-Wave E (HEAD~32, Wave D STATE commit): 140 markers in src/renderer/ (74 in Wave E target files + 66 in Wave F surface).
- Post-Wave E (current HEAD): 66 markers in src/renderer/ (all in Wave F surface).
- Wave E removed: -74 markers across 30 files.

## Commits (32 total)

E1 sub-batch (9 resolves + 1 fix):

- 94a2929e9 nexus_integration/types/IValidateKeyData.ts — smaller-diff HEAD-wins
- 5e6560862 nexus_integration/util/UIDs.ts — Rule-1 dup-import HEAD-empty
- b605eeb5e nexus_integration/util/oauth.ts — smaller-diff HEAD-wins all 3 regions
- 8a51cfdca nexus_integration/util.ts — hybrid (HEAD shared/errors path + upstream handleGraphError feature)
- 84e864a28 nexus_integration/eventHandlers.ts — hybrid (HEAD shared/errors path + upstream handleGraphError adoption)
- 87b4f81fa nexus_integration/views/FreeUserDLDialog.tsx — Rule-1 dup-import + HEAD-wins type import
- 19e5e204c nexus_integration/views/GoPremiumDashlet.tsx — smaller-diff HEAD-wins
- 8d18447b9 nexus_integration/selectors.test.ts — smaller-diff HEAD-wins
- a873dfa42 nexus_integration/index.tsx — hybrid (HEAD shared/errors path + Rule-1 dup-import)
- 5df67aed5 fix: nexus_integration/index.tsx — drop duplicate imports (linter cleanup)

E2 sub-batch (6 resolves):

- 52b7e2c31 health_check/types.ts — smaller-diff HEAD-wins
- 42227c380 health_check/api/triggers.ts — Rule-1 dup-import + smaller-diff HEAD-wins
- 8325e2bd8 health_check/checks/modRequirementsCheck.ts — hybrid (R1 upstream-wins var rename, R2 HEAD-wins)
- ad80a0b44 health_check/components/mod_requirement/ModRequirement.tsx — HEAD-wins (type import)
- 5f8ddf0b1 health_check/views/HealthCheckDetailPage.tsx — HEAD-wins (shouldShowPremiumAd import)
- 1a4e5b305 health_check/views/HealthCheckPage.tsx — HEAD-empty (Rule-1 dup-import)

E3 sub-batch (15 resolves + 1 fix):

- 6db36c384 profile_management/selectors.ts — HEAD-wins (line-wrap)
- 87ebfb987 profile_management/views/ProfileView.tsx — HEAD-wins (line-wrap × 2)
- 070e97ce3 profile_management/index.ts — HEAD-wins (line-wrap × 2)
- 01c186b9f gamemode_management/views/GameRow.tsx — HEAD-wins (logoPath defensive guard)
- a3b37ea23 fix: gamemode_management/views/GameRow.tsx — drop duplicate imports (linter cleanup)
- 39b5220c7 gamemode_management/index.ts — HEAD-wins (adaptor bridge fallback + line-wrap)
- 496297eab starter_dashlet/actions.ts — HEAD-wins (formatting)
- 1e99da75e starter_dashlet/Tools.tsx — HEAD-empty (Rule-1 dup-import)
- 63d4c8b0b installer_fomod_ipc/utils/VortexIPCConnection.ts — HEAD-wins (path import)
- 0a2071c49 installer_fomod_native/installer.ts — HEAD-wins (formatting × 5)
- 6fe242d46 browse_nexus/views/BrowseNexusPage.tsx — HEAD-wins (line-wrap × 3)
- 84d8bd744 category_management/index.ts — HEAD-wins (line-wrap)
- 83c6e7395 extension_manager/installExtension.ts — HEAD-wins (formatting × 8)
- 0ff885d43 file_based_loadorder/UpdateSet.ts — HEAD-wins (line-wrap)
- 2e16cbb45 hardlink_activator/index.ts — HEAD-wins (fs + installPathForGame imports)
- 3aaf64791 symlink_activator_elevate/index.ts — HEAD-empty (Rule-1 dup-import)

All 32 commits SSH-signed (gpgsig SSH-SIGNATURE blocks present). Pattern S5 commit titles. Per-commit body documents region tally + bluebird-trap audit + Linux-guard status + harness state.
