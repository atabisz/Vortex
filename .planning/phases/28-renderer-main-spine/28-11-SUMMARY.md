---
phase: 28-renderer-main-spine
plan: 11
subsystem: phase-done-gate
tags:
    - linux-port
    - upstream-v2.0.0
    - phase-28
    - done-gate
    - force-with-lease-push
requirements:
    satisfied:
        - SYNC-07
        - SYNC-08
        - SYNC-09
        - SYNC-10
        - SYNC-18
        - SYNC-20
        - SYNC-24
        - SYNC-25
        - SYNC-26
dependency_graph:
    requires:
        - .planning/phases/28-renderer-main-spine/28-10-SUMMARY.md (resolution work complete — 63/63 conflict files resolved)
    provides:
        - Phase 28 complete on `v8.0/config-bucket` and on `fork/sync/upstream-v2.0.0`
        - 28-DONE-GATE.md evidence record for milestone audit trail
        - Working tree merge-clean for Phase 29 (build verification)
    affects:
        - Phase 29 (build verification — typecheck baseline now green; AppImage/.deb smoke is the next gate)
tech_stack:
    added: []
    patterns:
        - "Explicit-lease force-push idiom: `--force-with-lease=<ref>:<verified-sha>` instead of bare `--force-with-lease`. Required when pushing via inline SSH URL (`git@github.com:...`) because that URL has no remote-tracking branch, so the implicit lease check fails with `(stale info)`. Pinning the lease to the pre-push remote SHA (verified via `git ls-remote` immediately before pushing) is the safe fix and confirms the push doesn't clobber concurrent work. Reusable shape for any future force-pushes routed through the SSH-URL-fallback path."
        - "Full grep-checkpoint at done-gate: 16 gates total (12 carried forward from Phase 26/27 + 4 new §2/§4/§8/§9 from Plan 28-00). The §4 gate is the milestone's first NEGATIVE gate (count must be 0) — proves the Windows-only reject in `transferPath.ts` was not re-introduced. Reusable shape for v8.1/v9.0 sync milestones."
key_files:
    created:
        - .planning/phases/28-renderer-main-spine/28-DONE-GATE.md
        - .planning/phases/28-renderer-main-spine/28-11-SUMMARY.md
    modified:
        - .planning/STATE.md
        - .planning/ROADMAP.md
decisions:
    - "Plan 28-11 specified `pnpm typecheck -F @vortex/<pkg>` for per-bucket typechecks. That syntax has pnpm pass `-F` to `tsc`, which fails with `TS5023: Unknown compiler option '-F'`. Used the correct `pnpm --filter @vortex/<pkg> typecheck` form (filter goes BEFORE the script name). Documented in 28-DONE-GATE.md §3."
    - "Plan 28-11 specified `--not origin/sync/upstream-v2.0.0` for commit counting. Correct ref on this fork is `--not fork/sync/upstream-v2.0.0` (origin = Nexus-Mods/Vortex; fork = atabisz/Vortex). Documented in 28-DONE-GATE.md §5."
    - "Force-with-lease push via inline SSH URL (`git@github.com:atabisz/Vortex.git`) initially rejected with `(stale info)` because the inline URL has no remote-tracking branch — implicit lease can't resolve. Re-pushed with explicit `--force-with-lease=sync/upstream-v2.0.0:c418a4889e661ad197d2f0694122443a8bbd4ee9` pinned to the verified pre-push remote SHA. Push succeeded `c418a4889..3cc93b988`. Post-push remote SHA confirmed via `git ls-remote`."
    - "After the Phase-28 resolution push, two follow-up `docs(28)` commits (DONE-GATE evidence + ROADMAP/STATE updates) were pushed via the same explicit-lease form pinned to `3cc93b988`. Final remote HEAD: `19d151ee2`. Sequence preserves the merge-clean tree at `3cc93b988` and adds the metadata commits on top, matching Phase 27's done-gate sequencing."
    - "Generated artefact `packages/vortex-api/lib/api.d.ts` regenerated as a side-effect of `pnpm typecheck`. Discarded via `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` per recurring chore-commit pattern (`416af4df3`, `3d639fc26`). A separate housekeeping `chore: regenerate vortex-api/lib/api.d.ts` commit is appropriate as a follow-up — outside Phase 28 scope per CONTEXT deferred items."
