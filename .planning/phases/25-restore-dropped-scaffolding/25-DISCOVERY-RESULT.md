# Phase 25 — Discovery Diff Result

**Generated:** 2026-05-15
**Plan:** 25-01
**Branch under inspection:** `v8.0/config-bucket` (sha `87784986`)
**Upstream parent SHA pin:** `8b5a9f675`
**Worktree note:** This plan ran inside a parallel-executor worktree on `worktree-agent-aa1dbb44decc6c56b`. The agent branch's HEAD is one commit ahead of `v8.0/config-bucket` (the Phase 24 docs commit `3aa289c5f`). Discovery uses the explicit ref `v8.0/config-bucket` as the LHS of every diff so the result is independent of agent-branch state.

## Discovery Diff Result

50 added files (filtered) + 10 renames the user must review (deny-list filter only catches `^A`, misses `^R`).

---

## SHA Pin Verification

```
EXPECTED: 8b5a9f675
ACTUAL:   8b5a9f675   (from `git rev-parse 138da2249^2 | head -c 9`)
RESULT:   OK — upstream parent has not drifted
```

`git rev-parse v8.0/config-bucket` → `87784986deb0a9e78d6199f170b71a5c9f8a80b7`
`git rev-parse 138da2249` → `138da2249ff5a5d8414f6ecf79e7e667f413db7d`
`git rev-parse 8b5a9f675` → `8b5a9f675d707087bff6ed2e5156e1153db58401`

## Discovery Diff (raw)

Command (per CONTEXT.md `<specifics>`):

```bash
git diff --name-status v8.0/config-bucket 8b5a9f675 \
  -- ':!src/renderer/src/__mocks__' \
     ':!src/renderer/src/__tests__' \
     ':!src/renderer/jest.config.mjs' \
  | grep '^A'
```

50 entries:

```
A	.github/workflows/package.yml
A	.github/workflows/review-extension-issue-created.yml
A	.github/workflows/signing-test.yml
A	.github/workflows/update-api-tag.yml
A	AGENTS-DEBUGGING.md
A	extensions/collections/__tests__/bsdiff-node.test.ts
A	extensions/gamebryo-ba2-support/package.json
A	extensions/gamebryo-ba2-support/src/index.ts
A	packages/paths-node/README.md
A	packages/paths-node/package.json
A	packages/paths-node/src/NodeFilesystem.test.ts
A	packages/paths-node/src/NodeFilesystem.ts
A	packages/paths-node/src/index.ts
A	packages/paths-node/tsconfig.build.json
A	packages/paths-node/tsconfig.json
A	packages/paths/README.md
A	packages/paths/package.json
A	packages/paths/src/FilePath.test.ts
A	packages/paths/src/FilePath.ts
A	packages/paths/src/IFilesystem.ts
A	packages/paths/src/IResolver.ts
A	packages/paths/src/index.ts
A	packages/paths/src/integration.test.ts
A	packages/paths/src/multi-resolver-roundtrip.test.ts
A	packages/paths/src/pathUtils.test.ts
A	packages/paths/src/pathUtils.ts
A	packages/paths/src/resolvers/BaseResolver.test.ts
A	packages/paths/src/resolvers/BaseResolver.ts
A	packages/paths/src/resolvers/MappingResolver.test.ts
A	packages/paths/src/resolvers/MappingResolver.ts
A	packages/paths/src/resolvers/UnixResolver.test.ts
A	packages/paths/src/resolvers/UnixResolver.ts
A	packages/paths/src/resolvers/WindowsResolver.test.ts
A	packages/paths/src/resolvers/WindowsResolver.ts
A	packages/paths/src/test-helpers/MockFilesystem.test.ts
A	packages/paths/src/test-helpers/MockFilesystem.ts
A	packages/paths/src/test-helpers/MockUnixFilesystem.ts
A	packages/paths/src/test-helpers/MockWindowsFilesystem.ts
A	packages/paths/src/types.test.ts
A	packages/paths/src/types.ts
A	packages/paths/tsdown.config.ts
A	src/main/src/downloading/chunking.ts
A	src/main/src/downloading/downloader.test.ts
A	src/renderer/src/extensions/download_management/DownloadManager.ts
A	src/renderer/src/extensions/download_management/DownloadObserver.ts
A	src/renderer/src/extensions/download_management/FileAssembler.ts
A	src/renderer/src/extensions/download_management/SpeedCalculator.ts
A	src/renderer/src/setupTests.js
A	src/renderer/src/util/__mocks__/log.ts
A	structure.md
```

