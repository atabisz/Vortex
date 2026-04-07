---
phase: 13-save-transfer
verified: 2026-04-07T07:20:00Z
status: human_needed
score: 4/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Transfer a save file from one profile to another using the save manager UI on Linux"
    expected: "The save file appears in the destination profile's save list and the source save is unmodified"
    why_human: "End-to-end UI flow requires a running Vortex on Linux with at least two profiles that have local saves enabled; cannot verify file copy result programmatically"
  - test: "Attempt transfer for Skyrim SE and Fallout 4 (Wine/Proton prefix paths)"
    expected: "Both games transfer saves without ENOENT or case-mismatch errors"
    why_human: "Requires real Wine/Proton prefix installations of both games — cannot simulate actual on-disk casing resolution without the real filesystem"
  - test: "Open save transfer picker when no profiles have local saves enabled"
    expected: "Italicised message 'No profiles with local saves found. Enable local saves in Profile Settings to use save transfer.' appears below the dropdown"
    why_human: "Requires rendering the Electron UI to verify visual presentation and correct conditional trigger"
---

# Phase 13: Save Transfer Verification Report

**Phase Goal:** Users can transfer saves between Vortex profiles on Linux using the existing save manager UI
**Verified:** 2026-04-07T07:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Plan must-haves)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `copyAsync` resolves on-disk casing for Wine prefix source paths before copying | VERIFIED | `fs.ts` line 894: `isWinePrefixPath(src)` guard + `resolveCaseIfWinePrefix(src)` chain; test confirms via `resolvePathCase` mock spy |
| 2 | `renameAsync` resolves on-disk casing for Wine prefix source paths before renaming | VERIFIED | `fs.ts` line 1012: same guard pattern; test confirms |
| 3 | `ensureDirAsync` passes through unchanged when destination does not exist on disk | VERIFIED | `fs.ts` lines 772-778: resolvedPath chain wraps both `ensureDir` and `ensureDirInt` paths; `resolvePathCase` documented to return input unchanged for non-existent paths (D-02) |
| 4 | Non-Wine-prefix paths are unaffected by case-folding in `copyAsync`/`renameAsync`/`ensureDirAsync` | VERIFIED | Each function guards with `isWinePrefixPath`; tests assert `resolvePathCase` is NOT called for `NORMAL_PATH` and on `win32` platform |
| 5 | Empty transfer picker shows italicised helper message when no eligible profiles exist | VERIFIED | `SavegameList.tsx` lines 290-298: `profileOptions.length === 0 && !activeHasLocalSaves` condition renders `<i>{t("No profiles with local saves found...")}</i>` |

**Score:** 5/5 plan must-haves verified

