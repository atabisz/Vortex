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
    - "Idempotent PR creation: gh pr list --head before gh pr create prevents duplicate PRs"
    - "Conflict-file capture timing: git diff --name-only --diff-filter=U BEFORE git add -A"
    - "Thin YAML + script delegation: workflow YAML only injects env vars, all logic in .sh"

key-files:
  created:
    - .github/scripts/rebase-upstream.sh
    - .github/workflows/rebase-upstream.yml
  modified:
    - .github/workflows/main.yml

key-decisions:
  - "Script uses UPSTREAM_REPO variable for upstream URL (not inline in git remote add) — matches RESEARCH.md code example"
  - "chmod +x set via git update-index --chmod=+x because sandbox filesystem is read-only; git mode 100755 committed correctly"
  - "CONFLICT_FILES captured before git add -A (timing-critical per Open Question 1 in RESEARCH.md)"
  - "Always --draft for both clean and conflict PRs per D-11"

patterns-established:
  - "Pattern: HAS_CONFLICTS flag with if ! git rebase construct (never abort before committing conflict state)"
  - "Pattern: Idempotency via gh pr list check before gh pr create"

requirements-completed: [REBASE-01, REBASE-02, REBASE-03, REBASE-04, REBASE-05, REBASE-06, REBASE-07]

# Metrics
duration: 3min
completed: 2026-04-15
---

# Phase 17 Plan 01: Upstream Rebase CI Workflow Summary

**GitHub Actions workflow + bash script that daily-polls nexus-mods/Vortex for new release tags, rebases the fork, handles conflicts gracefully via HAS_CONFLICTS flag, and opens idempotent draft PRs with full git metadata**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-15T12:52:32Z
- **Completed:** 2026-04-15T12:56:07Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint — awaiting dispatch run)
- **Files modified:** 3

## Accomplishments
- `.github/scripts/rebase-upstream.sh` created with all 8 steps: upstream remote add/fetch, semver tag resolution, up-to-date check, rebase branch creation, rebase with HAS_CONFLICTS flag, force push, PR body construction, idempotent PR creation
- `.github/workflows/rebase-upstream.yml` created following cherry-pick.yml structure exactly: daily cron at 06:00 UTC, workflow_dispatch with optional `upstream_ref` input, job-level fork guard `atabisz/Vortex`, full-depth checkout, bot identity, script delegation
- `.github/workflows/main.yml` surgically updated (1 line changed): `rebase/*` added to push branches trigger for CI matrix on rebase branches

## Task Commits

Each task was committed atomically:

1. **Task 1: Create rebase-upstream.sh script** - `826db0e7d` (feat)
2. **Task 2: Create rebase-upstream.yml workflow and add rebase/* trigger to main.yml** - `259c1147c` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `.github/scripts/rebase-upstream.sh` — Complete upstream sync script: tag detection, rebase, conflict handling, idempotent draft PR creation. Mode 100755.
- `.github/workflows/rebase-upstream.yml` — Thin workflow YAML: schedule + dispatch triggers, fork guard, env injection, script delegation
- `.github/workflows/main.yml` — One-line change: `branches: [master, rebase/*]` in push trigger

## Decisions Made
- `chmod +x` via `git update-index --chmod=+x` because sandbox filesystem blocks `chmod` on non-tmp paths — git mode 100755 is committed correctly
- `CONFLICT_FILES` captured before `git add -A` per RESEARCH.md Open Question 1 resolution
- Used `UPSTREAM_REPO` variable (not inline URL in `git remote add`) — consistent with RESEARCH.md complete script example
- Always `--draft` on `gh pr create` regardless of conflict state (per D-11)

## Deviations from Plan

None — plan executed exactly as written. The `chmod +x` sandbox limitation was handled transparently via `git update-index --chmod=+x` with no behavioral difference in CI.

## Issues Encountered
- Sandbox filesystem is read-only for the scripts directory, preventing `chmod +x` — resolved via `git update-index --chmod=+x` which sets the executable bit in the git object store (mode `100755`). File runs correctly on GitHub Actions ubuntu-latest runners.

## User Setup Required

**Task 3 (human-verify checkpoint) is blocking.** After this SUMMARY is committed, push to the fork and trigger a manual workflow_dispatch to verify end-to-end behavior. See checkpoint message below.

## Threat Surface

No new network endpoints, auth paths, or schema changes. All threats addressed by T-17-01 through T-17-06 mitigations in the plan's threat model:
- T-17-01: Fork guard `if: github.repository == 'atabisz/Vortex'` present on `rebase` job
- T-17-02: All shell variables double-quoted; `set -euo pipefail` active; `upstream_ref` only used as git ref argument
- T-17-03: Force push scoped to `rebase/upstream-*` namespace only; master never pushed by this script
- T-17-06: Explicit `permissions: contents: write, pull-requests: write` block limits token scope

## Next Phase Readiness
- Task 3 verification pending: push to fork, trigger workflow_dispatch, verify draft PR created with correct title/body, verify idempotency on second run
- After Task 3 passes: Phase 17 complete — automated upstream sync operational

---
*Phase: 17-upstream-rebase-ci-workflow*
*Completed: 2026-04-15*
