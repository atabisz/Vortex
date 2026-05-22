---
phase: 35
wave: 0
plan_id: 35-01
title: "Wave 0 — readiness, lint baseline capture, sanity checks"
branch: v8.1/config-bucket
requirement_ids: [] # Wave 0 is a readiness gate; SYNC-35a..e closure happens in later waves. Wave 0 captures the master lint baseline that SYNC-35b's parity proof depends on.
dependencies: []
estimated_commits: 0
---

# Wave 0 — Readiness check + lint baseline capture + pre-Wave-1 sanity

## Goal

Confirm the Phase 34 done-gate state (D-34-14) is still GREEN on `v8.1/config-bucket` HEAD; capture the master lint baseline that Wave 3 will compare against; run two cheap sanity checks before the Wave 1 delete (webpack-config audit per RESEARCH risk #3 + `.chunks` external-reference audit per RESEARCH risk #4). Verification-only — zero commits.

References: see `35-CONTEXT.md` D-35-00..D-35-10, `35-RESEARCH.md` §1 caller map and §5 risks. The risk numbers below cite RESEARCH §5.

## Tasks

1. **Confirm working-tree clean and on `v8.1/config-bucket`.**
    - Verify branch and clean state. Abort if dirty (Wave 0 must run from a clean tree to produce comparable baselines).

2. **Phase 34 done-gate L1 — markers outside `.planning/` = 0.**
    - Carries the same gate Phase 34 closed on; if non-zero, Wave 0 fails and Phase 35 escalates.

3. **Phase 34 done-gate L3 — per-bucket typecheck baseline (six buckets).**
    - Capture the exact byte-for-byte baseline Phase 34 committed: shared=0, preload=0, main=0, renderer=9, fingerprints=0, e2e=0.
    - Any deviation from this baseline blocks Wave 1.

4. **Pre-Wave-1 sanity: webpack-config audit (RESEARCH risk #3).**
    - Verify `src/renderer/webpack.config.cjs` does not name `DownloadManager` or `DownloadObserver` as an entry-point or chunk reference. Branch A trusts that webpack only follows live imports; this is a 30-second insurance check.

5. **Pre-Wave-1 sanity: `.chunks` external reference audit (RESEARCH risk #4).**
    - Confirm zero `\.chunks\b` references inside `extensions/download_management/` outside the two files being deleted (which both die with the delete).

6. **`fork/master` baseline ref resolution (RESEARCH risk #2).**
    - Project has `master` and `linux-port` only — `fork/master` is not a literal remote ref per project memory. Resolve baseline ref to plain `master` (defaultBase per `nx.json`); if a remote `fork/master` ever shows up, prefer that, but `master` is canonical for this fork.

7. **Capture master lint baseline.**
    - Use a worktree so `v8.1/config-bucket` working tree stays untouched (no `git stash` per project memory `feedback_git_push_ssh.md` Wave-B lesson).
    - Run `pnpm lint:ci` against `master` worktree; capture exit code + stderr/stdout to `.planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-baseline.txt`.
    - Also run full `pnpm lint` on master and capture full output for parity comparison.
    - Note: `.planning/` is gitignored — artifacts written here aren't committed in Wave 0.

8. **Emit Wave 0 readiness note.**
    - Inline summary in execution output: branch, HEAD short SHA, six bucket counts, master baseline error count, two sanity checks GREEN. No file commit (no SUMMARY emitted yet — see Wave 7 closeout).

## Verification commands

```bash
# Task 1 — branch + clean tree
git rev-parse --abbrev-ref HEAD                                            # expect: v8.1/config-bucket
git status --porcelain                                                     # expect: empty (clean)

# Task 2 — markers outside .planning/
git grep -nE '^(<{7}|={7}|>{7})( |$)' -- ':!.planning' | wc -l            # expect: 0

# Task 3 — six-bucket typecheck baseline (pre-Wave-1)
pnpm tsc -p src/shared/tsconfig.json    --noEmit 2>&1 | grep -v TS1185 | wc -l   # expect: 0
pnpm tsc -p src/preload/tsconfig.json   --noEmit 2>&1 | grep -v TS1185 | wc -l   # expect: 0
pnpm tsc -p src/main/tsconfig.json      --noEmit 2>&1 | grep -v TS1185 | wc -l   # expect: 0
pnpm tsc -p src/renderer/tsconfig.json  --noEmit 2>&1 | grep -v TS1185 | wc -l   # expect: 9
pnpm tsc -p .github/actions/fingerprints/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l   # expect: 0
pnpm tsc -p packages/e2e/tsconfig.json  --noEmit 2>&1 | grep -v TS1185 | wc -l   # expect: 0

# Task 4 — webpack-config sanity (RESEARCH risk #3)
grep -n "DownloadManager\|DownloadObserver" src/renderer/webpack.config.cjs   # expect: no output (exit 1)

# Task 5 — .chunks external reference audit (RESEARCH risk #4)
rg -n '\.chunks\b' src/renderer/src/extensions/download_management/ \
  --glob '!DownloadManager.ts' --glob '!DownloadObserver.ts' | wc -l           # expect: 0

# Task 6 — baseline ref resolution
git remote -v                                                              # confirm origin + fork; check whether fork/master exists
git rev-parse --verify fork/master 2>/dev/null && echo "use fork/master" \
  || echo "fall back to master"

# Task 7 — master lint baseline via worktree (NO git stash)
mkdir -p .planning/phases/35-build-verification-v2-0-1/artifacts
git worktree add /tmp/vortex-master master
( cd /tmp/vortex-master && pnpm install --frozen-lockfile && \
  pnpm lint:ci 2>&1 | tee \
    "$(git rev-parse --show-toplevel)/.planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-ci.txt"; \
  echo "lint:ci exit=$?" >> \
    "$(git rev-parse --show-toplevel)/.planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-ci.txt" )
( cd /tmp/vortex-master && pnpm lint 2>&1 | tee \
    "$(git rev-parse --show-toplevel)/.planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-full.txt"; \
  echo "lint exit=$?" >> \
    "$(git rev-parse --show-toplevel)/.planning/phases/35-build-verification-v2-0-1/artifacts/master-lint-full.txt" )
git worktree remove /tmp/vortex-master
```

If `pnpm install --frozen-lockfile` in the master worktree fails because the master lockfile differs from the v8.1 lockfile in a way that needs network/cache re-resolution, the operator may opt to capture lint baseline against an existing CI artifact (most recent green master CI run) and document the substitution in `35-LINT-BASELINE.md` (Wave 3). This is a recognised contingency, not a Wave 0 blocker.

## Commits

**Zero commits in Wave 0.** Verification-only readiness gate. Artifacts under `.planning/phases/35-build-verification-v2-0-1/artifacts/` are gitignored and stay local until Wave 7 closeout `git add -f`.

## Risks / contingencies

- **Bucket baseline drift** — if any of the six per-bucket counts differs from the Phase 34 baseline (shared/preload/main/fingerprints/e2e=0, renderer=9), abort Wave 0 and surface; the divergence indicates uncommitted local work or accidental changes since Phase 34 closeout.
- **Lockfile mismatch on master worktree** — fall back to a fresh `pnpm install` (without `--frozen-lockfile`) in the master worktree, OR substitute the baseline with the most recent green master CI lint output. Document substitution in 35-LINT-BASELINE.md.
- **`fork/master` ambiguity** — RESEARCH risk #2 calls out that `fork/master` is not a literal remote ref. Treat `master` as canonical and document this in the eventual 35-LINT-BASELINE.md so the v8.0 → v8.1 comparison story is unambiguous.
- **Webpack/.chunks check is non-zero** — escalate; Wave 1 cannot proceed with branch A until those external references are mapped (planner would need to revise to branch B surgical patch).

## Done criteria

1. Branch is `v8.1/config-bucket`; working tree clean.
2. Markers outside `.planning/` = 0.
3. Six-bucket typecheck counts match Phase 34 baseline exactly (shared=0, preload=0, main=0, renderer=9, fingerprints=0, e2e=0).
4. `grep -n "DownloadManager\|DownloadObserver" src/renderer/webpack.config.cjs` returns nothing.
5. `\.chunks\b` audit outside the two doomed files = 0.
6. Master lint baseline captured (`master-lint-ci.txt`, `master-lint-full.txt` artifacts on disk).
7. Wave 0 readiness summary printed; Wave 1 unblocked.
