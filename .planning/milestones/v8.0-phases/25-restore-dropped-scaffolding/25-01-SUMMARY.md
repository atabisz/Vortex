---
phase: 25-restore-dropped-scaffolding
plan: 01
subsystem: sync
tags: [upstream-sync, discovery, ba2tk, jest-divergence, paths-workspace]

requires:
  - phase: 24-config-bucket
    provides: branch v8.0/config-bucket with merge commit 138da2249 (parent2 = 8b5a9f675)
provides:
  - "Frozen restore set for Plans 02–04 (46 expected adds + 5 effective renames)"
  - "Deny-list anomaly list (2 files) — playbook §11 grep must be tightened"
  - "Surprise list (5 files) — awaiting user accept/reject at checkpoint"
  - "ba2tk catalog source decision: pin upstream git SHA Nexus-Mods/node-ba2tk#762d8de8…"
affects: [25-02, 25-03, 25-04, all-future-upstream-syncs]

tech-stack:
  added: []
  patterns: ["SHA-pin-then-diff discovery against second parent of merge commit"]

key-files:
  created:
    - .planning/phases/25-restore-dropped-scaffolding/25-DISCOVERY-RESULT.md
  modified: []

key-decisions:
  - "ba2tk catalog entry pins git SHA `Nexus-Mods/node-ba2tk#762d8de8…` (matches upstream's catalog spec and existing `flatpak/generated-sources.json` pin); fork is NOT vendoring its own ba2tk despite STACK.md / CLAUDE.md wording"
  - "Restoration is bigger than CONTEXT.md modeled: rename diff (^R) shows the gamebryo-archive-support → gamebryo-ba2-support directory rename, the docs/flatpak/ → docs/flatpak- doc-flattening, and the chunking.test.ts move from src/shared/src/ to src/main/src/downloading/ — pure ^A diff missed all three"
  - "Deny-list filter has a hole: `src/renderer/src/util/__mocks__/log.ts` and `src/renderer/src/setupTests.js` slipped past the three :! pathspecs. Playbook §11 (D-25-12) re-grep should be tightened to catch these patterns"

patterns-established:
  - "Discovery-first phase (no commits land in this plan; produces a written restore-set artifact for downstream plans to consume)"

requirements-completed: []  # discovery only — SYNC-11..16 complete after Plans 02–04 land

duration: 18min
completed: 2026-05-15
---

# Phase 25 Plan 01: Restore-dropped-scaffolding Discovery Summary

**Discovery diff against upstream parent `8b5a9f675` produced the canonical restore set for Plans 02–04, surfaced a directory-rename plus two doc-renames the `^A`-only filter missed, and resolved D-25-10 to "pin upstream's git SHA in the catalog".**

## Status

**COMPLETE.** Task 1 (discovery diff + classification + ba2tk grep) and Task 2 (human-verify checkpoint) both done. User approved all recommendations: ACCEPT 5 surprises, REJECT 2 deny-list anomalies, ACKNOWLEDGE 3 effective renames (Plans 03+04 amended on the fly).

## Performance

- **Started:** 2026-05-15
- **Tasks done:** 1 of 2 (Task 2 is the checkpoint)
- **Files created:** 1 (`25-DISCOVERY-RESULT.md`); 6 plan/context files force-staged into the worktree's `.planning/` (gitignored locally; required for Plans 02+ to read)

## Accomplishments

- SHA pin verified: `git rev-parse 138da2249^2` → `8b5a9f675…` matches expected. No upstream history rewrite.
- Discovery diff captured with deny-list filter applied: 50 `^A` entries.
- Rename diff captured separately: 10 `^R` entries (3 are real expected renames the `^A`-only filter missed; 3 are spurious git rename-detection; 4 are correctly deny-listed).
- Classification table complete: 46 expected adds, 5 effective expected renames, 2 deny-list anomalies, 5 surprises.
- `node-ba2tk` grep confirmed: NOT fork-vendored. CLAUDE.md / STACK.md "custom fork" wording is incorrect — the flatpak source pin matches upstream's `Nexus-Mods/node-ba2tk` org.
- ba2tk catalog source decided: pin upstream's git SHA `Nexus-Mods/node-ba2tk#762d8de841ca1c770a0925311fd626d71de67971` (no npm registry version exists; same SHA already in `flatpak/generated-sources.json`).

## Task Commits

1. **Task 1: discovery diff + ba2tk grep + 25-DISCOVERY-RESULT.md** — `34e7b49cd` (docs)
2. **Task 2: user decisions on surprises/anomalies/renames** — `4128106e9` (docs)

Worktree note: `.planning/` is gitignored repo-wide, so the artifact and plan files were force-added (`git add -f`). This is consistent with how prior phases' planning files have been handled in the fork.

## Files Created

- `.planning/phases/25-restore-dropped-scaffolding/25-DISCOVERY-RESULT.md` — discovery output, classification table, rename gap, ba2tk source decision
- `.planning/phases/25-restore-dropped-scaffolding/25-{01..04}-PLAN.md`, `25-CONTEXT.md`, `25-DISCUSSION-LOG.md` — staged into the worktree (originals live in main-repo working tree only)

## Decisions Made

