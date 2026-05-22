---
phase: 28-renderer-main-spine
plan: 10
subsystem: docs
tags: [conflict-resolution, doc-borderlines, fork-wins, formatting]
requires: [28-09]
provides:
    - "All 5 doc-borderline conflict files resolved (CHANGELOG.md, docs/cherry-pick-workflow.md, docs/error-reporting/critical-errors.md, etc/Dependency Report.md, etc/vortex.api.md); working tree merge-clean for Phase 29"
    - "Stable contract for plan 28-11 (done-gate)"
affects: [28-11]
key-files:
    modified:
        - CHANGELOG.md (fork-wins on v-prefixed tag URLs + retain 1.16.x rows)
        - docs/cherry-pick-workflow.md (fork-wins on column-aligned table form)
        - docs/error-reporting/critical-errors.md (fork-wins on column-aligned table form, matches unconflicted continuation rows)
        - "etc/Dependency Report.md (fork-wins on column-aligned table + current dep versions + adaptor-api/@vortex/fs link entries)"
        - etc/vortex.api.md (fork-wins; preserves real DownloadCheckpoint forgotten-export warning)
metrics:
    completed: 2026-05-21
    files_resolved: 5
    conflict_regions_resolved: 5
    mode: A
---

# Phase 28 Plan 10: Doc borderlines Summary

**Mode chosen: A (per-file commits, plan default per D-28-00).** All 5 doc-borderline conflict files resolved as separate atomic commits per D-28-01 sub-order. Stance is fork-wins on every file — table-formatting consistency in 4 cases, real fork-side content (DownloadCheckpoint export warning) in the 5th. Mode B (batch) would have hidden the per-file stance variation; Mode A keeps the bisect-friendly history.

## What Shipped

### CHANGELOG.md (1 region)

**Fork-wins.** Fork preserves v-prefixed tag URLs (`releases/tag/v2.0.0-beta.1`) which match the existing 1.16.x and earlier convention; v2.0.0 had stripped the `v` prefix. Fork also retains the `[1.16.9]` and `[1.16.8]` link reference rows that v2.0.0 dropped — historical continuity for changelog cross-references.

### docs/cherry-pick-workflow.md (1 region)

**Fork-wins.** Fork's column-aligned markdown table renders cleanly in plain-text viewers and matches the prettier-style table convention used elsewhere in fork docs. v2.0.0's compact form would split visual style.

### docs/error-reporting/critical-errors.md (1 region)

**Fork-wins.** Fork's column-aligned table matches the rest of the table block in the file — the unconflicted continuation rows below the conflict region (lines 77+) use the same wide-pipe form. Taking v2.0.0's side would have left half the table compact and half wide-pipe.

### etc/Dependency Report.md (1 region, 240 lines)

**Fork-wins on form AND content.** Fork preserves:

- Column-aligned table (matches the file's auto-generation style)
- More current dep versions (`@nexusmods/fomod-installer-ipc 0.13.1`, `@nexusmods/fomod-installer-native 0.13.1`, `@nexusmods/nexus-api 1.6.0`, `@msgpack/msgpack 2.8.0`, `@opentelemetry/api 1.9.1`)
- Fork-only architectural link entries (`@nexusmods/adaptor-api → ../../packages/adaptor-api`, `@vortex/fs → ../../packages/fs`)
- More current renderer/UI deps (`react-bootstrap 0.33.1` vs older, etc.)

### etc/vortex.api.md (1 region)

**Fork-wins; SUBSTANTIVE.** Fork preserves the `IState.d.ts:161 DownloadCheckpoint forgotten-export` warning. This is a real fork-side api-extractor finding — `DownloadCheckpoint` is imported by `src/shared/src/types/ipc.ts:6` and re-exported as `WireDownloadCheckpoint`. Taking v2.0.0's side would have silently dropped a legitimate finding. The line-number drift (fork: 360/362/394/395 vs v2.0.0: 356/358/390/391) is consistent with fork having one extra re-exported symbol in the same file (the `DownloadCheckpoint` row pushed everything down by 4 lines).

## Self-Verification

- `git grep '^<<<<<<< '` across the entire repo returns 0 lines — **working tree fully merge-clean**.
- `git log --oneline | grep -cE '^[0-9a-f]+ resolve\(docs\):'` returns ≥5 in this plan window.
- Grep-checkpoint with `--skip-conflict-check` exits 0 after each of the five commits — all 15 gates green.

## Deviations from Plan

None. Per-region stance defaults from plan body honoured throughout. Mode A chosen as the plan default per D-28-00. The `etc/vortex.api.md` substantive call (preserve DownloadCheckpoint warning) was anticipated by the plan body's caveat that api-extractor output may genuinely differ between fork and upstream — verified at execution time by confirming `DownloadCheckpoint` is actually imported and re-exported in fork's source.

## Commits

- `faa4253cd` — `resolve(docs): CHANGELOG.md — fork-wins on v-prefixed tag URLs + retain 1.16.x rows`
- `86fe49eef` — `resolve(docs): docs/cherry-pick-workflow.md — fork-wins on column-aligned table form`
- `4e958f1b6` — `resolve(docs): docs/error-reporting/critical-errors.md — fork-wins on column-aligned table form`
- `204a2e70a` — `resolve(docs): etc/Dependency Report.md — fork-wins on column-aligned table + current dep versions`
- `33255341a` — `resolve(docs): etc/vortex.api.md — fork-wins; preserves DownloadCheckpoint forgotten-export warning`

## Progress Tally

After plan 28-10: **All 63 Phase 28 conflict files resolved** (47 hand-resolved + 11 fingerprints squash + 5 docs + 0 still-pending). Working tree merge-clean. Only the done-gate remains (plan 28-11) — and the user-approval push step.

## Self-Check: PASSED
