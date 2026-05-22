# Master lint baseline — Wave 0 capture notes

**Captured:** 2026-05-23 (Wave 0 readiness)
**Master ref:** `master` @ `d494bcb7d` (`fork/master` resolves to `d717c09c38` — different SHA; Wave 0 used `master` per plan command, see note below)
**Baseline ref resolution:** `fork/master` exists on this clone (contra RESEARCH risk #2 assumption). Plan §Task 7 worktrees `master`, so the captured baseline is `master` not `fork/master`. Wave 3 should decide whether to recapture against `fork/master` or treat `master` as canonical (CONTEXT D-35-05 says baseline-parity is vs `fork/master` — recapture may be needed).

## Captures

| File                 | Command        | Exit | First-fail package                | Errors at fail | Warnings at fail |
| -------------------- | -------------- | ---- | --------------------------------- | -------------- | ---------------- |
| master-lint-ci.txt   | `pnpm lint:ci` | 1    | `src/preload`                     | 18             | 0                |
| master-lint-full.txt | `pnpm lint`    | 1    | `packages/adaptors/cyberpunk2077` | 1              | 0                |

## Important: partial baseline

Both runs bail at the first failed package (`ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`) — pnpm `-r run` aborts on first non-zero exit. So these counts are **first-fail-only**, not exhaustive across all 146 packages.

Packages that completed before the fail (warnings-only, not blocking):

- **`pnpm lint` full:** `packages/adaptor-api` (18 warnings), `src/shared` (11 warnings) — these completed before `cyberpunk2077` failed.
- **`pnpm lint:ci`:** `packages/adaptor-api`, `src/shared` ran clean (Done) before `src/preload` failed with 18 errors.

For Wave 3 parity proof: this first-fail behaviour means a literal "errors ≤ baseline" comparison is fragile — if v8.1 fails earlier in the chain than master, you'd miss baseline errors that live in later packages. Wave 3 should consider running per-package lint (or `pnpm -r --no-bail lint`) to get an exhaustive cross-package count.

## Sum-of-completed counters

These sum across `✖` lines in each artifact (counts what was reported before bailout, useful as a floor):

- `master-lint-ci.txt`: errors=18, warnings=0 (preload only — adaptor-api + src/shared logged Done with no `✖` line)
- `master-lint-full.txt`: errors=1, warnings=50 (adaptor-api + src/shared + cyberpunk2077 reported `✖`)

## Wave 3 follow-up

1. Decide canonical baseline ref: `fork/master` (`d717c09c38`) vs `master` (`d494bcb7d`) — they're different SHAs.
2. Consider re-running with `--no-bail` to get exhaustive package-level baseline.
3. Apply baseline-parity check on `v8.1/config-bucket` post-Wave-1.
