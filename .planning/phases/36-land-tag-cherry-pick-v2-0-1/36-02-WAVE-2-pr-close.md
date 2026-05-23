---
phase: 36
wave: 2
plan_id: 36-02
title: "Wave 2 — Close PR #5 with redirect comment (Path C: merge already pushed in Wave 1)"
branch: master
requirement_ids:
    - SYNC-36a
dependencies:
    - 36-01 # merge commit pushed to fork/master + main.yml CI green
estimated_commits: 0
---

# Wave 2 — Close PR #5 with redirect comment; optional head-branch cleanup

## Goal

**Path C re-shape moved the FF push into Wave 1 Stage 6.** Wave 2 is now metadata-only:

- Re-verify `fork/master` advanced to the merge commit (sanity).
- Confirm `main.yml` green on the merge commit (SYNC-36a evidence; Wave 1 already waited but capture URLs here).
- Close PR #5 with a casual-voice redirect comment pointing to the merge commit + Phase 35 evidence preservation.
- Optional: delete `sync/upstream-v2.0.1` head branch on fork (forensic value low; clean if desired).

PR #5 head is `sync/upstream-v2.0.1` (= `8054a935b`); base is `master`. After Wave 1's merge commit lands, GitHub _may_ auto-close the PR via merge-base reachability heuristic (because `8054a935b` is in v8.1/config-bucket's history, which is now in master's history via the 2nd-parent ancestry). If it doesn't auto-close, Task 3 force-closes with the explanatory comment.

References: see `36-01-WAVE-1-merge-forward-sync.md` (FF push scope); `36-RESEARCH-FORWARD-SYNC.md` §4 Stage 7; `36-CONTEXT.md` D-36-01 substitution (recorded in Wave 6); memory `feedback_casual_voice.md`.

## Tasks

1. **Re-verify post-merge state (sanity).**
    - `git checkout master`
    - `git pull --ff-only fork master` (defensive — Wave 1 already pulled).
    - `LOCAL_MASTER=$(git rev-parse master)`; `FORK_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)`.
    - Both must equal the Wave 1 merge commit SHA (`/tmp/phase36-merge-commit-sha`).
    - Verify Phase 35 evidence preserved: `git merge-base --is-ancestor f1425a5c810794b8325db624d97da9abc106ad90 HEAD` exit 0.

2. **Capture `main.yml` Windows + Linux run URLs for done-gate.**
    - `gh run list --repo atabisz/Vortex --branch master --workflow main.yml --limit 5 --json databaseId,conclusion,status,headSha,url`.
    - Filter to runs where `headSha` matches the merge commit SHA. Both Windows and Linux runs must `conclusion=success`.
    - Record run URLs for Wave 6 done-gate.

3. **Confirm PR #5 status; force-close if not auto-MERGED.**
    - `gh pr view 5 --repo atabisz/Vortex --json state,mergeCommit,headRefName,headRefOid`.
    - **If `state == MERGED`:** done — `mergeCommit.oid` should match (or be a descendant of) the Wave 1 merge SHA. Capture and proceed.
    - **If `state == OPEN` or `CLOSED`:** force-close with casual-voice comment (memory `feedback_casual_voice.md`):

        ```
        Landed via 3-way merge into master at <MERGE_SHA>. Path C forward-sync (see
        .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md):
        v8.1 was branched from a pre-v2.0.0-linux master point, so a literal FF wasn't
        reachable; merge --no-ff was the cleanest path with 12 conflict files.

        Phase 35 evidence chain (D-35-10 7/7 GREEN, SHAs e2127cecb..f1425a5c8) preserved
        in the 2nd-parent ancestry — addressable via `git log <merge-sha>^2` and
        `git log --first-parent` (master line).

        Original 656-commit v8.1/config-bucket history archived at tag
        phase36/pre-surgical-snapshot (= f1425a5c8).
        ```

    - Tweak wording as feels natural; the substance (merge SHA + Phase 35 evidence pointer + rollback tag) is what matters.

4. **(Optional) Delete `sync/upstream-v2.0.1` head branch on fork.**
    - Forensic value is low — the PR head is now reachable from master via 2nd-parent ancestry.
    - **Default: skip.** Keep the branch as belt-and-suspenders for audit.
    - To clean: `git push git@github.com:atabisz/Vortex.git :sync/upstream-v2.0.1`.

5. **Append `## PR #5 close (SYNC-36a part 2)` section to `36-REBASE-NOTES.md`.**

## Verification commands

