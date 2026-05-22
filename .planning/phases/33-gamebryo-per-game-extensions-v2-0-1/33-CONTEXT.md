# Phase 33: Gamebryo + per-game extensions (v2.0.1) - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; mirrors v8.0 Phase 27 D-27-XX, adjusted for v2.0.1 breadth + Phase 32 D-32-XX precedents)

<domain>
## Phase Boundary

Resolve every conflict marker introduced by v2.0.1 across the `extensions/` tree (gamebryo + per-game + collections + modtype-bepinex + supporting build/copy scaffolding) while preserving every Linux-fork playbook invariant: §1 (extension build guards via `skip-on-windows.mjs` / `skip-on-linux.mjs`), §3 (LOOT call-site casing in `gamebryo-plugin-management/src/autosort.ts`), §10 (cross-compiled native binaries on disk), plus per-game preservation: BG3 divine error classes (4 named classes in `divineCore.ts`) and Morrowind `migrate103` warning string in `migrations.js`. Re-add catalog entries pnpm dropped in Phase 31 (`esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`) when their consumer extensions become workspace members during this resolution wave.

**In-scope conflict files (183 total, 879 conflict regions across 80+ extensions):**

By bucket:

- **gamebryo core (4 extensions, 14 files, ~30 regions):**
    - `gamebryo-plugin-management/` (5 files): `build.mjs`, `src/index.ts`, `src/util/PluginPersistor.ts`, `src/util/gameSupport.ts`, `src/views/PluginList.tsx`
    - `gamebryo-savegame-management/` (4 files): `build.mjs`, `tsconfig.json`, `src/index.ts`, `src/actions/session.ts`
    - `gamebryo-archive-support/` (1 file): `build.mjs`
    - `gamebryo-bsa-support/` (1 file): `build.mjs`

- **modtype-bepinex (3 files):** `build.mjs` + 2 source files

- **collections (12 files, ~30+ regions):** `build.mjs`, `src/{collectionExport,eventHandlers,index,util/gameSupport/gamebryo,views/CollectionList/index,views/CollectionPageEdit/{Instructions,ModsEditPage},views/CollectionPageView/{HealthDownvoteDialog,index},views/InstallDialog/{InstallFinishedDialog,InstallStartDialog}}.{ts,tsx}`

- **per-game extensions (heavy hitters):**
    - `game-witcher3` (27 files) — largest by file count
    - `game-baldursgate3` (16 files; BG3 divine preservation gate critical)
    - `game-7daystodie` (8 files)
    - `game-masterchiefcollection` (6 files)
    - `game-kingdomcome-deliverance` (5 files)
    - `game-{spyroreignitedtrilogy,morrowind,codevein,bloodstainedritualofthenight,bladeandsorcery}` (4 each)
    - `game-untitledgoose` (3 files)
    - ~60+ other game extensions (1 file each — almost certainly leaf line-wrap or import-block reorgs)

- **supporting scaffolding:**
    - `extensions/copy-extension.mjs`, `extensions/copy-native.mjs` (root-level build helpers)
    - `mod-dependency-manager` (4 files), `theme-switcher` (2 files), `gamestore-{xbox,uplay,gog}` (1 each), `local-gamesettings` (1 file)

**Out of scope this phase:** Renderer + main spine conflicts (Phase 34). Build verification — full `pnpm typecheck`/`lint`/`test`/`build` end-to-end (Phase 35). Cherry-pick to `linux-port` (Phase 36, post-FF-merge). Manual hardware UAT for any per-game extension (Phase 999.1 backlog or Phase 37 carry-forward).

**Scope expansion rationale (mirrors D-32-13):** ROADMAP.md named only the gamebryo + collections + modtype-bepinex + BG3 + Morrowind + Witcher 3 buckets, but v2.0.1 introduced conflicts across virtually every game extension (likely from `IExtensionContext` shape changes, shared imports, or formatter passes). Leaving 60+ files of conflicts behind would block Phase 34/35 typecheck and force a "Phase 33-bis" later. Atomic-commit-per-file structure + the harness gate the additions cleanly. SYNC-33a as written ("gamebryo + per-game extensions … with playbook §1/§3/§10 preserved") implicitly covers all extensions in the playbook-protected directory tree.

</domain>

<decisions>
## Implementation Decisions

### Branch & commit pattern (carries from D-32-15 / D-27-00 / D-26-00)

