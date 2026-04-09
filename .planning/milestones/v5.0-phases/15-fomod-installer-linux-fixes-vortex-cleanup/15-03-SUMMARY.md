---
phase: 15-fomod-installer-linux-fixes-vortex-cleanup
plan: 03
subsystem: api
tags: [vortex-api, api-extractor, typescript, declarations, planning]

# Dependency graph
requires:
  - phase: 14-linux-case-folding-fs-wrapper
    provides: resolvePathCase utility added to src/renderer/src/util/ and exported via util namespace

provides:
  - packages/vortex-api/lib/api.d.ts regenerated with resolvePathCase in public API surface
  - .planning/REQUIREMENTS.md created with all FOMD-15-xx requirement definitions

affects: [vortex-api consumers, extensions using vortex-api types, phase-15 requirement tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "api.d.ts force-added with git add -f: packages/vortex-api/lib/ is gitignored; force-add required for tracked build artifact"

key-files:
  created:
    - packages/vortex-api/lib/api.d.ts
    - .planning/REQUIREMENTS.md
  modified:
    - etc/vortex.api.md

key-decisions:
  - "packages/vortex-api/lib/api.d.ts gitignored via packages/.gitignore — force-add (git add -f) used to track this build artifact"
  - "etc/vortex.api.md updated alongside api.d.ts — API Extractor updates both files in api:docs step"

patterns-established:
  - "vortex-api declarations: pnpm -F @vortex/renderer run api:build then api:docs regenerates both src/renderer/lib/ and packages/vortex-api/lib/api.d.ts"

requirements-completed: [FOMD-15-06, FOMD-15-07]

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 15 Plan 03: vortex-api Declaration Regeneration + REQUIREMENTS.md Summary

**vortex-api lib/api.d.ts regenerated via API Extractor to include resolvePathCase; REQUIREMENTS.md created with all 7 FOMD-15-xx entries**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T12:01:45Z
- **Completed:** 2026-04-09T12:08:05Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Regenerated `packages/vortex-api/lib/api.d.ts` via `api:build` + `api:docs` pipeline — `resolvePathCase` now appears in the public API surface (2 occurrences)
- Updated `etc/vortex.api.md` API review document with new `resolvePathCase` and `watch` exports
- Created `.planning/REQUIREMENTS.md` with all 7 FOMD-15-xx requirement IDs, descriptions, and statuses

## Task Commits

Each task was committed atomically:

1. **Task 1: Regenerate vortex-api declarations** - `3d639fc26` (chore)
2. **Task 2: Create FOMD requirement entries in REQUIREMENTS.md** - `0a32ba063` (chore)

## Files Created/Modified

- `packages/vortex-api/lib/api.d.ts` - Regenerated public API declarations; now includes `resolvePathCase` from Phase 14 (force-added, gitignored build artifact)
- `etc/vortex.api.md` - API Extractor review document updated with resolvePathCase and watch exports
- `.planning/REQUIREMENTS.md` - New file: all 7 FOMD-15-xx requirement entries with IDs, descriptions, and statuses

## Decisions Made

- `packages/vortex-api/lib/` is gitignored via `packages/.gitignore` — used `git add -f` to force-track the build artifact since extensions consume this for type information
- API Extractor `api:docs` step updates both `packages/vortex-api/lib/api.d.ts` and `etc/vortex.api.md` — both files committed together
- `.planning/` is also gitignored but other planning files use force-add; applied same pattern for REQUIREMENTS.md

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree had no node_modules; ran build in main repo**
- **Found during:** Task 1 (Regenerate vortex-api declarations)
- **Issue:** The git worktree has no `node_modules` installed; `pnpm --filter` would fail. Also `resolvePathCase.ts` was absent from worktree util until HEAD was properly checked out
- **Fix:** (1) Ran `git checkout HEAD -- .` to restore working tree after `git reset --soft`. (2) Ran `api:build` and `api:docs` in main repo (`/home/alex/src/Vortex`) which has node_modules. (3) Copied generated files to worktree.
- **Files modified:** packages/vortex-api/lib/api.d.ts, etc/vortex.api.md
- **Verification:** `grep -c "resolvePathCase" packages/vortex-api/lib/api.d.ts` returns 2
- **Committed in:** `3d639fc26` (Task 1 commit)

**2. [Rule 3 - Blocking] Both packages/vortex-api/lib/ and .planning/ are gitignored**
- **Found during:** Tasks 1 and 2
- **Issue:** `packages/.gitignore` ignores `lib/`; root `.gitignore` ignores `.planning/`. Files couldn't be staged normally.
- **Fix:** Used `git add -f` for both `packages/vortex-api/lib/api.d.ts` and `.planning/REQUIREMENTS.md` (consistent with how other .planning files are tracked)
- **Files modified:** packages/vortex-api/lib/api.d.ts, .planning/REQUIREMENTS.md
- **Verification:** `git ls-files` confirms both are tracked
- **Committed in:** `3d639fc26`, `0a32ba063`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were infrastructure/environment issues, not logic changes. Plan goals achieved as specified.

## Issues Encountered

- Worktree setup: the `git reset --soft` in worktree_branch_check only moved HEAD but left stale working tree files. Resolved by running `git checkout HEAD -- .` to restore correct file state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- vortex-api type declarations are up to date; extensions that import `resolvePathCase` from vortex-api will now get correct TypeScript types
- REQUIREMENTS.md provides tracking baseline for remaining Phase 15 planned items (FOMD-15-02, 15-04, 15-05)
- Phase 15 plans 01-02 handled code fixes; plan 03 closes the type declaration and tracking loop

---
*Phase: 15-fomod-installer-linux-fixes-vortex-cleanup*
*Completed: 2026-04-09*
