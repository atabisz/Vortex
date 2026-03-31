# Architecture Patterns — Vortex Linux v2

**Domain:** Electron mod manager Linux porting (Steam/Proton detection, packaging, NXM protocol)
**Researched:** 2026-03-31
**Milestone:** v2.0 — Usable on Linux (STAM, DIST, PROT requirements)

---

## Executive Summary

All three feature areas (STAM, DIST, PROT) integrate with the existing architecture through
**additive, platform-guarded changes**. The codebase already contains a significant amount of
the required infrastructure — `Steam.ts`, `linux/steamPaths.ts`, `linux/proton.ts`, and the
full `protocolRegistration/linux/` module are all committed and operational. What remains for
v2.0 is: wiring Flatpak multi-library paths, resolving `{mygames}` inside Wine prefixes,
expanding `electron-builder.config.json` targets, adding a Linux GitHub Actions packaging
workflow, and validating the NXM handler on SteamOS/KDE Plasma. No existing Windows code
paths change.

---

## Feature Area: STAM — Steam/Proton Game Detection

### Current State (already implemented)

| File | What exists |
|------|-------------|
| `src/renderer/src/util/Steam.ts` | `Steam` class with full VDF parsing, `libraryfolders.vdf` multi-library walk, and Linux platform guard in constructor calling `findLinuxSteamPath()` |
| `src/renderer/src/util/linux/steamPaths.ts` | `getLinuxSteamPaths()` returning native, Flatpak (`~/.var/app/com.valvesoftware.Steam`), Snap, Debian, and legacy paths; `findLinuxSteamPath()` returning first valid hit |
| `src/renderer/src/util/linux/proton.ts` | `getProtonInfo()`, `detectProtonUsage()`, `getCompatDataPath()`, `getWinePrefixPath()`, `resolveProtonPath()`, `buildProtonCommand()`, `buildProtonEnvironment()` |

### What Still Needs Work (STAM-01 through STAM-05)

**STAM-01/02 — Multi-library VDF parsing with Flatpak paths**

`Steam.ts::resolveSteamPaths()` walks `steamPaths` starting from `mBaseFolder` (which already
resolves Flatpak via `steamPaths.ts`). However, `libraryfolders.vdf` inside a Flatpak Steam
installation uses absolute host paths (e.g. `/run/media/ssd/SteamLibrary`), which work fine.
The issue is that `resolveSteamPaths()` starts the walk from `basePath` (the Steam root) and
reads `config/libraryfolders.vdf`. For Flatpak, `basePath` resolves to
`~/.var/app/com.valvesoftware.Steam/data/Steam` — the VDF is at the correct subpath. This
means STAM-01 (VDF parsing on Linux) is largely done; the test must confirm it works against a
real Flatpak installation.

**Modification needed:** `getLinuxSteamPaths()` in `linux/steamPaths.ts` currently returns a
prioritized list but only the *first valid* one. A Flatpak + native dual-install will only
surface one base folder. Consider extending `resolveSteamPaths()` to iterate all valid Steam
roots (not just `mBaseFolder`), de-duplicating games. This is a small additive change in
`Steam.ts`.

**STAM-03 — Proton prefix resolution**

`getProtonInfo()` is called from `parseManifests()` inside `Steam.ts` for every non-Windows
game entry. The function checks `steamapps/compatdata/{appId}` for a `pfx/` directory to
determine Proton usage. No modifications needed — this is complete.

**STAM-04 — `{mygames}` Wine prefix resolution**

This is the most architectural gap. The `{mygames}` template variable is expanded in
`src/renderer/src/extensions/ini_prep/gameSupport.ts::iniFiles()`:

```typescript
const mygames = path.join(getVortexPath("documents"), "My Games");
// ...
format(filePath, { mygames, game: discovery.path })
```

On Windows, `getVortexPath("documents")` returns `C:\Users\<user>\Documents`. On Linux,
`app.getPath("documents")` returns `~/Documents` — but for a Proton game, the INI files
live inside the Wine prefix: `~/.steam/steam/steamapps/compatdata/<appId>/pfx/drive_c/users/steamuser/Documents/My Games/`.

