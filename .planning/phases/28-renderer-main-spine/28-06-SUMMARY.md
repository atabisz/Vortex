---
phase: 28-renderer-main-spine
plan: 06
subsystem: renderer
tags: [conflict-resolution, formatting, duplicate-imports, jsx]
requires: [28-05]
provides:
    - "src/renderer/src/views/ conflict-clean (10 files); components/Header, components/Menu, components/Spine, layout, pages/Tools"
    - "Stable contract for plan 28-07 (ExtensionManager.ts last)"
affects: [28-07]
key-files:
    modified:
        - src/renderer/src/views/components/Header/Notifications/useNotificationFiltering.ts (fork-wins on one-liner formatting, 2 regions)
        - src/renderer/src/views/components/Menu/ToolsSection.tsx (drop duplicate-imports + fork-wins on JSX one-liners, 4 regions)
        - src/renderer/src/views/components/Menu/useTools.ts (fork-wins on one-liner nonLauncher filter)
        - src/renderer/src/views/components/Spine/SpineContext.tsx (fork-wins on typed IStateWithPlugins selector + one-liner formatting, 3 regions)
        - src/renderer/src/views/layout/ToastContainer.tsx (fork-wins on one-liner generic args)
        - src/renderer/src/views/pages/Tools/ToolRow.tsx (fork-wins on import sort + JSX one-liners + double quotes, 6 regions)
        - src/renderer/src/views/pages/Tools/toolStarters.ts (fork-wins — defensive toolsOrder guard + one-liner formatting, 4 regions)
        - src/renderer/src/views/pages/Tools/useToolsData.ts (fork-wins on import grouping + one-liner formatting, 9 regions)
        - src/renderer/src/views/pages/Tools/useToolsPage.ts (fork-wins on import sort + one-liner formatting, 9 regions)
        - src/renderer/src/views/pages/Tools/index.tsx (fork-wins on double quotes + JSX one-liners + correct destructured Panel signature, 6 regions)
metrics:
    completed: 2026-05-21
    files_resolved: 10
    conflict_regions_resolved: 53
---

# Phase 28 Plan 06: Resolve renderer views Summary

Ten renderer view conflict files resolved per D-28-01 sub-order (`useNotificationFiltering.ts → ToolsSection.tsx → useTools.ts → SpineContext.tsx → ToastContainer.tsx → ToolRow.tsx → toolStarters.ts → useToolsData.ts → useToolsPage.ts → pages/Tools/index.tsx`). Fifty-three conflict regions across 10 atomic commits. Tools surface (5 of 10 files) was the heaviest sub-bucket — pure formatting throughout. Per-bucket typecheck deferred to plan 28-07 per D-28-03.

## What Shipped

### Header / Menu / Spine / layout (5 files, 11 regions)

- **components/Header/Notifications/useNotificationFiltering.ts:** Fork-wins on two `if`-condition one-liners (oxfmt 80-col tolerance, 95 / 91 chars).
- **components/Menu/ToolsSection.tsx:** Region 1 — drop duplicate-imports artefact (`pathToFileURL` and `IStarterInfo` both already present in unconflicted block above). Regions 2-4 — fork-wins on JSX/string one-liners (`label` ternary, `<img>` block, `isAnimating` ternary).
- **components/Menu/useTools.ts:** Fork-wins on `nonLauncher = tools.filter(...)` one-liner.
- **components/Spine/SpineContext.tsx:** Region 1 — fork-wins on `profilesVisible` selector one-liner (96 chars). Region 2 — **substantive**: fork's typed `IStateWithPlugins` selector with optional-chain `?.pluginManagementEnabled` is cleaner than v2.0.0's `(state as any)` fallback. Region 3 — fork-wins on `profileExists` one-liner.
- **layout/ToastContainer.tsx:** Fork-wins on `class ToastErrorBoundary extends Component<...>` one-liner generic args (89 chars).

### pages/Tools (5 files, 42 regions)

Heaviest sub-bucket. Tools page rewrite landed mostly as pure formatting; consistent fork-wins across the surface.

