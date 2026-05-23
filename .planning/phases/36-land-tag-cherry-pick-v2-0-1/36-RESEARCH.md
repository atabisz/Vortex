# Phase 36: Land + tag + cherry-pick (v2.0.1) — Research

**Researched:** 2026-05-23
**Domain:** Git workflow / release plumbing (rebase, FF-land, signed tag, cherry-pick mirror)
**Confidence:** HIGH
**Canonical playbook:** `.planning/milestones/v8.0-phases/30-land-tag/30-RESEARCH.md` — every pattern transcribes with SHA + tag-name substitution. Open Question §2 (carry-forward) is now **RESOLVED** authoritatively in §1.2 below.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-36-01** (= v8.0 D-30-01) — Rebase `v8.1/config-bucket` onto master HEAD; force-push lease-pinned to `fork/sync/upstream-v2.0.1`; FF-land PR #5. ROADMAP success criterion #1: "fast-forward merged" verbatim. SHAs preserved (Phase 35 done-gate evidence chain at `e2127cecb..f1425a5c8` stays valid).
- **D-36-02** — Conflict-resolution stance: fork-side default (HEAD wins). Bluebird-Promise scan on every conflict file (memory `feedback_bluebird_promise_trap.md`).
- **D-36-03** — Push local master to fork/master FIRST. **Now a no-op — see §1.1 live-state delta below.**
- **D-36-04** (= v8.0 D-30-02) — SSH-signed annotated tag `v2.0.1-linux-rebased` on post-FF master HEAD. `gpg.format=ssh` + `tag.gpgsign=true` already configured.
- **D-36-05** — Dual-remote push order: **fork FIRST** (triggers `release-linux.yml`), origin SECOND (informational, non-blocking).
- **D-36-06** — RC-tag cleanup: **N/A** — no v2.0.1 RC tag exists. Skip.
- **D-36-07** (= v8.0 D-30-03) — Path-based cherry-pick filter: `src/**` `extensions/**` `packages/**` `scripts/**` minus `:!.planning/**` `:!.github/workflows/release-linux.yml` `:!.github/workflows/format.yml` `:!.github/actions/fingerprints/**` `:!docker/**`. Chronological `--reverse`; `linux-port` HEAD wins on conflict; `-x` for traceability.
- **D-36-08** — Linux-port baseline: sync local to `fork/linux-port` (`6a28945d1`) before cherry-pick.
- **D-36-09** — SYNC-36d closure: CI smoke evidence only (run URL + AppImage/.deb SHA256s). Local-boot UAT goes to Phase 37.
- **D-36-10** — Playbook update goes to Phase 37 (SYNC-37b), not 36.
- **D-36-11** — Discard `packages/vortex-api/lib/api.d.ts` regen with `git checkout HEAD --` after each typecheck. Don't commit.

### Claude's Discretion

