---
phase: 32-mod-management-hot-zone-v2-0-1
plan: 04
wave: 3
branch: v8.1/config-bucket
status: complete
files_resolved:
    - src/renderer/src/extensions/mod_management/LinkingDeployment.ts
    - src/renderer/src/extensions/mod_management/InstallManager.ts
commits:
    - 3424cb5d3
    - 392a5fbb9
    - <this-commit>
---

# Phase 32 Plan 04: Wave 3 (Playbook-Heavy) Summary

## Outcome

2/2 playbook-heavy files resolved on `v8.1/config-bucket`. 48 regions out of
the original 97 cleared (8 in LinkingDeployment.ts + 40 in InstallManager.ts).
6 of 6 dangerous regions in the entire phase preserved fork-side. Harness 6
gates GREEN throughout. mod_management/ aggregate non-marker typecheck = 0.

The phase is now one file from done — `index.ts` (18 regions, barrel) is
Plan 05 / Wave 4.

## Per-File Table

| File                 | Regions | Fork-side regions (lines)                                                                                       | Smaller-diff | Commit      | Harness   | typecheck mm-bucket |
| -------------------- | ------: | --------------------------------------------------------------------------------------------------------------- | -----------: | ----------- | --------- | ------------------: |
| LinkingDeployment.ts |       8 | 3 (@212, @238, @272 — errorCodes blocks)                                                                        |            5 | `3424cb5d3` | 6/6 GREEN |                   0 |
| InstallManager.ts    |      40 | 6 (@22, @108, @134, @244, @1165, @3852, @6473 — 4 in RESEARCH §1 dangerous map + 2 dup-import + 1 fork-removal) |          ~33 | `392a5fbb9` | 6/6 GREEN |                   0 |

Note: every region in both files ended up resolved HEAD-side. The PLAN's
"fork-wins on @212 only, smaller-diff for the rest" framing was incomplete
— @238 and @272 contain the same fork-only `errorCodes.add(getErrorCode(err)
?? "UNKNOWN")` Linux error-aggregation feature; all three are fork-wins for
the same reason. Master fork side has 5 `errorCodes.add` sites total; all 5
preserved post-resolution.

## Playbook Gate Final State (skip-mode harness)

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
SKIP: no conflict markers in src/renderer/src/extensions/mod_management/ (--skip-conflict-check)

