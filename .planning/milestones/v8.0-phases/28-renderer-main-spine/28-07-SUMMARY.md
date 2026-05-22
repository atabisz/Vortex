---
phase: 28-renderer-main-spine
plan: 07
subsystem: renderer
tags: [conflict-resolution, typecheck-gate, merge-driver-bug, rule-1-fix]
requires: [28-04, 28-05, 28-06]
provides:
    - "src/renderer/src/ExtensionManager.ts conflict-clean — last in renderer bucket per D-28-01"
    - "@vortex/renderer typecheck green — single per-bucket typecheck per D-28-03 covering plans 28-04/05/06/07"
affects: [28-08]
key-files:
    modified:
        - src/renderer/src/ExtensionManager.ts (fork-wins on canonical log-object format + correct indentation inside if block, 2 regions)
        - src/renderer/src/views/components/Menu/useToolsData.ts (Rule 1 fix — drop duplicate pinnedToolsMap/deploymentCounter declarations from pre-existing merge-driver artefact)
metrics:
    completed: 2026-05-21
    files_resolved: 1
    conflict_regions_resolved: 2
    rule_1_fixes: 1
    typecheck_gate: pass
---

# Phase 28 Plan 07: Resolve ExtensionManager.ts + per-bucket renderer typecheck Summary

ExtensionManager.ts (the heaviest single file in renderer per CONTEXT "Integration Points") resolved with two pure-formatting conflict regions. Per-bucket `pnpm --filter @vortex/renderer typecheck` ran after the commit per D-28-03 — surfaced a pre-existing merge-driver duplicate-declaration bug in `views/components/Menu/useToolsData.ts` (a separate file from the one in plan 28-06's `pages/Tools/`), fixed inline as a Rule 1 deviation. Renderer bucket typecheck now green.

## What Shipped

### ExtensionManager.ts (1 file, 2 regions)

- **Region 1 (line 869):** Fork-wins on canonical multi-line `log()` call shape with multi-property error object. v2.0.0 had compact one-liner-with-trailing-object form. Fork's shape is the oxfmt canonical for log-with-multi-property-context across the codebase.
- **Region 2 (line 1748):** **Substantive — Rule 1 win for fork.** v2.0.0's indentation was 8 spaces, putting `relevantInfo` declaration _outside_ the enclosing `if (typeof init !== "function")` block. Fork's 10-space indent correctly scopes `relevantInfo` inside the `if` block where it's used by `throw new Error(... relevantInfo ...)`. v2.0.0's version would have been a real syntax-positioning bug.

### views/components/Menu/useToolsData.ts (Rule 1 deviation — pre-existing bug)

Per-bucket typecheck surfaced four `TS2451: Cannot redeclare block-scoped variable` errors at lines 42, 46, 49, 54 — `pinnedToolsMap` and `deploymentCounter` each declared twice. This is a pre-existing merge-driver artefact from the upstream merge commit `138da2249`, not from any Phase 28 plan. The duplicate block (lines 49-57) was the v2.0.0-formatted form; the file's actual style is fork one-liners (lines 42-48). Dropped the duplicate block; renderer typecheck went from 4 errors to 0.

Note: this file (`Menu/useToolsData.ts`) is a SEPARATE file from `pages/Tools/useToolsData.ts` resolved in plan 28-06. The plan-06 resolution did not touch this Menu copy.

## Self-Verification

- `git grep '^<<<<<<< ' src/renderer/src/ExtensionManager.ts` returns empty.
- `git grep -l '^<<<<<<< ' src/renderer/src/` returns empty (entire renderer bucket clean — every file from plans 28-04, 28-05, 28-06, 28-07).
- `pnpm --filter @vortex/renderer typecheck` exits zero — covers plans 28-04/05/06/07 in one pass.
- Grep-checkpoint with `--skip-conflict-check` exits 0 after both commits — all 15 gates green.

## Deviations from Plan

**[Rule 1 — Bug] Fixed pre-existing merge-driver duplicate declarations in `views/components/Menu/useToolsData.ts`**

- **Found during:** per-bucket typecheck after ExtensionManager.ts commit
- **Issue:** `pinnedToolsMap` and `deploymentCounter` each declared twice (TS2451 × 4) due to a merge-driver auto-merge artefact in the upstream merge commit `138da2249`. The file was NOT in any Phase 28 conflict list because the merge driver suppressed the conflict markers and produced "clean" code that nonetheless duplicated the declarations.
- **Fix:** Dropped the second-form (v2.0.0-styled) duplicates. Kept the fork-style one-liners (matches the file's overall style).
- **Files modified:** `src/renderer/src/views/components/Menu/useToolsData.ts`
- **Commit:** `c15ca4cff`

This deviation is exactly the failure mode the plan body anticipated: "If the typecheck failure points to a file from an earlier plan, that's a sign of cross-file drift — fix in ExtensionManager.ts or amend the offending earlier commit." The bug actually predates plan 28-04, so the fix lives in its own commit rather than amending an earlier one.

## Commits

- `2bb7cc703` — `resolve(renderer): ExtensionManager.ts — fork-wins on canonical log-object format + correct indentation inside if block (2 regions)`
- `c15ca4cff` — `fix(renderer): views/components/Menu/useToolsData.ts — drop duplicate pinnedToolsMap/deploymentCounter declarations (merge-driver artefact, surfaced by per-bucket typecheck)`

## Self-Check: PASSED