1. **ba2tk catalog source = upstream git SHA**, not npm version. Same SHA as `flatpak/generated-sources.json` already pins. Resolves D-25-10 open executor question.
2. **Discovery filter has a hole.** The CONTEXT.md `<specifics>` "Discovery diff command" only catches `^A`. Real renames (`^R`) carry information the deny-list-of-A-paths can't reject — surfaced 3 must-handle renames in `25-DISCOVERY-RESULT.md` `## Discovery Diff (raw) > Rename diff` for Plans 02–04. Future syncs should pipe both `^A` and `^R` through the discovery filter.
3. **Two deny-list anomalies** (`src/renderer/src/setupTests.js`, `src/renderer/src/util/__mocks__/log.ts`) need explicit reject decisions in commit 4's body alongside the existing Jest deny-list (per D-25-14). Playbook §11 re-grep (D-25-12) should be widened to catch these patterns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `.planning/` gitignored; used `git add -f` to commit the discovery artifact**
- **Found during:** Task 1 commit
- **Issue:** Repo-level `.gitignore:116` ignores `.planning/`; default `git add` refused.
- **Fix:** Used `git add -f` (force-add) for the discovery artifact and the phase 25 plan/context files.
- **Files modified:** None — only commit-staging behavior.
- **Verification:** `git log --oneline -1` shows commit `34e7b49cd` with all 7 files added.

**2. [Rule 2 — Critical correctness] Surfaced rename gap in CONTEXT.md `<specifics>` discovery command**
- **Found during:** Task 1 (after running the prescribed `^A`-only command)
- **Issue:** The deny-list-filtered `git diff … | grep '^A'` misses upstream renames. Three real expected restorations are renames, not adds: gamebryo-archive-support→gamebryo-ba2-support directory, docs/flatpak/* → docs/flatpak-* flat docs, src/shared/src/chunking.test.ts → src/main/src/downloading/chunking.test.ts move. Plans 02–04 would have produced a wrong tree if executed mechanically off the `^A` list.
- **Fix:** Captured the rename diff separately in `25-DISCOVERY-RESULT.md` `### Rename diff` section with per-row recommendations. Plan 04's commit 5 needs to handle the flatpak doc rename; Plan 02's commit 2 needs to remove `extensions/gamebryo-archive-support/` after restoring `gamebryo-ba2-support/`; Plan 02 or 03's commit 3 needs to handle chunking.test.ts as a move.
- **Files modified:** `25-DISCOVERY-RESULT.md` only — no source-tree changes in Plan 01.
- **Verification:** Rename diff embedded verbatim with the same `:!` filter applied; downstream plans now have the data.

---

**Total deviations:** 2 (1 blocking-environment, 1 critical-correctness — both surfaced in the artifact and surfaced to the user via the checkpoint)
**Impact on plan:** Plan 01 still does pure discovery; the deviations are recorded ahead of any restoration commit landing.

## Issues Encountered

- CONTEXT.md `<domain>` "Files restored this phase" listed `docs/flatpak-maintenance.md` and `docs/flatpak-technical.md` as missing on `v8.0/config-bucket`. Reality: local has nested `docs/flatpak/{maintenance,technical}.md`; upstream renamed the directory away. The restore is a flatten/rename, not a fresh add. Documented in `25-DISCOVERY-RESULT.md`.
- CONTEXT.md `<domain>` listed `src/main/src/downloading/chunking.test.ts` as missing. Reality: it's missing **at that path** but exists at `src/shared/src/chunking.test.ts` upstream-renamed it. Documented similarly.
- `chunking.ts` (the source file) requires `DownloadManager.ts`, `DownloadObserver.ts`, `FileAssembler.ts`, `SpeedCalculator.ts` — all upstream-new, all surprises in the discovery diff. They were not in CONTEXT.md `<domain>` "Files restored this phase". The user must accept/reject these at the checkpoint or `chunking.ts` won't compile after restoration.

## Next Plan Readiness

- **Plans 02–04 ready to dispatch.** All checkpoint decisions captured in `25-DISCOVERY-RESULT.md` `## User Decisions on Surprises`.
- Plan 02: standard packages/paths + paths-node restore (no changes from CONTEXT.md).
- Plan 03: amended — also `git rm` `extensions/gamebryo-archive-support/` after restoring ba2-support; restore set is the full `git ls-tree 8b5a9f675 -- extensions/gamebryo-ba2-support/` list, not just CONTEXT.md's 2 files.
- Plan 04: amended — commit 3 includes 4 download_management spine files + `git mv`-equivalent for chunking.test.ts; commit 4 documents both deny-list rejections + widens Playbook §11 grep; commit 5 handles flatpak doc flattening as a rename + adds structure.md.

## Self-Check: PASSED

- `25-DISCOVERY-RESULT.md` exists at expected path: confirmed via Write tool.
- All five required sections present (`## SHA Pin Verification`, `## Discovery Diff (raw)`, `## Classification`, `## node-ba2tk Grep Result`, `## ba2tk Version Source`): verified by `grep -q '^## …$'`.
- Task 1 commit `34e7b49cd` is reachable via `git log --oneline -1`.
- No working-tree changes outside `.planning/`: `git status -s -- ':!.planning'` empty.

---
*Phase: 25-restore-dropped-scaffolding*
*Plan: 01*
*Status: PARTIAL — at human-verify checkpoint*
*Completed: 2026-05-15*
