---
phase: 36
wave: 6
plan_id: 36-06
title: "Wave 6 — phase done-gate (SYNC-36a/b/c/d evidence rollup)"
branch: master
requirement_ids:
    - SYNC-36a
    - SYNC-36b
    - SYNC-36c
    - SYNC-36d
dependencies:
    - 36-05 # cherry-pick complete; all SYNC-36* gates have evidence
estimated_commits: 1 # the closeout docs commit (force-add gitignored .planning/ paths)
---

# Wave 6 — Roll up SYNC-36a/b/c/d evidence into 36-DONE-GATE.md; commit Phase 36 docs

## Goal

Finalize `36-DONE-GATE.md` with the 7-criterion gate (mirrors Phase 35 D-35-10 shape); confirm all SYNC-36a/b/c/d evidence is captured; commit all Phase 36 planning artifacts (`36-DONE-GATE.md`, `36-REBASE-NOTES.md`, `36-CHERRY-PICK-NOTES.md`, `release-smoke/`, `artifacts/`, `cherry-candidates.txt`) via a single SSH-signed commit using `git add -f` (memory `feedback_planning_gitignored.md`); push the closeout commit to fork. Phase 36 is closed when this wave completes.

References: see `36-CONTEXT.md` D-36-09 / D-36-10 (SYNC-36e is Phase 37, not Phase 36); `36-RESEARCH.md` §4 Plan 36-06; `36-RESEARCH-FORWARD-SYNC.md` §8 (Path C plan re-shape); `36-RESEARCH-SURGICAL.md` (falsified — surgical squash strategy halted at Stage A5 base-mismatch; preserved for audit only); Phase 35 closeout shape — `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md` and `35-08-SUMMARY.md` are templates; memories `feedback_planning_gitignored.md`, `feedback_casual_voice.md`, `feedback_ssh_signing.md`, `project_v8_1_base_mismatch.md`.

## Tasks

1. **Confirm working-tree shape and all evidence files present.**
    - Branch: `master` (Wave 3 left us here; should still be there).
    - Files expected on disk under `.planning/phases/36-land-tag-cherry-pick-v2-0-1/`:
        - `36-CONTEXT.md`, `36-DISCUSSION-LOG.md`, `36-RESEARCH.md`, `36-RESEARCH-SURGICAL.md` (falsified; preserved for audit), `36-RESEARCH-FORWARD-SYNC.md` (load-bearing for Path C), `36-REBASE-NOTES.md` (rebase-merges + surgical halt logs preserved)
        - `36-00-WAVE-0-preflight.md`, `36-01-WAVE-1-merge-forward-sync.md` (Path C; supersedes `36-01-WAVE-1-rebase.md`), `36-02-WAVE-2-pr-close.md` (Path C; supersedes `36-02-WAVE-2-ff-land.md`), `36-03-WAVE-3-tag.md`, `36-04-WAVE-4-release-smoke.md`, `36-05-WAVE-5-cherry-pick.md`, `36-06-WAVE-6-done-gate.md`
        - `36-REBASE-NOTES.md` (Wave 0 seeded; Wave 1 appended Forward-sync merge log; Wave 2 appended PR-close log)
        - `36-CHERRY-PICK-NOTES.md` (Wave 5)
        - `36-DONE-GATE.md` (Wave 3 seeded; Wave 4 appended; Wave 6 finalizes)
        - `cherry-candidates.txt` (Wave 5)
        - `release-smoke/` directory with `release-info.json`, `assets.txt`, optional `*.sha256*` / `ci-shas.txt` / `local-shas.txt`
        - `artifacts/` directory with `post-merge-{typecheck,lint,test,build,build-extensions}.txt` and `post-cherry-typecheck.txt` and `main-yml-runs.json`
        - `36-01-WAVE-1-rebase.md` and `36-02-WAVE-2-ff-land.md`: superseded; either DELETE or rename with `.SUPERSEDED.md` suffix. Default: rename for audit trail.

