---
phase: 34
plan: 03
wave: C
status: complete
type: execute
requires:
    - 34-00
    - 34-01
    - 34-02
files_modified:
    - src/main/src/store/SubPersistor.ts
    - src/main/src/store/LevelPersist.ts
    - src/main/src/store/ReduxPersistorIPC.ts
    - src/main/src/errorReporting.ts
    - src/main/src/cli.ts
    - src/main/src/extensions/autoupdater.ts
    - src/main/src/TrayIcon.ts
    - src/main/src/Application.ts
    - src/main/src/main.ts
    - .planning/phases/34-renderer-main-spine-v2-0-1/34-03-SUMMARY.md
commits:
    - 5fbbeaba7 resolve(main): store/SubPersistor.ts — upstream-wins on additive bulk persistor methods
    - b14673577 resolve(main): store/LevelPersist.ts — upstream-wins on timedWrite + transaction-API surface
    - d1bbcbda8 resolve(main): store/ReduxPersistorIPC.ts — upstream-wins on bulk run-batching
    - aa874369e resolve(main): errorReporting.ts — fork-wins on ReportableError type import (Rule-2 keep-required-import)
    - 047d2974a resolve(main): cli.ts — Rule-1 dup-import HEAD-empty (imports already present below)
    - b3fbafd11 resolve(main): extensions/autoupdater.ts — Rule-1 dup-import HEAD-empty (imports already present below)
    - 1066cf219 resolve(main): TrayIcon.ts — Rule-1 dup-import HEAD-empty (electron import already present below)
    - b86678df7 resolve(main): Application.ts — fork-wins on PROT-01 NXM cold-start, smaller-diff on 9 reflows, upstream-wins on 1 dup-removed
    - c7c492774 resolve(main): main.ts — hybrid (upstream-wins on --run-before-init reorder, fork-wins on adaptor/download init calls)
provides:
    - Resolved main spine: 9 process-boot files marker-free, leaf-first ordering preserved
    - Bulk persistor surface (SubPersistor + LevelPersist + ReduxPersistorIPC) wired end-to-end with v2.0.1's run-batching architecture
    - PROT-01 NXM cold-start handler preserved (Application.ts buffered-pendingDownload pattern)
    - Linux platform guards intact: process.platform === \"win32\" branches, Linux LD_LIBRARY_PATH injection (main.ts §10), Tray icon extension switch
    - Wave C bucket typecheck (`pnpm tsc -p src/main/tsconfig.json --noEmit`) returns 0 non-TS1185 errors
    - 12/12 harness gates GREEN throughout the wave
affects:
    - Wave D (renderer leaves): every renderer caller of @vortex/shared/state's IPersistor surface depends on the resolved bulk methods (C1)
    - Wave E (renderer extensions): nexus_integration et al. depend on a clean main spine for IPC roundtrips
    - Wave F (renderer views/pages + ExtensionManager + Table.tsx + renderer.tsx) depends on Application.ts's clean BrowserWindow construction
    - Phase 35 (build verification) — main bucket typecheck-clean is a precondition for full repo typecheck
    - Phase 36 (rebase + FF-merge + tag) — clean main spine is required before the merge can proceed
metrics:
    files_resolved: 9
    regions_resolved: 22
    commits: 9
    bucket_typecheck_errors: 0
    duration: ~50 min wall-time
requirements-completed:
    - SYNC-34a (in progress — Wave C portion done, Waves D-G remain)
---

# Phase 34 Plan 03: Wave C — Main spine resolution Summary

9/9 main bucket files resolved leaf-first. 22 conflict regions across 9 atomic SSH-signed `resolve(main): ...` commits on `v8.1/config-bucket`. Bucket typecheck = 0 non-marker errors. Wave D (renderer) unblocked.

## Outcome

- **9/9 main spine files marker-free** in the prescribed leaf-first order (`store/SubPersistor → store/LevelPersist → store/ReduxPersistorIPC → errorReporting → cli → extensions/autoupdater → TrayIcon → Application → main`).
- **9 atomic SSH-signed `resolve(main): ...` commits** on `v8.1/config-bucket`, all matching Pattern S5 / D-34-08 commit-body discipline (regions tally per stance tier, Linux-guard surfaces named where applicable, harness exit, typecheck status).
- **Wave-C bucket typecheck** (`pnpm tsc -p src/main/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l`) returned **0** at wave end. No `cd src/shared && pnpm build` re-run needed — the Wave B pre-warm survived (no shared-package mutations during Wave C).
- **Harness skip-mode** (`grep-checkpoint.sh --skip-conflict-check`) exited 0 after every commit (12/12 GREEN — gate-13+ extension is still Wave D-onward in scope).
- **Conflict markers anywhere under `src/main/`: 0**.

## Per-file table

