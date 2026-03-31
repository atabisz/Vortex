# Feature Landscape: Vortex Linux v2.0

**Domain:** Electron mod manager — Linux usability milestone
**Researched:** 2026-03-31
**Scope:** Steam/Proton detection, Linux packaging/distribution, NXM protocol handler

---

## Category 1: Steam/Proton Game Detection

### What's Already Built (v1.0 Foundation)

- `steamPaths.ts` probes 6 Steam install locations in order: XDG standard, Debian symlink, Flatpak (`~/.var/app/com.valvesoftware.Steam/data/Steam`), Flatpak alternate XDG path, Snap, and legacy `~/.steam/steam`.
- `proton.ts` implements: `detectProtonUsage()` (checks `compatdata/{appid}/`), `getConfiguredProtonName()` (reads `config.vdf`), `resolveProtonPath()` (3-pass: custom tools, exact match, fuzzy scan), `findLatestProton()` (fallback).
- `Steam.ts` already calls `getProtonInfo()` per game entry on Linux and attaches `usesProton`, `compatDataPath`, `protonPath` to every `ISteamEntry`.
- `libraryfolders.vdf` parsing finds additional Steam library roots beyond the base install.

### What STAM-01 Through STAM-05 Require

**STAM-01: VDF parsing on Linux (standard + Flatpak paths)**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `libraryfolders.vdf` parsed from native Steam path | Table stakes | Low | Already implemented in `Steam.ts:resolveSteamPaths()` |
| `libraryfolders.vdf` parsed from Flatpak Steam path | Table stakes | Low | `steamPaths.ts` includes Flatpak path; needs integration test |
| Silent fallback when VDF parse fails | Table stakes | Low | Already has `.catch()` with graceful empty return |
| Multiple library roots discovered (e.g., game on external drive) | Table stakes | Low | VDF parsing already handles `{0: {path:...}, 1: {path:...}}` structure |

**STAM-02: Flatpak Steam path resolution**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| Flatpak data path `~/.var/app/com.valvesoftware.Steam/data/Steam` checked | Table stakes | Low | Already in `getLinuxSteamPaths()` |
| Flatpak XDG path `~/.var/app/.../local/share/Steam` checked | Table stakes | Low | Already in `getLinuxSteamPaths()` |
| Flatpak Steam `steamapps/` reads .acf manifests correctly | Table stakes | Low | Same `.acf` format regardless of Flatpak vs native |
| Flatpak Steam `compatdata/` resolution for Proton prefixes | Table stakes | Low | Path constructed relative to steamAppsPath, format identical |
| Detection when both native and Flatpak Steam are installed | Differentiator | Medium | Current code takes first valid path; should prefer native, fall back to Flatpak |

Edge case: Flatpak Steam's `steamapps/` directory is inside the sandbox at `~/.var/app/com.valvesoftware.Steam/`. Vortex running as a non-Flatpak process has direct filesystem access to this path — no sandbox escaping needed.

**STAM-03: Proton prefix path resolution**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `compatdata/{appid}/` detected as Proton game marker | Table stakes | Low | Already in `detectProtonUsage()` |
| Wine prefix path returned as `compatdata/{appid}/pfx/` | Table stakes | Low | Already in `getWinePrefixPath()` |
| Proton version resolved from `config.vdf` `CompatToolMapping` | Table stakes | Low | Already in `getConfiguredProtonName()` |
| GE-Proton (custom) resolved via `compatibilitytools.d/` | Table stakes | Low | Already in `resolveProtonPath()` first pass |
| Fallback to latest installed Proton when config.vdf unavailable | Table stakes | Low | Already in `findLatestProton()` |
| Proton tool path used to build `proton run <exe>` command | Table stakes | Low | Already in `buildProtonCommand()` |
| `STEAM_COMPAT_DATA_PATH` and `WINEPREFIX` env vars set | Table stakes | Low | Already in `buildProtonEnvironment()` |

Edge case: Some users run games through Proton Experimental which shows as `proton_experimental` in `config.vdf` but lives at `Proton - Experimental/` on disk. The fuzzy keyword match in `resolveProtonPath()` handles this.

