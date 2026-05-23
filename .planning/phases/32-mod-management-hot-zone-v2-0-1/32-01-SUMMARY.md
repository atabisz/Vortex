---
phase: 32-mod-management-hot-zone-v2-0-1
plan: 01
wave: 0
status: complete
requirements: [SYNC-32a]
dependency_graph:
    requires: []
    provides:
        - "scripts/grep-checkpoint.sh — 7-gate playbook harness, executable"
        - "Bucket-scoped typecheck baseline for plans 02-05 regression comparison"
        - "D-32-05 verified: v2.0.1 introduces no new playbook-touching call sites"
        - "D-32-12 verified: LinkingDeployment.ts is sole 140a57217 host"
    affects:
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-02-PLAN.md
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-03-PLAN.md
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-04-PLAN.md
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-05-PLAN.md
key-files:
    created:
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh
        - .planning/phases/32-mod-management-hot-zone-v2-0-1/32-01-SUMMARY.md
    modified: []
decisions:
    - "Harness reused verbatim from v8.0 Phase 26 (git 7ed691f40) per D-32-04"
    - "No gate 8 added — D-32-05 inspection confirms zero new v2.0.1 playbook sites"
metrics:
    duration: ~6m
    completed: 2026-05-22
---

# Phase 32 Plan 01: Wave 0 — Harness scaffold + baseline Summary

Wave 0 setup landed clean: v8.0 Phase 26 harness extracted verbatim from git
`7ed691f40`, dropped at `scripts/grep-checkpoint.sh`, dry-runs match the
"Pre-Resolution Playbook Gate Status" snapshot from RESEARCH (6/6 PASS in
skip-mode, gate 7 expected-FAIL in full-mode), and the 260-error
mod_management baseline matches RESEARCH §5 exactly.

## 1. Pre-flight (RESEARCH §7) — all 10 PASS

| #   | Check                                                                                                              | Expected                                                 | Actual                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Branch                                                                                                             | `v8.1/config-bucket`                                     | `v8.1/config-bucket`                                                     |
| 2   | merge-base vs `fork/sync/upstream-v2.0.1`                                                                          | `8054a935b6aad505798bba8a993d002718d119cb`               | `8054a935b6aad505798bba8a993d002718d119cb`                               |
| 3   | Conflict files in `mod_management/`                                                                                | 15                                                       | 15                                                                       |
| 4   | Total `<<<<<<< ` regions                                                                                           | 97                                                       | 97                                                                       |
| 5   | Mid-op state files (MERGE_HEAD/CHERRY_PICK_HEAD/rebase-merge/rebase-apply)                                         | none                                                     | none                                                                     |
| 6   | Working tree clean (non-untracked)                                                                                 | empty                                                    | empty                                                                    |
| 7   | Signing config                                                                                                     | `gpg.format=ssh`, `commit.gpgsign=true`, key file exists | `gpg.format=ssh`, `commit.gpgsign=true`, `~/.ssh/id_ed25519.pub` present |
| 8   | DownloadManager.ts conflict markers                                                                                | 0                                                        | 0                                                                        |
| 9   | `git stash list` (informational)                                                                                   | —                                                        | 7 stashes recorded; none popped                                          |
| 10  | Sentinel files (`util/stagingIntegrity.ts`, `util/normalizeBackslashPaths.ts`, `util/mergeCaseConflictingDirs.ts`) | all present                                              | all present                                                              |

## 2. Harness origin

- Source: `git show 7ed691f40:.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh`
- Destination: `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh`
- Line count: 159 (matches v8.0 reference)
- Mode: executable (`chmod +x`)
- Modifications: zero — verbatim per D-32-04. Header comments still cite Phase 26
  origin; reuse rationale lives in this SUMMARY rather than rewriting the script
  header (keeps diff to v8.0 source at zero, easier to spot drift in v9.0+).

## 3. v2.0.1 no-new-playbook-sites finding (D-32-05)

Re-ran the RESEARCH §2 inspection on the actual upstream blobs to confirm
nothing changed since research:

```
$ git show f25ff55da:src/renderer/src/extensions/mod_management/InstallManager.ts \
    | grep -nE 'stagingDirHasFiles|normalizeBackslashPaths|mergeCaseConflictingDirs|resolvePathCase|caseSensitive'
NONE - upstream has no playbook helpers (expected)

$ git show f25ff55da:src/renderer/src/extensions/mod_management/LinkingDeployment.ts \
    | grep -nE 'resolvePathCase'
NONE
```

20 files modified between `fork/master` and `fork/sync/upstream-v2.0.1` under
`src/renderer/src/extensions/mod_management/`, but **zero** of them introduce
calls to the four playbook helpers. The existing 7 gates in the v8.0 harness
remain sufficient.

**Conclusion: no gate 8 added in this phase.**

## 4. D-32-12 single-host invariant (re-verified)

Current tree, all `resolvePathCase(dataPath, ...)` call sites:

```
src/renderer/src/extensions/mod_management/LinkingDeployment.ts:599: const fileDataPath = await resolvePathCase(dataPath, relDataPath, dirCache);
src/renderer/src/extensions/mod_management/LinkingDeployment.ts:818: const outputPath = await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache);
src/renderer/src/extensions/mod_management/LinkingDeployment.ts:875: const fullOutputPath = await resolvePathCase(dataPath, relOutputPath, this.mReaddirCache);
```

