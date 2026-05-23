---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 01
wave: 1
type: execute
completed: 2026-05-22
requirements:
    - SYNC-33a
files_modified:
    - extensions/gamebryo-savegame-management/tsconfig.json
    - extensions/gamebryo-savegame-management/build.mjs
    - extensions/gamebryo-savegame-management/src/actions/session.ts
    - extensions/gamebryo-savegame-management/src/index.ts
    - extensions/gamebryo-plugin-management/build.mjs
    - extensions/gamebryo-plugin-management/src/util/gameSupport.ts
    - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts
    - extensions/gamebryo-plugin-management/src/views/PluginList.tsx
    - extensions/gamebryo-plugin-management/src/index.ts
    - extensions/gamebryo-archive-support/build.mjs
    - extensions/gamebryo-bsa-support/build.mjs
files_created:
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md
commits:
    - "497e12cd9 resolve(savegame-mgmt): tsconfig.json — smaller-diff matching master"
    - "25944fd68 resolve(savegame-mgmt): build.mjs — upstream-wins on nativeRemapPlugin"
    - "da6b50250 resolve(savegame-mgmt): src/actions/session.ts — smaller-diff (HEAD matches master)"
    - "5ccf54671 resolve(savegame-mgmt): src/index.ts — smaller-diff (HEAD matches master); extension closeout"
    - "66a4735ec resolve(plugin-mgmt): build.mjs — smaller-diff (HEAD matches master verbatim)"
    - "b9ccf951c resolve(plugin-mgmt): src/util/gameSupport.ts — smaller-diff (HEAD matches master)"
    - "9f94c9d31 resolve(plugin-mgmt): src/util/PluginPersistor.ts — smaller-diff (HEAD matches master)"
    - "cc858bf58 resolve(plugin-mgmt): src/views/PluginList.tsx — smaller-diff x6 (HEAD matches master throughout)"
    - "e32907604 resolve(gamebryo-plugin-mgmt): index.ts barrel — 12 regions HEAD-wins"
    - "4a502cac0 resolve(gamebryo-archive-support): build.mjs — upstream-wins on nativeRemapPlugin"
    - "f3a7c1fb9 resolve(gamebryo-bsa-support): build.mjs — HEAD-wins single-line import"
gates_active: 11
gates_total: 12
head_sha: f3a7c1fb9
base_sha: abfad9558
branch: v8.1/config-bucket
---

# Phase 33 Plan 01 — Wave A: Gamebryo Core Resolution Summary

11 conflict files across 4 gamebryo core extensions resolved leaf-first via 11 atomic SSH-signed `resolve(<ext-slug>): ...` commits. All commits on `v8.1/config-bucket`. Harness skip-mode (11 gates active, gate-12 conflict-marker check skipped per Pattern P3) GREEN after every commit. Per-extension typecheck = 0 non-marker errors at all 4 extension closeouts.

## Counts vs Plan

|                                      | Plan target    | Actual | Status |
| ------------------------------------ | -------------- | ------ | ------ |
| Conflict files resolved              | 11             | 11     | match  |
| Resolve commits                      | 11             | 11     | match  |
| Harness gates active                 | 11 (skip mode) | 11     | match  |
| Per-extension typechecks at 0 errors | 4              | 4      | match  |
| SSH-signed commits                   | 11/11          | 11/11  | match  |

## Resolution stance distribution (per D-33-02 5-tier hierarchy)

Across all 11 files / ~30 conflict regions:

| Tier | Stance                                                  | Region count | Notes                                                                                                                                                                                     |
| ---- | ------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Playbook gates (§1/§3/§10/BG3/Morrowind)                | 0            | All 5 playbooks passive — none of these files host the gates                                                                                                                              |
| 2    | NativePlugins-pattern guards (`process.platform`, etc.) | 0            | gameSupport.ts has 1 hit at line 361 but it's outside the conflict region                                                                                                                 |
| 3    | New-v2.0.1-feature upstream-wins                        | 2            | savegame-mgmt build.mjs (nativeRemapPlugin import added), archive-support build.mjs (nativeRemapPlugin + ba2tk remap; was a HEAD-side rename + content gap)                               |
| 4    | Rule-1 dup-block elimination                            | 2            | plugin-mgmt index.ts R8 (duplicate `testBlueprintMasters` sync body + duplicate `testRulesUnfulfilled` start), R10 (duplicate `onStateChange(["persistent","profiles"], ...)` outer wrap) |
| 5    | Smaller-diff (HEAD/master-aligned)                      | ~26          | Pure formatter reflow regions; HEAD's single-line/compact form matches master's pre-merge layout                                                                                          |

## Per-extension trace

### gamebryo-savegame-management (4 files, ~5 regions)

- **tsconfig.json** — 1 region, tier-5 smaller-diff, master-aligned
- **build.mjs** — 1 region, tier-3 upstream-wins (nativeRemapPlugin first introduction)
- **src/actions/session.ts** — 1 region, tier-5 smaller-diff (HEAD-wins single-line)
- **src/index.ts** — 1 region at lines 100-105, tier-5 smaller-diff. **Closeout typecheck: 0 errors.**

### gamebryo-plugin-management (5 files, ~24 regions)

