# Phase 36 Wave 1 — Surgical Rebase Strategy (Addendum)

**Researched:** 2026-05-23
**Domain:** git surgical history reshape after `--rebase-merges` halt
**Confidence:** HIGH (state verified locally; strategy follows the original 36-RESEARCH.md operational invariants verbatim)

> Companion to `36-RESEARCH.md` and `36-REBASE-NOTES.md`. The original Wave 1 plan
> (`git rebase --rebase-merges --onto master <merge-base> v8.1/config-bucket`) halted at
> the 403-conflict central upstream merge `aa3faf7e5`. This addendum replaces that
> approach with a deterministic squash-then-cherry-pick reshape.

---

## Live state (verified 2026-05-23, post-Task-0)

| Ref                                    | SHA                                                                                                                                                                                                                                       | Note                                                                                                                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| local `master`                         | `d494bcb7d`                                                                                                                                                                                                                               | == `fork/master` (Task 0 push succeeded)                                                                                                                                           |
| `fork/master` (atabisz)                | `d494bcb7d`                                                                                                                                                                                                                               | live `git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master`                                                                                                           |
| `origin/master` (Nexus-Mods)           | `5130400bc`                                                                                                                                                                                                                               | upstream — **not our concern** for FF-merge target                                                                                                                                 |
| local `v8.1/config-bucket`             | `f1425a5c8`                                                                                                                                                                                                                               | Phase 35 closeout, unchanged after rebase abort                                                                                                                                    |
| `aa3faf7e5` parents                    | `d4c0d0da5` (1st, fork-base-at-merge) / `f25ff55da` (2nd, upstream v2.0.1 tip)                                                                                                                                                            | central merge subject "merge upstream v2.0.1 (conflicts)"                                                                                                                          |
| `f25ff55da`                            | tagged `v2.0.1` (Nexus-Mods)                                                                                                                                                                                                              |                                                                                                                                                                                    |
| `master..v8.1/config-bucket`           | 656 commits = 263 merges + 393 non-merges                                                                                                                                                                                                 |                                                                                                                                                                                    |
| `aa3faf7e5..v8.1/config-bucket`        | 393 first-parent commits, 393 non-merges                                                                                                                                                                                                  | post-merge chain is **fully linear** (262 of the 263 merges are upstream PR merges merged-in via `aa3faf7e5`'s 2nd parent, only `aa3faf7e5` itself sits on the first-parent trunk) |
| master `+5` ahead of v8.1's merge-base | all under `.planning/phases/31-config-bucket/`, `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/MILESTONES.md`, `.planning/RETROSPECTIVE.md`, `.planning/milestones/v8.0-*` | docs-only — verified via `git log v8.1/config-bucket..master --name-only`                                                                                                          |

The post-`aa3faf7e5` chain is **already linear** — the 393 commits between `aa3faf7e5` and
`f1425a5c8` are atomic resolution + Phase 32-35 work. No flattening of merges is needed
in step D below.

---

## §1 Strategy Summary

Abandon `--rebase-merges`. The central merge `aa3faf7e5` is irreplayable in a rebase
context — its 1st parent (`d4c0d0da5`, fork-base-at-merge) is no longer the rebase base, so
git tries to re-derive 8.7k upstream files as a 3-way merge against the wrong ancestor and
produces 403 conflicts. Replace it with a single deterministic squash commit that
materialises upstream v2.0.1's tree (`f25ff55da`, tagged `v2.0.1` upstream) on top of
current `master` HEAD, then cherry-pick the 393 Phase 32-35 commits from
`aa3faf7e5..f1425a5c8` linearly on top. Master's `+5` docs commits become the BASE
(verified docs-only — only `.planning/` paths). Result: a strictly linear branch where
master is an ancestor, FF-mergeable, with full atomic traceability of Phase 32-35
resolution work (`-x` flag) and a single squash boundary referencing `f25ff55da` /
upstream tag `v2.0.1` for upstream lineage.

**Primary recommendation:** Reset a fresh branch `v8.1/config-bucket-surgical` to
`master`, apply upstream v2.0.1 as one squash commit via `git read-tree --reset -u
f25ff55da`, cherry-pick `aa3faf7e5..f1425a5c8` chronologically with `-x`, run SYNC-35a..d,
then move `v8.1/config-bucket` to the new tip.

---

## §2 Concrete Operations Sequence

All commands assume `cwd = /home/alex/src/Vortex`. Verified SHAs: master = `d494bcb7d`,
v8.1/config-bucket = `f1425a5c8`, aa3faf7e5 = `aa3faf7e5315d537a3105fae319ac28379b0779d`,
f25ff55da = `f25ff55dae8a79847460fac153af874f20095aec` (== tag `v2.0.1` upstream).

### Stage A — Pre-flight & abort the failed rebase

```bash
# A1. Abort any in-progress rebase
git rebase --abort 2>/dev/null || true

# A2. Confirm clean tree
git status --porcelain   # MUST be empty

# A3. Snapshot the original v8.1 tip for rollback safety
git checkout v8.1/config-bucket
git rev-parse HEAD       # MUST equal f1425a5c8
git tag -f phase36/pre-surgical-snapshot f1425a5c8

# A4. Verify master state matches expected (fork already pushed in Task 0)
git fetch fork --prune
test "$(git rev-parse master)" = "$(git rev-parse fork/master)" \
  || { echo "Master drift — re-verify before proceeding"; exit 1; }

# A5. Verify the +5 docs commits on master are docs-only (already verified, defensive)
git log v8.1/config-bucket..master --name-only --format= | sort -u | grep -v '^$' \
  | grep -v '^\.planning/' \
  && { echo "FAIL: master +5 contains non-.planning paths"; exit 1; } \
  || echo "OK: master +5 is .planning/ only"

# A6. Verify upstream tip is locally available and tag-resolves
test "$(git rev-parse v2.0.1^{commit})" = "f25ff55dae8a79847460fac153af874f20095aec" \
  || { echo "FAIL: tag v2.0.1 doesn't resolve to f25ff55da"; exit 1; }
```

### Stage B — Create the surgical branch from master

```bash
# B1. Create new working branch from master HEAD
git checkout -b v8.1/config-bucket-surgical master
git rev-parse HEAD       # MUST equal d494bcb7d (current master)

# B2. Confirm we're starting clean
git status --porcelain   # empty
```

### Stage C — Apply upstream v2.0.1 as a single squash commit

```bash
# C1. Replace working tree + index with upstream v2.0.1's tree atomically.
#     read-tree --reset -u replaces index AND working tree from the tree-ish, leaving
#     HEAD alone. This is the cleanest atomic primitive for this op.
git read-tree --reset -u f25ff55da

# C2. Sanity: working tree now equals f25ff55da's tree but parent is master
git diff --cached --stat HEAD | tail -3   # large diff: ~2350 files

# C3. Discard api.d.ts if it shows as a change (D-36-11 invariant)
for f in $(git diff --cached --name-only | grep -E 'packages/vortex-api/lib/api\.d\.ts$'); do
  git checkout HEAD -- "$f" 2>/dev/null || true
  git reset HEAD -- "$f" 2>/dev/null || true
done

# C4. Commit the squash with annotated message body referencing upstream lineage
git commit -S -m "merge: apply upstream Vortex v2.0.1 (squash of aa3faf7e5)" -m "$(cat <<'EOF'
Squashes 263 upstream merges + content into a single deterministic commit.
Replaces the central merge aa3faf7e5 from the original v8.1/config-bucket
history that failed to replay under --rebase-merges (403 conflicts because
the rebase base shifted away from d4c0d0da5).

Upstream tip: f25ff55da (Nexus-Mods/Vortex tag v2.0.1)
Original merge: aa3faf7e5 (1st parent d4c0d0da5, 2nd parent f25ff55da)
Original branch snapshot: phase36/pre-surgical-snapshot (= f1425a5c8)

Phase 32-35 atomic resolution commits follow as -x cherry-picks from
aa3faf7e5..f1425a5c8 to preserve traceability of fork-side merge work
(SYNC-35a..d evidence chain at e2127cecb..f1425a5c8 stays addressable
via -x lines).

Upstream commit hashes preserved in upstream Nexus-Mods/Vortex.
EOF
)"

# C5. Capture the squash SHA
git rev-parse HEAD > /tmp/phase36-squash-sha
echo "Squash commit: $(cat /tmp/phase36-squash-sha)"
```

### Stage D — Cherry-pick the Phase 32-35 atomic chain

The post-`aa3faf7e5` chain is already linear (393 first-parent commits = 393 non-merge
commits). Cherry-pick chronologically with `-x` for traceability and `-S` for SSH signing.

```bash
# D1. Generate the cherry-pick list (chronological, no merges to skip — all are linear)
git rev-list --reverse --no-merges aa3faf7e5..f1425a5c8 \
  > /tmp/phase36-cherry-list

wc -l /tmp/phase36-cherry-list   # expected: 393

# D2. Verify count matches first-parent count (sanity — confirms linear chain)
test "$(wc -l < /tmp/phase36-cherry-list)" \
   = "$(git rev-list --reverse --first-parent --no-merges aa3faf7e5..f1425a5c8 | wc -l)" \
  || { echo "WARN: chain has off-trunk commits; investigate"; }

# D3. Begin the cherry-pick chain (-x for traceability, -S for SSH signing)
#     Use xargs to feed in batches; single shell command would exceed argv limits.
xargs -a /tmp/phase36-cherry-list git cherry-pick -x -S

# If a cherry-pick halts (it WILL on some commits — see §4), apply the
# conflict-resolution playbook, then:
#     git cherry-pick --continue
# When the chain finishes:
#     git rev-parse HEAD > /tmp/phase36-surgical-tip
```

**Why this works:** Each picked commit references the upstream-v2.0.1-resolved tree
state (because aa3faf7e5 had already merged in upstream). Our squashed base is the same
upstream tree (`f25ff55da` content) layered on master's `+5` docs. The picks should apply
cleanly; conflicts only arise on files where `aa3faf7e5` had fork-side resolution that
diverged from upstream-only state, which the per-pick playbook (§4) handles.

### Stage E — Verify FF-mergeable shape

```bash
# E1. master is a strict ancestor of new HEAD
git merge-base --is-ancestor master HEAD && echo "FF-OK" || { echo "FF-FAIL"; exit 1; }

# E2. New HEAD's tree matches f1425a5c8's tree (the original v8.1 tip's content)
git diff --stat phase36/pre-surgical-snapshot HEAD
# Acceptable: empty, or .planning/ docs drift only
git diff --name-only phase36/pre-surgical-snapshot HEAD | grep -v '^\.planning/' \
  | grep -v '^$' \
  && echo "WARN: code-path diff vs original tip — investigate" \
  || echo "OK: tree matches original tip (modulo .planning/)"

# E3. Commit count looks right
git log --oneline master..HEAD | wc -l   # expected: 394 (1 squash + 393 picks)

# E4. No dangling api.d.ts modifications
git status --porcelain   # empty

# E5. SYNC-35a..d gates (replaces grep-checkpoint.sh; v8.1 has no milestone harness)
pnpm install --frozen-lockfile
pnpm run typecheck    # SYNC-35a
git checkout HEAD -- packages/vortex-api/lib/api.d.ts 2>/dev/null || true   # D-36-11
pnpm run lint:ci      # SYNC-35b
pnpm test             # SYNC-35c
pnpm build            # SYNC-35d

# E6. bundledPlugins floor (≥130)
ls bundledPlugins | wc -l

# E7. api.d.ts not tracked dirty after gates
git status --porcelain | grep -E 'packages/vortex-api/lib/api\.d\.ts' \
  && { echo "FAIL: api.d.ts dirty"; exit 1; } \
  || echo "OK"

# E8. All commits between master and HEAD are SSH-signed
git log master..HEAD --format='%H %G?' | awk '$2 != "G"' | head \
  && { echo "FAIL: unsigned commits in range"; exit 1; } \
  || echo "OK: all signed"
```

### Stage F — Promote and force-push (lease-pinned)

```bash
# F1. Move v8.1/config-bucket to the surgical branch (after gates pass)
git branch -f v8.1/config-bucket v8.1/config-bucket-surgical
git checkout v8.1/config-bucket
git rev-parse HEAD > /tmp/phase36-surgical-tip

# F2. Force-push lease-pinned to fork/sync/upstream-v2.0.1 (PR #5 head)
PRE_BUCKET=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.1 | cut -f1)
echo "Lease pin (current PR #5 head): $PRE_BUCKET"
test "$PRE_BUCKET" = "8054a935b6aad505798bba8a993d002718d119cb" \
  || { echo "Remote drifted — re-derive lease before push"; exit 1; }

git push --force-with-lease=sync/upstream-v2.0.1:$PRE_BUCKET \
  git@github.com:atabisz/Vortex.git \
  v8.1/config-bucket:sync/upstream-v2.0.1

# F3. Push the safety tag
git push git@github.com:atabisz/Vortex.git phase36/pre-surgical-snapshot

# F4. Wait for Windows CI on the rebased PR head (SYNC-36a green-CI gate)
gh pr checks 5 --repo atabisz/Vortex --watch
```

---

## §3 Verification Gates (Per Stage)

| Stage | Gate                                 | Command                                                                             | Pass Criterion                             |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| A     | Clean tree                           | `git status --porcelain`                                                            | empty                                      |
| A     | Master == fork/master                | `git rev-parse master == fork/master`                                               | true (Task 0 already pushed)               |
| A     | Master `+5` are docs-only            | `git log v8.1/config-bucket..master --name-only` filtered against `.planning/`      | empty                                      |
| A     | Tag `v2.0.1` resolves to `f25ff55da` | `git rev-parse v2.0.1^{commit}`                                                     | `f25ff55dae8a79847460fac153af874f20095aec` |
| B     | Branch base                          | `git rev-parse HEAD` after checkout                                                 | equals master HEAD                         |
| C     | Squash tree matches upstream         | `git diff --stat HEAD f25ff55da -- ':!.planning'`                                   | empty                                      |
| C     | Squash commit signed                 | `git log -1 --show-signature HEAD`                                                  | "Good signature" with SSH key              |
| C     | api.d.ts not staged                  | `git diff --cached --name-only \| grep api\.d\.ts`                                  | empty                                      |
| D     | Cherry-pick chain complete           | exit code of last `cherry-pick`/`continue`                                          | 0                                          |
| D     | Each pick has `-x` line              | `git log master..HEAD --format=%b \| grep -c "cherry picked"`                       | == picked count                            |
| D     | No unsigned picks                    | `git log master..HEAD --format='%H %G?' \| awk '$2 != "G"'`                         | empty                                      |
| E     | FF-ancestry                          | `git merge-base --is-ancestor master HEAD`                                          | exit 0                                     |
| E     | Tip-tree parity (code paths)         | `git diff --name-only phase36/pre-surgical-snapshot HEAD \| grep -v '^\.planning/'` | empty                                      |
| E     | Commit count                         | `git log --oneline master..HEAD \| wc -l`                                           | 394 ± skipped picks                        |
| E     | Typecheck                            | `pnpm run typecheck`                                                                | exit 0                                     |
| E     | Lint                                 | `pnpm run lint:ci`                                                                  | exit 0                                     |
| E     | Test                                 | `pnpm test`                                                                         | exit 0                                     |
| E     | Build                                | `pnpm build`                                                                        | exit 0                                     |
| E     | bundledPlugins floor                 | `ls bundledPlugins \| wc -l`                                                        | ≥ 130                                      |
| E     | api.d.ts clean                       | `git status --porcelain \| grep api\.d\.ts`                                         | empty                                      |
| F     | Lease-pinned push acknowledged       | exit code of `git push --force-with-lease`                                          | 0                                          |
| F     | PR #5 mergeability flips             | `gh pr view 5 --json mergeable`                                                     | `MERGEABLE`                                |
| F     | Windows CI green                     | `gh pr checks 5 --watch`                                                            | success                                    |

---

## §4 Conflict-Resolution Playbook (Per Cherry-Pick)

The 393-commit chain WILL hit conflicts at some pick boundaries. The squashed upstream
base produces a tree identical to `aa3faf7e5`'s 2nd-parent tree, but Phase 32-35 commits
were authored against `aa3faf7e5`'s **merged** tree (which had fork-side resolution baked
in). Conflicts arise where a Phase 32-35 commit modifies a file that was fork-side
resolved at merge time but now reverts to upstream-only state in our squashed base.

