---
phase: 36
wave: 5
plan_id: 36-05
title: "Wave 5 — path-filtered cherry-pick to linux-port (SYNC-36c)"
branch: linux-port
requirement_ids:
    - SYNC-36c
dependencies:
    - 36-04 # release-linux.yml smoke green (cherry-pick can technically run in parallel with Wave 4, but sequencing keeps risk surface tight)
estimated_commits: ~390 # Path C revises estimate: candidate range walks both parent ancestries (master line + v8.1 line via 2nd-parent), --no-merges excludes the Wave 1 merge commit and 119 v8.1 PR-merges; actual count measured at execution
---

# Wave 5 — Cherry-pick the Linux subset of post-merge master onto linux-port

## Goal

Sync local `linux-port` to `fork/linux-port` (`6a28945d1`); enumerate cherry-pick candidates from `merge-base(linux-port, master)..<post-merge-master>` filtered by D-36-07 path-spec **with `--no-merges`** (Path C re-shape): the Wave 1 merge commit and the 119 v8.1 PR-merge commits in the 2nd-parent ancestry are merges and must NOT be cherry-picked (a cherry-pick of a merge commit collapses the merge into a single non-merge commit on linux-port, losing all the lineage we just spent Phase 36 preserving). Cherry-pick chronologically with `-x` for traceability; resolve conflicts with linux-port HEAD wins; document drops and inclusions in `36-CHERRY-PICK-NOTES.md`; run a post-cherry typecheck (discard api.d.ts regen); push linux-port via plain FF push.

**Candidate count for Path C:** the post-merge master HEAD reaches both lineages — master 1st-parent line (~300 v2.0.0-linux atomic commits since `d4c0d0da5`) and v8.1 2nd-parent line (393 Phase 32-35 atomic commits + the original v2.0.1 upstream content). With `--no-merges` filtering the Wave 1 merge and 119 v8.1 PR-merges out, the candidate set walks both ancestries. Practical estimate: ~350-450 candidates after path-filter (broader than the surgical-reshape estimate because Path C now also surfaces v2.0.0-linux atomic commits that weren't in the v8.1 chain). Document actual count at execution per Assumption A6.

**Why not include v2.0.0-linux commits on linux-port?** They're already there — `linux-port` was branched from `v2.0.0-linux-rebased` (the v8.0 milestone close tag). The merge-base of `linux-port` and master is the v8.0 tag commit, which is downstream of `d4c0d0da5`. So `merge-base(linux-port, master)..master` correctly skips the v2.0.0-linux content already on linux-port and surfaces only the v2.0.1 + Phase 32-35 deltas. The `--no-merges` filter on top excludes the Wave 1 merge + the 119 v8.1 PR-merges so the cherry-pick walks atomic commits only.

References: see `36-CONTEXT.md` D-36-07 / D-36-08 / D-36-11; `36-RESEARCH.md` §2 Pattern 3 + §2 Pattern 5 (api.d.ts regen) + §6 Assumption A6 (~380 estimate now revised); `36-RESEARCH-FORWARD-SYNC.md` §4 Stage 9 (`--no-merges` walks both parent ancestries; squash-skip grep dropped because no squash exists in Path C); CLAUDE.md branch strategy table; memories `project_branch_strategy.md`, `feedback_minimize_upstream_diff.md`.

## Tasks

1. **Sync local `linux-port` to fork baseline (D-36-08).**
    - `git fetch fork --prune`
    - `git checkout linux-port`
    - `git reset --hard fork/linux-port`
    - Verify: `git rev-parse HEAD` == `6a28945d153ee9a7ca604d5c673eb5bd61c33e13`. If drifted (someone pushed to linux-port mid-phase — unlikely), re-baseline against the new fork value.

2. **Enumerate cherry-pick candidates per D-36-07 path filter, with `--no-merges` (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9).**
    - Captures both subjects and full SHAs to a candidate file under `.planning/phases/36-land-tag-cherry-pick-v2-0-1/`.
    - **`--no-merges` filter (Path C):** the Wave 1 merge commit and the 119 v8.1 PR-merge commits in the 2nd-parent ancestry are merges. Cherry-picking a merge commit collapses it into a single non-merge commit, losing the lineage Phase 36 preserved. `--no-merges` excludes them from the candidate set; the underlying atomic commits (Phase 32-35 + v2.0.0-linux atomic commits) come through naturally because `git log --no-merges <range>` walks both parent ancestries of any merge commit in the range and emits the non-merge commits reachable through both lines.
    - **Substitution from earlier surgical-strategy draft:** the `--grep='Original merge: aa3faf7e5' --invert-grep` squash-skip filter is **DROPPED**. There is no squash commit in Path C — upstream v2.0.1 content reaches master via the merge commit's 2nd-parent ancestry through `aa3faf7e5`, not via a synthetic squash. `--no-merges` does the equivalent excluding work cleanly.
    - Path filter (verbatim from D-36-07):
        - Include: `src/**` `extensions/**` `packages/**` `scripts/**`
        - Exclude: `:!.planning/**` `:!.github/workflows/release-linux.yml` `:!.github/workflows/format.yml` `:!.github/actions/fingerprints/**` `:!docker/**`
    - **Baseline ref: use `git merge-base linux-port <NEW_MASTER>` as the primary range start.** linux-port has its own history (forked from a master ancestor; subsequent diverged commits are NOT reachable from `6a28945d1`). A simple `6a28945d1..NEW_MASTER` range under-enumerates because it only excludes commits reachable from `6a28945d1` — but linux-port has commits that aren't on master, and master has commits not on linux-port that pre-date `6a28945d1`. The merge-base anchors at the actual divergence point.
    - `--diff-filter=ACMRD` for adds/copies/modifies/renames/deletes; `--reverse` for chronological replay.
    - **`--no-merges` is intentionally ADDED for Path C.** Earlier surgical draft dropped it because the squash collapsed all merges into one filtered commit; Path C preserves the merges in master's history (Wave 1 merge + 119 inherited from v8.1's 2nd-parent ancestry), so explicit exclusion is required to walk atomic commits only.
    - Expected count ~350-450 (Path C estimate; broader than surgical because v2.0.0-linux atomics are now in the walk). Document actual.