| Order | File                                    | Regions | Stance distribution                                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | --------------------------------------- | ------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | src/main/src/store/SubPersistor.ts      | 1       | 0 fork / 1 upstream / 0 smaller-diff                                | v2.0.1 adds `bulkSetItem` + `bulkRemoveItem` declarations alongside `getAllKVs` — the constructor body already references them, so HEAD-only would be broken.                                                                                                                                                                                                                                                                                                   |
| 2     | src/main/src/store/LevelPersist.ts      | 4       | 0 fork / 3 upstream / 1 smaller-diff (HEAD)                         | Imports reorder; extensionDir path.join smaller-diff HEAD; setItem + removeItem v2.0.1 timedWrite() + bulk transaction API surface.                                                                                                                                                                                                                                                                                                                             |
| 3     | src/main/src/store/ReduxPersistorIPC.ts | 1       | 0 fork / 1 upstream / 0 smaller-diff                                | v2.0.1 replaces `applyOperation` with `applyOperationsInRuns` + `applySetRun`/`applyRemoveRun` run-batching using the bulk methods from C1.                                                                                                                                                                                                                                                                                                                     |
| 4     | src/main/src/errorReporting.ts          | 1       | 1 fork (drop-required-import-removed) / 0 upstream / 0 smaller-diff | v2.0.1 dropped the `ReportableError` type import that the file uses 3x downstream. fork-wins / Rule-2 (keep required import).                                                                                                                                                                                                                                                                                                                                   |
| 5     | src/main/src/cli.ts                     | 1       | 0 / 0 / 0 / 1 Rule-1 dup-import HEAD-empty                          | v2.0.1 inserted dup-imports above HEAD-side block (already canonical lower).                                                                                                                                                                                                                                                                                                                                                                                    |
| 6     | src/main/src/extensions/autoupdater.ts  | 1       | 0 / 0 / 0 / 1 Rule-1 dup-import HEAD-empty                          | Same dup-import shape as cli.ts. No actual Linux platform branch in this file (Linux update flow lives in packaging layer).                                                                                                                                                                                                                                                                                                                                     |
| 7     | src/main/src/TrayIcon.ts                | 1       | 0 / 0 / 0 / 1 Rule-1 dup-import HEAD-empty                          | Linux Tray icon switch (`vortex.ico` vs `vortex.png` per `process.platform === \"win32\"`) is at line 34, OUTSIDE the conflict region — preserved.                                                                                                                                                                                                                                                                                                              |
| 8     | src/main/src/Application.ts             | 11      | 1 fork / 1 upstream / 9 smaller-diff (HEAD)                         | **Heaviest file in Wave C**. R7 fork-wins on PROT-01 NXM cold-start handler (§4-5 NXM playbook surface). R8 upstream-wins on importBackup transaction (HEAD had duplicated the transaction loop; the post-conflict block already owns atomicity). R1-R6, R9-R11 = pure formatter reflows; HEAD wins on smaller-diff.                                                                                                                                            |
| 9     | src/main/src/main.ts                    | 1       | hybrid (1 fork + 1 upstream — counted once)                         | Boot-ordering refactor + fork-only adaptor/download subsystems. v2.0.1's `--run`-before-init reorder fixes upstream issue #23043 (deployment elevation budget). Re-injected fork's `downloadManager`/`initDownloadIpc`/`initAdaptorHost` into the post-`--run` init block to keep fork subsystems wired (their source files are preserved in `src/main/src/{adaptors,downloading}/`; v2.0.1 deleted them upstream — architectural deferral noted for Phase 35). |

**Wave C totals:** 22 regions resolved across 9 files.

- 2 fork-wins: errorReporting.ts (R1, drop-required-import-removed); Application.ts R7 (PROT-01 NXM cold-start) + main.ts (1 fork-side decision component of the hybrid resolve).
- 6 upstream-wins (incl. hybrid component on main.ts): SubPersistor.ts (R1), LevelPersist.ts (R1, R3, R4), ReduxPersistorIPC.ts (R1), Application.ts R8 (transaction-loop dedup), main.ts (1 upstream component of hybrid).
- 11 smaller-diff (HEAD): LevelPersist.ts (R2), Application.ts (R1-R6, R9-R11).
- 3 Rule-1 dup-import HEAD-empty: cli.ts, autoupdater.ts, TrayIcon.ts.
- Hybrid resolves: main.ts (1 region, counted once in the per-file column).

## Stance hierarchy notes

### Linux-guard surfaces preserved (§3 / §1 / §4-5 / §10)

All preserved verbatim — every guard sits OUTSIDE the conflict regions OR was explicitly retained inside the conflict region (Application.ts R7).