- **pages/Tools/ToolRow.tsx (6 regions):** Region 1+2 — fork-wins on perfectionist import sort (`pathToFileURL` in node-builtins block) + double quotes throughout. Regions 3-6 — JSX one-liner formatting (`name?.charAt(0) || "T"`, `truncate` span, `DropdownItem` props inline, ternary primary/non-primary label).
- **pages/Tools/toolStarters.ts (4 regions):** Region 1 — drop blank-line between type and value imports (consistent with builtInPages.ts in plan 28-04). Regions 2-3 — `starters.push(...)` one-liners. **Region 4 substantive:** fork's defensive `if (toolsOrder !== undefined && toolsOrder.length > 0)` guard is paranoid (param is typed `string[]`) but safer than v2.0.0's unconditional `findIndex` call.
- **pages/Tools/useToolsData.ts (9 regions):** Region 1 — fork's import grouping (single block after `import path from "path"`) is closer to oxfmt + perfectionist canonical. Regions 2-9 — pure formatting one-liners (`async function validateTools`, multiple `useSelector` selectors, `generateGameStarter`, `truthy(gameStarter)` ternary, `s.isGame || ...` predicate, `useMemo` deps array, `starterInfo?.exePath` one-liner).
- **pages/Tools/useToolsPage.ts (9 regions):** Region 1 — drop duplicate-imports artefact (v2.0.0 hoisted type imports above value imports unnecessarily; fork keeps them perfectionist-sorted alongside the source-group block). Region 2 — keep type imports inline at lines 18,20. Regions 3-9 — pure formatting one-liners (`useState<StarterInfo>(undefined)`, `events.emit("...","Tools","Manually ran tool")`, `setPrimaryTool`, `Removed tool`, `currentlyPinned`, `names = ordered.map(...).filter(Boolean)`, `.filter((s) => ...)`).
- **pages/Tools/index.tsx (6 regions):** Region 1 — fork-wins on double quotes throughout import block (v2.0.0 had mixed single quotes). Region 2 — fork-wins on correctly destructured `Panel` signature (v2.0.0's one-liner exceeded 80-col budget AND had typo `heading:string` no-space). Region 3 — fork's `<div>{children}</div>` one-liner. Region 4 — fork-wins on `ToolEditDialog` JSX one-liner + boolean expression. Region 5 — fork's multi-line `t()` options object (v2.0.0's overflow one-liner had `{count:` no-space typo). Region 6 — fork's `t()` options block-form vs v2.0.0's wrapped invocation.

## Self-Verification

- `git grep '^<<<<<<< ' src/renderer/src/views/components/{Header,Menu,Spine}/ src/renderer/src/views/layout/ src/renderer/src/views/pages/Tools/` returns empty.
- `git log --oneline v8.0/config-bucket | grep -cE '^[0-9a-f]+ resolve\(renderer\): views/'` returns ≥10 for this plan window.
- Grep-checkpoint with `--skip-conflict-check` exits 0 after each of the ten commits — all 15 gates green.
- `pnpm --filter @vortex/renderer typecheck` deferred to plan 28-07 per D-28-03.

## Deviations from Plan

None. Per-region stance defaults from D-28-06 honoured throughout. No bluebird-Promise traps in any of these files (no async functions with `:Promise<void>` annotations under conflict). The `toolStarters.ts` defensive guard kept in fork's form is a Rule 1 / Rule 2 borderline (paranoid null safety) — kept the existing fork behaviour rather than swing to v2.0.0's stricter typing.

## Commits

- `0bb7a6987` — `resolve(renderer): views/components/Header/Notifications/useNotificationFiltering.ts — fork-wins on one-liner formatting (2 regions)`
- `a788cbf07` — `resolve(renderer): views/components/Menu/ToolsSection.tsx — drop duplicate-imports + fork-wins on JSX one-liners (4 regions)`
- `609f982d5` — `resolve(renderer): views/components/Menu/useTools.ts — fork-wins on one-liner nonLauncher filter`
- `d02d304fe` — `resolve(renderer): views/components/Spine/SpineContext.tsx — fork-wins on typed IStateWithPlugins selector + one-liner formatting (3 regions)`
- `0e4b7c2f8` — `resolve(renderer): views/layout/ToastContainer.tsx — fork-wins on one-liner generic args`
- `a01361b6d` — `resolve(renderer): views/pages/Tools/ToolRow.tsx — fork-wins on import sort + JSX one-liners + double quotes (6 regions)`
- `f899e1dca` — `resolve(renderer): views/pages/Tools/toolStarters.ts — fork-wins (defensive toolsOrder guard + one-liner formatting, 4 regions)`
- `31a13336a` — `resolve(renderer): views/pages/Tools/useToolsData.ts — fork-wins on import grouping + one-liner formatting (9 regions)`
- `24854fd8c` — `resolve(renderer): views/pages/Tools/useToolsPage.ts — fork-wins on import sort + one-liner formatting (9 regions)`
- `3ba8f0c97` — `resolve(renderer): views/pages/Tools/index.tsx — fork-wins on double quotes + JSX one-liners + correct destructured Panel signature (6 regions)`

## Self-Check: PASSED
