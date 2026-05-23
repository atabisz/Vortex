---
phase: 34
plan: 00
type: execute
wave: 0
status: complete
requirements:
    - SYNC-34a
duration_minutes: ~10
files_modified:
    - .planning/phases/34-renderer-main-spine-v2-0-1/scripts/grep-checkpoint.sh
    - .planning/phases/34-renderer-main-spine-v2-0-1/34-00-SUMMARY.md
provides:
    - "13-gate aggregate-fail harness for Phase 34 (renderer + main spine v2.0.1)"
    - "Pre-flight baseline: 117 conflict files / 1203 regions outside .planning/"
    - "Single-host getIPCPath invariant (gate-13) protects D-04 IPC serialisation trap memory through Wave E + F3"
    - "Broadened gate-14 marker check covers Phase 34 hand-resolution surface (whole repo outside .planning/)"
key_decisions:
    - "Gate-13 numbering: append before marker gate, marker gate renumbered 12→14"
    - "Gate-14 marker scope broadened from mod_management/+extensions/ (Phase 33) to whole repo outside .planning/ (Phase 34) — without this the done-gate would silently pass on a tree still full of Phase-34 markers"
---

# Phase 34 Plan 00: Wave 0 harness setup — Summary

Copied the Phase 33 12-gate harness verbatim into Phase 34's scripts dir, added gate-13 (single-host `getIPCPath`) per [D-34-04] / RESEARCH §Validation Architecture, broadened gate-14's marker check to cover Phase 34's hand-resolution surface. Skip-mode passes 12/12 against the pre-resolution tree. Waves A–H unblocked.

## Pre-flight check results (Task 1)

| #   | Check                                          | Expected                                                    | Actual                                                                                    | Result                        |
| --- | ---------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | Branch                                         | `v8.1/config-bucket`                                        | `v8.1/config-bucket`                                                                      | OK                            |
| 2   | Conflict files outside `.planning/`            | 117                                                         | 117                                                                                       | OK                            |
| 3   | Files outside `.planning/` + `extensions/`     | 116                                                         | **117**                                                                                   | OK with deviation (see below) |
| 4a  | renderer file count                            | 68                                                          | 68                                                                                        | OK                            |
| 4b  | main file count                                | 9                                                           | 9                                                                                         | OK                            |
| 4c  | preload file count                             | 1                                                           | 1                                                                                         | OK                            |
| 4d  | shared file count                              | 5                                                           | 5                                                                                         | OK                            |
| 5   | working tree clean (excl. untracked)           | yes                                                         | yes                                                                                       | OK                            |
| 6   | SSH signing active                             | `gpg.format=ssh`, `commit.gpgsign=true`                     | matches                                                                                   | OK                            |
| 7   | Phase 33 harness present + executable          | yes                                                         | yes                                                                                       | OK                            |
| 8   | Phase 33 skip-mode                             | exit 0 (12/12 GREEN)                                        | exit 0 (11 OK + 1 SKIP)                                                                   | OK                            |
| 9   | D-34-10 single-host `resolvePathCase(dataPath` | 1 host = LinkingDeployment.ts                               | 1 host = LinkingDeployment.ts                                                             | OK                            |
| 10a | gate-13 export host                            | 1                                                           | 1                                                                                         | OK                            |
| 10b | gate-13 importers                              | ≥4                                                          | 4 (ExtensionManager.ts, symlink_activator_elevate/index.ts, util/elevated.ts, util/fs.ts) | OK                            |
| 11  | R2 audit (informational)                       | 23 mocks, 0 refs, no jest config, vitest.config.mts present | matches                                                                                   | OK                            |
| 12  | per-bucket tsconfigs                           | all six exist                                               | all six exist                                                                             | OK                            |

### Deviation on item 3 (plan expected 116, actual 117)

The plan's [RESEARCH §Marker Scope Verification] expected 1 conflict-marker file inside `extensions/` (which would put 116 files outside `.planning/ + extensions/`, with 1 inside). On the current tree (`v8.1/config-bucket` HEAD) `extensions/` is already clean (`git grep -l '^<<<<<<< ' extensions/` returns 0 files). All 117 hand-resolution files are outside `extensions/` — the renderer/main/preload/shared/repo-wide buckets carry the entire load. This is a documentation drift in the plan against actual repo state, not a structural issue: the harness logic doesn't depend on this number. Phase 34's hand-resolution surface is in fact 117 files (slightly larger than the plan estimated), all outside `extensions/`.

