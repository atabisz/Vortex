---
phase: 27-gamebryo-per-game-extensions
plan: 04
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - collections
    - phase-27
    - extension-conflict
requirements:
    satisfied:
        - SYNC-17
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-02-SUMMARY.md (plugin-mgmt resolved; shared types stable for collections indirect import)
        - .planning/phases/27-gamebryo-per-game-extensions/27-03-SUMMARY.md (modtype-bepinex resolved; harness gates carry forward)
    provides:
        - Fourth Phase 27 extension fully resolved (15/25 conflict files done — 60%)
        - collections per-extension typecheck exit 0
        - Confirmation that the gamebryo-only toggle gates (excludePluginRules, skipPluginRules) survive intact through v2.0.0 sync
    affects:
        - Plan 27-05 (game-baldursgate3 — next in D-27-01 extension order; 7 files, heaviest extension)
        - Plan 27-08 (Phase 27 done-gate — 10/25 conflict files remaining after this plan lands)
tech_stack:
    added: []
    patterns:
        - "Cosmetic single-line vs wrapped resolution stance (carried from plans 27-01..27-03): keep HEAD inline form — oxfmt's print-width=80 leaves these regions under limit and would re-collapse upstream's wrapped form on next format pass"
        - "Merge-driver duplicate-block artefact (Phase 26 LinkingDeployment.ts idiom + plan 27-02 testBlueprintMasters/onStateChange idiom + plan 27-03 bepInExDownloader.ts idiom): upstream side re-pastes a block that the post-conflict context already contains — HEAD is the only non-duplicate resolution"
        - "Merge-driver dropped-imports artefact (new in this plan): v2.0.0 side of CollectionList/index.tsx imports conflict region listed only `hasEditPermissions, uploadCollection` while the file body uses 10+ symbols (`updateSuccessRate`, `doExportToAPI`, `INSTALLING_NOTIFICATION_ID`, `MOD_TYPE`, `findExtensions`, `InstallDriver`, `CollectionEdit`, `IPathTools`, `CollectionPage`, `StartPage`). HEAD form has the full set; v2.0.0 form would not compile."
        - "Merge-driver indent/brace artefact (new in this plan): v2.0.0 side of `registerActionCheck('ADD_NOTIFICATION', …)` body in index.ts nested the entire if/else block one level deeper with an extra `}` than the surrounding context — would have produced `}` mismatch. HEAD is the only structurally valid resolution."
        - "Fork-side feature preservation: HEAD wraps two v2.0.0-unconditional `<Toggle>` blocks in `isGamebryoGame(...)` ternaries — `excludePluginRules` toggle in CollectionPageEdit/Instructions.tsx and `skipPluginRules` toggle in InstallDialog/InstallStartDialog.tsx. Both gates are fork-side enhancements that hide gamebryo-only options on non-gamebryo games. Survived v2.0.0 sync via HEAD-side resolution."
        - "Bluebird-Promise trap absent: collections/src/index.ts imports `Bluebird from 'bluebird'` (named identifier) not `Promise from 'bluebird'`. The plan-27-02 `:Promise<T>` annotation hazard does not apply — verified via grep before commit. Did not add or touch any return-type annotations."
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-04-SUMMARY.md
    modified:
        - extensions/collections/src/util/gameSupport/gamebryo.tsx
        - extensions/collections/src/eventHandlers.ts
        - extensions/collections/src/views/CollectionPageEdit/Instructions.tsx
        - extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx
        - extensions/collections/src/views/CollectionList/index.tsx
        - extensions/collections/src/index.ts