### Rename diff (NOT caught by `^A` filter — surfaced separately)

The CONTEXT.md `<specifics>` discovery command only catches `^A` entries. Renames (`^R`) are silently dropped. This is a real gap — three of the entries below directly affect Phase 25's restore set (flatpak docs, the gamebryo-ba2-support extension itself, and `chunking.test.ts`). Same `:!` filter applied:

```
R059	docs/flatpak/maintenance.md	docs/flatpak-maintenance.md
R061	docs/flatpak/technical.md	docs/flatpak-technical.md
R100	extensions/gamebryo-archive-support/.gitignore	extensions/gamebryo-ba2-support/.gitignore
R050	extensions/gamebryo-archive-support/build.mjs	extensions/gamebryo-ba2-support/build.mjs
R078	extensions/gamebryo-archive-support/tsconfig.json	extensions/gamebryo-ba2-support/tsconfig.json
R067	extensions/feedback/vitest.config.ts	packages/paths-node/vitest.config.ts
R060	packages/adaptors/cyberpunk2077/tsconfig.json	packages/paths/tsconfig.json
R100	extensions/collections/vitest.config.ts	packages/paths/vitest.config.ts
R069	src/shared/src/chunking.test.ts	src/main/src/downloading/chunking.test.ts
R086	src/renderer/src/extensions/gamemode_management/util/ProcessMonitor.test.ts	src/renderer/src/extensions/gamemode_management/__tests__/ProcessMonitor.test.ts
```

`R059`/`R061`: upstream flattened `docs/flatpak/{maintenance,technical}.md` → `docs/flatpak-{maintenance,technical}.md`. Local still has the nested form. CONTEXT.md `<domain>` listed flat names in the restore set — flat is the upstream-target form.

