---
phase: 35
wave: 4
plan_id: 35-05
title: "Wave 4 — test (SYNC-35c)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35c
dependencies:
    - 35-04 # Wave 3 lint must be green
estimated_commits: 0
---

# Wave 4 — `pnpm run test` exits 0 (Vitest)

## Goal

Close SYNC-35c: prove `pnpm test` (= `pnpm vitest run --coverage` per package.json) exits 0 on `v8.1/config-bucket` HEAD post-Wave-1-delete. Document the Jest disposition explicitly: SYNC-35c says "Vitest + Jest" but `pnpm test` only invokes Vitest, and the root `jest.config.mjs` references `__mocks__/` files that Phase 34 H1 deleted in 34-08. Adopt RESEARCH §5 risk #1 recommendation — pragmatic Vitest-only PASS, document Jest as orphaned vestige, defer Jest config cleanup to Phase 36+ followup. Verification-only — no commits.

References: see `35-CONTEXT.md` D-35-06; `35-RESEARCH.md` §4 Wave 4 + §5 risk #1; Phase 34 D-34-13/D-34-15 R2 DROP receipt (`__mocks__/` removed in 34-08).

## Tasks

1. **Run `pnpm test` and capture full output.**
    - Capture to `.planning/phases/35-build-verification-v2-0-1/artifacts/v81-test.txt`.
    - This is the SYNC-35c contract verbatim.

2. **Confirm zero failed tests; record pass/skip counts.**
    - Vitest exit 0 is the hard contract. Capture pass/skip/total counts for the artifact.

3. **Confirm Jest is orphaned (not invoked by `pnpm test`).**
    - Verify root `jest.config.mjs` references `__mocks__/` paths that Phase 34 Wave H removed.
    - Document this disposition: SYNC-35c PASS = Vitest only (Jest config is vestige). Defer cleanup of `jest.config.mjs` and any orphan Jest scripts to Phase 36+.

4. **E2E disposition.**
    - `packages/e2e` uses Playwright via `pnpm e2e`, not Vitest. Out of scope for SYNC-35c per CONTEXT § Out of scope (UAT deferred to Phase 999.1 / 37). Note this in the artifact for audit clarity.

5. **Append `## Test (SYNC-35c)` section to `35-VERIFY-RESULTS.md`.**

## Verification commands

```bash
# Task 1 — pnpm test (Vitest)
mkdir -p .planning/phases/35-build-verification-v2-0-1/artifacts
pnpm test 2>&1 | tee .planning/phases/35-build-verification-v2-0-1/artifacts/v81-test.txt
echo "test exit=$?" >> .planning/phases/35-build-verification-v2-0-1/artifacts/v81-test.txt
# Expected: exit 0

# Task 2 — pass/skip/fail counts (Vitest stylish summary)
grep -E 'Test Files|Tests' .planning/phases/35-build-verification-v2-0-1/artifacts/v81-test.txt | tail -10

# Task 3 — confirm Jest config references deleted __mocks__/ paths
test -f jest.config.mjs && \
  grep -nE '__mocks__|<rootDir>' jest.config.mjs
test -d src/renderer/src/__mocks__ \
  && echo "__mocks__ still present (unexpected)" \
  || echo "__mocks__ removed by Phase 34 Wave H (expected; D-34-13 R2 DROP)"
# Verifies the orphan-Jest finding from RESEARCH §5 risk #1.
```

## Artifact emission

Append to `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md`:

```markdown
## Test (SYNC-35c)

**Date:** <utc-iso>
**Status:** PASS (pragmatic — Vitest only)

### Vitest result

- Command: `pnpm test` (= `pnpm vitest run --coverage`)
- Exit: 0
- Test files: <pass>/<total>
- Tests: <pass>/<total> (skip <skip>; fail 0)

### Jest disposition

`pnpm test` does not invoke Jest. The root `jest.config.mjs` references `__mocks__/cheerio.js`
and other `<rootDir>/__mocks__/` paths that Phase 34 Wave H removed via D-34-13 R2 DROP
(`git rm -r src/renderer/src/__mocks__/`). The Jest config is therefore an orphan vestige; a
Jest invocation would error on missing mock files, but SYNC-35c's contract is satisfied by the
Vitest-only PASS because the project's actual test runner is Vitest.

**Disposition:** ORPHAN — Jest config + invocations deferred to Phase 36+ followup
(R4 candidate). Phase 35 SYNC-35c PASS confirmed via Vitest exit 0.

### E2E disposition

`packages/e2e` Playwright tests are out of scope for SYNC-35c per CONTEXT § Out of scope —
UAT deferred to Phase 999.1 / Phase 37.
```

## Commits

**Zero commits in Wave 4.** Verification-only. Artifact gitignored.

## Risks / contingencies

- **`pnpm test` exit non-zero.** Hard FAIL. Investigate which test failed. Most likely culprits post-Wave-1: any test that imported `DownloadManager` / `DownloadObserver`. Per RESEARCH §1 audit, the only hits in test files were comments (`selectors.test.ts:64,82` are comment-only references, no actual test imports), so this should not happen. If it does, branch A's Σ(significant)=0 evidence was incomplete — escalate.
- **Vitest coverage step crashes on missing source files.** Vitest's `--coverage` instrumentation walks the project tree. If something in the deleted files was being instrumented, coverage may have stale references. Solution: re-run without `--coverage` first to isolate (`pnpm vitest run`); if that passes, the failure is coverage-instrumentation only and likely a config cleanup is needed (out of Phase 35 scope; document and defer).
- **Lockfile drift** (R1 carry-over from v8.0 P29 — did not trigger then, unlikely now). If `pnpm install` re-runs and produces a lockfile diff, abort the test invocation, investigate, and either fix the workspace catalog or fresh-install. Document in artifact.
- **R4 ORPHAN Jest** — explicitly deferred. Don't try to fix `jest.config.mjs` in this wave; it's not on the SYNC-35c critical path.

## Done criteria

1. `pnpm test` exits 0 on v8.1/config-bucket HEAD.
2. Zero failed tests; pass/skip counts captured in artifact.
3. Jest disposition documented as ORPHAN with explicit deferral.
4. E2E disposition documented as OUT-OF-SCOPE.
5. `35-VERIFY-RESULTS.md` test section appended.
6. SYNC-35c satisfied (pragmatic interpretation per RESEARCH §5 risk #1); Wave 5 unblocked.
