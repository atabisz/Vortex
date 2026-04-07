# Phase 9: Native Addon Fix + Elevation Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 09-native-addon-fix-elevation-foundation
**Areas discussed:** lz4/zlib delivery

---

## Gray Areas Presented

| Option | Description | Selected |
|--------|-------------|----------|
| lz4/zlib delivery | binding.gyp bundles Windows DLLs — Linux path needs lz4+zlib. System apt packages vs vendored in the patch? | ✓ |
| pkexec spawner seam | Injectable spawner seam design for CI testing | |
| pkexec failure modes | Non-126 exit codes (ENOENT, hang) before Phase 10 SteamOS handling | |

---

## lz4/zlib delivery

### How should the Linux binding.gyp find lz4 and zlib?

| Option | Description | Selected |
|--------|-------------|----------|
| System libraries | -llz4 -lz flags, liblz4-dev + zlib1g-dev via apt in CI | ✓ |
| Vendored in the patch | Bundle Linux lz4/zlib sources into the patch | |

**User's choice:** System libraries

---

### .deb runtime deps: add liblz4-1 + zlib1g now or defer to Phase 10?

| Option | Description | Selected |
|--------|-------------|----------|
| Add to .deb now | Declare runtime deps alongside the addon fix | ✓ |
| Defer to Phase 10 | Skip .deb config in Phase 9 | |

**User's choice:** Add to .deb now

---

### CI apt step: same step or separate step?

| Option | Description | Selected |
|--------|-------------|----------|
| Same apt step | Add to existing apt-get install line (same as libfontconfig1-dev) | ✓ |
| Separate step | Dedicated step for gamebryo-savegame build deps | |

**User's choice:** Same apt step

---

### Patch scope: single patch or separate patches?

| Option | Description | Selected |
|--------|-------------|----------|
| Both in one patch | Fix MoreInfoException + binding.gyp OS==linux in single pnpm patch | ✓ |
| Separate patches | One patch per fix | |

**User's choice:** Both in one patch

---

## Claude's Discretion

- pkexec spawner seam design — user did not discuss; planner decides per ELEV-01 SC-4
- pkexec non-126 failure handling — user did not discuss; planner decides (throw descriptive error, no hang)

## Deferred Ideas

- pkexec spawner seam details → Claude's discretion
- SteamOS sudo -n fallback → Phase 10 ELEV-02
- Polkit action file → Phase 10 ELEV-03
- Save game UI → Phase 10
