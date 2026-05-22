# Phase 31: Config bucket — Research

**Researched:** 2026-05-22
**Domain:** upstream-merge conflict resolution (config-only files); pnpm 10 catalog-mode lockfile regen
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-31-01:** Branch `v8.1/config-bucket` from `fork/sync/upstream-v2.0.1`.
- **D-31-02:** Push back to `fork/sync/upstream-v2.0.1` once at phase end with `--force-with-lease`.
- **D-31-03:** Atomic commits — one commit per file + 1 lockfile commit. Title `resolve(config): <file> — <stance>`.
- **D-31-04:** Final FF-merge into master happens at Phase 36, not here.
- **D-31-05:** Default = hand-resolve every file. No blanket pick-ours/pick-theirs.
- **D-31-06:** `package.json` — keep HEAD wholesale on the scripts conflict region.
- **D-31-07:** `pnpm-workspace.yaml` — keep HEAD on `allowBuilds` conflict region (`@electron/rebuild: true`).
- **D-31-08:** `.vscode/extensions.json` — pick-ours.
- **D-31-09:** `docker/windows/Dockerfile` — hand-resolve.
- **D-31-10:** Four `eslint.config.mjs` files — hand-resolve each.
- **D-31-11:** `vitest.config.ts` — hand-resolve as union.
- **D-31-12:** `tsconfig*.json` + `prepare-dist-package.mjs` — hand-resolve, preserve `resolvePathCase` wiring.
- **D-31-13:** Keep fork's `src/main/build` output structure. Do NOT adopt `out/`+`dist/` split.
- **D-31-14:** Keep nx-orchestrated typecheck.
- **D-31-15:** Drop upstream's new `dist:all`, `build:assets`, `dist:assets`, `dist:extensions`, `typecheck:extensions`.
- **D-31-16:** `rm pnpm-lock.yaml && pnpm install`. Lockfile in own atomic commit titled `chore(deps): regenerate pnpm-lock.yaml after v2.0.1 sync`.
- **D-31-17:** Done-gate (5): zero conflict markers in Bucket A; `pnpm install` succeeds; `pnpm install --frozen-lockfile` succeeds; IDE/TS server loads without parser errors; lockfile drift summarized in commit body.
- **D-31-18:** Drift handling — document non-trivial deltas in lockfile commit body and accept.

### Claude's Discretion

- Per-file ESLint merge judgment (D-31-10 only locks the strategy).
- Lockfile drift summary format (table or bulleted prose).
- Final actual file list comes from research enumeration (this document).

### Deferred Ideas (OUT OF SCOPE)

- Adopt upstream's `out/` + `dist/` build path split.
- Add `typecheck:extensions` as a separate script.
- Drop nx orchestration.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID            | Description                                                                     | Research Support                                                                                                   |
| ------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SYNC-2.0.1-02 | Config bucket resolved before any other bucket — tree must parse first          | Authoritative conflict inventory below; per-file resolution stances; ordering matches v8.0 D-03 cadence            |
| SYNC-2.0.1-03 | `pnpm-lock.yaml` regenerated cleanly; `pnpm install --frozen-lockfile` succeeds | Two-pass install protocol; lockfile drift comparison target identified; catalog-mode-strict expectations confirmed |

</phase_requirements>

## Summary

PR #5 (`fork/sync/upstream-v2.0.1` at `8054a935b`, merge commit `aa3faf7e5`) carries **10 conflicted Bucket A files**. The set is smaller than v8.0's 11 hand-resolved files: `.vscode/extensions.json` and any `tsconfig*.json` in scope are clean on v2.0.1 (no markers, no diff vs `fork/master`). Conflict shapes are otherwise structurally identical to v8.0 — same scripts region in `package.json`, same `allowBuilds` + catalog regions in `pnpm-workspace.yaml`, same `out/dist` path-split push-back, same Jest-scaffolding re-introduction.

