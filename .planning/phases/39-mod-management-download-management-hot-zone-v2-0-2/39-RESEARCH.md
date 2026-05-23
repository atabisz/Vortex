# Phase 39: Mod-management + download-management hot zone (v2.0.2) — Research

**Researched:** 2026-05-23
**Domain:** Conflict resolution under playbook-invariant pressure — 13 files, 46 regions in `src/renderer/src/extensions/{mod_management,download_management}/`
**Requirement IDs:** SYNC-39a, SYNC-39b
**Status:** Ready for planning

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-39-01:** Leaf-first within each bucket. Sequence: leaf-tier (`util/*`, isolated leaf modules) → mid-tier (action/reducer/event/view files) → playbook-heavy (`InstallManager.ts`, `LinkingDeployment.ts`) → barrel last (`download_management/index.ts`).
- **D-39-02:** Bucket ordering: download_management first (no playbook §6/§7/140a57217 surface — lower risk; settles types and barrel exports that mod_management may reference); then mod_management.
- **D-39-03:** Default = hand-resolve every region. Per-region stance = fork-wins for any line touching playbook §6/§7/140a57217/Linux-platform branches; upstream-wins for new feature scaffolding outside playbook surface; otherwise pick the side yielding the smaller, less-invasive diff against fork/master.
- **D-39-04:** No blanket `git checkout --ours` / `--theirs` across the bucket. Hand-resolve.
- **D-39-05:** Bluebird-trap audit — apply to every async fn touched in resolution. If the file imports bluebird `Promise` and upstream changes a `:Promise<void>` annotation, do NOT take the upstream annotation.
- **D-39-06:** Re-use `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` (copy into this phase's `scripts/` dir). Run after every per-file resolution commit.
- **D-39-07:** Plan-phase researcher must inspect v2.0.2 diff for new playbook-touching call sites. Extend harness as gate 8+ if any found.
- **D-39-08:** D-26-03a invariant: `LinkingDeployment.ts` is the sole 140a57217 host. No second-file gate.
- **D-39-09:** Typecheck after every file resolution commit. Lint deferred to Phase 42.
- **D-39-10:** Run `grep-checkpoint.sh` after every per-file commit in mod_management bucket. Download_management commits run a final pass after the last commit for safety.
- **D-39-11:** One commit per resolved file. Title format `resolve(mod-mgmt-v2.0.2): <file> — <one-line stance>` or `resolve(dl-mgmt-v2.0.2): <file> — <one-line stance>`.
- **D-39-12:** Commit body lists: bucket, region count + per-region stance summary, playbook gates affected/preserved, `grep-checkpoint.sh` exit status (mod_management), `pnpm typecheck` exit status, bluebird-trap audit result.
- **D-39-13:** No `--no-verify`.
- **D-39-14:** Snapshot 140a57217 sites pre-resolution → resolve → re-grep post-resolution → read `externalChanges()` method body in `LinkingDeployment.ts`.
- **D-39-15:** Continue on `v8.2/sync-upstream-v2.0.2`. No new branch.
- **D-39-16:** Push to `fork/sync/upstream-v2.0.2` at phase end with `--force-with-lease=sync/upstream-v2.0.2:<recorded-base>`. Lease pin recorded by plan 39-01 pre-flight. Inline SSH URL per `feedback_git_push_ssh.md`.
- **D-39-17:** 4 ROADMAP-named files are clean — confirm-and-skip: `mod_management/{index,stagingDirectory,util/deploy,views/ModList}.{ts,tsx}`.
- **D-39-18:** download_management bucket (7 files, 21 regions) is the v8.2-specific addition. All 7 in scope.

### Claude's Discretion

- Per-conflict-region stance per file.
- Whether `download_management/index.ts` (12 regions) needs per-section sub-commits.
- Resolution order WITHIN leaf-tier and mid-tier.

### Deferred Ideas (OUT OF SCOPE)

- Refactoring inside any of the 13 conflict files.
- Promoting `grep-checkpoint.sh` to `release-linux.yml` CI.
- Lint pass on resolved files (Phase 42).
- TS1185 source-marker errors in `src/shared/src/types/{ipc,preload}.ts` (Phase 41).
- Refactoring `mod_management/util/externalChanges.ts`.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                     | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SYNC-39a | Mod-management + download-management hot zone resolved with every playbook §6/§7/externalChanges site preserved | §A confirms exact conflict surface (13 files, 46 regions). §C enumerates every playbook call site. §E confirms harness re-use (no new gates needed). §A.mod_management.InstallManager documents the merge gaps needing manual restoration.                                                                                                                                                                                                                                                                                 |
| SYNC-39b | R1 dead-code carry-forward — confirm v8.1's Wave-1 DownloadManager/DownloadObserver deletion remains intact     | §H Risk R5 clarifies: the v8.1 deletion (commit `e2127cecb`) landed on `v8.1/config-bucket` but did NOT propagate to `master` (855fb3e1a). `DownloadManager.ts` is present on `v8.2/sync-upstream-v2.0.2` HEAD as the upstream v2.0.2 version (2643 lines, no conflict markers, identical to upstream `314ca807c`). SYNC-39b is satisfied by confirming the current DownloadManager.ts IS the v2.0.2 upstream version (not a resurrection of dead code). DownloadObserver.ts has 3 conflict markers — resolve per D-39-03. |

</phase_requirements>

---

## Summary

Phase 39 is a pure conflict-resolution phase with no new feature work. 13 files, 46 regions split across two buckets: download_management (7 files, 21 regions, first; no playbook surface) and mod_management (6 files, 25 regions, second; heavy playbook surface). v2.0.2's conflict footprint is significantly smaller than v8.1's Phase 32 (46 regions vs 97 regions).

The main risks are concentrated in three areas. First, `LinkingDeployment.ts` region 1 removes the `resolvePathCase` import and region 5 replaces `resolvePathCase(dataPath, ...)` with a plain path join — both are the critical 140a57217 invariant, fork wins. Second, `InstallManager.ts` has two merge gaps (not conflict markers) where `getDownloadFreeSlots` function and `DynamicDownloadConcurrencyLimiter` class were dropped by the merge driver — the executor must manually restore them from the upstream clean version. Third, SYNC-39b's premise needs calibration: the v8.1 deletion never landed on master, so DownloadManager.ts on this branch IS the upstream v2.0.2 version (correct, wanted).

The v8.0 Phase 26 grep-checkpoint harness (7 gates) covers all playbook invariants and can be re-used verbatim — no new gates needed for v2.0.2.

**Primary recommendation:** Resolve download_management bucket first (leaf-to-barrel), then mod_management (leaf-to-playbook-heavy), running harness after every mod_management commit. Manually restore the two merge-gap items in `InstallManager.ts` alongside or before region 3.

---

## Section A — Per-file conflict-region inventory

Verified command for all 13 files (run from repo root on `v8.2/sync-upstream-v2.0.2` HEAD `0d8426853`):

```bash
grep -c '^<<<<<<< ' <file>
```

All counts confirmed matching 39-CONTEXT.md's stated surface.

---

### A.1 download_management bucket (7 files, 21 regions)

#### A.1.1 `download_management/actions/state.ts` — 1 region

| Region | Lines | Subject                                     | HEAD stance                           | Upstream stance                                                            | Playbook surface? | Recommendation                                                                                             |
| ------ | ----- | ------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| R1     | 28–39 | `downloadProgress` action creator signature | 4-param `(id, received, total, urls)` | 5-param `(id, received, total, chunks, urls)` adds `IChunk[]` chunks param | No                | **upstream-wins** — new `chunks` parameter is a v2.0.2 download-manager feature; callers updated elsewhere |

#### A.1.2 `download_management/reducers/state.ts` — 1 region

| Region | Lines   | Subject                                     | HEAD stance                         | Upstream stance                    | Playbook surface? | Recommendation                                                                 |
| ------ | ------- | ------------------------------------------- | ----------------------------------- | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| R1     | 179–183 | `setDownloadSpeed` speedHistory array check | `Array.isArray(state.speedHistory)` | `state.speedHistory !== undefined` | No                | **upstream-wins** — simpler/more lenient check; smaller diff; no Linux surface |

#### A.1.3 `download_management/types/IDownloadsAPIExtension.ts` — 1 region

| Region | Lines | Subject                        | HEAD stance                                         | Upstream stance                                            | Playbook surface? | Recommendation                                                                                                                     |
| ------ | ----- | ------------------------------ | --------------------------------------------------- | ---------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 1–5   | `RedownloadMode` import source | `import type { RedownloadMode } from "./IDownload"` | `import type { RedownloadMode } from "../DownloadManager"` | No                | **fork-wins** — HEAD imports from local type file; upstream re-imports from DownloadManager which is the pre-restructured location |

#### A.1.4 `download_management/util/extendApi.ts` — 1 region

| Region | Lines | Subject                        | HEAD stance                                                | Upstream stance                                            | Playbook surface? | Recommendation                                                                                                     |
| ------ | ----- | ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| R1     | 2–6   | `RedownloadMode` import source | `import type { RedownloadMode } from "../types/IDownload"` | `import type { RedownloadMode } from "../DownloadManager"` | No                | **fork-wins** — same as IDownloadsAPIExtension.ts: prefer local type; DownloadManager source is the older location |

#### A.1.5 `download_management/DownloadObserver.ts` — 3 regions

| Region | Lines   | Subject                                           | HEAD stance                       | Upstream stance                                                                            | Playbook surface? | Recommendation                                                                                                               |
| ------ | ------- | ------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R1     | 198–206 | `parentCollectionId` extraction on download error | absent                            | Adds `parentCollectionId` + `modCollectionId` extraction from download state for analytics | No                | **upstream-wins** — new analytics tracking for collection downloads; no Linux surface                                        |
| R2     | 578–584 | `parentCollectionId` on download complete         | absent                            | Same `parentCollectionId` + `modCollectionId` for completion analytics                     | No                | **upstream-wins** — same pattern as R1                                                                                       |
| R3     | 891–895 | `pauseDownload` call signature                    | `pauseDownload(downloadId, true)` | `pauseDownload(downloadId, true, unfinishedChunks)` adds `unfinishedChunks` arg            | No                | **upstream-wins** — passes unfinished chunks on pause for resumable downloads; matches v2.0.2 IPC adapter; smaller diff side |

#### A.1.6 `download_management/views/DownloadView.tsx` — 1 region

| Region | Lines | Subject                        | HEAD stance                                              | Upstream stance    | Playbook surface? | Recommendation                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ----- | ------------------------------ | -------------------------------------------------------- | ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 1–6   | `DownloadIsHTML` import source | `import { DownloadIsHTML } from "@vortex/shared/errors"` | absent (no import) | No                | **fork-wins** — HEAD imports `DownloadIsHTML` from `@vortex/shared/errors`; this is the fork's preferred error type location. Upstream removes it because upstream doesn't use this import here. However `DownloadIsHTML` is used downstream in DownloadView — verify usage at time of resolution. If DownloadView's fork version uses it, keep; if not used, take upstream. |

**Note on DownloadView.tsx R1:** Verify with `grep -n "DownloadIsHTML" DownloadView.tsx` before resolving. If used, fork wins; if the usage was also removed by upstream, take upstream.

#### A.1.7 `download_management/index.ts` — 12 regions

This is the largest single file (1428 lines, 12 conflict regions). Executor may split into themed sub-commits per Claude's Discretion in D-39-18.

| Region | Lines     | Subject                                                                | HEAD stance                                                                                          | Upstream stance                                                                                                                                                                                                      | Playbook surface? | Recommendation                                                                                                                                                                                             |
| ------ | --------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 16–20     | `fileMD5` vs `getApplication` import                                   | `import { fileMD5 } from "../../util/checksum"`                                                      | `import { getApplication } from "../../util/application"`                                                                                                                                                            | No                | **needs both sides** — HEAD has `fileMD5`, upstream has `getApplication`. R8 uses `fileMD5`; R12 uses `getApplication`. Hand-merge: keep both imports                                                      |
| R2     | 31–39     | Util imports: `sum`, `NXMUrl`, `ensureLoggedIn`, `convertNXMIdReverse` | HEAD misses `sum`, `NXMUrl`, `ensureLoggedIn`, `convertNXMIdReverse`                                 | upstream adds these imports                                                                                                                                                                                          | No                | **upstream-wins** — additive; new util functions used by v2.0.2 features in R12                                                                                                                            |
| R3     | 58–61     | `IProtocolHandlers`/`IResolvedURL` type imports                        | absent                                                                                               | adds `import type { IProtocolHandlers, IResolvedURL }`                                                                                                                                                               | No                | **upstream-wins** — new types needed by R4                                                                                                                                                                 |
| R4     | 118–130   | `ProtocolHandler` type alias + `IExtensionContextExt` interface        | absent                                                                                               | adds both                                                                                                                                                                                                            | No                | **upstream-wins** — new protocol handler extension point                                                                                                                                                   |
| R5     | 186–190   | `downloadProgress` call signature                                      | `downloadProgress(dlId, stats.size, stats.size, undefined)`                                          | `downloadProgress(dlId, stats.size, stats.size, [], undefined)`                                                                                                                                                      | No                | **upstream-wins** — passes empty chunks array to match updated action signature from actions/state.ts R1                                                                                                   |
| R6     | 289–293   | `downloadProgress` in `repairActions`                                  | same as R5 old sig                                                                                   | same as R5 new sig                                                                                                                                                                                                   | No                | **upstream-wins** — same pattern as R5                                                                                                                                                                     |
| R7     | 533–537   | `downloadProgress` in `addLocalDownload` flow                          | same as R5 old sig                                                                                   | same as R5 new sig                                                                                                                                                                                                   | No                | **upstream-wins** — same pattern                                                                                                                                                                           |
| R8     | 857–861   | `fileMD5` call style                                                   | `fileMD5(filePath)` returns Promise directly                                                         | `toPromise<string>((cb) => fileMD5(filePath, cb, () => {}))` callback style                                                                                                                                          | No                | **fork-wins** — HEAD's `fileMD5` is the fork's updated async version from `@vortex/shared`; upstream calls the older callback style. Verify which `fileMD5` API is present on this fork before committing. |
| R9     | 900–939   | `processInterruptedDownloads` function                                 | absent                                                                                               | adds new function handling `init/started/pending` state downloads                                                                                                                                                    | No                | **upstream-wins** — new function; no Linux surface                                                                                                                                                         |
| R10    | 1014–1020 | `registerDownloadProtocol` registration                                | absent                                                                                               | adds `context.registerDownloadProtocol` hook binding                                                                                                                                                                 | No                | **upstream-wins** — new extension point                                                                                                                                                                    |
| R11    | 1134–1138 | `DownloadManagerImpl` + `observeImpl` lazy-requires                    | absent                                                                                               | `require("./DownloadManager").default` + `require("./DownloadObserver").default`                                                                                                                                     | No                | **upstream-wins** — lazy-require pattern for DownloadManager and DownloadObserver; needed by R12                                                                                                           |
| R12    | 1305–1425 | `once()` initialization block                                          | HEAD: simple 3-call init (`checkForUnfinalized`, `removeDownloadsWithoutFile`, `processCommandline`) | Upstream: large block adds `powerSaveBlocker`, `speedsDebouncer`, `maxWorkersDebouncer`, full `DownloadManagerImpl` instantiation, protocol handlers, `processInterruptedDownloads`, `get-download-free-slots` event | No                | **upstream-wins** — comprehensive v2.0.2 download initialization; HEAD's simpler init is superseded. Take upstream wholesale for this region.                                                              |

**index.ts sub-commit suggestion (Claude's Discretion):** Split into 2 commits — (A) import regions R1–R4 + type/interface additions; (B) functional regions R5–R12 (downloadProgress sig updates + new init block). Both within the "no playbook surface" designation.

---

### A.2 mod_management bucket (6 files, 25 regions)

#### A.2.1 `mod_management/util/activationStore.ts` — 2 regions

| Region | Lines   | Subject                   | HEAD stance                                                                                                                                  | Upstream stance                                                      | Playbook surface?                          | Recommendation                                                                                                                                                                                                                |
| ------ | ------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 187–205 | Function at this position | `isWineEraManifest()` — Linux wine-era manifest detection (platform guard `process.platform !== "linux"`)                                    | `readManifestFile()` — duplicate of function already at line 249     | **Yes — Linux platform guard**             | **fork-wins** — HEAD's `isWineEraManifest` is a Linux-specific fix (commit `6f47dbf2b`). Upstream inserts a duplicate `readManifestFile` here (already defined at line 249). Keep `isWineEraManifest`; discard the duplicate. |
| R2     | 497–515 | `loadActivation` branch   | `if (isWineEraManifest(tagObject) && tagObject.files.length > 0) { queryPurgeWineEra(...) } else if (tagObject.instance !== instanceId ...)` | `if (tagObject.instance !== instanceId ...)` — drops wine-era branch | **Yes — Linux wine-era manifest handling** | **fork-wins** — keeps the wine-era purge dialog path. Required for Linux users upgrading from Wine-based Vortex.                                                                                                              |

#### A.2.2 `mod_management/util/externalChanges.ts` — 4 regions

| Region | Lines   | Subject                             | HEAD stance                                                                            | Upstream stance                                                                                                          | Playbook surface? | Recommendation                                                                                                                                                                            |
| ------ | ------- | ----------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 5–8     | `log` import                        | absent                                                                                 | `import { log } from "../../../logging"`                                                                                 | No                | **upstream-wins** — additive import needed by R4                                                                                                                                          |
| R2     | 15–18   | `IState` type import                | absent                                                                                 | `import type { IState } from "../../../types/IState"`                                                                    | No                | **upstream-wins** — additive type import needed by R4                                                                                                                                     |
| R3     | 184–212 | `classifyExternalChange` export     | absent                                                                                 | adds `ExternalChangeBucket` type alias + `classifyExternalChange()` pure function                                        | No                | **upstream-wins** — new testable pure function for change classification; no Linux surface                                                                                                |
| R4     | 295–334 | `handleExternalChanges` inner logic | HEAD: `isInstallingCollection` + inline reduce with `merged/rest/autoResolved` buckets | Upstream: `classifyExternalChange()` call per change using the new pure function + `count` variable + `log("info", ...)` | No                | **upstream-wins** — refactors to use new `classifyExternalChange` helper. No playbook calls in either side (this is `util/externalChanges.ts`, not `LinkingDeployment.ts` — per D-39-08). |

**Note on externalChanges.ts:** No playbook calls here. D-39-08 confirms `resolvePathCase` in the `externalChanges()` METHOD lives in `LinkingDeployment.ts`, not this file. Confirm-and-continue.

#### A.2.3 `mod_management/eventHandlers.ts` — 2 regions

| Region | Lines   | Subject                              | HEAD stance                                                                          | Upstream stance                                     | Playbook surface? | Recommendation                                                                                                                                                                                                                                 |
| ------ | ------- | ------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 6–9     | `turbowalk` import                   | `import turbowalk from "turbowalk"`                                                  | absent                                              | No                | **fork-wins** — HEAD keeps turbowalk import; upstream removes it. Verify if turbowalk is still used after line 9 before committing (if no callsite, upstream wins).                                                                            |
| R2     | 934–941 | Post-remove `markRecentRemoval` call | `installManager.markRecentRemoval(mod.installationPath)` after `did-remove-mod` emit | absent — upstream omits the call + trailing comment | No                | **fork-wins** — HEAD's `markRecentRemoval` call ensures the deployment flow auto-resolves expected external changes from mod removal. This is a fork-local call from Phase 34/earlier that prevents false "external changes" dialogs. Keep it. |

**Note on eventHandlers.ts R1:** Run `grep -n "turbowalk" eventHandlers.ts` before resolution. If turbowalk has no other callsite, upstream wins on R1. If it's called elsewhere in the file, fork wins.

#### A.2.4 `mod_management/views/Settings.tsx` — 2 regions

| Region | Lines | Subject                                    | HEAD stance                                                          | Upstream stance | Playbook surface?       | Recommendation                                                                                             |
| ------ | ----- | ------------------------------------------ | -------------------------------------------------------------------- | --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| R1     | 4–7   | `PromiseBB` bluebird import                | `import PromiseBB from "bluebird"`                                   | absent          | **Yes — bluebird trap** | **fork-wins** — `PromiseBB.resolve()` is used at line 556. Without this import the file breaks at runtime. |
| R2     | 73–76 | `resolveExternalChangesBeforePurge` import | `import { resolveExternalChangesBeforePurge } from "../util/deploy"` | absent          | No                      | **fork-wins** — function called at line 558 in `querySwitch`. Without this import the file breaks.         |

**Bluebird audit:** Settings.tsx imports `PromiseBB from "bluebird"` (runtime binding, not `import type`). Methods `purgeActivation()` (line 801) and `querySwitch()` (line 822) return `: Promise<void>` — this is the GLOBAL Promise, not PromiseBB, so TS1064 does NOT fire. The `PromiseBB` alias is used exclusively at line 556 (`PromiseBB.resolve(...)`). Clean — fork must keep the import, no annotation risk.

#### A.2.5 `mod_management/LinkingDeployment.ts` — 5 regions

**140a57217 pre-resolution snapshot:**

```bash
grep -n "resolvePathCase(dataPath," src/renderer/src/extensions/mod_management/LinkingDeployment.ts
# Expected: lines 536, 763, 820 (all on fork HEAD side of conflict markers)
```

| Region | Lines   | Subject                                          | HEAD stance                                                                                                 | Upstream stance                                                                                   | Playbook surface?                             | Recommendation                                                                                                                                                                                                  |
| ------ | ------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 17–20   | `resolvePathCase` import                         | `import { resolvePathCase } from "../../util/resolvePathCase"`                                              | absent                                                                                            | **Yes — 140a57217 import**                    | **fork-wins (CRITICAL)** — upstream removes the import; fork must keep it. R5 depends on this import.                                                                                                           |
| R2     | 220–223 | Error handling: `errorCodes.add()`               | `errorCodes.add(getErrorCode(err) ?? "UNKNOWN")`                                                            | absent                                                                                            | No                                            | **fork-wins** — fork tracks error codes for better diagnostics. Smaller diff side.                                                                                                                              |
| R3     | 238–241 | Same `errorCodes.add()` in `sourceChanged` loop  | `errorCodes.add(getErrorCode(err) ?? "UNKNOWN")`                                                            | absent                                                                                            | No                                            | **fork-wins** — same as R2                                                                                                                                                                                      |
| R4     | 259–262 | Same `errorCodes.add()` in `contentChanged` loop | `errorCodes.add(getErrorCode(err) ?? "UNKNOWN")`                                                            | absent                                                                                            | No                                            | **fork-wins** — same pattern                                                                                                                                                                                    |
| R5     | 525–544 | `externalChanges` file-path resolution           | `async (fileEntry)` + builds `relDataPath` with target + `resolvePathCase(dataPath, relDataPath, dirCache)` | `(fileEntry)` + inline path join `[dataPath, fileEntry.target, fileEntry.relPath].join(path.sep)` | **Yes — 140a57217 resolvePathCase(dataPath)** | **fork-wins (CRITICAL)** — upstream reverts the 140a57217 fix. Fork's `resolvePathCase(dataPath, relDataPath, dirCache)` prevents spurious "External Changes" dialogs on case-sensitive filesystems. MUST keep. |

**140a57217 post-resolution verification:**

```bash
grep -n "resolvePathCase(dataPath," src/renderer/src/extensions/mod_management/LinkingDeployment.ts
# Must see: lines ~536, ~763, ~820 (all three call sites intact)
# Also read the externalChanges() method body to confirm the call at ~536 survived
```

#### A.2.6 `mod_management/InstallManager.ts` — 10 regions + 2 merge gaps

**IMPORTANT — Two merge gaps not marked as conflicts:**

The git merge driver dropped two upstream-only additions that are NOT surrounded by conflict markers:

**Merge gap A (line ~207):** `getDownloadFreeSlots` function (8 lines). The comment `// Function to get current download manager free slots` is present at line 207, but the function body is missing. Must be manually inserted from upstream clean (`git show a402ee6b4:src/renderer/src/extensions/mod_management/InstallManager.ts | sed -n '193,201p'`).

**Merge gap B (line ~208):** `DynamicDownloadConcurrencyLimiter` class (~45 lines). This class is referenced in conflict regions 3, 6, 7, 8, 9 and in the `mDependencyDownloadsLimit` property. It's defined in upstream clean at lines 202–246. The class must be manually inserted between the `getDownloadFreeSlots` function and the `type ReplaceChoice` line.

**Merge gap C (line ~490):** `private mDependencyDownloadsLimit: DynamicDownloadConcurrencyLimiter;` field declaration missing from the `InstallManager` class. Must be inserted between `mDependencyInstalls` and `mNotificationAggregator` fields.

All three items are upstream-only additions with no Linux surface — take verbatim from upstream clean version `a402ee6b4`.

**Playbook pre-resolution snapshot:**

```bash
grep -n "stagingDirHasFiles\|normalizeBackslashPaths\|mergeCaseConflictingDirs\|resolvePathCase(tempPath" \
  src/renderer/src/extensions/mod_management/InstallManager.ts
# Expected:
# stagingDirHasFiles: line 181 (import), line 6311 (call in doDownload)
# normalizeBackslashPaths: lines 179 (import), 1045, 3633 (2 call sites)
# mergeCaseConflictingDirs: lines 176 (import), 1046, 3634 (2 call sites)
# resolvePathCase(tempPath: line 7281 (1 call site in extractArchive)
```

| Region | Lines     | Subject                                                     | HEAD stance                                                                                  | Upstream stance                                                                                      | Playbook surface?               | Recommendation                                                                                                                                                                        |
| ------ | --------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | 1–7       | File-top AGENTS comment                                     | AGENTS-COLLECTIONS.md JSDoc block                                                            | absent                                                                                               | No                              | **fork-wins** — keep the AGENTS-COLLECTIONS.md documentation comment                                                                                                                  |
| R2     | 132–135   | `AlreadyDownloaded`/`DownloadIsHTML` import                 | absent (HEAD uses `@vortex/shared/errors` at line 18)                                        | `import { AlreadyDownloaded, DownloadIsHTML } from "../download_management/DownloadManager"`         | No                              | **fork-wins** — HEAD already imports these from `@vortex/shared/errors` (line 18). The upstream re-adds the import from DownloadManager which is the old location. Keep empty (HEAD). |
| R3     | 605–609   | `cancelDependencyInstalls()` limiter reset                  | absent                                                                                       | `this.mDependencyDownloadsLimit = new DynamicDownloadConcurrencyLimiter(api)`                        | No (depends on merge gap items) | **upstream-wins** — adds reset of the new download concurrency limiter. Requires merge gaps A/B/C to be inserted first so the class and property exist.                               |
| R4     | 5159–5171 | `downloadURL` call — single-mod no-nexus path               | `this.downloadURL(api, lookupResult, wasCanceled, referenceTag, fileName)`                   | adds `undefined, parentCollectionId` args                                                            | No                              | **upstream-wins** — adds `parentCollectionId` propagation for collection download tracking                                                                                            |
| R5     | 5266–5278 | `downloadURL` call — fallback path                          | same as R4 without parentCollectionId                                                        | adds `fileName, parentCollectionId`                                                                  | No                              | **upstream-wins** — same parentCollectionId propagation                                                                                                                               |
| R6     | 5768–5812 | `queueDownload` function body                               | Direct `this.downloadDependencyAsync(...)` call without concurrency limiter                  | Wraps in `this.mDependencyDownloadsLimit.do<string>(() => { ... })` + adds `parentCollectionId` arg  | No (concurrency limiter)        | **upstream-wins** — adds download concurrency limiting; no playbook surface                                                                                                           |
| R7     | 5831–5896 | `isAlreadyDownloaded` error handling block                  | HEAD has outer `if (isAlreadyDownloaded) {` with full body                                   | Upstream has inner `if (isAlreadyDownloaded) {` indented inside `mDependencyDownloadsLimit.do` block | No                              | **upstream-wins** — structural change to fit within the limiter block from R6; logic content is equivalent                                                                            |
| R8     | 5902–5975 | `isNetworkError` handling + `resumeDownload` function start | HEAD: flat `if (isNetworkError) {...}` then `resumeDownload` as arrow fn                     | Upstream: nested inside `mDependencyDownloadsLimit.do` + extended `resumeDownload` body              | No                              | **upstream-wins** — restructured to work inside limiter; `resumeDownload` is also more complete in upstream (handles resolvedId/currentDownload lookup).                              |
| R9     | 5980–6122 | Remainder of `resumeDownload` + end of `queueDownload`      | HEAD: full standalone `resumeDownload` function + closing `};`                               | Upstream: continuation of nested `resumeDownload` inside limiter                                     | No                              | **upstream-wins** — take upstream closure/end of the restructured block                                                                                                               |
| R10    | 7317–7329 | `extractArchive` copy-error `copyAsyncWrap`                 | `if (!(await copyAsyncWrap(job.src, job.dst))) { copyFailures.add(job.src); }` (×2 branches) | `await copyAsyncWrap(job.src, job.dst)` without copyFailures tracking                                | No                              | **fork-wins** — HEAD tracks copy failures for `ArchiveBrokenError` detection. `copyFailures.size` is checked at line 7341. Removing this tracking breaks the staging integrity check. |

**Note on regions 6-9 as a unit:** These four regions are semantically one refactor — wrapping `queueDownload` and `resumeDownload` in the `mDependencyDownloadsLimit` concurrency limiter. The executor should resolve them in order as they form a single logical change. If taking upstream on R6, must take upstream on R7, R8, R9 as well or the indentation/closure won't balance.

---

## Section B — Confirm-and-skip verification (4 clean files)

Command run on `v8.2/sync-upstream-v2.0.2` HEAD `0d8426853`:

```bash
for f in \
  "src/renderer/src/extensions/mod_management/index.ts" \
  "src/renderer/src/extensions/mod_management/stagingDirectory.ts" \
  "src/renderer/src/extensions/mod_management/util/deploy.ts" \
  "src/renderer/src/extensions/mod_management/views/ModList.tsx"; do
  count=$(grep -c '^<<<<<<< ' "$f")
  echo "$count  $f"
done
```

**Output:**

```
0  src/renderer/src/extensions/mod_management/index.ts
0  src/renderer/src/extensions/mod_management/stagingDirectory.ts
0  src/renderer/src/extensions/mod_management/util/deploy.ts
0  src/renderer/src/extensions/mod_management/views/ModList.tsx
```

All four confirmed at zero conflict markers. These files are in scope per ROADMAP.md Phase 39 description but have no v2.0.2 conflicts. Per D-39-17: skip. No resolution commits needed. Plan-checker can use this output as confirmation.

---

## Section C — Playbook-surface call-site survey

All call sites verified by `grep -n` on working tree HEAD `0d8426853`. None of the 13 conflict files have playbook call sites that are INSIDE conflict markers (i.e., at risk of being eaten during resolution), with the exception of `LinkingDeployment.ts` regions 1 and 5 which are the 140a57217 sites.

### §6 stagingDirHasFiles — `InstallManager.ts`

```
181:import { stagingDirHasFiles } from "./util/stagingIntegrity";
6311:            const hasAnyFile = await stagingDirHasFiles(modStagingPath);
```

Both are in non-conflicted regions. The sentinel `util/stagingIntegrity.ts` exists. Gate 1 currently PASS.

### §7a normalizeBackslashPaths — `InstallManager.ts`

```
179:import { normalizeBackslashPaths } from "./util/normalizeBackslashPaths";
1045:        await normalizeBackslashPaths(tempPath);
3633:        await normalizeBackslashPaths(tempPath);
```

3 hits, all in non-conflicted regions. Gate 2 currently PASS.

### §7b mergeCaseConflictingDirs — `InstallManager.ts`

```
176:import { mergeCaseConflictingDirs } from "./util/mergeCaseConflictingDirs";
1046:        await mergeCaseConflictingDirs(tempPath);
3634:        await mergeCaseConflictingDirs(tempPath);
```

3 hits, all in non-conflicted regions. Gate 3 currently PASS.

### §7c copy-loop replaceAll — `InstallManager.ts`

Present in `extractArchive` copy loop (non-conflicted regions). Gate 4 currently PASS.

### §7d resolvePathCase(tempPath) — `InstallManager.ts`

```
7281:      const src = await resolvePathCase(tempPath, source, caseCache);
```

1 hit, in non-conflicted region. Gate 5 currently PASS.

### 140a57217 resolvePathCase(dataPath) — `LinkingDeployment.ts`

```
536:        const fileDataPath = await resolvePathCase(dataPath, relDataPath, dirCache);   ← INSIDE R5 HEAD side (CONFLICT)
763:    const outputPath = await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache);
820:    const fullOutputPath = await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache);
```

**Line 536 is inside conflict region R5 (HEAD side) — AT RISK.** Upstream side replaces it with plain path join. Fork must win on R5. Post-resolution, verify all 3 hits survive.

The `resolvePathCase` import at line 17 is inside conflict region R1 (HEAD side) — also AT RISK. Upstream removes it. Fork must win on R1.

Gate 6 currently PASS (markers skip-mode). Will FAIL if executor takes upstream on R1 or R5.

---

## Section D — Bluebird-import audit

| File                                                  | Bluebird import  | Style                                               | TS1064 risk from upstream conflict regions                                                                           |
| ----------------------------------------------------- | ---------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `mod_management/InstallManager.ts`                    | No               | —                                                   | N/A                                                                                                                  |
| `mod_management/LinkingDeployment.ts`                 | No               | —                                                   | N/A                                                                                                                  |
| `mod_management/util/externalChanges.ts`              | No               | —                                                   | N/A                                                                                                                  |
| `mod_management/eventHandlers.ts`                     | No               | —                                                   | N/A                                                                                                                  |
| `mod_management/util/activationStore.ts`              | No               | —                                                   | N/A                                                                                                                  |
| `mod_management/views/Settings.tsx`                   | **Yes** (line 5) | `import PromiseBB from "bluebird"` (runtime)        | R1 (upstream removes import). Fork wins → no risk. Methods return `: Promise<void>` (global, not PromiseBB) — clean. |
| `download_management/index.ts`                        | **Yes** (line 5) | `import PromiseBB from "bluebird"` (runtime)        | No conflict region touches bluebird annotation. Used in `attributeExtractor` returning `PromiseBB.resolve(...)`.     |
| `download_management/DownloadObserver.ts`             | **Yes** (line 4) | `import PromiseBB from "bluebird"` (runtime)        | Conflict regions (R1–R3) do not add `: Promise<void>` annotations on async fns. Clean.                               |
| `download_management/actions/state.ts`                | No               | —                                                   | N/A                                                                                                                  |
| `download_management/reducers/state.ts`               | No               | —                                                   | N/A                                                                                                                  |
| `download_management/types/IDownloadsAPIExtension.ts` | No               | —                                                   | N/A                                                                                                                  |
| `download_management/util/extendApi.ts`               | No               | —                                                   | N/A                                                                                                                  |
| `download_management/views/DownloadView.tsx`          | **Yes** (line 7) | `import type PromiseBB from "bluebird"` (type-only) | `import type` — no runtime binding; TS1064 cannot fire.                                                              |

**Summary:** 4 files import bluebird. Settings.tsx is the only one where an upstream region removes the import (R1) — fork wins, preserving the import and the `PromiseBB.resolve()` call at line 556. No TS1064 risk across all 13 files.

---

## Section E — Harness adequacy check

The Phase 32 harness (copied from Phase 26) encodes 7 gates:

| Gate | Invariant                           | Target file                                             | Threshold             |
| ---- | ----------------------------------- | ------------------------------------------------------- | --------------------- |
| 1    | §6 stagingDirHasFiles               | `InstallManager.ts` + `util/stagingIntegrity.ts` exists | ≥1 hit + file present |
| 2    | §7a normalizeBackslashPaths         | `InstallManager.ts`                                     | ≥3 hits               |
| 3    | §7b mergeCaseConflictingDirs        | `InstallManager.ts`                                     | ≥3 hits               |
| 4    | §7c replaceAll("\\", "/")           | `InstallManager.ts`                                     | ≥2 hits               |
| 5    | §7d resolvePathCase(tempPath)       | `InstallManager.ts`                                     | ≥1 hit                |
| 6    | 140a57217 resolvePathCase(dataPath) | `LinkingDeployment.ts`                                  | ≥3 hits               |
| 7    | no conflict markers                 | `mod_management/` tree                                  | 0 files with markers  |

**Current gate status (run with `--skip-conflict-check`):** 6/6 PASS (gate 7 skipped because markers still present). All 6 active gates clean at HEAD before any resolution.

**New call sites in v2.0.2 diff?** Surveyed all 13 conflict files and the upstream clean version (`a402ee6b4`). Finding:

- No new `stagingDirHasFiles` calls outside existing gate coverage.
- No new `normalizeBackslashPaths` or `mergeCaseConflictingDirs` calls.
- No new `resolvePathCase(tempPath,...)` calls outside `InstallManager.ts`.
- No new `resolvePathCase(dataPath,...)` calls outside `LinkingDeployment.ts`.
- `download_management/` bucket has zero playbook call sites (confirmed by full grep in §C).

**Decision: re-use harness as-is.** No gate 8+ needed. The v2.0.2 diff introduces no new playbook-touching call sites that the existing 7 gates don't cover.

**Harness copy instruction for plan:**

```bash
cp .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh \
   .planning/phases/39-mod-management-download-management-hot-zone-v2-0-2/scripts/grep-checkpoint.sh
```

Add a header comment citing v8.2 Phase 39 origin per v8.1 D-32-04 precedent.

---

## Section F — Resolution-order plan

### Final recommended order (implements D-39-01 + D-39-02)

**Bucket 1: download_management (no playbook surface)**

Tier 1 — leaf:

1. `download_management/actions/state.ts` (1 region)
2. `download_management/reducers/state.ts` (1 region)
3. `download_management/types/IDownloadsAPIExtension.ts` (1 region)
4. `download_management/util/extendApi.ts` (1 region)

Tier 2 — mid: 5. `download_management/DownloadObserver.ts` (3 regions) 6. `download_management/views/DownloadView.tsx` (1 region)

Tier 3 — barrel: 7. `download_management/index.ts` (12 regions — may split into 2 sub-commits)

Run final `grep-checkpoint.sh --skip-conflict-check` after step 7 for safety (exit 0 expected since no playbook surface).

**Bucket 2: mod_management (playbook-heavy)**

Tier 1 — leaf: 8. `mod_management/util/activationStore.ts` (2 regions — wine-era Linux fix) 9. `mod_management/util/externalChanges.ts` (4 regions — pure upstream additions)

Tier 2 — mid: 10. `mod_management/eventHandlers.ts` (2 regions) 11. `mod_management/views/Settings.tsx` (2 regions — bluebird + deploy import)

Tier 3 — playbook-heavy: 12. `mod_management/LinkingDeployment.ts` (5 regions — 140a57217 critical) 13. `mod_management/InstallManager.ts` (10 regions + 3 merge gaps)

Run `grep-checkpoint.sh` after every commit in steps 8–13.

**Rationale for `activationStore.ts` before `externalChanges.ts`:** activationStore's R1 fork-wins stance is straightforward; externalChanges R4 takes upstream refactor. Either order within leaf tier is valid.

**Rationale for `LinkingDeployment.ts` before `InstallManager.ts`:** LinkingDeployment's 140a57217 sites are simpler (5 regions, all clear fork/upstream stances). InstallManager's 10 regions + 3 merge gaps require the most careful work; resolving the smaller playbook-heavy file first confirms harness gates before the complex one.

---

## Section G — Per-file commit-body template

The executor fills this template for every resolved file. Use it verbatim (as a table or prose) in each commit body per D-39-12.

```
Bucket: <mod_management | download_management>
File: <filename>
Regions: <N> total

Per-region stances:
  R1 (lines <X>–<Y>): <fork-wins | upstream-wins | hand-merge> — <reason in 8 words>
  R2 (lines <X>–<Y>): <...>
  ...

Merge gaps restored (if any):
  GAP-A (<what>): restored from upstream a402ee6b4 lines <X>–<Y>
  ...

Playbook gates affected/preserved:
  §6 stagingDirHasFiles: <preserved | n/a>
  §7a normalizeBackslashPaths: <preserved | n/a>
  §7b mergeCaseConflictingDirs: <preserved | n/a>
  §7c copy-loop replaceAll: <preserved | n/a>
  §7d resolvePathCase(tempPath): <preserved | n/a>
  140a57217 resolvePathCase(dataPath): <preserved | n/a>

grep-checkpoint.sh exit: <N gates pass | n/a — download_management file>
pnpm typecheck exit: <0 | N (describe non-bucket errors)>
bluebird-trap audit: <clean | fixed-by-keeping-fork-annotation | N/A — no bluebird import>
```

**For mod_management bucket only:** include `grep-checkpoint.sh` line. For download_management bucket: omit (per D-39-10), or note "N/A — download_management bucket, no playbook surface".

**140a57217 special entry for `LinkingDeployment.ts` commit body:**

```
140a57217 re-grep (post-resolution):
  resolvePathCase(dataPath, ...) hits in LinkingDeployment.ts: <count>
  Expected: ≥3 (lines ~536, ~763, ~820)
  Status: PASS | FAIL
  externalChanges() method body read: resolvePathCase call at ~536 survived = <yes | no>
```

---

## Section H — Risk register

| #   | Risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Severity | Mitigation                                                                                                                                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **InstallManager.ts merge gaps** — `getDownloadFreeSlots` function (8 lines), `DynamicDownloadConcurrencyLimiter` class (~45 lines), and `mDependencyDownloadsLimit` field declaration are missing from the working tree (dropped by git merge driver, no conflict markers). Upstream conflict regions 3, 6–9 reference these items.                                                                                                                                                                      | HIGH     | Executor must manually restore all 3 items from `git show a402ee6b4:src/renderer/src/extensions/mod_management/InstallManager.ts` before resolving regions 3 and 6–9. Restore in order: function → class → field declaration. Type `DynamicDownloadConcurrencyLimiter` is locally defined (no new import needed). |
| R2  | **LinkingDeployment.ts 140a57217 double-kill** — regions R1 (removes `resolvePathCase` import) and R5 (replaces `resolvePathCase(dataPath,...)` call) are both upstream-side attacks on the 140a57217 invariant. Executor must win on BOTH to keep gate 6 green.                                                                                                                                                                                                                                          | HIGH     | Documented per-region as fork-wins in §A.2.5. Pre/post grep-checkpoint.sh run enforces this. D-39-14 snapshot protocol is mandatory.                                                                                                                                                                              |
| R3  | **InstallManager.ts regions 6–9 as a coupled unit** — regions R6–R9 are semantically one refactor (wrapping downloads in `mDependencyDownloadsLimit.do`). Taking upstream on R6 but not R7–R9 leaves unbalanced closures and will not typecheck.                                                                                                                                                                                                                                                          | HIGH     | Treat R6–R9 as a single logical resolution block. Take all four upstream-side, or take all four fork-side. Given no playbook surface, take all four upstream. Verify with per-file typecheck after commit.                                                                                                        |
| R4  | **download_management/index.ts 12-region complexity** — largest single file; mixes import additions, signature changes, and a large new initialization block. Single commit body would be 12 per-region stances.                                                                                                                                                                                                                                                                                          | MEDIUM   | Claude's Discretion (D-39-18): split into 2 sub-commits — (A) imports R1–R4, (B) functional R5–R12. Both labeled `resolve(dl-mgmt-v2.0.2): index.ts — <theme>`.                                                                                                                                                   |
| R5  | **SYNC-39b premise mismatch** — REQUIREMENTS.md says "confirm v8.1's Wave-1 DownloadManager/DownloadObserver deletion remains intact." But: (a) the v8.1 deletion (commit `e2127cecb`) was on `v8.1/config-bucket` and did not propagate to `master` (855fb3e1a); (b) `DownloadManager.ts` on the v8.2 branch (`0d8426853`) is the upstream v2.0.2 version (2643 lines, no conflict markers, `diff` against `a402ee6b4` = empty); (c) `DownloadObserver.ts` has 3 conflict markers from v2.0.2 additions. | MEDIUM   | SYNC-39b acceptance: confirm `DownloadManager.ts` IS the upstream v2.0.2 version (not dead code). Confirm `DownloadObserver.ts` conflicts are resolved per §A.1.5 (upstream-wins on R1–R3). Document in plan closeout. No deletion needed.                                                                        |
| R6  | **TS1185 source-marker errors in `src/shared/src/types/{ipc,preload}.ts`** — will surface during `pnpm typecheck` for every file resolution. These are Phase 41 territory, deferred per D-39-09 + Phase 38 gate 4 precedent. Bucket-scoped typecheck (`pnpm nx run @vortex/renderer:typecheck`) will report them but they are not owned by Phase 39.                                                                                                                                                      | LOW      | Per D-39-09: typecheck gate is bucket-scoped. Document TS1185 errors as expected and not regressions in commit bodies. Same pattern as Phase 32's "renderer-bucket 9 → 0" precedent.                                                                                                                              |
| R7  | **Husky pre-commit warnings on `.planning/` paths** — harness copy commit will touch `.planning/` (gitignored).                                                                                                                                                                                                                                                                                                                                                                                           | LOW      | `git add -f` for `.planning/` paths per memory `feedback_planning_gitignored.md`. Already established pattern across all prior phases.                                                                                                                                                                            |
| R8  | **`rebase-upstream.yml` cron race on `fork/sync/upstream-v2.0.2`** — daily cron can push to the remote branch between phase-start pre-flight and phase-end force-with-lease push.                                                                                                                                                                                                                                                                                                                         | LOW      | D-39-16: `--force-with-lease=sync/upstream-v2.0.2:<recorded-base>` with lease pin recorded by plan 39-01 pre-flight. Same pattern as Phase 38 Plan 38-07 (no race detected). Verify `git ls-remote` immediately before push.                                                                                      |
| R9  | **`fileMD5` API mismatch in index.ts R8** — HEAD uses `fileMD5(filePath)` returning a Promise; upstream uses `toPromise<string>((cb) => fileMD5(filePath, cb, () => {}))` callback style. The correct resolution depends on which `fileMD5` API the fork exposes.                                                                                                                                                                                                                                         | LOW      | Before resolving index.ts R8: run `grep -n "export.*fileMD5\|fileMD5" src/renderer/src/util/checksum.ts` to determine API shape. If the fork's `fileMD5` returns a Promise directly, fork-wins. If it's callback-based, upstream-wins.                                                                            |
| R10 | **activationStore.ts R1 duplicate `readManifestFile`** — upstream adds `readManifestFile` at line 203 but this function already exists at line 249. Fork wins on R1 (keep `isWineEraManifest`). But verify the existing `readManifestFile` at line 249 is not also in a conflict region.                                                                                                                                                                                                                  | LOW      | Run `grep -c '^<<<<<<< '` on activationStore.ts before resolution to confirm the total is 2 (not 3+). If a third region is near line 249, investigate before resolving R1.                                                                                                                                        |

---

## Section I — Environment Availability

No new external dependencies introduced by Phase 39. All tooling present from Phase 38.

| Dependency                     | Required By                 | Available  | Notes                                                                                     |
| ------------------------------ | --------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `git`                          | Conflict resolution         | ✓          | Standard                                                                                  |
| `pnpm` (10.33.0)               | Typecheck after each commit | ✓          | Phase 38 verified                                                                         |
| bash                           | `grep-checkpoint.sh`        | ✓          | Standard                                                                                  |
| `grep-checkpoint.sh`           | Gate verification           | Needs copy | Copy from `phases/32-mod-management-hot-zone-v2-0-1/scripts/` to `phases/39-.../scripts/` |
| Upstream clean ref `a402ee6b4` | Merge gap restoration       | ✓          | Present in local git objects (second parent of `a918d52ef`)                               |

---

## Sources

All evidence collected from the working tree at `v8.2/sync-upstream-v2.0.2` HEAD `0d8426853` via:

- `grep -c '^<<<<<<< '` — conflict region counts
- `grep -n '^<<<<<<< \|^=======$\|^>>>>>>> '` — conflict marker line numbers
- `sed -n '<range>p'` — region content inspection
- `grep -n` — call-site surveys
- `git show a402ee6b4:<path>` — upstream clean version reference
- `git show 855fb3e1a:<path>` — fork HEAD reference
- `bash grep-checkpoint.sh --skip-conflict-check` — harness gate states
- `.planning/phases/39-mod-management-download-management-hot-zone-v2-0-2/39-CONTEXT.md` — locked decisions D-39-01..18
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` — harness source
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — playbook invariants §6, §7, 140a57217

---

## RESEARCH COMPLETE
