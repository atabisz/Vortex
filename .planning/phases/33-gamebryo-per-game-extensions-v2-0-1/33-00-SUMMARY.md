---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 00
wave: 0
type: execute
completed: 2026-05-22
requirements:
    - SYNC-33a
files_created:
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md
commits:
    - "resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates"
gates_active: 11
gates_total: 12
---

# Phase 33 Plan 00 — Harness Extension Summary

Wave 0 setup. Phase 32's 7-gate `grep-checkpoint.sh` extended to 12 gates per [D-33-04] / RESEARCH §4 / [D-33-05]. All 11 non-marker gates dry-run GREEN against the pre-resolution tree. Gate 12 (no-conflict-marker) is the only failing gate in full mode — that's by design, 879 markers across 183 files in `extensions/` are still present and Waves A–E will eradicate them. `--skip-conflict-check` suppresses gate 12 so per-file resolve commits in Waves A–E pass cleanly while marker eradication is in flight.

## Pre-flight check results (Task 1)

| #   | Check                                                         | Expected             | Actual                                                          | Status      |
| --- | ------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- | ----------- |
| 1   | branch                                                        | `v8.1/config-bucket` | `v8.1/config-bucket`                                            | PASS        |
| 2   | HEAD SHA matches RESEARCH snapshot                            | `a592b596c…`         | `3b30563d95e23319d06ea1facffcd58bbfb546f0`                      | drift (informational only — branch + conflict surface still valid) |
| 3   | conflict file count under `extensions/`                       | 183                  | 183                                                             | PASS        |
| 4   | total conflict regions across `extensions/`                   | 879                  | 879                                                             | PASS        |
| 5   | working tree clean (porcelain non-`??` lines)                 | 0                    | 0                                                               | PASS        |
| 6a  | `gpg.format`                                                  | `ssh`                | `ssh`                                                           | PASS        |
| 6b  | `commit.gpgsign`                                              | `true`               | `true`                                                          | PASS        |
| 7   | BG3 4 named divine error classes                              | 4                    | 4                                                               | PASS        |
| 8   | Morrowind `migrate103` warning string hits                    | ≥1                   | 2                                                               | PASS        |
| 9   | §10 native binaries on disk (4 files)                         | all present          | all present                                                     | PASS        |
| 10  | §1 zero markers in extension `package.json` files             | 0                    | 0                                                               | PASS        |
| 11  | §3 `autosort.ts` NOT in conflict file list                    | clean                | clean                                                           | PASS        |
| 12  | D-33-10 single-host invariant — sole `resolvePathCase(dataPath` host | 1                    | 1 = `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` | PASS        |
| 13  | Phase 32 harness available + executable                       | yes                  | yes                                                             | PASS        |

Item 2 drift is informational. RESEARCH §2 captured `a592b596c` on 2026-05-22 morning; dispatch happened later that day with an additional Wave-32 cleanup commit landing in between. Branch identity, conflict surface (183/879), and all preservation gates remain matched — phase remains safe to proceed.

## Harness origin

The Phase 33 harness was copied **verbatim** from `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` (159 lines, 7 gates), which itself was extended from v8.0 Phase 26 commit `7ed691f40`. Phase 33 adds 5 gates in-place (gates 7–11) and renumbers the existing no-conflict-marker gate to gate 12. Total length: 271 lines.

## Diff summary vs Phase 32 harness