The four `eslint.config.mjs` files have a **simpler stance than v8.0's hand-merge**: HEAD is the post-base-extraction shape (extends `eslint.config.base.mjs`); the upstream side of every conflict region is duplicate inline rules already covered by the base. **Pick HEAD wholesale** on all four. (v8.0 D-10 said "hand-merge" because v8.0 was the merge that introduced the base extraction; in v8.1 the base already exists upstream-clean.) Net effect: D-31-10 narrows from "hand-merge per rule" to "pick HEAD; verify nothing in upstream side is genuinely new vs the base."

**One out-of-Bucket-A discovery the planner must surface to downstream phases:** v2.0.1 deletes `packages/paths/package.json` and `packages/paths-node/package.json` while leaving `src/`/`README.md` orphans on the merge tree. `pnpm-workspace.yaml` still globs `./packages/*`. After Phase 31 lockfile regen this is the most likely failure mode for `pnpm install`. v8.0 handled this in Phase 25 ("restore dropped scaffolding") — v8.1 has no Phase 25 equivalent. **Recommendation below.**

**Primary recommendation:** Mirror v8.0 Phase 24's 8-plan shape exactly. Add one extra discovery-diff plan (or fold into Plan 1's baseline check) to surface the `packages/paths` orphan-package.json issue and either restore them as part of Phase 31 or explicitly hand the cleanup to Phase 32 with a tracked TODO. Do not silently ship a tree that will fail `pnpm install`.

## Conflict File Inventory (authoritative)

Source of truth: `git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.1 -- <bucket A patterns>` run 2026-05-22.

| File                                                    | Conflict on v2.0.1?     | Conflict regions                                 | Resolution stance per CONTEXT                                                 | Notes                                                                                                                           |
| ------------------------------------------------------- | ----------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                          | **Yes**                 | 1 (scripts block)                                | D-31-06 keep HEAD wholesale                                                   | Same shape as v8.0; upstream still pushes `out/`+`dist/` split                                                                  |
| `pnpm-workspace.yaml`                                   | **Yes**                 | 4 (allowBuilds + 3 catalog regions)              | D-31-07 keep HEAD on allowBuilds; merge upstream catalog additions            | nx remains in catalog (`nx: ^22.7.1`); see catalog deltas below                                                                 |
| `pnpm-lock.yaml`                                        | **Yes**                 | 45 markers                                       | D-31-16 regenerate (do NOT hand-resolve)                                      | Plan in its own wave per v8.0 24-07                                                                                             |
| `vitest.config.ts`                                      | **Yes**                 | 1 (projects array)                               | D-31-11 union; HEAD globs win                                                 | `packages/paths`/`packages/paths-node` orphan situation makes upstream's explicit `./packages/paths*` entries a trap            |
| `src/main/eslint.config.mjs`                            | **Yes**                 | 1                                                | **Pick HEAD** (revised D-31-10)                                               | Upstream side duplicates base config                                                                                            |
| `src/preload/eslint.config.mjs`                         | **Yes**                 | 1                                                | **Pick HEAD** (revised D-31-10)                                               | Upstream side duplicates base config                                                                                            |
| `src/renderer/eslint.config.mjs`                        | **Yes**                 | 1                                                | **Pick HEAD** (revised D-31-10)                                               | Upstream side duplicates base config                                                                                            |
| `src/shared/eslint.config.mjs`                          | **Yes**                 | 1                                                | **Pick HEAD** (revised D-31-10)                                               | Upstream side duplicates base config                                                                                            |
| `src/main/prepare-dist-package.mjs`                     | **Yes**                 | 1 (`createMinimalPackageJson` minimal-pkg shape) | D-31-12 hand-resolve; keep HEAD's `build/` path + author/description/homepage | Upstream side: `out/` path + stripped author/description/homepage                                                               |
| `docker/windows/Dockerfile`                             | **Yes**                 | 1 (long-path-support block)                      | D-31-09 hand-resolve → keep HEAD                                              | HEAD adds `LongPathsEnabled` registry tweak; upstream marker says `v1.16.9` (old branch); no fork-tooling refs in upstream side |
| `.vscode/extensions.json`                               | **No**                  | 0                                                | n/a — no conflict, no diff vs `fork/master`                                   | **Drop from D-31-08 scope** — file is identical, no commit needed                                                               |
| `src/renderer/tsconfig.api.json`                        | **No**                  | 0                                                | n/a — no diff vs `fork/master`                                                | **Drop from D-31-12 scope** — no commit needed                                                                                  |
| `tsconfig.json` (root)                                  | **No**                  | 0                                                | n/a                                                                           | No diff                                                                                                                         |
| `extensions/gamebryo-savegame-management/tsconfig.json` | **Yes (out of bucket)** | 1                                                | n/a here                                                                      | Surface to **Phase 33** (gamebryo extensions)                                                                                   |

