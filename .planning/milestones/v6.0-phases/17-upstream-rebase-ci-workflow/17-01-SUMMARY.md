---
phase: 17-upstream-rebase-ci-workflow
plan: 01
subsystem: infra
tags: [github-actions, bash, git-rebase, ci, workflow]

# Dependency graph
requires: []
provides:
  - Daily cron polling nexus-mods/Vortex for new release tags
  - rebase-upstream.sh script: 8-step upstream sync with conflict handling and idempotent draft PR creation
  - rebase-upstream.yml workflow: thin YAML delegating to script with fork guard and manual dispatch
  - CI matrix on rebase/* branches via main.yml trigger addition
affects: [master-branch-maintenance, upstream-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "HAS_CONFLICTS flag pattern: if ! git rebase; then ... allows job to succeed even on conflict"
    - "Idempotent PR creation: gh api REST check before gh api REST create prevents duplicate PRs"
    - "Conflict-file capture timing: git diff --name-only --diff-filter=U BEFORE git add -A"
    - "Thin YAML + script delegation: workflow YAML only injects env vars, all logic in .sh"
    - "Detached-HEAD push: git push origin HEAD:refs/heads/$BRANCH required after git rebase in CI"

key-files:
  created:
    - .github/scripts/rebase-upstream.sh
    - .github/workflows/rebase-upstream.yml
  modified:
    - .github/workflows/main.yml

key-decisions:
  - "Script uses UPSTREAM_REPO variable for upstream URL (not inline in git remote add)"
  - "chmod +x set via git update-index --chmod=+x because sandbox filesystem is read-only; git mode 100755 committed correctly"
  - "CONFLICT_FILES captured before git add -A (timing-critical per Open Question 1 in RESEARCH.md)"
  - "Always --draft for both clean and conflict PRs per D-11"
  - "gh pr create (GraphQL) replaced with gh api REST POST /repos/{owner}/{repo}/pulls — GraphQL rejected fork GITHUB_TOKEN"
  - "git push origin HEAD:refs/heads/$BRANCH replaces git push origin $BRANCH to handle detached-HEAD state after rebase"

patterns-established:
  - "Pattern: HAS_CONFLICTS flag with if ! git rebase construct (never abort before committing conflict state)"
  - "Pattern: Idempotency via gh api REST GET /pulls?head= check before creating PR"
  - "Pattern: Always push in CI via HEAD:refs/heads/$BRANCH — git rebase leaves detached HEAD"

requirements-completed: [REBASE-01, REBASE-02, REBASE-03, REBASE-04, REBASE-05, REBASE-06, REBASE-07]

# Metrics
duration: ~30min
completed: 2026-04-15
---

# Phase 17 Plan 01: Upstream Rebase CI Workflow Summary

**GitHub Actions workflow + bash script that daily-polls nexus-mods/Vortex for new release tags, rebases the fork via rebase-upstream.sh, handles conflicts via HAS_CONFLICTS flag, and creates idempotent draft PRs using gh REST API — verified end-to-end via workflow_dispatch**

## Performance

- **Duration:** ~30 min (including two post-task fix iterations from live CI debugging)
- **Started:** 2026-04-15T12:52:32Z
- **Completed:** 2026-04-15T13:30:00Z (estimated)
- **Tasks:** 3 of 3 complete (Task 3 human-verify checkpoint: approved)
- **Files modified:** 3

## Accomplishments
- `.github/scripts/rebase-upstream.sh` created with all 8 steps: upstream remote add/fetch, semver tag resolution, up-to-date check, rebase branch creation, rebase with HAS_CONFLICTS flag, force push, PR body construction, idempotent PR creation (using `gh api` REST)
- `.github/workflows/rebase-upstream.yml` created following cherry-pick.yml structure exactly: daily cron at 06:00 UTC, workflow_dispatch with optional `upstream_ref` input, job-level fork guard `atabisz/Vortex`, full-depth checkout, bot identity, script delegation
- `.github/workflows/main.yml` surgically updated (1 line changed): `rebase/*` added to push branches trigger for CI matrix on rebase branches
- Workflow_dispatch run confirmed green (run 24456541551): detected v1.16.9 as latest upstream tag, created draft PR #1 at https://github.com/atabisz/Vortex/pull/1
- Idempotency confirmed (run 24456582283): "PR #1 already exists, skipping creation" — no duplicate PR opened

## Task Commits

Each task was committed atomically:

1. **Task 1: Create rebase-upstream.sh script** - `826db0e7d` (feat)
2. **Task 2: Create rebase-upstream.yml workflow and add rebase/* trigger to main.yml** - `259c1147c` (feat)
3. **Fix: Switch PR creation to REST API** - `d95a70b1f` (fix)
4. **Fix: Use gh api REST for PR ops and handle detached-HEAD push** - `63d4b5793` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `.github/scripts/rebase-upstream.sh` — Complete upstream sync script: tag detection, rebase, conflict handling, idempotent draft PR creation via `gh api` REST. Mode 100755.
- `.github/workflows/rebase-upstream.yml` — Thin workflow YAML: schedule + dispatch triggers, fork guard, env injection, script delegation
- `.github/workflows/main.yml` — One-line change: `branches: [master, rebase/*]` in push trigger

## Decisions Made
- `chmod +x` via `git update-index --chmod=+x` because sandbox filesystem blocks `chmod` on non-tmp paths — git mode 100755 is committed correctly
- `CONFLICT_FILES` captured before `git add -A` per RESEARCH.md Open Question 1 resolution
- Used `UPSTREAM_REPO` variable (not inline URL in `git remote add`) — consistent with RESEARCH.md complete script example
- Always `--draft` on `gh pr create` regardless of conflict state (per D-11)
- `gh pr create` (GraphQL) replaced with `gh api REST` — discovered during live CI run that GITHUB_TOKEN from a fork cannot use the GraphQL `createPullRequest` mutation against the upstream fork target; REST `/repos/{owner}/{repo}/pulls` endpoint works correctly
- `git push --force origin "${BRANCH}"` replaced with `git push --force origin "HEAD:refs/heads/${BRANCH}"` — `git rebase` in CI leaves the repository in detached-HEAD state; using `HEAD:refs/heads/` explicitly names the destination ref and works regardless of HEAD attachment state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced gh pr create (GraphQL) with gh api REST POST for PR creation**
- **Found during:** Task 3 verification (live CI run)
- **Issue:** `gh pr create` uses the GraphQL `createPullRequest` mutation, which is rejected with "Resource not accessible by integration" when GITHUB_TOKEN originates from a fork workflow — a known GitHub limitation for fork-originated tokens
- **Fix:** Replaced `gh pr create --draft ...` with `gh api -X POST repos/{owner}/{repo}/pulls` using REST JSON body; replaced `gh pr list --head` idempotency check with `gh api GET repos/{owner}/{repo}/pulls?head=` and `jq` array-length test
- **Files modified:** `.github/scripts/rebase-upstream.sh`
- **Verification:** Run 24456541551 green; draft PR #1 created at https://github.com/atabisz/Vortex/pull/1
- **Committed in:** `d95a70b1f` (fix commit after task commits)

**2. [Rule 1 - Bug] Fixed detached-HEAD push failure after git rebase in CI**
- **Found during:** Same live CI run as deviation 1
- **Issue:** `git push --force origin "${BRANCH}"` fails with "src refspec rebase/upstream-v1.16.9 does not match any" because `git rebase` in a CI checkout leaves the repository in detached HEAD state — the branch ref is not set; `git push origin BRANCH` requires HEAD to be attached to that branch
- **Fix:** Changed push command to `git push --force origin "HEAD:refs/heads/${BRANCH}"` — this explicitly names the destination ref and succeeds regardless of HEAD attachment state
- **Files modified:** `.github/scripts/rebase-upstream.sh`
- **Verification:** Run 24456541551 green; branch `rebase/upstream-v1.16.9` appeared in fork and triggered Main CI matrix
- **Committed in:** `63d4b5793` (fix commit after task commits)

---

**Total deviations:** 2 auto-fixed (2 bugs discovered during live CI verification)
**Impact on plan:** Both fixes required for the workflow to function correctly in the GitHub Actions environment. No scope creep — both fixes address the exact behavior described in the plan's REBASE requirements.

## Issues Encountered
- Sandbox filesystem is read-only for the scripts directory, preventing `chmod +x` — resolved via `git update-index --chmod=+x` which sets the executable bit in the git object store (mode `100755`). File runs correctly on GitHub Actions ubuntu-latest runners.
- GitHub GraphQL API restriction for fork GITHUB_TOKEN (see Deviation 1 above)
- Detached-HEAD state after `git rebase` in CI (see Deviation 2 above)

## User Setup Required

None — no external service configuration required. The GITHUB_TOKEN from Actions secrets is sufficient; no additional tokens or secrets needed.

## Threat Surface

No new network endpoints, auth paths, or schema changes. All threats addressed by T-17-01 through T-17-06 mitigations in the plan's threat model:
- T-17-01: Fork guard `if: github.repository == 'atabisz/Vortex'` present on `rebase` job — confirmed working in CI
- T-17-02: All shell variables double-quoted; `set -euo pipefail` active; `upstream_ref` only used as git ref argument
- T-17-03: Force push scoped to `rebase/upstream-*` namespace only; master never pushed by this script
- T-17-06: Explicit `permissions: contents: write, pull-requests: write` block limits token scope

## Self-Check

- `.github/scripts/rebase-upstream.sh` exists: confirmed
- `.github/workflows/rebase-upstream.yml` exists: confirmed
- `.github/workflows/main.yml` contains `rebase/*`: confirmed
- Task commits in git log: `826db0e7d`, `259c1147c`, `d95a70b1f`, `63d4b5793` — all confirmed
- Draft PR #1 exists at https://github.com/atabisz/Vortex/pull/1
- Idempotency confirmed via run 24456582283

## Self-Check: PASSED

## Next Phase Readiness
- Phase 17 complete — automated upstream sync operational
- The fork will receive daily draft PRs when Nexus Mods ships new Vortex releases
- No blockers for future phases

---
*Phase: 17-upstream-rebase-ci-workflow*
*Completed: 2026-04-15*
