---
phase: 09-native-addon-fix-elevation-foundation
verified: 2026-04-01T00:30:00Z
status: human_needed
score: 3/4 must-haves verified (1 requires CI run)
human_verification:
  - test: "Run pnpm rebuild on Linux CI with all build deps installed and confirm gamebryo-savegame.node loads without linker errors"
    expected: "@electron/rebuild exits 0; ldd gamebryo-savegame.node shows lz4 and zlib resolve to system libraries"
    why_human: "Pre-existing CHAR_WIDTH macro conflict in the bundled fmt header (src/fmt/format.h) prevents native compilation in this environment. The patch and linker flag infrastructure are structurally correct but the binary cannot be produced locally to confirm load."
---

# Phase 9: Native Addon Fix + Elevation Foundation Verification Report

**Phase Goal:** `gamebryo-savegame.node` compiles and loads on Linux CI without linker errors, and `runElevated()` no longer fails on Linux
**Verified:** 2026-04-01T00:30:00Z
**Status:** human_needed (3 of 4 success criteria fully verified; criterion 1 requires CI run)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `gamebryo-savegame.node` loads on Linux CI without linker errors | ? HUMAN NEEDED | Patch structurally correct; fmt CHAR_WIDTH conflict blocks local build |
| 2 | `runElevated()` no longer throws "not supported on Linux" | ✓ VERIFIED | Linux branch at elevated.ts:189 spawns pkexec; ShellExecuteEx only reached on non-Linux |
| 3 | pkexec branch respects socket-before-spawn ordering | ✓ VERIFIED | All call sites in symlink_activator_elevate call startIPCServer before runElevated (lines 488→567, 797→817, 924→941, 1050→1068) |
| 4 | Vitest unit tests exist covering cancel (126→UserCanceled), error (non-zero→Error), success | ✓ VERIFIED | 7/7 tests pass in elevated.test.ts; all required paths covered |

**Score:** 3/4 truths verified; 1 human-needed

---

### Required Artifacts

#### Plan 01 (SAVE-01) — gsd-tools result: 4/4 passed

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `patches/gamebryo-savegame@2.1.2.patch` | C++ MoreInfoException fix + binding.gyp Linux condition | ✓ VERIFIED | Contains `std::runtime_error` (3 occurrences), `OS=="linux"` condition, `-llz4`, `-lz` |
| `pnpm-workspace.yaml` | patchedDependencies entry for gamebryo-savegame | ✓ VERIFIED | Line 316: `gamebryo-savegame@2.1.2: patches/gamebryo-savegame@2.1.2.patch` |
| `.github/workflows/main.yml` | zlib1g-dev in CI apt step | ✓ VERIFIED | Line 50: `sudo apt-get install -y libfontconfig1-dev cmake liblz4-dev zlib1g-dev` |
| `src/main/electron-builder.config.cjs` | deb runtime depends for lz4 and zlib | ✓ VERIFIED | Line 66: `depends: ["xdg-utils", "libasound2", "liblz4-1", "zlib1g"]` |

#### Plan 02 (ELEV-01) — gsd-tools result: 2/2 passed

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/renderer/src/util/elevated.ts` | pkexec Linux branch + injectable spawner seam | ✓ VERIFIED | Contains `pkexec`, `_setSpawner`, `getSpawner()`, `process.platform === "linux"`, `code === 126` → `UserCanceled` |
| `src/renderer/src/util/elevated.test.ts` | Vitest tests for pkexec branch using `_setSpawner` | ✓ VERIFIED | 7 tests, all pass; covers codes 0, 126, 127, 1, immediate resolve, seam injection |

---

### Key Link Verification

#### Plan 01 — gsd-tools result: 2/2 verified

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pnpm-workspace.yaml` | `patches/gamebryo-savegame@2.1.2.patch` | patchedDependencies key | ✓ WIRED | Pattern `gamebryo-savegame@2.1.2: patches/...` found at line 316 |
| `.github/workflows/main.yml` | gamebryo-savegame native build | apt-get install provides headers | ✓ WIRED | `liblz4-dev zlib1g-dev` both present at line 50 |

#### Plan 02 — gsd-tools result: 2/3 (1 regex tool error, manually verified)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/renderer/src/util/elevated.ts` | `child_process.spawn` | `getSpawner()` injectable seam | ✓ WIRED | Line 190: `const proc = getSpawner()("pkexec", [...])`; tool failed on regex escaping — manual grep confirms |
| `src/renderer/src/util/elevated.ts` | `UserCanceled` | import from CustomErrors | ✓ WIRED | Line 10: `import { UserCanceled } from "./CustomErrors"` |
| `src/renderer/src/util/elevated.test.ts` | `src/renderer/src/util/elevated.ts` | `_setSpawner` import | ✓ WIRED | Line 31: `import { runElevated, _setSpawner } from "./elevated"` |

