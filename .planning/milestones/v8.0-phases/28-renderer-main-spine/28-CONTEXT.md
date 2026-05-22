# Phase 28: Renderer + main spine - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve all 63 conflict files across the renderer/main/preload/shared spine plus `extensions/nexus_integration/`, `scripts/`, `.github/actions/fingerprints/`, and the four bordering doc files (`CHANGELOG.md`, `docs/cherry-pick-workflow.md`, `docs/error-reporting/critical-errors.md`, `etc/Dependency Report.md`, `etc/vortex.api.md`) so that:

- `git grep '^<<<<<<< '` shows zero hits across `src/renderer/`, `src/main/`, `src/preload/`, `src/shared/`, `extensions/nexus_integration/`, `scripts/`, `.github/actions/fingerprints/` (success criterion #1).
- Playbook §2/§4/§8/§9 fork-side fixes survive intact (success criteria #2–#5).
- Cross-compiled native binaries continue to be handled by CI native-rebuild — no stray `.so`/`.node` files committed (success criterion #6, inherited from §10 gate already in `scripts/grep-checkpoint.sh`).
- Per-bucket typecheck and phase-end full `pnpm typecheck` are clean.

**Scope (63 conflict files):**

**`src/shared/src/` (3):**

1. `src/shared/src/errors.ts`
2. `src/shared/src/errors.test.ts`
3. `src/shared/src/telemetry/spans.ts`

**`src/preload/src/` (1):**

4. `src/preload/src/index.ts`

**`src/main/src/` (7):**

5. `src/main/src/Application.ts`
6. `src/main/src/cli.ts`
7. `src/main/src/errorReporting.ts`
8. `src/main/src/extensions/autoupdater.ts`
9. `src/main/src/store/DuckDBSingleton.ts`
10. `src/main/src/store/LevelPersist.ts`
11. `src/main/src/TrayIcon.ts`

**`src/renderer/src/` (33) — leaf-first inside the renderer:**

`util/` (3): 12. `src/renderer/src/util/message.ts` 13. `src/renderer/src/util/migrate.ts` 14. `src/renderer/src/util/opn.ts`

`reducers/` (1): 15. `src/renderer/src/reducers/notifications.ts`

`hooks/` (1): 16. `src/renderer/src/hooks/windowControls.ts`

`contexts/` (2): 17. `src/renderer/src/contexts/builtInPages.ts` 18. `src/renderer/src/contexts/PagesContext.tsx`

`controls/` (1): 19. `src/renderer/src/controls/Table.tsx`

`ui/` (1): 20. `src/renderer/src/ui/components/no_results/NoResults.tsx`

`extensions/` (14): 21. `src/renderer/src/extensions/browse_nexus/views/BrowseNexusPage.tsx` 22. `src/renderer/src/extensions/extension_manager/installExtension.ts` 23. `src/renderer/src/extensions/gamemode_management/views/GameRow.tsx` 24. `src/renderer/src/extensions/health_check/checks/modRequirementsCheck.ts` 25. `src/renderer/src/extensions/health_check/components/mod_requirement/ModRequirement.tsx` 26. `src/renderer/src/extensions/health_check/views/HealthCheckPage.tsx` 27. `src/renderer/src/extensions/installer_fomod_native/installer.ts` 28. `src/renderer/src/extensions/nexus_integration/eventHandlers.ts` 29. `src/renderer/src/extensions/nexus_integration/index.tsx` 30. `src/renderer/src/extensions/nexus_integration/selectors.test.ts` 31. `src/renderer/src/extensions/nexus_integration/util.ts` 32. `src/renderer/src/extensions/nexus_integration/util/UIDs.ts` 33. `src/renderer/src/extensions/nexus_integration/views/FreeUserDLDialog.tsx` 34. `src/renderer/src/extensions/starter_dashlet/actions.ts`

`views/` (10): 35. `src/renderer/src/views/components/Header/Notifications/useNotificationFiltering.ts` 36. `src/renderer/src/views/components/Menu/ToolsSection.tsx` 37. `src/renderer/src/views/components/Menu/useTools.ts` 38. `src/renderer/src/views/components/Spine/SpineContext.tsx` 39. `src/renderer/src/views/layout/ToastContainer.tsx` 40. `src/renderer/src/views/pages/Tools/index.tsx` 41. `src/renderer/src/views/pages/Tools/ToolRow.tsx` 42. `src/renderer/src/views/pages/Tools/toolStarters.ts` 43. `src/renderer/src/views/pages/Tools/useToolsData.ts` 44. `src/renderer/src/views/pages/Tools/useToolsPage.ts`

`ExtensionManager.ts` (1, last in renderer per re-export idiom): 45. `src/renderer/src/ExtensionManager.ts`

**`scripts/` (2):**

46. `scripts/download-duckdb-extensions.ts`
47. `scripts/download-duckdb-extensions.test.ts`

**`.github/actions/fingerprints/` (11) — taken upstream wholesale:**

48. `.github/actions/fingerprints/dist/index.js`
49. `.github/actions/fingerprints/src/clickhouse.ts`
50. `.github/actions/fingerprints/src/collect-input.ts`
51. `.github/actions/fingerprints/src/collect-input.test.ts`
52. `.github/actions/fingerprints/src/collect-pr.ts`
53. `.github/actions/fingerprints/src/collect-pr.test.ts`
54. `.github/actions/fingerprints/src/collect-release.ts`
55. `.github/actions/fingerprints/src/collect-release.test.ts`
56. `.github/actions/fingerprints/src/index.ts`
57. `.github/actions/fingerprints/src/types.ts`
58. `.github/actions/fingerprints/tsconfig.json`

**Doc/CHANGELOG borderlines (5) — not in success-criteria but blocking the merge tree:**

59. `CHANGELOG.md`
60. `docs/cherry-pick-workflow.md`
61. `docs/error-reporting/critical-errors.md`
62. `etc/Dependency Report.md`
63. `etc/vortex.api.md`

**Out of scope this phase:** Build verification — `pnpm run build` end-to-end + AppImage/.deb boot smoke (Phase 29). Landing the merge tag (Phase 30). Cherry-pick to `linux-port` (post-merge, after Phase 30).

</domain>

<decisions>
## Implementation Decisions

### Branch & commit pattern (carried from Phase 24/26/27)

- **D-28-00:** Continue work on `v8.0/config-bucket`. **Per-file atomic commits** for the 52 hand-resolved files (63 total − 11 fingerprints). Title format `resolve(<scope>): <file> — <one-line stance>` where `<scope>` is one of `shared`, `preload`, `main`, `renderer`, `nexus`, `scripts`, `docs`. The 11 fingerprint files land as a **single squash commit** titled `resolve(fingerprints): take upstream wholesale (per phase-28 success criteria)`. Total ~53 commits. Push to `fork/sync/upstream-v2.0.0` once at phase end with `--force-with-lease`.

### Resolution order

- **D-28-01:** Per-bucket dependency-depth order, leaf-first inside each bucket:
    1. **`src/shared/`** (3f) — leaf utility, no fork-side spine deps. Order: `errors.ts` → `errors.test.ts` → `telemetry/spans.ts`.
    2. **`src/preload/`** (1f) — single file. `index.ts`.
    3. **`src/main/`** (7f) — depends on shared. Order: `cli.ts` → `errorReporting.ts` → `extensions/autoupdater.ts` → `store/DuckDBSingleton.ts` → `store/LevelPersist.ts` → `TrayIcon.ts` → `Application.ts` (last; main entry composes everything else).
    4. **`src/renderer/` non-extension leaves** (9f) — `util/{message,migrate,opn}.ts` → `reducers/notifications.ts` → `hooks/windowControls.ts` → `contexts/{builtInPages,PagesContext}.tsx` → `controls/Table.tsx` → `ui/components/no_results/NoResults.tsx`.
    5. **`src/renderer/src/extensions/`** (14f) — by extension, leaf-first within each: `browse_nexus/views/BrowseNexusPage.tsx` → `extension_manager/installExtension.ts` → `gamemode_management/views/GameRow.tsx` → `health_check/checks/modRequirementsCheck.ts` → `health_check/components/mod_requirement/ModRequirement.tsx` → `health_check/views/HealthCheckPage.tsx` → `installer_fomod_native/installer.ts` → `nexus_integration/util/UIDs.ts` → `nexus_integration/util.ts` → `nexus_integration/eventHandlers.ts` → `nexus_integration/views/FreeUserDLDialog.tsx` → `nexus_integration/selectors.test.ts` → `nexus_integration/index.tsx` → `starter_dashlet/actions.ts`.
    6. **`src/renderer/src/views/`** (10f) — `components/Header/Notifications/useNotificationFiltering.ts` → `components/Menu/{ToolsSection,useTools}.tsx,ts` → `components/Spine/SpineContext.tsx` → `layout/ToastContainer.tsx` → `pages/Tools/{ToolRow,toolStarters,useToolsData,useToolsPage,index}.tsx,ts` (index last per re-export idiom).
    7. **`src/renderer/src/ExtensionManager.ts`** (1f) — last in renderer; re-export composer.
    8. **`scripts/`** (2f) — `download-duckdb-extensions.ts` → `download-duckdb-extensions.test.ts`.
    9. **`.github/actions/fingerprints/`** (11f) — single squash commit, take upstream wholesale.
    10. **Doc borderlines** (5f) — `CHANGELOG.md` → `docs/cherry-pick-workflow.md` → `docs/error-reporting/critical-errors.md` → `etc/Dependency Report.md` → `etc/vortex.api.md`. Hand-resolve in this phase even though they're outside the formal success-criteria paths — leaving them blocks the working tree from being merge-clean for Phase 29.

### Playbook §2/§4/§8/§9 preservation gates (extends `scripts/grep-checkpoint.sh`)

- **D-28-02:** Extend the milestone-shared `scripts/grep-checkpoint.sh` (relocated per D-28-04) with four new gates **run after every commit**. All four use prefix-anchored regex + count-threshold idiom (Phase 26 D-26-03 / Phase 27 D-27-03):

    **§2 (`webpack.config.cjs nodeExternals` allowlist contains `"winapi-bindings"` on Linux — success criterion #2):**

    ```bash
    git grep -nE 'winapi-bindings' src/renderer/webpack.config.cjs \
      | grep -E 'nodeExternals|allowlist|allowList' | wc -l
    # must be ≥ 1
    ```

    **§4 (`testPathTransfer` in `transferPath.ts` carries NO Windows-only reject guard — success criterion #3, NEGATIVE GATE):**

    ```bash
    git grep -nE "platform !== ['\"]win32['\"]\\) reject\\(UnsupportedOperatingSystem" \
      src/renderer/src/util/transferPath.ts | wc -l
    # must be 0
    ```

    **§8 (`StarterInfo.ts` retains Proton helpers + hide-instead-of-quit `onSpawned` — success criterion #4):**

    ```bash
    git grep -nE '\b(isPathPrefix|shouldRunWithProton|runToolWithProton)\s*\(' \
      src/renderer/src/util/StarterInfo.ts | wc -l
    # must be ≥ 3 (one per helper; multiple call sites count too)

    git grep -n 'onSpawned' src/renderer/src/util/StarterInfo.ts \
      | grep -E 'hide|minimize' | wc -l
    # must be ≥ 1
    ```

    **§9 (`Steam.ts` `resolveSteamPaths()` calls `findAllLinuxSteamPaths()` and reads `libraryfolders.vdf` — success criterion #5):**

    ```bash
    git grep -n 'findAllLinuxSteamPaths' src/main/src/util/Steam.ts | wc -l
    # must be ≥ 1

    git grep -n 'libraryfolders\.vdf' src/main/src/util/Steam.ts | wc -l
    # must be ≥ 1
    ```

    Detects:
    - Upstream removing `winapi-bindings` from the renderer external allowlist (regression of phase-1 Linux fix).
    - Upstream re-introducing the Windows-only reject in `transferPath.ts` (regression of §4 Linux fix).
    - Upstream stripping any of the three Proton helpers or replacing the hide-instead-of-quit `onSpawned` with a `quit()` call.
    - Upstream simplifying `resolveSteamPaths()` back to a single Steam-root lookup that drops `libraryfolders.vdf` parsing.

### Per-bucket typecheck cadence

- **D-28-03:** **Per-bucket typecheck** — after all of a bucket's files commit, run `pnpm typecheck -F @vortex/<bucket>`. Failure blocks proceeding to the next bucket. **4 typecheck runs total** (`@vortex/shared`, `@vortex/preload`, `@vortex/main`, `@vortex/renderer`), plus the **phase-end full `pnpm typecheck`** as final cross-bucket drift check.

    **Deviation rationale (vs Phase 27 D-27-04 per-extension):** Phase 27 spanned 7 independently-typecheckable extension workspaces; per-extension was the right grain. Phase 28 spans 4 spine workspaces (shared/preload/main/renderer) plus per-extension files inside the renderer workspace — `nexus_integration` is a renderer-internal extension, not a separate workspace. Per-bucket × 4 catches cross-file type drift inside each spine workspace at the right cost.

    **Typecheck commands:**

    ```bash
    pnpm typecheck -F @vortex/shared
    pnpm typecheck -F @vortex/preload
    pnpm typecheck -F @vortex/main
    pnpm typecheck -F @vortex/renderer
    pnpm typecheck            # phase-end, full repo
    ```

    (Executor confirms exact filter names against `pnpm-workspace.yaml` / each `package.json` `name` field at plan time.)

### Script relocation

- **D-28-04:** Relocate `scripts/grep-checkpoint.sh` from its phase-26 historical home to **`.planning/milestones/v8.0/scripts/grep-checkpoint.sh`** as the **first commit** of phase 28 (before any conflict resolution). All references in phase 26/27 SUMMARY.md files remain valid as historical pointers; phase 28+ work calls the new path. The relocation is a single move + path-update commit titled `chore(28-00): move grep-checkpoint.sh to milestone-shared location`.

    **Rationale:** Phase 26's directory was the historical accident; the script protects the whole v8.0 milestone (and is durable for v8.1, v9.0). Promoting it now (rather than at v8.1 sync) keeps the cherry-pick-to-`linux-port` story clean — the script ships with the merge.

### Done gate

- **D-28-05:** Phase 28 done-gate is all eight:
    1. `git grep '^<<<<<<< ' src/renderer/ src/main/ src/preload/ src/shared/ extensions/nexus_integration/ scripts/ .github/actions/fingerprints/` returns empty (success criterion #1).
    2. `scripts/grep-checkpoint.sh` (relocated) exits zero — covers §1/§2/§3/§4/§6/§7a–d/§8/§9/§10 + BG3 + Morrowind preservation (success criteria #2, #3, #4, #5, plus all Phase 26/27 carry-forward gates).
    3. Per-bucket typecheck passes for `@vortex/shared`, `@vortex/preload`, `@vortex/main`, `@vortex/renderer`.
    4. Phase-end `pnpm typecheck` (full repo) passes — final cross-bucket drift check.
    5. ~52 atomic commits on `v8.0/config-bucket` matching `resolve(<scope>): <file> — <stance>`, plus 1 fingerprints squash commit, plus 1 script-relocation commit (~54 total).
    6. Fingerprints squash commit landed and matches upstream tree at `.github/actions/fingerprints/**`.
    7. `--force-with-lease` push to `fork/sync/upstream-v2.0.0` succeeds at phase end.
    8. `git status` shows zero modified-but-unstaged files in conflict-resolution paths (no half-resolved files left behind).

### Per-region resolution stance

- **D-28-06:** Per-region default is **hand-resolve, fork-side wins for Linux fixes (playbook §2/§4/§8/§9 are fork-side stays), upstream wins for new feature scaffolding that doesn't touch playbook items** (carry Phase 24 D-05 / Phase 27 default). Specifically:
    - **`src/renderer/webpack.config.cjs`** is NOT in the conflict list this phase but is a §2 gate target — must end up with `winapi-bindings` in the `nodeExternals` allowlist on Linux (gated, not edited).
    - **`src/renderer/src/util/transferPath.ts`** is NOT in the conflict list this phase but is a §4 gate target — must NOT have the Windows-only reject (gated, not edited).
    - **`src/renderer/src/util/StarterInfo.ts`** is NOT in the conflict list this phase but is a §8 gate target — must retain Proton helpers + hide-instead-of-quit `onSpawned` (gated, not edited).
    - **`src/main/src/util/Steam.ts`** is NOT in the conflict list this phase but is a §9 gate target — must retain `findAllLinuxSteamPaths()` + `libraryfolders.vdf` parsing (gated, not edited).

    For files in the conflict list, fork-side wins where the conflict region carries any Linux-specific code (platform check, Proton call, Linux path handling, asar.unpacked behaviour, etc.). Upstream wins where the conflict is purely additive feature scaffolding (new error class, new telemetry span, new tool row, new health check).

### Claude's Discretion

- The exact one-line stance text per file is left to the executor (templated as `<file> — fork-wins-on-X` / `<file> — upstream-wholesale` / `<file> — merge-both`).
- Whether to commit the `scripts/grep-checkpoint.sh` extensions for §2/§4/§8/§9 as part of the relocation commit (D-28-04) or as a follow-up commit before the first resolution — left to the executor. Suggested: bundle into the relocation commit so the relocated script is immediately complete.
- Whether `nexus_integration/index.tsx` lands before or after `nexus_integration/selectors.test.ts` is left to the executor — D-28-01 places `selectors.test.ts` last among nexus tests but executor may invert if the test conflict shape is lighter.
- Exact `pnpm typecheck` filter syntax (`-F @vortex/<bucket>` vs `--filter @vortex/<bucket>` vs scripted) is left to the executor; confirm against `pnpm-workspace.yaml` at plan time.
- Whether to bundle the doc borderline files (CHANGELOG, docs/, etc/) into a single `resolve(docs): batch upstream-merge` commit or keep them per-file — left to the executor. Per-file is the default per D-28-00 but a single batch commit is acceptable for the 5 doc files since they're outside the success-criteria paths.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive Linux changes only).
- `.planning/REQUIREMENTS.md` — Phase 28 owns SYNC-07, SYNC-08, SYNC-09, SYNC-10, SYNC-18, SYNC-20, SYNC-24, SYNC-25, SYNC-26.
- `.planning/ROADMAP.md` — Phase 28 success criteria (6 items; this CONTEXT.md adds two more — phase-end full typecheck and "no half-resolved files left behind" — as part of D-28-05 done-gate).
- `.planning/milestones/v8.0-SCOPE-PROPOSAL.md` — bucket inventory; renderer/main/preload/shared/fingerprints are the remaining v8.0 conflict surface.
- `.planning/STATE.md` — current position (Phase 27 complete, 25/25 gamebryo conflicts resolved).

### Linux fork preservation (MANDATORY READ)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §2 (`winapi-bindings` allowlist), §4 (`transferPath.ts` no Windows-only reject), §8 (`StarterInfo.ts` Proton helpers + hide-on-spawn), §9 (`Steam.ts` libraryfolders parsing). Re-grep verification commands at the bottom of each section ARE the script body added in D-28-02.
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` Past gotchas — read all entries; renderer-spine conflicts have historically masked subtle regressions (e.g. webpack externals, IPC handler renames).

### Prior phase context (decisions carry forward)

- `.planning/phases/24-config-bucket/24-CONTEXT.md` — atomic commit pattern, branch policy, force-with-lease push policy.
- `.planning/phases/26-mod-management-hot-zone/26-CONTEXT.md` — per-file commits (D-26-00), grep-checkpoint script idiom (D-26-03), per-game preservation framing analogue.
- `.planning/phases/27-gamebryo-per-game-extensions/27-CONTEXT.md` — per-extension typecheck cadence (D-27-04 — Phase 28 D-28-03 is the per-bucket variant for the spine), playbook §1/§3/§10 gate idiom (D-27-03 — Phase 28 D-28-02 extends it).

### Source files this phase touches

See full bucket list in `<domain>` above (63 files).

### Source files NOT edited but gated

- `src/renderer/webpack.config.cjs` — §2 reverification target.
- `src/renderer/src/util/transferPath.ts` — §4 reverification target.
- `src/renderer/src/util/StarterInfo.ts` — §8 reverification target.
- `src/main/src/util/Steam.ts` — §9 reverification target.

### Reference commits

- Phase 27 final commit: `bb9671ead` (push of `fork/sync/upstream-v2.0.0` after 25/25 gamebryo resolutions) — anchor for the "Phase 27 complete, 28 starts from here" claim. Memory `now.md 02:59 entry`.
- Phase 26 grep-checkpoint script commit (executor confirms exact SHA at plan time) — Phase 28 relocates and extends, doesn't replace.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `scripts/grep-checkpoint.sh` (in phase 26's directory; relocated to `.planning/milestones/v8.0/scripts/` per D-28-04) — Phase 28 extends with §2/§4/§8/§9 gates.
- Atomic-commit + `--force-with-lease` push pattern from Phase 24/26/27 — directly reused.
- Phase 26 prefix-anchored regex + count-threshold gate idiom (D-26-03) — directly reused for §2/§4/§8/§9 gates. §4 is the first negative-gate (count must be 0); the rest are existence/threshold positive gates.

### Established Patterns

- Hand-resolve default; fork-side wins for Linux fixes; upstream wins for new feature scaffolding.
- Per-file commit titles: `resolve(<scope>): <file> — <stance>`.
- `index.ts` / `index.tsx` / `Application.ts` / `ExtensionManager.ts` are re-export composers — last within their bucket per phase 26/27 idiom.
- Fingerprints (CI tooling, no fork-side Linux hooks) take upstream wholesale — established practice for upstream-only directories.

### Integration Points

- **`src/renderer/src/ExtensionManager.ts`** is the heaviest single file in scope (composes all renderer-side extensions). Hand-read every conflict region; almost certainly imports `nexus_integration`, `health_check`, `extension_manager`, `installer_fomod_native` — its conflicts depend on the final symbol shape of those extensions. Last in renderer order per D-28-01.
- **`src/main/src/Application.ts`** composes main-side init (persistence, extension manager, main window, auto-updater, crash reporting). Last in main order per D-28-01.
- **`src/preload/src/index.ts`** is the typed IPC bridge — its surface depends on main-side handler shapes. Resolved before main per D-28-01 because the bridge contract is defined by shared types, not main internals; main-side handler additions ride on top.
- **`src/shared/src/errors.ts`** + **`errors.test.ts`** sit at the bottom of the dependency tree (typed error classes used by both main and renderer). First in resolution order.

</code_context>

<specifics>
## Specific Ideas

- Fingerprints squash takes upstream wholesale per Phase 28 success criterion #1 phrasing ("fingerprints picked from upstream side wholesale"). No hand-resolution; single commit.
- §4 gate is a **negative** gate (count must be 0) — first such gate in the milestone. Verify the wording is unambiguous when added to `scripts/grep-checkpoint.sh`: an emit message like `"§4 regression detected — Windows-only reject re-introduced in transferPath.ts"` makes the gate's intent obvious to future readers.
- §8 gate has two sub-checks (helpers count + hide-on-spawn flavour). Both must pass for §8 to be green; document this as a single gate emitting two messages on partial failure.

</specifics>

<deferred>
## Deferred Ideas

- Promoting the relocated `scripts/grep-checkpoint.sh` to `release-linux.yml` as a pre-build CI assertion — Phase 29 (Build verification) territory. Deferred from Phase 26/27; still deferred.
- Refactoring inside any of the 63 files — explicitly out of scope per `.planning/PROJECT.md` Out of Scope row "Refactoring inside conflict-resolution files".
- Runtime smoke tests on Linux (renderer boot, main lifecycle, IPC round-trip, Nexus auth flow) — Phase 29 build-verify territory.
- Cherry-picking phase 28 commits to `linux-port` — Phase 30 (Land tag) territory.

</deferred>

---

_Phase: 28-renderer-main-spine_
_Context gathered: 2026-05-21_
