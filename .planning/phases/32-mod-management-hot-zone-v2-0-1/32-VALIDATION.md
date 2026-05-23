---
phase: 32
slug: mod-management-hot-zone-v2-0-1
status: signed-off
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-22
signed_off: 2026-05-22
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 32 is conflict-resolution, not feature build. The validation surface is
> playbook gate preservation + atomic-commit hygiene + bucket-scoped typecheck
> drift, not unit-test green. See 32-RESEARCH.md §Validation Architecture for
> dimension rationale.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | none — Phase 32 uses bash harness + tsc, not a test runner                                                                                                                                      |
| **Config file**        | `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` (created in plan 01 from v8.0 origin)                                                                           |
| **Quick run command**  | `bash .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh`                                                                                                            |
| **Full suite command** | `bash .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh && pnpm typecheck -F @vortex/renderer 2>&1 \| grep "extensions/mod_management/" \| grep -v TS1185 \| wc -l` |
| **Estimated runtime**  | ~8 seconds (grep harness ~1s, scoped typecheck ~7s)                                                                                                                                             |

---

## Sampling Rate

- **After every task commit:** Run quick command (grep-checkpoint.sh — 7 gates, aggregate-fail design, exits 0 only when all gates pass)
- **After every plan wave:** Run full suite (harness + scoped typecheck error-count comparison vs baseline)
- **Before `/gsd:verify-phase`:** Full suite must show harness exit 0 AND mod_management/ error count = 0 (excluding cascade-from-Phase-33/34 markers)
- **Max feedback latency:** ~8 seconds

---

## Per-Task Verification Map

> Each per-file resolution task ran the same automated pair: harness gate run + mod_management/ scoped error count.
> Status reflects post-Phase-32 final state.

