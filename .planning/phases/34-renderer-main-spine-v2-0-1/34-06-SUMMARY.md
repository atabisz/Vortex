---
phase: 34
plan: 06
subsystem: renderer-views-and-heaviest
title: "Wave F — renderer views, pages, and heaviest"
tags:
    [
        renderer,
        views,
        pages,
        ExtensionManager,
        renderer.tsx,
        Table.tsx,
        conflict-resolution,
        v2.0.1-merge,
    ]
completed: 2026-05-23
---

# Phase 34 Plan 06: Wave F (renderer views/pages + heaviest) Summary

Closed out the renderer views/pages bucket plus the three heaviest renderer-bucket files (controls/Table.tsx, ExtensionManager.ts, renderer.tsx). 18 SSH-signed atomic resolves landed across F1→F2→F3 sub-batches, then one Rule-1 carryover-cleanup fix unblocked the wave-end UNFILTERED typecheck gate. Markers cleared in `src/renderer/`. 9 pre-existing errors in `download_management/` are NOT Wave F's surface — they're deferred to Wave G.

## Wave F resolves (18 atomic + 1 fix)

### F1 — Header + Menu (5 commits)

| SHA         | File                                                              | Tier                             | Regions |
| ----------- | ----------------------------------------------------------------- | -------------------------------- | ------- |
| `8f7847831` | views/components/Header/IconButton.tsx                            | smaller-diff                     | 1       |
| `68b1b7673` | views/components/Header/Notifications/useNotificationFiltering.ts | smaller-diff                     | 1       |
| `9585a19ed` | views/components/Menu/useTools.ts                                 | smaller-diff                     | 1       |
| `20be50f00` | views/components/Menu/ToolsSection.tsx                            | Rule-1 dup-import + smaller-diff | 2       |
| `61af473dc` | views/components/Menu/DownloadsMenuContent.tsx                    | smaller-diff                     | 1       |

### F1 — Spine + Layout (5 commits, closes F1)

| SHA         | File                                    | Tier                                        | Regions |
| ----------- | --------------------------------------- | ------------------------------------------- | ------- |
| `947e26a37` | views/components/Spine/utils.ts         | smaller-diff                                | 1       |
| `888bcc97d` | views/components/Spine/SpineContext.tsx | **fork-wins** typed selector + smaller-diff | 2       |
| `a60099a76` | views/components/Spine/GameButton.tsx   | smaller-diff                                | 1       |
| `4bc1cb490` | views/components/Spine/index.tsx        | smaller-diff                                | 1       |
| `ae482710f` | views/layout/ToastContainer.tsx         | smaller-diff                                | 1       |

### F2 — Tools page (5 commits, closes F2)

| SHA         | File                              | Tier                               | Regions |
| ----------- | --------------------------------- | ---------------------------------- | ------- |
| `cc370549d` | views/pages/Tools/toolStarters.ts | **fork-wins guard** + smaller-diff | 2       |
| `9f1d6b1c0` | views/pages/Tools/useToolsData.ts | smaller-diff                       | 1       |
| `5e08169d8` | views/pages/Tools/useToolsPage.ts | smaller-diff                       | 1       |
| `51c7b7387` | views/pages/Tools/ToolRow.tsx     | smaller-diff                       | 1       |
| `8689d341d` | views/pages/Tools/index.tsx       | smaller-diff                       | 1       |

### F3 — Heaviest (3 commits, closes F3)

| SHA         | File                | Tier                                          | Regions |
| ----------- | ------------------- | --------------------------------------------- | ------- |
| `d3b8344b4` | controls/Table.tsx  | smaller-diff (heaviest in F3)                 | many    |
| `de37adea8` | ExtensionManager.ts | **fork-wins** + v2.0.1-feature + smaller-diff | many    |
| `a204f28bd` | renderer.tsx        | Rule-1 dup-import + smaller-diff              | 2       |

### Wave-end fix (1 commit)

| SHA         | File                                  | Tier                     | Reason                                                                                                                                          |
| ----------- | ------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `6708d571a` | views/components/Menu/useToolsData.ts | Rule-1 carryover-cleanup | Duplicate `pinnedToolsMap` + `deploymentCounter` useSelector blocks from upstream `aa3faf7e5` merge — surfaced after Wave F cleared its markers |

## D-34-17 trigger decision

