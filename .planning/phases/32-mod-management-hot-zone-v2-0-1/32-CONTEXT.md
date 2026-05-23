# Phase 32: Mod-management hot zone (v2.0.1) - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve every conflict marker in `src/renderer/src/extensions/mod_management/` introduced by the v2.0.1 upstream merge (PR #5), preserving every Linux-fork playbook invariant (§6 stagingDirHasFiles, §7a–d backslash/case cluster, 140a57217 manifest case-resolution). Re-use the durable `grep-checkpoint.sh` harness shipped by v8.0 Phase 26 — extend it only if v2.0.1 introduced new playbook-touching call sites that the existing 7 gates do not cover.

**In-scope conflict files (15 total, 97 conflict regions):**

ROADMAP.md-named (8 files, 86 regions):

- `InstallManager.ts` (40 regions)
- `LinkingDeployment.ts` (8)
- `index.ts` (18)
- `eventHandlers.ts` (3)
- `stagingDirectory.ts` (1)
- `util/deploy.ts` (2)
- `util/externalChanges.ts` (3)
- `views/ModList.tsx` (11)

Scope expansion (7 additional files, 11 regions) — same `mod_management/` directory, same upstream merge, same playbook surface; resolving them in this phase keeps the bucket atomic and avoids leaving conflict markers behind for Phase 33+ to trip over:

- `NotificationAggregator.ts` (1)
- `modMerging.ts` (2)
- `util/VersionFilter.tsx` (1)
- `util/activationStore.ts` (3)
- `util/removeMods.ts` (1)
- `views/DeactivationButton.tsx` (1)
- `views/Settings.tsx` (2)

**Confirmed out of scope (research-clean, dropped from ROADMAP.md scope):**

- `DownloadManager.ts` (`extensions/download_management/DownloadManager.ts`) — zero conflict markers; v2.0.1 did not touch it on a path that conflicted with fork. Defer any download-side resolution to Phase 34 if it surfaces under renderer/main spine.

**Out of scope this phase (v8.1):**

- Gamebryo + per-game extensions (Phase 33)
- Renderer + main spine outside mod_management (Phase 34)
- Build verification (Phase 35)
- FF-merge + tag (Phase 36)
- Refactoring inside any of the 15 conflict files — resolution only (per REQUIREMENTS.md §Out of scope)

</domain>

<decisions>
## Implementation Decisions

### Resolution Order

- **D-32-01:** Leaf-first, mirror v8.0 D-26-01. Sequence: utility files first (`util/*` and isolated leaf modules) → mid-tier (`stagingDirectory.ts`, `eventHandlers.ts`, `views/*`, `NotificationAggregator.ts`, `modMerging.ts`) → playbook-heavy (`LinkingDeployment.ts`, `InstallManager.ts`) → barrel last (`index.ts`). Surrounding utilities settle before the playbook-heavy files; `index.ts` last because re-exports depend on the rest.

### Per-File Resolution Stance

- **D-32-02:** Default = hand-resolve every region. Per-region stance = fork-wins for any line touching playbook §6/§7/140a57217/Linux-platform branches; upstream-wins for new feature scaffolding outside playbook surface; otherwise pick the side that yields the smaller, less-invasive diff against fork/master.
- **D-32-03:** No blanket `git checkout --ours` / `--theirs` across the bucket. v8.0 Phase 30 R&D — at rebase time, those bulk strategies destroyed the playbook invariants and required cascading drift fixes. Hand-resolve here.

### Playbook Preservation (re-use v8.0 grep harness)