decisions:
    - "Kept HEAD on every conflict region across all 6 files. 13 conflict regions total: 3 in gamebryo.tsx, 4 in eventHandlers.ts, 2 in Instructions.tsx, 2 in InstallStartDialog.tsx, 2 in CollectionList/index.tsx, 3 in index.ts. Stance breakdown — 9 cosmetic (single-line vs wrapped), 2 fork-side feature preservation (gamebryo-only toggle gates), 2 merge-driver duplicate-block/dropped-imports artefacts, 2 merge-driver indent/brace artefacts."
    - "Two fork-side feature gates preserved (the substantive HEAD-wins decisions): `{showExcludePluginRules ? <Toggle/> : null}` in CollectionPageEdit/Instructions.tsx (depends on `isGamebryoGame(gameId)` from `../../util/gameSupport`); `{isGamebryoGame(profile.gameId) ? <Toggle/> : null}` in InstallDialog/InstallStartDialog.tsx. Both hide gamebryo-only LOOT-rule toggles on non-gamebryo games (Witcher 3, BG3, etc.). Upstream v2.0.0 reverted these to unconditional renders — HEAD wins because the conditional rendering is correct UX (showing 'Skip plugin rules' for a game with no plugins is meaningless)."
    - "Four merge-driver artefacts caught and resolved fork-side: (1) gamebryo.tsx region 2 — v2.0.0 mid-block `=======` mid-batchDispatch call would have produced syntactically invalid `},)` against the post-conflict closing; HEAD is the only valid form. (2) eventHandlers.ts regions 1+2 — duplicate `import * as path` (line 1 already has it) plus duplicate `// Determine obsolete mods…` block (lines 99-120 already have it); HEAD drops both duplications. (3) CollectionList/index.tsx region 1 — v2.0.0 dropped 10+ imports that the file body uses; HEAD is the only compilable form. (4) index.ts region 3 — v2.0.0 nested the registerActionCheck body one indent level deeper with extra `}`; HEAD has the structurally correct form. All four follow the Phase 26/27 merge-driver re-paste idiom."
    - "Bluebird-Promise trap pre-checked per plan 27-02 D-27-04 footnote and plan 27-03 carry-forward: `grep -n 'import Promise from' extensions/collections/src/index.ts` returns nothing. The file imports `Bluebird from 'bluebird'` (named identifier, not Promise alias). Did not add or touch any `: Promise<T>` annotations."
    - "oxfmt pre-commit hook ran on each commit, with two notable touch-ups: (1) on Task 5 (CollectionList/index.tsx) it collapsed an extra blank line after the vortex-api import block; (2) on Task 6 (index.ts) it cleaned up some adjacent formatting around the resolved regions. Both hook touch-ups stayed within the resolved file boundary — each commit still touches exactly one file. No behavioural changes."
metrics:
    duration_minutes: 5
    completed: "2026-05-21"
    commit_count: 6
    task_count: 6
    file_count: 6
---

# Phase 27 Plan 04: collections conflict resolution Summary

Resolved all six conflict files in `extensions/collections/src/` leaf-first per D-27-01 — `util/gameSupport/gamebryo.tsx` → `eventHandlers.ts` → `views/CollectionPageEdit/Instructions.tsx` → `views/InstallDialog/InstallStartDialog.tsx` → `views/CollectionList/index.tsx` → `index.ts`. Fork-side wins on every region. Per-extension typecheck clean after the sixth commit. 11-gate grep-checkpoint stays green after each commit. Phase 27 progress: **15/25 conflict files resolved (60%)** — past the halfway mark.

## What Got Resolved

**File 1 — `util/gameSupport/gamebryo.tsx` (commit `05fdbcf24`):** Three conflict regions.

- Region 1 (`extractPluginRules` signature): cosmetic single-line vs wrapped. HEAD wins.
- Region 2 (`util.batchDispatch` group-rules block): merge-driver mid-block artefact. HEAD has the complete `{ADD_PLUGIN_GROUP, ADD_GROUP_RULE} reduce` body; v2.0.0 truncated mid-block at `=======` leaving only the `ADD_PLUGIN_GROUP` push — would have produced syntactically invalid `},)` against the post-conflict closing `});  return prev;  }, []), );`. HEAD is the only valid resolution.
- Region 3 (blank line before `function ruleName`): trivial whitespace difference. HEAD wins.

