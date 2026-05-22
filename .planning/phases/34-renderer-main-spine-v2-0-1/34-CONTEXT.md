# Phase 34: Renderer + main spine (v2.0.1) - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; mirrors v8.0 Phase 28 D-28-XX, adjusted for v2.0.1 breadth + Phase 32/33 D-32-XX/D-33-XX precedents)

<domain>
## Phase Boundary

Resolve every conflict marker introduced by v2.0.1 across the renderer + main + preload + shared spine and any remaining repo-wide leaves outside `extensions/` while preserving every Linux-fork playbook invariant: §6 (`stagingDirHasFiles`), §7a–d (backslash/case cluster), 140a57217 (`resolvePathCase` host invariant), §1 (Linux platform guards), §3 (LOOT casing), §4–§5 (Steam/Proton + NXM handler), §10 (native binaries on disk). Make the R2 carry-forward Jest `__mocks__/` decision and document it in CONTEXT and SUMMARY. After Phase 34, `git grep -l '^<<<<<<< '` returns zero outside `.planning/`.

**In-scope conflict files (117 total, ~217 conflict regions):**

By bucket (region counts approximate from `git grep -c '^<<<<<<<'`):

- **renderer (68 files, ~174 regions):**
    - **ROADMAP-named (load-bearing):** `ExtensionManager.ts`, `controls/Table.tsx` (10), `renderer.tsx` (incl. `native-errors` import block deferred from Phase 33-F per D-33-13)
    - **nexus_integration (9 files, ~30 regions):** `eventHandlers.ts` (11), `index.tsx` (7), `util.ts`, `util/{UIDs,oauth}.ts`, `views/{FreeUserDLDialog,GoPremiumDashlet}.tsx`, `selectors.test.ts`, `types/IValidateKeyData.ts`
    - **health_check (6 files):** `api/triggers.ts`, `checks/modRequirementsCheck.ts`, `components/mod_requirement/ModRequirement.tsx`, `types.ts`, `views/{HealthCheckDetailPage,HealthCheckPage}.tsx`
    - **views/pages/Tools (5 files, ~31 regions):** `index.tsx` (6), `ToolRow.tsx` (6), `toolStarters.ts`, `useToolsData.ts` (9), `useToolsPage.ts` (9)
    - **views/components (Header/Menu/Spine, 11 files, ~25 regions)**
    - **util / reducers / hooks (10 files):** `util/{elevated,errorHandling,message,migrate,opn,startupSettings,walk,util.objDiff.test}.ts`, `reducers/{notifications,verify.test}.ts`, `hooks/windowControls.ts`
    - **store / telemetry (3 files):** `store/{stateDiff,stateDiff.test}.ts`, `telemetry/selectors.ts`
    - **contexts / installer / starter / activator (8 files):** `contexts/{PagesContext,builtInPages}.tsx`, `extensions/{installer_fomod_ipc/utils/VortexIPCConnection,installer_fomod_native/installer,starter_dashlet/{Tools,actions},symlink_activator_elevate/index,hardlink_activator/index,gamemode_management/{index,views/GameRow},category_management/index,profile_management/{index,selectors,views/ProfileView},extension_manager/installExtension,file_based_loadorder/UpdateSet,browse_nexus/views/BrowseNexusPage}`
    - **ui/\* (4 files):** `ui/README.md`, `ui/components/form/{formfield/FormField,input/Input,no_results/NoResults}.tsx`
    - **layout (1 file):** `views/layout/ToastContainer.tsx`

- **main (9 files, ~22 regions):**
    - **process-boot path (5 files):** `Application.ts` (11), `cli.ts`, `errorReporting.ts`, `extensions/autoupdater.ts`, `main.ts`
    - **store (3 files):** `store/{LevelPersist,ReduxPersistorIPC,SubPersistor}.ts` — DuckDBSingleton not in current marker list; if present after research re-grep, fold here
    - **TrayIcon (1 file):** `TrayIcon.ts`

- **preload (1 file, 1 region):** `preload/src/index.ts`

- **shared (5 files, ~10 regions):** `errors.test.ts` (6), `errors.ts`, `telemetry/spans.ts`, `types/{errors,state}.ts`

- **repo-wide leaves outside src/ (34 files, ~?? regions) — scope-expansion under D-34-13 (mirrors D-32-13 / D-33-13):**
    - **Top-level docs (4 files):** `CHANGELOG.md`, `CLAUDE.md`, `CONTRIBUTE.md`, `README.md`
    - **`.github/actions/fingerprints/` (10 files):** action source + dist; v2.0.1 likely refactored fingerprints CI action
    - **`packages/e2e/` (11 files):** README, fixtures, helpers, selectors, tests — likely import-block reorgs under v2.0.1 formatter pass
    - **`scripts/` (2 files):** `download-duckdb-extensions{,.test}.ts`
    - **`docs/` (2 files):** `flatpak/maintenance.md`, `native-node-module-management.md`
    - **`etc/` (2 files):** `Dependency Report.md`, `vortex.api.md`
    - **`flatpak/` (1 file):** `generated-sources.json`
    - **`tools/` (1 file):** `addicons/index.html`
    - **`__tests__/` (1 file):** `reducers.download_management.test.js`

