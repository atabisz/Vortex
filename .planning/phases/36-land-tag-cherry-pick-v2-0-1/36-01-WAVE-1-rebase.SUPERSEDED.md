---
phase: 36
wave: 1
plan_id: 36-01
title: "Wave 1 — surgical re-shape: squash upstream v2.0.1 + linear replay of Phase 32-35 (393 commits)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-36a
dependencies:
    - 36-00 # pre-flight verified
estimated_commits: 394 # 1 squash commit (replaces aa3faf7e5 + 262 upstream-PR merges) + 393 cherry-pick replays of aa3faf7e5..f1425a5c8 (new SHAs, original authors+dates+messages preserved via -x). Counted as "new commits on the branch since master" — content equivalent to original v8.1/config-bucket tip modulo the squash boundary, but SHAs are all new.
---

# Wave 1 — Surgical re-shape: squash upstream v2.0.1 + linear cherry-pick replay of Phase 32-35 (393 commits) onto master, run SYNC-35a..d gates, force-push lease-pinned

## Goal

**Strategy change.** The original `git rebase --rebase-merges master` approach halted at the central upstream-merge `aa3faf7e5` with 403 conflicts: its 1st parent `d4c0d0da5` is no longer the rebase base, so git 3-way-merges 8.7k upstream files against the wrong ancestor. `--rebase-merges` is irreplayable for this topology.

Replace with a deterministic 6-stage **surgical re-shape**:

1. Stage A — pre-flight: re-verify live SHAs, abort any in-progress rebase, snapshot the original v8.1/config-bucket tip as `phase36/pre-surgical-snapshot` (= `f1425a5c8`) for rollback safety.
2. Stage B — branch: create a working branch `v8.1/config-bucket-surgical` from current `master` HEAD (`d494bcb7d`).
3. Stage C — squash: `git read-tree --reset -u f25ff55da` materialises upstream v2.0.1's tree atop master, committed as ONE traceable commit referencing `f25ff55da` (== upstream tag `v2.0.1`) and the original `aa3faf7e5` it replaces. Casual-voice body per RESEARCH-SURGICAL §5.
4. Stage D — cherry-pick chain: 393 picks of `aa3faf7e5..f1425a5c8` chronologically, `-x` for traceability + `-S` for SSH signing. Per-pick conflict playbook: api.d.ts → discard (D-36-11); bluebird scan → strip `:Promise<T>` annotations on async fns; default `--theirs` (the cherry IS the fork-side authority during cherry-pick semantics, inverted from rebase). Halt on judgement-needed conflicts; document in `36-REBASE-NOTES.md`; request operator help.
5. Stage E — verify: SYNC-35a..d gates (typecheck/lint:ci/test/build), bundledPlugins floor ≥130, FF-ancestry check (`git merge-base --is-ancestor master HEAD` exit 0), tip-tree parity vs `phase36/pre-surgical-snapshot`, all 16 done criteria from RESEARCH-SURGICAL §7.
6. Stage F — promote and force-push: move `v8.1/config-bucket` to the surgical tip; force-push lease-pinned to `fork/sync/upstream-v2.0.1` (lease pin = `8054a935b6aad505798bba8a993d002718d119cb` per Wave 0); push the safety tag; wait for Windows CI green; verify PR #5 mergeable=MERGEABLE.

**Why this works.** The post-`aa3faf7e5` chain is **already linear** — 393 first-parent commits == 393 total non-merges (verified live 2026-05-23). Phase 32-35 atomic resolution work survives intact, each pick re-applied via `-x` so original SHA + author + date are preserved in the commit body. Only the central merge `aa3faf7e5` collapses into one squash commit referencing `f25ff55da`/`v2.0.1`. Master becomes a strict ancestor by construction → FF-mergeable.

D-36-03 push of local master was completed in Wave 0 / pre-surgical Task 0 (live `fork/master = d494bcb7d` confirmed in RESEARCH-SURGICAL §1). This wave assumes that push has landed; Stage A re-verifies.