- **D-32-04:** Re-use `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` (or a copy/symlink under this phase's `scripts/` dir). Existing 7 gates already cover §6 stagingDirHasFiles, §7a–d backslash/case cluster (4 sub-gates), and 140a57217 LinkingDeployment.ts ≥3 hits. Run after every per-file resolution commit (per D-32-08).
- **D-32-05:** Phase 32 plan 01 inspects v2.0.1's diff for new call sites that touch playbook surface. If v2.0.1 introduces a NEW invariant the existing 7 gates miss, extend the harness as gate 8 (or higher) and document the addition in the per-phase scripts dir. If no new sites, re-use as-is — do not modify the v8.0 harness.

### Per-File Verification Cadence

- **D-32-06:** Typecheck after every file resolution commit (`pnpm typecheck -F @vortex/renderer`), mirror v8.0 D-26-04. Hot zone has higher per-file regression risk. Lint deferred to Phase 35 (consistent with v8.0 Phase 26 → 29 split).
- **D-32-07:** Run `grep-checkpoint.sh` after every per-file commit. Aggregate-fail design (no `set -e`) — see all gate states even if one fails, then fix in next commit.

### Atomic Commits

- **D-32-08:** One commit per resolved file. Title format `resolve(mod-mgmt-v2.0.1): <file> — <one-line stance>`. Easy to bisect; matches GSD atomic-commit norm and v8.0 Phase 26 precedent.
- **D-32-09:** Commit body for each resolved file lists: which playbook gates were affected/preserved, which conflict regions were chosen fork-side vs upstream-side (region count + brief reason), `grep-checkpoint.sh` exit status, `pnpm typecheck` exit status.
- **D-32-10:** No `--no-verify` unless the husky pre-commit hook genuinely cannot parse the file (e.g., partial conflict markers from a mid-resolution checkpoint). Document any `--no-verify` use in the commit body with rationale.

### 140a57217 Re-grep Strategy

- **D-32-11:** v8.0 Phase 26's "grep-pre/post + read" pattern (D-26-02) carries over. Snapshot 140a57217 sites pre-resolution → resolve → re-grep post-resolution → read the `externalChanges()` method body in `LinkingDeployment.ts` to confirm `resolvePathCase(dataPath, …)` calls survived intact. Belt + suspenders.
- **D-32-12:** D-26-03a invariant carries over — `mod_management/externalChanges.ts` does NOT exist on this fork (only `mod_management/util/externalChanges.ts` exists, which has no playbook calls). LinkingDeployment.ts is the sole 140a57217 host. Plans must NOT add a second-file 140a57217 gate to the harness.

### Scope Expansion Decision

- **D-32-13:** Phase 32 covers ALL conflict markers in `src/renderer/src/extensions/mod_management/` (15 files, 97 regions), not just the 8 ROADMAP.md-named files. Rationale: same directory, same upstream merge, same playbook surface; leaving 7 files of conflicts behind would block Phase 33+ typecheck/build and force a "Phase 32-bis" later. The atomic-commit-per-file structure and the harness gate the additions cleanly.
- **D-32-14:** REQUIREMENTS.md SYNC-32a stands as written. The 7 expansion files are implicit under "every playbook §6/§7/externalChanges site preserved in resolved files" because they live in the playbook-protected directory. No SYNC-\* renumbering needed.

### Branch Strategy

- **D-32-15:** Continue working on `v8.1/config-bucket` (the existing branch from Phase 31). One commit per file resolution stacks cleanly on top of Phase 31's 13 commits. No new branch this phase. Phase 36 will rebase the cumulative `v8.1/config-bucket` onto `master` HEAD before FF-merging PR #5.

### Claude's Discretion

- Per-conflict-region resolution stance per file — default hand-resolve; fork-wins for playbook surface; upstream-wins for new scaffolding outside the surface; smaller-diff side otherwise. Executor reads each region.
- Whether to copy or symlink the v8.0 harness into Phase 32's `scripts/` dir (suggested: copy, with a comment header citing v8.0 Phase 26 origin). Allows v8.1-specific gate extensions without touching the v8.0 archive.
- Resolution order WITHIN the leaf-tier and mid-tier — no strict ordering enforced beyond "leaf before mid before playbook-heavy before barrel".

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive-only Linux changes, no large refactors)
- `.planning/REQUIREMENTS.md` — v8.1 requirements catalog; Phase 32 owns SYNC-32a
- `.planning/ROADMAP.md` — v8.1 milestone (Phases 31–37) and Phase 32 success criteria
- `.planning/STATE.md` — current position (Phase 31 complete; Phase 32 ready)

### Linux fork preservation (load-bearing)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — 10 items the fork must keep through every upstream sync. Phase 32 protects §6 (stagingDirHasFiles) and §7a–d (backslash/case cluster) inside `InstallManager.ts`, plus 140a57217 inside `LinkingDeployment.ts`.
- `.planning/codebase/ARCHITECTURE.md` — fork's three-tier process model; mod_management lives in renderer
- `.planning/codebase/STRUCTURE.md` — fork directory layout

### v8.0 Phase 26 precedent (reuse-first)

- `.planning/milestones/v8.0-phases/26-mod-management-hot-zone/26-CONTEXT.md` — D-26-01..05 carry forward as D-32-01..06
- `.planning/milestones/v8.0-phases/26-mod-management-hot-zone/26-DISCUSSION-LOG.md` — selection rationale (leaf-first, grep-pre/post, harness-as-script)
- `.planning/milestones/v8.0-phases/26-mod-management-hot-zone/26-VERIFICATION.md` — D-26-03a invariant (LinkingDeployment.ts is the sole 140a57217 host) and 8/8 gate verification template
- `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` — durable harness (7 gates encoded). Re-used by Phase 32 verbatim unless v2.0.1 introduces new playbook sites.

    _(Note: harness path is `.planning/phases/26-...` not `.planning/milestones/v8.0-phases/26-...` — the script lives in the active phases tree because it is re-runnable infrastructure, while the v8.0 archive holds only the docs.)_

### Phase 31 carry-forward

- `.planning/phases/31-config-bucket/31-RESEARCH.md` — research base SHA (`8054a935b`); used to identify v2.0.1 conflict regions
- `.planning/phases/31-config-bucket/31-01-SUMMARY.md` — R2 (Jest `__mocks__/`) + R3 (orphan `electron-builder.config.json`) deferred to Phases 34/35; Phase 32 does not touch them

### Upstream PR + state