- Plan-shape sequencing (planner's call).
- D-36-03 fold-into vs separate plan (now moot — no-op; see §1.1).
- `gh pr merge 5 --merge` semantics — **researcher resolved authoritatively in §1.2.**

### Deferred Ideas (OUT OF SCOPE)

- Local-boot AppImage/.deb verification (Phase 37 SYNC-37a).
- 4-screenshot Skyrim walkthrough (Phase 37 SYNC-37a).
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` post-mortem (Phase 37 SYNC-37b).
- AppImage update channel (separate milestone).
- `@vortex/api` regen as routine commit (housekeeping).
- GitHub Actions step bumps (housekeeping).
- Upstream PR to Nexus-Mods/Vortex (memory `project_upstream_pr_policy.md`).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID           | Description                                                                          | Research Support                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SYNC-36a** | Rebase + FF-land PR #5                                                               | Pattern 1 (rebase-then-FF). Force-push lease-pinned to `fork/sync/upstream-v2.0.1` at `8054a935b`. PR #5 currently `mergeStateStatus=DIRTY`, `mergeable=CONFLICTING` (expected pre-rebase). **`gh pr merge --merge` produces merge commit, NOT FF — see §1.2.** Mandatory fallback: direct push of rebased branch to fork/master + `gh pr close 5`. |
| **SYNC-36b** | SSH-signed tag `v2.0.1-linux-rebased` on post-FF master, dual-pushed                 | Pattern 2. `git tag -a` auto-signs (gpg.format=ssh, tag.gpgsign=true verified). Push fork FIRST (triggers `release-linux.yml`), origin SECOND (non-blocking).                                                                                                                                                                                       |
| **SYNC-36c** | Linux subset cherry-picked onto `linux-port`                                         | Pattern 3, D-36-07 path filter verbatim. ~400-450 commits expected after path-filter exclusion (extrapolated from v8.0's 216-of-375 ratio applied to 656).                                                                                                                                                                                          |
| **SYNC-36d** | `release-linux.yml` produces AppImage + .deb + SHA256 manifest on canonical tag push | Pattern 4 (smoke-evidence capture). Run URL + asset SHAs in `36-DONE-GATE.md`.                                                                                                                                                                                                                                                                      |

</phase_requirements>

## Summary

Phase 36 is git/CI release plumbing — no new code. Five gates: (1) rebase v8.1 onto master (resolves the 656-commit divergence), (2) wait for Windows CI green, (3) **land PR #5 via direct fork/master push** (the `gh pr merge --merge` path produces a merge commit and is NOT FF — authoritative resolution of v8.0's carry-forward Open Question §2), (4) create + push SSH-signed canonical tag (which triggers `release-linux.yml` and produces AppImage + .deb), (5) cherry-pick the path-filtered subset to `linux-port`.

The v8.0 Phase 30 playbook is the operational template — patterns transcribe verbatim with SHA substitution. The major behavioural delta from v8.0 is **landing mechanics**: GitHub's "Merge commit" merge button (which `gh pr merge --merge` calls) explicitly uses `--no-ff` and always produces a merge commit, even when a fast-forward is possible. ROADMAP success criterion #1 ("fast-forward merged") therefore requires the manual-FF push path documented as v8.0 fallback. PR #5 closes via `gh pr close --comment` with the post-FF merge SHA.

Two simplifications vs v8.0: (a) **no RC tag to delete** — Phase 35 closed without producing one, so D-36-06 is a skip; (b) **fork/master is already current** at `d717c09c3` — local master was pushed since CONTEXT was written, so D-36-03 is a no-op. Three carry-forward complications: (i) review requirement on PR #5 (`reviewDecision=REVIEW_REQUIRED`) needs handling; (ii) `packages/vortex-api/lib/api.d.ts` regen is now a recurring chore (D-36-11); (iii) bluebird-Promise scan needed on every conflicted file during rebase (memory `feedback_bluebird_promise_trap.md`).

**Primary recommendation:** Plan as 6-7 sequential plans matching CONTEXT §Specific Ideas. Lock every push behind a `git ls-remote` verify-then-push pattern. Treat the rebase (656 commits onto master) as the highest-risk single step — surface conflicts in `36-REBASE-NOTES.md` per-conflict.

## Architectural Responsibility Map

| Capability                | Primary Tier                      | Secondary Tier                 | Rationale                                                                   |
| ------------------------- | --------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| Rebase 656 commits        | Local git                         | GitHub remote                  | Rebase is local; force-push is the only side-effect                         |
| FF-land to master         | Local git → fork/master push      | gh PR close (informational)    | gh `--merge` produces no-ff commit; manual FF push is the only true-FF path |
| Annotated SSH-signed tag  | Local git (~/.ssh/id_ed25519)     | —                              | Signing happens before push                                                 |
| Tag push triggers CI      | GitHub Actions runner             | release-linux.yml              | `push: tags: ['v*']` event                                                  |
| AppImage + .deb publish   | GitHub Actions (electron-builder) | softprops/action-gh-release@v2 | Same pipeline as v8.0 RC; verified working                                  |
| Cherry-pick to linux-port | Local git                         | GitHub remote                  | Path-filtered, conflict-resolution local; push is publish                   |

## Standard Stack

This phase uses git plumbing + gh CLI + existing CI workflows. No new libraries. **Package Legitimacy Audit omitted** — N/A.

### Tools verified

| Tool                   | Verified Version                                                                                    | Source                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `git`                  | system, with `gpg.format=ssh`, `tag.gpgsign=true`, `user.signingkey=/home/alex/.ssh/id_ed25519.pub` | live-verified `git config --get-all` 2026-05-23 |
| `gh` (GitHub CLI)      | **2.45.0**                                                                                          | live-verified `gh --version` 2026-05-23         |
| OpenSSH (`ssh-keygen`) | local                                                                                               | `~/.ssh/id_ed25519`                             |
| pnpm                   | 10.33.0+                                                                                            | Volta-locked                                    |

`packages/vortex-api/lib/api.d.ts` regen pattern preserved (D-36-11) — discard with `git checkout HEAD --` after each typecheck.

---

## §1. Open Questions Resolution

### §1.1 D-36-03 (push local master to fork/master FIRST) — **NOW A NO-OP**

CONTEXT captured 2026-05-23 said `fork/master = d494bcb7d` (LOCAL +5 ahead at `d717c09c3`). Live `git ls-remote` 2026-05-23 (later in day) shows:

```
fork/master = d717c09c38f04ccfd8084e61ae61cbce01162a1a
local master = d717c09c38f04ccfd8084e61ae61cbce01162a1a   (rev-list count = 0)
```

The +5 commits were pushed to fork/master between CONTEXT capture and research. **D-36-03 is now a no-op.** Plan should:

1. Verify `git rev-parse master == fork/master` at plan start.
2. If equal, skip the dedicated push plan; fold the SHA-verify check into rebase-plan setup.
3. If somehow drifted, fall back to D-36-03 verbatim with lease pin re-derived.

**Confidence:** HIGH (live-verified against `git ls-remote`).

### §1.2 `gh pr merge --merge` semantics — **RESOLVED AUTHORITATIVELY**

> **The v8.0 Phase 30 carry-forward open question (Open Question §2) is now closed.**

GitHub's official documentation on merge methods states:

> _"When you click the default Merge pull request option on a pull request, all commits from the feature branch are added to the base branch in a merge commit. The pull request is merged using the `--no-ff` option."_
> — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github

`gh pr merge 5 --merge` invokes this exact API path. It **always produces a merge commit**, never a true fast-forward, even when the head is a strict descendant of base. There is no flag in `gh pr merge` (verified gh 2.45.0 `--help`) for fast-forward — the available strategies are `--merge`, `--rebase`, `--squash`. None produces FF.

**ROADMAP success criterion #1 says verbatim "fast-forward merged."** True FF is therefore impossible via `gh pr merge`. The mandatory landing path is:

```bash
# After local rebase + force-push of v8.1/config-bucket to fork/sync/upstream-v2.0.1
# AND Windows CI green on the rebased PR head:

# 1. Verify fork/master is fast-forward-able
LOCAL_HEAD=$(git rev-parse v8.1/config-bucket)        # rebased HEAD
git merge-base --is-ancestor fork/master $LOCAL_HEAD || { echo "Not FF-able"; exit 1; }

# 2. Verify pre-push lease for fork/master
PRE_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$PRE_MASTER" = "$(git rev-parse fork/master)" || { echo "Drifted"; exit 1; }

# 3. Direct FF push to fork/master via inline SSH URL
#    Branch protection: force-push NOT allowed → use plain push (FF-only by default).
#    Lease NOT needed for non-force pushes; FF push naturally fails on non-FF.
git push git@github.com:atabisz/Vortex.git v8.1/config-bucket:master

# 4. Close PR #5 with commit reference (PR auto-detects FF and may show as "merged" or
#    require explicit close — check `gh pr view 5 --json state` after push)
NEW_MASTER=$(git rev-parse v8.1/config-bucket)
gh pr close 5 --repo atabisz/Vortex --comment "Landed via fast-forward push to master at ${NEW_MASTER}. Merge commit method on gh CLI uses --no-ff per GitHub docs (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github), which contradicts ROADMAP criterion #1 'fast-forward merged'. SHAs preserved per Phase 35 evidence chain."
```

**Branch-protection interaction:** `master` has `force-push NOT allowed`. Non-force FF push is permitted. `1 required PR review` applies to **PR merges via the API**, not direct branch pushes if push permissions exist on master. Since atabisz owns the fork, direct push to master should succeed without review, but verify by inspecting `gh api /repos/atabisz/Vortex/branches/master/protection` for `enforce_admins.enabled` first. If admin-enforced, fall back to: self-approve PR #5 review, then run a fresh non-`--merge` route (admin-merge).

**Self-approve fallback (if admin-enforced):**

```bash
# Branch protection requires 1 review. atabisz can self-approve own PR via API:
gh pr review 5 --repo atabisz/Vortex --approve --body "Self-approval: Phase 35 done-gate evidence stands as review (.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md)"

# But this still wouldn't get FF — it just clears the review block on `gh pr merge --merge`,
# which still creates a merge commit. So self-approve is a NO-OP for FF goal; only useful
# if we abandon FF and accept the merge commit (DO NOT — breaks ROADMAP criterion #1).
```

**Confidence:** HIGH (GitHub official docs + gh 2.45.0 `--help` cross-verified).

### §1.3 PR #5 review requirement (`reviewDecision: REVIEW_REQUIRED`)

Live `gh pr view 5 --json reviewDecision` returns `REVIEW_REQUIRED`. Branch protection requires 1 PR review.

For the **direct-push landing path (§1.2)**, this requirement does **not block** because the push targets `master` directly, not via the PR merge API. The PR's review state becomes moot once `master` advances past the PR head — GitHub auto-closes the PR with status `MERGED` if it detects the head commits are reachable from base.

If GitHub does NOT auto-close (rare; depends on internal heuristic of whether HEAD is reachable from base post-push):

```bash
gh pr close 5 --repo atabisz/Vortex --comment "Landed via FF push at <SHA>"
```

**Confidence:** MEDIUM-HIGH (GitHub auto-close-on-push behavior is well-documented but implementation-detail dependent; both auto-close and manual-close paths handled in plan).

### §1.4 Branch protection deletion-allowed for PR head branch

Live: `force-push NOT allowed`, `deletions NOT allowed` on `master` only. The `sync/upstream-v2.0.1` branch is NOT under protection. Cleanup after FF-land:

```bash
# Optional: delete the now-merged head branch on fork
git push git@github.com:atabisz/Vortex.git :sync/upstream-v2.0.1
```

Skip if you want the post-rebase head retained for forensic reference. Not required for milestone close.

---

## §2. Patterns

### Pattern 1: Rebase 656 commits + manual-FF land (vs `gh pr merge`)

**What:** Rebase `v8.1/config-bucket` (HEAD `f1425a5c8`) onto master (`d717c09c3`); resolve conflicts fork-side default; force-push lease-pinned to `fork/sync/upstream-v2.0.1`; wait for Windows CI; then **direct FF push v8.1/config-bucket → fork/master** + `gh pr close 5`.

**When to use:** Linear history is required AND PR target has diverged AND `gh pr merge --merge` would produce a no-ff merge commit (always true on GitHub).

**Why direct push, not `gh pr merge`:** v8.0 D-30-01 used `gh pr merge --merge` and produced a merge commit (open question never resolved at time of v8.0 close). v8.1 closes the question authoritatively (§1.2). FF preserves SHAs — Phase 35 done-gate evidence chain at `e2127cecb..f1425a5c8` stays valid post-rebase (per-commit SHAs change during rebase, but the lineage stays linear with no merge commit).

**Example sequence (combine §1.2 with rebase-and-force-push):**

```bash
# 0. Capture pre-state
git fetch fork --prune
git rev-parse master fork/sync/upstream-v2.0.1 v8.1/config-bucket
# expect: d717c09c3 (master), 8054a935b (sync/upstream-v2.0.1), f1425a5c8 (v8.1/config-bucket)

# 1. Rebase
git checkout v8.1/config-bucket
git rebase master
# - default conflict resolution: fork-side (HEAD wins; D-36-02)
# - bluebird scan: for each conflicted file, before accepting upstream :Promise<T>:
#     grep -l 'import Promise from "bluebird"' <file> && skip-annotation
# - downloader.test.ts and friends: only restore-from-master (--theirs) where the file
#   was master-side restored AFTER v8.1 forked (none expected; Phase 32-34 already drained)

# 2. Discard recurring api.d.ts regen
git checkout HEAD -- packages/vortex-api/lib/api.d.ts

# 3. Verify post-rebase compiles
pnpm run typecheck
# Expect drift in packages/vortex-api/lib/api.d.ts; discard again if needed
git status -sb | grep '^.M packages/vortex-api/lib/api.d.ts' && git checkout HEAD -- packages/vortex-api/lib/api.d.ts

# 4. Run Phase 35 SYNC-35a..d gates (replaces v8.0's grep-checkpoint.sh — no v8.1 milestone harness)
pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build

# 5. Verify pre-push lease for sync/upstream-v2.0.1
PRE_BUCKET=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.1 | cut -f1)
echo "Lease pin: $PRE_BUCKET"
test "$PRE_BUCKET" = "8054a935b6aad505798bba8a993d002718d119cb" || { echo "Remote drifted"; exit 1; }

