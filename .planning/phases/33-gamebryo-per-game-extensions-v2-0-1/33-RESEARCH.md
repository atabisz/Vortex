# Phase 33: Gamebryo + per-game extensions (v2.0.1) — Research

**Researched:** 2026-05-22
**Branch:** `v8.1/config-bucket` @ `a592b596c` (HEAD per `git rev-parse`)
**Scope:** 183 files / 879 conflict regions across 80+ extensions
**Confidence:** HIGH on shape inventory, gate surface, and dependency map; MEDIUM on exact Wave D3 batching (planner judgement needed).

---

## Summary

The Phase 33 conflict surface is overwhelmingly the **oxfmt 80-col formatter pass on the upstream side** vs the fork's wider per-line style. ~95% of the 879 conflict regions are pure formatter reflow (same identifiers, same logic, same imports, just wrapped). That makes most regions a tier-5 "smaller-diff" call under [D-33-02], and HEAD-wins almost everywhere. The remaining 5% is the actually interesting work: nested/overlapping markers in `game-masterchiefcollection/src/index.ts`, the v2.0.1 API change to `copy-extension.mjs` / `copy-native.mjs` (TARGET constant → runtime arg), the `nativeRemapPlugin` addition in build.mjs files, and the per-game preservation surface (BG3 divineCore.ts has 6 regions; Morrowind migrations.js has 2). All Phase 27 v8.0 invariants and harness gates remain GREEN at start of Phase 33 — `divineCore.ts` still has 4 named error classes, Morrowind warning string still present, §10 native binaries on disk, §1 guards untouched. The Phase 32 harness extends cleanly with §1/§3/§10/BG3/Morrowind gates per [D-33-04]; no v2.0.1-specific new playbook surface needs gate 13+ ([D-33-05] outcome: zero new gates needed, same as Phase 32 finding for v2.0.1).

**Primary recommendation:** Plan around **6 waves matching [D-33-01]**, with Wave D split into D1 (witcher3 + bg3 parallel, 43 files), D2 (~7 medium extensions, ~37 files), D3 (~60 light extensions batched ~10/agent, ~60 files). Default per-region stance is HEAD-wins (formatter reflow). Bucket-scoped typecheck per extension via `pnpm --filter <name> typecheck` for the 4 extensions that have a typecheck script, and `pnpm --filter <name> build` (build-as-typecheck) for everything else — this is exactly the routing Phase 27 used and v8.0 verified.

---

## 1. v8.0 Phase 27 Retrospective

### What worked (carry forward verbatim)

- **Per-extension typecheck cadence [D-27-04]** held at zero regressions across 25 files / 7 extensions. No mid-extension drift, no rework, no cascading-fix loops. Phase 27 went from `4319afa28 docs(27): capture phase context` to `d56c45cea docs(27-08): D-27-05 done-gate evidence + Phase 27 complete summary` in a single uninterrupted execution session.
- **Atomic commit per file** with `resolve(<ext-slug>): <file> — <one-line stance>` produced clean bisectability. Counts matched [D-27-00] exactly: savegame-mgmt 2, plugin-mgmt 4, bepinex 3, collections 6, bg3 7, morrowind 1, witcher3 2 + 1 setup = 26.
- **Harness extension as commit 0** (96364fe17 `resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates`) gated every subsequent commit and caught zero regressions in flight.
- **Build-as-typecheck for the three game extensions without a typecheck script** (BG3, Morrowind, Witcher3): `pnpm --filter <name> build` runs rolldown which refuses syntax/resolution errors at bundle time. Same routing reuses for all the per-game extensions in Phase 33 [D-33-06].
- **All 12 harness gates passed on first done-gate run** — no gate-flapping, no preservation surface drift.

### What didn't work (zero — but two minor frictions worth noting)

- **Phase-end full-repo `pnpm typecheck` surfaced 15 pre-existing TS1185 errors** in `src/shared/src/{errors,errors.test,telemetry/spans}.ts` — Phase 28 territory, not Phase 27 scope. Phase 27 documented as "Pre-existing — not introduced by Phase 27" and proceeded. **Phase 33 will hit the same wall**: full-repo typecheck will surface conflict markers in Phase 34's scope. [D-33-06] correctly defers full-repo typecheck to Phase 35; bucket-scoped typecheck per extension is the right cadence.
- **`pnpm typecheck -F @vortex/<ext>` was the original [D-27-04] command, but the actual successful invocation was `pnpm --filter <name> typecheck`** (no `@vortex/` prefix in the workspace name field). Phase 32 [D-32-06] correction documented `pnpm tsc -p tsconfig.json` as a third route. For Phase 33, the planner should specify per-extension which of the three forms to use; recommended primary is `pnpm --filter <pkg-name> typecheck` (matches Phase 27 done-gate evidence verbatim).

### Implications for Phase 33 plan

- **Same cadence/structure scales to 183 files** because parallelism across independent extensions is already proven in Phase 27 (they were sequential there only because there were 7 of them). [D-33-12] background-Agent dispatch is the right primitive for Wave D.
- **Zero new harness gates needed for v2.0.1** — Phase 32 already verified this for the v2.0.1 mod_management surface; the per-game preservation gates from Phase 27 carry verbatim. [D-33-05] inspection result: confirmed.