References: see `36-RESEARCH-SURGICAL.md` (load-bearing — §2 ops sequence, §3 verification gates, §4 conflict playbook, §5 squash message, §6 risks, §7 done criteria, §8 downstream impacts); `36-CONTEXT.md` D-36-01 / D-36-02 / D-36-11; `36-RESEARCH.md` (operational invariants); `36-REBASE-NOTES.md` Wave 1 halt log (the 403-conflict event that motivated this strategy); memories `feedback_bluebird_promise_trap.md`, `feedback_minimize_upstream_diff.md`, `feedback_git_push_ssh.md`, `feedback_ssh_signing.md`, `feedback_casual_voice.md`.

## Tasks

### Stage A — Pre-flight & abort the failed rebase

1. **Abort any in-progress rebase, confirm clean tree, snapshot v8.1 tip, re-verify live state.**
    - Abort defensively: `git rebase --abort 2>/dev/null || true`
    - `git status --porcelain` MUST be empty.
    - `git checkout v8.1/config-bucket`; verify `git rev-parse HEAD == f1425a5c8`.
    - Snapshot rollback target: `git tag -f phase36/pre-surgical-snapshot f1425a5c8` (local; pushed in Stage F).
    - Re-confirm fork/master == local master: `git fetch fork --prune; test "$(git rev-parse master)" = "$(git rev-parse fork/master)"`. If drift: abort, investigate.
    - Re-confirm master `+5` are docs-only: `git log v8.1/config-bucket..master --name-only --format= | sort -u | grep -v '^$' | grep -v '^\.planning/'` MUST be empty.
    - Re-confirm tag `v2.0.1` resolves to `f25ff55da`: `git rev-parse v2.0.1^{commit} == f25ff55dae8a79847460fac153af874f20095aec`.

### Stage B — Create the surgical branch from master

2. **Create `v8.1/config-bucket-surgical` from master HEAD.**
    - `git checkout -b v8.1/config-bucket-surgical master`
    - Verify `git rev-parse HEAD == d494bcb7d` (current master).
    - `git status --porcelain` empty.

### Stage C — Apply upstream v2.0.1 as a single squash commit

