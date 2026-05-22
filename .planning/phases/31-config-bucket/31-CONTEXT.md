# Phase 31: Config bucket - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the config-bucket files on `sync/upstream-v2.0.1` (Bucket A, mirrors v8.0 Phase 24) so the project parses and `pnpm install` succeeds. Lockfile regenerated, not hand-merged. No source-code conflicts touched — those are Phases 32–34. No FF-merge to master here — that's Phase 36.

**Bucket A files (per ROADMAP success criterion 1, file list mirrors v8.0):**

- `package.json`
- `pnpm-lock.yaml` (regenerate)
- `pnpm-workspace.yaml`
- `vitest.config.ts`
- `src/main/eslint.config.mjs`
- `src/preload/eslint.config.mjs`
- `src/renderer/eslint.config.mjs`
- `src/shared/eslint.config.mjs`
- `src/main/prepare-dist-package.mjs`
- `tsconfig*.json` (root + per-workspace as conflicts surface)
- `.vscode/extensions.json`
- `docker/windows/Dockerfile`

Plan-phase researcher must `git diff fork/sync/upstream-v2.0.1` to enumerate the actual conflict-marker file set; v8.0 list above is the prior-art template, not authoritative for v2.0.1.

**Out of scope this phase:** Mod-management hot zone (`InstallManager.ts`, `LinkingDeployment.ts`, …) — Phase 32. Gamebryo + per-game extensions — Phase 33. Renderer + main spine — Phase 34. Source typecheck/build/test verification — Phase 35.

</domain>

<decisions>
## Implementation Decisions

### Branch Strategy

- **D-31-01:** Resolve on a local branch named `v8.1/config-bucket`, branched from `fork/sync/upstream-v2.0.1`. Inherits PR #5's existing merge commit + conflict markers. (Mirrors v8.0 D-01.)
- **D-31-02:** Push back to `fork/sync/upstream-v2.0.1` once at phase end with `--force-with-lease` (defends against the daily `rebase-upstream.yml` cron clobbering us). PR #5 review thread stays live. (Mirrors v8.0 D-02.)
- **D-31-03:** Atomic commits — one commit per file + 1 lockfile commit. Title format `resolve(config): <file> — <one-line stance>`. Easy to bisect; matches GSD atomic-commit norm. (Mirrors v8.0 D-03.)
- **D-31-04:** Final FF-merge of `sync/upstream-v2.0.1` into master happens at Phase 36, not here. (Mirrors v8.0 D-04.)

### Per-File Resolution Stance

- **D-31-05:** Default = hand-resolve every file. No blanket pick-ours / pick-theirs across the bucket. (Mirrors v8.0 D-05.)
- **D-31-06:** `package.json` — keep HEAD wholesale on the scripts conflict region. Preserves `rebuild:native` (electron-rebuild + scripts/rebuild-pnpm-natives.cjs), keeps `src/main/build` output paths, keeps nx-orchestrated typecheck, keeps fork's existing build/dist/package/assets script structure. Continue to drop upstream's `dist:all`, `build:assets`, `dist:assets`, `dist:extensions`, `typecheck:extensions` if v2.0.1 reasserts them. (Mirrors v8.0 D-06.)
- **D-31-07:** `pnpm-workspace.yaml` — keep HEAD on allowBuilds conflict region: retain `"@electron/rebuild": true` (paired with `rebuild:native` per D-31-06). Merge upstream additions to the catalog elsewhere in the file as additive non-conflicting changes. (Mirrors v8.0 D-07.)
- **D-31-08:** `.vscode/extensions.json` — pick-ours (fork IDE preference is curated; ignore upstream drift). (Mirrors v8.0 D-08.)
- **D-31-09:** `docker/windows/Dockerfile` — hand-resolve (one read to confirm no fork-tooling references; default to pick-theirs only after that read). (Mirrors v8.0 D-09.)
- **D-31-10:** Four `eslint.config.mjs` files (main + preload + renderer + shared) — hand-resolve each. Merge new upstream rule additions onto fork's customizations (perfectionist plugin sort, oxfmt, fork-specific ignores). Root `eslint.config.mjs` still extends `eslint.config.base.mjs` per v8.0 unless v2.0.1 changes that. (Mirrors v8.0 D-10.)
- **D-31-11:** `vitest.config.ts` — hand-resolve as union. HEAD's glob patterns cover most upstream explicit entries. Add explicit entries upstream lists that the globs don't catch. Confirm via `git ls-files | grep vitest.config.ts`. (Mirrors v8.0 D-11.)
- **D-31-12:** `tsconfig*.json` + `prepare-dist-package.mjs` — hand-resolve. Preserve fork's vortex-api `.d.ts` generation flow (Phase 15 / FOMD-15-06 wired `resolvePathCase` into the public API surface — must not regress). (Mirrors v8.0 D-12.)