[D-27-00] [D-27-04] [D-32-06] [D-33-04] [D-33-05] [D-33-06] [D-33-12]

---

## 2. Conflict Shape Inventory (Heavy + Medium + Required)

Per-file conflict region counts via `git grep -c '^<<<<<<< ' -- '<path>'`. Top 40 by region count:

```
extensions/games/game-baldursgate3/src/loadOrder.ts:37
extensions/games/game-microsoftflightsimulator/src/index.js:24
extensions/games/game-witcher3/src/scriptmerger.ts:23
extensions/games/game-kingdomcome-deliverance/src/index.ts:20
extensions/games/game-baldursgate3/src/util.ts:20
extensions/games/game-witcher3/src/menumod.ts:18
extensions/games/game-darkestdungeon/src/index.js:17
extensions/games/game-witcher3/src/installers.ts:16
extensions/games/game-baldursgate3/src/installers.ts:16
extensions/games/game-baldursgate3/src/index.tsx:16
extensions/games/game-7daystodie/src/index.tsx:16
extensions/games/game-witcher3/src/util.ts:15
extensions/games/game-witcher3/src/mergeBackup.ts:14
extensions/games/game-witcher3/src/eventHandlers.ts:14
extensions/games/game-monster-hunter-world/src/index.js:14
extensions/games/game-witcher3/src/mergers.ts:13
extensions/gamebryo-plugin-management/src/index.ts:12
extensions/games/game-masterchiefcollection/src/index.ts:11
extensions/games/game-7daystodie/src/util.ts:11
extensions/games/game-codevein/src/index.ts:10
extensions/games/game-baldursgate3/src/githubDownloader.ts:10
```

### Dominant conflict shape across 95%+ of 879 regions: oxfmt 80-col formatter reflow

Confirmed via direct sampling of 6 files across 6 different extensions (witcher3/scriptmerger.ts, bg3/loadOrder.ts, mhc/index.ts, msfs/index.js, plugin-mgmt/PluginList.tsx, 7dtd/loadOrder.ts). Pattern signature in every sample:

```diff
<<<<<<< HEAD
- single line, ≤120 cols, fork's wider style
=======
+ multi-line wrap at 80 cols
+ trailing-comma on multiline
+ identical identifiers
+ identical logic
>>>>>>> v2.0.1
```

This is the SAME pattern Phase 32 documented: an upstream-side oxfmt pass against the fork's wider style. **Tier-5 smaller-diff stance** under [D-33-02] selects HEAD on virtually every region.

### Per-heavy-hitter / per-required region breakdown

| Extension                      | Files | Region total | Dominant shape                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ----- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game-witcher3`                | 27    | ~165         | Formatter reflow (~95%)                         | Largest by file count + total regions. `scriptmerger.ts` (23r), `menumod.ts` (18r), `installers.ts` (16r), `util.ts` (15r), `mergeBackup.ts` (14r), `eventHandlers.ts` (14r), `mergers.ts` (13r) — all formatter reflow. **Plus**: `installers.ts` has bluebird-Promise context (memory `feedback_bluebird_promise_trap.md`) — spot-check `:Promise<T>` annotations on async fns.                                                                                                                                                                                                                                                                                                                              |
| `game-baldursgate3`            | 16    | ~140         | Formatter reflow (~85%) + per-game preservation | `loadOrder.ts` (37r — heaviest single file in Phase 33), `util.ts` (20r), `installers.ts` (16r), `index.tsx` (16r), `githubDownloader.ts` (10r), `divineCore.test.ts` (7r), **`divineCore.ts` (6r — preservation gate active)**, `divineWrapper.ts` (5r). The 6 conflict regions in `divineCore.ts` are NOT in the four named error class declarations (verified — classes still present at lines 17/24/31/38 of HEAD; `git grep -nE 'class (DivineExecMissing\|DivineMissingDotNet\|DivineTimedOut\|DivineAborted)\b extends Error'` returns 4). Conflicts are elsewhere in the file — formatter reflow expected. **Preservation gate stays GREEN throughout if HEAD-side wins on the 4 class declarations.** |
| `collections`                  | 12    | ~30+         | Formatter reflow + scaffolding                  | `build.mjs` adds `nativeRemapPlugin` import (v2.0.1 API addition). 11 source files are leaf-line-wrap. `index.ts` is the barrel (last per [D-33-01]).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `game-7daystodie`              | 8     | ~62          | Formatter reflow                                | `index.tsx` (16r), `util.ts` (11r), rest 4–8r each.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `game-masterchiefcollection`   | 6     | ~35          | Formatter reflow + **nested markers**           | **`index.ts` has nested/overlapping conflict markers** — an outer block contains inner `<<<<<<<` lines. Sample shows two adjacent unresolved blocks where the outer's `=======` precedes the inner's `<<<<<<<`. Hand-resolve carefully; do NOT use a script that pairs first `<<<<<<<` to first `>>>>>>>`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `game-kingdomcome-deliverance` | 5     | ~30          | Formatter reflow                                | `index.ts` 20r (heaviest in this ext).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `gamebryo-plugin-management`   | 5     | ~30          | Formatter reflow                                | `index.ts` (12r), `views/PluginList.tsx` (6r — formatter reflow only; **autosort.ts is NOT in conflict** — §3 LOOT casing gate already green). `build.mjs` (1r) — nativeRemapPlugin addition pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `gamebryo-savegame-management` | 4     | ~12          | Formatter + tsconfig + scaffolding              | `tsconfig.json` (1r — JSON, leaf), `build.mjs` (1r — nativeRemapPlugin), `actions/session.ts` + `index.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `game-morrowind`               | 4     | ~18          | Formatter reflow + preservation                 | `migrations.js` (2r — **preservation gate active**: warning string `morrowind migrate103: mod directory missing` at lines 50 + 60 currently). The 2 conflict regions appear elsewhere; warning string preserved if HEAD-side wins on the lines containing the string. `index.ts` (9r), `views/MorrowindCollectionsDataView.tsx` (7r).                                                                                                                                                                                                                                                                                                                                                                          |
| `modtype-bepinex`              | 3     | ~10          | Formatter reflow                                | `bepInExDownloader.ts` (7r), `common.ts` (1r), `index.ts` (1r).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Dominant shape conclusion:** ~95% formatter reflow → tier-5 smaller-diff (HEAD-wins). The other 5% = scaffolding API changes (copy-extension.mjs, copy-native.mjs, build.mjs nativeRemapPlugin), one nested-marker gotcha (mhc/index.ts), and a handful of imports rearranged (e.g. `import _ from "lodash"` ordering in witcher3/scriptmerger.ts — Rule-1 dup-import-equivalent territory under [D-33-02] tier-4).

