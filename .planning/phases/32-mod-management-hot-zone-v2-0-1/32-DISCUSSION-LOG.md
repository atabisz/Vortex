# Phase 32: Mod-management hot zone (v2.0.1) - Discussion Log

**Discussed:** 2026-05-22
**Mode:** discuss (autonomous; pre-approved "Accept all, use v8.0 Phase 24 patterns")

## Areas Discussed

### Resolution order

- **Options considered:** Leaf-first / Heavy-first / Coupling-graph order.
- **Selected:** Leaf-first (D-32-01).
- **Notes:** Carries v8.0 D-26-01 forward — surrounding utilities settle before the playbook-heavy `InstallManager.ts` and `LinkingDeployment.ts`; barrel `index.ts` last because re-exports depend on the rest.

### Per-file resolution stance

- **Options considered:** Default hand-resolve / Blanket `--ours` / Blanket `--theirs`.
- **Selected:** Default hand-resolve, fork-wins for playbook surface, upstream-wins for new scaffolding outside the surface, smaller-diff side otherwise (D-32-02, D-32-03).
- **Notes:** v8.0 Phase 30 demonstrated that bulk `--theirs` strategies broke playbook invariants and required cascading drift fixes. Per-region judgment is mandatory.

### Playbook preservation harness

- **Options considered:** Re-use v8.0 harness / Build new Phase 32 harness / Inline grep checks per plan.
- **Selected:** Re-use v8.0 harness verbatim; extend only if v2.0.1 introduces new playbook sites (D-32-04, D-32-05).
- **Notes:** The 7 gates already encode every playbook surface Phase 32 must protect. Plan 01 inspects v2.0.1's diff to decide whether new gates are needed.

### Typecheck cadence

- **Options considered:** After each file / Phase end only / Tiered.
- **Selected:** After each file (D-32-06). Lint deferred to Phase 35 (D-32-06).
- **Notes:** Carries v8.0 D-26-04 forward — hot zone has higher per-file regression risk than the config or scaffolding buckets.

### 140a57217 re-grep strategy

- **Options considered:** grep-pre/post + read / grep-only / read-only.
- **Selected:** grep-pre/post + read (D-32-11).
- **Notes:** Catches deletion (grep) and arg-rename (read). v8.0 D-26-02 carry-forward. D-26-03a invariant (single-file 140a57217 host) carries forward as D-32-12.

### Scope expansion (mod_management/\* files outside ROADMAP list)

- **Options considered:** Stick to 8 named files / Expand to all 15 files in mod_management/ / Defer the 7 expansion files to Phase 33.
- **Selected:** Expand to all 15 files (D-32-13).
- **Notes:** 7 additional files (NotificationAggregator, modMerging, util/{VersionFilter,activationStore,removeMods}, views/{DeactivationButton,Settings}) live in the same directory, came from the same upstream merge, and would otherwise block Phase 33+ typecheck. Atomic-commit-per-file structure absorbs the 11 extra regions cleanly. ROADMAP.md and REQUIREMENTS.md SYNC-32a phrasing covers the intent — no SYNC-\* renumbering needed.

### Branch strategy

- **Options considered:** Continue on `v8.1/config-bucket` / New branch `v8.1/mod-mgmt-hot-zone` / Fresh branch off master.
- **Selected:** Continue on `v8.1/config-bucket` (D-32-15).
- **Notes:** Phase 31's 13 commits stay coherent with Phase 32's resolutions; one branch through Phase 35; Phase 36 rebases cumulative branch onto master HEAD before FF-merge.

### DownloadManager.ts scope

- **Options considered:** Resolve in Phase 32 / Defer to Phase 34 / Drop entirely.
- **Selected:** Drop from Phase 32 scope; revisit in Phase 34 only if a conflict surfaces.
- **Notes:** Research-confirmed zero conflict markers in `extensions/download_management/DownloadManager.ts` on `v8.1/config-bucket`. ROADMAP.md mentions it under Phase 32 but the file is clean — no resolution work to do.

## Deferred Ideas

- Refactoring inside any of the 15 conflict files — out of scope per REQUIREMENTS.md.
- `DownloadManager.ts` resolution — zero conflicts; revisit only if Phase 34 surfaces one.
- Promoting `grep-checkpoint.sh` to `release-linux.yml` CI — defer to Phase 35.
- Lint pass on resolved files — Phase 35 (SYNC-35b).
- R2 (Jest `__mocks__/`) — Phase 34 carry-forward from 31-01.
- R3 (orphan `electron-builder.config.json`) — Phase 35 carry-forward from 31-01.

## Claude's Discretion (left to executor)

- Per-conflict-region stance per file — default hand-resolve; fork-wins for playbook surface; upstream-wins for new scaffolding outside the surface; smaller-diff side otherwise. Executor reads each region.
- Whether to copy or symlink the v8.0 harness into Phase 32's `scripts/` dir (suggested: copy with header comment citing v8.0 Phase 26 origin).
- Resolution order WITHIN the leaf-tier and mid-tier — no strict order beyond "leaf before mid before playbook-heavy before barrel".
- Commit body format — table or bullet prose, whichever reads cleaner. Required content: gate states, region count per side, exit codes.
