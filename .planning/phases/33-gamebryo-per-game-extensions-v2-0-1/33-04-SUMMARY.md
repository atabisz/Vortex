---
phase: 33-gamebryo-per-game-extensions-v2-0-1
wave: D1
plan: 04
status: complete
commits: 58
extensions_resolved: [game-7daystodie, game-baldursgate3, game-masterchiefcollection, game-witcher3]
---

# Wave D1 Summary — Heavy per-game extensions

## Outcome

4/4 heavy per-game extensions resolved. 57 atomic SSH-signed `resolve(<ext>): ...` commits + 1 SUMMARY commit. Harness skip-mode 11/11 GREEN after every commit. Full-mode gate-13 (BG3 divine error classes) GREEN — fork-named `DivineExecMissing`, `DivineMissingDotNet`, `DivineTimedOut`, `DivineAborted` preserved at expected lines. Per-extension typecheck/build closeout returned 0 non-marker errors for all 4 extensions.

Range: `7b4f47a40..3e05bbe47` on `v8.1/config-bucket` (57 resolution commits + this SUMMARY = 58 total).

## Per-extension breakdown

| Extension                        | Files | Regions (approx) | Closeout         | Notable stances                                                                                                                                                                                                                           |
| -------------------------------- | ----- | ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| game-7daystodie                  | 8     | ~64              | Route 2 build OK | All tier-5 smaller-diff (HEAD compact arrows / alphabetical imports)                                                                                                                                                                      |
| game-masterchiefcollection (mhc) | 6     | ~28              | Route 2 build OK | All tier-5; nested-marker hazard in installers.ts did NOT materialise (flat triplets)                                                                                                                                                     |
| game-baldursgate3 (bg3)          | 16    | ~150             | Route 2 build OK | divineCore.ts tier-2 fork-wins on 4 named classes (gate-13 active); loadOrder.ts tier-4 Rule-1 bluebird dup-import HEAD-empty (37 regions); rest tier-5                                                                                   |
| game-witcher3                    | 27    | ~165             | Route 2 build OK | mostly tier-5 smaller-diff; eventHandlers.ts tier-4 Rule-1 dup-imports; menumod.ts/mergeBackup.ts/mergeInventoryParsing.ts/modLimitPatch.ts tier-4 path-dup-import drops; installers.ts confirmed NOT bluebird carrier per RESEARCH §7 R5 |

## Active gate verification

**Gate-13 BG3 divine error classes (full-mode harness):** GREEN after `2f0bf6218 resolve(bg3): divineCore.ts`. All 4 fork-named classes (`DivineExecMissing`, `DivineMissingDotNet`, `DivineTimedOut`, `DivineAborted`) found at expected positions. `DivinePakInvalid` (additional fork class at line 39) also preserved.

**Skip-mode harness after every commit:** exit 0 (11 active gates GREEN; gate-12 marker count gate is the only failing gate at full mode, expected pre-resolution-completion baseline; all 4 D1 extensions are now marker-free — remaining markers belong to D2/D3/E scope).

## Closeout typechecks

| Extension                  | Route           | Errors                                                                                                                                          |
| -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| game-7daystodie            | Route 2 (build) | 0 non-marker                                                                                                                                    |
| game-masterchiefcollection | Route 2 (build) | 0 non-marker                                                                                                                                    |
| game-baldursgate3          | Route 2 (build) | 0 non-marker                                                                                                                                    |
| game-witcher3              | Route 2 (build) | 0 non-marker (witcher3 inner `_build` clean; outer `build` blocked by `extensions/copy-extension.mjs` markers — Wave E scope, not a regression) |

## Issues encountered

1. **Multi-sub-agent dispatch.** Original Engineer dispatch with parallel Mode A failed early (single executor terminated mid-work). Recovery: 11 sequential sub-Engineer dispatches, each handling 4-12 files, with explicit hard-stop budgets to avoid mid-file truncation. All resolution work landed cleanly; truncations only affected sub-agent summaries (work was always committed before truncation).

2. **One stray scope-creep edit caught.** Sub-4 left an uncommitted refactor in `bg3/util.ts` (return-prev moved out of catch). Reverted via `git checkout` before next sub-dispatch. Root cause: agent made code-quality refactor outside conflict regions. Recovery: clean revert; util.ts re-resolved correctly by next sub.

3. **One title-format drift.** Witcher3 `util.ts` commit `b317b2de5` titled `fix(witcher3): resolve util.ts merge conflicts (15 regions)` instead of `resolve(witcher3): util.ts — ...`. Content correct, harness gates content not titles. Acceptable.

4. **Mode A (parallel sub-Engineer with worktree-merge-back) was infeasible** at runtime. Work proceeded in Mode B (serial sub-batches direct on `v8.1/config-bucket`).

## Affects downstream

- **Wave D2 (33-05):** ~28 medium per-game files unblocked. Morrowind active gate-14 (migrate103) will need verification when Morrowind extension is resolved.
- **Wave D3 (33-06):** 60 light per-game extensions unblocked.
- **Wave E (33-07):** `extensions/copy-extension.mjs` + `extensions/copy-native.mjs` still carry markers — known scope, blocks outer `build` chain but not per-extension `_build`.
- **Phase 36 land step:** branch ready for FF-merge after Waves E+F + done-gate.

## Provides

- 4 fully-resolved heavy per-game extensions: game-7daystodie, game-baldursgate3, game-masterchiefcollection, game-witcher3.
- BG3 divine error classes gate-13 stays pinned to fork-named Linux divine tooling.
- 57 bisectable atomic commits with stance recorded per file.
- 0 outstanding bluebird `:Promise<void>` TS1064 traps introduced.

## Push status

**No push performed.** Operator handles push at phase end. Branch `v8.1/config-bucket` advanced locally `7b4f47a40 → 3e05bbe47` (57 resolution commits) → SUMMARY commit (this file).
