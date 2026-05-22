---
phase: 26-mod-management-hot-zone
plan: 08
subsystem: mod-management
tags: [conflict-resolution, playbook-hot-zone, linux-port, sync-04, sync-22, sync-23]
requires: [26-07]
provides: ["InstallManager.ts conflict-free with all §6/§7a-d invariants intact"]
affects: ["src/renderer/src/extensions/mod_management/InstallManager.ts"]
tech_added: []
patterns:
    [
        "fork-side wins for playbook invariants",
        "drop dead-code v2.0.0 additions when grep confirms zero references",
    ]
key_files_modified:
    - src/renderer/src/extensions/mod_management/InstallManager.ts
key_files_created: []
decisions:
    - "All 23 conflict regions resolved fork-side (HEAD wins)"
    - "v2.0.0's DynamicDownloadConcurrencyLimiter dropped — defined but never instantiated/exported/used (verified by grep)"
    - "v2.0.0 consolidated type-import block at lines 22-58 dropped — every symbol it declared is already imported via HEAD's scattered later imports"
    - "Renderer-wide typecheck deferred (Rule 3) — same deferral as plans 02-07; file-scoped check on InstallManager.ts is clean"
metrics:
    duration_minutes: 12
    tasks_completed: 2
    files_modified: 1
    commits: 1
    completed_date: 2026-05-15
---

# Phase 26 Plan 08: InstallManager.ts Resolution Summary

Hand-resolved 23 conflict regions in the playbook hot zone. All 5 §6/§7a-d gates green pre and post; renderer-wide diff is 226 lines deleted (v2.0.0 alternatives only), zero lines added.

## What Got Done

Single resolution commit `396845745` on `v8.0/config-bucket`. One file touched: `src/renderer/src/extensions/mod_management/InstallManager.ts`.

Every one of the 23 conflict regions resolved HEAD-side. Three of those 23 regions sit on top of the playbook invariants this entire phase exists to protect:

- Region @ 1156-1160 hosts §7a `normalizeBackslashPaths(tempPath)` + §7b `mergeCaseConflictingDirs(tempPath)` immediately before `buildFileList(tempPath)` in the first `extractArchive` code path. v2.0.0 had stripped both. HEAD MUST win — and did.
- Region @ 3784-3788 hosts the same §7a + §7b pair in the second `extractArchive` code path. Same outcome.
- Region @ 6269-6288 hosts the entire §6 `stagingDirHasFiles` guard block inside `doDownload`'s dependency-handler arrow — the canonical fix that heals stale empty staging directories across install attempts. v2.0.0 had stripped it. HEAD MUST win — and did.

The remaining 20 regions split into two cohorts:

1. Pure-formatting alternatives (Prettier 80-col wrapping vs HEAD's slightly longer single-line style). 19 regions. HEAD wins by default to minimize diff per project rules.
2. One v2.0.0-only addition at 244-312: function `getDownloadFreeSlots` + class `DynamicDownloadConcurrencyLimiter`. Grep confirmed zero references elsewhere — defined, never instantiated, never exported, never used. Dead code. Dropped.

## Playbook Invariant Hit Counts

| Gate | Symbol                         | Min required | Pre | Post | Status |
| ---- | ------------------------------ | ------------ | --- | ---- | ------ |
| §6   | stagingDirHasFiles             | ≥1           | 2   | 2    | OK     |
| §7a  | normalizeBackslashPaths        | ≥3           | 5   | 5    | OK     |
| §7b  | mergeCaseConflictingDirs       | ≥3           | 3   | 3    | OK     |
| §7c  | copy-loop replaceAll("\\","/") | ≥2           | 2   | 2    | OK     |
| §7d  | resolvePathCase(tempPath, …)   | ≥1           | 1   | 1    | OK     |

`scripts/grep-checkpoint.sh --skip-conflict-check` exits zero — gates 1-6 all pass. Gate 7 (no conflict markers) is still skipped because `index.ts` in plan 09 still has markers; it will land green at phase done-gate.

## Verification Evidence

```
$ git grep -nE '^<<<<<<< |^=======$|^>>>>>>> ' src/renderer/src/extensions/mod_management/InstallManager.ts
(empty)

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
SKIP: no conflict markers in src/renderer/src/extensions/mod_management/ (--skip-conflict-check)
CHECKPOINT PASSED — 6 gate(s) clean
```

Pre-resolution baseline grep already passed all five gates — playbook fixes were intact in HEAD before this resolution. The phase's "resolution only, not re-application" assumption (per CONTEXT.md framing) held.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Renderer-wide typecheck deferred]**

- **Found during:** Task 2 verification step
- **Issue:** `pnpm typecheck -F @vortex/renderer` fails workspace-wide with `TS1185: Merge conflict marker encountered` errors in `src/views/pages/Tools/useToolsPage.ts`, `src/ExtensionManager.ts`, `src/controls/Table.tsx`, `src/contexts/PagesContext.tsx`, `src/contexts/builtInPages.ts`, plus pre-existing failures in `@vortex/shared:build`, `@nexusmods/adaptor-api:typecheck`, etc. None of these are in `mod_management/` and none were touched by this plan.
- **Fix:** File-scoped check applied — filtered typecheck output for `InstallManager.ts` errors specifically. Result: zero. Same deviation pattern as plans 26-02 through 26-07 (whose summaries also ran file-scoped because the workspace has files still in conflict from later phases / plan 09).
- **Files modified:** None.
- **Commit:** Acknowledged in commit body, not a separate fix commit.

## Self-Check: PASSED

- File `src/renderer/src/extensions/mod_management/InstallManager.ts` exists and has 7257 lines (down from 7483 pre-resolution).
- Commit `396845745` exists in `git log` with title `resolve(mod-mgmt): InstallManager.ts — fork-side wins (HEAD across all 23 regions)`.
- HEAD ahead of base `73c996b38` by 1 commit (resolution commit; SUMMARY commit follows next).
- All 5 §6/§7a-d gates pass via `scripts/grep-checkpoint.sh --skip-conflict-check`.
- Branch is `v8.0/config-bucket`.

## Decisions Made

- **HEAD wins on all 23 regions:** the 3 playbook-touching regions had no choice (HEAD MUST win per phase mandate); the 19 formatting regions defaulted to HEAD per "minimize diff" project rule; the 1 dead-code region (DynamicDownloadConcurrencyLimiter) was dropped after grep confirmed zero references.
- **No `git mergetool`, no IDE-assisted resolve:** awk pass with explicit `<<<<<<< HEAD` / `=======` / `>>>>>>> v2.0.0` markers, after hand-reading every region in 26-line slices. Hand-read discipline per D-26-02.
- **Single atomic commit per D-26-00:** one file changed, 226 lines deleted, zero added.
