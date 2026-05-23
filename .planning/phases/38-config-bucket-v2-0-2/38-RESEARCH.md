# Phase 38: Config bucket (v2.0.2) — Research

**Researched:** 2026-05-23
**Domain:** upstream-merge conflict resolution (config-only files); pnpm 10 catalog-mode lockfile regen
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-38-01:** Branch `v8.2/sync-upstream-v2.0.2` from `fork/master` at `855fb3e1a`. Stack Phase 38 commits on it. (Mirrors v8.1 D-31-01.)
- **D-38-02:** Push back to `fork/sync/upstream-v2.0.2` once at phase end with `--force-with-lease`. (Mirrors v8.1 D-31-02.)
- **D-38-03:** Atomic commits — one per resolved file + 1 lockfile commit. Title `resolve(config): <file> — <stance>`. (Mirrors v8.1 D-31-03.)
- **D-38-04:** Final FF-merge happens at Phase 43, not here. (Mirrors v8.1 D-31-04.)
- **D-38-05:** Default = hand-resolve every file. No blanket pick-ours/pick-theirs. (Mirrors v8.1 D-31-05.)
- **D-38-06:** `package.json` — keep HEAD wholesale on the scripts conflict region. (Mirrors v8.1 D-31-06.)
- **D-38-07:** `pnpm-workspace.yaml` — keep HEAD on allowBuilds; merge upstream catalog additions. (Mirrors v8.1 D-31-07.)
- **D-38-08:** `.vscode/extensions.json` — pick-ours. (Mirrors v8.1 D-31-08.)
- **D-38-09:** `docker/windows/Dockerfile` — hand-resolve. (Mirrors v8.1 D-31-09.)
- **D-38-10:** Four `eslint.config.mjs` files — hand-resolve each. (Mirrors v8.1 D-31-10.)
- **D-38-11:** `vitest.config.ts` — hand-resolve as union; HEAD's globs win. (Mirrors v8.1 D-31-11.)
- **D-38-12:** `tsconfig*.json` + `prepare-dist-package.mjs` — hand-resolve; preserve `resolvePathCase` wiring. (Mirrors v8.1 D-31-12.)
- **D-38-13:** Keep fork's `src/main/build` output. Do NOT adopt `out/`+`dist/` split. (Mirrors v8.1 D-31-13.)
- **D-38-14:** Keep nx-orchestrated typecheck. (Mirrors v8.1 D-31-14.)
- **D-38-15:** Drop any upstream new scripts (`typecheck:extensions`, `build:assets`, `dist:all`, `dist:extensions`, `dist:assets`). Add to deferred ideas. (Mirrors v8.1 D-31-15.)
- **D-38-16:** `rm pnpm-lock.yaml && pnpm install`. Lockfile in own atomic commit titled `chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync`. (Mirrors v8.1 D-31-16.)
- **D-38-17:** Done-gate (5): zero conflict markers in Bucket A; `pnpm install` succeeds; `pnpm install --frozen-lockfile` succeeds; IDE/TS server loads tree without parser errors; lockfile drift summarized in commit body.
- **D-38-18:** Drift handling — document non-trivial deltas in lockfile commit body and accept. (Mirrors v8.1 D-31-18.)

### Claude's Discretion

- Per-file ESLint merge judgment (D-38-10 only locks the strategy).
- Lockfile drift summary format (table or bulleted prose).
- Final actual file list comes from research enumeration (this document).

### Deferred Ideas (OUT OF SCOPE)

- Adopt upstream's `out/` + `dist/` build path split.
- Add `typecheck:extensions` as a separate script.
- Drop nx orchestration.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                                                                                                          | Research Support                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SYNC-38a | Workspace + lockfile + root configs (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `vitest.config.ts`, `prepare-dist-package.mjs`, root TS configs) resolved and `pnpm install --frozen-lockfile` exits 0 | Authoritative conflict-marker enumeration + per-file analysis (sections below); 2 of these files have NO conflict + NO diff and need no commit |
| SYNC-38b | Branch `v8.2/sync-upstream-v2.0.2` cut from master `855fb3e1a`; Phase 38 commits stack on it; v8.1 D-31 catalog + lockfile-regen patterns honored                                                                    | Branch strategy section in CONTEXT D-38-01..D-38-04; lockfile baseline below shows tiny drift (37 lines) — far smaller than v8.1's 661         |

</phase_requirements>

## Summary

