---
phase: 33-gamebryo-per-game-extensions-v2-0-1
wave: F
plan: 08
status: complete
commits: 2
catalog_packages_re_added: 0
catalog_packages_deferred: 4
---

# Wave F Summary — Catalog re-add (full deferral) + bg3 D1 parse fix-up

## Outcome

Catalog re-add **fully deferred**. Pre-audit revealed all 4 candidate packages no longer require catalog entries:

- `exe-version` is now a workspace package (`packages/exe-version/`) — consumers depend on it via `workspace:*`, not `catalog:`. Phase 31's `cleanupUnusedCatalogs: true` legitimately dropped it because it has 0 catalog consumers.
- `esptk` was replaced by a pure-TypeScript ESP/ESM parser (commit 918fe02ad) — 0 source consumers.
- `gamebryo-savegame` was replaced by a pure-TypeScript implementation — 0 source consumers; the entry on line 24 of `pnpm-workspace.yaml` (`neverBuiltDependencies:`) is harmless residue and can stay until Phase 34/done-gate cleanup.
- `native-errors` has 1 candidate consumer site (`src/renderer/src/renderer.tsx:70`), but that import sits **inside an unresolved Phase 34 conflict block**. With the marker still present, the import is not yet a real consumer. Once Phase 34 resolves the renderer import region, the disposition can be revisited.

In addition, Wave F hit a Wave D1 carryover defect: `extensions/games/game-baldursgate3/src/{util.ts,loadOrder.ts}` had a structural parse error (closing brace lost in `Object.keys(mods).reduce(...)` callback). Fixed inline before final smoke build.

Range: `a047d959b..HEAD` on `v8.1/config-bucket` (1 fix commit + this SUMMARY = 2 total). No catalog edit, no lockfile churn.

## Consumer evidence pre-audit

```
exe-version=8 esptk=0 gamebryo-savegame=0 native-errors=1*
```

