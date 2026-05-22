---
phase: 30-land-tag
plan: 06
type: evidence
captured_at: 2026-05-22T06:32:01Z
captured_by: Wave 7 (30-06) inline execution
---

# Phase 30 Cherry-pick Notes (SYNC-38)

## Header

```
PRE_FF_MASTER_SHA   = db8035192034ba6ee786e88dfdb708956200308c
BARE_FF_MASTER_SHA  = cf9a8a59980ee8166139913ee04a4ed8d3ab8860
POST_FF_MASTER_SHA  = f570149ea9554fe2d24b00b86e688855b845a4fe
                    = git rev-list -n1 v2.0.0-linux-rebased (canonical tag SHA)
LINUX_PORT_BASE     = db8880f92760c31e41f614d4631dd6a84f3f9aa6
CANDIDATE_COUNT     = 166
```

`POST_FF_MASTER_SHA` extends past the bare FF SHA by one commit (`f570149ea`, the SYNC-32-D fix) per the D-30-02 invariant relaxation in [30-MERGE-EVIDENCE.md § Post-FF amendment](./30-MERGE-EVIDENCE.md#post-ff-amendment--sync-32-d-fix-landed-mid-phase-30). Same content released to users via the canonical tag; capturing it on linux-port keeps the two branches behaviourally aligned.

## Enumeration command

```
git log $PRE_FF_MASTER_SHA..$POST_FF_MASTER_SHA --reverse --oneline \
  --diff-filter=ACMRD \
  -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
  ':!.planning/**' \
  ':!.github/workflows/release-linux.yml' \
  ':!.github/workflows/format.yml' \
  ':!.github/actions/fingerprints/**' \
  ':!docker/**'
```

Produces 166 commits — well under the RESEARCH.md live measurement (~216) because the master..tag span we're path-filtering is narrower than master..master-now, and `.planning/`, fork-only CI, and fingerprint config are already excluded.

Output captured at `/tmp/cherry-pick-candidates.txt` and inlined below as the canonical record.

## Candidate manifest (166 commits, chronological)

```
1100ab8f5 fixed external changes dialog still being raised in some conditions
0b556523f small fixes
4a7722fbe de-duplicating auto-resolve actions
0bf12d423 Fixes broken package script
6a2aaed04 fix: workaround Electron >=39.6.1 crash on BrowserView close
ec8b73952 fixed missing peer dependencies for modmeta-db
2b6165a39 fixed last few instances of app.quit causing application crash
0a6972198 fixed startup crash when dialogs shown before main window exists
0cede7d05 fixed UIV2 profile pages respect Enable Profile Management toggle
5f66990ea fixed UIBlocker/dimmer not cleared on successful OAuth login
4d87944a7 fixed collection mods not considered when checking if req is installed
9c4ea854f additional defensive code when trying to fetch modInfo from API
5dd12c808 fixed several issues with staging/game folders recovery after tampering
67a5a8c3e fixed restore state from backup workaround not functioning
51405a2b8 defensive code to mods sort to avoid executing on empty mod list
99af6259e on manual fomod re-install, show fomod dialog with preselected values
55d7440c4 wait for renderer process exit before relaunching the app
e76c20b0e use new fomod preselect parameter instead of UI syncing
839b8ba7e Merge pull request #22007 from Nexus-Mods/task/APP-65
0bd02fb8d fix
90a869be3 Fix
d09073f1f Fix
a349e8956 added ability to preserve FOMOD presets when installing variants
1708e4acf healthcheck settings button will now always open global settings
0c887484e multiple Starfield enhancements and fixes
e0c279c86 collection edit no longer warns collaborators with edit permissions
4980602bc fixed dropdown buttons not responding to click after row focus steal
c8157e53a Fixed collections_download_completed event not being emitted
1f8569029 Added tests
3a1669103 Cleanup Windows API
615c308bb Fix duckdb download script
b45752d4d Fixed the renderer loop
a09824e5a Do not show the Unpin button on the default launcher tool
bddd4586a Check that we have an active profile when the game is selected. If not, ask to select one.
563fdf3b1 chore: update tool page styling
35ec0b839 Show the tool icon on play button if a custom tool is set. Otherwise show nothing
5271ac361 Fixed a whoopsie
4f3a37553 Refresh IsValid check (exe is present) on deploy
6400faa89 fix gamebryo savegame metadata regression
7274d0ebf fallback to local image if unable to ascertain remote gameart
2e7fed38a fixed greedy native plugin regex for Starfield
29887bbdc fix bepinex reinstall loop and enable free-user install flow
1c5f912b6 restored auto-download for patch updates in autoupdater
5d2e454df guard against undefined collection rules during install window
293b9295e fixed telemetry setup silently swallowing errors
bf3f535e0 use main logging instead of console
292dc8760 fix notifications quickUpdate crash from stale-index writes
c420d9e99 fixed several race conditions when switching collection revisions
17d0f8b51 fixed file UID generation failing due to stale games cache
162f939e7 plugin rules per-profile and add controls to prevent rule contamination
8112f1fed redact user-identifying paths from telemetry error payloads
ca0c183ac re-use InitFunc resolver for extension dependency scan
4c4e95081 include extension identity in failed-init error payload
73c1bcb42 fixed install crash from fileList.push spread on large archives
66cb8d6a8 only show "already running" dialog on real DB lock contention
e452ea99e guard undefined currentProfile in install fallback path
8a24f8ab1 fixed w3 script merger dummy installer + error handling for undefined instructions
d1e6f6ebb preserve real error message when showError receives non-error details
75e839128 BG3: improve divine error handling and suppress pak-reading noise
194311806 suppress error report for discarded collections
a0d46fb6b fixed incorrect fallback value for FOMOD installer choices
f3504f053 fixed for typecheck
be3b17a91 Morrowind: skip missing mod dirs in migrate103 plugin scan
4f5ff79f3 stop recording eslify environment errors as false successes
a22289f45 guard notifications reducer and quickUpdate against malformed payloads
cc38d5976 suppress non-actionable mod-requirements failure toast
cafdd5a85 validate variant name against filesystem-illegal characters
b68094116 fixed health check open-mod-page crash and improved Nexus URL fallback
0fa3e2d01 prevent false external-changes dialog after remove/replace
aa7e13928 removed redundant manifest entry sweep
20cf6b035 Bring prepare-dist-package.mjs from master
5203dfb35 restored ability to drop nested folder when importing folder
4d37ddc73 contain react-hot-toast goober render crash
01a080e17 surface GraphQL error path/location/query in nexus-api logs
b986dc18c minor tweak to the BG3 test suite
5a8bc4f1f resolve(config): src/preload/eslint.config.mjs — hand-merge per D-10
e549b62c5 resolve(config): src/main/eslint.config.mjs — hand-merge per D-10
80baf85c5 resolve(config): src/renderer/eslint.config.mjs — hand-merge per D-10
83efad160 resolve(config): src/shared/eslint.config.mjs — hand-merge per D-10
864707661 resolve(config): src/renderer/tsconfig.api.json — hand-merge per D-12 (preserves vortex-api .d.ts surface)
8418d19ba resolve(config): src/main/prepare-dist-package.mjs — hand-merge per D-12 (preserves src/main/build output paths + fork package metadata)
c90d89aaa resolve(config): extensions/games/game-baldursgate3/package.json — keep HEAD per D-06 stance
0d44b9fde resolve(mod-mgmt): views/ModList.tsx — fork-side oxfmt format wins, upstream controls/UpdateState imports absorbed
220809ccd resolve(mod-mgmt): eventHandlers.ts — fork-side oxfmt single-line wins
e54a682be resolve(mod-mgmt): util/deploy.ts — upstream cosmetic indentation
866a90f58 resolve(mod-mgmt): stagingDirectory.ts — drop upstream duplicate log import
985628dc3 resolve(mod-mgmt): util/externalChanges.ts — upstream cosmetic, fork single-line where shorter
f37694371 resolve(mod-mgmt): LinkingDeployment.ts — keep fork-side Prettier formatting
dd9913fe9 resolve(mod-mgmt): InstallManager.ts — fork-side wins (HEAD across all 23 regions)
b94feb15e resolve(mod-mgmt): index.ts — fork-side oxfmt single-line wins (HEAD across all 8 regions)
7568811cd resolve(savegame-mgmt): actions/session.ts — keep HEAD inline arrow form
146916a9e resolve(savegame-mgmt): index.ts — keep HEAD (drop stale upstream indent + extra brace)
a93c964bc resolve(plugin-mgmt): util/gameSupport.ts — keep HEAD inline arrow form
814f758b9 resolve(plugin-mgmt): util/PluginPersistor.ts — keep HEAD inline arrow form
e9548d16c resolve(plugin-mgmt): views/PluginList.tsx — keep HEAD (async/await + inline conditionals)
e089c28e7 resolve(plugin-mgmt): index.ts — keep HEAD (async ESPFile.open chain + drop merge-driver onStateChange duplication)
3803bee60 resolve(bepinex): bepInExDownloader.ts — keep HEAD (drop merge-driver duplicate types import + inline form)
48227697b resolve(bepinex): common.ts — keep HEAD inline form
bdc73b686 resolve(bepinex): index.ts — keep HEAD inline form
ff9043034 resolve(collections): util/gameSupport/gamebryo.tsx — keep HEAD (drop merge-driver mid-block artefact + inline form)
7adbaea00 resolve(collections): eventHandlers.ts — keep HEAD (drop merge-driver duplicate-block + duplicate path import + inline form)
6833ee57c resolve(collections): views/CollectionPageEdit/Instructions.tsx — keep HEAD (preserve gamebryo-only excludePluginRules toggle gate + inline form)
780da0906 resolve(collections): views/InstallDialog/InstallStartDialog.tsx — keep HEAD (preserve gamebryo-only skipPluginRules toggle gate + inline form)
4dc4dcaf7 resolve(collections): views/CollectionList/index.tsx — keep HEAD (drop merge-driver dropped-imports artefact + inline form)
715cde245 resolve(collections): index.ts — keep HEAD (drop merge-driver indent/brace artefact + inline form)
83e4d665a resolve(bg3): cache.ts — keep HEAD (wrapped signature + double quotes per fork style)
f894a9ef7 resolve(bg3): util.ts — keep HEAD (double quotes per fork style)
a56747e77 resolve(bg3): divineCore.ts — keep HEAD (double quotes per fork style; preserves 4 divine error classes per D-27-02)
f404a05c3 resolve(bg3): divineWrapper.ts — keep HEAD (drop merge-driver dropped-imports artefact + fork-side limiter retry filter + double quotes)
129087fb4 resolve(bg3): divineCore.test.ts — keep HEAD (double quotes per fork style)
48f762da4 resolve(bg3): loadOrder.ts — keep HEAD (drop merge-driver duplicate-imports artefact + preserve fork-side fixes)
9e18731bd resolve(bg3): index.tsx — keep HEAD (drop merge-driver duplicate-imports + duplicate-const artefact)
f8a7301ab resolve(morrowind): migrations.js — keep HEAD (double quotes + wrapped args per fork style; preserves migrate103 warning per D-27-02)
1647b647a resolve(witcher3): installers.ts — keep HEAD (double quotes + oxfmt-wrapped args per fork style)
fa2dbb962 resolve(witcher3): index.ts — keep HEAD (double quotes + oxfmt-wrapped registerInstaller calls per fork style)
bf3eb0677 resolve(shared): errors.ts — fork-wins on both regions (keep one-liner sanitizeFramePath + STRIP_COLUMN_RE/FINGERPRINT_FRAME_LIMIT constants used downstream)
f3a339d6f resolve(shared): errors.test.ts — fork-wins on both regions (one-liner toBe per fork oxfmt output)
3b5557468 resolve(shared): telemetry/spans.ts — fork-wins (keep one-liner sanitizedStack ternary)
8a1d16ef7 resolve(preload): index.ts — fork-wins (one-liner moveTop ipc invoke)
a84179c39 resolve(main): cli.ts — fork-wins (drop merge-driver duplicate-imports artefact)
15f9f94df resolve(main): errorReporting.ts — fork-wins (one-liner import + retain ReportableError type import used downstream)
06a5ced00 resolve(main): extensions/autoupdater.ts — fork-wins (operator-trailing && per fork oxfmt style)
a3cdda786 resolve(main): TrayIcon.ts — drop duplicate-import + fork-wins on Quit menu wrap
d0c041451 resolve(main): Application.ts — fork-wins on formatting + retain PROT-01 cold-start NXM URL apply
6e4b8ad33 resolve(renderer): util/message.ts — drop duplicate-imports + fork-wins on operator-trailing &&
876411037 resolve(renderer): util/migrate.ts — drop duplicate-imports + fork-wins on one-liner array
80e459504 resolve(renderer): util/opn.ts — fork-wins (retain PromiseBB import used downstream)
62c282e19 resolve(renderer): reducers/notifications.ts — fork-wins on one-liner findIndex
f430d68a9 resolve(renderer): hooks/windowControls.ts — fork-wins on one-liner onMaximized
760b592c2 resolve(renderer): contexts/builtInPages.ts — fork-wins on import grouping + one-liner Pick&Partial
93def64d5 resolve(renderer): contexts/PagesContext.tsx — fork-wins on one-liner useSelector
4771abfe4 resolve(renderer): controls/Table.tsx — drop merge-driver import shuffle + fork-wins on JSX one-liners
b21b5bfd0 resolve(renderer): ui/components/no_results/NoResults.tsx — fork-wins on one-liner openUrl
6e05781f5 resolve(renderer): extensions/browse_nexus/views/BrowseNexusPage.tsx — fork-wins on JSX one-liners
28fb29a47 resolve(renderer): extensions/extension_manager/installExtension.ts — fork-wins on perfectionist import sort
2ef371afe resolve(renderer): extensions/gamemode_management/views/GameRow.tsx — fork-wins (retain pathToFileURL + null-safe logoPath handling)
c852d1c03 resolve(renderer): extensions/health_check/checks/modRequirementsCheck.ts — hybrid (upstream var name + fork external-req shape)
04d196f76 resolve(renderer): extensions/health_check/components/mod_requirement/ModRequirement.tsx — fork-wins (retain IModFileInfo/IModRequirementExt types used in props)
27e0f8c24 resolve(renderer): extensions/health_check/views/HealthCheckPage.tsx — drop duplicate-imports (both v2.0.0 imports already present above)
d764f96d8 resolve(renderer): extensions/installer_fomod_native/installer.ts — fork-wins on import shape + 80-col one-liners
14775ca6b resolve(nexus): util/UIDs.ts — drop duplicate-imports (HEAD's log/getGame already present below)
ffd046b8a resolve(nexus): util.ts — fork-wins on import shape + drop duplicate-imports + retain @vortex/shared/errors path
6bfe08257 resolve(nexus): eventHandlers.ts — fork-wins on import shape + 80-col one-liners
a6110ca22 resolve(nexus): views/FreeUserDLDialog.tsx — drop duplicate-imports + retain IValidateKeyDataV2 type
f9a851aab resolve(nexus): selectors.test.ts — fork-wins on one-liner isCollection boolean
df9888c96 resolve(nexus): index.tsx — fork-wins on one-liner newestFileId
011f45429 resolve(starter_dashlet): actions.ts — upstream wins on createAction shape (matches peers)
c0f8194eb resolve(renderer): views/components/Header/Notifications/useNotificationFiltering.ts — fork-wins on one-liner formatting (2 regions)
13515acd8 resolve(renderer): views/components/Menu/ToolsSection.tsx — drop duplicate-imports + fork-wins on JSX one-liners (4 regions)
83e6fd1ec resolve(renderer): views/components/Menu/useTools.ts — fork-wins on one-liner nonLauncher filter
50c3e2215 resolve(renderer): views/components/Spine/SpineContext.tsx — fork-wins on typed IStateWithPlugins selector + one-liner formatting (3 regions)
e183f9388 resolve(renderer): views/layout/ToastContainer.tsx — fork-wins on one-liner generic args
30325eea2 resolve(renderer): views/pages/Tools/ToolRow.tsx — fork-wins on import sort + JSX one-liners + double quotes (6 regions)
09ad3786a resolve(renderer): views/pages/Tools/toolStarters.ts — fork-wins (defensive toolsOrder guard + one-liner formatting, 4 regions)
e1fe734cb resolve(renderer): views/pages/Tools/useToolsData.ts — fork-wins on import grouping + one-liner formatting (9 regions)
cbc69d768 resolve(renderer): views/pages/Tools/useToolsPage.ts — fork-wins on import sort + one-liner formatting (9 regions)
da87a20b3 resolve(renderer): views/pages/Tools/index.tsx — fork-wins on double quotes + JSX one-liners + correct destructured Panel signature (6 regions)
5a7709021 resolve(renderer): ExtensionManager.ts — fork-wins on canonical log-object format + correct indentation inside if block (2 regions)
020cf3273 fix(renderer): views/components/Menu/useToolsData.ts — drop duplicate pinnedToolsMap/deploymentCounter declarations (merge-driver artefact, surfaced by per-bucket typecheck)
df5d29234 resolve(scripts): download-duckdb-extensions.ts — fork-wins on alphabetical imports + 80-col one-liners (4 regions)
fe283fe9e resolve(scripts): download-duckdb-extensions.test.ts — fork-wins on one-liner imports + repository URL (2 regions)
a5c057507 chore(format): oxfmt baseline cleanup pre-merge
07c519711 fix(30-01): adopt master superset of IState.ts + useToolsData.ts selectors
fb5930c08 fix(30-01): adopt master superset of pnpm-workspace + package.json + lockfile
839e503c0 chore(format): oxfmt 44 files post-rebase
f570149ea fix(30-04a): SYNC-32-D — rewire DownloadObserver against new download API
```

## Cherry-pick execution

Captured in subsequent sections as picks proceed.
