---
phase: 26-mod-management-hot-zone
plan: 01
subsystem: mod-management
tags: [linux-port, v8.0, harness, playbook, grep-checkpoint]
provides:
    - "Per-file checkpoint harness — invoked after every mod-mgmt commit in plans 26-02..26-09 and again in plan 26-10's done-gate"
    - "Durable re-grep gates for §6 stagingDirHasFiles, §7a normalizeBackslashPaths, §7b mergeCaseConflictingDirs, §7c copy-loop replaceAll, §7d resolvePathCase(tempPath, …), 140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts, no conflict markers"
requires:
    - "v8.0/config-bucket branch checked out"
    - "Playbook fixes pre-existing on the merge base (this phase is resolution, not re-application)"
affects:
    - ".planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh"
tech-stack:
    added: [bash]
    patterns:
        [
            aggregate-fail (no `set -e`),
            per-gate exit-code accumulator,
            --skip-conflict-check flag for in-flight runs,
        ]
key-files:
    created:
        - ".planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh"
    modified: []
decisions:
    - "Gate 7c regex: corrected the spec literal (8 shell backslashes was over-escaped — file content has 2 literal backslashes, not 4). Used 4 shell backslashes = 2 regex backslashes to match `\\\\` in `\"\\\\\"`. Intent (≥2 hits, source + destination) preserved verbatim. Documented inline."
    - "Gate 6 (140a57217): single-file scope per D-26-03a, ≥3 hits in LinkingDeployment.ts only. No second-file gate."
    - "set -u (not set -e) so every gate runs and the executor sees the full picture per D-26-03 'Exits non-zero on any failure' read as 'aggregate non-zero', not 'first-fail short-circuit'."
metrics:
    duration: "~10min"
    completed: 2026-05-15
requirements: [SYNC-22, SYNC-23]
---

# Phase 26 Plan 01: grep-checkpoint.sh harness

Authored `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` — the bash re-grep harness that plans 26-02..26-09 invoke after each per-file conflict resolution to confirm playbook §6 + §7a–d + 140a57217 invariants survive. Single-file commit, executable bit set via `git update-index --chmod=+x`, baseline (with `--skip-conflict-check`) clean.

## What Was Built

`grep-checkpoint.sh` runs seven gates in order. Each gate prints `OK: <label>` on pass or `FAIL: <label> (<reason>)` on fail, increments a `failures` counter, and continues — `set -u` only, no `set -e`, so a single bad gate does not mask others. The script exits with `failures` as its return code.

Gates:

1. **§6 stagingDirHasFiles** — `git grep -nE '\bstagingDirHasFiles\b' InstallManager.ts` ≥1 hit AND `util/stagingIntegrity.ts` exists.
2. **§7a normalizeBackslashPaths** — `git grep -nE '\bnormalizeBackslashPaths\b' InstallManager.ts` ≥3 hits (import + 2 call sites).
3. **§7b mergeCaseConflictingDirs** — `git grep -nE '\bmergeCaseConflictingDirs\b' InstallManager.ts` ≥3 hits (import + 2 call sites).
4. **§7c copy-loop replaceAll** — `git grep -n 'replaceAll' InstallManager.ts | grep -E '\\\\.*"/"'` ≥2 hits (source + destination).
5. **§7d resolvePathCase(tempPath, …)** — `git grep -nE 'resolvePathCase\(tempPath' InstallManager.ts` ≥1 hit.
6. **140a57217 resolvePathCase(dataPath, …)** — `git grep -nE 'resolvePathCase\(dataPath,' LinkingDeployment.ts` ≥3 hits (locks :523, :742, :799 simultaneously per D-26-03a).
7. **No conflict markers** — `git grep -l '^<<<<<<< ' src/renderer/src/extensions/mod_management/` empty. Skipped under `--skip-conflict-check`.

Header comment cites all six playbook sections and links D-26-03a so future readers don't try to add a second-file 140a57217 gate.

## Verification Output

Baseline run with `--skip-conflict-check` (pre-resolution tree on `v8.0/config-bucket`):

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

Exit code 0. All six playbook gates pass on the unmodified pre-resolution tree — confirms the working assumption that this phase is "resolution, not re-application": §6 + §7a–d + 140a57217 already exist on `v8.0/config-bucket` and our job is to keep them there through 8 conflict resolutions.

Full run (without flag) correctly fails gate 7 with all 8 mod-mgmt files listed as still containing `<<<<<<<` markers. Exit code 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Spec bug] Gate 7c regex was over-escaped**

- **Found during:** Task 1 baseline run authoring
- **Issue:** D-26-03 / 26-01-PLAN.md spec literal regex was `'\\\\\\\\.*"/"'` (8 shell backslashes → 4 regex backslashes → matches 4 literal backslashes on disk). The actual `replaceAll("\\", "/")` in `InstallManager.ts:7242-7243` contains 2 literal backslashes between the quotes (the source literal `"\\"`). The 8-backslash regex matches zero lines — running with the spec verbatim produces a false negative on baseline.
- **Fix:** Used `'\\\\.*"/"'` (4 shell backslashes → 2 regex backslashes → matches 2 literal backslashes). Intent of D-26-03 ("≥2 hits, source + destination") preserved exactly; the spec's "escaped backslash quartet — that is intentional" comment was wrong about what the disk content looks like.
- **Files modified:** `grep-checkpoint.sh` (gate 4 implementation comment documents the deviation in-place)
- **Commit:** see HEAD

No architectural changes. No Rule 4 escalations.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None — script is read-only over the working tree and produces no network or filesystem side-effects.

## TDD Gate Compliance

N/A — plan type is `execute`, not `tdd`. No behavior change in production code; the artifact is a verification harness.

## Self-Check: PASSED

- `test -x .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` — pass
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exit 0 — pass
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` exit 1, conflict-marker gate names all 8 files — pass
- HEAD commit title matches D-26-00 format — verified post-commit
- HEAD commit touches one file (`scripts/grep-checkpoint.sh`) — verified post-commit
- Branch still `v8.0/config-bucket` — verified
