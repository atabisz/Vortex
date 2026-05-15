# Phase 27: Gamebryo + per-game extensions - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the 25 conflict files across 7 extensions on `v8.0/config-bucket` so playbook §1 (extension build guards), §3 (LOOT casing in `autosort.ts`), and §10 (cross-compiled native binaries) survive intact, BG3 divine error handling and Morrowind `migrate103` fix are preserved, and each touched extension passes `pnpm typecheck -F @vortex/<ext>`. Output: `git grep '^<<<<<<< '` empty across all 25 files; `scripts/grep-checkpoint.sh` exits zero (extended with §1/§3/§10 + per-game gates); per-extension typecheck clean; phase-end `pnpm typecheck` clean.

**Bucket files (25, by extension):**

**gamebryo-plugin-management (4):**

1. `extensions/gamebryo-plugin-management/src/index.ts`
2. `extensions/gamebryo-plugin-management/src/util/gameSupport.ts`
3. `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts`
4. `extensions/gamebryo-plugin-management/src/views/PluginList.tsx`

**gamebryo-savegame-management (2):** 5. `extensions/gamebryo-savegame-management/src/actions/session.ts` 6. `extensions/gamebryo-savegame-management/src/index.ts`

**collections (6):** 7. `extensions/collections/src/eventHandlers.ts` 8. `extensions/collections/src/index.ts` 9. `extensions/collections/src/util/gameSupport/gamebryo.tsx` 10. `extensions/collections/src/views/CollectionList/index.tsx` 11. `extensions/collections/src/views/CollectionPageEdit/Instructions.tsx` 12. `extensions/collections/src/views/InstallDialog/InstallStartDialog.tsx`

**modtype-bepinex (3):** 13. `extensions/modtype-bepinex/src/bepInExDownloader.ts` 14. `extensions/modtype-bepinex/src/common.ts` 15. `extensions/modtype-bepinex/src/index.ts`

**game-baldursgate3 (7):** 16. `extensions/games/game-baldursgate3/src/cache.ts` 17. `extensions/games/game-baldursgate3/src/divineCore.test.ts` 18. `extensions/games/game-baldursgate3/src/divineCore.ts` 19. `extensions/games/game-baldursgate3/src/divineWrapper.ts` 20. `extensions/games/game-baldursgate3/src/index.tsx` 21. `extensions/games/game-baldursgate3/src/loadOrder.ts` 22. `extensions/games/game-baldursgate3/src/util.ts`

**game-morrowind (1):** 23. `extensions/games/game-morrowind/src/migrations.js`

**game-witcher3 (2):** 24. `extensions/games/game-witcher3/src/index.ts` 25. `extensions/games/game-witcher3/src/installers.ts`

**Out of scope this phase:** Renderer + main spine conflicts (Phase 28). Build verification — `pnpm run build` end-to-end (Phase 29). Cherry-pick to `linux-port` (post-merge, after Phase 30).

</domain>

<decisions>
## Implementation Decisions

### Branch & commit pattern (carried from Phase 24/25/26)

- **D-27-00:** Continue work on `v8.0/config-bucket`. **Per-file atomic commits — 25 commits total** (Phase 26 D-26-00 idiom). Title format `resolve(<ext-slug>): <file> — <one-line stance>` where `<ext-slug>` is one of `plugin-mgmt`, `savegame-mgmt`, `collections`, `bepinex`, `bg3`, `morrowind`, `witcher3`. Push to `fork/sync/upstream-v2.0.0` once at phase end with `--force-with-lease`.

### Resolution order

- **D-27-01:** Per-file but **grouped by extension in execution order**, with extensions ordered by dependency depth (dependees first). Within each extension, leaf-first.

    **Extension order:**
    1. `gamebryo-savegame-management` (2f) — leaf utility, no extension-internal deps on others in scope.
    2. `gamebryo-plugin-management` (4f) — no deps on others in scope.
    3. `modtype-bepinex` (3f) — no deps on others in scope.
    4. `collections` (6f) — imports from gamebryo-plugin-management indirectly via shared types; resolve after plugin-mgmt settles.
    5. `game-baldursgate3` (7f) — independent.
    6. `game-morrowind` (1f) — independent.
    7. `game-witcher3` (2f) — independent.

    **Within-extension leaf-first:**
    - savegame-mgmt: `actions/session.ts` → `index.ts`
    - plugin-mgmt: `util/gameSupport.ts` → `util/PluginPersistor.ts` → `views/PluginList.tsx` → `index.ts`
    - bepinex: `bepInExDownloader.ts` → `common.ts` → `index.ts`
    - collections: `util/gameSupport/gamebryo.tsx` → `eventHandlers.ts` → `views/CollectionPageEdit/Instructions.tsx` → `views/InstallDialog/InstallStartDialog.tsx` → `views/CollectionList/index.tsx` → `index.ts`
    - bg3: `cache.ts` → `util.ts` → `divineCore.ts` → `divineWrapper.ts` → `divineCore.test.ts` → `loadOrder.ts` → `index.tsx`
    - morrowind: `migrations.js`
    - witcher3: `installers.ts` → `index.ts`

