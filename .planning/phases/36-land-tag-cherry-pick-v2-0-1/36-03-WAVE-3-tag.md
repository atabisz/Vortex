---
phase: 36
wave: 3
plan_id: 36-03
title: "Wave 3 — SSH-signed annotated tag v2.0.1-linux-rebased + dual-remote push"
branch: master
requirement_ids:
    - SYNC-36b
dependencies:
    - 36-02 # FF-land complete; master is at the rebased HEAD
estimated_commits: 0 # tag object created locally; tag push is a ref-update only
---

# Wave 3 — Stamp the canonical Linux release tag and dual-push (fork → CI; origin → informational)

## Goal

Create SSH-signed annotated tag `v2.0.1-linux-rebased` on the post-merge master HEAD (= Wave 1 merge commit); verify the signature; push to **fork FIRST** (triggers `release-linux.yml`); push to **origin SECOND** (informational, non-blocking per memory `project_upstream_pr_policy.md`); confirm `release-linux.yml` triggered. No RC tag cleanup needed (D-36-06: no v2.0.1 RC tag exists). `gpg.format=ssh` + `tag.gpgsign=true` are already configured (Wave 0 Task 4); `git tag -a` auto-signs.

**Path C re-shape** (per `36-RESEARCH-FORWARD-SYNC.md`): the tag body references the merge commit SHA + its two parents (`d494bcb7d` 1st-parent master tip + `f1425a5c8` 2nd-parent v8.1/config-bucket tip) + upstream anchor `f25ff55da` (= upstream tag `v2.0.1`, reachable via 2nd-parent ancestry through `aa3faf7e5`). Drops the surgical-squash anchors from the previous draft (no squash exists in Path C; upstream content reaches master via the 2nd-parent ancestry of the merge commit, not via a synthetic squash commit).

References: see `36-CONTEXT.md` D-36-04 / D-36-05 / D-36-06; `36-RESEARCH.md` §2 Pattern 2, §3 Pitfalls 4/5/6, §6 Assumption A3/A4/A5; `36-RESEARCH-FORWARD-SYNC.md` §4 Stage 8 (tag body shape for Path C); memories `feedback_ssh_signing.md`, `feedback_casual_voice.md`, `project_upstream_pr_policy.md`.

## Tasks

1. **Refresh local master to fork/master and capture target SHA.**
    - Wave 1/2 already did this; defensive re-run if any time has passed.
    - `git checkout master`
    - `git pull --ff-only fork master`
    - `NEW_MASTER=$(git rev-parse master)` — this is the tag target (= Wave 1 merge commit SHA).
    - Also capture the merge commit SHA from Wave 1 (referenced in tag body): `MERGE_SHA=$(cat /tmp/phase36-merge-commit-sha 2>/dev/null || git log master --merges --grep='merge v8.1/config-bucket' --format='%H' -1)`. If the file is gone (re-run scenario), the message-grep recovers it. `MERGE_SHA` should equal `NEW_MASTER` (vacuous post-Wave-2 sanity).

2. **Defensive re-verify signing config.**
    - `gpg.format=ssh`, `tag.gpgsign=true`, `user.signingkey` points at `~/.ssh/id_ed25519.pub`.
    - Wave 0 already passed; defensive only.

3. **Confirm no existing `v2.0.1*` tags (D-36-06 sanity).**
    - `git ls-remote git@github.com:atabisz/Vortex.git 'refs/tags/v2.0.1*'` empty.
    - Local: `git tag -l 'v2.0.1*'` empty.
    - If a tag somehow appeared since Wave 0, escalate — don't auto-delete (could be evidence of concurrent activity).

