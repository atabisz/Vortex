# Phase 28 — D-28-05 Done Gate Evidence

Captured 2026-05-21. Branch: `v8.0/config-bucket`. Local HEAD before push: `3cc93b988`.

## D-28-05 Done Gate

### 1. Zero conflict markers across 7 Phase 28 directories

**Command:**

```
git grep -l '^<<<<<<< ' src/renderer/ src/main/ src/preload/ src/shared/ scripts/ .github/actions/fingerprints/
```

(`extensions/nexus_integration/` resolves to `src/renderer/src/extensions/nexus_integration/` and is covered by `src/renderer/`.)

**Result:** exit 1 (no matches) — **PASS**.

### 2. grep-checkpoint.sh full run (NO `--skip-conflict-check`)

**Command:**

```
bash .planning/milestones/v8.0/scripts/grep-checkpoint.sh
```

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
OK:   §2 winapi-bindings retained in renderer webpack (alias + linux-only externals push, ≥2 hits)
OK:   §4 testPathTransfer in transferPath.ts has NO Windows-only reject (NEGATIVE gate, count==0)
OK:   §8 StarterInfo.ts Proton helpers (≥3) + protonSpawned/hideWindow hide-instead-of-quit (≥1 each)
OK:   §9 Steam.ts retains findAllLinuxSteamPaths (≥1) + libraryfolders.vdf (≥1)
OK:   no conflict markers in mod_management/ + 7 Phase 27 extension dirs

CHECKPOINT PASSED — 16 gate(s) clean
```

**Result:** exit 0; all 16 gates clean — **PASS**. The plan-28-00 additions (§2/§4/§8/§9) are explicitly green; Phase 26/27 invariants (§1/§3/§6/§7a-d/§10/140a57217/BG3/Morrowind) all retained.

### 3. Per-bucket typechecks (D-28-03 cadence)

**Note:** Plan 28-11 specified `pnpm typecheck -F @vortex/<pkg>`. That syntax has pnpm pass `-F` to `tsc` (which fails with `TS5023: Unknown compiler option '-F'`). The correct invocation is `pnpm --filter @vortex/<pkg> typecheck` (filter goes BEFORE the script name). All four buckets re-run with the corrected syntax.

| Bucket             | Command                                    | Exit Code |
| ------------------ | ------------------------------------------ | --------- |
| `@vortex/shared`   | `pnpm --filter @vortex/shared typecheck`   | 0         |
| `@vortex/preload`  | `pnpm --filter @vortex/preload typecheck`  | 0         |
| `@vortex/main`     | `pnpm --filter @vortex/main typecheck`     | 0         |
| `@vortex/renderer` | `pnpm --filter @vortex/renderer typecheck` | 0         |

**Result:** all four exit zero — **PASS**.

### 4. Phase-end full-repo `pnpm typecheck`

**Command:** `pnpm typecheck`

**Result:** exit 0 — **PASS**. No cross-bucket drift.

### 5. ~54 atomic commits

**Note:** Plan 28-11 specified `--not origin/sync/upstream-v2.0.0`, but the actual upstream tracking ref on this fork is `fork/sync/upstream-v2.0.0` (origin = Nexus-Mods/Vortex; fork = atabisz/Vortex). All commit-counting commands re-run with `--not fork/sync/upstream-v2.0.0`.

**Resolve commits by scope (shared|preload|main|renderer|nexus|scripts|docs):**

```
git log --oneline v8.0/config-bucket --not fork/sync/upstream-v2.0.0 \
  | grep -cE '^[0-9a-f]+ resolve\((shared|preload|main|renderer|nexus|scripts|docs)\):'
