---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 02
wave: 2
type: execute
completed: 2026-05-22
requirements:
    - SYNC-33a
files_modified:
    - extensions/modtype-bepinex/src/bepInExDownloader.ts
    - extensions/modtype-bepinex/src/common.ts
    - extensions/modtype-bepinex/src/index.ts
files_created:
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md
commits:
    - "0898601ab resolve(bepinex): bepInExDownloader.ts — smaller-diff (×6 reflow + ×1 Rule-1 dup-import)"
    - "e959890bd resolve(bepinex): common.ts — smaller-diff (×2 reflow, process.platform untouched)"
    - "912a7ce9e resolve(bepinex): index.ts — smaller-diff (×3 reflow); extension closeout"
gates_active: 11
gates_total: 12
base_sha: e7abcc035
head_sha: 912a7ce9e
branch: v8.1/config-bucket
---

# Phase 33 Plan 02 — Wave B: modtype-bepinex Resolution Summary

3 conflict files in the `modtype-bepinex` extension resolved leaf-first via 3 atomic SSH-signed `resolve(bepinex): ...` commits. All commits on `v8.1/config-bucket`. Harness skip-mode (11 gates active, gate-12 conflict-marker check skipped per Pattern P3) GREEN after every commit. Per-extension typecheck = 0 non-marker errors at extension closeout.

## Counts vs Plan

|                                     | Plan target         | Actual     | Status                                              |
| ----------------------------------- | ------------------- | ---------- | --------------------------------------------------- |
| Conflict files resolved             | 3                   | 3          | match                                               |
| Resolve commits                     | 3                   | 3          | match                                               |
| Total conflict regions              | ~9                  | 12 (7+2+3) | drift — plan undercounted but stance hierarchy held |
| Harness gates active                | 11 (skip mode)      | 11         | match                                               |
| Per-extension typecheck at 0 errors | 1 (modtype-bepinex) | 1          | match                                               |
| SSH-signed commits                  | 3/3                 | 3/3        | match                                               |

## Per-file table

| File                                                  | Regions | Stance breakdown                                                                   | Commit SHA  | Typecheck                     |
| ----------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- | ----------- | ----------------------------- |
| `extensions/modtype-bepinex/src/bepInExDownloader.ts` | 7       | tier-5 smaller-diff ×6 + tier-4 Rule-1 HEAD-empty ×1                               | `0898601ab` | deferred to closeout          |
| `extensions/modtype-bepinex/src/common.ts`            | 2       | tier-5 smaller-diff ×2 (process.platform line 55 untouched — outside both regions) | `e959890bd` | deferred to closeout          |
| `extensions/modtype-bepinex/src/index.ts`             | 3       | tier-5 smaller-diff ×3                                                             | `912a7ce9e` | 0 non-marker errors (Route 1) |

## Resolution stance distribution (per D-33-02 5-tier hierarchy)

Across all 3 files / 12 conflict regions:

| Tier | Stance                                                  | Region count | Notes                                                                                                                                                                                                                                  |
| ---- | ------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Playbook gates (§1/§3/§10/BG3/Morrowind)                | 0            | All 5 playbook gates passive — none of these files host the gates                                                                                                                                                                      |
| 2    | NativePlugins-pattern guards (`process.platform`, etc.) | 0            | common.ts has 1 hit at line 55, but it sits OUTSIDE both conflict regions (R1 starts at 79, R2 at 207) — round-trip preservation only, no active fork-wins call needed                                                                 |
| 3    | New-v2.0.1-feature upstream-wins                        | 0            | `build.mjs` was the only candidate and it's out of scope per plan-check fix B1                                                                                                                                                         |
| 4    | Rule-1 dup-import HEAD-empty                            | 1            | bepInExDownloader.ts R1: upstream-side adds `import { IBepInExGameConfig, INexusDownloadInfo } from "./types"` between two existing imports, but that exact import already lives 2 lines below at the original location → drop the dup |
| 5    | Smaller-diff (HEAD/master-aligned)                      | 11           | Pure oxfmt formatter reflow — HEAD's compact form matches `fork/master`'s pre-merge layout verbatim across all 11 regions                                                                                                              |

All 3 resolved files are **byte-equal to `git show fork/master:<path>`** — verified via `diff -u /tmp/<file>.master <file> | wc -l == 0` for each.

## common.ts process.platform stance (recorded per plan)

`extensions/modtype-bepinex/src/common.ts` line 55 contains `? process.platform === "win32"` (a discriminator branch in the architecture-detection helper). This is a tier-2 fork-wins gate **only if a conflict region overlaps the line**.

Marker locations in pre-resolution common.ts:

- R1: lines 79-129
- R2: lines 207-222

Line 55 sits well above R1's start at 79. Both R1 and R2 are pure oxfmt formatter reflow on adjacent code (IL2CPP version guard + getDownload signature). Tier-2 fork-wins was **not invoked**; tier-5 smaller-diff applied to both regions. The `process.platform === "win32"` line round-trips unchanged — pre-resolve `grep -c 'process.platform' common.ts` = 1, post-resolve = 1.