**Out of scope this phase:** Build verification — full `pnpm typecheck`/`lint`/`test`/`build` (Phase 35). R3 carry-forward (orphan `electron-builder.config.json`) — Phase 35 owns SYNC-35e. Rebase + FF-merge + tag (Phase 36). Manual hardware UAT (Phase 999.1 backlog or Phase 37). Refactoring inside resolved files — resolution only per REQUIREMENTS.md §Out of scope.

**Scope expansion rationale (mirrors D-32-13, D-33-13):** ROADMAP.md named `ExtensionManager`, `controls/Table`, `Application`, `cli`, `errorReporting`, `autoupdater`, `TrayIcon`, `store/{DuckDBSingleton,LevelPersist}`, `preload/index`, `shared/{errors,errors.test,telemetry/spans}`, `nexus_integration` — but the actual marker set spans 117 files repo-wide outside `extensions/`. Leaving 100+ files of conflicts behind would block Phase 35 typecheck/lint/test/build and force a "Phase 34-bis" or trip up the FF-merge in Phase 36. The atomic-commit-per-file structure plus the harness gate the additions cleanly. SYNC-34a as written ("renderer + main + shared spine … resolved") implicitly covers the entire spine and supporting tree once the merge is to FF-land cleanly.

**Top region density (Phase 34 heaviest hitters):**

- `src/renderer/src/extensions/nexus_integration/eventHandlers.ts` — 11 regions
- `src/main/src/Application.ts` — 11 regions
- `src/renderer/src/controls/Table.tsx` — 10 regions
- `src/renderer/src/views/pages/Tools/{useToolsPage,useToolsData}.ts` — 9 each
- `src/renderer/src/extensions/extension_manager/installExtension.ts` — 8
- `src/renderer/src/extensions/nexus_integration/index.tsx` — 7
- `src/shared/src/errors.test.ts` — 6
- `src/renderer/src/views/pages/Tools/{ToolRow,index}.tsx` — 6 each

</domain>

<decisions>
## Implementation Decisions

### Branch & commit pattern (carries from D-33-00 / D-32-15 / D-26-00)

- **D-34-00:** Continue work on `v8.1/config-bucket` (the cumulative branch from Phases 31–33). Per-file atomic commits per D-32-08 / D-33-07 idiom. Title format `resolve(<bucket-slug>): <file> — <one-line stance>` where `<bucket-slug>` is one of: `renderer-spine`, `main-spine`, `preload`, `shared`, `nexus`, `health-check`, `tools-page`, `views`, `util`, `store`, `installer`, `gh-actions`, `e2e`, `docs`, `scripts`, `flatpak`, `tools`, `etc`. Planner finalizes the slug-per-file mapping. SSH-signed commits per project memory `feedback_ssh_signing.md`. **No push from sandbox** during execution; Phase 36 handles the final push + FF-merge.

### Resolution order (carries D-33-01 dependency-grouped + D-32-01 leaf-first)