2. **Cross-check all four SYNC requirements have evidence in `36-DONE-GATE.md`.**
    - SYNC-36a: Path C forward-sync 3-way merge + FF-push to fork/master + PR #5 close (sections appended by Waves 1 + 2 to `36-REBASE-NOTES.md`; summary in done-gate).
    - SYNC-36b: SSH-signed tag created and dual-pushed (Wave 3 seeded). Tag body references merge SHA + 1st parent `d494bcb7d` + 2nd parent `f1425a5c8` + `f25ff55da` (upstream `v2.0.1`, via 2nd-parent ancestry) + `e2127cecb..f1425a5c8` (Phase 32-35 atomic range) + `phase36/pre-surgical-snapshot`.
    - SYNC-36c: Cherry-pick to linux-port done with `--no-merges` filter excluding Wave 1 merge + 119 v8.1 PR-merges (Wave 5 appended).
    - SYNC-36d: release-linux.yml smoke green; AppImage + .deb SHA256s captured (Wave 4 appended).
    - If any section is missing, return to that wave to capture before proceeding.

3. **Finalize `36-DONE-GATE.md` with the 7-criterion gate (mirrors Phase 35 D-35-10).**
    - Add: header (date, phase, status), 4×SYNC sections (already present from Waves 3–5), summary table, 7-criterion gate, casual closeout note.
    - Casual voice (memory `feedback_casual_voice.md`).
    - 7 criteria (the gate that says "Phase 36 closed"):
        1. Path C forward-sync merge + pre-commit SYNC-35a..d gates green; merge commit SSH-signed with 2 parents ✅
        2. Merge commit FF-pushed to fork/master via lease pin; main.yml Windows + Linux green; PR #5 MERGED or CLOSED with redirect comment ✅
        3. `v2.0.1-linux-rebased` tag SSH-signed and pushed to fork (origin best-effort); body references merge SHA + parents + upstream anchor ✅
        4. `release-linux.yml` run conclusion=success; AppImage + .deb + SHA256s captured ✅
        5. linux-port cherry-pick complete (`--no-merges` excludes merge commit + v8.1 PR-merges); pushed; post-cherry typecheck exit 0 ✅
        6. All Phase 36 docs committed (`git add -f` for `.planning/` paths) ✅
        7. Done-gate review approved ✅

4. **Sanity-check live state matches done-gate claims.**
    - `git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master refs/heads/linux-port refs/tags/v2.0.1-linux-rebased refs/tags/phase36/pre-surgical-snapshot`
    - Match the post-FF SHAs from Wave 2 + Wave 5 done-gate sections; tag SHA = annotated tag object SHA; rollback safety tag = `f1425a5c8`.
    - If anything mismatches, fix the done-gate text or the underlying state before committing.

5. **Doc hygiene fix — CONTEXT.md line 112 SHA-label inversion.**
    - Wave 0 found `36-CONTEXT.md` line 112 had `fork/master` and `local master` SHAs swapped: it claimed `fork/master = d494bcb7d` and `LOCAL master ... at d717c09c3`, but live state was the inverse (`fork/master = d717c09c3`, `local master = d494bcb7d` at +5 ahead). Wave 0 disposition was "fix queued for Wave 6" — this is that fix.
    - Edit `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-CONTEXT.md` line 112 to read:
      `- \`fork/master\` = \`d717c09c38f04ccfd8084e61ae61cbce01162a1a\` (LOCAL master is +5 ahead, at \`d494bcb7d090bdf311f8e5b1cc7cfb418b009726\`)`
    - Pure documentation correction; no behavioural impact (Wave 1 Task 0 already executed against the correct live state per Wave 0 finding). Folds into the closeout commit in Task 7.