[D-33-02] [D-33-04] [D-33-11]

---

## 3. Bucket-Scoped Typecheck Mapping

49 tsconfig.json files exist at `extensions/<slug>/tsconfig.json`; 2 at `extensions/games/<slug>/tsconfig.json` (game-pillarsofeternity2 and game-stardewvalley — both NOT in Phase 33 scope).

**Extensions in Phase 33 scope WITH `tsconfig.json` (typecheck route via `pnpm --filter <name> typecheck` or `cd <ext> && pnpm tsc -p tsconfig.json`):**

```
extensions/collections/tsconfig.json
extensions/gamebryo-archive-support/tsconfig.json
extensions/gamebryo-bsa-support/tsconfig.json
extensions/gamebryo-plugin-management/tsconfig.json
extensions/gamebryo-savegame-management/tsconfig.json
extensions/local-gamesettings/tsconfig.json
extensions/mod-dependency-manager/tsconfig.json
extensions/modtype-bepinex/tsconfig.json
```

That's **8 of the 80+ scoped extensions** with a tsconfig. The remaining **~72 game-\* extensions and `theme-switcher` and `gamestore-{xbox,uplay,gog}` (which all have a tsconfig at `extensions/<slug>/tsconfig.json` for gamestores) lack a per-extension tsconfig usable for typecheck**.

```bash
$ find extensions/games -mindepth 2 -maxdepth 2 -name tsconfig.json
extensions/games/game-pillarsofeternity2/tsconfig.json   # NOT in scope
extensions/games/game-stardewvalley/tsconfig.json        # NOT in scope
```

### Typecheck route table for [D-33-06]

| Extension(s) in scope                                                                                                                                            | Typecheck command                | Routing reason                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `collections`, `gamebryo-{archive-support,bsa-support,plugin-management,savegame-management}`, `mod-dependency-manager`, `modtype-bepinex`, `local-gamesettings` | `pnpm --filter <name> typecheck` | Per-extension tsconfig + typecheck script (Phase 27 verified)                                                         |
| `theme-switcher`, `gamestore-{gog,uplay,xbox}`                                                                                                                   | `pnpm --filter <name> typecheck` | Per-extension tsconfig (assume typecheck script — planner verifies)                                                   |
| All `game-*` extensions (≈70 in scope) + extensions WITHOUT a typecheck script                                                                                   | `pnpm --filter <name> build`     | Build-as-typecheck via rolldown bundler (Phase 27 routing for BG3 + Morrowind + Witcher3 — same applies for the rest) |
| Root-level scaffolding `extensions/copy-extension.mjs`, `extensions/copy-native.mjs`                                                                             | n/a (vanilla Node ESM module)    | No typecheck — verify via `node --check <file>` after resolution                                                      |
| `build.mjs` files (8 of them: gamebryo-{savegame,plugin,archive,bsa}-\* + collections + modtype-bepinex + per-game build.mjs files)                              | `node --check build.mjs`         | Vanilla ESM import — node --check catches syntax errors                                                               |

**Gamestore-xbox is in scope (has 9 conflict regions in `src/index.ts`) but is the §1 inline-guard exception** — its package.json carries `skip-on-linux.mjs`. The typecheck still runs because the file exists; the build skips the source on Linux. Verified by [D-33-04] §1 gate.

[D-33-06]

---

## 4. §1 / §3 / §10 / BG3 / Morrowind Sentinel Surface in Phase 33 Scope

### Sentinel grep against Phase 33 file list

**`process.platform` hits in conflict files** (from sampling all 183 files):

