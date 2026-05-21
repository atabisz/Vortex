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