# 6. Force-push lease-pinned via inline SSH URL
git push --force-with-lease=sync/upstream-v2.0.1:$PRE_BUCKET \
  git@github.com:atabisz/Vortex.git v8.1/config-bucket:sync/upstream-v2.0.1

# 7. Wait for Windows CI green on the rebased PR head
gh pr checks 5 --repo atabisz/Vortex --watch

# 8. FF-land via direct push (NOT gh pr merge — see §1.2)
LOCAL_HEAD=$(git rev-parse v8.1/config-bucket)
git merge-base --is-ancestor fork/master $LOCAL_HEAD || { echo "Not FF-able — abort"; exit 1; }

PRE_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$PRE_MASTER" = "d717c09c38f04ccfd8084e61ae61cbce01162a1a" || { echo "Master drifted"; exit 1; }

git push git@github.com:atabisz/Vortex.git v8.1/config-bucket:master

# 9. Close PR #5 (GitHub may auto-close; if not, force-close)
gh pr view 5 --repo atabisz/Vortex --json state | grep -q MERGED || \
  gh pr close 5 --repo atabisz/Vortex --comment "Landed via FF push at $LOCAL_HEAD."

# 10. Verify post-land master HEAD
POST_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$POST_MASTER" = "$LOCAL_HEAD" || { echo "Push didn't take"; exit 1; }
```

**Source:** §1.2 GitHub merge-methods doc + Phase 28/29/30 force-with-lease idiom. SHA verification at every step is non-negotiable.

### Pattern 2: SSH-signed annotated tag + dual-remote push

**What:** Tag the post-FF master commit with `git tag -a v2.0.1-linux-rebased -m "..."`; push to fork (triggers `release-linux.yml`) then origin (informational).

**Why annotated, not lightweight:** `softprops/action-gh-release@v2` reads tag annotation as release-body fallback. `git describe` resolves annotated tags by default.

**Why SSH-signed:** Memory `feedback_ssh_signing.md`. `gpg.format=ssh` + `tag.gpgsign=true` already configured; `git tag -a` auto-signs. `-s` is redundant but explicit.

**Why fork FIRST:** Fork triggers `release-linux.yml`. Origin (Nexus-Mods) push is informational; rejection is non-blocking (memory `project_upstream_pr_policy.md`).

**RC cleanup:** **N/A** — D-36-06 confirms no v2.0.1 RC tag exists (live-verified empty `git ls-remote ... 'refs/tags/v2.0.1*'`).

**Tag annotation body shape (casual voice per memory `feedback_casual_voice.md`):**

```
Vortex v2.0.1 Linux rebased — milestone v8.1 close.

