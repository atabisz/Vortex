---
phase: 32
slug: mod-management-hot-zone-v2-0-1
status: complete
branch: v8.1/config-bucket
requirements: [SYNC-32a]
files_resolved: 15
regions_resolved: 97
dangerous_regions_preserved: 8
plans:
    - 32-01 (Wave 0 — harness scaffold + baseline)
    - 32-02 (Wave 1 — leaf tier, 7 files / 12 regions)
    - 32-03 (Wave 2 — mid tier, 5 files / 19 regions)
    - 32-04 (Wave 3 — playbook-heavy, 2 files / 48 regions)
    - 32-05 (Wave 4 — barrel, 1 file / 18 regions)
    - 32-06 (Wave 5 — verification + sign-off)
commits:
    scaffold: e352eeff0
    file_resolutions:
        wave_1:
            - d516282d4 # NotificationAggregator.ts
            - caf800771 # util/VersionFilter.tsx
            - c7117fe1f # util/removeMods.ts
            - 3fad4e4a4 # util/activationStore.ts
            - d4f04c08b # util/externalChanges.ts
            - 867ba6d20 # util/deploy.ts
            - 8eb48a46c # stagingDirectory.ts
        wave_2:
            - d231c12e8 # modMerging.ts
            - 282a4378f # views/DeactivationButton.tsx
            - aec6d3125 # views/Settings.tsx
            - cb4453cfc # eventHandlers.ts
            - d9d98be7c # views/ModList.tsx
        wave_3:
            - 3424cb5d3 # LinkingDeployment.ts
            - 392a5fbb9 # InstallManager.ts
        wave_4:
            - 21e88fa9b # mod_management/index.ts
    wave_summaries:
        - 8f0765278 # 32-02
        - f03c54340 # 32-03
        - eb87364a9 # 32-04
        - 6377090c2 # 32-05
metrics:
    duration: ~6 days (research → discuss → plan → execute, 2026-05-16 → 2026-05-22)
    completed: 2026-05-22
    harness_final_exit: 0
    typecheck_mm_bucket_final: 0
    markers_remaining: 0
    ssh_signed_commits: 20/20
---

# Phase 32: Mod-management hot zone (v2.0.1) — Phase Summary

## Phase 32 Outcome

15 conflict files in `src/renderer/src/extensions/mod_management/` resolved across 97 conflict regions on `v8.1/config-bucket`. All 6 named playbook surfaces (§6 stagingDirHasFiles, §7a normalizeBackslashPaths, §7b mergeCaseConflictingDirs, §7c copy-loop backslash→slash, §7d resolvePathCase(tempPath,…), 140a57217 resolvePathCase(dataPath,…)) preserved; the 8/8 dangerous fork-side regions (3 errorCodes blocks in LinkingDeployment.ts, 5 in InstallManager.ts: import-block dup-avoidance @22, 2 §7a+§7b call pairs @1165 and @3852, §6 stagingDirHasFiles guard @6473, fork-removal of DynamicDownloadConcurrencyLimiter @244) all kept HEAD-side. Harness exits **0 in default mode** with all 7 gates GREEN. Bucket-scoped typecheck for `extensions/mod_management/` collapsed from a 260-error baseline (all in `views/ModList.tsx` JSX cascade) to **0 non-marker errors**. Single-host invariant D-32-12 held: `resolvePathCase(dataPath, …)` remains confined to `LinkingDeployment.ts` (3 hits at L523/742/799). Bluebird R5 trap stayed latent — no new imports introduced.

## Resolution Tally

**Plans:** 01 (harness + baseline) → 02 (leaf, 7) → 03 (mid, 5) → 04 (playbook-heavy, 2) → 05 (barrel, 1) → 06 (verification + sign-off).

**Commit topology on `v8.1/config-bucket`:**

| Tier                    |  Files | Regions | Resolution commits                                                          | Wave summary                   |
| ----------------------- | -----: | ------: | --------------------------------------------------------------------------- | ------------------------------ |
| Wave 0 — scaffold       |      — |       — | `e352eeff0` (chore)                                                         | (in 32-01-SUMMARY.md)          |
| Wave 1 — leaf           |      7 |      12 | d516282d4, caf800771, c7117fe1f, 3fad4e4a4, d4f04c08b, 867ba6d20, 8eb48a46c | `8f0765278`                    |
| Wave 2 — mid            |      5 |      19 | d231c12e8, 282a4378f, aec6d3125, cb4453cfc, d9d98be7c                       | `f03c54340`                    |
| Wave 3 — playbook-heavy |      2 |      48 | 3424cb5d3, 392a5fbb9                                                        | `eb87364a9`                    |
| Wave 4 — barrel         |      1 |      18 | 21e88fa9b                                                                   | `6377090c2`                    |
| Wave 5 — sign-off       |      — |       — | (this commit)                                                               | (this file + 32-06-SUMMARY.md) |
| **Totals**              | **15** |  **97** | **15**                                                                      | **4 wave summaries**           |

