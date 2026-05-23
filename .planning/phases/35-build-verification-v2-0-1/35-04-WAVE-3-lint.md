---
phase: 35
wave: 3
plan_id: 35-04
title: "Wave 3 — lint baseline-parity proof (SYNC-35b)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35b
dependencies:
    - 35-03 # Wave 2 typecheck must be green; lint runs on the same tree
estimated_commits: 0
---

# Wave 3 — `pnpm run lint` baseline-parity with `master`

## Goal

Close SYNC-35b: prove `pnpm lint:ci` exits 0 on `v8.1/config-bucket` AND v8.1 lint error count ≤ master baseline (captured in Wave 0). Carries the v8.0 P29 D-29-XX baseline-parity philosophy: pre-existing master errors are NOT regressions, a `−N` delta is PASS, but +N is a regression to investigate. Produce `35-LINT-BASELINE.md` artifact (mirrors v8.0 P29 pattern). Verification-only — no commits.

References: see `35-CONTEXT.md` D-35-05 (parity philosophy + minimize-diff guard); `35-RESEARCH.md` §4 Wave 3 surface + §5 risk #2 (`fork/master` resolution).

## Tasks

1. **Confirm Wave 0 master baseline artifacts exist.**
    - `.planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-ci.txt` and `master-lint-full.txt` from Wave 0.
    - If missing, re-run Wave 0 task 7 — the parity proof is meaningless without the master baseline.

2. **Run `pnpm lint:ci` on `v8.1/config-bucket` HEAD.**
    - This is the CI gate. Exit 0 is the hard contract per D-35-05.
    - Capture stdout/stderr to `.planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-ci.txt`.

3. **Run full `pnpm lint` on `v8.1/config-bucket` HEAD.**
    - Captures the full error/warning surface for parity comparison (lint:ci is `lint:quiet` which suppresses warnings).
    - Capture to `.planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-full.txt`.

4. **Count error lines + compute deltas.**
    - Error-line count for both master and v8.1 captures (use a stable counting heuristic — e.g. count lines matching `^\s*\d+:\d+\s+error` per ESLint stylish formatter).
    - Δ = v8.1 − master. PASS if Δ ≤ 0 AND `pnpm lint:ci` exit 0.

5. **Produce `35-LINT-BASELINE.md`.**
    - Mirrors v8.0 P29 `29-LINT-BASELINE.md` shape (note: v8.0 P29 directory is empty in current tree — use the structural pattern from CONTEXT D-35-05, not a literal file template).
    - Sections: header (date, branch, HEAD, master ref) → CI lint result (`pnpm lint:ci` exit) → full lint result table (master vs v8.1, errors, warnings, delta) → parity verdict (PASS/FAIL with rationale) → notable file-level deltas attributable to Wave 1 download_management deletion (4154 lines of legacy code disappearing naturally drops both error and warning counts).
    - File path: `.planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md`. Gitignored — Wave 7 closeout `git add -f` lands it.

6. **Append the lint section to `35-VERIFY-RESULTS.md`.**
    - One-paragraph summary pointing at `35-LINT-BASELINE.md` for the full proof; explicit PASS/FAIL line.

7. **Minimize-diff audit.**
    - If `pnpm lint:ci` surfaces auto-fixable issues outside Wave 1's deletion scope, DO NOT autofix. The minimize-diff feedback applies — only changes inside the Wave 1 delete are in scope. Document any non-blocking lint debt as Phase 36+ followup, not Phase 35 scope.

## Verification commands

```bash
# Task 1 — confirm Wave 0 baseline exists
test -f .planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-ci.txt
test -f .planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-full.txt
echo "wave 0 baseline present: $?"

# Task 2 — pnpm lint:ci on v8.1
mkdir -p .planning/phases/35-build-verification-v2-0-1/artifacts
pnpm lint:ci 2>&1 | tee .planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-ci.txt
echo "lint:ci exit=$?" \
  >> .planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-ci.txt
# Expected: exit 0 (the hard SYNC-35b CI gate)

# Task 3 — full pnpm lint on v8.1
pnpm lint 2>&1 | tee .planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-full.txt
echo "lint exit=$?" \
  >> .planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-full.txt

# Task 4 — error counts (heuristic: count lines matching ESLint stylish error pattern)
master_errors=$(grep -cE '^\s*[0-9]+:[0-9]+\s+error' \
  .planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-full.txt)
v81_errors=$(grep -cE '^\s*[0-9]+:[0-9]+\s+error' \
  .planning/phases/35-build-verification-v2-0-1/artifacts/v81-lint-full.txt)
echo "master errors: $master_errors"
echo "v8.1 errors:   $v81_errors"
echo "delta:         $((v81_errors - master_errors))"
# Expected: delta ≤ 0
```

