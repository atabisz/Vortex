# Phase 36 Rebase Notes

**Pre-rebase state (verified Wave 0, 2026-05-23T00:32:08Z):**

- Local master: `d494bcb7d090bdf311f8e5b1cc7cfb418b009726`
- fork/master: `d717c09c38f04ccfd8084e61ae61cbce01162a1a`
- fork/sync/upstream-v2.0.1: `8054a935b6aad505798bba8a993d002718d119cb`
- fork/linux-port: `6a28945d153ee9a7ca604d5c673eb5bd61c33e13`
- Local v8.1/config-bucket: `f1425a5c810794b8325db624d97da9abc106ad90`
- Pitfall 12 merge-commits in v8.1: **120** ⚠️ ESCALATION
- v2.0.1\* tags on fork: **none** (D-36-06 confirmed, no RC cleanup)

**Branch-protection probe (Task 7, A1 gate):**

- `enforce_admins`: `false`
- `required_pull_request_reviews`: `1` review required (PR-merge-API only)
- `restrictions`: `null` (no push allowlist)
- `allow_force_pushes`: `false`
- `allow_deletions`: `false`
- `required_signatures.enabled`: `false`
- **Direct-push disposition:** **UNBLOCKED**

    Rationale: per RESEARCH §1.2 + plan disposition table, `enforce_admins=false` + non-null `required_pull_request_reviews` means the review constraint applies only to the `gh pr merge` API path. Direct push by atabisz to fork/master remains open. Phase 35 closeout commit `f1425a5c8` empirically landed on fork/master via direct push, confirming the path was open then; this probe confirms nothing has changed.

**Drift findings (vs CONTEXT line 112):**

- CONTEXT labelled `fork/master = d494bcb7d` and "local master +5 ahead at d717c09c3". Live state is the inverse: `fork/master = d717c09c3` and `local master = d494bcb7d` (still +5 ahead semantically — `d494bcb7d` is `d717c09c3 + 5 fork-only milestone v8.1 setup commits`). The 5 commits are: `d494bcb7d ca492c3b6 ada4801ca c77077559 2539caff5` (all docs/milestone setup).
- D-36-03 stands as written: push local master (`d494bcb7d`) to fork/master, lease-pinned to `d717c09c3`. The plan's "no-op" prediction for Task 3 is invalidated; Wave 1 must execute the lease-pinned push (RESEARCH §1.1 fallback).

**Pitfall 12 ESCALATION (Task 6):**

- `git log --merges master..v8.1/config-bucket --oneline | wc -l` → **120**
- Default `git rebase master` will flatten these merge commits, losing the upstream PR merge topology and the `aa3faf7e5 merge upstream v2.0.1 (conflicts)` resolution.
- **Action required before Wave 1:** decide between:
    1. `git rebase --rebase-merges master` to preserve merge topology (Wave 1 plan needs to incorporate this flag and re-derive expected conflict surface).
    2. Surgical re-shape (drop merges + replay individual merge-resolution commits) — significantly more risk.
    3. Accept flattening (changes the topology — likely not what we want, since the PR `8054a935b` is the merge target and was merged-in via `aa3faf7e5` deliberately).
- Sample of merge commits (top 20 of 120):
    - `aa3faf7e5 merge upstream v2.0.1 (conflicts)` ← v8.1's central merge of v2.0.1
    - 119 upstream Nexus-Mods PR merges (`f25ff55da .. 6c44f31d3`)
- See plan §"Risks / contingencies" line 199 for escalation language.

**Tools verified (Task 9):**

- `gh` 2.45.0 (≥ 2.45.0 OK)
- `pnpm` 10.33.0 (= floor)
- `git` 2.43.0 (≥ 2.34 for `gpg.format=ssh` — OK)

**SSH signing (Task 4):**

- `gpg.format=ssh` ✅
- `tag.gpgsign=true` ✅
- `user.signingkey=/home/alex/.ssh/id_ed25519.pub` ✅
- `~/.ssh/id_ed25519` readable ✅

**`gh auth` (Task 5):**

- `atabisz` keyring auth alive; scopes `gist, read:org, repo, workflow`. `GH_TOKEN` fallback NOT needed.

**`release-linux.yml` Pitfall 9 chmod step (Task 8):**

- Lines ~55–67: chmod step **PRESENT** (`Fix pnpm-bundled node-gyp script permissions` job).