3. **Cherry-pick each candidate chronologically with `-x` for traceability.**
    - `git cherry-pick -x <sha>` per candidate. `-x` adds `(cherry picked from commit <sha>)` line — makes linux-port history navigable back to master.
    - **Note on `-x` chains:** picks taken from Wave 1's surgical replay already carry an `-x` line referencing the original Phase 32-35 SHA. When Wave 5 picks them onto linux-port, the new `-x` line references the master SHA (the cherry-replay), not the original Phase 32-35 SHA. That's fine — both SHAs remain traceable: linux-port → master via Wave 5's `-x`; master → original via Wave 1's `-x`.
    - On conflict — **linux-port HEAD wins (D-36-07 verbatim conflict policy):**
        - `git checkout --ours <files>` (during cherry-pick, "ours" = current branch = linux-port; "theirs" = the cherry being picked).
        - `git add <files>` then `git cherry-pick --continue`.
        - Append per-cherry block to `36-CHERRY-PICK-NOTES.md` (sha, subject, side picked, rationale).
    - On chain incompatibility (e.g. renderer-spine churn that doesn't apply to linux-port's lighter scope) — DROP:
        - `git cherry-pick --abort`
        - Append a per-drop block to `36-CHERRY-PICK-NOTES.md` (sha, subject, files affected, drop reason).
        - Continue with next candidate.
    - On `packages/vortex-api/lib/api.d.ts` conflict — discard, continue (Pitfall 10 / D-36-11):
        - `git checkout HEAD -- packages/vortex-api/lib/api.d.ts; git add packages/vortex-api/lib/api.d.ts; git cherry-pick --continue`.

4. **Post-cherry: discard api.d.ts regen if surfaced.**
    - `git status -sb | grep -q '^.M packages/vortex-api/lib/api.d.ts' && git checkout HEAD -- packages/vortex-api/lib/api.d.ts`

