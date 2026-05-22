# Phase 27: Gamebryo + per-game extensions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 27-gamebryo-per-game-extensions
**Areas discussed:** Commit granularity, Per-game preservation gates, Playbook §1/§3/§10 reverification, Typecheck cadence + order

---

## Commit Granularity

| Option                                               | Description                                                                                                    | Selected |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Per-file (25 commits)                                | Mirror Phase 26 exactly. Maximum bisect granularity. ~25 commits.                                              | ✓        |
| Per-extension (7 commits)                            | One commit per extension. Easier per-extension stance read; loses per-file bisect.                             |          |
| Hybrid: per-file in complex, per-extension in leaves | Per-file for plugin-mgmt/savegame/collections/BG3; per-extension for bepinex/Morrowind/Witcher 3. ~22 commits. |          |
| Per-file but grouped by extension in execution order | Per-file (25 commits) executed extension-by-extension for contiguous log narrative.                            |          |

**User's choice:** Per-file (25 commits)
**Notes:** D-27-01 still groups execution by extension (dependees first, leaf-first within), which gives the same contiguous-log property as the fourth option without making it the headline framing. Granularity is the floor; execution order is the structure.

---

## Per-Game Preservation Gates

| Option                                            | Description                                                                                             | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| Existence + count gates (Phase 26 idiom)          | Prefix-anchored regex + count threshold. BG3 ≥4 named error classes; Morrowind ≥1 warning string match. | ✓        |
| Existence + content shape gates                   | Above plus shape checks (extends Error, .name set, try/catch wrapping). More fragile to upstream churn. |          |
| Existence-only (minimal)                          | Just `git grep -l` returns the file. Cheapest; weakest detection — partial reverts wouldn't trigger.    |          |
| Pre-snapshot + post-diff (Phase 26 D-26-02 idiom) | Snapshot exact lines before resolution, diff after. Most rigorous; Phase 26 noted heavyweight.          |          |

**User's choice:** Existence + count gates
**Notes:** Captured in D-27-02. Pattern matches Phase 26 D-26-03's `resolvePathCase\(dataPath,` count ≥ 3 idiom. Run after every commit — partial-revert detection is the explicit motivation.

---

## Playbook §1/§3/§10 Reverification

| Option                                            | Description                                                                         | Selected |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Add §1/§3/§10 gates to grep-checkpoint.sh         | Extend the Phase 26 script. Runs after every commit. Reusable for v8.1, v9.0 syncs. | ✓        |
| Pre-phase one-time check + post-phase final check | Manual grep at phase start and end only. Don't extend the script.                   |          |
| Add to script but only run at done-gate           | Extend the script but mark new gates `[done-gate-only]`, saves runtime.             |          |

**User's choice:** Add §1/§3/§10 gates to grep-checkpoint.sh
**Notes:** Captured in D-27-03. Durable — the script is now a milestone-grade reverification harness covering §1/§3/§6/§7a–d/§10 + 140a57217 + BG3 + Morrowind. Deferred follow-up: promoting it to `release-linux.yml` as pre-build CI gate (Phase 29).

---

## Typecheck Cadence + Order

| Option                                               | Description                                                                                                                                 | Selected |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Per-extension typecheck, leaf-first within extension | 7 typecheck runs (~10–20 min). Resolution order: dependees-first across extensions, leaf-first within. Phase-end full typecheck still runs. | ✓        |
| Per-file typecheck (Phase 26 D-26-04)                | 25× typecheck runs (~13–37 min). Maximum regression detection.                                                                              |          |
| Phase-end-only typecheck (Phase 24/25 cadence)       | One full-repo typecheck at phase-end. Fastest; weakest mid-phase detection.                                                                 |          |
| Per-extension typecheck + per-file build sanity      | 7 deep + 25 quick (`tsc --noEmit <file>`) checks.                                                                                           |          |

**User's choice:** Per-extension typecheck, leaf-first within extension
**Notes:** Captured in D-27-04. Deviation from Phase 26 D-26-04 (per-file) is intentional — Phase 27 spans 7 independently-typecheckable workspaces vs Phase 26's single workspace. Per-file typecheck remains available to executor judgement on a per-extension basis (not prohibited, just not the floor). Extension dependency order is dependees-first: savegame → plugin-mgmt → bepinex → collections → BG3 → Morrowind → Witcher 3.

---

## Claude's Discretion

- Per-conflict-region resolution stance for each file (default = hand-resolve, fork-side wins for Linux fixes, upstream wins for non-playbook scaffolding).
- Whether to commit grep-checkpoint.sh extensions as commit 0 or alongside the first resolution commit (suggested: commit 0, same as Phase 26).
- Exact `pnpm typecheck` filter syntax — executor confirms against `pnpm-workspace.yaml` at plan time.
- Whether `divineCore.test.ts` lands before or after `divineCore.ts` (suggested: source first).
- Whether to move `grep-checkpoint.sh` from Phase 26's directory to a milestone-shared location.

## Deferred Ideas

- Promoting `grep-checkpoint.sh` to `release-linux.yml` as a pre-build CI assertion (Phase 29).
- Refactoring inside any of the 25 conflict files (out of scope per PROJECT.md).
- Witcher 3 / BG3 / Morrowind runtime smoke tests on Linux (Phase 29 build-verify territory).
- Moving `grep-checkpoint.sh` to a milestone-shared location.
