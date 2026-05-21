---
phase: 27-gamebryo-per-game-extensions
plan: 08
subsystem: phase-done-gate
tags:
    - linux-port
    - upstream-v2.0.0
    - phase-27
    - done-gate
    - force-with-lease-push
requirements:
    satisfied:
        - SYNC-05
        - SYNC-06
        - SYNC-17
        - SYNC-19
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-07-SUMMARY.md (file work complete — 25/25 resolved)
    provides:
        - Phase 27 complete on `v8.0/config-bucket` and on `fork/sync/upstream-v2.0.0`
        - 27-DONE-GATE.md evidence record for milestone audit trail
    affects:
        - Phase 28 (renderer + main spine — already-known `src/shared/` conflicts now confirmed as the next blocker)
tech_stack:
    added: []
    patterns:
        - "Done-gate evidence pattern (Phase 26 26-10 idiom): captures verbatim output of all six D-27-05 checks plus push confirmation in `27-DONE-GATE.md`. Reusable shape for Phase 28/29/30 done-gates and future v8.1/v9.0 sync milestones."
        - "Pre-existing-failure documentation pattern: when full-repo `pnpm typecheck` surfaces errors outside the phase scope, compare against the merge-base ref to prove pre-existence; document as 'Pre-existing — not introduced by Phase N' rather than blocking the gate. Phase 27 surfaced 15 TS1185 conflict-marker errors in `src/shared/src/` (Phase 28 territory) — verified pre-existing on `fork/sync/upstream-v2.0.0` via `git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.0 -- src/shared/`."
        - "Force-with-lease push via configured HTTPS `fork` remote (no SSH fallback needed): sandbox did not block `.git/config` read this session. Memory-noted SSH inline URL fallback (`git push git@github.com:atabisz/Vortex.git …`) remains the documented fallback for future plans."
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-DONE-GATE.md
        - .planning/phases/27-gamebryo-per-game-extensions/27-08-SUMMARY.md
    modified:
        - .planning/STATE.md
        - .planning/ROADMAP.md
decisions:
    - "Full-repo `pnpm typecheck` surfaced 15 pre-existing TS1185 conflict-marker errors in `src/shared/src/{errors.ts, errors.test.ts, telemetry/spans.ts}` from base commit `138da2249 merge upstream v2.0.0 (conflicts)`. Verified pre-existing on `fork/sync/upstream-v2.0.0` (the merge base) — these conflict markers existed before Phase 24 started and survived Phase 24/25/26/27 because none of those phases touched `src/shared/`. Documented in 27-DONE-GATE.md per deviation_handling rule; non-blocking for Phase 27 done-gate. Phase 28 (renderer + main spine) owns `src/shared/`."
    - "Phase-27-scope cross-extension drift check: PASS. Filtering the full typecheck log for any error in a Phase 27 directory returns zero hits. The 58 nx projects that ran before the `@vortex/shared` failure all produced clean output; the 54 dependent projects that nx aborted (because they depend on `@vortex/shared:typecheck`) include all four Phase 27 extensions with `typecheck` scripts — but Check 3's per-extension typecheck route (`pnpm --filter <pkg> typecheck`) bypasses the nx graph and exited 0 for all four directly."
    - "BG3, Morrowind, and Witcher3 use build-as-typecheck (`pnpm --filter <name> build`) per Plan 27-05/06/07 routing — these extensions have no per-extension `tsconfig.json` and no `typecheck` script. Carried forward unchanged in this done-gate. Bundles produced and copied to `src/main/build/bundledPlugins/`."
    - "Force-with-lease push via configured HTTPS `fork` remote succeeded first try; no SSH inline URL fallback needed. Pre-push remote SHA `f15bbabb8` (the merge base — branch had not been pushed since the original Phase 24 push at commit `87784986d`); post-push remote SHA `1b7427dba` matches local HEAD. `--force-with-lease` (not `--force`) per CONTEXT D-27-00."
metrics:
    duration_minutes: 12
    completed: "2026-05-21"
    commit_count: 0 # this plan does NOT add resolve commits; it only adds docs commits below
    task_count: 1
    file_count: 4
---

# Phase 27 Plan 08: D-27-05 Done-Gate Summary

Ran the six D-27-05 done-gate checks against `v8.0/config-bucket` HEAD `1b7427dba` (output of Plan 27-07). Five of six passed cleanly. Check 4 (full-repo `pnpm typecheck`) surfaced 15 pre-existing conflict-marker errors in `src/shared/src/` — Phase 28 territory, verified pre-existing on the merge base. Per deviation_handling rule, documented as non-blocking. Force-with-lease pushed `f15bbabb8..1b7427dba` to `fork/sync/upstream-v2.0.0`. Phase 27 complete.

## What Got Verified

**Check 1 — Zero conflict markers across 7 phase directories:** PASS. `git grep '^<<<<<<< ' <7 dirs>` exits 1 (no matches). All 25 conflict files cleanly resolved.

**Check 2 — `scripts/grep-checkpoint.sh` full run (no `--skip-conflict-check`):** PASS. All 12 gates green:

- Phase 26 invariants (gates 1–6): §6 stagingDirHasFiles, §7a normalizeBackslashPaths, §7b mergeCaseConflictingDirs, §7c copy-loop replaceAll, §7d resolvePathCase(tempPath), 140a57217 resolvePathCase(dataPath) at LinkingDeployment.ts:523/:742/:799 — all preserved untouched.
- Phase 27 invariants (gates 7–11): §1 extension build guards (no inline `process.platform` outside gamestore-xbox; skip-on-{windows,linux}.mjs present; xbox carries skip-on-linux), §3 LOOT casing in autosort.ts (no `pluginName.toLowerCase` at LOOT call sites; `path.basename(pluginList[…])` count ≥3), §10 cross-compiled native binaries (loot + bsatk dist artefacts on disk), BG3 4-class divine errors preserved (count ≥4), Morrowind migrate103 warning preserved (count ≥1) — all green.
- Conflict-marker gate 12: zero `<<<<<<< ` markers across mod_management/ + 7 Phase 27 extension dirs.

**Check 3 — Per-extension typecheck:** PASS. All seven extensions exit 0:

- 4 with `typecheck` scripts: `pnpm --filter <name> typecheck` for `gamebryo-savegame-management`, `gamebryo-plugin-management`, `modtype-bepinex`, `collections`.
- 3 without: `pnpm --filter <name> build` (rolldown bundler — refuses syntax/resolution errors at bundle time) for `game-baldursgate3`, `game-morrowind`, `game-witcher3`. Same routing established in Plans 27-05/06/07.

**Check 4 — Phase-end full-repo `pnpm typecheck`:** Exit 130 — 15 pre-existing TS1185 errors in `src/shared/src/{errors.ts, errors.test.ts, telemetry/spans.ts}`. Zero Phase 27-scope errors. Documented as "Pre-existing — not introduced by Phase 27" in 27-DONE-GATE.md §4. See deviation note below.

**Check 5 — 25 atomic resolve commits + 1 setup commit (26 total):** PASS. Per-extension counts match CONTEXT D-27-00 exactly:

| Scope                       | Expected | Actual |
| --------------------------- | -------- | ------ |
| `resolve(savegame-mgmt)`    | 2        | 2      |
| `resolve(plugin-mgmt)`      | 4        | 4      |
| `resolve(bepinex)`          | 3        | 3      |
| `resolve(collections)`      | 6        | 6      |
| `resolve(bg3)`              | 7        | 7      |
| `resolve(morrowind)`        | 1        | 1      |
| `resolve(witcher3)`         | 2        | 2      |
| `resolve(checkpoint)` setup | 1        | 1      |
| **Total**                   | **26**   | **26** |

`git rev-list --count fork/sync/upstream-v2.0.0..v8.0/config-bucket` = 39. The remaining 13 are non-blocking docs and phase-setup commits (8 `docs(27-NN): complete <plan>` summaries + 5 phase-bootstrap commits).

**Check 6 — Force-with-lease push:** PASS. `git push --force-with-lease fork v8.0/config-bucket:sync/upstream-v2.0.0` succeeded; pre-push remote SHA `f15bbabb8` → post-push `1b7427dba` (matches local HEAD). HTTPS via the configured `fork` remote worked first try; SSH inline URL fallback (per CLAUDE.md memory note) not needed.

## Verification

```
$ git grep '^<<<<<<< ' \
    extensions/gamebryo-plugin-management/ \
    extensions/gamebryo-savegame-management/ \
    extensions/collections/ \
    extensions/modtype-bepinex/ \
    extensions/games/game-baldursgate3/ \
    extensions/games/game-morrowind/ \
    extensions/games/game-witcher3/
(empty — exit 1)

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh
... 12 gates OK ...
CHECKPOINT PASSED — 12 gate(s) clean
exit=0

$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 \
    | grep -cE '^[0-9a-f]+ resolve\((savegame-mgmt|plugin-mgmt|bepinex|collections|bg3|morrowind|witcher3)\):'
25

$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 \
    | grep -cE '^[0-9a-f]+ resolve\(checkpoint\): scripts/grep-checkpoint\.sh —'
1

$ git push --force-with-lease fork v8.0/config-bucket:sync/upstream-v2.0.0
To https://github.com/atabisz/Vortex.git
   f15bbabb8..1b7427dba  v8.0/config-bucket -> sync/upstream-v2.0.0

$ git ls-remote fork sync/upstream-v2.0.0
1b7427dba10fcef4b53352115d3594e198dcc645    refs/heads/sync/upstream-v2.0.0
```

All acceptance criteria from the plan met:

- All six D-27-05 checks documented with verbatim output in 27-DONE-GATE.md ✓
- Pre-existing src/shared/ conflict markers documented as Phase 28 territory ✓
- 25 + 1 atomic commits visible on `v8.0/config-bucket` ✓
- `fork/sync/upstream-v2.0.0` force-with-lease pushed to HEAD `1b7427dba` ✓
- ROADMAP.md Phase 27 row marked `[x]` with `(complete 2026-05-21)` ✓
- STATE.md updated: Phase 27 complete; ready for Phase 28 ✓
- `27-DONE-GATE.md` exists at `.planning/phases/27-gamebryo-per-game-extensions/` ✓