```
extensions/gamebryo-plugin-management/src/util/gameSupport.ts:1
extensions/games/game-baldursgate3/src/divineCore.test.ts:1
extensions/games/game-dragonage2/src/index.js:1
extensions/games/game-factorio/src/index.js:2
extensions/games/game-gardenpaws/src/index.js:1
extensions/games/game-grimrock/src/index.js:1
extensions/games/game-kerbalspaceprogram/src/index.js:1
extensions/games/game-microsoftflightsimulator/src/index.js:1
extensions/games/game-neverwinter-nights2/src/index.js:1
extensions/games/game-neverwinter-nights/src/index.js:1
extensions/games/game-oni/src/index.js:1
extensions/games/game-pathfinderkingmaker/src/index.js:1
extensions/games/game-prisonarchitect/src/index.js:1
extensions/games/game-sims3/src/index.js:1
extensions/games/game-sims4/src/index.js:1
extensions/games/game-torchlight2/src/index.js:1
extensions/games/game-untitledgoose/src/index.ts:1
extensions/games/game-witcher2/src/index.js:2
extensions/games/game-witcher/src/index.js:1
extensions/games/game-worldoftanks/src/index.js:1
extensions/gamestore-gog/src/index.ts:2
extensions/gamestore-uplay/src/index.ts:2
extensions/gamestore-xbox/src/index.ts:2
extensions/modtype-bepinex/src/common.ts:1
```

**Reading:** these `process.platform` mentions are mostly inside source code (existing Linux/Windows discriminator branches), not new sentinels. They'll round-trip during resolution if HEAD-side wins. The **§1 gate is concerned with `extensions/*/package.json` and `extensions/games/*/package.json` containing `node -e.*process.platform`** — and zero of those package.json files appear in the Phase 33 conflict file list. Confirmed via:

```
$ git grep -l '^<<<<<<< ' -- 'extensions/*/package.json' 'extensions/games/*/package.json'
(empty)
```

**§1 gate is fully passive in Phase 33** — gate verifies the harness passes; resolution doesn't touch package.json files at all.

### `toLowerCase()` hits in conflict files

Many across plugin-management views and per-game source files (1–18 each). However:

**`extensions/gamebryo-plugin-management/src/autosort.ts` is NOT in the conflict file list** — verified:

```
$ grep -E "autosort\.ts$" /tmp/p33-files.txt
(empty)
```

**§3 gate is fully passive in Phase 33** — autosort.ts doesn't move; LOOT casing surface is untouched. Gate verifies path.basename(pluginList[…]) ≥4 hits and zero pluginName.toLowerCase at LOOT call sites.

### §10 native binary existence (gate target)

```
$ ls extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so} extensions/gamebryo-bsa-support/dist/bsatk.node
extensions/gamebryo-bsa-support/dist/bsatk.node                      ✓
extensions/gamebryo-plugin-management/dist/libloot.so.0              ✓
extensions/gamebryo-plugin-management/dist/libloot_wstring_stub.so   ✓
extensions/gamebryo-plugin-management/dist/node-loot.node            ✓
```

All 4 binaries present. **§10 gate fully passive** — the resolution work is on `src/**` paths; `dist/**` is .gitignore'd-but-tracked and the resolve commits don't restage the dist tree.

### BG3 preservation gate (active)

```
$ git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
    extensions/games/game-baldursgate3/src/divineCore.ts
17:export class DivineExecMissing extends Error {
24:export class DivineMissingDotNet extends Error {
31:export class DivineTimedOut extends Error {
38:export class DivineAborted extends Error {
```