**Integration point:** `ini_prep/gameSupport.ts::iniFiles()` must be modified to accept the
Wine prefix path as an override when the game entry is detected as Proton. The call site is
inside a platform-neutral function, so the fix must be platform-guarded. The recommended
approach: add a new helper `getMyGamesPath(gameEntry?: ISteamEntry): string` in
`linux/proton.ts` that returns the Wine prefix My Games path when `gameEntry.usesProton` is
true; fall through to `getVortexPath("documents")` otherwise. Then `iniFiles()` takes an
optional `ISteamEntry` parameter and calls this helper.

**Files modified:**
- `src/renderer/src/util/linux/proton.ts` — add `getMyGamesPath()`
- `src/renderer/src/extensions/ini_prep/gameSupport.ts` — accept optional game entry,
  call `getMyGamesPath()` on Linux

**STAM-05 — Top-4 game extension audit**

The four game extensions (Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley) are bundled
JavaScript in `extensions/games/`. They use the same `{mygames}` expansion and the same
`Steam.ts` store discovery. Once STAM-04 is resolved, these extensions inherit the fix
automatically. The audit confirms that Skyrim SE and Fallout 4 both use `ini_prep` (they
register with the INI prep extension via `context.registerGameSupport`). Cyberpunk 2077 and
Stardew Valley use different config paths and do not use `{mygames}` — their audit is a
functional test confirming game detection and path discovery work, not a code change.

### STAM Data Flow

```
Steam constructor
  └── process.platform !== 'win32'
       └── findLinuxSteamPath()          [linux/steamPaths.ts]
            └── getLinuxSteamPaths()     returns ordered list
                 └── isValidSteamPath()  checks config/libraryfolders.vdf exists

Steam.allGames()
  └── parseManifests()
       └── resolveSteamPaths()           reads libraryfolders.vdf, collects all library roots
            └── reads steamapps/*.acf    parses each manifest
                 └── [linux only]
                      └── getProtonInfo(steamPath, steamAppsPath, appId)
                           └── detectProtonUsage() → compatdata/{appId} exists?
                           └── getConfiguredProtonName() → config.vdf CompatToolMapping
                           └── resolveProtonPath() → fuzzy match steamapps/common/Proton*
                      → ISteamEntry populated with usesProton, compatDataPath, protonPath

Extension: gamemode_management discovers game via Steam store
  └── ISteamEntry with protonPath attached

Extension: ini_prep wants INI file paths
  └── iniFiles(gameMode, discovery)
       └── getMyGamesPath(steamEntry)    [NEW — linux/proton.ts]
            └── if usesProton: compatDataPath/pfx/drive_c/users/steamuser/Documents/My Games
            └── else: getVortexPath("documents") + "/My Games"
```

---

## Feature Area: DIST — AppImage + deb Packaging

### Current State

`src/main/electron-builder.config.json` has:

```json
"linux": {
  "target": ["zip"],
  ...
  "mimeTypes": ["x-scheme-handler/nxm"]
}
```

The `win` block has a `publish` block pointing to GitHub. The `linux` block has no `publish`
block. The `package.yml` GitHub Actions workflow only runs on `windows-latest`.

### What Needs Changing

**DIST-01/02 — Add AppImage and deb targets**

Single change to `electron-builder.config.json`:

```json
"linux": {
  "target": ["AppImage", "deb", "zip"],
  ...
}
```

`electron-builder` generates `latest-linux.yml` automatically when `AppImage` is a target and
a `publish` block is present. The `deb` package gets `MimeType=x-scheme-handler/nxm` from the
`mimeTypes` field already present — no additional desktop file needed for packaged builds.

**DIST-03 — GitHub Actions CI artifacts**