---

### Data-Flow Trace (Level 4)

Not applicable — these artifacts are utility modules and patch files, not UI components rendering dynamic data.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Patch contains std::runtime_error fix | `grep -c "std::runtime_error" patches/gamebryo-savegame@2.1.2.patch` | 3 | ✓ PASS |
| Patch contains OS==linux condition | `grep -c 'OS==' patches/...` | 1 | ✓ PASS |
| Patch contains -llz4 linker flag | `grep -c "\-llz4" patches/...` | 1 | ✓ PASS |
| elevated.ts has process.platform guard | `grep -c 'process.platform === "linux"'` | 1 | ✓ PASS |
| elevated.ts ShellExecuteEx still present (Windows unchanged) | `grep -c "ShellExecuteEx" elevated.ts` | 1 | ✓ PASS |
| elevated.ts code 126 → UserCanceled | `grep -c "code === 126" elevated.ts` | 1 | ✓ PASS |
| 7 test cases for pkexec branch | vitest run in renderer workspace | 7/7 pass, exit 0 | ✓ PASS |
| gamebryo-savegame.node binary loads | Cannot run — fmt CHAR_WIDTH conflict | N/A | ? SKIP |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SAVE-01 | 09-01-PLAN.md | gamebryo-savegame compiles and loads on Linux CI; exception fix, linker flags, CI headers, deb deps | ? PARTIAL (structural verified; binary load needs CI) | Patch file correct; workspace registered; CI apt and deb deps confirmed. Binary not buildable locally due to pre-existing fmt CHAR_WIDTH macro conflict — out of scope for this phase |
| ELEV-01 | 09-02-PLAN.md | runElevated() uses pkexec on Linux with socket-before-spawn ordering, code 126 → UserCanceled, injectable seam | ✓ SATISFIED | Linux branch at elevated.ts:189; all 4 required behaviors in code; 7 Vitest tests pass |

**No orphaned requirements.** REQUIREMENTS.md maps SAVE-01 and ELEV-01 to Phase 9 — both claimed by plans 01 and 02 respectively.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No TODOs, placeholder returns, empty handlers, or stub patterns in any modified file.

---

### Human Verification Required

#### 1. gamebryo-savegame.node Linux Native Build

**Test:** On a Linux CI runner (Ubuntu 22.04+) with `libfontconfig1-dev cmake liblz4-dev zlib1g-dev` installed, run `pnpm rebuild` or trigger the GitHub Actions workflow. Confirm `@electron/rebuild` completes successfully for `gamebryo-savegame`, then run `ldd node_modules/.pnpm/gamebryo-savegame*/node_modules/gamebryo-savegame/build/Release/gamebryo-savegame.node` and confirm:
- No "not found" entries for liblz4.so or libz.so
- Exit code 0

**Expected:** `@electron/rebuild` reports success; `ldd` shows both `liblz4.so.1` and `libz.so.1` resolve to system library paths (e.g. `/usr/lib/x86_64-linux-gnu/liblz4.so.1`); no linker errors in build log.

**Why human:** A pre-existing `CHAR_WIDTH` macro conflict in the bundled `src/fmt/format.h` header (a name collision between the `fmt` library and system headers under GCC 13) prevents the native addon from compiling in the current environment. The SUMMARY documents this as "a pre-existing issue unrelated to our patch" and deferred. The patch itself is correct — MoreInfoException base class fixed, linker flags added — but the binary cannot be produced locally to confirm load. This requires a clean CI runner where `@electron/rebuild` uses the Electron-specific node-gyp invocation (which may behave differently from a bare `pnpm rebuild` here).

---

### Gaps Summary

No gaps in ELEV-01 (runElevated/pkexec). SAVE-01 is structurally complete — the patch, registration, CI headers, and deb runtime deps are all correct — but the success criterion's "loads without linker errors" clause requires an actual CI run to confirm. The blocking issue (fmt CHAR_WIDTH) was pre-existing before this phase and is explicitly out of scope per the SUMMARY's deviation section. A separate investigation or patch will be needed for that before SAVE-01 can be fully closed.

---

_Verified: 2026-04-01T00:30:00Z_
_Verifier: Claude (gsd-verifier)_