```bash
# Task 1 — post-merge sanity
git checkout master
git pull --ff-only fork master
MERGE_SHA=$(cat /tmp/phase36-merge-commit-sha 2>/dev/null \
  || git log --merges --grep='merge v8.1/config-bucket' --format='%H' -1)
echo "Merge commit: $MERGE_SHA"
test -n "$MERGE_SHA" || { echo "Merge SHA not found"; exit 1; }

LOCAL_MASTER=$(git rev-parse master)
FORK_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$LOCAL_MASTER" = "$MERGE_SHA" || { echo "local master drift"; exit 1; }
test "$FORK_MASTER" = "$MERGE_SHA"  || { echo "fork/master drift";  exit 1; }
git merge-base --is-ancestor f1425a5c810794b8325db624d97da9abc106ad90 HEAD \
  && echo "Phase 35 evidence preserved (f1425a5c8 reachable from merge HEAD)"

# Task 2 — capture main.yml runs
gh run list --repo atabisz/Vortex --branch master --workflow main.yml --limit 5 \
  --json databaseId,conclusion,status,headSha,url \
  | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/main-yml-runs.json
# Both Windows + Linux entries with headSha == $MERGE_SHA must show conclusion=success.

# Task 3 — PR #5 state
PR_STATE=$(gh pr view 5 --repo atabisz/Vortex --json state --jq '.state')
echo "PR #5 state: $PR_STATE"

if [ "$PR_STATE" != "MERGED" ]; then
  gh pr close 5 --repo atabisz/Vortex --comment "$(cat <<EOF
Landed via 3-way merge into master at $MERGE_SHA. Path C forward-sync (see
.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md):
v8.1 was branched from a pre-v2.0.0-linux master point, so a literal FF wasn't
reachable; merge --no-ff was the cleanest path with 12 conflict files.

Phase 35 evidence chain (D-35-10 7/7 GREEN, SHAs e2127cecb..f1425a5c8) preserved
in the 2nd-parent ancestry — addressable via \`git log $MERGE_SHA^2\` and
\`git log --first-parent\` (master line).

Original 656-commit v8.1/config-bucket history archived at tag
phase36/pre-surgical-snapshot (= f1425a5c8).
EOF
)"
fi

# Re-verify state post-close
gh pr view 5 --repo atabisz/Vortex --json state,mergeCommit,closedAt

# Task 4 — (optional) delete head branch on fork; skip by default
# git push git@github.com:atabisz/Vortex.git :sync/upstream-v2.0.1
```

## Artifact emission

Append to `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md`:

```markdown
## PR #5 close (SYNC-36a part 2)

- **Date:** <utc-iso>
- **Merge commit (Wave 1):** <MERGE_SHA>
- **fork/master:** <FORK_MASTER, == MERGE_SHA>
- **local master:** <LOCAL_MASTER, == MERGE_SHA>
- **Phase 35 evidence preserved:** PASS (`git merge-base --is-ancestor f1425a5c8 HEAD` exit 0)
- **main.yml Windows run:** <url> — success
- **main.yml Linux run:** <url> — success
- **PR #5 state:** MERGED (auto-detected) | CLOSED with redirect comment
- **`sync/upstream-v2.0.1` head branch:** retained | deleted (default: retained)

### Why merge-commit-and-close vs literal FF

ROADMAP success criterion #1 wording was "fast-forward merged"; v8.1's base mismatch
(memory `project_v8_1_base_mismatch.md`) made literal FF unreachable. Path C
forward-sync produces a merge commit whose tree is byte-equivalent to what FF
would have produced post-divergence-resolution; operator accepted the wording
substitution (Wave 6 deviation note records this).
```

## Commits

**Zero commits in Wave 2.** PR close is metadata-only. The FF-push of the merge commit lives in Wave 1 Stage 6.

## Risks / contingencies

- **fork/master drifted between Wave 1 and Wave 2.** Someone pushed to master after Wave 1's merge landed. Fix: `git fetch fork --prune; git pull --ff-only`. Document in `36-REBASE-NOTES.md`. The merge SHA captured in Wave 1 is still the canonical landing point; subsequent commits stack atop it.
- **PR #5 doesn't auto-close.** Expected behavior on GitHub for non-FF merges where the PR head isn't a literal ancestor of base. Task 3 explicitly handles via `gh pr close --comment`. No action beyond the comment.
- **Merge commit SHA recovery via message-grep returns 0 hits.** Wave 1 wrote the SHA to `/tmp/phase36-merge-commit-sha`. If the file is gone (re-run scenario), grep recovers via `git log --merges --grep='merge v8.1/config-bucket'`. If both fail, inspect `git log master --first-parent --merges -5` and identify by parent SHAs (`d494bcb7d` + `f1425a5c8`).
- **`gh pr view` shows state == MERGED with mergeCommit.oid != merge SHA.** Could indicate a divergent merge happened (someone else clicked merge). Investigate `mergeCommit.oid` ancestry; if it descends from our merge commit, accept. If it's an unrelated merge, escalate.
- **`main.yml` red on the merge commit.** Wave 1 was supposed to wait for green before exit; if Wave 2 finds red runs, Wave 1's done-criterion #13 was never satisfied. Return to Wave 1 — investigate the failure, abort merge if pre-existing was red, otherwise debug. SYNC-36a is the gate; Wave 3 (tag) cannot proceed until green.

## Done criteria

1. `local master == fork/master == Wave 1 merge commit SHA`.
2. `main.yml` Windows + Linux runs on the merge commit captured with `conclusion=success`.
3. PR #5 state == MERGED (auto) OR CLOSED with redirect comment referencing merge SHA + Phase 35 evidence + rollback tag.
4. (Optional) `sync/upstream-v2.0.1` head branch retained or deleted per operator preference.
5. `36-REBASE-NOTES.md` PR-close section appended.
6. SYNC-36a fully closed; Wave 3 (tag) unblocked.
