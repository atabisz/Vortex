---
phase: 36
wave: 2
plan_id: 36-02
title: "Wave 2 — FF-land PR #5 via direct push to fork/master"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-36a
dependencies:
    - 36-01 # Wave 1 rebase + Windows CI green
estimated_commits: 0
---

# Wave 2 — Direct FF push v8.1/config-bucket → fork/master; close PR #5

## Goal

Land the rebased `v8.1/config-bucket` onto `fork/master` via **direct push** (NOT `gh pr merge`). RESEARCH §1.2 closes the v8.0 carry-forward Open Question authoritatively: `gh pr merge --merge` always invokes `--no-ff` per GitHub's official docs and produces a merge commit; ROADMAP success criterion #1 says verbatim "fast-forward merged." The mandatory landing path is direct push of the rebased branch to `fork/master`, then close PR #5 with an explanatory comment. Branch protection on master is `force-push NOT allowed` and `deletions NOT allowed` — non-force FF push is permitted; the push naturally fails on non-FF (no force needed).

References: see `36-CONTEXT.md` D-36-01; `36-RESEARCH.md` §1.2 (resolved authoritatively), §2 Pattern 1 (steps 8–10), §3 Pitfall 2 + 11, §6 Assumption A1/A2/A8; memory `feedback_git_push_ssh.md`. Wave 0 Task 7 already verified `enforce_admins=false` on master (HARD prerequisite — if true, this wave cannot proceed).

## Tasks

1. **Re-verify the rebased branch is FF-able onto fork/master.**
    - `LOCAL_HEAD=$(git rev-parse v8.1/config-bucket)`
    - `git fetch fork --prune` (refresh refs)
    - `git merge-base --is-ancestor fork/master $LOCAL_HEAD` exit 0.
    - If non-zero: someone pushed to fork/master since Wave 1. Stop. Re-rebase against the new fork/master HEAD.

2. **Verify pre-push lease for fork/master.**
    - `PRE_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)`
    - Must equal Wave 0's `d717c09c38f04ccfd8084e61ae61cbce01162a1a`. If drifted, abort and re-derive.

3. **Direct FF push v8.1/config-bucket → fork/master via inline SSH URL.**
    - `git push git@github.com:atabisz/Vortex.git v8.1/config-bucket:master`
    - Plain push (NOT force) — branch protection's `force-push NOT allowed` is satisfied; non-FF push naturally fails. No `--force-with-lease` needed (FF push is non-destructive).
    - **EXPLICITLY: do NOT run `gh pr merge` in any form.** Pitfall 2 / 11 forbid it.

4. **Verify post-push fork/master == local rebased HEAD.**
    - `POST_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)`
    - Must equal `$LOCAL_HEAD`.

5. **Confirm PR #5 status; force-close if not auto-MERGED (A2).**
    - `gh pr view 5 --repo atabisz/Vortex --json state,mergeCommit`
    - GitHub MAY auto-detect that the PR head is reachable from base post-push and flip state to MERGED. If state == MERGED, no action needed.
    - If state != MERGED, force-close with explanatory comment (RESEARCH §1.2 step 4):
        ```
        Landed via fast-forward push to master at <NEW_MASTER>. Merge commit method
        on gh CLI uses --no-ff per GitHub docs; direct FF push satisfies ROADMAP
        criterion #1 'fast-forward merged'. SHAs preserved per Phase 35 evidence
        chain (.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md).
        ```
    - Casual voice (memory `feedback_casual_voice.md`) — phrasing above is fine; tweak as feels natural.

6. **Refresh local master to fork/master (post-FF parity).**
    - `git checkout master`
    - `git pull --ff-only fork master` — local master now equals fork/master == rebased HEAD.
    - Useful prep for Wave 3 (tag is created on master).