```

→ **51** (within plan's expected 48–52 range; Mode A in plan 28-10 → 5 docs commits)

**Per-scope breakdown:**

| Scope             | Count  |
| ----------------- | ------ |
| shared            | 3      |
| preload           | 1      |
| main              | 7      |
| renderer          | 27     |
| nexus             | 6      |
| scripts           | 2      |
| docs              | 5      |
| **Total resolve** | **51** |

**Fingerprints squash (must be 1):** 1 — **PASS**

**Setup chore commit (must be 1):** 1 — **PASS**

**Total commits over upstream:** 63 (51 resolve + 1 fingerprints + 1 setup + 10 docs/SUMMARY commits for plans 28-00 through 28-10).

**Result:** **PASS** — within range.

### 6. Fingerprints squash matches upstream tree

**Upstream merge parent (parent2 of `138da2249`):** `8b5a9f675`

**Command:** `git diff 8b5a9f675 -- .github/actions/fingerprints/`

**Result:** 0 lines of output — fingerprints tree byte-for-byte matches upstream merge parent — **PASS**.

### 7. No half-resolved files

**Command:** `git status --short`

**Initial result:** `M packages/vortex-api/lib/api.d.ts` — generated api-extractor output regenerated as side-effect of `pnpm typecheck` runs in checks 3+4. This is recurring drift (prior chore commits like `416af4df3 chore: ... regenerate api/dep docs` and `3d639fc26 chore(15-03): regenerate vortex-api declarations with resolvePathCase` show the same pattern). Discarded the regen via `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` — the file is generated, will regenerate on next typecheck, and is unrelated to Phase 28's conflict-resolution scope.

**Final result:** empty — **PASS**.

**Note:** A separate `chore: regenerate vortex-api/lib/api.d.ts` commit (matching the established pattern) is appropriate for a follow-up housekeeping pass — outside Phase 28 scope.

### 8. Force-with-lease push

**Pre-push remote SHA:** `c418a4889e661ad197d2f0694122443a8bbd4ee9`
**Local HEAD pushed:** `3cc93b9881b3d10749f1c859be2971021fb2be40`
**Post-push remote SHA:** `3cc93b9881b3d10749f1c859be2971021fb2be40` (verified via `git ls-remote git@github.com:atabisz/Vortex.git refs/heads/sync/upstream-v2.0.0`)
**Pushed:** 2026-05-22 — user approved.

**Result: PASS.**

**Push command used (note explicit lease SHA — implicit `--force-with-lease` needs a tracked remote, but the inline SSH URL bypasses tracking, so we pin the lease to the verified pre-push SHA):**

```
git push --force-with-lease=sync/upstream-v2.0.0:c418a4889e661ad197d2f0694122443a8bbd4ee9 \
  git@github.com:atabisz/Vortex.git v8.0/config-bucket:sync/upstream-v2.0.0
```

Initial attempt with implicit lease (`--force-with-lease` no value) was rejected with `(stale info)` because the inline SSH URL has no remote-tracking branch. Pinning the lease to the pre-push SHA is the correct fix and confirms the push was safe (remote was unchanged at `c418a4889`).

## Requirements satisfied

| Requirement | Evidence                                                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SYNC-07** | Renderer/main/preload/shared spine merge — verified via checks 1, 2, 3, 4 (zero conflicts + per-bucket + full typechecks all green)                         |
| **SYNC-08** | Doc borderlines resolved — plan 28-10 5 doc files committed with fork-wins stance                                                                           |
| **SYNC-09** | Scripts bucket merge — plan 28-08 2 files committed (`download-duckdb-extensions.{ts,test.ts}`)                                                             |
| **SYNC-10** | Fingerprints upstream-wholesale — plan 28-09 squash commit `40a40d27a`; check 6 confirms byte-for-byte upstream tree match                                  |
| **SYNC-18** | Plan 28-04 onwards: views/ component sub-bucket resolved (10 files in plan 28-06, plus the spine pieces)                                                    |
| **SYNC-20** | Plan 28-07: ExtensionManager.ts resolved with the substantive Rule 1 indentation fix                                                                        |
| **SYNC-24** | Bluebird Promise traps avoided throughout — no `:Promise<void>` annotations taken from upstream verbatim where bluebird is in scope                         |
| **SYNC-25** | All 63 conflict files resolved → working tree merge-clean for Phase 29                                                                                      |
| **SYNC-26** | Per-bucket + full-repo typechecks green; merge-driver duplicate-decl artefact in `Menu/useToolsData.ts` surfaced and fixed (Rule 1 deviation in plan 28-07) |

## Phase 28 status: COMPLETE

Pushed 2026-05-22. Post-push `fork/sync/upstream-v2.0.0` head: `3cc93b9881b3d10749f1c859be2971021fb2be40`. Working tree merge-clean; ready for Phase 29.