| Package             | Source consumers                                                                    | Decision                 | Rationale                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exe-version`       | 8 import sites across 13 extensions + main + renderer                               | **Skip catalog re-add**  | All consumers declare via `"exe-version": "workspace:*"` (verified in `extensions/{fnis-integration,gamebryo-plugin-management,script-extender-installer}/package.json`, `src/{main,renderer}/package.json`). `pnpm-lock.yaml` already resolves to local workspace package `packages/exe-version/` (v3.0.0, pure TS rewrite of the native addon). No catalog entry required.             |
| `esptk`             | 0 (only `yarn.lock` historical residue)                                             | **Defer (no consumers)** | Replaced by pure-TS ESP/ESM parser in commit 918fe02ad (`Replace esptk C++ addon with pure TypeScript ESP/ESM parser`). `gamebryo-plugin-management/package.json` does not list `esptk`. Re-adding would violate `cleanupUnusedCatalogs: true` and re-introduce a dropped native build.                                                                                                  |
| `gamebryo-savegame` | 0 (only `yarn.lock` + tsconfig path strings; no `import`/`require`)                 | **Defer (no consumers)** | Replaced by pure-TS implementation. `gamebryo-savegame-management/package.json` only depends on `lz4js`. The leftover `gamebryo-savegame: true` on line 24 of `pnpm-workspace.yaml` `neverBuiltDependencies:` is harmless residue (no package by that name is being installed). Disposition: **leave as-is** — removing it is a Phase 34 / done-gate cleanup question, not Wave F scope. |
| `native-errors`     | 1 (`src/renderer/src/renderer.tsx:70` `import * as nativeErr from "native-errors"`) | **Defer until Phase 34** | The single candidate consumer site is inside an unresolved Phase 34 conflict block (lines 65-71). With the marker still present, the import is not actually compiled. Once Phase 34 resolves the renderer import region — and `nativeErr` survives the resolution — `native-errors` can be re-added then. Adding it pre-resolution risks adopting an entry the resolver may discard.     |

`native-errors=1*` — present in the working tree but inside a `<<<<<<< HEAD ... >>>>>>> v2.0.1` block that hasn't been resolved yet (Phase 34 renderer-spine scope).

## D-33-13 partial-application clause

The plan explicitly allows `If any of the 4 returns 0 consumers, the package should NOT be re-added — record in SUMMARY as "deferred (no consumers)" and proceed with the remainder.` All 4 packages are deferred under this clause:

- 3 deferred for **0 consumers** (`esptk`, `gamebryo-savegame`, `native-errors` — counting only resolved code)
- 1 deferred for **already satisfied via workspace package** (`exe-version`)

Plan acceptance criterion _"All 4 packages present under `catalog:` in pnpm-workspace.yaml"_ is therefore not applicable; Wave F's outcome instead is "0 packages re-added, 4 deferred per D-33-13 clause".

## D1 carryover fix — bg3 reduce() callback parse error

**Commit `c174b8603`** — `fix(bg3): close lslib reduce() callback braces in util.ts + loadOrder.ts`

Wave D1's tier-5 smaller-diff resolution of `extensions/games/game-baldursgate3/src/util.ts` (commit 22c945a1d) collapsed two `Object.keys(mods).reduce((prev, id) => {...}, undefined)` callbacks into HEAD's compact form, but the inner `if (mods[id].type === ...)` block's closing brace was lost. The result was syntactically broken:

```ts
// BEFORE (broken)
const lsLib: types.IMod = Object.keys(mods).reduce((prev, id) => {
  if (mods[id].type === MOD_TYPE_LSLIB) {
    ...
    } catch (err) { ... }
    return prev;            // <-- inside the if
  },                        // <-- comma terminates if-block??
  undefined,
);
```

Rolldown reported `[PARSE_ERROR] Unexpected token` at `util.ts:328:6` and `loadOrder.ts:828:6` — both files share the exact same defect.

```ts
// AFTER (fixed — matches pre-merge upstream form 7e88dc3a2:bg3/util.ts)
const lsLib: types.IMod = Object.keys(mods).reduce((prev, id) => {
  if (mods[id].type === MOD_TYPE_LSLIB) {
    ...
    } catch (err) { ... }
  }                         // <-- close the if
  return prev;
}, undefined);
```

No behavioural change — restores the same logic the upstream form already encoded (`7e88dc3a2:bg3/util.ts:303-306`). Verified via `pnpm --filter game-baldursgate3 build` exit 0 post-fix.

This defect was latent through Wave D1 verification because:

- Wave D1's per-file `node --check` was Route 2 (no syntax check on `.ts` — relies on inner `_build`)
- Wave D1's `_build` ran on **already-resolved** tree but bg3 was on the merge-conflict path; my reading of the D1 SUMMARY suggests bg3 went through a different verification slice
- Outer `build` chain was blocked through D1+D2+D3 by `copy-extension.mjs` markers, masking the rolldown failure until Wave E unblocked it

## Smoke-build verification

| Consumer                                           | Build            | Notes                                                                                |
| -------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `pnpm --filter game-witcher3 build`                | ✓                | exe-version consumer; outer `build` chain works post-Wave-E                          |
| `pnpm --filter game-baldursgate3 build`            | ✓ (post-fix)     | exe-version consumer; required bg3 D1 parse-fix to compile                           |
| `pnpm --filter gamebryo-plugin-management build`   | ✓                | esptk consumer (TS rewrite, no native); outer build works                            |
| `pnpm --filter gamebryo-savegame-management build` | ✓                | gamebryo-savegame consumer (TS rewrite); outer build works                           |
| `pnpm --filter @vortex/renderer build`             | ✗ (out of scope) | Phase 34 spine markers (renderer.tsx + 4 src/main/\* files); not a Wave F regression |

The renderer failure is the same 5-file marker residue documented in 33-07-SUMMARY.md — Phase 34 (renderer + main spine) scope, outside Wave F's reach.

## Active gate verification

**Gate-9 (§10 native binaries):** Unchanged. `node-loot.node`, `libloot.so.0`, `libloot_wstring_stub.so`, `bsatk.node` all present on disk from Phase 27/28 carryover. Wave F made no native-binary changes.

**Gate-11 Morrowind migrate103:** Unchanged GREEN.

**Gate-12 Marker count:** Unchanged GREEN. Wave F touched no `extensions/` markers; bg3 fix removed only structural defect, not markers. 5 markers in `src/` remain (Phase 34 scope, outside this gate's regex).

**Gate-13 BG3 divine error classes:** Unchanged GREEN. The D1 fix-up touched lslib-reduce callbacks, not divine error classes.

**§1/§3/§6/§7/§10 playbook gates:** All GREEN. No Wave F file touched any playbook surface.

**Skip-mode harness after fix commit:** exit 0 (11 active gates GREEN).

## Issues encountered

1. **Wave D1 parse defect in bg3.** Two files under bg3 (`util.ts`, `loadOrder.ts`) had identical lost-brace defects from D1's HEAD-compact reduce-callback resolution. Both produced `[PARSE_ERROR] Unexpected token` under rolldown. **Fix:** Single combined commit `c174b8603` restoring the missing `}` on each inner `if`-block. No behaviour change; matches upstream pre-merge form. Confirmed via outer `build` exit 0.

2. **All 4 catalog candidates already settled.** Plan assumed Phase 32/33 would re-introduce the 4 packages once consumer extensions become workspace members. Reality: 3 of the 4 packages were _replaced by pure-TS workspace rewrites_ during the v8.0/v8.1 Linux port (commits 918fe02ad, 1b7a49faa, d08cf2e5d, 1475efea2). The replacement was already complete before Phase 31's catalog cleanup ran. `cleanupUnusedCatalogs: true` did exactly the right thing. No catalog re-add is warranted.

3. **`gamebryo-savegame` line-24 residue.** The plan's `neverBuiltDependencies:` line-24 disposition question (move to catalog vs keep dual-listed) is moot because `gamebryo-savegame` is no longer being installed at all. The flag is harmless. Disposition: **leave the residue alone**; if Phase 34 / done-gate cleanup wants to remove it, that's a one-line follow-up — not Wave F scope.

4. **`native-errors` import in unresolved Phase 34 conflict.** The single import site is inside `<<<<<<< HEAD / >>>>>>> v2.0.1` markers in `renderer.tsx` lines 65-71. Decided to defer the catalog decision until Phase 34 resolves the import region; if `nativeErr` is kept, Phase 34 can re-add at that point.

## Affects downstream

- **Wave 9 done-gate (33-09):** unblocked. No catalog edits to verify; pre-audit + smoke-build evidence captured here. The 6-criterion done-gate's "marker count = 0 in extensions/" already GREEN since Wave E.
- **Phase 34 (renderer + main spine):** if the resolver keeps `native-errors` from the v2.0.1 side of the renderer.tsx import block, Phase 34 should add it back to `pnpm-workspace.yaml catalog:` then. RESEARCH §3 already flagged this dependency.
- **Phase 36 land step:** branch ready for FF-merge after done-gate.

## Provides

- 0 catalog re-additions (full deferral per D-33-13 partial-application clause).
- 1 SSH-signed Wave-D1 fix-up commit `c174b8603` restoring bg3 reduce-callback braces (post-D1 carryover).
- 4/5 consumer smoke-builds GREEN (witcher3, bg3, gamebryo-plugin-management, gamebryo-savegame-management). 5th (renderer) blocked by Phase 34 spine markers, not a Wave F regression.
- Documentation of why each of the 4 candidate packages is correctly absent from the catalog at end of Phase 33.

## Push status

**No push performed.** Operator handles push at phase end. Branch `v8.1/config-bucket` advanced locally `a047d959b → c174b8603` (1 fix commit) → SUMMARY commit (this file).