Per D-33-02 stance hierarchy with stance recorded in commit `e959890bd` body.

## Bluebird Promise trap (TS1064) avoidance

None of the 3 files in scope import bluebird (`grep -n 'bluebird' extensions/modtype-bepinex/src/{bepInExDownloader,common,index}.ts` returns nothing). TS1064 trap not in play this wave.

## Harness state after each commit

12 harness gates total (11 active in skip-mode):

- §1 extension build guards: **OK** at every commit
- §3 LOOT casing in autosort.ts: **OK** at every commit
- §6 stagingDirHasFiles: **OK** at every commit
- §7a normalizeBackslashPaths: **OK** at every commit
- §7b mergeCaseConflictingDirs: **OK** at every commit
- §7c copy-loop replaceAll: **OK** at every commit
- §7d resolvePathCase(tempPath): **OK** at every commit
- 140a57217 resolvePathCase(dataPath, …) in LinkingDeployment.ts (≥3): **OK** at every commit
- §10 native binaries on disk: **OK** at every commit
- BG3 4 divine error classes in divineCore.ts: **OK** at every commit
- Morrowind migrate103 warning in migrations.js (≥1): **OK** at every commit

Gate 12 (no-conflict-markers under `mod_management/` + `extensions/`) skipped per Pattern P3 throughout the wave; the 3 modtype-bepinex files transitioned 12→0 markers across the wave; 870 markers remain in 180 files outside this wave (consistent with the wave plan).

## Per-extension typecheck (Pattern P4 Route 1)

| Extension       | Command                                   | Errors | Status |
| --------------- | ----------------------------------------- | ------ | ------ |
| modtype-bepinex | `pnpm --filter modtype-bepinex typecheck` | 0      | PASS   |

Filter: `grep -E 'error TS' | grep -v TS1185 | wc -l` per [D-33-06].

## Affects (forward-pointing)

- **Wave D1/D2 per-game extensions that consume BepInEx** see a clean dependee:
    - `game-baldursgate3` (BG3 collection install paths use BepInEx for some mods)
    - `game-kingdomcome-deliverance` (BIX-using Unity engine)
    - any other Unity-engine per-game extension registered with `addGameSupport({ autoDownloadBepInEx: true })`
- These will NOT need to coordinate with bepinex resolution during their own wave — extension graph is stable.

## Provides

- `modtype-bepinex` extension fully marker-free; entry/leaf surface coherent for downstream Unity-engine waves.
- Confirmed: 3 src files, 12 regions resolved across 3 atomic commits.
- Confirmed: zero typecheck regressions at extension closeout.

## Deviations / blockers

1. **Region count drift vs PLAN.md.** Plan listed regions as `7 + 1 + 1 = 9`; actual was `7 + 2 + 3 = 12`. RESEARCH §2 had also stated `7 + 1 + 1 = 9`, so this is upstream of plan. The stance hierarchy was scale-invariant — every drifting region was tier-5 formatter reflow (HEAD-wins) with one Rule-1 dup-import (HEAD-empty). No D-33-02 recalibration needed. No blocker.

2. **`build.mjs` correctly excluded.** Plan-check fix B1 (out-of-scope) honoured: `extensions/modtype-bepinex/build.mjs` carries zero markers in the live tree at wave time (`grep -c '^<<<<<<< ' extensions/modtype-bepinex/build.mjs` = 0). Not staged, not committed.

No architectural decisions surfaced. No checkpoints hit. No package-install gates triggered. No `--no-verify` use anywhere in the wave.

## Push status

**No-push confirmed.** Branch `v8.1/config-bucket` advanced from `e7abcc035` to `912a7ce9e` locally only. Operator pushes at phase end per playbook.

## Verification commands (for next agent)

```bash
git log --oneline e7abcc035..HEAD                                 # 3 resolve commits + this docs commit
for sha in $(git log -4 --pretty=%H); do
  git cat-file -p "$sha" | grep -q '^gpgsig ' && echo "$sha SIGNED" || echo "$sha NOT SIGNED"
done                                                              # all SIGNED
grep -rln '^<<<<<<< ' extensions/modtype-bepinex/                 # empty
bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check  # exit 0, 11 gates clean
pnpm --filter modtype-bepinex typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l                     # 0
```

## Self-Check: PASSED

- Created file exists: `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-02-SUMMARY.md`
- All 3 resolve commits visible in `git log e7abcc035..HEAD`: `0898601ab`, `e959890bd`, `912a7ce9e`
- All 3 resolve commits SSH-signed (`gpgsig` header present in each — verified)
- Harness skip-mode exit 0 after each commit (11 gates clean)
- Per-extension typecheck at closeout: 0 non-marker errors
- Zero residual conflict markers in `extensions/modtype-bepinex/`
- All 3 resolved files byte-equal to `fork/master` analogs
- Branch unchanged: `v8.1/config-bucket`
- No push performed
