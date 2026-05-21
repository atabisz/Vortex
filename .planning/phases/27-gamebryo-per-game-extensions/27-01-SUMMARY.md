---
phase: 27-gamebryo-per-game-extensions
plan: 01
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - savegame-management
    - phase-27
    - extension-conflict
requirements:
    satisfied:
        - SYNC-05
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-00-SUMMARY.md (12-gate harness; passes after each commit)
        - extensions/gamebryo-savegame-management/src/types/ISavegame.ts (action payload type — already clean)
        - extensions/gamebryo-savegame-management/src/reducers/session.ts (consumes setSavegames action — already clean)
    provides:
        - First Phase 27 extension fully resolved (2/25 conflict files done)
        - Per-extension typecheck gate template (gamebryo-savegame-management → exit 0)
        - Confirmation that the extended grep-checkpoint harness flips conflict-marker hits clean as files resolve
    affects:
        - Plan 27-02 (gamebryo-plugin-management — next in D-27-01 extension order)
        - Plan 27-08 (Phase 27 done-gate — 23/25 conflict files remaining after this plan lands)
tech_stack:
    added: []
    patterns:
        - "Per-conflict-region stance documented in commit body (which side won + why) — fork-side default, syntactic correctness as tiebreaker"
        - "Per-extension typecheck via `pnpm --filter <name> typecheck` (D-27-04 cadence; bare package name, NOT `@vortex/<ext>`)"
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-01-SUMMARY.md
    modified:
        - extensions/gamebryo-savegame-management/src/actions/session.ts
        - extensions/gamebryo-savegame-management/src/index.ts
decisions:
    - "Both regions resolved fork-side (HEAD): actions/session.ts kept inline arrow form (matches surrounding action-creator style); index.ts kept fork's correctly-balanced .then closer (upstream side had a stale `},)` artefact from a prior call shape and would have been a syntax error in this position)"
    - "Per-extension typecheck filter is the bare package name `gamebryo-savegame-management` (extensions in this monorepo do NOT carry the `@vortex/` scope — confirmed via package.json `name` field; CONTEXT D-27-04 example was a generic placeholder)"
    - "oxfmt pre-commit hook reformatted index.ts during the second commit (collapsed multi-line function signatures to single lines per print-width=80). Behaviour preserved; commit still touches exactly one file"
metrics:
    duration_minutes: 2
    completed: "2026-05-21"
    commit_count: 2
    task_count: 2
    file_count: 2
---

# Phase 27 Plan 01: gamebryo-savegame-management conflict resolution Summary

Resolved both conflict files in `extensions/gamebryo-savegame-management/src/` leaf-first per D-27-01 — `actions/session.ts` then `index.ts` — fork-side wins on both regions; per-extension typecheck clean; 11-gate grep-checkpoint stays green after each commit.

## What Got Resolved

**File 1 — `actions/session.ts` (commit `0caa66fa4`):** Single conflict region around the `setSavegames` createAction signature. HEAD wraps the arrow body inline (`(savegames, truncated) => ({ savegames, truncated })` on one line); v2.0.0 wraps onto two. Functionally identical — kept HEAD because every other createAction in this module uses the inline single-line form (e.g. lines 17-18 `setSavegameAttribute`, 20-22 `updateSavegame`) and oxfmt's print-width=80 leaves the inline form well under limit. No playbook items live in this file.

**File 2 — `index.ts` (commit `68a1b97e0`):** Single conflict region inside `updateSaves()` `.then()` callback (lines 100-113 pre-resolution). HEAD has correct 6-space indent and closes the arrow callback with `});` matching the single-arg `.then((result: ...) => {` opener at line 91. Upstream side has 8-space indent and a trailing `},\n  );` — leftover from a prior call shape where `.then()` took a named-arg object. Post-merge the upstream form is **syntactically invalid** in this position (extra comma + extra paren). Kept HEAD as the only valid resolution. Imports unchanged; barrel re-exports unaffected; no `@vortex/paths` or other Linux-port scaffolding lives in this file.

## Verification

After Task 1 commit (`0caa66fa4`):

```
$ grep -c '^<<<<<<< ' extensions/gamebryo-savegame-management/src/actions/session.ts
0
$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... (all 11 gates OK) ...
CHECKPOINT PASSED — 11 gate(s) clean
exit=0
```

After Task 2 commit (`68a1b97e0`):

```
$ git grep -l '^<<<<<<< ' extensions/gamebryo-savegame-management/
(empty — entire extension clean)

$ pnpm --filter gamebryo-savegame-management typecheck
> gamebryo-savegame-management@0.2.0 typecheck
> pnpm tsc
exit=0

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... (all 11 gates OK) ...
CHECKPOINT PASSED — 11 gate(s) clean
exit=0

$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 \
    | grep -cE '^[0-9a-f]+ resolve\(savegame-mgmt\):'
2
```

All acceptance criteria from the plan met:

- Two atomic commits matching `resolve(savegame-mgmt): <file> — <stance>` ✓
- Each commit touches exactly one file ✓
- Both files conflict-marker free ✓
- Entire extension conflict-marker free (`git grep -l '^<<<<<<< ' extensions/gamebryo-savegame-management/` empty) ✓
- `pnpm --filter gamebryo-savegame-management typecheck` exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 after each commit ✓