**STAM-04: `{mygames}` variable resolution inside Wine prefix on Linux**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `{mygames}` resolves to `documents/My Games` on Windows (existing) | Table stakes | None | `gameSupport.ts:210`: `path.join(getVortexPath("documents"), "My Games")` |
| `{mygames}` resolves to Wine prefix `Documents/My Games` on Linux | **Table stakes** | **Medium** | **Gap: Electron `app.getPath("documents")` on Linux returns `~/Documents`, NOT the Wine prefix path** |
| Detection of whether a game's save/config path is inside Wine prefix | Table stakes | Medium | Need to check if game uses Proton, then redirect documents path |
| Wine prefix documents path: `compatdata/{appid}/pfx/drive_c/users/steamuser/Documents` | Table stakes | Low | Standard Wine/Proton prefix layout — well-documented |
| Fallback when Wine prefix doesn't exist yet (first launch) | Table stakes | Low | Proton creates prefix on first game run; Vortex shouldn't create it |

Critical insight: On Linux, `app.getPath("documents")` returns `~/Documents` (the host XDG documents dir). For Proton games, the game's `.ini` files live inside the Wine prefix at `steamuser/Documents/My Games/...`, not `~/Documents/My Games/`. The `{mygames}` variable resolution in `ini_prep/gameSupport.ts` will silently point to the wrong location unless there is per-game, platform-aware path overriding. This is the single most complex item in the STAM category.

**STAM-05: Top-4-title game extension audit**

| Game | Detection Method | Complexity | Linux-Specific Issues |
|------|-----------------|------------|----------------------|
| Skyrim SE | Steam appid `489830`, `.acf` manifest | Low | `{mygames}` points to `~/Documents/My Games/Skyrim Special Edition` (wrong on Linux — needs Wine prefix redirect) |
| Fallout 4 | Steam appid `377160`, `.acf` manifest | Low | Same `{mygames}` issue; also has `Fallout4.ini` / `Fallout4Custom.ini` in Wine prefix |
| Cyberpunk 2077 | Steam appid `1091500`, `.acf` manifest | Low | Saves/config in `~/AppData/Local/CD Projekt Red/Cyberpunk 2077` on Windows — maps to Wine prefix on Linux |
| Stardew Valley | Steam appid `413150`, `.acf` manifest | Low | Runs natively on Linux (not through Proton) — saves in `~/.config/StardewValley`; no Wine prefix needed |

Key finding: Stardew Valley has a native Linux build. It does not go through Proton. Its save path is `~/.config/StardewValley/` or `~/.local/share/StardewValley/`. The game extension should not attempt Wine prefix resolution for it.

### Anti-Features (Steam/Proton)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-creating Wine prefixes | Proton manages prefix creation; creating one manually can corrupt game state | Check for existence, error gracefully if absent |
| Heroic Launcher detection | Explicitly deferred to Phase 4 per PROJECT.md | Leave as `// TODO: Phase 4` comment |
| GOG/itch.io Linux native game support | Separate track, Phase 4+ | Leave Windows code untouched |
| Parsing `localconfig.vdf` for playtime or extra metadata | Not required for mod installation; adds fragile parsing surface | Use `appmanifest_*.acf` only |

---

## Category 2: Linux Packaging and Distribution

### Existing State

The `electron-builder.config.json` has a `linux` section with `target: ["zip"]`. A Flatpak manifest exists at `flatpak/com.nexusmods.vortex.yaml` (uses `org.electronjs.Electron2.BaseApp`, Node 22, dotnet9). The `package.yml` CI workflow is Windows-only (`runs-on: windows-latest`).

### DIST-01 Through DIST-04 Requirements

**DIST-01: AppImage artifact**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `electron-builder` `linux.target` includes `AppImage` | Table stakes | Low | Add `"AppImage"` to target array alongside `"zip"` |
| AppImage desktop integration category set | Table stakes | Low | `linux.category` already set to `"Network;Development;Game;"` |
| AppImage `MimeType=x-scheme-handler/nxm` declared | Table stakes | Low | Already in `linux.mimeTypes` |
| AppImage runs on Steam Deck Desktop Mode | Table stakes | Low | AppImage is self-contained; no system libs needed beyond what Electron bundles |
| AppImage auto-updater integration (squashfs delta updates) | Differentiator | High | Requires `AppImageUpdate` or `electron-updater` AppImage channel; different binary format from zip |

Notes on AppImage: electron-builder 24.x supports AppImage natively. The `asarUnpack` list already includes Linux-specific items (`.so` files, Linux ELF binaries). No changes needed to `asarUnpack` for AppImage. AppImage embeds a `.desktop` file automatically from the `linux` config.