**Default policy:** fork-side wins (D-36-02 invariant).

### Per-conflict procedure

```bash
# Step 1. Inspect the failing pick
git status                                          # list conflicted files
git log -1 --format='%H %s' CHERRY_PICK_HEAD        # which Phase 32-35 commit halted
git log -1 --format='%H %s' MERGE_HEAD 2>/dev/null  # the pick's parent context

# Step 2. For each conflicted file (in this order):

# 2a. api.d.ts discard (D-36-11) — always-discard, never resolve
for f in $(git diff --name-only --diff-filter=U | grep 'packages/vortex-api/lib/api\.d\.ts$'); do
  git checkout HEAD -- "$f"
  git add "$f"
done

# 2b. Bluebird Promise<void> scan (memory: feedback_bluebird_promise_trap.md)
for f in $(git diff --name-only --diff-filter=U); do
  if grep -q 'import Promise from "bluebird"' "$f" 2>/dev/null \
     && grep -qE 'async\s+\w+.*:\s*Promise<' "$f"; then
    echo "BLUEBIRD-TRAP: $f — review manually, strip :Promise<T> from async fns"
  fi
done
# For each flagged file: drop the :Promise<T> annotation on async fns
# (TS infers from `async`); take fork-side default for the rest of the hunk.

# 2c. Fork-side default for the remainder
#     In cherry-pick semantics, "theirs" = the commit being picked = Phase 32-35 work,
#     which IS the fork-side authority. So `--theirs` is the fork-side default.
for f in $(git diff --name-only --diff-filter=U); do
  git checkout --theirs -- "$f"
  git add "$f"
done

# Step 3. Verify resolution leaves no conflict markers
git diff --cached --check     # exit 0 means no markers

# Step 4. Continue
git cherry-pick --continue
```