4. **Create the annotated, SSH-signed tag.**
    - Casual voice tag-annotation body (memory `feedback_casual_voice.md`); references Phase 35 done-gate evidence + Path C merge commit + 2nd-parent v8.1/config-bucket tip + upstream anchor. Body shape:

        ```
        Vortex v2.0.1 Linux rebased — milestone v8.1 close.

        Resolves upstream v2.0.1 sync (PR #5) onto Linux fork via Path C
        forward-sync 3-way merge (see 36-RESEARCH-FORWARD-SYNC.md): v8.1 was
        branched from a pre-v2.0.0-linux master point (d4c0d0da5), so a literal
        FF wasn't reachable. merge --no-ff onto master at <MERGE_SHA> with
        1st parent d494bcb7d (master tip) and 2nd parent f1425a5c8
        (v8.1/config-bucket tip). Upstream tag v2.0.1 (== f25ff55da) reachable
        via the 2nd-parent ancestry through aa3faf7e5.

        Phase 32-35 atomic commits (e2127cecb..f1425a5c8) preserved in the
        2nd-parent ancestry — addressable via `git log <merge-sha>^2`.
        Original 656-commit v8.1/config-bucket history archived at tag
        phase36/pre-surgical-snapshot (= f1425a5c8).

        Phase 35 done-gate: 7/7 GREEN (typecheck / lint:ci / test / build / linux smoke /
        windows ci / done-gate review). See:
        .planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md

        Phase 36 close: .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md
        ```

    - `git tag -a v2.0.1-linux-rebased -m "<body>"` — `-a` plus `tag.gpgsign=true` config makes git auto-sign with the SSH key.
    - Tweak body wording as feels natural; match the casual voice memory.

5. **Verify the tag is SSH-signed and correctly placed.**
    - `git tag -v v2.0.1-linux-rebased` exit 0 — confirms the signature verifies.
    - `git rev-parse v2.0.1-linux-rebased^{commit}` matches `$NEW_MASTER`.
    - `git cat-file -p v2.0.1-linux-rebased | head -20` shows annotation body + `-----BEGIN SSH SIGNATURE-----` block.

6. **Push the tag to fork FIRST (triggers `release-linux.yml`).**
    - `git push git@github.com:atabisz/Vortex.git v2.0.1-linux-rebased` (inline SSH URL per memory `feedback_git_push_ssh.md`).
    - `release-linux.yml` matches `push: tags: ['v*']` and triggers immediately.

7. **Push the tag to origin SECOND (informational; non-blocking per memory `project_upstream_pr_policy.md`).**
    - `git push git@github.com:Nexus-Mods/Vortex.git v2.0.1-linux-rebased`
    - Origin push MAY be rejected (no write perms on Nexus-Mods/Vortex). **Do not fail the wave on rejection** — log and continue.
    - Capture: success or rejection (and reason if available).

8. **Confirm `release-linux.yml` triggered on fork.**
    - `gh run list --repo atabisz/Vortex --workflow="Release Linux (AppImage + deb)" --branch v2.0.1-linux-rebased --limit 1`
    - There should be a run in `queued` or `in_progress` state. Capture the run ID for Wave 4.
    - Also acceptable: capture the run via `gh run list --repo atabisz/Vortex --event push --created "$(date -u -Iseconds)" --limit 5` and grep by workflow name. Either path lands the run ID.

9. **Append `## Tag (SYNC-36b)` section to `36-DONE-GATE.md` seed.**
    - Write a minimal seed file `36-DONE-GATE.md` (Wave 6 will fill in the full 7-criterion gate; Wave 3 just records SYNC-36b evidence to feed Wave 4 + Wave 6).

## Verification commands

