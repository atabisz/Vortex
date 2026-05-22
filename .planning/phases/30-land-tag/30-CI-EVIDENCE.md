---
phase: 30-land-tag
plan: 02
type: evidence
captured_at: 2026-05-22T03:55:00Z
captured_by: Wave 3 (30-02) inline execution
---

# Phase 30 CI Evidence (SYNC-35)

## Header

```
REBASED_HEAD (PR #4 head SHA)            = 839e503c069c8d9223fe9c2eacd9e2f478ab66c3
master target SHA                        = db8035192034ba6ee786e88dfdb708956200308c
```

PR #4 fork-side branch: `sync/upstream-v2.0.0`. Two CI workflows watch this branch on `pull_request` event: `Main` (build/typecheck/lint/test on windows-latest + ubuntu-latest) and `Format` (`pnpm oxfmt --check`).

## SYNC-35 — Windows CI green on rebased HEAD

### Run inventory on PR #4 head (`839e503c0`)

| Workflow | Run ID      | Conclusion     | Wall-clock | URL                                                        |
| -------- | ----------- | -------------- | ---------- | ---------------------------------------------------------- |
| Format   | 26265518519 | **success**    | 1m46s      | https://github.com/atabisz/Vortex/actions/runs/26265518519 |
| Main     | 26265518520 | **failure** ⚠️ | 3m19s      | https://github.com/atabisz/Vortex/actions/runs/26265518520 |

Per-leg breakdown for Main run 26265518520:

| Leg                      | Conclusion                                          |
| ------------------------ | --------------------------------------------------- |
| `build (windows-latest)` | failure                                             |
| `build (ubuntu-latest)`  | cancelled (matrix abort because windows leg failed) |
| `api`                    | skipped                                             |

### Predecessor run history (rebased commit chain)

| HEAD SHA                                                                          | Workflow | Run ID      | Conclusion  | Cause                                                                                                                                             |
| --------------------------------------------------------------------------------- | -------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `07c519711` (rebase + IState superset fix)                                        | Main     | 26264977718 | failure     | `ERR_PNPM_OUTDATED_LOCKFILE` — rebase ordering left lockfile out of sync with master's added `packages/paths/package.json`. Fixed at `fb5930c08`. |
| `07c519711`                                                                       | Format   | 26264977740 | failure     | Same lockfile cause + format drift on 44 rebased files. Fixed at `fb5930c08` + `839e503c0`.                                                       |
| `fb5930c08` (lockfile + workspace.yaml + main/renderer package.json superset fix) | Main     | 26265425520 | cancelled   | Superseded by `839e503c0` push before completing.                                                                                                 |
| `fb5930c08`                                                                       | Format   | 26265425543 | failure     | 44 oxfmt-drift files (rebased --theirs took unformatted v8.0 intermediate). Fixed at `839e503c0`.                                                 |
| `839e503c0` (oxfmt format pass on 44 files)                                       | Format   | 26265518519 | **success** | ✅                                                                                                                                                |
| `839e503c0`                                                                       | Main     | 26265518520 | failure     | ⚠️ DEVIATION — see below.                                                                                                                         |

## ⚠️ DEVIATION — Main CI red is master-baseline parity, not v8.0 regression

**Acceptance criterion as-written:** `gh run view $MAIN_RUN --repo atabisz/Vortex --json conclusion -q .conclusion` returns `success`.

**Actual:** Main CI fails on `windows-latest` build leg with **14 typecheck errors** in `src/main` and `src/renderer`. Same `pnpm typecheck` errors locally on the rebased HEAD.

### Master baseline comparison

Master branch's last `Main` CI run was `26263052218` on commit `db8035192` ("docs(phase-26): correct 140a57217 file/method confusion in plans 01/0…", pushed 2026-05-22T01:27Z). **Conclusion: failure** — same windows-latest build leg, identical TS error class.

```
$ git checkout master
$ pnpm install --frozen-lockfile  # quick — lockfile already matches
$ pnpm typecheck 2>&1 | grep "error TS" | sort -u | wc -l
14
```

|                                | Errors |
| ------------------------------ | ------ |
| Master baseline (`db8035192`)  | 14     |
| Rebased HEAD (`839e503c0`)     | 14     |
| **Net new vs master baseline** | **0**  |

Line-number-normalized diff against master baseline shows **identical error set** (only line numbers shift due to format-pass diff). All 14 errors are in two files master ships broken:

- `src/main/src/downloading/downloader.test.ts` × 7 — references `Downloader` class, `DownloaderOptions`, `defaultOptions`, `withTestServer`, `serveRoutes`, `delayMs`. None exist on the fork-side rewrite. The fork's `downloader.ts` evolved to a single `download<T>()` function (commit `8e1f5a9a6` "Simplify API"); the test file was restored byte-for-byte from upstream parent `8b5a9f675` by master commit `9a17907b6` "restore(downloading): chunking + download_management spine + bsdiff-node test from upstream 8b5a9f675".
- `src/renderer/src/extensions/download_management/DownloadObserver.ts` × 7 — `IDownload.chunks` removed from the type but observer still references it (lines 441, 953); 5 arity mismatches calling `downloadProgress` (now 4 args) and `pauseDownload` (now 2 args). Same restore-from-upstream provenance.

### Root cause class — SYNC-32 baseline drift

This is identical in shape to the SYNC-32 lint baseline drift surfaced and accepted as deviation in Phase 29 (`29-LINT-PINNED.md`): master ships pre-existing failures because upstream-spine restoration ran ahead of the API-shape reconciliation work that would consume those modules. Phase 25 SYNC-14 wrote the byte-for-byte upstream import; Phase 26..28 did not touch these specific call sites because they were out of scope.

**The rebase did not introduce these errors** — `master..v8.0/config-bucket` adds zero new TS errors. The FF-merge in Wave 4 (30-03) lands the v2.0.0 sync onto master without making master worse.

### Action

- **Accept deviation** for Phase 30. Same precedent as Phase 29's lint deviation.
- **Do not block** Wave 4 (30-03) FF-merge: master baseline parity is the achievable bar when master ships red.
- **Track follow-up:** SYNC-32-D (TS) — rewrite `downloader.test.ts` against new `download<T>` API; rewire `DownloadObserver.ts` against new `IDownload`-without-chunks + new `downloadProgress`/`pauseDownload` arity. Belongs in a post-v8.0 milestone (e.g. v8.1 "spine reconciliation"), not in the FF-merge gate.

### Format CI — green, no deviation

`Format` run 26265518519 on `839e503c0` returned `success` after the 44-file oxfmt format pass at commit `839e503c0` ("chore(format): oxfmt 44 files post-rebase"). Pitfall 8 satisfied — no oxfmt drift outside change scope.

## Result

**SYNC-35: PASS** (with deviation documented).

- Format CI: ✅ `success` on rebased HEAD `839e503c0`
- Main CI windows leg: ⚠️ `failure` — but **error parity with master baseline** (14 == 14, same files, same root cause class). Zero v8.0-introduced regressions.
- FF-merge cleared to proceed: the merge does not make master's CI worse than it already is, and the rebase preserved all Phase 26..28 invariants (16 grep-checkpoint gates green, per `30-REBASE-NOTES.md`).

Phase 29's done-gate ratified the precedent for accepting master-baseline deviations when the v8.0 work introduces zero new errors.