- `https://github.com/atabisz/Vortex/pull/5` — PR #5 (`chore: sync upstream v2.0.1 into master`); resolution stacks on `v8.1/config-bucket`
- `fork/v8.1/config-bucket` — current working branch; Phase 31 result + Phase 32 commits stack here
- `fork/sync/upstream-v2.0.1` — original PR head (PR #5); reference for v2.0.1 commit boundary
- `fork/master` — fork's pre-sync baseline; HEAD side of every conflict region

### Tooling references

- `AGENTS.md` + `AGENTS-DIRECTORIES.md` — repo navigation rules; `pnpm run` for repo commands
- `CLAUDE.md` (project) — Branch Strategy section; GSD Workflow Enforcement section

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh`** — durable harness, executable, encodes 7 playbook gates + no-marker assertion + `--skip-conflict-check` flag. Aggregate-fail design (`set -u`, no `set -e`) so all gates report. v8.0 Phase 26 verified PASS exit 0 on a clean tree. Re-use first; extend only if v2.0.1 introduces new playbook sites.
- **`src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts`** — sibling helper hosting `stagingDirHasFiles` (playbook §6). Phase 32 must keep the import + call site present in `InstallManager.ts:doDownload`.
- **`util/normalizeBackslashPaths`, `util/mergeCaseConflictingDirs`** — playbook §7a/§7b helpers; existing call sites in `InstallManager.ts` (≥3 each) must survive.
- **`resolvePathCase` (`@vortex/util-fs` or similar)** — playbook §7d/140a57217 helper; existing call sites in `InstallManager.ts:extractArchive` and `LinkingDeployment.ts:externalChanges()` must survive.

### Established Patterns

- **Atomic commit per resolved file** — v6.0 / v7.0 / v8.0 phase-execution norm.
- **Force-with-lease pushes to fork** — `rebase-upstream.yml` daily cron writes to `sync/upstream-*`; lease defends against the cron clobbering us. Phase 32 pushes to `v8.1/config-bucket` (not `sync/upstream-v2.0.1`), so cron is not a hazard for this branch.
- **Hot-zone typecheck cadence** — typecheck after every file resolution (D-32-06), distinct from v8.0 Phase 24/25's phase-end-only cadence.
- **D-26-03a invariant** — LinkingDeployment.ts is the sole 140a57217 host on this fork; harness gate is single-file. Phase 32 inherits this invariant.

### Integration Points

- After Phase 32, conflict markers in `src/renderer/src/extensions/mod_management/` are zero. `pnpm typecheck -F @vortex/renderer` may still fail on conflict markers in OTHER directories (gamebryo, ExtensionManager, controls/Table, etc.) — those are Phases 33–34. Phase 32's typecheck gate is bucket-scoped (mod_management imports compile within the file just resolved); whole-renderer pass is Phase 35 territory.
- After Phase 32, the 7 expansion files (NotificationAggregator, modMerging, util/{VersionFilter,activationStore,removeMods}, views/{DeactivationButton,Settings}) are clean of markers and unblock Phase 33–34's typecheck on dependent modules.
- Phase 33 (gamebryo) consumes Phase 32's clean mod_management exports via `index.ts` barrel. Resolving `index.ts` last (D-32-01) ensures the barrel is consistent with all sibling files when downstream phases compile against it.

</code_context>

<specifics>
## Specific Ideas

- **Re-use the v8.0 Phase 26 harness verbatim** when possible. The 7 gates encode the exact playbook surface Phase 32 must protect. Adding gates only if v2.0.1 introduces a NEW playbook-touching call site that the existing gates miss.
- **Per-file commit body must record `grep-checkpoint.sh` and `pnpm typecheck` exit codes** — auditable trail for Phase 35 verification and Phase 36 rebase.
- **140a57217 verification is single-file** — D-26-03a invariant carries forward. Plans must not regress to the pre-D-26-03a "two-file" framing.
- **Scope expansion is intentional** (D-32-13) — 7 unlisted mod_management/\* files are folded in to keep the bucket atomic. ROADMAP.md and REQUIREMENTS.md SYNC-32a wording covers the intent.

</specifics>

<deferred>
## Deferred Ideas

- **Refactoring inside any of the 15 conflict files** — out of scope per REQUIREMENTS.md §Out of scope; this is resolution-only.
- **`DownloadManager.ts` resolution** — zero conflict markers in v8.1 (research-confirmed). If a download-side conflict surfaces during Phase 34's renderer/main spine pass, fold there.
- **Promoting `grep-checkpoint.sh` to `release-linux.yml` CI** — v8.0 Phase 26 deferred this to v8.0 Phase 29 and it never landed. Re-defer to Phase 35 (build verification) for v8.1 — same defer reason: durability over CI integration.
- **Lint pass on resolved files** — Phase 32 only typechecks. Lint baseline-parity is Phase 35 (SYNC-35b).
- **R2 (Jest `__mocks__/`) and R3 (orphan `electron-builder.config.json`)** — explicitly Phase 34/35 carry-forward from Phase 31. Out of scope here.

</deferred>

---

_Phase: 32-mod-management-hot-zone-v2-0-1_
_Context gathered: 2026-05-22_