The existing `main.yml` runs on `ubuntu-latest` but does not run the packaging step (no
`pnpm run package`) — it only runs `build`, `lint`, and `test`. A new job or step in
`main.yml` is needed to:
1. Run `pnpm run assets:dist` and `pnpm run subprojects:dist`
2. Run `electron-builder --linux` (without signing — Linux packages don't require code signing)
3. Upload artifacts using `actions/upload-artifact`

This is an additive step in `main.yml`, gated on `runner.os == 'Linux'`.

**DIST-04 — Auto-updater `latest-linux.yml`**

The auto-updater in `src/main/src/extensions/autoupdater.ts` calls:

```typescript
autoUpdater.setFeedURL({
  provider: "github",
  owner: "Nexus-Mods",
  repo: ...,
  publisherName: ["Black Tree Gaming Ltd", "Black Tree Gaming Limited"],
});
```

`electron-updater` discovers `latest-linux.yml` from the GitHub releases. The `publisherName`
field in the `linux` block of `electron-builder.config.json` is not required for Linux (it is
Windows-only for Authenticode). For auto-updates to work, the `linux` block needs a `publish`
block:

```json
"linux": {
  "target": ["AppImage", "deb", "zip"],
  "publish": [{
    "provider": "github",
    "owner": "Nexus-Mods",
    "repo": "Vortex",
    "private": false
  }],
  ...
}
```

`electron-updater` on Linux updates via AppImage delta — it replaces the running AppImage.
The `latest-linux.yml` file contains the AppImage artifact URL and SHA512 checksum. The
auto-updater on Linux spawns `AppImageLauncher` or uses the built-in `AppImage` self-update
mechanism depending on electron-updater 4.x support.

**Note (MEDIUM confidence):** electron-updater 4.2.0 (current) has limited AppImage
auto-update support — it can check for updates and download, but the "quit and install"
step requires the AppImage to be launched from a mounted path that the process can replace.
SteamOS (immutable filesystem) may block in-place AppImage updates. Flag for validation.

### DIST Files Modified/Created

| File | Change type | What changes |
|------|-------------|--------------|
| `src/main/electron-builder.config.json` | Modified | Add `AppImage` and `deb` to `linux.target`; add `linux.publish` block |
| `.github/workflows/main.yml` | Modified | Add Linux packaging step on `ubuntu-latest` |
| `.github/workflows/package.yml` | Modified | Add Linux packaging job alongside existing Windows job |

No new files required for packaging — all output artifacts are generated by electron-builder.

### DIST Data Flow

```
package.yml (or main.yml linux job)
  └── pnpm run assets:dist
  └── pnpm run subprojects:dist
  └── electron-builder --linux --publish never  (CI only builds, no auto-publish)
       └── targets: AppImage → vortex-{version}.AppImage
       └── targets: deb → vortex_{version}_amd64.deb
       └── targets: zip → vortex-{version}-linux.zip
       └── generates: latest-linux.yml (if publish block present)

GitHub Release (package.yml release path)
  └── upload AppImage + deb + zip + latest-linux.yml

Auto-updater (runtime)
  └── setFeedURL GitHub provider
  └── checkForUpdates() → fetches latest-linux.yml from GitHub releases
  └── downloadUpdate() → downloads AppImage
  └── quitAndInstall() → replaces AppImage [validation needed on SteamOS]
```

---

## Feature Area: PROT — NXM Protocol Handler

### Current State (fully implemented)

The NXM protocol handler on Linux is **completely implemented**. The entire module exists:

| File | Status |
|------|--------|
| `src/renderer/src/util/protocolRegistration/linux/nxm.ts` | Complete — xdg-settings integration, dev desktop entry generation, wrapper script, Flatpak sandbox handling, xdg-utils workaround for non-mainstream DEs |
| `src/renderer/src/util/protocolRegistration/linux/common.ts` | Complete — `applicationsDirectory()`, `refreshDesktopDatabase()`, `getDefaultUrlSchemeHandler()`, `setDefaultUrlSchemeHandler()` with Flatpak-spawn support |
| `src/renderer/src/util/protocolRegistration/linux/desktopFileEscaping.ts` | Complete |
| `src/renderer/src/util/protocolRegistration/index.ts` | Complete — platform-branched facade |
| `src/renderer/src/ExtensionManager.ts` | Complete — `registerProtocol` and `deregisterProtocol` both call the Linux path |

The handler is triggered from `nexus_integration/index.tsx`:
```typescript
api.registerProtocol("nxm", def !== false, makeNXMLinkCallback(api))
```

This calls `ExtensionManager.registerProtocol()` → `registerProtocolHandler()` →
`registerLinuxProtocolHandler()` → `registerLinuxNxmProtocolHandler()`.

The handler writes a wrapper script and `.desktop` file for dev builds; for packaged builds
(`PACKAGE_DESKTOP_ID`), the `.desktop` file ships with the AppImage/deb (sourced from
`linux.mimeTypes` in electron-builder). Then `xdg-settings set default-url-scheme-handler nxm
com.nexusmods.vortex.desktop` is called.

When the user clicks "Download with Manager" on Nexus Mods:
1. Browser invokes `nxm://...` URI
2. `xdg-open` dispatches to the `.desktop` entry
3. The wrapper script runs `electron <appPath> --download <url>`
4. If Vortex is already running: `app.requestSingleInstanceLock()` passes the args to the
   first instance via `app.on("second-instance", ...)` → `applyArguments()` in Application.ts
5. If Vortex is not running: Application.ts startup parses `--download` via `parseCommandline()`
   and triggers the download

Separately, `protocol.registerHttpProtocol("nxm", ...)` in `Application.ts` handles the
internal Electron protocol redirect (line 275) — this fires when the NXM URL is navigated
inside Electron's own webview.

### PROT-01 — Standard Linux: Already Done

All code paths exist. The remaining work is **testing**, not implementation:
- Verify `xdg-settings` is present (safe — required by Steam and most browsers)
- Verify the wrapper script correctly passes the `%u` argument to `--download`
- Verify `update-desktop-database` refreshes the MIME database

### PROT-02 — SteamOS/KDE Plasma: Validation Gap

KDE Plasma uses `kde-open5` as the `xdg-open` fallback, which reads `~/.local/share/applications/`
and respects `xdg-settings`. The `.desktop` entry `MimeType=x-scheme-handler/nxm;` combined
with `xdg-settings set default-url-scheme-handler nxm <desktopId>` should work on KDE Plasma.

SteamOS-specific risks:
1. **Filesystem immutability**: SteamOS `/` is read-only. `~/.local/share/applications/` is
   user-writable (persistent overlay). The wrapper script writes to `applicationsDirectory()`
   which resolves to `XDG_DATA_HOME/applications` — this is safe on SteamOS.
2. **Steam Deck browser**: The Discover overlay browser (WebKit) may not invoke `xdg-open` for
   custom protocol links. The Nexus Mods website uses `nxm://` links via `<a href="nxm://...">`.
   Chrome-based browsers on Desktop Mode should work; the Steam Deck's built-in WebKit-based
   overlay needs validation.
3. **AppImage integration**: When Vortex runs as an AppImage on SteamOS Desktop Mode,
   `process.execPath` points to the mounted AppImage. The wrapper script uses `process.execPath`
   which will be correct. The `.desktop` entry auto-generated by AppImage (`AppImageLauncher` or
   manual integration) may override the one Vortex writes — validation required.

### PROT Files Modified

No code changes required for PROT. Both PROT-01 and PROT-02 are **test and validate** work,
not implementation. The only possible code change is a SteamOS-specific workaround if the
Discover overlay cannot invoke `xdg-open` — defer that to the validation phase.

---

## New vs Modified Files Summary

### New Files

No entirely new files are required. The new logic is additive functions within existing files.

### Modified Files

| File | Feature | Change |
|------|---------|--------|
| `src/renderer/src/util/linux/steamPaths.ts` | STAM-01/02 | Possibly extend to return all valid paths for dual-install scenarios |
| `src/renderer/src/util/Steam.ts` | STAM-01/02 | Possibly extend `resolveSteamPaths()` to iterate all valid Steam roots |
| `src/renderer/src/util/linux/proton.ts` | STAM-04 | Add `getMyGamesPath()` function |
| `src/renderer/src/extensions/ini_prep/gameSupport.ts` | STAM-04 | Platform-guard `{mygames}` resolution to use Wine prefix on Linux when applicable |
| `src/main/electron-builder.config.json` | DIST-01/02/04 | Add AppImage+deb targets, add `linux.publish` block |
| `.github/workflows/main.yml` | DIST-03 | Add Linux packaging step, artifact upload |
| `.github/workflows/package.yml` | DIST-03/04 | Add Linux packaging job, release upload for AppImage+deb+`latest-linux.yml` |

### Not Changed (already implemented)

| File | Why unchanged |
|------|---------------|
| `src/renderer/src/util/protocolRegistration/linux/nxm.ts` | PROT complete |
| `src/renderer/src/util/protocolRegistration/linux/common.ts` | PROT complete |
| `src/renderer/src/util/protocolRegistration/index.ts` | PROT complete |
| `src/renderer/src/ExtensionManager.ts` | PROT wiring complete |
| `src/main/src/Application.ts` | NXM second-instance dispatch complete |

---

## Platform Guard Compliance

Every modification follows the established pattern `if (process.platform === 'linux')`:

- `Steam.ts` constructor already has `if (process.platform === 'win32')` guard
- `parseManifests()` already has `if (process.platform === 'win32') return entries;` guard for Proton enrichment
- `protocolRegistration/index.ts` already has `if (process.platform === 'linux')` guards
- `ini_prep/gameSupport.ts::iniFiles()` — new platform guard wraps the Wine prefix path logic:
  ```typescript
  const mygames = process.platform === 'linux' && steamEntry?.usesProton
    ? getMyGamesPath(steamEntry)
    : path.join(getVortexPath("documents"), "My Games");
  ```

Windows code paths are untouched.

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `Steam.ts` | Steam store discovery, library VDF parsing, Proton enrichment | `linux/steamPaths.ts`, `linux/proton.ts`, gamemode_management |
| `linux/steamPaths.ts` | Path discovery for Linux Steam installations | `Steam.ts` constructor |
| `linux/proton.ts` | Proton prefix resolution, environment building, Wine path helpers | `Steam.ts` (Proton info), `ini_prep` (My Games path) |
| `ini_prep/gameSupport.ts` | INI file path templates for Bethesda/other games | `linux/proton.ts` (Linux), `getVortexPath` (all platforms) |
| `protocolRegistration/linux/` | NXM handler registration via xdg-settings | ExtensionManager, nexus_integration extension |
| `electron-builder.config.json` | Packaging target specification | electron-builder CLI, GitHub Actions |
| `autoupdater.ts` | Auto-update logic | electron-updater, GitHub releases API |

---

## Recommended Build Order

Dependencies determine order. The three feature areas are mostly independent of each other.

### Phase 1 (can be parallelized): STAM-01/02/03 and DIST-01/02/03

STAM-01/02/03 and DIST-01/02/03 are independent:
- STAM-01/02/03 modifies renderer utility code with no cross-feature dependencies
- DIST-01/02/03 modifies build config and CI with no code dependencies

These can be worked in parallel by different workstreams.

### Phase 2 (depends on Phase 1): STAM-04/05 and DIST-04 and PROT-01/02

- **STAM-04** depends on STAM-01/02/03 (requires verified Steam discovery working before wiring My Games)
- **STAM-05** (game extension audit) depends on STAM-04 (Wine prefix path resolution must be correct)
- **DIST-04** (`latest-linux.yml`) depends on DIST-01/02 (AppImage target must exist before testing auto-updater)
- **PROT-01** validation depends on DIST-01/02 (AppImage packaging produces the `.desktop` file for packaged-build registration testing)
- **PROT-02** (SteamOS validation) depends on PROT-01 (standard Linux must pass first)

### Build Order Summary

```
Parallel track A: STAM-01 → STAM-02 → STAM-03 → STAM-04 → STAM-05
Parallel track B: DIST-01/02 → DIST-03 → DIST-04
Parallel track C: PROT-01 (validate) → PROT-02 (SteamOS validate)

Track C blocks on Track B (needs AppImage to test packaged-build registration)
Track A and Track B are fully independent
```

### Parallelization Opportunities

| Requirement | Can parallel with | Reason |
|-------------|------------------|--------|
| STAM-01/02 (VDF parsing tests) | DIST-01/02 | Different files, no shared state |
| STAM-03 (Proton prefix) | DIST-03 (CI workflow) | Different files, no shared state |
| DIST-01/02 (electron-builder config) | STAM-01/02/03 | Config file, no code dependency |
| PROT-01/02 (validation only) | STAM-04/05 | No code changes in PROT |

---

## Architecture Anti-Patterns to Avoid

### Anti-Pattern 1: Replacing `getVortexPath("documents")` globally

**What:** Changing the base `documents` path to return a Linux-specific path without a platform guard
**Why bad:** Breaks all code that reads from `documents` on Linux for non-Proton games (save managers, profile exports, etc.)
**Instead:** Use an explicit platform+Proton check in `iniFiles()` only

### Anti-Pattern 2: Hardcoding Flatpak Steam path

**What:** Adding `~/.var/app/com.valvesoftware.Steam` as a single hardcoded constant
**Why bad:** The path is already in `getLinuxSteamPaths()` correctly ordered; duplicating creates drift
**Instead:** All Steam path logic lives exclusively in `linux/steamPaths.ts`

### Anti-Pattern 3: Registering NXM handler from main process

**What:** Moving protocol registration to `Application.ts` or `ipcHandlers.ts`
**Why bad:** The existing architecture registers protocols through the extension system (nexus_integration extension calls `api.registerProtocol`); bypassing this breaks the deregister flow and the "user can toggle" UX
**Instead:** Registration stays in the renderer extension layer, the existing flow is correct

### Anti-Pattern 4: Running `electron-builder --linux` on Windows CI

**What:** Adding a Linux packaging step to the Windows-only `package.yml` job
**Why bad:** Cross-compilation of native `.node` addons (loot, bsatk, esptk) does not work — these require the Linux build toolchain (cmake, Rust, liblz4-dev)
**Instead:** Linux packaging job must run on `ubuntu-latest` separately

---

## Gaps / Research Flags for Specific Phases

| Phase topic | Uncertainty | Mitigation |
|-------------|-------------|------------|
| STAM-01/02: Flatpak multi-library detection | Does `resolveSteamPaths()` correctly handle Flatpak's library path absolute references? | Test with real Flatpak install; verify `libraryfolders.vdf` path format |
| STAM-04: Wine prefix My Games | Does every Proton game write to `steamuser/Documents/My Games`? Some games use `My Documents` | Check Proton docs; test with Skyrim SE on Proton |
| DIST-04: AppImage auto-update on SteamOS | SteamOS immutable FS + electron-updater 4.2.0 AppImage replace | Test on Steam Deck hardware; may need to defer auto-update to v3.0 |
| PROT-02: Steam Deck Discover overlay | WebKit overlay may not invoke xdg-open for nxm:// | Test on Steam Deck; workaround may require a different registration mechanism |

## Sources

- Source code: `src/renderer/src/util/Steam.ts` — verified directly
- Source code: `src/renderer/src/util/linux/steamPaths.ts` — verified directly
- Source code: `src/renderer/src/util/linux/proton.ts` — verified directly
- Source code: `src/renderer/src/util/protocolRegistration/linux/nxm.ts` — verified directly
- Source code: `src/renderer/src/util/protocolRegistration/linux/common.ts` — verified directly
- Source code: `src/main/electron-builder.config.json` — verified directly
- Source code: `src/main/src/extensions/autoupdater.ts` — verified directly
- Source code: `.github/workflows/main.yml` and `package.yml` — verified directly
- Source code: `src/renderer/src/extensions/ini_prep/gameSupport.ts` — verified directly
- NexusMods.App reference impl: `https://github.com/Nexus-Mods/NexusMods.App/blob/main/src/NexusMods.Backend/OS/LinuxInterop.Protocol.cs` (referenced in nxm.ts comments)
- Confidence: HIGH for all architectural claims (all verified by direct code inspection)