### Per-game preservation gates (BG3 + Morrowind)

- **D-27-02:** Encode BG3 divine error handling and Morrowind `migrate103` as **existence + count gates** (Phase 26 D-26-03 idiom — prefix-anchored regex + count threshold). Added to `scripts/grep-checkpoint.sh` and run after every commit.

    **BG3 gate (success criterion #4 first half):**

    ```bash
    git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
      extensions/games/game-baldursgate3/src/divineCore.ts | wc -l
    # must be ≥ 4
    ```

    **Morrowind gate (success criterion #4 second half):**

    ```bash
    git grep -n 'morrowind migrate103: mod directory missing' \
      extensions/games/game-morrowind/src/migrations.js | wc -l
    # must be ≥ 1
    ```

    Base-commit (`f15bbabb8`) anchors:
    - `divineCore.ts`: 4 named error classes (DivineExecMissing, DivineMissingDotNet, DivineTimedOut, DivineAborted), each `extends Error`, each with a string literal message and `this.name = 'X'` set.
    - `migrations.js`: try/catch around `migrate103` body logging the warning string; both required to survive.

    Detects:
    - Upstream removing or renaming any of the 4 BG3 error classes (count drops).
    - Upstream replacing the Morrowind warning string with a new copy that doesn't match the prefix-anchored substring.
    - Partial reverts where a subset of the 4 BG3 classes survives.

### Playbook §1/§3/§10 reverification

- **D-27-03:** Extend `scripts/grep-checkpoint.sh` from Phase 26 with three new gates **run after every commit** (durable; reused for v8.1, v9.0 sync milestones):

    **§1 (extension build guards — success criterion #2):**

    ```bash
    grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json 2>/dev/null \
      | grep -v 'gamestore-xbox' | head -1
    # must produce zero output (only gamestore-xbox is allowed inline guard)
    ```

    Plus positive existence checks:
    - `extensions/skip-on-windows.mjs` exists.
    - `extensions/skip-on-linux.mjs` exists.
    - `extensions/gamestore-xbox/package.json` matches `skip-on-linux.mjs`.

    **§3 (LOOT call-site casing — success criterion #3):**

    ```bash
    git grep -n 'pluginName\.toLowerCase' extensions/gamebryo-plugin-management/src/autosort.ts \
      | grep -E '(loadPluginsAsync|getPluginMetadataAsync|getPluginAsync|sortPluginsAsync)' | head -1
    # must produce zero output (no LOOT call uses pluginName.toLowerCase as the basename arg)
    ```

    Plus positive existence: `git grep -n 'path\.basename(pluginList\[' extensions/gamebryo-plugin-management/src/autosort.ts | wc -l` ≥ 4 (one per LOOT call site).

    **§10 (cross-compiled native binaries — success criterion #4 implicit):**

    ```bash
    test -f extensions/gamebryo-plugin-management/dist/node-loot.node \
      && test -f extensions/gamebryo-plugin-management/dist/libloot.so.0 \
      && test -f extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so \
      && test -f extensions/gamebryo-bsa-support/dist/bsatk.node
    # all four must exist on disk
    ```

    Phase 27 only touches `gamebryo-plugin-management/src/**` directly, but a hand-resolution that accidentally restages or git-removes `dist/**` would surface here immediately. Same gate runs for the rest of v8.0 and future syncs.

### Per-extension typecheck cadence

- **D-27-04:** **Per-extension typecheck** — after all of an extension's files commit, run `pnpm typecheck -F @vortex/<ext>` (or the project-local equivalent). Failure blocks proceeding to the next extension. **7 typecheck runs total** (~1–3 min each, ~10–20 min total). Phase-end `pnpm typecheck` runs as final done-gate.

    **Deviation rationale (vs Phase 26 D-26-04 per-file):** Phase 26's hot zone was 8 tightly-coupled files inside a single workspace — per-file typecheck made sense. Phase 27 spans 7 independently-typecheckable extension workspaces; per-file would be ~25× ~30–90s = ~13–37 min for marginal additional signal. Per-extension catches the same regression class (cross-file type drift inside an extension) at lower cost. Per-file typecheck is **not prohibited** if the executor judges a single extension complex enough — it's the floor, not the ceiling.

    **Typecheck command per extension:**

    ```bash
    pnpm typecheck -F @vortex/gamebryo-savegame-management
    pnpm typecheck -F @vortex/gamebryo-plugin-management
    pnpm typecheck -F @vortex/modtype-bepinex
    pnpm typecheck -F @vortex/collections
    pnpm typecheck -F @vortex/game-baldursgate3
    pnpm typecheck -F @vortex/game-morrowind
    pnpm typecheck -F @vortex/game-witcher3
    ```

    (Executor confirms exact filter names against `pnpm-workspace.yaml` / each `package.json` `name` field at plan time.)

### Done gate

- **D-27-05:** Phase 27 done-gate is all six:
    1. `git grep '^<<<<<<< ' extensions/gamebryo-plugin-management/ extensions/gamebryo-savegame-management/ extensions/collections/ extensions/modtype-bepinex/ extensions/games/game-baldursgate3/ extensions/games/game-morrowind/ extensions/games/game-witcher3/` returns empty (success criterion #1).
    2. `scripts/grep-checkpoint.sh` exits zero — covers §1/§3/§10 (criteria #2, #3) plus BG3 + Morrowind preservation (criterion #4) plus the existing Phase 26 gates (still valid; mod-management didn't move).
    3. Each touched extension passes `pnpm typecheck -F @vortex/<ext>` (success criterion #5).
    4. Phase-end `pnpm typecheck` (full repo) passes — final cross-extension drift check.
    5. 25 atomic commits on `v8.0/config-bucket` matching the title format `resolve(<ext-slug>): <file> — <stance>`.
    6. `--force-with-lease` push to `fork/sync/upstream-v2.0.0` succeeds at phase end.

### Claude's Discretion

- Per-conflict-region resolution stance for each file is left to the executor (default = hand-resolve, fork-side wins for Linux fixes, upstream wins for new feature scaffolding that doesn't touch playbook items). The decisions above lock the **strategy**, not per-region outcomes.
- Whether to commit the `scripts/grep-checkpoint.sh` extensions (§1/§3/§10 + BG3 + Morrowind gates) as commit 0 or alongside the first resolution commit — left to the executor. Suggested: commit 0 — same rationale as Phase 26.
- Exact `pnpm typecheck` filter syntax (`-F @vortex/<ext>` vs `--filter @vortex/<ext>` vs scripted) is left to the executor; confirm against `pnpm-workspace.yaml` at plan time.
- Whether `divineCore.test.ts` lands before or after `divineCore.ts` is left to the executor's judgement on which conflict surface is heavier — D-27-01 suggests `divineCore.ts` first (source before test), but a test-first stance is fine if the conflict shape favours it.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive Linux changes only).
- `.planning/REQUIREMENTS.md` — Phase 27 owns SYNC-05, SYNC-06, SYNC-17, SYNC-19.
- `.planning/ROADMAP.md` — Phase 27 success criteria (5 items; this CONTEXT.md adds a 6th — phase-end full typecheck — as part of D-27-05 done-gate).
- `.planning/milestones/v8.0-SCOPE-PROPOSAL.md` — bucket inventory; gamebryo + per-game extensions are part of the conflict surface.
- `.planning/STATE.md` — current position (Phase 26 complete).

### Linux fork preservation (MANDATORY READ)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §1 (extension build guards), §3 (LOOT casing), §10 (cross-compiled native binaries) are the playbook items this phase protects via `scripts/grep-checkpoint.sh` extensions. Re-grep verification commands at the bottom of each section ARE the script body.
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` Past gotchas → "platform-guard operator direction" — `&&` for skip-on-windows, `||` for skip-on-linux. Relevant if any extension's `package.json` is touched during conflict resolution.

### Prior phase context (decisions carry forward)

- `.planning/phases/24-config-bucket/24-CONTEXT.md` — atomic commit pattern, branch policy, force-with-lease push policy.
- `.planning/phases/25-restore-dropped-scaffolding/25-CONTEXT.md` — done-gate shape.
- `.planning/phases/26-mod-management-hot-zone/26-CONTEXT.md` — per-file commits (D-26-00), grep-checkpoint script idiom (D-26-03), per-game preservation framing analogue. **`scripts/grep-checkpoint.sh` is reused and extended** rather than rewritten.

### Source files this phase touches

- `extensions/gamebryo-plugin-management/src/{index.ts,util/gameSupport.ts,util/PluginPersistor.ts,views/PluginList.tsx}`
- `extensions/gamebryo-savegame-management/src/{actions/session.ts,index.ts}`
- `extensions/collections/src/{eventHandlers.ts,index.ts,util/gameSupport/gamebryo.tsx,views/CollectionList/index.tsx,views/CollectionPageEdit/Instructions.tsx,views/InstallDialog/InstallStartDialog.tsx}`
- `extensions/modtype-bepinex/src/{bepInExDownloader.ts,common.ts,index.ts}`
- `extensions/games/game-baldursgate3/src/{cache.ts,divineCore.test.ts,divineCore.ts,divineWrapper.ts,index.tsx,loadOrder.ts,util.ts}`
- `extensions/games/game-morrowind/src/migrations.js`
- `extensions/games/game-witcher3/src/{index.ts,installers.ts}`

### Source files NOT edited but gated

- `extensions/gamebryo-plugin-management/src/autosort.ts` — §3 LOOT casing reverification target. Currently clean (lines 177, 196, 202, 501, 503 use `path.basename(pluginList[*].filePath)`). Not in conflict; gated only.
- `extensions/*/package.json`, `extensions/games/*/package.json` — §1 inline-guard reverification target. Currently clean (only gamestore-xbox carries skip-on-linux). Not in conflict; gated only.
- `extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}`, `extensions/gamebryo-bsa-support/dist/bsatk.node` — §10 cross-compiled artefact reverification target. Existence-only gate.

### Reference commits

- Phase 26 final commit: `f15bbabb8` (`docs(26-10): complete done-gate + tracking plan`) — anchor for the "BG3 + Morrowind currently clean" claim.
- Phase 26 grep-checkpoint script commit (executor confirms exact SHA at plan time) — Phase 27 extends, doesn't replace.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh` — Phase 27 extends this script with §1/§3/§10 + BG3 + Morrowind gates. The script lives in Phase 26's directory by historical accident; Phase 27 plan should either (a) extend in place and reference cross-phase, or (b) move to a milestone-shared location like `.planning/milestones/v8.0/scripts/grep-checkpoint.sh`. Executor's call.
- Atomic-commit + `--force-with-lease` push pattern from Phase 24/25/26 — directly reused.
- Phase 26 prefix-anchored regex + count-threshold gate idiom (D-26-03) — directly reused for BG3 + Morrowind preservation gates.

### Established Patterns

- Hand-resolve default (Phase 24 D-05); fork-side wins for Linux fixes; upstream wins for new feature scaffolding that doesn't touch playbook items.
- Per-file commit titles: `resolve(<scope>): <file> — <stance>`.
- Per-extension typecheck filter: `pnpm typecheck -F @vortex/<ext>` (executor confirms exact name strings against `pnpm-workspace.yaml`).

### Integration Points

- BG3 `divineCore.ts` is the heaviest single file in scope (4 named error classes survive across the merge). Hand-read every conflict region in this file.
- `collections/src/index.ts` re-exports — its conflicts depend on the other 5 collections files' final symbol shapes. Last in the collections sub-order (Phase 26 D-26-01 idiom for `index.ts`).
- `gamebryo-plugin-management/src/index.ts` re-exports plugin-mgmt internals; same idiom — last in the plugin-mgmt sub-order.

</code_context>

<specifics>
## Specific Ideas

- The grep-checkpoint script extensions for §1/§3/§10 are durable — written to be reusable for v8.1 and v9.0 sync milestones, not Phase-27-specific.
- BG3 + Morrowind gates use prefix-anchored regex + count threshold (e.g., `class (Divine…)\b extends Error` count ≥ 4) — same defensiveness shape as Phase 26 D-26-03's `resolvePathCase\(dataPath,` count ≥ 3 pattern.

</specifics>

<deferred>
## Deferred Ideas

- Promoting the extended `scripts/grep-checkpoint.sh` (now covering §1/§3/§6/§7a–d/§10 + BG3 + Morrowind + 140a57217) to `release-linux.yml` as a pre-build CI assertion — Phase 29 (Build verification) territory. Deferred from Phase 26; still deferred.
- Refactoring inside any of the 25 files — explicitly out of scope per `.planning/PROJECT.md` Out of Scope row "Refactoring inside conflict-resolution files".
- Witcher 3 + BG3 + Morrowind runtime smoke tests on Linux (not just typecheck + grep) — Phase 29 build-verify territory. Phase 27 confirms structural preservation; Phase 29 confirms runtime behaviour.
- Moving `grep-checkpoint.sh` from Phase 26's directory to a milestone-shared location (e.g., `.planning/milestones/v8.0/scripts/`) — minor refactor that's defensible but not required for Phase 27 to succeed. Executor's discretion.

</deferred>

---

_Phase: 27-gamebryo-per-game-extensions_
_Context gathered: 2026-05-15_