- **D-33-00:** Continue work on `v8.1/config-bucket` (the cumulative branch from Phases 31–32). Per-file atomic commits per D-32-08 / D-26-00 idiom. Title format `resolve(<ext-slug>): <file> — <one-line stance>` where `<ext-slug>` mirrors the extension directory name (`plugin-mgmt`, `savegame-mgmt`, `bsa-support`, `archive-support`, `bepinex`, `collections`, `bg3`, `morrowind`, `witcher3`, `7daystodie`, `mhc`, `kcd`, etc. — executor maps remaining one-file extensions to short slugs at plan time). SSH-signed commits per project memory `feedback_ssh_signing.md`. **No push from sandbox** during execution; Phase 36 handles the final push + FF-merge.

### Resolution order (carries D-27-01 dependency-grouped + D-32-01 leaf-first)

- **D-33-01:** Per-file atomic commits, **grouped by extension in execution order, ordered by dependency depth** (dependees first), with leaf-first ordering inside each extension. Wave parallelism is allowed for **independent extensions** (no cross-extension imports) but a single extension's files must commit sequentially leaf-first.

    **Extension dependency order (mirrors D-27-01 with v2.0.1 additions):**
    1. **Wave A — gamebryo core (sequential within each, parallel across extensions where possible):**
        - `gamebryo-savegame-management` (4 files): leaf-first — `tsconfig.json` → `build.mjs` → `actions/session.ts` → `index.ts`
        - `gamebryo-plugin-management` (5 files): leaf-first — `build.mjs` → `util/gameSupport.ts` → `util/PluginPersistor.ts` → `views/PluginList.tsx` → `index.ts`
        - `gamebryo-archive-support` (1 file): `build.mjs`
        - `gamebryo-bsa-support` (1 file): `build.mjs`

    2. **Wave B — modtype-bepinex (3 files):** `build.mjs` → leaf source → `index.ts` (executor confirms internal order)

    3. **Wave C — collections (12 files):** dependees-first — `build.mjs` → `util/gameSupport/gamebryo.tsx` → `eventHandlers.ts` → `collectionExport.ts` → `views/CollectionPageEdit/{Instructions,ModsEditPage}.tsx` → `views/CollectionPageView/{HealthDownvoteDialog,index}.tsx` → `views/InstallDialog/{InstallFinishedDialog,InstallStartDialog}.tsx` → `views/CollectionList/index.tsx` → `index.ts`

    4. **Wave D — per-game extensions (parallel-safe across games; sequential within):**
       Heavy hitters get dedicated waves; light extensions (1 file) batched. Internal leaf-first per game. Suggested dispatch:
        - **D1 — heavy:** `game-witcher3` (27 files) + `game-baldursgate3` (16 files; **BG3 divine gate active**)
        - **D2 — medium:** `game-7daystodie` (8), `game-masterchiefcollection` (6), `game-kingdomcome-deliverance` (5), `game-{spyroreignitedtrilogy,morrowind,codevein,bloodstainedritualofthenight,bladeandsorcery}` (4 each; **Morrowind migrate103 gate active**)
        - **D3 — light batch (1 file each):** all remaining ~60 single-file game extensions, batched parallel

    5. **Wave E — supporting scaffolding:** `extensions/copy-extension.mjs`, `extensions/copy-native.mjs`, `mod-dependency-manager` (4), `theme-switcher` (2), `gamestore-{xbox,uplay,gog}` (1 each), `local-gamesettings` (1)

    6. **Wave F — catalog re-add (SYNC-33b):** Once consumer extensions become workspace members in the build graph, re-add the four catalog entries pnpm `cleanupUnusedCatalogs` dropped in Phase 31 (`esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`) by editing `pnpm-workspace.yaml` `catalog:` block. Single commit. `pnpm install --frozen-lockfile=false` to regenerate `pnpm-lock.yaml`. Title: `chore(workspace): re-add esptk/exe-version/gamebryo-savegame/native-errors catalog entries (SYNC-33b)`.

    Planner's prerogative to merge or re-split waves based on dependency-graph reading at plan time.

### Per-region resolution stance (carries D-32-02 hierarchy + Wave-1 Rule-1 dup-import avoidance)