Steam Deck specifics: The Deck runs SteamOS 3.x (Arch-based). AppImages work in Desktop Mode without modification. Gaming Mode does not support arbitrary app launching directly. Users must switch to Desktop Mode to install Vortex.

**DIST-02: .deb artifact**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `electron-builder` `linux.target` includes `deb` | Table stakes | Low | Add `"deb"` to target array |
| `.deb` installs to `/opt/Vortex` by default | Table stakes | Low | electron-builder default is `/opt/{appName}` for deb targets |
| `.desktop` file installed system-wide via `.deb` | Table stakes | Low | electron-builder handles this automatically for deb |
| `nxm://` MIME type declared in `.deb` desktop entry | Table stakes | Low | Follows from `linux.mimeTypes` config |
| `.deb` `postinst` script runs `update-desktop-database` | Table stakes | Low | electron-builder generates this automatically |
| `maintainer` field set correctly in `.deb` control | Table stakes | Low | Already set in `linux.maintainer` |

Note: `.deb` target does NOT require `dpkg-dev` on the build machine since electron-builder generates the package itself. The `ubuntu-latest` CI runner has all required tools.

**DIST-03: GitHub Actions CI uploads Linux artifacts**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `package.yml` or new `package-linux.yml` job runs on `ubuntu-latest` | Table stakes | Low | Add job or new workflow |
| Linux build job runs `pnpm run package:nosign` with Linux targets | Table stakes | Low | `--linux AppImage deb` flags via electron-builder |
| AppImage artifact uploaded via `actions/upload-artifact` | Table stakes | Low | Mirror pattern from Windows `artifactNameInstaller` step |
| `.deb` artifact uploaded via `actions/upload-artifact` | Table stakes | Low | Same as above |
| Linux artifacts attached to GitHub draft release | Differentiator | Low | Add to `softprops/action-gh-release` files list |
| Linux build skips code-signing secrets | Table stakes | Low | `package:nosign` already exists; no `ES_*` secrets needed |

Note on `prepare-dist-package.mjs`: This script prepares the `dist/` directory before electron-builder runs. It must be verified to be platform-safe (no `VC_redist.x64.exe` download attempted on Linux runners). The `win.extraResources` in `electron-builder.config.json` is scoped to the `win` block — Linux builds skip it correctly.

**DIST-04: Auto-updater `latest-linux.yml`**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `latest-linux.yml` generated by electron-builder during Linux package | Table stakes | Low | electron-builder auto-generates `latest-linux.yml` when AppImage target is built |
| `latest-linux.yml` references AppImage artifact by filename | Table stakes | Low | Automatic from electron-builder |
| `latest-linux.yml` uploaded to GitHub release alongside `.exe` | Table stakes | Low | Add to release files list in `package.yml` |
| `electron-updater` checks `latest-linux.yml` on Linux at startup | Table stakes | Medium | Requires `electron-updater` to be configured with Linux feed URL |
| Auto-updater download shows progress in UI | Differentiator | Medium | Same UX as Windows updater; already implemented in renderer |
| Flatpak build skips auto-updater (`IGNORE_UPDATES=yes`) | Table stakes | None | Already in `flatpak/com.nexusmods.vortex.yaml` finish-args |

Important: `electron-updater` supports AppImage auto-update. For v2.0, generating the `latest-linux.yml` file is the requirement — full delta-update validation can be deferred.

### Packaging Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Flatpak as primary distribution target for v2.0 | Flatpak manifest exists but has sandbox/xdg-settings complexity; not yet on Flathub | Ship AppImage + deb; Flatpak manifest exists for future Flathub submission |
| Snap package | Snap has additional confinement issues with Electron; poor DX for modding workflows | Not needed; AppImage covers portable case |
| RPM package | Adds build complexity; Fedora/RHEL users can use AppImage | Defer or let community package |
| Code signing on Linux | No standard Linux app signing; `.deb` packages are not code-signed like .exe | Skip; only Windows build signs |

---

## Category 3: NXM Protocol Handler

### What's Already Built

The codebase contains a fully implemented NXM protocol handler for Linux:

- `protocolRegistration/linux/nxm.ts`: Full implementation using `xdg-settings set default-url-scheme-handler nxm <desktop-id>` and `update-desktop-database`.
- `protocolRegistration/linux/common.ts`: Flatpak-aware `flatpak-spawn --host` wrapper for `xdg-settings` calls.
- Desktop entry generation for dev builds: `com.nexusmods.vortex.dev.desktop` with `MimeType=x-scheme-handler/nxm`.
- Wrapper script (`com.nexusmods.vortex.dev.sh`) that handles `LD_LIBRARY_PATH` cleanup (prevents library conflicts from browser-launched instances), NixOS `XDG_DATA_DIRS` preservation, and conditional `--download %u` passing.
- `flatpak/com.nexusmods.vortex.desktop` with `MimeType=x-scheme-handler/nxm;` already declared.

### PROT-01 and PROT-02 Requirements

**PROT-01: NXM handler on standard Linux (xdg-open)**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `xdg-settings set default-url-scheme-handler nxm <desktop-id>` on "Handle Nexus Links" toggle | Table stakes | None | Already fully implemented |
| `.desktop` file written to `~/.local/share/applications/` for dev builds | Table stakes | None | Already implemented in `ensureDevDesktopEntry()` |
| `update-desktop-database ~/.local/share/applications/` called after desktop file change | Table stakes | None | Already in `refreshDesktopDatabase()` |
| Idempotent registration (no-op if already default) | Table stakes | None | Already checks previous handler before setting |
| `xdg-settings get default-url-scheme-handler nxm` queried to detect current handler | Table stakes | None | Already in `getDefaultUrlSchemeHandler()` |
| `--download nxm://...` argument parsed by Vortex on startup | Table stakes | Low | Existing Windows code path; needs Linux integration test |
| GNOME support via xdg-settings | Table stakes | None | `xdg-settings` is DE-agnostic; works on GNOME 40+ |
| KDE Plasma support via xdg-settings | Table stakes | None | Same as GNOME — `xdg-settings` is the standard |
| Handler works from Firefox/Chromium "Download with Manager" | Table stakes | Low | Relies on browser calling `xdg-open nxm://...`; needs integration test |
| Non-mainstream DE support (Hyprland, i3, Sway) | Differentiator | Low | Wrapper script hack already addresses xdg-utils issue #279 |

