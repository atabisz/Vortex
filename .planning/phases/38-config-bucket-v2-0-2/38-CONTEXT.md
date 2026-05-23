# Phase 38: Config bucket (v2.0.2) - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Mode:** Smart-discuss (autonomous) — pure infrastructure phase, decisions inherited from v8.0/v8.1 config-bucket precedents

<domain>
## Phase Boundary

Resolve the config-bucket files on `sync/upstream-v2.0.2` so the project parses and `pnpm install --frozen-lockfile` exits 0. Lockfile regenerated, not hand-merged. Branch `v8.2/sync-upstream-v2.0.2` cut from master `855fb3e1a` and Phase 38 commits stack on it. No source-code conflicts touched — those are Phases 39–41. No FF-merge to master here — that's Phase 43.

**Bucket A files (v8.1 prior-art template; researcher must enumerate actual v2.0.2 conflict-marker set):**

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

Plan-phase researcher must `git diff fork/master..fork/sync/upstream-v2.0.2 -- <bucket A patterns>` to enumerate the actual conflict-marker file set; v8.1 list above is the prior-art template, not authoritative for v2.0.2.

**Out of scope this phase:** Mod-management + download-management hot zone — Phase 39. Gamebryo + per-game extensions — Phase 40. Renderer + main spine + nexus + e2e — Phase 41. Source typecheck/build/test verification — Phase 42. FF-merge + tag — Phase 43.

</domain>

<decisions>
## Implementation Decisions

### Branch Strategy

- **D-38-01:** Resolve on a local branch named `v8.2/sync-upstream-v2.0.2`, branched from `fork/master` at `855fb3e1a`. Stack Phase 38 commits on it. (Mirrors v8.1 D-31-01.)
- **D-38-02:** Push back to `fork/sync/upstream-v2.0.2` once at phase end with `--force-with-lease` (defends against the daily `rebase-upstream.yml` cron). PR #6 review thread stays live. (Mirrors v8.1 D-31-02.)
- **D-38-03:** Atomic commits — one commit per resolved file + 1 lockfile commit. Title format `resolve(config): <file> — <one-line stance>`. (Mirrors v8.1 D-31-03.)
- **D-38-04:** Final FF-merge of `sync/upstream-v2.0.2` into master happens at Phase 43, not here. (Mirrors v8.1 D-31-04.)

### Per-File Resolution Stance

- **D-38-05:** Default = hand-resolve every file. No blanket pick-ours / pick-theirs across the bucket. (Mirrors v8.1 D-31-05.)
- **D-38-06:** `package.json` — keep HEAD wholesale on the scripts conflict region. Preserves `rebuild:native` (electron-rebuild + scripts/rebuild-pnpm-natives.cjs), keeps `src/main/build` output paths, keeps nx-orchestrated typecheck, keeps fork's existing build/dist/package/assets script structure. Continue to drop upstream's `dist:all`, `build:assets`, `dist:assets`, `dist:extensions`, `typecheck:extensions` if v2.0.2 reasserts them. (Mirrors v8.1 D-31-06.)
- **D-38-07:** `pnpm-workspace.yaml` — keep HEAD on allowBuilds conflict region: retain `"@electron/rebuild": true` (paired with `rebuild:native` per D-38-06). Merge upstream additions to the catalog elsewhere as additive non-conflicting changes. Honor v8.1 D-31 catalog lessons. (Mirrors v8.1 D-31-07.)
- **D-38-08:** `.vscode/extensions.json` — pick-ours (fork IDE preference is curated; ignore upstream drift). (Mirrors v8.1 D-31-08.)
- **D-38-09:** `docker/windows/Dockerfile` — hand-resolve (one read to confirm no fork-tooling references; default to pick-theirs only after that read). (Mirrors v8.1 D-31-09.)
- **D-38-10:** Four `eslint.config.mjs` files (main + preload + renderer + shared) — hand-resolve each. Merge new upstream rule additions onto fork's customizations (perfectionist plugin sort, oxfmt, fork-specific ignores). (Mirrors v8.1 D-31-10.)
- **D-38-11:** `vitest.config.ts` — hand-resolve as union. HEAD's glob patterns cover most upstream explicit entries. Add explicit entries upstream lists that the globs don't catch. (Mirrors v8.1 D-31-11.)
- **D-38-12:** `tsconfig*.json` + `prepare-dist-package.mjs` — hand-resolve. Preserve fork's vortex-api `.d.ts` generation flow (Phase 15 / FOMD-15-06 wired `resolvePathCase` into the public API surface). (Mirrors v8.1 D-31-12.)