6. **Doc hygiene — CONTEXT.md strategy-deviation note (Path C forward-sync; RESEARCH-FORWARD-SYNC §8 — Wave 6).**
    - Add a `## Strategy Deviation — Wave 1 Path C Forward-Sync Merge` section to `36-CONTEXT.md` (append at end, before any trailing horizontal rule). Casual voice (memory `feedback_casual_voice.md`). Body:

        ```markdown
        ## Strategy Deviation — Wave 1 Path C Forward-Sync Merge

        Two prior strategies collapsed against a foundational v8.1 base mismatch
        (memory `project_v8_1_base_mismatch.md`): v8.1/config-bucket was branched
        from `d4c0d0da5` (1st parent of the upstream-v2.0.1 merge `aa3faf7e5`),
        a master point that PRE-DATES v8.0's v2.0.0-linux work. Master had absorbed
        ~300 v2.0.0-linux atomic commits since `d4c0d0da5`; v8.1 hadn't.

        1. **Attempt 1 — `git rebase --rebase-merges master`** halted at central
           upstream-merge `aa3faf7e5` with 403 conflicts: the merge's 1st parent
           (`d4c0d0da5`) is no longer the rebase base, so git 3-way-merges 8.7k
           upstream files against the wrong ancestor.

        2. **Attempt 2 — surgical squash + cherry-pick replay** (see falsified
           `36-RESEARCH-SURGICAL.md`) halted at Stage A5 with the same foundational
           mismatch surfaced from a different angle: master had 304 non-merge
           commits past merge-base, not the +5 docs-only assumed by the surgical
           plan.

        3. **Attempt 3 — Path C 3-way merge** (see load-bearing
           `36-RESEARCH-FORWARD-SYNC.md`): `git merge --no-ff v8.1/config-bucket`
           from master tip. Empirical dry-run produced **12 conflict files, 2 real
           code conflicts**. ~2 hours focused work. **ADOPTED.**

        D-36-01 substitution: "FF-merge" → "merge --no-ff to land". Operator-accepted
        the wording substitution (AskUserQuestion 2026-05-23). The resulting tree is
        byte-equivalent to what FF would have produced post-divergence-resolution;
        Phase 35 atomic SHAs `e2127cecb..f1425a5c8` survive in the 2nd-parent
        ancestry of the merge commit.

        Downstream waves accommodate:

        - Wave 3 tag body references merge SHA + 1st parent (`d494bcb7d`) + 2nd parent
          (`f1425a5c8`) + upstream anchor (`f25ff55da` reachable via 2nd-parent
          ancestry through `aa3faf7e5`) + Phase 32-35 atomic range
          (`e2127cecb..f1425a5c8`) + rollback tag (`phase36/pre-surgical-snapshot`).
        - Wave 5 cherry-pick uses `--no-merges` to exclude the Wave 1 merge commit
          AND the 119 v8.1 PR-merges in the 2nd-parent ancestry; estimate ~350-450
          candidates (broader than surgical because Path C surfaces v2.0.0-linux
          atomics alongside Phase 32-35 atomics, both excluded from linux-port via
          the `merge-base(linux-port, master)` baseline).

        Rollback targets if anything goes south:

        - `phase36/pre-surgical-snapshot` (= `f1425a5c8`) — local tag from prior attempt.
        - `phase36/master-pre-merge` (= `d494bcb7d`) — local tag from Wave 1 Stage 0.

        Both `36-RESEARCH-SURGICAL.md` (falsified, Stage A5 halt) and the original
        `--rebase-merges` halt log in `36-REBASE-NOTES.md` are preserved verbatim
        for the v8.1 playbook (Phase 37 SYNC-37b will codify the Path C pattern as
        a reusable response to the "branch base predates downstream work" anti-pattern).
        ```

    - Folds into the closeout commit in Task 7. Pure documentation; no behavioural impact.

7. **Stage and commit all Phase 36 docs in a single SSH-signed commit.**
    - Use `git add -f` because `.planning/` is gitignored (memory `feedback_planning_gitignored.md`).
    - Commit message (casual voice): `docs(36): close phase 36 — v2.0.1-linux-rebased landed`. Body references the four SYNC IDs, the surgical strategy deviation, and the done-gate path.
    - Commit auto-signed via existing SSH config (Wave 0 verified).

8. **Push the closeout commit to fork/master via plain FF push.**
    - `git push git@github.com:atabisz/Vortex.git master` — FF push (no force; closeout commit sits atop the rebased landing).
    - Verify post-push: `git ls-remote ... refs/heads/master` matches local HEAD.

9. **Final ROADMAP / STATE update note (optional but useful).**
    - If `.planning/STATE.md` is updated for phase progression elsewhere in the repo, append a Phase 36 close marker. If STATE.md updates are owned by a different command (e.g. `/gsd:end-phase`), skip — leave for that flow. Document the choice in the done-gate.

## Verification commands