3. **Materialise upstream v2.0.1's tree via `read-tree --reset -u`, sweep api.d.ts, commit SSH-signed.**
    - `git read-tree --reset -u f25ff55da` — atomically replaces index + working tree from `f25ff55da`'s tree, leaves HEAD at master. Cleanest primitive for the op.
    - Sanity: `git diff --cached --stat HEAD | tail -3` shows ~2350 files changed (large diff).
    - Discard `packages/vortex-api/lib/api.d.ts` if dirty (D-36-11; pre-emptive even though it shouldn't surface here):
        ```bash
        for f in $(git diff --cached --name-only | grep -E 'packages/vortex-api/lib/api\.d\.ts$'); do
          git checkout HEAD -- "$f" 2>/dev/null || true
          git reset HEAD -- "$f" 2>/dev/null || true
        done
        ```
    - Commit SSH-signed with the casual-voice message body from RESEARCH-SURGICAL §5 (verbatim — references `f25ff55da`, `v2.0.1` tag, `aa3faf7e5`, `phase36/pre-surgical-snapshot = f1425a5c8`):

        ```bash
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
        ```

    - Capture squash SHA: `git rev-parse HEAD > /tmp/phase36-squash-sha; echo "Squash commit: $(cat /tmp/phase36-squash-sha)"`.
    - Verify signature: `git log -1 --show-signature HEAD` shows "Good signature" with SSH key.

### Stage D — Cherry-pick the Phase 32-35 atomic chain

4. **Generate the cherry-pick list and replay 393 commits with `-x -S`.**
    - Generate chronological list: `git rev-list --reverse --no-merges aa3faf7e5..f1425a5c8 > /tmp/phase36-cherry-list`
    - Verify count: `wc -l /tmp/phase36-cherry-list` MUST be `393`.
    - Sanity (chain linearity): `wc -l < /tmp/phase36-cherry-list` MUST equal `git rev-list --reverse --first-parent --no-merges aa3faf7e5..f1425a5c8 | wc -l`.
    - Replay: `xargs -a /tmp/phase36-cherry-list git cherry-pick -x -S`
    - On halt, apply per-conflict playbook (Task 5), then `git cherry-pick --continue`.
    - When chain finishes: `git rev-parse HEAD > /tmp/phase36-surgical-tip`.

5. **Per-conflict resolution playbook (RESEARCH-SURGICAL §4 verbatim).**
    - Inspect the failing pick:
        ```bash
        git status                                          # list conflicted files
        git log -1 --format='%H %s' CHERRY_PICK_HEAD        # which Phase 32-35 commit halted
        ```
    - **Step 2a — api.d.ts always-discard (D-36-11):**
        ```bash
        for f in $(git diff --name-only --diff-filter=U | grep 'packages/vortex-api/lib/api\.d\.ts$'); do
          git checkout HEAD -- "$f"; git add "$f"
        done
        ```
    - **Step 2b — bluebird `:Promise<T>` scan (memory `feedback_bluebird_promise_trap.md`):**
        ```bash
        for f in $(git diff --name-only --diff-filter=U); do
          if grep -q 'import Promise from "bluebird"' "$f" 2>/dev/null \
             && grep -qE 'async\s+\w+.*:\s*Promise<' "$f"; then
            echo "BLUEBIRD-TRAP: $f — review manually, strip :Promise<T> from async fns"
          fi
        done
        ```
        For each flagged file: drop the `:Promise<T>` annotation on async fns (TS infers from `async`); take fork-side default for the rest of the hunk.
    - **Step 2c — fork-side default for the remainder.** During cherry-pick, "theirs" = the commit being picked = Phase 32-35 work, which IS the fork-side authority (inverted vs rebase semantics — important):
        ```bash
        for f in $(git diff --name-only --diff-filter=U); do
          git checkout --theirs -- "$f"; git add "$f"
        done
        ```
    - **Step 3 — verify no markers:** `git diff --cached --check` exit 0.
    - **Step 4 — continue:** `git cherry-pick --continue`.
    - **Empty-pick (skip + document):** if a Phase 32-35 commit's content is already in the squashed base, git reports empty:
        ```bash
        git cherry-pick --skip
        echo "$(date -Iseconds) SKIP <sha> empty-pick" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md
        ```
    - **Halted-mid-chain irrecoverable:** `git cherry-pick --abort`. Branch is at last-good-pick state. Safety tag `phase36/pre-surgical-snapshot` is the rollback target. Re-plan from next-pick-onward.
    - **Sub-bucket heuristic — 5 known bluebird-trap files in `extensions/gamebryo-{plugin,savegame}-management/`** (RESEARCH-SURGICAL §4 sub-bucket table). For all 5: fork-side default already does the right thing — no special handling beyond the standard playbook. Files:
        - `extensions/gamebryo-plugin-management/src/index.ts`
        - `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts`
        - `extensions/gamebryo-plugin-management/src/util/gameSupport.ts`
        - `extensions/gamebryo-plugin-management/src/views/PluginList.tsx`
        - `extensions/gamebryo-savegame-management/src/index.ts`
    - **Append per-conflict block to `36-REBASE-NOTES.md`** (file, side picked, bluebird-scan result, one-line rationale).
    - **Operator-judgement halt:** if a conflict requires judgement (not auto-resolvable by the playbook), halt the chain, document the SHA + conflict shape in `36-REBASE-NOTES.md`, surface for operator decision. Do not silently `--theirs` past judgement-needed conflicts.

### Stage E — Verify FF-mergeable shape

6. **FF-ancestry, tip-tree parity, commit count, signature audit.**
    - FF-ancestry: `git merge-base --is-ancestor master HEAD` exit 0 (mandatory).
    - Tip-tree parity (code paths): `git diff --name-only phase36/pre-surgical-snapshot HEAD | grep -v '^\.planning/' | grep -v '^$'` MUST be empty (acceptable: only `.planning/` drift). If code-path diff: investigate, re-pick missed commits, or apply diff as final reconciliation commit.
    - Commit count: `git log --oneline master..HEAD | wc -l` ≈ 394 (1 squash + 393 picks; minus skipped empty-picks).
    - api.d.ts not dirty: `git status --porcelain | grep -E 'packages/vortex-api/lib/api\.d\.ts'` empty.
    - All commits SSH-signed: `git log master..HEAD --format='%H %G?' | awk '$2 != "G"' | head` MUST be empty.

7. **Run SYNC-35a..d gates (replaces v8.0 grep-checkpoint.sh — no v8.1 milestone harness).**
    - `pnpm install --frozen-lockfile`
    - `pnpm run typecheck` exit 0 → SYNC-35a; discard api.d.ts after if dirty.
    - `pnpm run lint:ci` exit 0 → SYNC-35b.
    - `pnpm test` exit 0 → SYNC-35c.
    - `pnpm build` exit 0 → SYNC-35d (run `pnpm build:extensions` exit 0 too).
    - bundledPlugins floor: `ls bundledPlugins | wc -l` ≥ 130 (D-35-08 carry-forward).
    - api.d.ts not tracked dirty after gates: `git status --porcelain | grep -E 'packages/vortex-api/lib/api\.d\.ts'` empty.
    - Capture each command's exit code into `36-REBASE-NOTES.md` under a `## Post-surgical SYNC-35a..d gates` section.

### Stage F — Promote and force-push (lease-pinned)

8. **Move `v8.1/config-bucket` to surgical tip; verify lease pin; force-push.**
    - Promote (delete-then-rename, or use `git update-ref` — either path works; preserves reflog):
        ```bash
        git branch -f v8.1/config-bucket v8.1/config-bucket-surgical
        git checkout v8.1/config-bucket
        git rev-parse HEAD > /tmp/phase36-surgical-tip
        ```
    - Verify pre-push lease for `fork/sync/upstream-v2.0.1`:
        ```bash
        PRE_BUCKET=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.1 | cut -f1)
        echo "Lease pin (current PR #5 head): $PRE_BUCKET"
        test "$PRE_BUCKET" = "8054a935b6aad505798bba8a993d002718d119cb" \
          || { echo "Remote drifted — re-derive lease before push"; exit 1; }
        ```
    - Force-push lease-pinned via inline SSH URL (memory `feedback_git_push_ssh.md`):
        ```bash
        git push --force-with-lease=sync/upstream-v2.0.1:$PRE_BUCKET \
          git@github.com:atabisz/Vortex.git \
          v8.1/config-bucket:sync/upstream-v2.0.1
        ```
    - Push the safety tag (rollback artefact):
        ```bash
        git push git@github.com:atabisz/Vortex.git phase36/pre-surgical-snapshot
        ```

9. **Wait for Windows + Linux CI green on the rebased PR head; verify PR #5 mergeable=MERGEABLE.**
    - `gh pr checks 5 --repo atabisz/Vortex --watch`
    - `gh pr view 5 --repo atabisz/Vortex --json mergeable,mergeStateStatus,statusCheckRollup` — expect `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`.
    - Capture run URLs for the done-gate.

10. **Append `## Surgical re-shape (SYNC-36a part 1)` section to `36-REBASE-NOTES.md`.** Includes the squash SHA, cherry-pick range, conflict log, drops/skips, Windows CI URL, PR mergeable state.

## Verification commands

```bash
# Stage A — pre-flight
git rebase --abort 2>/dev/null || true
git status --porcelain                                                # MUST be empty
git checkout v8.1/config-bucket
test "$(git rev-parse HEAD)" = "f1425a5c8" || { echo "v8.1 tip drift"; exit 1; }
git tag -f phase36/pre-surgical-snapshot f1425a5c8
git fetch fork --prune
test "$(git rev-parse master)" = "$(git rev-parse fork/master)" \
  || { echo "Master drift — re-verify"; exit 1; }
git log v8.1/config-bucket..master --name-only --format= \
  | sort -u | grep -v '^$' | grep -v '^\.planning/' \
  && { echo "FAIL: master +5 contains non-.planning paths"; exit 1; } \
  || echo "OK: master +5 is .planning/ only"
test "$(git rev-parse v2.0.1^{commit})" = "f25ff55dae8a79847460fac153af874f20095aec" \
  || { echo "FAIL: tag v2.0.1 doesn't resolve to f25ff55da"; exit 1; }

# Stage B — branch
git checkout -b v8.1/config-bucket-surgical master
test "$(git rev-parse HEAD)" = "$(git rev-parse master)"
git status --porcelain                                                # empty

# Stage C — squash upstream v2.0.1
git read-tree --reset -u f25ff55da
git diff --cached --stat HEAD | tail -3                               # large diff: ~2350 files
for f in $(git diff --cached --name-only | grep -E 'packages/vortex-api/lib/api\.d\.ts$'); do
  git checkout HEAD -- "$f" 2>/dev/null || true
  git reset HEAD -- "$f" 2>/dev/null || true
done
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
git rev-parse HEAD > /tmp/phase36-squash-sha
echo "Squash commit: $(cat /tmp/phase36-squash-sha)"
git log -1 --show-signature HEAD                                      # "Good signature" with SSH key
git diff --stat HEAD f25ff55da -- ':!.planning'                       # squash tree matches upstream

# Stage D — cherry-pick chain
git rev-list --reverse --no-merges aa3faf7e5..f1425a5c8 > /tmp/phase36-cherry-list
test "$(wc -l < /tmp/phase36-cherry-list)" = "393" || { echo "Pick count mismatch"; exit 1; }
test "$(wc -l < /tmp/phase36-cherry-list)" \
   = "$(git rev-list --reverse --first-parent --no-merges aa3faf7e5..f1425a5c8 | wc -l)" \
  || echo "WARN: chain has off-trunk commits; investigate"

xargs -a /tmp/phase36-cherry-list git cherry-pick -x -S
# On halt, apply playbook in Task 5 then `git cherry-pick --continue`.

git rev-parse HEAD > /tmp/phase36-surgical-tip
echo "Surgical tip: $(cat /tmp/phase36-surgical-tip)"

# Stage E — verify FF shape
git merge-base --is-ancestor master HEAD && echo "FF-OK" || { echo "FF-FAIL"; exit 1; }
git diff --name-only phase36/pre-surgical-snapshot HEAD \
  | grep -v '^\.planning/' | grep -v '^$' \
  && echo "WARN: code-path diff vs original tip — investigate" \
  || echo "OK: tree matches original tip (modulo .planning/)"
git log --oneline master..HEAD | wc -l                                # expected 394 (1 squash + 393 picks)
git status --porcelain | grep -E 'packages/vortex-api/lib/api\.d\.ts' \
  && { echo "FAIL: api.d.ts dirty"; exit 1; } || echo "OK"
git log master..HEAD --format='%H %G?' | awk '$2 != "G"' | head \
  && { echo "FAIL: unsigned commits in range"; exit 1; } \
  || echo "OK: all signed"

# Stage E — SYNC-35a..d gates
mkdir -p .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts
pnpm install --frozen-lockfile

pnpm run typecheck 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-typecheck.txt
echo "typecheck exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-typecheck.txt
git checkout HEAD -- packages/vortex-api/lib/api.d.ts 2>/dev/null || true

pnpm run lint:ci 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-lint.txt
echo "lint:ci exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-lint.txt

pnpm test 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-test.txt
echo "test exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-test.txt

pnpm build 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-build.txt
echo "build exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-build.txt

pnpm build:extensions 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-build-extensions.txt
echo "build:extensions exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-rebase-build-extensions.txt

ls bundledPlugins | wc -l                                             # ≥ 130

# Stage F — promote + push
git branch -f v8.1/config-bucket v8.1/config-bucket-surgical
git checkout v8.1/config-bucket
PRE_BUCKET=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.1 | cut -f1)
echo "Lease pin: $PRE_BUCKET"
test "$PRE_BUCKET" = "8054a935b6aad505798bba8a993d002718d119cb" \
  || { echo "Remote drifted — re-derive lease before push"; exit 1; }

git push --force-with-lease=sync/upstream-v2.0.1:$PRE_BUCKET \
  git@github.com:atabisz/Vortex.git \
  v8.1/config-bucket:sync/upstream-v2.0.1

git push git@github.com:atabisz/Vortex.git phase36/pre-surgical-snapshot

POST=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.1 | cut -f1)
test "$POST" = "$(git rev-parse v8.1/config-bucket)" || { echo "Push didn't take"; exit 1; }

# Stage F — wait for CI; verify PR mergeability
gh pr checks 5 --repo atabisz/Vortex --watch
gh pr view 5 --repo atabisz/Vortex --json mergeable,mergeStateStatus,statusCheckRollup
# Expect mergeable=MERGEABLE, mergeStateStatus=CLEAN
```

## Artifact emission

Append to `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md`:

```markdown
## Surgical re-shape (SYNC-36a part 1)

- **Strategy:** squash upstream v2.0.1 + cherry-pick replay (per `36-RESEARCH-SURGICAL.md`)
- **Replaces:** `--rebase-merges` approach that halted at `aa3faf7e5` with 403 conflicts
- **Started:** <utc-iso>
- **Completed:** <utc-iso>

### Stage C — squash commit

- **Squash SHA:** <new>
- **Tree source:** `f25ff55da` (Nexus-Mods/Vortex tag `v2.0.1`)
- **Replaces:** `aa3faf7e5` (1st parent `d4c0d0da5`, 2nd parent `f25ff55da`)
- **Original branch tip snapshot:** `phase36/pre-surgical-snapshot` = `f1425a5c8`
- **Signature verify:** PASS (`git log -1 --show-signature` "Good signature" with SSH key)

### Stage D — cherry-pick chain

- **Range:** `aa3faf7e5..f1425a5c8` (393 first-parent non-merges; chain verified linear)
- **Picks attempted:** 393
- **Picks succeeded:** <N>
- **Empty-picks skipped:** <K>
- **Conflicts encountered:** <M>
- **Bluebird hits:** <count>
- **api.d.ts discards:** <count>
- **Operator-judgement halts:** <count> (each documented below)
- **Surgical tip SHA:** <new>

### Per-conflict log

#### <sha> — <subject>

- **Conflict files:** <paths>
- **Resolution:** fork-side default (--theirs) | api.d.ts discard | bluebird strip | manual <reason>

### Stage E — Post-surgical SYNC-35a..d gates

| Gate                         | Command                                                                             | Exit      | Artifact                                     |
| ---------------------------- | ----------------------------------------------------------------------------------- | --------- | -------------------------------------------- |
| typecheck                    | `pnpm run typecheck`                                                                | 0         | `artifacts/post-rebase-typecheck.txt`        |
| lint:ci                      | `pnpm run lint:ci`                                                                  | 0         | `artifacts/post-rebase-lint.txt`             |
| test                         | `pnpm test`                                                                         | 0         | `artifacts/post-rebase-test.txt`             |
| build                        | `pnpm build`                                                                        | 0         | `artifacts/post-rebase-build.txt`            |
| build:extensions             | `pnpm build:extensions`                                                             | 0         | `artifacts/post-rebase-build-extensions.txt` |
| bundledPlugins floor         | `ls bundledPlugins \| wc -l`                                                        | <N> ≥ 130 | inline                                       |
| FF-ancestry                  | `git merge-base --is-ancestor master HEAD`                                          | 0         | inline                                       |
| Tip-tree parity (code paths) | `git diff --name-only phase36/pre-surgical-snapshot HEAD \| grep -v '^\.planning/'` | empty     | inline                                       |
| All commits SSH-signed       | `git log master..HEAD --format='%G?' \| sort -u`                                    | only "G"  | inline                                       |

### Stage F — Promote + force-push

- **Surgical tip → v8.1/config-bucket:** `git branch -f v8.1/config-bucket v8.1/config-bucket-surgical`
- **Pre-push lease pin (verified):** `8054a935b6aad505798bba8a993d002718d119cb`
- **Force-push command:** `git push --force-with-lease=sync/upstream-v2.0.1:8054a935b… git@github.com:atabisz/Vortex.git v8.1/config-bucket:sync/upstream-v2.0.1`
- **Post-push fork/sync/upstream-v2.0.1:** <new SHA, == surgical tip>
- **Safety tag pushed:** `phase36/pre-surgical-snapshot` → fork
- **PR #5 mergeable:** MERGEABLE | mergeStateStatus: CLEAN
- **CI runs:** main=<run-url>, format=<run-url>; all status checks: success
```

## Commits

**1 squash commit + 393 cherry-pick replays = 394 new commits on the branch since master.** All SSH-signed. The squash commit body references `f25ff55da` / upstream tag `v2.0.1` / original `aa3faf7e5` / `phase36/pre-surgical-snapshot` for upstream-lineage traceability. Each cherry-pick carries `(cherry picked from commit <orig-sha>)` via `-x` so original Phase 32-35 SHAs remain addressable in the commit body even though the new SHAs are different. Original 656-commit history (with 263 merges) preserved at the safety tag `phase36/pre-surgical-snapshot` (= `f1425a5c8`) for audit-trail rollback.

## Risks / contingencies

(Full table from RESEARCH-SURGICAL §6.)

- **R1 — Squash loses 263 upstream merge SHAs.** Likelihood: certain. Impact: low. Mitigation: tag squash body with `f25ff55da` + upstream tag `v2.0.1`; upstream commits remain in `Nexus-Mods/Vortex` and remain addressable via the upstream remote.
- **R2 — Cherry-pick chain halts on stubborn conflict.** Likelihood: high. Impact: medium. Mitigation: same playbook that produced these commits originally; safety tag `phase36/pre-surgical-snapshot` for rollback; per-pick documented in `36-REBASE-NOTES.md`.
- **R3 — 393 cherry-picks is slow.** Likelihood: certain. Impact: low. Mitigation: budget the time; this IS the work; xargs batches the invocations.
- **R4 — Phase 32-35 chain is non-linear (off-trunk commits).** Likelihood: low. Impact: medium. Mitigation: verified linear (393 first-parent non-merges == 393 total non-merges). No off-trunk content to recover.
- **R5 — D-36-07 linux-port filter range invalidated by SHA churn.** Likelihood: likely. Impact: low. Mitigation: filter operates by path-spec on `master..post-FF-master`; new shape still satisfies that range. **Required edit: filter must skip the squash commit by message-grep** (Wave 5 plan handles this).
- **R6 — api.d.ts re-emerges during cherry-pick chain.** Likelihood: high. Impact: low. Mitigation: D-36-11 always-discard step in the playbook catches it per-pick.
- **R7 — Bluebird `Promise<void>` annotations trigger TS1064 mid-chain.** Likelihood: medium. Impact: medium. Mitigation: pre-resolve scan in the playbook; 5 known files in `extensions/gamebryo-*` flagged in the sub-bucket table.
- **R8 — `bundledPlugins` floor (≥130) drops because squash drops a plugin file.** Likelihood: low. Impact: high. Mitigation: Stage E gate catches it; remediation = restore from `phase36/pre-surgical-snapshot` snapshot or re-pick affected plugin commits.
- **R9 — SSH signing fails on cherry-picks (signing key not loaded).** Likelihood: low. Impact: high. Mitigation: verify `~/.ssh/id_ed25519` readable at Stage A; `gpg.format=ssh` + `tag.gpgsign=true` already verified; `-S` flag explicit on each commit; Stage E audit catches unsigned commits.
- **R10 — Master `+5` docs collide with Phase 32-35 docs during cherry-pick.** Likelihood: very low. Impact: low. Mitigation: verified disjoint paths. **One overlap risk:** `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` are touched by both. Conflict expected on Phase 32-35 doc commits that update STATE/ROADMAP — apply fork-side default (the Phase 32-35 pick wins).
- **R11 — Tip-tree parity (Stage E) fails on code paths.** Likelihood: low. Impact: medium. Mitigation: investigate diff: `.planning/` drift acceptable; code drift = re-pick missed commits, or apply diff as a final reconciliation commit.
- **R12 — `--force-with-lease` rejects in Stage F due to remote drift.** Likelihood: low. Impact: medium. Mitigation: re-derive `PRE_BUCKET` just-in-time from `git ls-remote`; lease pin uses fresh value, not hardcoded.
- **R13 — PR #5 doesn't auto-flip to MERGEABLE after force-push.** Likelihood: low. Impact: low. Mitigation: manual `gh pr view 5 --json mergeable` poll; if stuck CONFLICTING after 60s, investigate (likely git side-effect); fall back to direct push to fork/master per §1.2 of `36-RESEARCH.md`.
- **R14 — Windows CI fails on rebased head (SYNC-36a).** Likelihood: medium. Impact: high. Mitigation: same risk as original plan; not surgical-strategy specific. Diagnose per Phase 35 playbook; common cause = api.d.ts drift or bluebird trap missed in resolution.

## Done criteria

(Verbatim from RESEARCH-SURGICAL §7 — all 16 must hold.)

1. `git merge-base --is-ancestor master v8.1/config-bucket` exits 0 (FF-mergeable).
2. `git diff --name-only phase36/pre-surgical-snapshot v8.1/config-bucket | grep -v '^\.planning/'` is empty.
3. `git log master..v8.1/config-bucket --oneline | wc -l` ≈ 394 (1 squash + ~393 picks; minus skipped empty-picks).
4. All commits between master and v8.1/config-bucket carry `G` in `git log --format='%G?'` (SSH-signed).
5. Each cherry-picked commit body contains `(cherry picked from commit ...)` line.
6. Squash commit body references `f25ff55da` and `aa3faf7e5` and `phase36/pre-surgical-snapshot`.
7. `pnpm run typecheck` exits 0 (SYNC-35a).
8. `pnpm run lint:ci` exits 0 (SYNC-35b).
9. `pnpm test` exits 0 (SYNC-35c).
10. `pnpm build` exits 0 (SYNC-35d).
11. `ls bundledPlugins | wc -l` ≥ 130.
12. `git status --porcelain` is empty (no api.d.ts drift, no working-tree changes).
13. `fork/sync/upstream-v2.0.1` advanced to `v8.1/config-bucket` HEAD (`git ls-remote` confirms).
14. Tag `phase36/pre-surgical-snapshot` pushed to fork for rollback safety.
15. PR #5 `mergeable` field flipped to `MERGEABLE` (`gh pr view 5 --json mergeable`); Windows CI green on PR #5 head (SYNC-36a).
16. `36-REBASE-NOTES.md` updated with surgical-strategy execution log + skipped picks + per-conflict notes.