**File 2 — `eventHandlers.ts` (commit `a8287fcf0`):** Four conflict regions.

- Region 1 (top-of-file imports): merge-driver duplicate-import artefact. v2.0.0 added a second `import * as path from "path"` despite line 1 already importing path. Plus reordered InstallDriver/readCollection. HEAD form (single path import, no duplicate) is the only compilable resolution.
- Region 2 (mid-function `// Determine obsolete mods…` block): merge-driver duplicate-block artefact. v2.0.0 re-pasted the entire ~37-line block (extract collection.json, parse newRules, etc.) that already exists at lines 99-120. HEAD has it once; v2.0.0 would have it twice. HEAD is the only valid resolution.
- Region 3 (`(r) => r.type === "recommends" && util.testModReference(...)`): cosmetic single-line vs leading-`&&` wrapped. HEAD wins.
- Region 4 (`throw new util.ProcessCanceled("Download failed, update archive not found")`): cosmetic. HEAD wins.

**File 3 — `views/CollectionPageEdit/Instructions.tsx` (commit `3a49f4360`):** Two conflict regions.

- Region 1 (`onSetCollectionAttribute(["collectionConfig", "excludePluginRules"], newValue)`): cosmetic. HEAD wins.
- Region 2 (`{showExcludePluginRules ? <Toggle/> : null}` block): **fork-side feature preservation**. HEAD wraps the entire "Exclude plugin rules" toggle in a `showExcludePluginRules` ternary (computed from `isGamebryoGame(gameId)` on line 27). v2.0.0 reverted to unconditional render. The fork-side gate is correct UX — non-gamebryo games (Witcher 3, BG3) have no LOOT plugin rules to exclude, so showing the toggle is meaningless. HEAD wins on substance.

**File 4 — `views/InstallDialog/InstallStartDialog.tsx` (commit `68d97dba9`):** Two conflict regions.

- Region 1 (`{isGamebryoGame(profile.gameId) ? <Toggle/> : null}` block): **fork-side feature preservation**, identical pattern to file 3 region 2. HEAD wraps the "Skip plugin rules" toggle in an `isGamebryoGame(profile.gameId)` ternary. v2.0.0 reverted to unconditional. Same UX rationale — skipping plugin rules makes no sense for non-gamebryo games. HEAD wins on substance.
- Region 2 (`onSetModAttribute(driver.profile.gameId, driver.collection.id, "skipPluginRules", checked)`): cosmetic. HEAD wins.

**File 5 — `views/CollectionList/index.tsx` (commit `1290bcdf3`):** Two conflict regions.

- Region 1 (top-of-file imports below the vortex-api block): **merge-driver dropped-imports artefact**. HEAD has 10+ local imports the file body uses (`updateSuccessRate`, `doExportToAPI`, `INSTALLING_NOTIFICATION_ID`, `MOD_TYPE`, `NAMESPACE`, `TOS_URL`, `findExtensions`, `IExtensionFeature`, `InstallDriver`, `hasEditPermissions`, `uploadCollection`, `CollectionEdit`, `IPathTools`, `CollectionPage`, `StartPage`). v2.0.0 conflict region only listed `hasEditPermissions, uploadCollection` — would have failed to compile (e.g., `INSTALLING_NOTIFICATION_ID` is used at line 326, `CollectionsMainPage` extends `ComponentEx` which is imported, `StartPage` is rendered at line 148). HEAD is the only compilable resolution. (Hook collapsed a leading blank line after commit; cosmetic.)
- Region 2 (`canContribute = hasEditPermissions(...)` + `if (author !== undefined && ...)`): cosmetic. HEAD wins.

**File 6 — `index.ts` (commit `d2ba9abbb`):** Three conflict regions.

