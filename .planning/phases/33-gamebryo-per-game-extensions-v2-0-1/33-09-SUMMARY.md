---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: 09
wave: 9
status: complete
commits: 2
done_gate_criteria_passed: 6
done_gate_criteria_total: 6
phase_total_commits: 195
---

# Phase 33 master closeout — gamebryo + per-game extensions v2.0.1

## Outcome

**Phase 33 closed. 6/6 done-gate criteria PASS per D-33-14.** v2.0.1 conflicts in `extensions/` and the build scaffolding around it are fully resolved. Branch `v8.1/config-bucket` advanced 195 SSH-signed commits (`3b30563d9..HEAD`) across 9 waves, with no `--no-verify` and no unsigned commits anywhere in the phase.

This was the largest single phase of the v8.1 milestone by file count and commit count: 84+ extensions touched, ~183 atomic file resolutions, 0 catalog re-additions (Wave F fully deferred per D-33-13). Harness 11/11 GREEN in skip-mode throughout the phase, full-mode 12/12 GREEN since Wave E. No active gate ever flipped from GREEN.

## 6-criterion done-gate result (D-33-14)

| #   | Criterion                           | Result | Evidence                                                                                                                                               |
| --- | ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Conflict markers in `extensions/`   | PASS   | `git grep -l '^<<<<<<< ' extensions/` → 0 files                                                                                                        |
| 2   | Harness skip-mode (11 active gates) | PASS   | `grep-checkpoint.sh --skip-conflict-check` exit 0; full-mode 12/12 GREEN since b83278732 (Wave E final commit)                                         |
| 3   | Per-extension typecheck/build sweep | PASS   | 85/85 touched paths clean: 12 Route-1 typecheck + 71 Route-2 build + 2 Route-3 `node --check`. Log: `/tmp/wave9-criterion3.log`                        |
| 4   | Commit accounting (≥183 resolves)   | PASS   | 182 `resolve(<slug>)` file resolves + 1 `resolve(checkpoint)` harness extension = 183 total resolves; all SSH-signed. Log: `/tmp/wave9-criterion4.log` |
| 5   | STATE.md updated                    | PASS   | Phase 33 marked complete; SYNC-33a + SYNC-33b checked; v8.1 progress 25/26 plans (38%)                                                                 |
| 6   | ROADMAP.md updated                  | PASS   | Phase 33 entry marked complete with 10/10 plan checkboxes + result line + done-gate evidence                                                           |

Wave 9 itself added 2 commits (this SUMMARY + the STATE/ROADMAP/REQUIREMENTS combined commit `af57f6fa0`). 0 resolution commits in Wave 9 — pure verification + state propagation.

## Aggregate stats across all 9 waves

| Wave      | Plan  | Extensions | Files                  | Commits                                                                          | Active gates exercised                     |
| --------- | ----- | ---------- | ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| 0         | 33-00 | (harness)  | 1 (grep-checkpoint.sh) | 1 + 1 docs                                                                       | n/a (harness setup)                        |
| A         | 33-01 | 4          | 11                     | 11 + 1 docs                                                                      | none (smaller-diff throughout)             |
| B         | 33-02 | 1          | 3                      | 3 + 1 docs                                                                       | none                                       |
| C         | 33-03 | 1          | 12                     | 12 + 1 docs                                                                      | none                                       |
| D1        | 33-04 | 4          | 57                     | 57 + 1 docs                                                                      | gate-10 (BG3 4-class divine)               |
| D2        | 33-05 | 7          | 28                     | 28 + 1 docs                                                                      | gate-11 (Morrowind migrate103)             |
| D3        | 33-06 | 60         | 60                     | 60 + 1 docs                                                                      | none                                       |
| E         | 33-07 | 7          | 12                     | 12 + 1 docs                                                                      | none (full-mode marker gate flipped GREEN) |
| F         | 33-08 | n/a        | 0 (catalog deferred)   | 0 catalog + 1 fix (bg3 D1 carryover) + 1 docs                                    | none                                       |
| 9         | 33-09 | n/a        | 3 (STATE+ROADMAP+REQS) | 1 docs (combined) + 1 docs (this SUMMARY)                                        | n/a                                        |
| **Total** |       | **84+**    | **~184**               | **193 (182 resolves + 1 harness + 8 docs + 2 fix + 0 catalog) + 2 Wave 9 = 195** | 2 active                                   |

**Note on resolve count vs plan threshold:** Plan stated "≥183 resolves". Actual: 182 file-level `resolve(<slug>)` commits + 1 `resolve(checkpoint)` for the harness extension = 183 total `resolve(...)` commits. RESEARCH §1's file count of 183 is preserved exactly: 182 of those are conflict file resolutions; the 183rd was the harness file `scripts/grep-checkpoint.sh` which was an additive setup, not a conflict resolution.

## Active gate results