```bash
# Task 1 — confirm working-tree shape and files present
git branch --show-current                                            # expect: master
git status --porcelain | head -40                                     # expect: only Phase 36 doc additions

ls -la .planning/phases/36-land-tag-cherry-pick-v2-0-1/
# Expected files present:
#   36-CONTEXT.md, 36-DISCUSSION-LOG.md, 36-RESEARCH.md, 36-RESEARCH-SURGICAL.md
#   36-00…36-06-WAVE-*.md
#   36-REBASE-NOTES.md, 36-CHERRY-PICK-NOTES.md, 36-DONE-GATE.md
#   cherry-candidates.txt
#   release-smoke/  (release-info.json, assets.txt, *.sha256* | ci-shas.txt | local-shas.txt)
#   artifacts/      (post-rebase-*.txt, post-cherry-typecheck.txt)

# Task 2 — cross-check SYNC sections in done-gate
grep -E '^## SYNC-36[abcd] ' .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md \
  | sort -u
# Expect 4 lines: SYNC-36a, SYNC-36b, SYNC-36c, SYNC-36d

# Task 3 — finalize 36-DONE-GATE.md (manual edit; shape below in artifact emission)

# Task 4 — sanity-check live state
git ls-remote git@github.com:atabisz/Vortex.git \
  refs/heads/master refs/heads/linux-port \
  refs/tags/v2.0.1-linux-rebased \
  'refs/tags/phase36/pre-surgical-snapshot'
# Compare against done-gate SHAs.

git tag -v v2.0.1-linux-rebased                                       # exit 0; verifies tag still signed correctly

# Tasks 5+6 — CONTEXT.md edits (line 112 inversion fix + surgical deviation note)
# Both are manual edits; bodies in the Tasks above.

# Task 7 — stage and commit Phase 36 docs
git add -f .planning/phases/36-land-tag-cherry-pick-v2-0-1/

git commit -m "$(cat <<'EOF'
docs(36): close phase 36 — v2.0.1-linux-rebased landed

Phase 36 close: Path C 3-way merge of v8.1/config-bucket onto master at the post-
merge HEAD (1st parent d494bcb7d = master tip; 2nd parent f1425a5c8 = v8.1/config-
bucket / Phase 35 close). v8.1 base mismatch (memory project_v8_1_base_mismatch.md)
made literal FF unreachable; --rebase-merges halted at 403 conflicts, surgical
squash halted at Stage A5; Path C forward-sync produced 12 conflict files / 2 real
code conflicts. Operator-accepted D-36-01 substitution: "FF-merge" → "merge --no-ff
to land". FF-pushed the merge commit to fork/master via lease pin; main.yml
Windows + Linux green. Stamped SSH-signed v2.0.1-linux-rebased on the merge HEAD;
release-linux.yml produced AppImage + .deb. Cherry-picked the path-filtered Linux
subset (--no-merges excludes Wave 1 merge + 119 v8.1 PR-merges) onto linux-port.

Closes:
  SYNC-36a — Path C forward-sync merge + FF-push to fork/master + PR #5 close
  SYNC-36b — SSH-signed canonical tag, dual-pushed
  SYNC-36c — cherry-pick to linux-port (--no-merges, both parent ancestries)
  SYNC-36d — release-linux.yml smoke green

Strategy deviation: 36-RESEARCH-FORWARD-SYNC.md (load-bearing). Prior attempts:
36-REBASE-NOTES.md (--rebase-merges 403-conflict halt), 36-RESEARCH-SURGICAL.md
(falsified — surgical squash Stage A5 base-mismatch halt). Both preserved for the
v8.1 playbook (Phase 37 SYNC-37b).

Done-gate: .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md

Phase 37 picks up local-boot UAT (SYNC-37a) and playbook post-mortem (SYNC-37b).
EOF
)"

# Verify signature on the closeout commit
git log -1 --show-signature

# Task 8 — push closeout commit
PRE_M=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
echo "Pre-push fork/master: $PRE_M"
# Should match the post-FF master HEAD captured in Wave 2 done-gate

git push git@github.com:atabisz/Vortex.git master

POST_M=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$POST_M" = "$(git rev-parse master)" || { echo "Push didn't take"; exit 1; }
echo "Phase 36 closeout commit pushed: $POST_M"
```

## Artifact emission

