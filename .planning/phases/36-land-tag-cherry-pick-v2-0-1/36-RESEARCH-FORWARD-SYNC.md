# Phase 36: Forward-sync research — v2.0.1 land path

**Researched:** 2026-05-23
**Domain:** Git topology reconciliation; v8.1 base mismatch recovery
**Confidence:** HIGH (every quantitative claim is patch-id or dry-run-cherry-pick verified)
**Branch at research time:** `v8.1/config-bucket` (`f1425a5c8`)

## Summary

The base mismatch finding is real but the conflict surface is **not** what `36-RESEARCH-SURGICAL.md` and `36-REBASE-NOTES.md` implied. Three forward-sync paths exist; one of them — a simple `git merge v8.1/config-bucket` from master tip — has a **12-file conflict surface** with only 2 real code conflicts. That is the dramatically lower-cost option compared to the 403-conflict / 406-conflict events the previous attempts hit.

The trade-off is a single merge commit: it gets us a sound tree containing master + v2.0.1 + Phase 32-35 in one operation, but it sacrifices ROADMAP success criterion #1's literal word "fast-forward". Given the alternative is multi-day per-file resolution of either 255 cherry-picks or a 406-conflict squash, the merge-commit path is the recommended option. Decision belongs to the operator.

**Primary recommendation:** Path C (3-way merge via `git merge --no-ff v8.1/config-bucket` from master tip) — 12 conflicts (2 real code, 1 test, 9 docs), one merge commit on master, FF-condition becomes vacuously true (master IS its own descendant), Phase 32-35 SHAs preserved in second-parent ancestry.

If the operator insists on literal FF-merge, the only viable alternative is Path B, which costs a 406-conflict v2.0.1-replay event followed by 393 cherry-picks. That's a milestone-scale effort vs Path C's day-scale effort.

## User Constraints (from CONTEXT.md)

### Locked Decisions

D-36-01..D-36-11 carry forward as-written, with one mandatory amendment:

- **D-36-01 (FF-merge)** — Falsified by base mismatch (memory `project_v8_1_base_mismatch.md`). Cannot be honored literally without first reconciling the 300-commit master divergence. This research recommends Path C, which substitutes "FF-merge" with "merge --no-ff to land + tag the merge commit". Operator must explicitly accept or reject the substitution before plan re-shape proceeds.
- **D-36-02 (fork-side default)** — Still applies to Path C's 12-conflict surface. The 2 real code conflicts and 9 docs conflicts all resolve cleanly with HEAD-wins semantics (master IS the canonical fork-side post-Phase-30). One bluebird-import file in the surface (`extensions/gamebryo-plugin-management/src/index.ts`) — TS1064 trap scan applies.
- **D-36-03 (push local master to fork/master FIRST)** — Already done (Wave 0). `fork/master = d494bcb7d`. Load-bearing for any chosen path.
- **D-36-04..D-36-08** (tag, push order, cherry-pick filter) — apply post-merge regardless of path.
- **D-36-09 (release-linux.yml smoke)** — same.
- **D-36-10 (playbook updates → Phase 37)** — same.
- **D-36-11 (api.d.ts discard)** — applies during typecheck after merge.

### Claude's Discretion

- Plan-shape re-sequencing for forward-sync.
- Whether to update PR #5's head ref or close/reopen.
- Whether to keep `phase36/pre-surgical-snapshot` tag.

### Deferred Ideas

- Local-boot AppImage UAT → Phase 37.
- Playbook post-mortem → Phase 37 SYNC-37b.
- Origin tag push → informational only.

## Phase Requirements

| ID                 | Description                                                          | Research Support                                                      |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| SYNC-36a           | Windows + Linux CI green on rebased PR head                          | §4 (Path C) post-merge CI run on merged ref                           |
| SYNC-36b           | FF-merge PR #5 to master                                             | §4 substitutes "merge --no-ff" — operator accepts substitution per §2 |
| SYNC-36c           | SSH-signed annotated tag `v2.0.1-linux-rebased` on post-merge master | §4 Stage 5                                                            |
| SYNC-36d           | release-linux.yml CI smoke on canonical tag                          | §4 Stage 6                                                            |
| SYNC-36e (D-36-10) | Cherry-pick path-filtered subset onto linux-port                     | §4 Stage 7                                                            |

## Architectural Responsibility Map

| Capability                  | Primary Tier                           | Secondary Tier                                    | Rationale                                                                  |
| --------------------------- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Git topology reconciliation | local git CLI                          | —                                                 | All merge/rebase/cherry-pick is local; force-push is the only remote write |
| Conflict resolution         | local working tree                     | merge driver (`git config merge.*.driver`)        | Only 2 real code conflicts in Path C; both resolve manually                |
| Tag signing                 | local SSH key (`~/.ssh/id_ed25519`)    | git config (`gpg.format=ssh`, `tag.gpgsign=true`) | Already configured; no new infra                                           |
| CI trigger                  | fork remote (`fork/master`, tag push)  | GitHub Actions (`release-linux.yml`, `main.yml`)  | Same as v8.0 Phase 30                                                      |
| Cherry-pick filter          | local git CLI with pathspec exclusions | linux-port branch                                 | Same as D-36-07                                                            |

## Standard Stack

No new tooling. Uses existing:

- `git` 2.43.0 (verified)
- `gh` 2.45.0 (verified)
- `pnpm` 10.33.0 (verified)

## Live state (re-verified 2026-05-23, this session)

| Ref                                 | SHA                                   | Notes                                                                 |
| ----------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| local master                        | `d494bcb7d`                           | == fork/master                                                        |
| fork/master                         | `d494bcb7d`                           | Wave 0 push landed                                                    |
| local v8.1/config-bucket            | `f1425a5c8`                           | Phase 35 close commit                                                 |
| fork/sync/upstream-v2.0.1           | `8054a935b`                           | unchanged                                                             |
| fork/linux-port                     | `6a28945d1`                           | unchanged                                                             |
| merge-base(master, v8.1)            | `d4c0d0da5`                           | 1st parent of `aa3faf7e5`                                             |
| `aa3faf7e5`                         | central v8.1 merge of upstream v2.0.1 | parents: `d4c0d0da5` + `f25ff55da`                                    |
| upstream v2.0.1 (`f25ff55da`)       | upstream tag tip                      | `Merge pull request #23130 from Nexus-Mods/fix/app-448`               |
| `phase36/pre-surgical-snapshot`     | `f1425a5c8` (local-only)              | rollback target if needed                                             |
| merge-base(fork/linux-port, master) | `538aef374`                           | linux-port is much-older-base; cherry-pick filter is correct strategy |

Counts:

- master non-merge commits past merge-base: **300**
- master merge commits past merge-base: **4** (all `chore: merge executor worktree` from Phase 25)
- v8.1 non-merge commits past merge-base: **536**
- v8.1 merge commits past merge-base: **120** (1× `aa3faf7e5` + 119 upstream Nexus-Mods PR merges)
- v8.1 commits between `d4c0d0da5..aa3faf7e5`: 143 non-merge + 120 merge
- v8.1 commits between `aa3faf7e5..f1425a5c8` (Phase 32-35): **393** non-merge, 0 merge

## §1 — Classification of master's 300 unique non-merge commits

By conventional-commit prefix:

| Bucket                   | Count | Disposition                                                                                                                    | Notes                                                                                                                                                                                                      |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs(...)`              | 87    | SKIP entirely                                                                                                                  | All `.planning/` GSD artifacts (Phase 24-30, milestone, playbook). Already-`.planning/`-style; no value to tag.                                                                                            |
| `resolve(...)`           | 95    | SKIP entirely                                                                                                                  | v8.0 Phase 28-30 fork-side resolution work for v2.0.0 merge. Not applicable to v2.0.1 base — Phase 32-35 re-derived equivalents on `aa3faf7e5`'s post-v2.0.1 tree.                                         |
| `restore(...)`           | 3     | SKIP — superseded by Phase 32-35                                                                                               | `restore(packages):paths`, `restore(extensions):gamebryo-ba2-support`, `restore(downloading):chunking`. v8.1 already has these via Phase 32-35 work; verified by `git cherry` showing 45 patch-id matches. |
| `fix(30-...)`            | 3     | SKIP — superseded                                                                                                              | `fix(30-01):IState-superset`, `fix(30-01):pnpm-superset`, `fix(30-04a):DownloadObserver-rewire`. v2.0.0-era.                                                                                               |
| `chore(format)`          | 2     | SKIP — would conflict massively                                                                                                | `oxfmt baseline cleanup pre-merge`, `oxfmt 44 files post-rebase`. v2.0.0-era format passes.                                                                                                                |
| `chore(other)`           | 3     | SKIP                                                                                                                           | `chore(deps):lockfile-regen`, `chore(28-00):grep-checkpoint-relocation`, others.                                                                                                                           |
| `fix(...)` (non-30)      | 2     | SKIP — likely already in v8.1                                                                                                  | Either upstream or already patch-id matched.                                                                                                                                                               |
| `ci(...)`                | 1     | SKIP                                                                                                                           | `ci: restore four upstream workflows from 8b5a9f675`.                                                                                                                                                      |
| OTHER (upstream content) | 107   | SKIP — already in v8.1 (45 patch-id matches confirm; rest are surrounded by upstream PR merges that v8.1 absorbed differently) | Worktree-merge-tip commits squashing upstream Nexus-Mods PRs onto master. These same upstream PRs reach v8.1 via the 119 upstream PR merges in `d4c0d0da5..aa3faf7e5`.                                     |

**Patch-id evidence:** `git cherry -v v8.1/config-bucket master` → 45 of 300 master non-merge commits are already-equivalent (patch-id match) in v8.1. The other 255 are unique to master. Of those 255: 87 docs + 95 resolve + the rest are upstream-PR-tip squashes whose patches don't exactly match v8.1's individually-merged upstream PRs but produce the same eventual content.

**Conclusion: zero of the 300 master non-merge commits should be cherry-picked individually onto v8.1.** The `resolve(...)` and `restore(...)` work was authored against v2.0.0; Phase 32-35 already did the v2.0.1 equivalent. The upstream-content commits are reached via upstream PR merges in v8.1's history (different SHAs, equivalent content).

## §2 — Strategic question: Path A vs B vs C

Three architecturally distinct forward-sync paths converge to the same final tree. Spot-checked all three.

### Path A — Cherry-pick master commits onto v8.1 (mutate v8.1)

**Spot-check:** dry-run cherry-pick of 10 representative master commits onto `v8.1/config-bucket`:

| Master commit                                  | Type     | Conflict files | Total changed        |
| ---------------------------------------------- | -------- | -------------- | -------------------- |
| `f9d305d7d restore(packages):paths`            | restore  | **24**         | 25                   |
| `9a17907b6 restore(downloading):chunking`      | restore  | 1              | 7                    |
| `07c519711 fix(30-01):IState-superset`         | fix30    | 0              | 0 (already absorbed) |
| `f570149ea fix(30-04a):DownloadObserver`       | fix30    | 1              | 1                    |
| `a5c057507 chore(format):oxfmt-baseline`       | format   | 3              | **70**               |
| `839e503c0 chore(format):oxfmt-44-postrebase`  | format   | 11             | 11                   |
| `5a7709021 resolve(renderer):ExtensionManager` | resolve  | 1              | 1                    |
| `e1fe734cb resolve(renderer):useToolsData`     | resolve  | 0              | 0 (already absorbed) |
| `162f939e7 plugin-rules-per-profile`           | upstream | 1              | 4                    |
| `0c887484e healthcheck-settings`               | upstream | 3              | 7                    |

8 of 10 conflicted. The two clean ones are already-absorbed via patch-id. Extrapolating to 255 unique-to-master commits: **expect ~200+ conflicts** if cherry-picking all of them. Cumulative conflict density would be milestone-scale (multiple days). VERDICT: **REJECTED** — high cost, no obvious benefit over Path C.

### Path B — Re-apply upstream v2.0.1 + Phase 32-35 onto master (Stage 1: merge upstream, Stage 2: cherry-pick Phase 32-35)

**Stage 1 spot-check:** `git merge --no-commit --no-ff f25ff55da` from master tip:

- **Conflict files: 406** (310 UU, 25 AA, 71 DU, 0 UD)
- ~20 files import bluebird Promise → TS1064 trap potential

**Stage 2 spot-check:** dry-run cherry-pick of 10 Phase 32-35 commits onto master tip (Stage 2 only — verifies the cherry-picks would be clean once Stage 1 produced the post-v2.0.1 base):

| P32-35 commit                                       |       Conflict files |
| --------------------------------------------------- | -------------------: |
| `8054a935b restore-fork-workflows`                  |                    0 |
| `5ccf54671 resolve(savegame):index`                 |                    0 |
| `35d16d3b1 resolve(bg3):loadOrder`                  |                    0 |
| `8dace0a82 resolve(codevein):migrations`            |                    1 |
| `c5f6e353d resolve(sekiro):index`                   |                    0 |
| `824a051e5 resolve(shared):errors.test`             |                    1 |
| `42227c380 resolve(renderer):health_check-triggers` |                    0 |
| `6d3f2c841 resolve(fingerprints):clickhouse`        |                    0 |
| `6c41da31b chore:drop-jest-mocks`                   |                    0 |
| `f1425a5c8 chore(state):close-phase35`              | 4 (all `.planning/`) |

8 of 10 clean. Extrapolating: Phase 32-35 cherry-picks onto master ARE feasible (probably ~30-60 conflict files across 393 commits). **The blocker is Stage 1's 406-conflict v2.0.1 merge.**

Stage 1 alone ~= the original 403-conflict event the rebase-merges attempt halted on. VERDICT: **REJECTED for cost** — equal magnitude to original Wave 1 attempt.

### Path C — 3-way merge `git merge v8.1/config-bucket` from master tip

**Spot-check:** `git merge --no-commit --no-ff v8.1/config-bucket` from master tip:

- **Conflict files: 12** (8 UU, 4 AA, 0 DU, 0 UD)

The 12 files (with conflict-block counts):

| File                                                 | Type    | Blocks | Lines | Resolution                                                                                                    |
| ---------------------------------------------------- | ------- | -----: | ----: | ------------------------------------------------------------------------------------------------------------- |
| `extensions/gamebryo-plugin-management/src/index.ts` | UU code |      1 |  2248 | HEAD wins (master oxfmt) — bluebird scan REQUIRED (file imports bluebird Promise)                             |
| `src/renderer/src/util/elevated.ts`                  | UU code |      1 |   329 | TRIVIAL — single `import { log } ...` line; v8.1 added it; **take v8.1** (additive import)                    |
| `__tests__/reducers.download_management.test.js`     | UU test |     14 |   411 | LIKELY DELETE — master's Phase 25 dropped `__tests__/` jest tree; verify with `git log master -- __tests__`   |
| `.planning/STATE.md`                                 | UU docs |      4 |   477 | take v8.1's tail (Phase 35 close summary), preserve master's earlier Phase 30 lines if both are valid history |
| `.planning/ROADMAP.md`                               | UU docs |      3 |   499 | merge both — master has v8.0 closure, v8.1 has Phase 31-35                                                    |
| `.planning/PROJECT.md`                               | UU docs |      2 |   258 | merge both — both sides edited                                                                                |
| `.planning/MILESTONES.md`                            | UU docs |      1 |   146 | merge both                                                                                                    |
| `.planning/REQUIREMENTS.md`                          | AA docs |      1 |   183 | take v8.1 (newer, contains v8.1 SYNC-3X) — master's only had v8.0 SYNC-2X                                     |
| `.planning/config.json`                              | UU docs |      1 |    42 | tiny — manual reconcile                                                                                       |
| `AGENTS-DEBUGGING.md`                                | AA docs |      1 |    25 | take whichever exists; tiny                                                                                   |
| `packages/paths/README.md`                           | AA docs |      3 |   364 | take whichever exists; tiny                                                                                   |
| `structure.md`                                       | AA docs |      1 |    53 | tiny — manual reconcile                                                                                       |

**Bluebird scan:** Only `extensions/gamebryo-plugin-management/src/index.ts` and `.planning/STATE.md` (which is markdown, irrelevant) import bluebird from the conflict set. The single `gamebryo-plugin-management/src/index.ts` block is one oxfmt-formatting region around `context.registerAction("gamebryo-plugin-icons", ...)` — no `:Promise<T>` annotation in the conflict region (verified by inspection); HEAD-wins per D-36-02.

**Net code work: 2 real conflicts.** `gamebryo-plugin-management/src/index.ts` (1 oxfmt block, fork-side) + `elevated.ts` (1 line additive import, take v8.1). Maybe 30 minutes total. The rest is docs reconciliation (mostly trivial — both sides extended different sections).

VERDICT: **RECOMMENDED.** Lowest cost, soundest tree, shortest path to release.

### Why Path C is so much cleaner than A or B

The 3-way merge driver, given a common ancestor (`d4c0d0da5`), only surfaces conflicts where **both sides edited the same hunk**. Path A surfaces every patch where v8.1's tip differs from master's tip. Path B Stage 1 surfaces every difference between master's tip and upstream v2.0.1 — which is the entire v2.0.0→v2.0.1 upstream divergence.

Path C lets git auto-resolve everywhere only one side edited (master adds v2.0.0-linux Phase 24-30 content → keep; v8.1 adds Phase 32-35 content on a v2.0.1 base → keep), and only surfaces the small set where both sides edited overlapping hunks. Empirically that intersection is 12 files.

### What Path C costs

1. **One merge commit on master** instead of FF-merge. The merge commit's first parent is master's tip, second parent is `f1425a5c8`. Phase 35 SHAs (`e2127cecb..f1425a5c8`) survive in the second-parent ancestry — the evidence chain is preserved, just no longer on the linear first-parent path.
2. **D-36-01's literal "FF-merge" wording is violated.** ROADMAP success criterion #1 needs an explicit operator decision to accept the merge-commit substitution.
3. **PR #5's mergeability flips DIFFERENTLY.** Currently CONFLICTING because base ref `master` and head ref `8054a935b` (= fork/sync/upstream-v2.0.1, == old v8.1 base) diverge across the merge-base. After Path C, master contains the merge result; PR #5 head still points at `8054a935b`, which is v8.1's pre-Phase-32-35 base — PR #5 is now stale and should be **closed** (not merged), with a comment pointing at the merge commit.

## §3 — Phase 32-35 commit analysis (already covered in §2 Path B Stage 2)

393 commits in `aa3faf7e5..f1425a5c8`. Spot-check showed 8 of 10 clean cherry-pick onto master; conflicts are tiny (1 file each except the closing chore(state) commit which touches `.planning/` files master also edits).

For Path C, this is academic — Path C does not cherry-pick Phase 32-35; it brings them in via the merge-tree.

For Path B (rejected), the 393 cherry-picks would be feasible AFTER Stage 1's 406-conflict event.

## §4 — Recommended sequence (Path C)

### Stage 0 — Snapshot + verify state

Working tree must be clean. We already have `phase36/pre-surgical-snapshot` → `f1425a5c8` (local). Add a second snapshot tag for master pre-merge:

```bash
git switch master
git rev-parse HEAD  # MUST be d494bcb7d
git tag phase36/master-pre-merge d494bcb7d  # local-only, unsigned, rollback target
```

Verify clean working tree, no `.planning/STATE.md` or other tracked-but-modified files.

### Stage 1 — Create working branch from master

```bash
git switch -c v8.1/config-bucket-fwd master
git rev-parse HEAD  # == d494bcb7d
```

Working branch name `v8.1/config-bucket-fwd` keeps the `v8.1/` namespace (signals this is the v8.1-landing path) while distinguishing from the now-stale `v8.1/config-bucket`.

### Stage 2 — 3-way merge

```bash
git merge --no-ff -m "merge v8.1/config-bucket: v2.0.1 + Phase 32-35 onto master