### Build Output Path Direction

- **D-31-13:** Keep fork's `src/main/build` output structure. Do NOT adopt any upstream `out/`+`dist/` split that v2.0.1 may reassert. Resolution is `package.json` scripts conflict region = pick HEAD. Rationale: zero CI/AppImage/electron-builder/postinstall/bundledPlugins/validation-test churn. (Mirrors v8.0 D-13.)
- **D-31-14:** Keep nx-orchestrated typecheck (`pnpm nx run-many -t typecheck`). Verify nx is still present in catalog or root devDependencies after lockfile regen; restore if upstream removed it entirely. (Mirrors v8.0 D-14.)
- **D-31-15:** Drop any upstream new scripts (`typecheck:extensions`, `build:assets`, `dist:all`, `dist:extensions`, `dist:assets`) entirely. Add to deferred ideas — revisit in a future cleanup milestone, not v8.1. (Mirrors v8.0 D-15.)

### Lockfile + Verification Gate

- **D-31-16:** Regenerate fresh — `rm pnpm-lock.yaml && pnpm install`. Commit the regenerated lockfile in its own atomic commit titled `chore(deps): regenerate pnpm-lock.yaml after v2.0.1 sync`. (Mirrors v8.0 D-16.)
- **D-31-17:** Phase 31 done-gate is all four (matches ROADMAP success criteria 1–4):
    1. `git grep '^<<<<<<< '` zero hits in Bucket A files
    2. `pnpm install` succeeds (matches SYNC-2.0.1-03 literal text)
    3. `pnpm install --frozen-lockfile` succeeds on a second run (lockfile internally consistent)
    4. IDE/TypeScript server loads tree without parser errors and resolves all workspace packages
    5. Lockfile drift diff: `git diff fork/sync/upstream-v2.0.1:pnpm-lock.yaml HEAD:pnpm-lock.yaml` summarized in the lockfile commit body — non-trivial deltas (major-version bumps, new transitive packages) explicitly noted. (Mirrors v8.0 D-17 done-gate, expanded for v2.0.1 SC-4 IDE-parse criterion.)
- **D-31-18:** Drift handling — document non-trivial differences in the lockfile commit body and accept them. Catalog mode pins direct deps in `pnpm-workspace.yaml`; the diff is mostly transitive. Real impact (if any) surfaces at Phase 35 build verification. (Mirrors v8.0 D-18.)

### Claude's Discretion

- For each `eslint.config.mjs`, how to merge upstream rule additions onto fork's customizations is left to the executor — read each file, apply the union judgment per file. The decision (D-31-10) only locks the _strategy_ (hand-merge), not the per-rule outcome.
- The lockfile commit body's drift summary format is left to the executor — table or bulleted prose, whichever reads cleaner.
- Final actual file list comes from `git diff fork/sync/upstream-v2.0.1` enumeration during plan-phase research. The Phase Boundary file list above is the v8.0 template, not authoritative — researcher must reconcile.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive-only Linux changes, no large refactors)
- `.planning/REQUIREMENTS.md` — v8.1 requirements catalog; Phase 31 owns SYNC-2.0.1-02 + SYNC-2.0.1-03
- `.planning/ROADMAP.md` — v8.1 milestone (Phases 31–37) and Phase 31 success criteria
- `.planning/STATE.md` — current position (Phase 31 not started, awaiting plan)

### v8.0 prior art (direct analog — read these to lift the patterns)

- `.planning/milestones/v8.0-phases/24-config-bucket/24-CONTEXT.md` — v8.0 Phase 24 context (D-01..D-18)
- `.planning/milestones/v8.0-phases/24-config-bucket/24-DISCUSSION-LOG.md` — v8.0 Phase 24 discussion
- `.planning/milestones/v8.0-phases/24-config-bucket/24-01-PLAN.md` ... `24-08-PLAN.md` — v8.0 Phase 24 plan shape (target: ~6–8 plans for v8.1)
- `.planning/milestones/v8.0-ROADMAP.md` — v8.0 milestone shipped 2026-05-22; tag `v2.0.0-linux-rebased` at `f570149ea`

### Linux fork preservation

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — 10 items the fork must keep through every upstream sync. Phase 31 doesn't touch source files, but lockfile regen and config decisions must not break the playbook items downstream phases will verify.
- `.planning/codebase/ARCHITECTURE.md` — fork's three-tier process model and persistence layer
- `.planning/codebase/STRUCTURE.md` — fork directory layout