- Region 1 (`stateFunc().persistent.mods[selectors.activeGameId(stateFunc())] ?? emptyObj`): cosmetic single-line vs `??` wrapped onto next line. HEAD wins.
- Region 2 (`util.renderModName(stateFunc().persistent.mods[selectors.activeGameId(stateFunc())]?.[modId])`): cosmetic deep-chain wrapping. HEAD wins.
- Region 3 (`registerActionCheck("ADD_NOTIFICATION", …)` body): **merge-driver indent/brace artefact**. HEAD has the if/else block at 4-space indent matching the surrounding callback context. v2.0.0 indented the entire body one level deeper (6 spaces) and added an extra `}` — would have produced brace mismatch against the post-conflict `if ((collection?.rules ?? []).find(ruleMatches) !== undefined)` test which is at 4-space indent. HEAD is the only structurally valid resolution.

**Bluebird-Promise trap pre-check (per plan 27-02 D-27-04 footnote):** `grep -n 'import Promise from' extensions/collections/src/index.ts` returned nothing. The file imports `Bluebird from "bluebird"` as a named identifier (used as `Bluebird.resolve(...)`, `Bluebird<boolean>` type), not as a `Promise` alias. The trap does not apply. Did not add or touch any return-type annotations.

## Verification

After Task 1 commit (`05fdbcf24`): `grep -c '^<<<<<<< ' extensions/collections/src/util/gameSupport/gamebryo.tsx` = 0; grep-checkpoint PASSED 11 gates.

After Task 2 commit (`a8287fcf0`): `grep -c '^<<<<<<< ' extensions/collections/src/eventHandlers.ts` = 0; grep-checkpoint PASSED 11 gates.

After Task 3 commit (`3a49f4360`): file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 4 commit (`68d97dba9`): file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 5 commit (`1290bcdf3`): file conflict-clean; grep-checkpoint PASSED 11 gates.

After Task 6 commit (`d2ba9abbb`):

```
$ git grep -l '^<<<<<<< ' extensions/collections/
(empty — entire extension clean)

$ pnpm --filter collections typecheck
> collections@0.2.2 typecheck /home/alex/src/Vortex/extensions/collections
> pnpm tsc
exit=0

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... (all 11 gates OK) ...
CHECKPOINT PASSED — 11 gate(s) clean

$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE 'resolve\(collections\):'
6
```

All acceptance criteria from the plan met:

- Six atomic commits matching `resolve(collections): <file> — <stance>` ✓
- Each commit touches exactly one file ✓
- All six files conflict-marker free ✓
- Entire extension conflict-marker free (`git grep -l '^<<<<<<< ' extensions/collections/` empty) ✓
- `pnpm --filter collections typecheck` exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 after each commit ✓
- §1/§3/§10 + BG3 + Morrowind preservation gates all stayed green throughout ✓

## Commits

| Commit      | Title                                                                                                                                               | Files                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `05fdbcf24` | `resolve(collections): util/gameSupport/gamebryo.tsx — keep HEAD (drop merge-driver mid-block artefact + inline form)`                              | `extensions/collections/src/util/gameSupport/gamebryo.tsx`              |
| `a8287fcf0` | `resolve(collections): eventHandlers.ts — keep HEAD (drop merge-driver duplicate-block + duplicate path import + inline form)`                      | `extensions/collections/src/eventHandlers.ts`                           |
| `3a49f4360` | `resolve(collections): views/CollectionPageEdit/Instructions.tsx — keep HEAD (preserve gamebryo-only excludePluginRules toggle gate + inline form)` | `extensions/collections/src/views/CollectionPageEdit/Instructions.tsx`  |
| `68d97dba9` | `resolve(collections): views/InstallDialog/InstallStartDialog.tsx — keep HEAD (preserve gamebryo-only skipPluginRules toggle gate + inline form)`   | `extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx` |
| `1290bcdf3` | `resolve(collections): views/CollectionList/index.tsx — keep HEAD (drop merge-driver dropped-imports artefact + inline form)`                       | `extensions/collections/src/views/CollectionList/index.tsx`             |
| `d2ba9abbb` | `resolve(collections): index.ts — keep HEAD (drop merge-driver indent/brace artefact + inline form)`                                                | `extensions/collections/src/index.ts`                                   |

