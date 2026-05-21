# Phase 29 — Verification results

Captured 2026-05-22 on `v8.0/config-bucket` per D-29-01 (local-first sequential).

Each section is one plan's evidence. Commits land per-plan; this file accumulates as plans complete.

---

## Plan 29-01 — SYNC-01 + SYNC-28

**HEAD at run:** `007ab1277` (post 29-00 commit)

### SYNC-01 — repo-wide zero conflict markers

**Command:** `git grep -l '^<<<<<<< '`
**Exit code:** 1 (no matches — git grep convention)
**Output:** empty
**Result:** **PASS** — zero conflict markers anywhere in the repo.

The Phase 28 done-gate already proved this for the 7 phase directories; SYNC-01 widens it to the whole tree and confirms no stray conflicts in extensions, packages, docs, or scripts that fell outside Phase 28's scope.

### SYNC-28 — `pnpm typecheck`

**Command:** `pnpm typecheck` (delegates to `pnpm nx run-many -t typecheck`)
**Exit code:** 0
**Wall-clock:** ~3 min (cached for most projects on rerun)
**Final line:** `NX   Successfully ran target typecheck for 58 projects and 6 tasks they depend on`
**Result:** **PASS**

Phase 28 already ran per-bucket typechecks (`@vortex/{shared,preload,main,renderer}` all green) and the full-repo `pnpm typecheck` at done-gate. This re-run confirms the tree remains green at HEAD `007ab1277` with the Phase 29 docs commits on top.

### Recurring drift handled

`packages/vortex-api/lib/api.d.ts` regenerated as a side-effect of typecheck (api-extractor runs as part of @vortex/api typecheck). Discarded with `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` per the recurring chore-pattern (`416af4df3`, `3d639fc26`, and Phase 28 §7). A separate housekeeping `chore: regenerate vortex-api/lib/api.d.ts` commit is appropriate as a follow-up — outside Phase 29 scope.

The 7 ae-missing-release-tag warnings in `src/shared/src/types/errors.ts` are non-fatal api-extractor advisories present on master too (DataInvalid, NotSupportedError, ProcessCanceled, ArgumentInvalid, SetupError, MissingInterpreter, NotFound). Pre-existing per the SYNC-32 baseline philosophy.

### Post-conditions for Plan 29-02

- Working tree clean
- `pnpm typecheck` green — safe to run `pnpm build` in Plan 29-02

---

## Plan 29-02 — SYNC-29

**HEAD at run:** `0ce522e35` (post 29-01 commit)

### SYNC-29 — `pnpm build`

**Command:** `pnpm build` (from package.json: `pnpm run typecheck && pnpm --filter "@vortex/*" --filter "@nexusmods/*" --filter "./packages/**" --filter "!@vortex/e2e" --filter "!vortex-api" -r run build`)
**Exit code:** 0
**Wall-clock:** ~4 min
**Result:** **PASS**

All 9 workspace build targets completed cleanly:

| Workspace                         | Status |
| --------------------------------- | ------ |
| `packages/exe-version`            | Done   |
| `src/shared`                      | Done   |
| `packages/adaptor-api`            | Done   |
| `packages/adaptors/cyberpunk2077` | Done   |
| `packages/adaptors/ping-test`     | Done   |
| `src/preload`                     | Done   |
| `packages/adaptors/fs-test`       | Done   |
| `src/renderer`                    | Done   |
| `src/main`                        | Done   |

Renderer webpack final line: `webpack 5.105.4 compiled successfully in 19149 ms`. Main bundle compiled cleanly.

### Notes

- 2 `ae-missing-release-tag` api-extractor warnings on `MixpanelEvents.d.ts` (CollectionsDownloadFailedEvent, CollectionsInstallationFailedEvent) — non-fatal advisories, present on master, not blockers under SYNC-32 baseline philosophy.
- `packages/vortex-api/lib/api.d.ts` regenerated again (api-extractor side-effect of build chain). Same recurring drift as 29-01 — discarded with `git checkout HEAD -- ...`.

### Post-conditions for Plan 29-03

- `src/preload/build/`, `src/renderer/build/`, `src/main/build/` populated with the bundled main + renderer + preload artefacts that `pnpm build:extensions` consumes
- Working tree clean

---

## Plan 29-03 — SYNC-30 + SYNC-21

**HEAD at run:** `73c4bc483` (post 29-02 commit)

### SYNC-30 — `pnpm build:extensions`

**Command:** `pnpm build:extensions` (from package.json: `pnpm run api && pnpm --filter "./extensions/**" run build`)
**Exit code:** 0
**Wall-clock:** ~6 min
**Result:** **PASS**

133 `build: Done` markers across the api + extensions chain; zero `ELIFECYCLE` / `Failed$` / `Exit status [1-9]` lines.

### SYNC-21 — `bundledPlugins/` count

**Command:** `ls src/main/build/bundledPlugins/ | wc -l`
**Result:** **132** entries — **PASS** (CONTEXT threshold: ≥130, expected ~132).

### Linux-relevant extensions confirmed

All 8 gamebryo bundles present:

| Extension                       | In `bundledPlugins/` |
| ------------------------------- | -------------------- |
| `gamebryo-archive-check`        | ✓                    |
| `gamebryo-archive-invalidation` | ✓                    |
| `gamebryo-archive-support`      | ✓                    |
| `gamebryo-bsa-support`          | ✓                    |
| `gamebryo-plugin-indexlock`     | ✓                    |
| `gamebryo-plugin-management`    | ✓                    |
| `gamebryo-savegame-management`  | ✓                    |
| `gamebryo-test-settings`        | ✓                    |

`gamebryo-ba2-support` (restored under SYNC-13 in Phase 25) is part of the chain via `_build` named-script Linux guard pattern. `nexus_integration` is bundled into the renderer extensions chain, not into `bundledPlugins/`, by design.

### Notes

- `packages/vortex-api/lib/api.d.ts` regenerated again (build:extensions runs `pnpm api` first, which re-runs api-extractor). Discarded for the third time this phase — recurring drift, outside-scope.
- Webpack module-not-found warnings for optional native deps (e.g. `vortexmt` on platforms where it's missing) are non-fatal — extensions handle missing natives at runtime.

### Post-conditions for Plan 29-04

- `src/main/build/bundledPlugins/` populated with 132 entries
- All build chain artefacts in place — `pnpm test` (Vitest) can resolve all imports
- Working tree clean

---

## Plan 29-04 — SYNC-31

**HEAD at run:** `a6972705b` (post 29-03 commit)

### SYNC-31 — `pnpm test` (Vitest)

**Command:** `pnpm test` (from package.json: `pnpm vitest run --coverage`)
**Exit code:** 0
**Wall-clock:** 8.51s tests + 14.59s import = ~24s
**Result:** **PASS**

```
Test Files  48 passed | 1 skipped (49)
     Tests  1206 passed | 26 skipped (1232)
  Start at  08:58:52
  Duration  8.51s
```

Zero failed tests. The 1 skipped file + 26 skipped individual tests are pre-existing (validation tests for Linux paths skipped on platforms without those bindings, etc.).

### Renderer-no-Jest divergence acknowledged

SYNC-31 explicitly acknowledges this divergence: `src/renderer/jest.config.mjs` was deliberately NOT restored under SYNC-15 in Phase 25 (fork is Vitest-only by deliberate v3.0/v4.0 decision; documented in playbook). All renderer tests that exist run under Vitest; upstream Jest scaffolding remains absent.

### Notes

- `pnpm test` did not regenerate `api.d.ts` this run (no api-extractor in the test path). Working tree clean post-run.
- R1 lockfile-drift contingency from CONTEXT did not trigger — no `pnpm install` re-run was needed to make `pnpm test` succeed.

### Post-conditions for Plan 29-05

- All build + test verification green; the only remaining script-based check is lint:ci.
- Working tree clean

---

## Plan 29-05 — SYNC-32

**HEAD at run:** `17c56ad15` (post 29-04 commit)

### SYNC-32 — `pnpm lint:ci` diff vs master

**Command:** `pnpm lint:ci` (delegates to `pnpm run lint:quiet` → `pnpm -r run lint:quiet`)
**Exit code:** 0
**Wall-clock:** 34.8s
**Result:** **PASS**

All five lint:quiet runs Done with zero errors and zero warnings:

| Workspace              | Status | Errors | Warnings |
| ---------------------- | ------ | -----: | -------: |
| `packages/adaptor-api` | Done   |      0 |        0 |
| `src/shared`           | Done   |      0 |        0 |
| `src/preload`          | Done   |      0 |        0 |
| `src/renderer`         | Done   |      0 |        0 |
| `src/main`             | Done   |      0 |        0 |
| (other 139 workspaces) | Done   |      0 |        0 |
| **Total**              |        |  **0** |    **0** |

### Delta vs master baseline

| Workspace      | Master errors | v8.0 errors |       Δ |
| -------------- | ------------: | ----------: | ------: |
| **`src/main`** |            10 |           0 | **−10** |
| **Total**      |            10 |           0 | **−10** |

The −10 delta is **not** a fix — it reflects that `src/main/src/downloading/downloader.test.ts` (where master's 10 errors live) doesn't exist on `v8.0/config-bucket`. Master is +20 commits ahead along a different lineage that includes Phase 25 SYNC-14's `restore(downloading): chunking + download_management spine + bsdiff-node test from upstream 8b5a9f675` (`9a17907b6`). When v8.0 lands and gets merged forward in Phase 30 (PR #4), that restore work will come back along with the 10 pre-existing errors.

Per D-29-05: PASS iff `v8.0 errors ≤ master baseline errors` AND `lint:ci` exit 0. Both conditions met → **PASS**.

### Notes

- `pnpm lint:ci` did not regenerate `api.d.ts` this run (no api-extractor in the lint path). Working tree clean post-run.
- Full log + per-workspace delta table captured in `29-LINT-BASELINE.md`.

### Post-conditions for Plan 29-06

- All five script-based verifications (typecheck/build/build:extensions/test/lint:ci) green on v8.0/config-bucket.
- Working tree clean.
- Next: SYNC-33 part A — `pnpm run start` from source.

---
