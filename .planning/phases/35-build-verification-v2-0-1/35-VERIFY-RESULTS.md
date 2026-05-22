# Phase 35 — Verify Results

Living artifact accumulated across Waves 2–5; finalized in Wave 7.

## Typecheck (SYNC-35a)

**Date:** 2026-05-22T23:23:54Z
**HEAD:** e2127cecb
**Status:** FAIL (aggregate) / PASS (six-bucket surface)

| Surface                                      | Errors (filtered) |
| -------------------------------------------- | ----------------- |
| `src/shared/tsconfig.json`                   | 0                 |
| `src/preload/tsconfig.json`                  | 0                 |
| `src/main/tsconfig.json`                     | 0                 |
| `src/renderer/tsconfig.json`                 | 0                 |
| `.github/actions/fingerprints/tsconfig.json` | 0                 |
| `packages/e2e/tsconfig.json`                 | 0                 |
| **Aggregate `pnpm run typecheck` exit**      | 130 (FAIL)        |

Δ vs Phase 34 baseline: renderer-bucket 9 → 0 (closed by Wave 1 D-35-01 branch A delete commit `e2127cecb`); five other buckets unchanged at 0.

### Aggregate failure detail

`pnpm run typecheck` (nx run-many) failed with exit 130. The failing tasks were:

- `@vortex/paths:build` — `[UNRESOLVED_ENTRY] Cannot resolve entry module ./src/index.ts` (no `src/index.ts` in `packages/paths`)
- `@vortex/paths:typecheck` — 15+ TS2307 "Cannot find module" errors in `src/FilePath.ts`, `src/resolvers/BaseResolver.ts`, `src/resolvers/MappingResolver.test.ts` etc. — refers to siblings (`./IResolver`, `./types`, `./IFilesystem`, `./test-helpers/...`) that don't exist in the package.
- `@vortex/paths-node:typecheck` — skipped (dependency of paths failed)

This matches the Wave 2 plan's documented contingency: aggregate non-zero while per-bucket all 0 indicates an `nx`-orchestrated workspace not covered by the six listed tsconfigs. `packages/paths` is exactly the workspace the plan flagged as "most likely culprit".

Full failure log: `.planning/phases/35-build-verification-v2-0-1/artifacts/typecheck-failures.txt`

### Interpretation

- **Six-bucket surface (the surface Phase 34 codified) is GREEN.** SYNC-35a as defined by the per-bucket idiom is closed: renderer 9 → 0, others unchanged at 0.
- **Aggregate `pnpm run typecheck` is RED.** The plan's "Risks / contingencies" §1 instructs: investigate whether SYNC-35a needs broader surface, escalate as a Wave 2 finding.
- **Finding:** `@vortex/paths` is in a broken state — the package source has been gutted (FilePath.ts and a `resolvers/` dir survive, but `index.ts`, `IResolver.ts`, `types.ts`, `IFilesystem.ts`, `test-helpers/`, `MappingResolver.ts` are missing). Either an incomplete refactor or an inadvertent delete during prior work. This is pre-existing tech debt that Phase 34's surface didn't catch because `packages/paths` isn't in the six-bucket list.

### Recommendation for orchestrator

Two paths:

1. **Narrow SYNC-35a interpretation:** the requirement is the six-bucket surface; that surface is GREEN; SYNC-35a closed; broken `@vortex/paths` is a separate finding for a future phase.
2. **Broad SYNC-35a interpretation:** root `pnpm run typecheck` must exit 0; SYNC-35a is RED; needs follow-up plan to either restore `packages/paths` source or remove the broken package from the workspace before Wave 3 unblocks.

The plan's done-criteria #1 ("`pnpm run typecheck` exits 0 at the project root") is the canonical contract per REQUIREMENTS.md, so the broad interpretation is the contractual one.

## Typecheck (SYNC-35a) — CONTINGENCY-FIX UPDATE

**Date:** 2026-05-22T23:33:56Z
**HEAD:** 52ea1941b
**Status:** PASS (aggregate AND six-bucket)

Wave 2 contingency-fix landed: `fix(merge): restore packages/paths{,-node}/src/ from master` (commit `52ea1941b`). The v2.0.1 merge `aa3faf7e5` had dropped 17 files from `packages/paths/src/` and the entire `packages/paths-node/src/` tree. `master` retained them under the Phase 25 SYNC-14 byte-for-byte restore policy. HEAD now matches master for these directories.

### Post-fix evidence

| Check                                            | Result                       |
| ------------------------------------------------ | ---------------------------- |
| `pnpm run typecheck` aggregate exit              | **0** (was 130)              |
| `packages/paths/src/` file count                 | 23 (matches master)          |
| `packages/paths-node/src/` file count            | 3 (matches master)           |
| `git diff master -- packages/paths{,-node}/src/` | empty (byte-for-byte parity) |

### Six-bucket post-fix

| Surface                                      | Errors (filtered) |
| -------------------------------------------- | ----------------- |
| `src/shared/tsconfig.json`                   | 0                 |
| `src/preload/tsconfig.json`                  | 0                 |
| `src/main/tsconfig.json`                     | 0                 |
| `src/renderer/tsconfig.json`                 | 0                 |
| `.github/actions/fingerprints/tsconfig.json` | 0                 |
| `packages/e2e/tsconfig.json`                 | 0                 |

All six unchanged at 0 — Phase 34 baseline preserved (renderer remains at 0 from Wave 1 D-35-01 delete; not regressed by the restore).

### Marker audit

`git grep -nE '^(<{7}|={7}|>{7})( |$)' -- ':!.planning' | wc -l` → **0**.

### Resolution

**Broad SYNC-35a interpretation (the contractual one per REQUIREMENTS.md done-criteria #1) is now PASS.** Aggregate `pnpm run typecheck` exits 0; six-bucket all 0; markers 0. Wave 3 unblocked.

**Architectural follow-up deferred:** whether to keep `packages/paths{,-node}` restored (current state) or adopt upstream `52f934941 "Remove deprecated paths packages"` is a separate Phase 36+ decision parallel to D-35-01 `download_management`. Zero downstream consumers in `src/`, `extensions/`, `packages/adaptor-api/`, `packages/adaptors/` — deletion would be safe but is out of scope for Phase 35.