- **D-34-01:** Per-file atomic commits, **grouped by bucket in execution order, ordered by dependency depth** (dependees first), with leaf-first ordering inside each bucket. Wave parallelism is allowed across independent buckets; within a coupled bucket (e.g., main-spine where `Application.ts` depends on `cli.ts`), files commit sequentially leaf-first.

    **Bucket execution order:**
    1. **Wave A — shared (foundational, dependees of all others):** `shared/{types/errors,types/state,errors,telemetry/spans,errors.test}.ts` — leaf-first; `errors.test.ts` last (consumer of `errors.ts`)

    2. **Wave B — preload (single-file leaf):** `preload/src/index.ts` — done before main + renderer touch IPC channel types

    3. **Wave C — main spine (sequential within; some parallelism for store leaves):**
        - `store/{SubPersistor,LevelPersist,ReduxPersistorIPC}.ts` (parallel-safe; `ReduxPersistorIPC` depends on `LevelPersist` so commit second)
        - `errorReporting.ts` → `cli.ts` → `extensions/autoupdater.ts` → `TrayIcon.ts` → `Application.ts` (heaviest, 11 regions, depends on the above) → `main.ts` (entry-point, depends on Application)

    4. **Wave D — renderer leaves (parallel-safe across sub-buckets):**
        - **D1 — util/reducers/hooks (10 files, batched):** `util/*` + `reducers/*` + `hooks/*` — most are leaf, can fan out across 2–3 parallel agents
        - **D2 — store/telemetry/contexts (5 files):** `store/stateDiff{,.test}.ts`, `telemetry/selectors.ts`, `contexts/{PagesContext,builtInPages}.tsx`
        - **D3 — ui/layout (5 files):** `ui/components/form/*`, `ui/components/no_results/*`, `ui/README.md`, `views/layout/ToastContainer.tsx`

    5. **Wave E — renderer extensions (parallel-safe across extension dirs):**
        - **E1 — nexus_integration (9 files, ~30 regions; `eventHandlers.ts` heaviest at 11):** sequential within; leaf-first — `types/IValidateKeyData.ts` → `util/{UIDs,oauth}.ts` → `util.ts` → `views/{FreeUserDLDialog,GoPremiumDashlet}.tsx` → `selectors.test.ts` → `eventHandlers.ts` → `index.tsx`
        - **E2 — health_check (6 files):** sequential — `types.ts` → `api/triggers.ts` → `checks/modRequirementsCheck.ts` → `components/mod_requirement/ModRequirement.tsx` → `views/{HealthCheckDetailPage,HealthCheckPage}.tsx`
        - **E3 — installer + starter + activators + management (parallel batches):** `installer_fomod_{ipc/utils/VortexIPCConnection,native/installer}`, `starter_dashlet/{Tools,actions}`, `symlink_activator_elevate/index`, `hardlink_activator/index`, `gamemode_management/{index,views/GameRow}`, `category_management/index`, `profile_management/{index,selectors,views/ProfileView}`, `extension_manager/installExtension`, `file_based_loadorder/UpdateSet`, `browse_nexus/views/BrowseNexusPage`

    6. **Wave F — renderer views/pages (parallel-safe):**
        - **F1 — views/pages/Tools (5 files, ~31 regions):** sequential — `toolStarters.ts` → `useToolsData.ts` → `useToolsPage.ts` → `ToolRow.tsx` → `index.tsx`
        - **F2 — views/components/{Header,Menu,Spine} (11 files):** parallel batches per sub-dir
        - **F3 — heaviest renderer leaves:** `controls/Table.tsx` (10 regions; depends on shared types) → `ExtensionManager.ts` (depends on resolved extension barrels) → `renderer.tsx` (incl. resolution of `native-errors` import region deferred from Phase 33-F per D-33-13 — see D-34-15)

    7. **Wave G — repo-wide leaves outside src/:**
        - **G1 — docs (top-level, 4 files):** `CHANGELOG.md`, `CLAUDE.md`, `CONTRIBUTE.md`, `README.md` — likely formatter/wording reflows; smaller-diff stance dominant
        - **G2 — `.github/actions/fingerprints/` (10 files):** action source + dist — fork-CI-only files; smaller-diff stance, but verify `dist/index.js` against source rebuild expectation
        - **G3 — `packages/e2e/` (11 files):** README + fixtures + helpers + selectors + 5 tests — Playwright e2e; pure-text reflows expected
        - **G4 — `scripts/`, `docs/`, `etc/`, `flatpak/`, `tools/`, `__tests__/` (9 files):** misc leaves; one-shot wave

    8. **Wave H — R2 carry-forward (Jest `__mocks__/`) + done-gate:**
        - **R2 decision (D-34-15):** Document the Jest `__mocks__/` reintroduction decision per SYNC-34b. Phase 31 carried R2 forward as "decision pending"; Phase 33 D-33-15 deferred to Phase 34. Wave H makes the call.
        - **Done-gate verification (D-34-14).**

    Planner's prerogative to merge or re-split waves based on dependency-graph reading at plan time.

### Per-region resolution stance (carries D-33-02 hierarchy + Phase 32 Rule-1 dup-import avoidance)

- **D-34-02:** Default = hand-resolve every region. Per-region stance hierarchy:
    1. **Playbook-surface line (§1/§3/§4–§5/§6/§7a–d/§10/140a57217):** fork-wins (Linux preservation is non-negotiable). Phase 34 specifically protects:
        - §1 platform guards inside `src/main/src/{cli,Application,errorReporting,main}.ts`, renderer `util/{elevated,errorHandling,opn,startupSettings,walk}.ts`, `extensions/{symlink_activator_elevate,hardlink_activator}/index.ts`
        - §4–§5 Steam/Proton + NXM hooks inside `extensions/nexus_integration/{eventHandlers,index,util}.ts` and `cli.ts`
        - §6/§7 cluster touches (already resolved in Phase 32) — Phase 34 must NOT re-introduce `replaceAll`/case-folding regressions in any new sites
        - 140a57217 single-host invariant — `LinkingDeployment.ts` remains the sole `resolvePathCase(dataPath, …)` host. No new host in any Phase 34 file.
        - §10 native binaries — `extensions/installer_fomod_native/installer.ts` IPC consumer of native binary; preserve Linux .NET 9 path
    2. **Linux platform guard (`process.platform === 'win32'` / `'linux'` / `IS_WINDOWS`):** fork-wins.
    3. **New v2.0.1 feature scaffolding outside playbook surface:** upstream-wins. Cross-reference `git show fork/master:<path>` to confirm symbol didn't exist on fork.
    4. **Rule-1 dup-import avoidance** (validated in Phase 32 Waves 1–3, applied across Phase 33 Waves D1–D3): when upstream side merely duplicates an import already present in the HEAD side, take HEAD-empty.
    5. **Rule-2 D1-carryover prevention** (lesson from Phase 33 Wave D1 → Wave F bg3 parse-error fix-up): when collapsing reduce()/map()/forEach() callbacks during smaller-diff resolution, run `node --check` (Route 3) on the resolved file before commit if the file is a `.mjs` or `.js` leaf, OR run a lightweight `pnpm tsc --noEmit -p` against the workspace's tsconfig if `.ts`/`.tsx`. Catches lost-brace defects pre-commit instead of post-Wave.
    6. **Default (smaller-diff per D-32-02):** for line-wrap and import-block reorg, take whichever side has fewer changes against `git show fork/master:<path>`.