**Hand-resolved Bucket A file count for v8.1: 9** (vs v8.0's 11). Plus 1 lockfile regen commit.

## Per-File Notes

### package.json

- **HEAD side (fork/master):** `rebuild:native`, `build` filtered to `@vortex/*`/`@nexusmods/*`/`./packages/**`, `build:all` chains `build:extensions` + `assets`, `build:extensions` runs `api` + extensions filter, `assets` writes to `./src/main/build`, `dist` chains `build:all` + `--filter "./src/*" -r run dist`, `package`/`package:nosign`/`package:local`, `typecheck` via `pnpm nx run-many -t typecheck`.
- **Upstream v2.0.1 side:** No `rebuild:native`. `build` filters only `@vortex/*`. `build:all` chains `build:extensions` + `build:assets`. `build:extensions` adds `typecheck:extensions`. `build:assets` writes to `./src/main/out`. `dist` runs `typecheck` then `--filter "@vortex/*" -r run dist`. Adds `dist:all`, `dist:extensions`, `dist:assets` writing to `./src/main/dist`. `typecheck` is `pnpm -F @vortex/shared run build && pnpm -F @vortex/paths run build && --filter "@vortex/*" -r run typecheck`. No `package:local`.
- **Recommended:** D-31-06 + D-31-13 + D-31-14 + D-31-15 — keep HEAD wholesale. Verify post-resolve: `rebuild:native`, `postinstall: scripts/postinstall-libloot.cjs`, `assets` writing to `./src/main/build`, `nx run-many -t typecheck`, `package:local` all present. Verify absent: `dist:all`, `build:assets`, `dist:assets`, `dist:extensions`, `typecheck:extensions`.
- **v2.0.1 surprise vs v2.0.0:** Upstream's typecheck now invokes `pnpm -F @vortex/paths run build` as a prereq — but v2.0.1 also deletes `packages/paths/package.json` upstream-side. Their own typecheck would break in pure-upstream-v2.0.1 if not for the auto-merge keeping fork's `packages/paths`. Keeping HEAD dodges this entirely.

### pnpm-workspace.yaml

Four conflict regions, all in additive shape:

1. **allowBuilds `@electron/rebuild: true`** — HEAD has it, upstream removes it. **Keep HEAD** (D-31-07; pairs with `rebuild:native` script).
2. **catalog `esptk` + `exe-version`** — HEAD doesn't list, upstream adds. **Take upstream additions** (additive catalog entries; non-conflicting in spirit).
3. **catalog `gamebryo-savegame`** — HEAD doesn't list, upstream adds. **Take upstream addition.**
4. **catalog `leveldown` 5.6.0 + `levelup` 4.4.0** — HEAD has, upstream removes (legacy persistence layer). **Keep HEAD** — fork still uses LevelDB for legacy state per CLAUDE.md tech stack ("levelup 4.4.0 + leveldown 5.6.0 — Legacy persistent key-value store").
5. **catalog `native-errors`** — HEAD doesn't list, upstream adds. **Take upstream addition.**

`nx: ^22.7.1` confirmed present in catalog (no upstream removal — D-31-14 holds).
`catalogMode: strict` preserved.
`failIfNoMatch: true` preserved — **this is the trap**: with `packages/*` in workspaces and no `package.json` in `packages/paths/`/`packages/paths-node/`, `pnpm install` may flag the orphans. See "Risks / Unknowns" below.

### pnpm-lock.yaml

45 conflict markers. Regenerate per D-31-16. Do not attempt to hand-merge.

### vitest.config.ts

- **HEAD side:** glob array — `./src/**/vitest.config.ts`, `./src/main/vitest.downloader.config.ts`, `./packages/**/vitest.config.ts`, `./extensions/**/vitest.config.ts`, `./scripts/vitest.config.ts`.
- **Upstream v2.0.1 side:** explicit list — `./src/main`, `./scripts`, `./src/renderer`, `./src/shared`, `./packages/paths`, `./packages/paths-node`, `./extensions/games/game-stardewvalley`.
- **Recommended:** D-31-11 — pick HEAD globs. Reasons:
    1. Upstream's explicit `./packages/paths` and `./packages/paths-node` are broken on v2.0.1 (those packages were deleted upstream — only orphan src/ remains). HEAD globs would skip the orphans cleanly because `./packages/**/vitest.config.ts` requires the file to exist.
    2. `./extensions/games/game-stardewvalley` is matched by HEAD's `./extensions/**/vitest.config.ts` glob (verify file exists at `extensions/games/game-stardewvalley/vitest.config.ts` after merge — confirm via `git ls-files` in baseline plan).
    3. `./src/main/vitest.downloader.config.ts` is HEAD-only and must survive — fork's `__tests__/reducers.download_management.test.js` test setup depends on it.
- **Verification post-resolve:** `git ls-files | grep vitest.config.ts` enumerates every actual config; cross-reference against the glob coverage; add explicit entries if any are missed.

### src/main/eslint.config.mjs

- **HEAD side:** empty (the fork extends `eslint.config.base.mjs`).
- **Upstream v2.0.1 side:** `parserOptions.projectService` + `parserOptions.tsconfigRootDir` + `plugins: { perfectionist }` — **all of which are already in `eslint.config.base.mjs` on the merge tree** (verified: `git show fork/sync/upstream-v2.0.1:eslint.config.base.mjs`).
- **Recommended:** **Pick HEAD wholesale.** The upstream side is duplicate of base config. v8.0 D-10 said "hand-merge"; for v8.1 the simpler "pick HEAD" suffices because the base extraction already happened upstream by v2.0.1.
- **v2.0.1 surprise vs v2.0.0:** None — same conflict shape as v8.0, but the v8.0 merge introduced the base extraction so the merge had to handle the migration. v8.1 inherits the base; the upstream side is now legacy noise.

### src/preload/eslint.config.mjs

- **HEAD side:** `export default defineConfig([...baseConfig(import.meta.dirname)]);` (one line, all delegated to base).
- **Upstream v2.0.1 side:** ~50 lines of inline rules (recommended, recommendedTypeChecked, perfectionist sort-imports/sort-exports, consistent-type-imports error, no-unused-vars custom config, separate `.mjs` glob block) — **all already in base**.
- **Recommended:** **Pick HEAD wholesale.**

### src/renderer/eslint.config.mjs

- **HEAD side:** `globals: { ...globals.node, ...globals.browser }` (and a long renderer-specific rules tail with @eslint-react, better-tailwindcss, vortex/no-bluebird-\* custom rules — all HEAD-side, no conflict).
- **Upstream v2.0.1 side of conflict region only:** `parserOptions.projectService` + `parserOptions.tsconfigRootDir` — already in base.
- **Recommended:** **Pick HEAD wholesale on the conflict region.** The renderer file's significant rules content (custom vortex rules, perfectionist sort-jsx-props, stylistic plugin, react-x version pin) is HEAD-side outside the conflict and survives unchanged.

### src/shared/eslint.config.mjs

- **HEAD side:** `files: ["src/**/*.ts"]` followed directly by `rules:` (delegating language/parser/plugins to base).
- **Upstream v2.0.1 side:** inline `extends`/`languageOptions.parserOptions`/`plugins: perfectionist` — already in base.
- **Recommended:** **Pick HEAD wholesale.**

### src/main/prepare-dist-package.mjs

- **HEAD side:** `main: mainPkg.main.replace(/^build\//, "")`, plus author/description/homepage fields preserved in minimal package.json.
- **Upstream v2.0.1 side:** `main: mainPkg.main.replace(/^out\//, "")`, description shortened to `"Vortex"`, no author/homepage.
- **Recommended:** D-31-12 — keep HEAD. Rationale: D-31-13 keeps `src/main/build` output path; the regex must match `build/` not `out/`. Author/description/homepage drop is gratuitous upstream churn.
- **resolvePathCase wiring:** Confirmed not in this file — that's `tsconfig.api.json` territory in v8.0. For v8.1, `tsconfig.api.json` has no diff vs fork/master, so no resolution needed; the v6.0 / FOMD-15-06 wiring inherited from fork/master is intact untouched.

### docker/windows/Dockerfile

- **HEAD side:** `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force` (Windows long-path enable, ~3 lines).
- **Upstream side (marker says `v1.16.9`):** empty.
- **Recommended:** D-31-09 — **keep HEAD**. Long-path support is a real Windows-build correctness item (Vortex paths into game directories regularly exceed 260 chars). No fork-tooling references in the upstream side, but the HEAD content is genuinely additive value. Same as v8.0.
- **v2.0.1 surprise:** Marker label `>>>>>>> v1.16.9` is unexpected — implies the Dockerfile conflict isn't from v2.0.0→v2.0.1 churn but from an older drift carried forward. Doesn't change the resolution but worth recording in commit body.

### .vscode/extensions.json (NOT in conflict on v2.0.1)

- `git diff fork/master..fork/sync/upstream-v2.0.1 -- .vscode/extensions.json` is empty.
- File content: 3 recommendations (`prettier-vscode`, `oxc-vscode`, `vscode-mermaid-chart`) — identical fork+upstream.
- **Action: skip.** D-31-08 stance is moot. Do not create a commit for this file.

### src/renderer/tsconfig.api.json (NOT in conflict on v2.0.1)

- `git diff fork/master..fork/sync/upstream-v2.0.1 -- src/renderer/tsconfig.api.json` is empty.
- **Action: skip.** D-31-12 mention is moot for this file. Existing fork content (with FOMD-15-06 / B1 `resolvePathCase` API surface) is preserved automatically through the merge.

## Lockfile Regen Approach

- **Two-pass install protocol** (D-31-16, D-31-17):
    1. `rm pnpm-lock.yaml` (the merge-side lockfile has 45 conflict markers — useless).
    2. `pnpm install` — writes fresh lockfile from `package.json` + `pnpm-workspace.yaml` catalog.
    3. `pnpm install --frozen-lockfile` — validates fresh lockfile is internally consistent.
- **Drift comparison target:** `git diff fork/sync/upstream-v2.0.1:pnpm-lock.yaml HEAD:pnpm-lock.yaml` (PR-side lockfile is the closest "what upstream v2.0.1 expected" reference even though it has conflict markers — diff against the unconflicted blob view).
- **Catalog mode strict expectations:** Direct deps are pinned at the workspace level (`pnpm-workspace.yaml: catalog:` block). Lockfile drift surfaces only in transitive deps. v2.0.1 catalog adds 4 entries (esptk, exe-version, gamebryo-savegame, native-errors) → expect ~4 new direct top-level entries in lockfile + their transitive trees. v2.0.1 catalog drops 0 entries (HEAD keeps leveldown/levelup). Net direct-dep addition only.
- **First-install timing:** With ~661 lines of lockfile churn pre-regen and the catalog additions, expect 5–15 minutes for `pnpm install` (consistent with v8.0 phase 24-07's experience).
- **Native build guards:** `allowBuilds` block now correctly contains `@electron/rebuild: true` (post keep-HEAD). Native modules in the bucket — `bsatk`, `core-js`, `drivelist`, `electron`, `esbuild`, `font-scanner`, `gamebryo-savegame`, `leveldown`, `loot`, `protobufjs`, `unrs-resolver`, `winapi-bindings`, `xxhash-addon` + `@parcel/watcher` + `@nexusmods/fomod-installer-native` — all enumerated. `nx: false` explicitly disables nx postinstall builds. No surprises expected.

## Plan Shape Recommendation

Target: **8 plans** mirroring v8.0 Phase 24 plan-by-plan with one additional safety net.

| #     | Wave | Files                                                                                                                           | Depends On   | Notes                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31-01 | 1    | (none — branch setup + baseline inventory)                                                                                      | —            | Branch `v8.1/config-bucket` from `fork/sync/upstream-v2.0.1`. **Critical addition vs v8.0:** baseline inventory must verify the 9 (not 11) actually-conflicted Bucket A files match this research's authoritative table; surface the `packages/paths`/`packages/paths-node` orphan-package.json situation as a STOP-and-decide gate before continuing.              |
| 31-02 | 2    | `docker/windows/Dockerfile`                                                                                                     | 31-01        | Single-file plan (vs v8.0's two-file plan that bundled `.vscode/extensions.json`); D-31-08 file no longer needs work. Keep HEAD (long-path support).                                                                                                                                                                                                                |
| 31-03 | 2    | `src/main/eslint.config.mjs`, `src/preload/eslint.config.mjs`, `src/renderer/eslint.config.mjs`, `src/shared/eslint.config.mjs` | 31-01        | **Stance shift vs v8.0 D-10:** pick HEAD wholesale on all four. Document in commit body why upstream-side adds are duplicate of base config.                                                                                                                                                                                                                        |
| 31-04 | 2    | `vitest.config.ts`, `src/main/prepare-dist-package.mjs`                                                                         | 31-01        | Drop `tsconfig.api.json` from v8.0's plan-04 grouping (no conflict on v2.0.1).                                                                                                                                                                                                                                                                                      |
| 31-05 | 2    | `package.json`                                                                                                                  | 31-01        | Keep HEAD wholesale (D-31-06).                                                                                                                                                                                                                                                                                                                                      |
| 31-06 | 2    | `pnpm-workspace.yaml`                                                                                                           | 31-01        | Keep HEAD on allowBuilds + catalog `leveldown`/`levelup`; add upstream catalog additions `esptk`/`exe-version`/`gamebryo-savegame`/`native-errors`. Husky pre-commit will fail if 31-04 hasn't landed first (oxfmt parses YAML); plan dependencies should sequence 31-06 after 31-04 OR allow `--no-verify` with documented rationale (mirrors v8.0 24-05 pattern). |
| 31-07 | 3    | `pnpm-lock.yaml`                                                                                                                | 31-02..31-06 | `rm + pnpm install`; verify `pnpm install --frozen-lockfile`; commit body documents drift summary against `fork/sync/upstream-v2.0.1:pnpm-lock.yaml`.                                                                                                                                                                                                               |
| 31-08 | 4    | (push only)                                                                                                                     | 31-07        | `git push --force-with-lease fork v8.1/config-bucket:sync/upstream-v2.0.1`. `autonomous: false` per CLAUDE.md (force-push to shared remote).                                                                                                                                                                                                                        |

**Total commits:** 1 (Dockerfile) + 4 (eslint × 4 separate commits per D-31-03 atomic-cadence) + 2 (vitest, prepare-dist-package) + 1 (package.json) + 1 (pnpm-workspace.yaml) + 1 (lockfile) = **10 commits** on `v8.1/config-bucket` before push. (v8.0 shipped 13 because of an in-scope BG3 fix; v8.1 shouldn't pick up extras.)

## Risks / Unknowns

### R1 — `packages/paths` and `packages/paths-node` orphan package.json (HIGH)

**What:** v2.0.1 deleted `packages/paths/package.json` and `packages/paths-node/package.json`, but the auto-merge left `packages/paths/src/`, `packages/paths/README.md`, `packages/paths-node/README.md` orphaned on the merge tree. `pnpm-workspace.yaml` has `./packages/*` glob with `failIfNoMatch: true`.

**Verified by:**

```
$ git ls-tree -r fork/sync/upstream-v2.0.1 packages/paths packages/paths-node
100644 blob ... packages/paths-node/README.md
100644 blob ... packages/paths/README.md
100644 blob ... packages/paths/src/FilePath.ts
... (more orphans)
```

No `package.json` in either dir.

**Why it's a Phase 31 problem:** D-31-17 done-gate item 2 is `pnpm install` succeeds. With orphan dirs, `pnpm install` may either (a) error on missing package.json with `failIfNoMatch`, (b) silently skip and produce a lockfile that breaks Phase 32 typecheck on `@vortex/paths` imports, or (c) succeed by virtue of pnpm 10's permissive globbing — outcome unverified.

**Recommended handling:**

- Plan 31-01 must include a **pre-install check** that runs `pnpm install --dry-run` or a `git ls-files packages/paths/package.json packages/paths-node/package.json` and asserts the package.json files exist.
- If absent: **restore from `fork/master`** as the first commit on `v8.1/config-bucket`, before any other resolution work. v8.0 Phase 25 already proved this restoration is the right move; v8.1 simply collapses it into Phase 31's Plan 31-01.
- Restoration command:
    ```bash
    git checkout fork/master -- packages/paths/package.json packages/paths/tsconfig.json packages/paths/tsdown.config.ts packages/paths-node/package.json packages/paths-node/tsconfig.json packages/paths-node/tsconfig.build.json packages/paths-node/vitest.config.ts
    git commit -m "restore(workspaces): packages/paths{,-node} package.json + build configs (v8.0 carry-forward)"
    ```
- Or, if the planner prefers to defer: explicitly document in 31-01-SUMMARY.md as a known issue handed to Phase 32 with a STOP-and-decide gate before Phase 32 begins. The risk of deferral is `pnpm install` failing in 31-07, blocking the entire phase.

### R2 — Reintroduced Jest scaffolding under `src/renderer/src/__mocks__/` (MEDIUM)

**What:** v2.0.1 reintroduces `src/renderer/src/__mocks__/` with 10+ files (collection.json, sdv_collection.json, state.json, ComponentEx.js, electron.js, etc.) — all banned by VORTEX-LINUX-MERGE-PLAYBOOK.md §11.

**Why not Phase 31:** §11 violations don't block tree-parsing or `pnpm install`. They're test-runner-correctness items, not config-bucket items. v8.0 Phase 25 Wave 1 was where these were surfaced.

**Recommended handling:** Document in 31-01-SUMMARY.md as a known-deferred item; surface to **Phase 34** (renderer + main spine) for cleanup. Update §11 of the playbook in Phase 36 post-mortem to note the v2.0.1 sync re-tripped the same pattern v8.0 Phase 25 caught.

### R3 — `src/main/electron-builder.config.json` is new in v2.0.1 (LOW)

**What:** v2.0.1 added `src/main/electron-builder.config.json` (no conflict marker — pure addition) which references `out/` and `dist/` paths consistent with upstream's path-split. Fork uses `electron-builder.config.cjs`.

**Why low:** The `.json` file is dead code unless something references it. `electron-builder.config.cjs` is the active config. But shipping a stale/wrong config in the tree is mildly risky.

**Recommended handling:** Out of scope for Phase 31. Surface to **Phase 35** (build verification) — confirm `pnpm dist` invokes the `.cjs`, not the `.json`. If the `.json` is genuinely orphan, defer deletion to a later cleanup milestone.

### R4 — Dockerfile marker label says `v1.16.9` not `v2.0.1` (LOW)

**What:** Conflict markers in `docker/windows/Dockerfile` say `<<<<<<< HEAD` ... `>>>>>>> v1.16.9`. Implies the conflict isn't from v2.0.0→v2.0.1 churn but from an older drift carried forward (likely PR #5's upstream auto-merge brought a stale conflict region forward).

**Why low:** Doesn't change resolution stance — keep HEAD's long-path block. But worth noting in commit body so future syncs can investigate the drift origin.

### R5 — Husky pre-commit hook fails on un-resolved YAML (MEDIUM, mitigated)

**What:** v8.0 Phase 24 plan-05 (package.json) had to use `--no-verify` because pre-commit oxfmt couldn't parse `pnpm-workspace.yaml` while it still had unresolved markers. v8.1 Phase 31 has the same hazard.

**Mitigation:** Sequence the plans so `pnpm-workspace.yaml` (31-06) is committed before `package.json` (31-05) — or simply accept `--no-verify` on early plans and document in commit body, mirroring v8.0 24-05. Since both files are in Wave 2 with no inter-dependencies, the planner picks the order.

## References

### Authoritative inputs

- `.planning/phases/31-config-bucket/31-CONTEXT.md` — phase decisions (this research's user_constraints section)
- `.planning/REQUIREMENTS.md` — SYNC-2.0.1-02 + SYNC-2.0.1-03 (lines covering "Config bucket resolved before any other bucket" + "pnpm-lock.yaml regenerated cleanly")
- `.planning/ROADMAP.md` — Phase 31 success criteria (zero conflict markers in Bucket A; `pnpm install` succeeds; `--frozen-lockfile` succeeds; IDE/TS server loads tree)
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` §11 (Jest scaffolding deny-list; informs R2)

### Direct prior art

- `.planning/milestones/v8.0-phases/24-config-bucket/24-CONTEXT.md` — D-01..D-18 (v8.1 D-31-01..D-31-18 are 1:1 mirror)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-01-PLAN.md` — branch + baseline-inventory plan (template for 31-01)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-02-PLAN.md` — vscode/Dockerfile plan (template for 31-02; halve to one file)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-03-PLAN.md` — eslint configs plan (template for 31-03; revise stance from hand-merge → pick-HEAD)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-04-PLAN.md` — vitest + tsconfig.api + prepare-dist plan (template for 31-04; drop tsconfig.api)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-05-PLAN.md` — package.json plan (template for 31-05)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-06-PLAN.md` — pnpm-workspace.yaml plan (template for 31-06)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-07-PLAN.md` — lockfile regen plan (template for 31-07)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-08-PLAN.md` — push-with-lease plan (template for 31-08)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-0[1-8]-SUMMARY.md` — execution outcomes informing risk catalog
- `.planning/milestones/v8.0-phases/25-restore-dropped-scaffolding/25-CONTEXT.md` — v8.0 Phase 25 boundary (informs R1)

### Tooling references

- `CLAUDE.md` (project) — Branch Strategy section (`master` = primary, `linux-port` = curated cherry-picks); GSD Workflow Enforcement; tech stack confirms `levelup 4.4.0 + leveldown 5.6.0` legacy persistence
- `AGENTS.md` + `AGENTS-DIRECTORIES.md` — `pnpm run` for repo commands

### Verification commands (run during research, captured for plan re-use)

```bash
# Authoritative conflict-marker enumeration
git fetch fork sync/upstream-v2.0.1
git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.1 -- \
  package.json pnpm-workspace.yaml pnpm-lock.yaml vitest.config.ts \
  'src/main/eslint.config.mjs' 'src/preload/eslint.config.mjs' \
  'src/renderer/eslint.config.mjs' 'src/shared/eslint.config.mjs' \
  'src/main/prepare-dist-package.mjs' '.vscode/extensions.json' \
  'docker/windows/Dockerfile' '*tsconfig*.json'

# Directly check no-conflict files actually have no diff
git diff fork/master..fork/sync/upstream-v2.0.1 -- .vscode/extensions.json src/renderer/tsconfig.api.json

# Confirm orphan packages/paths state (R1)
git ls-tree -r fork/sync/upstream-v2.0.1 packages/paths packages/paths-node
git show fork/sync/upstream-v2.0.1:packages/paths/package.json   # expect: fatal: path ... exists on disk, but not in
```

## Metadata

**Confidence breakdown:**

- Conflict file inventory: HIGH — direct git enumeration on remote ref; cross-checked against CONTEXT.md template
- Per-file resolution stances: HIGH — all conflict regions read end-to-end and analyzed
- ESLint pick-HEAD revision (vs v8.0's hand-merge): HIGH — verified `eslint.config.base.mjs` content shows upstream conflict-side adds are duplicates
- packages/paths orphan risk (R1): HIGH — verified by `git show fork/sync/upstream-v2.0.1:packages/paths/package.json` returning fatal-not-in-tree
- Plan shape recommendation: HIGH — direct mirror of v8.0 Phase 24 with documented deltas
- Lockfile drift estimate: MEDIUM — 4 catalog additions + transitive trees; actual scope only knowable after `pnpm install` runs

**Research date:** 2026-05-22
**Valid until:** Until next push to `fork/sync/upstream-v2.0.1` (the daily `rebase-upstream.yml` cron may re-write the branch — re-run the conflict enumeration if the SHA at `fork/sync/upstream-v2.0.1` changes from `8054a935b6aad505798bba8a993d002718d119cb`).