Known issue documented in code: `xdg-utils` has a generic fallback bug (issue #279) for non-mainstream desktop environments. The wrapper script approach already mitigates this. NixOS users need `XDG_DATA_DIRS` preserved — already handled in wrapper generation.

**PROT-02: NXM handler on SteamOS/KDE Plasma**

| Feature | Category | Complexity | Notes |
|---------|----------|------------|-------|
| `xdg-settings` available on SteamOS 3.x | Table stakes | Low | SteamOS 3.x (Arch-based) ships xdg-utils; confirmed by Steam itself using it |
| KDE Plasma `mimeapps.list` updated via `xdg-settings` | Table stakes | None | `xdg-settings set` writes to `~/.config/mimeapps.list` which KDE respects |
| Flatpak build uses `flatpak-spawn --host xdg-settings` for handler registration | Table stakes | None | Already fully implemented in `common.ts:setDefaultUrlSchemeHandler()` |
| `IS_FLATPAK=true` env var detected when running as Flatpak | Table stakes | None | Already set via `finish-args --env=IS_FLATPAK=true` in flatpak YAML |
| `--talk-name=org.freedesktop.Flatpak` permission present in Flatpak manifest | Table stakes | None | Already in `flatpak/com.nexusmods.vortex.yaml` finish-args |
| nxm:// link clicked in Steam Browser (SteamOS) triggers handler | Differentiator | Medium | Steam's internal browser may handle protocols differently; needs validation |
| Handler survives SteamOS system update (immutable OS) | Table stakes | Low | `~/.local/share/applications/` and `~/.config/mimeapps.list` are in user home — survives OS updates |

Steam Deck specific notes:
- SteamOS uses KDE Plasma in Desktop Mode. The `xdg-settings` approach is correct.
- Gaming Mode (Big Picture) does not have a browser that supports nxm:// links; users must use Desktop Mode.
- SteamOS is immutable — system dirs are read-only. All registration happens in user home. This is already correct.
- The Flatpak sandbox `--talk-name=org.freedesktop.Flatpak` allows `flatpak-spawn --host` to escape the sandbox for `xdg-settings` calls.

**PROT-02 Validation Risk Table**

| Test Case | Risk Level | Notes |
|-----------|-----------|-------|
| KDE Plasma desktop: click nxm:// in Firefox | Low | Standard path |
| KDE Plasma desktop: click nxm:// in Chromium | Low | Standard path |
| SteamOS Desktop Mode: click nxm:// in Firefox | Medium | Needs hardware or SteamOS VM |
| SteamOS Desktop Mode: click nxm:// in Steam Browser | High | Steam's built-in browser may not delegate to xdg-open |
| Flatpak build: flatpak-spawn escapes sandbox to set handler | Medium | Code reviewed; needs live Flatpak install test |
| Dev build on SteamOS: wrapper script runs correctly | Medium | Needs test on SteamOS |

### Protocol Handler Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Removing/unsetting handler on deregistration | Community expectation is "last launched wins"; deregistration should be user-explicit | Log that deregistration is external; already implemented this way |
| Registering `nxm` at system level (`/usr/share/applications/`) | Requires root; breaks on immutable filesystems | User-local `~/.local/share/applications/` only |
| Using Electron's `setAsDefaultProtocolClient` on Linux | Electron's built-in does not work for Linux | Already bypassed — Linux uses custom xdg-settings path |
| Supporting `nxm+https://` or other protocol variants | Only `nxm://` is used by Nexus Mods | Handle `nxm` only |

---

## Feature Dependencies

```
STAM-01 (VDF parsing)
  └── STAM-02 (Flatpak paths) — path constants only, no parse changes
  └── STAM-03 (Proton prefix) — depends on steamAppsPath from STAM-01
        └── STAM-04 ({mygames} in Wine prefix) — depends on compatDataPath from STAM-03
              └── STAM-05 (game extension audit) — depends on STAM-04 for Bethesda games

DIST-01 (AppImage) — electron-builder config change, no code deps
  └── DIST-04 (latest-linux.yml) — AppImage must exist for auto-updater to generate yml
DIST-02 (.deb) — independent of AppImage
DIST-03 (CI artifacts) — depends on DIST-01 and DIST-02 being buildable

PROT-01 (xdg-open, standard Linux) — no deps on STAM or DIST
  └── PROT-02 (SteamOS validation) — depends on PROT-01 being correct; validates Flatpak path
```

NXM handler registration does NOT require packaging to be done first for development. The dev desktop entry approach (already implemented) lets NXM work without an AppImage or .deb install. Packaging is only required to validate that the packaged `.desktop` file installs and registers correctly.

---

## MVP Recommendation by Category

**Steam/Proton (STAM-01 to STAM-05):**
- Prioritize: STAM-01/02/03 — infrastructure nearly complete; mainly needs integration tests
- STAM-04 (`{mygames}` in Wine prefix) is the highest complexity item — requires platform-conditional path logic in `ini_prep/gameSupport.ts`
- STAM-05 game audit is table stakes validation, not new code (except `{mygames}` fix for Bethesda games)
- Validate Stardew Valley first: native Linux, no Wine prefix, simplest case

**Packaging (DIST-01 to DIST-04):**
- DIST-01/02 are low-complexity config changes to `electron-builder.config.json` (add `"AppImage"` and `"deb"` to targets)
- DIST-03 requires a new/modified GitHub Actions job — straightforward
- DIST-04 is automatic once DIST-01 builds succeed

**Protocol (PROT-01 to PROT-02):**
- PROT-01 implementation is complete — the work is integration testing and `--download` argument parsing verification on Linux
- PROT-02 validation on SteamOS is the highest risk; Steam Browser behavior is unknown

---

## Sources

- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/linux/steamPaths.ts`
- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/linux/proton.ts`
- Codebase: `/home/alex/src/Vortex/src/renderer/src/util/protocolRegistration/linux/`
- Codebase: `/home/alex/src/Vortex/src/main/electron-builder.config.json`
- Codebase: `/home/alex/src/Vortex/flatpak/com.nexusmods.vortex.yaml`
- Codebase: `/home/alex/src/Vortex/.github/workflows/package.yml`
- Codebase: `/home/alex/src/Vortex/src/renderer/src/extensions/ini_prep/gameSupport.ts`
- Codebase: `/home/alex/src/Vortex/src/main/src/getVortexPath.ts`
- Code references in `nxm.ts`: NexusMods.App Linux protocol implementation, xdg-utils issue #279
- Confidence: HIGH — all claims based on direct codebase inspection