5. **Run post-cherry typecheck (conservative; per Phase 35 idiom).**
    - `pnpm run typecheck` exit 0. Discard api.d.ts again if needed.
    - This is a smoke check — full SYNC-35a..d gates ran on the rebased master in Wave 1 already. Linux-port post-cherry typecheck just confirms the port didn't snap.
    - Captures any conflict-resolution mistake (e.g. an `--ours` choice that broke a type) before the push.

6. **Verify pre-push state of linux-port.**
    - `PRE_LP=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/linux-port | cut -f1)`
    - Must equal `6a28945d153ee9a7ca604d5c673eb5bd61c33e13` — same value Wave 5 Task 1 baselined against.

7. **Push linux-port via plain FF push (no force needed).**
    - `git push git@github.com:atabisz/Vortex.git linux-port` — cherry-pick adds atop the baseline so this is FF.
    - Verify post-push: `git ls-remote ... refs/heads/linux-port` matches local HEAD.

8. **Append `## SYNC-36c — cherry-pick to linux-port` section to `36-DONE-GATE.md`.**

## Verification commands

```bash
# Task 1 — sync linux-port
git fetch fork --prune
git checkout linux-port
git reset --hard fork/linux-port
test "$(git rev-parse HEAD)" = "6a28945d153ee9a7ca604d5c673eb5bd61c33e13" \
  || echo "linux-port baseline drifted — re-baseline before continuing"

# Task 2 — enumerate candidates per D-36-07 path filter (merge-base anchored)
#         + Path C --no-merges (excludes Wave 1 merge commit + 119 v8.1 PR-merges)
NEW_MASTER=$(git rev-parse fork/master)
BASE=$(git merge-base linux-port "$NEW_MASTER")
echo "Merge-base linux-port vs fork/master: $BASE"
echo "Cherry-pick range: $BASE..$NEW_MASTER ($NEW_MASTER)"

# Sanity: confirm Wave 1 merge commit lives in the range and is a merge
MERGE_SHA=$(cat /tmp/phase36-merge-commit-sha 2>/dev/null \
  || git log master --merges --grep='merge v8.1/config-bucket' --format='%H' -1)
echo "Wave 1 merge SHA: $MERGE_SHA"
test -n "$MERGE_SHA" || { echo "FAIL: Wave 1 merge SHA not recoverable"; exit 1; }
git rev-list "$BASE..$NEW_MASTER" --merges | grep -qF "$MERGE_SHA" \
  || echo "WARN: Wave 1 merge not in range (may be pre-merge-base; sanity only)"

CANDIDATE_FILE=.planning/phases/36-land-tag-cherry-pick-v2-0-1/cherry-candidates.txt
git log --reverse --oneline \
  --no-merges \
  --diff-filter=ACMRD \
  "$BASE..$NEW_MASTER" \
  -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
  ':!.planning/**' \
  ':!.github/workflows/release-linux.yml' \
  ':!.github/workflows/format.yml' \
  ':!.github/actions/fingerprints/**' \
  ':!docker/**' \
  > "$CANDIDATE_FILE"
wc -l "$CANDIDATE_FILE"   # expect ~350-450 (Path C estimate); capture actual

# Sanity cross-reference: confirm Wave 1 merge is NOT in candidates (--no-merges should exclude)
if grep -q "$(echo "$MERGE_SHA" | cut -c1-12)" "$CANDIDATE_FILE"; then
  echo "FAIL: Wave 1 merge $MERGE_SHA leaked into candidates"
  exit 1
fi
echo "OK: Wave 1 merge excluded from candidates"

# Sanity: count of merge commits in the unfiltered range (informational)
MERGE_COUNT=$(git log --merges --oneline "$BASE..$NEW_MASTER" | wc -l)
echo "Merge commits in range (excluded by --no-merges): $MERGE_COUNT"
# Expect: Wave 1 merge (1) + 119 v8.1 PR-merges + any v2.0.0-linux merges since base
# = roughly 120-180 depending on linux-port baseline

# Optional sanity: the simpler `6a28945d1..$NEW_MASTER` form may produce a
# different count — useful as a cross-check, NOT the source of truth.
SIMPLE_COUNT=$(git log --oneline \
  --no-merges \
  --diff-filter=ACMRD \
  6a28945d153ee9a7ca604d5c673eb5bd61c33e13.."$NEW_MASTER" \
  -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
  ':!.planning/**' \
  ':!.github/workflows/release-linux.yml' \
  ':!.github/workflows/format.yml' \
  ':!.github/actions/fingerprints/**' \
  ':!docker/**' | wc -l)
echo "Simple-range cross-check (6a28945d1..$NEW_MASTER): $SIMPLE_COUNT (sanity only)"

# Task 3 — cherry-pick each, with -x. On conflict: resolve in-line and continue,
# OR halt for operator inspection. NEVER `break` mid-loop without surfacing.
NOTES=.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-CHERRY-PICK-NOTES.md
cat > "$NOTES" <<EOF
# Phase 36 Cherry-Pick Notes

**Range:** $BASE..$NEW_MASTER (merge-base anchored)
**Filter:** \`--no-merges\` (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9; excludes Wave 1 merge + 119 v8.1 PR-merges + any v2.0.0-linux merges)
**Wave 1 merge SHA (excluded):** $MERGE_SHA
**Total candidates after path-filter + --no-merges:** $(wc -l < "$CANDIDATE_FILE")
**Merge commits in range (excluded):** $MERGE_COUNT
**Started:** $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Per-cherry log

EOF

# Loop: per-commit cherry-pick with proper conflict halt.
# Default policy: linux-port HEAD wins (--ours) per D-36-07. api.d.ts → discard.
# Anything else → halt for operator decision; resume from the failing SHA forward.
for sha in $(awk '{print $1}' "$CANDIDATE_FILE"); do
  echo ">>> Cherry-picking $sha"
  if git cherry-pick -x "$sha"; then
    echo "OK: $sha" >> "$NOTES"
    continue
  fi

  echo "CONFLICT at $sha — attempting auto-resolution" >> "$NOTES"

  # Special case: api.d.ts → always discard (Pitfall 10 / D-36-11)
  if git status -sb | grep -q '^UU packages/vortex-api/lib/api.d.ts'; then
    git checkout HEAD -- packages/vortex-api/lib/api.d.ts
    git add packages/vortex-api/lib/api.d.ts
    echo "  - api.d.ts discarded" >> "$NOTES"
  fi

  # Default: take linux-port HEAD for any remaining unmerged paths (D-36-07).
  UNMERGED=$(git status --porcelain | awk '/^UU/ {print $2}')
  if [[ -n "$UNMERGED" ]]; then
    echo "$UNMERGED" | xargs -r git checkout --ours
    echo "$UNMERGED" | xargs -r git add
    echo "  - linux-port HEAD wins (--ours): $UNMERGED" >> "$NOTES"
  fi

  # Try to continue. If conflict-free now, cherry-pick advances; otherwise halt.
  if git cherry-pick --continue --no-edit; then
    echo "  - resolved and continued" >> "$NOTES"
    continue
  fi

  # Couldn't auto-resolve. Halt for operator: do NOT silently skip.
  # Operator decision tree:
  #   (a) inspect + manual edits + `git add -A && git cherry-pick --continue`,
  #       then re-invoke this loop starting from the NEXT sha after $sha
  #   (b) `git cherry-pick --abort` + record DROPPED in NOTES + re-invoke from
  #       the next sha
  echo "HALT at $sha — operator must resolve and resume from next sha" >> "$NOTES"
  echo "HALT at $sha — see $NOTES; resolve and re-run loop from next sha forward"
  exit 1
done

# Task 4 — post-cherry api.d.ts regen discard
git status -sb | grep -q '^.M packages/vortex-api/lib/api.d.ts' && \
  git checkout HEAD -- packages/vortex-api/lib/api.d.ts

# Task 5 — post-cherry typecheck
pnpm run typecheck 2>&1 | tee \
  .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-cherry-typecheck.txt
echo "post-cherry typecheck exit=$?" >> \
  .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-cherry-typecheck.txt
git checkout HEAD -- packages/vortex-api/lib/api.d.ts 2>/dev/null || true

# Task 6 — verify pre-push linux-port baseline
PRE_LP=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/linux-port | cut -f1)
echo "Pre-push fork/linux-port: $PRE_LP"
test "$PRE_LP" = "6a28945d153ee9a7ca604d5c673eb5bd61c33e13" \
  || echo "linux-port drifted on remote — investigate before push"

# Task 7 — FF push linux-port
git push git@github.com:atabisz/Vortex.git linux-port

# Verify post-push
POST_LP=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/linux-port | cut -f1)
test "$POST_LP" = "$(git rev-parse linux-port)" || { echo "Push didn't take"; exit 1; }
echo "linux-port advanced from 6a28945d1 → $POST_LP"
```