| Task ID      | Plan  | Wave | Requirement | Threat Ref | Secure Behavior                                                                | Test Type | Automated Command                                                                                          | File Exists | Status   |
| ------------ | ----- | ---- | ----------- | ---------- | ------------------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------- | ----------- | -------- |
| 32-01-T1     | 32-01 | 0    | SYNC-32a    | —          | harness scaffolded, baseline captured                                          | gate      | `bash .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check` | ✅          | ✅ green |
| 32-02-T1..T7 | 32-02 | 1    | SYNC-32a    | —          | leaf files marker-free; Wine-era preserved                                     | gate      | harness skip-mode + bucket-scoped tsc                                                                      | ✅          | ✅ green |
| 32-03-T1..T5 | 32-03 | 2    | SYNC-32a    | —          | mid-tier marker-free; transferPath preserved                                   | gate      | harness skip-mode + bucket-scoped tsc                                                                      | ✅          | ✅ green |
| 32-04-T1..T2 | 32-04 | 3    | SYNC-32a    | —          | playbook-heavy: §6/§7a-d/140a57217 preserved (8/8 dangerous regions fork-side) | gate      | harness skip-mode + bucket-scoped tsc                                                                      | ✅          | ✅ green |
| 32-05-T1     | 32-05 | 4    | SYNC-32a    | —          | barrel marker-free; gate 7 flips GREEN in default mode                         | gate      | harness DEFAULT mode + bucket-scoped tsc                                                                   | ✅          | ✅ green |
| 32-06-T1..T3 | 32-06 | 5    | SYNC-32a    | —          | phase-end verification: 7/7 gates GREEN, 0 markers, D-32-12 intact             | gate      | harness DEFAULT mode + bucket-scoped tsc + git audit                                                       | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` — extracted from git `7ed691f40:.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` (Plan 01)
- [x] Harness chmod +x and dry-run cleanly: gates 1-6 PASS pre-resolution; gate 7 expected-FAIL until phase end (Plan 01 verified)
- [x] Baseline measurement captured: pre-resolution mod_management/ non-marker error count = 260 (all in `views/ModList.tsx`); post-Phase-32 = 0

---

## Manual-Only Verifications

| Behavior                                                                                                                                | Requirement                | Why Manual                                                                                            | Test Instructions                                                                                                                                                                                                            | Status                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Per-region resolution stance was correct (fork-wins on playbook surface, upstream-wins on new scaffolding, smaller-diff otherwise)      | SYNC-32a (D-32-02)         | Cannot be automated — requires reading each region against the playbook surface map in RESEARCH.md §2 | Executor reads each conflict region; commit body records the per-region stance per D-32-09                                                                                                                                   | ✅ done                                                                                                                       |
| 140a57217 `externalChanges()` method body in LinkingDeployment.ts has all 3 `resolvePathCase(dataPath, …)` calls intact post-resolution | SYNC-32a (D-32-11/D-32-12) | grep alone catches deletion but not arg-rename — requires human read of the method body               | After LinkingDeployment.ts resolution: `grep -n resolvePathCase src/renderer/src/extensions/mod_management/LinkingDeployment.ts` (≥3 hits) AND read of `externalChanges()` method body to confirm `dataPath` argument intact | ✅ done (3 hits at L523/742/799; arg shape `resolvePathCase(dataPath, relDataPath, dirCache)` intact per Plan 04 commit body) |

---

## Validation Sign-Off

- [x] All 15 file-resolution tasks have grep-checkpoint.sh + scoped-typecheck verify pair
- [x] Sampling continuity: harness ran after every commit (per D-32-09; commit-body audit confirms exit codes recorded)
- [x] Wave 0 covers harness setup + baseline measurement
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set

**Approval:** signed-off (2026-05-22)

---

## Phase-End Sign-Off

**Date:** 2026-05-22
**Branch:** `v8.1/config-bucket`
**Sign-off commit:** appended in this same change.

| Check                                                                                                              | Result                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Final harness exit (DEFAULT mode, no `--skip-conflict-check`)                                                      | **0** — all 7 gates PASS including gate 7 (no-marker)                                                     |
| Final bucket-scoped typecheck for `extensions/mod_management/`                                                     | **0** non-marker errors                                                                                   |
| Single-host invariant (D-32-12) re-verified                                                                        | **yes** — `resolvePathCase(dataPath, …)` confined to `LinkingDeployment.ts` (3 hits at L523/742/799)      |
| Total `^<<<<<<< ` markers across `mod_management/`                                                                 | **0**                                                                                                     |
| Commit-body audit (D-32-09 + Pattern S5)                                                                           | **15/15 substantively conform**; 12/15 use slight keyword variants — see "Process improvement note" below |
| SSH-signing audit (gpgsig header presence in raw commit objects)                                                   | **20/20 PASS** — 15 file-resolution + 4 wave-summary + 1 sign-off all carry `gpgsig` header               |
| Bluebird R5 status                                                                                                 | latent — no new bluebird imports introduced across all 15 files                                           |
| Sentinel files (`util/stagingIntegrity.ts`, `util/normalizeBackslashPaths.ts`, `util/mergeCaseConflictingDirs.ts`) | all present                                                                                               |

### Process improvement note (carry to v8.2)

12/15 file-resolution commit bodies omit one or more of the literal Pattern S5 field labels (`pnpm typecheck mm-bucket:`, `Playbook gates preserved:`, `--no-verify used:`). The substance is present in every commit body — exit codes, gate states, region counts, fork-vs-upstream-vs-smaller-diff splits all recorded — but the executor used minor keyword variants such as `pnpm typecheck mm-bucket for X: 0 non-marker errors` and `Playbook gate preserved: yes` (singular, no `affected:` line). LinkingDeployment.ts and InstallManager.ts diverged most: their bodies use a narrative form rather than a labelled-field form, but every required datum is present and the harness/typecheck numbers are auditable. **Decision:** not a regression for Phase 32 — substance preserved, audit fully traceable. Carry to v8.2 as a process-improvement note: have planners encode literal Pattern S5 field labels in PLAN templates so executors copy them verbatim.

Phase 32 verified complete. Ready for STATE.md update + ROADMAP.md tick.