7. **Optional: delete merged head branch on fork (§1.4).**
    - `git push git@github.com:atabisz/Vortex.git :sync/upstream-v2.0.1`
    - Non-protected branch; deletion permitted. Skip if forensic reference of the rebased head is wanted; otherwise clean up. Recommendation: **keep** for now (doesn't cost anything; can delete later).

8. **Append `## FF-land (SYNC-36a part 2)` section to `36-REBASE-NOTES.md`.**

## Verification commands

```bash
# Task 1 — FF-able check
LOCAL_HEAD=$(git rev-parse v8.1/config-bucket)
echo "Local rebased HEAD: $LOCAL_HEAD"
git fetch fork --prune
git merge-base --is-ancestor fork/master $LOCAL_HEAD || { echo "Not FF-able — STOP"; exit 1; }

# Task 2 — verify pre-push lease for fork/master
PRE_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
echo "Pre-push fork/master: $PRE_MASTER"
test "$PRE_MASTER" = "d717c09c38f04ccfd8084e61ae61cbce01162a1a" || { echo "Master drifted — abort"; exit 1; }

# Task 3 — direct FF push (NO gh pr merge)
git push git@github.com:atabisz/Vortex.git v8.1/config-bucket:master

# Task 4 — verify post-push
POST_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
echo "Post-push fork/master: $POST_MASTER"
test "$POST_MASTER" = "$LOCAL_HEAD" || { echo "Push didn't take"; exit 1; }

# Task 5 — PR #5 state; close if not auto-MERGED
PR_STATE=$(gh pr view 5 --repo atabisz/Vortex --json state --jq '.state')
echo "PR #5 state: $PR_STATE"
if [ "$PR_STATE" != "MERGED" ]; then
  gh pr close 5 --repo atabisz/Vortex --comment "Landed via fast-forward push to master at $LOCAL_HEAD. Merge commit method on gh CLI uses --no-ff per GitHub docs (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github), so direct FF push is the path that satisfies ROADMAP criterion #1 'fast-forward merged'. SHAs preserved per Phase 35 evidence chain (.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md)."
fi

# Re-verify state post-close
gh pr view 5 --repo atabisz/Vortex --json state,mergeCommit,closedAt

# Task 6 — refresh local master
git checkout master
git pull --ff-only fork master
test "$(git rev-parse master)" = "$LOCAL_HEAD"

# Task 7 — (optional) delete merged head branch
# Skip by default; uncomment to clean up.
# git push git@github.com:atabisz/Vortex.git :sync/upstream-v2.0.1
```

## Artifact emission

Append to `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md`:

```markdown
## FF-land (SYNC-36a part 2)

- **Date:** <utc-iso>
- **Pre-push fork/master:** d717c09c38f04ccfd8084e61ae61cbce01162a1a (verified)
- **Local rebased HEAD:** <LOCAL_HEAD>
- **FF-ancestor check:** PASS (`git merge-base --is-ancestor fork/master $LOCAL_HEAD`)
- **Push command:** `git push git@github.com:atabisz/Vortex.git v8.1/config-bucket:master`
- **Post-push fork/master:** <POST_MASTER, == LOCAL_HEAD>
- **PR #5 state:** MERGED (auto-closed) | CLOSED (manual via gh pr close --comment)
- **Local master post-pull:** <SHA, == LOCAL_HEAD>
- **sync/upstream-v2.0.1 head branch:** retained | deleted

### Why direct push vs `gh pr merge --merge`

GitHub's "Merge commit" method uses `--no-ff` per official docs:
https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github

`gh pr merge --merge` always produces a merge commit. ROADMAP criterion #1 says
"fast-forward merged" verbatim. Direct push to master is the only path that
yields true FF and preserves the Phase 35 evidence-chain lineage atomically.
```

## Commits

**Zero commits in Wave 2.** Direct FF push advances `fork/master` to the rebased v8.1/config-bucket HEAD; no new commit objects are created. PR close is a metadata-only operation.

## Risks / contingencies

- **R-36-04 — direct push to fork/master rejected by branch protection.** Wave 0 Task 7 was supposed to catch this (`enforce_admins`). If it slips through (e.g. someone toggled enforcement between Wave 0 and Wave 2), the push fails. Choices: (a) operator temporarily disables enforce_admins, retry; (b) accept merge commit via `gh pr merge` and re-discuss ROADMAP criterion #1 with user. **Phase 36 cannot autonomously decide (b); escalate.**
- **fork/master drifted between Wave 1 and Wave 2.** Re-fetch, re-verify FF-ancestor; if someone pushed to master, you have to re-rebase v8.1/config-bucket on top. Wave 1 Tasks 1–4 must run again before Wave 2 can proceed.
- **R-36-08 — PR #5 doesn't auto-close after FF push.** §1.3 fallback: explicit `gh pr close --comment`. Already handled in Task 5.
- **Push succeeds but `gh pr view` still shows OPEN.** GitHub's auto-close heuristic is implementation-detail. Use the explicit close path; it's the canonical resolution.
- **Pitfall 2 violation — someone runs `gh pr merge` by accident.** It will fail anyway because PR #5 has `reviewDecision=REVIEW_REQUIRED` (Pitfall 11). Even if it succeeded, it would create a merge commit. Plan explicitly forbids `gh pr merge` invocation in Wave 2.
- **Inline SSH URL push works but `git pull --ff-only fork master` fails locally** (Task 6) — usually because `fork` remote is configured to a stale URL or doesn't exist. Add the remote if missing: `git remote add fork git@github.com:atabisz/Vortex.git`. Or use inline URL pull: `git pull --ff-only git@github.com:atabisz/Vortex.git master`.

## Done criteria

1. `git merge-base --is-ancestor fork/master <local-rebased-HEAD>` exit 0.
2. Pre-push fork/master matches Wave 0 captured value.
3. Direct push `v8.1/config-bucket:master` succeeded (no force).
4. Post-push fork/master == local rebased HEAD.
5. PR #5 state == MERGED (or CLOSED with explanatory comment).
6. Local master fast-forwarded to match fork/master.
7. `36-REBASE-NOTES.md` FF-land section appended.
8. SYNC-36a fully closed; Wave 3 (tag) unblocked.