**PR #5 state (sanity probe):**

- state=OPEN, mergeable=CONFLICTING, mergeStateStatus=DIRTY, headRefOid=`8054a935b...`, baseRefName=master. Matches CONTEXT line 116.

## D-36-03 fork/master push

- **Pre-push fork/master:** `d717c09c38f04ccfd8084e61ae61cbce01162a1a` (lease pin, verified live just-in-time)
- **Local master pushed:** `d494bcb7d090bdf311f8e5b1cc7cfb418b009726`
- **Post-push fork/master:** `d494bcb7d090bdf311f8e5b1cc7cfb418b009726` (== local master)
- **Push command:** `git push --force-with-lease=master:d717c09c3 git@github.com:atabisz/Vortex.git master:master`
- **Status:** OK — 5 fork-only milestone v8.1 setup commits landed (`d494bcb7d ca492c3b6 ada4801ca c77077559 2539caff5`)
- **Remote response:** branch-protection bypass triggered (admin override on atabisz fork — "Bypassed rule violations for refs/heads/master: Changes must be made through a pull request"). Wave 0 disposition UNBLOCKED held.

## Wave 1 rebase attempt — HALTED (operator review required)

**Started:** 2026-05-23T00:38Z (UTC)
**Halted:** 2026-05-23T00:42Z
**State at halt:** rebase aborted, working tree clean, `v8.1/config-bucket` HEAD = `f1425a5c8` (unchanged)
**Trigger:** halt condition "Any conflict resolution requires non-trivial judgment beyond fork-side default + bluebird scan"

### Progress before halt

- Rebase strategy: `git rebase --rebase-merges master` (mandatory, 120-merge preservation)
- Total steps: 909 (rebase-merges expanded the 656 commits + 120 merges + label/reset directives)
- Auto-applied: ~516 steps cleanly (with conflict resolution loop on 4 small conflict batches)
- **HALT POINT: step 517/909 = replay of `aa3faf7e5 merge upstream v2.0.1 (conflicts)` — the central merge of v8.1**

### Conflicts auto-resolved cleanly before halt (fork-side default, bluebird-clean)

| Step | File(s)                                                                                                                                                 | Resolution                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 121  | `CHANGELOG.md`                                                                                                                                          | --theirs                                                                |
| 170  | `src/renderer/src/views/pages/Tools/{ToolRow,index}.tsx`                                                                                                | --theirs (later collided with AA on same files at step 517 — see below) |
| 393  | `.github/actions/fingerprints/dist/index.js`, `.github/actions/fingerprints/src/collect-input.test.ts`                                                  | --theirs                                                                |
| ~450 | `pnpm-lock.yaml`                                                                                                                                        | --theirs                                                                |
| ~470 | `CHANGELOG.md` (again)                                                                                                                                  | --theirs                                                                |
| ~510 | `.github/workflows/main.yml`, `.oxfmtrc.json`, `CHANGELOG.md`, `CLAUDE.md`, `CONTRIBUTE.md`, `README.md`, `docs/native-node-module-management.md`, etc. | --theirs                                                                |

All 5 files above were bluebird-clean (no `import Promise from "bluebird"` usage).

### Why halted at step 517 — the `aa3faf7e5` merge replay

When `git rebase --rebase-merges` reaches the merge directive for `aa3faf7e5 merge upstream v2.0.1 (conflicts)`, it re-runs the original merge of upstream v2.0.1 against the post-Phase-33/34/35 master tip. This produced **403 conflicts in a single step**, including:

- 375 UU files (both modified)
- 28 AA files (both added) — including the entire `.github/actions/fingerprints/`, `.github/workflows/fingerprint-*.yml`, `.github/workflows/format.yml`, baldursgate3 `divineCore.ts`, `scripts/download-duckdb-extensions.ts`, the new `views/pages/Tools/*` set
- **5 bluebird-Promise files** in `extensions/gamebryo-*`:
    - `extensions/gamebryo-plugin-management/src/index.ts` (16 conflict hunks)
    - `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts`
    - `extensions/gamebryo-plugin-management/src/util/gameSupport.ts` (2 hunks)
    - `extensions/gamebryo-plugin-management/src/views/PluginList.tsx`
    - `extensions/gamebryo-savegame-management/src/index.ts`

Spot-check of `extensions/gamebryo-plugin-management/src/index.ts` revealed the structural problem with the blanket fork-side rule:

```
<<<<<<< HEAD                                              (master = post-Phase-35)
const esp = await ESPFile.open(pluginStates[pluginId].filePath, gameId);
=======
const esp = new ESPFile(                                  (refs/rewritten/merge-upstream-v2-0-1-conflicts-)
  pluginStates[pluginId].filePath,
  gameId,
);
>>>>>>> refs/rewritten/merge-upstream-v2-0-1-conflicts-
```

- HEAD (= master = `d494bcb7d`, includes Phase 33-34-35 work) uses `await ESPFile.open(...)` — the **Linux-async factory** introduced by Phase 33 platform-guard work for gamebryo plugin loading on Linux.
- The merge-replay side reverts to upstream's synchronous `new ESPFile(...)` constructor — which would **regress Phase 33's Linux platform guard** and break gamebryo plugin loading on Linux.

This is the "fork-side ambiguity" problem: D-36-02 says "fork-side default = --theirs during rebase". But here, **master IS the canonical fork-side** — it contains 6 months of Phase 33/34 conflict-resolution commits (`resolve(renderer-views):...`, `resolve(renderer-extensions):...`, `resolve(checkpoint):...`, gamebryo guards, etc., including `resolve(renderer-views): views/pages/Tools/useToolsData.ts — smaller-diff` etc.) — and `aa3faf7e5` on the v8.1 side carries the _unresolved/upstream-leaning_ state from before Phase 33-34.

D-36-02 has an exception clause that almost matches: "if a file was restored-from-master in earlier v8.1 phases (e.g. `packages/paths{,-node}/src/`) — prefer master-side via `--ours` because that IS the canonical content". But the exception assumed the surface was small (`packages/paths*` only). At step 517 the surface is 403 files spanning the whole renderer/extensions tree, and per-file the right answer is genuinely a judgement call (sometimes `--ours` because master has the Linux guard, sometimes `--theirs` because the file is upstream-only new code, sometimes hybrid).

This crosses the **halt condition**: "Any conflict resolution requires non-trivial judgment beyond fork-side default + bluebird scan."

### Recovery state

- `git rebase --abort` succeeded; `v8.1/config-bucket` HEAD = `f1425a5c8` (unchanged).
- Working tree clean.
- **Task 0 (D-36-03 fork/master push) was already executed and IS NOT REVERSED** — `fork/master` is now `d494bcb7d` (correct, == local master). This part of Wave 1 is complete and load-bearing for Wave 2.
- Force-push to `fork/sync/upstream-v2.0.1` was **NOT** executed (we never made it past rebase).
- PR #5 mergeability state is unchanged (still CONFLICTING per pre-Wave-1 state).

### Operator decision tree (paths forward, in increasing-effort order)

1. **Re-plan Wave 1 with explicit per-file resolution policy for the central `aa3faf7e5` merge replay.** Add a researcher pass that pre-classifies the 403 conflicts in the central merge by class (gamebryo Linux-guarded → `--ours`; AA new-files → `--theirs`; renderer-views Phase-33-resolved → `--ours`; etc.), generates a per-file resolution manifest, then re-runs Wave 1 with the manifest as input.
2. **Surgical re-shape (mentioned in plan §"Risks / contingencies"):** drop the `aa3faf7e5` merge directive from the rebase todo and replay only the _post_-merge v8.1 commits (Phase 32-35 work) that we actually want, since those land on top of master cleanly. This linearises the upstream-PR-merge topology (sacrifices 119 of the 120 merges and the central merge) but preserves Phase 32-35 work atop master's already-resolved state.
3. **Accept flattening (plan §"Risks / contingencies" option 3):** plain `git rebase master` (no `--rebase-merges`). Same 403-conflict step still appears as a regular cherry-pick, same judgement still required, but topology is intentionally flattened. Doesn't fix the conflict-resolution problem — only the topology aspect.
4. **Lazy-merge alternative (not in current plan):** instead of rebase + FF, do `git merge --no-ff sync/upstream-v2.0.1` from master, accept the resulting merge commit (single merge resolution rather than 656 individual replays), tag the merge commit. Sacrifices D-36-01 "FF-merge preserves Phase 35 evidence chain SHAs" — the 5 Phase 35 commits would survive but their SHAs change differently.