## Artifact emission

Write `.planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md`:

```markdown
# Phase 35 Lint Baseline-Parity Report (SYNC-35b)

**Date:** <utc-iso>
**Branch:** v8.1/config-bucket @ <head-sha>
**Baseline ref:** master @ <master-sha> (`fork/master` not present as remote ref — see RESEARCH risk #2)

## CI gate: `pnpm lint:ci`

**v8.1 exit code:** 0 (hard SYNC-35b PASS condition)
**master exit code (Wave 0):** <0|N>

## Full `pnpm lint` parity

| Metric         | master | v8.1 | Δ       |
| -------------- | ------ | ---- | ------- |
| Error lines    | <M>    | <V>  | <V−M>   |
| Warning lines  | <Mw>   | <Vw> | <Vw−Mw> |
| Files reported | <Mf>   | <Vf> | <Vf−Mf> |

## Verdict

**SYNC-35b: PASS** — `pnpm lint:ci` exit 0 AND v8.1 errors ≤ master baseline (Δ = <V−M>).

## Δ attribution

- Wave 1 D-35-01 branch A delete (`<sha>` chore(download_management): drop dead DownloadManager + DownloadObserver) removed 4154 LOC of legacy renderer-side download spine. Any lint-error / lint-warning drop in `extensions/download_management/` is attributable to that delete, not a regression.
- No autofix applied outside Wave 1 scope (D-35-05 minimize-diff guard).

## Followup (out of Phase 35 scope)

- Pre-existing master lint debt remains pre-existing — same disposition as v8.0 P29.
- Auto-fixable issues outside Wave 1 deletion scope deferred to Phase 36+ as a separate cleanup, not Phase 35 scope.
```

Append to `35-VERIFY-RESULTS.md`:

```markdown
## Lint (SYNC-35b)

**Date:** <utc-iso>
**Status:** PASS — `pnpm lint:ci` exit 0; v8.1 errors ≤ master baseline.
**Detail:** see `35-LINT-BASELINE.md`.
```

## Commits

**Zero commits in Wave 3.** Verification-only. Artifacts (`v81-lint-ci.txt`, `v81-lint-full.txt`, `35-LINT-BASELINE.md`, updated `35-VERIFY-RESULTS.md`) are gitignored. Wave 7 closeout uses `git add -f`.

## Risks / contingencies

- **`pnpm lint:ci` exit non-zero on v8.1.** Hard FAIL — SYNC-35b's CI gate is non-negotiable. Investigate the new error(s); if they're in the Wave 1 delete scope (unlikely — files are gone), revert and re-plan branch B; if they're in untouched code, that's pre-existing master debt that just surfaced via the lint config drift — escalate as a separate Phase 36 cleanup, AND fix the v8.1-specific introduction in this wave (in scope).
- **Δ > 0 (v8.1 has more errors than master).** SYNC-35b PASS condition violated. The new errors are by definition introduced by the v8.1 sync chain (Phases 31–34). Investigate file by file; most likely culprits are upstream code adopting fork-incompatible patterns. Fix the smallest possible set in this wave (still in scope per minimize-diff for the lint cleanup itself).
- **Master baseline unobtainable.** Wave 0 risk #2 contingency — substitute baseline with the most recent green master CI lint output. Document the substitution rationale prominently in 35-LINT-BASELINE.md.
- **`oxfmt` config drift between master and v8.1.** Pre-existing — same disposition as v8.0 P29. Ignore unless it produces +N error delta.
- **`v81-lint-ci.txt` artifact contains noise from `pnpm install` / nx daemon startup.** Heuristic counting may over-count; if delta arithmetic looks suspicious, manually inspect both captures. Counting heuristic is a starting point, not gospel.

## Done criteria

1. `pnpm lint:ci` exit 0 on v8.1/config-bucket HEAD.
2. v8.1 error count ≤ master baseline (Δ ≤ 0).
3. `35-LINT-BASELINE.md` artifact written with master vs v8.1 comparison + verdict.
4. `35-VERIFY-RESULTS.md` lint section appended.
5. No autofix changes committed outside Wave 1 deletion scope.
6. SYNC-35b satisfied; Wave 4 unblocked.