**Total commits added by Phase 32:** 1 scaffold + 15 file-resolutions + 4 wave summaries + 1 sign-off = **21 commits** on `v8.1/config-bucket`.

**Per-region stance distribution (across all 97 regions):**

| Stance                                                 |     Count | Notes                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | --------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork-wins (HEAD playbook/Wine/errorCodes preservation) |       ~15 | activationStore Wine block (×2), Settings transferPath (×1), LinkingDeployment errorCodes (×3), InstallManager dangerous regions (×6 fork-side: §6 + 2×§7a/b pairs + import-block + fork-removal + 2 dup-import siblings), and sundry HEAD-empty dup-import-avoidance regions across leaf/mid waves |
| Upstream-wins (genuine v2.0.1 additions)               | 1 partial | ModList.tsx region 2 (controls Dropzone/UpdateState — actual new symbols needed)                                                                                                                                                                                                                    |
| Smaller-diff (HEAD shorter, mostly Prettier line-wrap) |       ~81 | overwhelming majority across all tiers — every region in barrel, most of InstallManager + LinkingDeployment, all of leaf line-wraps                                                                                                                                                                 |

(The "fork-wins vs HEAD-empty-for-dup-avoidance" line is fuzzy — both are HEAD-side stances. The 8 dangerous regions per RESEARCH §1 + Wave 3 surfacing are the load-bearing fork-wins; everything else HEAD-side is either bystander preservation or smaller-diff.)

## Playbook Surfaces Preserved

| Surface                                                                  | Host                                | Pre-resolution evidence                         | Post-Phase-32 evidence                                       | Status |
| ------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ | ------ |
| §6 stagingDirHasFiles guard in `doDownload`                              | `InstallManager.ts`                 | 2 hits (import + 1 call) per Plan 04 pre-grep   | 2 hits                                                       | ✅     |
| §7a normalizeBackslashPaths                                              | `InstallManager.ts`                 | 5 hits                                          | 5 hits                                                       | ✅     |
| §7b mergeCaseConflictingDirs                                             | `InstallManager.ts`                 | 3 hits                                          | 3 hits                                                       | ✅     |
| §7c copy-loop `replaceAll("\\","/")`                                     | `InstallManager.ts`                 | 2 hits (source + destination)                   | 2 hits                                                       | ✅     |
| §7d `resolvePathCase(tempPath, …)` in copy loop                          | `InstallManager.ts`                 | 1 hit                                           | 1 hit                                                        | ✅     |
| 140a57217 `resolvePathCase(dataPath, …)` (sole host per D-32-12)         | `LinkingDeployment.ts`              | 3 hits at L599/L818/L875 (pre-resolution drift) | 3 hits at L523/L742/L799 (line drift expected — file shrunk) | ✅     |
| Wine-era Proton fork-only block                                          | `util/activationStore.ts`           | 8 grep hits (`isWineEraManifest` + Wine block)  | 8 hits                                                       | ✅     |
| `transferPath` import + 4 call sites (playbook §4)                       | `views/Settings.tsx`                | 4 hits at L58/321/381/568                       | 4 hits                                                       | ✅     |
| `errorCodes.add(getErrorCode(err) ?? "UNKNOWN")` Linux error-aggregation | `LinkingDeployment.ts` @212/238/272 | 5 fork-master baseline hits                     | 5 hits                                                       | ✅     |

Final harness output (default mode):

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
OK:   no conflict markers in src/renderer/src/extensions/mod_management/

