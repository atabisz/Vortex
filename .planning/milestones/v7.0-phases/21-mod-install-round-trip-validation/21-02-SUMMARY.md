---
phase: 21-mod-install-round-trip-validation
plan: 02
subsystem: planning
tags: [onboarding, uat, requirements, roadmap, ONBRD-04]

# Dependency graph
requires:
  - phase: 21-01
    provides: ENOENT fix in hardlink_activator isSupported — unblocks ONBRD-04 code-complete declaration
provides:
  - ONBRD-04 marked code-complete in REQUIREMENTS.md with hardware UAT pending note
  - Phase 999.1 backlog entry with ONBRD-04 and 10-step Skyrim SE hardlink UAT checklist
  - Phase 21 plan list showing 2/2 plans complete in ROADMAP.md
affects: [Phase 22, Phase 23, Phase 999.1]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

key-decisions:
  - "D-08 confirmed: ONBRD-04 UAT checklist lives in Phase 999.1 in ROADMAP.md, matching ELEV-04/ELEV-05/SAVE-05 precedent"
  - "ONBRD-04 marked code-complete after Phase 21-01 ENOENT fix; hardware UAT deferred to Phase 999.1"

patterns-established:
  - "UAT checklist pattern: numbered steps with specific UI navigation path (Settings -> Mods -> Deployment Method) for hardware testers"

requirements-completed:
  - ONBRD-04

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 21 Plan 02: Mark ONBRD-04 Code-Complete and Add 999.1 UAT Entry Summary

**ONBRD-04 marked code-complete in REQUIREMENTS.md and a 10-step Skyrim SE hardlink UAT checklist added to Phase 999.1 backlog in ROADMAP.md**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-16T20:32:35Z
- **Completed:** 2026-04-16T20:34:23Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- REQUIREMENTS.md ONBRD-04 line updated from "(human UAT; gates on ONBRD-01 + ONBRD-02)" to "code-complete (Phase 21); hardware UAT pending (Phase 999.1)"
- ROADMAP.md Phase 999.1 Requirements line extended with ONBRD-04; 10-step UAT checklist added covering Skyrim SE via Proton hardlink deployment end-to-end
- ROADMAP.md Phase 21 plan list: 21-02 checked, Plans count updated to "2/2 plans complete"
- ROADMAP.md progress table: Phase 21 updated to 2/2 Complete 2026-04-17

## Task Commits

Each task was committed atomically:

1. **Task 1: Update REQUIREMENTS.md and ROADMAP.md for ONBRD-04 code-complete + 999.1 UAT entry** - `61b2931c0` (docs)

**Plan metadata:** (see final commit)

## Files Created/Modified
- `.planning/REQUIREMENTS.md` - ONBRD-04 line updated to reflect code-complete status with Phase 999.1 UAT note
- `.planning/ROADMAP.md` - Phase 999.1 extended with ONBRD-04 requirement + UAT checklist; Phase 21 entry updated to 2/2 complete

## Decisions Made
- D-08 confirmed: UAT checklist placement in Phase 999.1 follows established precedent (ELEV-04/ELEV-05/SAVE-05)
- ONBRD-04 declared code-complete after Phase 21-01 unblocked hardlink_activator isSupported on Linux

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 21 is fully complete (2/2 plans)
- Phase 22 (Steam Deck Layout) and Phase 23 (Help Links) are the remaining v7.0 phases
- Phase 999.1 has ONBRD-04 UAT steps ready for hardware validation when a Linux test machine is available

---
*Phase: 21-mod-install-round-trip-validation*
*Completed: 2026-04-17*
