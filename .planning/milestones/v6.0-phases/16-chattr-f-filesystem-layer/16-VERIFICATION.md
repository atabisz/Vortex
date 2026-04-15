---
phase: 16-chattr-f-filesystem-layer
verified: 2026-04-15T22:01:00Z
status: human_needed
score: 7/8
overrides_applied: 0
human_verification:
  - test: "Confirm ubuntu-latest and windows-latest CI matrix jobs in main.yml remain green after this phase's commits"
    expected: "Both CI jobs pass — no regression on Windows, chattr+F code correct on Linux"
    why_human: "Cannot run GitHub Actions CI locally; requires remote CI run on the three commits from this phase (7f427d2, d0287c8, 5020fa4)"
---

# Phase 16: chattr+F Filesystem Layer — Verification Report

**Phase Goal:** New mod staging directories on ext4-casefold filesystems use kernel-level case-insensitivity; all other filesystems and Windows are silently unaffected
**Verified:** 2026-04-15T22:01:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `applyChattrCasefold` resolves (never rejects) on every code path including success, EOPNOTSUPP, non-ext4, Flatpak, Windows, chattr-not-found, and verify failure | VERIFIED | All error paths call `resolve()`. Tests: "resolves without calling chattr when platform is win32", "resolves (no rejection) when chattr exits with error code", "resolves when chattr exit 0 but verify fails (ENOENT)" — all pass (13/13) |
| 2 | chattr is never invoked when `process.platform !== linux` | VERIFIED | `if (process.platform !== "linux") { return; }` at `fs.ts:137`. Test "resolves without calling chattr when platform is win32" confirms `mockChattr` not called — PASS |
| 3 | chattr is never invoked when `process.env.FLATPAK_ID` is set | VERIFIED | `if (process.env.FLATPAK_ID) { return; }` at `fs.ts:141`. Test "resolves without calling chattr when FLATPAK_ID is set" confirms — PASS |
| 4 | chattr is never invoked on non-ext4 filesystems (statfs type !== 0xEF53) | VERIFIED | `isExt4Filesystem` checks `stats.type === EXT4_MAGIC` (0xef53). Test "resolves without calling chattr when statfs type is not ext4" mocks btrfs (0x9123683e) — PASS |
| 5 | chattr is never invoked on non-empty directories | VERIFIED | `fsPromises.readdir` check returns early if `entries.length > 0`. Test "resolves without calling chattr when directory is non-empty" — PASS |
| 6 | After chattr exit 0, verify-casefold writes uppercase and reads lowercase to confirm kernel casefold is active | VERIFIED | `verifyCasefold` writes `__VORTEX_CASEFOLD_VERIFY`, reads `__vortex_casefold_verify`. Test "calls writeFile and access for casefold verify after chattr exit 0" asserts both paths — PASS |
| 7 | Notification fires exactly once per session on EOPNOTSUPP-on-ext4; never fires on non-ext4 or on success | VERIFIED | `hasShownCasefoldNotification` boolean prevents duplicate. Tests "fires notification exactly once on EOPNOTSUPP-on-ext4", "does NOT fire notification on second EOPNOTSUPP call (session dedup)", "does NOT fire notification on non-ext4 filesystem" — all PASS |
| 8 | 13 Vitest test cases pass covering all 7 CASE requirements | VERIFIED | `node_modules/.bin/vitest run --root src/renderer src/util/chattrCasefold.test.ts` output: 13 passed (13). Pre-existing fs.test.ts: 22 passed (22). |

**Score:** 8/8 truths verified

**Roadmap Success Criteria Coverage:**