metrics:
    duration_minutes: 25
    completed: "2026-05-22"
    commit_count: 0 # this plan does NOT add resolve commits; only docs commits below
    task_count: 1
    file_count: 4
---

# Phase 28 Plan 11: D-28-05 Done-Gate Summary

Ran the eight D-28-05 done-gate checks against `v8.0/config-bucket` HEAD `3cc93b988` (output of Plan 28-10). All seven pre-push checks passed; user approved the push, which landed `c418a4889..3cc93b988` on `fork/sync/upstream-v2.0.0`. Two follow-up `docs(28)` commits captured the gate evidence + ROADMAP/STATE updates and were pushed on top, leaving final remote HEAD at `19d151ee2`. Phase 28 complete — working tree merge-clean for Phase 29.

## What Got Verified

**Check 1 — Zero conflict markers across 7 phase directories:** PASS. `git grep '^<<<<<<< ' <src/renderer src/main src/preload src/shared scripts .github/actions/fingerprints>` exits 1 (no matches). All 63 conflict files cleanly resolved.

**Check 2 — `.planning/milestones/v8.0/scripts/grep-checkpoint.sh` full run (no `--skip-conflict-check`):** PASS. All 16 gates green — 12 carried forward from Phase 26/27 (§1, §3, §6, §7a-d, §10, 140a57217, BG3 4-class, Morrowind migrate103, no-conflict-marker) + 4 new from Plan 28-00 (§2 winapi-bindings, §4 transferPath.ts NEGATIVE gate, §8 Proton helpers + hide-on-spawn, §9 findAllLinuxSteamPaths + libraryfolders.vdf).

**Check 3 — Per-bucket typechecks:** PASS. All four exit 0 (`@vortex/shared`, `@vortex/preload`, `@vortex/main`, `@vortex/renderer`) using corrected `pnpm --filter <pkg> typecheck` syntax.

**Check 4 — Phase-end full-repo `pnpm typecheck`:** PASS. exit 0. No cross-bucket drift. Notably, the 15 pre-existing TS1185 conflict-marker errors in `src/shared/src/` that surfaced at the end of Phase 27 are now resolved — Phase 28 owned that subtree.

**Check 5 — Commit count:** PASS. 51 resolve commits + 1 fingerprints squash + 1 setup chore = 53 atomic commits over `fork/sync/upstream-v2.0.0` (within plan's expected 50–54 range). Per-scope breakdown: shared 3, preload 1, main 7, renderer 27, nexus 6, scripts 2, docs 5.

**Check 6 — Fingerprints squash matches upstream:** PASS. `git diff 8b5a9f675 -- .github/actions/fingerprints/` returns 0 lines — byte-for-byte upstream match preserved.

**Check 7 — No half-resolved files:** PASS. `git status --short` empty after discarding the regenerated `packages/vortex-api/lib/api.d.ts` artefact (recurring drift pattern; outside Phase 28 scope).

**Check 8 — Force-with-lease push:** PASS. User approved 2026-05-22. Initial implicit-lease attempt rejected `(stale info)` because the inline SSH URL has no remote-tracking branch; re-pushed with explicit lease pinned to verified pre-push SHA `c418a4889`. Push succeeded `c418a4889..3cc93b988`. Post-push remote SHA `3cc93b988` confirmed via `git ls-remote`.

## Push Sequence

| Step            | Local SHA   | Remote SHA Before | Remote SHA After | Notes                                                                   |
| --------------- | ----------- | ----------------- | ---------------- | ----------------------------------------------------------------------- |
| Resolution push | `3cc93b988` | `c418a4889`       | `3cc93b988`      | Phase 28 plans 28-00..28-10                                             |
| Metadata push   | `19d151ee2` | `3cc93b988`       | `19d151ee2`      | DONE-GATE.md + ROADMAP/STATE updates (commits `98cf2a7c6`, `19d151ee2`) |

## Phase 28 Complete

Working tree merge-clean. All 9 phase requirements (SYNC-07/08/09/10/18/20/24/25/26) satisfied. Playbook §2/§4/§8/§9 invariants protected by the relocated `grep-checkpoint.sh` (16 gates) — any future regression surfaces in-line on the next commit. Ready for Phase 29 (build verification + AppImage/.deb smoke).