PR #6 (`fork/sync/upstream-v2.0.2` at `314ca807c`, merge commit `a918d52ef`, parents `855fb3e1a` + `a402ee6b4`) carries **far fewer Bucket A conflicts than v8.1 expected**. Of the 12 files in the CONTEXT prior-art template, **only 6 actually have conflict markers** in v2.0.2. Four of the v8.1 files (`package.json`, `vitest.config.ts`, `docker/windows/Dockerfile`, `.vscode/extensions.json`) auto-merged cleanly — their fork/master content was preserved byte-identical. This is because v2.0.1 → v2.0.2 made zero changes to `package.json` and `vitest.config.ts`, so the merge driver had nothing to conflict over.

The conflict regions that DO exist all match v8.1's prior-art shapes (eslint base-extraction duplicates, `prepare-dist-package` build/out path, nx-style lockfile regen). Two **new-to-v2.0.2** Bucket A files surface that v8.1 didn't see: `.vscode/launch.json` (3 regions, all `build/` vs `out/` paths — squarely D-38-13 territory) and `src/renderer/tsconfig.json` (1 region, fork added `*.test.ts`/`*.test.tsx` exclusions on top of upstream's set). Both have clean keep-HEAD stances.

Two other conflict-marker files are .mjs build helpers that **belong to Phase 40** by v8.1 precedent, not Phase 38: `extensions/copy-native.mjs` (handled in v8.1 Phase 33) and `rolldown.base.mjs` (also touched in v8.1 Phase 33). They should NOT be resolved in this phase. The plan must call this out explicitly.

**Primary recommendation:** Six plans (vs v8.1's eight). The drop comes from collapsing v8.1's no-op files (`.vscode/extensions.json`, `tsconfig.api.json`, `package.json`, `vitest.config.ts`, `docker/windows/Dockerfile` — all clean on v2.0.2) into Plan 1's baseline-inventory. The lockfile commit's drift will be small enough that Phase 42 build-verification risk is materially lower than v8.1.

## Conflict File Enumeration (authoritative)

Source: `git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.2 -- '*'` run 2026-05-23.

Filtered to Bucket A (config / lockfile / eslint / tsconfig / Dockerfile / .vscode / build-tooling .mjs); excluded source files (`src/**/*.ts`, `*.tsx`) and documentation (`.planning/**`, `.github/**`).

| File                                                                                                                 | In Bucket A scope?  | Conflict regions | Resolution stance                                                                                             | Notes                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `package.json`                                                                                                       | **No conflict**     | 0                | n/a — no markers, no diff vs `fork/master`                                                                    | **Skip — no commit needed.** v2.0.1 == v2.0.2 for this file; auto-merge took HEAD. D-38-06/13/14/15 already reflected.   |
| `vitest.config.ts`                                                                                                   | **No conflict**     | 0                | n/a — no markers, no diff vs `fork/master`                                                                    | **Skip — no commit needed.** v2.0.1 == v2.0.2 for this file; D-38-11 moot.                                               |
| `docker/windows/Dockerfile`                                                                                          | **No conflict**     | 0                | n/a — no markers, no diff vs `fork/master`                                                                    | **Skip — no commit needed.** D-38-09 moot.                                                                               |
| `.vscode/extensions.json`                                                                                            | **No conflict**     | 0                | n/a — no markers, no diff vs `fork/master`                                                                    | **Skip — no commit needed** (same as v8.1). D-38-08 moot.                                                                |
| `tsconfig.json` (root) + `eslint.config.base.mjs` + `tsconfig.base.json` + per-workspace tsconfigs (except renderer) | **No conflict**     | 0                | n/a                                                                                                           | No work.                                                                                                                 |
| `pnpm-workspace.yaml`                                                                                                | YES                 | 1                | D-38-07 — keep HEAD line; take upstream's `native-errors` + nexus-api SHA bump as additive                    | Single small region; see Per-File Analysis                                                                               |
| `src/main/eslint.config.mjs`                                                                                         | YES                 | 2                | D-38-10 — pick HEAD wholesale; upstream side is duplicate of `eslint.config.base.mjs`                         | v8.1 R-revision applies (pick HEAD; not hand-merge)                                                                      |
| `src/preload/eslint.config.mjs`                                                                                      | YES                 | 1                | D-38-10 — pick HEAD wholesale                                                                                 | Upstream side is ~50 lines of inline rules already in base                                                               |
| `src/renderer/eslint.config.mjs`                                                                                     | YES                 | 2                | D-38-10 — pick HEAD wholesale on conflict regions                                                             | Renderer's HEAD-only rules (vortex/no-bluebird-\*, react-x, better-tailwindcss) are outside conflict regions and survive |
| `src/shared/eslint.config.mjs`                                                                                       | YES                 | 2                | D-38-10 — pick HEAD wholesale                                                                                 | Upstream side is duplicate of base                                                                                       |
| `src/main/prepare-dist-package.mjs`                                                                                  | YES                 | 1                | D-38-12 — keep HEAD (preserve fork's `packagesSection`/`neededWorkspaceDirs` block + workspace:\* resolution) | Upstream side simply lacks the fork addition; not a real choice                                                          |
| `src/renderer/tsconfig.json`                                                                                         | YES (NEW vs v8.1)   | 1                | Keep HEAD (fork's `*.test.ts`/`*.test.tsx` exclude additions)                                                 | New territory — v8.1 had no diff here                                                                                    |
| `.vscode/launch.json`                                                                                                | YES (NEW vs v8.1)   | 3                | Keep HEAD on all three (fork's `build/` paths under D-38-13)                                                  | New territory — v8.1 had no conflict here; 3 identical-shape regions                                                     |
| `pnpm-lock.yaml`                                                                                                     | YES                 | 1 marker         | D-38-16 — regenerate (do NOT hand-resolve)                                                                    | Single conflict region; far smaller drift than v8.1 (37 lines vs 661)                                                    |
| `extensions/copy-native.mjs`                                                                                         | **OUT OF BUCKET A** | 1                | n/a here — defer to Phase 40 (gamebryo + per-game extensions)                                                 | v8.1 prior art: handled in Phase 33; not Phase 31                                                                        |
| `rolldown.base.mjs`                                                                                                  | **OUT OF BUCKET A** | 1                | n/a here — defer to Phase 40                                                                                  | v8.1 prior art: handled in Phase 33 build-scaffolding wave                                                               |

**Hand-resolved Bucket A file count for v8.2: 8** (vs v8.1's 9). Plus 1 lockfile regen commit. Total commits: **9** (8 file resolutions + 1 lockfile).

**Total conflict-region count across Bucket A files: 14** (1 + 2 + 1 + 2 + 2 + 1 + 1 + 3 + 1 marker for lockfile).

## Per-File Analysis

### pnpm-workspace.yaml (1 conflict region)

```
<<<<<<< HEAD
  nexus-api: git+https://github.com/Nexus-Mods/node-nexus-api#4dd3460c2d02d93ba8f1bbeeeb2c5fa9af039a67
=======
  native-errors: git+https://github.com/Nexus-Mods/node-native-errors#51913db07e4c9b68a96ba7fcf741b32796758f18
  nexus-api: git+https://github.com/Nexus-Mods/node-nexus-api#2d92fd2bdc4aa6b9813a1e7043d412e13f4aa1d7
>>>>>>> v2.0.2
```

- **HEAD side:** keeps existing `nexus-api` git SHA `4dd3460c2d`.
- **Upstream side:** adds `native-errors` package, bumps `nexus-api` SHA to `2d92fd2bdc`.
- **Resolution:** Take **upstream side** (the `native-errors` line is additive; the SHA bump is real upstream movement). The first line of the catalog (`@nexusmods/nexus-api`) ALSO bumps from `4dd3460c2d` → `2d92fd2bdc`, and that part auto-merged cleanly outside this conflict region. Both `nexus-api` entries should be on the new SHA.
- **D-38-07 alignment:** D-38-07 says "keep HEAD on allowBuilds". The `allowBuilds` block has NO conflict in v2.0.2 (auto-merged clean — `@electron/rebuild: true` survived). This single conflict region is purely catalog-additive on upstream side. Keep `@electron/rebuild: true` (already present, no work needed) AND take upstream's `native-errors` line + the SHA bump.
- **D-38-14 verification:** `nx: ^22.7.1` confirmed present in catalog (auto-merge preserved it). No restoration needed.
- **D-38-15 alignment:** No new upstream scripts in this file (D-38-15 applies to package.json, which is a no-op here).

**v2.0.1 → v2.0.2 delta in this file: only the `nexus-api` SHA bump** (verified `git diff v2.0.1:pnpm-workspace.yaml v2.0.2:pnpm-workspace.yaml`). The `native-errors` entry was already in v2.0.1 — its presence in the conflict region reflects fork's HEAD never picking it up. Compatible with v8.1 D-31-07 catalog-additions stance.

### src/main/eslint.config.mjs (2 conflict regions)

Both regions: HEAD is empty (delegated to `eslint.config.base.mjs`); upstream side adds:

- Region 1: `extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, prettierConfig]` — already in base.
- Region 2: A `files: ["*.mjs"]` block with recommended/perfectionist plugins — already in base (`eslint.config.base.mjs` lines ~52-65).

**Resolution:** Pick HEAD wholesale on both regions. Upstream side is 100% duplicate of `eslint.config.base.mjs`.

**v2.0.1 → v2.0.2 delta:** Upstream REDUCED inline rules by 12 lines (extracted further toward shared base; verified `git diff v2.0.1:src/main/eslint.config.mjs v2.0.2:src/main/eslint.config.mjs`). Doesn't change resolution — fork's base extraction is still ahead.

### src/preload/eslint.config.mjs (1 conflict region)

Single large region: HEAD is `export default defineConfig([...baseConfig(import.meta.dirname)]);` (one-liner delegating to base). Upstream side is ~50 lines of inline rules (recommended, recommendedTypeChecked, perfectionist, consistent-type-imports, no-unused-vars, separate `.mjs` block) — all already in `eslint.config.base.mjs`.

**Resolution:** Pick HEAD wholesale.

### src/renderer/eslint.config.mjs (2 conflict regions)

- **Region 1 (imports):** HEAD has `eslint-import-resolver-typescript`, `eslint-plugin-better-tailwindcss`, `eslint-plugin-import`. Upstream side adds `eslint-config-prettier` and `eslint-plugin-perfectionist` imports — both already imported via base extension chain.
- **Region 2 (config block):** HEAD empty; upstream adds the `*.mjs` block — already in base.

**Resolution:** Pick HEAD wholesale on both regions. Renderer's significant rule content (vortex/no-bluebird-\*, react-x, better-tailwindcss, perfectionist sort-jsx-props, stylistic plugin) is HEAD-side outside the conflict and survives.

### src/shared/eslint.config.mjs (2 conflict regions)

- **Region 1:** HEAD empty; upstream adds `extends`/`languageOptions.parserOptions.projectService` block — already in base.
- **Region 2:** HEAD empty; upstream adds `*.mjs` block — already in base.

**Resolution:** Pick HEAD wholesale.

### src/main/prepare-dist-package.mjs (1 conflict region)

```
<<<<<<< HEAD
  // Emit a packages: section so pnpm can resolve workspace:* refs in file: deps.
  let packagesSection = "";
  if (neededWorkspaceDirs && neededWorkspaceDirs.size > 0) {
    const lines = [...neededWorkspaceDirs]
      .map((absPath) => `  - ${relative(DIST_DIR, absPath)}`)
      .join("\n");
    packagesSection = `packages:\n${lines}\n\n`;
  }
  const minimalYaml =
    packagesSection + (overrides ? overrides + "\n" : "") + catalog + "\n" + allowBuilds + "\n";
=======
  const minimalYaml = (overrides ? overrides + "\n" : "") + catalog + "\n" + allowBuilds + "\n";
>>>>>>> v2.0.2
```

- **HEAD side:** fork's `packagesSection` emission for workspace:\* resolution in dist context. Substantial fork addition (15 lines).
- **Upstream side:** vanilla one-liner; lacks the fork addition entirely.
- **Resolution:** Keep HEAD wholesale (D-38-12). The fork addition is necessary for fork's dist build flow.

**v2.0.1 → v2.0.2 delta in this file: pure whitespace/oxfmt formatting only** (verified `git diff v2.0.1:src/main/prepare-dist-package.mjs v2.0.2:src/main/prepare-dist-package.mjs` — 14 ins / 101 dels of formatting churn). Fork's HEAD divergence is 101 lines beyond v2.0.2; the conflict region is just one of several fork-side additions.

**resolvePathCase wiring:** Confirmed not in this file (it's in `tsconfig.api.json`, which has no conflict in v2.0.2 — preserved automatically).

### src/renderer/tsconfig.json (1 conflict region) — NEW vs v8.1

```
<<<<<<< HEAD
  "exclude": [
    "src/__mocks__/",
    "src/__tests__/",
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "./dist", "./temp", "./lib", "node_modules"
  ],
=======
  "exclude": ["src/__mocks__/", "src/__tests__/", "./dist", "./temp", "./lib", "node_modules"],
>>>>>>> v2.0.2
```

- **HEAD side:** Fork added `src/**/*.test.ts` + `src/**/*.test.tsx` to the exclude list (likely a v8.1 typecheck-correctness fix to keep test files out of the production tsconfig).
- **Upstream side:** Lacks the test glob excludes; otherwise identical content.
- **Resolution:** Keep HEAD. Removing the test excludes would re-introduce typecheck noise that v8.1 already cleared.
- **NEW vs v8.1:** v8.1's `src/renderer/tsconfig.json` had no diff vs fork/master. v2.0.2 brings this file into Bucket A territory.

### .vscode/launch.json (3 conflict regions) — NEW vs v8.1

All three regions are structurally identical:

```
<<<<<<< HEAD
      "outFiles": ["${workspaceFolder}/src/main/build/**/*.{js,cjs}"],
=======
      "outFiles": ["${workspaceFolder}/src/main/out/**/*.{js,cjs}"],
>>>>>>> v2.0.2
```

The three occurrences are for "Debug Main Process", "Debug Main Process (System Electron)", "Debug Main Process (Staging)".

- **Resolution:** Keep HEAD on all three. This is squarely D-38-13 territory (`src/main/build` vs `src/main/out`).
- **NEW vs v8.1:** v8.1 had no conflict in `.vscode/launch.json`. v2.0.2 brings 3 mechanical regions into Bucket A scope.

### pnpm-lock.yaml (1 marker)

Single conflict marker (vs v8.1's 45 markers). The lockfile is regenerated regardless of marker count per D-38-16 — the marker count is informational only.

**Drift baseline (pre-regen):** `git diff fork/master:pnpm-lock.yaml fork/sync/upstream-v2.0.2:pnpm-lock.yaml --stat` → **22 ins / 15 del across 1 file**, on a 22,891-line baseline (master) / 22,898-line head (sync). Sub-0.2% drift. Compare to v8.1's 661 lines.

**Implications:**

- Catalog additions are minimal (just `native-errors` and the `nexus-api` SHA bump).
- Transitive-dep churn should be small.
- `pnpm install` runtime estimated 3–8 minutes (vs v8.1's 5–15).
- Lockfile commit body's drift summary will be short.

## v2.0.2-Specific Notes

**Surprise 1: package.json + vitest.config.ts are unconflicted.** v2.0.1 → v2.0.2 made literally zero changes to either file. The auto-merge took fork's HEAD wholesale because there was nothing to conflict over. CONTEXT D-38-06, D-38-11, D-38-13, D-38-14, D-38-15 all become **moot** — the file already reflects every fork-side stance. No commit needed.

**Surprise 2: `.vscode/extensions.json` and `docker/windows/Dockerfile` are also unconflicted.** Same root cause — no upstream movement, fork's content preserved through the merge.

**Surprise 3: D-38-15 (drop new upstream scripts) is moot.** v2.0.1 already had `dist:all`, `dist:assets`, `dist:extensions`, `build:assets`, `typecheck:extensions`. v2.0.2 added zero new scripts. v8.1's pick-HEAD on `package.json` already kept these out; the auto-merge in v2.0.2 preserved that resolution. Mention in the SUMMARY but no work to do.

**Surprise 4: Two new-to-v8.2 Bucket A files**: `.vscode/launch.json` (3 mechanical `build/` vs `out/` regions) and `src/renderer/tsconfig.json` (1 region — fork's test-glob excludes). Both have clean keep-HEAD stances; both align with existing locked decisions (D-38-13 for launch.json, conservative-additive for tsconfig).

**Surprise 5: Two .mjs files conflict but belong to Phase 40, not 38.** `extensions/copy-native.mjs` and `rolldown.base.mjs` are gamebryo/build-scaffolding territory per v8.1 Phase 33 precedent. Plan must explicitly EXCLUDE them with a documented note.

**Surprise 6: Lockfile drift is tiny.** 37 lines vs v8.1's 661. Means downstream Phase 42 build-verification risk is materially lower than v8.1.

**Master HEAD drift (LOW risk):** CONTEXT cites master at `855fb3e1a` and merge tree at `3c032384cca696a9f578f392a6807ba3b0681675`. Current master is `ea21358a4` (CONTEXT-creation commits), and current merge-tree SHA is `f26c9688fc1cc017c32af190dd03f4e6ebf57602`. The master drift is two commits adding `.planning/` files (REQUIREMENTS, ROADMAP, milestone-start docs) — none touch Bucket A content. The merge-tree SHA changed only because master moved. **Phase 38 should branch from `ea21358a4`** (current master HEAD) per D-38-01 spirit, not from the now-stale `855fb3e1a`.

## Lockfile Baseline

| Property                                                                              | Value                                                                                                           |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `git diff fork/master:pnpm-lock.yaml fork/sync/upstream-v2.0.2:pnpm-lock.yaml --stat` | 22 ins / 15 del / 1 file changed                                                                                |
| Baseline lockfile size (master)                                                       | 22,891 lines                                                                                                    |
| Sync branch lockfile size                                                             | 22,898 lines                                                                                                    |
| Drift fraction                                                                        | ~0.16%                                                                                                          |
| Conflict markers in sync lockfile                                                     | 1                                                                                                               |
| Catalog adds (master → upstream v2.0.2)                                               | 1 (`native-errors`) — already merged at the catalog top, conflict region is the secondary `nexus-api` reference |
| Catalog drops                                                                         | 0                                                                                                               |
| Catalog SHA bumps                                                                     | 1 (`@nexusmods/nexus-api` and the duplicate `nexus-api` reference both bump from `4dd3460c2d` → `2d92fd2bdc`)   |
| Estimated `pnpm install` runtime                                                      | 3–8 minutes                                                                                                     |

**Drift comparison target for D-38-17 done-gate item 5:** `git diff fork/sync/upstream-v2.0.2:pnpm-lock.yaml HEAD:pnpm-lock.yaml` post-regen. Document non-trivial deltas in the lockfile commit body per D-38-18.

## Plan Partitioning Recommendation

Target: **6 plans** (vs v8.1's 8). Smaller because 4 of v8.1's no-op files don't need commits at all in v8.2.

| #     | Wave | Files                                                                                                                           | Depends on   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 38-01 | 1    | (none — branch + baseline-inventory)                                                                                            | —            | Branch `v8.2/sync-upstream-v2.0.2` from current master HEAD (`ea21358a4`, NOT `855fb3e1a` per drift note). Verify the 8 (not 12) actually-conflicted Bucket A files match this research's table. **Critical addition:** verify `.planning/` drift is benign (only milestone-start docs); confirm `extensions/copy-native.mjs` + `rolldown.base.mjs` are explicitly out-of-scope (route to Phase 40); confirm `package.json`/`vitest.config.ts`/`docker/windows/Dockerfile`/`.vscode/extensions.json` need no commits. **Verify R1-equivalent:** `git ls-files packages/paths/package.json packages/paths-node/package.json` exists post-merge (v8.1 R1 risk). |
| 38-02 | 2    | `.vscode/launch.json`, `src/renderer/tsconfig.json`                                                                             | 38-01        | Two single-region+three-region small files; both pure keep-HEAD. Bundle as one plan because both are mechanical and align with D-38-13 / conservative-additive stances. Two atomic commits per D-38-03 (one per file).                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 38-03 | 2    | `src/main/eslint.config.mjs`, `src/preload/eslint.config.mjs`, `src/renderer/eslint.config.mjs`, `src/shared/eslint.config.mjs` | 38-01        | Pick HEAD wholesale on all four (revised D-38-10 stance per v8.1 research note). Document in commit bodies that upstream-side adds are duplicates of `eslint.config.base.mjs`. Four atomic commits.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 38-04 | 2    | `src/main/prepare-dist-package.mjs`                                                                                             | 38-01        | Single-file plan. Keep HEAD's `packagesSection` block (D-38-12).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 38-05 | 2    | `pnpm-workspace.yaml`                                                                                                           | 38-01        | Take upstream catalog additions (`native-errors` + `nexus-api` SHA bump) at the conflict region; keep `@electron/rebuild: true` allowBuilds (already preserved by auto-merge). Husky pre-commit risk: package.json doesn't need a commit so the cross-file YAML/JSON parse-block hazard from v8.1 24-05/31-06 is **not relevant in v8.2** — pnpm-workspace.yaml can safely commit with hooks enabled.                                                                                                                                                                                                                                                         |
| 38-06 | 3    | `pnpm-lock.yaml`                                                                                                                | 38-02..38-05 | `rm pnpm-lock.yaml && pnpm install`; verify with `pnpm install --frozen-lockfile`; commit body documents drift summary against `fork/sync/upstream-v2.0.2:pnpm-lock.yaml` (target reference per D-38-17 item 5). Single regen commit per D-38-16.                                                                                                                                                                                                                                                                                                                                                                                                             |

**Push plan:** v8.1 had a separate Plan 31-08 for the force-with-lease push. CONTEXT D-38-02 still requires the push at phase end. **Recommendation:** roll the push into 38-06 as a `--no-verify` step after lockfile commit, OR keep as a separate Plan 38-07 marked `autonomous: false` per CLAUDE.md (force-push to shared remote requires human-confirm).

| #(opt) | Wave | Files       | Depends on | Notes                                                                                                                                                                                     |
| ------ | ---- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 38-07  | 4    | (push only) | 38-06      | `git push --force-with-lease fork v8.2/sync-upstream-v2.0.2:sync/upstream-v2.0.2`. Use SSH inline URL per `feedback_git_push_ssh.md` (sandbox blocks `.git/config`). `autonomous: false`. |

**Total commits:** 1 (launch.json) + 1 (tsconfig.json) + 4 (eslint × 4) + 1 (prepare-dist-package) + 1 (pnpm-workspace.yaml) + 1 (lockfile) = **9 commits** on `v8.2/sync-upstream-v2.0.2` before push. v8.1 shipped 10; v8.2 saves one because `docker/windows/Dockerfile` is unconflicted. Total commits including v2.0.2 new launch.json/tsconfig.json: still 9 (gained 2 new-file commits, lost 1 Dockerfile commit, lost 4 no-op file commits from the v8.1 list).

## Risks / Unknowns

### R1 — `packages/paths` and `packages/paths-node` orphan package.json (carry-forward from v8.1, status unknown for v2.0.2)

**What:** v8.1 Phase 31 surfaced that v2.0.1's auto-merge dropped `packages/paths/package.json` and `packages/paths-node/package.json`, leaving orphan src/README files. Phase 31 restored them from `fork/master`. Since v8.1 closed cleanly (commit `6ad9c51e4`), `fork/master` should still have those package.json files — but the v2.0.2 auto-merge could re-drop them.

**Verification needed in Plan 38-01:**

```bash
git show fork/sync/upstream-v2.0.2:packages/paths/package.json
git show fork/sync/upstream-v2.0.2:packages/paths-node/package.json
```

If absent → restore from `fork/master` as the first commit on `v8.2/sync-upstream-v2.0.2` (mirrors v8.1's R1 mitigation). If present → benign.

### R2 — Reintroduced Jest scaffolding under `src/renderer/src/__mocks__/` (MEDIUM, deferred to Phase 41)

**What:** v8.1 found v2.0.1 reintroducing `__mocks__/` artifacts banned by VORTEX-LINUX-MERGE-PLAYBOOK.md §11. v2.0.2 is downstream of v2.0.1 — likely still has them.

**Why not Phase 38:** §11 violations don't block tree-parsing or `pnpm install`. Per SYNC-41c requirement, this is Phase 41 territory.

**Recommended handling:** Document in 38-01-SUMMARY.md as known-deferred; route to Phase 41 (matches SYNC-41c language).

### R3 — `extensions/copy-native.mjs` + `rolldown.base.mjs` resolved out of order

**What:** Both files have conflict markers but belong to Phase 40 (gamebryo + per-game extensions, mirroring v8.1 Phase 33). If Phase 38 accidentally touches them, Phase 40's diff context becomes unclean.

**Mitigation:** Plan 38-01's baseline-inventory must explicitly enumerate them as out-of-scope, and Plans 38-02..38-06 must avoid `git add`-ing them. Phase 38 done-gate (D-38-17 item 1 — zero conflict markers in **Bucket A**) is unaffected because both files are out-of-bucket.

### R4 — Master HEAD drift (LOW)

**What:** CONTEXT cites master `855fb3e1a` and merge tree `3c032384cca696a9f578f392a6807ba3b0681675`. Both have moved to `ea21358a4` and `f26c9688fc1cc017c32af190dd03f4e6ebf57602` respectively. The drift is two `.planning/` commits (REQUIREMENTS + ROADMAP seed + milestone-start) — none touch Bucket A.

**Mitigation:** Plan 38-01 should branch from current master HEAD (`ea21358a4`) and document the deviation from CONTEXT's `855fb3e1a` reference in the SUMMARY.

### R5 — Husky pre-commit hook on un-resolved YAML (LOW for v8.2, vs MEDIUM for v8.1)

**What:** v8.1 Phase 31 plan-05 needed `--no-verify` because pre-commit oxfmt couldn't parse `pnpm-workspace.yaml` while it had unresolved markers. In v8.2 only ONE Bucket A YAML file conflicts (pnpm-workspace.yaml itself), and there's no companion package.json conflict — so once Plan 38-05 resolves the YAML, hooks can run normally for everything that follows.

**Mitigation:** Sequence Plan 38-05 (pnpm-workspace.yaml) before Plan 38-06 (lockfile). Other plans should run hooks normally. Document in commit body if any plan needs `--no-verify`.

## References

### Authoritative inputs

- `.planning/phases/38-config-bucket-v2-0-2/38-CONTEXT.md` — phase decisions D-38-01..D-38-18
- `.planning/REQUIREMENTS.md` — SYNC-38a + SYNC-38b
- `.planning/ROADMAP.md` — Phase 38 success criteria
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §11 (Jest scaffolding deny-list, informs R2)

### Direct prior art

- `.planning/phases/31-config-bucket/31-CONTEXT.md` — v8.1 D-31-01..D-31-18 (1:1 mirror to v8.2)
- `.planning/phases/31-config-bucket/31-RESEARCH.md` — v8.1 conflict enumeration approach (this doc's structural template)
- `.planning/phases/31-config-bucket/31-{01..08}-PLAN.md` — v8.1 8-plan shape
- `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-07-wave-E-build-scaffolding-PLAN.md` — informs R3 (rolldown/copy-native belong to Phase 40)

### Verification commands (run during research)

```bash
git rev-parse fork/master fork/sync/upstream-v2.0.2
# fork/master: ea21358a4  (CONTEXT cites 855fb3e1a — drift noted in R4)
# fork/sync/upstream-v2.0.2: 314ca807c

git merge-tree --write-tree fork/master fork/sync/upstream-v2.0.2
# f26c9688fc1cc017c32af190dd03f4e6ebf57602 (CONTEXT cites 3c032384cc — moved with master HEAD)

# Authoritative conflict-marker enumeration
git grep -l '^<<<<<<< ' fork/sync/upstream-v2.0.2 -- '*' | grep -vE '\.planning/|\.github/'

# Per-Bucket-A-file conflict region count
for f in pnpm-workspace.yaml src/{main,preload,renderer,shared}/eslint.config.mjs \
         src/main/prepare-dist-package.mjs src/renderer/tsconfig.json \
         .vscode/launch.json pnpm-lock.yaml; do
  echo "$f $(git show fork/sync/upstream-v2.0.2:"$f" | grep -c '^<<<<<<< ')"
done

# Lockfile drift baseline
git diff fork/master:pnpm-lock.yaml fork/sync/upstream-v2.0.2:pnpm-lock.yaml --stat

# Confirm no-conflict, no-diff status for the v8.1 prior-art files that auto-merged
for f in package.json vitest.config.ts docker/windows/Dockerfile .vscode/extensions.json; do
  git diff --stat fork/master..fork/sync/upstream-v2.0.2 -- "$f"
done

# v2.0.1 → v2.0.2 deltas (to confirm the auto-merge was clean)
git diff v2.0.1:package.json v2.0.2:package.json
git diff v2.0.1:vitest.config.ts v2.0.2:vitest.config.ts
git diff v2.0.1:pnpm-workspace.yaml v2.0.2:pnpm-workspace.yaml
git diff --stat v2.0.1 v2.0.2 -- 'src/*/eslint.config.mjs' eslint.config.base.mjs
```

## Assumptions Log

| #   | Claim                                                                                                                                | Section                       | Risk if Wrong                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `extensions/copy-native.mjs` + `rolldown.base.mjs` correctly defer to Phase 40 (per v8.1 Phase 33 precedent)                         | Conflict File Enumeration; R3 | If included in Phase 38, Phase 40 bucket E build-scaffolding plans get out-of-order context — recoverable but messy                                                                                           |
| A2  | `packages/paths{,-node}/package.json` survived v8.1 Phase 31 restoration into `fork/master` and the v2.0.2 auto-merge preserved them | R1                            | If absent on `fork/sync/upstream-v2.0.2`, Plan 38-01 must add a restore commit (R1 mitigation defined; risk is detection-not-execution)                                                                       |
| A3  | The single conflict region in `pnpm-workspace.yaml` is independent of the auto-merged `@electron/rebuild: true` allowBuilds line     | Per-File Analysis             | If allowBuilds was actually conflicted and just not surfaced via grep, `pnpm install` could silently lose `@electron/rebuild`. Verified via region read — confidence HIGH but worth a Plan 38-05 sanity check |

## Metadata

**Confidence breakdown:**

- Conflict file inventory: **HIGH** — direct git enumeration on remote ref; cross-checked against CONTEXT template; verified 4 v8.1 files have NO diff at all
- Per-file resolution stances: **HIGH** — all conflict regions read end-to-end
- ESLint pick-HEAD stance (vs hand-merge): **HIGH** — verified `eslint.config.base.mjs` content shows upstream conflict-side adds are duplicates; v2.0.1→v2.0.2 only reduced upstream-side inline rules further
- Lockfile drift estimate: **HIGH** — direct `git diff --stat` on lockfile blobs; tiny (37 lines) so prediction error is bounded
- Plan shape recommendation: **HIGH** — direct mirror of v8.1 Phase 31 with two file additions (launch.json, tsconfig.json) and four file deletions (clean-merge no-ops)
- R1 packages/paths verification (deferred to Plan 38-01): **MEDIUM** — fork/master state assumed-good post v8.1 closure; verification scripted

**Research date:** 2026-05-23
**Valid until:** Until next push to `fork/sync/upstream-v2.0.2` (the daily `rebase-upstream.yml` cron may re-write the branch — re-run the conflict enumeration if the SHA at `fork/sync/upstream-v2.0.2` changes from `314ca807c1da7fb0f227c25f8d69d948b60f3fed`).