Resolves upstream v2.0.1 sync (PR #5) onto Linux fork. 656 commits rebased
onto master, 5 Phase 35 build-verification commits.

Phase 35 done-gate: 7/7 GREEN (typecheck / lint:ci / test / build / linux smoke /
windows ci / done-gate review). See:
.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md

Phase 36 close: .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md
```

**Sequence:**

```bash
# 1. Verify post-FF master HEAD
git fetch fork --prune
git checkout master
git pull --ff-only fork master
NEW_MASTER=$(git rev-parse master)
echo "Tagging: $NEW_MASTER"

# 2. Verify signing config (paranoia; should be no-op)
test "$(git config --get gpg.format)" = "ssh" || { echo "ssh signing not configured"; exit 1; }
test "$(git config --get tag.gpgsign)" = "true" || { echo "tag.gpgsign not on"; exit 1; }

# 3. Create annotated signed tag (git auto-signs)
git tag -a v2.0.1-linux-rebased -m "$(cat <<'EOF'
Vortex v2.0.1 Linux rebased — milestone v8.1 close.

Resolves upstream v2.0.1 sync (PR #5) onto Linux fork. 656 commits rebased
onto master, 5 Phase 35 build-verification commits.

Phase 35 done-gate: 7/7 GREEN. See:
.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md
EOF
)"

# 4. Verify SSH signature
git tag -v v2.0.1-linux-rebased

# 5. Push to fork FIRST (triggers release-linux.yml)
git push git@github.com:atabisz/Vortex.git v2.0.1-linux-rebased

# 6. Push to origin (Nexus-Mods/Vortex; informational, may fail)
git push git@github.com:Nexus-Mods/Vortex.git v2.0.1-linux-rebased || \
  echo "Origin push rejected (expected per project_upstream_pr_policy.md); continuing."

# 7. Verify release-linux.yml triggered
sleep 30  # CI provisioning
gh run list --workflow="Release Linux (AppImage + deb)" --repo atabisz/Vortex --branch v2.0.1-linux-rebased --limit 1
```

**Source:** v8.0 30-RESEARCH.md Pattern 2 + memory `feedback_ssh_signing.md`. Tag-name `v2.0.1-linux-rebased` matches the `v*` glob in `release-linux.yml`.

### Pattern 3: Path-based cherry-pick filter

**What:** Enumerate commits with `git log master..<post-ff-master>` filtered by D-36-07 path-spec; cherry-pick chronologically with `-x`; linux-port HEAD wins on conflict; document drops in `36-CHERRY-PICK-NOTES.md`.

**Why path-based:** Direct expression of CLAUDE.md branch-strategy table. Scope-prefix filtering (e.g. `fix(linux):`) rejected — many `resolve(...):` commits touch real Linux code without matching a regex.

**Sequence:**

```bash
# 1. Sync linux-port to fork baseline (D-36-08)
git fetch fork --prune
git checkout linux-port
git reset --hard fork/linux-port  # fast-forward to 6a28945d1
test "$(git rev-parse HEAD)" = "6a28945d153ee9a7ca604d5c673eb5bd61c33e13"

# 2. Enumerate cherry-pick candidates
NEW_MASTER=$(git rev-parse fork/master)
git log master@{u}..$NEW_MASTER --reverse --oneline \
  --diff-filter=ACMRD \
  -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
  ':!.planning/**' \
  ':!.github/workflows/release-linux.yml' \
  ':!.github/workflows/format.yml' \
  ':!.github/actions/fingerprints/**' \
  ':!docker/**' \
  > .planning/phases/36-land-tag-cherry-pick-v2-0-1/cherry-candidates.txt
wc -l .planning/phases/36-land-tag-cherry-pick-v2-0-1/cherry-candidates.txt
# expect ~400-450 (extrapolated from v8.0's 216-of-375 = 58%; 656 * 0.58 ≈ 380)

# 3. Cherry-pick each in order with -x for traceability
while read sha _; do
  echo "Cherry-picking $sha"
  git cherry-pick -x "$sha" || {
    echo "Conflict at $sha — resolve linux-port-side, then continue"
    # On conflict — linux-port HEAD wins:
    # git checkout --ours <files>; git add <files>; git cherry-pick --continue
    # Or to drop:
    # git cherry-pick --abort; document in 36-CHERRY-PICK-NOTES.md
    break
  }
done < .planning/phases/36-land-tag-cherry-pick-v2-0-1/cherry-candidates.txt

# 4. Verify post-cherry typecheck (conservative; per phase 35 idiom)
pnpm run typecheck
# Discard api.d.ts regen if surfaced
git checkout HEAD -- packages/vortex-api/lib/api.d.ts

# 5. Push linux-port
PRE_LP=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/linux-port | cut -f1)
test "$PRE_LP" = "6a28945d153ee9a7ca604d5c673eb5bd61c33e13"
# linux-port is fast-forward (cherry-pick adds atop); plain push, no force needed
git push git@github.com:atabisz/Vortex.git linux-port
```

**Conflict-resolution philosophy (D-36-07 verbatim):**

- Default: linux-port HEAD wins (curated branch is authority).
- Renderer-spine churn incompatible with linux-port's lighter scope: drop, document.
- Borderline (CI fix that's Linux-motivated but lives in fork-only path): include only if path-filter passes; if filter excluded it, document.

**Drops file template (`36-CHERRY-PICK-NOTES.md`):**

```markdown
## Dropped: <sha> — <subject>

**Reason:** <one-line summary>
**Files affected:** <paths>
**Conflict shape:** <ours/theirs/manual>
**Recovery path:** if Linux-relevant, file follow-up issue #N.
```

**Source:** v8.0 30-RESEARCH.md Pattern 3, verbatim path filter from D-36-07.

### Pattern 4: `release-linux.yml` smoke-evidence capture

**What:** After Pattern 2 push triggers `release-linux.yml`, capture the run URL and the AppImage + .deb SHA256 manifest in `36-DONE-GATE.md`. UAT (local boot, Skyrim walkthrough) is **explicitly Phase 37 SYNC-37a** per D-36-09; do NOT do UAT in Phase 36.

**Sequence:**

```bash
# After tag push (Pattern 2), wait for release-linux.yml conclusion
RUN_ID=$(gh run list --workflow="Release Linux (AppImage + deb)" --repo atabisz/Vortex \
  --branch v2.0.1-linux-rebased --limit 1 --json databaseId --jq '.[0].databaseId')
echo "Watching run $RUN_ID"
gh run watch "$RUN_ID" --repo atabisz/Vortex --exit-status

# Once green: download asset SHAs (smoke evidence; NOT local boot)
mkdir -p .planning/phases/36-land-tag-cherry-pick-v2-0-1/release-smoke
cd .planning/phases/36-land-tag-cherry-pick-v2-0-1/release-smoke
gh release view v2.0.1-linux-rebased --repo atabisz/Vortex --json assets \
  --jq '.assets[] | "\(.name) \(.size) \(.downloadCount)"' > assets.txt

# If a SHA256 manifest is in the release assets, download it (don't download AppImage/.deb):
gh release download v2.0.1-linux-rebased --repo atabisz/Vortex \
  --pattern '*.sha256*' --pattern 'SHA256*' --dir .

# Capture in done-gate
cat assets.txt
ls -la *.sha256* 2>/dev/null || echo "No SHA256 manifest in release assets — record asset SHAs from CI run logs instead."
```

**Done-gate evidence shape (`36-DONE-GATE.md` SYNC-36d section):**

```markdown
### SYNC-36d — release-linux.yml smoke

- **Run URL:** https://github.com/atabisz/Vortex/actions/runs/<RUN_ID>
- **Conclusion:** success (10m XYs)
- **Artifact: vortex\_<version>.AppImage** — sha256:<HASH>
- **Artifact: vortex\_<version>\_amd64.deb** — sha256:<HASH>
- **Release page:** https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased
```

**Source:** v8.0 RC tag run [26259632336](https://github.com/atabisz/Vortex/actions/runs/26259632336) (10m58s) — empirically verified pipeline. No changes to `release-linux.yml` since v8.0 (CONTEXT confirms).

### Pattern 5: `packages/vortex-api/lib/api.d.ts` regen handling (D-36-11)

**What:** `pnpm run typecheck` regenerates `packages/vortex-api/lib/api.d.ts` as a side-effect. The regenerated file is not a real change and should not land. Discard with `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` after each typecheck.

**Why:** Phases 28/29/34/35 documented this — `tsc`'s declaration emit produces non-deterministic ordering on this file. The committed version is the canonical one.

**When:** After every typecheck run during the rebase (steps 3-4 of Pattern 1) AND after the post-cherry typecheck (step 4 of Pattern 3).

**Single command:**

```bash
git status -sb | grep -q '^.M packages/vortex-api/lib/api.d.ts' && \
  git checkout HEAD -- packages/vortex-api/lib/api.d.ts
