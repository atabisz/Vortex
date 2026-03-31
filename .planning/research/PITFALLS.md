# Domain Pitfalls — Phase 2: Steam/Proton Detection, Packaging, NXM Protocol

**Domain:** Adding Steam/Proton game detection, AppImage/.deb packaging, and NXM protocol handler to an existing Electron app on Linux (Vortex v2.0 milestone)
**Researched:** 2026-03-31
**Confidence:** HIGH — all pitfalls grounded in codebase audit + verified upstream sources

> **Scope note:** Phase 1 pitfalls (winapi shim, IPC pipes, FOMOD, localAppData) are documented
> in the PITFALLS.md that shipped with v1.0. This document covers v2.0 only: STAM-01–05,
> DIST-01–04, PROT-01–02. Cross-references are made where a Phase 1 decision creates a
> Phase 2 trap.

---

## Critical Pitfalls

Mistakes that require rewrites or block entire feature areas.

---

### Pitfall 1: `findLinuxSteamPath()` is synchronous and called at constructor time

**What goes wrong:**
`steamPaths.ts` `findLinuxSteamPath()` uses `fs.statSync()` in a loop over six candidate paths.
`Steam.ts` calls this in the `Steam` class constructor (`new Steam()`), which is instantiated at
renderer startup. On systems where all six paths exist as broken symlinks (common on Debian
where `~/.steam/steam` points to a target that may not be mounted), `statSync` blocks the
renderer event loop for the duration of six sequential filesystem probes. On network-mounted
home directories (common on enterprise Linux), this can take several seconds, freezing the UI.

**Why it happens:**
The constructor pattern was inherited from the Windows version, where the path is retrieved via
a synchronous registry read (`winapi.RegGetValue`) that is genuinely instant. The Linux
equivalent — six filesystem probes — is not instant and should be async.

**Consequences:**
- UI freeze on startup for users with NFS/CIFS home directories
- On Steam Deck: home is on the internal NVMe and fast, but Flatpak Steam path
  (`~/.var/app/com.valvesoftware.Steam/...`) adds two extra lstat calls that traverse
  the XDG hierarchy — low risk but nonzero
- If `statSync` throws for a permission reason (e.g. a path under Flatpak sandbox), the
  entire Steam detection silently fails and `findLinuxSteamPath()` returns `undefined`

**Prevention:**
Convert `isValidSteamPath()` to use `fs.statSync()` wrapped in try/catch (already done), but
move the loop in `findLinuxSteamPath()` to an `async` function using `fs.stat()` (async).
The `Steam` constructor should store a `Promise<string | undefined>` for the base folder, not
a resolved value — the Windows branch already uses `PromiseBB.resolve()` so the type allows
this. This is an additive change: the Windows path is unchanged.

**Detection:** Startup profiler shows >100ms in `findLinuxSteamPath` on renderer init trace.

**Phase:** STAM-01/02 — must fix before shipping Steam detection.

---

### Pitfall 2: Steam library scan only searches `steamPath/steamapps` — misses additional libraries

**What goes wrong:**
`Steam.ts` line 255 reads `steamPath/config/libraryfolders.vdf` to discover additional library
paths. The VDF file lists all library roots the user has configured (e.g. `/mnt/games/Steam`).
The current implementation parses `libraryfolders.vdf` correctly on Windows.

The problem: `findLinuxSteamPath()` returns the *Steam installation root* (e.g.
`~/.local/share/Steam`), not the default `steamapps` path. The `allGames()` method in
`Steam.ts` calls `path.resolve(basePath, "config", "libraryfolders.vdf")` where `basePath` is
the Steam root. This is correct. However, the Flatpak path is:
```
~/.var/app/com.valvesoftware.Steam/data/Steam
```
and `libraryfolders.vdf` for the Flatpak install may list library paths using the Flatpak
sandbox paths (e.g. `/run/user/1000/...`) which do NOT exist on the host filesystem when
Vortex is running outside the Flatpak sandbox.

**Why it happens:**
Flatpak Steam uses path remapping internally. Absolute paths stored in `libraryfolders.vdf`
by the Flatpak Steam client reflect the Flatpak sandbox view, not the host view. For example,
the Flatpak sandbox maps `~` to `/home/username` but stores library paths using the host
filesystem paths visible to Steam — this is actually correct for standard installations. The
trap is symlinks: `~/.steam/steam` is a symlink created by the native Steam installer but is
absent from Flatpak installs. Code that hardcodes a `~/.steam/steam` assumption breaks for
Flatpak-only setups.

**Consequences:**
- Games installed in non-default library folders are invisible to Vortex
- `allGames()` returns only the games in the default library — users with large game
  collections on secondary drives see empty game list

**Prevention:**
After parsing `libraryfolders.vdf`, verify each library path exists on the host filesystem
with `fs.stat()`. If a path does not exist, log a warning (not an error) and skip it. Do NOT
throw — a missing library path is a degraded-but-functional state.