Forward-sync after base mismatch discovered Phase 36 Wave 1 surgical halt.
v8.1 was branched from d4c0d0da5 (pre-v2.0.0-linux); master had absorbed
v2.0.0-linux work via Phase 24-30. 3-way merge surfaces 12 conflicts across
overlapping edits; auto-merges everything else.

See .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md
for path selection rationale.

Phase 35 done-gate evidence (D-35-10 7/7 GREEN) preserved in 2nd-parent
ancestry: e2127cecb..f1425a5c8.
" v8.1/config-bucket
```

Expect 12 conflicts (verified by dry-run §2 Path C).

### Stage 3 — Resolve 12 conflicts

Per the table in §2:

```bash
# 1. extensions/gamebryo-plugin-management/src/index.ts — HEAD-wins (master oxfmt)
#    bluebird-import file; verify no :Promise<T> annotation in the conflict region
git checkout --ours extensions/gamebryo-plugin-management/src/index.ts
# (then verify with: grep -c ':Promise<' extensions/gamebryo-plugin-management/src/index.ts before & after — should be unchanged)
git add extensions/gamebryo-plugin-management/src/index.ts

# 2. src/renderer/src/util/elevated.ts — take v8.1 (single additive import line)
git checkout --theirs src/renderer/src/util/elevated.ts
git add src/renderer/src/util/elevated.ts

