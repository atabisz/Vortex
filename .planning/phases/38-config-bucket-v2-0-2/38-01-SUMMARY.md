# Plan 38-01 — Branch + baseline-inventory + R1 verify — SUMMARY

**Executed:** 2026-05-23
**Plan:** 38-01-PLAN.md
**Phase:** 38-config-bucket-v2-0-2
**Status:** PASS (revised — branch base corrected to merge head)

## Branch SHAs

| Ref | SHA |
|-----|-----|
| `v8.2/sync-upstream-v2.0.2` (tip — branch base = merge head) | `314ca807c` |
| `fork/sync/upstream-v2.0.2` (PR #6 head — merge commit with markers) | `314ca807c` |
| `fork/master` (FF target for Phase 43) | `ea21358a4` |
| `master` (local — carries plan-phase docs commit) | `86af0d8d2` |

**Branch base correction (vs initial run):** First execution branched from `fork/master` (`ea21358a4`); per v8.1 prior art (31-01-SUMMARY: branch base matches `fork/sync/upstream-v2.0.1` merge head), the working branch must descend from PR #6's merge commit so upstream ancestry survives for Phase 43's FF-merge. Reset and recreated via `git switch -c v8.2/sync-upstream-v2.0.2 fork/sync/upstream-v2.0.2`. Plan-phase artifacts (`38-RESEARCH.md`, `PATTERNS.md`, `PLAN-CHECK.md`, `38-01..07-PLAN.md`) live on local `master` only — copied into the working branch as a setup commit at the start of Phase 38 execution since `.planning/` is gitignored.

## Master HEAD drift (R4)

CONTEXT.md cited `855fb3e1a`. Current `fork/master` is `ea21358a4` (2 commits forward). Drift is `.planning/`-only (REQUIREMENTS.md + ROADMAP.md milestone seed for v8.2). No Bucket A content moved. R4 unchanged by base correction.

## In-scope conflict files (8 hand-resolved + 1 lockfile = 9 resolution targets)

| File | Conflict regions | Plan |
|------|-----------------:|------|
| `pnpm-workspace.yaml` | 1 | 38-05 |
| `src/main/eslint.config.mjs` | 2 | 38-03 |
| `src/preload/eslint.config.mjs` | 1 | 38-03 |
| `src/renderer/eslint.config.mjs` | 2 | 38-03 |
| `src/shared/eslint.config.mjs` | 2 | 38-03 |
| `src/main/prepare-dist-package.mjs` | 1 | 38-04 |
| `src/renderer/tsconfig.json` | 1 | 38-02 |
| `.vscode/launch.json` | 3 | 38-02 |
| `pnpm-lock.yaml` | 1 marker | 38-06 (regenerate, not hand-resolve) |

Total: **13 hand-resolution regions across 8 files** + 1 lockfile regen. Matches RESEARCH authoritative table exactly. Marker counts re-verified on the corrected branch base — identical to first run because the base IS the marker-bearing commit.

## No-op vs v8.1 prior art (4 files — zero markers + zero diff vs fork/master)

| File | Why no-op |
|------|-----------|
| `package.json` | v2.0.1 → v2.0.2 made zero changes; auto-merge preserved fork HEAD |
| `vitest.config.ts` | same — zero upstream movement |
| `docker/windows/Dockerfile` | same |
| `.vscode/extensions.json` | same |

D-38-06, D-38-09, D-38-08, D-38-11, D-38-13, D-38-14, D-38-15 all **moot** for v8.2.

## NEW vs v8.1 (2 files — bundled into Plan 38-02)

- `.vscode/launch.json` — 3 regions, all `build/` vs `out/` paths under D-38-13. Pure keep-HEAD.
- `src/renderer/tsconfig.json` — 1 region, fork added `*.test.ts` + `*.test.tsx` to the `exclude` list. Pure keep-HEAD.

## R1 — packages/paths{,-node}/package.json carry-forward

Both files **present** on `fork/sync/upstream-v2.0.2` (verified on corrected branch base):
- `packages/paths/package.json`: present
- `packages/paths-node/package.json`: present

R1 benign for v8.2. The v8.1 Phase 31 R1 restoration survived through the v2.0.2 auto-merge. No restore commit needed.

## R2 — Jest `__mocks__/` scaffolding (deferred to Phase 41)

VORTEX-LINUX-MERGE-PLAYBOOK.md §11 — not Phase 38 territory. Phase 41 cleans this up.

## R3 — out-of-scope .mjs (deferred to Phase 40)

Both files conflict-bearing on the merge head but belong to Phase 40 (gamebryo + per-game extensions, mirroring v8.1 Phase 33):
- `extensions/copy-native.mjs`: 1 region
- `rolldown.base.mjs`: 1 region

**Plans 38-02..38-06 must NOT touch these files.** Phase 38 done-gate (D-38-17 item 1 — zero markers in **Bucket A**) is unaffected because both files are out-of-bucket.

## R5 — husky pre-commit handling

Only ONE Bucket A YAML conflicts (`pnpm-workspace.yaml`). No companion `package.json` conflict. **Plans should run hooks normally without `--no-verify`.** Recommended sequencing:

1. Wave 2 (parallel-safe): 38-02, 38-03, 38-04 — JSON/TS/MJS files; oxfmt parses each cleanly once its own markers are resolved.
2. Wave 2 then: 38-05 (pnpm-workspace.yaml) — clears the last YAML markers.
3. Wave 3: 38-06 (lockfile regen) — `pnpm install` runs cleanly because all workspace YAML/JSON now parses.

**Hazard learned during first execution attempt:** husky's pre-commit oxfmt runs over the entire staged set, not just the file being committed. If multiple resolved files are staged together, OK; but if marker-bearing files are still in the index from a prior `git checkout fork/sync/upstream-v2.0.2 -- <file>`, oxfmt will choke on them. Mitigation: `git restore --staged` any marker-bearing file from the index before each atomic commit.

## Plan 38-06 precondition status

Workspace `**/package.json` conflict scan: **empty**. Plan 38-06 has **no known precondition blockers**.

## Setup commit (planning-artifacts carry-over)

Because `.planning/` is gitignored, plan-phase artifacts produced on local `master` (`38-RESEARCH.md`, `PATTERNS.md`, `PLAN-CHECK.md`, `38-CONTEXT.md`, `38-01..07-PLAN.md`, this SUMMARY) were copied into the working branch via `git checkout master -- .planning/phases/38-config-bucket-v2-0-2/` and committed with `git add -f` as the first commit on `v8.2/sync-upstream-v2.0.2`. This sits between the merge head `314ca807c` and the resolution commits.

## Decision references

- D-38-01 — branch `v8.2/sync-upstream-v2.0.2` from **merge head** `fork/sync/upstream-v2.0.2` (corrected from initial fork/master base)
- D-38-02 — push back to `fork/sync/upstream-v2.0.2` with `--force-with-lease` (Plan 38-07)
- D-38-03 — atomic commits per resolved file
- D-38-17 — 5-criterion phase done-gate

## Acceptance

- [x] Local branch `v8.2/sync-upstream-v2.0.2` checked out from merge head `314ca807c`
- [x] Branch base SHA recorded (`314ca807c`)
- [x] 8 in-scope hand-resolved Bucket A files confirmed conflict-bearing on the merge head
- [x] 4 v8.1 prior-art files confirmed zero markers + zero diff (no commits planned)
- [x] R1 verified benign (no restore commit needed)
- [x] R3 .mjs files confirmed out-of-scope (deferred to Phase 40)
- [x] No workspace `package.json` precondition (Plan 38-06 unblocked)
- [x] R2 routed to Phase 41
- [x] Planning artifacts carried over via setup commit (gitignored, --force-add)

Plans 38-02..38-06 may proceed on this branch.
