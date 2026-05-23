# Phase 36 Cherry-Pick Notes

**Range:** `v2.0.0-linux-rebased..c4d1b4555c06f4b549b2c2169a754918edb64530` (tightened anchor per operator — Wave 5 candidate-count discrepancy decision)
**Filter:** `--no-merges` + `--cherry-pick --right-only` patch-id dedup against linux-port
**Wave 1 merge SHA (excluded):** c4d1b4555c06f4b549b2c2169a754918edb64530
**Anchor rationale:** `merge-base(linux-port, master) = 538aef374` produced 1266 candidates (3x plan estimate); `v2.0.0-linux-rebased = 634a5cc1a` (the v8.0 milestone close tag) produced 421 path-filtered candidates, of which 14 are patch-equivalent to commits already on linux-port → final 407 candidates. This matches plan's 350-450 estimate band.
**Total candidates after path-filter + --no-merges + patch-id dedup:** 407
**Started:** 2026-05-23T05:13:52Z

## Per-cherry log

## HALT — 840240eab621520e10d936774539c976a01861ca

```
Auto-merging etc/Dependency Report.md
CONFLICT (content): Merge conflict in etc/Dependency Report.md
Auto-merging etc/vortex.api.md
Auto-merging pnpm-lock.yaml
Auto-merging pnpm-workspace.yaml
CONFLICT (content): Merge conflict in pnpm-workspace.yaml
Auto-merging src/main/eslint.config.mjs
CONFLICT (content): Merge conflict in src/main/eslint.config.mjs
Auto-merging src/preload/eslint.config.mjs
CONFLICT (content): Merge conflict in src/preload/eslint.config.mjs
Auto-merging src/renderer/eslint.config.mjs
CONFLICT (content): Merge conflict in src/renderer/eslint.config.mjs
Auto-merging src/renderer/package.json
Auto-merging src/renderer/src/contexts/PagesContext.tsx
Auto-merging src/renderer/src/contexts/builtInPages.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/contexts/builtInPages.ts
Auto-merging src/renderer/src/extensions/starter_dashlet/actions.ts
CONFLICT (content): Merge conflict in src/renderer/src/extensions/starter_dashlet/actions.ts
Auto-merging src/renderer/src/types/IState.ts
CONFLICT (content): Merge conflict in src/renderer/src/types/IState.ts
Auto-merging src/renderer/src/views/components/Menu/ToolsSection.tsx
CONFLICT (content): Merge conflict in src/renderer/src/views/components/Menu/ToolsSection.tsx
Auto-merging src/renderer/src/views/components/Menu/useTools.ts
CONFLICT (content): Merge conflict in src/renderer/src/views/components/Menu/useTools.ts
Auto-merging src/renderer/src/views/components/Menu/useToolsData.ts
CONFLICT (content): Merge conflict in src/renderer/src/views/components/Menu/useToolsData.ts
Auto-merging src/renderer/src/views/pages/Tools/ToolRow.tsx
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/ToolRow.tsx
Auto-merging src/renderer/src/views/pages/Tools/index.tsx
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/index.tsx
Auto-merging src/renderer/src/views/pages/Tools/toolStarters.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/toolStarters.ts
Auto-merging src/renderer/src/views/pages/Tools/useToolsData.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/useToolsData.ts
Auto-merging src/renderer/src/views/pages/Tools/useToolsPage.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/useToolsPage.ts
Auto-merging src/renderer/tsconfig.api.json
CONFLICT (content): Merge conflict in src/renderer/tsconfig.api.json
Auto-merging src/shared/eslint.config.mjs
CONFLICT (content): Merge conflict in src/shared/eslint.config.mjs
Auto-merging src/stylesheets/ui/elements/dropdown.css
CONFLICT (content): Merge conflict in src/stylesheets/ui/elements/dropdown.css
error: could not apply 840240eab... Merge pull request #22007 from Nexus-Mods/task/APP-65
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
---
error: Committing is not possible because you have unmerged files.
hint: Fix them up in the work tree, and then use 'git add/rm <file>'
hint: as appropriate to mark resolution and make a commit.
fatal: Exiting because of an unresolved conflict.
U	etc/Dependency Report.md
U	pnpm-workspace.yaml
U	src/main/eslint.config.mjs
U	src/preload/eslint.config.mjs
U	src/renderer/eslint.config.mjs
U	src/renderer/src/contexts/builtInPages.ts
U	src/renderer/src/extensions/starter_dashlet/actions.ts
U	src/renderer/src/types/IState.ts
U	src/renderer/src/views/components/Menu/ToolsSection.tsx
U	src/renderer/src/views/components/Menu/useTools.ts
U	src/renderer/src/views/components/Menu/useToolsData.ts
U	src/renderer/src/views/pages/Tools/ToolRow.tsx
U	src/renderer/src/views/pages/Tools/index.tsx
U	src/renderer/src/views/pages/Tools/toolStarters.ts
U	src/renderer/src/views/pages/Tools/useToolsData.ts
U	src/renderer/src/views/pages/Tools/useToolsPage.ts
U	src/renderer/tsconfig.api.json
U	src/shared/eslint.config.mjs
U	src/stylesheets/ui/elements/dropdown.css
```