```bash
# Task 1 — refresh master, capture target SHA + merge SHA
git checkout master
git pull --ff-only fork master
NEW_MASTER=$(git rev-parse master)
echo "Tag target: $NEW_MASTER"
MERGE_SHA=$(cat /tmp/phase36-merge-commit-sha 2>/dev/null \
  || git log master --merges --grep='merge v8.1/config-bucket' --format='%H' -1)
echo "Merge commit SHA: $MERGE_SHA"
test -n "$MERGE_SHA" || { echo "Merge SHA not found"; exit 1; }
test "$MERGE_SHA" = "$NEW_MASTER" \
  || { echo "Merge SHA differs from current master tip — investigate before tagging"; exit 1; }

# Task 2 — defensive re-verify signing config
test "$(git config --get gpg.format)" = "ssh"
test "$(git config --get tag.gpgsign)" = "true"
git config --get user.signingkey
test -r "$HOME/.ssh/id_ed25519"

# Task 3 — confirm no v2.0.1* tags
git ls-remote git@github.com:atabisz/Vortex.git 'refs/tags/v2.0.1*'   # expect: empty
git tag -l 'v2.0.1*'                                                   # expect: empty

# Task 4 — create the annotated, SSH-signed tag (Path C body per RESEARCH-FORWARD-SYNC §4 Stage 8)
git tag -a v2.0.1-linux-rebased -m "$(cat <<EOF
Vortex v2.0.1 Linux rebased — milestone v8.1 close.

Resolves upstream v2.0.1 sync (PR #5) onto Linux fork via Path C
forward-sync 3-way merge (see 36-RESEARCH-FORWARD-SYNC.md): v8.1 was
branched from a pre-v2.0.0-linux master point (d4c0d0da5), so a literal
FF wasn't reachable. merge --no-ff onto master at ${MERGE_SHA} with
1st parent d494bcb7d (master tip) and 2nd parent f1425a5c8
(v8.1/config-bucket tip). Upstream tag v2.0.1 (== f25ff55da) reachable
via the 2nd-parent ancestry through aa3faf7e5.

Phase 32-35 atomic commits (e2127cecb..f1425a5c8) preserved in the
2nd-parent ancestry — addressable via \`git log <merge-sha>^2\`.
Original 656-commit v8.1/config-bucket history archived at tag
phase36/pre-surgical-snapshot (= f1425a5c8).

Phase 35 done-gate: 7/7 GREEN (typecheck / lint:ci / test / build / linux smoke /
windows ci / done-gate review). See:
.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md

Phase 36 close: .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md
EOF
)"

# Task 5 — verify signature
git tag -v v2.0.1-linux-rebased
git rev-parse v2.0.1-linux-rebased^{commit}                            # must == $NEW_MASTER
git cat-file -p v2.0.1-linux-rebased | head -20                         # show body + signature block

# Task 6 — push to fork FIRST (triggers CI)
git push git@github.com:atabisz/Vortex.git v2.0.1-linux-rebased

# Task 7 — push to origin SECOND (non-blocking)
git push git@github.com:Nexus-Mods/Vortex.git v2.0.1-linux-rebased \
  || echo "Origin push rejected (expected per project_upstream_pr_policy.md); continuing."

# Task 8 — confirm release-linux.yml triggered
sleep 30  # CI provisioning — the workflow needs a moment to register the push event
RUN_ID=$(gh run list --repo atabisz/Vortex \
  --workflow="Release Linux (AppImage + deb)" \
  --branch v2.0.1-linux-rebased --limit 1 \
  --json databaseId --jq '.[0].databaseId')
echo "release-linux.yml run ID: $RUN_ID"
test -n "$RUN_ID" || { echo "release-linux.yml not triggered — investigate"; exit 1; }

# Verify the run is on our tag commit
gh run view "$RUN_ID" --repo atabisz/Vortex --json headSha,status,conclusion
```

## Artifact emission

Create `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md` (seed; Wave 6 fills in the rest):

