---
phase: 27-gamebryo-per-game-extensions
plan: 02
subsystem: merge-conflict-resolution
tags:
    - linux-port
    - upstream-v2.0.0
    - plugin-management
    - phase-27
    - extension-conflict
requirements:
    satisfied:
        - SYNC-05
dependency_graph:
    requires:
        - .planning/phases/27-gamebryo-per-game-extensions/27-01-SUMMARY.md (savegame-mgmt resolved; harness gates carry forward)
        - extensions/gamebryo-plugin-management/src/esp/ESPFile.ts (async ESPFile.open factory — already clean; fork-side from Phase 03 native-addon work)
        - extensions/gamebryo-plugin-management/src/autosort.ts (§3 LOOT casing target — gated, untouched)
    provides:
        - Second Phase 27 extension fully resolved (6/25 conflict files done)
        - gamebryo-plugin-management per-extension typecheck exit 0
        - Confirmation that async ESPFile.open chain + bluebird-Promise import is the dominant fork-side divergence in this extension
    affects:
        - Plan 27-03 (modtype-bepinex — next in D-27-01 extension order)
        - Plan 27-04 (collections — depends indirectly on plugin-mgmt internals via shared types per CONTEXT D-27-01 "Integration Points")
        - Plan 27-08 (Phase 27 done-gate — 19/25 conflict files remaining after this plan lands)
tech_stack:
    added: []
    patterns:
        - "Fork-side default for async ESPFile.open + chained await on getInfo/setLightFlag — Phase 03 native-addon redesign of esptk bindings (no upstream sync ctor compatible)"
        - "Merge-driver duplication artefact pattern (Phase 26 LinkingDeployment.ts genUpdateModDeployment idiom): when upstream side replicates pre-conflict context inside the conflict region, HEAD is the only valid resolution"
        - "Bluebird-Promise import shadows global Promise<T> for async return-type annotations — TS1064 trap; omit annotation to let TS infer global Promise"
key_files:
    created:
        - .planning/phases/27-gamebryo-per-game-extensions/27-02-SUMMARY.md
    modified:
        - extensions/gamebryo-plugin-management/src/util/gameSupport.ts
        - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
        - extensions/gamebryo-plugin-management/src/views/PluginList.tsx
        - extensions/gamebryo-plugin-management/src/index.ts
decisions:
    - "Kept HEAD on every conflict region across all 4 files. Fork-side wins where it forced the async-ESPFile chain (regions 1, 3, 4, 8 in index.ts; region 1 in PluginList.tsx). Cosmetic single-line-vs-wrapped regions (everywhere else) followed surrounding inline style — oxfmt would re-collapse upstream's wrapped form anyway. One merge-driver duplication caught (index.ts region 9: onStateChange persistent-profiles handler body re-pasted in upstream side; HEAD is the only non-duplicate resolution)."
    - 'Initially took upstream''s `: Promise<void>` return-type annotation on swapUserlistForProfile (region 5 in index.ts) as ''strictly additive type info''. Triggered TS1064 because index.ts imports `Promise from "bluebird"` at line 6 — the bluebird Promise is not the global Promise<T> TypeScript requires for async-function return-type validation. Reverted to HEAD''s no-annotation form (Rule 1 fix; typecheck-driven). Future plans 27-03..27-07 should remember this trap whenever a file does `import Promise from "bluebird"`.'
    - "testBlueprintMasters region (index.ts region 7) and onStateChange region (region 9) both contained merge-driver duplications — upstream side replicated function bodies that already exist in pre-conflict context. Same shape as Phase 26 D-26-03 LinkingDeployment.ts artefact. Read both parents to confirm before resolving."
    - "oxfmt pre-commit hook reformatted adjacent multi-line signatures on every commit (collapsed to single-line per print-width=80). Behaviour preserved; commits still touch exactly one file each."
metrics:
    duration_minutes: 8
    completed: "2026-05-21"
    commit_count: 4
    task_count: 4
    file_count: 4
---

# Phase 27 Plan 02: gamebryo-plugin-management conflict resolution Summary

Resolved all four conflict files in `extensions/gamebryo-plugin-management/src/` leaf-first per D-27-01 — `util/gameSupport.ts` → `util/PluginPersistor.ts` → `views/PluginList.tsx` → `index.ts`. Fork-side wins on every region. Per-extension typecheck clean after the fourth commit. 11-gate grep-checkpoint stays green after each commit (§3 LOOT casing in autosort.ts and §10 native binaries both untouched and verified).

