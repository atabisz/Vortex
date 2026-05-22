# Phase 27 Done Gate — D-27-05 Six-Check Evidence

**Completed:** 2026-05-21T02:53:47Z
**Branch:** `v8.0/config-bucket` @ `1b7427dba`
**Pushed to:** `fork/sync/upstream-v2.0.0` @ `1b7427dba`
**Base:** `fork/sync/upstream-v2.0.0` @ `f15bbabb8` (pre-push)

## D-27-05 Done Gate

### 1. Zero conflict markers across 7 phase directories

**Command:**

```
git grep '^<<<<<<< ' \
  extensions/gamebryo-plugin-management/ \
  extensions/gamebryo-savegame-management/ \
  extensions/collections/ \
  extensions/modtype-bepinex/ \
  extensions/games/game-baldursgate3/ \
  extensions/games/game-morrowind/ \
  extensions/games/game-witcher3/
```

**Output:** (empty)
**Exit:** `1` (no matches — PASS)

### 2. grep-checkpoint.sh full run (no `--skip-conflict-check`)

**Command:** `bash .planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh`

**Output:**

```
OK:   §6 stagingDirHasFiles in InstallManager.ts (≥1 hit) + util/stagingIntegrity.ts present
OK:   §7a normalizeBackslashPaths in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7b mergeCaseConflictingDirs in InstallManager.ts (≥3 hits: import + 2 call sites)
OK:   §7c copy-loop replaceAll("\\","/") in InstallManager.ts (≥2 hits: source + destination)
OK:   §7d resolvePathCase(tempPath, …) in InstallManager.ts (≥1 hit)
OK:   140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3 hits — locks :523, :742, :799)
OK:   §1 extension build guards (named-script form survives; no inline process.platform outside gamestore-xbox)
OK:   §3 LOOT call-site casing in autosort.ts (no pluginName.toLowerCase at LOOT calls; path.basename shape ≥3)
OK:   §10 cross-compiled native binaries present (loot + bsatk dist artefacts)
OK:   BG3 4-class divine errors preserved in divineCore.ts (DivineExecMissing/MissingDotNet/TimedOut/Aborted, count ≥4)
OK:   Morrowind migrate103 warning preserved in migrations.js (count ≥1)
OK:   no conflict markers in mod_management/ + 7 Phase 27 extension dirs

CHECKPOINT PASSED — 12 gate(s) clean
```

**Exit:** `0` — all 12 gates green. Phase 26 invariants (§6, §7a–d, 140a57217) and Phase 27 invariants (§1, §3, §10, BG3 4-class divine, Morrowind migrate103) all preserved on the resolved tree.

### 3. Per-extension typecheck

| Extension                      | Command                                                | Exit | Notes                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gamebryo-savegame-management` | `pnpm --filter gamebryo-savegame-management typecheck` | 0    | Has `typecheck` script (runs `pnpm tsc`)                                                                                                                                          |
| `gamebryo-plugin-management`   | `pnpm --filter gamebryo-plugin-management typecheck`   | 0    | Has `typecheck` script                                                                                                                                                            |
| `modtype-bepinex`              | `pnpm --filter modtype-bepinex typecheck`              | 0    | Has `typecheck` script                                                                                                                                                            |
| `collections`                  | `pnpm --filter collections typecheck`                  | 0    | Has `typecheck` script                                                                                                                                                            |
| `game-baldursgate3`            | `pnpm --filter game-baldursgate3 build`                | 0    | No `typecheck` script + no per-extension tsconfig.json — build-as-typecheck per Plan 27-05 D-27-04 deviation. Bundle written to `src/main/build/bundledPlugins/game-baldursgate3` |
| `game-morrowind`               | `pnpm --filter game-morrowind build`                   | 0    | No `typecheck` script; `migrations.js` is plain CommonJS — build-as-syntax-check via rolldown. Bundle written to `src/main/build/bundledPlugins/game-morrowind`                   |
| `game-witcher3`                | `pnpm --filter game-witcher3 build`                    | 0    | No `typecheck` script + no per-extension tsconfig.json — build-as-typecheck per Plan 27-07 D-27-04 deviation. Bundle written to `src/main/build/bundledPlugins/game-witcher3`     |

All seven extensions exit 0. The three game extensions use build-as-typecheck (rolldown bundler refuses to bundle on syntax/resolution errors); same routing carried forward from the per-plan resolution work.

### 4. Phase-end full-repo `pnpm typecheck`

**Command:** `pnpm typecheck` (resolves to `pnpm nx run-many -t typecheck` — 58 projects)

**Exit:** `130` (non-zero — see "Pre-existing — not introduced by Phase 27" below)

**Output (errors only):**

```
src/errors.test.ts(135,1): error TS1185: Merge conflict marker encountered.
src/errors.test.ts(137,1): error TS1185: Merge conflict marker encountered.
src/errors.test.ts(141,1): error TS1185: Merge conflict marker encountered.
src/errors.test.ts(202,1): error TS1185: Merge conflict marker encountered.
src/errors.test.ts(204,1): error TS1185: Merge conflict marker encountered.
src/errors.test.ts(208,1): error TS1185: Merge conflict marker encountered.
src/errors.ts(125,1): error TS1185: Merge conflict marker encountered.
src/errors.ts(127,1): error TS1185: Merge conflict marker encountered.
src/errors.ts(132,1): error TS1185: Merge conflict marker encountered.
src/errors.ts(152,1): error TS1185: Merge conflict marker encountered.
src/errors.ts(164,1): error TS1185: Merge conflict marker encountered.
src/errors.ts(165,1): error TS1185: Merge conflict marker encountered.
src/telemetry/spans.ts(24,1): error TS1185: Merge conflict marker encountered.
src/telemetry/spans.ts(26,1): error TS1185: Merge conflict marker encountered.
src/telemetry/spans.ts(29,1): error TS1185: Merge conflict marker encountered.