### Empty cherry-pick (commit becomes no-op)

If a Phase 32-35 commit's changes are already present in the squashed base (because
upstream v2.0.1 included an equivalent change), git reports empty. Skip and document:

```bash
git cherry-pick --skip
echo "$(date -Iseconds) SKIP $(cat /tmp/phase36-cherry-list | sed -n "$(git cherry-pick --is-in-progress; echo $?)p") empty-pick" \
  >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md
```

### Halted-mid-chain recovery

If the chain breaks irrecoverably partway through:

```bash
git cherry-pick --abort
# Branch is now at last-good-pick state.
# phase36/pre-surgical-snapshot (= f1425a5c8) is the rollback target.
# Re-plan from the next-pick-onward sub-range.
```

The safety tag `phase36/pre-surgical-snapshot` is intact; Task 0's master push remains
load-bearing for Wave 2 regardless of Wave 1 progress.

### Sub-bucket conflict heuristics (carry-forward from Wave 1 halt analysis)

The 36-REBASE-NOTES.md halt log surfaced 5 known bluebird-Promise files in
`extensions/gamebryo-{plugin,savegame}-management/`. These are the high-risk picks:

| File                                                                | Heuristic during pick                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `extensions/gamebryo-plugin-management/src/index.ts`                | Phase 33 introduced `await ESPFile.open(...)` async factory for Linux. Take **fork-side** (the Phase 32-35 pick) every time. |
| `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` | Same — Linux-async path. Fork-side.                                                                                          |
| `extensions/gamebryo-plugin-management/src/util/gameSupport.ts`     | Same. Fork-side.                                                                                                             |
| `extensions/gamebryo-plugin-management/src/views/PluginList.tsx`    | Same. Fork-side.                                                                                                             |
| `extensions/gamebryo-savegame-management/src/index.ts`              | Same. Fork-side.                                                                                                             |