CHECKPOINT PASSED — 7 gate(s) clean
```

## Harness + Typecheck Final Numbers

| Metric                                                                    |                     Value | Source                                                                                               |
| ------------------------------------------------------------------------- | ------------------------: | ---------------------------------------------------------------------------------------------------- |
| Harness exit code (default mode, no `--skip-conflict-check`)              |                     **0** | `bash .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` (Wave 5 task 1) |
| Harness gates passed                                                      |                   **7/7** | gate 7 (no-marker) flipped GREEN at end of Wave 4                                                    |
| Bucket-scoped typecheck non-marker errors in `extensions/mod_management/` |                     **0** | `cd src/renderer && pnpm tsc -p tsconfig.json` then grep filter                                      |
| Total `^<<<<<<< ` markers in `mod_management/`                            |                     **0** | `git grep -c '^<<<<<<< '`                                                                            |
| `resolvePathCase(dataPath, …)` hits in `mod_management/`                  |                     **3** | all in `LinkingDeployment.ts` (D-32-12 invariant)                                                    |
| Renderer-wide non-marker errors (informational, NOT gating)               | ≈347 in Phase 33/34 paths | per RESEARCH §5 — gamebryo + per-game extensions + ExtensionManager + controls                       |

The renderer-wide 347 is expected and explicitly out of scope per CONTEXT — Phases 33/34 own that surface. Phase 32's gate is the bucket; the bucket is clean.

## Risks Cleared

| ID  | Risk                                                                                  | Mitigation outcome                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | InstallManager.ts blast radius (40 regions, 6 dangerous)                              | All 40 resolved as one atomic commit (`392a5fbb9`); 6 fork-side dangerous regions per RESEARCH §1 preserved + 2 dup-import siblings (@108/@134) surfaced and held HEAD-side; harness 6/6 gates GREEN immediately post-commit |
| R2  | LinkingDeployment.ts as 140a57217 host (D-32-12 single-host)                          | Pre/post grep snapshots match (3→3 hits, line drift expected); `externalChanges()` body read-confirmation done; D-32-12 invariant re-verified at phase end                                                                   |
| R3  | Husky on partial markers (D-32-10)                                                    | All 15 commits committed cleanly; no `--no-verify` used in any of the 15 file-resolution commits                                                                                                                             |
| R4  | Bucket-scoped typecheck regression                                                    | mm-bucket non-marker count 260 → 0; collapse predicted by RESEARCH §5 (entire baseline was JSX cascade in `views/ModList.tsx`)                                                                                               |
| R5  | Bluebird trap (TS1064 on `:Promise<void>` annotations when bluebird Promise imported) | Stayed latent across all 15 files — no new bluebird imports introduced; risk dormant per memory `feedback_bluebird_promise_trap.md`                                                                                          |

## Decisions Honored

| ID      | Decision                                                                       | Honor evidence                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-32-01 | Leaf-first resolution order                                                    | Wave 1 (leaf) → Wave 2 (mid) → Wave 3 (playbook-heavy) → Wave 4 (barrel); all dependents stable when each tier resolved                                   |
| D-32-02 | Per-region hand-resolve, fork-wins on playbook surface                         | Every region inspected; fork-wins applied at all dangerous sites                                                                                          |
| D-32-03 | No blanket `--ours`/`--theirs`                                                 | All 97 regions hand-resolved                                                                                                                              |
| D-32-04 | Re-use v8.0 harness verbatim                                                   | Extracted from git `7ed691f40`, dropped at `scripts/grep-checkpoint.sh` (Wave 0)                                                                          |
| D-32-05 | No new gates unless v2.0.1 introduces new playbook sites                       | Wave 0 inspection confirmed zero new sites; harness used as-is                                                                                            |
| D-32-06 | Typecheck after every file commit                                              | Recorded in commit bodies (substance present in all 15)                                                                                                   |
| D-32-07 | Harness after every file commit                                                | Recorded in commit bodies (all 15 record `grep-checkpoint.sh` exit)                                                                                       |
| D-32-08 | One commit per resolved file                                                   | 15 files = 15 `resolve(mod-mgmt-v2.0.1):` commits                                                                                                         |
| D-32-09 | Commit body records gates / regions / harness exit / typecheck / `--no-verify` | Substance present in 15/15; literal field labels in 3/15 (process-improvement note carried to v8.2 — see VALIDATION.md)                                   |
| D-32-10 | No `--no-verify` unless husky cannot parse partial markers                     | Zero usages across all 15 commits                                                                                                                         |
| D-32-11 | 140a57217 grep-pre/post + read-confirmation                                    | Done in Plan 04 (LinkingDeployment.ts); pre-snapshot 3 hits at L599/818/875 → post-snapshot 3 hits at L523/742/799 (count unchanged, line drift expected) |
| D-32-12 | LinkingDeployment.ts is sole 140a57217 host                                    | Re-verified at phase end: only LinkingDeployment.ts has `resolvePathCase(dataPath, …)` hits (3 of them)                                                   |
| D-32-13 | Phase 32 covers all 15 mod_management/ conflict files                          | All 15 resolved (8 ROADMAP-named + 7 expansion)                                                                                                           |
| D-32-14 | SYNC-32a wording stands; expansion is implicit                                 | REQUIREMENTS.md unchanged; expansion files satisfy the "every playbook §6/§7/externalChanges site preserved" clause                                       |
| D-32-15 | Continue on `v8.1/config-bucket`                                               | Phase 32 commits stack on Phase 31's 13 commits on the same branch; no new branch created                                                                 |

## Forward-Pointer

**STATE.md / ROADMAP.md update:** operator-side via `gsd-sdk` `complete-phase` (next workflow). This phase plan does not touch them.

- STATE.md: Phase 32 → complete; current_phase → 33
- ROADMAP.md: tick Phase 32 box

**Push to fork:** sandbox cannot push (per memory `feedback_git_push_ssh.md`); operator pushes:

```
git push git@github.com:atabisz/Vortex.git v8.1/config-bucket
```

**Deferred items (unchanged from carry-forward):**

- R2 Jest `__mocks__/` consolidation — Phase 34
- R3 orphan `electron-builder.config.json` — Phase 35
- Lint pass on resolved files — Phase 35 (SYNC-35b)
- Promoting `grep-checkpoint.sh` to `release-linux.yml` CI — Phase 35

**Phase 33 (next):** per ROADMAP, scope TBD by `/gsd:discuss-phase 33` (gamebryo + per-game extensions).

---

**Phase 32 verified complete.** 15 mod_management/ files / 97 conflict regions / 7 harness gates green / 0 non-marker typecheck errors / D-32-12 single-host invariant intact / 20 SSH-signed commits.
