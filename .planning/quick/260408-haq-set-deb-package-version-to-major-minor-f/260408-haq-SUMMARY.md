---
phase: quick
plan: 260408-haq
subsystem: ci
tags: [github-actions, electron-builder, versioning, deb, appimage]

requires: []
provides:
  - VORTEX_VERSION env var set in release-linux.yml before build step
  - deb/AppImage packages versioned as major.minor.YYYYMMDDHHMM
affects: [ci, linux-packaging]

tech-stack:
  added: []
  patterns: ["CI step computes version from package.json + UTC timestamp before build"]

key-files:
  created: []
  modified:
    - .github/workflows/release-linux.yml

key-decisions:
  - "process.stdout.write used instead of console.log to avoid trailing newline in BASE_VERSION"

patterns-established: []

requirements-completed: []

duration: 5min
completed: 2026-04-08
---

# Quick Task 260408-haq Summary

**CI workflow now sets VORTEX_VERSION as `major.minor.YYYYMMDDHHMM` before electron-builder build**

## Performance

- **Duration:** 5 min
- **Completed:** 2026-04-08
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added "Set package version" step to `.github/workflows/release-linux.yml` immediately before "Build AppImage and deb"
- Step computes `BASE_VERSION` (major.minor) from `package.json` via node and combines with UTC datetime stamp
- `VORTEX_VERSION` exported to `GITHUB_ENV` so `prepare-dist-package.mjs` picks it up (line 193 fallback `"1.0.0"` is now bypassed)
- Next CI build on master will produce packages versioned like `1.0.202604081234`

## Task Commits

1. **Task 1: Add VORTEX_VERSION computation step** - `53033d808` (feat)

## Files Created/Modified

- `.github/workflows/release-linux.yml` - Added "Set package version" step before build

## Decisions Made

- `process.stdout.write` used in the node one-liner to avoid a trailing newline that would corrupt the `BASE_VERSION` variable when captured via `$(...)`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Release CI will produce correctly versioned packages on next master push.
- No further action required.

---
*Phase: quick*
*Completed: 2026-04-08*
