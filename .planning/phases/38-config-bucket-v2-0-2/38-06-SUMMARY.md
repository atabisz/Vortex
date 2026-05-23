# Plan 38-06 — Lockfile regen + Phase 38 done-gate — SUMMARY

**Executed:** 2026-05-23
**Plan:** 38-06-PLAN.md
**Phase:** 38-config-bucket-v2-0-2
**Status:** PASS — Phase 38 done-gate (D-38-17) fully satisfied

## Commit

| SHA         | Title                                                      |
| ----------- | ---------------------------------------------------------- |
| `84c3310a4` | `chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync` |

Bundles `pnpm-lock.yaml` (regenerated from scratch) + `pnpm-workspace.yaml` (1-line strip of unused `native-errors` catalog entry). 1893 insertions, 1977 deletions.

## D-38-17 done-gate (5 items)

| Gate | Item                                                                         | Result                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Zero conflict markers across Bucket A (8 hand-resolved + lockfile = 9 files) | **PASS** — `git grep '^<<<<<<< '` over all 9 files exits 1                                                                                                                                                                                                                                                                                                                                                                               |
| 2    | `pnpm install` exits 0 (regen)                                               | **PASS** — Plan 38-05 / Task 3 (lockfile written cleanly, 22815 lines)                                                                                                                                                                                                                                                                                                                                                                   |
| 3    | `pnpm install --frozen-lockfile` exits 0                                     | **PASS** — `Lockfile is up to date, resolution step is skipped`, 3.5s                                                                                                                                                                                                                                                                                                                                                                    |
| 4    | IDE/TS server loads tree without parse errors                                | **PARTIAL → PASS by definition** — nx + workspace resolution work (tsc ran). Failures are TS1185 source-marker errors in `src/shared/src/types/ipc.ts` (lines 415/433/436) and `src/shared/src/types/preload.ts` (lines 98/101/104) — Phase 41 territory (renderer/main spine + nexus + IPC). Per Plan 38-06 Task 4: source-level Phase 39+ conflicts are out of scope for gate 4 — gate is about workspace resolution, which succeeded. |
| 5    | Lockfile drift summary in commit body                                        | **PASS** — drift summary present in commit `84c3310a4` body (5 bullets covering size delta, no major bumps, SHA bump confirmed, native-errors strip explanation, transitive drift accepted)                                                                                                                                                                                                                                              |

## Drift summary highlights

- **Size delta:** -83 lines (22898 → 22815). ~0.16% of lockfile, consistent with RESEARCH §Lockfile Baseline.
- **Direct-dep major-version bumps:** none. Catalog pins held; `playwright` + `@playwright/test` exact-pinned to `1.58.2` to keep `playwright-core@1.58.2` patch applying (4 lockfile refs confirmed).
- **`nexus-api` SHA bump propagated:** `2d92fd2bdc` (13 refs); `4dd3460c2d` fully absent (0 refs).
- **`leveldown` + `levelup` survived:** 39 refs.
- **`native-errors` catalog entry stripped on regen:** Plan 38-05 added the upstream catalog entry, but `cleanupUnusedCatalogs: true` (preserved from upstream) removes it because no fork `package.json` consumes it via `"catalog:"` — `app/package.json:16` has direct git ref `"native-errors": "Nexus-Mods/node-native-errors"`. Catalog re-adoption deferred to Phase 41+ (renderer/main spine + nexus). Bundled the strip with this commit so `--frozen-lockfile` stays green.
- **Transitive drift:** ~80 babel/oxc/rolldown/unrs-resolver/simple-git internals advanced (e.g. `@babel/parser` 7.29.2→7.29.3, `@adobe/css-tools` 4.4.4→4.5.0, new `@unrs/resolver-binding-linux-loong64-*` arch builds). Pure registry forward motion since PR #6 snapshot. Accepted per D-38-18.

## R5 hooks behavior (this commit)

`pnpm install --frozen-lockfile` ran in 3.5s and the husky pre-commit (lint-staged + oxfmt) ran cleanly with no `--no-verify`. R5 risk fully cleared once Plan 38-05 dropped the marker from pnpm-workspace.yaml.

## Pre-flight verification (Task 1)

- 8 hand-resolved Bucket A files all marker-free + committed: ✓
- `packages/paths/package.json` + `packages/paths-node/package.json` present (R1): ✓
- No workspace `**/package.json` markers: ✓ (no precondition surgery needed for v8.2; v8.1 31-07 BG3 pattern not triggered)

## Phase 38 readiness for Plan 38-07

Phase 38 done-gate fully satisfied. Plan 38-07 may proceed:

```
git push --force-with-lease=fork/sync/upstream-v2.0.2:<recorded-base-sha> \
  git@github.com:atabisz/Vortex.git \
  HEAD:refs/heads/sync/upstream-v2.0.2
```

Recorded base SHA for force-with-lease: `314ca807c` (PR #6 merge head, Plan 38-01 SUMMARY).

## Local commits on `v8.2/sync-upstream-v2.0.2` (post-setup-commit)

| #   | SHA                    | Title                                                                                                |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | (setup)                | docs: planning artifacts for v8.2 sync                                                               |
| 2   | (Plan 38-05)           | resolve(config): pnpm-workspace.yaml — take upstream on catalog (native-errors + nexus-api SHA bump) |
| 3   | (Plan 38-05 follow-up) | fix(deps): pin playwright catalog to exact 1.58.2 (patch alignment)                                  |
| 4   | (Plan 38-02)           | resolve(config): .vscode/launch.json — keep HEAD per D-38-13 (build/ vs out/)                        |
| 5   | (Plan 38-02)           | resolve(config): src/renderer/tsconfig.json — keep HEAD test-glob excludes                           |
| 6   | (Plan 38-03)           | resolve(config): src/preload/eslint.config.mjs — pick HEAD per D-38-10                               |
| 7   | (Plan 38-03)           | resolve(config): src/main/eslint.config.mjs — pick HEAD per D-38-10                                  |
| 8   | (Plan 38-03)           | resolve(config): src/renderer/eslint.config.mjs — pick HEAD per D-38-10                              |
| 9   | (Plan 38-03)           | resolve(config): src/shared/eslint.config.mjs — pick HEAD per D-38-10                                |
| 10  | (Plan 38-04)           | resolve(config): src/main/prepare-dist-package.mjs — keep HEAD packagesSection block per D-38-12     |
| 11  | `84c3310a4`            | chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync                                             |

## Acceptance

- [x] All 9 Bucket A files conflict-marker-free (D-38-17 gate 1)
- [x] `pnpm install` exits 0 (D-38-17 gate 2)
- [x] `pnpm install --frozen-lockfile` exits 0 (D-38-17 gate 3)
- [x] Workspace package resolution validated via nx (D-38-17 gate 4 — source-level errors deferred to Phase 41)
- [x] Drift summary in lockfile commit body (D-38-17 gate 5)
- [x] Atomic commit titled per D-38-16
- [x] R5 hooks ran clean — no `--no-verify`
- [x] Phase 38 done-gate fully satisfied — ready for Plan 38-07 push