```

**Anti-pattern:** Adding api.d.ts to `.gitignore` would lose the canonical file. Don't.

---

## §3. Pitfalls

### Pitfall 1: Inline SSH URL force-with-lease "stale info" rejection

**What goes wrong:** `git push --force-with-lease git@github.com:atabisz/Vortex.git v8.1/config-bucket:sync/upstream-v2.0.1` (implicit lease) returns `stale info` — inline SSH URL has no remote-tracking branch.

**How to avoid:** Always pin the lease to verified `git ls-remote` SHA: `--force-with-lease=<ref>:<SHA>`.

**Source:** v8.0 30-RESEARCH.md Pitfall 1; Phase 28 done-gate §8.

### Pitfall 2: `gh pr merge --merge` produces merge commit (not FF) — **NOW DOCUMENTED**

**What goes wrong:** Running `gh pr merge 5 --merge` always creates a merge commit per GitHub's API (uses `--no-ff`). ROADMAP success criterion #1 requires fast-forward.

**How to avoid:** Use direct push path documented in §1.2 + Pattern 1 step 8. Never use `gh pr merge --merge` for v2.0.1 land.

**Source:** §1.2 above (GitHub official docs — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github + gh 2.45.0 `--help`).

### Pitfall 3: Fork master never pushed (NO LONGER APPLICABLE)

v8.0 had this. v8.1: live-verified `fork/master == local master == d717c09c3` as of 2026-05-23. D-36-03 is a no-op. **Verify at plan start; if drifted, recover with the lease-pinned push pattern from v8.0.**

### Pitfall 4: Annotated tag-object SHA ≠ commit SHA

**What goes wrong:** Confusing tag-object SHA with commit SHA when referencing.

**How to avoid:** Push by ref name (`git push fork v2.0.1-linux-rebased`), not SHA. Less load-bearing for v8.1 since no RC cleanup needed (D-36-06).

### Pitfall 5: Canonical tag pushed to wrong remote first

**What goes wrong:** Pushing to origin first; tag exists on Nexus-Mods/Vortex but `release-linux.yml` (fork-only) never triggers.

**How to avoid:** Fork FIRST (Pattern 2 step 5). Origin push is best-effort.

**Source:** v8.0 30-RESEARCH.md Pitfall 5.

### Pitfall 6: `release-linux.yml` only triggers on `v*` glob

**What goes wrong:** Tag named without leading `v` won't trigger.

**How to avoid:** Confirmed name: `v2.0.1-linux-rebased`. Matches.

### Pitfall 7: Bluebird Promise trap on rebase conflict resolution

**What goes wrong:** Files with `import Promise from "bluebird"` shadow the global Promise. Taking upstream's `:Promise<T>` annotation on async functions causes TS1064.

**How to avoid:** During rebase, scan each conflict file:

```bash
grep -l 'import Promise from "bluebird"' <conflicted-file>
```

If match → omit the `:Promise<T>` annotation on async functions (TS infers from `async`); take fork-side default.

**Phase 32-34 already drained the bluebird surface in v8.1**, so few-to-zero hits expected during the 656-commit rebase. Scan anyway — costs nothing.

**Source:** Memory `feedback_bluebird_promise_trap.md`; v8.0 30-RESEARCH.md Pitfall 7; Phase 27 done-gate.

### Pitfall 8: oxfmt pre-commit reformats adjacent code on rebase commits

**What goes wrong:** After resolving a conflict, `git add` triggers oxfmt which reformats lines outside the conflict region.

**How to avoid:** Expected; commit anyway. File-wide format is the canonical fork shape. Memory `feedback_minimize_upstream_diff.md` applies to **out-of-scope files only**, not to files that are part of the change.

**Source:** v8.0 30-RESEARCH.md Pitfall 8; Phase 27 documentation.

### Pitfall 9: pnpm node-gyp chmod missing on canonical CI run

**What goes wrong:** `release-linux.yml` install step fails with `Permission denied` exit 126.

**How to avoid:** Already mitigated — `release-linux.yml` line 60–66 has the `chmod +x` step. Verify still present in pre-flight; no v8.1 change to this workflow expected. Retry `gh run rerun <run-id>` (up to 2 retries) before escalating.

**Source:** v8.0 30-RESEARCH.md Pitfall 9.

### Pitfall 10 (NEW for v8.1): `packages/vortex-api/lib/api.d.ts` regen in conflict path

**What goes wrong:** During rebase, if a 656-commit replay touches api.d.ts as part of a real change, the typecheck-driven regen overlays the change with non-deterministic ordering — produces a fake conflict on subsequent rebase steps.

**How to avoid:** Pattern 5 always-discard. If api.d.ts surfaces as a CONFLICTING file during rebase: `git checkout HEAD -- packages/vortex-api/lib/api.d.ts; git add packages/vortex-api/lib/api.d.ts; git rebase --continue`. Source-of-truth is the committed file.

**Source:** D-36-11 + Phase 28/29/34/35 idiom.

### Pitfall 11 (NEW for v8.1): PR #5 review-required block on indirect merge attempts

**What goes wrong:** If someone tries `gh pr merge 5 --merge` (against the §1.2 guidance) it will fail with `Pull Request requires reviews` because `reviewDecision=REVIEW_REQUIRED`.

**How to avoid:** Use direct push path (§1.2). Don't go through PR merge API. Plan should explicitly forbid `gh pr merge` invocations.

### Pitfall 12 (NEW for v8.1): rebase `--rebase-merges` would preserve any merge commits in v8.1 lineage

**What goes wrong:** If v8.1/config-bucket has any merge commits (Phase 31-35 closeouts), `--rebase-merges` would preserve them, breaking the linear-FF target.

**How to avoid:** v8.1 is purely linear (Phase 31-35 closeouts are atomic single commits). Default `git rebase master` (no `-i`, no `--rebase-merges`) is correct. Verify pre-rebase: `git log v8.1/config-bucket --merges master..v8.1/config-bucket` should be empty.

---

## §4. Wave-by-wave research surface

Suggested 6-7 plan structure for the planner (final cadence is `gsd-planner`'s call):

### Plan 36-00: Pre-flight + landing-path verification

**Research-grounded tasks:**

- Verify live state: `git ls-remote` for `fork/master`, `fork/sync/upstream-v2.0.1`, `fork/linux-port`, `refs/tags/v2.0.1*`. Confirm `master == d717c09c3`, `sync/upstream-v2.0.1 == 8054a935b`, no v2.0.1 tags.
- Verify `git config gpg.format=ssh tag.gpgsign=true` (already true; defensive check).
- Verify gh auth (`gh auth status`); fall back to `GH_TOKEN` env var if expired (memory `reference_github_token.md`).
- Verify v8.1/config-bucket is purely linear: `git log --merges master..v8.1/config-bucket` empty (Pitfall 12).
- Verify `pnpm` 10.33.0+ present.
- Capture pre-state snapshot to `36-REBASE-NOTES.md` header.
- Confirm D-36-03 no-op via `git rev-parse master == fork/master`. If drifted, fall back to lease-pinned push.
- Confirm `release-linux.yml` line 60-66 chmod step still present (Pitfall 9).

### Plan 36-01: Rebase v8.1/config-bucket onto master

**Research-grounded tasks:**

- `git checkout v8.1/config-bucket; git rebase master` — single command (no `--rebase-merges`; per Pitfall 12).
- Per-conflict: bluebird scan (Pitfall 7) → fork-side default (D-36-02) → `git add` + `git rebase --continue`.
- Per-conflict logging in `36-REBASE-NOTES.md`: file, side picked, bluebird-scan result, rationale.
- After every typecheck during rebase: discard api.d.ts (Pattern 5; D-36-11).
- After full rebase: run SYNC-35a..d gates (`pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build`) — replaces v8.0 grep-checkpoint.sh which doesn't exist for v8.1.
- Verify pre-push lease for sync/upstream-v2.0.1 (`8054a935b`).
- Force-push lease-pinned via inline SSH URL.
- Wait for Windows CI on rebased PR head (`gh pr checks 5 --watch`).

### Plan 36-02: FF-land PR #5 via direct push

**Research-grounded tasks:**

- Re-verify rebased branch is FF-able: `git merge-base --is-ancestor fork/master <rebased-HEAD>`.
- Verify pre-push lease for fork/master (`d717c09c3`).
- Direct push v8.1/config-bucket → fork/master via inline SSH URL (NOT `gh pr merge`).
- Verify post-push fork/master == rebased HEAD.
- Check `gh pr view 5 --json state` — if not auto-MERGED, `gh pr close --comment` per §1.2.
- Optional: delete merged head branch `:sync/upstream-v2.0.1` (§1.4).

### Plan 36-03: Create + dual-push canonical SSH-signed tag

**Research-grounded tasks:**

- Refresh local master to fork/master post-FF.
- Create `git tag -a v2.0.1-linux-rebased -m "<casual body>"` (Pattern 2 body shape).
- Verify signature: `git tag -v v2.0.1-linux-rebased`.
- Push fork FIRST via inline SSH URL.
- Push origin SECOND via inline SSH URL — non-blocking (catch + log).
- Verify `release-linux.yml` triggered: `gh run list --workflow="Release Linux (AppImage + deb)"`.

### Plan 36-04: release-linux.yml smoke evidence capture

**Research-grounded tasks (Pattern 4):**

- `gh run watch <RUN_ID> --exit-status` (block until conclusion).
- On success: `gh release view v2.0.1-linux-rebased --json assets` to enumerate.
- Capture asset SHA256s (download SHA256 manifest if present; otherwise extract from CI logs).
- Write `36-DONE-GATE.md` SYNC-36d section.
- On failure: up to 2 retries `gh run rerun` (Pitfall 9). If still failing → escalate.
- **Do NOT do local boot or screenshots** — Phase 37 SYNC-37a (D-36-09).

### Plan 36-05: Path-filtered cherry-pick to linux-port

**Research-grounded tasks (Pattern 3):**

- Sync local linux-port to `fork/linux-port` (`6a28945d1`).
- Enumerate via D-36-07 path filter; expect ~380 commits.
- Cherry-pick chronologically with `-x`. On conflict: linux-port-HEAD-wins or document drop in `36-CHERRY-PICK-NOTES.md`.
- After cherry-pick: typecheck; discard api.d.ts (Pattern 5).
- Push linux-port (FF push; no force needed).
- Verify post-push `fork/linux-port == local linux-port`.

### Plan 36-06: Phase done-gate

**Research-grounded tasks:**

- Roll up SYNC-36a/b/c/d evidence into `36-DONE-GATE.md` (matches Phase 35 shape).
- Capture: rebase commit count, dropped cherries count, AppImage/.deb SHAs, run URL, post-FF master HEAD, post-cherry linux-port HEAD.
- 7-criterion gate (mirroring D-35-10 shape): rebase done, FF-land done, tag signed + pushed, release-linux.yml green, AppImage/.deb published, cherry-pick done, all docs committed with `git add -f`.
- Commit done-gate doc with `git add -f` (memory `feedback_planning_gitignored.md`).

---

## §5. Risks / Contingencies

| Risk ID | Description                                                                              | Probability     | Mitigation                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-36-01 | 656-commit rebase produces unexpected conflict surface (master moved since Phase 35)     | MEDIUM          | Phase 35 closed 2026-05-XX; master is +5 since (already merged). Surface conflict count < v8.0's 109 expected (Phase 32-34 drained). Document in `36-REBASE-NOTES.md`.                                                        |
| R-36-02 | bluebird-Promise hits in rebase conflicts                                                | LOW             | Phase 32-34 drained. Pitfall 7 procedure handles each occurrence in seconds.                                                                                                                                                  |
| R-36-03 | api.d.ts regen during rebase produces fake CONFLICTING state                             | LOW-MEDIUM      | Pattern 5 / Pitfall 10 always-discard.                                                                                                                                                                                        |
| R-36-04 | Direct push to fork/master rejected by branch protection (`enforce_admins.enabled=true`) | LOW             | Verify pre-flight via `gh api /repos/atabisz/Vortex/branches/master/protection`. If admin-enforced, atabisz can use `--admin` on `gh pr merge` — but that produces merge commit (NOT FF). True-FF blocked → escalate to user. |
| R-36-05 | Origin push of canonical tag rejected                                                    | HIGH (expected) | Non-blocking per memory `project_upstream_pr_policy.md`. Catch + log; don't fail plan.                                                                                                                                        |
| R-36-06 | `release-linux.yml` flake (Pitfall 9 chmod)                                              | LOW             | 2 retries via `gh run rerun`; escalate if still failing.                                                                                                                                                                      |
| R-36-07 | Cherry-pick chain conflict pile-up on linux-port                                         | MEDIUM          | D-36-07 conflict policy permits drops with documentation. If a chain fails: `--abort`, document, skip-and-continue.                                                                                                           |
| R-36-08 | PR #5 doesn't auto-close after FF push                                                   | LOW             | §1.3 — manual `gh pr close --comment` fallback.                                                                                                                                                                               |
| R-36-09 | gh CLI auth expires mid-plan                                                             | LOW             | `GH_TOKEN` env-var fallback (memory `reference_github_token.md`).                                                                                                                                                             |
| R-36-10 | local-master vs fork-master drift between research and execution                         | LOW             | §1.1 verify-then-push pattern at plan start.                                                                                                                                                                                  |
| R-36-11 | `softprops/action-gh-release@v2` doesn't include SHA256 manifest in release assets       | MEDIUM          | Capture from CI run logs instead (Pattern 4 step 5). Document path in done-gate.                                                                                                                                              |

---

## §6. Assumptions

| #   | Claim                                                                                                                     | Section                 | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Direct push v8.1/config-bucket → fork/master succeeds without admin override                                              | §1.2 + Plan 36-02       | If branch protection has `enforce_admins=true`, push rejected. Mitigation: pre-flight `gh api .../branches/master/protection`; if enforced, escalate to user — true FF impossible while protection enforced; choices are (a) temporarily disable enforcement (admin only), or (b) accept the merge commit and re-discuss ROADMAP criterion #1 with user. **HIGH IMPACT — verify before plan execution.** |
| A2  | GitHub auto-closes PR #5 when fork/master advances past PR head                                                           | §1.3 + Plan 36-02       | If not, manual `gh pr close` fallback handles. LOW IMPACT.                                                                                                                                                                                                                                                                                                                                               |
| A3  | Tag deletion idempotency — `gpg.format=ssh` `tag.gpgsign=true` already configured + `~/.ssh/id_ed25519` is the active key | Pattern 2               | live-verified 2026-05-23.                                                                                                                                                                                                                                                                                                                                                                                |
| A4  | Push to `origin` (Nexus-Mods/Vortex) of canonical tag is non-blocking on rejection                                        | Pattern 2 + R-36-05     | Memory `project_upstream_pr_policy.md` is the authority. Mitigation: catch + log only.                                                                                                                                                                                                                                                                                                                   |
| A5  | `release-linux.yml` `push: tags: ['v*']` matches annotated tags                                                           | Pitfall 6               | v8.0 RC (annotated, signed) triggered the workflow — empirically verified Phase 29.                                                                                                                                                                                                                                                                                                                      |
| A6  | The 656-commit rebase produces ~380 cherry-pick candidates after path-filter                                              | Plan 36-05              | Extrapolated from v8.0's 216-of-375 (58%). Actual measurement at execution time. LOW IMPACT — affects time estimate, not outcome.                                                                                                                                                                                                                                                                        |
| A7  | v8.1/config-bucket is purely linear (no merge commits)                                                                    | Plan 36-00 + Pitfall 12 | Verify with `git log --merges master..v8.1/config-bucket`. If non-empty, `--rebase-merges` strategy needed instead. LOW PROBABILITY (Phase 31-35 closeouts are atomic).                                                                                                                                                                                                                                  |
| A8  | `gh pr merge --merge` produces merge commit, NOT fast-forward                                                             | §1.2                    | Authoritatively verified via GitHub docs + gh 2.45.0 `--help`. Direct-push path is mandatory. **HIGH CONFIDENCE — open question now closed.**                                                                                                                                                                                                                                                            |
| A9  | `packages/vortex-api/lib/api.d.ts` regen pattern still applies post-Phase 35                                              | Pattern 5 + D-36-11     | Phase 28/29/34/35 documented. Idiom is `git checkout HEAD --` after typecheck.                                                                                                                                                                                                                                                                                                                           |
| A10 | Phase 35 evidence chain (`e2127cecb..f1425a5c8` 5 commits) survives the rebase as 5 reordered-but-preserved commits       | §Summary                | If rebase squashes or drops any of these (shouldn't — they're atomic), evidence chain links to dead SHAs. Mitigation: `git log` review of the rebased tip's last 5 commits before push.                                                                                                                                                                                                                  |
| A11 | `release-linux.yml` produces a SHA256 manifest as a release asset OR the SHAs are recoverable from CI run logs            | Pattern 4               | If neither, fall back to `sha256sum` of downloaded artifacts (Phase 37 territory) — but D-36-09 forbids local boot in Phase 36. Mitigation: extract SHAs from electron-builder log output in CI.                                                                                                                                                                                                         |

---

## Project Constraints (from CLAUDE.md and AGENTS.md)

| Source                                       | Directive                                                             | Phase 36 Application                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| CLAUDE.md operational                        | Plan means stop                                                       | Plan presents to user; execution requires approval                                                           |
| CLAUDE.md operational                        | Build over ask for reversible                                         | Force-pushes (lease-pinned) reversible; tag deletion is reversible; FF-push reversible via revert            |
| CLAUDE.md project                            | Compatibility: Windows build must never break                         | SYNC-36a explicitly waits on Windows CI green before FF-push                                                 |
| CLAUDE.md project                            | Diff size: prefer small additive changes                              | Phase 36 has zero `src/`/`packages/`/`extensions/` code changes                                              |
| CLAUDE.md branch strategy                    | linux-port = clean Linux-only history                                 | D-36-07 path filter is the encoding                                                                          |
| CLAUDE.md GSD enforcement                    | All work through GSD command                                          | Phase 36 IS a GSD phase                                                                                      |
| AGENTS.md                                    | Use `pnpm run` for repo commands                                      | Pre-rebase + post-rebase typecheck/lint/test/build via `pnpm run`                                            |
| Memory `project_branch_strategy.md`          | linux-port for clean Linux-only history                               | D-36-07 cherry-pick policy                                                                                   |
| Memory `feedback_minimize_upstream_diff.md`  | Never reformat files outside change scope                             | oxfmt during rebase touches conflicted files only — acceptable. Don't run formatter against unrelated files. |
| Memory `feedback_casual_voice.md`            | Casual developer voice everywhere                                     | Tag annotation + commits + comments: casual, not formal-ops-review                                           |
| Memory `reference_github_token.md`           | GH_TOKEN env var fallback                                             | Use if `gh auth status` shows expired                                                                        |
| Memory `feedback_git_push_ssh.md`            | Inline SSH URL: `git push git@github.com:atabisz/Vortex.git <branch>` | Mandatory for force pushes; sandbox blocks `.git/config`                                                     |
| Memory `feedback_ssh_signing.md`             | SSH signing key only, not GPG                                         | Already configured; tags auto-sign                                                                           |
| Memory `project_upstream_pr_policy.md`       | Don't propose upstream PRs                                            | Origin tag push informational; non-blocking on reject                                                        |
| Memory `project_upstream_merge_checklist.md` | Verify gamebryo guards + skip-on-windows.mjs survived                 | Run as part of rebase post-verify (no v8.1 milestone harness; use SYNC-35a..d gates)                         |
| Memory `feedback_bluebird_promise_trap.md`   | Don't take upstream `:Promise<void>` if file imports bluebird Promise | Pitfall 7 procedure during rebase                                                                            |
| Memory `feedback_planning_gitignored.md`     | `git add -f` for `.planning/` paths                                   | All Phase 36 docs (DONE-GATE, REBASE-NOTES, CHERRY-PICK-NOTES, release-smoke/)                               |

---

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | No new tests in Phase 36 — uses existing Vitest 4.1.0 + Phase 35 SYNC-35a..d gates                                                                  |
| Config file        | `vitest.config.ts` (workspace root)                                                                                                                 |
| Quick run command  | `pnpm run typecheck && git checkout HEAD -- packages/vortex-api/lib/api.d.ts` (~30s)                                                                |
| Full suite command | `pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build` (replaces v8.0's grep-checkpoint.sh; v8.1 has no milestone harness per CONTEXT) |
| Phase gate         | Windows CI green on rebased PR head (SYNC-36a) AND `release-linux.yml` green on tag (SYNC-36d) AND all docs committed                               |

### Phase Requirements → Test Map

| Req ID                 | Behavior                            | Test Type  | Automated Command                                                       | File Exists?     |
| ---------------------- | ----------------------------------- | ---------- | ----------------------------------------------------------------------- | ---------------- |
| SYNC-36a               | Rebase + Windows CI green           | smoke (CI) | `gh pr checks 5 --watch`                                                | already-runnable |
| SYNC-36a               | FF-land succeeds                    | git state  | `git ls-remote ... refs/heads/master` matches local rebased HEAD        | already-runnable |
| SYNC-36b               | Tag exists + signed                 | git state  | `git tag -v v2.0.1-linux-rebased` exit 0                                | already-runnable |
| SYNC-36c               | linux-port HEAD updated             | git state  | `git ls-remote fork refs/heads/linux-port` differs from `6a28945d1`     | already-runnable |
| SYNC-36d               | release-linux.yml green             | smoke (CI) | `gh run list --workflow="Release Linux (AppImage + deb)"` shows success | already-runnable |
| Post-rebase invariants | typecheck/lint/test/build all green | scripted   | `pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build`     | already-runnable |

### Sampling rate

- **Per task commit:** `pnpm run typecheck` (~10s) — replaces grep-checkpoint.sh which doesn't exist for v8.1
- **Per plan merge:** Full SYNC-35a..d gates (`typecheck && lint:ci && test && build`)
- **Phase gate:** Full suite green + Windows CI green on rebased PR + release-linux.yml green on tag

### Wave 0 gaps

- [ ] **`36-REBASE-NOTES.md`** — written during Plan 36-01; per-conflict notes
- [ ] **`36-CHERRY-PICK-NOTES.md`** — written during Plan 36-05; per-cherry inclusion/drop rationale
- [ ] **`36-DONE-GATE.md`** — Plan 36-06 close-out; mirrors Phase 35 D-35-10 7-criterion shape
- [ ] **`release-smoke/`** — Plan 36-04; CI run URL + asset SHAs (NO local boot artifacts; UAT is Phase 37)

_Existing test infrastructure covers all phase requirements; only documentation/evidence files are net-new._

---

## Security Domain

`security_enforcement` defaulted on. Phase 36 assessment:

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                        |
| --------------------- | ------- | --------------------------------------------------------------------------------------- |
| V1 Architecture       | yes     | Code review via PR (PR #5 review-required satisfied or bypassed via direct-push)        |
| V2 Authentication     | yes     | SSH key auth for git push; gh CLI authenticated session                                 |
| V3 Session Management | no      | No new sessions                                                                         |
| V4 Access Control     | yes     | Branch protection on master enforces FF-only push (no force-push); deletions disallowed |
| V5 Input Validation   | no      | All inputs are git refs and tag names                                                   |
| V6 Cryptography       | yes     | SSH-signed tag via `~/.ssh/id_ed25519`; verify via `git tag -v`                         |
| V7 Error Handling     | yes     | Force-push lease prevents data loss on concurrent push                                  |
| V8 Data Protection    | no      | No sensitive data                                                                       |
| V9 Communication      | yes     | All git/gh ops over SSH or HTTPS to GitHub                                              |
| V10 Malicious Code    | yes     | Cherry-picked commits authored by Alex, signed; review before push                      |
| V14 Configuration     | yes     | `release-linux.yml` workflow is fork-controlled                                         |

### Known threat patterns

| Pattern                                    | STRIDE                 | Mitigation                                                                          |
| ------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------- |
| Force-push race (concurrent contributor)   | Tampering              | `--force-with-lease=<ref>:<sha>` with verified pre-push SHA                         |
| Tag squatting                              | Spoofing               | Annotated SSH-signed tag; consumers verify with `git tag -v`                        |
| Cherry-pick of malicious commit            | Tampering              | Path-filter limits to known directories; per-cherry review                          |
| Direct-push privilege misuse               | Elevation              | atabisz owns the fork; push permission is expected. No external collaborator scope. |
| CI workflow injection via tag-push trigger | Elevation              | `release-linux.yml` is fork-controlled, no untrusted input                          |
| GitHub Actions secret leak                 | Information Disclosure | `release-linux.yml` uses `GITHUB_TOKEN` only                                        |

---

## Sources

### Primary (HIGH confidence)

- `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-CONTEXT.md` — locked decisions D-36-01..D-36-11
- `.planning/REQUIREMENTS.md` — SYNC-36a/b/c/d verbatim
- `.planning/ROADMAP.md` — Phase 36 success criteria
- `.planning/STATE.md` — Phase 35 close state
- `.planning/milestones/v8.0-phases/30-land-tag/30-RESEARCH.md` — canonical playbook (patterns 1-3 carry-forward verbatim)
- `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md` — predecessor done-gate, evidence chain authority
- `.github/workflows/release-linux.yml` — `push: tags: ['v*']` trigger; `softprops/action-gh-release@v2`
- `.github/workflows/main.yml` — Windows + Linux matrix; SYNC-36a green-CI gate
- `CLAUDE.md` — branch strategy table
- `AGENTS.md` — pnpm run repo command convention
- `~/.claude/projects/-home-alex-src-Vortex/memory/MEMORY.md` — operational constraints (SSH signing, inline SSH URL, gitignored .planning/, casual voice, upstream PR policy, bluebird-Promise trap, force-push pattern)
- Live `git ls-remote git@github.com:atabisz/Vortex.git` (2026-05-23) — verified remote SHAs
- Live `gh pr view 5 --repo atabisz/Vortex --json` — confirmed OPEN CONFLICTING REVIEW_REQUIRED, head `8054a935b`
- Live `gh repo view atabisz/Vortex --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed` — `{true, true, true}`
- Live `gh --version` 2.45.0; `gh pr merge --help` confirms no `--ff-only` or `--fast-forward` flag exists

### Secondary (HIGH confidence — official docs)

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github — authoritative confirmation that "Merge commit" merge method uses `--no-ff` (resolves v8.0 Open Question §2)

### Tertiary (none)

---

## Metadata

**Confidence breakdown:**

- Locked decisions interpretation: HIGH (verbatim from CONTEXT)
- Live state SHAs: HIGH (live `git ls-remote` 2026-05-23)
- `gh pr merge --merge` semantics: HIGH (GitHub docs + gh 2.45.0 `--help` cross-verified — open question RESOLVED)
- Rebase mechanics: HIGH (v8.0 Phase 30 + Phase 28 + 29 precedent)
- Cherry-pick path-filter: HIGH (D-36-07 verbatim from v8.0 D-30-03)
- Tag signing: HIGH (already configured; v8.0 RC tag empirically verified)
- `release-linux.yml` trigger: HIGH (v8.0 RC tag run [26259632336] confirmed pipeline)
- D-36-03 no-op: HIGH (live-verified `master == fork/master == d717c09c3`)
- 656-commit rebase conflict surface: MEDIUM (Phase 32-34 drained but actual count unknown)
- Cherry-pick candidate count (~380): MEDIUM (extrapolated 58% from v8.0 ratio)
- Branch-protection `enforce_admins` state on master: MEDIUM (verify pre-flight per A1)
- PR auto-close after FF push: MEDIUM-HIGH (well-documented but verify per A2)

**Research date:** 2026-05-23
**Valid until:** 2026-06-22 (30 days; SHAs may drift if any new push to master between research and execution)
