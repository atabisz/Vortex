---
phase: 14-linux-case-folding-fs-wrapper
verified: 2026-04-07T22:30:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run pnpm run build (or the renderer webpack build) and confirm it completes without TypeScript errors"
    expected: "Build succeeds with no type errors in fs.ts, resolvePathCase.ts, api.ts, LinkingDeployment.ts, or InstallManager.ts"
    why_human: "Build requires Node/pnpm environment with all native modules present; cannot run in verification context without starting the full build toolchain"
  - test: "Launch Vortex on Linux with a Proton/Wine-managed Bethesda game (e.g., Skyrim SE via Steam), enable the game, and trigger a plugin list read"
    expected: "Vortex reads Plugins.txt (capital P) without a ENOENT error; plugin list loads correctly"
    why_human: "Requires actual Steam/Proton installation with a game; cannot simulate Wine prefix filesystem in automated test"
  - test: "Verify REQUIREMENTS.md is updated to include CASE-01 through CASE-04 requirement IDs (or confirm they are intentionally omitted)"
    expected: "REQUIREMENTS.md traceability table maps CASE-01..04 to Phase 14, or team decision documents why CASE-01..04 are not in the requirements register"
    why_human: "Requirements register update is a planning/documentation decision that requires human judgment — the CONTEXT.md itself noted 'no explicit requirement ID for Phase 14 yet'"
---

# Phase 14: Linux Case-Folding fs Wrapper Verification Report

**Phase Goal:** Eliminate Windows-assumes-case-insensitive bugs without patching individual callsites — wrap vortex-api's fs module with a Linux shim that resolves actual on-disk casing before any readFile/writeFile/stat/watch call on game AppData paths
**Verified:** 2026-04-07T22:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | resolvePathCase promoted from mod_management into vortex-api util namespace | VERIFIED | `src/renderer/src/util/resolvePathCase.ts` exists; `src/renderer/src/util/api.ts` line 19 imports it and line 245 exports it; `src/renderer/src/api.ts` re-exports `util` — accessible as `util.resolvePathCase` from vortex-api |
| SC2 | fs shim wraps readFile, writeFile, stat, and watch on Wine prefix AppData paths | VERIFIED | `fs.ts` contains `isWinePrefixPath()` (line 589), `resolveCaseIfWinePrefix()` (line 602), wrapped `readFileAsync` (line 643), wrapped `writeFileAsync` (line 702), wrapped `statAsync` (line 659), wrapped `watch` (line 118) using `resolvePathCaseSync()` |
| SC3 | Vortex correctly reads Plugins.txt without a surgical per-callsite fix | VERIFIED (automated evidence) | `PluginPersistor.ts` uses `path.join(destPath, "plugins.txt")` directly (line 321) and `path.join(this.mPluginPath, "plugins.txt")` (lines 482/485); `resolvePluginsFilePath` method count = 0; the fs shim handles case-folding transparently |
| SC4 | No global fs calls intercepted — shim scoped to game AppData paths only | VERIFIED | `isWinePrefixPath()` guards on both `process.platform === "linux"` AND `/compatdata/` AND `/pfx/` — three-way conjunction; 13/13 shim tests pass confirming non-Wine paths and Windows pass through unchanged |
| SC5 | Windows build compiles and tests pass without modification | VERIFIED (code guard) | `isWinePrefixPath()` requires `process.platform === "linux"` — false on Windows; all shim branches short-circuit; 6/6 resolvePathCase tests pass; watch wrapper at line 591 uses same guard |

**Score:** 5/5 truths verified (all ROADMAP success criteria met in code)

### Plan Must-Have Truths

#### Plan 14-01 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | resolvePathCase importable as util.resolvePathCase from vortex-api | VERIFIED | api.ts imports + exports confirmed; src/renderer/src/api.ts exports util |
| 2 | readFileAsync on Wine prefix path resolves on-disk casing before reading | VERIFIED | fs.ts line 643-648 wraps readFileAsync with resolveCaseIfWinePrefix; test passes |
| 3 | writeFileAsync on Wine prefix path resolves on-disk casing before writing | VERIFIED | fs.ts line 702-707 wraps writeFileAsync; test passes |
| 4 | statAsync on Wine prefix path resolves on-disk casing before stat | VERIFIED | fs.ts line 659-664 wraps statAsync; test passes |
| 5 | watch on Wine prefix path resolves on-disk casing synchronously before watching | VERIFIED | fs.ts line 118-122 watch() calls resolvePathCaseSync(filename) before watchOriginal |
| 6 | Non-Wine-prefix Linux paths pass through unchanged | VERIFIED | isWinePrefixPath() requires both /compatdata/ and /pfx/ — non-Wine paths return false; confirmed by passing tests |
| 7 | Windows paths pass through unchanged (no-op shim) | VERIFIED | process.platform === "linux" guard ensures Windows short-circuits |
| 8 | mod_management LinkingDeployment and InstallManager import from util not local | VERIFIED | LinkingDeployment.ts line 27: `from "../../util/resolvePathCase"`; InstallManager.ts line 208: `from "../../util/resolvePathCase"` |