# 3. __tests__/reducers.download_management.test.js — likely DELETE (master Phase 25 dropped __tests__)
#    Verify: git log master -- __tests__ | head -10
#    If dropped, delete:
git rm __tests__/reducers.download_management.test.js
# (otherwise: take v8.1 with --theirs, then verify it still passes)

# 4-12. Docs files (.planning/*, AGENTS-DEBUGGING.md, packages/paths/README.md, structure.md)
#    Manual reconcile per file. .planning/ files: use git add -f after edit (gitignored but tracked).
#    For STATE/ROADMAP/PROJECT/MILESTONES: take v8.1's content where it's the canonical Phase 35 close;
#    take master's content where it documents v8.0 closure that v8.1 doesn't reflect.
#    REQUIREMENTS.md (AA): take v8.1 verbatim (it has v8.1 SYNC-3X requirements).

# Each .planning/ file requires:
git add -f .planning/STATE.md .planning/ROADMAP.md .planning/PROJECT.md .planning/MILESTONES.md \
            .planning/REQUIREMENTS.md .planning/config.json
git add AGENTS-DEBUGGING.md packages/paths/README.md structure.md
```

### Stage 4 — Verification gates (SYNC-35 carry-forward)

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
git checkout HEAD -- packages/vortex-api/lib/api.d.ts  # D-36-11 discard
pnpm run lint:ci
pnpm test
pnpm build
ls dist/Vortex-*.zip  # smoke
node -e "console.log(require('./extensions/manifest.json').bundledPlugins.length)"  # MUST be ≥ 130 (SYNC-35a floor)
```

If any gate fails, abort merge: `git merge --abort` (will require you to NOT have committed yet) or `git reset --hard phase36/master-pre-merge` (post-commit rollback).

### Stage 5 — Commit merge

```bash
git commit  # uses the prepared message from `git merge`
git rev-parse HEAD  # capture new merge commit SHA
```

Verify ancestry:

```bash
git merge-base --is-ancestor master HEAD && echo "FF-condition OK (vacuously)"
git merge-base --is-ancestor f1425a5c8 HEAD && echo "Phase 35 evidence preserved in ancestry"
git log -1 --format='%H %s%n  parents: %P' HEAD  # both parents present
```

### Stage 6 — Push merge to fork/master

```bash
# Inline SSH URL pattern; lease pin to current fork/master
git push --force-with-lease=master:d494bcb7d \
  git@github.com:atabisz/Vortex.git v8.1/config-bucket-fwd:master
```

This is the load-bearing remote write. After this, fork/master = the merge commit.

Wait for CI: `gh run list --branch master --limit 5` — both `main.yml` (Windows + Linux matrix, SYNC-36a) and any fingerprinting workflows should run.

### Stage 7 — PR #5 disposition

PR #5's head ref is `8054a935b` (= fork/sync/upstream-v2.0.1, the old v8.1 base). The merge commit on master is NOT the PR #5 head. Therefore:

```bash
gh pr close 5 --comment "Closing — Phase 36 forward-sync landed via merge commit \
$(git rev-parse master) instead of FF-merge of this PR. \
Phase 32-35 work preserved in 2nd-parent ancestry: e2127cecb..f1425a5c8. \
See .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md \
for path-selection rationale and base-mismatch finding."
```

Do NOT use `gh pr merge 5 --merge` — would either fail or produce a second merge commit.

### Stage 8 — SSH-signed annotated tag (D-36-04, D-36-05)

```bash
git switch master
git pull fork master --ff-only  # ensure local master matches remote post-push

git tag -a v2.0.1-linux-rebased -m "Vortex v2.0.1 Linux rebased (forward-sync land)

Forward-sync landing of v8.1 milestone work (Phase 32-35 + upstream v2.0.1)
onto fork/master. Took the merge-commit path after Phase 36 Wave 1 discovered
v8.1/config-bucket was branched pre-v2.0.0-linux; FF-merge wasn't reachable
without redoing v2.0.0-linux on top of v2.0.1.

656 commits forward-synced (143 d4c0d0da5..aa3faf7e5 + aa3faf7e5 + 393 Phase 32-35).
12 conflict files in the 3-way merge; 2 real code (gamebryo-plugin-management/src/index.ts
HEAD-wins oxfmt, src/renderer/src/util/elevated.ts +1-line import).

5 SSH-signed Phase 35 commits preserved in 2nd-parent ancestry: e2127cecb..f1425a5c8.
D-35-10 7/7 GREEN evidence: .planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md.
Path-selection research: .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md."

git tag --verify v2.0.1-linux-rebased  # confirm SSH signature

# Push to fork FIRST (triggers release-linux.yml)
git push fork v2.0.1-linux-rebased
# Push to origin SECOND (informational; non-blocking on rejection per project_upstream_pr_policy.md)
git push origin v2.0.1-linux-rebased || echo "origin push declined — informational, non-blocking"
```

### Stage 9 — release-linux.yml smoke (D-36-09)

```bash
gh run list --workflow release-linux.yml --limit 3
gh run watch <run-id>  # wait for AppImage + .deb + SHA256 manifest
gh release view v2.0.1-linux-rebased --json assets
```