| SC # | Criterion | Status | Evidence |
|------|-----------|--------|----------|
| SC-1 | chattr +F applied before any files written; ubuntu-latest and windows-latest CI green | PARTIAL | Code wiring verified (ensureDirWritableAsync calls applyChattrCasefold before canary write). CI jobs require human check (see Human Verification). |
| SC-2 | Silent fallback on EOPNOTSUPP/EINVAL/non-zero exit; Wine-prefix shim still handles case resolution | VERIFIED | All error paths resolve without rejection; Wine-prefix shim unchanged |
| SC-3 | Flatpak/Windows code path never reaches chattr | VERIFIED | Platform guard at line 137, Flatpak guard at line 141 |
| SC-4 | After chattr +F success, verify casefold active; fallback if verify fails | VERIFIED | `verifyCasefold` implemented and tested (test 10 and 13 in suite) |
| SC-5 | INFO log on success; DEBUG on fallback; no user-visible error dialog for normal fallback | VERIFIED | `log("info", "chattr+F casefold enabled...")` at line 197; `log("debug", ...)` at fallback paths; notification only on ext4-without-casefold-feature case |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/renderer/src/util/fs.ts` | applyChattrCasefold function, injectable seams, statfs cache, session notification flag | VERIFIED | All expected symbols present at lines 64–210. File is 1400+ lines, substantive. |
| `src/renderer/src/util/chattrCasefold.test.ts` | 13 unit tests covering CASE-05 through CASE-11 | VERIFIED | 321-line file with `describe("applyChattrCasefold"` and 13 `it(` cases. All pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/renderer/src/util/fs.ts` | `ensureDirWritableAsync` | `.then(() => applyChattrCasefold(dirPath))` | VERIFIED | Line 1390 confirmed. Inserted between `ensureDir` and canary write. |
| `src/renderer/src/util/fs.ts` | `child_process.execFile` | `_chattr` injectable seam defaulting to `execFileNative` | VERIFIED | `let _chattr: ExecFileFn = execFileNative` at line 72. `execFile as execFileNative` imported at line 37. |
| `src/renderer/src/util/chattrCasefold.test.ts` | `src/renderer/src/util/fs.ts` | `import * as fs from "./fs"` then `fs._setChattr`, `fs._setChattrNotifier`, `fs._resetChattrState` | VERIFIED | Test file imports `* as fs from "./fs"` at line 38; uses all three seam setters across tests. |
| `src/renderer/src/renderer.tsx` | `_setChattrNotifier` in bootstrap | `import { _setChattrNotifier, setTFunction } from "./util/fs"` then injection after `extensions.setStore(store)` | VERIFIED | Import at renderer.tsx:136; injection at lines 641-643 with CASE-11 comment at line 640. Correctly placed after `extensions.setStore(store)` at line 630. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `applyChattrCasefold` | `isExt4` (from `isExt4Filesystem`) | `fsPromises.statfs(dirPath)` — real syscall | Yes — reads filesystem type from OS kernel | FLOWING |
| `_chattrNotifier` | notification dispatch | `extensions.getApi().sendNotification?.()` injected from renderer.tsx | Yes — routes to real Vortex notification system | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 13 chattrCasefold tests pass | `node_modules/.bin/vitest run --root src/renderer src/util/chattrCasefold.test.ts` | 13 passed (13) | PASS |
| 22 pre-existing fs.test.ts tests still pass | `node_modules/.bin/vitest run --root src/renderer src/util/fs.test.ts` | 22 passed (22) | PASS |
| `applyChattrCasefold` called twice in fs.ts (definition + call site) | `grep -c "applyChattrCasefold" src/renderer/src/util/fs.ts` | 3 matches (definition, call in `ensureDirWritableAsync`, `verifyCasefold` internal call) | PASS |
| renderer.tsx import + injection wired | `grep "_setChattrNotifier" src/renderer/src/renderer.tsx` | 2 lines: import at 136, injection at 641 | PASS |
| Commits documented in SUMMARY exist in git | `git log --oneline 7f427d2 d0287c8 5020fa4` | All 3 commit SHAs resolve with correct messages | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CASE-05 | 16-01-PLAN.md | ext4 detection via `statfs` magic number before chattr attempt | SATISFIED | `isExt4Filesystem` at fs.ts:96 checks `stats.type === EXT4_MAGIC (0xef53)`. Test: "resolves without calling chattr when statfs type is not ext4" |
| CASE-06 | 16-01-PLAN.md | `chattr +F` applied to new empty staging directory before any files written | SATISFIED | `applyChattrCasefold` called in `ensureDirWritableAsync` before canary write; non-empty guard prevents re-application. Test: "calls chattr +F when ext4 empty dir linux no Flatpak" |
| CASE-07 | 16-01-PLAN.md | Silent fallback on any non-zero chattr exit; no user error | SATISFIED | All `chattrErr` paths call `resolve()` silently; Wine-prefix shim path unchanged. Tests: "resolves (no rejection) when chattr exits with error code", "resolves when which-chattr is not found" |
| CASE-08 | 16-01-PLAN.md | No-op on Windows; CI stays green | SATISFIED | `process.platform !== "linux"` guard. Test: "resolves without calling chattr when platform is win32" |
| CASE-09 | 16-01-PLAN.md | Skipped in Flatpak sandbox | SATISFIED | `process.env.FLATPAK_ID` guard. Test: "resolves without calling chattr when FLATPAK_ID is set" |
| CASE-10 | 16-01-PLAN.md | Verify casefold active after chattr exit 0; fallback if verify fails | SATISFIED | `verifyCasefold` writes uppercase, reads lowercase. Tests: "calls writeFile and access for casefold verify after chattr exit 0", "resolves when chattr exit 0 but verify fails (ENOENT)" |
| CASE-11 | 16-01-PLAN.md | INFO log on success; DEBUG on fallback; once-per-session notification on ext4-without-casefold | SATISFIED | `log("info",...)` at fs.ts:197; `log("debug",...)` at fallback paths; `hasShownCasefoldNotification` dedup. Tests: "fires notification exactly once on EOPNOTSUPP-on-ext4", "does NOT fire notification on second EOPNOTSUPP call (session dedup)", "does NOT fire notification on non-ext4 filesystem" |

All 7 CASE requirements satisfied. No orphaned requirements found.

### Anti-Patterns Found

No blocking anti-patterns detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `fs.ts` | 163 | `"using shim"` string in log call | Info | Legitimate log message, not a placeholder |

### Human Verification Required

#### 1. CI Matrix Green Check

**Test:** Push the three phase 16 commits (7f427d2, d0287c8, 5020fa4) through the GitHub Actions CI pipeline; confirm both `ubuntu-latest` and `windows-latest` jobs in `main.yml` pass.
**Expected:** Both OS jobs complete without failure. On Windows, `applyChattrCasefold` is a no-op (platform guard). On Linux, tests pass. No TypeScript compilation errors on either platform.
**Why human:** Cannot run GitHub Actions locally. The CI matrix is the canonical gate for Windows compatibility (roadmap SC-1 explicitly requires both CI matrix jobs green). The platform guard and test coverage provide strong evidence, but the CI run is the definitive check.

### Gaps Summary

No gaps found. All 8 must-have truths verified. All 7 CASE requirements satisfied. All key links confirmed wired. All 3 phase commits exist in git. Tests pass (13/13 chattrCasefold, 22/22 fs.test.ts regressions).

One human verification item remains: CI matrix confirmation for roadmap SC-1. This is a standard "needs CI run" check, not a code gap.

---

_Verified: 2026-04-15T22:01:00Z_
_Verifier: Claude (gsd-verifier)_
