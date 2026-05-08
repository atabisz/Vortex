# Vortex Linux — Upstream Merge Playbook

Companion to [VORTEX-LINUX.md](VORTEX-LINUX.md). VORTEX-LINUX.md is the forward plan; this file is the post-merge checklist for keeping the fork working.

Everything in here is something we actually hit — not speculation. If it's in this file, it's bitten us at least once.

---

## Why this file exists

The upstream `nexus-mods/Vortex` repo ships frequent changes to build scripts, webpack configuration, and extension scaffolding. Many of these changes target Windows-only concerns (CI guards, native addon links, asar layout) and inadvertently undo our Linux compatibility work. The reverts are usually **silent** — the build still succeeds on CI, tests still pass, and the regression only surfaces at runtime on Linux (often several interactions deep, e.g. "staging folder won't change" caused by "webpack alias preempted by `nodeExternals`" caused by "upstream re-ordered `externals` in the config").

The playbook below is the checklist we run after every upstream merge and the principles we apply when Linux support regresses.

---

## Post-merge checklist

Run these **before** finalising any merge commit.

### 1. Platform guards on extension build scripts

```bash
grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json
```

If anything matches, upstream reintroduced an inline guard. Replace each hit with the appropriate named-script form based on which platform should skip:

```json
"build": "node ../skip-on-windows.mjs && (pnpm run _build && node ../copy-extension.mjs)"
"build": "node ../skip-on-linux.mjs || (pnpm run _build && node ../copy-extension.mjs)"
```

Note the operator asymmetry — see "platform-guard operator direction" in Historical gotchas for the full explanation. Quick rule: skip-on-windows uses `&&`, skip-on-linux uses `||`. Filename states the skipped platform.

Currently-known guarded extensions:
- `extensions/gamebryo-plugin-management/package.json` *(skip-on-windows)*
- `extensions/gamebryo-bsa-support/package.json` *(skip-on-windows, has both `build` and `dist`)*
- `extensions/gamebryo-archive-support/package.json` *(skip-on-windows)*
- `extensions/gamestore-xbox/package.json` *(skip-on-linux)*

Sentinels: `extensions/skip-on-windows.mjs` and `extensions/skip-on-linux.mjs` must exist and be referenced by the package.jsons above.

### 2. Webpack externals allowlist for `winapi-bindings`

```bash
grep -A 5 "nodeExternals" src/renderer/webpack.config.cjs
```

The allowlist must include `winapi-bindings` on Linux:

```js
allowlist: [
  /@vortex\/shared/,
  ...(process.platform === "linux" ? ["winapi-bindings"] : []),
],
```

Without this, the `resolve.alias` redirect to `winapi-shim.ts` is silently preempted by `nodeExternals`, and `winapi.GetVolumePathName is not a function` surfaces only when a user changes the mod staging folder.

### 3. LOOT call-site casing

```bash
grep -n "toLowerCase\|\\.filePath" extensions/gamebryo-plugin-management/src/autosort.ts | head -20
```