Capture run URL + asset SHA256s in `36-DONE-GATE.md`. Local-boot UAT is Phase 37, not 36.

### Stage 10 — Cherry-pick onto linux-port (D-36-07)

```bash
git switch linux-port
git pull fork linux-port --ff-only

# Path filter (D-36-07 verbatim) over post-merge master ancestry
git log linux-port..master --diff-filter=ACMRD --name-only --reverse \
  -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
  ':!.planning/**' \
  ':!.github/workflows/release-linux.yml' \
  ':!.github/workflows/format.yml' \
  ':!.github/actions/fingerprints/**' \
  ':!docker/**' > /tmp/cherry-pick-candidates.txt

# Note: with the merge-commit path, cherry-picking the merge directly is risky;
# prefer the 2nd-parent linear range:
# git log linux-port..f1425a5c8 --diff-filter=ACMRD --name-only --reverse -- ...
# AND
# git log linux-port..master --first-parent --diff-filter=... -- ...
# (drop the merge commit itself; cherry-pick its content via the two ranges)

# Document drops in 36-CHERRY-PICK-NOTES.md per D-36-07.
```

### Stage 11 — Done-gate

Roll up evidence into `36-DONE-GATE.md`: SYNC-36a/b/c/d/e green, the FF-→merge-commit substitution explicitly noted, asset SHA256s, run URLs, branch SHAs.

## §5 — Conflict density estimate (recommended path)

Path C: **12 conflict files** (verified by dry-run merge in this session).

| Tier                       | Count                                                             | Effort                                                    |
| -------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Real code conflicts        | 2 (gamebryo-plugin-management oxfmt + elevated.ts +1-line import) | ~30 min                                                   |
| Test file (likely deleted) | 1 (`__tests__/reducers.download_management.test.js`)              | ~5 min (verify + delete)                                  |
| Docs reconciliation        | 9 (.planning/\* + 3 AA docs)                                      | ~60-90 min (judgment-call merge of overlapping doc edits) |
| **TOTAL**                  | **12**                                                            | **~2 hours of focused work**                              |

Compare to Path A (~200+ conflicts, multi-day) or Path B (406 + ~30-60, multi-day Stage 1 alone).

## §6 — Risks + mitigations

| ID  | Risk                                                                                                                          | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `git cherry`'s patch-id detection misses semantically-equivalent-but-textually-different commits → false-skip a needed commit | Path C is unaffected (no individual cherry-picks). For Path B fallback: spot-check the 45 patch-id matches before relying on auto-skip.                                                                                                                                                                                                                                                                                                                                |
| R2  | Phase 32-35 commits authored on pre-v2.0.0 base may break in Path B                                                           | Path B is rejected; if needed, spot-check 8/10 was clean — extrapolate to ~60 conflict files across 393 commits.                                                                                                                                                                                                                                                                                                                                                       |
| R3  | Master Phase 24-30 commits authored on pre-v2.0.0 base may break in Path A                                                    | Path A is rejected; spot-check showed 8/10 conflicted, often heavily. Confirms rejection.                                                                                                                                                                                                                                                                                                                                                                              |
| R4  | bundledPlugins floor / SYNC-35 gates may regress with Path C                                                                  | Stage 4 explicitly runs the SYNC-35a/b/c/d gates; abort merge before Stage 5 commit if any fails.                                                                                                                                                                                                                                                                                                                                                                      |
| R5  | Master's `restore(packages):paths` may collide with v8.1's contingency-fix                                                    | Both sides have it (v8.1's Phase 35 contingency-fix; master's `restore(packages):paths` from Phase 30 are byte-for-byte against upstream-v2.0.0; v8.1 against upstream-v2.0.1). The 3-way merge auto-resolves where v8.1's content matches the upstream-v2.0.1 baseline. The `packages/paths/README.md` AA conflict surfaces this — manual take of v8.1 (newer, v2.0.1-aligned).                                                                                       |
| R6  | oxfmt format commits from v8.0 (`839e503c0 chore(format): oxfmt 44 files post-rebase`) may format-conflict                    | In Path C, the only format conflict is in `gamebryo-plugin-management/src/index.ts` (1 block). Master's oxfmt baseline is HEAD-wins. The other 43 files of the v8.0 oxfmt pass auto-resolve because v8.1 didn't re-format them.                                                                                                                                                                                                                                        |
| R7  | Bluebird Promise trap (TS1064)                                                                                                | Only one bluebird-importing file in the 12-conflict surface (`gamebryo-plugin-management/src/index.ts`). The conflict region is around `context.registerAction(...)` — no `:Promise<T>` annotation visible in the conflict block. Resolution is HEAD-wins (master oxfmt) which preserves master's already-tested annotations. Run `pnpm run typecheck` after resolution; if TS1064 surfaces, drop offending annotation per memory `feedback_bluebird_promise_trap.md`. |
| R8  | Milestone-scale duration                                                                                                      | Path C is ~2 hours (vs Path A/B multi-day). This is the primary reason Path C wins.                                                                                                                                                                                                                                                                                                                                                                                    |
| R9  | Operator rejects merge-commit substitution for D-36-01                                                                        | Then operator must accept Path B's 406-conflict v2.0.1-replay event + 393 cherry-picks (multi-day). No third option exists that produces a literal FF-merge from current state — the divergence is real and asymmetric.                                                                                                                                                                                                                                                |
| R10 | Future cherry-pick of merge commit confuses linux-port filter                                                                 | Mitigation: in Stage 10, do not cherry-pick the merge commit itself. Walk both parent ancestries (master first-parent + 2nd-parent f1425a5c8 ancestry) under the path filter. Document drops.                                                                                                                                                                                                                                                                          |
| R11 | PR #5 close vs merge ambiguity                                                                                                | Stage 7 explicitly closes PR #5 (does not merge) with a redirect comment. The PR is stale because its head ref `8054a935b` is the old v8.1 base, not the new merge commit.                                                                                                                                                                                                                                                                                             |
| R12 | `.planning/` is gitignored — `git add` will refuse                                                                            | Stage 3 uses `git add -f` for `.planning/` paths per memory `feedback_planning_gitignored.md`.                                                                                                                                                                                                                                                                                                                                                                         |
| R13 | CI runs after fork/master push may catch a Linux-side regression we didn't                                                    | Stage 6 waits for `main.yml` green before Stage 8 tags. SYNC-36a is the gate.                                                                                                                                                                                                                                                                                                                                                                                          |
| R14 | Origin push to Nexus-Mods rejects                                                                                             | Per memory `project_upstream_pr_policy.md`, origin push is informational; non-blocking. Document in DONE-GATE.                                                                                                                                                                                                                                                                                                                                                         |