This deviation is auto-accepted under Rule 3 (the plan's pre-flight expectation was wrong; reality is consistent — the work to resolve markers is the same set of files, just one bucket-count off in the plan). Forwarded to Waves A–H so the per-wave plan counts can be reconciled.

## Harness origin and diff

- **Source:** `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh` (281 lines, 12 gates)
- **Target:** `.planning/phases/34-renderer-main-spine-v2-0-1/scripts/grep-checkpoint.sh` (324 lines, 13 gates)
- **Lineage:** Phase 26 (`7ed691f40`) → Phase 32 (v8.1 base) → Phase 33 (added gates 7–11) → Phase 34 (this; added gate-13)
- **Lines added:** 43 (header rewrite covering Phase 34 framing and the 14/15/16 skip rationale, gate-13 block, gate-14 marker-scope broadening with rationale)
- **Gates added:** 1 (gate-13 single-host `getIPCPath`)
- **Gates renumbered:** 1 (marker gate 12 → 14, with scope broadened — see below)
- **Gates unchanged:** 11 (gates 1–11 verbatim from Phase 33)

## Gate-13: single-host `getIPCPath`

Sentinel:

- Exactly 1 line matching `^export function getIPCPath` in `src/renderer/src/util/ipc.ts`
- ≥4 of these importers contain `import.*getIPCPath.*from`:
    - `src/renderer/src/ExtensionManager.ts`
    - `src/renderer/src/extensions/symlink_activator_elevate/index.ts`
    - `src/renderer/src/util/elevated.ts`
    - `src/renderer/src/util/fs.ts`

Why: protects the D-04 IPC serialisation trap memory. The parent-server + stringified-child-closure dual-patch lives across these 5 files. Any second host or dropped importer at Wave E (`extensions/symlink_activator_elevate/index.ts` resolution) or Wave F3 (`ExtensionManager.ts` resolution) would silently break IPC; gate-13 fails the harness immediately so the executor surfaces the problem instead of committing a regression.

## Gate-14: marker scope broadening

Original (Phase 33): scoped to `src/renderer/src/extensions/mod_management/` + `extensions/`. Both are clean on the current tree, so the gate would silently pass even if all 117 Phase 34 files still had markers.

New (Phase 34): `git grep -l '^<<<<<<< ' | grep -v '^\.planning/'` — covers the full Phase 34 hand-resolution surface. Done-gate (run without `--skip-conflict-check` at end of Phase 34) now actually asserts full marker eradication. Per-file commits during waves A–H continue to use `--skip-conflict-check` so the gate is suppressed during in-flight resolution.

This is a Rule 2/3 fix (missing critical functionality) — the plan explicitly stated full-mode dry-run should fail because of 1203 markers in 117 files, but the inherited Phase 33 gate was scoped narrowly and would have passed. Broadening was required for the harness to do its actual job.

## D-34-04 / RESEARCH §Validation Architecture: gates 14/15/16 SKIPPED

| Candidate gate | Skip rationale                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gate-14-cand   | Already cross-platform — no new pattern needed; existing platform-guards survive review                                                                  |
| gate-15-cand   | Covered by L1 + commit-body discipline; error classes live in `src/shared/src/types/errors.ts` and Phase 34 handles via per-file review, not a grep gate |
| gate-16-cand   | Trivial post-Wave-H R2 DROP — the `__mocks__` tree gets removed before any test that could rely on auto-mocking runs                                     |

(Note: my "gate-14" is the broadened marker gate, distinct from the candidate "gate-14-cand" that was skipped.)

## D-34-05 inspection: no new playbook surface in v2.0.1

Sampled `fork/sync/upstream-v2.0.1` for new playbook surfaces:

```
$ git grep -c '^export function getIPCPath' fork/sync/upstream-v2.0.1 -- src/
fork/sync/upstream-v2.0.1:src/renderer/src/util/ipc.ts:1

$ git grep -l 'getIPCPath' fork/sync/upstream-v2.0.1 -- src/
fork/sync/upstream-v2.0.1:src/renderer/src/ExtensionManager.ts
fork/sync/upstream-v2.0.1:src/renderer/src/extensions/symlink_activator_elevate/index.ts
fork/sync/upstream-v2.0.1:src/renderer/src/util/elevated.test.ts
fork/sync/upstream-v2.0.1:src/renderer/src/util/elevated.ts
fork/sync/upstream-v2.0.1:src/renderer/src/util/fs.ts
fork/sync/upstream-v2.0.1:src/renderer/src/util/ipc.test.ts
fork/sync/upstream-v2.0.1:src/renderer/src/util/ipc.ts

$ git grep -lE 'resolvePathCase\(dataPath,' fork/sync/upstream-v2.0.1 -- src/ extensions/
fork/sync/upstream-v2.0.1:src/renderer/src/extensions/mod_management/LinkingDeployment.ts
```

Result: v2.0.1 has the same single `getIPCPath` export host (ipc.ts), the same 4 importers, and the same single `resolvePathCase(dataPath` host (LinkingDeployment.ts). The only new files containing `getIPCPath` are tests (`ipc.test.ts`, `elevated.test.ts`) — non-host. No new playbook surface beyond what gate-13 already covers.

## D-34-10 single-host invariant verification

```
$ git grep -lE 'resolvePathCase\(dataPath,' src/ extensions/ | wc -l
1
$ git grep -lE 'resolvePathCase\(dataPath,' src/ extensions/
src/renderer/src/extensions/mod_management/LinkingDeployment.ts
```

Single host confirmed. Gate 6 in the harness already locks all three call sites (`:523`, `:742`, `:799`) via the `≥3 hits` threshold.

## Harness dry-run results

### Skip-mode (`--skip-conflict-check`)

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
OK:   §1 extension build guards (no inline node -e process.platform; skip-on-{windows,linux}.mjs present)
OK:   §3 LOOT casing in autosort.ts (≥3 path.basename(pluginList[) + all 4 LOOT call sites present)
OK:   §10 native binaries on disk (node-loot.node, libloot.so.0, libloot_wstring_stub.so, bsatk.node)
OK:   BG3 divine error classes in divineCore.ts (≥4: DivineExecMissing, DivineMissingDotNet, DivineTimedOut, DivineAborted)
OK:   Morrowind migrate103 warning in migrations.js (≥1 'morrowind migrate103: mod directory missing')
OK:   single-host getIPCPath (1 export in ipc.ts + ≥4 importers in {ExtensionManager.ts, symlink_activator_elevate/index.ts, util/elevated.ts, util/fs.ts})
SKIP: no conflict markers anywhere outside .planning/ (Phase 34 hand-resolution surface) (--skip-conflict-check)

CHECKPOINT PASSED — 12 gate(s) clean
exit=0
```

### Full-mode (no flag)

Same first 12 OK lines, then:

```
FAIL: no conflict markers anywhere outside .planning/ (Phase 34 hand-resolution surface) (117 file(s) still contain '<<<<<<< ' — .github/actions/fingerprints/dist/index.js .github/actions/fingerprints/src/clickhouse.ts .github/actions/fingerprints/src/collect-input.test.ts .github/actions/fingerprints/src/collect-input.ts .github/actions/fingerprints/src/collect-pr.test.ts (+112 more))

CHECKPOINT FAILED — 1 gate(s) failed
exit=1
```

Both behaviours match the plan's verification: skip-mode passes 12/12, full-mode fails on the marker gate alone with 117 files still carrying markers. Wave 0 done.

## Baseline conflict surface

- **Total files outside `.planning/`:** 117
- **Total regions:** 1203

### Per-bucket breakdown

| Bucket                                                                                                       | Files   | Regions  |
| ------------------------------------------------------------------------------------------------------------ | ------- | -------- |
| renderer (`src/renderer/src/`)                                                                               | 68      | 174      |
| main (`src/main/src/`)                                                                                       | 9       | 22       |
| preload (`src/preload/`)                                                                                     | 1       | 1        |
| shared (`src/shared/`)                                                                                       | 5       | 10       |
| repo-wide leaves (CHANGELOG, README, packages/e2e, scripts, tools, docs, .github except dist artifact, etc.) | 33      | 81       |
| `.github/actions/fingerprints/dist/index.js` (artifact, resolves via rebuild in Wave G)                      | 1       | 915      |
| **TOTAL**                                                                                                    | **117** | **1203** |

(33 + 1 = 34 repo-wide files; 174 + 22 + 1 + 10 + 81 + 915 = 1203.)

### Top-20 heaviest files

```
.github/actions/fingerprints/dist/index.js:915
src/renderer/src/extensions/nexus_integration/eventHandlers.ts:11
src/main/src/Application.ts:11
src/renderer/src/controls/Table.tsx:10
src/renderer/src/views/pages/Tools/useToolsPage.ts:9
src/renderer/src/views/pages/Tools/useToolsData.ts:9
src/renderer/src/extensions/extension_manager/installExtension.ts:8
packages/e2e/tests/dashboard.spec.ts:8
src/renderer/src/extensions/nexus_integration/index.tsx:7
src/shared/src/errors.test.ts:6
src/renderer/src/views/pages/Tools/ToolRow.tsx:6
src/renderer/src/views/pages/Tools/index.tsx:6
src/renderer/src/util/util.objDiff.test.ts:6
src/renderer/src/extensions/nexus_integration/util.ts:6
src/renderer/src/views/components/Spine/SpineContext.tsx:5
src/renderer/src/extensions/installer_fomod_native/installer.ts:5
packages/e2e/tests/smoke.spec.ts:5
packages/e2e/tests/views/components/Spine/SpineContext.tsx:5
packages/e2e/fixtures/vortex-app.ts:5
.github/actions/fingerprints/src/collect-release.ts:5
.github/actions/fingerprints/src/collect-pr.test.ts:5
```

## R2 pre-audit (informational; DROP happens in Wave H)

| Check                                           | Value |
| ----------------------------------------------- | ----- |
| `find src/renderer/src/__mocks__ -type f` count | 23    |
| References from test files to `__mocks__`       | 0     |
| Jest config files in `src/renderer/`            | 0     |
| `src/renderer/vitest.config.mts` present        | yes   |

R2 DROP is safe to land in Wave H — no test file references the `__mocks__` tree, no jest config exists, vitest is the lone runner.

## native-errors trigger note (D-34-17)

The conflict region at `src/renderer/src/renderer.tsx:65–71` puts `nativeErr` on the upstream side. Trigger condition resolves at Wave F3 resolution time. SUMMARY records the evaluation deferred to Wave F3 — Wave 0 is harness-only, not a resolution wave.

## Bluebird trap risk file list (forwarded to Waves D, E, F)

Per RESEARCH §Bluebird Promise Trap, the 7 files where bluebird Promise + `:Promise<…>` annotations co-occur and must get strict D-34-02 tier-5 review at resolution time. Wave-level plans (01..07) carry this forward as required reading; Wave 0 records it as an inheritance handoff.

## Forward pointers

- Wave A: plans `34-01-…` (shared bucket, 5 files / 10 regions)
- Wave B: plans `34-02-…` (preload, 1 file / 1 region)
- Wave C: plans `34-03-…` (main bucket, 9 files / 22 regions)
- Wave D: plans `34-04-…` (renderer-leaves)
- Wave E: plans `34-05-…` (renderer extensions, includes symlink_activator_elevate — gate-13 critical)
- Wave F: plans `34-06-…` (renderer hot-zone — ExtensionManager.ts gate-13 critical at F3)
- Wave G: plans `34-07-…` (`.github/actions/fingerprints/dist/index.js` rebuild path)
- Wave H: plans `34-08-…` (R2 DROP — `src/renderer/src/__mocks__` removal)
- Done gate: plan `34-09-…` (full-mode harness run without `--skip-conflict-check`)

## Self-Check: PASSED

- File `.planning/phases/34-renderer-main-spine-v2-0-1/scripts/grep-checkpoint.sh` exists and is executable
- File `.planning/phases/34-renderer-main-spine-v2-0-1/34-00-SUMMARY.md` exists
- Skip-mode dry-run exits 0 with 12 gate-clean lines + 1 SKIP line
- Full-mode dry-run exits 1 with marker gate FAIL only (other 12 gates OK)
- Pre-flight values captured for SUMMARY
- D-34-05 inspection captured (no new playbook surface in v2.0.1)
- D-34-10 single-host invariant re-verified
