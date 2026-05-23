---
phase: 36
wave: 0
plan_id: 36-00
title: "Wave 0 — pre-flight + landing-path verification"
branch: v8.1/config-bucket
requirement_ids: [] # Wave 0 is a readiness gate; SYNC-36a..d closure happens in later waves. Wave 0 verifies the live state and signing config that downstream waves depend on.
dependencies: []
estimated_commits: 0
---

# Wave 0 — Pre-flight: live-state verification, signing config, branch-protection probe

## Goal

Confirm the world looks the way RESEARCH §1.1 / §6 says it does before we touch anything. Specifically: live `git ls-remote` SHAs match expected (master=`d717c09c3`, sync/upstream-v2.0.1=`8054a935b`, linux-port=`6a28945d1`, no v2.0.1\* tags); SSH signing config is on (`gpg.format=ssh`, `tag.gpgsign=true`); gh auth is alive; v8.1/config-bucket is purely linear (no merge commits — Pitfall 12); `release-linux.yml` chmod step still present (Pitfall 9); and **branch-protection `enforce_admins` state on `master` is verified ahead of the FF push** (Assumption A1 — HIGH IMPACT). Verification-only — zero commits.

References: see `36-CONTEXT.md` D-36-01..D-36-11; `36-RESEARCH.md` §1.1 (D-36-03 no-op), §1.2 (gh pr merge resolved), §1.4 (branch protection probe), §3 Pitfalls 1/9/10/11/12, §6 Assumptions A1/A7/A9.

## Tasks

1. **Confirm working-tree clean and on `v8.1/config-bucket`.**
    - Wave 0 must run from a clean tree (`git status --porcelain` empty).
    - Capture HEAD short SHA — should be `f1425a5c8` (Phase 35 closeout per CONTEXT live-state).

2. **Verify live remote SHAs via `git ls-remote` against expected values.**
    - `fork/master` → `d717c09c38f04ccfd8084e61ae61cbce01162a1a`
    - `fork/sync/upstream-v2.0.1` → `8054a935b6aad505798bba8a993d002718d119cb`
    - `fork/linux-port` → `6a28945d153ee9a7ca604d5c673eb5bd61c33e13`
    - `refs/tags/v2.0.1*` → empty (no RC tag — D-36-06 confirmed)
    - Any drift blocks subsequent waves; re-derive lease pins before proceeding.

3. **Confirm D-36-03 no-op (`local master == fork/master`).**
    - Per RESEARCH §1.1: as of 2026-05-23 these are equal. If they've drifted since research, fall back to lease-pinned push of local master to fork/master before Wave 1 (RESEARCH §1.1 fall-back).

4. **Verify SSH signing config (defensive — should already be true).**
    - `git config --get gpg.format` = `ssh`
    - `git config --get tag.gpgsign` = `true`
    - `git config --get user.signingkey` points at `~/.ssh/id_ed25519.pub`
    - `~/.ssh/id_ed25519` file exists and is readable.

5. **Verify gh auth is alive; fall back to `GH_TOKEN` if expired.**
    - `gh auth status` exit 0 — if not, set `GH_TOKEN` env var per memory `reference_github_token.md`.

6. **Verify v8.1/config-bucket is purely linear (Pitfall 12 / A7).**
    - `git log --merges master..v8.1/config-bucket` must be EMPTY. If non-empty, default `git rebase master` is wrong — escalate (would need `--rebase-merges` strategy and re-plan).

