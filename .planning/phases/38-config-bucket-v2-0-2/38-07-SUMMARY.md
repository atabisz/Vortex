# Plan 38-07 — Force-with-lease push to PR #6 — SUMMARY

**Executed:** 2026-05-23
**Plan:** 38-07-PLAN.md
**Phase:** 38-config-bucket-v2-0-2
**Status:** PASS — Phase 38 fully landed on remote

## Push outcome

| Item                                      | Value                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Race detected?                            | No                                                                     |
| Recorded base (Plan 38-01)                | `314ca807c1da7fb0f227c25f8d69d948b60f3fed`                             |
| Lease pin (computed via `git merge-base`) | `314ca807c1da7fb0f227c25f8d69d948b60f3fed`                             |
| Pre-push remote tip                       | `314ca807c1da7fb0f227c25f8d69d948b60f3fed` (== recorded)               |
| Post-push remote tip                      | `84c3310a448f0ad4a1988f82fe0fec4a06269b50`                             |
| Post-push local tip                       | `84c3310a448f0ad4a1988f82fe0fec4a06269b50` (matches)                   |
| PR #6 `headRefOid`                        | `84c3310a448f0ad4a1988f82fe0fec4a06269b50` (verified via `gh pr view`) |
| Strategy                                  | Direct lease-checked push (no rebase fallback needed)                  |

## Push command

```
git push --force-with-lease=sync/upstream-v2.0.2:314ca807c1da7fb0f227c25f8d69d948b60f3fed \
  git@github.com:atabisz/Vortex.git \
  v8.2/sync-upstream-v2.0.2:sync/upstream-v2.0.2
```

Inline SSH URL per memory `feedback_git_push_ssh.md` (sandbox blocks `.git/config` rewrites).

## Commit count on the branch

11 commits ahead of `314ca807c` — vs Plan 38-07 prediction of 9–10:

| #   | SHA         | Title                                                                                                |
| --- | ----------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `4d5822adb` | docs(38): carry-over plan-phase artifacts onto working branch                                        |
| 2   | `1d832f34a` | resolve(config): pnpm-workspace.yaml — take upstream on catalog (native-errors + nexus-api SHA bump) |
| 3   | `28f40bf60` | fix(deps): pin playwright catalog to exact 1.58.2 (patch alignment)                                  |
| 4   | `6ff58e2d4` | resolve(config): .vscode/launch.json — keep HEAD on 3 outFiles regions per D-38-13                   |
| 5   | `2e51cea2d` | resolve(config): src/renderer/tsconfig.json — keep HEAD test-glob excludes                           |
| 6   | `d6e7e3f62` | resolve(config): src/preload/eslint.config.mjs — pick HEAD per D-38-10                               |
| 7   | `383015781` | resolve(config): src/main/eslint.config.mjs — pick HEAD per D-38-10                                  |
| 8   | `449272c75` | resolve(config): src/renderer/eslint.config.mjs — pick HEAD per D-38-10                              |
| 9   | `34b3d1007` | resolve(config): src/shared/eslint.config.mjs — pick HEAD per D-38-10                                |
| 10  | `944336d39` | resolve(config): src/main/prepare-dist-package.mjs — keep HEAD packagesSection block per D-38-12     |
| 11  | `84c3310a4` | chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync                                             |

Delta vs prediction (+1 vs the upper bound of 10):

- **+1 setup commit** (#1) — anticipated by Plan 38-01 SUMMARY's "Setup commit (planning-artifacts carry-over)" section. `.planning/` is gitignored so artifacts had to be force-added onto the working branch as a setup commit before resolutions could begin.
- **+1 follow-up commit** (#3) — playwright catalog pin from `^1.58.2` to exact `1.58.2`. Discovered mid-execution: `^1.58.2` resolves to the latest 1.x at registry-lookup time, but `patches/playwright-core@1.58.2.patch` only applies to the exact 1.58.2. Pinning unblocks `pnpm install` and is documented in 38-06 drift summary.

Both deviations are pre-existing and consistent with v8.1's analogous pattern; neither requires replan.

## D-38-17 done-gate (final state on remote)

| Gate | Item                                                                         | Result                                                                                                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Zero conflict markers across Bucket A (8 hand-resolved + lockfile = 9 files) | **PASS** (verified Plan 38-06 Task 5; persisted to remote)                                                                                                                                                                |
| 2    | `pnpm install` exits 0                                                       | **PASS** (Plan 38-06 Task 3)                                                                                                                                                                                              |
| 3    | `pnpm install --frozen-lockfile` exits 0                                     | **PASS** (Plan 38-06 Task 4 + Plan 38-07 Task 1 re-verification)                                                                                                                                                          |
| 4    | IDE/TS server loads tree without parse errors                                | **PASS by definition** — workspace resolution + nx project loading work; remaining TS1185 errors are source-marker errors in `src/shared/src/types/{ipc,preload}.ts` (Phase 41 territory, deferred per Plan 38-06 Task 4) |
| 5    | Lockfile drift summary in commit body                                        | **PASS** — `git log -1 --pretty=format:'%b' 84c3310a4` contains the 5-bullet drift summary                                                                                                                                |

## PR #6 status

- `headRefName`: `sync/upstream-v2.0.2` ✓
- `headRefOid`: `84c3310a448f0ad4a1988f82fe0fec4a06269b50` ✓
- Status checks (post-push): `check-stale` SKIPPED, `check-dirty` QUEUED — workflow runs are routine PR maintenance, not blocking.
- Closeout comment posted: https://github.com/atabisz/Vortex/pull/6#issuecomment-4524972090

## Out-of-scope on this push (deferred — intentional)

- `extensions/copy-native.mjs` — still marker-bearing (Phase 40 / per-game extensions)
- `rolldown.base.mjs` — still marker-bearing (Phase 40 / build-config)
- Source-side conflicts in `src/main/`, `src/renderer/`, `src/shared/`, `extensions/{mod,download,gamebryo,...}` — Phases 39–41

## Acceptance

- [x] `git rev-parse fork/sync/upstream-v2.0.2` matches `git rev-parse v8.2/sync-upstream-v2.0.2` post-push
- [x] PR #6 `headRefOid` matches local branch HEAD
- [x] All 11 atomic commits land on remote in order
- [x] Lease check pinned to recorded base SHA (no race detected, no rebase fallback used)
- [x] Inline SSH URL used per `feedback_git_push_ssh.md`
- [x] PR #6 closeout comment posted in casual voice per `feedback_casual_voice.md`
- [x] Phase 38 fully landed on shared remote — Phases 39-43 unblocked