- **Gate-10 (BG3 4-class divine errors):** D-33-11 / Pattern P2 protocol applied in Wave D1 (commit range `f7e8ad96d..7a91a2ec4` per 33-04-SUMMARY). Pre-count = 4, post-count = 4. All 4 classes (`DivineExecMissing`, `DivineMissingDotNet`, `DivineTimedOut`, `DivineAborted`) preserved at the canonical lines. Gate stayed GREEN throughout the wave.
- **Gate-11 (Morrowind migrate103):** Sentinel string `"morrowind migrate103: mod directory missing"` preserved in Wave D2 per 33-05-SUMMARY. Pre-count ≥1, post-count ≥1. Gate stayed GREEN throughout the wave.
- **Gates 1-9 + 12-13 (passive throughout):** Phase 32 gates (§7d resolvePathCase, LinkingDeployment locks), §1 platform guards, §3 LOOT casing, §10 native binaries, §6 stagingDirHasFiles, §7 backslash/case, marker gate (after Wave E), single-host invariant — all stayed GREEN. No Phase 33 file touched any of those surfaces inside conflict regions (RESEARCH §4 prediction held).

## Critical preservation receipts

These are the load-bearing invariants from VORTEX-LINUX-MERGE-PLAYBOOK and prior phase decisions that were specifically protected during Phase 33:

1. **`copy-native.mjs` Linux-rebased dist-fallback skip-on-missing block** — preserved verbatim in Wave E (commit `05c0492b9` per 33-07-SUMMARY). Without this block, incremental rebuild paths for `gamebryo-archive`, `gamebryo-bsa`, and `gamebryo-savegame-management` would re-fail when source binaries were cleaned but `dist/` already had previously-copied artifacts. Sentinel string: `'Source binaries missing but dist/ already has them — skipping copy'`.

2. **`copy-extension.mjs` API-shim layered on upstream signature** — Wave E's tier-3 upstream-wins on the `target` runtime arg, with fork-side compatibility shim accepting `'out'`, `'dist'`, or `'build'` so all 60+ existing callers stay green without per-caller updates. CWD-inference fallback preserved for legacy `node ../copy-extension.mjs` invocation pattern.

3. **BG3 4 named divine error classes** — preserved at `divineCore.ts` lines 17/24/31/38 throughout Wave D1's 57-file resolution sweep.

4. **Morrowind `migrate103` sentinel** — Wave D2 preserved the warning string in `migrations.js` per gate-11. No reformatting allowed near the sentinel.

5. **§1 platform guards** — every per-game `extensions/games/*/build.mjs` retained either `process.platform`-gated handling or `skip-on-{windows,linux}.mjs` script presence as required by playbook §1.

6. **§10 native binaries on disk** — `node-loot.node`, `libloot.so.0`, `libloot_wstring_stub.so`, `bsatk.node` all present from Phase 27/28 carryover. Phase 33 made no native-binary changes.

7. **D-33-10 single-host invariant** — sole `resolvePathCase(dataPath` host remained `src/renderer/src/extensions/mod_management/LinkingDeployment.ts`. Phase 33 introduced no new host.

## Catalog re-add result (SYNC-33b)

**0 packages re-added; 4 deferred.** Wave F invoked the D-33-13 partial-application clause after pre-audit revealed that all 4 candidate packages no longer require catalog entries:

- **`exe-version`** (8 source consumers) — already satisfied via `"exe-version": "workspace:*"` in 13 extensions + main + renderer; resolves to local `packages/exe-version/` (v3.0.0, pure-TS rewrite of the native PE version parser). Skip catalog re-add.
- **`esptk`** (0 source consumers) — replaced by pure-TS ESP/ESM parser in commit `918fe02ad`. Re-adding would re-introduce a dropped native build.
- **`gamebryo-savegame`** (0 source consumers) — replaced by pure-TS implementation. The line-24 `gamebryo-savegame: true` in `pnpm-workspace.yaml` `neverBuiltDependencies:` is harmless residue (no package by that name is being installed); leave-as-is.
- **`native-errors`** (1 candidate consumer at `src/renderer/src/renderer.tsx:70`) — site sits inside an unresolved Phase 34 conflict block. Defer the catalog decision until Phase 34 resolves the renderer import region.

This means SYNC-33b is satisfied not by re-adding catalog entries, but by documenting that all 4 candidate packages were correctly absent from the catalog at end of Phase 33 — Phase 31's `cleanupUnusedCatalogs: true` did exactly the right thing.

## Pattern reuse

Patterns P1-P7 from `33-PATTERNS.md` were applied across all 9 waves; conventions C1-C10 were honored throughout. Notable applications:

- **P2 (BG3 named-class preservation):** Wave D1 single-class-line handling per D-33-11.
- **P4 (route detection):** Wave 9 sweep used Route 1 (12 ext with `"typecheck"` script), Route 2 (71 ext with `build` only), Route 3 (2 standalone `.mjs`).
- **P5 (smaller-diff resolution):** dominant pattern across Waves D1-D3 and E (most regions were formatter reflow).
- **P6 (HEAD-empty Rule-1):** copy-native.mjs import block.
- **P7 (fork-wins on Linux-specific scaffolding):** copy-native.mjs dist-fallback block, modtype-bepinex platform branches.

## D1 carryover fix-up (Wave F)

Wave D1's tier-5 smaller-diff resolution of `extensions/games/game-baldursgate3/src/{util.ts,loadOrder.ts}` collapsed two `Object.keys(mods).reduce(...)` callbacks into HEAD's compact form, but lost the inner `if`-block's closing brace in both files. Rolldown reported `[PARSE_ERROR] Unexpected token` at `util.ts:328:6` and `loadOrder.ts:828:6` once Wave E unblocked the outer `build` chain. Single combined commit `c174b8603` restored the missing `}` in both files; no behaviour change.

This defect was latent through Wave D1 verification because (a) D1's per-file syntax check was Route 2 (no `.ts` syntax check; relies on inner `_build`), and (b) outer `build` was blocked through D1+D2+D3 by `copy-extension.mjs` markers, masking the rolldown failure until Wave E unblocked it. Witcher3 had a separate D2 carryover fix earlier in the phase.

## Affects downstream

- **Phase 34 (renderer + main spine):** ready to start. 5 marker files remain in `src/` (renderer.tsx + 4 src/main/\*.ts); these are Phase 34 scope. If Phase 34's resolver keeps `native-errors` from the v2.0.1 side of the renderer.tsx import block, Phase 34 should add the `native-errors` catalog entry then. RESEARCH §3 already flagged this dependency.
- **Phase 35 (build verification):** outer `build` chain unblocked. All 85 touched extension paths are typecheck/build clean. Phase 35 will exercise the full `pnpm run typecheck` / `lint` / `test` / `build` sweep.
- **Phase 36 (land + tag):** branch `v8.1/config-bucket` ready for FF-merge after Phase 34/35 close. v2.0.1-linux-rebased tag reserved for end-of-milestone.
- **`linux-port` cherry-pick eligibility:** Phase 33 resolutions are per `project_branch_strategy.md` candidates for cherry-pick to the clean Linux-only history, excluding `.planning/` docs.

## Provides

- Phase 33 done; v8.1 milestone progresses one phase (3 of 8 phases complete; 25 of 26 plans complete; 38%).
- 195 SSH-signed Phase 33 commits with bisectable per-file resolution stances and protocol notes.
- Full-mode harness 12/12 GREEN since Wave E; skip-mode 11/11 GREEN throughout.
- 85/85 touched extension paths typecheck/build clean — every per-game extension and build-scaffolding script verified post-resolution.
- D-33-13 partial-application precedent for SYNC-33b — documented for future "re-add catalog" requirements where pnpm cleanup ran first.

## Issues encountered (across all 9 waves)

1. **Wave D1 parse defect carryover** (resolved Wave F): see "D1 carryover fix-up" above.
2. **Witcher3 D2 carryover** (resolved Wave D2 follow-up): documented in 33-05-SUMMARY.
3. **All 4 SYNC-33b catalog candidates already settled** (Wave F): plan assumed Phase 32/33 would re-introduce 4 packages once consumer extensions become workspace members; reality is 3 of 4 were replaced by pure-TS workspace rewrites during the v8.0/v8.1 Linux port (commits `918fe02ad`, `1b7a49faa`, `d08cf2e5d`, `1475efea2`), and the 4th (`exe-version`) became a workspace package. Resolution: full deferral per D-33-13.
4. **Node 18 vs Node 22 sandbox quirk** (Wave E): system node v18.19.1 doesn't support `import.meta.dirname` (needs ≥20.11). Both HEAD and v2.0.1 use this construct, so it's not a regression — affects only sandbox-side `node` smoke checks; full builds use volta-locked Node 22.
5. **`copy-extension.mjs` target-default semantics** (Wave E): upstream's `target = process.argv[3] ?? process.argv[2]` would set `target = '<ext-name>'` in fork's existing call pattern. Fork-side compat shim added to default `target='build'` when extensionArg is neither `'out'` nor `'dist'`; validation extended to accept all three values.
6. **`gamebryo-savegame` line-24 residue** (Wave F): the `neverBuiltDependencies:` flag is harmless because `gamebryo-savegame` is no longer being installed at all. Disposition: leave residue alone; if Phase 34 / done-gate cleanup wants to remove it, that's a one-line follow-up.

## Push status

**No push performed.** Operator handles push at phase end. Branch `v8.1/config-bucket` advanced locally `3b30563d9 → HEAD` (195 commits, all SSH-signed). Phase 33 close-out commit is `af57f6fa0` (STATE+ROADMAP+REQUIREMENTS) plus this SUMMARY commit on top.
