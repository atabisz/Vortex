---
gsd_state_version: 1.0
milestone: v8.0
milestone_name: Upstream v2.0.0 Sync
status: complete
stopped_at: Phase 30 complete; v8.0 milestone done
last_updated: "2026-05-22T07:30:00.000Z"
last_activity: 2026-05-22 -- Phase 30 complete; v8.0 milestone closed
progress:
    total_phases: 8
    completed_phases: 7
    total_plans: 68
    completed_plans: 68
    percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-16 after v7.0 milestone start)

**Core value:** A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.
**Current focus:** v8.0 (Upstream v2.0.0 Sync) milestone CLOSED — next work moves to v8.1+ backlog.

## Current Position

Phase: 30 (land-tag) — COMPLETE 2026-05-22
Plan: 9 of 9 (30-00..30-08 complete; SYNC-35/36/37/38/39 PASS; SYNC-33-C + SYNC-34 carry-forwards from Phase 29 DEFERRED to v8.1 per playbook §DEFERRED pattern)
Status: v8.0 milestone CLOSED
Last activity: 2026-05-22 -- Phase 30 complete; v8.0 milestone closed

Progress: [██████████] 100% (Phase 30 complete; v8.0 milestone closed)

Canonical tag `v2.0.0-linux-rebased` SSH-signed at `f570149ea` (annotated tag object `634a5cc1a`). AppImage + .deb published with deterministic SHA256s via release-linux.yml run [26270905415](https://github.com/atabisz/Vortex/actions/runs/26270905415). PR #4 fast-forward merged onto master (FF parents-count = 1, bare FF SHA `cf9a8a599`). linux-port at `6a28945d1` (75 cherry-picks landed; 91 dropped as superseded). VORTEX-LINUX-MERGE-PLAYBOOK.md milestone post-mortem captured in single signed commit `2474c3d0d`. Working tree clean.

**v8.1 backlog seed:** SYNC-39 linux-port catch-up (6 baseline-drift typecheck errors), SYNC-33-C local-boot + SYNC-34 4-screenshot walkthrough against canonical artefacts, AppImage update channel, GH-Actions step bumps, `@vortex/api` regen-as-chore, ROADMAP Phase 28 progress-table row drift at line 301.

## Performance Metrics

**Velocity:**

- Total plans completed: 20
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
| ----- | ----- | ----- | -------- |
| 11    | 1     | -     | -        |
| 12    | 1     | -     | -        |
| 14    | 2     | -     | -        |
| 13    | 1     | -     | -        |
| 15    | 3     | -     | -        |
| 16    | 1     | -     | -        |
| 17    | 1     | -     | -        |
| 19    | 3     | -     | -        |
| 20    | 2     | -     | -        |
| 21    | 2     | -     | -        |
| 22    | 1     | -     | -        |
| 23    | 2     | -     | -        |

**Recent Trend:**

- Last 5 plans: (none yet for v7.0)
- Trend: -

_Updated after each plan completion_
| Phase 06-steam-proton-detection P01 | 3 | 2 tasks | 3 files |
| Phase 06-steam-proton-detection P02 | 15 | 2 tasks | 4 files |
| Phase 06-steam-proton-detection P03 | 5 | 1 tasks | 1 files |
| Phase 06-steam-proton-detection P03 | 20min | 2 tasks | 5 files |
| Phase 07-linux-packaging P02 | 5 | 1 tasks | 1 files |
| Phase 07-linux-packaging P01 | 2 | 2 tasks | 2 files |
| Phase 08-nxm-protocol-handler P02 | 5 | 1 tasks | 1 files |
| Phase 08-nxm-protocol-handler P01 | 8 | 2 tasks | 2 files |
| Phase 09 P01 | 2 | 2 tasks | 4 files |
| Phase 09 P02 | 7 | 1 tasks | 2 files |
| Phase 10-save-ui-validation-steamos-polkit P02 | 5 | 2 tasks | 4 files |
| Phase 10-save-ui-validation-steamos-polkit P01 | 8 | 3 tasks | 6 files |
| Phase 16 P01 | 6 | 2 tasks | 3 files |
| Phase 17-upstream-rebase-ci-workflow P01 | 3 | 2 tasks | 3 files |
| Phase 17 P01 | 30 | 4 tasks | 3 files |
| Phase 18-first-run-dashboard-foundation P01 | 9 | 2 tasks | 4 files |
| Phase 18 P02 | 16 | 2 tasks | 4 files |
| Phase 19 P00 | 25 | 2 tasks | 3 files |
| Phase 19 P01 | 4 | 2 tasks | 5 files |
| Phase 19 P02 | 5 | 2 tasks | 2 files |
| Phase 20-windows-string-purge P01 | 5min | 2 tasks | 3 files |
| Phase 20 P02 | 3min | 2 tasks | 0 files |
| Phase 21-mod-install-round-trip-validation P01 | 5min | 2 tasks | 2 files |
| Phase 21-mod-install-round-trip-validation P02 | 2min | 1 tasks | 2 files |
| Phase 23-help-links P01 | 3min | 2 tasks | 5 files |
| Phase 23 P02 | 2min | 1 tasks | 1 files |
| Phase 23-help-links P02 | 5min | 2 tasks | 1 files |
| Phase 27-gamebryo-per-game-extensions P00 | 4min | 1 tasks | 1 files |
| Phase 27-gamebryo-per-game-extensions P01 | 2min | 2 tasks | 2 files |
| Phase 27-gamebryo-per-game-extensions P02 | 8min | 4 tasks | 4 files |
| Phase 27-gamebryo-per-game-extensions P03 | 5min | 3 tasks | 3 files |
| Phase 27-gamebryo-per-game-extensions P04 | 5 | 6 tasks | 6 files |
| Phase 27-gamebryo-per-game-extensions P05 | 5min | 7 tasks | 7 files |
| Phase 27-gamebryo-per-game-extensions P06 | 2min | 1 tasks | 1 files |
| Phase 27-gamebryo-per-game-extensions P07 | 4min | 2 tasks | 2 files |
| Phase 27-gamebryo-per-game-extensions P08 | 12min | 1 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- FOMOD: recompile via .NET 9 (Linux binary already ships in npm packages — packaging only)
- winapi-bindings: webpack alias shim on Linux (one config change, catches all 21 import sites)
- Elevation: defer pkexec to v3.0 — shim ShellExecuteEx as throw; most Steam libs are user-owned
- IPC serialisation trap: extract `getIPCPath(id)` utility and patch BOTH parent server and stringified child closure
- [Phase 01-runtime-environment]: localAppData Linux branch: XDG_DATA_HOME ?? os.homedir()/.local/share using ?? not || to handle empty string correctly
- [Phase 01-runtime-environment]: electron-builder: Windows .exe redistributables scoped to win.extraResources; Linux packaging references only cross-platform entries
- [Phase 02-winapi-bindings-shim]: Test file at winapi-shim.test.ts (not **tests**/): renderer vitest.config.mts excludes **tests**/ pattern
- [Phase 02-winapi-bindings-shim]: RegGetValue returns undefined in production shim (not object as in Jest mock)
- [Phase 02-winapi-bindings-shim]: webpack/rolldown alias at bundle time catches all 18+ winapi-bindings import sites without source edits
- [Phase 02-winapi-bindings-shim]: SHIM_PATH uses import.meta.dirname for ESM-safe resolution in build.mjs
- [Phase 03-native-addon-compilation]: Build libloot 0.29.1 from source via cmake+cargo — LOOT dropped Linux prebuilts at 0.24.5; postinstall script delivers liblibloot.so to loot_api/
- [Phase 03-native-addon-compilation]: Rust toolchain step placed before pnpm install in CI — postinstall-libloot.cjs needs cargo on PATH during dependency installation
- [Phase 03-native-addon-compilation]: gamebryo-savegame disabled on Linux: two compile errors (MSVC exception constructor + lz4/zlib linker flags); NADD-06 clear error via ExtensionManager lazy-load failure
- [Phase 03-native-addon-compilation]: vortexmt confirmed clean for Linux: proper WIN32 guards, portable C++ — added to CI rebuild
- [Phase 03-native-addon-compilation]: xxhash-addon loads from NAPI prebuilds without rebuild (node-gyp-build handles linux-x64 glibc/musl)
- [Phase 03-native-addon-compilation]: LD_LIBRARY_PATH in-process + CI wrapper chosen over patch-package RPATH for loot.node runtime .so resolution
- [Phase 03-native-addon-compilation]: CI step ordering corrected: Rust toolchain before cmake/build-deps before pnpm install
- [Phase 03-native-addon-compilation]: loot binding.gyp patch: replace -l../loot_api/libloot with -L../loot_api -llibloot on Linux; add RPATH $ORIGIN/../../loot_api; cmake output is libloot.so.0 (not liblibloot.so due to PREFIX=)
- [Phase 03-native-addon-compilation]: verify-addons.cjs: loot verified via ldd not require() because Electron V8 headers (module v140) are incompatible with plain node (module v127); pnpm isolation requires workspace-relative require.resolve paths
- [Phase 04-fomod-installer-integration]: Explicit asarUnpack paths for Linux binaries (not broad globs) per D-01 decision
- [Phase 04-fomod-installer-integration]: platformExeName in VortexIPCConnection strips .exe on Linux; Windows behavior unchanged
- [Phase 04-fomod-installer-integration]: FOMD-03 dotnetprobe Linux branch already correct in installer_dotnet/index.ts — no code changes needed
- [Phase 05-ipc-and-elevation-audit]: pkexec not required for Phase 1 — all 6 runElevated call sites are user-triggered; startup path is clean
- [Phase 05-ipc-and-elevation-audit]: Static import + vi.spyOn used instead of dynamic import() for node16 moduleResolution compat in ipc.test.ts
- [Phase 05-ipc-and-elevation-audit]: baseFunc serialized closure in symlink_activator_elevate patched identically to elevatedMain in elevated.ts
- [Phase 06-steam-proton-detection]: findLinuxSteamPath() kept intact for backward compat; findAllLinuxSteamPaths() is additive
- [Phase 06-steam-proton-detection]: oslist as primary Proton signal when available — enables never-launched game detection without compatdata
- [Phase 06-steam-proton-detection]: Appid dedup uses Set<string> first-occurrence-wins after games reduce, before tap()
- [Phase 06-steam-proton-detection]: getMyGamesPath accepts compatDataPath string directly — simpler signature, callers already have path from Phase 06-01 work
- [Phase 06-steam-proton-detection]: PromiseBB.resolve(asyncFn()) wrapping at ini_prep call sites preserves two-arg .catch(UserCanceled) without rewriting error handlers
- [Phase 06-steam-proton-detection]: Bundled game extensions bypass webpack alias — Windows-only require() calls must be removed from source, not aliased
- [Phase 06-steam-proton-detection]: Fallout 4 dead winapi-bindings removed from src/index.js; dist is gitignored and regenerated at build time
- [Phase 06-steam-proton-detection]: steamPaths.ts: ~/.steam/root symlink resolved first; all roots read VDF for secondary library discovery
- [Phase 06-steam-proton-detection]: GameStoreHelper.ts: result.priority guard removed — Steam entries on Linux never set priority
- [Phase 06-steam-proton-detection]: transferPath.ts: win32-only guard removed from testPathTransfer(); diskusage.check() uses destination path on Linux
- [Phase 07-linux-packaging]: build-linux is a parallel sibling job (no needs:) — runs concurrently with Windows build
- [Phase 07-linux-packaging]: pnpm run package:nosign reused for Linux — electron-builder ignores Windows signing config on Linux automatically
- [Phase 07-linux-packaging]: linux.artifactName mirrors nsis.artifactName: vortex-setup-${version}.${ext}
- [Phase 07-linux-packaging]: Auto-updater gate: process.env.APPIMAGE only — zip/deb installs get managed (no updater)
- [Phase 08-nxm-protocol-handler]: Buffer args.download in mPendingDownload before startup; apply after startUi() resolves
- [Phase 08-nxm-protocol-handler]: generateWrapperScript appPath optional: AppImage self-contained, no Electron appPath needed; dev builds unaffected
- [Phase 08-nxm-protocol-handler]: kbuildsycoca6 ENOENT logged at debug level: absence expected on non-KDE desktops
- [Phase 09]: MoreInfoException: std::runtime_error base -- GCC rejects MSVC-specific std::exception(runtime_error) constructor form
- [Phase 09]: No RPATH in gamebryo-savegame patch: lz4 and zlib are system libs, not bundled
- [Phase 10-save-ui-validation-steamos-polkit]: SteamOS branch: spawn sudo -n before pkexec when isSteamOS() returns true — pkexec hangs without polkit agent in Game Mode
- [Phase 10-save-ui-validation-steamos-polkit]: isSteamOS() cached in module-level \_isSteamOS after first call — avoids repeated file reads
- [Phase 10-save-ui-validation-steamos-polkit]: polkit action uses auth_admin (not auth_admin_keep) — prompt every time per D-10
- [Phase 10-save-ui-validation-steamos-polkit]: getSteamEntry uses GameStoreHelper.getGameStore('steam') — bundled extension constraint, can't import renderer src/
- [Phase 10-save-ui-validation-steamos-polkit]: ILocalSteamEntry local interface — ISteamEntry not exported by vortex-api; bundled extension constraint
- [Phase 10-save-ui-validation-steamos-polkit]: tsconfig.json excludes test/mock files — **mocks** outside src/ causes TS6307; production typecheck must not traverse test infrastructure
- [Phase 16]: Use node:fs/promises import alias to avoid shadow from \* as fs from fs-extra
- [Phase 16]: ExecFileFn stays callback-style (not promisified) to match injectable seam contract
- [Phase 16]: vi.mock node:fs/promises factory chosen over vi.spyOn to avoid getter non-configurable issue in Vitest happy-dom
- [Phase 17-01]: chmod +x set via git update-index --chmod=+x; sandbox filesystem read-only for scripts dir
- [Phase 17-01]: CONFLICT_FILES captured before git add -A per RESEARCH.md Open Question 1 resolution
- [Phase 17-01]: Always --draft on gh pr create regardless of conflict state per D-11
- [Phase 17-upstream-rebase-ci-workflow]: gh pr create (GraphQL) replaced with gh api REST POST — GraphQL rejects fork GITHUB_TOKEN for createPullRequest mutation
- [Phase 17-upstream-rebase-ci-workflow]: git push origin HEAD:refs/heads/BRANCH required in CI — git rebase leaves detached HEAD; named refspec avoids push failure
- [Phase 18-01]: Injectable seam \_setDrivelistLoader added: Vitest vi.mock cannot intercept CJS require() inside function bodies; seam follows \_setSpawner pattern in elevated.ts
- [Phase 18-01]: Platform guard placement: first line in closure/value fn before any Windows-specific API access; minDiskSpace guard before props[key] access
- [Phase 18]: PromiseBB.delay used (not Bluebird.delay) — consistent with GameModeManager.ts bluebird alias convention
- [Phase 18]: Test assertions use container.querySelector+textContent (not getByText) — refreshMore setTimeout causes re-renders duplicating DOM nodes
- [Phase 18]: Retry in startQuickDiscovery (not GameStoreHelper) — needs Redux discovered-games state for zero-games check and full pipeline access
- [Phase 19]: stagingDirectory.test.ts tests findAccessibleAncestor as named export — lazyRequire proxy prevents winapi call tracking through production function
- [Phase 19]: discovery.test.ts win32 different-device test marked it.todo — process.platform cross-test mutation in happy-dom; passes in isolation
- [Phase 19]: modPathsForGame mocked directly in discovery.test.ts — avoids getGame() registration complexity
- [Phase 19]: findAccessibleAncestor exported as named export for testability: lazyRequire proxy prevents winapi call tracking through production function
- [Phase 19]: ternary inside t() pattern for platform-specific i18n strings: Windows arm byte-for-byte unchanged, Linux arm added as new branch
- [Phase 19]: Settings.tsx: stat modPaths[''] directly (not path.parse root) for correct device id on Linux multi-device systems
- [Phase 19]: Settings.tsx: sequential awaits instead of Promise.all to allow await inside mountpoint walk loop body
- [Phase 20-01]: Static test: use path.resolve(\_\_dirname) not import.meta.url (not file:// in happy-dom)
- [Phase 20-01]: raiseUACDialog Linux arm uses t() wrapping for i18n consistency with Windows arm
- [Phase 20-01]: confirmElevate text/button: no t() wrapping, matching existing plain string pattern
- [Phase 20]: ONBRD-03c satisfied by nativeErrors.ts:13 guard returns undefined on non-win32; message.ts:421 EPERM handler clean — no code changes needed
- [Phase 20]: ONBRD-03d: single Run as Administrator string in symlink_activator_elevate:121 unreachable on Linux via isSupported returning IUnavailableReason — filtered from getSupportedActivators
- [Phase 21-mod-install-round-trip-validation]: ENOENT fix is cross-platform: staging dir missing is valid on all platforms, no process.platform guard needed
- [Phase 21-mod-install-round-trip-validation]: hardlink isSupported returns undefined on ENOENT: defer device-comparison to deploy time when ensureStagingDirectory has run
- [Phase 21-mod-install-round-trip-validation]: ONBRD-04 marked code-complete after Phase 21-01 ENOENT fix; UAT checklist placed in Phase 999.1 matching ELEV-04/ELEV-05/SAVE-05 precedent
- [Phase 23-help-links]: onOpenUrlFailed returns void (not unsubscribe fn): consistent with persist.onPush/onHydrate; listener registered once for app lifetime
- [Phase 23-help-links]: shared package must be rebuilt before preload/main tsc checks see new MainChannels types
- [Phase 23]: (window as any).api.shell used in documentation extension: bundled extensions import from vortex-api, not src/renderer/src/; avoids new intra-renderer dependency
- [Phase 23-help-links]: (window as any).api.shell used in documentation extension: bundled extensions import from vortex-api, not src/renderer/src/; avoids new intra-renderer dependency
- [Phase 23-help-links]: Notification id open-url-failed is fixed (not URL-dependent) to deduplicate rapid failures per T-23-06 mitigation
- [Phase 26-mod-management-hot-zone]: 8 conflict files resolved leaf-first (ModList → eventHandlers → util/deploy → stagingDirectory → util/externalChanges → LinkingDeployment → InstallManager → index); 9 atomic `resolve(mod-mgmt):` commits + 1 `grep-checkpoint.sh` harness (script first per D-26-01)
- [Phase 26-mod-management-hot-zone]: Fork-side wins as default conflict stance — most regions were oxfmt single-line vs upstream multi-line cosmetic differences; one merge-driver re-paste artefact in `LinkingDeployment.ts genUpdateModDeployment` resolved by reading both parents
- [Phase 26-mod-management-hot-zone]: D-26-03a — playbook entry "externalChanges" names a method on `LinkingDeployment.ts:513`, NOT a separate file; `util/externalChanges.ts` is unrelated UI code with ordinary conflicts. Confusion documented to prevent recurrence in v8.1+ syncs.
- [Phase 26-mod-management-hot-zone]: Renderer-wide typecheck deferred per Rule 3 — `pnpm -F @vortex/renderer typecheck` reports zero errors from `mod_management/`; remaining errors are all in Phase 27/28 territory (`useToolsPage.ts`, `ExtensionManager.ts`, `nexus_integration/*`, etc.)
- [Phase 26-mod-management-hot-zone]: `scripts/grep-checkpoint.sh` is durable — 7 gates encoding playbook §6, §7a–d, 140a57217, plus no-conflict-marker assertion. Reusable for future v8.1/v9.0 syncs.
- [Phase 27-gamebryo-per-game-extensions]: Extended `scripts/grep-checkpoint.sh` in place (Phase 26 path, per CONTEXT D-27-03 reuse pattern) with 5 new gates — §1 extension build guards, §3 LOOT call-site casing in autosort.ts, §10 cross-compiled native binaries, BG3 4-class divine error preservation, Morrowind migrate103 warning preservation. 12 gates total. Conflict-marker gate broadened to 8 paths (mod_management/ + 7 Phase 27 extension dirs).
- [Phase 27-gamebryo-per-game-extensions]: D-27-03 sub-note — gate 8 threshold ≥3 not ≥4. Live `autosort.ts` has 3 distinct `path.basename(pluginList[…])` expressions feeding 4 LOOT call sites because `lootKey` local at line 546 is reused at lines 549 (getPluginMetadataAsync) and 553 (getPluginAsync). Plan task spec miscounted basename expressions vs LOOT call sites; fixed via Rule 1.
- [Phase 27-gamebryo-per-game-extensions]: D-27-03 sub-note — `git grep -cE <pattern> <single-file>` prints `path:N` (not bare count); use `git grep -nE | wc -l` for arithmetic-friendly counts.
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 confirmed — per-extension typecheck filter is the bare package name (`pnpm --filter gamebryo-savegame-management typecheck`), NOT `@vortex/<ext>`. Extensions in this monorepo do not carry the `@vortex/` scope; verified via each extension's `package.json` `name` field.
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-01 — both savegame-mgmt conflict regions resolved fork-side. `actions/session.ts` was a cosmetic single-line vs wrapped arrow-body difference (HEAD wins, matches surrounding action-creator style). `index.ts` upstream side carried a stale `},)` artefact from a prior call shape — would have been syntactically invalid in the current `.then((result) => { ... })` opener; HEAD was the only valid resolution.
- [Phase 27-gamebryo-per-game-extensions]: oxfmt pre-commit hook reformats adjacent code on every conflict-resolution commit (collapses multi-line signatures to single-line per print-width=80). Behaviour preserved; commits still touch exactly one file. Future plans 27-02..27-07 should expect the same.
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-02 — all 4 plugin-mgmt files resolved fork-side (HEAD on every region). Dominant divergence is the async-ESPFile.open chain (Phase 03 native-addon redesign of esptk bindings). Caught one self-inflicted typecheck regression: upstream's `: Promise<void>` annotation on `swapUserlistForProfile` triggered TS1064 because `index.ts` does `import Promise from "bluebird"` at line 6 — bluebird-Promise shadows global Promise and is not the global `Promise<T>` TS requires for async return-type validation. Reverted to no-annotation form (TS infers global Promise from `async`). Two merge-driver duplications caught in index.ts (testBlueprintMasters and onStateChange persistent-profiles handler) — same pattern as Phase 26 LinkingDeployment.ts genUpdateModDeployment artefact.
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 footnote — when resolving conflicts in any file that imports `Promise from "bluebird"`, do NOT add `: Promise<T>` return-type annotations to async functions. Either omit the annotation (TS infers global Promise from `async`) or use a separate type alias. Future plans 27-03..27-07 should pre-check this.
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-03 — all 3 modtype-bepinex files resolved fork-side (HEAD on every region). 17 conflict regions across the extension; 16 were cosmetic single-line vs wrapped formatting. One merge-driver duplicate-import artefact in `bepInExDownloader.ts` region 1 — v2.0.0 side re-imported `IBepInExGameConfig, INexusDownloadInfo` from `./types` despite the post-conflict body already containing the same import on the next line. HEAD was the only non-duplicate resolution. Bluebird-Promise trap not encountered (none of the 3 files import `Promise from "bluebird"`). Linux platform-conditional `process.platform === "win32" ? "win_" : "linux_"` in common.ts:54-58 lives outside any conflict region — survived the merge untouched.
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 syntax footnote — `pnpm typecheck -F <pkg>` recurses into the full workspace dependency graph; use `pnpm --filter <pkg> typecheck` for single-workspace-scoped runs. Confirmed working for `modtype-bepinex` in plan 27-03; same form used in plan 27-02 for `gamebryo-plugin-management`.
- [Phase ?]: Plan 27-04 collections — kept HEAD on all 13 conflict regions across 6 files (9 cosmetic, 2 fork-side toggle gates, 4 merge-driver artefacts)
- [Phase ?]: Plan 27-04 collections — fork-side toggle gates preserved: excludePluginRules and skipPluginRules wrapped in isGamebryoGame() ternaries; HEAD wins UX correctness
- [Phase ?]: Plan 27-04 collections — bluebird-Promise trap pre-checked clean: collections/src/index.ts imports Bluebird as named identifier, not Promise alias; no annotations touched
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-05 game-baldursgate3 — kept HEAD on all 41 conflict regions across 7 files (35 cosmetic single/double-quote, 4 merge-driver artefacts, 2 fork-side substantive preservations). All 4 divine error classes preserved (gate 10 count = 4 throughout). Bluebird-Promise trap pre-checked clean (none of the 7 files import Promise from bluebird).
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-05 — fork-side substantive preservations: divineWrapper.ts ConcurrencyLimiter retry filter fails fast on 4 deterministic error classes (vs upstream's 1) per inline comment; loadOrder.ts pak-loop catch handler uses `return await cache.getCacheEntry(...)` so try/catch sees rejections (without the await catch is dead code) plus stable notification id `bg3-divine-missing` so parallel pak failures collapse into one notification.
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 BG3 deviation — game-baldursgate3 has no per-extension tsconfig.json AND no `typecheck` script. Bare `pnpm exec tsc --noEmit <files>` surfaces 40+ pre-existing TS2305 errors from vortex-api workspace shim resolution (unrelated to resolution work). Routed to plan-permitted alternative: `pnpm run build` (rolldown bundler — refuses syntax/resolution errors at bundle time). Build succeeded after seventh commit. Build-as-typecheck has acknowledged trade-off (catches syntax + resolution but not all TS errors); acceptable for plans where every conflict region is cosmetic-quote / artefact-import / non-type-relevant string change.
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-06 game-morrowind — kept HEAD on both conflict regions in migrations.js (cosmetic single/double-quote in `require` block + cosmetic arg-wrapping in `walk()` call + catch block). Gate 11 (Morrowind migrate103 warning preservation, count ≥1) clean before AND after — count = 1 throughout. Single-file extension cleared in one atomic commit (`75e4eff59`). 23/25 Phase 27 files done (92%).
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 morrowind deviation — game-morrowind has no `typecheck` script and the file is `.js` (CommonJS). Plan offered `pnpm -F game-morrowind build` (rolldown) or `pnpm exec tsc --noEmit --allowJs --checkJs=false`. Routed to a third equivalent: `node --check <file>` — same syntax-gate signal, lighter weight. Acknowledged trade-off (syntax only, not type errors), acceptable because every conflict region was cosmetic and the file is plain `.js` with no type annotations. Future `.js` per-extension typecheck routes can use `node --check` as the lightest equivalent.
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 footnote — bluebird-Promise trap is a no-op for `.js` CommonJS files. The trap targets ES-imported `Promise from "bluebird"` shadow; `migrations.js` uses `require()` and global `Promise.resolve()` only. Recorded for completeness in case a future plan migrates the file to TS.
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-07 game-witcher3 — kept HEAD on all 3 conflict regions across 2 files (2 in installers.ts, 1 in index.ts). All cosmetic — single/double-quote + oxfmt arg-wrapping (one-per-line with trailing comma at print-width=80 vs upstream pre-oxfmt inlined shape). 25/25 Phase 27 files done (100%). Bluebird-Promise trap pre-checked clean — `index.ts` imports `Bluebird` as a named identifier (not `Promise from "bluebird"`); `installers.ts` does not import bluebird at all. No annotations touched.
- [Phase 27-gamebryo-per-game-extensions]: D-27-04 witcher3 deviation — game-witcher3 has no per-extension `tsconfig.json` (bare `pnpm exec tsc --noEmit -p extensions/games/game-witcher3` returns TS5057) AND no `typecheck` script in package.json. Routed to plan-permitted alternative `pnpm run build` (rolldown bundler — refuses syntax/resolution errors at bundle time). Same routing as BG3 plan 27-05; same trade-off (catches syntax + resolution but not all TS errors), acceptable for plans where every conflict region is cosmetic.
- [Phase 27-gamebryo-per-game-extensions]: Plan 27-08 done-gate — all six D-27-05 checks complete. Checks 1/2/3/5/6 green. Check 4 (full-repo `pnpm typecheck`) surfaced 15 pre-existing TS1185 conflict-marker errors in `src/shared/src/{errors.ts, errors.test.ts, telemetry/spans.ts}` from base commit `138da2249 merge upstream v2.0.0 (conflicts)` — verified pre-existing on `fork/sync/upstream-v2.0.0` (the merge base) via `git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.0 -- src/shared/`. Phase 28 territory; non-blocking per deviation_handling rule. Force-with-lease push landed: pre `f15bbabb8` → post `1b7427dba` on `fork/sync/upstream-v2.0.0`. HTTPS via configured `fork` remote worked first try; SSH inline URL fallback not needed.
- [Phase 27-gamebryo-per-game-extensions]: Phase 28 readiness signal — Check 4 of the done-gate also functions as a forward-looking inventory: `src/shared/src/{errors.ts, errors.test.ts, telemetry/spans.ts}` are 3 of the renderer/main spine conflict files Phase 28 will need to resolve. The 15 TS1185 line-number positions in those three files give a cheap pre-cost on conflict region density.

### Research Context (v7.0)

Key findings from research/SUMMARY.md affecting Phase 18–23 execution:

- v7.0 is wiring + string cleanup on top of the v1.0–v6.0 infrastructure — no new subsystems or dependencies
- Primary crash: `todos.tsx` undefined `instPath`/`dlPath` before `GetVolumePathName` — wrap with undefined guard
- Primary wrong dialog: `stagingDirectory.ts` partition-exists check uses Windows-only error code — replace with `statAsync`
- String changes must be NEW conditional branches, never edits to existing `t("...")` literals — silently breaks Windows wording and stales locale caches
- `getDriveList.ts` hardcoded `"C:"` fallback on lines 23/44 — replace with `"/"` on Linux
- Steam cache retry: 2s delay + `reloadGames()` call in firststeps_dashlet game-detection step
- Phase 22 targets: `onboarding_dashlet/Dashlet.tsx` (overlay clamp) + `stylesheets/vortex/dialogs.scss` (modal max-height + flex-shrink)
- Phase 23 targets: `extensions/documentation/src/index.tsx` (WIKI_TOPICS + handler) + `opn()` failure fallback

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| #          | Description                                                               | Date       | Commit    | Directory                                                                                                           |
| ---------- | ------------------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| 260401-m5m | fix blank game version in mismatch dialog on Linux                        | 2026-04-01 | e3d6638   | [260401-m5m-fix-blank-game-version-in-mismatch-dialo](./quick/260401-m5m-fix-blank-game-version-in-mismatch-dialo/) |
| 260401-mvp | normalize backslashes in FOMOD copy source/destination paths              | 2026-04-01 | 926255819 | [260401-mvp-normalize-backslashes-in-fomod-copy-sour](./quick/260401-mvp-normalize-backslashes-in-fomod-copy-sour/) |
| 260401-oz3 | case-folding path resolver in LinkingDeployment for Linux                 | 2026-04-01 | 32a9b021b | [260401-oz3-case-folding-path-resolver-in-linkingdep](./quick/260401-oz3-case-folding-path-resolver-in-linkingdep/) |
| 260401-scf | FOMOD case-sensitivity in InstallManager.extractArchive                   | 2026-04-01 | 6e56ba5bf | [260401-scf-fix-fomod-case-sensitivity-error-in-inst](./quick/260401-scf-fix-fomod-case-sensitivity-error-in-inst/) |
| 260402-1b1 | Wine-era deployment manifest detection in loadActivation                  | 2026-04-02 | 5b2420f   | [260402-1b1-implement-wine-era-deployment-manifest-d](./quick/260402-1b1-implement-wine-era-deployment-manifest-d/) |
| 260402-iko | fix hardlink undeploy orphan when manifest missing                        | 2026-04-02 | ca5fffb   | [260402-iko-fix-hardlink-undeploy-orphan-when-manife](./quick/260402-iko-fix-hardlink-undeploy-orphan-when-manife/) |
| 260407-grv | Fix NXM download bugs: cli.ts argv slice and no-sandbox propagation       | 2026-04-07 | d9986f6   | [260407-grv-fix-nxm-download-bug-cli-ts-argv-slice-a](./quick/260407-grv-fix-nxm-download-bug-cli-ts-argv-slice-a/) |
| 260407-icu | Remove Linux-disabled guard from NXM toggle in Settings.tsx               | 2026-04-07 | b3c474bcc | [260407-icu-remove-the-linux-disabled-guard-from-the](./quick/260407-icu-remove-the-linux-disabled-guard-from-the/) |
| 260407-iv0 | Patch Firefox profiles with nxm expose pref during Linux NXM registration | 2026-04-07 | 35ba35ccb | [260407-iv0-patch-firefox-profiles-with-nxm-expose-p](./quick/260407-iv0-patch-firefox-profiles-with-nxm-expose-p/) |
| 260407-h9r | Clear Firefox handlers.json nxm entry on registration                     | 2026-04-07 | e08518b20 | —                                                                                                                   |
| 260408-haq | Set deb/AppImage version to major.minor.YYYYMMDDHHMM                      | 2026-04-08 | 53033d808 | [260408-haq-set-deb-package-version-to-major-minor-f](./quick/260408-haq-set-deb-package-version-to-major-minor-f/) |
| 260408-mvp | Speed up GH Actions builds: rust cache, workflow_run chain, paths-ignore  | 2026-04-08 | 30436ef73 | [260408-mvp-speed-up-gh-actions-builds-rust-cache-wo](./quick/260408-mvp-speed-up-gh-actions-builds-rust-cache-wo/) |
| 260408-ms8 | Update planning docs with current state after v4.0 backlog analysis       | 2026-04-08 | —         | [260408-ms8-update-planning-docs-with-current-state-](./quick/260408-ms8-update-planning-docs-with-current-state-/) |
| 260417-kth | fix unused IDiscoveryState import in NoGameDashlet.tsx                    | 2026-04-17 | 604daafed | [260417-kth-fix-unused-idiscoverystate-import-in-nog](./quick/260417-kth-fix-unused-idiscoverystate-import-in-nog/) |

## Session Continuity

Last session: 2026-05-22T07:30:00Z
Stopped at: Phase 30 complete; v8.0 milestone done
Resume file: None