- **D-34-03:** No blanket `git checkout --ours` / `--theirs` (carries D-32-03 / D-33-03). v8.0 Phase 30 cascading-drift incident is the proof.

### Harness reuse + Phase 34 spine gates (carries D-33-04 / D-32-04 / D-26-03)

- **D-34-04:** **Re-use** Phase 33's `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh` (12-gate harness). Copy under `.planning/phases/34-renderer-main-spine-v2-0-1/scripts/`. **Extend with 2–4 new gates** per D-34-05 inspection result. Candidate Phase 34 gates (planner researcher confirms necessity):
    - **gate 13 — IPC channel sentinel:** `getIPCPath` utility imported + called identically in `src/main/src/{Application,extensions/elevated}` AND in `src/renderer/src/extensions/symlink_activator_elevate/index.ts` (parent-server + stringified-child-closure dual-patch from D-04 IPC serialisation trap memory)
    - **gate 14 — Linux process.argv slice:** `cli.ts` argv slice index = 1 on Linux, 2 on win32 (NXM URL bugfix from quick task `260407-grv` `d9986f6`)
    - **gate 15 — error-class preservation across renderer + main:** named error classes (`UserCanceled`, `TimeoutError`, etc.) exported from `shared/src/errors.ts` survive intact (sentinel: `class UserCanceled extends Error`)
    - **gate 16 — `__mocks__/` shape:** reflects R2 decision once made (e.g., if "drop", gate enforces zero-files in `src/renderer/src/__mocks__/`; if "keep", gate enforces presence of N expected mocks). Skipped if R2 decision postpones.

- **D-34-05:** Phase 34 plan-phase researcher inspects v2.0.1 diff for **new** call sites that touch playbook surface (mirror D-33-05). If v2.0.1 introduces new playbook-touching invariant the existing 12 gates miss, extend the harness as gate 13+ and document each addition. Snapshot existing playbook surface before/after each wave.

### Typecheck cadence (per-bucket, NOT per-file like Phase 32 D-32-06 nor per-extension like Phase 33 D-33-06)

- **D-34-06:** **Per-bucket typecheck** after each wave's files commit. Phase 32 ran per-file (15 tightly-coupled files); Phase 33 ran per-extension (80+ independently-typecheckable workspaces); Phase 34 spans 5 internally-coupled buckets (`shared`, `preload`, `main`, `renderer`, `repo-wide leaves`) plus the renderer's sub-buckets — per-file would be ~117× ~30–60s = ~90 min wall-time for marginal additional signal, and per-extension would miss cross-extension renderer drift.

    **Bucket-scoped invocation:**

    ```bash
    # Wave A (shared)
    pnpm tsc -p src/shared/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l
    # Wave B (preload)
    pnpm tsc -p src/preload/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l
    # Wave C (main)
    pnpm tsc -p src/main/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l
    # Wave D / E / F (renderer — single tsconfig spans all)
    pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l
    # Wave G (repo-wide leaves; depends on file types)
    # - .github/actions/fingerprints/: cd .github/actions/fingerprints && pnpm tsc --noEmit
    # - scripts/*.ts: pnpm tsc -p scripts/tsconfig.json --noEmit (if exists, else node --check after compile)
    # - packages/e2e/: cd packages/e2e && pnpm tsc --noEmit
    # - docs/etc/flatpak/tools: no typecheck (.md, .json, .html)
    # - __tests__/*.test.js: node --check
    ```

    Failure = >0 non-marker errors; blocks proceeding to next wave. Lint deferred to Phase 35 (consistent with v8.0 Phase 28 → 29 split, Phase 33 → 35 split).

### Atomic commits + commit body (carries D-33-07 / D-33-08 / D-33-09)

- **D-34-07:** One commit per resolved file, SSH-signed. Title format `resolve(<bucket-slug>): <file> — <one-line stance>`. Casual project voice per memory `feedback_casual_voice.md`.

- **D-34-08:** Commit body for each resolved file lists: which playbook gates (§1/§3/§4–§5/§6/§7/§10/140a57217) were affected/preserved (note: most files outside the heavy-region set will say "none — no playbook surface in this file"), conflict regions chosen fork-side vs upstream-side vs HEAD-empty (region count + brief reason), `grep-checkpoint.sh` exit status (`--skip-conflict-check` while wave in flight), bucket-scoped typecheck status (note "deferred to wave closeout commit" on intermediate files within a coupled bucket).

- **D-34-09:** No `--no-verify` unless husky genuinely cannot parse partial markers. Document any `--no-verify` use in commit body. `.planning/` is gitignored — `git add -f` for any planning-doc commits per memory `feedback_planning_gitignored.md`.