- **D-33-02:** Default = hand-resolve every region. Per-region stance hierarchy:
    1. **Playbook-surface line (§1/§3/§10/BG3-divine/Morrowind-migrate103):** fork-wins (Linux preservation is non-negotiable).
    2. **Linux platform guard (`process.platform === 'win32'` / `'linux'` / `IS_WINDOWS`):** fork-wins.
    3. **New v2.0.1 feature scaffolding outside playbook surface:** upstream-wins. Cross-reference `git show fork/master:<path>` to confirm symbol didn't exist on fork.
    4. **Rule-1 dup-import avoidance (validated in Phase 32 Waves 1–3):** when upstream side merely duplicates an import already present in the HEAD side, take HEAD-empty.
    5. **Default (smaller-diff per D-32-02):** for line-wrap and import-block reorg, take whichever side has fewer changes against `git show fork/master:<path>`.

- **D-33-03:** No blanket `git checkout --ours` / `--theirs` (carries D-32-03). v8.0 Phase 30 cascading-drift incident is the proof.

### Harness reuse + per-game gates (carries D-27-02, D-27-03, D-32-04, D-32-05)

- **D-33-04:** **Re-use** Phase 32's `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` (which itself re-used the v8.0 Phase 26 7-gate harness). Copy or symlink under `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/`. **Extend** with three durable gates from D-27-03 + two per-game gates from D-27-02:
    - **§1 (extension build guards):** zero hits for `node -e.*process.platform` in `extensions/*/package.json` `extensions/games/*/package.json` excluding `gamestore-xbox`. Plus positive existence of `extensions/skip-on-windows.mjs` and `extensions/skip-on-linux.mjs`.
    - **§3 (LOOT casing):** zero hits for `pluginName\.toLowerCase` near `(loadPluginsAsync|getPluginMetadataAsync|getPluginAsync|sortPluginsAsync)` in `extensions/gamebryo-plugin-management/src/autosort.ts`. Plus positive existence: `path\.basename(pluginList\[` ≥ 4.
    - **§10 (native binaries):** all four files exist on disk: `extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}` and `extensions/gamebryo-bsa-support/dist/bsatk.node`.
    - **BG3 gate:** `git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' extensions/games/game-baldursgate3/src/divineCore.ts | wc -l` ≥ 4.
    - **Morrowind gate:** `git grep -n 'morrowind migrate103: mod directory missing' extensions/games/game-morrowind/src/migrations.js | wc -l` ≥ 1.

- **D-33-05:** Phase 33 plan-phase researcher inspects v2.0.1 diff for **new** call sites that touch playbook surface (mirror D-32-05). If v2.0.1 introduces a new playbook-touching invariant the existing 12 gates miss, extend the harness as gate 13+ and document the addition. Phase 32 found zero new playbook-surface introductions in v2.0.1; Phase 33 likely the same — but verify don't assume.

### Typecheck cadence (per-extension per D-27-04, NOT per-file like D-32-06)

