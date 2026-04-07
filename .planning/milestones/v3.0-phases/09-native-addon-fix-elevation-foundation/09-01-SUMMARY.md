---
phase: 09-native-addon-fix-elevation-foundation
plan: 01
subsystem: native-addons
tags: [gamebryo-savegame, pnpm-patch, ci, packaging, linux]
dependency_graph:
  requires: []
  provides: [SAVE-01-partial]
  affects: [patches/, pnpm-workspace.yaml, .github/workflows/main.yml, src/main/electron-builder.config.cjs]
tech_stack:
  added: []
  patterns: [pnpm-patch, node-gyp-conditions]
key_files:
  created:
    - patches/gamebryo-savegame@2.1.2.patch
  modified:
    - pnpm-workspace.yaml
    - .github/workflows/main.yml
    - src/main/electron-builder.config.cjs
decisions:
  - "MoreInfoException: std::runtime_error base (not std::exception) — GCC doesn't support MSVC-style std::exception(runtime_error) constructor"
  - "No RPATH in gamebryo-savegame patch — lz4 and zlib are system libraries, not bundled .so files"
  - "liblz4-1 + zlib1g added as deb runtime deps — required for gamebryo-savegame.node dynamic linking at runtime"
metrics:
  duration: "2 minutes"
  completed: "2026-04-01T04:32:50Z"
  tasks: 2
  files: 4
---

# Phase 09 Plan 01: gamebryo-savegame pnpm Patch + CI/Packaging Summary

**One-liner:** pnpm patch for gamebryo-savegame fixing MSVC-only exception constructor and adding OS=="linux" lz4/zlib linker flags; CI and deb packaging updated.

## What Was Built

### Task 1: Create gamebryo-savegame pnpm patch and register it (95dd472eb)

Created `patches/gamebryo-savegame@2.1.2.patch` with two fixes:

**Fix 1 — MoreInfoException C++ base class** (`src/gamebryosavegame.cpp`):
- Changed `class MoreInfoException : public std::exception` to `class MoreInfoException : public std::runtime_error`
- Changed constructor initializer from `std::exception(std::runtime_error(message))` to `std::runtime_error(message)`
- GCC rejects the MSVC-specific `std::exception(runtime_error)` constructor form; `std::runtime_error` is the portable pattern

**Fix 2 — binding.gyp Linux condition**:
- Added `OS=="linux"` condition alongside the existing `OS=="win"` condition in the `conditions` array
- Linux condition contains: `"libraries": ["-llz4", "-lz"]`
- No RPATH required (lz4 and zlib are system libraries, not bundled)

Registered in `pnpm-workspace.yaml` under `patchedDependencies`:
```yaml
gamebryo-savegame@2.1.2: patches/gamebryo-savegame@2.1.2.patch
```

`pnpm patch-commit` ran and applied the patch to node_modules. The patched source confirms `std::runtime_error` is present.

### Task 2: Update CI apt step and deb depends for lz4/zlib (418025f70)

**CI apt step** (`.github/workflows/main.yml` line 50):
- Added `zlib1g-dev` to the existing apt-get install line
- `liblz4-dev` was already present (added in Phase 3)
- Single line preserved — no new step added

**deb runtime depends** (`src/main/electron-builder.config.cjs`):
- Added `"liblz4-1"` and `"zlib1g"` to `deb.depends` array
- Original deps `"xdg-utils"` and `"libasound2"` preserved

## Verification Results

All 4 plan criteria verified:

1. `patches/gamebryo-savegame@2.1.2.patch` exists — contains `std::runtime_error`, `OS=="linux"`, `-llz4`, `-lz`
2. Patch applied in node_modules: `grep std::runtime_error` confirms `class MoreInfoException : public std::runtime_error`
3. `grep "zlib1g-dev" .github/workflows/main.yml` — confirmed
4. `grep "liblz4-1" src/main/electron-builder.config.cjs` — confirmed

## Deviations from Plan

### Post-execution fix: CHAR_WIDTH macro collision (a628be0f3)

After initial execution, a local build confirmed a `CHAR_WIDTH` macro collision in `src/fmt/format.h:1853`. GCC 13's `<limits.h>` defines `CHAR_WIDTH` as a numeric macro, which collides with the local variable name. Fixed by adding `#undef CHAR_WIDTH` before the variable declaration. Appended to the patch as a third hunk targeting `src/fmt/format.h`.

After this fix: `@electron/rebuild` exits 0, `ldd GamebryoSave.node` shows `liblz4.so.1` and `libz.so.1` both resolving to system paths — no "not found" entries.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: patches/gamebryo-savegame@2.1.2.patch (3 hunks: binding.gyp, fmt/format.h, gamebryosavegame.cpp)
- FOUND: commit 95dd472eb (Task 1)
- FOUND: commit 418025f70 (Task 2)
- FOUND: commit a628be0f3 (CHAR_WIDTH undef fix)
- BUILD: @electron/rebuild exits 0
- LDD: liblz4.so.1 => /lib/x86_64-linux-gnu/liblz4.so.1 ✓
- LDD: libz.so.1 => /lib/x86_64-linux-gnu/libz.so.1 ✓