### Single-host invariants (carries D-33-10 / D-32-12)

- **D-34-10:** D-33-10 / D-32-12 single-host invariant carries: only `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` hosts `resolvePathCase(dataPath, …)` calls. Phase 34 must NOT introduce a second host in any renderer/main/shared file. The 140a57217 gate stays in place to catch any drift; researcher checks v2.0.1 diff for any new `resolvePathCase` call patterns and flags pre-execution.

- **D-34-11:** Pre/post grep + read pattern (D-26-02 / D-32-11 / D-33-11) carries to playbook-surface preservation: snapshot all sentinel strings + class names + IPC paths pre-resolution → resolve → re-grep + read post-resolution → confirm gates green.

### Wave parallelism + agent dispatch (Phase 32/33 precedent)

- **D-34-12:** Independent files (no cross-file imports within the same bucket) MAY be resolved in parallel via background `Agent(subagent_type="Engineer", run_in_background=true)` dispatches. Within a coupled file group, files commit sequentially leaf-first. Wave G (repo-wide leaves) is heavily parallel-safe since most files are docs/configs. Plan-phase planner finalizes the wave decomposition and parallelism count.

### Scope expansion (Phase 34's D-32-13 / D-33-13 mirror)

- **D-34-13:** Phase 34 covers ALL conflict markers in the repo OUTSIDE `extensions/` and `.planning/`, not just the ROADMAP-named files. 117 files total, ~217 regions. Rationale: same upstream merge, same playbook surface (or none), same FF-merge target; leaving 100+ files of conflicts behind would block Phase 35 typecheck/lint/test/build and forbid the Phase 36 FF-merge. The atomic-commit-per-file structure plus the harness gate the additions cleanly. SYNC-34a as written ("renderer + main + shared spine resolved") implicitly covers the entire spine and supporting tree, mirroring the D-32-13 / D-33-13 wording-coverage precedent.

### Done gate (mirrors D-33-14 / D-27-05 — 7 criteria for Phase 34)

- **D-34-14:** Phase 34 done-gate is all seven:
    1. `git grep -l '^<<<<<<< '` outside `.planning/` returns empty (zero markers anywhere except the planning docs).
    2. `scripts/grep-checkpoint.sh` (Phase 34 12+ gate version) exits 0 — covers all inherited Phase 26/32/33 gates plus any Phase 34-specific gates added per D-34-04/D-34-05.
    3. Each touched bucket's bucket-scoped typecheck (D-34-06) returns 0 non-marker errors: shared, preload, main, renderer, plus repo-wide TS leaves (`.github/actions/fingerprints/`, `scripts/`, `packages/e2e/`).
    4. Phase-end full-repo typecheck deferred to Phase 35 (matches v8.0 split where Phase 29 owned the full pnpm run typecheck, Phase 33 → 35 split).
    5. ~117 atomic resolution commits + 1 R2 decision commit on `v8.1/config-bucket`, all SSH-signed, all matching the title format.
    6. R2 carry-forward Jest `__mocks__/` decision documented in `34-CONTEXT.md` (this file via update or in `34-PHASE-SUMMARY.md`) and SYNC-34b checked in REQUIREMENTS.md.
    7. STATE.md + ROADMAP.md updated via `gsd-sdk query state.complete-phase 34` + `gsd-sdk query roadmap.update-plan-progress 34`.

### R2 carry-forward — Jest `__mocks__/` decision (SYNC-34b)

- **D-34-15:** Phase 31 R2 carry-forward: Jest `__mocks__/` reintroduction decision deferred to Phase 34 per SYNC-34b. Phase 33 D-33-15 confirmed Phase 34 ownership. Wave H makes the call.

    **Pre-audit:**
    - `src/renderer/src/__mocks__/` exists locally (cheerio, ComponentEx, diskusage, electron, ffi, fs-util, leveldown, modmeta-db, original-fs, react-i18next, ref, ref-struct, ref-union, shortid, storeHelper, turbowalk, vortex-api, wholocks, winapi-bindings + 4 JSON state fixtures = 19 mocks + 4 fixtures).
    - There is no `src/renderer/jest.config.{js,mjs,cjs,ts}` in the current tree (the upstream v2.0.0 sync flipped renderer testing to Vitest, which discovers `vi.mock` per-test-file and does not autoload `__mocks__/` directories).
    - Vitest's `restoreMocks` + `vi.mock(..., factory)` per-test pattern has been the renderer test convention since Phase 14/16/19/20.
    - Existing `__mocks__/` is dead infrastructure on the renderer side. Extension-side `__mocks__/` (e.g., `extensions/feedback/__mocks__`) lives under each extension's own Jest setup and is unaffected by this decision.

    **Recommended decision (per `--auto` "first option = recommended" rule):**
    - **DROP** `src/renderer/src/__mocks__/` from the renderer source tree. No active consumer; Vitest doesn't autoload it; resurrecting it requires a Jest config that hasn't existed since v8.0. Single commit `chore(renderer): drop dead Jest __mocks__/ tree (SYNC-34b R2 decision)` removes the directory + any references in tsconfig/test config; preserves the extension-side `__mocks__/` (different consumer, different Jest setup).
    - **Alternative (rejected):** Restore renderer Jest test runner alongside Vitest. Outside Phase 34 scope; would itself require a SYNC-34c.
    - **Document the decision** in `34-CONTEXT.md` (this file) + `34-PHASE-SUMMARY.md` + check `[x] SYNC-34b` in REQUIREMENTS.md with deferral / drop rationale.