Failed tasks:
- @vortex/shared:build
- @vortex/shared:typecheck
```

**Pre-existing — not introduced by Phase 27:**

All 15 errors are TS1185 "Merge conflict marker encountered" errors in `src/shared/src/{errors.ts, errors.test.ts, telemetry/spans.ts}`. These files are **outside Phase 27 scope** — `src/shared/` is **Phase 28** territory ("Renderer + main spine") per ROADMAP.md.

Verified pre-existing on the merge base via:

```
$ git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.0 -- src/shared/
fork/sync/upstream-v2.0.0:src/shared/src/errors.test.ts
fork/sync/upstream-v2.0.0:src/shared/src/errors.ts
fork/sync/upstream-v2.0.0:src/shared/src/telemetry/spans.ts

$ git log --oneline -1 -- src/shared/src/errors.ts
138da2249 merge upstream v2.0.0 (conflicts)
```

The conflict markers were introduced by commit `138da2249 merge upstream v2.0.0 (conflicts)` (the original merge that started v8.0/config-bucket). They survived untouched through every Phase 24/25/26/27 plan because none of those phases touched `src/shared/`. Phase 28 will resolve them.

**Phase-27-scope cross-extension drift check:** PASS. Filtering the typecheck log for any error in a Phase 27 directory (`extensions/(gamebryo-(plugin|savegame)-management|collections|modtype-bepinex|games/game-(baldursgate3|morrowind|witcher3))/`) returns zero results. The 58 nx projects that ran before the `@vortex/shared` failure all produced clean output; nx then aborted dependents (54 downstream projects skipped because they depend on `@vortex/shared:typecheck` succeeding — including all four Phase 27 extensions with `typecheck` scripts). Per-extension typecheck (Check 3 above) covered those four directly with no `@vortex/shared` dependency in the run graph; all four exited 0.

**Per deviation_handling rule:** "If `pnpm typecheck` (full repo) surfaces pre-existing errors unrelated to Phase 27 changes (e.g., upstream untouched files), document them as a 'Pre-existing — not introduced by Phase 27' subsection." Documented; non-blocking for Phase 27 done-gate.

### 5. 25 atomic resolve commits + 1 setup commit (26 total Phase 27 commits)

**Per-extension `resolve(<scope>):` commit count:**

```
$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 \
    | grep -cE '^[0-9a-f]+ resolve\((savegame-mgmt|plugin-mgmt|bepinex|collections|bg3|morrowind|witcher3)\):'
25
```

**Per-extension breakdown:**

| Scope                    | Count  | Plan  |
| ------------------------ | ------ | ----- |
| `resolve(savegame-mgmt)` | 2      | 27-01 |
| `resolve(plugin-mgmt)`   | 4      | 27-02 |
| `resolve(bepinex)`       | 3      | 27-03 |
| `resolve(collections)`   | 6      | 27-04 |
| `resolve(bg3)`           | 7      | 27-05 |
| `resolve(morrowind)`     | 1      | 27-06 |
| `resolve(witcher3)`      | 2      | 27-07 |
| **Total**                | **25** |       |

Matches CONTEXT D-27-00 expected count exactly.

**Checkpoint setup commit:**

```
$ git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 \
    | grep -cE '^[0-9a-f]+ resolve\(checkpoint\): scripts/grep-checkpoint\.sh —'