Final shape of `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md`:

```markdown
# Phase 36 Done Gate — v2.0.1-linux-rebased landed

**Status:** GREEN (7/7)
**Closed:** <utc-iso>

## Summary

Phase 36 landed the v8.1/config-bucket branch onto fork/master via a **Path C
forward-sync 3-way merge** (per `36-RESEARCH-FORWARD-SYNC.md`). v8.1's base
mismatch (memory `project_v8_1_base_mismatch.md`: branch base `d4c0d0da5`
predates v8.0's v2.0.0-linux work on master) made literal FF unreachable.
Two prior attempts collapsed: `--rebase-merges` halted at central upstream-
merge `aa3faf7e5` with 403 conflicts; the surgical squash strategy halted at
Stage A5 with the same foundational mismatch surfaced from a different angle.
The Path C 3-way merge produced 12 conflict files / 2 real code conflicts;
operator-accepted the D-36-01 substitution "FF-merge" → "merge --no-ff to
land" (AskUserQuestion 2026-05-23). The merge commit's 1st parent is
`d494bcb7d` (master tip); 2nd parent is `f1425a5c8` (v8.1/config-bucket tip).
Phase 32-35 atomic SHAs `e2127cecb..f1425a5c8` survive in the 2nd-parent
ancestry. Original 656-commit v8.1/config-bucket history preserved at the
safety tag `phase36/pre-surgical-snapshot` (= `f1425a5c8`).

FF-pushed the merge commit to fork/master via lease pin; main.yml Windows +
Linux green; PR #5 closed with redirect comment. Stamped SSH-signed
`v2.0.1-linux-rebased` on the merge HEAD, dual-pushed the tag (fork triggers
release-linux.yml; origin informational), captured AppImage + .deb + SHA256
evidence, and cherry-picked the path-filtered Linux subset (`--no-merges`
excludes the Wave 1 merge + 119 v8.1 PR-merges) onto linux-port.

The major behavioural delta from v8.0 was the landing path: ROADMAP criterion
#1 wording was "fast-forward merged" verbatim, but v8.1's base mismatch made
that unreachable; Path C is the cleanest path that preserves the Phase 35
evidence chain in addressable form.

## SYNC-36a — Path C forward-sync merge + PR #5 close

(Filled by Waves 1 + 2; see `36-REBASE-NOTES.md` for per-conflict detail.)

- Path C 3-way merge (replaces `--rebase-merges` and surgical squash):
    - Merge commit: `<MERGE_SHA>` (1st parent `d494bcb7d` = master tip;
      2nd parent `f1425a5c8` = v8.1/config-bucket / Phase 35 close)
    - Conflicts: 12 files (2 real code, 1 test, 9 docs); resolved per
      `36-REBASE-NOTES.md` table
    - Bluebird scan: 1 file (`gamebryo-plugin-management/src/index.ts`); resolution
      HEAD-wins, no `:Promise<T>` introduced
    - api.d.ts discards: `<Y>` (D-36-11)
- Pre-commit SYNC-35a..d gates: typecheck/lint:ci/test/build/build:extensions
  all exit 0; bundledPlugins floor: `<N>` ≥ 130 ✅
- Snapshot tags: `phase36/master-pre-merge` = `d494bcb7d` (Wave 1 Stage 0);
  `phase36/pre-surgical-snapshot` = `f1425a5c8` (carry-forward from prior
  attempt) ✅
- FF push: lease-pinned `fork/master = d494bcb7d` → `<MERGE_SHA>` ✅
- main.yml Windows + Linux: both `conclusion=success` on `<MERGE_SHA>` ✅
- PR #5: state MERGED (auto) | CLOSED with redirect comment referencing
  merge SHA + Phase 35 evidence pointer (`<MERGE_SHA>^2 = f1425a5c8`) +
  rollback tag.

## SYNC-36b — SSH-signed canonical tag

(Filled by Wave 3.)

- Tag: `v2.0.1-linux-rebased` (annotated, SSH-signed via `~/.ssh/id_ed25519`)
- Target commit: `<NEW_MASTER>` (= Wave 1 merge commit SHA)
- Body anchors: merge SHA `<MERGE_SHA>`, 1st parent `d494bcb7d` (master tip),
  2nd parent `f1425a5c8` (v8.1/config-bucket tip), upstream `f25ff55da`
  (== `v2.0.1`, via 2nd-parent ancestry through `aa3faf7e5`), Phase 32-35
  atomic range `e2127cecb..f1425a5c8`, rollback tag `phase36/pre-surgical-snapshot`
- `git tag -v` exit 0 ✅
- Push to fork: OK ✅
- Push to origin (Nexus-Mods/Vortex): OK | REJECTED — non-blocking per
  `project_upstream_pr_policy.md`

## SYNC-36c — Cherry-pick to linux-port

(Filled by Wave 5; see `36-CHERRY-PICK-NOTES.md` for per-cherry detail.)

- Range: `<merge-base>..<NEW_MASTER>`
- Filter applied (Path C — RESEARCH-FORWARD-SYNC §4 Stage 9): `--no-merges`
  (excludes Wave 1 merge commit + 119 v8.1 PR-merges + any v2.0.0-linux merges)
- Wave 1 merge SHA excluded: `<MERGE_SHA>`
- Candidates after path-filter + `--no-merges`: `<N>` (Path C estimate ~350-450,
  broader than surgical because both parent ancestries surface)
- Cherry-picked: `<M>`; dropped: `<K>`
- Post-cherry typecheck: exit 0 ✅
- linux-port advanced: `6a28945d1` → `<NEW_LP>`
- Pushed to fork via FF (plain push, no force).

## SYNC-36d — release-linux.yml smoke

(Filled by Wave 4.)

- Run URL: https://github.com/atabisz/Vortex/actions/runs/<RUN_ID>
- Conclusion: success (<duration>)
- Release page: https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased
- Assets: AppImage (<sha256>), .deb (<sha256>) — SHA source: <manifest|ci-log|local-hash>

## State table

| Ref                               | Pre-Phase-36 | Post-Phase-36                                                                     |
| --------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| local v8.1/config-bucket          | f1425a5c8    | f1425a5c8 (unchanged; preserved as 2nd-parent ancestor of merge)                  |
| local v8.1/config-bucket-fwd      | (none)       | <MERGE_SHA> (Wave 1 working branch; can prune)                                    |
| fork/master                       | d494bcb7d    | <MERGE_SHA> + closeout commit atop                                                |
| fork/sync/upstream-v2.0.1         | 8054a935b    | 8054a935b (unchanged; reachable via merge 2nd-parent ancestry; default: retained) |
| fork/linux-port                   | 6a28945d1    | <NEW_LP> (cherry-picked; --no-merges filter)                                      |
| tag v2.0.1-linux-rebased          | (none)       | annotated SSH-signed @ <MERGE_SHA>                                                |
| tag phase36/master-pre-merge      | (none)       | d494bcb7d (Wave 1 Stage 0 rollback safety; local)                                 |
| tag phase36/pre-surgical-snapshot | (none)       | f1425a5c8 (rollback safety from prior surgical attempt; local)                    |

## 7-criterion gate

| #   | Criterion                                                                                                                         | Status | Evidence                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | Path C forward-sync merge + pre-commit SYNC-35a..d gates green; merge commit SSH-signed with 2 parents                            | ✅     | `36-REBASE-NOTES.md` Forward-sync section + `artifacts/post-merge-*.txt`                          |
| 2   | Merge commit FF-pushed to fork/master via lease pin; main.yml Windows + Linux green; PR #5 MERGED or CLOSED with redirect comment | ✅     | `gh pr view 5 --json state` + `artifacts/main-yml-runs.json` + post-push fork/master == merge SHA |
| 3   | `v2.0.1-linux-rebased` SSH-signed; pushed to fork (origin best-effort); body references merge SHA + parents + upstream anchor     | ✅     | `git tag -v` + Wave 3 push receipts                                                               |
| 4   | release-linux.yml green; AppImage + .deb + SHA256s captured                                                                       | ✅     | Run URL + `release-smoke/`                                                                        |
| 5   | linux-port cherry-pick (`--no-merges` filter; both parent ancestries) + push; post-cherry typecheck green                         | ✅     | `36-CHERRY-PICK-NOTES.md` + `artifacts/post-cherry-typecheck.txt`                                 |
| 6   | All Phase 36 docs committed (`git add -f`) including CONTEXT.md inversion fix + Path C deviation note                             | ✅     | this commit                                                                                       |
| 7   | Done-gate review approved                                                                                                         | ✅     | <reviewer + utc-iso>                                                                              |

## Carry-forward to Phase 37

- **SYNC-37a** — local-boot AppImage + .deb verification + 4-screenshot Skyrim
  walkthrough (D-36-09 explicit deferral).
- **SYNC-37b** — `VORTEX-LINUX-MERGE-PLAYBOOK.md` post-mortem update with v8.1
  deltas (D-36-10) — should now include the surgical-reshape pattern as a
  reusable playbook for future 403-conflict central-merge walls.

Phase 36 closed.
```