## Artifact emission

Two files staged on disk under `.planning/phases/36-land-tag-cherry-pick-v2-0-1/` (gitignored; Wave 6 commits via `git add -f`):

- `cherry-candidates.txt` — full enumerated list pre-cherry-pick (squash already filtered)
- `36-CHERRY-PICK-NOTES.md` — per-cherry log including drops, with shape:

```markdown
# Phase 36 Cherry-Pick Notes

**Range:** <BASE>..<NEW_MASTER>
**Filter:** `--no-merges` (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9)
**Wave 1 merge SHA excluded:** <MERGE_SHA>
**Total candidates after path-filter + --no-merges:** <N>
**Merge commits in range (excluded):** <M>
**Cherry-picked:** <N - drops>
**Dropped:** <drops count>
**Started:** <utc-iso>
**Completed:** <utc-iso>

## Drops

### Dropped: <sha> — <subject>

- **Reason:** <one-line>
- **Files affected:** <paths>
- **Conflict shape:** ours/theirs/manual
- **Recovery path:** if Linux-relevant, file follow-up issue #N

## Per-cherry log (cherry-picks with conflicts)

### <sha> — <subject>

- **Conflict files:** <paths>
- **Resolution:** linux-port HEAD wins (--ours) | api.d.ts discard | manual <reason>
```