### Build Output Path Direction

- **D-38-13:** Keep fork's `src/main/build` output structure. Do NOT adopt any upstream `out/`+`dist/` split that v2.0.2 may reassert. Resolution is `package.json` scripts conflict region = pick HEAD. (Mirrors v8.1 D-31-13.)
- **D-38-14:** Keep nx-orchestrated typecheck (`pnpm nx run-many -t typecheck`). Verify nx is still present in catalog or root devDependencies after lockfile regen; restore if upstream removed it entirely. (Mirrors v8.1 D-31-14.)
- **D-38-15:** Drop any upstream new scripts (`typecheck:extensions`, `build:assets`, `dist:all`, `dist:extensions`, `dist:assets`) entirely. Add to deferred ideas. (Mirrors v8.1 D-31-15.)

### Lockfile + Verification Gate

- **D-38-16:** Regenerate fresh — `rm pnpm-lock.yaml && pnpm install`. Commit the regenerated lockfile in its own atomic commit titled `chore(deps): regenerate pnpm-lock.yaml after v2.0.2 sync`. (Mirrors v8.1 D-31-16.)
- **D-38-17:** Phase 38 done-gate is all five (matches ROADMAP success criteria + SYNC-38a/b):
    1. `git grep '^<<<<<<< '` zero hits in Bucket A files
    2. `pnpm install` succeeds
    3. `pnpm install --frozen-lockfile` succeeds on a second run
    4. IDE/TypeScript server loads tree without parser errors and resolves all workspace packages
    5. Lockfile drift diff: `git diff fork/sync/upstream-v2.0.2:pnpm-lock.yaml HEAD:pnpm-lock.yaml` summarized in the lockfile commit body
- **D-38-18:** Drift handling — document non-trivial differences in the lockfile commit body and accept them. Real impact (if any) surfaces at Phase 42 build verification. (Mirrors v8.1 D-31-18.)

### Claude's Discretion

- For each `eslint.config.mjs`, how to merge upstream rule additions onto fork's customizations is left to the executor — read each file, apply the union judgment per file. The decision (D-38-10) only locks the _strategy_ (hand-merge), not the per-rule outcome.
- The lockfile commit body's drift summary format is left to the executor — table or bulleted prose, whichever reads cleaner.
- Final actual file list comes from `git diff fork/master..fork/sync/upstream-v2.0.2` enumeration during plan-phase research. The Phase Boundary file list above is the v8.1 template, not authoritative.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive-only Linux changes, no large refactors)
- `.planning/REQUIREMENTS.md` — v8.2 requirements catalog; Phase 38 owns SYNC-38a + SYNC-38b
- `.planning/ROADMAP.md` — v8.2 milestone (Phases 38–44) and Phase 38 success criteria
- `.planning/STATE.md` — current position (Phase 38 not started, awaiting plan)

### v8.1 prior art (direct analog — read these to lift the patterns)

- `.planning/phases/31-config-bucket/31-CONTEXT.md` — v8.1 Phase 31 context (D-31-01..D-31-18)
- `.planning/phases/31-config-bucket/31-RESEARCH.md` — v8.1 conflict enumeration approach
- `.planning/phases/31-config-bucket/31-01-PLAN.md` ... `31-08-PLAN.md` — v8.1 plan shape (target: ~6–8 plans for v8.2)

### v8.0 prior art

- `.planning/milestones/v8.0-phases/24-config-bucket/24-CONTEXT.md` — v8.0 Phase 24 context (D-01..D-18, original template)

### Linux fork preservation

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — items the fork must keep through every upstream sync. Phase 38 doesn't touch source files, but lockfile regen and config decisions must not break the playbook items downstream phases will verify.
- `.planning/codebase/ARCHITECTURE.md` — fork's three-tier process model and persistence layer (if present)

### Upstream PR + state