## Commits

**1 commit in Wave 6** — the closeout commit. SSH-signed, casual-voice message, force-adds all gitignored Phase 36 doc paths under `.planning/phases/36-land-tag-cherry-pick-v2-0-1/`. Pushed to `fork/master` via plain FF push.

## Risks / contingencies

- **A SYNC section is missing or thin in the done-gate.** Return to the originating wave (1/2/3/4/5), capture the missing evidence, then resume Wave 6. Don't fudge — the done-gate is the audit trail.
- **Live state mismatches done-gate claims.** Could indicate someone pushed mid-phase (e.g. master advanced after Wave 2). Re-pull, update the done-gate state table to reflect the actual post-pull HEAD, document the divergence, and decide whether the phase still closes (typically yes — Phase 36 owns these refs through closeout; no one else should be touching them).
- **`git tag -v` fails on closeout.** Tag corruption is rare; if it surfaces, the tag SHA in the done-gate would mismatch. Re-create the tag (delete on fork, re-tag, re-push) — but only if there's a credible explanation; otherwise escalate.
- **Closeout commit isn't SSH-signed.** Wave 0 verified config; if the commit lands unsigned, check `git config commit.gpgsign`. The default in this project should be `true`; if it's not, set it and amend the commit.
- **`.planning/` files commit but the gitignore regrets it later.** That's the expected pattern — `git add -f` makes the file tracked despite gitignore. Once tracked, future edits commit normally. Memory `feedback_planning_gitignored.md` documents this exactly.
- **Push to fork/master rejected (non-FF).** Should not happen — closeout commit is FF atop the post-FF rebased landing. If rejected with non-FF, master moved between Wave 5 and Wave 6 (concurrent activity); pull --ff-only, re-push.
- **Push to fork/master rejected (branch protection).** Wave 0 Task 7 probed this; should be UNBLOCKED. If it surfaces here despite the probe, branch-protection settings changed mid-phase. Verify with `gh api /repos/atabisz/Vortex/branches/master/protection`; if newly protected, escalate (same disposition tree as Wave 0 Task 7 — temp-disable enforce_admins, or re-plan closeout via PR). Phase 35 precedent (`f1425a5c8` landed via direct push) is the empirical baseline.
- **STATE.md / ROADMAP.md update collisions with another command.** If Task 9 update is owned by `/gsd:end-phase` or similar, skip the STATE.md edit; just close Phase 36 here and let the next command handle progression.
- **CONTEXT.md surgical-deviation section conflicts with concurrent edits.** Unlikely (Phase 36 owns this file); if surfaced, rebase the edit and re-apply. The section is append-only, so merge surface is minimal.

## Done criteria

1. All 4 SYNC-36\* sections present in `36-DONE-GATE.md` with evidence.
2. 7-criterion gate table marked all GREEN.
3. State table accurate vs live `git ls-remote` (including `phase36/pre-surgical-snapshot` rollback tag).
4. CONTEXT.md line 112 SHA-label inversion corrected.
5. CONTEXT.md surgical-strategy deviation note appended (RESEARCH-SURGICAL §8).
6. Closeout commit SSH-signed, casual voice, `git add -f` for all Phase 36 docs (including `36-RESEARCH-SURGICAL.md`).
7. Closeout commit pushed to `fork/master` via FF push (no force).
8. Phase 36 closed; Phase 37 (SYNC-37a UAT + SYNC-37b playbook — including surgical-reshape pattern) unblocked.