1
```

The `63f90752a resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates` from Plan 27-00.

**Total commits over `fork/sync/upstream-v2.0.0`:**

```
$ git rev-list --count fork/sync/upstream-v2.0.0..v8.0/config-bucket
39
```

26 = 25 resolve + 1 setup as required. Remaining 13 are non-blocking docs commits (8 `docs(27-NN): complete <plan> plan` summary commits per plan, plus phase-setup commits: `docs(27): capture phase context`, `docs(27): unflatten bucket file list…`, `docs(state): record phase 27 context session`, `docs(27-gamebryo-per-game-extensions): create phase plans`, `chore(planning): set workflow.use_worktrees=false for phase 27`).

**Full log over fork base:**

```
1b7427dba docs(27-07): complete game-witcher3 conflict-resolution plan
cbfcc1804 resolve(witcher3): index.ts — keep HEAD (double quotes + oxfmt-wrapped registerInstaller calls per fork style)
ae13a4c5b resolve(witcher3): installers.ts — keep HEAD (double quotes + oxfmt-wrapped args per fork style)
17ecbb3cf docs(27-06): complete game-morrowind plan
75e4eff59 resolve(morrowind): migrations.js — keep HEAD (double quotes + wrapped args per fork style; preserves migrate103 warning per D-27-02)
26e7d6028 docs(27-05): complete bg3 conflict resolution plan (22/25 Phase 27 files done)
876b9a6b2 resolve(bg3): index.tsx — keep HEAD (drop merge-driver duplicate-imports + duplicate-const artefact)
5610e02f5 resolve(bg3): loadOrder.ts — keep HEAD (drop merge-driver duplicate-imports artefact + preserve fork-side fixes)
9406b7a25 resolve(bg3): divineCore.test.ts — keep HEAD (double quotes per fork style)
2c744a559 resolve(bg3): divineWrapper.ts — keep HEAD (drop merge-driver dropped-imports artefact + fork-side limiter retry filter + double quotes)
de2a83f88 resolve(bg3): divineCore.ts — keep HEAD (double quotes per fork style; preserves 4 divine error classes per D-27-02)
d0f60cf3b resolve(bg3): util.ts — keep HEAD (double quotes per fork style)
ef52d47f2 resolve(bg3): cache.ts — keep HEAD (wrapped signature + double quotes per fork style)
7958a93d1 docs(27-04): complete collections conflict resolution plan
d2ba9abbb resolve(collections): index.ts — keep HEAD (drop merge-driver indent/brace artefact + inline form)
1290bcdf3 resolve(collections): views/CollectionList/index.tsx — keep HEAD (drop merge-driver dropped-imports artefact + inline form)
68d97dba9 resolve(collections): views/InstallDialog/InstallStartDialog.tsx — keep HEAD (preserve gamebryo-only skipPluginRules toggle gate + inline form)
3a49f4360 resolve(collections): views/CollectionPageEdit/Instructions.tsx — keep HEAD (preserve gamebryo-only excludePluginRules toggle gate + inline form)
a8287fcf0 resolve(collections): eventHandlers.ts — keep HEAD (drop merge-driver duplicate-block + duplicate path import + inline form)
05fdbcf24 resolve(collections): util/gameSupport/gamebryo.tsx — keep HEAD (drop merge-driver mid-block artefact + inline form)
051dca3ff docs(27-03): complete modtype-bepinex conflict resolution plan
3959a8854 resolve(bepinex): index.ts — keep HEAD inline form
57ad32907 resolve(bepinex): common.ts — keep HEAD inline form
df2d3aab8 resolve(bepinex): bepInExDownloader.ts — keep HEAD (drop merge-driver duplicate types import + inline form)
4804f369a docs(27-02): complete plugin-mgmt plan
394d12242 resolve(plugin-mgmt): index.ts — keep HEAD (async ESPFile.open chain + drop merge-driver onStateChange duplication)
9ca7c1164 resolve(plugin-mgmt): views/PluginList.tsx — keep HEAD (async/await + inline conditionals)
619845991 resolve(plugin-mgmt): util/PluginPersistor.ts — keep HEAD inline arrow form
a4a9fc0cf resolve(plugin-mgmt): util/gameSupport.ts — keep HEAD inline arrow form
0549c0f00 docs(27-01): complete savegame-mgmt plan
68a1b97e0 resolve(savegame-mgmt): index.ts — keep HEAD (drop stale upstream indent + extra brace)
0caa66fa4 resolve(savegame-mgmt): actions/session.ts — keep HEAD inline arrow form
062490d1d docs(27-00): complete grep-checkpoint extension plan
63f90752a resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates
99519cd6c chore(planning): set workflow.use_worktrees=false for phase 27
1cd91bcf5 docs(27-gamebryo-per-game-extensions): create phase plans (9 plans, 7 waves)
e696e097c docs(state): record phase 27 context session
be49ebed2 docs(27): unflatten bucket file list after linter merged numbered items
f624641a4 docs(27): capture phase context
```

### 6. Force-with-lease push to fork/sync/upstream-v2.0.0

**Pre-push remote SHA:** `f15bbabb8f1ca9d4a7cab2fa2d89be3584ad1185` (the merge base)
**Local HEAD pushed:** `1b7427dba10fcef4b53352115d3594e198dcc645`

**Command:** `git push --force-with-lease fork v8.0/config-bucket:sync/upstream-v2.0.0`

**Output:**

```
To https://github.com/atabisz/Vortex.git
   f15bbabb8..1b7427dba  v8.0/config-bucket -> sync/upstream-v2.0.0
