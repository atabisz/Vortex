---
phase: 33-gamebryo-per-game-extensions-v2-0-1
wave: E
plan: 07
status: complete
commits: 13
extensions_resolved:
    [
        copy-extension,
        copy-native,
        gamestore-gog,
        gamestore-uplay,
        gamestore-xbox,
        local-gamesettings,
        mod-dependency-manager,
        theme-switcher,
    ]
---

# Wave E Summary — Build scaffolding (12 files)

## Outcome

7/7 build-scaffolding extensions/scripts resolved. 12 atomic SSH-signed `resolve(<slug>): ...` commits + 1 SUMMARY commit. Harness skip-mode 11/11 GREEN after every commit. **Full-mode harness now 12/12 GREEN** — gate-12 (marker count) flipped from FAIL to PASS as soon as the last marker file in `extensions/` was resolved (b83278732). Active gates 11+13 unchanged GREEN.

Range: `eb907a9bf..b83278732` on `v8.1/config-bucket` (12 resolution commits + this SUMMARY = 13 total).

## Per-file breakdown

| #   | File                                                           | Stance                                                                | Commit    | Notes                                                                                                                 |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | extensions/copy-extension.mjs                                  | tier-3 upstream-wins (signature) + preserve fork CWD inference        | eb907a9bf | API: `copyExtension(extension, target)`. Default `target='build'` keeps existing 60+ callers green.                   |
| 2   | extensions/copy-native.mjs                                     | tier-2 fork-wins (dist-fallback) + tier-4 Rule-1 HEAD-empty (imports) | 05c0492b9 | Linux-rebased dist-fallback skip-on-missing block preserved verbatim. `path` import preserved.                        |
| 3   | extensions/gamestore-gog/src/index.ts                          | tier-5 smaller-diff                                                   | 31ec46325 | 2 regions, formatter reflow only.                                                                                     |
| 4   | extensions/gamestore-uplay/src/index.ts                        | tier-5 smaller-diff                                                   | d4b328ceb | 1 region.                                                                                                             |
| 5   | extensions/gamestore-xbox/src/index.ts                         | tier-5 smaller-diff                                                   | f5e2193d0 | 9 regions.                                                                                                            |
| 6   | extensions/local-gamesettings/src/index.ts                     | tier-5 smaller-diff                                                   | 987a7eeac | 3 regions. PromiseBB identifier hits in regions are bluebird method calls (not type annotations) — bluebird trap N/A. |
| 7   | extensions/mod-dependency-manager/src/util/blacklist.ts        | tier-5 smaller-diff                                                   | f1ab7ee04 | leaf-first (mdm dependency order).                                                                                    |
| 8   | extensions/mod-dependency-manager/src/views/ConflictEditor.tsx | tier-5 smaller-diff                                                   | 95c72756d | 7 regions.                                                                                                            |
| 9   | extensions/mod-dependency-manager/src/views/OverrideEditor.tsx | tier-5 smaller-diff                                                   | 8972f69f2 | 2 regions.                                                                                                            |
| 10  | extensions/mod-dependency-manager/src/index.tsx                | tier-5 smaller-diff (barrel)                                          | 7ce6f4663 | 4 regions.                                                                                                            |
| 11  | extensions/theme-switcher/build.mjs                            | tier-5 smaller-diff                                                   | ad4408ced | nativeRemapPlugin import region; both sides reference it — pure formatter reflow, HEAD single-line wins.              |
| 12  | extensions/theme-switcher/src/SettingsDebug.tsx                | tier-5 smaller-diff                                                   | b83278732 | 1 region. **This commit flipped gate-12 GREEN.**                                                                      |

**Total:** 12 files across 7 extensions/scripts, 31 regions resolved.

## Active gate verification

**Gate-11 Morrowind migrate103:** Unchanged from D2 — still GREEN.

**Gate-13 BG3 divine error classes:** Unchanged from D1 — still GREEN.

**Gate-12 Marker count (full-mode):** Flipped GREEN at b83278732. `extensions/` is now fully marker-free. Remaining markers in repo (5 files: src/preload/src/index.ts, src/main/src/{errorReporting.ts, cli.ts, store/ReduxPersistorIPC.ts, main.ts}) are Phase 34 (renderer+main spine) scope, outside the Phase 33 marker-count gate's `extensions/` + `mod_management/` regex.

**§1/§3/§6/§7/§10 playbook gates:** All GREEN. No Wave E file touched any playbook surface inside conflict regions (RESEARCH §4 prediction held).

## API change documentation