## HALT — 840240eab621520e10d936774539c976a01861ca

```
Initial cherry-pick output:
Auto-merging etc/Dependency Report.md
CONFLICT (content): Merge conflict in etc/Dependency Report.md
Auto-merging etc/vortex.api.md
Auto-merging pnpm-lock.yaml
Auto-merging pnpm-workspace.yaml
CONFLICT (content): Merge conflict in pnpm-workspace.yaml
Auto-merging src/main/eslint.config.mjs
CONFLICT (content): Merge conflict in src/main/eslint.config.mjs
Auto-merging src/preload/eslint.config.mjs
CONFLICT (content): Merge conflict in src/preload/eslint.config.mjs
Auto-merging src/renderer/eslint.config.mjs
CONFLICT (content): Merge conflict in src/renderer/eslint.config.mjs
Auto-merging src/renderer/package.json
Auto-merging src/renderer/src/contexts/PagesContext.tsx
Auto-merging src/renderer/src/contexts/builtInPages.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/contexts/builtInPages.ts
Auto-merging src/renderer/src/extensions/starter_dashlet/actions.ts
CONFLICT (content): Merge conflict in src/renderer/src/extensions/starter_dashlet/actions.ts
Auto-merging src/renderer/src/types/IState.ts
CONFLICT (content): Merge conflict in src/renderer/src/types/IState.ts
Auto-merging src/renderer/src/views/components/Menu/ToolsSection.tsx
CONFLICT (content): Merge conflict in src/renderer/src/views/components/Menu/ToolsSection.tsx
Auto-merging src/renderer/src/views/components/Menu/useTools.ts
CONFLICT (content): Merge conflict in src/renderer/src/views/components/Menu/useTools.ts
Auto-merging src/renderer/src/views/components/Menu/useToolsData.ts
CONFLICT (content): Merge conflict in src/renderer/src/views/components/Menu/useToolsData.ts
Auto-merging src/renderer/src/views/pages/Tools/ToolRow.tsx
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/ToolRow.tsx
Auto-merging src/renderer/src/views/pages/Tools/index.tsx
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/index.tsx
Auto-merging src/renderer/src/views/pages/Tools/toolStarters.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/toolStarters.ts
Auto-merging src/renderer/src/views/pages/Tools/useToolsData.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/useToolsData.ts
Auto-merging src/renderer/src/views/pages/Tools/useToolsPage.ts
CONFLICT (add/add): Merge conflict in src/renderer/src/views/pages/Tools/useToolsPage.ts
Auto-merging src/renderer/tsconfig.api.json
CONFLICT (content): Merge conflict in src/renderer/tsconfig.api.json
Auto-merging src/shared/eslint.config.mjs
CONFLICT (content): Merge conflict in src/shared/eslint.config.mjs
Auto-merging src/stylesheets/ui/elements/dropdown.css
CONFLICT (content): Merge conflict in src/stylesheets/ui/elements/dropdown.css
error: could not apply 840240eab... Merge pull request #22007 from Nexus-Mods/task/APP-65
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
---
Continue output:
error: Committing is not possible because you have unmerged files.
hint: Fix them up in the work tree, and then use 'git add/rm <file>'
hint: as appropriate to mark resolution and make a commit.
fatal: Exiting because of an unresolved conflict.
U	etc/Dependency Report.md
---
Status:
UU "etc/Dependency Report.md"
?? .nx/
```

