---
phase: 35
plan: 08
wave: 7
subsystem: build-verification-v2-0-1-closeout
title: "Wave 7 — Phase 35 master closeout (D-35-10 done-gate + STATE + ROADMAP + master SUMMARY)"
status: complete
completed: 2026-05-23
branch: v8.1/config-bucket
files_resolved: 0
commits: 1
ssh_signed: all
requirement_ids:
    - SYNC-35a
    - SYNC-35b
    - SYNC-35c
    - SYNC-35d
    - SYNC-35e
phase_total_commits: 5
phase_anchor_commit: e2127cecb
key-files:
    created:
        - .planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md
        - .planning/phases/35-build-verification-v2-0-1/35-08-SUMMARY.md
    modified:
        - .planning/STATE.md
        - .planning/ROADMAP.md
        - .planning/REQUIREMENTS.md
key-decisions:
    - "D-35-01 branch A (drop dead DownloadManager + DownloadObserver) executed Wave 1; renderer-bucket 9 → 0"
    - "D-35-04 orphan electron-builder.config.json deleted Wave 6; .cjs is the live consumer"
    - "Wave 2 contingency: packages/paths{,-node}/src/ restored from master (commit 52ea1941b) to backfill v2.0.1 merge gap before SYNC-35a could be declared PASS at the broad-interpretation contract"
    - "Phase 35 CLOSED 2026-05-23 on v8.1/config-bucket. Phase 36 owns push + FF-merge + tag (v2.0.1-linux-rebased) + cherry-pick to linux-port + release-linux.yml AppImage + .deb. NO push from sandbox."
---

# Phase 35 Plan 08: Wave 7 (master closeout) Summary

Phase 35 — build verification v2.0.1 — **CLOSED** on `v8.1/config-bucket` 2026-05-23.

The Wave 7 done-gate evaluated D-35-10's 7 criteria green on the closeout HEAD, then committed the STATE + ROADMAP + REQUIREMENTS closeout block plus this master SUMMARY and the seven preceding wave plans. Phase 36 is unblocked and owns push + FF-merge + tag.

## 1. Header

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Phase         | 35 — build verification v2.0.1                                                       |
| Status        | COMPLETE                                                                             |
| Branch        | `v8.1/config-bucket` (no push from sandbox; Phase 36 owns)                           |
| Closeout date | 2026-05-23                                                                           |
| Anchor commit | `e2127cecb` (Wave 1 — chore(download_management): drop dead DownloadManager…)        |
| Total commits | 5 in `e2127cecb^..HEAD` after closeout (all SSH-signed)                              |
| Done-gate     | D-35-10 7/7 GREEN (no scope adjustments needed; renderer-bucket 9 → 0 closed Wave 1) |

## 2. D-35-10 done-gate evidence

| #   | Criterion                                                           | Evidence anchor                                                                                                                                                                                                                                                                                | Status |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| C1  | `pnpm run typecheck` exits 0                                        | Fresh re-run on closeout HEAD (`Successfully ran target typecheck for 60 projects and 7 tasks they depend on`, exit 0); `35-VERIFY-RESULTS.md` §Typecheck CONTINGENCY-FIX (post `52ea1941b`); per-bucket all 0.                                                                                | PASS   |
| C2  | `pnpm lint:ci` exit 0; v8.1 ≤ master                                | `35-LINT-BASELINE.md`: v8.1 lint:ci errors 0 vs master @ `d494bcb7d` 18 (Δ −18); pre-bail full lint surface unchanged (1 error / 29 warnings, both pre-existing, identical to master).                                                                                                         | PASS   |
| C3  | `pnpm test` exit 0 (Vitest)                                         | `35-VERIFY-RESULTS.md` §Test (SYNC-35c) — 52 files / 1304 tests pass, 0 fail; Jest `__mocks__/` mocks deleted Phase 34 H, `pnpm test` invokes Vitest only (no Jest in script). Artifact `artifacts/v81-test.txt`.                                                                              | PASS   |
| C4  | `pnpm build` + `pnpm build:extensions` exit 0; bundledPlugins ≥ 130 | `35-VERIFY-RESULTS.md` §Build (SYNC-35d) — both exit 0; bundledPlugins=132 (floor 130, margin 2); 144 `build: Done` markers (v8.0 baseline 133; Δ +11 explained by added workspace surface, no quality regression). Artifacts `artifacts/v81-build.txt`, `artifacts/v81-build-extensions.txt`. | PASS   |
| C5  | orphan `electron-builder.config.json` deleted                       | Wave 6 commit `3a556fa6b`; filesystem at gate time: `.json` absent, `.cjs` present; `package:nosign` script-line smoke PASS.                                                                                                                                                                   | PASS   |
| C6  | STATE.md updated                                                    | This closeout commit (paired with C7).                                                                                                                                                                                                                                                         | PASS   |
| C7  | ROADMAP.md updated                                                  | This closeout commit (Phase 35 row `[x]`; 8 wave plans `[x]`; v8.1 milestone "Phases 31–35 complete; 5/7 phases done"; Progress table row Complete).                                                                                                                                           | PASS   |

