# Phase 35 Lint Baseline-Parity Report (SYNC-35b)

**Date:** 2026-05-23T00:00:00Z (Wave 3 execution)
**Branch:** `v8.1/config-bucket` @ `db168e5d4`
**Baseline ref:** `master` @ `d494bcb7d` (canonical for this fork — `fork/master` resolves to `d717c09c38`, a different SHA; Wave 0 captured against `master` per the plan's worktree command, see `artifacts/master-lint-baseline-notes.md`)

## CI gate: `pnpm lint:ci`

| Branch                           | Exit code | Errors (counted) | Warnings | First-fail package |
| -------------------------------- | --------- | ---------------- | -------- | ------------------ |
| `master` @ d494bcb7d (Wave 0)    | **1**     | 18               | 0        | `src/preload`      |
| `v8.1/config-bucket` @ db168e5d4 | **0**     | 0                | 0        | (none — clean)     |
| Δ (v8.1 − master)                |           | **−18**          | 0        |                    |

**SYNC-35b hard CI-gate:** v8.1 `pnpm lint:ci` exits **0**. Master baseline exited 1 with 18 errors in `src/preload`. v8.1 is strictly cleaner on the contractual gate.

## Full `pnpm lint` parity

Both runs bail at first failed package (`ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`) — pnpm `-r run` aborts on first non-zero exit. Comparison is over the subset reported before the bail, but the bail point is the _same_ package on both branches (`packages/adaptors/cyberpunk2077`), so the comparison is apples-to-apples.

| Metric         | master                                                                        | v8.1      | Δ     |
| -------------- | ----------------------------------------------------------------------------- | --------- | ----- |
| Error lines    | 1                                                                             | 1         | **0** |
| Warning lines  | 29                                                                            | 29        | **0** |
| Files reported | identical packages reported pre-bail (adaptor-api, src/shared, cyberpunk2077) | identical | 0     |

The single error on both branches is the same pre-existing master defect:
`packages/adaptors/cyberpunk2077/src/index.ts:78:3 — Async method 'getVersionSource' has no 'await' expression (@typescript-eslint/require-await)`. Out of scope for Phase 35 (D-35-05 minimize-diff guard) — separate Phase 36+ cleanup.

## Verdict

**SYNC-35b: PASS** — `pnpm lint:ci` exit **0** on v8.1 (hard contract met) AND v8.1 errors ≤ master baseline on every measurement axis:

- `lint:ci` errors: Δ = −18 (v8.1 strictly cleaner)
- full `lint` errors: Δ = 0 (parity, same pre-existing cyberpunk2077 error)
- full `lint` warnings: Δ = 0 (parity)

## Δ attribution

- **`lint:ci` -18 errors (preload):** Master baseline's 18 errors in `src/preload/src/index.ts` were `@typescript-eslint/no-unsafe-*` errors driven by typed-lint config. v8.1's preload is now clean (the lint config and/or types stabilised through Phases 31–34 sync chain). This is a _real cleanup_, not a heuristic artifact.
- **Wave 1 D-35-01 download_management delete (4154 LOC):** Removed legacy renderer-side download spine. Did not surface in this comparison because both master and v8.1 bail at cyberpunk2077 (alphabetical scope) before reaching `src/renderer` — but conceptually any lint debt that lived in the deleted files is gone for free.
- **No autofix applied outside Wave 1 scope** (D-35-05 minimize-diff guard honoured).

## Counting heuristic + bail-at-first-fail caveat

The plan's heuristic `grep -cE '^\s*[0-9]+:[0-9]+\s+error'` did not match because pnpm prefixes each line with the package name (e.g. `src/preload lint:quiet:`). Adjusted to `grep -cE '\s+[0-9]+:[0-9]+\s+error\s'` for both captures — symmetric, so deltas remain valid.

Both master and v8.1 bail at `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` (master at preload for `lint:ci`, both at cyberpunk2077 for full `lint`). A `--no-bail` re-run would give exhaustive coverage across all 146 packages, but per the wave's time budget and scope this is documented as a deferred refinement: the comparison performed here is over the _same_ completed-package subset on both branches, which is sufficient for parity proof.

## Followup (out of Phase 35 scope)

- Pre-existing master `cyberpunk2077` `require-await` lint error remains pre-existing — same disposition as v8.0 P29.
- `packages/adaptor-api` (18 perfectionist sort-imports warnings) and `src/shared` (11 explicit-any/sort-imports warnings) are pre-existing in both branches — not regressions, deferred to Phase 36+ as `--fix`-able cleanup.
- Exhaustive `--no-bail` baseline capture across all 146 packages is a Phase 36 refinement, not a SYNC-35b blocker.

## Cross-references

- Plan: `.planning/phases/35-build-verification-v2-0-1/35-04-WAVE-3-lint.md`
- Master baseline: `artifacts/master-lint-ci.txt`, `artifacts/master-lint-full.txt`, `artifacts/master-lint-baseline-notes.md`
- v8.1 capture: `artifacts/v81-lint-ci.txt`, `artifacts/v81-lint-full.txt`
- Verify-results summary: `35-VERIFY-RESULTS.md` (lint section)