Recommended: Path 1 — researcher pre-classifies the 403 conflicts, then a Wave 1.5 plan executes the rebase with the manifest, then Wave 2 proceeds as planned. The bluebird-trap workflow alone covers 5 of the 403 files; the other 398 need similar per-class judgement that should not be invented mid-rebase.

### Bluebird-trap inventory (for the manifest)

5 files in the central-merge conflict surface that import bluebird Promise. Each must be reviewed for any `:Promise<T>` annotation on async functions taken from upstream side; if found, drop the annotation (TS infers from `async`). Per-file paths captured above. None were resolved during this attempt — rebase aborted before reaching them in the per-file resolution loop.

### CI / remote state at halt

- `fork/master` = `d494bcb7d` ✅ (Task 0 push succeeded)
- `fork/sync/upstream-v2.0.1` = `8054a935b` (unchanged — Task 7 force-push never ran)
- PR #5 head = `8054a935b`, mergeable = CONFLICTING (unchanged)
- No CI runs triggered by Wave 1 (push to `master` does not run main.yml on a tag-only flow; release-linux is tag-triggered)
- No new commits authored by Wave 1; no SHAs to capture beyond Task 0

## Conflicts (per file)

<!-- Wave 1 appends one block per conflict with shape:
### path/to/file
- **Side picked:** ours | theirs | manual
- **Bluebird scan:** clean | hit (action taken)
- **Rationale:** <one line>
-->

## Surgical re-shape attempt — HALTED at Stage A5 (operator review required)

**Started:** 2026-05-23T (UTC, this session)
**Halted:** 2026-05-23T (UTC, this session — at Stage A5)
**State at halt:** working tree clean, on `v8.1/config-bucket` (`f1425a5c8`), snapshot tag `phase36/pre-surgical-snapshot` created locally (`f1425a5c8`), `master` unchanged at `d494bcb7d`. NO surgical branch created, NO squash, NO cherry-pick begun, NO push.
**Trigger:** Stage A5 gate explicitly fails — `git log v8.1/config-bucket..master --name-only --format= | sort -u | grep -v '^$' | grep -v '^\.planning/'` returned **319 non-`.planning/` paths** (gate requires empty).

### Foundational mismatch between research/plan assumptions and live repo state

`36-RESEARCH-SURGICAL.md` §1 line 26 claims:

> master `+5` ahead of v8.1's merge-base | all under `.planning/phases/31-config-bucket/`, `.planning/PROJECT.md` … | docs-only — verified via `git log v8.1/config-bucket..master --name-only`

This claim is empirically false as of the surgical execution attempt:

| Measurement                                                                          | Live value                              | Plan/research assumption |
| ------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------ |
| `git rev-parse master`                                                               | `d494bcb7d`                             | `d494bcb7d` ✅           |
| `git rev-parse v8.1/config-bucket`                                                   | `f1425a5c8`                             | `f1425a5c8` ✅           |
| `git merge-base master v8.1/config-bucket`                                           | `d4c0d0da5` (1st parent of `aa3faf7e5`) | `d4c0d0da5` ✅           |
| `git log v8.1/config-bucket..master --oneline \| wc -l`                              | **304**                                 | "5 docs commits" ❌      |
| `--no-merges` on the same range                                                      | **300**                                 | "5 docs commits" ❌      |
| `--merges` on the same range                                                         | **4**                                   | implied 0 ❌             |
| `git log v8.1/config-bucket..master --name-only \| sort -u \| grep -v '^.planning/'` | **319 non-.planning code paths**        | "empty (docs-only)" ❌   |
| docs-prefixed commits in the +304                                                    | 90 (≈30%)                               | implied 100%             |
| non-docs commits in the +304                                                         | 210 (≈70%)                              | implied 0%               |
| `git diff --name-only master v8.1/config-bucket` (whole-tree diff, code paths)       | **319**                                 | implied small/empty      |

The research's "+5" referred to the **5 most recent commits on master** (which ARE docs-only: 31-config-bucket plans + REQUIREMENTS/ROADMAP/STATE updates + milestone v8.1 setup). It did NOT correctly characterise the **300 commits between `d4c0d0da5` and `master` HEAD**, which include all of Phase 28-30 fork-side resolution work (`fix(30-01)`, `fix(30-04a)`, ~210 `resolve(...)` commits across renderer/extensions, gamebryo-ba2-support introduction, download_management deletions, oxfmt baseline, etc.).