Append to `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md`:

```markdown
## SYNC-36c — Cherry-pick to linux-port

- **Date:** <utc-iso>
- **Range:** <BASE>..<NEW_MASTER> (merge-base anchored)
- **Filter applied (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9):** `--no-merges` (excludes Wave 1 merge + 119 v8.1 PR-merges + any v2.0.0-linux merges)
- **Wave 1 merge SHA excluded:** <MERGE_SHA>
- **Candidates after path-filter + --no-merges:** <N>
- **Merge commits in range (excluded):** <M>
- **Cherry-picked:** <N - drops>
- **Dropped (documented):** <drops>
- **api.d.ts conflict discards:** <count>
- **Post-cherry typecheck:** exit 0
- **Pre-push fork/linux-port:** 6a28945d153ee9a7ca604d5c673eb5bd61c33e13 (verified)
- **Post-push fork/linux-port:** <new SHA>
- **Notes file:** `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-CHERRY-PICK-NOTES.md`
```

## Commits

**~350-450 commits in Wave 5** (Path C estimate — broader than the surgical-reshape estimate because Path C surfaces v2.0.0-linux atomic commits alongside Phase 32-35 atomics; actual count measured at execution time per Assumption A6). Each commit gets `-x` traceability. linux-port branch advances from `6a28945d1` to a new HEAD.

These commits ARE the SYNC-36c deliverable; they're not gitignored docs. The push in Task 7 publishes them.

## Risks / contingencies

