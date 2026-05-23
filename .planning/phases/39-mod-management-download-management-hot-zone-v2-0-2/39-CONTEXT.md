# Phase 39: Mod-management + download-management hot zone (v2.0.2) - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Mode:** Smart-discuss (autonomous) — decisions inherited from v8.0 P26 / v8.1 P32 mod-mgmt precedents; download_management bucket is the v8.2-specific delta

<domain>
## Phase Boundary

Resolve every conflict marker in `src/renderer/src/extensions/mod_management/` AND `src/renderer/src/extensions/download_management/` introduced by the v2.0.2 upstream merge (PR #6) on top of `v8.2/sync-upstream-v2.0.2` (Phase 38 result, head `84c3310a4`). Preserve every Linux-fork playbook invariant (§6 stagingDirHasFiles, §7a–d backslash/case cluster, 140a57217 manifest case-resolution). Re-use the v8.0 Phase 26 grep-checkpoint harness — extend it only if v2.0.2 introduced new playbook-touching call sites that the existing 7 gates do not cover.

**Confirmed conflict surface (probed 2026-05-23 via `git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.2 -- <buckets>`):**

mod_management bucket (6 files, 25 regions):

- `InstallManager.ts` (10)
- `LinkingDeployment.ts` (5)
- `util/externalChanges.ts` (4)
- `eventHandlers.ts` (2)
- `util/activationStore.ts` (2)
- `views/Settings.tsx` (2)

download_management bucket (7 files, 21 regions) — **new this milestone**, was research-clean in v8.1:

- `index.ts` (12)
- `DownloadObserver.ts` (3)
- `actions/state.ts` (1)
- `reducers/state.ts` (1)
- `types/IDownloadsAPIExtension.ts` (1)
- `util/extendApi.ts` (1)
- `views/DownloadView.tsx` (1)

**Confirmed CLEAN in v2.0.2 (zero markers — drop from ROADMAP-named scope):**

- `mod_management/index.ts` — barrel re-export, no v2.0.2 churn
- `mod_management/stagingDirectory.ts`
- `mod_management/util/deploy.ts`
- `mod_management/views/ModList.tsx`

ROADMAP.md Phase 39 description names these four; v2.0.2 didn't conflict on them. Skip — do not invent conflicts. Documented in 39-CONTEXT decisions so plan-checker can confirm.

**Total Phase 39 scope: 13 files, 46 regions** (vs. v8.1 P32: 15 files, 97 regions; v8.0 P26: 8 files, 86 regions).

**Out of scope this phase (v8.2):**

- Gamebryo + per-game extensions (Phase 40)
- Renderer + main spine outside mod_management/download_management (Phase 41)
- Build verification (Phase 42)
- FF-merge + tag (Phase 43)
- Refactoring inside any of the 13 conflict files — resolution only (per REQUIREMENTS.md §Out of scope)

</domain>

<decisions>
## Implementation Decisions

### Resolution Order

- **D-39-01:** Leaf-first within each bucket, mirror v8.1 D-32-01. Sequence: leaf-tier (`util/*`, isolated leaf modules) → mid-tier (action/reducer/event/view files) → playbook-heavy (`InstallManager.ts`, `LinkingDeployment.ts`) → barrel last (`download_management/index.ts`).
- **D-39-02:** Bucket ordering: download_management bucket first (no playbook §6/§7/140a57217 surface — lower risk; settles types and barrel exports that mod_management may reference); then mod_management bucket. Inverted from v8.1's "all mod_management" because v8.2 introduces a real download bucket and resolving it first reduces typecheck blast radius when working through `InstallManager.ts`.

### Per-File Resolution Stance

- **D-39-03:** Default = hand-resolve every region. Per-region stance = fork-wins for any line touching playbook §6/§7/140a57217/Linux-platform branches; upstream-wins for new feature scaffolding outside playbook surface; otherwise pick the side yielding the smaller, less-invasive diff against fork/master. (Mirrors v8.1 D-32-02.)
- **D-39-04:** No blanket `git checkout --ours` / `--theirs` across the bucket — hand-resolve. (Mirrors v8.1 D-32-03.)
- **D-39-05:** bluebird-trap audit — apply v8.1's bluebird-trap rule to every async fn touched in resolution. If the file imports bluebird `Promise` and upstream changes a `:Promise<void>` annotation, do NOT take the upstream annotation — keep the existing fork annotation or drop the explicit annotation. Trips TS1064. Audit list = every file with conflict markers in this phase (13 files).

### Playbook Preservation (re-use v8.0 grep harness)

- **D-39-06:** Re-use `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` (copy into this phase's `scripts/` dir per v8.1 D-32-04 precedent). Existing 7 gates already cover §6 stagingDirHasFiles, §7a–d backslash/case cluster (4 sub-gates), and 140a57217 LinkingDeployment.ts ≥3 hits. Run after every per-file resolution commit.
- **D-39-07:** Plan-phase researcher must inspect the v2.0.2 diff for new call sites that touch playbook surface. If v2.0.2 introduces a NEW invariant the existing 7 gates miss, extend the harness as gate 8+. If not, re-use as-is.
- **D-39-08:** D-26-03a invariant carries forward — `LinkingDeployment.ts` is the sole 140a57217 host on this fork. `mod_management/util/externalChanges.ts` exists but has no playbook calls (the fork's externalChanges() method that calls `resolvePathCase` lives inside `LinkingDeployment.ts`). Plans must NOT add a second-file 140a57217 gate.

### Per-File Verification Cadence

- **D-39-09:** Typecheck after every file resolution commit (`pnpm nx run @vortex/renderer:typecheck` or equivalent fork command). Hot zone has higher per-file regression risk. Lint deferred to Phase 42 (consistent with v8.0/v8.1 split). (Mirrors v8.1 D-32-06.)
- **D-39-10:** Run `grep-checkpoint.sh` after every per-file commit in the mod_management bucket. download_management commits do not need the checkpoint (no playbook surface) — but run a final pass after the last download_management commit for safety. Aggregate-fail design (no `set -e`).

### Atomic Commits

- **D-39-11:** One commit per resolved file. Title format `resolve(mod-mgmt-v2.0.2): <file> — <one-line stance>` for mod_management; `resolve(dl-mgmt-v2.0.2): <file> — <one-line stance>` for download_management. (Mirrors v8.1 D-32-08, with bucket-prefixed scope.)
- **D-39-12:** Commit body for each resolved file lists: bucket, conflict region count + per-region stance summary (fork-side / upstream-side / smaller-diff with brief reason), playbook gates affected/preserved (if mod_management bucket), `grep-checkpoint.sh` exit status (if mod_management bucket), `pnpm typecheck` exit status, bluebird-trap audit result (clean / fixed-by-keeping-fork-annotation / N/A — file doesn't import bluebird).
- **D-39-13:** No `--no-verify`. If husky/lint-staged refuses partial conflicts, finish the resolution then commit — no bypass.

### 140a57217 Re-grep Strategy

- **D-39-14:** v8.1 D-32-11 carries forward — snapshot 140a57217 sites pre-resolution → resolve → re-grep post-resolution → read the `externalChanges()` method body in `LinkingDeployment.ts` to confirm `resolvePathCase(dataPath, …)` calls survived intact.

### Branch Strategy

- **D-39-15:** Continue on `v8.2/sync-upstream-v2.0.2` (Phase 38's branch). One commit per file resolution stacks cleanly on Phase 38's 11 commits. No new branch this phase. Phase 43 will rebase the cumulative branch onto `master` HEAD before FF-merging PR #6.
- **D-39-16:** Push to `fork/sync/upstream-v2.0.2` once at phase end with `--force-with-lease=sync/upstream-v2.0.2:<recorded-base>` (defends against `rebase-upstream.yml` cron). Lease pin recorded by plan 39-01 pre-flight, mirror Phase 38 Plan 38-07 pattern. Inline SSH URL per `feedback_git_push_ssh.md`.

### Scope Reduction Decision (delta from ROADMAP.md)

- **D-39-17:** ROADMAP.md Phase 39 names `mod_management/{index,eventHandlers}.ts`, `stagingDirectory.ts`, `util/deploy.ts`, `views/ModList.tsx`. Of these, only `eventHandlers.ts` actually has v2.0.2 conflict markers. The other four are clean — confirm-and-skip. Plan-phase research must verify (running `git show fork/sync/upstream-v2.0.2:<file> | grep -c '^<<<<<<< '` for each) and document the skip in 39-RESEARCH.md so plan-checker doesn't flag them as missing.
- **D-39-18:** download_management bucket (7 files, 21 regions) is the v8.2-specific addition vs. v8.1 P32. ROADMAP.md Phase 39 calls this out (`plus download_management/ modules currently in fork`). All 7 conflict files are in scope and atomic-commit per the same per-file pattern. SYNC-39a/b cover them implicitly under "every playbook §6/§7/externalChanges site preserved in resolved files" + the bucket-D framing.

### Claude's Discretion

- Per-conflict-region stance per file — default hand-resolve; fork-wins for playbook surface; upstream-wins for new feature scaffolding; smaller-diff side otherwise. Executor reads each region.
- Whether download_management/index.ts (12 regions, the largest) needs per-section sub-commits — let executor judge during resolution. If a single 12-region commit body would exceed readability, split into themed sub-commits with `resolve(dl-mgmt-v2.0.2): index.ts — <theme1>` titles.
- Resolution order WITHIN the leaf-tier and mid-tier — no strict ordering enforced beyond "leaf before mid before playbook-heavy before barrel".

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive-only Linux changes, no large refactors)
- `.planning/REQUIREMENTS.md` — v8.2 requirements catalog; Phase 39 owns SYNC-39a + SYNC-39b
- `.planning/ROADMAP.md` — v8.2 milestone (Phases 38–44) and Phase 39 success criteria
- `.planning/STATE.md` — current position (Phase 38 ✅ complete; Phase 39 ready)

### Linux fork preservation (load-bearing)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — 10 items the fork must keep through every upstream sync. Phase 39 protects §6 (stagingDirHasFiles) and §7a–d (backslash/case cluster) inside `InstallManager.ts`, plus 140a57217 inside `LinkingDeployment.ts`.

### v8.1 prior art (direct analog — read these to lift the patterns)

- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-CONTEXT.md` — v8.1 P32 context (D-32-01..D-32-15), mirror most for Phase 39
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-RESEARCH.md` — v8.1 conflict enumeration approach
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-VERIFICATION.md` — verification gate template

### v8.0 prior art (harness origin)

- `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` — durable harness (7 gates encoded), copy into this phase's `scripts/`
- `.planning/milestones/v8.0-phases/26-mod-management-hot-zone/26-CONTEXT.md` — D-26-01..05 (parent decisions for D-39-01..)
- `.planning/milestones/v8.0-phases/26-mod-management-hot-zone/26-VERIFICATION.md` — D-26-03a invariant: LinkingDeployment.ts sole 140a57217 host

### Phase 38 carry-forward

- `.planning/phases/38-config-bucket-v2-0-2/38-CONTEXT.md` — Phase 38 decisions (D-38-01..D-38-18); download_management bucket emergence
- `.planning/phases/38-config-bucket-v2-0-2/38-07-SUMMARY.md` — Phase 38 push outcome at `84c3310a4`; PR #6 head; recorded base for force-with-lease
- `.planning/phases/38-config-bucket-v2-0-2/38-06-SUMMARY.md` — Phase 38 done-gate, gate 4 deferral note (TS1185 source-marker errors in `src/shared/src/types/{ipc,preload}.ts` are Phase 41 territory)

### Upstream PR + state

- `https://github.com/atabisz/Vortex/pull/6` — PR #6 (`sync upstream v2.0.2 into master`); resolution stacks on `v8.2/sync-upstream-v2.0.2`
- `fork/sync/upstream-v2.0.2` HEAD `84c3310a4` — Phase 38 final state; phase-39 commits stack here
- `fork/master` at `855fb3e1a` — fork's pre-sync v8.1 baseline
- `v8.2/sync-upstream-v2.0.2` HEAD `84c3310a4` — local working branch (== remote post-Phase-38)

### Memory / process references

- `feedback_bluebird_promise_trap.md` — TS1064 trap on `:Promise<void>` annotations when bluebird is imported
- `feedback_git_push_ssh.md` — sandbox blocks `.git/config`; push with inline SSH URL
- `feedback_ssh_signing.md` — all commits SSH-signed via `~/.ssh/id_ed25519`
- `feedback_planning_gitignored.md` — `git add -f` for any commit touching `.planning/` paths
- `feedback_minimize_upstream_diff.md` — never reformat outside scope; keep diffs small

### Tooling references

- `AGENTS.md` + `AGENTS-DIRECTORIES.md` — repo navigation; `pnpm run` for repo commands
- `CLAUDE.md` (project) — Branch Strategy + GSD Workflow Enforcement sections

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh`** — 7-gate playbook harness. Copy into `.planning/phases/39-mod-management-download-management-hot-zone-v2-0-2/scripts/`.
- **`src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts`** — sibling helper hosting `stagingDirHasFiles` (playbook §6). Phase 39 must keep import + call site present in `InstallManager.ts:doDownload`.
- **`util/normalizeBackslashPaths`, `util/mergeCaseConflictingDirs`** — playbook §7a/§7b helpers; existing call sites in `InstallManager.ts` (≥3 each) must survive.
- **`resolvePathCase` (`@vortex/util-fs`)** — playbook §7d/140a57217 helper; existing call sites in `InstallManager.ts:extractArchive` and `LinkingDeployment.ts:externalChanges()` must survive.

### Established Patterns

- **Atomic commit per resolved file** — v6.0 / v7.0 / v8.0 / v8.1 phase-execution norm.
- **Force-with-lease pushes to fork** — `rebase-upstream.yml` daily cron writes to `sync/upstream-*`; lease defends.
- **Hot-zone typecheck cadence** — typecheck after every file resolution (D-39-09).
- **D-26-03a invariant** — LinkingDeployment.ts is the sole 140a57217 host; harness gate is single-file. Phase 39 inherits.
- **Bluebird-trap audit** — Phase 34 v8.1 introduced as standard practice; codified here as D-39-05 for any file touched.

### Integration Points

- After Phase 39, conflict markers in `src/renderer/src/extensions/{mod_management,download_management}/` are zero. Conflict markers in OTHER directories (gamebryo, ExtensionManager, controls/Table, IPC source-marker types in `src/shared/src/types/{ipc,preload}.ts` etc.) remain — those are Phases 40–41. Phase 39's typecheck gate is bucket-scoped (each file resolved compiles within its own imports); whole-renderer pass is Phase 42.
- Phase 40 (gamebryo) consumes Phase 39's clean mod_management exports. Resolving the bucket here unblocks that phase.
- download_management bucket has no Phase 38 dependency beyond `pnpm install --frozen-lockfile` succeeding (Phase 38 gate 3 GREEN).

</code_context>

<specifics>
## Specific Ideas

- **Phase 39 conflict surface enumerated up-front via `git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.2 -- <buckets>` + per-file `git show | grep -c '^<<<<<<< '`** — 13 files / 46 regions confirmed. ROADMAP-named files `index.ts`/`stagingDirectory.ts`/`util/deploy.ts`/`views/ModList.tsx` are clean in v2.0.2 and skipped (D-39-17).
- **download_management bucket emerged in v2.0.2** — was research-clean in v8.1. Resolve first (D-39-02) because no playbook surface = lower risk; settles barrel/types before mod_management imports them.
- **`download_management/index.ts` is the largest single file (12 regions)** — executor may split into themed sub-commits if a single commit body would be unreadable.
- **Per-file commit body MUST record `grep-checkpoint.sh` and `pnpm typecheck` exit codes plus bluebird-trap audit result** — auditable trail for Phase 42 verification and Phase 43 rebase.
- **140a57217 verification stays single-file** (D-39-08) — the externalChanges() method that calls `resolvePathCase` lives in `LinkingDeployment.ts`, not in the new file `mod_management/util/externalChanges.ts`.

</specifics>

<deferred>
## Deferred Ideas

- **Refactoring inside any of the 13 conflict files** — out of scope per REQUIREMENTS.md §Out of scope; resolution-only.
- **Promoting `grep-checkpoint.sh` to `release-linux.yml` CI** — v8.0/v8.1 carry-forward defer; reconsider in Phase 42 (build verification).
- **Lint pass on resolved files** — Phase 39 only typechecks. Lint baseline-parity is Phase 42 (SYNC-42b).
- **TS1185 source-marker errors in `src/shared/src/types/{ipc,preload}.ts`** — Phase 38 deferred to Phase 41 (renderer/main spine + nexus + IPC). Out of scope here even though they will surface during Phase 39 typecheck — gate is bucket-scoped per D-39-09.
- **Refactoring `mod_management/util/externalChanges.ts`** — fork file with no playbook calls; if upstream conflicts here, resolve and move on without restructuring.

</deferred>

---

_Phase: 39-mod-management-download-management-hot-zone-v2-0-2_
_Context gathered: 2026-05-23_