```

**Exit:** `0`

**Post-push remote SHA:** `1b7427dba10fcef4b53352115d3594e198dcc645` (matches local HEAD)

No SSH fallback needed — HTTPS push via the configured `fork` remote (`https://github.com/atabisz/Vortex.git`) succeeded first try. `--force-with-lease` (not `--force`) used per CONTEXT D-27-00 / Phase 24 D-02.

## Requirements satisfied

| Requirement | Stated goal                                                                                                                       | Phase 27 evidence                                                                                                                                                                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SYNC-05** | Resolve gamebryo plugin/savegame conflicts (6 files)                                                                              | 6 commits across `gamebryo-savegame-management` (2) + `gamebryo-plugin-management` (4); both extensions typecheck clean (Check 3); §3 LOOT casing in `autosort.ts` preserved (Check 2 gate 8)                                                                                                                                                                                                |
| **SYNC-06** | Resolve collections + modtype-bepinex conflicts (9 files)                                                                         | 9 commits across `collections` (6) + `modtype-bepinex` (3); both extensions typecheck clean (Check 3); fork-side gamebryo-only `excludePluginRules` / `skipPluginRules` toggle gates preserved per Plan 27-04                                                                                                                                                                                |
| **SYNC-17** | Resolve game-baldursgate3 + game-morrowind conflicts (8 files); preserve BG3 4-class divine errors + Morrowind migrate103 warning | 8 commits across `game-baldursgate3` (7) + `game-morrowind` (1); both extensions build-as-typecheck clean (Check 3); BG3 4-class divine preservation gate at count ≥4 (Check 2 gate 10); Morrowind migrate103 warning preservation gate at count ≥1 (Check 2 gate 11); BG3 fork-side substantive preservations (divineWrapper retry filter, loadOrder pak-loop catch handler) per Plan 27-05 |
| **SYNC-19** | Resolve game-witcher3 conflicts (2 files)                                                                                         | 2 commits in `game-witcher3`; build-as-typecheck clean (Check 3); cosmetic resolutions only (HEAD wins per fork prevailing oxfmt + double-quote style) per Plan 27-07                                                                                                                                                                                                                        |

All four phase requirement IDs verifiable as satisfied.

## Phase 27 status: COMPLETE

**Completed:** 2026-05-21T02:53:47Z

- 25/25 conflict files resolved across the 7 phase directories
- 12-gate grep-checkpoint passes (Phase 26 + Phase 27 invariants both intact)
- All 7 touched extensions typecheck/build clean per their D-27-04 routing
- Phase-end full-repo typecheck: pre-existing `src/shared/` Phase 28 conflicts surfaced; zero new errors introduced by Phase 27 work
- 26 Phase 27 commits land on `v8.0/config-bucket` (25 resolve + 1 checkpoint setup)
- `fork/sync/upstream-v2.0.0` force-with-lease pushed from `f15bbabb8` to `1b7427dba`

Phase 28 (renderer + main spine) is the next planning unit. Its scope already includes the `src/shared/` conflicts surfaced in Check 4.