`R100`/`R050`/`R078` (gamebryo-archive-support → gamebryo-ba2-support): upstream rebranded the extension. Local still has `gamebryo-archive-support/` (8 files). The pure `^A` diff only caught the new files (`package.json`, `src/index.ts`). The shared scaffolding (`build.mjs`, `tsconfig.json`, `.gitignore`, plus likely `scripts/`, `test-data/`, etc. that didn't rename-detect) is the rename target.

`R069`: `src/shared/src/chunking.test.ts` → `src/main/src/downloading/chunking.test.ts`. Local still has the old path. CONTEXT.md restore set listed `chunking.test.ts` at the new path as "missing" — accurate at the new path, but the restoration is a **move**, not a fresh add.

`R086` (ProcessMonitor.test): the rename target is inside `__tests__/` (deny-listed). Local keeps the original location, which is correct fork policy.

`R067`/`R060`/`R100` (vitest.config.ts moves): these aren't real moves, they're git's similarity heuristic linking unrelated `vitest.config.ts` files. The rename source files (`extensions/feedback/vitest.config.ts`, `packages/adaptors/cyberpunk2077/tsconfig.json`, `extensions/collections/vitest.config.ts`) all still exist on `v8.0/config-bucket` — these are spurious. Treat the rename targets as fresh adds in `paths/` and `paths-node/`.

## Classification

Three categories: **expected** (in CONTEXT.md `<domain>` restore set), **deny-list anomaly** (slipped past `:!` filter — should never have surfaced), **surprise** (not in either bucket).

| File                                                                | Class               | Notes                                                                                            |
| ------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `.github/workflows/package.yml`                                     | expected            | CI workflows                                                                                     |
| `.github/workflows/review-extension-issue-created.yml`              | expected            | CI workflows                                                                                     |
| `.github/workflows/signing-test.yml`                                | expected            | CI workflows                                                                                     |
| `.github/workflows/update-api-tag.yml`                              | expected            | CI workflows                                                                                     |
| `AGENTS-DEBUGGING.md`                                               | expected            | docs                                                                                             |
| `extensions/collections/__tests__/bsdiff-node.test.ts`              | expected            | Vitest-compatible test name (CONTEXT.md `<domain>` lists it)                                     |
| `extensions/gamebryo-ba2-support/package.json`                      | expected            | ba2-support extension                                                                            |
| `extensions/gamebryo-ba2-support/src/index.ts`                      | expected            | ba2-support extension                                                                            |
| `packages/paths-node/**` (8 files)                                  | expected            | paths-node workspace                                                                             |
| `packages/paths/**` (33 files)                                      | expected            | paths workspace                                                                                  |
| `src/main/src/downloading/chunking.ts`                              | expected            | new DownloadManager spine                                                                        |
| `src/main/src/downloading/downloader.test.ts`                       | expected            | new DownloadManager spine                                                                        |
| `src/main/src/downloading/chunking.test.ts` (rename target)         | expected            | listed in CONTEXT.md `<domain>` — restoration is a `git mv` from `src/shared/src/`               |
| `src/renderer/src/extensions/download_management/DownloadManager.ts`  | **surprise**        | not in CONTEXT.md restore set, but `chunking.ts` calls into it; whole download spine moved upstream |
| `src/renderer/src/extensions/download_management/DownloadObserver.ts` | **surprise**        | same as above                                                                                    |
| `src/renderer/src/extensions/download_management/FileAssembler.ts`    | **surprise**        | same as above                                                                                    |
| `src/renderer/src/extensions/download_management/SpeedCalculator.ts`  | **surprise**        | same as above                                                                                    |
| `src/renderer/src/setupTests.js`                                    | **deny-list anomaly** | enzyme + Jest-only adapter; should never restore (contradicts D-25-03 / Playbook §11)            |
| `src/renderer/src/util/__mocks__/log.ts`                            | **deny-list anomaly** | uses `jest.genMockFromModule`; deny-list pattern only matched `src/renderer/src/__mocks__/`, missed nested `util/__mocks__/` |
| `structure.md`                                                      | **surprise**        | top-level project structure doc; harmless; mostly accurate against fork's tree                   |

### Renames (separate review)

| Source → Target | Class | Recommendation |
| --------------- | ----- | -------------- |
| `docs/flatpak/{maintenance,technical}.md` → `docs/flatpak-{maintenance,technical}.md` | expected (rename, not add) | Plan 04 commit 5 must `git mv` (or `rm` + `git checkout`) — restoring as a fresh add will leave the old nested files behind |
| `extensions/gamebryo-archive-support/*` → `extensions/gamebryo-ba2-support/*` | **expected — but bigger than `^A` showed** | Local still has all of `extensions/gamebryo-archive-support/`. Plan 02 commit 2 must remove `gamebryo-archive-support/` after restoring `gamebryo-ba2-support/`. The `^A` diff only showed `package.json` + `src/index.ts` for ba2-support — but the rename diff and `git ls-tree 8b5a9f675 -- extensions/gamebryo-ba2-support/` show the full 5-file set CONTEXT.md `<domain>` mentions, plus the renamed scaffolding. Real change is bigger than CONTEXT.md modeled. |
| `src/shared/src/chunking.test.ts` → `src/main/src/downloading/chunking.test.ts` | expected (rename, not add) | Plan 02/03 commit 3 must `git mv` (or equivalent) — restoring as a fresh add leaves stale test at old path |
| `extensions/feedback/vitest.config.ts` → `packages/paths-node/vitest.config.ts` | spurious rename detection | Source still present locally; treat target as fresh add for paths-node |
| `extensions/collections/vitest.config.ts` → `packages/paths/vitest.config.ts` | spurious rename detection | Source still present locally; treat target as fresh add for paths |
| `packages/adaptors/cyberpunk2077/tsconfig.json` → `packages/paths/tsconfig.json` | spurious rename detection | Source still present locally; treat target as fresh add for paths |
| `src/renderer/src/util/protocolRegistration/linux/desktopFileEscaping.test.ts` → `src/renderer/src/__tests__/desktopFileEscaping.test.ts` | **deny-list correctly catches** | upstream moved a fork-Linux test into Jest scaffolding; fork keeps the original path. No action; existing fork file stays |
| `src/renderer/src/extensions/gamemode_management/util/ProcessMonitor.test.ts` → `src/renderer/src/extensions/gamemode_management/__tests__/ProcessMonitor.test.ts` | **deny-list correctly catches** | same shape; no action |

### Counts

- **Expected adds:** 46 files (4 workflows + AGENTS-DEBUGGING.md + 1 collections test + 2 ba2-support src + 8 paths-node + 33 paths + 2 main/downloading)
- **Expected renames:** 5 effective entries (2 flatpak docs, gamebryo-archive-support→ba2-support directory rename, chunking.test.ts location move; the 3 spurious rename detections collapse into the existing "expected adds" for paths/paths-node)
- **Deny-list anomalies (slipped past filter):** 2 files (`src/renderer/src/setupTests.js`, `src/renderer/src/util/__mocks__/log.ts`)
- **Surprises (not deny-list, not expected):** 5 files (4 download_management spine files, `structure.md`)

## node-ba2tk Grep Result

Command:

```bash
git grep -nE 'node-ba2tk|atabisz/node-ba2tk' -- '**/package.json' 'pnpm-workspace.yaml' 'pnpm-lock.yaml'
```

Result: **no hits** in package manifests or lockfile.

Wider grep (`git grep -nE 'ba2tk'`) finds three references:

```
.planning/codebase/STACK.md:102:- node-ba2tk - Bethesda BA2 archive support (custom fork)
CLAUDE.md:83:- node-ba2tk - Bethesda BA2 archive support (custom fork)
flatpak/generated-sources.json:240:    "url": "https://codeload.github.com/Nexus-Mods/node-ba2tk/tar.gz/762d8de841ca1c770a0925311fd626d71de67971",
```

**Verdict: NOT fork-vendored.** Two CLAUDE.md / STACK.md lines saying "custom fork" appear to be inaccurate text — the actual flatpak source pin points at `Nexus-Mods/node-ba2tk` (upstream Nexus-Mods org, not `atabisz/node-ba2tk`). The fork has never vendored its own ba2tk; the "custom fork" wording in STACK.md / CLAUDE.md is wrong and should be updated as a tiny side-fix (out of scope for this phase, worth flagging for future cleanup).

The fork pin in `flatpak/generated-sources.json` (commit `762d8de841ca1c770a0925311fd626d71de67971`) is **the same SHA** upstream pins via its catalog `git+https://github.com/Nexus-Mods/node-ba2tk#762d8de841ca1c770a0925311fd626d71de67971`. They agree.

## ba2tk Version Source

Read from upstream `pnpm-lock.yaml` at `8b5a9f675` (`git show 8b5a9f675:pnpm-lock.yaml | grep -A2 -B1 'ba2tk'`):

```
ba2tk:
  specifier: git+https://github.com/Nexus-Mods/node-ba2tk#762d8de841ca1c770a0925311fd626d71de67971
  version: 2.0.9
```

**Decision for Plan 03 catalog entry:**

`pnpm-workspace.yaml` catalog should add:

```yaml
ba2tk: git+https://github.com/Nexus-Mods/node-ba2tk#762d8de841ca1c770a0925311fd626d71de67971
```

Rationale:
- Upstream pins by git SHA, not npm version. There is no npm registry version to use; `2.0.9` is the version the package self-reports, not a registry-published version.
- The same SHA `762d8de8…` is already pinned in `flatpak/generated-sources.json`, so the fork's flatpak build and the catalog stay in sync.
- This is the upstream-faithful path — D-25-10's "open question" resolves to "no fork vendor; pin upstream's git SHA exactly as upstream's catalog does".

</content>
</invoke>