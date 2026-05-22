---
phase: 27-gamebryo-per-game-extensions
plan: 03
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - modtype-bepinex
    - phase-27
    - extension-conflict
requirements:
    satisfied:
        - SYNC-06
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-02-SUMMARY.md (plugin-mgmt resolved; harness gates carry forward)
        - extensions/modtype-bepinex/src/types.ts (IBepInExGameConfig + INexusDownloadInfo* types — already clean)
        - extensions/modtype-bepinex/src/githubDownloader.ts (already clean — no conflicts)
    provides:
        - Third Phase 27 extension fully resolved (9/25 conflict files done)
        - modtype-bepinex per-extension typecheck exit 0
        - Confirmation that bepinex divergence is overwhelmingly cosmetic (single-line vs wrapped) plus one merge-driver duplicate-import artefact
    affects:
        - Plan 27-04 (collections — next in D-27-01 extension order)
        - Plan 27-08 (Phase 27 done-gate — 16/25 conflict files remaining after this plan lands)
tech_stack:
    added: []
    patterns:
        - "Cosmetic single-line vs wrapped resolution stance (carried from plan 27-01/27-02): keep HEAD inline form — oxfmt's print-width=80 leaves these regions under limit and would re-collapse upstream's wrapped form on next format pass"
        - 'Merge-driver duplicate-import artefact (Phase 26 LinkingDeployment.ts idiom + plan 27-02 testBlueprintMasters/onStateChange idiom): upstream side adds a duplicate `import { IBepInExGameConfig, INexusDownloadInfo } from "./types"` block inside the conflict region while the post-conflict context already imports the same names — HEAD is the only non-duplicate resolution'
        - "modtype-bepinex platform-conditional download URL (`platform = process.platform === 'win32' ? 'win_' : 'linux_'`) lives in common.ts:54-58, not in any conflict region — fork-side Linux fetch path was already merged pre-conflict and survived untouched"
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-03-SUMMARY.md
    modified:
        - extensions/modtype-bepinex/src/bepInExDownloader.ts
        - extensions/modtype-bepinex/src/common.ts
        - extensions/modtype-bepinex/src/index.ts
decisions:
    - "Kept HEAD on every conflict region across all 3 files. All 17 conflict regions (11 in bepInExDownloader.ts, 3 in common.ts, 3 in index.ts) were cosmetic single-line vs wrapped formatting differences with one exception: bepInExDownloader.ts region 1 had a merge-driver duplicate-import artefact where v2.0.0 side re-imported `IBepInExGameConfig, INexusDownloadInfo` from `./types` despite the post-conflict body line 57 already containing the same import. HEAD form (single-line `./common` import, single-line `./types` import below) is the only non-duplicate resolution."
    - "modtype-bepinex is NOT named in any §-numbered playbook gate. Confirmed via VORTEX-LINUX-MERGE-PLAYBOOK.md scan and the 11-gate grep-checkpoint output (all gates green throughout — no bepinex-specific gate). The Linux platform-conditional in common.ts:54-58 (`platform = process.platform === 'win32' ? 'win_' : 'linux_'`) lives outside any conflict region and survived the merge untouched."
    - 'No bluebird-Promise trap in this extension (carried-forward concern from plan 27-02). Verified: only `index.ts` imports anything Promise-shaped, and it imports `from "vortex-api"` only — no `import Promise from "bluebird"` line. Did not add or touch any `: Promise<T>` return-type annotations.'
    - "oxfmt pre-commit hook ran on each commit but produced zero behavioural changes (file already conformed after the manual conflict resolutions). Each commit still touches exactly one file."
metrics:
    duration_minutes: 5
    completed: "2026-05-21"
    commit_count: 3
    task_count: 3
    file_count: 3
---

# Phase 27 Plan 03: modtype-bepinex conflict resolution Summary

Resolved all three conflict files in `extensions/modtype-bepinex/src/` leaf-first per D-27-01 — `bepInExDownloader.ts` → `common.ts` → `index.ts`. Fork-side wins on every region (one merge-driver duplicate-import dropped along the way). Per-extension typecheck clean after the third commit. 11-gate grep-checkpoint stays green after each commit. Phase 27 progress: 9/25 conflict files resolved (36%).

## What Got Resolved

**File 1 — `bepInExDownloader.ts` (commit `df2d3aab8`):** Eleven conflict regions.