### Upstream PR + state

- `https://github.com/atabisz/Vortex/pull/5` — PR #5 (`chore: sync upstream v2.0.1 into master`); resolution lands here via force-with-lease push
- `fork/sync/upstream-v2.0.1` — current PR head; conflict markers as-merged by upstream auto-merge
- `fork/master` — fork's pre-sync v8.0 baseline at `b241b56c5`; HEAD side of every conflict region

### Tooling references

- `AGENTS.md` + `AGENTS-DIRECTORIES.md` — repo navigation rules; `pnpm run` for repo commands
- `CLAUDE.md` (project) — Branch Strategy section (master = primary; linux-port = curated cherry-picks); GSD Workflow Enforcement section

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`scripts/rebuild-pnpm-natives.cjs`** — fork's Linux native module rebuild script invoked by `rebuild:native`. Must not be orphaned by package.json resolution.
- **`scripts/postinstall-libloot.cjs`** — fork's libloot postinstall (loot.node compilation on Linux per v1.0 NADD-04 decision). Wired via `postinstall` script; that script line must survive the package.json resolution.
- **`scripts/download-duckdb-extensions.ts`** — fork keeps reference path `npx tsx scripts/download-duckdb-extensions.ts` from `assets` script. Phase 34 will resolve any source-side conflicts; Phase 31 only preserves the script-name reference.

### Established Patterns

- **pnpm strict catalog mode** (`pnpm-workspace.yaml: catalogMode: strict`) — direct deps pinned at workspace level; lockfile regen produces deterministic output for direct deps. Drift surfaces only in transitive deps.
- **pnpm strict allowBuilds** — every package executing build scripts is enumerated in `allowBuilds:`. HEAD-only entries (`@electron/rebuild`) are required, not noise.
- **Atomic commits per resolved file** — matches the v6.0 / v7.0 / v8.0 phase-execution pattern.
- **Force-with-lease pushes to fork** — the `rebase-upstream.yml` daily cron writes to `sync/upstream-*` branches; lease check is required to refuse if the cron raced us.

### Integration Points

- After Phase 31 push, `pnpm install --frozen-lockfile` becomes the gate for Phases 32–34 to start. Frozen-lockfile failure on those phases means the lockfile drifted because a downstream phase changed direct deps without regenerating.
- Phase 35 build verification (`pnpm run typecheck`, `build`, `build:extensions`, `test`) consumes the package.json scripts decided here. Keep-fork structure (D-31-13/14/15) means existing v8.0-shipped CI workflows continue to work without edit.

</code_context>

<specifics>
## Specific Ideas

- **Local branch name = `v8.1/config-bucket`** — phase-scoped naming aligns with GSD milestone numbering and signals work-in-progress vs. the long-lived `sync/upstream-*` remote. Same shape as v8.0's `v8.0/config-bucket`.
- **vitest.config.ts globs over explicit list** — fork's globs already work and self-discover. Only add explicit entries that the globs miss.
- **Lockfile drift comparison target** — compare regenerated `pnpm-lock.yaml` against `fork/sync/upstream-v2.0.1:pnpm-lock.yaml` (the one that came in via PR #5's auto-merge), not against current `master:pnpm-lock.yaml`. The PR-side lockfile is the closest "what upstream v2.0.1 expected" reference.
- **Two-pass install** — first `pnpm install` writes the new lockfile; second `pnpm install --frozen-lockfile` validates it. Both must succeed. Treat them as separate verification steps.
- **v2.0.1 differs from v2.0.0** — diff is smaller (264 commits vs v8.0's larger surface). Some bucket files may not have conflicts in v2.0.1. Researcher must enumerate the actual conflict-marker set rather than assume the v8.0 file list.

</specifics>

<deferred>
## Deferred Ideas

- **Adopt upstream's `out/` + `dist/` build path split** — substantial refactor of release-linux.yml, electron-builder config, scripts/postinstall, validateArchiveToStaging tests, bundledPlugins copy logic. Belongs in a future cleanup milestone (e.g. v9.0 or post-v2.0.2 sync). (Inherited from v8.0.)
- **Add `typecheck:extensions` as a separate script** — useful split (separate extensions typecheck from main typecheck), but tied to the build path refactor above; defer with it. (Inherited from v8.0.)
- **Drop nx orchestration** — upstream removed nx in v2.0.0; fork keeps it. Reconsider after the build-path refactor lands. (Inherited from v8.0.)

</deferred>

---

_Phase: 31-config-bucket_
_Context gathered: 2026-05-22_