| Guard surface                              | File                        | Line(s) post-resolution | Status                                       |
| ------------------------------------------ | --------------------------- | ----------------------- | -------------------------------------------- |
| §1 platform guard (electronExecutable)     | src/main/src/cli.ts         | 41                      | preserved (outside conflict)                 |
| §1 platform guard (multi-user ProgramData) | src/main/src/Application.ts | 282                     | preserved (outside conflict)                 |
| §1 platform guard (UAC)                    | src/main/src/Application.ts | 461                     | preserved (outside conflict)                 |
| §1 platform guard (testUserEnvironment)    | src/main/src/Application.ts | 1107                    | preserved (outside conflict)                 |
| §3 Tray icon extension switch              | src/main/src/TrayIcon.ts    | 34                      | preserved (outside conflict)                 |
| §4-5 PROT-01 NXM cold-start handler        | src/main/src/Application.ts | 506-512                 | **preserved INSIDE conflict R7 — fork-wins** |
| §10 Linux LD_LIBRARY_PATH for libloot      | src/main/src/main.ts        | 150-159                 | preserved (outside conflict)                 |
| §10 process.chdir(application)             | src/main/src/main.ts        | 103                     | preserved (outside conflict)                 |
| §1 Windows PATH filter                     | src/main/src/main.ts        | 117-140                 | preserved (outside conflict)                 |

**No Linux-guard regression.** Sentinel re-grep post-Wave returns the same hits as pre-Wave (12/12 harness gates GREEN).

### Per-region stance details

- **C1 (SubPersistor.ts R1):** v2.0.1's bulk persistor surface is REQUIRED for the existing constructor body (lines 42-58 — they reference `this.bulkSetItem` / `this.bulkRemoveItem` which only exist in the v2.0.1 declaration block). HEAD-only would leave the constructor referencing unbound class fields. upstream-wins.