Sample of code-touching commits on master that v8.1 does NOT have:

```
f570149ea fix(30-04a): SYNC-32-D — rewire DownloadObserver against new download API
fb5930c08 fix(30-01): adopt master superset of pnpm-workspace + package.json + lockfile
07c519711 fix(30-01): adopt master superset of IState.ts + useToolsData.ts selectors
a5c057507 chore(format): oxfmt baseline cleanup pre-merge
bb8c13c54 resolve(docs): etc/vortex.api.md — fork-wins
fe283fe9e resolve(scripts): download-duckdb-extensions.test.ts — fork-wins
df5d29234 resolve(scripts): download-duckdb-extensions.ts — fork-wins
020cf3273 fix(renderer): views/components/Menu/useToolsData.ts — drop duplicate pinnedToolsMap
5a7709021 resolve(renderer): ExtensionManager.ts — fork-wins
da87a20b3 resolve(renderer): views/pages/Tools/index.tsx — fork-wins
cbc69d768 resolve(renderer): views/pages/Tools/useToolsPage.ts — fork-wins
e1fe734cb resolve(renderer): views/pages/Tools/useToolsData.ts — fork-wins
… ~200 more resolve()/fix()/chore(format) commits in the same shape …
```

Files that exist in master's tree but NOT in v8.1/config-bucket's tree (sample):

```
.github/workflows/package.yml
.github/workflows/update-api-tag.yml
extensions/gamebryo-ba2-support/package.json
extensions/gamebryo-ba2-support/src/index.ts
src/main/src/downloading/chunking.ts
src/renderer/src/extensions/download_management/DownloadManager.ts
src/renderer/src/extensions/download_management/DownloadObserver.ts
src/renderer/src/extensions/download_management/FileAssembler.ts
src/renderer/src/extensions/download_management/SpeedCalculator.ts
```