For all 5: fork-side default already does the right thing — no special handling beyond
the standard playbook.

---

## §5 Squash Commit Message Template

Embedded in §2 Stage C4 above. Reproduced here for the planner's convenience:

```
merge: apply upstream Vortex v2.0.1 (squash of aa3faf7e5)

Squashes 263 upstream merges + content into a single deterministic commit.
Replaces the central merge aa3faf7e5 from the original v8.1/config-bucket
history that failed to replay under --rebase-merges (403 conflicts because
the rebase base shifted away from d4c0d0da5).

Upstream tip: f25ff55da (Nexus-Mods/Vortex tag v2.0.1)
Original merge: aa3faf7e5 (1st parent d4c0d0da5, 2nd parent f25ff55da)
Original branch snapshot: phase36/pre-surgical-snapshot (= f1425a5c8)

Phase 32-35 atomic resolution commits follow as -x cherry-picks from
aa3faf7e5..f1425a5c8 to preserve traceability of fork-side merge work
(SYNC-35a..d evidence chain at e2127cecb..f1425a5c8 stays addressable
via -x lines).

Upstream commit hashes preserved in upstream Nexus-Mods/Vortex.
```

**Voice check:** matches project casual-developer voice
(memory: `feedback_casual_voice.md`). No formal-ops-review tone.