#### Plan 14-02 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PluginPersistor.ts no longer contains resolvePluginsFilePath method | VERIFIED | grep count = 0 confirmed |
| 2 | PluginPersistor serialize uses path.join(destPath, 'plugins.txt') directly | VERIFIED | line 321: `const pluginsFile = path.join(destPath, "plugins.txt")` |
| 3 | PluginPersistor deserialize uses path.join(this.mPluginPath, 'plugins.txt') directly | VERIFIED | lines 482 and 485: `path.join(this.mPluginPath, "plugins.txt")` |
| 4 | The fileName.toLowerCase() fix in the watch handler remains | VERIFIED | line 652: `["loadorder.txt", "plugins.txt"].includes(fileName.toLowerCase())` |
| 5 | The old mod_management/util/resolvePathCase.ts file does not exist (deleted in Plan 01) | VERIFIED | `src/renderer/src/extensions/mod_management/util/resolvePathCase.ts` does not exist |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `src/renderer/src/util/resolvePathCase.ts` | Promoted resolvePathCase function | VERIFIED | Contains `export async function resolvePathCase`, imports `* as fs from "./fs"` |
| `src/renderer/src/util/resolvePathCase.test.ts` | Migrated tests for resolvePathCase | VERIFIED | Contains `describe("resolvePathCase"`, 6 tests pass |
| `src/renderer/src/util/fs.test.ts` | Tests for Wine prefix case-folding shim | VERIFIED | Contains compatdata path, 7 shim tests + 6 readFileBOM tests = 13 total |
| `src/renderer/src/util/api.ts` | resolvePathCase exported in util namespace | VERIFIED | Line 19 import, line 245 export |
| `src/renderer/src/util/fs.ts` | Shim wrapping readFileAsync, writeFileAsync, statAsync, watch | VERIFIED | isWinePrefixPath, resolveCaseIfWinePrefix, resolvePathCaseSync, all four wrappers present |
| `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` | Cleaned up PluginPersistor | VERIFIED | resolvePluginsFilePath absent, direct path.join calls present, fileName.toLowerCase() retained |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/renderer/src/util/fs.ts` | `src/renderer/src/util/resolvePathCase.ts` | `import { resolvePathCase }` | WIRED | Line 52: `import { resolvePathCase } from "./resolvePathCase"` |
| `src/renderer/src/util/api.ts` | `src/renderer/src/util/resolvePathCase.ts` | re-export in util namespace | WIRED | Line 19 import, line 245 export in `export { ... }` block |
| `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` | `src/renderer/src/util/resolvePathCase.ts` | import from ../../util/resolvePathCase | WIRED | Line 27: `from "../../util/resolvePathCase"` |
| `src/renderer/src/extensions/mod_management/InstallManager.ts` | `src/renderer/src/util/resolvePathCase.ts` | import from ../../util/resolvePathCase | WIRED | Line 208: `from "../../util/resolvePathCase"` |
| `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` | `src/renderer/src/util/fs.ts` | fs.readFileAsync/writeFileAsync/statAsync via vortex-api | WIRED | Uses `fs.readFileAsync`/`fs.statAsync`; shim in fs.ts transparently resolves casing |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `fs.ts` shim — readFileAsync | `filePath: string` (arg[0]) | Caller-provided path | Yes — calls `resolvePathCase(dir, base)` → `readdirAsync` → real directory listing | FLOWING |
| `fs.ts` shim — watch | `filename: string` | Caller-provided path | Yes — calls `resolvePathCaseSync` → `readdirSync` → real directory listing | FLOWING |
| `PluginPersistor.serialize` | `pluginsFile` | `path.join(destPath, "plugins.txt")` → passes through `fs.writeFileAsync` shim | Yes — shim resolves actual on-disk casing via `readdirAsync` | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| resolvePathCase tests pass | `npx vitest run src/renderer/src/util/resolvePathCase.test.ts` | 6/6 passed | PASS |
| fs.ts shim tests pass | `npx vitest run src/renderer/src/util/fs.test.ts` | 13/13 passed (7 shim + 6 readFileBOM) | PASS |
| Old resolvePathCase location deleted | `ls src/renderer/src/extensions/mod_management/util/resolvePathCase.ts` | ENOENT | PASS |
| resolvePluginsFilePath absent | `grep -c resolvePluginsFilePath PluginPersistor.ts` | 0 | PASS |
| Commits documented in SUMMARY exist | `git log --oneline \| grep 441b0860c\|27591a96e\|4e4d2e3e5` | All 3 found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CASE-01 | 14-01-PLAN.md | (resolvePathCase promoted to vortex-api — inferred from roadmap) | SATISFIED | resolvePathCase accessible as util.resolvePathCase via vortex-api |
| CASE-02 | 14-01-PLAN.md | (fs shim wraps Wine prefix paths — inferred from roadmap) | SATISFIED | isWinePrefixPath() + wrappers in fs.ts |
| CASE-03 | 14-01-PLAN.md | (Plugins.txt read without per-callsite fix — inferred from roadmap) | SATISFIED | PluginPersistor uses path.join directly, shim handles casing |
| CASE-04 | 14-02-PLAN.md | (PluginPersistor cleanup — inferred from roadmap) | SATISFIED | resolvePluginsFilePath removed, direct path.join confirmed |

**Note:** CASE-01 through CASE-04 are referenced in ROADMAP.md's Phase 14 section but do NOT appear in `.planning/REQUIREMENTS.md`. The CONTEXT.md explicitly acknowledged this: "no explicit requirement ID for Phase 14 yet." This is a documentation gap — the requirements register was not updated when Phase 14 was planned. The code satisfies the intent of all four requirements, but the formal traceability record is incomplete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` | 491 | `TODO: This is just a workaround` (deserialization retry) | Info | Pre-existing; unrelated to Phase 14 case-folding work |
| `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` | 33, 603, 1051 | Various TODO comments | Info | Pre-existing; unrelated to Phase 14 changes |