- **D-34-16:** R2 commit lands AFTER all 117 resolution commits (Wave H precedes only the done-gate STATE/ROADMAP/SUMMARY commits). Reason: dropping `__mocks__/` could surface Vitest test failures if any current renderer test secretly auto-imports from `__mocks__/`; keeping the directory present through resolution ensures the test surface is unchanged during the heavy resolution phase.

### `native-errors` carry-over from Phase 33-F

- **D-34-17:** Phase 33 Wave F deferred the `native-errors` catalog re-add decision per D-33-13 because the sole consumer site (`src/renderer/src/renderer.tsx:70` `import * as nativeErr from "native-errors"`) sat inside an unresolved Phase 34 conflict block. Phase 34 resolves `renderer.tsx` in Wave F3.
    - **If `nativeErr` survives the renderer.tsx resolution (i.e., the import line is preserved on either fork-side or upstream-side):** Phase 34 must add `native-errors` back to `pnpm-workspace.yaml catalog:` in the same wave, with `pnpm install --frozen-lockfile=false` to regenerate the lockfile. Single combined commit with the renderer.tsx resolution. SYNC-33b's "deferred until Phase 34" disposition flips to "satisfied via Phase 34 catalog re-add".
    - **If `nativeErr` is dropped during the renderer.tsx resolution (e.g., upstream removed the symbol):** SYNC-33b's deferral is upgraded to a permanent "no consumer" record matching the other 3 packages.

### Out-of-scope deferrals (carries from prior phases)

- **D-34-18:** R3 carry-forward (orphan `electron-builder.config.json`) — defer to Phase 35 per ROADMAP.md / SYNC-35e. (Note: pre-audit reveals the file actually exists at `src/main/electron-builder.config.json` and `src/main/electron-builder.config.cjs` — not orphan; Phase 35 confirms whether the .json is duplicate-of-.cjs or load-bearing.)
- **D-34-19:** Manual hardware UAT for any process-boot / NXM / extension-manager surface touched here — defer to Phase 999.1 backlog or Phase 37 carry-forward.
- **D-34-20:** Full `pnpm run {typecheck,lint,test,build}` repo-wide pass — Phase 35.

### Claude's Discretion

- Per-region resolution outcomes inside each file (executor judgement under D-34-02 stance hierarchy).
- Exact wave parallelism count and agent batching for Wave G (repo-wide leaves) — planner's call.
- Whether to extend the harness with v2.0.1-specific gates (D-34-05 inspection result drives this).
- Whether `R2 drop` commit is single-file-rm or `git rm -r` of the whole `__mocks__/` directory plus tsconfig adjustments — executor judgement.
- Whether `native-errors` catalog re-add (D-34-17) lands in the same commit as `renderer.tsx` or a separate `chore(workspace): re-add native-errors catalog entry` follow-up — single combined commit recommended unless lockfile regen produces noisy diffs.
- Final `bucket-slug` mapping for Wave G (one of `gh-actions`, `e2e`, `docs`, `etc-docs`, `scripts`, `flatpak`, `tools`, `tests-legacy`) — planner confirms.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Linux fork preservation (MANDATORY READ)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §1 (extension build guards), §3 (LOOT casing), §4–§5 (Steam/Proton + NXM), §6 (stagingDirHasFiles), §7a–d (backslash/case cluster), §10 (native binaries) are the playbook surface for this phase
- `extensions/skip-on-windows.mjs` / `extensions/skip-on-linux.mjs` — Linux-only / Windows-only extension guards (Phase 34 must not regress these)
- Project memory `feedback_bluebird_promise_trap.md` — bluebird Promise TS1064 trap (latent across all Phase 32 files; spot-check in any Phase 34 file that imports `bluebird` and adds `:Promise<…>` annotations to async fns)

### Prior phase context (decisions carry forward)

- `.planning/phases/31-config-bucket/31-CONTEXT.md` — Phase 31 R1/R2/R3 carry-forward decisions (R2 = `__mocks__/`)
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-CONTEXT.md` — D-32-XX decisions (atomic commits, harness, smaller-diff stance, Rule-1 dup-import, single-host invariant)
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` — Phase 32 7-gate harness (extended in Phase 33)
- `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md` — D-33-XX decisions (12-gate harness, Wave F catalog deferral, D1 carryover lessons)
- `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-09-SUMMARY.md` — Phase 33 master closeout (195 commits, gates exercised, critical preservation receipts)
- `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh` — 12-gate harness Phase 34 extends from
- `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-08-SUMMARY.md` — Wave F deferral details (`native-errors` Phase 34 trigger condition)
- `.planning/STATE.md`, `.planning/ROADMAP.md` — milestone position
- `.planning/REQUIREMENTS.md` — SYNC-34a + SYNC-34b acceptance criteria