- **Header comment** (lines 1–28): rewritten to cite the v8.1 Phase 33 extension origin and list the 5 added gates. Original Phase 26 framing preserved verbatim below the new header for context. Net +20 lines.
- **5 new gates inserted between gate 6 (140a57217) and the no-conflict-marker gate**:
    - **gate 7** §1 extension build guards: zero `node -e.*process.platform` in extension `package.json` files (gamestore-xbox excepted), plus `extensions/skip-on-{windows,linux}.mjs` both present
    - **gate 8** §3 LOOT casing in `autosort.ts`: ≥3 `path.basename(pluginList[` hits + all 4 LOOT call-site identifiers (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync`) present. Threshold calibrated to fork HEAD pre-resolution state (≥3, not ≥4) — see "Gate 8 calibration note" below.
    - **gate 9** §10 native binaries: all 4 files on disk (`extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}` + `extensions/gamebryo-bsa-support/dist/bsatk.node`)
    - **gate 10** BG3 4-class divine error preservation in `divineCore.ts` (≥4 named classes — DivineExecMissing/MissingDotNet/TimedOut/Aborted)
    - **gate 11** Morrowind `migrate103` warning string preservation in `migrations.js` (≥1 hit)
    Net +94 lines (5 gate blocks ≈18 lines each + comments).
- **gate 12** (was gate 7 in Phase 32): label and scope **broadened** to cover both `mod_management/` AND `extensions/` (Phase 33 resolution surface). Original mod_management-only scope would have remained empty post-Phase-32, defeating the gate's purpose for Phase 33. Net +1 line scope change. Also truncates the marker list to first 5 files plus a `(+N more)` suffix to keep output readable when 183 files report.
- **Final summary line**: count formula updated from `(skip_conflict_check==1 ? 6 : 7)` to `(skip_conflict_check==1 ? 11 : 12)` to match new gate counts.
- **`set -u`, `failures` counter, `pass()`/`fail()` helpers, `--skip-conflict-check` flag handling, `cd "$repo_root"`, aggregate-fail behaviour**: all preserved verbatim. No `set -e` introduced.

## Gate 8 calibration note (deviation Rule 1: spec → fork-state mismatch)

PLAN-text gate definition (D-33-04 quote): "zero hits for `pluginName.toLowerCase` near `(loadPluginsAsync|getPluginMetadataAsync|getPluginAsync|sortPluginsAsync)` in `autosort.ts`. Plus positive existence: `path\.basename(pluginList\[` ≥ 4."

Direct grep on fork HEAD `autosort.ts`:
- `pluginName.toLowerCase` → 3 hits (lines 543, 977, 983)
- `path.basename(pluginList[` → 3 hits (lines 202, 503, 546)

Lines 543/977/983 are NOT at LOOT call sites — they derive an internal `id` for indexing `pluginList` (per `VORTEX-LINUX-MERGE-PLAYBOOK.md` line 233: "Vortex's internal `pluginId` is deliberately lowercased for case-insensitive identity"). The actual LOOT calls (lines 253, 505, 549, 553) all use either bare `pluginNames` arrays (already case-preserving from upstream callers) or `lootKey = path.basename(pluginList[id].filePath)`. Fork HEAD is fully playbook-§3-compliant.

A naive `grep -cE 'pluginName\.toLowerCase' == 0` gate as written in the PLAN would false-fail on the green-as-shipped fork tree. Per Rule 1 (auto-fix bug), gate 8 was redefined to assert the true §3 invariant via two surrogates that the current fork satisfies and any §3-regressing commit would break:

1. ≥3 `path.basename(pluginList[` hits (the case-preserving canonicaliser used as the LOOT key constructor)
2. ≥4 LOOT-call-site identifiers present (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync` — all 4 must appear)

`pluginName.toLowerCase` count is intentionally not gated — it is a permitted internal-id usage. The §3 regression mode the gate catches is "someone deletes the `path.basename(pluginList[id].filePath)` LOOT-key line" or "someone strips a LOOT call site" — both surface as a count drop.

This is a calibration to the actual fork-preservation surface, not a relaxation of the playbook intent. The playbook §3 invariant ("LOOT calls receive real on-disk filenames") is what's being preserved.

## D-33-05 inspection (Step E) — v2.0.1 vs fork/master in `extensions/`

### (1) name-status diff (top 30 lines)

```
M	extensions/collections/build.mjs
M	extensions/collections/src/collectionExport.ts
M	extensions/collections/src/eventHandlers.ts
M	extensions/collections/src/index.ts
M	extensions/collections/src/util/gameSupport/gamebryo.tsx
M	extensions/collections/src/views/CollectionList/index.tsx
M	extensions/collections/src/views/CollectionPageEdit/Instructions.tsx
M	extensions/collections/src/views/CollectionPageEdit/ModsEditPage.tsx
M	extensions/collections/src/views/CollectionPageView/HealthDownvoteDialog.tsx
M	extensions/collections/src/views/CollectionPageView/index.tsx
M	extensions/collections/src/views/InstallDialog/InstallFinishedDialog.tsx
M	extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx
M	extensions/copy-extension.mjs
M	extensions/copy-native.mjs
M	extensions/documentation/src/index.tsx
M	extensions/feedback/keywords.json
R100	extensions/gamebryo-ba2-support/.gitignore	extensions/gamebryo-archive-support/.gitignore
A	extensions/gamebryo-archive-support/build.mjs
A	extensions/gamebryo-archive-support/package.json
A	extensions/gamebryo-archive-support/scripts/create-test-archives.ts
A	extensions/gamebryo-archive-support/scripts/create-test-bsa-archives.ts
A	extensions/gamebryo-archive-support/src/ba2.test.ts
A	extensions/gamebryo-archive-support/src/ba2.ts
A	extensions/gamebryo-archive-support/src/bsa.test.ts
A	extensions/gamebryo-archive-support/src/bsa.ts
A	extensions/gamebryo-archive-support/src/index.ts
A	extensions/gamebryo-archive-support/src/lz4js.d.ts
A	extensions/gamebryo-archive-support/test-data/.gitignore
A	extensions/gamebryo-archive-support/test-data/expected-bsa.json
A	extensions/gamebryo-archive-support/test-data/expected.json
```

This is consistent with the rename (`gamebryo-ba2-support` → `gamebryo-archive-support`) plus the v2.0.1 modifications already inventoried in RESEARCH §2.

### (2) `autosort.ts` on upstream side — `toLowerCase` / `path.basename` hits

```
202:          path.basename(pluginList[pluginId].filePath),
255:          err.message.toLowerCase() === "already closed"
365:      } else if (err.message.toLowerCase() === "already closed") {
501:          path.extname(pluginList[id].filePath).toLowerCase() !== GHOST_EXT,
503:      .map((id) => path.basename(pluginList[id].filePath));
508:      if (err.message.toLowerCase() === "already closed") {
543:        const id = pluginName.toLowerCase();
546:            ? path.basename(pluginList[id].filePath)
600:            if (err.message.toLowerCase() === "already closed") {
977:      (iter) => iter.name.toLowerCase() === pluginName.toLowerCase(),
```

Upstream side `autosort.ts` is byte-equal in shape to fork HEAD on these lines — same structure, same identifiers, same line numbers. No new playbook surface introduced. Gate 8 covers both equally.

### (3) `divineCore.ts` on upstream side — `extends Error` declarations

```
17:export class DivineExecMissing extends Error {
24:export class DivineMissingDotNet extends Error {
31:export class DivineTimedOut extends Error {
38:export class DivineAborted extends Error {
45:export class DivinePakInvalid extends Error {
```

**Important nuance vs RESEARCH §1**: RESEARCH §1 stated "divine error classes absent on upstream side". The actual diff shows upstream side **has all 4 fork-named classes plus a 5th (`DivinePakInvalid`)**. Fork HEAD also has `DivinePakInvalid` (verified via `grep -nE 'class .* extends Error' divineCore.ts`). Since `DivinePakInvalid` exists on **both** fork and upstream, it is NOT a fork-only preservation invariant — adding it to gate 10 would gate a non-fork-preservation surface and produce false signal. Gate 10 stays scoped to the original 4 named classes per [D-33-04] / `VORTEX-LINUX-MERGE-PLAYBOOK.md` BG3 entry.

**No gate-13 added.** The 5th class is not playbook surface; it is a v2.0.0/2.0.1 feature addition that both sides converged on. The 4-class regex with threshold ≥4 still catches the regression mode that matters: "someone drops or renames one of the 4 originally-fork-named classes during conflict resolution".

### (4) `migrations.js` on upstream side — `migrate103` hits

```
8:async function migrate103(api, oldVersion) {
50:      log("warn", "morrowind migrate103: mod directory missing or inaccessible, skipping", {
60:        "morrowind migrate103: mod directory missing or inaccessible, skipping",
84:  migrate103,
```

Upstream side has `migrate103` + warning string at the same lines as fork HEAD. The function and the warning text both round-trip on either resolution stance. Gate 11 stays at threshold ≥1. No new gate needed.

### Inspection conclusion (D-33-05)

**No gate 13+ added.** v2.0.1's `extensions/` changes are dominantly oxfmt formatter reflow + the rename + the new `gamebryo-archive-support/*` source files. The 4 Phase-27-discovered playbook gates (§1, §3, §10, BG3 4-class, Morrowind migrate103) plus the inherited 6 mod_management gates plus the no-marker gate cover the full Phase 33 preservation surface. RESEARCH §1 conclusion ("zero new gates needed for v2.0.1") confirmed.

## D-33-10 single-host invariant verification

```
$ git grep -lE 'resolvePathCase\(dataPath,' src/ extensions/ | wc -l
1
$ git grep -lE 'resolvePathCase\(dataPath,' src/ extensions/
src/renderer/src/extensions/mod_management/LinkingDeployment.ts
```

Single host confirmed: `LinkingDeployment.ts` is the sole `resolvePathCase(dataPath, …)` host on the fork. Phase 33 must not introduce a second host in any gamebryo or per-game extension. Gate 6 (140a57217) continues to lock the 3 call sites in `LinkingDeployment.ts` at threshold ≥3.

## Harness dry-run results

### Skip-mode (`--skip-conflict-check`)

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
OK:   §1 extension build guards (no inline node -e process.platform; skip-on-{windows,linux}.mjs present)
OK:   §3 LOOT casing in autosort.ts (≥3 path.basename(pluginList[) + all 4 LOOT call sites present)
OK:   §10 native binaries on disk (node-loot.node, libloot.so.0, libloot_wstring_stub.so, bsatk.node)
OK:   BG3 divine error classes in divineCore.ts (≥4: DivineExecMissing, DivineMissingDotNet, DivineTimedOut, DivineAborted)
OK:   Morrowind migrate103 warning in migrations.js (≥1 'morrowind migrate103: mod directory missing')
SKIP: no conflict markers in src/renderer/src/extensions/mod_management/ + extensions/ (--skip-conflict-check)

CHECKPOINT PASSED — 11 gate(s) clean
```

Exit: **0**. All 11 non-marker gates GREEN.

### Full-mode (no flag)

Same 11 gates pass; gate 12 fails as expected:

```
FAIL: no conflict markers in src/renderer/src/extensions/mod_management/ + extensions/ (183 file(s) still contain '<<<<<<< ' — extensions/collections/build.mjs extensions/collections/src/collectionExport.ts extensions/collections/src/eventHandlers.ts extensions/collections/src/index.ts extensions/collections/src/util/gameSupport/gamebryo.tsx (+178 more))

CHECKPOINT FAILED — 1 gate(s) failed
```

Exit: **1**. Pre-resolution baseline as expected — 879 markers across 183 files in `extensions/` will be eradicated by Waves A–E. Gate 12 is the done-gate sentinel.

## Baseline conflict surface

- **Files with conflict markers under `extensions/`:** 183
- **Total conflict regions:** 879
- **Top-20 heaviest files:**
    ```
    extensions/games/game-baldursgate3/src/loadOrder.ts:37
    extensions/games/game-microsoftflightsimulator/src/index.js:24
    extensions/games/game-witcher3/src/scriptmerger.ts:23
    extensions/games/game-kingdomcome-deliverance/src/index.ts:20
    extensions/games/game-baldursgate3/src/util.ts:20
    extensions/games/game-witcher3/src/menumod.ts:18
    extensions/games/game-darkestdungeon/src/index.js:17
    extensions/games/game-witcher3/src/installers.ts:16
    extensions/games/game-baldursgate3/src/installers.ts:16
    extensions/games/game-baldursgate3/src/index.tsx:16
    extensions/games/game-7daystodie/src/index.tsx:16
    extensions/games/game-witcher3/src/util.ts:15
    extensions/games/game-witcher3/src/mergeBackup.ts:14
    extensions/games/game-witcher3/src/eventHandlers.ts:14
    extensions/games/game-monster-hunter-world/src/index.js:14
    extensions/games/game-witcher3/src/mergers.ts:13
    extensions/gamebryo-plugin-management/src/index.ts:12
    extensions/games/game-masterchiefcollection/src/index.ts:11
    extensions/games/game-7daystodie/src/util.ts:11
    extensions/games/game-codevein/src/index.ts:10
    ```

These counts will drive the per-wave done-gate audit: each per-file resolve commit must reduce `git grep -c '^<<<<<<< ' <file>` to 0, and the phase-end full-mode harness invocation must show 0 across `extensions/`.

## Deviations from plan

1. **[Rule 1 — gate 8 calibration]** PLAN-text §3 gate definition would false-fail on the green-as-shipped fork tree. Recalibrated to the actual fork-preservation surface (≥3 `path.basename(pluginList[` + ≥4 LOOT call-site identifiers). Documented above under "Gate 8 calibration note". Surrogate captures the playbook intent without false signal.

2. **[Rule 3 — gate 12 scope expansion]** PLAN-text inherited the Phase 32 marker gate verbatim, which is scoped to `mod_management/` only. Phase 33's resolution surface is `extensions/`; the inherited scope would have remained empty post-Phase-32 and defeated the gate's purpose. Broadened the scope to cover both directories. Pattern P3 invocation contract preserved (single bash run; --skip-conflict-check flag). Without this fix the plan's verification expectation ("full-mode = exit non-zero") would not have held.

3. **[Documentation fidelity]** Pre-flight item 2 (HEAD SHA match) drift is informational per plan note; recorded actual SHA `3b30563d…`.

No architectural changes (Rule 4) needed.

## Authentication gates

None. No external services contacted.

## Forward pointers

This plan unblocks Waves A–F (plans 33-01 through 33-09):

- **Plan 33-01** (Wave A — gamebryo core, 4 extensions parallel)
- **Plan 33-02** (Wave B — modtype-bepinex, 3 files)
- **Plan 33-03** (Wave C — collections, 12 files leaf→barrel)
- **Plan 33-04** (Wave D1 — heavy: witcher3 + bg3 in parallel)
- **Plan 33-05** (Wave D2 — medium ~7 extensions)
- **Plan 33-06** (Wave D3 — light batch ~60 single-file extensions, ~6 agents)
- **Plan 33-07** (Wave E — supporting scaffolding)
- **Plan 33-08** (Wave F — catalog re-add SYNC-33b)
- **Plan 33-09** (done gate)

Every per-file resolve commit in 33-01..33-07 invokes:

```bash
bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check
```

as the safety net. Done gate (33-09) drops `--skip-conflict-check` to assert full marker eradication.

## Self-Check

- `[x]` `scripts/grep-checkpoint.sh` exists at `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh`
- `[x]` Executable (`-rwxr-xr-x`)
- `[x]` 271 lines (Phase 32 base 159 + ≈112 added incl. comments)
- `[x]` Header comment cites Phase 32 v8.1 origin and 5 added Phase 33 gates
- `[x]` Skip-mode dry-run exit 0; 11 non-marker gates PASS
- `[x]` Full-mode exit 1; gate 12 FAIL (expected pre-resolution)
- `[x]` D-33-05 inspection captured verbatim
- `[x]` D-33-10 single-host invariant verified
- `[x]` Baseline counts (183/879) recorded
- `[x]` SUMMARY written to `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-00-SUMMARY.md`

## Self-Check: PASSED