- Region 1 (top-of-file imports): merge-driver duplicate-import artefact. HEAD has `import { getDownload, getSupportMap, MODTYPE_BIX_INJECTOR } from "./common";` on a single line. v2.0.0 side wraps that same import across 5 lines AND re-imports `import { IBepInExGameConfig, INexusDownloadInfo } from "./types";` — but line 57 (post-conflict) already imports the same names from `./types`. Taking the v2.0.0 side would have produced a duplicate-import compile error. HEAD is the only valid resolution.
- Regions 2-11 (function signatures, expressions, conditionals): all cosmetic single-line vs wrapped. Examples: `updateSupportedGames(api, downloadId)` single-line vs three-line; `Set<string>(download.game.concat(...))` chain inline vs wrapped; `api.events.emit("start-download", [...], ...)` 7-arg call inline vs one-arg-per-line; `extractSemver(...) === target` arrow body inline vs wrapped; `gameConf.bepinexVersion != null && gameConf.bepinexVersion !== defaultDownload.version` boolean chain inline vs `&&`-prefixed continuation lines; `state.persistent.mods[gameId] ?? {}` and `Object.keys(mods).filter(...)` inline vs wrapped; final `if (... && ... && ... && !hasPinnedVersionInstalled(...))` 4-clause guard wrapped one-clause-per-line in both forms but HEAD uses leading `&&` style with newline-after-`(`. Kept HEAD on every region — print-width=80 keeps all of these under limit, oxfmt would re-collapse the wrapped form.

**File 2 — `common.ts` (commit `57ad32907`):** Three conflict regions, all cosmetic.

- Region 1 (`addGameSupport` IL2CPP version guard): `isIL2CPP && gameConf.bepinexVersion != null && semver.lt(gameConf.bepinexVersion, "6.0.0")` inline vs leading-`&&` wrapped form.
- Region 2 (`gameConf.bepinexCoercedVersion = util.semverCoerce(gameConf.bepinexVersion).version`): inline assignment vs split across two lines.
- Region 3 (`getDownload` arrow signature + condition): `(gameConf: IBepInExGameConfig): INexusDownloadInfoExt =>` inline vs wrapped, plus `gameConf.bepinexVersion != null && Object.keys(AVAILABLE).includes(versionKey)` inline vs leading-`&&` continuation. Kept HEAD on all three.

**§1 vigilance (carried from plan 27-01/27-02):** common.ts contains the platform-conditional download URL builder at lines 54-58 (`process.platform === "win32" ? "win_" : "linux_"`). This Linux path is critical for Phase 1 (BepInEx itself runs cross-platform via Mono — Linux Vortex must be able to fetch and unpack it). It is NOT inside any conflict region — pre-conflict context preserved fork-side platform branch verbatim. Verified by grep after commit: `grep -n 'linux_' extensions/modtype-bepinex/src/common.ts` still shows line 57.

**File 3 — `index.ts` (commit `3959a8854`):** Three conflict regions, all cosmetic.

- Region 1 (top-of-file `IBepInExGameConfig, INexusDownloadInfo` import): single-line vs three-line wrapped form.
- Region 2 (`gamemode-activated` handler `.catch` showErrorNotification call): `("Failed to download/install BepInEx", err)` inline vs three-arg wrapped.
- Region 3 (`will-deploy` handler `.catch` showErrorNotification call): identical idiom to region 2. Kept HEAD inline form on both — symmetry with the rest of the file's call style.

**Bluebird-Promise trap check:** index.ts does NOT do `import Promise from "bluebird"` (line 4 imports only from `vortex-api`). The plan-27-02 deviation about `: Promise<void>` annotations does not apply here. Did not add or touch any return-type annotations.

## Verification

After Task 1 commit (`df2d3aab8`):

```
$ grep -c '^<<<<<<< ' extensions/modtype-bepinex/src/bepInExDownloader.ts
0
$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... (all 11 gates OK) ...
CHECKPOINT PASSED — 11 gate(s) clean
```

After Task 2 commit (`57ad32907`):

```
$ grep -c '^<<<<<<< ' extensions/modtype-bepinex/src/common.ts
0
$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
CHECKPOINT PASSED — 11 gate(s) clean
```

After Task 3 commit (`3959a8854`):

```
$ git grep -l '^<<<<<<< ' extensions/modtype-bepinex/
(empty — entire extension clean)

$ pnpm --filter modtype-bepinex typecheck
> modtype-bepinex@0.2.9 typecheck
> pnpm tsc
exit=0

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
CHECKPOINT PASSED — 11 gate(s) clean

$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE '^[0-9a-f]+ resolve\(bepinex\):'
3
```