## Commits

| Commit      | Title                                                                                     | Files                                                            |
| ----------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `0caa66fa4` | `resolve(savegame-mgmt): actions/session.ts — keep HEAD inline arrow form`                | `extensions/gamebryo-savegame-management/src/actions/session.ts` |
| `68a1b97e0` | `resolve(savegame-mgmt): index.ts — keep HEAD (drop stale upstream indent + extra brace)` | `extensions/gamebryo-savegame-management/src/index.ts`           |

Phase 27 progress after this plan: **2 / 25 conflict files resolved (8%)**. Next plan (27-02) tackles `gamebryo-plugin-management` (4 files).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Spec/reality mismatch] Per-extension typecheck filter is bare package name, not `@vortex/<ext>`**

- **Found during:** Task 2 verification (initial run of `pnpm typecheck -F gamebryo-savegame-management`)
- **Issue:** Plan task spec hinted to confirm filter syntax against `package.json`, then noted "filter is the bare package name (NOT `@vortex/<ext>` — extensions in this repo do not carry the `@vortex/` scope)" — which is correct, but the surrounding D-27-04 examples in `27-CONTEXT.md` use the `@vortex/<ext>` form as a stand-in. CONTEXT also explicitly defers exact filter syntax to executor. This wasn't a contradiction worth blocking on, just a confirmation: `pnpm --filter gamebryo-savegame-management typecheck` (or running `pnpm tsc` from the extension dir) is the canonical form.
- **Fix:** Confirmed via `extensions/gamebryo-savegame-management/package.json` — `"name": "gamebryo-savegame-management"`. Used `pnpm --filter gamebryo-savegame-management typecheck`; exits 0 with no errors.
- **Why not Rule 4:** Filter-syntax confirmation is explicitly delegated to the executor in CONTEXT "Claude's Discretion" (item 3). Not a strategy change.
- **Files modified:** none (verification only)
- **Commit:** n/a — captured in this summary's Decisions section as the canonical form for plans 27-02..27-07

**2. [Note, not a Rule trigger] oxfmt pre-commit hook reformatted index.ts during commit**

- **Found during:** Task 2 commit
- **Issue:** Pre-commit lint-staged ran `pnpm oxfmt --no-error-on-unmatched-pattern` on the staged file. Several adjacent function signatures (e.g. `openSavegamesDirectory`, `updateSaves` argument list, dialog `text:`/`message:` field formatting) were collapsed from multi-line to single-line per print-width=80. Behaviour preserved; the conflict resolution itself was not affected. The commit still touches exactly one file (`extensions/gamebryo-savegame-management/src/index.ts`) and all 11 grep-checkpoint gates remain green.
- **Fix:** None needed — this is the project's standard pre-commit formatting, applied uniformly to fork-resolved code. Logged here so future plans expect the same behaviour.
- **Why not Rule 1:** No bug. The file-modified post-edit notification confirms the change was intentional (project's lint-staged config).
- **Files modified:** `extensions/gamebryo-savegame-management/src/index.ts` (formatting only, in the same commit as the conflict resolution)

---

**Total deviations:** 1 confirmation (Rule 1) + 1 informational note (oxfmt formatting)
**Impact on plan:** Zero scope creep. Both items are clarifications future plans (27-02..27-07) will reuse.

## Issues Encountered

None. Both conflict regions were unambiguous — actions/session.ts was a pure cosmetic difference, index.ts had one syntactically-invalid upstream side that picked itself.

## Next Phase Readiness

- **Plan 27-02 (gamebryo-plugin-management, 4 files) ready** — leaf-first sub-order: `util/gameSupport.ts` → `util/PluginPersistor.ts` → `views/PluginList.tsx` → `index.ts`. Heavier conflict surface than savegame-mgmt; §3 (LOOT casing in autosort.ts) and §10 (cross-compiled native binaries) gates are the relevant playbook protections — the grep-checkpoint harness already covers both.
- Conflict-marker tail count: 23 of 25 Phase 27 files remain. No additional remote refs touched (no push performed; D-27-00 push happens at phase end with `--force-with-lease`).

## Self-Check: PASSED

- File exists: `extensions/gamebryo-savegame-management/src/actions/session.ts` — FOUND
- File exists: `extensions/gamebryo-savegame-management/src/index.ts` — FOUND
- Commit exists: `0caa66fa4` — FOUND on `v8.0/config-bucket`
- Commit exists: `68a1b97e0` — FOUND on `v8.0/config-bucket`
- Both commits touch exactly one file each — VERIFIED via `git diff-tree --no-commit-id --name-only -r <hash>`
- Both commit titles match `resolve(savegame-mgmt): <file> — <stance>` — VERIFIED
- Per-extension typecheck exit 0 — VERIFIED
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after each commit — VERIFIED
- 2 commits visible via `git log v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE 'resolve\(savegame-mgmt\):'` — VERIFIED

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 01_
_Completed: 2026-05-21_