3 hits, all in `LinkingDeployment.ts`. Zero hits in `util/externalChanges.ts` or
any other file in `mod_management/`. D-32-12 / D-26-03a invariant intact.

(Note: the v8.0 harness header comment cites lines `:523, :742, :799`; on the
current pre-resolution tree the same three call sites live at `:599, :818, :875`
because of upstream churn above them. The harness regex is line-agnostic
(`resolvePathCase\(dataPath,`), so the count gate still passes correctly. No
fix needed.)

## 5. Harness dry-run results

### Skip-mode (`--skip-conflict-check`)

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
SKIP: no conflict markers in src/renderer/src/extensions/mod_management/ (--skip-conflict-check)

CHECKPOINT PASSED — 6 gate(s) clean
exit=0
```

### Full-mode (default; gate 7 expected-FAIL during pre-resolution)

```
… 6 OK lines as above …
FAIL: no conflict markers in src/renderer/src/extensions/mod_management/ (15 file(s) still contain '<<<<<<< ')

CHECKPOINT FAILED — 1 gate(s) failed
exit=1
```

This FAIL is the **expected** mid-phase state per RESEARCH "Pre-Resolution Playbook Gate Status".
Plan 06's done-gate runs full-mode and expects exit 0 only after plans 02-05 finish resolving.

## 6. Bucket-scoped typecheck baseline (Pattern S4)

**Invocation note (Rule 3 fix):** The plan's draft Step F command used
`pnpm typecheck -F @vortex/renderer`, but `pnpm typecheck` resolves to
`pnpm nx run-many -t typecheck` and `-F @vortex/renderer` ends up being passed
to `tsc` (which interprets it as "unknown compiler option"). The correct
bucket-scoped invocation on this Nx-driven monorepo is to run `tsc` directly
inside the renderer package:

```bash
cd src/renderer && pnpm tsc -p tsconfig.json
```

Future plans (02-05) should use the same form when running their per-file
regression typecheck. PATTERNS.md S4 should be updated to reflect this
(out-of-scope for Wave 0; tracked as a pattern correction for Plan 06).

### Numbers

| Metric                            | Value | RESEARCH §5 expected | Drift       |
| --------------------------------- | ----- | -------------------- | ----------- |
| Total `error TS` lines            | 1370  | ~1370                | 0%          |
| TS1185 (marker noise)             | 763   | ~763                 | 0%          |
| mod_management/ non-marker errors | 260   | ~260                 | 0%          |
| renderer typecheck exit code      | 1     | non-zero (expected)  | as expected |

### Per-file mod_management/ non-marker breakdown

```
260 src/extensions/mod_management/views/ModList.tsx
```

**All 260 non-marker errors live in a single file (`views/ModList.tsx`) as JSX
cascades from upstream marker noise.** This matches RESEARCH §5's prediction
exactly — once plans 02-05 resolve the 97 markers across the 15 conflict files,
the TS1185 cascade collapses and the ModList.tsx error count should drop to or
near zero. Any new errors in any other mod_management/ file after resolution
flag a regression.

## 7. Forward pointer: per-tier resolution plans

| Plan  | Tier                       | Files   | Markers               | Strategy                                   |
| ----- | -------------------------- | ------- | --------------------- | ------------------------------------------ |
| 32-02 | Tier A (mechanical)        | 5 files | small regions         | direct apply                               |
| 32-03 | Tier B (medium)            | 5 files | helper-touching       | playbook-aware                             |
| 32-04 | Tier C (heavy)             | 3 files | large regions         | per-region commits                         |
| 32-05 | Tier D (LinkingDeployment) | 1 file  | externalChanges block | guarded merge, 140a57217 host              |
| 32-06 | done-gate                  | —       | —                     | full-mode harness exit 0 + final typecheck |

Each plan re-runs `scripts/grep-checkpoint.sh --skip-conflict-check` after
every per-file commit, plus the bucket-scoped typecheck against the baseline
in §6 above for regression detection.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Step F typecheck invocation**

- **Found during:** Task 2 Step F
- **Issue:** Plan's command `pnpm typecheck -F @vortex/renderer` does not
  filter to the renderer; `-F` reaches `tsc` and triggers TS5023/TS5083.
  Output had only 14 garbage error lines, none useful.
- **Fix:** Replaced with `cd src/renderer && pnpm tsc -p tsconfig.json` —
  the actual command behind the renderer package's `typecheck` script. This
  produced the expected 1370-line output matching RESEARCH §5.
- **Files modified:** none (test-bench command only)
- **Followup:** Plans 02-05 should use the same form. Pattern S4 in PATTERNS.md
  documents the corrected invocation by reference; explicit edit deferred to
  Plan 06 (out of scope here).

### Auth gates / blockers

None.

## Self-Check: PASSED

- `scripts/grep-checkpoint.sh` exists, executable, 159 lines — verified.
- `32-01-SUMMARY.md` exists at planned path — verified (this file).
- Skip-mode dry-run exit 0; full-mode dry-run exit 1 with gate 7 FAIL — verified.
- Single-host invariant: 3 `resolvePathCase(dataPath,` hits, all in
  LinkingDeployment.ts — verified.
- v2.0.1 inspection: zero playbook-helper hits in upstream `f25ff55da` blobs — verified.
- Baseline 260 mod_management non-marker errors, all in `views/ModList.tsx` — verified.