All acceptance criteria from the plan met:

- Three atomic commits matching `resolve(bepinex): <file> — <stance>` ✓
- Each commit touches exactly one file ✓
- All three files conflict-marker free ✓
- Entire extension conflict-marker free (`git grep -l '^<<<<<<< ' extensions/modtype-bepinex/` empty) ✓
- `pnpm --filter modtype-bepinex typecheck` exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 after each commit ✓
- §1/§3/§10 + BG3 + Morrowind preservation gates all stayed green throughout ✓

## Commits

| Commit      | Title                                                                                                         | Files                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `df2d3aab8` | `resolve(bepinex): bepInExDownloader.ts — keep HEAD (drop merge-driver duplicate types import + inline form)` | `extensions/modtype-bepinex/src/bepInExDownloader.ts` |
| `57ad32907` | `resolve(bepinex): common.ts — keep HEAD inline form`                                                         | `extensions/modtype-bepinex/src/common.ts`            |
| `3959a8854` | `resolve(bepinex): index.ts — keep HEAD inline form`                                                          | `extensions/modtype-bepinex/src/index.ts`             |

Phase 27 progress after this plan: **9 / 25 conflict files resolved (36%)**. Next plan (27-04) tackles `collections` (6 files).

## Deviations from Plan

None — plan executed exactly as written.

The plan's "watch for OS-conditional download URLs or unzip paths" guidance was relevant: common.ts:54-58 carries the `process.platform === "win32" ? "win_" : "linux_"` branch that gates Linux BepInEx fetch. Verified outside any conflict region — no resolution call needed. Recorded as preservation observation, not a deviation.

## Issues Encountered

One minor: initial `pnpm typecheck -F modtype-bepinex` (per CONTEXT D-27-04 example syntax) recursed into the full workspace dependency graph and queued unrelated downstream typechecks. Switched to `pnpm --filter modtype-bepinex typecheck` (the form used in plan 27-02) which scopes correctly to the single workspace and exits 0. Not a deviation — just a filter-syntax note for plans 27-04..27-07.

## Next Phase Readiness

- **Plan 27-04 (collections, 6 files) ready** — leaf-first sub-order: `util/gameSupport/gamebryo.tsx` → `eventHandlers.ts` → `views/CollectionPageEdit/Instructions.tsx` → `views/InstallDialog/InstallStartDialog.tsx` → `views/CollectionList/index.tsx` → `index.ts`. CONTEXT D-27-01 notes collections imports from gamebryo-plugin-management indirectly via shared types — that extension settled in plan 27-02, so types are stable.
- Conflict-marker tail count: 16 of 25 Phase 27 files remain. No additional remote refs touched (no push performed; D-27-00 push happens at phase end with `--force-with-lease`).
- For plans 27-04..27-07: prefer `pnpm --filter <pkg-name> typecheck` over `pnpm typecheck -F <pkg-name>` to avoid full-workspace recursion. Confirm `<pkg-name>` against each `package.json` `name` field (e.g., `vortex-collections`, `gamebryo-savegame-management`, `game-baldursgate3`, etc. — bare names per the modtype-bepinex example, no `@vortex/` prefix in these workspaces).

## Self-Check: PASSED

- File exists: `extensions/modtype-bepinex/src/bepInExDownloader.ts` — FOUND
- File exists: `extensions/modtype-bepinex/src/common.ts` — FOUND
- File exists: `extensions/modtype-bepinex/src/index.ts` — FOUND
- Commit exists: `df2d3aab8` — FOUND on `v8.0/config-bucket`
- Commit exists: `57ad32907` — FOUND on `v8.0/config-bucket`
- Commit exists: `3959a8854` — FOUND on `v8.0/config-bucket`
- All three commits touch exactly one file each — VERIFIED via `git diff-tree --no-commit-id --name-only -r <hash>`
- All three commit titles match `resolve(bepinex): <file> — <stance>` — VERIFIED
- Per-extension typecheck exit 0 — VERIFIED
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after each commit — VERIFIED
- 3 commits visible via `git log v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE 'resolve\(bepinex\):'` — VERIFIED
- §1 platform guards / §3 LOOT casing / §10 native binaries / BG3 4-class divine / Morrowind migrate103 all preserved — VERIFIED via grep-checkpoint OK lines

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 03_
_Completed: 2026-05-21_