### v8.0 archive precedents (extracted from git d56c45cea)

- `git show d56c45cea:.planning/phases/28-renderer-main-spine/28-CONTEXT.md` — D-28-XX source decisions this phase mirrors
- `git show d56c45cea:.planning/phases/28-renderer-main-spine/28-PHASE-SUMMARY.md` — v8.0 Phase 28 receipts (renderer + main + shared spine resolution patterns)

### Project / milestone scope

- `.planning/PROJECT.md` — v8.1 milestone framing
- `.planning/REQUIREMENTS.md` — SYNC-34a + SYNC-34b acceptance criteria
- `.planning/ROADMAP.md` Phase 34 entry — goal + success criteria

### Process-boot / IPC / NXM references

- `src/main/src/Application.ts` — main process lifecycle (heaviest main file: 11 regions)
- `src/main/src/cli.ts` — argv parsing (Linux argv slice = 1 from quick task `260407-grv` `d9986f6`)
- `src/main/src/errorReporting.ts` — early error handler before Application init
- `src/main/src/main.ts` — main process entry point
- `src/main/src/extensions/autoupdater.ts` — auto-updater gate (`process.env.APPIMAGE` only — Phase 07 D-07)
- `src/main/src/TrayIcon.ts` — Linux tray (StatusNotifierItem fallback)
- `src/preload/src/index.ts` — typed IPC bridge (single file)
- `src/renderer/src/extensions/nexus_integration/{eventHandlers,index,util}.ts` — NXM handler hot zone
- `src/renderer/src/renderer.tsx` — React bootstrap; **hosts Phase 33-F deferred `native-errors` import**

### Shared spine references

- `src/shared/src/errors.ts` — named error classes (`UserCanceled`, `TimeoutError`)
- `src/shared/src/errors.test.ts` — heaviest shared file (6 regions)
- `src/shared/src/types/{errors,state}.ts` — IPC + state type contracts
- `src/shared/src/telemetry/spans.ts` — OpenTelemetry span definitions

### Renderer integration points

- `src/renderer/src/ExtensionManager.ts` — extension loader + IExtensionContext
- `src/renderer/src/controls/Table.tsx` — heaviest control surface (10 regions)
- `src/renderer/src/util/elevated.ts` — elevation IPC consumer (Phase 05/10/12 carry-forward)
- `src/renderer/src/util/errorHandling.ts` — renderer error reporting

### R2 / R3 / native-errors carry-forward

- `src/renderer/src/__mocks__/` — Jest mocks tree (R2 SYNC-34b decision target — see D-34-15)
- `src/main/electron-builder.config.json` + `src/main/electron-builder.config.cjs` — R3 SYNC-35e Phase 35 target
- `pnpm-workspace.yaml` `catalog:` block — Phase 33-F deferred `native-errors` re-add (D-34-17)

### Project memory (apply throughout)

- `feedback_minimize_upstream_diff.md` — never reformat outside change scope
- `feedback_casual_voice.md` — casual voice in commits/docs
- `feedback_ssh_signing.md` — SSH-signed commits required
- `feedback_planning_gitignored.md` — `git add -f` for `.planning/` paths
- `feedback_git_push_ssh.md` — never push from sandbox
- `feedback_bluebird_promise_trap.md` — bluebird Promise TS1064 trap

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 33 harness** (`.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh`): 12-gate aggregate-fail harness with `--skip-conflict-check` flag. Phase 34 extends, doesn't rewrite.
- **Phase 32/33 commit-body template** (Pattern S5 from `32-PATTERNS.md`, refined in `33-PATTERNS.md`): regions-tallied + gates-affected + grep-exit + typecheck-status structure carries verbatim.
- **Bucket-scoped typecheck pattern** (Phase 32/33 correction): `cd <ws> && pnpm tsc -p tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l` works where `pnpm typecheck -F @vortex/<ws>` fails on this Nx monorepo. Phase 34 uses tsconfig-per-bucket invocation since renderer is one workspace with one tsconfig.
- **Wave-based parallel execution via background Agents** (Phase 32/33 precedent): independent files dispatched in parallel via `Agent(subagent_type="Engineer", run_in_background=true)`; sequential within a coupling boundary.
- **Atomic commit + per-bucket typecheck cadence** (D-28-XX from v8.0 archive + Phase 32/33 evolution): proven at Phase 28 for similar renderer + main + shared scope.

### Established Patterns

- **D-32-02 / D-33-02 stance hierarchy** for per-region resolution carries verbatim, with Rule-1 dup-import avoidance and Rule-2 D1-carryover prevention appended as tiers 4 + 5.
- **D-26-02 / D-32-11 / D-33-11 grep-pre/post + read** pattern for verifying playbook gates carries to all Phase 34 sentinel preservation.
- **D-32-13 / D-33-13 scope expansion** (resolve every conflict in the playbook-protected directory or repo, not just ROADMAP-named ones) carries: leaving 100+ markers behind would block Phase 35.
- **SSH commit signing local quirk:** `git log --show-signature` reports "No signature" due to `gpg.ssh.allowedSignersFile` not configured locally — confirm signature presence via `git cat-file -p <sha> | grep -c '^gpgsig '` (≥1 = signed). Documented in Phase 32/33 closeouts.