## Deviations from Plan

**Deviation 1 (Rule 1 + deviation_handling — pre-existing failure documentation): Check 4 (`pnpm typecheck` full repo) exits 130 with 15 TS1185 conflict-marker errors in `src/shared/src/`.**

The plan acknowledges this possibility upfront in `<deviation_handling>`: "If `pnpm typecheck` (full repo) surfaces pre-existing errors unrelated to Phase 27 changes (e.g., upstream untouched files), document them in 27-DONE-GATE.md as a 'Pre-existing — not introduced by Phase 27' subsection. Compare against `origin/sync/upstream-v2.0.0` typecheck to confirm."

Verified pre-existing:

```
$ git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.0 -- src/shared/
fork/sync/upstream-v2.0.0:src/shared/src/errors.test.ts
fork/sync/upstream-v2.0.0:src/shared/src/errors.ts
fork/sync/upstream-v2.0.0:src/shared/src/telemetry/spans.ts

$ git log --oneline -1 -- src/shared/src/errors.ts
138da2249 merge upstream v2.0.0 (conflicts)
```

The conflict markers were introduced by the original merge commit at the start of v8.0/config-bucket and survived Phase 24/25/26/27 because none of those phases touched `src/shared/`. Phase 28's scope explicitly includes `src/shared/`. This is the correct behaviour — Phase 27's scope is the 7 extension directories, and the cross-extension drift signal Check 4 was designed to catch (per CONTEXT D-27-05 wording: "the cross-extension drift check — catches anything per-extension typechecks miss") is **clean** when filtered to Phase 27 scope: zero errors in any of `extensions/(gamebryo-(plugin|savegame)-management|collections|modtype-bepinex|games/game-(baldursgate3|morrowind|witcher3))/`.

The 54 nx projects that nx aborted (because they depend on `@vortex/shared:typecheck`) include all four Phase 27 extensions with `typecheck` scripts. Check 3 covered those four directly via `pnpm --filter <pkg> typecheck` — bypassing the nx graph — and all four exited 0. So the per-extension drift signal is captured; the full-repo signal is just blocked by the upstream pre-existing failure.

Documented in 27-DONE-GATE.md §4 verbatim. Non-blocking for the gate per the plan's own deviation_handling rule. No re-resolution required.

**Note (no actual deviation):** Plan body referenced `origin/sync/upstream-v2.0.0` in commands (e.g., `git rev-list --count origin/sync/upstream-v2.0.0..v8.0/config-bucket`); the local repo's `origin` remote points to upstream Nexus-Mods (which doesn't have this branch), but the `fork` remote (`atabisz/Vortex`) does. Substituted `fork/sync/upstream-v2.0.0` throughout — same intent, correct ref. The repo's actual remote layout matches the project memory note "Git push SSH URL" (atabisz/Vortex on `fork`, Nexus-Mods on `origin`).

## Issues Encountered

None of substance. The full-repo typecheck failure was anticipated by the plan's deviation_handling block and proven pre-existing in two queries.

## Next Phase Readiness

- **Phase 27: COMPLETE** — all 25 conflict files resolved, 12 grep-checkpoint gates green, force-with-lease push landed on `fork/sync/upstream-v2.0.0`. Branch ready for Phase 28 to build on.
- **Phase 28 readiness signal:** Check 4 surfaced the next conflict cluster — `src/shared/src/{errors.ts, errors.test.ts, telemetry/spans.ts}` (15 conflict markers across 3 files). These belong to Phase 28's scope ("renderer + main spine") per ROADMAP.md. The Phase 28 planner can use this output as part of the conflict inventory.
- **fork/sync/upstream-v2.0.0 SHA:** `1b7427dba10fcef4b53352115d3594e198dcc645`. Phase 28 work can branch from this point.
- **Phase 26 + Phase 27 invariants both intact:** §6, §7a–d, 140a57217 (Phase 26), §1, §3, §10, BG3 4-class divine, Morrowind migrate103 (Phase 27). 12-gate grep-checkpoint script lives at `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` and is ready for Phase 28's runs.

## Self-Check: PASSED

- File exists: `.planning/phases/27-gamebryo-per-game-extensions/27-DONE-GATE.md` — FOUND
- File exists: `.planning/phases/27-gamebryo-per-game-extensions/27-08-SUMMARY.md` — FOUND
- All six D-27-05 checks documented in 27-DONE-GATE.md — VERIFIED
- Requirements table maps SYNC-05/06/17/19 to evidence — VERIFIED
- COMPLETE timestamp present — VERIFIED (2026-05-21T02:53:47Z)
- Force-with-lease push pre-/post-SHA captured — VERIFIED (`f15bbabb8` → `1b7427dba`)
- Per-extension count matches D-27-00 expected (2/4/3/6/7/1/2 = 25 + 1 setup = 26) — VERIFIED

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 08_
_Completed: 2026-05-21_