All LOOT calls (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync`) must use `path.basename(pluginList[id].filePath)` — the real on-disk filename — not `pluginName.toLowerCase()`. On ext4 without casefold, lowercased names don't match real filenames like `DLCCoast.esm`, and LOOT falls back to probing the `.ghost` variant, producing the misleading `"… does not have a valid plugin header"` error that names a `.ghost` path the file never had on disk.

### 4. Transfer-path platform guard

```bash
grep -n "UnsupportedOperatingSystem\|platform !== \"win32\"" src/renderer/src/util/transferPath.ts
```

`testPathTransfer` must not reject non-Windows. `winapi.GetVolumePathName` is shimmed on Linux; `statfsSync` is POSIX; `turbowalk` has a Linux JS fallback. If the guard is back, users can't change their mod staging folder (symptom: "Unsupported operating system" alert + staging-folder change silently fails).

### 5. Bundled plugins populated

```bash
ls src/main/build/bundledPlugins | wc -l   # expect ~132
```

If this is 0, upstream renamed the output path (`out` → `build` or vice versa) and the extension `copy-extension.mjs` step wasn't re-run against the new path. Re-run:

```bash
pnpm run build:extensions
```

### 6. Cross-compiled Linux native binaries

```bash
ls extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}
ls extensions/gamebryo-bsa-support/dist/bsatk.node
```

These four files are **cross-compile artefacts** that shouldn't be rebuilt on every run — `pnpm run build` for these extensions tries to relink native modules from source and fails on Linux because the build toolchain isn't configured for it. They predate this session by months. If any of these disappear, check the `dist/.gitignore` and `dist` git-tracking state — we may need to un-ignore them explicitly, or document where they live.

**Workaround when `_native` fails:** run `copy-extension.mjs` directly to stage the existing pre-built `dist/` into `build/bundledPlugins/`:

```bash
cd extensions/gamebryo-plugin-management && pnpm exec node ../copy-extension.mjs
cd extensions/gamebryo-bsa-support && pnpm exec node ../copy-extension.mjs
```

---

## Principles earned

These are the non-obvious things that cost real time during the 2026-05-08 merge, captured so they don't cost the same time again.

### Upstream merges reverting our fixes is **the** dominant failure mode

Not a new bug, not a fresh regression — a direct revert of a fix we already landed, sometimes two or three merges ago. The fix → upstream revert → re-fix cycle has happened at least twice for the gamebryo `||` vs `&&` guard (commits `d8b60ab35`, `10d796278`, then re-reverted by upstream `0c49a66dc`, then re-fixed by `bafb67265`).

**Practical consequences:**
- Every after-merge session should start with the checklist above, not with "what broke?".
- Fork-local fixes should be named/structured to make reverts visible in diff, not buried inside inline `node -e "..."` one-liners that read identically in either direction.
- `git log -- <file>` is your first diagnostic tool when a Linux-only thing stops working: the alternating `fix(linux): …` / `Update scripts` / `fix(linux): …` pattern is usually right there.

### "Symptom at call site" is rarely the root cause — always trace the import chain

Every significant bug this session took a path like:
- Symptom: `testPathTransfer` throws `UnsupportedOperatingSystem`.
- First "fix": remove the `if (platform !== "win32")` guard.
- New symptom: `winapi.GetVolumePathName is not a function`.
- Deeper cause: `winapi-bindings` externalised by `nodeExternals` before `resolve.alias` could redirect it to the shim.

Always follow the import chain to the bundle. `grep 'external ".*"' src/main/build/renderer.js` can be more informative than reading TypeScript sources when something "should be working".

### `winapi-bindings` on Linux is a shim, not a stub

It's tempting to assume Windows-API calls should be wholesale wrapped with `if (platform === 'win32')` guards. Don't. The shim in `src/renderer/src/util/winapi-shim.ts` implements real Linux equivalents for the disk/path functions that matter (`GetDiskFreeSpaceEx`, `GetVolumePathName`, `GetNativeArch`). When removing a win32 guard, the question is "does this function use only shimmed APIs?" — not "does this mention winapi?". Most of the guards in the tree are over-cautious.

### LOOT errors lie about ghost files

The Linux case-sensitivity bug surfaces as:

```
failed validation of input plugin paths: the file at "…/Data/dlccoast.esm.ghost" does not have a valid plugin header
```

The `.ghost` in that error is a **red herring** — LOOT probes `{name}` then `{name}.ghost` and emits the last path it tried. The real issue is case. If you ever see this error on Linux, check the casing of the strings Vortex passes to LOOT before debugging anything ghost-related.

### pluginId (lowercase) ≠ filename (preserved case)

Vortex's internal `pluginId` is intentionally lowercase for case-insensitive identity. `pluginList[id].filePath` is the real on-disk path with preserved casing. The two must not be confused when handing strings to external tools that hit the filesystem. LOOT is one such tool; there may be others.

### The renderer bundle lies about its input

`src/main/build/renderer.js` is webpack output. When debugging, confirm the **source** file you edited is the one that shaped the bundle by checking mtimes and re-running `pnpm -F @vortex/renderer run build`. The bundle caches aggressively and a "source has the fix but bundle doesn't" situation is common after git operations that touch source files (cherry-pick, stash-pop).

Diagnostic snippet:

```bash
stat -c '%y %n' src/main/build/renderer.js src/renderer/src/util/<file>.ts
```

Source newer than bundle → rebuild.

### Stray working-tree diffs will block cherry-picks

`etc/Dependency Report.md` and `packages/vortex-api/lib/api.d.ts` regenerate whenever the build runs and show up as dirty in `git status`. They're out of scope for almost every Linux fix. Stash before `git checkout` / `git cherry-pick`, pop after:

```bash
git stash push -m "stray build churn" "etc/Dependency Report.md" packages/vortex-api/lib/api.d.ts
# … cherry-pick …
git stash pop
```

Doing this reflexively before any branch switch saved ~10 minutes of retries during this session.

### Node version matters for `copy-extension.mjs`

The script uses `import.meta.dirname`, which requires Node ≥ 20. System `node` may be Node 18; `pnpm exec node` resolves to the Volta-pinned Node 22. Use `pnpm exec node ../copy-extension.mjs` when running the script directly, not bare `node ../copy-extension.mjs`.

### Restart Vortex fully after every fix

Vortex caches extensions at startup. Editing source + rebuilding the renderer + re-running `copy-extension.mjs` has no effect on a running instance. A "my fix doesn't work" report followed by "oh, did you restart?" answered "no" at least once per session. Just restart.

### Stale notifications persist across runs

The bell alerts are sticky across Vortex restarts — dismiss them manually after a fix, otherwise you're debugging a notification from two runs ago. "No deployment method available" on the page body is live; the same message in the bell might be stale. Check the log timestamp when in doubt.

---

## Historical gotchas by subsystem

Each entry is a real bug we hit once — captured so the next merge-regression of the same category is recognisable on sight. Sourced from the ~85-commit Linux-port history; every item has a commit ref for the full context.

### asar packaging

- **Native addons inside `app.asar` silently return `[]` from `readdirSync`.** `leveldown`'s `node-gyp-build` can't find prebuilds, `modmeta-db` silently exports `ModDB=undefined`, `connectMetaDB` crashes at runtime. Fix: add the whole chain (`modmeta-db`, `leveldown`, `levelup`, `encoding-down`) to `asarUnpack`. But `asarUnpack` globs only match packages that actually exist in `dist/node_modules/` — peerDeps of `modmeta-db` must be promoted to direct deps of `@vortex/main` first, otherwise `pnpm install --dir=./dist` never installs them and the globs match nothing. Commits `538aef374`, `d7281c06c`.
- **bundledPlugins extensions can't `require()` into `app.asar`.** They run from `app.asar.unpacked/bundledPlugins/` and resolution only walks up to `app.asar.unpacked/node_modules/`. If a dep is inside the asar, the extension fails to load (`Cannot find module modmeta-db` in `mo-import` / `nmm-import-tool`). Same fix as above — unpack.
- **Adding something to `asarUnpack` that's already a direct dep causes `EEXIST` hardlink errors** in electron-builder (e.g. `bluebird`, covered once by the direct-dep scan, again by `asarUnpack`). Workaround: `beforePack` hook copies `bluebird` into `dist/node_modules/modmeta-db/node_modules/bluebird/`, which rides along under the existing `modmeta-db/**` glob. Commit `90b8de750`.
- **`winapi-bindings` as a transitive native dep causes EEXIST on Linux packaging.** It's pulled in by `exe-version`, `permissions`, `turbowalk`, `wholocks`, `vortex-parse-ini`. The Linux shim replaces the JS at build time, but the `.node` binary still ships unless explicitly excluded. Fix: `electron-builder.config.cjs` with platform-conditional `files` array — `!**/winapi-bindings/**` on Linux. Commit `0ccaff0ed`.

### native addon loading (loot, esptk, bsatk)

- **Static top-level `require('esptk')` can take down the entire extension.** If `esptk.node` fails to dlopen (wrong arch, missing deps), the whole `gamebryo-plugin-management` extension fails to register and the Plugins tab disappears silently. Fix: lazy-load via `require()` inside the functions that need it, with graceful degradation. Commit `c219b460b`.
- **`LD_LIBRARY_PATH` is not inherited by `fork()` by default** — Node forks clear path-adjacent env vars. `node-loot.node` has `RUNPATH $ORIGIN/../../loot_api` which is correct in the source tree but broken in packaged deb/AppImage where `libloot.so.0` is co-located inside `bundledPlugins/gamebryo-plugin-management/`. Two complementary fixes needed: prepend `bundledPlugins/gamebryo-plugin-management` to `LD_LIBRARY_PATH` in `main.ts` at app startup (commit `3a6488b9b`), AND pass `LD_LIBRARY_PATH` explicitly in the loot subprocess `fork()` env block (commit `0875e3db2`).
- **loot's binding.gyp uses `-l../loot_api/libloot`, which `ld` can't resolve.** On Linux needs `-L../loot_api -llibloot` + RPATH. The patch lives in `patches/loot@6.2.1.patch`; a previous well-meaning rewrite of the patch to only carry IPC guards dropped the binding.gyp hunk. Commit `6cc8cbf2a`. Rule: **never rewrite a patch file wholesale — additive hunks only.**
- **loot/bsatk `prebuild-install || node-gyp rebuild` fallback is easy to break.** A "helpful" `execSync` rewrite that throws on first failure strips the `|| node-gyp rebuild` fallback, so Windows CI fails because prebuild-install has no binaries for its napi version. Always keep the `||` fallback in the shell string, let `execSync` inspect the final exit code. Commits `ffe331d98`, `e49a4a5cd`.
- **loot's index.js / async.js hard-coded `\\?\pipe\loot-ipc-*`** (Windows named-pipe path) causes `EACCES` on Linux startup. Patched in `patches/loot@6.2.1.patch`. Commit `8fd69eab9`.

### case-sensitive filesystem (ext4 without casefold)

- **Game extension `requiredFiles` casing ≠ on-disk exe casing.** `verifyToolDir` stats the declared name (e.g. `oblivion.exe`) and fails with ENOENT when disk has `Oblivion.exe`, clearing the active profile and returning the UI to the home screen. Fix: `resolvePathCase` before stat-ing. Applies to all games. Commit `e2c8ee6a8`.
- **`resolvePathCase` must resolve every segment, including the filename.** Early version only case-resolved directories, so `removeDeployedFile` with a mismatched filename case would still `unlinkAsync` an ENOENT path (silently swallowed), leaving the file deployed. Extended to match every segment against parent `readdir`. Commit `bbf7c8f39`.
- **Windows archive extraction produces case-conflicting directory trees on Linux.** `7z` extracts entries literally, so a mod archive with mixed `Data/SKSE/plugins/` and `data/SKSE/plugins/` entries creates two separate directories. Fix: `mergeCaseConflictingDirs()` run immediately after `normalizeBackslashPaths()` in both `simulate()` and `installInner()`. Commit `850a3cb40`.
- **Filenames with backslashes in archives become filenames, not paths.** Windows-packaged archives using `\` as separator land as single filenames `Data\SKSE\plugins\foo.dll` on ext4. Normalise before file list build. Commit `728c91a85`.
- **FOMOD `extractArchive` join paths case-sensitively.** `path.join(tempPath, source)` fails if the archive manifest declares `Data/` and the archive contains `data/`. Use `resolvePathCase` with a per-call `readdir` cache. Commit `cbff6b891`.
- **LOOT is the cautionary tale.** See the dedicated lesson above — `toLowerCase()` on plugin names + ext4 + LOOT's ghost probe = the misleading `dlccoast.esm.ghost` error. Commit `324da1814`.

### deployment manifests

- **Wine/Proton-era manifests have Windows-style paths.** `loadActivation` must detect them (`isWineEraManifest()`), offer a purge dialog, and normalise backslashes before the instance-mismatch check otherwise runs. Commit `6f47dbf2b`.
- **Primary manifest may be missing when backup is present.** Wine/Proton-era Vortex only wrote to the staging backup, never the game Data dir. If primary fails with ENOENT, fall through to backup2 (msgpack) and backup (JSON) before returning `emptyManifest`. Otherwise Wine-era detection in `loadActivation` never triggers. Commit `7e4034b77`.
- **Synthesise a manifest when `loadActivation` returns `[]`.** Walk each mod's staging directory with `turbowalk` and confirm hardlinks into the game directory via inode comparison. Use the synthesised manifest as `lastActivation` so `deactivate()/finalize()` can correctly diff and unlink. Commit `0748357d6`.
- **`deployMods` crashes with no mods installed.** Add `?? {}` guard on the mods access. Trivial but real crash on fresh Linux profile. Commit `7e4034b77`.

### NXM protocol & single-instance

- **`getVortexPath("package")` in dev returns `src/main/out/`, not `src/main/`.** Electron 37+ sets `app.getAppPath()` to the output directory. The second-instance lock uses this path; `src/main/out/` has no `package.json`, so the second Electron uses app name "Electron" with a different userData lock. The single-instance conflict never fires, the second-instance event never runs, and NXM downloads from the browser fail to route. Fix: `path.dirname(getVortexPath("package"))` to walk up to `src/main/`. Commit `f2f6e06d6`.
- **Disabled guard that outlived its prerequisite.** A `disabled={process.platform === 'linux'}` on the NXM Toggle remained long after `xdg-settings`/`xdg-mime` support shipped. Check guards against current capability, not historical state. Commit `809d4b80a`.

### game discovery / game stores

- **`EpicGamesLauncher` exports `undefined` on Linux** (Windows-only). Any code that puts it in a `mKnownGameStores: [Steam, EpicGamesLauncher, ...]` array crashes `manualGameStoreSelection` with "Cannot read properties of undefined (reading 'id')". Filter undefined stores. Commit `04f5c9bf5`.
- **Game extensions calling `epicGamesLauncher.findByAppId()` unconditionally crash on Linux.** Epic Games Launcher is Windows-only. Guard with `process.platform !== 'win32'` early reject so discovery fails gracefully with `ProcessCanceled`. Commit `ddaed178e` (game-untitledgoose).
- **Bundled game extensions `require('winapi-bindings')` at runtime** — bypasses the webpack compile-time alias to `winapi-shim.ts`, so `winapi.RegGetValue` is undefined. Fix: intercept `winapi-bindings` in `extensionRequire` on Linux and return the shim directly. Commit `ddaed178e` (survivingmars, modtype-gedosato).

### dist / CI config

- **VSCode inherits `ELECTRON_RUN_AS_NODE=1` to child shells.** Launching Vortex from VSCode's terminal runs the Electron binary as plain Node, `require('electron')` returns a string path instead of the API, crashes immediately. Fix: `ELECTRON_RUN_AS_NODE=` in `start` script. Also guard `electron-context-menu` (loads at module import time, also calls `require('electron')`). Commit `e69ee23b5`.
- **`electron-builder` `neverBuiltDependencies` isn't enough to stop transitive native builds.** `winapi-bindings` still gets compiled as a transitive. Also add to `pnpm-workspace.yaml`'s `neverBuiltDependencies` in `dist/`, AND use `electron-builder.config.cjs` with a `!**/winapi-bindings/**` files exclusion. Belt and braces. Commits `c0c4bf2a8`, `0ccaff0ed`.
- **`prepare-dist-package` catalog regex stops at blank lines.** `pnpm-workspace.yaml` has a blank line mid-catalog; a naive `((?:[ \t]+\S.*\n?)*)` excludes everything after it from `dist/pnpm-workspace.yaml`, causing `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` for deps listed after the blank line. Fix: allow indented-with-content or pure-whitespace lines, stop only on next top-level key. Commit `f66a99962`.

### platform-guard operator direction

Platform guards in `package.json` scripts come in TWO forms — and they use OPPOSITE shell operators. Don't assume one pattern fits all:

| Guard intent | Predicate | Correct operator |
|--------------|-----------|------------------|
| Skip on Windows, build elsewhere | `exit(1)` if `win32` | `&&` (Windows exits 1, `&&` short-circuits; Linux exits 0, continues) |
| Skip on Linux, build elsewhere | `exit(0)` if `linux` | `\|\|` (Linux exits 0, `\|\|` short-circuits; Windows exits 1, continues) |

Both forms now have named-script equivalents: `skip-on-windows.mjs` (`&&`, `exit(1)` on Windows) and `skip-on-linux.mjs` (`||`, `exit(0)` on Linux). The asymmetric operator follows the exit code which follows the skipped platform — the filename is the source of truth. Checklist now uses `grep "node -e.*process.platform"` (platform-agnostic) to catch inline guards of either direction. Commits `77fdabb67` (flip to `||` for savegame), `e8f05bedb`, `d8b60ab35`.

---

## Commit index

Durable references to the fork-local Linux fixes this file depends on. If any of these commits are missing from either branch after a merge, something reverted them.

| Fix | master | linux-port |
|-----|--------|-----------|
| Named `skip-on-windows.mjs` guard for gamebryo scripts | `bafb67265` | `52ea4ae3a` |
| Remove win32 guard from `testPathTransfer` | `7cfe61602` | `8e8b13284` |
| Allowlist `winapi-bindings` from `nodeExternals` | `e69401abf` | `0cccf116b` |
| Pass real plugin filenames to LOOT + filter ghosts | `324da1814` | `72641450c` |
| Named `skip-on-linux.mjs` sibling guard (gamestore-xbox) | `5acb3d098` | `a41403030` |

Earlier-era fixes that were reverted by upstream merges (kept for archaeology):
- `d8b60ab35` — first `||` → `&&` flip on gamebryo guards
- `10d796278` — second `||` → `&&` flip after first revert
- `eb512442c` — restored Linux `libloot.so.0` + `wstring_stub.so` copy step in `_native`