- **D-33-06:** **Per-extension typecheck** after all of an extension's files commit, mirroring D-27-04. Phase 32's per-file cadence (D-32-06) made sense for 15 tightly-coupled files in a single workspace; Phase 33 spans 80+ independently-typecheckable extension workspaces — per-file would be ~183× ~30–90s = ~90 min wall-time for marginal additional signal. Per-extension catches the same regression class (cross-file type drift inside an extension) at lower cost.

    **Bucket-scoped invocation (correction over D-27-04's `pnpm typecheck -F @vortex/<ext>`):** Phase 32 verified that `pnpm typecheck -F @vortex/<workspace>` fails TS5023/TS5083 on this Nx monorepo. Use direct tsc against each extension's `tsconfig.json` instead:

    ```bash
    cd extensions/<ext-slug> && pnpm tsc -p tsconfig.json 2>&1 \
      | grep -v TS1185 | wc -l
    ```

    Failure = >0 non-marker errors; blocks proceeding to next extension. Lint deferred to Phase 35 (consistent with v8.0 Phase 27 → 29 split).

### Atomic commits + commit body (carries D-32-08 / D-32-09 / D-32-10)

- **D-33-07:** One commit per resolved file, SSH-signed. Title format `resolve(<ext-slug>): <file> — <one-line stance>`. Casual project voice per memory `feedback_casual_voice.md`.

- **D-33-08:** Commit body for each resolved file lists: which playbook gates (§1/§3/§10/BG3-divine/Morrowind-migrate103) were affected/preserved (note: most files in this phase will say "none — no playbook surface in this file"), conflict regions chosen fork-side vs upstream-side vs HEAD-empty (region count + brief reason), `grep-checkpoint.sh` exit status, bucket-scoped typecheck status (per-extension cadence — note "deferred to extension closeout commit" on intermediate files).

- **D-33-09:** No `--no-verify` unless husky genuinely cannot parse partial markers. Document any `--no-verify` use in commit body. `.planning/` is gitignored — `git add -f` for any planning-doc commits per memory `feedback_planning_gitignored.md`.

### Single-host invariants (carries D-32-11, D-32-12)

- **D-33-10:** D-32-12 single-host invariant carries: only `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` hosts 140a57217 `resolvePathCase(dataPath, …)` calls. Phase 33 must NOT introduce a second 140a57217 host in any gamebryo or per-game extension. The §3 gate already guards this for autosort.ts; the broader 140a57217 gate from Phase 26/32 stays in place to catch any drift.

- **D-33-11:** Pre/post grep + read pattern (D-26-02 / D-32-11) carries to BG3 + Morrowind preservation: snapshot divine error classes in `divineCore.ts` and the `migrate103` warning string in `migrations.js` pre-resolution → resolve → re-grep + read post-resolution → confirm both gates green.

### Wave parallelism + agent dispatch (Phase 32 precedent)

- **D-33-12:** Independent extensions (no cross-extension imports) MAY be resolved in parallel via background `Agent(subagent_type="Engineer", run_in_background=true)` dispatches. Within an extension, files commit sequentially leaf-first. Single-file game extensions in Wave D3 can be batched across multiple parallel agents (suggested: ~10 extensions per agent, ~6 agents). Plan-phase planner finalizes the wave decomposition and parallelism.

### Catalog re-add (SYNC-33b)

- **D-33-13:** Re-adding the four catalog entries pnpm dropped in Phase 31 (`esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`) is the **last** commit of Phase 33 (Wave F per D-33-01). Trigger condition: at least one consumer of each catalog entry is now a workspace member with a resolved file in this phase. Verify via `git grep -E 'esptk|exe-version|gamebryo-savegame|native-errors' extensions/ src/` before adding. `pnpm install --frozen-lockfile=false` to regenerate the lockfile; commit lockfile + workspace edit together. If a catalog entry has no live consumer after Phase 33 resolutions, document the deferral in the SUMMARY (don't re-add a dead entry).

### Done gate

- **D-33-14:** Phase 33 done-gate is all six (mirrors D-27-05):
    1. `git grep '^<<<<<<< ' extensions/` returns empty.
    2. `scripts/grep-checkpoint.sh` exits 0 — covers §1 (guards), §3 (LOOT casing), §10 (native binaries), BG3 divine, Morrowind migrate103, plus the inherited Phase 26/32 mod_management gates (still valid; mod_management/ didn't move).
    3. Each touched extension's bucket-scoped typecheck (D-33-06) returns 0 non-marker errors.
    4. Phase-end full-repo typecheck deferred to Phase 35 (matches v8.0 split where Phase 29 owned the full pnpm run typecheck).
    5. ~183 atomic resolution commits + 1 catalog re-add commit on `v8.1/config-bucket`, all SSH-signed, all matching the title format.
    6. STATE.md + ROADMAP.md updated via `gsd-sdk query state.complete-phase 33` + `gsd-sdk query roadmap.update-plan-progress 33`.

### Out-of-scope deferrals (carries from prior phases)

- **D-33-15:** R2 (Jest `__mocks__/` reintroduction) — defer to Phase 34 per ROADMAP.md / SYNC-34b.
- **D-33-16:** R3 (orphan `electron-builder.config.json`) — defer to Phase 35 per ROADMAP.md / SYNC-35e.
- **D-33-17:** Manual hardware UAT for any per-game extension touched here — defer to Phase 999.1 backlog or Phase 37 carry-forward (UAT not in v8.1 scope).

### Claude's Discretion

- Per-region resolution outcomes inside each file (executor judgement under D-33-02 stance hierarchy).
- Whether `divineCore.test.ts` lands before or after `divineCore.ts` (executor judgement on conflict-shape weight; D-27-01 suggested source-first).
- Exact wave parallelism count and agent batching for Wave D3 (light per-game) — planner's call.
- Whether to extend the harness with v2.0.1-specific gates (D-33-05 inspection result drives this).
- Final extension-slug → typecheck-path mapping for D-33-06 (planner confirms each `tsconfig.json` exists at plan time).
- Whether catalog re-add (D-33-13) splits into one commit per entry or one combined commit — single combined commit recommended unless lockfile regeneration produces noisy per-entry diffs.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Linux fork preservation (MANDATORY READ)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §1 (extension build guards), §3 (LOOT casing), §10 (native binaries) are the playbook surface for this phase
- `extensions/skip-on-windows.mjs` — guards Windows-only extensions from Linux build
- `extensions/skip-on-linux.mjs` — guards Linux-incompatible extensions from being included in Linux dist
- `extensions/gamestore-xbox/package.json` — only allowed inline `node -e.*process.platform` guard

### Prior phase context (decisions carry forward)

- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-CONTEXT.md` — D-32-XX decisions (atomic commits, harness, smaller-diff stance, Rule-1 dup-import, single-host invariant)
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-PHASE-SUMMARY.md` — closeout receipts (97 regions resolved, 8 dangerous regions preserved, harness exit 0, bucket-scoped typecheck = 0)
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` — re-use as base for Phase 33 harness
- `.planning/STATE.md`, `.planning/ROADMAP.md` — milestone position
- `.planning/REQUIREMENTS.md` — SYNC-33a + SYNC-33b acceptance criteria

### v8.0 archive precedents (extracted from git d56c45cea)

- `.planning/milestones/v8.0-phases/27-gamebryo-and-per-game-extensions/` (path on master after v8.0 ship) OR `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/27-CONTEXT.md` — D-27-00..D-27-05 source decisions this phase mirrors
- `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/27-PHASE-SUMMARY.md` — v8.0 Phase 27 receipts (25 commits, 7 extensions, harness extended with §1/§3/§10 + BG3 + Morrowind gates)

### Project / milestone scope

- `.planning/PROJECT.md` — v8.1 milestone framing
- `.planning/REQUIREMENTS.md` — SYNC-33a + SYNC-33b acceptance criteria
- `.planning/ROADMAP.md` Phase 33 entry — goal + success criteria

### Per-game preservation references

- `extensions/games/game-baldursgate3/src/divineCore.ts` (4 named error classes — preserve)
- `extensions/games/game-morrowind/src/migrations.js` (`migrate103` warning string — preserve)
- `extensions/gamebryo-plugin-management/src/autosort.ts` (LOOT casing — already gated, mustn't regress)
- `extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}` (native binaries on disk)
- `extensions/gamebryo-bsa-support/dist/bsatk.node` (native binary on disk)

### Project memory (apply throughout)

- `feedback_minimize_upstream_diff.md` — never reformat outside change scope
- `feedback_casual_voice.md` — casual voice in commits/docs
- `feedback_ssh_signing.md` — SSH-signed commits required
- `feedback_planning_gitignored.md` — `git add -f` for `.planning/` paths
- `feedback_git_push_ssh.md` — never push from sandbox
- `feedback_bluebird_promise_trap.md` — bluebird Promise TS1064 trap (latent across all 15 Phase 32 files; spot-check during Phase 33)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 32 harness** (`.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh`): 7-gate aggregate-fail harness with `--skip-conflict-check` flag. Phase 33 extends, doesn't rewrite.
- **Phase 32 commit-body template** (Pattern S5 from `32-PATTERNS.md`): regions-tallied + gates-affected + grep-exit + typecheck-status structure carries verbatim.
- **Bucket-scoped typecheck pattern** (Phase 32 correction): `cd <ext> && pnpm tsc -p tsconfig.json 2>&1 | grep -v TS1185 | wc -l` works where `pnpm typecheck -F @vortex/<ws>` fails on this Nx monorepo.
- **Wave-based parallel execution via background Agents** (Phase 32 precedent): independent files dispatched in parallel via `Agent(subagent_type="Engineer", run_in_background=true)`; sequential within a coupling boundary.
- **Atomic commit + per-extension typecheck cadence** (D-27-04 from v8.0 archive): proven at Phase 27 for 25 commits across 7 extensions.

### Established Patterns

- **D-32-02 stance hierarchy** for per-region resolution carries verbatim, with Rule-1 dup-import avoidance (validated in Phase 32 Waves 1–3) appended as tier 4.
- **D-26-02 / D-32-11 grep-pre/post + read** pattern for verifying playbook gates carries to BG3 + Morrowind preservation gates.
- **D-32-13 scope expansion** (resolve every conflict in the playbook-protected directory, not just the ROADMAP-named ones) carries: leaving 60+ game-extension conflict files behind would block Phase 34/35.
- **SSH commit signing local quirk:** `git log --show-signature` reports "No signature" due to `gpg.ssh.allowedSignersFile` not configured locally — confirm signature presence via `git cat-file -p <sha> | grep -c '^gpgsig '` (≥1 = signed). Documented in Phase 32 closeout.

### Integration Points

- **mod_management bridge:** Several Phase 33 extensions (collections, plugin-mgmt) import from `src/renderer/src/extensions/mod_management/` — that surface stabilized in Phase 32. Phase 33 sees stable dependees.
- **vortex-api re-exports:** Game extensions import from `vortex-api`. If v2.0.1 changed any re-export shape, Phase 33 catches it via per-extension typecheck.
- **Workspace catalog edits (Wave F):** `pnpm-workspace.yaml` `catalog:` block + `pnpm-lock.yaml` regeneration — same surgical-edit pattern from Phase 31.
- **Native binaries on disk (§10):** `extensions/{gamebryo-plugin-management,gamebryo-bsa-support}/dist/*.{node,so,so.0}` are .gitignore'd but tracked artifacts on the fork — gate must verify they survive `git status --porcelain` cleanly.

</code_context>

<specifics>
## Specific Ideas

- **v2.0.1 likely introduced cross-cutting changes** (formatter pass, `IExtensionContext` shape change, shared imports) — that's the most plausible explanation for 80+ game extensions each having 1+ conflict regions. Researcher should classify the dominant change pattern in the first analysis cycle so the planner can group "Wave D3 light batch" into uniform stance buckets.
- **Witcher 3 = 27 files** is the heaviest single extension; check if it's leaf-line-wraps (parallelizable) or coupled (sequential). RESEARCH should sample a few files to confirm.
- **BG3 = 16 files** with the divine error classes gate — `divineCore.ts` is the critical one. Other 15 are likely independent.
- **Morrowind = 4 files** with migrate103 gate on `migrations.js`. Other 3 are likely leaf.
- **`build.mjs` files (8 total)** likely have identical or near-identical conflict shapes across extensions — RESEARCH should batch-classify and the planner can apply a uniform stance.
- **`tsconfig.json` (1 file in `gamebryo-savegame-management`)** is the only JSON conflict — likely tiny, leaf-first.
- **Catalog re-add (D-33-13)** is the only non-resolution commit in the phase — saved for last so the lockfile regen reflects the final extension graph.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 34 (Renderer + main spine):** ExtensionManager, controls/Table, Application, cli, errorReporting, autoupdater, TrayIcon, store/{DuckDBSingleton,LevelPersist}, preload/index, shared/{errors,errors.test,telemetry/spans}, nexus_integration. R2 carry-forward (Jest `__mocks__/`) decided here.
- **Phase 35 (Build verification):** full `pnpm run {typecheck,lint,test,build}` exit 0; lint baseline-parity; R3 carry-forward (orphan `electron-builder.config.json`).
- **Phase 36 (Land + tag + cherry-pick):** rebase `sync/upstream-v2.0.1` onto `master`; FF-merge PR #5; SSH-signed `v2.0.1-linux-rebased` tag; cherry-pick to `linux-port` via D-30-03 path filter; `release-linux.yml` AppImage + .deb.
- **Phase 37 (Carry-forward UAT):** SYNC-33-C, SYNC-34, SYNC-39 from v8.0; playbook updates discovered during v8.1.
- **Phase 999.1 backlog:** manual hardware UAT for per-game extensions touched in this phase (BG3 round-trip, Morrowind migrate103 live test, Witcher 3 mod install, etc.).
- **Manual lockfile recovery if `pnpm install` produces unexpected drift during Wave F:** rollback strategy lives in Phase 31 D-31-XX precedent; not Phase 33 scope.
- **None — discussion stayed within phase scope.**

</deferred>

---

_Phase: 33-gamebryo-per-game-extensions-v2-0-1_
_Context gathered: 2026-05-22 (auto-mode single pass)_
