# Vortex Linux — Upstream Merge Playbook

Companion to [VORTEX-LINUX.md](VORTEX-LINUX.md). VORTEX-LINUX.md is the forward plan; this file is the post-merge checklist for keeping the fork working.

Everything in here is something we actually hit — not speculation. If it's in this file, it's bitten us at least once.

---

## Why this file exists

Upstream `nexus-mods/Vortex` ships frequent changes to build scripts, webpack config, and extension scaffolding. A lot of them target Windows-only stuff (CI guards, native addon links, asar layout) and accidentally undo our Linux work. The reverts are usually **silent** — the build still succeeds on CI, tests still pass, and Linux only breaks at runtime (often several steps deep, e.g. "staging folder won't change" caused by "webpack alias preempted by `nodeExternals`" caused by "upstream re-ordered `externals` in the config").

Below: the checklist we run after every upstream merge and the things we've learned the hard way.

---

## Post-merge checklist

Run these **before** finalising any merge commit.

### 1. Platform guards on extension build scripts

```bash
grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json
```

If anything matches, upstream put an inline guard back. Replace each hit with the appropriate named-script form based on which platform should skip:

```json
"build": "node ../skip-on-windows.mjs && (pnpm run _build && node ../copy-extension.mjs)"
"build": "node ../skip-on-linux.mjs || (pnpm run _build && node ../copy-extension.mjs)"
```

Note the operator asymmetry — see "platform-guard operator direction" in Past gotchas for why. Quick rule: skip-on-windows uses `&&`, skip-on-linux uses `||`. Filename names the skipped platform.

Extensions with guards we know about:

- `extensions/gamebryo-plugin-management/package.json` _(skip-on-linux — needs `loot`/`esptk` native builds that don't exist in CI)_
- `extensions/gamebryo-bsa-support/package.json` _(skip-on-linux — needs `bsatk.node` native build that doesn't exist in CI; has both `build` and `dist`)_
- `extensions/gamebryo-archive-support/package.json` _(skip-on-linux — matches sibling behaviour and the upstream intent)_
- `extensions/gamestore-xbox/package.json` _(skip-on-linux — Windows-only registry/Game Pass integration)_

Sentinels: `extensions/skip-on-windows.mjs` and `extensions/skip-on-linux.mjs` must exist and be referenced by the package.jsons above.

**Heads-up on gamebryo guard direction:** three of the gamebryo extensions (`plugin-management`, `bsa-support`, `archive-support`) skip on Linux — they need native binaries (`node-loot.node`, `esptk.node`, `bsatk.node`) that neither pnpm install nor the current workflow produces in CI. The tree has pre-built artefacts in each extension's `dist/` on the dev machine, but those are `.gitignore`d and don't reach CI. Flipping these to skip-on-windows (so they build on Linux) crashes CI with `Missing native files` — don't "fix" this without also wiring a rebuild step for bsatk/esptk in `.github/workflows/main.yml`.

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

Without this, `nodeExternals` silently beats the `resolve.alias` redirect to `winapi-shim.ts`, and `winapi.GetVolumePathName is not a function` only pops up when a user changes the mod staging folder.

### 3. LOOT call-site casing

```bash
grep -n "toLowerCase\|\\.filePath" extensions/gamebryo-plugin-management/src/autosort.ts | head -20
```

All LOOT calls (`loadPluginsAsync`, `getPluginMetadataAsync`, `getPluginAsync`, `sortPluginsAsync`) must use `path.basename(pluginList[id].filePath)` — the real on-disk filename — not `pluginName.toLowerCase()`. On ext4 without casefold, lowercased names don't match real filenames like `DLCCoast.esm`, so LOOT falls back to probing the `.ghost` variant and spits out the confusing `"… does not have a valid plugin header"` error naming a `.ghost` path the file never had on disk.

### 4. Transfer-path platform guard

```bash
grep -n "UnsupportedOperatingSystem\|platform !== \"win32\"" src/renderer/src/util/transferPath.ts
```

`testPathTransfer` must not reject non-Windows. `winapi.GetVolumePathName` is shimmed on Linux; `statfsSync` is POSIX; `turbowalk` has a Linux JS fallback. If the guard is back, users can't change their mod staging folder (symptom: "Unsupported operating system" alert plus staging-folder change silently failing).

### 5. Bundled plugins populated

```bash
ls src/main/build/bundledPlugins | wc -l   # expect ~132
```

If this is 0, upstream renamed the output path (`out` → `build` or the other way) and the extension `copy-extension.mjs` step wasn't re-run against the new path. Re-run:

```bash
pnpm run build:extensions
```

### 6. Staging-integrity guard in `doDownload`

```bash
grep -n "stagingDirHasFiles" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Should return two hits: the import at the top and the call inside the `.then(async (downloadId) => { ... })` block in `doDownload`. Without these, a broken install that leaves an empty staging dir persists across every subsequent install attempt because `dep.mod != null` short-circuits re-extraction forever, and the "Redundant mods" dialog keeps flagging affected mods after every deploy. Sibling sentinel `src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts` must exist. See "stale empty staging dir" in the case-sensitive filesystem section below for the full story.

### 7. Three-fix backslash/case cluster after extraction

Three call sites that must travel as a unit. Reverting ANY ONE of them surfaces as cryptic ENOENTs listing either literal backslashed paths OR forward-slash paths whose casing differs from disk. Upstream PR #22607 (merge `5f44c9fdb`) has reverted all three at once; `grep` for each and re-apply any that are missing.

**(a) On-disk rename of backslashed entries:**

```bash
grep -n "normalizeBackslashPaths" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect three hits: import + two call sites (before each `buildFileList(tempPath)`). Sibling sentinel `src/renderer/src/extensions/mod_management/util/normalizeBackslashPaths.ts` must exist.

**(b) Merge case-duplicate sibling directories:**

```bash
grep -n "mergeCaseConflictingDirs" src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect three hits: import + two call sites (immediately after each `normalizeBackslashPaths(tempPath)`). Sibling sentinel `src/renderer/src/extensions/mod_management/util/mergeCaseConflictingDirs.ts` must exist.

**(c) Copy-instruction normalisation:**

```bash
grep -n 'replaceAll("\\\\\\\\", "/")' src/renderer/src/extensions/mod_management/InstallManager.ts
```

Expect two hits in the `extractArchive` copy loop (one for `source`, one for `destination`).

See the case-sensitive filesystem section for the paired-invariant lesson — the three fixes address different layers (disk names, disk tree, instruction strings) of the same root cause.

### 8. Cross-compiled Linux native binaries

```bash
ls extensions/gamebryo-plugin-management/dist/{node-loot.node,libloot.so.0,libloot_wstring_stub.so}
ls extensions/gamebryo-bsa-support/dist/bsatk.node
```

These four files are **cross-compile artefacts** that shouldn't get rebuilt every run — `pnpm run build` for these extensions tries to relink native modules from source and fails on Linux because the build toolchain isn't set up for it. They've been around for months. If any of them disappear, check `dist/.gitignore` and the `dist` git-tracking state — we might need to un-ignore them explicitly, or document where they live.

**Workaround when `_native` fails:** run `copy-extension.mjs` directly to stage the pre-built `dist/` into `build/bundledPlugins/`:

```bash
cd extensions/gamebryo-plugin-management && pnpm exec node ../copy-extension.mjs
cd extensions/gamebryo-bsa-support && pnpm exec node ../copy-extension.mjs
```

---

## What we've learned the hard way

These are the non-obvious things that cost real time during the 2026-05-08 merge, written down so they don't cost the same time twice.

### Upstream merges reverting our fixes is **the** biggest source of pain

Not a new bug, not a fresh regression — a straight revert of a fix we already landed, sometimes two or three merges ago. The fix → upstream revert → re-fix cycle has happened at least twice for the gamebryo `||` vs `&&` guard (commits `d8b60ab35`, `10d796278`, then re-reverted by upstream `0c49a66dc`, then re-fixed by `bafb67265` — which was itself wrong; see next lesson).

**What this means in practice:**

- Every after-merge session should start with the checklist above, not with "what broke?".
- Fork-local fixes should be named and structured to make reverts obvious in a diff, not buried inside inline `node -e "..."` one-liners that read identically either way.
- `git log -- <file>` is your first tool when a Linux-only thing stops working: the alternating `fix(linux): …` / `Update scripts` / `fix(linux): …` pattern is usually right there.

### Before flipping a platform-guard direction, check that CI passed in that direction

Painful one. Commit `bafb67265` switched the three gamebryo extensions from skip-on-Linux (`||`) to skip-on-Windows (`&&`), believing upstream had accidentally inverted the guard. Upstream had not — these extensions genuinely skip on Linux because they need `bsatk.node` / `esptk.node` / `node-loot.node` native builds that CI doesn't produce. Flipping the direction "fixed" the guard intent on paper but turned CI red on the `_native` step (`Missing native files: ./node_modules/bsatk/build/Release/bsatk.node`). Reverted in a follow-up fix.

**Rule:** before naming a guard flip "fix(linux)", confirm the last green Main CI had the other direction. `gh run list --workflow=main.yml` → find the most recent success → `git show <that-commit>:extensions/<ext>/package.json`. If upstream has been running the guard one way for months without Linux CI failures, the direction is probably intentional and the broken Linux symptom is downstream (missing native binaries, missing copy step, something else). The guard is a signal, not the disease.

### "Symptom at call site" is rarely the actual cause — always trace the import chain

Every real bug this session went something like:

- Symptom: `testPathTransfer` throws `UnsupportedOperatingSystem`.
- First "fix": remove the `if (platform !== "win32")` guard.
- New symptom: `winapi.GetVolumePathName is not a function`.
- Deeper cause: `winapi-bindings` externalised by `nodeExternals` before `resolve.alias` could redirect it to the shim.

Always follow the import chain to the bundle. `grep 'external ".*"' src/main/build/renderer.js` can tell you more than reading TypeScript sources when something "should be working".

### `winapi-bindings` on Linux is a shim, not a stub

Tempting to wrap every Windows-API call with `if (platform === 'win32')` guards. Don't. The shim in `src/renderer/src/util/winapi-shim.ts` has real Linux equivalents for the disk/path functions that matter (`GetDiskFreeSpaceEx`, `GetVolumePathName`, `GetNativeArch`). When removing a win32 guard, the question is "does this function only use shimmed APIs?" — not "does this mention winapi?". Most of the guards in the tree are more paranoid than they need to be.

### LOOT errors lie about ghost files

The Linux case-sensitivity bug surfaces as:

```
failed validation of input plugin paths: the file at "…/Data/dlccoast.esm.ghost" does not have a valid plugin header
```

The `.ghost` in that error is a **red herring** — LOOT probes `{name}` then `{name}.ghost` and spits out the last path it tried. The real issue is case. If you ever see this error on Linux, check the casing of the strings Vortex is handing LOOT before chasing anything ghost-related.

### pluginId (lowercase) ≠ filename (preserved case)

Vortex's internal `pluginId` is deliberately lowercased for case-insensitive identity. `pluginList[id].filePath` is the real on-disk path with preserved casing. Don't mix them up when handing strings to external tools that hit the filesystem. LOOT is one such tool; there are probably others.

### The renderer bundle lies about its input

`src/main/build/renderer.js` is webpack output. When debugging, confirm the **source** file you edited is actually the one that shaped the bundle by checking mtimes and re-running `pnpm -F @vortex/renderer run build`. The bundle caches aggressively and "source has the fix but bundle doesn't" is a common situation after git operations that touch source files (cherry-pick, stash-pop).

Quick check:

```bash
stat -c '%y %n' src/main/build/renderer.js src/renderer/src/util/<file>.ts
```

Source newer than bundle → rebuild.

### "Silent catch swallows error" + "state caches success" = stuck-forever state

Two-part hazard that's bitten us once and will again. The 2026-05-09 collection-install bug had both ingredients:

- **Silent swallow:** `extractArchive`'s `copyAsyncWrap` caught every `fs.copyAsync` error and threw away everything except two specific error strings. The outer flow resolved successfully even when zero files landed on disk.
- **Cached success:** The mod got recorded in Vortex state with `installationPath` set (i.e. "installed"), so `doDownload` short-circuited every future re-install at `dep.mod != null`. The broken state was self-perpetuating — every remedy the user tried (re-run collection, install mod directly, deploy again) hit the short-circuit and bypassed the code that would have healed it.

When writing any code that handles an irreversible side effect (extract, install, deploy, download), audit for both properties together: **can any error be silently swallowed?** AND **does a downstream system cache "done" based on state that could have been corrupted?** A "yes" on both is the shape of a bug class, not a specific bug. Add a loud-fail on the swallow path AND a integrity check before the downstream cache is trusted. One without the other only closes half the door.

### Stray working-tree diffs will block cherry-picks

`etc/Dependency Report.md` and `packages/vortex-api/lib/api.d.ts` regenerate whenever the build runs and show up dirty in `git status`. They're out of scope for basically every Linux fix. Stash before `git checkout` / `git cherry-pick`, pop after:

```bash
git stash push -m "stray build churn" "etc/Dependency Report.md" packages/vortex-api/lib/api.d.ts
# … cherry-pick …
git stash pop
```

Doing this by reflex before any branch switch saved ~10 minutes of retries this session.

### Node version matters for `copy-extension.mjs`

The script uses `import.meta.dirname`, which needs Node ≥ 20. System `node` might be Node 18; `pnpm exec node` resolves to the Volta-pinned Node 22. Use `pnpm exec node ../copy-extension.mjs` when running it directly, not bare `node ../copy-extension.mjs`.

### Restart Vortex fully after every fix

Vortex caches extensions at startup. Editing source + rebuilding the renderer + re-running `copy-extension.mjs` has zero effect on a running instance. "My fix doesn't work" followed by "oh, did you restart?" getting a "no" happens at least once per session. Just restart.

### Stale notifications persist across runs

The bell alerts hang around across Vortex restarts — dismiss them manually after a fix, otherwise you're debugging a notification from two runs ago. "No deployment method available" on the page body is live; the same message in the bell might be stale. Check the log timestamp when in doubt.

---

## Past gotchas by subsystem

Each entry is a real bug we hit at least once — written down so the next merge that breaks the same thing is recognisable on sight. Sourced from the ~85-commit Linux-port history; every item has a commit ref for the full story.

### asar packaging

- **Native addons inside `app.asar` silently return `[]` from `readdirSync`.** `leveldown`'s `node-gyp-build` can't find prebuilds, `modmeta-db` silently exports `ModDB=undefined`, `connectMetaDB` crashes at runtime. Fix: add the whole chain (`modmeta-db`, `leveldown`, `levelup`, `encoding-down`) to `asarUnpack`. But `asarUnpack` globs only match packages that actually exist in `dist/node_modules/` — peerDeps of `modmeta-db` have to be promoted to direct deps of `@vortex/main` first, otherwise `pnpm install --dir=./dist` never installs them and the globs match nothing. Commits `538aef374`, `d7281c06c`.
- **bundledPlugins extensions can't `require()` into `app.asar`.** They run from `app.asar.unpacked/bundledPlugins/` and resolution only walks up to `app.asar.unpacked/node_modules/`. If a dep is inside the asar, the extension fails to load (`Cannot find module modmeta-db` in `mo-import` / `nmm-import-tool`). Same fix as above — unpack.
- **Adding something to `asarUnpack` that's already a direct dep causes `EEXIST` hardlink errors** in electron-builder (e.g. `bluebird`, picked up once by the direct-dep scan, again by `asarUnpack`). Workaround: `beforePack` hook copies `bluebird` into `dist/node_modules/modmeta-db/node_modules/bluebird/`, which rides along under the existing `modmeta-db/**` glob. Commit `90b8de750`.
- **`winapi-bindings` as a transitive native dep causes EEXIST on Linux packaging.** Pulled in by `exe-version`, `permissions`, `turbowalk`, `wholocks`, `vortex-parse-ini`. The Linux shim replaces the JS at build time, but the `.node` binary still ships unless we explicitly exclude it. Fix: `electron-builder.config.cjs` with a platform-conditional `files` array — `!**/winapi-bindings/**` on Linux. Commit `0ccaff0ed`.

### native addon loading (loot, esptk, bsatk)

- **Static top-level `require('esptk')` can take down the whole extension.** If `esptk.node` fails to dlopen (wrong arch, missing deps), the whole `gamebryo-plugin-management` extension fails to register and the Plugins tab silently disappears. Fix: lazy-load via `require()` inside the functions that actually need it, with graceful degradation. Commit `c219b460b`.
- **`LD_LIBRARY_PATH` is not inherited by `fork()` by default** — Node forks clear path-adjacent env vars. `node-loot.node` has `RUNPATH $ORIGIN/../../loot_api` which is correct in the source tree but broken in the packaged deb/AppImage where `libloot.so.0` sits inside `bundledPlugins/gamebryo-plugin-management/`. Need both fixes: prepend `bundledPlugins/gamebryo-plugin-management` to `LD_LIBRARY_PATH` in `main.ts` at app startup (commit `3a6488b9b`), AND pass `LD_LIBRARY_PATH` explicitly in the loot subprocess `fork()` env block (commit `0875e3db2`).
- **loot's binding.gyp uses `-l../loot_api/libloot`, which `ld` can't resolve.** On Linux needs `-L../loot_api -llibloot` + RPATH. The patch lives in `patches/loot@6.2.1.patch`; a well-meaning rewrite of the patch to only carry IPC guards once dropped the binding.gyp hunk. Commit `6cc8cbf2a`. Rule: **never rewrite a patch file wholesale — additive hunks only.**
- **loot/bsatk `prebuild-install || node-gyp rebuild` fallback is easy to break.** A "helpful" `execSync` rewrite that throws on first failure strips the `|| node-gyp rebuild` fallback, so Windows CI fails because prebuild-install has no binaries for its napi version. Always keep the `||` fallback in the shell string and let `execSync` inspect the final exit code. Commits `ffe331d98`, `e49a4a5cd`.
- **loot's index.js / async.js hard-coded `\\?\pipe\loot-ipc-*`** (Windows named-pipe path) causes `EACCES` on Linux startup. Patched in `patches/loot@6.2.1.patch`. Commit `8fd69eab9`.

### case-sensitive filesystem (ext4 without casefold)

- **Game extension `requiredFiles` casing ≠ on-disk exe casing.** `verifyToolDir` stats the declared name (e.g. `oblivion.exe`) and fails with ENOENT when the disk has `Oblivion.exe`, which clears the active profile and dumps the UI back to the home screen. Fix: `resolvePathCase` before stat-ing. Applies to all games. Commit `e2c8ee6a8`.
- **`resolvePathCase` has to resolve every segment, including the filename.** The early version only case-resolved directories, so `removeDeployedFile` with a mismatched filename case would still `unlinkAsync` an ENOENT path (silently swallowed), leaving the file deployed. Extended to match every segment against parent `readdir`. Commit `bbf7c8f39`.
- **Windows archive extraction produces case-conflicting directory trees on Linux.** `7z` extracts entries literally, so a mod archive with mixed `Data/SKSE/plugins/` and `data/SKSE/plugins/` entries creates two separate directories. Fix: run `mergeCaseConflictingDirs()` right after `normalizeBackslashPaths()` in both extraction flows. Original commit `850a3cb40`; **reverted by upstream PR #22607 (merge `5f44c9fdb`)** as part of the same batch that took out `normalizeBackslashPaths` and `ca8e99941`. Re-applied as its own helper at `src/renderer/src/extensions/mod_management/util/mergeCaseConflictingDirs.ts`. This fix is part of the **three-fix backslash/case cluster** — all three must travel together or installs fail with cryptic ENOENTs (the current error will list either literal backslashed paths OR forward-slash paths whose casing differs from disk, depending on which of the three is missing). See commit index.
- **Filenames with backslashes in archives become filenames, not paths.** Windows-packaged archives using `\` as separator land as single filenames `Data\SKSE\plugins\foo.dll` on ext4. Normalise before building the file list. Original commit `728c91a85`; **reverted by upstream PR #22607 (merge `5f44c9fdb`)** and re-applied as its own helper at `src/renderer/src/extensions/mod_management/util/normalizeBackslashPaths.ts` (easier to spot in a diff next time). Two call sites before each `buildFileList(tempPath)` in `InstallManager.ts`. Re-apply commit: see commit index below.
- **The on-disk rename isn't enough — copy instructions still carry `\`.** `normalizeBackslashPaths` fixes the filesystem, but FOMOD XML or archive listings can still hand the installer `copy` instructions with Windows-style `\` in `source` / `destination` fields. Those get `path.join`'d verbatim in `extractArchive`, miss the normalised on-disk tree, and surface as the "Invalid installer" dialog listing literal backslashed paths. Fix: `replaceAll("\\", "/")` on both `source` and `destination` at the top of the copy loop; the `endsWith` directory check then only needs to test `/`. Original commit `ca8e99941`; **reverted by the same upstream merge as `normalizeBackslashPaths`**. Re-apply commit: see commit index below. Lesson: backslash normalisation is a paired invariant — disk layout AND instruction strings. Reverting one and leaving the other produces cryptic failures downstream.
- **FOMOD `extractArchive` joins paths case-sensitively.** `path.join(tempPath, source)` fails if the archive manifest says `Data/` but the archive contains `data/`. Use `resolvePathCase` with a per-call `readdir` cache. Commit `cbff6b891`.
- **`externalChanges` didn't case-resolve manifest paths.** Deploy manifests record the staging folder's casing (`SKSE/Plugins/...`) but files land on disk with whatever casing the game `Data/` tree already had (`skse/plugins/...`). `deployFile` already used `resolvePathCase` to find the target directory when creating hardlinks; `externalChanges` didn't, so `lstat` hit ENOENT on every manifest entry, flagged everything `destDeleted`, and popped the "External Changes" dialog on every deploy. Downstream symptom: the redundancy check saw zero deployed files from the affected mods and fired "Some mods are redundant" for every SKSE-plugin mod. Fix: `resolvePathCase` in `externalChanges` before `statLink`, with a per-call readdir cache (same pattern as FOMOD `extractArchive`). Commit `140a57217`.
- **Stale empty staging dirs persist across install attempts.** A partially-broken extract (e.g. the FOMOD execute-bit bug fixed in `053a30424`, or any silent `copyAsync` failure in `extractArchive`) leaves the mod's staging folder with parent directories only — no files — while Vortex state still records the mod as installed. `doDownload` then short-circuits re-install for every subsequent attempt because `dep.mod != null`, so the broken state perpetuates forever and the "Redundant mods" dialog keeps flagging affected mods at every deploy. The first-order cause (silent copy swallowing) was sibling to the case-mismatch bug above but orthogonal — fixing `externalChanges` didn't heal mods that already had zero files in staging. Two-part fix: (a) `extractArchive` throws `ArchiveBrokenError` when every intended copy/link failed (partial failures still resolve via existing notification path); (b) `doDownload` runs `stagingDirHasFiles` before the `dep.mod != null` short-circuit and clears `dep.mod` when the dir is empty, forcing the normal `queueInstallation` path to re-extract. Helper lives at `src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts`. Commit `7e2c40e94` (master) / `be30e0c05` (linux-port).
- **LOOT is the cautionary tale.** See the lesson above — `toLowerCase()` on plugin names + ext4 + LOOT's ghost probe = the misleading `dlccoast.esm.ghost` error. Commit `324da1814`.

### deployment manifests

- **Wine/Proton-era manifests have Windows-style paths.** `loadActivation` has to detect them (`isWineEraManifest()`), offer a purge dialog, and normalise backslashes before the instance-mismatch check otherwise runs. Commit `6f47dbf2b`.
- **Primary manifest can be missing when the backup's there.** Wine/Proton-era Vortex only wrote to the staging backup, never the game Data dir. If primary fails with ENOENT, fall through to backup2 (msgpack) and backup (JSON) before returning `emptyManifest`. Otherwise Wine-era detection in `loadActivation` never fires. Commit `7e4034b77`.
- **Synthesise a manifest when `loadActivation` returns `[]`.** Walk each mod's staging directory with `turbowalk` and confirm hardlinks into the game directory via inode comparison. Use the synthesised manifest as `lastActivation` so `deactivate()/finalize()` can diff and unlink properly. Commit `0748357d6`.
- **`deployMods` crashes with no mods installed.** Add a `?? {}` guard on the mods access. Trivial but real crash on a fresh Linux profile. Commit `7e4034b77`.

### NXM protocol & single-instance

- **`getVortexPath("package")` in dev returns `src/main/out/`, not `src/main/`.** Electron 37+ sets `app.getAppPath()` to the output directory. The second-instance lock uses this path; `src/main/out/` has no `package.json`, so the second Electron uses app name "Electron" with a different userData lock. The single-instance conflict never fires, the second-instance event never runs, and NXM downloads from the browser don't route. Fix: `path.dirname(getVortexPath("package"))` to walk up to `src/main/`. Commit `f2f6e06d6`.
- **Disabled guard that outlived its reason.** A `disabled={process.platform === 'linux'}` on the NXM Toggle hung around long after `xdg-settings`/`xdg-mime` support shipped. Check guards against what the code can actually do now, not what it used to. Commit `809d4b80a`.

### game discovery / game stores

- **`EpicGamesLauncher` exports `undefined` on Linux** (Windows-only). Any code that drops it into a `mKnownGameStores: [Steam, EpicGamesLauncher, ...]` array crashes `manualGameStoreSelection` with "Cannot read properties of undefined (reading 'id')". Filter undefined stores. Commit `04f5c9bf5`.
- **Game extensions calling `epicGamesLauncher.findByAppId()` unconditionally crash on Linux.** Epic Games Launcher is Windows-only. Guard with `process.platform !== 'win32'` early reject so discovery bails out cleanly with `ProcessCanceled`. Commit `ddaed178e` (game-untitledgoose).
- **Bundled game extensions `require('winapi-bindings')` at runtime** — bypasses the webpack compile-time alias to `winapi-shim.ts`, so `winapi.RegGetValue` ends up undefined. Fix: intercept `winapi-bindings` in `extensionRequire` on Linux and hand back the shim directly. Commit `ddaed178e` (survivingmars, modtype-gedosato).

### dist / CI config

- **VSCode passes `ELECTRON_RUN_AS_NODE=1` down to child shells.** Launching Vortex from VSCode's terminal runs the Electron binary as plain Node, `require('electron')` returns a string path instead of the API, and it crashes straight away. Fix: `ELECTRON_RUN_AS_NODE=` in the `start` script. Also guard `electron-context-menu` (loads at module import time, also calls `require('electron')`). Commit `e69ee23b5`.
- **`electron-builder` `neverBuiltDependencies` isn't enough to stop transitive native builds.** `winapi-bindings` still gets compiled as a transitive. Also add it to `pnpm-workspace.yaml`'s `neverBuiltDependencies` in `dist/`, AND use `electron-builder.config.cjs` with a `!**/winapi-bindings/**` files exclusion. Belt and braces. Commits `c0c4bf2a8`, `0ccaff0ed`.
- **`prepare-dist-package` catalog regex stops at blank lines.** `pnpm-workspace.yaml` has a blank line mid-catalog; a naive `((?:[ \t]+\S.*\n?)*)` drops everything after it from `dist/pnpm-workspace.yaml`, causing `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` for deps listed after the blank line. Fix: allow indented-with-content or pure-whitespace lines, only stop on the next top-level key. Commit `f66a99962`.
- **Upstream `.github/workflows/fingerprint-*.yml` use `runs-on: [self-hosted]` targeting a Nexus-Mods-internal runner.** Forks have no such runner, so every tag push queues a `Fingerprints - Mark as released` job that sits pending until GitHub's 72-hour timeout kills it. Same story for `Fingerprints - Mark as fixed` on every merged PR and `Fingerprints - Manually resolve` on `workflow_dispatch`. Harmless (no effect on Release Linux or user-visible builds), but noisy in the Actions tab. Attempted fix #1: gate each `sync` job with `if: github.repository == 'Nexus-Mods/Vortex'` (commit `7fd37ff71`). Didn't work — GitHub queues the workflow waiting for a runner at `runs-on: [self-hosted]` BEFORE evaluating the job-level `if`. Attempted fix #2: conditional `runs-on: ${{ github.repository == 'Nexus-Mods/Vortex' && 'self-hosted' || 'ubuntu-latest' }}`. Also didn't work — runs still sat pending, suggesting GitHub's expression evaluation for `runs-on` doesn't fall back to `ubuntu-latest` the way you'd expect, or some other quirk. **What actually works: disable the three workflows via the GitHub API.** Run `gh api --method PUT "repos/<owner>/Vortex/actions/workflows/<id>/disable"` for each of the three workflow IDs (retrievable via `gh api "repos/<owner>/Vortex/actions/workflows"`). This is a per-fork setting persisted in GitHub's workflow state, not in the workflow YAML, so it survives upstream merges cleanly — but it also won't travel with the repo on a re-clone or to a new fork, so document it here as a step to re-run. Upstream workflow files stay untouched (no risk of breaking upstream CI). Re-enable via `gh api --method PUT "...actions/workflows/<id>/enable"` if needed. Workflow IDs for `atabisz/Vortex` as of 2026-05-09: `269710415` (fixed), `269710416` (released), `269710417` (resolve) — but these are fork-specific, always re-query.
- **pnpm 10's bundled `gyp_main.py` occasionally lands without an execute bit on GH runners.** Symptom: `font-scanner install: /bin/sh: 1: .../pnpm@10.x/.../node-gyp/gyp/gyp_main.py: Permission denied` during `pnpm install`, Makefile regeneration exits 126, kills the whole install step. Flaky — same workflow, same source, one runner hits it and the next doesn't. Fix: a `Fix pnpm-bundled node-gyp script permissions` step between the pnpm/Node setup and `pnpm install` that runs an idempotent `chmod +x` on the found path. Present in both `.github/workflows/main.yml` and `.github/workflows/release-linux.yml`. If an upstream workflow rewrite drops it, flaky installs come back immediately. Commit `f0a0d2178`.
- **`src/main/package.json` packaging scripts and `electron-builder.config.cjs` must both point at the same app directory as `prepare-dist-package.mjs`.** When upstream renamed the packaged app directory from `dist` → `build`, the `package` / `package:nosign` scripts (`pnpm install --dir=./build`) and the config file (`directories.app: './build'`, plus both `path.join(__dirname, 'build', …)` references in the `beforePack` hook) all had to move together. A merge that updates only some of them fails CI with `ENOENT: no such file or directory, lstat '/.../src/main/dist'`. Commit `4d1ea811b`.

### platform-guard operator direction

Platform guards in `package.json` scripts come in TWO forms — and they use OPPOSITE shell operators. Don't assume one pattern fits both:

| Guard intent                     | Predicate            | Correct operator                                                          |
| -------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Skip on Windows, build elsewhere | `exit(1)` if `win32` | `&&` (Windows exits 1, `&&` short-circuits; Linux exits 0, continues)     |
| Skip on Linux, build elsewhere   | `exit(0)` if `linux` | `\|\|` (Linux exits 0, `\|\|` short-circuits; Windows exits 1, continues) |

Both forms now have named-script equivalents: `skip-on-windows.mjs` (`&&`, `exit(1)` on Windows) and `skip-on-linux.mjs` (`||`, `exit(0)` on Linux). The operator follows the exit code which follows the skipped platform — the filename is the source of truth. The checklist now uses `grep "node -e.*process.platform"` (platform-agnostic) to catch inline guards in either direction. Commits `77fdabb67` (flip to `||` for savegame), `e8f05bedb`, `d8b60ab35`.

---

## Commit index

Durable references to the fork-local Linux fixes this file depends on. If any of these commits are missing from either branch after a merge, something got reverted.

| Fix                                                                                | master      | linux-port    |
| ---------------------------------------------------------------------------------- | ----------- | ------------- |
| Three gamebryo extensions use `skip-on-linux.mjs` (matches upstream `\|\|` intent) | `c408173b9` | _pending_     |
| Remove win32 guard from `testPathTransfer`                                         | `7cfe61602` | `8e8b13284`   |
| Allowlist `winapi-bindings` from `nodeExternals`                                   | `e69401abf` | `0cccf116b`   |
| Pass real plugin filenames to LOOT + filter ghosts                                 | `324da1814` | `72641450c`   |
| `resolvePathCase` in `externalChanges` (stops spurious "mods are redundant")       | `140a57217` | _pending_     |
| Heal stale empty staging dirs across install attempts                              | `7e2c40e94` | `be30e0c05`   |
| Named `skip-on-linux.mjs` sibling guard (gamestore-xbox)                           | `5acb3d098` | `a41403030`   |
| `src/main` packaging points at `build/` (not `dist/`) after upstream rename        | `4d1ea811b` | _master-only_ |
| `chmod +x` pnpm-bundled `gyp_main.py` before `pnpm install` in CI                  | `f0a0d2178` | _master-only_ |
| Gate `fingerprint-*.yml` workflows to `Nexus-Mods/Vortex` repo only                | `7fd37ff71` | _master-only_ |

Earlier-era fixes that were reverted by upstream merges (kept for archaeology):

- `d8b60ab35` — first `||` → `&&` flip on gamebryo guards (wrong direction, see lesson above)
- `10d796278` — second `||` → `&&` flip after first revert (also wrong direction)
- `bafb67265` — third `||` → `&&` flip wrapped in `skip-on-windows.mjs` (still wrong; reverted by the fix above)
- `eb512442c` — restored Linux `libloot.so.0` + `wstring_stub.so` copy step in `_native`