---

## §6 Risks + Mitigations

| ID  | Risk                                                                                  | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Squash loses 263 upstream merge SHAs                                                  | certain    | low    | Tag squash body with `f25ff55da` + upstream tag `v2.0.1`; upstream commits remain in `Nexus-Mods/Vortex`                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| R2  | Cherry-pick chain halts on stubborn conflict                                          | high       | medium | Same playbook that produced these commits originally; safety tag `phase36/pre-surgical-snapshot` for rollback; per-pick documented in 36-REBASE-NOTES.md                                                                                                                                                                                                                                                                                                                                                                                                                    |
| R3  | 393 cherry-picks is slow                                                              | certain    | low    | Budget the time; this IS the work; xargs batches the invocations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| R4  | Phase 32-35 chain is non-linear (off-trunk commits)                                   | low        | medium | Verified linear: 393 first-parent non-merges == 393 total non-merges. No off-trunk content to recover.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| R5  | D-36-07 linux-port filter range invalidated by SHA churn                              | likely     | low    | Filter operates by path-spec on `master..post-FF-master`; new shape still satisfies that range. **Required edit: filter must skip the squash commit by message-grep** (see §8 Wave 5).                                                                                                                                                                                                                                                                                                                                                                                      |
| R6  | api.d.ts re-emerges during cherry-pick chain                                          | high       | low    | D-36-11 always-discard step in §4 step 2a catches it per-pick                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| R7  | Bluebird `Promise<void>` annotations trigger TS1064 mid-chain                         | medium     | medium | Pre-resolve scan in §4 step 2b; 5 known files in `extensions/gamebryo-*` flagged in §4 sub-bucket table                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| R8  | `bundledPlugins` floor (≥130) drops because squash drops a plugin file                | low        | high   | Stage E6 gate catches it; remediation = restore from `phase36/pre-surgical-snapshot` snapshot or re-pick affected plugin commits                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| R9  | SSH signing fails on cherry-picks (signing key not loaded)                            | low        | high   | Verify `~/.ssh/id_ed25519` readable at A; `gpg.format=ssh` + `tag.gpgsign=true` already verified; `-S` flag explicit on each commit; Stage D D2/E8 check                                                                                                                                                                                                                                                                                                                                                                                                                    |
| R10 | Master `+5` docs collide with Phase 32-35 docs during cherry-pick                     | very low   | low    | Verified disjoint paths: master `+5` = `.planning/phases/31-config-bucket/`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`, `.planning/RETROSPECTIVE.md`, `.planning/milestones/v8.0-*`. Phase 32-35 docs = `.planning/phases/32..35-*/`. **One overlap risk:** `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` are touched by both. Conflict expected on Phase 32-35 doc commits that update STATE/ROADMAP — apply fork-side default (the Phase 32-35 pick wins). |
| R11 | Tip-tree parity (Stage E2) fails on code paths                                        | low        | medium | Investigate diff: `.planning/` drift acceptable; code drift = re-pick missed commits, or apply diff as a final reconciliation commit                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| R12 | `--force-with-lease` rejects in F2 due to remote drift between research and execution | low        | medium | Re-derive `PRE_BUCKET` just-in-time from `git ls-remote`; lease pin uses fresh value, not hardcoded                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| R13 | PR #5 doesn't auto-flip to MERGEABLE after force-push                                 | low        | low    | Manual `gh pr view 5 --json mergeable` poll; if stuck CONFLICTING after 60s, investigate (likely git side-effect); fall back to direct push to fork/master per §1.2 of original 36-RESEARCH.md                                                                                                                                                                                                                                                                                                                                                                              |
| R14 | Windows CI fails on rebased head (SYNC-36a)                                           | medium     | high   | Same risk as original plan; not surgical-strategy specific. Diagnose per phase 35 playbook; common cause = api.d.ts drift or bluebird trap missed in resolution                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## §7 Done Criteria for Revised Wave 1

Wave 1 is complete when ALL hold:

- [ ] `git merge-base --is-ancestor master v8.1/config-bucket` exits 0 (FF-mergeable)
- [ ] `git diff --name-only phase36/pre-surgical-snapshot v8.1/config-bucket | grep -v '^\.planning/'` is empty
- [ ] `git log master..v8.1/config-bucket --oneline | wc -l` ≈ 394 (1 squash + ~393 picks; minus skipped empty-picks)
- [ ] All commits between master and v8.1/config-bucket carry `G` in `git log --format='%G?'` (SSH-signed)
- [ ] Each cherry-picked commit body contains `(cherry picked from commit ...)` line
- [ ] Squash commit body references `f25ff55da` and `aa3faf7e5` and `phase36/pre-surgical-snapshot`
- [ ] `pnpm run typecheck` exits 0 (SYNC-35a)
- [ ] `pnpm run lint:ci` exits 0 (SYNC-35b)
- [ ] `pnpm test` exits 0 (SYNC-35c)
- [ ] `pnpm build` exits 0 (SYNC-35d)
- [ ] `ls bundledPlugins | wc -l` ≥ 130
- [ ] `git status --porcelain` is empty (no api.d.ts drift, no working-tree changes)
- [ ] `fork/sync/upstream-v2.0.1` advanced to `v8.1/config-bucket` HEAD (`git ls-remote` confirms)
- [ ] Tag `phase36/pre-surgical-snapshot` pushed to fork for rollback safety
- [ ] PR #5 `mergeable` field flipped to `MERGEABLE` (`gh pr view 5 --json mergeable`)
- [ ] Windows CI green on PR #5 head (SYNC-36a)
- [ ] `36-REBASE-NOTES.md` updated with surgical-strategy execution log + skipped picks + per-conflict notes

---

## §8 Impact on Downstream Waves

### Wave 2 — FF-land to fork/master

**Impact:** None to small. The new branch IS strictly FF-mergeable (Stage E1 gate).

The original 36-RESEARCH.md §1.2 direct-push path stands unchanged:

```bash
LOCAL_HEAD=$(git rev-parse v8.1/config-bucket)
git merge-base --is-ancestor fork/master $LOCAL_HEAD || { echo "Not FF-able"; exit 1; }
PRE_MASTER=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
git push git@github.com:atabisz/Vortex.git v8.1/config-bucket:master
gh pr close 5 --repo atabisz/Vortex --comment "Landed via FF push at ${LOCAL_HEAD}"
```

**Required Wave 2 plan edit:** none. The pre-flight `git merge-base --is-ancestor`
already exists in Wave 2's setup task and now passes by construction.

### Wave 3 — Tag

**Impact:** None. Tag `v2.0.1-linux-rebased` is on the post-FF master HEAD, which is the
surgical-rebase tip after FF-merge. Tag annotation body in original Pattern 2 needs one
line edit to reflect the surgical history:

```diff
 Vortex v2.0.1 Linux rebased — milestone v8.1 close.

 Resolves upstream v2.0.1 sync (PR #5) onto Linux fork.
-656 commits rebased onto master, 5 Phase 35 build-verification commits.
+Surgical rebase: upstream v2.0.1 squashed (phase36/pre-surgical-snapshot
+= f1425a5c8 retains original 656-commit history); 393 Phase 32-35 atomic
+commits cherry-picked onto master.

 Phase 35 done-gate: 7/7 GREEN. See:
 .planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md
```

### Wave 4 — release-linux.yml smoke

**Impact:** None. Same trigger event (`push: tags: ['v*']`) on the same tag name. Asset
SHAs differ from any prior run; capture as planned.

### Wave 5 — Cherry-pick to linux-port (D-36-07)

**Impact:** Two consequences from the surgical reshape:

1. **The squash commit will be in `master..post-FF-master`.** The filter must skip it —
   it's an upstream-tree apply, not a Linux-port-relevant fork commit. Add to the filter
   pipeline:

    ```bash
    git log master..post-FF-master --format='%H %s' \
      | grep -v 'merge: apply upstream Vortex v2.0.1' \
      | cut -d' ' -f1 \
      | xargs -n1 git log -1 --format='%H' --diff-filter=ACMRD \
        -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
           ':!.planning/**' ':!.github/workflows/release-linux.yml' \
           ':!.github/workflows/format.yml' ':!.github/actions/fingerprints/**' \
           ':!docker/**' \
      | grep -v '^$' \
      > cherry-candidates.txt
    ```

    Or detect by message body marker:

    ```bash
    git log master..post-FF-master --grep='Original merge: aa3faf7e5' --invert-grep ...
    ```

2. **Phase 32-35 cherry-picks carry `-x` lines.** Filter logic that identifies
   Linux-port-relevant commits by path/diff continues to work — the `-x` suffix is
   appended, not replacing the commit message. No filter rewrite needed for picks; their
   subjects and diffs match what the filter expects.

**Required Wave 5 plan edit:** add the squash-skip line above to the filter script in
plan `36-05-WAVE-5-cherry-pick.md`. Filter still operates by path/content, not SHA, so
the new SHAs don't break it.

**Candidate count revision:** original estimate ~380 (58% of 656). Surgical reshape
removes the 263 merge commits from the candidate set entirely (squashed away); estimate
revises to **~225-275** (58% of 393 + the squash itself, which is then filtered out).
Document actual count at execution.

### Wave 6 — Phase done-gate

**Impact:** None functionally; gate criteria already check FF-mergeability + SYNC-35a..d

- release-linux.yml + cherry-pick + docs.

**Optional documentation update:** Wave 6 summary report should note "upstream v2.0.1
applied as squash commit `<sha>` per surgical strategy (36-RESEARCH-SURGICAL.md);
original merge aa3faf7e5 + 656-commit history preserved at tag
`phase36/pre-surgical-snapshot`" for audit-trail clarity.

---

## Sources

### Primary (HIGH confidence — verified live 2026-05-23)

- `git rev-parse master v8.1/config-bucket` — confirmed master `d494bcb7d`,
  v8.1/config-bucket `f1425a5c8`
- `git rev-parse aa3faf7e5^1 aa3faf7e5^2` — confirmed parents `d4c0d0da5` / `f25ff55da`
- `git tag --points-at f25ff55da` — confirmed `v2.0.1` tag aligns
- `git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master` — confirmed
  fork/master = `d494bcb7d` (Task 0 push landed)
- `git rev-list --count master..v8.1/config-bucket` = 656; `--merges` = 263; `--no-merges
--first-parent --reverse aa3faf7e5..` = 393 == `--no-merges --reverse aa3faf7e5..`
  = 393 (chain is linear post-merge)
- `git log v8.1/config-bucket..master --name-only` — confirmed master `+5` commits
  touch only `.planning/` paths
- `git diff --stat d4c0d0da5 f25ff55da` — confirmed upstream v2.0.1 delta size
  (~2350 files, ~283k insertions, ~134k deletions)

### Secondary (HIGH confidence — project artifacts)

- `36-RESEARCH.md` — original phase research; operational invariants applied verbatim
  (D-36-01..D-36-11, SSH signing, inline SSH URL push, bluebird scan, api.d.ts discard,
  fork-side default, casual voice)
- `36-REBASE-NOTES.md` Wave 0 + Wave 1 halt log — explains 403-conflict failure mode
  and surfaces the bluebird-file inventory in `extensions/gamebryo-*`
- `36-CONTEXT.md` — locked decisions D-36-01..D-36-11
- `CLAUDE.md` — branch strategy and project constraints

### Tertiary (LOW confidence — measurement-time only)

- Exact cherry-pick conflict count is unknown until Stage D executes. Estimate: 10-50
  conflicts based on Phase 32-35's original conflict density. Resolution playbook
  handles each deterministically; total wall-time risk is the main unknown.
- Skipped-as-empty pick count is unknown. Estimate: 0-10 (most Phase 32-35 commits are
  conflict-resolution work that has no upstream equivalent).

---

## Metadata

**Confidence breakdown:**

- Strategy soundness: HIGH — squash + cherry-pick is a standard surgical reshape pattern
  for irreplayable merges
- Operational sequence: HIGH — every primitive (`read-tree`, `cherry-pick -x -S`,
  `--force-with-lease=ref:sha`) used in prior phases
- State verification: HIGH — every claimed SHA / count / path-set verified live this
  session
- Conflict playbook: MEDIUM — exact conflicts unknown; playbook proven on prior chains
  (Phase 32-35 originally produced these commits using the same fork-side default rule)
- Downstream impact: HIGH — FF-mergeability is the contract; new shape satisfies it
  by construction

**Research date:** 2026-05-23
**Valid until:** 2026-05-30 (re-verify state if not executed within 7 days; master and
v8.1/config-bucket SHAs may drift; `fork/sync/upstream-v2.0.1` lease pin must be
re-derived just-in-time before F2)