### Roadmap Success Criteria

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|---------|
| 1 | User can select a save and transfer it to another active Vortex profile | ? NEEDS HUMAN | Mechanism implemented: `transferSavegames.ts` line 23 uses `fs.copyAsync`/`renameAsync` which now case-fold; end-to-end UI flow requires running system |
| 2 | Transferred save appears in destination profile's save list after transfer | ? NEEDS HUMAN | Depends on `onTransferSavegames` completing and UI re-render — cannot verify without running app |
| 3 | Source save not modified or deleted by transfer | ? NEEDS HUMAN | `keepSource` flag in `transferSavegames.ts` controls copy vs rename; correctness requires runtime test |
| 4 | Transfer works for Skyrim SE and Fallout 4 on Linux (Wine prefix paths) | ? NEEDS HUMAN | Case-folding path is exercised; real Wine prefix path resolution requires actual game installations |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/renderer/src/util/fs.ts` | Case-folding wrappers for `copyAsync`, `renameAsync`, `ensureDirAsync` | VERIFIED | All three functions contain `resolveCaseIfWinePrefix` guards at lines 894, 1012, 772 |
| `src/renderer/src/util/fs.test.ts` | Vitest coverage for case-folding | VERIFIED | `describe("copyAsync")`, `describe("renameAsync")`, `describe("ensureDirAsync")` present at lines 169, 195, 215; 3 tests each; 22 total tests pass |
| `extensions/gamebryo-savegame-management/src/views/SavegameList.tsx` | Empty-state message in transfer picker | VERIFIED | Lines 290-298 contain exact string "No profiles with local saves found..." wrapped in `<i>` and `t()` call |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `extensions/gamebryo-savegame-management/src/util/transferSavegames.ts` | `src/renderer/src/util/fs.ts` | `fs.copyAsync`/`fs.renameAsync` | WIRED | Line 23: `const operation = keepSource ? fs.copyAsync : fs.renameAsync` — operations use updated wrappers |
| `extensions/gamebryo-savegame-management/src/index.ts` | `src/renderer/src/util/fs.ts` | `fs.ensureDirAsync(destSavePath)` | WIRED | Line 631: `fs.ensureDirAsync(destSavePath)` — uses updated wrapper |

### Data-Flow Trace (Level 4)

Level 4 trace applies to `SavegameList.tsx` (renders dynamic profile data).

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `SavegameList.tsx` | `profileOptions` | `Object.keys(profiles).filter(...)` from Redux props | Yes — Redux state populated from real profile store | FLOWING |
| `SavegameList.tsx` | `activeHasLocalSaves` | `util.getSafe(currentProfile, ["features", "local_saves"], false)` from Redux props | Yes — reads persisted profile feature flags | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All fs.test.ts tests pass including new case-folding tests | `pnpm vitest run src/util/fs.test.ts` (from `src/renderer/`) | 22 passed (22) | PASS |
| `resolveCaseIfWinePrefix` present in 6+ locations in `fs.ts` | `grep -c "resolveCaseIfWinePrefix" src/renderer/src/util/fs.ts` | 7 | PASS |
| Empty-state string present in `SavegameList.tsx` | `grep "No profiles with local saves found" ...SavegameList.tsx` | Found at line 294 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| SAVE-05 | 13-01-PLAN.md | User can transfer saves between Vortex profiles on Linux | PARTIAL — needs human UAT | Implementation complete; runtime verification required. **Note:** REQUIREMENTS.md still shows SAVE-05 as `[ ] Pending` — should be updated to `[x]` after human UAT confirms. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `SavegameList.tsx` | 29 | `const placeholder: string = "------"` | INFO | Pre-existing dropdown separator string; not from phase 13; not a stub |

No blockers or warnings from phase 13 changes.

### Human Verification Required

#### 1. End-to-End Save Transfer on Linux

**Test:** On a Linux machine running Vortex, create two profiles for Skyrim SE (or Fallout 4) with local saves enabled on at least one profile. Select a save in the save manager, click Transfer, choose the destination profile, confirm.

**Expected:** The save file appears in the destination profile's save directory (under the Wine prefix path). No ENOENT or case-mismatch errors. The source save remains unmodified (copy mode) or is absent (move mode).

**Why human:** Requires a running Vortex instance on Linux with real Wine/Proton prefix game installations. The case-folding code path is exercised only when an actual `compatdata/.../pfx/` path is resolved.

#### 2. Skyrim SE and Fallout 4 Specifically

**Test:** Repeat the transfer test for both Skyrim SE and Fallout 4 with their real Wine prefix paths (e.g. `~/.local/share/Steam/steamapps/compatdata/489830/pfx/...`).

**Expected:** Both games transfer saves successfully. The `isWinePrefixPath` check returns true for both game paths. `resolveCaseIfWinePrefix` resolves any save filename casing mismatches.

**Why human:** Requires actual game installations with real on-disk casing to validate the path resolution logic end-to-end.

#### 3. Empty-State Transfer Picker

**Test:** Open Vortex on Linux. Navigate to the save manager for a game. Click Transfer. Ensure no other profiles have local saves enabled (or there are no other profiles). Observe the transfer picker UI.

**Expected:** The italicised message "No profiles with local saves found. Enable local saves in Profile Settings to use save transfer." appears below the profile dropdown, with no selectable options in the dropdown.

**Why human:** Requires rendering the Electron UI to verify visual presentation, italics styling, and exact conditional trigger (`profileOptions.length === 0 && !activeHasLocalSaves`).

### Gaps Summary

No automated gaps found. All plan must-haves are verified in code. The remaining 3 human verification items are runtime/visual behaviors that cannot be confirmed programmatically.

**Documentation note:** REQUIREMENTS.md still marks SAVE-05 as `[ ] Pending` at the traceability table. After human UAT confirms the transfer works, update REQUIREMENTS.md to `[x]` and change the traceability row from "Pending" to "Complete".

---

_Verified: 2026-04-07T07:20:00Z_
_Verifier: Claude (gsd-verifier)_