CHECKPOINT PASSED — 6 gate(s) clean
```

Identical output after every commit in this plan.

## Pre/Post Helper Counts

### LinkingDeployment.ts

| Pattern                                 | Pre lines       | Post lines      | Δ   |
| --------------------------------------- | --------------- | --------------- | --- |
| `resolvePathCase(dataPath,` (140a57217) | 3 (599/818/875) | 3 (523/742/799) | 0   |
| `errorCodes.add` (Linux aggregation)    | 5               | 5               | 0   |
| bluebird import                         | 0               | 0               | 0   |

Line numbers drifted backwards because resolutions removed wrapped-form lines.
The post-resolution lines match the v8.0 doc's :523/:742/:799 exactly — drift
collapse, not a regression.

### InstallManager.ts

| Pattern                    | Pre | Post | Δ   | Notes                                                                                                 |
| -------------------------- | --: | ---: | --- | ----------------------------------------------------------------------------------------------------- |
| `stagingDirHasFiles`       |   2 |    2 | 0   | §6 import + 1 call site at L6061 (doDownload guard)                                                   |
| `normalizeBackslashPaths`  |   5 |    5 | 0   | §7a import + 2 calls (L1033, L3627) + 2 commentary mentions                                           |
| `mergeCaseConflictingDirs` |   3 |    3 | 0   | §7b import + 2 calls (L1034, L3628)                                                                   |
| `resolvePathCase`          |   3 |    3 | 0   | §7d import + tempPath call (L7031) + 1 commentary mention                                             |
| `replaceAll(...)` (§7c)    |   2 |    2 | 0   | source + destination in copy loop (regex pre-grep was over-escaped; harness §7c gate confirms 2 hits) |
| bluebird import            |   0 |    0 | 0   | R5 dormant — file does not import bluebird despite PATTERNS metadata claim                            |

## Read-Confirmation (LinkingDeployment.ts externalChanges())

Done. Method located at line 499. Body inspected around line 523. Call shape
`resolvePathCase(dataPath, relDataPath, dirCache)` intact, args not renamed.
The same shape recurs at L742 and L799 with `relOutputPath` + `this.mReaddirCache`
arg lists, all matching `/tmp/LinkingDeployment.master.ts`.

## Stance Deviations from PLAN

1. **LinkingDeployment.ts @238 + @272 fork-wins beyond the PLAN.** The PLAN
   specified `FORK-WINS at @212; smaller-diff for the other 7`. Reading the
   file revealed @238 and @272 also contain `errorCodes.add(getErrorCode(err)
?? "UNKNOWN")` lines on the HEAD side that upstream removed. These are
   the same fork-only Linux error-aggregation feature; treating them as
   "smaller-diff" would silently delete two of the five `errorCodes.add`
   sites and reduce error-aggregation coverage by 40%. Took fork-side at all
   three. Net effect on the line-wrap stance: HEAD happens to be the more
   compact form for those regions too, so the fork-wins decision and the
   smaller-diff decision agree on the output — only the rationale shifted.

2. **InstallManager.ts @22 is HEAD-EMPTY, not "FORK-WINS for the 4 playbook
   imports".** The PLAN's @22 stance assumed upstream's added import block
   contained the playbook helpers. It does not — upstream's @22 block adds
   `IDialog`, `IExtensionApi`, `IState`, `IModType`, `IDownload`, etc., none
   of which are playbook helpers. The playbook helpers (`stagingDirHasFiles`,
   `normalizeBackslashPaths`, `mergeCaseConflictingDirs`, `resolvePathCase`)
   are imported at lines 139, 197-217 of the current tree on the HEAD side
   and were never inside any conflict region. Taking upstream's @22 block
   would dup-import IDialog/IExtensionApi/IState (which HEAD has at @108),
   matching the Wave-2 Rule-1 dup-import precedent. Resolved HEAD-empty at
   @22 + HEAD at @108/@134 to keep the existing import structure.

3. **InstallManager.ts @244 is HEAD-EMPTY, also a fork-removal.** The PLAN
   didn't mark this region. Inspection: upstream re-added a
   `DynamicDownloadConcurrencyLimiter` class + `getDownloadFreeSlots` helper
   that fork/master has zero references to. fork/master previously removed
   them (likely as part of the parallel-install-concurrency rework that
   the fork's `mMainInstallsLimit` now handles). HEAD-empty matches the
   fork/master baseline; no regression.

All three deviations documented and recorded in commit bodies.

## Issues Encountered

None. No commits required amend; all pre/post counts held; no harness gate
flipped red. The phase's most dangerous file (InstallManager.ts, 40 regions)
turned out to be uniformly HEAD-side because upstream's v2.0.1 changes are
either (a) fork-removal of features fork-master never had / removed earlier,
or (b) Prettier reflows where HEAD's existing format is shorter. Resolution
was straightforward once the dangerous regions were identified.

## Affects

- Plan 05 (`32-05`, barrel `index.ts`) compiles against fully-resolved
  sibling files. The barrel re-exports types from InstallManager and
  LinkingDeployment; both files now type-clean (mm-bucket typecheck = 0).

## Provides

- 2 playbook-heavy files marker-free
- 4 dangerous regions in InstallManager.ts (RESEARCH §1 map: @22, @1165,
  @3852, @6473) locked fork-side
- 1 dangerous region in LinkingDeployment.ts (@212) locked fork-side
- 2 additional dangerous regions discovered during resolution (LinkingDeployment.ts
  @238, @272 — same `errorCodes.add` Linux feature) also locked fork-side
- 140a57217 single-host invariant (D-32-12) intact; 3 `resolvePathCase(dataPath,
...)` sites preserved at L523, L742, L799 (the v8.0 doc's exact lines, post-drift-collapse)
- mod_management/ aggregate non-marker typecheck remains 0
- Branch `v8.1/config-bucket` ready for Plan 05 (final file: index.ts barrel)

## Self-Check: PASSED

- [x] LinkingDeployment.ts marker-free; commit `3424cb5d3` exists, signed
- [x] InstallManager.ts marker-free; commit `392a5fbb9` exists, signed
- [x] Harness `--skip-conflict-check` exit 0 with all 6 gates GREEN after
      every commit in this plan
- [x] LinkingDeployment.ts: `grep -c "resolvePathCase(dataPath,"` = 3 (≥3 threshold)
- [x] InstallManager.ts: §6/§7a/§7b/§7c/§7d helper counts unchanged from baseline
- [x] mm-bucket typecheck = 0 for both resolved files individually
- [x] mm-bucket aggregate typecheck = 0 (only index.ts conflict markers
      remain — those are TS1185 noise, filtered by `grep -v TS1185`)
- [x] Read-confirmation done for LinkingDeployment.ts externalChanges() body