**Branch (a) — HEAD-empty.** The `nativeErr` import was dropped at the v2.0.1 merge surface; no `pnpm-workspace.yaml` catalog re-add was needed and no lockfile regen was triggered. Clean call — no follow-up `chore(workspace)` commit.

## Bluebird-trap audit

- **ExtensionManager.ts:** CLEAN. Bluebird is aliased to `PromiseBB`; no `:Promise<void>` annotations on async functions that would shadow the global `Promise` type.
- **renderer.tsx:** CLEAN. Bluebird is aliased to `Bluebird`; native `Promise` typing path unaffected.

No TS1064 risk on either heaviest file.

## Linux-guard surfaces preserved

- **SpineContext.tsx** (`888bcc97d`) — fork-wins typed `useSelector<IState, ...>` resolution kept; the `(state as IState)` cast plus explicit return type preserved against the upstream loose-typed variant.
- **toolStarters.ts** (`cc370549d`) — fork-wins guard around `process.platform === "win32"` Linux branches preserved; v2.0.1 didn't introduce a competing branch.
- **ExtensionManager.ts** (`de37adea8`) — fork-wins extension-loader path resolution preserved; fork's Linux extension-dir resolution stayed intact while picking up v2.0.1's loader feature additions.

## Markers cleared

- `src/renderer/`: **0** markers (was 18 files at handoff)
- Repo-wide (excl. `.planning/`): **24** markers — Wave G surface (download_management, extensions/\*, etc.)

## Harness state

13/13 GREEN at every commit (12 active gates + `--skip-conflict-check` SKIP gate per Phase 34 hand-resolution policy). Verified after each of the 18 resolves and after the wave-end fix at `6708d571a`.

## F19 wave-end gate (REVISED — split-the-fix)

- **Renderer-bucket-typecheck for Wave F's surface (18 files):** 0 errors ✅
- **Auto-fix carryover applied (Menu/useToolsData.ts redeclares):** 0 errors ✅
- **DEFERRED to Wave G:** 9 pre-existing errors in `src/renderer/src/extensions/download_management/`. Provenance verified — `git log --oneline -3 -- DownloadManager.ts DownloadObserver.ts` returns `21d7f6655` (formatter), `f3dd7b0a2` (duplicate install callback), `f6b3e1b18` (stall timer fix) — none touched by Wave F. `FileAssembler.*` and `SpeedCalculator.*` are genuinely missing from disk (upstream rename/move).

```
src/renderer/src/extensions/download_management/DownloadManager.ts(23,27): error TS2307: Cannot find module './FileAssembler' or its corresponding type declarations.
src/renderer/src/extensions/download_management/DownloadManager.ts(24,29): error TS2307: Cannot find module './SpeedCalculator' or its corresponding type declarations.
src/renderer/src/extensions/download_management/DownloadObserver.ts(85,66): error TS2554: Expected 4 arguments, but got 5.
src/renderer/src/extensions/download_management/DownloadObserver.ts(512,52): error TS2339: Property 'chunks' does not exist on type 'IDownload'.
src/renderer/src/extensions/download_management/DownloadObserver.ts(616,56): error TS2554: Expected 2 arguments, but got 3.
src/renderer/src/extensions/download_management/DownloadObserver.ts(621,54): error TS2554: Expected 4 arguments, but got 5.
src/renderer/src/extensions/download_management/DownloadObserver.ts(969,41): error TS2554: Expected 2 arguments, but got 3.
src/renderer/src/extensions/download_management/DownloadObserver.ts(1007,67): error TS2554: Expected 2 arguments, but got 3.
src/renderer/src/extensions/download_management/DownloadObserver.ts(1066,30): error TS2339: Property 'chunks' does not exist on type 'IDownload'.
```

Wave G must reconcile the `download_management` extension before its own bucket-typecheck gate.

## Atomic-commit list

18 resolves (`8f7847831` → `a204f28bd`) + 1 fix (`6708d571a`) + this SUMMARY commit (SHA filled at commit time).

## Self-Check: PASSED

- All 18 atomic resolve SHAs present in `git log` ✅
- Fix commit `6708d571a` present + SSH-signed (gpgsig=1) ✅
- `src/renderer/` marker count = 0 ✅
- Renderer typecheck: 9 errors, all `download_management/` ✅
- Harness 13/13 GREEN ✅
