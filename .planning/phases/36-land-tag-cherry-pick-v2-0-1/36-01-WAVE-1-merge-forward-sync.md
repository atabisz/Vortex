---
phase: 36
wave: 1
plan_id: 36-01
title: "Wave 1 — Path C forward-sync: 3-way merge v8.1/config-bucket into master, SYNC-35 gates, FF-push merge commit"
branch: master
requirement_ids:
    - SYNC-36a
dependencies:
    - 36-00 # Wave 0 preflight + master push complete; surgical attempt rolled back
estimated_commits: 1 # one merge commit M (1st parent d494bcb7d, 2nd parent f1425a5c8)
---

# Wave 1 — Path C: 3-way merge v8.1/config-bucket into master, run SYNC-35 gates, FF-push the merge commit to fork/master

## Goal

**Strategy change.** Two prior strategies collapsed against the v8.1 base mismatch (memory `project_v8_1_base_mismatch.md`):

1. `git rebase --rebase-merges master` halted at central upstream-merge `aa3faf7e5` with **403 conflicts** (1st parent `d4c0d0da5` no longer the rebase base; git 3-way-merges 8.7k upstream files against the wrong ancestor).
2. Surgical squash-replay halted at Stage A5 with foundational mismatch (master had 304 non-merge commits past merge-base, not the assumed +5 docs-only).

`36-RESEARCH-FORWARD-SYNC.md` empirically verified three forward-sync paths via dry-run:

- **Path A** (cherry-pick master's 255 unique commits onto v8.1) — 8/10 spot-checks conflicted; multi-day. REJECTED.
- **Path B** (re-apply upstream v2.0.1 then 393 Phase 32-35 cherries onto master) — Stage 1 alone produces 406 conflicts (= original Wave 1 wall). REJECTED.
- **Path C** (3-way merge `git merge v8.1/config-bucket` from master tip) — **12 conflict files, 2 real code conflicts**, ~2 hours focused work. RECOMMENDED — and operator-accepted (AskUserQuestion 2026-05-23).

**The cost of Path C: one merge commit on master, FF-merge wording in D-36-01 substituted for "merge --no-ff to land".** Phase 35 SHAs `e2127cecb..f1425a5c8` survive in the 2nd-parent ancestry; the resulting tree is byte-equivalent to what literal FF would produce. ROADMAP success criterion #1's literal "fast-forward merged" wording is violated; substitution explicitly accepted by operator (Wave 6 records the deviation).

7-stage operations sequence (1:1 with RESEARCH-FORWARD-SYNC §4 Stages 0–6):

1. **Stage 0** — snapshot: tag `phase36/master-pre-merge` = `d494bcb7d`. `phase36/pre-surgical-snapshot` = `f1425a5c8` already exists from prior attempt; preserved as additional rollback target.
2. **Stage 1** — branch: `git switch -c v8.1/config-bucket-fwd master` (working branch from master tip).
3. **Stage 2** — merge: `git merge --no-ff v8.1/config-bucket` with the casual-voice annotation body referencing the base-mismatch finding + 2nd-parent evidence anchor `f1425a5c8`. Expected 12 conflicts (verified by dry-run).
4. **Stage 3** — resolve 12 conflicts per the §2 Path C table (HEAD/--ours = v8.1/config-bucket-fwd at master HEAD; --theirs = v8.1/config-bucket):
    - `extensions/gamebryo-plugin-management/src/index.ts` → HEAD-wins (master oxfmt). Bluebird-import file; conflict block is around `context.registerAction` UI-action — verified no `:Promise<T>` annotation in the conflict region. Use `--ours`.
    - `src/renderer/src/util/elevated.ts` → take v8.1 (single additive `import { log }` line). Use `--theirs`.
    - `__tests__/reducers.download_management.test.js` → likely DELETE (master Phase 25 dropped `__tests__/`). Verify with `git log master -- __tests__ | head -10`. If confirmed dropped, `git rm`.
    - 9 docs files (`.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/PROJECT.md`, `.planning/MILESTONES.md`, `.planning/REQUIREMENTS.md`, `.planning/config.json`, `AGENTS-DEBUGGING.md`, `packages/paths/README.md`, `structure.md`) → manual reconcile per §2 table. `.planning/*` need `git add -f` (memory `feedback_planning_gitignored.md`).
5. **Stage 4** — SYNC-35a..d gates pre-commit: `pnpm install --frozen-lockfile && pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build`. Discard `packages/vortex-api/lib/api.d.ts` after typecheck (D-36-11). bundledPlugins ≥ 130 (D-35-08 floor). Abort merge with `git reset --hard phase36/master-pre-merge` if any gate fails.
6. **Stage 5** — commit merge (uses prepared message). Verify ancestry: `git merge-base --is-ancestor f1425a5c8 HEAD` exit 0; `git log -1 --format='%H %P'` shows two parents.
7. **Stage 6** — push merge commit FF to fork/master via inline SSH URL; lease pin to current `fork/master = d494bcb7d`. Wait for `main.yml` Windows + Linux green (SYNC-36a).

**Why this works.** The 3-way merge driver, given common ancestor `d4c0d0da5`, only surfaces conflicts where **both sides edited the same hunk**. Master added v2.0.0-linux Phase 24-30 content; v8.1 added v2.0.1 + Phase 32-35 content on a v2.0.0-pre base. Empirically the overlapping-edit set is 12 files (verified by `git merge --no-commit --no-ff v8.1/config-bucket` dry-run in this session). The merge commit's 1st parent IS master tip (`d494bcb7d`), so push to fork/master is a clean FF — no force needed beyond the lease pin.

References: see `36-RESEARCH-FORWARD-SYNC.md` (load-bearing — §1 commit classification; §2 Path A/B/C empirical verification; §4 11-stage operations; §5 conflict density; §6 14 risks; §7 done criteria; §8 plan re-shape; §9 honest assessment); `36-CONTEXT.md` D-36-02 / D-36-11 (D-36-01 substitution recorded in Wave 6); memory `project_v8_1_base_mismatch.md` (architectural finding); memories `feedback_bluebird_promise_trap.md`, `feedback_minimize_upstream_diff.md`, `feedback_git_push_ssh.md`, `feedback_ssh_signing.md`, `feedback_casual_voice.md`, `feedback_planning_gitignored.md`.

## Tasks

### Stage 0 — Snapshot

1. **Re-verify clean state, snapshot master pre-merge, confirm rollback targets.**
    - `git status --porcelain` MUST be empty.
    - `git checkout master`; verify `git rev-parse HEAD == d494bcb7d`.
    - Snapshot: `git tag -f phase36/master-pre-merge d494bcb7d` (local; rollback target).
    - Confirm `phase36/pre-surgical-snapshot` still resolves to `f1425a5c8`: `git rev-parse phase36/pre-surgical-snapshot == f1425a5c8`.
    - Confirm `fork/master = d494bcb7d` (Wave 0 push): `git fetch fork --prune; git rev-parse fork/master == d494bcb7d`.
    - Confirm `v8.1/config-bucket = f1425a5c8`: `git rev-parse v8.1/config-bucket == f1425a5c8`.
    - Confirm merge-base: `test "$(git merge-base master v8.1/config-bucket)" = "d4c0d0da50d24090efb6e83ec8ef33fa5cebd2bf"` (the v8.1 base-mismatch finding).

### Stage 1 — Branch

2. **Create `v8.1/config-bucket-fwd` from master HEAD.**
    - `git switch -c v8.1/config-bucket-fwd master`
    - `git rev-parse HEAD == d494bcb7d`.
    - `git status --porcelain` empty.

### Stage 2 — 3-way merge

3. **Merge v8.1/config-bucket with `--no-ff` and casual-voice body.**
    - Body shape (RESEARCH-FORWARD-SYNC §4 Stage 2 verbatim, casual voice):

        ```
        merge v8.1/config-bucket: v2.0.1 + Phase 32-35 onto master

        Forward-sync after base mismatch discovered Phase 36 Wave 1 surgical halt.
        v8.1 was branched from d4c0d0da5 (pre-v2.0.0-linux); master had absorbed
        v2.0.0-linux work via Phase 24-30. 3-way merge surfaces 12 conflicts across
        overlapping edits; auto-merges everything else.

        See .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md
        for path selection rationale.

        Phase 35 done-gate evidence (D-35-10 7/7 GREEN) preserved in 2nd-parent
        ancestry: e2127cecb..f1425a5c8.
        ```

    - Run: `git merge --no-ff -m "<body>" v8.1/config-bucket`
    - Expect 12 conflict files (8 UU, 4 AA). If conflict count diverges materially from 12, abort and investigate before resolving (`git merge --abort`).

### Stage 3 — Resolve 12 conflicts

4. **Real code conflicts (2):**
    - **`extensions/gamebryo-plugin-management/src/index.ts`** — HEAD-wins (master oxfmt). Bluebird-import file:
        ```bash
        # Bluebird scan in conflict region (memory feedback_bluebird_promise_trap.md)
        grep -nE 'import Promise from "bluebird"' extensions/gamebryo-plugin-management/src/index.ts
        grep -cE ':Promise<' extensions/gamebryo-plugin-management/src/index.ts   # capture for post-resolve diff
        git checkout --ours extensions/gamebryo-plugin-management/src/index.ts
        git add extensions/gamebryo-plugin-management/src/index.ts
        ```
        RESEARCH-FORWARD-SYNC §2 verified the conflict block is around `context.registerAction(...)` — no `:Promise<T>` annotation visible. HEAD-wins preserves master's typecheck-verified annotations (Phase 30 baseline).
    - **`src/renderer/src/util/elevated.ts`** — take v8.1 (1-line additive import):
        ```bash
        git checkout --theirs src/renderer/src/util/elevated.ts
        git add src/renderer/src/util/elevated.ts
        ```

5. **Test file conflict (1):**
    - **`__tests__/reducers.download_management.test.js`** — verify master's disposition:
        ```bash
        git log master -- __tests__/reducers.download_management.test.js | head -5
        ls -la __tests__/ 2>/dev/null   # if dir doesn't exist, master dropped __tests__ entirely
        ```
        If dropped on master (Phase 25 jest-mock cleanup): `git rm __tests__/reducers.download_management.test.js`. Otherwise `git checkout --theirs` then verify it still passes against current src.

6. **Docs conflicts (9) — manual reconcile per §2 table:**
    - **`.planning/STATE.md`** — take v8.1's tail (Phase 35 close summary); preserve master's Phase 24-30 closure lines if both sides recorded distinct history. Write the merged content; `git add -f .planning/STATE.md`.
    - **`.planning/ROADMAP.md`** — merge both sides (master has v8.0 closure; v8.1 has Phase 31-35 progression). `git add -f`.
    - **`.planning/PROJECT.md`** — merge both. `git add -f`.
    - **`.planning/MILESTONES.md`** — merge both. `git add -f`.
    - **`.planning/REQUIREMENTS.md`** (AA) — take v8.1 verbatim (newer; contains v8.1 SYNC-3X reqs; master only had v8.0 SYNC-2X). `git add -f`.
    - **`.planning/config.json`** — manual reconcile (tiny; key-by-key inspect). `git add -f`.
    - **`AGENTS-DEBUGGING.md`** (AA) — take whichever side has the populated content; tiny. `git add`.
    - **`packages/paths/README.md`** (AA) — take v8.1 if present (newer, v2.0.1-aligned per §6 R5); tiny. `git add`.
    - **`structure.md`** — manual reconcile (tiny). `git add`.

7. **Marker audit + final stage:**
    - `git diff --cached --check` exit 0 (no conflict markers in staged content).
    - `git status --porcelain` shows only the conflict files staged; no `UU`/`AA`/`DU`/`UD` remaining.

### Stage 4 — SYNC-35 gates pre-commit

8. **Run gates BEFORE merge commit (so abort path stays clean if any gate fails).**
    - Note: `pnpm install --frozen-lockfile` is run with conflicts already resolved + staged; if a lockfile-related conflict surfaces in Stage 3, install loops until clean.
    - `pnpm install --frozen-lockfile` exit 0.
    - `pnpm run typecheck 2>&1 | tee artifacts/post-merge-typecheck.txt; echo "exit=$?" >> ...` exit 0.
    - **Discard api.d.ts regen (D-36-11):** `git checkout HEAD -- packages/vortex-api/lib/api.d.ts 2>/dev/null || true`. The merge state still has staged conflicts resolved; `git status -sb` should show no `packages/vortex-api/lib/api.d.ts` in the dirty set after this.
    - `pnpm run lint:ci 2>&1 | tee artifacts/post-merge-lint.txt; echo "exit=$?" >> ...` exit 0.
    - `pnpm test 2>&1 | tee artifacts/post-merge-test.txt; echo "exit=$?" >> ...` exit 0.
    - `pnpm build 2>&1 | tee artifacts/post-merge-build.txt; echo "exit=$?" >> ...` exit 0.
    - `pnpm build:extensions 2>&1 | tee artifacts/post-merge-build-extensions.txt; echo "exit=$?" >> ...` exit 0.
    - `ls bundledPlugins | wc -l` ≥ 130 (D-35-08 floor).
    - On any non-zero gate: `git merge --abort` (state still mid-merge pre-commit). State is clean; investigate, re-plan, do NOT proceed to Stage 5.

### Stage 5 — Commit merge

9. **Commit using the prepared message; verify ancestry + signature.**
    - `git commit` (uses `MERGE_MSG` from Stage 2; SSH-signed via `tag.gpgsign`/`commit.gpgsign` config).
    - Capture: `git rev-parse HEAD > /tmp/phase36-merge-commit-sha` and echo.
    - Verify both parents present:
        ```bash
        git log -1 --format='%H%n  parents: %P%n  msg: %s' HEAD
        # Expect two parent SHAs: d494bcb7d... and f1425a5c8...
        ```
    - Verify FF-condition (vacuously): `git merge-base --is-ancestor master HEAD` exit 0 (HEAD == v8.1/config-bucket-fwd post-commit).
    - Verify Phase 35 evidence preserved: `git merge-base --is-ancestor f1425a5c8 HEAD` exit 0.
    - Verify SSH signature: `git log -1 --show-signature HEAD` shows "Good signature" with the SSH key.

### Stage 6 — Push merge commit FF to fork/master

10. **Lease-pinned FF push via inline SSH URL.**
    - Pre-push lease: `PRE_M=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1); test "$PRE_M" = "d494bcb7d090bdf311f8e5b1cc7cfb418b009726"` (or whatever Wave 0 captured).
    - Push:
        ```bash
        git push --force-with-lease=master:d494bcb7d090bdf311f8e5b1cc7cfb418b009726 \
          git@github.com:atabisz/Vortex.git \
          v8.1/config-bucket-fwd:master
        ```
        The push is mechanically FF (M's 1st parent IS the current fork/master); `--force-with-lease` is defensive against drift, not a force-push of divergent history.
    - Post-push verify: `POST_M=$(git ls-remote ... | cut -f1); test "$POST_M" = "$(git rev-parse v8.1/config-bucket-fwd)"`.
    - Refresh local master: `git checkout master; git pull --ff-only fork master`. Local master now equals fork/master == merge commit.

11. **Wait for Windows + Linux CI green on the merge commit (SYNC-36a).**
    - `gh run list --repo atabisz/Vortex --branch master --limit 5` — find runs triggered by the master push.
    - Watch `main.yml` Windows + Linux matrix: `gh run watch <run-id>`.
    - Both Windows and Linux must conclude `success`.
    - Capture run URLs for the done-gate.

12. **Append `## Forward-sync merge (SYNC-36a)` section to `36-REBASE-NOTES.md`.**

## Verification commands

```bash
# Stage 0 — pre-flight
git status --porcelain                                                # MUST be empty
git checkout master
test "$(git rev-parse HEAD)" = "d494bcb7d090bdf311f8e5b1cc7cfb418b009726" \
  || { echo "master tip drift"; exit 1; }
git tag -f phase36/master-pre-merge d494bcb7d090bdf311f8e5b1cc7cfb418b009726
test "$(git rev-parse phase36/pre-surgical-snapshot)" = "f1425a5c810794b8325db624d97da9abc106ad90" \
  || { echo "snapshot tag drift"; exit 1; }
git fetch fork --prune
test "$(git rev-parse fork/master)" = "d494bcb7d090bdf311f8e5b1cc7cfb418b009726"
test "$(git rev-parse v8.1/config-bucket)" = "f1425a5c810794b8325db624d97da9abc106ad90"
test "$(git merge-base master v8.1/config-bucket)" = "d4c0d0da50d24090efb6e83ec8ef33fa5cebd2bf" \
  || { echo "merge-base mismatch — base finding doesn't hold"; exit 1; }

# Stage 1 — branch
git switch -c v8.1/config-bucket-fwd master
test "$(git rev-parse HEAD)" = "$(git rev-parse master)"

# Stage 2 — merge with prepared body (heredoc)
git merge --no-ff -m "$(cat <<'EOF'
merge v8.1/config-bucket: v2.0.1 + Phase 32-35 onto master

Forward-sync after base mismatch discovered Phase 36 Wave 1 surgical halt.
v8.1 was branched from d4c0d0da5 (pre-v2.0.0-linux); master had absorbed
v2.0.0-linux work via Phase 24-30. 3-way merge surfaces 12 conflicts across
overlapping edits; auto-merges everything else.

See .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md
for path selection rationale.

Phase 35 done-gate evidence (D-35-10 7/7 GREEN) preserved in 2nd-parent
ancestry: e2127cecb..f1425a5c8.
EOF
)" v8.1/config-bucket
# Will halt with conflicts — expected ~12 files. If count diverges materially, abort:
#   git merge --abort
# and investigate before continuing.

# Stage 3 — resolve conflicts (manual; see Tasks 4-6)
# After all 12 resolved + staged:
git diff --cached --check                                              # no markers
git status --porcelain | grep -E '^(UU|AA|DU|UD)' && { echo "Unresolved conflicts remain"; exit 1; }

# Stage 4 — SYNC-35 gates (pre-commit; abortable)
mkdir -p .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts
pnpm install --frozen-lockfile

pnpm run typecheck 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-typecheck.txt
echo "typecheck exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-typecheck.txt
git checkout HEAD -- packages/vortex-api/lib/api.d.ts 2>/dev/null || true

pnpm run lint:ci 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-lint.txt
echo "lint:ci exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-lint.txt

pnpm test 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-test.txt
echo "test exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-test.txt

pnpm build 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-build.txt
echo "build exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-build.txt

pnpm build:extensions 2>&1 | tee .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-build-extensions.txt
echo "build:extensions exit=$?" >> .planning/phases/36-land-tag-cherry-pick-v2-0-1/artifacts/post-merge-build-extensions.txt

ls bundledPlugins | wc -l                                              # ≥ 130

# On any gate failure: `git merge --abort`; do NOT commit.

# Stage 5 — commit merge
git commit
git rev-parse HEAD > /tmp/phase36-merge-commit-sha
echo "Merge commit: $(cat /tmp/phase36-merge-commit-sha)"
git log -1 --format='%H%n  parents: %P%n  msg: %s' HEAD                # two parents
git merge-base --is-ancestor master HEAD && echo "FF-condition OK (vacuous)"
git merge-base --is-ancestor f1425a5c810794b8325db624d97da9abc106ad90 HEAD \
  && echo "Phase 35 evidence preserved"
git log -1 --show-signature HEAD                                       # "Good signature"

# Stage 6 — push merge to fork/master FF (lease-pinned; defensive force-with-lease)
PRE_M=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
echo "Pre-push fork/master: $PRE_M"
test "$PRE_M" = "d494bcb7d090bdf311f8e5b1cc7cfb418b009726" \
  || { echo "fork/master drifted — re-derive lease"; exit 1; }

git push --force-with-lease=master:d494bcb7d090bdf311f8e5b1cc7cfb418b009726 \
  git@github.com:atabisz/Vortex.git \
  v8.1/config-bucket-fwd:master

POST_M=$(git ls-remote git@github.com:atabisz/Vortex.git refs/heads/master | cut -f1)
test "$POST_M" = "$(git rev-parse v8.1/config-bucket-fwd)" || { echo "Push didn't take"; exit 1; }
echo "fork/master advanced from d494bcb7d → $POST_M"

# Refresh local master
git checkout master
git pull --ff-only fork master
test "$(git rev-parse master)" = "$POST_M"

# Stage 6 cont. — wait for CI green
gh run list --repo atabisz/Vortex --branch master --limit 5
# Capture main.yml run id, then:
#   gh run watch <run-id>
# Both Windows + Linux must conclude success.
gh run list --repo atabisz/Vortex --branch master --workflow main.yml --limit 1 \
  --json databaseId,conclusion,status
```

## Artifact emission

Append to `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md`:

```markdown
## Forward-sync merge (SYNC-36a)

- **Strategy:** Path C 3-way merge (per `36-RESEARCH-FORWARD-SYNC.md`)
- **Replaces:** rebase-merges (403-conflict halt) + surgical squash (Stage A5 base-mismatch halt)
- **Operator-accepted substitution:** D-36-01 "FF-merge" → "merge --no-ff to land + tag the merge commit" (AskUserQuestion 2026-05-23)
- **Started:** <utc-iso>
- **Completed:** <utc-iso>

### Pre-merge state

- master tip: d494bcb7d (= fork/master, Wave 0 push)
- v8.1/config-bucket tip: f1425a5c8 (Phase 35 close)
- merge-base: d4c0d0da5 (1st parent of aa3faf7e5 — the v8.1 base mismatch)
- Snapshots: phase36/master-pre-merge = d494bcb7d; phase36/pre-surgical-snapshot = f1425a5c8

### Conflicts (12 files; verified by dry-run RESEARCH-FORWARD-SYNC §2 Path C)

| File                                               | Type    | Resolution                                                                   |
| -------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| extensions/gamebryo-plugin-management/src/index.ts | UU code | --ours (HEAD-wins; master oxfmt; bluebird scan: no `:Promise<T>` introduced) |
| src/renderer/src/util/elevated.ts                  | UU code | --theirs (v8.1 +1-line import)                                               |
| **tests**/reducers.download_management.test.js     | UU test | DELETE / --theirs (per master Phase 25 disposition)                          |
| .planning/STATE.md                                 | UU docs | merged manually                                                              |
| .planning/ROADMAP.md                               | UU docs | merged manually                                                              |
| .planning/PROJECT.md                               | UU docs | merged manually                                                              |
| .planning/MILESTONES.md                            | UU docs | merged manually                                                              |
| .planning/REQUIREMENTS.md                          | AA docs | --theirs (v8.1 has SYNC-3X)                                                  |
| .planning/config.json                              | UU docs | merged manually                                                              |
| AGENTS-DEBUGGING.md                                | AA docs | take whichever populated                                                     |
| packages/paths/README.md                           | AA docs | --theirs (v8.1 v2.0.1-aligned)                                               |
| structure.md                                       | UU docs | merged manually                                                              |

### SYNC-35a..d gates (pre-commit, abortable)

| Gate                 | Command                      | Exit      | Artifact                                    |
| -------------------- | ---------------------------- | --------- | ------------------------------------------- |
| typecheck            | `pnpm run typecheck`         | 0         | `artifacts/post-merge-typecheck.txt`        |
| lint:ci              | `pnpm run lint:ci`           | 0         | `artifacts/post-merge-lint.txt`             |
| test                 | `pnpm test`                  | 0         | `artifacts/post-merge-test.txt`             |
| build                | `pnpm build`                 | 0         | `artifacts/post-merge-build.txt`            |
| build:extensions     | `pnpm build:extensions`      | 0         | `artifacts/post-merge-build-extensions.txt` |
| bundledPlugins floor | `ls bundledPlugins \| wc -l` | <N> ≥ 130 | inline                                      |

### Merge commit

- **Merge SHA:** <new>
- **Parents:** d494bcb7d (master tip) + f1425a5c8 (v8.1/config-bucket tip)
- **FF-condition (vacuous):** PASS — `git merge-base --is-ancestor master HEAD` exit 0
- **Phase 35 evidence preserved:** PASS — `git merge-base --is-ancestor f1425a5c8 HEAD` exit 0
- **Signature:** "Good signature" via SSH key (~/.ssh/id_ed25519)

### Push to fork/master (FF, lease-pinned)

- **Lease pin:** d494bcb7d090bdf311f8e5b1cc7cfb418b009726 (verified pre-push)
- **Push command:** `git push --force-with-lease=master:d494bcb7d… git@github.com:atabisz/Vortex.git v8.1/config-bucket-fwd:master`
- **Post-push fork/master:** <new> (== merge commit SHA)
- **Local master post-pull:** <new> (== merge commit SHA)
- **Windows main.yml:** <run-url> — success
- **Linux main.yml:** <run-url> — success
```

## Commits

**1 merge commit in Wave 1.** SSH-signed; 1st parent = master pre-merge tip (`d494bcb7d`); 2nd parent = `f1425a5c8` (Phase 35 close, v8.1/config-bucket tip). Phase 32-35 atomic SHAs `e2127cecb..f1425a5c8` survive in the 2nd-parent ancestry — addressable via `git log --first-parent` (master line) and `git log <merge-sha>^2` (v8.1 line). Original 656-commit v8.1/config-bucket history preserved at `phase36/pre-surgical-snapshot` (= `f1425a5c8`) AND in the 2nd-parent ancestry of the merge commit itself.

## Risks / contingencies

(Verbatim selection from RESEARCH-FORWARD-SYNC §6 — most relevant to Wave 1.)

- **R4 — bundledPlugins floor / SYNC-35 gates may regress with Path C.** Stage 4 explicitly runs SYNC-35a..d pre-commit; abort merge before Stage 5 if any fails. `git merge --abort` returns to clean master pre-merge state.
- **R5 — Master `restore(packages):paths` collides with v8.1's contingency-fix.** The 3-way merge auto-resolves where v8.1's content matches the upstream-v2.0.1 baseline. The `packages/paths/README.md` AA conflict surfaces this — Task 6 takes v8.1 (newer, v2.0.1-aligned).
- **R6 — oxfmt format conflicts.** Only `gamebryo-plugin-management/src/index.ts` (1 block). HEAD-wins is the resolution. The other 43 files of v8.0's oxfmt pass auto-resolve because v8.1 didn't re-format them (verified by dry-run yielding only this file in the conflict set).
- **R7 — Bluebird Promise trap (TS1064).** Only one bluebird-importing file in the conflict surface. Conflict region around `context.registerAction(...)` — no `:Promise<T>` annotation visible (RESEARCH-FORWARD-SYNC §2 verified by inspection). HEAD-wins preserves master's Phase 30-tested annotations. If TS1064 surfaces in Stage 4, drop the offending annotation per memory `feedback_bluebird_promise_trap.md` and re-run typecheck.
- **R10 — Future cherry-pick of merge commit confuses linux-port filter.** Wave 5 explicitly does NOT cherry-pick the merge commit itself; walks both parent ancestries via `--no-merges` (skips M plus any v8.1 PR-merge commits in the 2nd-parent ancestry).
- **R12 — `.planning/` is gitignored — `git add` will refuse.** Task 6 uses `git add -f` for `.planning/*` paths.
- **R13 — CI catches a Linux-side regression.** Stage 6 waits for `main.yml` green on both platforms before Wave 3 (tag) proceeds. SYNC-36a is the gate.
- **Conflict count diverges from 12.** If `git merge --no-ff v8.1/config-bucket` produces materially more conflicts than 12, abort (`git merge --abort`) and investigate. The dry-run was 2026-05-23; if either tip moved, the conflict surface may have grown. Re-verify SHAs Stage 0 catches this.
- **Lockfile-related conflict in Stage 4.** `pnpm-lock.yaml` was NOT in the dry-run conflict set; if it surfaces, regenerate with `pnpm install --no-frozen-lockfile` and re-stage. If lock drift persists, escalate.
- **Operator-judgement halt during Stage 3 docs reconcile.** If a `.planning/*` merge requires a judgement call beyond "take v8.1's tail / merge both", document the halt in `36-REBASE-NOTES.md` and surface for operator. Don't silently flatten history.

## Done criteria

(From RESEARCH-FORWARD-SYNC §7 + Wave 1 scope.)

1. `phase36/master-pre-merge` tag created at `d494bcb7d` (rollback target).
2. Working branch `v8.1/config-bucket-fwd` created from master HEAD.
3. `git merge --no-ff v8.1/config-bucket` completed with exactly 12 conflicts (or material divergence triggered abort + investigation).
4. All 12 conflicts resolved per the §2 Path C table; `git diff --cached --check` exit 0; no `UU`/`AA` remaining.
5. Pre-commit SYNC-35a..d gates all exit 0 (typecheck/lint:ci/test/build/build:extensions); bundledPlugins floor ≥ 130.
6. `packages/vortex-api/lib/api.d.ts` not dirty post-typecheck (D-36-11 discard applied).
7. Merge commit created; SSH-signed ("Good signature"); two parents (`d494bcb7d` + `f1425a5c8`).
8. `git merge-base --is-ancestor f1425a5c8 HEAD` exit 0 (Phase 35 evidence preserved in 2nd-parent ancestry).
9. `git merge-base --is-ancestor master HEAD` exit 0 (vacuous FF-condition; HEAD == merge commit which IS master after pull).
10. Pre-push lease verified (`fork/master = d494bcb7d`).
11. Force-with-lease push of `v8.1/config-bucket-fwd:master` succeeded; post-push `fork/master` == merge commit SHA.
12. Local master fast-forward-pulled to merge commit.
13. `main.yml` Windows + Linux green on the merge commit (SYNC-36a closed).
14. `36-REBASE-NOTES.md` Forward-sync merge section appended.