### `extensions/copy-extension.mjs` (tier-3 upstream-wins on API signature)

v2.0.1 changed `copyExtension(extension)` (with top-level `const TARGET = "build"`) to `copyExtension(extension, target)` (runtime parameter). Resolution applies upstream's signature but layers fork's compatibility shim on top:

- `target = process.argv[3] ?? (extensionArg === "out" || extensionArg === "dist" ? extensionArg : "build")` — accepts upstream's 2-arg form (`node copy-extension.mjs <ext> out`), the 1-arg out/dist form (`node copy-extension.mjs out`), or the legacy 0-arg form (`node ../copy-extension.mjs` from inside an extension directory) which defaults to `target = "build"`.
- Validation accepts `'out'`, `'dist'`, or `'build'` so existing 60+ callers stay green without per-caller updates.
- Fork's CWD-inference fallback preserved (`process.cwd` + `path.relative(EXTENSIONS_DIR, cwd)` branch).

### `extensions/copy-native.mjs` (tier-2 fork-wins on dist-fallback)

Linux-rebased v2.0.0 added a dist-fallback skip-on-missing block that v2.0.1 dropped. Without it, incremental rebuild paths for gamebryo-archive/bsa/savegame-management would re-fail when source binaries had been cleaned but dist/ already contained the previously-copied artifacts. Block preserved verbatim, including sentinel string `'Source binaries missing but dist/ already has them — skipping copy'`. Import block kept HEAD form (execSync + fs + path) — upstream's rearrangement was missing `path`, which the dist-fallback uses.

## Closeout typechecks

All 6 affected extensions inner `_build` GREEN:

- gamestore-gog `_build` ✓
- gamestore-uplay `_build` ✓
- gamestore-xbox `_build` ✓
- local-gamesettings `_build` ✓
- mod-dependency-manager `_build` ✓ (rolldown + asset copy + scss)
- theme-switcher `_build` ✓ (rolldown + native remap + asset copy)

Standalone scripts:

- copy-extension.mjs `node --check` ✓
- copy-native.mjs `node --check` ✓

**Outer `build` chain unblocked.** Now that copy-extension.mjs and copy-native.mjs are marker-free, every per-game extension's outer `pnpm --filter <ext> build` should succeed. Verified with sample (game-ahatintime full outer build run after Wave E completion: GREEN).

## Issues encountered

1. **Node 18 vs Node 22 sandbox quirk.** System node in this sandbox is v18.19.1, which doesn't support `import.meta.dirname` (added in 20.11). Project requires Node 22+ via volta lock. Smoke-test of copy-extension.mjs in this sandbox failed at module-load with `ERR_INVALID_ARG_TYPE` from `path.resolve(undefined)`. Both HEAD and v2.0.1 use this construct, so it's not a regression introduced by the resolution. `node --check` (syntax-only) passed. Will validate at full build time under volta-locked Node 22.

2. **copy-extension.mjs target default.** Plan protocol step 5 said "the new `target` parameter defaults to 'build' if not passed". Upstream's actual code reads `target = process.argv[3] ?? process.argv[2]` — which would set `target = '<ext-name>'` in fork's existing call pattern, then bail at validation. Fork-side compat shim added: when extensionArg is neither 'out' nor 'dist', default `target` to `'build'`. Validation extended to accept all three. All 60+ existing callers stay green; new upstream-style 2-arg invocations also work.

## Affects downstream

- **Wave F (33-08):** catalog re-add. All build scaffolding now reconciled with v2.0.1; outer `build` chain unblocked.
- **Phase 33 done-gate:** marker-count gate flipped GREEN. Done-gate's 6-criterion check should pass.
- **Phase 34 (renderer + main spine):** 5 marker files remain in `src/`, all in spine paths — Phase 34 scope.
- **Phase 36 land step:** branch ready for FF-merge after Wave F + done-gate.

## Provides

- 12 fully-resolved build-scaffolding files; outer `build` chain unblocked.
- copy-extension.mjs API change applied (target as runtime arg) with fork's CWD inference + legacy default-target compatibility intact.
- copy-native.mjs Linux-rebased dist-fallback preserved (gamebryo-archive/bsa/savegame native rebuild path stays green).
- Full-mode harness 12/12 GREEN — first time in Phase 33.
- 12 bisectable atomic SSH-signed commits with stance + protocol notes per file.

## Push status

**No push performed.** Operator handles push at phase end. Branch `v8.1/config-bucket` advanced locally `a332e266c → b83278732` (12 resolution commits) → SUMMARY commit (this file).