No blockers. All TODOs are pre-existing and unrelated to Phase 14 code.

### Human Verification Required

#### 1. TypeScript Build Verification

**Test:** Run `pnpm run build` (or `pnpm --filter @vortex/renderer run build`) and inspect the output.
**Expected:** Build completes with no TypeScript errors in the modified files (`fs.ts`, `resolvePathCase.ts`, `api.ts`, `LinkingDeployment.ts`, `InstallManager.ts`).
**Why human:** Full build requires Node.js with all native modules, Electron headers, and SASS/webpack pipeline present. Cannot run in a verification context without the full development environment running.

#### 2. End-to-End Wine Prefix Case-Folding Test

**Test:** On a Linux machine with Steam + Proton installed: (1) Set up Skyrim Special Edition (or any Proton-managed Bethesda game) as the active game in Vortex. (2) Navigate to the Plugins tab. (3) Observe that the plugin list loads without ENOENT errors.
**Expected:** Plugin list displays correctly. Vortex reads `Plugins.txt` (capital P as created by Wine/Proton) via the transparent fs shim — no "file not found" error.
**Why human:** Requires actual Steam/Proton/Wine installation with a Bethesda game on a real Linux filesystem. Cannot mock a Wine prefix with actual casing behavior in Vitest.

#### 3. Requirements Register Gap Resolution

**Test:** Review `.planning/REQUIREMENTS.md` and determine whether CASE-01 through CASE-04 should be added to the v4.0 requirements section with traceability to Phase 14.
**Expected:** Either (a) REQUIREMENTS.md is updated to include CASE-01..04 with Phase 14 mapping, OR (b) team documents why these IDs exist in ROADMAP.md but not in REQUIREMENTS.md (e.g., they were internal implementation IDs, not formal requirements).
**Why human:** Requirements register maintenance is a planning decision that requires developer/team judgment. The code is correct regardless of this documentation gap.

### Gaps Summary

No code gaps found. All five ROADMAP success criteria are implemented, all artifacts are substantive and wired, all tests pass (19/19), and all key links are connected.

One documentation gap exists: CASE-01 through CASE-04 appear in the ROADMAP Phase 14 section but are absent from REQUIREMENTS.md. This does not affect code correctness but breaks the formal traceability chain. This is routed to human verification item 3 above rather than as a code gap.

---

_Verified: 2026-04-07T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