7. **Verify branch-protection state on `master` — full probe (Assumption A1, HIGH IMPACT; covers Wave 2 FF-land AND Wave 6 closeout push).**
    - `gh api /repos/atabisz/Vortex/branches/master/protection` and capture:
        - `enforce_admins.enabled` (admin-override availability for owner)
        - `required_pull_request_reviews` (whether PR review is required for any push, not just PR merges)
        - `restrictions` (push-allowlist; null = anyone with write can push)
        - `allow_force_pushes.enabled`, `allow_deletions.enabled` (informational)
    - **Disposition table:**
        - `enforce_admins=false` AND `required_pull_request_reviews=null` AND `restrictions=null` → unblocked. Wave 2 FF-land + Wave 6 closeout direct push both work.
        - `enforce_admins=false` AND `required_pull_request_reviews` non-null → reviews apply only to PR-merge API path (RESEARCH §1.2 confirmed); direct push still works. Unblocked.
        - `enforce_admins=true` AND (`required_pull_request_reviews` non-null OR `restrictions` non-null restricting owner) → ESCALATE. Both Wave 2 FF-land AND Wave 6 closeout push will fail. Choices: (a) temporarily disable enforce_admins, (b) accept merge commit (violates ROADMAP #1), (c) self-approve PR + admin merge (Wave 2 only — doesn't help Wave 6 closeout).
    - **Empirical sanity check:** Phase 35 closeout commit `f1425a5c8` landed on fork/master via direct push. So the path _currently_ works. This probe is to verify nothing has changed in branch-protection settings since Phase 35.
    - Do NOT proceed to Wave 2 until result is recorded in `36-REBASE-NOTES.md` header.

8. **Confirm `release-linux.yml` chmod step still present (Pitfall 9).**
    - Lines 60–66 of `.github/workflows/release-linux.yml` should still have the `chmod +x` step that mitigates pnpm 10 node-gyp permission flake.

9. **Confirm tools at expected versions.**
    - `gh --version` ≥ 2.45.0
    - `pnpm --version` ≥ 10.33.0
    - `git --version` (any modern; `gpg.format=ssh` requires git 2.34+).

10. **Capture the pre-state header for `36-REBASE-NOTES.md`.**
    - Wave 1 will append per-conflict notes to this file. Wave 0 seeds it with the verified SHAs and the pre-flight summary so the rebase notes have a clean header.
    - Use `git add -f` (memory `feedback_planning_gitignored.md`) — but Wave 0 emits no commit. Just stage the file on disk; Wave 6 done-gate will pick it up via the bulk `git add -f` at closeout.

## Verification commands

```bash
# Task 1 — clean tree on v8.1/config-bucket
git rev-parse --abbrev-ref HEAD                                  # expect: v8.1/config-bucket
git status --porcelain                                            # expect: empty
git rev-parse HEAD                                                # capture short SHA — expect f1425a5c8 prefix

# Task 2 — live remote SHAs
git ls-remote git@github.com:atabisz/Vortex.git \
  refs/heads/master refs/heads/sync/upstream-v2.0.1 refs/heads/linux-port \
  'refs/tags/v2.0.1*'
# Expected (column 1 SHAs):
#   master                          d717c09c38f04ccfd8084e61ae61cbce01162a1a
#   sync/upstream-v2.0.1            8054a935b6aad505798bba8a993d002718d119cb
#   linux-port                      6a28945d153ee9a7ca604d5c673eb5bd61c33e13
#   refs/tags/v2.0.1*               (no rows)

# Task 3 — D-36-03 no-op confirm
LOCAL_MASTER=$(git rev-parse master)
FORK_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$LOCAL_MASTER" = "$FORK_MASTER" && echo "D-36-03 no-op confirmed" \
  || echo "DRIFT — fall back to lease-pinned master push"

# Task 4 — SSH signing config
test "$(git config --get gpg.format)" = "ssh"
test "$(git config --get tag.gpgsign)" = "true"
git config --get user.signingkey
test -r "$HOME/.ssh/id_ed25519"

# Task 5 — gh auth
gh auth status || { echo "gh auth expired — set GH_TOKEN per reference_github_token.md"; exit 1; }

# Task 6 — purely-linear v8.1/config-bucket (Pitfall 12)
git log --merges master..v8.1/config-bucket --oneline | wc -l    # expect: 0

# Task 7 — branch protection full probe (A1, HIGH IMPACT)
# Covers Wave 2 FF-land + Wave 6 closeout push (both rely on direct-push path).
PROTECTION_JSON=$(gh api /repos/atabisz/Vortex/branches/master/protection \
  --jq '{
    enforce_admins:           .enforce_admins.enabled,
    required_reviews:         .required_pull_request_reviews,
    required_review_count:    .required_pull_request_reviews.required_approving_review_count,
    restrictions:             .restrictions,
    force_push:               .allow_force_pushes.enabled,
    deletions:                .allow_deletions.enabled
  }')
echo "$PROTECTION_JSON"
# Disposition (recorded in 36-REBASE-NOTES.md header):
#   enforce_admins=false AND required_reviews=null AND restrictions=null → UNBLOCKED
#   enforce_admins=false AND required_reviews non-null                   → UNBLOCKED (PR-merge-only constraint per RESEARCH §1.2)
#   enforce_admins=true  AND (required_reviews OR restrictions restrict owner) → ESCALATE
# Empirical: Phase 35 closeout commit f1425a5c8 landed via direct push on fork/master,
# so the path was open then. This probe verifies nothing has changed since.

# Task 8 — release-linux.yml chmod step still present (Pitfall 9)
sed -n '55,70p' .github/workflows/release-linux.yml | grep -E 'chmod \+x'
# expect: at least one match in lines 55-70 region

# Task 9 — tool versions
gh --version | head -1                                            # ≥ 2.45.0
pnpm --version                                                    # ≥ 10.33.0
git --version

# Task 10 — seed 36-REBASE-NOTES.md header (no commit yet)
mkdir -p .planning/phases/36-land-tag-cherry-pick-v2-0-1
cat > .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md <<EOF
# Phase 36 Rebase Notes

**Pre-rebase state (verified Wave 0, $(date -u +%Y-%m-%dT%H:%M:%SZ)):**

- Local master:                        $LOCAL_MASTER
- fork/master:                         $FORK_MASTER
- fork/sync/upstream-v2.0.1:           $(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.1 | cut -f1)
- fork/linux-port:                     $(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/linux-port | cut -f1)
- Local v8.1/config-bucket:            $(git rev-parse v8.1/config-bucket)
- Pitfall 12 merge-commits in v8.1:    $(git log --merges master..v8.1/config-bucket --oneline | wc -l)
- Branch-protection probe (Task 7):
    - enforce_admins:                     <fill>
    - required_pull_request_reviews:      <fill>
    - restrictions:                       <fill>
    - direct-push disposition:            <UNBLOCKED|ESCALATE>

## Conflicts (per file)

<!-- Wave 1 appends one block per conflict with shape:
### path/to/file
- **Side picked:** ours | theirs | manual
- **Bluebird scan:** clean | hit (action taken)
- **Rationale:** <one line>
-->
EOF
```

## Artifact emission

Inline summary printed to executor output at end of Wave 0. No file commit yet — `36-REBASE-NOTES.md` seed is staged on disk; Wave 6 done-gate commits all Phase 36 docs together via `git add -f`.

Summary shape:

```
Phase 36 Wave 0 readiness:
  Branch:                    v8.1/config-bucket @ <short>
  Local master == fork:      <yes|drift>
  fork/sync/upstream-v2.0.1: 8054a935b
  fork/linux-port:           6a28945d1
  v2.0.1* tags:              none
  Signing config:            OK (gpg.format=ssh, tag.gpgsign=true)
  gh auth:                   alive
  Linear (no merges):        YES (count=0)
  branch protection:         <enforce_admins=?, reviews=?, restrictions=?> ← disposition: UNBLOCKED|ESCALATE
  release-linux.yml chmod:   present
  pnpm:                      <ver>; gh: <ver>
Wave 1 unblocked: <YES|NO — reason>
```

## Commits

**Zero commits in Wave 0.** Verification-only readiness gate. The seeded `36-REBASE-NOTES.md` lives on disk under gitignored `.planning/`; gets committed via `git add -f` in Wave 6 closeout.

## Risks / contingencies

- **Live SHAs drift between research (2026-05-23) and execution.** Re-derive lease pins from the actual `git ls-remote` output in Task 2 and substitute into Wave 1's force-push command. Don't hardcode anything from RESEARCH if it disagrees with live state.
- **D-36-03 no-op invalidated (local master ahead of fork/master).** Fall back to lease-pinned push of local master to fork/master (RESEARCH §1.1 fallback). Lease pin: whatever fork/master currently is. Then re-run Task 3 to confirm parity before Wave 1.
- **Branch protection blocks direct push (R-36-04 / A1).** STOP. Affects BOTH Wave 2 FF-land AND Wave 6 closeout push (the closeout commit also lands on master via direct push). Choices for the user: (a) temporarily disable enforce_admins (admin only — reverts after phase close), (b) accept the merge-commit landing path and re-discuss ROADMAP criterion #1, or (c) self-approve PR + admin merge for Wave 2 BUT this still leaves Wave 6 closeout push exposed (Phase 35 precedent shows closeout commit lands directly on master). **Phase 36 cannot proceed without operator decision.**
- **gh auth expired.** Set `GH_TOKEN` env var per memory `reference_github_token.md` and retry. Don't invoke `gh auth login` interactively (sandbox).
- **Pitfall 12 fires (merge commits in v8.1/config-bucket).** Escalate. The default `git rebase master` would either flatten or refuse the merge commits; need to decide on `--rebase-merges` strategy or surgical merge-commit removal. Re-plan Wave 1 before proceeding.
- **`release-linux.yml` chmod step missing (file drifted).** Inspect git log on the workflow file; if a recent change removed the chmod step, restore it before Wave 4 tag push (otherwise Pitfall 9 will surface during release-linux.yml run).
- **Tool version regressions.** Unlikely (Volta-locked pnpm). If gh < 2.45.0, the `gh pr checks 5 --watch` and `gh run watch` invocations may behave differently; install latest via the operator's package manager.

## Done criteria

1. Branch is `v8.1/config-bucket`; working tree clean.
2. Live remote SHAs match expected (or drift documented and lease pins re-derived).
3. Branch-protection probe disposition is UNBLOCKED for direct push by repo owner (covers Wave 2 + Wave 6); or operator decision recorded if ESCALATE.
4. SSH signing config verified on; `~/.ssh/id_ed25519` readable.
5. gh auth alive (or `GH_TOKEN` set).
6. `git log --merges master..v8.1/config-bucket` is empty.
7. `release-linux.yml` chmod step present in lines ~55-70.
8. `36-REBASE-NOTES.md` seeded with verified pre-state header.
9. Wave 0 readiness summary printed; Wave 1 unblocked (or explicit ESCALATE state recorded).