Detail file: `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md`.

## 3. SYNC-35a..e roll-up

| Req      | Surface                                                             | Command(s)                             | Status | Wave artifact                                                               |
| -------- | ------------------------------------------------------------------- | -------------------------------------- | ------ | --------------------------------------------------------------------------- |
| SYNC-35a | `pnpm run typecheck` exits 0 across all workspaces                  | `pnpm run typecheck`                   | PASS   | `35-VERIFY-RESULTS.md` §Typecheck (CONTINGENCY-FIX update post `52ea1941b`) |
| SYNC-35b | `pnpm run lint` baseline-parity with `fork/master`                  | `pnpm lint:ci`; `pnpm lint`            | PASS   | `35-LINT-BASELINE.md`                                                       |
| SYNC-35c | `pnpm run test` exits 0 (Vitest; Jest documented ORPHAN)            | `pnpm test`                            | PASS   | `35-VERIFY-RESULTS.md` §Test; `artifacts/v81-test.txt`                      |
| SYNC-35d | `pnpm run build` + `pnpm run build:extensions` exit 0; ≥130 plugins | `pnpm build`; `pnpm build:extensions`  | PASS   | `35-VERIFY-RESULTS.md` §Build; `artifacts/v81-build*.txt`                   |
| SYNC-35e | Orphan `electron-builder.config.json` reconciled (deleted)          | `git rm` + `pnpm package:nosign` smoke | PASS   | `35-VERIFY-RESULTS.md` §Orphan reconcile (commit `3a556fa6b`)               |

All five `[x]` in `.planning/REQUIREMENTS.md` after this commit.

## 4. Phase 35 commit log

```
$ git log --oneline e2127cecb~..HEAD
<closeout-sha> chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN
3a556fa6b chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs
db168e5d4 docs(phase-35): append CONTINGENCY-FIX UPDATE to 35-VERIFY-RESULTS.md
52ea1941b fix(merge): restore packages/paths{,-node}/src/ from master — backfill v2.0.1 merge gap
e2127cecb chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter
04343f55e docs(35): plan + research artifacts — 8 waves, branch-A confirmed   ← parent of anchor (Phase 34 closeout area)
```

Phase 35 produced **5 SSH-signed commits** in `e2127cecb^..HEAD`:

1. **`e2127cecb`** — Wave 1 D-35-01 branch A: `git rm` `DownloadManager.ts` (1996 LOC) + `DownloadObserver.ts` (2158 LOC). Σ(significant) = 0; renderer-bucket typecheck 9 → 0 (closed Phase 34 carry-over). −4154 LOC of dead code.
2. **`52ea1941b`** — Wave 2 contingency-fix: `git checkout master -- packages/paths{,-node}/src/`. The v2.0.1 merge `aa3faf7e5` had dropped 17 files from `packages/paths/src/` and the entire `packages/paths-node/src/` tree; master retained them under Phase 25 SYNC-14. Restored byte-for-byte. Aggregate `pnpm run typecheck` 130 → 0.
3. **`db168e5d4`** — Wave 2 docs append: `docs(phase-35) append CONTINGENCY-FIX UPDATE to 35-VERIFY-RESULTS.md` documenting the restore + post-fix evidence.
4. **`3a556fa6b`** — Wave 6 D-35-04 orphan delete: `git rm src/main/electron-builder.config.json`. The dotted `.json` was unreferenced (only `structure.md:27` doc mention); `.cjs` is the live consumer. The flatpak yaml's hyphenated `electron-builder-config.json` is a distinct filename, out of scope.
5. **This closeout** — `chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN`. STATE + ROADMAP + REQUIREMENTS + this SUMMARY + DONE-GATE + 8 wave plan files + artifacts (`git add -f` for `.planning/`).

All five SSH-signed via `~/.ssh/id_ed25519`. Zero `--no-verify`. Zero `--no-gpg-sign`.

## 5. Linux-guard surfaces preserved

Phase 35 didn't touch any Linux-guard surface — the only file deletions were:

- Wave 1: `src/renderer/src/extensions/download_management/{DownloadManager,DownloadObserver}.ts` — pre-merge dead code superseded by `IPCDownloadAdapter`. Neither file held Linux platform guards (verified via repo-wide grep before delete).
- Wave 6: `src/main/electron-builder.config.json` — orphan config.json, the `.cjs` carries the active electron-builder config.

The Phase 34 Linux-guard inventory (15+ surfaces across renderer/main/extensions/packaging) is **all intact** post-Phase-35:

- shared/types/errors.ts — fork-only AlreadyDownloaded + DownloadIsHTML preserved
- main/extensions/autoupdater.ts — Linux disposition (no auto-update)
- main/errorReporting.ts — native error handler tier
- main/TrayIcon.ts — Tray API
- renderer/util/elevated.ts — `process.platform === 'linux'` SteamOS sudo -n + desktop pkexec
- renderer/util/errorHandling.ts — `import type PromiseBB` (no runtime binding)
- renderer/util/fs.ts — Linux path-handling
- renderer/extensions/symlink_activator_elevate/index.ts — §1 platform guards
- renderer/extensions/hardlink_activator/index.ts — §3 Linux turbowalk + cross-volume
- renderer/extensions/installer_fomod_ipc/utils/VortexIPCConnection.ts — §3 .NET 9 ELF path
- renderer/extensions/gamemode_management/index.ts — adaptor bridge fallback
- renderer/extensions/nexus_integration/{eventHandlers,util}.ts — bluebird-trap clean
- renderer/ExtensionManager.ts + renderer.tsx — bluebird-trap clean
- flatpak/com.nexusmods.Vortex.yml — Linux packaging
- scripts/build-natives.js — Linux branch
- packages/paths{,-node}/src/ — restored Wave 2 (Phase 25 SYNC-14 byte-for-byte parity vs master)

Audit confirmed: Phase 35 changed only dead code + an orphan config; 0 Linux guards touched.

## 6. Bluebird-trap audit

**N/A.** Wave 1's `git rm` on `DownloadManager.ts` + `DownloadObserver.ts` deleted the only files in Phase 35 scope that imported bluebird. The trap (`import type PromiseBB from "bluebird"` not establishing runtime `Promise = PromiseBB`, so `:Promise<void>` annotations on bluebird-importing async fns can trigger TS1064) cannot fire on files that no longer exist. Wave 6's orphan delete touched a JSON config — no bluebird surface. The contingency-fix in Wave 2 restored `packages/paths{,-node}/src/` byte-for-byte from master; master is the trap-clean reference, so the restore inherits master's clean disposition.

Phase 34's bluebird-trap audit covered all 10 named risk files at risk during the renderer/main spine merge — `mitigate` outcome on every one. No new bluebird-importing files entered the workspace in Phase 35.

## 7. Validation