- **R-36-07 — cherry-pick chain conflict pile-up.** D-36-07 conflict policy permits drops with documentation. If a chain fails repeatedly: `--abort`, document, skip-and-continue. Don't fight the conflict surface; linux-port is curated.
- **Wave 1 merge leaks into candidates despite `--no-merges`.** Should be impossible — a merge commit by definition has 2+ parents and `--no-merges` filters it out. Sanity check (grep for first 12 chars of `MERGE_SHA` in candidate file) catches this — abort enumeration and investigate before cherry-picking.
- **A v8.1 PR-merge leaks into candidates.** Same logic as above — `--no-merges` excludes by parent-count, not by message. If a candidate file entry's full SHA is a merge commit, `git cat-file -p <sha>` will show 2+ `parent` lines. Spot-check 5 random candidate SHAs as a sanity smoke; if any show 2 parents, escalate before proceeding.
- **Baseline ref ambiguity (W-1 resolved).** Merge-base is now the primary range start. The simpler `6a28945d1..NEW_MASTER` form is retained only as a sanity-check cross-reference. If the two counts diverge wildly, investigate before cherry-picking — it usually means linux-port has commits that aren't on master (expected) or master has pre-`6a28945d1` ancestor commits that the simple range omits (also expected).
- **Path-filter boundary edge cases.** A commit that touches both `src/` AND `.planning/` will land via the include-path; `.planning/` changes within that commit go along for the ride. The path filter is per-commit _inclusion_, not per-file _exclusion within a commit_. This matches v8.0's behavior; document if any noticeable `.planning/` content lands on linux-port (memory `feedback_planning_gitignored.md` says `.planning/` is gitignored, but if it's in a cherry-picked commit it WILL get committed). Operator may want to amend the cherry to drop the `.planning/` files post-pick — discretionary.
- **Path C surfaces v2.0.0-linux atomics that linux-port already has.** Should not happen — `merge-base(linux-port, master)` anchors at the v8.0 milestone close (`v2.0.0-linux-rebased`), so `BASE..NEW_MASTER` excludes commits already on linux-port. If duplicate-content cherries surface (`git cherry-pick` says "nothing to commit"), `git cherry-pick --skip` advances; record in notes as "no-op (already on linux-port)".
- **Cherry-pick loop halts (W-2 resolved).** The loop now `exit 1`s on unresolvable conflict instead of `break`. Operator inspects, resolves manually (`git add -A && git cherry-pick --continue`) OR aborts (`git cherry-pick --abort`), records the outcome in `36-CHERRY-PICK-NOTES.md`, then re-invokes the loop with the candidate file trimmed to start from the NEXT sha (e.g. `tail -n +<line>` or sed-edit `cherry-candidates.txt`). Resuming from mid-loop is explicit, not silent.
- **Post-cherry typecheck fails.** Investigate which file. Likely cause: a conflict resolution that took linux-port's older shape but the cherry's content depends on a newer master shape. Either re-resolve with `--theirs` for that specific cherry, or DROP the cherry and document. Don't push linux-port with broken typecheck.
- **Force needed on linux-port push.** Should not happen — cherry-picks are FF additive. If `git push` rejects with non-FF, someone pushed to linux-port mid-phase; rebase cherries onto the new fork/linux-port and retry.
- **Long execution time.** ~225-275 cherry-picks at ~5sec each plus conflict resolution = could be hours. This wave is the longest in the phase. Operator may want to checkpoint progress to disk between batches; if interrupted, `git cherry-pick --skip` or `git cherry-pick --continue` resumes.
- **Memory `feedback_minimize_upstream_diff.md` violation through cherry-pick noise.** Cherry-picks bring in commits with their full content; if a cherry contains formatter churn outside its scope, that's the cherry's problem — accept; the alternative is per-cherry surgical edits which defeats the cherry-pick approach. Document particularly noisy cherries in `36-CHERRY-PICK-NOTES.md` for retrospective.

## Done criteria

1. Local `linux-port` baselined at `6a28945d1`.
2. Cherry-pick candidates enumerated per D-36-07 path filter using `merge-base(linux-port, fork/master)..fork/master`, with all merge commits filtered out via `--no-merges` (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9); count documented.
3. Wave 1 merge SHA confirmed excluded from candidate file (sanity grep returns 0 hits).
4. All candidates cherry-picked OR dropped with documented reason. Loop exits cleanly (no silent break).
5. `36-CHERRY-PICK-NOTES.md` complete with all drops + conflict resolutions + merge-commits-in-range count + Path C metadata.
6. Post-cherry `pnpm run typecheck` exit 0.
7. `linux-port` pushed to fork via FF (plain push, no force).
8. Post-push `fork/linux-port` matches local HEAD.
9. `36-DONE-GATE.md` SYNC-36c section appended.
10. SYNC-36c closed; Wave 6 (done-gate) unblocked.