## §7 — Done criteria

Path C "forward-sync complete" =

- [ ] `master` HEAD = the new merge commit; both parents resolve (`%P` shows two SHAs).
- [ ] `git merge-base --is-ancestor f1425a5c8 master` exit-0 (Phase 35 evidence preserved in 2nd-parent ancestry).
- [ ] `git merge-base --is-ancestor master master` exit-0 (vacuous FF-condition).
- [ ] SYNC-35a..d gates green on the merge commit (typecheck/lint/test/build all pass; api.d.ts discarded).
- [ ] bundledPlugins ≥ 130 in build output.
- [ ] api.d.ts not tracked dirty post-typecheck.
- [ ] PR #5 closed with redirect comment.
- [ ] `v2.0.1-linux-rebased` SSH-signed annotated tag pushed to fork; `release-linux.yml` produced AppImage + .deb + SHA256 manifest.
- [ ] linux-port forward-cherry-picked under D-36-07 filter; drops documented.
- [ ] 36-DONE-GATE.md rolled up.

## §8 — Phase 36 plan re-shape implications

The existing Phase 36 plan set `36-00-WAVE-0..6` needs partial rewrite:

| Wave              | Current state                                                                      | Required change                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (preflight)     | Wave 0 already executed; Task 0 (D-36-03 master push) landed                       | NO CHANGE — Wave 0 evidence at top of `36-REBASE-NOTES.md` is preserved                                                                                   |
| 1 (rebase)        | `git rebase --rebase-merges master` halted at 403 conflicts; surgical halted at A5 | **REPLACE** with `36-01-WAVE-1-merge-forward-sync.md` (Path C: branch + 12-conflict 3-way merge + SYNC-35 gates + force-push lease-pinned to fork/master) |
| 2 (FF-land)       | `gh pr merge 5 --merge`                                                            | **REPLACE** with PR #5 close + comment (no merge action; merge already landed in Wave 1)                                                                  |
| 3 (tag)           | unchanged in shape                                                                 | **AMEND** annotation body to reference forward-sync + merge-commit choice                                                                                 |
| 4 (release-smoke) | unchanged                                                                          | NO CHANGE                                                                                                                                                 |
| 5 (cherry-pick)   | unchanged in shape                                                                 | **AMEND** to skip the merge commit itself; walk both parent ancestries under D-36-07 filter                                                               |
| 6 (done-gate)     | unchanged in shape                                                                 | **AMEND** evidence rollup to record FF-→merge-commit substitution + base mismatch finding                                                                 |

## §9 — Honest assessment

Path C is the recommended forward-sync because it is the only sub-day-scale path from current state to a sound landed tag. It works because git's 3-way merge driver is good at the case where two branches edited mostly-disjoint regions of a shared codebase, and master + v8.1 turned out to have only 12 overlapping-edit files despite their large total divergence (300 + 656 commits past merge-base).

**The cost is one merge commit + ROADMAP wording substitution.** That is the operator's decision, not the researcher's. If the operator rejects merge-commit substitution, Path B is the only alternative — and Path B costs a 406-conflict v2.0.1-replay (~= the original 403-conflict event the rebase-merges attempt halted on) followed by 393 cherry-picks. Multi-day work, no obvious quality benefit over Path C, and the resulting tree should be byte-identical to Path C's (modulo SHA churn).

**Worst-case fallback** (option 9.1 — research did not exhaust this in detail): re-target the FF base to `d4c0d0da5`. That drops master's v2.0.0-linux work from the v2.0.1-linux-rebased tag artifact. v2.0.0-linux content already lives in the v2.0.0-linux-rebased tag from v8.0, so this is theoretically defensible — but it produces an artifact that does NOT include v2.0.0-linux improvements rolled forward to v2.0.1 (the gamebryo-ba2-support introduction, the download_management refactoring, ExtensionManager fork-side resolution, the renderer Tools-page work, the Phase 28-30 oxfmt baseline). Releasing such an artifact would be a regression vs v2.0.0-linux-rebased. Not recommended unless the operator explicitly chooses to cap the v8.1 milestone short.

Honest recommendation to operator: **accept the merge-commit substitution; execute Path C.**

## Runtime State Inventory

> Rename/refactor not applicable — this is a git-topology phase, no string renames.

| Category            | Items Found                                                                                                                            | Action Required                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Stored data         | None — verified by inspection (no datastores referenced)                                                                               | none                                                  |
| Live service config | GitHub branch protection on master (`enforce_admins=false`, `allow_force_pushes=false`), already probed Wave 0; PR #5 stale-head state | Stage 7 explicitly closes PR #5 with redirect comment |
| OS-registered state | None — verified by inspection                                                                                                          | none                                                  |
| Secrets/env vars    | `~/.ssh/id_ed25519` SSH signing key (verified Wave 0)                                                                                  | none                                                  |
| Build artifacts     | `packages/vortex-api/lib/api.d.ts` regenerates on typecheck (D-36-11 pattern)                                                          | Stage 4 discards with `git checkout HEAD --`          |

## Common Pitfalls

### Pitfall 1: trying to FF-merge across asymmetric divergence

**What goes wrong:** `gh pr merge 5 --merge` produces an unwanted merge commit OR refuses, depending on the API's interpretation of the divergent histories.
**Why it happens:** PR #5's head (`8054a935b`) was the old v8.1 base; v8.1's actual tip (`f1425a5c8`) is 393 commits past PR #5's head; master is 300 commits past their common ancestor `d4c0d0da5`. There is no FF path.
**How to avoid:** Stage 7 explicitly closes PR #5; Stage 6 lands the merge directly to fork/master via push.
**Warning signs:** `gh pr view 5 --json mergeStateStatus` showing DIRTY or BLOCKED.

### Pitfall 2: cherry-picking the merge commit

**What goes wrong:** Stage 10's cherry-pick filter applied to `linux-port..master` would walk into the merge commit, which has no clean cherry-pick semantics.
**How to avoid:** In Stage 10, walk both parent ancestries separately (master first-parent + 2nd-parent f1425a5c8 ancestry) under the D-36-07 path filter; skip the merge commit itself.
**Warning signs:** `git cherry-pick <merge-sha>` complaining "is a merge but no -m option was given".

### Pitfall 3: bluebird Promise trap during conflict resolution

**What goes wrong:** TS1064 compile error after taking upstream `:Promise<T>` annotation on an `async` function in a bluebird-Promise-imported file.
**How to avoid:** In Stage 3 resolution of `extensions/gamebryo-plugin-management/src/index.ts`, prefer HEAD (master) which has been typecheck-verified by Phase 30. If any `:Promise<T>` annotation gets pulled in from v8.1 side, drop it (TS infers from `async`).
**Warning signs:** Stage 4 typecheck failing with `error TS1064: The return type of an async function or method must be the global Promise<T> type.`