- `https://github.com/atabisz/Vortex/pull/6` — PR #6 (`sync upstream v2.0.2 into master`); resolution lands here via force-with-lease push
- `fork/sync/upstream-v2.0.2` — current PR head HEAD `314ca807c`
- `fork/master` at `855fb3e1a` — fork's pre-sync v8.1 baseline; HEAD side of every conflict region
- Conflict tree from `git merge-tree --write-tree fork/master fork/sync/upstream-v2.0.2`: `3c032384cca696a9f578f392a6807ba3b0681675`

### Tooling references

- `AGENTS.md` + `AGENTS-DIRECTORIES.md` — repo navigation rules; `pnpm run` for repo commands
- `CLAUDE.md` (project) — Branch Strategy section (master = primary; linux-port = curated cherry-picks); GSD Workflow Enforcement section
- `feedback_git_push_ssh.md` — sandbox blocks `.git/config`; push with inline SSH URL
- `feedback_ssh_signing.md` — all commits SSH-signed via `~/.ssh/id_ed25519`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`scripts/rebuild-pnpm-natives.cjs`** — fork's Linux native module rebuild script invoked by `rebuild:native`. Must not be orphaned by package.json resolution.
- **`scripts/postinstall-libloot.cjs`** — fork's libloot postinstall (loot.node compilation on Linux per v1.0 NADD-04 decision). Wired via `postinstall` script.
- **`scripts/download-duckdb-extensions.ts`** — fork keeps reference path from `assets` script.

### Established Patterns

- **pnpm strict catalog mode** (`pnpm-workspace.yaml: catalogMode: strict`) — direct deps pinned at workspace level; lockfile regen produces deterministic output for direct deps. Drift surfaces only in transitive deps.
- **pnpm strict allowBuilds** — every package executing build scripts is enumerated in `allowBuilds:`. HEAD-only entries (`@electron/rebuild`) are required.
- **Atomic commits per resolved file** — matches the v6.0 / v7.0 / v8.0 / v8.1 phase-execution pattern.
- **Force-with-lease pushes to fork** — the `rebase-upstream.yml` daily cron writes to `sync/upstream-*` branches; lease check is required.

### Integration Points

- After Phase 38 push, `pnpm install --frozen-lockfile` becomes the gate for Phases 39–41 to start. Frozen-lockfile failure on those phases means the lockfile drifted because a downstream phase changed direct deps without regenerating.
- Phase 42 build verification (`pnpm run typecheck`, `build`, `build:extensions`, `test`) consumes the package.json scripts decided here. Keep-fork structure (D-38-13/14/15) means existing v8.0/v8.1-shipped CI workflows continue to work without edit.

</code_context>

<specifics>
## Specific Ideas

- **Local branch name = `v8.2/sync-upstream-v2.0.2`** — phase-scoped naming aligns with GSD milestone numbering and signals work-in-progress vs. the long-lived `sync/upstream-*` remote.
- **vitest.config.ts globs over explicit list** — fork's globs already work and self-discover. Only add explicit entries that the globs miss.
- **Lockfile drift comparison target** — compare regenerated `pnpm-lock.yaml` against `fork/sync/upstream-v2.0.2:pnpm-lock.yaml` (the one that came in via PR #6's auto-merge), not against current `master:pnpm-lock.yaml`.
- **Two-pass install** — first `pnpm install` writes the new lockfile; second `pnpm install --frozen-lockfile` validates it. Both must succeed.
- **v2.0.2 conflict surface is smaller** — 108 files / ~234 regions vs v8.1's 109/365. Some bucket files may not have conflicts in v2.0.2. Researcher must enumerate the actual conflict-marker set rather than assume the v8.1 file list.
- **Master baseline `855fb3e1a`** — fork master HEAD per v8.1 closeout. Any drift here invalidates the merge tree.

</specifics>

<deferred>
## Deferred Ideas

- **Adopt upstream's `out/` + `dist/` build path split** — substantial refactor of release-linux.yml, electron-builder config, scripts/postinstall, validateArchiveToStaging tests, bundledPlugins copy logic. Defer to a future cleanup milestone. (Inherited from v8.0/v8.1.)
- **Add `typecheck:extensions` as a separate script** — useful split, but tied to the build path refactor above; defer with it. (Inherited from v8.0/v8.1.)
- **Drop nx orchestration** — upstream removed nx in v2.0.0; fork keeps it. Reconsider after the build-path refactor lands. (Inherited from v8.0/v8.1.)

</deferred>

---

_Phase: 38-config-bucket-v2-0-2_
_Context gathered: 2026-05-23_