- **build.mjs** — 1 region, tier-5 smaller-diff. Both sides had nativeRemapPlugin already (used at line 17 for node-loot remap); pure single-line vs multi-line reflow
- **src/util/gameSupport.ts** — 1 region at lines 464-474, tier-5 smaller-diff. The 1 `process.platform` hit at line 361 is OUTSIDE the conflict region (§1 surface unaffected)
- **src/util/PluginPersistor.ts** — 1 region at line ~312 (`.sort()` arrow), tier-5 smaller-diff
- **src/views/PluginList.tsx** — 6 regions, all tier-5 smaller-diff (HEAD-wins). Region 2 (~line 804) preserved HEAD's modern `isMedium: await this.props.isMediumMaster(...)` async/await form vs upstream's older callback `Promise(resolve)` pattern (master agrees with HEAD)
- **src/index.ts** — 12 regions, mixed: R1 (await ESPFile.open async API), R2 (comment), R3 (async closure), R4 (await closure), R5 (no `:Promise<void>` annotation — bluebird-trap-aware), R6 (single-line copyAsync), R7 (single-line isBlueprint), R8 (Rule-1 dup elim), R9 (await ESPFile.open at setPluginLight), R10 (Rule-1 dup elim — onStateChange wrap), R11 (single-line ternary), R12 (single-line showErrorNotification). **Closeout typecheck: 0 errors.**

### gamebryo-archive-support (1 file, 2 regions)

- **build.mjs** — 2 regions, both tier-3 upstream-wins. Note: this conflict is also a directory rename (HEAD: `gamebryo-archive-support`; upstream: `gamebryo-ba2-support`). HEAD's renamed path preserved; only file contents adopted from upstream. Master's `gamebryo-ba2-support/build.mjs` matches upstream verbatim. **Closeout typecheck: 0 errors.**

### gamebryo-bsa-support (1 file, 1 region)

- **build.mjs** — 1 region, tier-5 smaller-diff. Both sides import nativeRemapPlugin (already in HEAD, used at line 17 for `bsatk` remap); HEAD has single-line, upstream had multi-line. Master matches HEAD verbatim. **Closeout typecheck: 0 errors.**

## Bluebird Promise trap (TS1064) avoidance

`extensions/gamebryo-plugin-management/src/index.ts` imports `Promise from "bluebird"` at line 3. Per playbook constraint, NEVER add `:Promise<void>` annotation to async functions in this file. Region 5 of index.ts honoured this — kept HEAD's bare `) {` form rather than upstream's annotated form. This was the only at-risk region this wave.

## Gate states post-Wave-A

11 harness gates (skip-mode):

- §1 extension build guards (no inline `node -e process.platform`; both `skip-on-{windows,linux}.mjs` present): **OK**
- §3 LOOT casing in autosort.ts (≥3 `path.basename(pluginList[` + 4 LOOT call sites): **OK**
- §6 stagingDirHasFiles in InstallManager.ts: **OK**
- §7a normalizeBackslashPaths in InstallManager.ts (≥3): **OK**
- §7b mergeCaseConflictingDirs in InstallManager.ts (≥3): **OK**
- §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2): **OK**
- §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1): **OK**
- 140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 — locks :523/:742/:799): **OK**
- §10 native binaries on disk (`node-loot.node`, `libloot.so.0`, `libloot_wstring_stub.so`, `bsatk.node`): **OK**
- BG3 4 divine error classes in divineCore.ts: **OK**
- Morrowind migrate103 warning in migrations.js (≥1): **OK**

Gate-12 (no-conflict-markers under `mod_management/` + `extensions/`) skipped per Pattern P3 throughout the wave; manually verified zero residual markers in the 4 extensions touched (`grep -rln "<<<<<<< HEAD"` = none).

## Per-extension typecheck (Pattern P4 Route 1)

All Route 1 (`pnpm --filter <pkg> typecheck` filtered for `error TS` and excluding `TS1185`):

| Extension                    | Errors | Status |
| ---------------------------- | ------ | ------ |
| gamebryo-savegame-management | 0      | PASS   |
| gamebryo-plugin-management   | 0      | PASS   |
| gamebryo-archive-support     | 0      | PASS   |
| gamebryo-bsa-support         | 0      | PASS   |

## Deviations / blockers

None. Plan executed as written. No package-install gates triggered (no new dependencies). No architectural decisions surfaced. No checkpoints hit.

The single noteworthy nuance was the `gamebryo-archive-support` rename conflict (directory was renamed in HEAD from `gamebryo-ba2-support`), which Git surfaced as `<<<<<<< HEAD:extensions/gamebryo-archive-support/build.mjs ... >>>>>>> v2.0.1:extensions/gamebryo-ba2-support/build.mjs` markers. Resolved by adopting upstream's content under HEAD's renamed path — same outcome as plain upstream-wins on a non-renamed file.

## Push status

**No-push confirmed.** Branch `v8.1/config-bucket` advanced from `abfad9558` to `f3a7c1fb9` locally only. Operator pushes at phase end per playbook.

## Verification commands (for next agent)

```bash
git log --oneline abfad9558..f3a7c1fb9   # 11 resolve commits visible
git cat-file -p f3a7c1fb9 | grep -c '^gpgsig '   # 1 (SSH-signed)
grep -rln "<<<<<<< HEAD\|>>>>>>> v2.0.1" extensions/gamebryo-{savegame-management,plugin-management,archive-support,bsa-support}/   # empty
bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check   # exit 0, 11 gates clean
pnpm --filter gamebryo-savegame-management typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l   # 0
pnpm --filter gamebryo-plugin-management typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l   # 0
pnpm --filter gamebryo-archive-support typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l   # 0
pnpm --filter gamebryo-bsa-support typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l   # 0
```

## Self-Check: PASSED

- Created files exist: `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-01-SUMMARY.md` (this file)
- All 11 commits visible in `git log abfad9558..f3a7c1fb9`
- All 11 commits SSH-signed (`gpgsig` header present in each)
- Harness skip-mode exit 0 (11 gates clean)
- All 4 per-extension typechecks return 0 non-marker errors
- Zero residual conflict markers in the 4 Wave A extensions
- Branch unchanged: `v8.1/config-bucket`
- No push performed