Phase 27 progress after this plan: **15 / 25 conflict files resolved (60%)**. Next plan (27-05) tackles `game-baldursgate3` (7 files — heaviest extension).

## Deviations from Plan

None — plan executed exactly as written.

The plan's "fork-side wins for any Linux-port import, upstream wins for new collections feature scaffolding" guidance translated cleanly: the two fork-side toggle gates (file 3 region 2, file 4 region 1) are gamebryo-feature-conditional rendering gates added by the fork — not Linux-port-specific but legitimately fork-side because they predate v2.0.0 and improve UX for non-gamebryo games. Treated as fork-side wins per the same stance idiom.

## Issues Encountered

None. All four merge-driver artefact patterns from prior plans (Phase 26 LinkingDeployment.ts, plan 27-02 plugin-mgmt index.ts, plan 27-03 bepInExDownloader.ts) recurred in this extension. The pattern is now well-characterised: when v2.0.0's "side" of a conflict region duplicates a block, drops imports, or shifts indentation in a way that disagrees with the post-conflict context, HEAD is always the only valid resolution. Reading both the conflict region AND the surrounding ~5 lines of post-conflict context catches this every time.

## Next Phase Readiness

- **Plan 27-05 (game-baldursgate3, 7 files) ready** — leaf-first sub-order per D-27-01: `cache.ts` → `util.ts` → `divineCore.ts` → `divineWrapper.ts` → `divineCore.test.ts` → `loadOrder.ts` → `index.tsx`. Heaviest extension by file count and by per-file conflict surface (`divineCore.ts` carries the 4-class divine error preservation gate). Independent of all other Phase 27 extensions — no cross-extension dependency.
- Conflict-marker tail count: **10 of 25 Phase 27 files remain** (40%). No additional remote refs touched (no push performed; D-27-00 push happens at phase end with `--force-with-lease`).
- For plan 27-05: same `pnpm --filter game-baldursgate3 typecheck` form (bare package name, no `@vortex/` prefix). BG3 4-class divine error preservation gate already running on every commit via grep-checkpoint — additional regression detection beyond per-file resolution.
- For plan 27-05: pre-check `grep -n 'import Promise from' extensions/games/game-baldursgate3/src/*` before resolving conflicts in any file that may bring `: Promise<T>` annotations in via merge driver. Plan 27-02 trap recap: bluebird-Promise shadows global Promise; `: Promise<T>` annotation on async functions in such files triggers TS1064.

## Self-Check: PASSED

- File exists: `extensions/collections/src/util/gameSupport/gamebryo.tsx` — FOUND
- File exists: `extensions/collections/src/eventHandlers.ts` — FOUND
- File exists: `extensions/collections/src/views/CollectionPageEdit/Instructions.tsx` — FOUND
- File exists: `extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx` — FOUND
- File exists: `extensions/collections/src/views/CollectionList/index.tsx` — FOUND
- File exists: `extensions/collections/src/index.ts` — FOUND
- Commit exists: `05fdbcf24` — FOUND on `v8.0/config-bucket`
- Commit exists: `a8287fcf0` — FOUND on `v8.0/config-bucket`
- Commit exists: `3a49f4360` — FOUND on `v8.0/config-bucket`
- Commit exists: `68d97dba9` — FOUND on `v8.0/config-bucket`
- Commit exists: `1290bcdf3` — FOUND on `v8.0/config-bucket`
- Commit exists: `d2ba9abbb` — FOUND on `v8.0/config-bucket`
- All six commits touch exactly one file each — VERIFIED
- All six commit titles match `resolve(collections): <file> — <stance>` — VERIFIED
- Per-extension typecheck exit 0 — VERIFIED
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after each commit — VERIFIED
- 6 commits visible via `git log v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE 'resolve\(collections\):'` — VERIFIED
- §1 platform guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved — VERIFIED via grep-checkpoint OK lines

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 04_
_Completed: 2026-05-21_
