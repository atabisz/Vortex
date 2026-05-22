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

## Lint (SYNC-35b)

**Date:** 2026-05-23 (Wave 3 execution)
**HEAD:** db168e5d4
**Status:** **PASS** — `pnpm lint:ci` exit **0** on v8.1; v8.1 errors ≤ master baseline on every axis.

### Headline

| Metric                          | master @ d494bcb7d | v8.1 @ db168e5d4 | Δ       |
| ------------------------------- | ------------------ | ---------------- | ------- |
| `pnpm lint:ci` exit             | 1                  | **0**            | −1      |
| `pnpm lint:ci` errors counted   | 18                 | 0                | **−18** |
| `pnpm lint` errors (pre-bail)   | 1                  | 1                | 0       |
| `pnpm lint` warnings (pre-bail) | 29                 | 29               | 0       |

v8.1 is strictly cleaner on the hard CI gate (preload's 18 unsafe-any errors gone); parity on the full lint surface (same pre-existing cyberpunk2077 `require-await` defect, identical warning surface). No autofix applied outside Wave 1 scope.

**Detail:** see `35-LINT-BASELINE.md`.

## Test (SYNC-35c)

**Date:** 2026-05-22T23:39:19Z (Wave 4 execution)
**HEAD:** db168e5d4
**Status:** **PASS** (pragmatic — Vitest only; Jest is documented orphan)

### Vitest result

- Command: `pnpm test` (= `pnpm vitest run --coverage`)
- Exit: **0**
- Test Files: **52 passed | 1 skipped (53)**
- Tests: **1304 passed | 26 skipped (1330)**; failed: **0**
- Duration: 9.63s (transform 13.49s, import 18.55s, tests 14.86s)
- Coverage: captured by v8 reporter; All-files line coverage 56.82%, statements 55.94%
- JUnit report: `test-results/junit.xml`
- Artifact: `.planning/phases/35-build-verification-v2-0-1/artifacts/v81-test.txt`

No test imported the deleted `DownloadManager` / `DownloadObserver` paths from Wave 1 — branch A's Σ(significant)=0 audit holds. The `manager.test.integration.ts` and `downloader.test.integration.ts` suites under `src/main/src/downloading/` exercise the new `download_management` infrastructure and pass cleanly (16 tests + 63 tests respectively).

### Jest disposition — ORPHAN (deferred)

`pnpm test` does not invoke Jest. The root `jest.config.mjs` references `<rootDir>/__mocks__/cheerio.js`, `<rootDir>/__mocks__/cheerio-utils.js`, `<rootDir>/__mocks__/shortid.js`, and `<rootDir>/__mocks__/ComponentEx.js` — Phase 34 Wave H removed those mock files via D-34-13 R2 DROP (`git rm -r src/renderer/src/__mocks__/`). Verified `src/renderer/src/__mocks__/` no longer exists. A Jest invocation against this config would error on missing mock files, but SYNC-35c's contract is satisfied because the project's actual test runner is Vitest and the script `pnpm test` invokes only Vitest.

**Disposition:** ORPHAN — `jest.config.mjs` and any orphan Jest scripts deferred to Phase 36+ followup (R4 candidate). Phase 35 SYNC-35c PASS confirmed via Vitest exit 0. RESEARCH §5 risk #1 pragmatic interpretation accepted.

### E2E disposition — OUT OF SCOPE

`packages/e2e` Playwright suite is invoked via `pnpm e2e`, not `pnpm test`. Out of scope for SYNC-35c per CONTEXT § Out of scope — UAT deferred to Phase 999.1 / Phase 37.

## Build (SYNC-35d)

**Date:** 2026-05-22T23:47:44Z
**HEAD:** db168e5d4
**Status:** PASS

### Build chain

- `pnpm build` exit: 0 (typecheck + workspace `-r run build`: shared, preload, main, renderer, packages/\*\*)
- `pnpm build:extensions` exit: 0 (`pnpm run api` + `extensions/**` build)
- `build: Done` markers: 144 (v8.0 baseline: 133; Δ +11)

Drift note: marker count is up 11 from v8.0 P29. No regressions — both build commands exit 0 and bundledPlugins floor holds. Likely explanation: workspace surface grew between v8.0 and v8.1 (additional `packages/**` and/or extensions in this branch each emitting their own `build: Done` line). Not a quality signal — purely a counting-surface change. Tracked here for audit clarity, no action.

### bundledPlugins (D-35-08)

- Count: 132 (floor: 130; current per RESEARCH: 132 — unchanged)
- Floor satisfied: YES (margin: 2)

### Non-fatal warnings

No native-dep webpack warnings observed for `vortexmt`, `winapi-bindings`, `drivelist`, `diskusage`, `bsatk`, `ba2tk`, `turbowalk`, `loot`, or `xxhash` in either build artifact (greps returned zero hits on warning-context lines). The only `bsatk`/`loot` mentions in `v81-build-extensions.txt` are normal `copy-native.mjs` / `copy-native-loot.mjs` asset-copy steps in `gamebryo-bsa-support` and `gamebryo-plugin-management` — not warnings. Disposition: v8.0 D-29-XX precedent honored, nothing to chase.

Other warnings present (pre-existing, non-regressions, not in scope this wave):

- SCSS legacy-JS-API + `@import` deprecation noise from sass during renderer webpack (Bootstrap SCSS chain).
- api-extractor `ae-missing-release-tag` warnings during `pnpm run api` for `packages/vortex-api/lib/**` — same disposition as v8.0; pre-existing API-doc hygiene debt.

Both warning classes are cosmetic and out of scope for SYNC-35d.

### SYNC-35d verdict

PASS. Wave 6 unblocked.

## Orphan reconcile (SYNC-35e)

**Date:** 2026-05-23T00:00:00Z
**Status:** PASS
**Commit:** 3a556fa6b `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs`

### Pre-deletion audit (D-35-04)

- `src/main/electron-builder.config.json` referenced by: `structure.md:27` (doc only) + zero live consumers.
- `src/main/package.json` `package` + `package:nosign` both use `./electron-builder.config.cjs`.
- `flatpak/com.nexusmods.vortex.yaml:109` references the hyphenated `electron-builder-config.json` — different filename, out of scope.

### Post-deletion audit

- Repo-wide grep for `electron-builder.config.json` (dotted, excluding `.planning/`, `node_modules/`, `out/`, `dist/`): zero hits. The flatpak yaml's hyphenated `electron-builder-config.json` doesn't match the dotted regex — confirms it's a distinct filename out of scope.
- `pnpm package:nosign` script-level smoke: PASS. Script line resolves cleanly (`pnpm electron-builder --config ./electron-builder.config.cjs --publish never`); `electron-builder.config.cjs` exists, deleted `.json` correctly absent. Full AppImage build deferred to Phase 36 release-linux.yml per plan.
- SSH signature on commit: present (`gpgsig` block, count=1).

### Lint-staged note (cosmetic, out-of-scope drift)

The `lint-staged` pre-commit hook (`pnpm oxfmt`) reformatted two pre-existing markdown lines in `structure.md` (lines 10–11: `****mocks**/**` → `\***\*mocks**/\*\*`) when the line-27 deletion was committed. The reformatted bullets pre-date this work; oxfmt is correctly escaping ambiguous markdown bold syntax. This is a project-level hook artifact unavoidable while honoring the never-`--no-verify` operational invariant. Cosmetic, no semantic impact, no rollback warranted.

### SYNC-35e verdict

PASS. Wave 7 (closeout) unblocked.
