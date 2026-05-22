---
phase: 30-land-tag
plan: 01
type: evidence
captured_at: 2026-05-22T03:30:00Z
captured_by: Wave 2 (30-01) inline execution
---

# Phase 30 — Rebase notes

## Header

```
PRE_REBASE (v8.0/config-bucket HEAD before rebase) = 6ca2d816da3e7f21e73d6204cde423535c132500
master target SHA                                  = db8035192034ba6ee786e88dfdb708956200308c
merge-base (divergence point)                      = d4c0d0da52b426c2f92376777cf88e88d3772f59
POST_REBASE HEAD (raw)                             = f1461c7cab8d69a5d564848a64b44ce1ab3ef9bb
POST_REBASE HEAD (after superset fix)              = 07c5197110... (see "Recommended remediation" below — applied)
```

`master` is +20 commits ahead of merge-base; `v8.0/config-bucket` was +380 ahead pre-rebase. After rebase, the linear range `master..HEAD` is **264 commits** — 116 commits collapsed via patch-id dedup or empty-cached skip during replay (mostly redundant resolutions where `--theirs` produced an empty patch against the converged tree).

## Resolution policy

- **Default:** fork-side wins (`git checkout --theirs <file>` during rebase — semantics inverted, so `--theirs` = the replayed v8.0 commit's version) per D-30-01.
- **Exception:** `src/main/src/downloading/downloader.test.ts` → `--ours` (master-side restore from SYNC-14). This file never surfaced as a conflict during this rebase — v8.0 had effectively the same content, so the exception clause did not trigger.
- **`.vscode/extensions.json` (D-08 carry-over):** `--ours` per the historic Phase 8 decision recorded in commit `af38b4c8c` ("resolve(config): .vscode/extensions.json — pick-ours per D-08").
- **`packages/vortex-api/lib/api.d.ts`:** discarded any drift via `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` per the Phase 28/29 chore-pattern (Pitfall 4).

## Conflict log

| Stat                               | Value                                                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Distinct conflicting commits       | 138                                                                                                                                                                  |
| Distinct files resolved            | 123                                                                                                                                                                  |
| `--theirs` resolutions logged      | 602                                                                                                                                                                  |
| `--ours` resolutions logged        | 1 (`.vscode/extensions.json` via commit `af38b4c8c`)                                                                                                                 |
| `drop` resolutions (modify/delete) | 0                                                                                                                                                                    |
| Manual resolutions                 | 1 (`etc/Dependency Report.md` — auto-loop crashed on filename-with-space; resolved manually with `--theirs`, then loop patched to use array-based porcelain parsing) |
| User-surfaced commits              | 1 (`91f4a0458` DuckDB cookies/manager — surfaced because master's APP-204 DuckDB pipeline was the more developed line; **user chose: skip the commit**)              |

Full per-file/per-commit decision log: `/tmp/rebase-decisions.log` (3997 lines, 138 stopped commits). Most prominent file groups:

- All `extensions/games/game-*/src/**` (BG3, Witcher 3, Skyrim, Morrowind, Fallout, Cyberpunk, Starfield, Stalker 2) → `--theirs` (fork-side preserved Linux platform guards from Phase 27)
- All `extensions/gamebryo-*/src/**` → `--theirs` (preserved Phase 27 gamebryo platform guards)
- `src/renderer/src/extensions/{download_management,mod_management,*_management}/**` → `--theirs` (Phase 26/28 spine work)
- `extensions/collections/**` → `--theirs` (Phase 27 collections work)
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig*.json` → `--theirs`
- `etc/vortex.api.md`, `etc/Dependency Report.md`, `CHANGELOG.md` → `--theirs`

## Post-rebase verification

### Linear chain (acceptance §144)

```
$ git merge-base master v8.0/config-bucket
db8035192034ba6ee786e88dfdb708956200308c

$ git rev-parse master
db8035192034ba6ee786e88dfdb708956200308c

$ git log --oneline master..v8.0/config-bucket | wc -l
264
```

✅ Linear FF-able chain — `git merge-base` equals `git rev-parse master` exactly. 264 commits replayed on top of master (380 pre-rebase → 116 collapsed to redundant skip / patch-id dedup).

### grep-checkpoint 16 gates (acceptance §145)

```
$ bash .planning/milestones/v8.0/scripts/grep-checkpoint.sh; echo $?
... (all 16 gate lines start "OK:")
CHECKPOINT PASSED — 16 gate(s) clean
0
```

✅ All 16 playbook invariants preserved post-rebase (mod-mgmt §6/§7a-d, LinkingDeployment 140a57217, gamebryo extension build guards §1, autosort §3, native cross-compile §10, BG3 4-class divine errors, Morrowind migrate103, winapi-bindings renderer alias §2, transferPath negative-gate §4, StarterInfo Proton §8, Steam findAllLinuxSteamPaths §9, no conflict markers in mod_management/ + 7 Phase 27 extension dirs).

### `git status --short` (acceptance §143)

```
$ git status --short
(empty)
```

✅ No leftover api.d.ts drift, no half-resolved conflicts.

### `pnpm typecheck` (acceptance §146) — ⚠️ DEVIATION

**Acceptance criterion as-written:** `pnpm typecheck` exits 0.
**Actual result:** exits 1 with **19 errors** across 5 packages.

**Diff vs master baseline (commit `db8035192` — what we rebased onto):**

|                                     | Errors |
| ----------------------------------- | ------ |
| Master baseline (pre-rebase target) | 15     |
| Pre-rebase v8.0 (`6ca2d816d`)       | 0      |
| Post-rebase HEAD (`f1461c7ca`)      | 19     |
| **Net new vs master baseline**      | **+4** |

**The 15 master-baseline errors** (pre-existing on `db8035192` — same SYNC-32 baseline-drift class as Phase 29's lint delta):

- `src/downloading/downloader.test.ts` × 7 — `Resolver`/`Downloader`/`DownloaderOptions`/`defaultOptions`/`withTestServer`/`serveRoutes`/`delayMs` not exported (test file imports a `Downloader` class API the upstream `downloader.ts` no longer exports — class was inlined to a `download<T>()` function). Master ships this broken.
- `src/extensions/download_management/DownloadObserver.ts` × 7 — `chunks` property removed from `IDownload`; arity mismatches on internal calls. Master ships this broken.
- `packages/paths/src/types.ts(11,19)` × 1 — `Cannot find module 'zod'`. Master ships this broken (missing devDep).

**The 4 net-new post-rebase errors** (all stem from a single root cause in the auto-resolver's `--theirs` policy on `IState.ts` at commit 28):

- `src/renderer/src/IPCDownloadAdapter.ts(194,52)` — `Property 'checkpoints' does not exist on type 'IStateDownloads'`
- `src/renderer/src/IPCDownloadAdapter.ts(594,68)` — same as above
- `src/renderer/src/views/components/Menu/useToolsData.ts(143,5)` — shorthand `pinnedToolsMap` undefined
- `src/renderer/src/views/components/Menu/useToolsData.ts(144,5)` — shorthand `deploymentCounter` undefined

**Root cause:** `IState.ts` was conflict-resolved with `--theirs` (fork-side default per D-30-01) at commit `840240eab` "Merge pull request #22007 from Nexus-Mods/task/APP-65". That commit's `--theirs` side was an early intermediate revision of `IState.ts` that did NOT yet contain the `checkpoints` field on `IStateDownloads`, nor the `pinned: { [gameId]: { [toolId]: boolean } }` typing on `ISettingsInterface.tools`, nor the `deploymentCounter: { [gameId]: number }` typing on `state.persistent.deployment`.

A later v8.0 commit (`921140cc3` "Add checkpoint actions and reducers") had added the `checkpoints` field at the IState level. After the auto-resolved `--theirs` at commit 28 produced the converged tree, that later additive commit's patch became redundant against the rebased timeline (master's IState.ts already had `checkpoints` from `138da2249` upstream merge) — so it was patch-id-deduped during the rebase.

The same pattern dropped the `pinnedToolsMap`/`deploymentCounter` selector wiring that `useToolsData.ts` depends on.

**Net effect:** master's IState.ts (which has `checkpoints` + `pinned` + `deploymentCounter`) is the SUPERSET of both fork sides; we shipped a strict subset because of the rebase ordering.

## Recommended remediation

The cleanest fix is a single follow-up commit on top of the rebased HEAD that takes master's IState.ts verbatim (it's already a superset) plus the master version of `useToolsData.ts` selector wiring. That brings post-rebase typecheck back to baseline parity with master (15 errors, all SYNC-32-class baseline drift). The original v8.0 intermediate IState.ts contributes nothing new — every field it had is already in master's version.

**Proposed:**

1. `git checkout master -- src/renderer/src/types/IState.ts src/renderer/src/views/components/Menu/useToolsData.ts`
2. Verify typecheck baseline parity: 15 errors, all matching master baseline.
3. Commit as `fix(30-01): adopt master superset of IState.ts + useToolsData.ts selectors` — small, surgical, on-branch.

Then proceed with Task 1-2 (force-push lease-pinned).

**Decision (2026-05-22 — user-approved via AskUserQuestion):** apply the surgical superset patch now.

### Applied as commit `07c5197110`

```
fix(30-01): adopt master superset of IState.ts + useToolsData.ts selectors

Auto-rebase --theirs at commit 840240eab Tools-Page merge dropped IState.ts
fields (checkpoints/pinned/deploymentCounter) — master has all of them as a
superset. Bring rebased head to typecheck baseline parity with master (15
errors, all SYNC-32-class pre-existing baseline drift).
```

Files: `src/renderer/src/types/IState.ts` (+14/−14), `src/renderer/src/views/components/Menu/useToolsData.ts` (+9/−44).

### Re-verification after patch

```
$ pnpm typecheck 2>&1 | grep "error TS" | sort -u | wc -l
15

$ diff /tmp/master-errs.txt <(pnpm typecheck 2>&1 | grep "error TS" | sort -u)
(no diff — exact match)

$ bash .planning/milestones/v8.0/scripts/grep-checkpoint.sh; echo $?
... CHECKPOINT PASSED — 16 gate(s) clean
0
```

✅ Post-fix typecheck matches master baseline EXACTLY (15 errors, identical lines).
✅ All 16 grep-checkpoint gates still green.
✅ `git status --short` empty (api.d.ts drift discarded per Pitfall 4).

### Final commit count

```
$ git log --oneline master..v8.0/config-bucket | wc -l
265
```

(264 rebased + 1 superset-fix = 265 commits ahead of master.)

## Force-push log

### Pre-push verified live remote SHA (lease pin)

```
$ git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.0
6ca2d816da3e7f21e73d6204cde423535c132500	refs/heads/sync/upstream-v2.0.0
```

(Matches `PRE_REBASE` value at top of this doc — no upstream churn since rebase began.)

### Push command (per memory `feedback_git_push_ssh.md` + Pitfall 1 lease idiom)

```
git -c core.sshCommand="ssh -i ~/.ssh/id_ed25519" push \
    --force-with-lease=sync/upstream-v2.0.0:6ca2d816da3e7f21e73d6204cde423535c132500 \
    git@github.com:atabisz/Vortex.git \
    v8.0/config-bucket:sync/upstream-v2.0.0
```

### Push result

```
To github.com:atabisz/Vortex.git
 + 6ca2d816d...07c519711 v8.0/config-bucket -> sync/upstream-v2.0.0 (forced update)
```

### Post-push verification

```
$ git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.0
07c51971111074579443a1935e64a4adc8331988	refs/heads/sync/upstream-v2.0.0

$ git rev-parse HEAD
07c51971111074579443a1935e64a4adc8331988
```

✅ Remote `fork/sync/upstream-v2.0.0` advanced to local `v8.0/config-bucket` HEAD `07c519711` — fresh CI runs kicked on rebased SHA. Wave 3 (30-02) verifies they go green before Wave 4 (30-03) FF-merge.