- **C2 (LevelPersist.ts R1-R4):** Region 1 takes upstream-wins on the import block reorder (matches v2.0.1's perfectionist-plugin convention). Region 2 takes smaller-diff HEAD on the `extensionDir = path.join(...)` single-line vs three-line wrap. Regions 3 + 4 take upstream-wins on the `setItem`/`removeItem` rewrite — v2.0.1 collapses the inline SELECT-then-UPDATE-or-INSERT transaction into a single `INSERT` wrapped in `this.timedWrite()`, with explicit `beginTransaction` / `commitTransaction` callers (see ReduxPersistorIPC.processOperations and Application.importBackup).

- **C3 (ReduxPersistorIPC.ts R1):** v2.0.1 replaces single-op `applyOperation()` with run-batching trio (`applyOperationsInRuns` + `applySetRun` + `applyRemoveRun`) that uses the bulk methods declared in C1 + implemented in C2. Old `applyOperation` had no remaining callers in `src/main/`. upstream-wins.

- **C4 (errorReporting.ts R1):** v2.0.1 collapsed the BasicTracerProvider import on multiple lines AND dropped `import type { ReportableError } from \"@vortex/shared/errors\"`. The file uses `ReportableError` 3x downstream (return type of `errorToReportableError`, parameter type of `sendReport`). HEAD-side keeps the required import. fork-wins / Rule-2 (drop-required-import-removed).

- **C5/C6/C7 (cli.ts, autoupdater.ts, TrayIcon.ts each R1):** Pure Rule-1 dup-import. v2.0.1 inserted import lines above the existing HEAD-side block; the HEAD-side block already imports the same names at the canonical alphabetised position. HEAD-empty wins per Rule-1.

- **C8 (Application.ts R1-R11):** Heaviest file. R1-R6, R9-R11 are formatter reflows where HEAD's single-line form is shorter and matches sibling code style — smaller-diff HEAD. R7 is the PROT-01 NXM cold-start block (lines 542-551 pre-resolution); the buffered `mPendingDownload` pattern is the fork's §4-5 NXM playbook surface and v2.0.1 has no equivalent — fork-wins. R8 is `importBackup`'s transaction handling: HEAD-side duplicated the transaction loop (it ALSO exists at lines 841-865 outside the conflict, even on HEAD-side) — upstream-wins to take just the JSON.parse + catch and rely on the trailing transaction block.

- **C9 (main.ts R1):** Hybrid. v2.0.1 reorders the boot path so `--run` evaluates BEFORE the telemetry/IPC/stylesheet init (fixes upstream issue #23043 — deployment-elevation watchdog budget). HEAD-side keeps the v2.0 ordering AND owns three fork-only subsystems (`DownloadManager`, `initDownloadIpc`, `initAdaptorHost`) that v2.0.1 dropped along with their source files (`src/main/src/adaptors/`, `downloading/ipc.ts`, `downloading/manager.ts`). Resolution: take v2.0.1's ordering, re-inject fork's three init calls into the post-`--run` block. Fork's source files for these subsystems are preserved on disk; whether to delete them is an architectural decision deferred to a future phase.

## Bucket typecheck

```bash
$ pnpm tsc -p src/main/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l
0
```

**0 non-TS1185 errors.** Wave-end gate PASSED.

`src/shared/` was pre-built once (Wave B closeout) and survived Wave C — no shared-package re-build was needed since Wave C made no changes to `src/shared/`. Future waves that touch `src/shared/` will need to re-run `cd src/shared && pnpm build` before consumer-side typechecks.

## Harness state

12/12 inherited gates GREEN in skip-mode after every commit. Gate-13+ Phase 34-specific extensions (IPC sentinel / Linux argv slice / error-class preservation / `__mocks__/` shape) remain Wave D-onward in scope per D-34-04.

## Issues encountered / Deviations

- **Application.ts R8 (importBackup) — HEAD had duplicated transaction logic.** Worth flagging: the HEAD-side conflict block at lines 798-828 included a complete `await persistor.beginTransaction() { ... } catch { rollbackTransaction() }` block, and the SAME transaction block ALSO exists OUTSIDE the conflict region at lines 841-865 (preserved on both sides). The HEAD-only inclusion was a stale dup that would have wrapped the import in two nested transactions if naively merged. Took upstream-wins on R8 (just the JSON.parse + catch); the trailing block handles atomicity. Not a behavioural regression — same behaviour as pre-Wave fork/master.

- **main.ts hybrid resolve.** v2.0.1's reorder fixes a real bug (#23043 deployment-elevation watchdog budget), so taking pure HEAD-wins would carry the bug forward. v2.0.1 also dropped fork-only adaptor/download subsystems entirely, so taking pure upstream-wins would silently break fork's IPC + adaptor surface. Resolved as documented hybrid (upstream-wins on ordering + fork-wins on call set). The orphaned source-file question (whether to also delete `src/main/src/{adaptors,downloading}/` since v2.0.1 deleted them) is **NOT resolved here** — Wave C scope is marker resolution, not subsystem ownership. Flagged as a SYNC-35 carry-forward candidate.

- **Linux-guard nuance for downstream waves:** `errorReporting.ts` had no platform-guarded native-handler tier in the current file shape (the plan's "native error handler tier" language referred to historical surface). The renderer-side error handling (`src/renderer/src/util/errorHandling.ts`) is a Wave D file and may carry the actual Linux-relevant native-error path. Worth checking when Wave D plans are scoped.

- **Linux-guard nuance for `extensions/autoupdater.ts`:** The file currently carries no platform-guarded code at all — the Linux disposition for AppImage/.deb update flow is in the packaging layer (`electron-builder.config.cjs`) and the `process.env.APPIMAGE` gate elsewhere in the boot path. The plan's "autoupdater Linux disposition preserved" call-out was satisfied by NOT introducing a Windows-only short-circuit; both sides of the resolved conflict already lacked one.

- **No `--no-verify` used. No `git stash` used (Wave B trip avoided). No deferred-items.md log needed.**

## Provides (downstream-facing)

- 9 fully resolved main bucket files; bucket typecheck GREEN.
- Bulk persistor architecture wired end-to-end (SubPersistor declares → LevelPersist implements → ReduxPersistorIPC consumes via run-batching).
- PROT-01 NXM cold-start handler preserved on the boot path.
- All Linux platform guards (Tray icon, multi-user ProgramData branch, UAC short-circuit, testUserEnvironment short-circuit, LD_LIBRARY_PATH injection, Windows PATH filter) intact.

## Affects (waves now unblocked)

- **Wave D (renderer leaves):** every renderer-side caller of `@vortex/shared/state`'s `IPersistor` surface and the `ReduxPersistor` IPC bridge depends on this wave's bulk methods + run-batching architecture.
- **Wave E (renderer extensions):** `nexus_integration`, `health_check`, installer + activator extensions all depend on the resolved main IPC handlers + Application boot path.
- **Wave F (renderer views/pages):** `ExtensionManager.ts`, `controls/Table.tsx`, `views/pages/Tools/*`, `renderer.tsx` all depend on the clean Application BrowserWindow construction.
- **Phase 35 (build verification):** main bucket typecheck-clean is a precondition for full repo typecheck.
- **Phase 36 (rebase + FF-merge + tag):** clean main spine is required before merge.

## Self-Check: PASSED

- All 9 files marker-free: `git grep -nE '^(<{7}|={7}|>{7})( |$)' src/main/` returns 0.
- All 9 commits exist on `v8.1/config-bucket`: verified via `git log --oneline -10`.
- All 9 commits SSH-signed: `git cat-file -p <sha> | grep -c '^gpgsig '` returns 1 for each.
- Bucket typecheck = 0: verified via `pnpm tsc -p src/main/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l`.
- Harness exits 0 in skip-mode: verified after every commit.

---

_Phase: 34-renderer-main-spine-v2-0-1_
_Wave: C (main spine)_
_Completed: 2026-05-23_