(These are paths where master has the file and v8.1 doesn't — meaning v8.1's `aa3faf7e5` merge-resolution + Phase 32-35 work either deleted them OR they were added on master AFTER v8.1 forked. Some of v8.1's deletes are intentional — e.g. `e2127cecb chore(download_management): drop dead DownloadManager + DownloadObserver`. So the symmetric difference is more nuanced than "master is a strict superset".)

### Why this falsifies the surgical plan as written

Stage C of the plan is `git read-tree --reset -u f25ff55da` — atomically replacing the index + working tree with upstream v2.0.1's tree (`f25ff55da`) on top of master. This is the squash commit. It only produces a sound result if the underlying expectation holds: that `master` and `aa3faf7e5`'s 1st parent (`d4c0d0da5`) carry the same fork-side state, so substituting `f25ff55da`'s tree gives content equivalent to `aa3faf7e5`'s post-merge tree (modulo the 5 docs commits).

Live state breaks that expectation: master diverged from `d4c0d0da5` by 300 commits = ~210 fork-side code commits + 90 docs commits. `read-tree --reset -u f25ff55da` would silently overwrite all of that — Phase 28-30 work, the gamebryo-ba2-support introduction, the download_management refactoring, ExtensionManager fork-side resolution, the renderer Tools-page work, the oxfmt baseline. The squash commit's diff vs master would be ~278 file modifications PLUS additions/deletions, but only ~2350 of those would be from upstream v2.0.1; the other ~278 would be silent reverts of master's Phase 28-30 work.

After Stage D's 393 cherry-picks, the resulting tip would NOT match `phase36/pre-surgical-snapshot` (= `f1425a5c8`) on code paths, because Phase 32-35 work was authored against `aa3faf7e5`'s post-merge tree (which had upstream-leaning resolutions baked in for the `aa3faf7e5` step), not against master's Phase-28-30-resolved tree. Stage E's tip-tree-parity gate (`git diff --name-only phase36/pre-surgical-snapshot HEAD | grep -v '^.planning/'` MUST be empty) would fail.

### Why this also reframes the original 403-conflict halt at `aa3faf7e5`

The previous Wave 1 halt log (top of this file) attributes the 403-conflict failure of `git rebase --rebase-merges master` to "the rebase base shifted away from `d4c0d0da5`". That diagnosis was correct in shape but understated in magnitude: the rebase base is **300 commits past `d4c0d0da5`**, not just 5. The 403 conflicts are the natural consequence of trying to replay `aa3faf7e5`'s upstream-v2.0.1 merge against a fork-side tree that's already absorbed Phase 28-30 work — which itself contains many of the same fork-side resolutions Phase 32-35 then re-derived.

The surgical strategy hoped to bypass this by replacing the merge replay with `read-tree --reset -u`. But `read-tree` doesn't 3-way merge — it just overwrites — so the 403-conflict event is replaced with **silent loss** of Phase 28-30 work, then surfaces at Stage E gates as code-path tree mismatch (or worse: as silent regressions that pass gates but fail on Linux runtime).

### Recovery state

- `git rebase --abort` was a no-op (no rebase in progress).
- Working tree clean.
- `v8.1/config-bucket` HEAD unchanged at `f1425a5c8`.
- Snapshot tag `phase36/pre-surgical-snapshot` created locally at `f1425a5c8` (NOT pushed; Stage F never ran).
- No surgical branch created (`v8.1/config-bucket-surgical` does not exist).
- No squash commit, no cherry-picks, no force-push, no PR change.
- `fork/master` = `d494bcb7d` (load-bearing for any future Wave 2 plan).
- `fork/sync/upstream-v2.0.1` = `8054a935b` (unchanged).
- PR #5 state unchanged: CONFLICTING.

### Open questions for operator

1. **Is the actual desired end-state for v8.1/config-bucket "rebased onto current master"?** If yes, the plan must account for replaying or skipping Phase 28-30 work that's already on master — the 656-commit diff includes a lot of conflict-resolution work that master ALSO did, just at different SHAs. Cherry-pick chain length would balloon and conflict density would be high.
2. **Or is the desired end-state "v8.1 sits at `d4c0d0da5` baseline + upstream v2.0.1 + Phase 32-35 work"** — i.e. master (`d494bcb7d`) is wrong as the rebase target and we should be targeting `d4c0d0da5` or some earlier ref? In that case the lease pin / FF-merge target / PR #5 base ref need to be reconsidered.
3. **Or is the desired end-state "merge upstream v2.0.1 onto master via a regular merge commit"** (path 4 in the previous halt's decision tree)? This would skip the rebase entirely and accept the merge SHA, sacrificing the 393-pick traceability but landing v2.0.1 + Phase 32-35 onto master in one operation.
4. **Should Phase 36 be re-scoped to first FF-land Phase 28-30's master state into v8.1**, then attempt the v2.0.1 merge from a fresh post-Phase-30 baseline? That converts the divergence into a forward-only sync rather than a rebase.

The original 656-commit / 263-merge / 403-conflict numbers all stand — but the underlying assumption "post-`aa3faf7e5` chain is linear and Phase 32-35 cleanly cherry-picks onto master+v2.0.1" was authored against a misread of how far master has moved. Re-research required before any further re-shape attempt.

### What the surgical attempt actually produced

- One unsigned local annotated tag: `phase36/pre-surgical-snapshot` → `f1425a5c8` (kept; no harm, useful for any future strategy as the original-tip rollback target).
- No commits, no remote changes, no working-tree changes.

To remove the snapshot tag if the operator prefers a clean state:

```bash
git tag -d phase36/pre-surgical-snapshot
```

---

## Forward-sync merge (SYNC-36a)

Path C executed 2026-05-23. 3-way merge from `v8.1/config-bucket` (`f1425a5c8`) into master (`d494bcb7d`) on working branch `v8.1/config-bucket-fwd`.

### Merge commit

- **SHA:** `c4d1b4555c06f4b549b2c2169a754918edb64530`
- **1st parent:** `d494bcb7d090bdf311f8e5b1cc7cfb418b009726` (master tip pre-merge)
- **2nd parent:** `f1425a5c810794b8325db624d97da9abc106ad90` (v8.1/config-bucket tip; Phase 35 evidence anchor)
- **Signature:** SSH-signed (`gpgsig` block count = 1)
- **Diff:** 317 files changed, 44966 insertions(+), 1023 deletions(-)
- **Snapshot tags:** `phase36/master-pre-merge` (= `d494bcb7d`), `phase36/pre-surgical-snapshot` (= `f1425a5c8`)

### Conflict resolution (12 files, per Path C plan §2)

| File                                                 | Resolution             | Notes                                                                                                                                                |
| ---------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extensions/gamebryo-plugin-management/src/index.ts` | `--ours` (HEAD/master) | Bluebird-import file; no `:Promise<T>` annotation in conflict region (R7 trap clear); HEAD-wins preserves master's Phase 30 typecheck-verified state |
| `src/renderer/src/util/elevated.ts`                  | `--theirs` (v8.1)      | Single-line: v8.1 added `import { log } from "../logging";`                                                                                          |
| `__tests__/reducers.download_management.test.js`     | `--theirs` (v8.1)      | master kept the file via `a5c0575075` "chore(format): oxfmt baseline cleanup pre-merge"                                                              |
| `.planning/config.json`                              | manual reconcile       | Kept BOTH: `_auto_chain_active: true` (v8.1) + `use_worktrees: false` (master)                                                                       |
| `.planning/STATE.md`                                 | `--theirs`             | v8.1 had live state                                                                                                                                  |
| `.planning/ROADMAP.md`                               | `--theirs`             | v8.1 had Phase 31-35 progress                                                                                                                        |
| `.planning/PROJECT.md`                               | `--theirs`             | v8.1 had milestone state                                                                                                                             |
| `.planning/MILESTONES.md`                            | `--theirs`             | v8.1 milestone tracking current                                                                                                                      |
| `.planning/REQUIREMENTS.md`                          | `--theirs`             | v8.1 was live                                                                                                                                        |
| `AGENTS-DEBUGGING.md`                                | `--theirs`             | v8.1 was newer                                                                                                                                       |
| `structure.md`                                       | `--theirs`             | v8.1 was newer                                                                                                                                       |
| `packages/paths/README.md`                           | `--theirs`             | v8.1 was newer                                                                                                                                       |

### Pre-commit gates (SYNC-35 evidence; all exit 0)

- `pnpm run typecheck` → exit 0 (`artifacts/post-merge-typecheck.txt`)
- `pnpm run lint:ci` → exit 0 (`artifacts/post-merge-lint.txt`)
- `pnpm run test` → exit 0 (`artifacts/post-merge-test.txt`)
- `pnpm run build` → exit 0 (`artifacts/post-merge-build.txt`)
- `pnpm run build:extensions` → exit 0 (`artifacts/post-merge-build-extensions.txt`)
- bundledPlugins floor: 133 ≥ 130 ✓

### Push (lease-pinned)

```bash
git push --force-with-lease=master:d494bcb7d090bdf311f8e5b1cc7cfb418b009726 \
  git@github.com:atabisz/Vortex.git \
  v8.1/config-bucket-fwd:master
```

Result: `d494bcb7d..c4d1b4555  v8.1/config-bucket-fwd -> master` (FF-only as planned).

### CI outcomes

- **Main run #26322685477** ([url](https://github.com/atabisz/Vortex/actions/runs/26322685477)) — overall: failure
    - **Linux (ubuntu-latest):** healthy through `paths:build` ✅, 70+ green NX tasks, then _cancelled_ by Windows fail-fast (matrix `cancel-in-progress`). No Linux-side failure.
    - **Windows (windows-latest):** 2 failure modes observed across initial run + re-run:
        1. **First run:** rolldown `[PLUGIN_TIMINGS]` warning escalated to error in `@vortex/paths:build` (61% time in `rolldown-plugin-dts:generate`). Output bytes (40.63 kB d.cts) match pre-merge baseline — pure runner-load timing flake.
        2. **Re-run:** `paths:build` ✅ (confirms #1 was a flake), but `extensions/gamebryo-ba2-support build` ELIFECYCLE — this is `extensions/skip-on-windows.mjs` exiting 1 by design (BA2 native bindings are Linux-only). **Pre-merge master `f570149e` had the identical Windows failure** (job 77323842914). **Pre-existing fork condition; not introduced by the merge.**
    - **api job:** skipped (gated on `github.repository == 'Nexus-Mods/Vortex'`; expected on fork).
- **PR Maintenance run #26322685486** ([url](https://github.com/atabisz/Vortex/actions/runs/26322685486)) — success ✓
- **Release Linux run #26322799329** ([url](https://github.com/atabisz/Vortex/actions/runs/26322799329)) — skipped (tag-gated; expected, fires in Wave 4 after `v2.0.1-linux-rebased` tag push).

### Disposition

**Merge accepted; advance to Wave 2.**

- Linux delivery target (the fork's actual ship platform): GREEN, locally and on CI up to fail-fast cancel.
- Windows: pre-existing `skip-on-windows.mjs` ELIFECYCLE pattern unchanged from pre-merge master. Out of scope for v2.0.1 land+tag; tracked as fork-local pattern issue for a later phase (e.g. swap to `pnpm --filter !./extensions/gamebryo-ba2-support run build` on Windows, or replace exit-1 sentinel with `--if-present` filter, or add a per-extension Windows-skip flag in `BuildSubprojects.json`).

### Discarded files post-typecheck

Per D-36-11 (avoid generated-file drift on the merge commit):

- `packages/vortex-api/lib/api.d.ts` — restored to `HEAD` (api-extractor regen)
- `etc/vortex.api.md` — restored to `HEAD` (api-extractor regen)
- `etc/Dependency Report.md` — restored to `HEAD`
- Local `.planning/STATE.md` regression — discarded (operator-authorized)

### Operator-accepted deviations

- **D-36-01:** "FF-merge" → "merge --no-ff to land + tag the merge commit" (Path C accepted; no fast-forward path existed across the v8.1 base mismatch at `d4c0d0da5`).
- **D-36-07:** Path-based cherry-pick filter deferred to Wave 5 (`--no-merges` walk of `merge-base(linux-port, master)..post-merge-master` per CONTEXT.md).

## PR #5 close (SYNC-36a part 2)

- **Date:** 2026-05-23T04:38:19Z
- **Merge commit (Wave 1):** `c4d1b4555c06f4b549b2c2169a754918edb64530`
- **fork/master:** `c4d1b4555c06f4b549b2c2169a754918edb64530` (== merge SHA ✓)
- **local master:** `c4d1b4555c06f4b549b2c2169a754918edb64530` (== merge SHA ✓)
- **Phase 35 evidence preserved:** PASS — `git merge-base --is-ancestor f1425a5c8 HEAD` exit 0
- **PR #5 head ancestry:** `8054a935b` is ancestor of merge SHA → GitHub auto-MERGED via merge-base reachability heuristic
- **PR #5 state:** MERGED (auto-closed 2026-05-23T03:48:43Z; mergeCommit.oid recorded as PR head `8054a935b` per GitHub convention for non-FF cases)
- **PR #5 context comment:** [#issuecomment-4524174105](https://github.com/atabisz/Vortex/pull/5#issuecomment-4524174105) — casual-voice redirect with merge SHA, Phase 35 evidence pointer, rollback tags, CI triage URLs
- **`sync/upstream-v2.0.1` head branch:** retained (forensic value — PR head reachable via 2nd-parent ancestry)

### main.yml runs on merge commit

- **Run #26322685477** — [link](https://github.com/atabisz/Vortex/actions/runs/26322685477)
    - Job `build (windows-latest)` (attempt 2): failure — pre-existing `extensions/skip-on-windows.mjs` ELIFECYCLE on `gamebryo-ba2-support` (identical failure on pre-merge master `f570149e`, run [#26270884452](https://github.com/atabisz/Vortex/actions/runs/26270884452))
    - Job `build (ubuntu-latest)` (attempt 2 + 3): cancelled by workflow fail-fast — Linux pre-commit gates locally GREEN (typecheck/lint/test/build/build-extensions, exit 0)
    - Job `api`: skipped (gated `github.repository == 'Nexus-Mods/Vortex'`, expected on fork)
- **Job artifacts:** `artifacts/main-yml-runs.json`, `artifacts/main-yml-jobs-merge-commit.json`, `artifacts/main-yml-jobs-merge-commit-attempt2.json`

### Why merge-commit-and-close vs literal FF

ROADMAP success criterion #1 wording was "fast-forward merged"; v8.1's base mismatch (memory `project_v8_1_base_mismatch.md`) made literal FF unreachable. Path C forward-sync produces a merge commit whose tree is byte-equivalent to what FF would have produced post-divergence-resolution; operator accepted the wording substitution (D-36-01, recorded in Wave 6 deviation note).

### Done-gate disposition

SYNC-36a part 2 closed:

1. ✓ local master == fork/master == merge SHA
2. ✓ main.yml URLs captured; Linux green locally + cancelled-by-fail-fast in CI; Windows red is operator-accepted pre-existing condition
3. ✓ PR #5 MERGED with redirect comment
4. ✓ head branch retained (default)
5. ✓ This section appended to REBASE-NOTES

Wave 3 (tag) unblocked.