## What Got Resolved

**File 1 — `util/gameSupport.ts` (commit `a4a9fc0cf`):** Single conflict region around `supportsBlueprintPlugins` `memoizeOne` wrapper. HEAD wraps the arrow body inline (matches `supportsESL`, `supportsMediumMasters`); v2.0.0 wraps onto multiple lines. Functionally identical. Kept HEAD because every other `memoizeOne` in this file uses the inline form and oxfmt's print-width=80 leaves it under limit. No playbook items live in this file.

**File 2 — `util/PluginPersistor.ts` (commit `619845991`):** Single conflict region inside `serialize()` at the `.sort()` call in the sorted-plugin-list pipeline. Cosmetic single-line vs wrapped comparator. Kept HEAD because the surrounding `.filter().map()` chain uses the inline form. **§3 vigilance check passed**: no LOOT call sites (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync`) live in this file's conflict region — those are confined to `autosort.ts` which is gated, not in conflict. Verified zero `pluginName.toLowerCase` usage in `PluginPersistor.ts` (sanity check).

**File 3 — `views/PluginList.tsx` (commit `9ca7c1164`):** Three conflict regions.

- Region 1 (`updatePlugins` esp-parsing loop): HEAD uses `Promise.each(pluginNames, async (pluginName) => { try { ... await isMediumMaster(...) ... } catch { ... } })`. Upstream wraps each iteration in an inner `new Promise((resolve, reject) => { ... resolve(); })` callback with synchronous `isMediumMaster`. Post-conflict closing `})` on the next line aligns with HEAD's outer `Promise.each` opener. Upstream form would leave a stray inner Promise. Kept HEAD.
- Regions 2 + 3 (`enableSelected`, `disableSelected` guard conditions `if (plugin === undefined || plugin.isNative || combined?.isBlueprint)`): cosmetic single-line vs three-line wrapping. Kept HEAD inline form.

**File 4 — `index.ts` (commit `394d12242`):** Ten conflict regions across the extension's main barrel + `init()` function.

- **Regions 1, 3, 4, 8** (async ESPFile parsing chain): Fork made the ESP parser async (Phase 03 native-addon work — libloot/esptk dlopen now goes through `ESPFile.open(filePath, gameId)` factory). HEAD uses `await ESPFile.open(...)` + `await esp.setLightFlag(...)` + `await pluginInfoCache.getInfo(...)`. Upstream's synchronous `new ESPFile(...)` form would not compile against fork-side esptk bindings. Same chain forces `isBlueprintPlugin` registerAPI signature (region 3) async. Kept HEAD on all four.
- **Region 2** (`registerAPI` comment block): HEAD says "without depending on the ESP parser directly"; upstream says "without having to take a native-addon dependency on esptk themselves". HEAD's wording is accurate for fork-side architecture where `pluginInfoCache` abstracts the parser; upstream wording references esptk by name which is fork-internal detail. Kept HEAD.
- **Region 5** (`swapUserlistForProfile` signature): both sides functionally equivalent. **Self-inflicted typecheck regression here.** Initially took upstream's `: Promise<void>` return-type annotation as "strictly additive type info, no behavior change". `pnpm --filter gamebryo-plugin-management typecheck` then failed with `error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?`. Root cause: `index.ts` imports `Promise from "bluebird"` at line 6 — the bluebird `Promise` shadows global `Promise` for the entire file, so `Promise<void>` is read as `bluebird.Promise<void>`, which is not the global `Promise<T>` required for async-function inference. **Rule 1 fix**: reverted to HEAD's no-annotation form (`function swapUserlistForProfile(...): Promise<void> {` → `function swapUserlistForProfile(...) {`). TypeScript then correctly infers the global `Promise<void>` from the `async` keyword. Documented in Decisions for plans 27-03..27-07 reuse.
- **Region 6** (`PluginInfoCache.fetchInfo` isBlueprint expression): cosmetic. Kept HEAD inline form.
- **Region 7** (`testBlueprintMasters` function — largest conflict, 1459–1587): HEAD declares `async function testBlueprintMasters(` and stops. Upstream side carries an entire **synchronous** duplicate of the function body (using sync `infoCache.getInfo(...)` calls without await) PLUS a trailing `function testRulesUnfulfilled(` opener. Post-conflict body at line 1588 onwards uses `await infoCache.getInfo(...)` — which only compiles if the enclosing function is async. So HEAD is the only valid resolution; upstream's body is dead-code merge-driver paste. Same artefact shape as Phase 26 LinkingDeployment.ts genUpdateModDeployment (D-26-03).
- **Region 9** (`onStateChange(["persistent", "profiles"], ...)` handler at lines 2190–2330): pre-conflict context (lines 2156–2188) already opens the handler and runs through `copyIgnoringMissing` setup. HEAD branch (2191–2237) just provides the `if (currFeature/!prevFeature)` blocks, closes the handler (`})` at 2213), then registers `set-plugin-list` and `profile-will-change` handlers inline. Upstream branch (2239–2330) re-opens the entire `onStateChange(["persistent", "profiles"], ...)` handler from scratch — duplicating lines 2156–2188 verbatim in multi-line form before the same `if/else` blocks. Classic merge-driver duplication. HEAD is the only non-duplicate resolution.
- **Region 10** (`showErrorNotification("Failed to change profile", err)` call): cosmetic. Kept HEAD inline form.

## Verification

After Task 1 commit (`a4a9fc0cf`):

```
$ grep -c '^<<<<<<< ' extensions/gamebryo-plugin-management/src/util/gameSupport.ts
0
$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
... (all 11 gates OK) ...
CHECKPOINT PASSED — 11 gate(s) clean
```

After Task 2 commit (`619845991`):

```
$ grep -c '^<<<<<<< ' extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
0
$ grep -E 'pluginName\.toLowerCase' extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
(empty — no LOOT-arg lowercasing introduced)
$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
CHECKPOINT PASSED — 11 gate(s) clean
```

After Task 3 commit (`9ca7c1164`):

```
$ grep -c '^<<<<<<< ' extensions/gamebryo-plugin-management/src/views/PluginList.tsx
0
$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
CHECKPOINT PASSED — 11 gate(s) clean
```

After Task 4 commit (`394d12242`):

```
$ git grep -l '^<<<<<<< ' extensions/gamebryo-plugin-management/
(empty — entire extension clean)

$ pnpm --filter gamebryo-plugin-management typecheck
> gamebryo-plugin-management@0.5.3 typecheck
> pnpm tsc
exit=0

$ bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check
CHECKPOINT PASSED — 11 gate(s) clean

$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE '^[0-9a-f]+ resolve\(plugin-mgmt\):'
4

$ git grep -cE 'path\.basename\(pluginList\[' extensions/gamebryo-plugin-management/src/autosort.ts
3
```

§3 gate target threshold (≥3 distinct `path.basename(pluginList[…])` expressions per Phase 27 plan 27-00 sub-note): **3 — clean, autosort.ts untouched.** §10 native binaries on disk: **all four present** per checkpoint OK line.

All acceptance criteria from the plan met:

- Four atomic commits matching `resolve(plugin-mgmt): <file> — <stance>` ✓
- Each commit touches exactly one file ✓
- All four files conflict-marker free ✓
- Entire extension conflict-marker free (`git grep -l '^<<<<<<< ' extensions/gamebryo-plugin-management/` empty) ✓
- `pnpm --filter gamebryo-plugin-management typecheck` exits 0 ✓
- `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh --skip-conflict-check` exits 0 after each commit ✓
- §3 gate (autosort.ts untouched, basename count ≥3) preserved ✓

## Commits

| Commit      | Title                                                                                                                 | Files                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `a4a9fc0cf` | `resolve(plugin-mgmt): util/gameSupport.ts — keep HEAD inline arrow form`                                             | `extensions/gamebryo-plugin-management/src/util/gameSupport.ts`     |
| `619845991` | `resolve(plugin-mgmt): util/PluginPersistor.ts — keep HEAD inline arrow form`                                         | `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` |
| `9ca7c1164` | `resolve(plugin-mgmt): views/PluginList.tsx — keep HEAD (async/await + inline conditionals)`                          | `extensions/gamebryo-plugin-management/src/views/PluginList.tsx`    |
| `394d12242` | `resolve(plugin-mgmt): index.ts — keep HEAD (async ESPFile.open chain + drop merge-driver onStateChange duplication)` | `extensions/gamebryo-plugin-management/src/index.ts`                |

Phase 27 progress after this plan: **6 / 25 conflict files resolved (24%)**. Next plan (27-03) tackles `modtype-bepinex` (3 files).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `swapUserlistForProfile` `: Promise<void>` annotation triggered TS1064 against bluebird-Promise import**

- **Found during:** Task 4 verification (per-extension typecheck after committing index.ts)
- **Issue:** Initially resolved index.ts region 5 (`swapUserlistForProfile` signature) by taking upstream's `: Promise<void>` return-type annotation as "strictly additive type info, no playbook touch". `pnpm --filter gamebryo-plugin-management typecheck` then failed: `src/index.ts(798,4): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?`. Root cause: index.ts has `import Promise from "bluebird"` at line 6 — bluebird-Promise shadows global Promise for the whole file, so `Promise<void>` resolves to `bluebird.Promise<void>` which is not the global `Promise<T>` TypeScript requires for async-function return-type validation.
- **Fix:** Reverted to HEAD's no-annotation form (dropped `: Promise<void>`). TypeScript then correctly infers the global `Promise<void>` from the `async` keyword. Single edit in the staged index.ts before committing — no commit amend needed.
- **Why not Rule 4:** Pure typing fix; no architectural change. Resolution stance shift within the same conflict region, recorded as a decision for plan-27-03+ reuse.
- **Files modified:** `extensions/gamebryo-plugin-management/src/index.ts` (typing fix in same staged change as the conflict resolution)
- **Commit:** `394d12242` (folded into the index.ts resolution commit)

### Other observations

**2. [Note, not a Rule trigger] oxfmt pre-commit hook reformatted adjacent code on every commit**

- Same behaviour as plan 27-01: lint-staged ran `pnpm oxfmt --no-error-on-unmatched-pattern` on each staged file. Each commit still touches exactly one file. Behaviour preserved; all 11 grep-checkpoint gates remain green.
- Most visible reformat: index.ts had ~280 lines collapsed (multi-line signatures and chains rewritten to single-line per print-width=80). The conflict resolution itself was independent of the formatting pass.

---

**Total deviations:** 1 Rule 1 fix + 1 informational note (oxfmt formatting)
**Impact on plan:** Zero scope creep. The bluebird-Promise/async-return-type trap is documented for plans 27-03..27-07 reuse.

## Issues Encountered

One self-inflicted typecheck regression (deviation 1 above), caught by the per-extension typecheck gate before commit. No structural issues in the conflict regions themselves — the testBlueprintMasters and onStateChange duplications were both unambiguous merge-driver artefacts where HEAD was the only valid resolution.

## Next Phase Readiness

- **Plan 27-03 (modtype-bepinex, 3 files) ready** — leaf-first sub-order: `bepInExDownloader.ts` → `common.ts` → `index.ts`. No playbook items intersect this extension directly (Linux Wine/BepInEx loader is out of Phase 1 Linux-port scope per CONTEXT). Standard fork-side defaults apply.
- Conflict-marker tail count: 19 of 25 Phase 27 files remain. No additional remote refs touched (no push performed; D-27-00 push happens at phase end with `--force-with-lease`).
- For plans 27-03..27-07: when resolving any file that does `import Promise from "bluebird"`, do NOT add `: Promise<T>` return-type annotations to async functions — TypeScript reads them as bluebird-Promise. Either omit the annotation (let TS infer global Promise from async) or use a separate type alias.

## Self-Check: PASSED

- File exists: `extensions/gamebryo-plugin-management/src/util/gameSupport.ts` — FOUND
- File exists: `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` — FOUND
- File exists: `extensions/gamebryo-plugin-management/src/views/PluginList.tsx` — FOUND
- File exists: `extensions/gamebryo-plugin-management/src/index.ts` — FOUND
- Commit exists: `a4a9fc0cf` — FOUND on `v8.0/config-bucket`
- Commit exists: `619845991` — FOUND on `v8.0/config-bucket`
- Commit exists: `9ca7c1164` — FOUND on `v8.0/config-bucket`
- Commit exists: `394d12242` — FOUND on `v8.0/config-bucket`
- All four commits touch exactly one file each — VERIFIED via `git diff-tree --no-commit-id --name-only -r <hash>`
- All four commit titles match `resolve(plugin-mgmt): <file> — <stance>` — VERIFIED
- Per-extension typecheck exit 0 — VERIFIED
- 11-gate grep-checkpoint passes with `--skip-conflict-check` after each commit — VERIFIED
- 4 commits visible via `git log v8.0/config-bucket --not fork/sync/upstream-v2.0.0 | grep -cE 'resolve\(plugin-mgmt\):'` — VERIFIED
- §3 gate target untouched: `autosort.ts` retains 3 `path.basename(pluginList[…])` expressions feeding 4 LOOT call sites — VERIFIED

---

_Phase: 27-gamebryo-per-game-extensions_
_Plan: 02_
_Completed: 2026-05-21_