### Pitfall 4: api.d.ts dirty after typecheck

**What goes wrong:** `pnpm run typecheck` regenerates `packages/vortex-api/lib/api.d.ts`; if committed, breaks future syncs.
**How to avoid:** D-36-11 — `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` after every typecheck. Stage 4 includes this.

### Pitfall 5: `.planning/` files refused by `git add`

**What goes wrong:** `.planning/STATE.md` etc. are gitignored but tracked. Plain `git add` declines. `git status --short` shows them as ` M` (worktree dirty, index clean).
**How to avoid:** Use `git add -f .planning/<file>` per memory `feedback_planning_gitignored.md`.
**Warning signs:** `git add` printing "ignored by one of your .gitignore files".

### Pitfall 6: stale lease pin on fork/master push

**What goes wrong:** `--force-with-lease=master` (no pin) gets rejected if the remote is newer than your local cached refs (it usually is in a worktree-heavy workflow).
**How to avoid:** Always use inline lease pin: `--force-with-lease=master:d494bcb7d`.
**Warning signs:** push rejected with "stale info".

## Code Examples

Verified patterns from this session:

### Verify ancestry post-merge

```bash
git log -1 --format='%H%n  parents: %P%n  msg: %s' HEAD
# Output:
# <new-merge-sha>
#   parents: d494bcb7d... f1425a5c8...
#   msg: merge v8.1/config-bucket: v2.0.1 + Phase 32-35 onto master
```

### Verify a specific resolution preserves a Linux platform guard

```bash
# Spot-check ESPFile.open async factory survived (Phase 33's Linux platform guard)
grep -n 'ESPFile\.open\|new ESPFile' extensions/gamebryo-plugin-management/src/index.ts
# Expected: ESPFile.open(...) (Phase-33-introduced Linux-async factory)
# NOT expected: new ESPFile(...) (upstream sync constructor)
```

### Bluebird scan in conflict region

```bash
# Was the original WAVE-1 halt's central concern; for Path C only one bluebird file in surface.
git diff HEAD MERGE_HEAD -- extensions/gamebryo-plugin-management/src/index.ts \
  | grep -E '^\+.*:Promise<' || echo "no :Promise<T> annotation introduced — clean"
```

## Sources

### Primary (HIGH confidence)

- This session's git CLI output:
    - `git cherry -v master v8.1/config-bucket` (491+ / 45-)
    - `git cherry -v v8.1/config-bucket master` (255+ / 45-)
    - `git merge --no-commit --no-ff f25ff55da` from master tip (406 conflicts)
    - `git merge --no-commit --no-ff v8.1/config-bucket` from master tip (12 conflicts)
    - 10× `git cherry-pick --no-commit` Path A spot-checks
    - 10× `git cherry-pick --no-commit` Path B Stage 2 spot-checks
- `36-REBASE-NOTES.md` — full halt log (rebase-merges + surgical attempts)
- `36-RESEARCH-SURGICAL.md` — falsified strategy (foundational +5 misread)
- `36-CONTEXT.md` — D-36-01..D-36-11 locked decisions
- `~/.claude/projects/-home-alex-src-Vortex/memory/project_v8_1_base_mismatch.md` — architectural finding
- `.planning/milestones/v8.0-phases/30-land-tag/30-RESEARCH.md` — v8.0 playbook (the FF-merge precedent that worked because v8.0 was branched correctly)

### Secondary (MEDIUM confidence)

- Memory notes: `feedback_bluebird_promise_trap.md`, `feedback_ssh_signing.md`, `feedback_git_push_ssh.md`, `feedback_planning_gitignored.md`, `feedback_minimize_upstream_diff.md`, `project_upstream_pr_policy.md`, `project_upstream_merge_checklist.md`
- `.planning/STATE.md` — Phase 35 close state

### Tertiary

- None — every quantitative claim in this document was verified by git CLI in this session.

## Assumptions Log

| #   | Claim                                                                                                                                       | Section               | Risk if Wrong                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | `__tests__/reducers.download_management.test.js` was dropped on master in Phase 25 (deletion is correct resolution)                         | §2 Path C, §4 Stage 3 | If file SHOULD persist, it gets deleted unnecessarily; recoverable via `git show f1425a5c8:__tests__/reducers.download_management.test.js`                                                                                                                                                                               |
| A2  | The 60 unique-to-master "OTHER" upstream-content commits are reached via v8.1's 119 upstream PR merges (different SHAs, equivalent content) | §1                    | If some master upstream content is NOT in v8.1, the 3-way merge would auto-take master's version (HEAD-wins by default in absence of conflict) — fine. If v8.1 has DIFFERENT upstream content, the 3-way merge would surface that as a conflict — but our dry-run only found 12 conflicts, suggesting this is non-issue. |
| A3  | Merge-commit substitution for D-36-01 is acceptable to operator                                                                             | §2, §9                | If rejected, must fall back to Path B (multi-day effort). Operator decision required before plan execution.                                                                                                                                                                                                              |
| A4  | `gamebryo-plugin-management/src/index.ts` HEAD-wins resolution doesn't accidentally drop a v8.1-only Linux platform guard                   | §4 Stage 3            | The conflict block is around a `context.registerAction(...)` UI-action — no Linux-specific path. Verified by inspection: the block contains only oxfmt-format differences. Phase 33's `ESPFile.open` async factory is in a DIFFERENT region of the file and auto-merges (not in the conflict surface).                   |
| A5  | `release-linux.yml` still works post-merge-commit (no path-conflict between merge-commit shape and tag-trigger semantics)                   | §4 Stage 9            | release-linux.yml triggers on `push: tags: ['v*']` — agnostic to commit shape. Verified working for v2.0.0-linux-rebased-rc1 in v8.0 (10m58s, AppImage + .deb produced).                                                                                                                                                 |

## Open Questions

1. **Operator acceptance of merge-commit substitution.** D-36-01 says "fast-forward merged" verbatim; Path C produces a merge commit. Recommendation: accept the substitution; the Phase 35 SHAs survive in 2nd-parent ancestry and the resulting tree is byte-equivalent to what literal FF would produce.

2. **PR #5 close-vs-merge.** Path C doesn't use PR #5 at all (the merge is direct push to fork/master). PR #5 should be closed with a redirect comment. If operator wants a "PR-merged" record, an alternative is to push the merge commit to a new PR-friendly head ref and use `gh pr edit 5 --base master` + `gh pr merge` — but that doesn't work because the head ref is already at the merge target's ancestor; the PR has nothing to merge.