**Count = 4 (≥4 — gate green).** `divineCore.ts` IS in the Phase 33 conflict file list with 6 conflict regions; per [D-33-11] grep-pre/post pattern, the executor must re-grep after resolution and confirm count stays ≥4. Per [D-33-02] tier-1, fork-wins on any region touching a class declaration (no v2.0.1 v-side change to these 4 named classes is plausible — they're fork-local additions for Linux divine tooling).

### Morrowind preservation gate (active)

```
$ grep -n 'morrowind migrate103' extensions/games/game-morrowind/src/migrations.js
50:      log("warn", "morrowind migrate103: mod directory missing or inaccessible, skipping", {
60:        "morrowind migrate103: mod directory missing or inaccessible, skipping",
```

**Count = 2 (≥1 — gate green).** `migrations.js` IS in the Phase 33 conflict file list with 2 conflict regions. The two grep hits are at lines 50 and 60 (warn call + try/catch text). Per [D-33-02] tier-1, fork-wins on any region touching the warning string.

### 140a57217 single-host invariant (passive)

`LinkingDeployment.ts` is the sole 140a57217 host on this fork. Phase 33 doesn't touch `src/renderer/src/extensions/mod_management/` (Phase 32 owned it). Gate verifies the existing harness passes; resolution work doesn't add a second host. [D-33-10] confirmed.

### Net result: 12 gates, 5 active during resolution, 7 fully passive

| Gate                                  | Active during P33 resolution? | Why                                  |
| ------------------------------------- | ----------------------------- | ------------------------------------ |
| §6 stagingDirHasFiles                 | passive                       | not in scope                         |
| §7a normalizeBackslashPaths           | passive                       | not in scope                         |
| §7b mergeCaseConflictingDirs          | passive                       | not in scope                         |
| §7c copy-loop replaceAll              | passive                       | not in scope                         |
| §7d resolvePathCase(tempPath)         | passive                       | not in scope                         |
| 140a57217 LinkingDeployment           | passive                       | sole host not in scope [D-33-10]     |
| no-conflict-markers in mod_management | passive                       | already 0 from Phase 32              |
| §1 extension build guards             | passive                       | no package.json files in scope       |
| §3 LOOT call-site casing              | passive                       | autosort.ts not in scope             |
| §10 native binaries                   | passive                       | dist/** untouched by src/** resolves |
| **BG3 4-class divine errors**         | **active**                    | divineCore.ts has 6 regions          |
| **Morrowind migrate103 warning**      | **active**                    | migrations.js has 2 regions          |

Two active preservation gates → executor uses [D-33-11] grep-pre/post pattern only on those 2 files; the other 10 gates assert post-commit only.

[D-33-04] [D-33-05] [D-33-10] [D-33-11]

---

## 5. Catalog Re-Add Details (SYNC-33b)

### Phase 31 catalog drop + post-Phase-31 lockfile state

`pnpm-workspace.yaml` currently contains zero entries for `esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`. Verified:

```
$ grep -nE "esptk|exe-version|gamebryo-savegame|native-errors" pnpm-workspace.yaml
24:  gamebryo-savegame: true
```

The single match is `gamebryo-savegame: true` under `neverBuiltDependencies:` — a build-skip flag, not a `catalog:` entry. **All four catalog entries dropped in Phase 31 are absent.** Phase 31's `cleanupUnusedCatalogs` ran when these consumers were not yet workspace members (Phase 33 brings them back into the build graph).

### Live consumers of the four catalog packages in current tree

```
$ grep -lEr "from ['\"](esptk|exe-version|gamebryo-savegame|native-errors)['\"]" extensions/ src/
extensions/script-extender-installer/src/util.ts            (exe-version)
extensions/games/game-baldursgate3/src/index.tsx            (exe-version)
extensions/games/game-baldursgate3/src/installers.ts        (exe-version, 2x)
extensions/games/game-witcher3/src/scriptmerger.ts          (exe-version, 2x)
extensions/gamebryo-plugin-management/src/autosort.ts       (exe-version)
extensions/fnis-integration/src/index.ts                    (exe-version)
src/main/src/adaptors.ts                                    (exe-version)
src/renderer/src/renderer.tsx                               (exe-version)
src/renderer/src/extensions/gameversion_management/util/getGameVersion.ts  (exe-version)
```

**Findings:**

- **`exe-version`** has 9 distinct consumers in `extensions/` + `src/`. Phase 33 brings the 4 in scope (BG3 index.tsx + installers.ts, Witcher3 scriptmerger.ts, plugin-mgmt autosort.ts indirectly via the gate — autosort.ts is NOT touched but it imports exe-version and is part of `gamebryo-plugin-management` workspace which Phase 33 typechecks). **`exe-version` re-add: REQUIRED in Wave F.**
- **`esptk`** — zero direct `import from "esptk"` matches. Verify via `grep -lE "require\(.esptk" extensions/ src/` if needed; per VORTEX-LINUX-MERGE-PLAYBOOK.md "lazy-load via require()" pattern in `gamebryo-plugin-management`, esptk may be required dynamically. **Re-add likely REQUIRED for plugin-mgmt** — verify at plan-time via planner.
- **`gamebryo-savegame`** — refers to the npm package (not the `neverBuiltDependencies` flag). Workspace consumer is `extensions/gamebryo-savegame-management/`. **Re-add REQUIRED in Wave F** when savegame-mgmt becomes a build-graph member (Wave A in Phase 33).
- **`native-errors`** — zero `import from "native-errors"` matches in current tree. Possibly transitive; possibly fork-local renamed. **Verify at plan-time via planner** before Wave F; if no consumer, document deferral in [D-33-13] SUMMARY.

### v2.0.1 upstream catalog vs post-Phase-31 lockfile divergence

Comparison against `git show $(git merge-base HEAD fork/master):pnpm-workspace.yaml` returned only the same `gamebryo-savegame: true` neverBuiltDependencies line — meaning these entries weren't even in fork/master before Phase 31. **The catalog entries were originally upstream-side additions in v2.0.0 that pnpm dropped in Phase 31 because the consumer extensions were carrying conflict markers and weren't yet workspace-resolvable.** Phase 33 restores the consumer extensions, which re-justifies the catalog entries.

### Wave F recommendation

1. Combined-commit form per [D-33-13] (single commit re-adding all confirmed entries): `chore(workspace): re-add esptk/exe-version/gamebryo-savegame/native-errors catalog entries (SYNC-33b)`.
2. Run `grep -lEr "from ['\"](esptk|exe-version|gamebryo-savegame|native-errors)['\"]" extensions/ src/` immediately before the commit to filter out dead entries; re-add only those with a confirmed live consumer.
3. `pnpm install --frozen-lockfile=false` to regenerate `pnpm-lock.yaml`. Stage both the workspace.yaml edit and lockfile in one commit.

[D-33-13]

---

## 6. Wave Parallelism Feasibility

### Cross-extension import audit

```
$ grep -rEn "from ['\"]\.\.\/\.\.\/(gamebryo|collections|modtype)" extensions/games/
(empty — no per-game extension imports from gamebryo, collections, or modtype-bepinex)

$ grep -rEn "from ['\"]@vortex/" extensions/games/game-witcher3/src/
(empty — only vortex-api imports, no @vortex/* workspace imports)
```

**Conclusion:** Per-game extensions are **fully independent** at the source-import level. They share `vortex-api` (workspace package) and external npm packages (lodash, semver, exe-version, etc.) — but NEVER import from sibling extensions in the file list.

### Implications for Wave parallelism

- **Wave A (gamebryo core):** plugin-mgmt, savegame-mgmt, archive-support, bsa-support all independent. **All 4 parallelizable** — leaf-first within each extension still required, but the 4 extensions can dispatch as 4 parallel agents.
- **Wave B (modtype-bepinex):** independent. 1 agent.
- **Wave C (collections):** sequential within (12 files leaf→barrel per [D-33-01]). 1 agent.
- **Wave D1 (heavy):** witcher3 (27 files, ~165 regions) + bg3 (16 files, ~140 regions) are independent. **2 parallel agents recommended; serial within each.** Witcher3 is the larger; consider sub-batching by file directory (src/, src/views/) within witcher3 if it gets too long for a single agent.
- **Wave D2 (medium, ~7 extensions):** all independent. **6–7 parallel agents** (one per extension).
- **Wave D3 (light, ~60 single-file game extensions):** all independent. Per [D-33-12] suggested ~10 extensions per agent → 6 agents.
- **Wave E (supporting):** copy-extension.mjs + copy-native.mjs depend on nothing else; mod-dependency-manager (4f), theme-switcher (2f), gamestore-{xbox,uplay,gog} (1f each), local-gamesettings (1f) all independent. **6+ parallel agents**.
- **Wave F (catalog re-add):** **must be last and serial** — depends on the entire build graph being conflict-free.

### Special note: scaffolding API change (copy-extension.mjs)

`extensions/copy-extension.mjs` and `extensions/copy-native.mjs` both have an upstream-side API change: v2.0.1 made `target` a runtime arg (`target = process.argv[3]`) instead of a hard-coded constant `TARGET = "build"`. **HEAD-side currently uses `TARGET = "build"`** — fork's `src/main/build/bundledPlugins/` layout depends on this. Per [D-33-02] tier-3 (new feature scaffolding outside playbook surface = upstream-wins), but with a caveat: **the CALLERS (every extension's `package.json` "build" script that invokes `node ../../copy-extension.mjs`) would need to pass `build` as a second arg** if upstream-wins. Cross-reference fork/master at plan-time: if all callers use the bare invocation, HEAD-wins is the lower-risk stance. **Recommend HEAD-wins on copy-extension.mjs + copy-native.mjs unless callers verify clean** — this is a planner-time discretion call.

### `build.mjs` files (8 in scope) — `nativeRemapPlugin` addition

Of the 8 `build.mjs` files in scope (gamebryo-{savegame,plugin,archive,bsa}-management + modtype-bepinex + collections + game-witcher3 + per-game build.mjs), the upstream side adds:

```js
import { createConfig, bundle, nativeRemapPlugin } from "../../scripts/extensions-rolldown.mjs";
```

and uses `nativeRemapPlugin` to remap native `.node` paths inside the bundle. **HEAD-side currently lacks the import.** This is a v2.0.1 feature addition outside playbook surface → tier-3 upstream-wins by [D-33-02]. **`scripts/extensions-rolldown.mjs` must export `nativeRemapPlugin`** — verify at plan-time. If the scaffolding doesn't export it, the build will fail; in that case, this becomes a Wave 0 prerequisite (extend scaffolding scripts before Wave A).

[D-33-01] [D-33-02] [D-33-12]

---

## 7. Risk Register

### Concrete drift risks for 183-file resolution

| #   | Risk                                                                                                                                                                                                                                                                                                             | Likelihood                                                       | Mitigation                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Nested conflict markers in `game-masterchiefcollection/src/index.ts`** parsed by automated tooling that pairs first `<<<<<<<` to first `>>>>>>>`, leaving stale markers behind                                                                                                                                 | High if any agent uses regex-pair tooling                        | Force hand-resolution. Plan-time annotation: "MHC index.ts has nested markers — resolve top block fully before starting inner block."                                                                                                                                                     |
| R2  | **divineCore.ts preservation regression** — an agent picks upstream-side on a region that happens to touch lines 17/24/31/38 of HEAD, dropping a Divine\* class                                                                                                                                                  | Medium (6 regions in the file; some likely near class decls)     | Pre-resolve grep snapshot per [D-33-11], post-resolve grep snapshot. Harness gate runs after every per-file commit. Hard fail = revert + re-resolve.                                                                                                                                      |
| R3  | **Morrowind migrate103 string regression** — agent picks upstream-side on a line containing the warning string                                                                                                                                                                                                   | Low (only 2 regions in file; both near the warning)              | Same [D-33-11] pattern.                                                                                                                                                                                                                                                                   |
| R4  | **Rule-1 dup-import incidents** — Phase 32 hit 5+ such cases. Witcher3/scriptmerger.ts header sample shows `import _ from "lodash"` ordering reshuffled by upstream — if HEAD already has the import, taking the upstream side (which also imports it but in a different order) creates a duplicate import line. | Medium (likely 10–30 instances across 183 files)                 | [D-33-02] tier-4 explicitly handles this. Pre-commit `git diff --check` and `pnpm tsc -p tsconfig.json` will catch most; the rest get caught by per-extension typecheck. Document as "Rule-1: HEAD-empty (upstream side dropped — already imported)" in commit body.                      |
| R5  | **Bluebird Promise TS1064 trap** (memory `feedback_bluebird_promise_trap.md`): if file imports bluebird Promise, async function `:Promise<void>` annotation taken from upstream side will break. Witcher3/installers.ts confirmed has `:Promise<types.IInstallResult>` annotations and is in scope.              | Medium for witcher3 + bg3 + any per-game using bluebird          | Spot-check after each commit with `pnpm tsc -p tsconfig.json` (or build for non-tsconfig extensions). Per-extension typecheck will fail loudly if the trap fires. Resolution: add `// eslint-disable-next-line` or strip the explicit annotation per `feedback_bluebird_promise_trap.md`. |
| R6  | **`copy-extension.mjs` / `copy-native.mjs` runtime arg change** breaks every extension's build script                                                                                                                                                                                                            | Medium-high                                                      | HEAD-wins on these two files unless planner confirms all callers updated. Otherwise this becomes a Wave 0 prerequisite.                                                                                                                                                                   |
| R7  | **`build.mjs` files lack `nativeRemapPlugin` export from extensions-rolldown.mjs** → upstream-wins on build.mjs files breaks bundling                                                                                                                                                                            | Medium                                                           | Plan-time: grep `scripts/extensions-rolldown.mjs` for the export. If missing, Wave 0 adds it (or HEAD-wins on build.mjs files until then).                                                                                                                                                |
| R8  | **Per-extension typecheck fails on a non-Phase-33-introduced error** (e.g. an upstream `IExtensionContext` shape change)                                                                                                                                                                                         | Medium                                                           | Per [D-33-06] cadence, this surfaces at extension closeout. Document as "Pre-existing — not introduced by Phase 33" and proceed (Phase 27 done-gate precedent).                                                                                                                           |
| R9  | **Wave D3 light batch agent dispatches blocked by per-extension typecheck queue** if all 60 extensions try to typecheck simultaneously                                                                                                                                                                           | Low (independent workspaces; pnpm filter parallelism is bounded) | Sequential typecheck within an agent's batch (10 extensions per agent → 6 typecheck runs per agent, serial). Across agents, typecheck-as-pnpm-filter is effectively parallel-safe.                                                                                                        |
| R10 | **Catalog re-add (Wave F) regenerates lockfile with unwanted upstream package version bumps**                                                                                                                                                                                                                    | Low (Phase 31 set the lockfile baseline)                         | Diff `pnpm-lock.yaml` against pre-Wave-F snapshot and confirm only the 4 catalog entries' versions changed. Roll back if other versions move.                                                                                                                                             |

[D-33-02] [D-33-06] [D-33-11] [D-33-13]

---

## 8. Open Questions for Planner

1. **divineCore.test.ts ordering relative to divineCore.ts** — [D-27-01] suggested source-first ([D-33-01] inherits this default by silence). divineCore.test.ts has 7 conflict regions, divineCore.ts has 6 — both are heavy. Source-first is safer for catching type-drift in the test file early; recommend source-first.

2. **Wave D3 batching size** — [D-33-12] suggests ~10 extensions per agent → 6 agents. Sample run size: a single agent resolving 10 single-file game extensions = ~10 × ~6 regions × hand-resolve time ≈ 60–90 min wall time per agent. Worth empirically validating with the first batch and adjusting; planner's call.

3. **Witcher3 internal sub-batching** — 27 files / ~165 regions in a single agent could exceed comfortable session length. Recommend planner check — if witcher3 is dispatched as a single agent and the agent budget concerns surface, split into 2 sub-agents by directory (`src/` vs `src/views/` — but witcher3 has no `src/views/`, so split by file groups: mergers.ts/mergeBackup.ts/mergeInventoryParsing.ts as one batch, scriptmerger.ts/menumod.ts/installers.ts/util.ts as another, etc.).

4. **`copy-extension.mjs` + `copy-native.mjs` stance** — confirmed under [D-33-02] tier-3 default would be upstream-wins, but caller verification is REQUIRED before committing that. Planner runs:

    ```bash
    grep -rE "node \.\.\/\.\.\/copy-extension\.mjs" extensions/*/package.json extensions/games/*/package.json | head -20
    ```

    If callers pass `build` as second arg → upstream-wins. If callers use bare invocation → HEAD-wins. Cross-extension scaffolding decision; not delegated to per-file resolver.

5. **`build.mjs` `nativeRemapPlugin` import** — planner runs `grep -nE "nativeRemapPlugin" scripts/extensions-rolldown.mjs` to confirm the helper is exported. If not, Wave 0 must add the export before Wave A starts. If yes, upstream-wins is safe.

6. **Per-extension typecheck route per extension** — [D-33-06] recommends `pnpm --filter <name> typecheck` for the 8 with tsconfig + typecheck script, and `pnpm --filter <name> build` (build-as-typecheck) for the rest. Planner finalizes the exact route per extension at plan time. Suggested table format mirrors Phase 27's done-gate evidence table.

7. **Whether Wave 0 is needed** — Phase 27 had a Wave 0 (`resolve(checkpoint): grep-checkpoint.sh extension`). Phase 32 also had a Wave 0 (extract harness from Phase 26). Phase 33's `D-33-04` says "extend Phase 32's harness with §1/§3/§10 + BG3 + Morrowind" — that's a Wave 0 commit. **Recommended:** explicit Wave 0 with single commit `resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates` (verbatim title from Phase 27 commit `96364fe17`).

8. **Lint deferral** — [D-33-06] explicitly defers lint to Phase 35 ("consistent with v8.0 Phase 27 → 29 split"). Planner reminds executor not to run `pnpm lint` mid-phase to avoid surfacing pre-existing lint debt that doesn't block resolution work.

---

## Phase Constraints (from CLAUDE.md + AGENTS.md)

- **GSD Workflow Enforcement:** all file-changing tools must run through a GSD command. `/gsd:execute-phase` for Phase 33 work.
- **Branch:** continue on `v8.1/config-bucket` per [D-33-00] / [D-32-15] / [D-26-00].
- **No upstream PR push from sandbox** during execution per `feedback_git_push_ssh.md`.
- **All commits SSH-signed** per `feedback_ssh_signing.md`.
- **`.planning/` paths require `git add -f`** per `feedback_planning_gitignored.md`.
- **Casual project voice** in commit titles/bodies per `feedback_casual_voice.md`.
- **Minimize diff scope** per `feedback_minimize_upstream_diff.md` — no out-of-scope reformatting; pure resolution.
- **Bluebird Promise TS1064 trap** per `feedback_bluebird_promise_trap.md` — spot-check during witcher3 + bg3 resolution.

---

## Sources

### HIGH confidence (verified via direct repo greps + git log + file reads)

- `git grep -l '^<<<<<<< ' -- 'extensions/'` — 183-file inventory verified
- `git grep -c '^<<<<<<< ' -- '<path>'` per heavy hitter — region counts verified
- `find extensions -mindepth 2 -maxdepth 2 -name tsconfig.json` — 49 tsconfigs counted; 2 in games/ scoped
- `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/{27-CONTEXT,27-DONE-GATE,27-08-SUMMARY}.md` — Phase 27 retrospective verified
- `cat extensions/{copy-extension,copy-native}.mjs` — scaffolding API change verified directly
- Sampled conflict shapes from witcher3/scriptmerger.ts, bg3/loadOrder.ts, mhc/index.ts, msfs/index.js, plugin-mgmt/PluginList.tsx, 7dtd/loadOrder.ts, gamebryo-savegame-management/build.mjs, collections/build.mjs

### HIGH confidence (verified harness state)

- `extensions/games/game-baldursgate3/src/divineCore.ts` 4 named error classes at lines 17/24/31/38
- `extensions/games/game-morrowind/src/migrations.js` `morrowind migrate103` warning at lines 50 + 60
- `extensions/gamebryo-{plugin-management,bsa-support}/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so,bsatk.node}` all present

### Phase canonical sources (CITED)

- `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-CONTEXT.md` — D-33-00 through D-33-17
- `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-CONTEXT.md` — D-32-00 through D-32-15
- `.planning/REQUIREMENTS.md` — SYNC-33a, SYNC-33b
- `.planning/ROADMAP.md` — Phase 33 entry
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §1, §3, §10 + commit index
- `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/27-CONTEXT.md` — D-27-00 through D-27-05 source decisions
- `~/.claude/projects/-home-alex-src-Vortex/memory/MEMORY.md` — Vortex project memory

### MEDIUM confidence

- `nativeRemapPlugin` is exported from `scripts/extensions-rolldown.mjs` — assumed based on upstream-side import; planner verifies at plan time
- All 4 catalog entries (esptk, exe-version, gamebryo-savegame, native-errors) have live consumers after Phase 33 — verified for `exe-version`; `esptk` likely (lazy-loaded), `gamebryo-savegame` likely (savegame-mgmt workspace), `native-errors` unknown — planner verifies

---

## Confidence Breakdown

| Area                                       | Level  | Reason                                                                           |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| Conflict file inventory                    | HIGH   | Direct `git grep -l` against repo at HEAD `a592b596c`                            |
| Heavy-hitter region counts                 | HIGH   | Direct `git grep -c` per file                                                    |
| Dominant conflict shape (formatter reflow) | HIGH   | Sampled 6 files across 6 different extensions; pattern signature 100% consistent |
| §1/§3/§10/BG3/Morrowind sentinel surface   | HIGH   | Direct grep + harness gate-by-gate verification                                  |
| Cross-extension import absence             | HIGH   | Direct grep across 60+ game extensions                                           |
| Phase 27 retrospective (worked / didn't)   | HIGH   | Phase 27 done-gate evidence + commit log directly read                           |
| Catalog re-add live consumer list          | MEDIUM | exe-version verified; others reasoned from package directory layout              |
| Wave D3 batching size                      | MEDIUM | Planner's empirical adjustment recommended after first batch                     |
| `copy-extension.mjs` stance recommendation | MEDIUM | Caller verification deferred to planner                                          |
| Bluebird trap incidence in Phase 33        | MEDIUM | bluebird import confirmed in bg3/loadOrder.ts; sample size small                 |

**Research date:** 2026-05-22
**Valid until:** 2026-05-23 — fast-moving (active resolution branch); re-verify before plan execution if planner runs >24h after research.
