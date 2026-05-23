# Phase 35 — D-35-10 Done-Gate Evidence

**Date:** 2026-05-23
**HEAD at gate evaluation:** 3a556fa6b
**Branch:** `v8.1/config-bucket`
**Verdict:** **GREEN — 7/7**

D-35-10 7-criterion gate per `35-CONTEXT.md`. All criteria evaluated against final wave-state evidence and a fresh re-run on closeout HEAD. SYNC-35a..e all green; Phase 35 closes.

## Criterion table

| #   | Criterion                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                 | Status |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| C1  | `pnpm run typecheck` exits 0                                                       | Fresh re-run on HEAD `3a556fa6b`: `Successfully ran target typecheck for 60 projects and 7 tasks they depend on` (exit 0). Wave 2 evidence: `35-VERIFY-RESULTS.md` §Typecheck post-CONTINGENCY-FIX (commit `52ea1941b` restored `packages/paths{,-node}/src/`).                                                                                          | PASS   |
| C2  | `pnpm lint:ci` exit 0; v8.1 ≤ master baseline                                      | Wave 3 baseline file: `.planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md` line "**SYNC-35b: PASS** — `pnpm lint:ci` exit **0** on v8.1 (hard contract met)". v8.1 errors counted = 0; master @ `d494bcb7d` = 18 (Δ −18).                                                                                                                 | PASS   |
| C3  | `pnpm test` exit 0 (Vitest); Jest documented ORPHAN                                | Wave 4 evidence: `35-VERIFY-RESULTS.md` §Test (SYNC-35c) — Vitest exit 0, 52 files / 1304 tests pass, 0 fail. Artifact: `artifacts/v81-test.txt`. Jest: orphan disposition documented (mocks deleted Phase 34 H; `pnpm test` invokes Vitest only).                                                                                                       | PASS   |
| C4  | `pnpm build` + `pnpm build:extensions` exit 0; bundledPlugins ≥ 130                | Wave 5 evidence: `35-VERIFY-RESULTS.md` §Build (SYNC-35d) — both exits 0; bundledPlugins = 132 (floor 130, margin 2). Artifacts: `artifacts/v81-build.txt`, `artifacts/v81-build-extensions.txt`. No native-dep webpack warnings.                                                                                                                        | PASS   |
| C5  | `src/main/electron-builder.config.json` deleted; `package:nosign` smoke clean      | Wave 6 commit `3a556fa6b chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs`. Filesystem check at gate time: `[ ! -f src/main/electron-builder.config.json ]` true; `electron-builder.config.cjs` present. `pnpm package:nosign` script-line smoke PASS (full AppImage build deferred to Phase 36 release-linux.yml per plan). | PASS   |
| C6  | STATE.md updated (Phase 35 closeout block + counters)                              | This closeout commit (paired with C7) appends `## Phase 35 — build verification v2.0.1` block, advances `progress.completed_phases`, updates `Current Position`, `last_activity`, `Last session`.                                                                                                                                                        | PASS   |
| C7  | ROADMAP.md updated (Phase 35 [x] + plan checklist + Progress row + milestone line) | This closeout commit ticks Phase 35 row to `[x]`, populates the 8 wave plan files all `[x]`, bumps milestone to "Phases 31–35 complete; 5/7 phases done", updates Progress table row.                                                                                                                                                                    | PASS   |

## SSH-sign + no-verify audit (Phase 35 commit range)

Anchor: `e2127cecb` (Wave 1 download_management drop). Range: `e2127cecb^..HEAD` (4 commits before this closeout; 5 after).

```
3a556fa6b gpgsig=1 | chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs
db168e5d4 gpgsig=1 | docs(phase-35): append CONTINGENCY-FIX UPDATE to 35-VERIFY-RESULTS.md
52ea1941b gpgsig=1 | fix(merge): restore packages/paths{,-node}/src/ from master — backfill v2.0.1 merge gap
e2127cecb gpgsig=1 | chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter
```

`git log --format=%B e2127cecb^..HEAD | grep -ic 'no-verify'` → **0**.

All Phase 35 commits SSH-signed via `~/.ssh/id_ed25519`. Zero `--no-verify`. Zero `--no-gpg-sign`. Local `gpg.ssh.allowedSignersFile` not configured (sandbox limitation), so `git log --format='%G?'` reports `N`; sigs are present in the `gpgsig` block per `git cat-file -p` walk. Phase 36 verifies on push.

## Per-bucket typecheck (final, post-closeout HEAD)

| Bucket                                       | Errors |
| -------------------------------------------- | ------ |
| `src/shared/tsconfig.json`                   | 0      |
| `src/preload/tsconfig.json`                  | 0      |
| `src/main/tsconfig.json`                     | 0      |
| `src/renderer/tsconfig.json`                 | 0      |
| `.github/actions/fingerprints/tsconfig.json` | 0      |
| `packages/e2e/tsconfig.json`                 | 0      |

All six = 0. Phase 34 baseline preserved across the renderer-bucket transition (was 9 → 0 closed by Wave 1 `e2127cecb` delete).

## Marker audit

`git grep -nE '^(<{7}|={7}|>{7})( |$)' -- ':!.planning' | wc -l` → **0**.

## Verdict

**D-35-10: GREEN 7/7.** SYNC-35a, SYNC-35b, SYNC-35c, SYNC-35d, SYNC-35e all closed. Phase 35 closed. Phase 36 unblocked: push `v8.1/config-bucket` to fork; FF-merge PR #5; SSH-signed tag `v2.0.1-linux-rebased`; cherry-pick to `linux-port`; `release-linux.yml` AppImage + .deb.