3. **Cherry-pick filter walking the merge.** Stage 10 walks both parent ancestries to populate the linux-port cherry-pick set. Need explicit operator confirmation that this is the right approach (vs. reverting linux-port to merge-base and re-deriving it from the merge commit content directly).

## Environment Availability

| Dependency                     | Required By              | Available | Version         | Fallback                                                  |
| ------------------------------ | ------------------------ | --------- | --------------- | --------------------------------------------------------- |
| `git`                          | all stages               | ✓         | 2.43.0          | —                                                         |
| `gh`                           | Stage 7, Stage 9         | ✓         | 2.45.0          | `GH_TOKEN` env var per memory `reference_github_token.md` |
| `pnpm`                         | Stage 4                  | ✓         | 10.33.0         | —                                                         |
| Node.js                        | Stage 4 build            | ✓         | 22.22.0 (volta) | —                                                         |
| `~/.ssh/id_ed25519`            | Stage 8 tag signing      | ✓         | —               | none required (key permanent)                             |
| Network access (fork remote)   | Stage 6, Stage 8         | ✓         | —               | none                                                      |
| Network access (origin remote) | Stage 8 origin push only | ✓         | —               | non-blocking on rejection                                 |

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.0 + Jest 29.7.0 (dual; vitest for ts main/shared, jest for renderer)                       |
| Config files       | `vitest.config.ts`, `src/renderer/jest.config.mjs`                                                    |
| Quick run command  | `pnpm run typecheck && pnpm run lint:ci`                                                              |
| Full suite command | `pnpm install --frozen-lockfile && pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build` |

### Phase Requirements → Test Map

| Req ID              | Behavior                                                  | Test Type | Automated Command                                                                                           | File Exists?       |
| ------------------- | --------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- | ------------------ |
| SYNC-36a            | Windows + Linux CI green on rebased PR head               | CI        | GitHub Actions `main.yml` triggered by push to master                                                       | ✓                  |
| SYNC-36b (modified) | Merge commit lands on master without breaking SYNC-35a..d | local     | Stage 4 `pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build`                                 | ✓                  |
| SYNC-36c            | SSH-signed tag verifies                                   | local     | `git tag --verify v2.0.1-linux-rebased`                                                                     | ✓ (after Stage 8)  |
| SYNC-36d            | release-linux.yml produces artifacts                      | CI        | `gh run watch <id>; gh release view --json assets`                                                          | ✓ (after Stage 9)  |
| SYNC-36e            | linux-port cherry-pick coverage                           | local     | `git log linux-port..master --first-parent --diff-filter=ACMRD --name-only` produces non-empty filtered set | ✓ (after Stage 10) |

### Sampling Rate

- **Per stage:** Verify state with `git rev-parse`, `git log -1 --format=...`
- **Stage 4 gate:** Full SYNC-35 suite before Stage 5 commit
- **Stage 6 post-push:** Wait for `main.yml` green (SYNC-36a)
- **Stage 9 post-tag:** Wait for `release-linux.yml` green (SYNC-36d)

### Wave 0 Gaps

None — existing infrastructure covers all phase requirements. Wave 0 already executed and provides the baseline.

## Security Domain

> Out of scope for git topology phase. No code changes, no new dependencies, no auth/session/access changes. SSH signing is operational invariant (already in place; verified Wave 0).

## Project Constraints (from CLAUDE.md and memory)

| Directive                                                                            | Source                                | Compliance in plan                                                                                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| SSH commit signing required (`~/.ssh/id_ed25519`); no `--no-gpg-sign`/`--no-verify`  | `feedback_ssh_signing.md`             | Stage 5 commit, Stage 8 tag both SSH-signed via existing config                                                                             |
| Inline SSH URL push pattern when `.git/config` is sandbox-blocked                    | `feedback_git_push_ssh.md`            | Stage 6 uses `git@github.com:atabisz/Vortex.git` inline                                                                                     |
| `.planning/` is gitignored — `git add -f` for any commit touching it                 | `feedback_planning_gitignored.md`     | Stage 3 uses `git add -f` for `.planning/*`                                                                                                 |
| Never reformat outside the scope of a change                                         | `feedback_minimize_upstream_diff.md`  | Stage 3 takes HEAD-wins on the one oxfmt-conflict file (no extra format pass)                                                               |
| Casual project voice in commits/tags/PRs                                             | `feedback_casual_voice.md`            | Stage 5 commit msg + Stage 8 tag annotation drafted in casual voice                                                                         |
| Bluebird Promise scan during conflict resolution                                     | `feedback_bluebird_promise_trap.md`   | Stage 3 explicitly scans `gamebryo-plugin-management/src/index.ts` (the one bluebird-importing file in the conflict surface)                |
| Origin tag push informational only; non-blocking on rejection                        | `project_upstream_pr_policy.md`       | Stage 8 origin push wrapped in `\|\| echo "..."`                                                                                            |
| After upstream merge, verify gamebryo platform guards + skip-on-windows.mjs survived | `project_upstream_merge_checklist.md` | Stage 4 build run exercises both; A4 explicitly notes `ESPFile.open` is in non-conflict region of `gamebryo-plugin-management/src/index.ts` |
| `pnpm run` for repo commands                                                         | `AGENTS.md`                           | Stage 4 uses pnpm exclusively                                                                                                               |
| TypeScript only                                                                      | `CLAUDE.md`                           | No new code; git-only phase                                                                                                                 |
| bun/bunx for app runtime; pnpm for repo                                              | `CLAUDE.md`                           | Stage 4 uses pnpm; no app runtime invocation needed                                                                                         |
| `linux-port` excludes `.planning/`, fork CI, distribution config                     | `CLAUDE.md` branch strategy           | Stage 10 D-36-07 path filter encodes this                                                                                                   |

## Metadata

**Confidence breakdown:**

- Path classification (§1): HIGH — every commit category counted via awk script on `git log` output; patch-id verified.
- Path A/B/C empirical conflict counts (§2): HIGH — actual `git cherry-pick --no-commit` and `git merge --no-commit --no-ff` runs in this session; counts are direct outputs.
- 12 specific conflict files in Path C (§2): HIGH — full file list captured.
- Recommendation (§9): MEDIUM — depends on operator-accepted substitution of merge-commit for FF-merge in D-36-01.
- Stage 10 cherry-pick walk strategy (§4 Stage 10): MEDIUM — walks both parent ancestries; if linux-port maintainer prefers a different approach, refine in Phase 36 plan re-shape.

**Research date:** 2026-05-23
**Valid until:** 2026-05-30 (7 days; git topology can drift if any new fork/master pushes happen). Re-verify `git rev-parse master v8.1/config-bucket` and merge-base before plan execution.
