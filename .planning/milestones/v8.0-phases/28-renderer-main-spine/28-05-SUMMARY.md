---
phase: 28-renderer-main-spine
plan: 05
subsystem: renderer
tags: [conflict-resolution, formatting, duplicate-imports, nexus-integration, bluebird-trap]
requires: [28-04]
provides:
    - "src/renderer/src/extensions/ conflict-clean (14 files); browse_nexus, extension_manager, gamemode_management, health_check, installer_fomod_native, nexus_integration, starter_dashlet"
    - "Stable contract for plan 28-06 (renderer views) and 28-07 (ExtensionManager.ts)"
affects: [28-06..28-07]
key-files:
    modified:
        - src/renderer/src/extensions/browse_nexus/views/BrowseNexusPage.tsx (fork-wins on JSX one-liners)
        - src/renderer/src/extensions/extension_manager/installExtension.ts (fork-wins on perfectionist import sort)
        - src/renderer/src/extensions/gamemode_management/views/GameRow.tsx (fork-wins, retain pathToFileURL + null-safe logoPath)
        - src/renderer/src/extensions/health_check/checks/modRequirementsCheck.ts (hybrid — upstream var name + fork external-req shape)
        - src/renderer/src/extensions/health_check/components/mod_requirement/ModRequirement.tsx (fork-wins, retain IModFileInfo/IModRequirementExt types)
        - src/renderer/src/extensions/health_check/views/HealthCheckPage.tsx (drop duplicate-imports — both v2.0.0 imports already present above)
        - src/renderer/src/extensions/installer_fomod_native/installer.ts (fork-wins on import shape + 80-col one-liners — .NET 9 path is architectural, this file is just the JS adapter)
        - src/renderer/src/extensions/nexus_integration/util/UIDs.ts (drop duplicate-imports — HEAD's log/getGame already present below)
        - src/renderer/src/extensions/nexus_integration/util.ts (fork-wins on import shape + drop duplicate-imports + retain @vortex/shared/errors path; added missing ITokenReply import via Rule 2)
        - src/renderer/src/extensions/nexus_integration/eventHandlers.ts (fork-wins on import shape + 80-col one-liners; 7 regions; bluebird IIFE retention)
        - src/renderer/src/extensions/nexus_integration/views/FreeUserDLDialog.tsx (drop duplicate-imports + retain IValidateKeyDataV2 type)
        - src/renderer/src/extensions/nexus_integration/selectors.test.ts (fork-wins on one-liner isCollection boolean)
        - src/renderer/src/extensions/nexus_integration/index.tsx (fork-wins on one-liner newestFileId)
        - src/renderer/src/extensions/starter_dashlet/actions.ts (upstream wins on createAction shape — matches peers)
metrics:
    completed: 2026-05-21
    files_resolved: 14
    conflict_regions_resolved: 28
---

# Phase 28 Plan 05: Resolve renderer extensions Summary

Fourteen renderer extension conflict files resolved per D-28-01 sub-order (alphabetical-by-extension, leaf-first within nexus). Twenty-eight conflict regions across 14 atomic commits. Heaviest sub-bucket was `nexus_integration` (6 files, 21 regions). Per-bucket typecheck deferred to plan 28-07 per D-28-03.

## What Shipped

### browse_nexus → starter_dashlet (non-nexus, 8 files)

- **browse_nexus/views/BrowseNexusPage.tsx:** Fork-wins on JSX one-liner formatting.
- **extension_manager/installExtension.ts:** Fork-wins on perfectionist import sort.
- **gamemode_management/views/GameRow.tsx:** Fork-wins. Retain `pathToFileURL` import + null-safe `logoPath` handling — both load-bearing on the fork side.
- **health_check/checks/modRequirementsCheck.ts:** Hybrid resolution — upstream variable name (matches downstream consumers) + fork's external-requirement object shape. Documented in commit body.
- **health_check/components/mod_requirement/ModRequirement.tsx:** Fork-wins. HEAD's `IModFileInfo`/`IModRequirementExt` types are used in the props interface (Rule 2 — types required for compile).
- **health_check/views/HealthCheckPage.tsx:** Pure duplicate-imports artefact. Both v2.0.0 imports already present in the unconflicted block above. Dropped 6 lines.
- **installer_fomod_native/installer.ts:** Fork-wins on import shape + 80-col one-liners. .NET 9 recompile is the architectural path (Wine wrapper rejected per CLAUDE.md); this file is just the JS adapter and only formatting changed.
- **starter_dashlet/actions.ts:** Upstream wins on `createAction` shape — matches the peer pattern in this file (`setPrimaryTool`, `setToolValid`, `setToolPinned` all use the same multiline-call + one-liner-body form).

### nexus_integration (6 files, 21 regions)

Heaviest sub-bucket. Leaf-first order: `util/UIDs.ts → util.ts → eventHandlers.ts → views/FreeUserDLDialog.tsx → selectors.test.ts → index.tsx`.

- **util/UIDs.ts:** Drop duplicate-imports — HEAD's `log`/`getGame` were re-imports of symbols already present below in the unconflicted block. Kept only `import type { IGameListEntry } from "@nexusmods/nexus-api"`.
- **util.ts (6 regions):** Most complex resolution this bucket. Region 1 — kept `import { AlreadyDownloaded, DownloadIsHTML } from "@vortex/shared/errors"` (fork architectural path; upstream went to `../download_management/DownloadManager`). Regions 2-5 — fork-wins on real type/value imports + drop duplicates. Region 6 — fork-wins on `resolveGraphError` one-liner. **Rule 2 deviation:** `ITokenReply` was used at line 295 but its import was on v2.0.0's dropped side; added `import OAuth, { type ITokenReply } from "./util/oauth"` to keep file compiling.
- **eventHandlers.ts (7 regions):** `import * as path from "path"` retained. Largest region — fork-wins, retain `@vortex/shared/errors` for `AlreadyDownloaded`/`DownloadIsHTML`, compact one-liner imports. TypeScript intersection type `;`-separator preserved on `(err: NexusError & { collectionSlug?: string; revisionNumber?: number })`. Bluebird IIFE multi-line oxfmt shape retained. Trailing `};` semicolon and `...defaultDetails` trailing comma preserved.
- **views/FreeUserDLDialog.tsx:** Region 1 — drop duplicate-imports (`getErrorMessageOrDefault` already at line 3). Region 2 — fork-wins on `import type { IValidateKeyDataV2 } from "../types/IValidateKeyData"` (used at line 106 for `useSelector<IState, IValidateKeyDataV2>`).
- **selectors.test.ts:** Fork-wins on one-liner `isCollection` boolean expression (oxfmt 80-col with operator-trailing `&&`, consistent with autoupdater/util-message precedent from plan 28-04).
- **index.tsx:** Fork-wins on one-liner `newestFileId` field initializer (86 chars, within tolerance).

## Self-Verification

- `git grep '^<<<<<<< ' src/renderer/src/extensions/{browse_nexus,extension_manager,gamemode_management,health_check,installer_fomod_native,nexus_integration,starter_dashlet}` returns empty.
- `git log --oneline v8.0/config-bucket | grep -cE '^[0-9a-f]+ resolve\((renderer|nexus|starter_dashlet)\):'` returns ≥14 for this plan window.
- Grep-checkpoint with `--skip-conflict-check` exits 0 after each of the fourteen commits — all 15 gates green.
- `pnpm --filter @vortex/renderer typecheck` deferred to plan 28-07 per D-28-03.

## Deviations from Plan

**[Rule 2 — Missing critical functionality] Added missing `ITokenReply` import in `util.ts`**

- **Found during:** util.ts resolution (file 9/14)
- **Issue:** `ITokenReply` was used at line 295 in a function signature but its import was on v2.0.0's side of a dropped duplicate-imports block.
- **Fix:** Added `import OAuth, { type ITokenReply } from "./util/oauth"` (mixed default + named-type import — same pattern verified used in PlaceholderTextArea, Icon, api.ts).
- **Files modified:** `src/renderer/src/extensions/nexus_integration/util.ts`
- **Commit:** `2b2042915`

Per-region stance defaults from D-28-06 honoured throughout. Bluebird-Promise trap was on watch in eventHandlers.ts but the IIFE shape didn't trigger TS1064 (no `:Promise<void>` annotations on async fns).

## Commits

- `2c8a8a222` — `resolve(renderer): extensions/browse_nexus/views/BrowseNexusPage.tsx — fork-wins on JSX one-liners`
- `630016ed7` — `resolve(renderer): extensions/extension_manager/installExtension.ts — fork-wins on perfectionist import sort`
- `6db317f22` — `resolve(renderer): extensions/gamemode_management/views/GameRow.tsx — fork-wins (retain pathToFileURL + null-safe logoPath handling)`
- `857284541` — `resolve(renderer): extensions/health_check/checks/modRequirementsCheck.ts — hybrid (upstream var name + fork external-req shape)`
- `dc890872c` — `resolve(renderer): extensions/health_check/components/mod_requirement/ModRequirement.tsx — fork-wins (retain IModFileInfo/IModRequirementExt types used in props)`
- `5e3302b99` — `resolve(renderer): extensions/health_check/views/HealthCheckPage.tsx — drop duplicate-imports (both v2.0.0 imports already present above)`
- `1c8e74cf4` — `resolve(renderer): extensions/installer_fomod_native/installer.ts — fork-wins on import shape + 80-col one-liners`
- `82c01c28b` — `resolve(nexus): util/UIDs.ts — drop duplicate-imports (HEAD's log/getGame already present below)`
- `2b2042915` — `resolve(nexus): util.ts — fork-wins on import shape + drop duplicate-imports + retain @vortex/shared/errors path`
- `e38e5ea04` — `resolve(nexus): eventHandlers.ts — fork-wins on import shape + 80-col one-liners`
- `00dabb6fa` — `resolve(nexus): views/FreeUserDLDialog.tsx — drop duplicate-imports + retain IValidateKeyDataV2 type`
- `efc10b2df` — `resolve(nexus): selectors.test.ts — fork-wins on one-liner isCollection boolean`
- `99268c2d6` — `resolve(nexus): index.tsx — fork-wins on one-liner newestFileId`
- `6c4e626b9` — `resolve(starter_dashlet): actions.ts — upstream wins on createAction shape (matches peers)`

## Self-Check: PASSED