Add `getLinuxSteamLibraryPaths(steamRoot)` that reads `libraryfolders.vdf` and returns only
verified-existing paths. This is a new function that the Linux branch calls; the Windows path
is unchanged.

**Detection:** `allGames()` returns fewer games than installed; logs show "libraryfolders.vdf
parsed: N paths, M verified".

**Phase:** STAM-01/02.

---

### Pitfall 3: `{mygames}` path resolution uses native Linux documents directory, not Wine prefix

**What goes wrong:**
`extensions/local-gamesettings/src/util/gameSupport.ts` line 149:
```typescript
export function mygamesPath(gameMode: string): string {
  return path.join(
    util.getVortexPath("documents"),
    "My Games",
    gameSupport.get(gameMode, "mygamesPath"),
  );
}
```
`getVortexPath("documents")` calls `app.getPath("documents")` which on Linux returns
`~/Documents` (the XDG documents directory). But for Proton-run Bethesda games, save files
and INI files live in the Wine prefix:
```
~/.steam/steam/steamapps/compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/Skyrim Special Edition/
```
Vortex will write `Skyrim.ini` to `~/Documents/My Games/Skyrim Special Edition/` — a path
that Proton's Wine never reads. Mod settings silently do not apply.

**Why it happens:**
The `mygamesPath` function predates Linux support. There is no "is this a Proton game?"
branch anywhere in `gameSupport.ts`. The Phase 1 audit flagged this (Phase 1 PITFALLS.md
pitfall #3) but implementation is deferred to v2.0.

**Consequences:**
- INI tweaks write to the wrong path; game launches without the changes
- `local-gamesettings` extension silently reports success (no file error, just wrong
  directory)
- Affects: Skyrim SE, Skyrim, Fallout 4, Fallout NV, Oblivion, Enderal, Starfield — all
  top-4 titles for STAM-05 validation

**Prevention:**
In `mygamesPath()`, add a platform guard:
```typescript
if (process.platform === 'linux') {
  // Resolve via proton.ts helpers if the game uses Proton
  const protonInfo = await getProtonInfo(steamPath, steamAppsPath, appId);
  if (protonInfo.usesProton) {
    return path.join(
      protonInfo.compatDataPath, "pfx", "drive_c", "users", "steamuser",
      "Documents", "My Games", gameSupport.get(gameMode, "mygamesPath")
    );
  }
}
```
The `proton.ts` helpers already exist for exactly this. The function signature must become
async (or accept pre-resolved Proton info). This is a Linux-additive change — the Windows
path is unmodified.

**Detection:** After mod deployment, check `~/Documents/My Games/Skyrim Special Edition/` for
newly written files when the game prefix path is actually `compatdata/<id>/pfx/...`.

**Phase:** STAM-03/04/05 — blocks all Bethesda game support.

---

### Pitfall 4: `protocol.registerHttpProtocol("nxm", ...)` in `Application.ts` is superseded by xdg-open on Linux

**What goes wrong:**
`Application.ts` line 275:
```typescript
protocol.registerHttpProtocol("nxm", (request) => {
  const cfgFile: IParameters = { download: request.url };
  this.applyArguments(cfgFile).catch(...);
});
```
`protocol.registerHttpProtocol` is Electron's *in-process* protocol handler — it intercepts
`nxm://` URLs opened by Electron's internal `shell.openExternal()` mechanism. It does NOT
handle URLs sent by the system's `xdg-open` when a browser clicks "Download with Manager."

On Linux, the browser invokes `xdg-open nxm://...`, which spawns a new Vortex process
(or the wrapper script from `nxm.ts`) with `--download <url>` in argv. The existing
`second-instance` handler in `Application.ts` line 250 correctly picks up `--download` from
`secondaryArgv`. This pathway is already correct.

The trap is the **cold-start case**: when Vortex is not running and the user clicks "Download
with Manager," the system spawns Vortex fresh with `--download nxm://...` as argv[2]. The
cold-start code path (lines 282–299 in `Application.ts`) calls `this.applyArguments()` only
after `regularStart()` completes — which means the UI must fully initialise before the
download can be queued. If the download argument is consumed too early (before the Redux store
is ready), it is silently dropped.

**Why it happens:**
The Windows cold-start path works because Windows registers the protocol via registry and
the single-instance lock ensures the second-instance event fires. On Linux, the wrapper script
spawns a fresh process — the single-instance lock path (`app.requestSingleInstanceLock()`)
must return `false` to trigger the second-instance flow, which only works if another instance
is already running. The cold-start case receives `--download` directly in `process.argv`.

**Consequences:**
- User clicks "Download with Manager" when Vortex is closed
- Vortex opens, fully initialises, then silently ignores the NXM URL
- User must click the browser button again while Vortex is running

**Prevention:**
In `regularStart()`, buffer the `args.download` URL and re-apply it after the store reaches
`initialized` state. A simple deferred-apply pattern:
```typescript
private pendingDownload: string | undefined;
// In constructor: if (args.download) this.pendingDownload = args.download;
// In onStoreReady: if (this.pendingDownload) { applyArguments({ download: this.pendingDownload }); }
```
The Windows path already has retry logic for this; unify it on both platforms. This is a
platform-neutral fix with no Windows regression risk.

**Detection:** Set Vortex as NXM handler, close Vortex, click "Download with Manager" from
browser — download should queue without requiring a second click.

**Phase:** PROT-01/02.

---

### Pitfall 5: AppImage `setAsDefaultProtocolClient` does not work — Electron uses xdg-settings internally

**What goes wrong:**
`ipcHandlers.ts` line 163 calls `app.setAsDefaultProtocolClient(protocol, execPath, args)`.
On Linux, Electron's `setAsDefaultProtocolClient` invokes `xdg-settings set
default-url-scheme-handler nxm <desktop-id>`. This works only if a `.desktop` file with a
matching `MimeType=x-scheme-handler/nxm;` entry already exists in
`~/.local/share/applications/` and the desktop database has been refreshed.

The custom Linux protocol registration code in `nxm.ts` and `common.ts` already handles this
correctly for the dev build. The **trap for AppImage** is that the packaged AppImage does NOT
automatically integrate with the desktop — `AppImageLauncher` or manual integration is
required. Electron's `setAsDefaultProtocolClient` will succeed (return `true`) but the
registration does nothing because no `.desktop` file with the matching ID has been installed.

The existing `nxm.ts` code is written for the dev build case (`DEV_DESKTOP_ID`). For a
packaged AppImage (`PACKAGE_DESKTOP_ID = "com.nexusmods.vortex.desktop"`), the code path
hits `desktopIdForCurrentBuild()` → `PACKAGE_DESKTOP_ID` → does NOT call
`ensureDevDesktopEntry()` — so no desktop file is written and `xdg-settings` assignment
targets a non-existent desktop ID.

**Why it happens:**
The comment in `nxm.ts` says "On Linux, protocol associations are normally handled by the
package manager." This is true for `.deb` — the package manager installs the `.desktop` file.
But for AppImage, there is no package manager step. AppImage integration is opt-in via
AppImageLauncher or manual install, and the code has no fallback for unintegrated AppImages.

**Consequences:**
- AppImage users who have not run AppImageLauncher see "NXM handler registered" in Vortex
  settings but browser clicks do nothing
- `xdg-settings get default-url-scheme-handler nxm` returns `com.nexusmods.vortex.desktop`
  but `xdg-open nxm://...` fails because the desktop file does not exist

**Prevention:**
For packaged AppImage builds (`!isDevelopmentBuild() && !isFlatpakBuild()`), call a new
`ensureAppImageDesktopEntry()` that writes the `.desktop` file to
`~/.local/share/applications/com.nexusmods.vortex.desktop` with `Exec=%APPIMAGE% --download
%u`. Read `APPIMAGE` environment variable (set by AppImage runtime) for the exec path.
Check `process.env.APPIMAGE !== undefined` to detect AppImage at runtime.

```typescript
function isAppImageBuild(): boolean {
  return process.env.APPIMAGE !== undefined;
}
```

For `.deb` builds, the package manager installs the desktop file at
`/usr/share/applications/com.nexusmods.vortex.desktop` — no runtime action needed.

**Detection:** After installing AppImage (not via AppImageLauncher), check
`~/.local/share/applications/com.nexusmods.vortex.desktop` exists and contains
`MimeType=x-scheme-handler/nxm;`.

**Phase:** PROT-01 (AppImage protocol), DIST-01 (AppImage packaging).

---

### Pitfall 6: SteamOS read-only rootfs breaks `update-desktop-database` and system paths

**What goes wrong:**
SteamOS uses an immutable root filesystem (`/usr`, `/etc` mounted read-only via `ostree`).
`/etc` resets to the base image state after exiting Desktop Mode (confirmed in ValveSoftware/
SteamOS issue tracker). The `refreshDesktopDatabase()` call in `common.ts` runs
`update-desktop-database ~/.local/share/applications/` — this writes to `~/.local` which IS
writable. This call is safe.

The trap is any code that writes to `/usr`, `/opt`, `/etc`, or system `bin` directories.
Specifically:
1. If the AppImage tries to integrate itself system-wide (e.g. copy to `/usr/local/bin`),
   it will fail with `EROFS` (read-only filesystem).
2. If `update-desktop-database` is called on the system path `/usr/share/applications/` (not
   `~/.local`), it fails silently or with `EROFS`.
3. SteamOS package manager (`pacman` via `steamos-readonly disable`) exists but users who
   have not run `steamos-readonly disable` will see all write attempts to system paths fail.

The Steam Deck runs KDE Plasma in Desktop Mode. KDE Plasma uses `kbuildsycoca6` as well as
`update-desktop-database` to rebuild its application cache. `xdg-settings` on KDE Plasma
uses `kwriteconfig5`/`kwriteconfig6` internally for some settings, not the standard MIME
database. This means `xdg-settings set default-url-scheme-handler nxm ...` may behave
differently on KDE Plasma vs GNOME.

**Consequences:**
- Protocol registration silently fails on SteamOS if code touches system paths
- AppImage that auto-integrates to system paths crashes on Steam Deck
- KDE Plasma may require explicit `kbuildsycoca6 --noincremental` after desktop DB update

**Prevention:**
All write operations must target `~/.local/` paths only:
- Desktop files: `~/.local/share/applications/` (already correct in `common.ts`)
- Wrapper scripts: `~/.local/share/applications/` (already correct in `nxm.ts`)
- `update-desktop-database`: ONLY pass the `~/.local/share/applications/` path (already done)
- Never write to `/usr`, `/etc`, `/opt`

For KDE Plasma compatibility, after `update-desktop-database`, optionally run
`kbuildsycoca6 --noincremental` if `kbuildsycoca6` is present in `$PATH`. This rebuilds the
KDE service cache. Check existence first with `which kbuildsycoca6` before spawning.

**Detection:** On Steam Deck in Desktop Mode: install AppImage, register NXM handler,
open Chromium browser and click a Nexus mod "Download with Manager" link.

**Phase:** PROT-02 (SteamOS/KDE Plasma validation).

---

### Pitfall 7: `latest-linux.yml` requires AppImage artifact to be named exactly

**What goes wrong:**
`electron-builder` generates `latest-linux.yml` with the `path` field set to the exact
AppImage filename. `electron-updater` on Linux reads `latest-linux.yml` and downloads the
file at `path`. The current `electron-builder.config.json` has no `artifactName` set for
Linux. The default artifact name pattern includes `${version}` but also includes the full
Electron-builder default naming: `${productName}-${version}.AppImage`.

The trap: if the GitHub Actions workflow uses `--publish always` but the artifact name in
`latest-linux.yml` does not match the actual uploaded file (due to special characters in
`productName`, version string format differences, or upload path prefixes), the auto-updater
silently fails. The failure mode is: `latest-linux.yml` exists, `electron-updater` parses it,
requests the download URL, gets a 404 from GitHub releases CDN.

Additionally, `electron-updater` on Linux requires the `APPIMAGE` environment variable to be
set at runtime. If Vortex is launched from a terminal or non-AppImage context (`.deb` install,
dev build), `APPIMAGE` is unset and `electron-updater` logs:
```
Error: APPIMAGE env is not defined, current application is not an AppImage
```
This error is non-fatal (updater skips) but produces confusing error output in `.deb` builds.

**Why it happens:**
`electron-updater`'s Linux AppImage update path has three separate conditions: APPIMAGE env
must be set, `latest-linux.yml` must exist, and the artifact URL must resolve. All three must
hold simultaneously. The error message for the `APPIMAGE` case looks like a bug but is
actually expected behaviour for non-AppImage builds.

**Consequences:**
- AppImage users never receive automatic updates despite `latest-linux.yml` being published
- `.deb` users see spurious updater errors in logs

**Prevention:**
1. Set explicit `artifactName` in the Linux builder config:
   ```json
   "linux": { "artifactName": "vortex-setup-${version}.${ext}" }
   ```
   This makes the filename deterministic and avoids `productName` encoding issues.
2. In the auto-update code, gate Linux update checks behind `process.env.APPIMAGE !== undefined`
   before calling `autoUpdater.checkForUpdatesAndNotify()`. The Windows path is unchanged.
3. For `.deb` builds: disable auto-updater entirely (`.deb` users update via `apt`/system
   package manager). Check `process.env.APPIMAGE === undefined &&
   fs.existsSync('/usr/share/applications/com.nexusmods.vortex.desktop')` as a heuristic
   for "installed as deb."

**Detection:** Build AppImage, run it, trigger update check — verify `latest-linux.yml`
path field matches the actual release asset filename exactly.

**Phase:** DIST-01/04.

---

## Moderate Pitfalls

---

### Pitfall 8: Proton compatdata only exists if the game has been launched at least once

**What goes wrong:**
`detectProtonUsage()` in `proton.ts` checks for `steamapps/compatdata/<appid>/` directory
existence. A game that has been installed via Steam but never launched does not have a
`compatdata` entry — Steam creates the Wine prefix on first launch. If `detectProtonUsage()`
returns `false`, `getProtonInfo()` returns `{ usesProton: false }`, and Vortex treats the game
as a native Linux game. All path resolution for save files, INI files, and mod staging will
use native Linux paths — which are wrong for a Windows game that will eventually run under
Proton.

**Why it happens:**
Steam does not pre-create Proton prefixes at install time. The `compatdata` directory is a
reliable indicator only for games that have been run at least once. New installs fail silently.

**Consequences:**
- User installs a game, immediately tries to mod it in Vortex
- Vortex attempts to stage mods in native Linux paths
- User launches the game via Steam (which creates the prefix), then mods do not apply
  because they were staged to the wrong location
- Re-discovering the game in Vortex may fix it, but requires user action

**Prevention:**
Supplement `detectProtonUsage()` with a VDF manifest check. The `appmanifest_<appid>.acf`
file in `steamapps/` contains `"oslist"` which lists compatible OS types. If `oslist` does
NOT include `"linux"` but the game is installed, it is a Windows game that will use Proton.
This check works before the first launch:
```typescript
async function isWindowsGame(steamAppsPath, appId): Promise<boolean> {
  const acfPath = path.join(steamAppsPath, `appmanifest_${appId}.acf`);
  const content = await fs.readFileAsync(acfPath, 'utf8');
  const manifest = parse(content);
  const osList: string = manifest?.AppState?.oslist ?? 'windows';
  return !osList.includes('linux');
}
```
If the game is confirmed Windows-only, assume Proton even without `compatdata` — and stage
the mod to the Proton prefix path, creating the prefix directory structure if needed.

**Detection:** Install a Windows-only Steam game. Before launching it, check whether Vortex
correctly identifies it as a Proton game and uses prefix paths.

**Phase:** STAM-03.

---

### Pitfall 9: Flatpak Steam `libraryfolders.vdf` contains host paths but the Flatpak path root differs

**What goes wrong:**
The second Flatpak path in `getLinuxSteamPaths()` is:
```
~/.var/app/com.valvesoftware.Steam/.local/share/Steam
```
The `libraryfolders.vdf` inside this directory lists Steam library paths using paths as seen
by the Flatpak sandbox. In Flatpak's sandbox, `$HOME` is mapped to the real home directory,
so library paths like `/home/user/SteamGames` are correct. However, the default `steamapps`
path for Flatpak Steam is:
```
~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps
```
not `~/.local/share/Steam/steamapps`. If `getLinuxSteamPath()` returns the Flatpak root,
but `allGames()` constructs the steamapps path as `path.join(steamRoot, "steamapps")`, this
will work correctly for the default library. But the `libraryfolders.vdf` path entries from a
Flatpak install may use the real `/home/user/...` paths, not the Flatpak-prefixed paths —
this is actually fine because the host and Flatpak sandbox share the real home directory.

The actual trap: both native Steam AND Flatpak Steam may be installed simultaneously. If
`findLinuxSteamPath()` returns the native Steam path but the user's primary library is managed
by Flatpak Steam (or vice versa), game detection scans the wrong library. Vortex may find
no games or find the wrong set.

**Why it happens:**
`findLinuxSteamPath()` returns the first valid path in the ordered list. If both native and
Flatpak Steam are installed, native Steam is checked first. If the user primarily uses Flatpak
Steam and native Steam is just a leftover installation, Vortex scans the wrong instance.

**Consequences:**
- Vortex shows 0 games even though the user has 50+ games in their Flatpak Steam library
- `compatdata` paths are wrong because they are resolved relative to the native Steam root

**Prevention:**
After finding a valid Steam path, verify it actually contains `appmanifest_*.acf` files in
`steamapps/`. A valid path with an empty `steamapps/` directory means Steam is installed
but no games are there. Fall through to the next candidate path in this case. Consider
scanning ALL valid Steam installations and merging the game lists (as the Windows extension
already does with multiple library folders).

**Detection:** Install both native and Flatpak Steam with games in each — verify Vortex
finds games from both installations.

**Phase:** STAM-02.

---

### Pitfall 10: `xdg-settings` silently fails on desktop environments without MIME support

**What goes wrong:**
`common.ts` calls `xdg-settings set default-url-scheme-handler nxm <desktop-id>`. On some
desktop environments (Xfce, LXQt, tiling WMs like i3/Sway/Hyprland), `xdg-settings`
returns exit code 1 with "default-url-scheme-handler not implemented for <de-name>."

The existing `logCommandFailure()` in `common.ts` logs this as `"debug"` level and continues.
The result is that Vortex's UI shows "NXM handler registered" but `xdg-open nxm://...` does
nothing on those desktop environments.

The xdg-utils upstream issue #279 (referenced in `nxm.ts` comments) documents this is a
known bug in the `xdg-settings` generic fallback path. The wrapper script workaround
(writing a `.desktop` file and calling `xdg-mime default`) is more reliable than
`xdg-settings` for non-mainstream DEs — and is already implemented in `nxm.ts` for dev
builds. The packaged build path does not use this workaround.

**Consequences:**
- NXM handler appears registered in Vortex but browser clicks do nothing on Xfce/tiling WMs
- No user-visible error; the failure is logged at `debug` level only
- Steam Deck in Desktop Mode uses KDE Plasma which does support `xdg-settings` properly,
  so this is a standard desktop Linux issue, not a Steam Deck issue

**Prevention:**
After calling `xdg-settings set`, verify with `xdg-settings get default-url-scheme-handler nxm`.
If the result does not match the expected desktop ID, fall back to the direct MIME database
approach: run `xdg-mime default <desktop-id>.desktop x-scheme-handler/nxm`. Log a warning
(not debug) if `xdg-settings` fails. Surface the failure to the user with a "NXM handler
registration may not work on your desktop environment" notification.

**Detection:** On an Xfce system: register handler, run `xdg-settings get default-url-scheme-handler nxm`,
verify the result matches the desktop ID.

**Phase:** PROT-01.

---

### Pitfall 11: `electron-builder` Linux target `zip` is still present — must be replaced, not supplemented

**What goes wrong:**
`electron-builder.config.json` currently has `"target": ["zip"]` under `linux`. If AppImage
and deb are simply added alongside (`"target": ["zip", "AppImage", "deb"]`), all three
artifacts are produced. The `zip` artifact wastes CI time and disk space. More critically:
if the GitHub Actions release workflow uploads all Linux artifacts, the release will contain
three Linux packages. The `latest-linux.yml` generated by electron-builder will reference
only the AppImage (correct), but users seeing the GitHub releases page will be confused by
the presence of a `.zip` alongside `.AppImage` and `.deb`.

Separate issue: the current config has no `icon` path that resolves to a 512x512 PNG.
`electron-builder` requires a 512x512 icon for AppImage generation. The current icon path
`../../assets/images/vortex.png` may work if the file is 512x512, but this is not validated.
If the icon is smaller than 512x512, electron-builder silently uses it (no error) but the
AppImage launcher icon is pixelated.

**Why it happens:**
The `zip` target was the safe v1.0 default (produces no platform integration artifacts).
AppImage and deb require additional build-time assets (icons, `.desktop` file templates,
`mimeTypes` field).

**Consequences:**
- Wasted CI minutes building three Linux targets
- User confusion on releases page
- AppImage icon is blurry if source PNG is not 512x512

**Prevention:**
Replace `"target": ["zip"]` with `"target": ["AppImage", "deb"]` in the `linux` block.
Add `"artifactName": "vortex-setup-${version}.${ext}"` to keep naming consistent with Windows.
Validate the icon: `file ../../assets/images/vortex.png` to confirm dimensions. If needed,
generate a 512x512 version at build time.

The `mimeTypes` field `["x-scheme-handler/nxm"]` is already present in the config — this
embeds the protocol handler declaration in the `.desktop` file that electron-builder generates
for AppImage and deb. Verify it generates correctly with `electron-builder --linux deb --dir`
(dry run, no packaging).

**Detection:** Run `electron-builder --linux deb --dir` and inspect the generated
`dist/linux-unpacked/*.desktop` file for `MimeType=x-scheme-handler/nxm;`.

**Phase:** DIST-01/02.

---

### Pitfall 12: `second-instance` delivers argv WITHOUT the Electron default arguments on some distros

**What goes wrong:**
`Application.ts` line 250:
```typescript
app.on("second-instance", (_event: Event, secondaryArgv: string[]) => {
  this.applyArguments(parseCommandline(secondaryArgv, true)).catch(...);
});
```
On some Linux distributions, when `xdg-open nxm://...` launches the wrapper script which
in turn calls `exec "$executable" "$appPath" --download "$@"`, the `secondaryArgv` delivered
to the `second-instance` event includes `[executablePath, appPath, "--download", "nxm://..."]`.
`parseCommandline` receives this full argv including the executable path at index 0.

The `true` second argument to `parseCommandline` likely indicates it is parsing "secondary"
argv (skipping the first element). But the `appPath` (the `.asar` path, index 1) is also
present. If `parseCommandline` skips only index 0, the `appPath` string at index 1 is parsed
as an unknown argument — typically ignored, but on versions with strict argv parsing, it may
cause a warning or swallow the subsequent `--download` argument.

**Why it happens:**
The wrapper script in `nxm.ts` calls:
```sh
exec "$executablePath" "$appPath" --download "$@"
```
This exactly matches how Electron is launched from the command line in development. But in
a packaged AppImage context, the AppImage runner sets `argv[0]` and `argv[1]` differently.
The `$appPath` argument may not be needed for a packaged build (the asar is embedded).

**Consequences:**
- NXM URL from a second-instance call is silently dropped on some AppImage installs
- No error logged — `parseCommandline` succeeds but returns no `download` parameter

**Prevention:**
In the wrapper script generation (`generateWrapperScript` in `nxm.ts`), use `isAppImageBuild()`
to conditionally omit `$appPath` from the exec call when running as a packaged AppImage:
```sh
if [ -n "$APPIMAGE" ]; then
  exec "$executablePath" --download "$@"
else
  exec "$executablePath" "$appPath" --download "$@"
fi
```
Log the received `secondaryArgv` in the `second-instance` handler at `info` level during the
v2.0 validation sprint to catch this class of issue early.

**Detection:** Package as AppImage, set as NXM handler, open a second Nexus link while Vortex
is running — verify the download is queued.

**Phase:** PROT-01/02.

---

## Minor Pitfalls

---

### Pitfall 13: Proton path scan uses `readdirAsync` on `steamapps/common` — slow for large libraries

**What goes wrong:**
`resolveProtonPath()` in `proton.ts` calls `fs.readdirAsync(commonPath)` to scan all entries
in `steamapps/common` for fuzzy Proton version matching. A user with 200+ games installed
in `steamapps/common` will trigger a directory scan of 200+ entries every time a game's Proton
info is resolved. This happens on every `getProtonInfo()` call, which is called per-game.

**Prevention:**
Cache the `steamapps/common` directory listing. A simple module-level `Map<string, string[]>`
keyed by `commonPath` avoids repeated directory scans within a single session. Invalidate
the cache only when a game is added/removed (observable via Steam file watchers).

**Phase:** STAM-03 — performance issue, not a correctness issue. Implement cache in the
same phase as the Proton detection work.

---

### Pitfall 14: `.deb` package does not include `xdg-utils` as a dependency declaration

**What goes wrong:**
The protocol registration code relies on `xdg-settings` and `update-desktop-database` being
installed. These are part of `xdg-utils`. On Ubuntu/Debian, `xdg-utils` is typically pre-installed
but is not guaranteed on minimal installations or container environments.

If `xdg-utils` is absent, `spawnSync("xdg-settings", ...)` returns `{ error: { code: "ENOENT" } }`.
The existing code handles this gracefully (logs debug, continues). However, the `.deb` package
should declare `xdg-utils` as a dependency to ensure it is installed.

**Prevention:**
In `electron-builder.config.json`, add to the Linux deb configuration:
```json
"deb": {
  "depends": ["xdg-utils", "libnotify4", "libsecret-1-0"]
}
```
`libnotify4` and `libsecret-1-0` are standard Electron runtime dependencies that are also
worth declaring.

**Detection:** Install the `.deb` on a minimal Debian container without `xdg-utils` —
verify the package manager pulls it in as a dependency.

**Phase:** DIST-02.

---

### Pitfall 15: Steam Deck Proton prefix path uses `steamuser` not the actual Linux username

**What goes wrong:**
All Proton Wine prefixes use `steamuser` as the fixed username inside the prefix:
```
compatdata/<appid>/pfx/drive_c/users/steamuser/
```
Code that constructs Proton paths using `os.userInfo().username` or `process.env.USER` will
produce paths like `pfx/drive_c/users/alex/Documents/...` which do not exist. The actual
path is always `pfx/drive_c/users/steamuser/Documents/...` regardless of the host username.

The existing `proton.ts` `getWinePrefixPath()` returns `compatDataPath/pfx` correctly but
does not expose a `getProtonUserPath()` helper. Game extensions that construct paths manually
inside the prefix will need to use `steamuser` hardcoded.

**Prevention:**
Export `PROTON_USERNAME = "steamuser"` as a named constant from `proton.ts`. Any path
construction inside a Wine prefix must use this constant, never `os.userInfo().username`.
Document this in `proton.ts` file header.

**Phase:** STAM-04 (affects `{mygames}` path construction in game extensions).

---

### Pitfall 16: `electron-builder` `extraResources` still bundles Windows-only binaries in Linux packages

**What goes wrong:**
`electron-builder.config.json` top-level `extraResources` includes `"./nsis/**/*"` which
bundles NSIS installer scripts into ALL packages including Linux. While this does not cause
a functional failure, it adds ~500KB of Windows-only content to the AppImage/deb packages
and exposes internal build configuration to Linux users.

More critically: `asarUnpack` includes `"assets/*.exe"` and
`"node_modules/@nexusmods/fomod-installer-ipc/dist/*.exe"`. These globs produce empty
matches on Linux (no `.exe` files exist in those paths after the Linux build), but electron-builder
emits a warning for empty globs that could be mistaken for a missing asset error in CI logs.

**Prevention:**
Move `"./nsis/**/*"` from top-level `extraResources` into `win.extraResources`. Move
`.exe` glob patterns in `asarUnpack` into conditional entries:
```json
"asarUnpack": [
  "...",
  "${IF_WIN}assets/*.exe${END}",
  "node_modules/@nexusmods/fomod-installer-ipc/dist/ModInstallerIPC"
]
```
`electron-builder` supports per-platform `asarUnpack` overrides via the platform config block
(less well-documented but confirmed in v24.x source).

**Detection:** Build AppImage, extract it with `--appimage-extract`, inspect the `resources/`
directory for `.exe` files and NSIS scripts.

**Phase:** DIST-01/02.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| STAM-01: VDF parsing on Linux | Path separator in VDF values may use Windows backslash | Normalise VDF path values on Linux (pitfall not yet seen in code, but VDF from Windows-installed Steam may contain `\`) |
| STAM-02: Flatpak Steam paths | Both native and Flatpak Steam installed → wrong library scanned | Check `steamapps/*.acf` exists before returning a Steam root as valid |
| STAM-03: Proton prefix detection | compatdata absent until first launch | Use `appmanifest_*.acf` `oslist` as Proton pre-launch indicator |
| STAM-04: `{mygames}` path | Writes to native `~/Documents` instead of Wine prefix | Add Proton branch in `mygamesPath()` (existing `proton.ts` helpers available) |
| STAM-05: Top-4 game audit | Game extensions use `localAppData` without Proton fallback | Audit BG3, Skyrim SE, Fallout 4, Cyberpunk extensions for hardcoded Windows path patterns |
| DIST-01: AppImage packaging | Icon not 512x512 → blurry launcher icon | Validate icon dimensions in CI |
| DIST-01: AppImage NXM | AppImage not desktop-integrated → `xdg-settings` sets non-existent ID | Write `.desktop` file at runtime if `APPIMAGE` env is set |
| DIST-02: deb packaging | Missing `xdg-utils` dependency declaration | Add `deb.depends` to builder config |
| DIST-03: CI workflow | Linux package job tries Authenticode signing | Linux job must have no signing steps; `electron-builder` signs Linux with GPG or not at all |
| DIST-04: auto-updater | `APPIMAGE` env absent in deb builds → spurious error | Gate update check behind `process.env.APPIMAGE` check |
| PROT-01: xdg-open dispatch | Cold-start NXM URL consumed before Redux store ready | Buffer pending download URL, re-apply after store initializes |
| PROT-01: AppImage handler | `setAsDefaultProtocolClient` succeeds but no effect | Write `.desktop` file runtime via `ensureAppImageDesktopEntry()` |
| PROT-02: SteamOS | `xdg-settings` works on KDE Plasma; `update-desktop-database` path must be `~/.local` only | No write to `/usr/share` or `/etc`; optionally run `kbuildsycoca6` |
| PROT-02: KDE Plasma | KDE may need `kbuildsycoca6` rebuild after desktop DB update | Spawn `kbuildsycoca6 --noincremental` if in PATH |

---

## Cross-Platform Regression Risks

The following changes required for Phase 2 carry risk of breaking the Windows build if
implemented without proper platform guards.

| Change | Windows Risk | Guard Pattern |
|--------|-------------|---------------|
| `mygamesPath()` becomes async for Linux Proton lookup | Sync callers on Windows break | Keep sync signature, add async overload gated on `process.platform === 'linux'` |
| `findLinuxSteamPath()` made async | `Steam` constructor is sync on Windows via `winapi.RegGetValue` | The constructor already does `PromiseBB.resolve(linuxPath)` in the else branch — change `linuxPath` to the result of the async call only in the else branch |
| `electron-builder.config.json` target changes | `win` config is a separate block — no overlap | The `linux` target block is independent of the `win` block; change only the `linux` target |
| Auto-updater `APPIMAGE` gate | Windows auto-updater uses `NSIS` path, not AppImage | Gate is `process.platform === 'linux' && process.env.APPIMAGE`; Windows path unaffected |
| NXM wrapper script generates `appPath` conditionally | Windows uses registry-based `setAsDefaultProtocolClient` | The wrapper script is only generated in the Linux code path (`nxm.ts` is never called on Windows) |
| `extraResources` split into per-platform | Moving NSIS scripts to `win.extraResources` removes them from Linux build only | `win.extraResources` is merged with top-level by electron-builder; Windows build gets them either way |

---

## Sources

- Codebase audit (HIGH confidence):
  - `src/renderer/src/util/linux/steamPaths.ts` — Steam path detection
  - `src/renderer/src/util/linux/proton.ts` — Proton prefix resolution
  - `src/renderer/src/util/protocolRegistration/linux/nxm.ts` — NXM registration
  - `src/renderer/src/util/protocolRegistration/linux/common.ts` — xdg-settings helpers
  - `src/renderer/src/util/Steam.ts` — Steam game enumeration
  - `src/main/electron-builder.config.json` — build configuration
  - `extensions/local-gamesettings/src/util/gameSupport.ts` — `mygamesPath()` implementation
  - `src/main/src/Application.ts` — cold-start and second-instance handling
- Electron issue tracker (MEDIUM confidence):
  - electron/electron issue search: `setAsDefaultProtocolClient linux appimage xfce` → "default-url-scheme-handler not implemented for xfce" (xdg-settings fallback bug)
  - electron-userland/electron-builder issue #4035: AppImage protocol handler registration
  - electron-userland/electron-builder PR #5175: `%U` argument not passed in AppImage desktop files
- xdg-utils upstream (MEDIUM confidence):
  - xdg-utils issue #279: generic fallback bug affecting non-mainstream DEs (already referenced in `nxm.ts` comments)
- electron-builder auto-update docs (MEDIUM confidence):
  - `APPIMAGE env is not defined` warning documented in electron-builder update docs
  - `latest-linux.yml` only generated for AppImage target, not zip
- ValveSoftware/SteamOS issue tracker (MEDIUM confidence):
  - Issue confirming `/etc` resets on SteamOS when exiting Desktop Mode
  - Multiple issues confirming read-only rootfs (`ostree` immutable system)
- NexusMods.App reference implementation (HIGH confidence):
  - `src/NexusMods.Backend/OS/LinuxInterop.Protocol.cs` — xdg-settings + wrapper script pattern
  - `src/NexusMods.Backend/RuntimeDependency/XDGSettingsDependency.cs` — dependency checks
  - Already referenced in `nxm.ts` and `common.ts` — directly validated against the same pattern