| Layer | Surface                                           | Result                                                           |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------- |
| L1    | Markers outside `.planning/`                      | 0 (`git grep -nE '^(<{7}\|={7}\|>{7})( \|$)' -- ':!.planning'`)  |
| L2    | Phase 34 harness (carried; not extended Phase 35) | 13/13 GREEN skip-mode (per Phase 34 closeout; surface unchanged) |
| L3    | Per-bucket typecheck (final, post-closeout HEAD)  | shared=0, preload=0, main=0, renderer=0, fingerprints=0, e2e=0   |
| L3    | Aggregate `pnpm run typecheck`                    | exit 0 (60 projects + 7 dependent tasks succeeded)               |

The renderer-bucket flipped from Phase 34's residual 9 (deferred `download_management/` scope) to 0 in Wave 1's `e2127cecb`. The aggregate flipped from 130 (broken `packages/paths` workspace) to 0 in Wave 2's `52ea1941b` contingency-restore. Both transitions stuck through Waves 3–6 and re-verified at closeout HEAD.

## 8. Blockers + next phase

**Blockers:** none.

**Carry-over:** none into Phase 36. Two soft architectural follow-ups noted, both deferred and out of scope:

- `packages/paths{,-node}` disposition — keep restored (current state) vs adopt upstream `52f934941 "Remove deprecated paths packages"`. Zero downstream consumers; deletion would be safe but not warranted by Phase 35 surface. Phase 36+ decision parallel to Wave 1's D-35-01 branch A.
- Jest config orphan (`jest.config.mjs` references mocks that were `git rm`'d in Phase 34 H). `pnpm test` invokes Vitest only, so the orphan doesn't affect SYNC-35c. Phase 36+ R4 candidate cleanup.

**Next phase:** **36 — Land + tag + cherry-pick.**

| Step | Owner    | What                                                                                                |
| ---- | -------- | --------------------------------------------------------------------------------------------------- |
| 1    | Phase 36 | Push `v8.1/config-bucket` to fork (`git push git@github.com:atabisz/Vortex.git v8.1/config-bucket`) |
| 2    | Phase 36 | Rebase + `gh pr merge 5 --merge=fast-forward` PR #5                                                 |
| 3    | Phase 36 | SSH-signed annotated tag `v2.0.1-linux-rebased` on post-FF master HEAD; push to origin + fork       |
| 4    | Phase 36 | Cherry-pick Linux-only commits from post-FF master to `linux-port` (path-based filter, D-30-03)     |
| 5    | Phase 36 | `release-linux.yml` runs on tag push; produces AppImage + .deb with SHA256 manifest                 |

Phase 36 is fully unblocked. D-35-00 push prohibition lifts at Phase 36 boundary.

---

## Self-Check

**Created files (this commit):**

- `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md` — 7-criterion table with evidence anchors
- `.planning/phases/35-build-verification-v2-0-1/35-08-SUMMARY.md` — this file

**Modified files (this commit):**

- `.planning/STATE.md` — Phase 35 closeout block + Current Position + counters
- `.planning/ROADMAP.md` — Phase 35 row `[x]`, plans table, milestone line, Progress table
- `.planning/REQUIREMENTS.md` — SYNC-35a..e all `[x]`, Traceability row populated
- `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md` — staged (was modified pre-commit; entered git history via `git add -f` in this closeout)
- `.planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md` — staged via `git add -f` (gitignored path)
- 8 wave plan files (`35-01..35-08-WAVE-*.md`) — staged via `git add -f`
- `35-CONTEXT.md`, `35-RESEARCH.md`, `35-EXECUTION-DAG.md` — staged via `git add -f`
- `artifacts/` directory — staged via `git add -f`

**Commits this wave:**

- `<this-closeout-sha>` `chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN` — single-commit shape per Wave 7 plan §Task 6 preferred path

**Self-Check: PASSED**

Phase 35 — build verification v2.0.1 — **CLOSED 2026-05-23 on `v8.1/config-bucket`**. Phase 36 unblocked.