### Integration Points

- **mod_management bridge:** Phase 32 stabilized `src/renderer/src/extensions/mod_management/`. Phase 33 stabilized `extensions/`. Phase 34 sees stable dependees in both directions.
- **Shared spine first:** Wave A (`shared/`) commits before any other Wave so renderer + main + preload all see consistent type contracts. v8.0 Phase 28 precedent.
- **IPC channel types:** `src/shared/src/types/ipc.ts` and `src/preload/src/index.ts` define the typed IPC contract. Resolution order Wave A → Wave B → Wave C (main) → Wave D-F (renderer) honors the channel-typed dependency direction.
- **Workspace catalog edits (D-34-17 if `nativeErr` survives):** `pnpm-workspace.yaml` `catalog:` block + `pnpm-lock.yaml` regeneration — same surgical-edit pattern from Phase 31.
- **Renderer testing:** Vitest is the renderer test runner since v8.0; `vi.mock(..., factory)` per-test pattern. Jest `__mocks__/` autoload no longer wired. SYNC-34b R2 decision (D-34-15).

</code_context>

<specifics>
## Specific Ideas

- **v2.0.1 likely introduced cross-cutting changes** (formatter pass, IPC channel shape changes, shared error class refactors) — that's the most plausible explanation for ~117 files repo-wide each having 1+ conflict regions outside `extensions/`. Researcher should classify the dominant change pattern in the first analysis cycle so the planner can group "Wave G repo-wide leaves" into uniform stance buckets.
- **`Application.ts` (11 regions, main hot file)** likely has both v2.0.1 lifecycle additions and fork-side Linux platform guards — flag for hand-resolution priority.
- **`controls/Table.tsx` (10 regions)** likely line-wrap and import-block reorgs — sample early to confirm uniform stance.
- **`nexus_integration/eventHandlers.ts` (11 regions)** carries §4–§5 NXM handler surface — hand-resolve every region; cross-reference fork-side memory `260407-grv` (cli.ts argv slice) and `260407-icu/iv0/h9r` (NXM toggle + Firefox patches).
- **`shared/src/errors.test.ts` (6 regions)** is a test file; resolution must preserve named-class invariants (test-side fork-wins for any class-name string assertion).
- **`renderer.tsx` (Phase 33-F deferred `native-errors` import region)** is the single highest-stakes file in Phase 34 because of the catalog re-add trigger condition — flag for solo-pass execution by the most senior agent.
- **`.github/actions/fingerprints/dist/index.js`** is a built artifact — if it's in the marker set, the fork has a stale rebuild. Resolution stance: take whichever side is the post-build artifact of the resolved source files; if uncertain, flag for Phase 35 rebuild.
- **`packages/e2e/` (11 files)** are Playwright e2e tests. These tests don't run on Linux CI yet (Phase 22/27 deferred); Phase 34 only resolves markers, doesn't run the e2e suite. Resolution stance: smaller-diff for selectors/fixtures; fork-wins for any Linux-aware test setup.
- **Top-level docs (CHANGELOG, CLAUDE, CONTRIBUTE, README)** — fork's CLAUDE.md has a HEAD/v2.0.1 marker visible from the project rules import. Resolve smaller-diff first; if the marker is in fork-specific Branch Strategy / GSD sections, fork-wins; if it's in upstream README rewording, upstream-wins.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 35 (Build verification):** full `pnpm run {typecheck,lint,test,build}` exit 0; lint baseline-parity; R3 carry-forward (orphan `electron-builder.config.json`); confirm `.github/actions/fingerprints/dist/index.js` rebuilds cleanly from source.
- **Phase 36 (Land + tag + cherry-pick):** rebase `sync/upstream-v2.0.1` onto `master`; FF-merge PR #5; SSH-signed `v2.0.1-linux-rebased` tag; cherry-pick to `linux-port` via D-30-03 path filter; `release-linux.yml` AppImage + .deb.
- **Phase 37 (Carry-forward UAT):** SYNC-33-C, SYNC-34, SYNC-39 from v8.0; playbook updates discovered during v8.1.
- **Phase 999.1 backlog:** manual hardware UAT for process-boot / NXM / Tray / autoupdater surfaces touched here.
- **Restoring renderer Jest test runner alongside Vitest** (rejected alternative for D-34-15) — would itself require a SYNC-34c outside Phase 34 scope.
- **Promoting `grep-checkpoint.sh` to `release-linux.yml` CI** — Phase 32/33 deferred this; re-defer to Phase 35.

</deferred>

---

_Phase: 34-renderer-main-spine-v2-0-1_
_Context gathered: 2026-05-23 (auto-mode single pass)_