## Run summary (resume from=20)

- Processed: 407
- Clean apply: 52
- Auto-resolved: 12
- Skipped (empty): 324
- Resume HEAD: 9ac9387f62b21118fa7cafad0be7da8dd8224bdb
- End HEAD: 709c87193b69cb16872b6c57c712957b456e48d7

## SYNC-36c — Wave 5 fix-up + push

**linux-port HEAD:** `799ad300f` (was `6a28945d1`, +68 commits)
**Pushed:** `git@github.com:atabisz/Vortex.git linux-port` (FF, no force) — `6a28945d1..799ad300f`

### Fix-up commits applied on top of cherry loop end (`709c87193`)

1. **`31c8ad3e4`** — `revert(36-05): restore DownloadManager.ts on linux-port (Wave 5 fixup)`
    - Reverted cherry `1c0f8dd00` (master commit `e2127cecb`).
    - That cherry deleted `DownloadManager.ts` but left `DownloadObserver.ts` (formatter cherry `156e47c18` was first; `--ours` preserved Observer when the delete-cherry hit), creating ~28 orphan-consumer TS errors.
    - Net: linux-port keeps DownloadManager **and** DownloadObserver wired up — same shape as fork baseline.

2. **`799ad300f`** — `fix(36-05): bump @nexusmods/nexus-api to 1.6.0 — pick up workspace/lock hunks dropped by cherry 76363129e`
    - Cherry `76363129e` (master `4cb8d3fc5` "surface GraphQL error path/location/query") only carried the `util.ts` + `eventHandlers.ts` hunks; the `pnpm-workspace.yaml` (+2/-2) + `pnpm-lock.yaml` (+50/-50) hunks were dropped during the loop.
    - Bumped both `@nexusmods/nexus-api` and `nexus-api` pins from `4192c0c9...` / `d16099d8...` → `4dd3460c2d02d93ba8f1bbeeeb2c5fa9af039a67` (1.6.0).
    - 1.6.0 adds `entries` / `call` / `query` props on `GraphError` — required by the `graphErrorContext()` helper added in `util.ts`.
    - Regenerated lockfile via `CI=true pnpm install --no-frozen-lockfile --ignore-scripts`.
    - Cleared 6 TS2339 errors at `nexus_integration/util.ts:1139-1141`.

### Renderer typecheck

| State                             | error count | notes                                                                           |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| pre-Wave-5 baseline (`6a28945d1`) | 6           | pre-existing module-resolution + arity gaps                                     |
| post-cherry-loop (`709c87193`)    | 34          | 28 orphan-Observer + 6 GraphError                                               |
| post-revert (`31c8ad3e4`)         | 8           | 6 baseline + 2 GraphError (down from 6 — partial loop fix)                      |
| post-bump (`799ad300f`)           | **2**       | both pre-existing module-resolution gaps; **net 4 errors better than baseline** |

Remaining 2 errors are independent of Wave 5 (downstream `installationValidation` + `@vortex/shared/download` module-resolution); pre-existing in the renderer pkg from before this phase.

### Signature verification

Both fix-up commits SSH-signed with `~/.ssh/id_ed25519`:

- `31c8ad3e4` — `git log %G?` = `G`, `gpgsig` header present
- `799ad300f` — `git log %G?` = `G`, `gpgsig` header present

### Wave 5 totals

- **Cherry loop:** 407 candidates processed, 52 clean apply, 12 auto-resolved (--ours), 324 skipped (empty/dedup).
- **Fix-up commits:** 2 (revert + nexus-api bump).
- **Total commits added to linux-port:** 68 (66 cherries + 2 fix-ups).
- **Range:** `6a28945d1..799ad300f`.
