---
phase: 33-gamebryo-per-game-extensions-v2-0-1
wave: D2
plan: 05
status: complete
commits: 29
extensions_resolved: [game-kingdomcome-deliverance, game-spyroreignitedtrilogy, game-morrowind, game-codevein, game-bloodstainedritualofthenight, game-bladeandsorcery, game-untitledgoose]
---

# Wave D2 Summary — Medium per-game extensions

## Outcome

7/7 medium per-game extensions resolved. 28 atomic SSH-signed `resolve(<slug>): ...` commits + 1 SUMMARY commit. Harness skip-mode 11/11 GREEN after every commit. Full-mode harness 12/12 active gates GREEN — gate-11 (Morrowind `migrate103` sentinel) preserved at line 41 (POST_COUNT=1 ≥ harness threshold of ≥1). Gate-13 (BG3 divine error classes) remains GREEN unchanged. Per-extension closeout typecheck/build returned 0 non-marker errors for all 6 ts/tsx extensions; bas inner `_build` GREEN (outer `build` chain blocked by `extensions/copy-extension.mjs` markers — known Wave E scope).

Range: `104bf4b36..44aaafb87` on `v8.1/config-bucket` (28 resolution commits + this SUMMARY = 29 total).

## Per-extension breakdown

| Extension | Slug | Files | Regions (approx) | Closeout | Notable stances |
|-----------|------|-------|------------------|----------|-----------------|
| game-kingdomcome-deliverance | kcd | 5 | ~12 | Route 2 build OK | All tier-5 smaller-diff (HEAD compact forms) |
| game-spyroreignitedtrilogy | spyro | 4 | ~14 | Route 2 build OK | All tier-5 smaller-diff |
| game-morrowind | morrowind | 4 | ~10 | Route 2 build OK | migrations.js Region 2 tier-1 fork-wins (gate-11 active) — preserves `'morrowind migrate103: mod directory missing'` warning. Other regions tier-5 |
| game-codevein | codevein | 4 | ~10 | Route 2 build OK | All tier-5 smaller-diff |
| game-bloodstainedritualofthenight | bloodstained | 4 | ~12 | Route 2 build OK | All tier-5 smaller-diff (HEAD single-line wins) |
| game-bladeandsorcery | bas | 4 (.js) | ~17 | Route 3 `node --check` ✓ + inner `_build` ✓ | All tier-5 smaller-diff. All files import bluebird; .js (no type annotations) → bluebird trap N/A |
| game-untitledgoose | untitledgoose | 3 | ~5 | Route 2 build OK | index.ts Region 2 tier-1 fork-wins on Linux Epic guard (`process.platform !== 'win32'` branch) — playbook §1. Other regions tier-5 |

**Total:** 28 files, ~80 regions across 7 extensions.

## Active gate verification

**Gate-11 Morrowind migrate103 (full-mode harness):** GREEN after `67dfac96f resolve(morrowind): migrations.js`. Sentinel `'morrowind migrate103: mod directory missing'` preserved at line 41. PRE_COUNT=2 reflected the duplicated string on both sides of conflict markers (single canonical log call appearing twice in working tree). POST_COUNT=1 is the correct logical count after deduplication; harness threshold (≥1) satisfied.

**Gate-13 BG3 divine error classes:** Unchanged from D1 — still GREEN (4 fork-named classes intact).

**§1/§3/§6/§7/§10 playbook gates:** All GREEN (no D2 file touches these surfaces except untitledgoose Linux Epic guard, which was preserved tier-1 fork-wins).

**Skip-mode harness after every commit:** exit 0 (11 active gates GREEN; gate-12 marker count gate remains expected pre-resolution-completion baseline; D3/E scope still carries markers).

## Closeout typechecks

| Extension | Route | Errors |
|-----------|-------|--------|
| game-kingdomcome-deliverance | Route 2 (build) | 0 non-marker |
| game-spyroreignitedtrilogy | Route 2 (build) | 0 non-marker |
| game-morrowind | Route 2 (build) | 0 non-marker |
| game-codevein | Route 2 (build) | 0 non-marker |
| game-bloodstainedritualofthenight | Route 2 (build) | 0 non-marker |
| game-bladeandsorcery | Route 3 (`node --check`) + inner `_build` | All 4 .js files OK; rolldown + asset copy pass |
| game-untitledgoose | Route 2 (build) | 0 non-marker |

bas outer `build` chain blocked by `extensions/copy-extension.mjs` markers (Wave E scope, not a regression).

## Issues encountered

1. **Multi-sub-agent dispatch (same pattern as D1).** 4 sequential sub-Engineer dispatches (Sub-A/B/C/D), each returning truncated summaries while leaving 1 mid-edit file uncommitted. Recovery: orchestrator inspected `git status` + `git log` after each truncation, finished mid-edit files directly (untitledgoose/index.ts, morrowind/index.ts, bloodstained/index.ts, all 4 bas .js files in final pass). All resolution work landed cleanly; truncations only affected sub-agent summaries (commits always survived).

2. **Gate-11 PRE/POST count semantic.** Plan invariant required `POST_COUNT ≥ PRE_COUNT`. PRE_COUNT=2 because the same warning string appeared on both HEAD and v2.0.1 sides of conflict markers (one log call, formatted differently). POST_COUNT=1 is the canonical post-resolution count. Harness gate-11 threshold (≥1) is the authoritative check and PASSES; the plan's `POST ≥ PRE` clause was over-strict for symmetric same-content conflicts. Recorded in migrations.js commit body for downstream auditors.

3. **One §1 surface caught proactively.** Sub-A flagged `process.platform !== 'win32'` Linux Epic-launcher guard in `untitledgoose/src/index.ts` (Region 2). Resolved tier-1 fork-wins as required by D-33-02 stance order. Title format: `resolve(untitledgoose): src/index.ts — fork-wins on Linux Epic guard + smaller-diff (barrel)`.

## Affects downstream

- **Wave D3 (33-06):** 60 light per-game extensions unblocked.
- **Wave E (33-07):** `extensions/copy-extension.mjs` + `extensions/copy-native.mjs` still carry markers — known scope, blocks outer `build` chain (affects bas closeout reporting only; not a regression).
- **Wave F (33-08):** catalog re-add still pending consumer evidence audit.
- **Phase 36 land step:** branch ready for FF-merge after Waves D3+E+F + done-gate.

## Provides

- 7 fully-resolved medium per-game extensions: game-kingdomcome-deliverance, game-spyroreignitedtrilogy, game-morrowind, game-codevein, game-bloodstainedritualofthenight, game-bladeandsorcery, game-untitledgoose.
- Morrowind `migrate103` warning sentinel pinned to fork-named log call (gate-11 active).
- untitledgoose Linux Epic-launcher guard preserved (playbook §1 surface).
- 28 bisectable atomic commits with stance recorded per file.
- 0 outstanding bluebird `:Promise<void>` TS1064 traps introduced.

## Push status

**No push performed.** Operator handles push at phase end. Branch `v8.1/config-bucket` advanced locally `104bf4b36 → 44aaafb87` (28 resolution commits) → SUMMARY commit (this file).