```markdown
# Phase 36 Done Gate

> Seeded Wave 3; populated through Wave 4–5; finalized Wave 6.

## SYNC-36b — SSH-signed canonical tag

- **Date:** <utc-iso>
- **Tag:** `v2.0.1-linux-rebased` (annotated, SSH-signed)
- **Target commit:** <NEW_MASTER> (= Wave 1 merge commit)
- **Merge SHA referenced in body:** <MERGE_SHA>
- **Path C anchors in body:** `d494bcb7d` (1st parent / master tip), `f1425a5c8` (2nd parent / v8.1/config-bucket tip), `f25ff55da` (upstream tag `v2.0.1`, via 2nd-parent ancestry through `aa3faf7e5`), `e2127cecb..f1425a5c8` (Phase 32-35 atomic-commit range), `phase36/pre-surgical-snapshot` (rollback safety tag)
- **Signature verify:** PASS (`git tag -v` exit 0)
- **Annotation body:** see `git cat-file -p v2.0.1-linux-rebased`
- **Push to fork:** OK (inline SSH URL)
- **Push to origin (Nexus-Mods/Vortex):** OK | REJECTED (informational; non-blocking per project_upstream_pr_policy.md)
- **release-linux.yml run ID:** <RUN_ID>
- **release-linux.yml status:** queued | in_progress (Wave 4 watches to conclusion)
```

## Commits

**Zero commits in Wave 3.** The tag object is created in `.git/refs/tags/` locally and pushed as a ref update; no commit object produced. Tag annotation is stored inside the tag object itself.

## Risks / contingencies

- **R-36-05 — origin push rejected.** Expected per memory `project_upstream_pr_policy.md`. Catch + log; do not fail the wave. Document in done-gate.
- **`git tag -v` signature verify fails.** Investigate signing key fingerprint vs `user.signingkey` config. The `~/.ssh/id_ed25519.pub` must be the active signer. Wave 0 already verified, so this should not surface at Wave 3.
- **release-linux.yml doesn't trigger.** Check tag name actually matches `v*` glob (Pitfall 6). If somehow named without leading `v`, delete and recreate. Otherwise: workflow file may have been edited between Wave 0 and Wave 3; inspect `.github/workflows/release-linux.yml` `on:` clause.
- **Multiple workflow runs queued for the same tag push.** `release-linux.yml` should produce one run per tag push event. If duplicates surface, capture all run IDs and have Wave 4 watch the latest.
- **Pitfall 4 — annotated tag SHA confusion.** Always reference by ref name (`v2.0.1-linux-rebased`), not SHA. The tag-object SHA differs from the commit SHA; annotated tags wrap the commit.
- **Pitfall 5 — tag pushed to origin before fork.** Plan explicitly orders fork FIRST in Task 6 / Task 7. Don't reorder.
- **Tag pushed but origin push leaks credentials in error output.** Should never happen with SSH push; defensive — if `gh` SSH config is misconfigured, errors might surface. Inline SSH URL is the standard path; treat any auth weirdness as escalate.
- **`release-linux.yml` chmod step removed since Wave 0 (Pitfall 9).** Wave 0 verified present; if the file was edited mid-phase, the run will fail. Wave 4 has retry logic.
- **Merge SHA recovery via message-grep returns 0 hits.** Possible if Wave 1's merge subject got rewritten. Inspect `git log master --merges --first-parent -3` for recent merges; the Path C merge has parents (`d494bcb7d`, `f1425a5c8`) — identify by parent SHAs if subject grep fails. Tag body MUST reference the actual merge SHA — don't fudge.

## Done criteria

1. Local master == fork/master == Wave 1 merge commit SHA.
2. Merge SHA captured (from `/tmp/phase36-merge-commit-sha` or message-grep recovery).
3. No pre-existing `v2.0.1*` tags on local or fork remote.
4. `v2.0.1-linux-rebased` created as annotated, SSH-signed tag on `<NEW_MASTER>`; body references the merge SHA + 1st parent `d494bcb7d` + 2nd parent `f1425a5c8` + `f25ff55da` (upstream `v2.0.1`, via 2nd-parent ancestry) + `e2127cecb..f1425a5c8` (Phase 32-35 atomic range) + `phase36/pre-surgical-snapshot` (rollback).
5. `git tag -v v2.0.1-linux-rebased` exit 0.
6. Tag pushed to fork (release-linux.yml triggered; run ID captured).
7. Tag pushed to origin OR push rejected with reason captured.
8. `36-DONE-GATE.md` SYNC-36b section seeded.
9. SYNC-36b closed; Wave 4 (release-linux.yml smoke) unblocked.
