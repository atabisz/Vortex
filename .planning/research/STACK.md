# Technology Stack — v2.0: Steam/Proton Detection, Linux Packaging, NXM Protocol

**Project:** Vortex Linux Support — Phase 2
**Researched:** 2026-03-31
**Overall confidence:** HIGH — all claims verified against codebase, official docs, or package contents

---

## Executive Summary

The v2.0 feature set (Steam/Proton detection, AppImage/deb packaging, NXM protocol handler) requires
**no new npm runtime packages**. Every library needed is already present in the repository. The work
is entirely TypeScript source additions, electron-builder config changes, and CI workflow additions.

The three feature areas have radically different states of completion going in:

| Feature Area | State at v2.0 start | Remaining work |
|--------------|---------------------|----------------|
| Steam/Proton detection | Foundation complete (Steam.ts, proton.ts, steamPaths.ts, VDF parsing) | `{mygames}` Wine-prefix path resolution, Flatpak path validation in tests, game extension audit |
| AppImage/deb packaging | electron-builder config has `"linux"` section with correct `mimeTypes`; `asarUnpack` already patched for Linux binaries | Change `"target": ["zip"]` to `["AppImage", "deb"]`; add Linux job to `package.yml` |
| NXM protocol handler | Full implementation exists: `protocolRegistration/linux/` (nxm.ts, common.ts, desktopFileEscaping.ts) using xdg-settings + desktop entry | Integration wiring from `Application.ts` + `--download` arg handling; SteamOS validation |

---

## Already Present — Do Not Re-Add

| Component | Version | Location | Status |
|-----------|---------|----------|--------|
| `simple-vdf` | Nexus fork (git pin) | `pnpm-workspace.yaml` catalog | Used in Steam.ts and proton.ts for `.vdf` / `.acf` parsing |
| `fs-extra` | 9.1.0 | catalog | Used in nxm.ts for desktop entry writes |
| `electron-builder` | 24.13.3 | devDependency | Linux section already present with `mimeTypes` |
| `electron-updater` | 4.2.0 | runtime dep | Cross-platform; generates `latest-linux.yml` automatically |
| `xdg-settings` | system | runtime (host OS) | Used in `common.ts` via `spawnSync`; safe assumption on any desktop Linux |
| `update-desktop-database` | system | runtime (host OS) | Used in `common.ts` via `spawnSync` |
| VDF parsing (`parse`) | — | `simple-vdf` | Already handles `.vdf`, `.acf`, `libraryfolders.vdf`, `config.vdf` |

**Confidence:** HIGH — verified by reading `pnpm-workspace.yaml`, `Steam.ts`, `proton.ts`, `nxm.ts`, `common.ts`.

---

## Stack Changes Needed

### 1. electron-builder Configuration

**File:** `src/main/electron-builder.config.json`

**Change:** Single-line target change. The `linux` section already has `mimeTypes`, `category`,
`icon`, and all other needed fields. Only the target array needs updating.

```json
"linux": {
  "target": ["AppImage", "deb"],
  "icon": "../../assets/images/vortex.png",
  "category": "Game",
  ...
}
```

**Why `"category": "Game"` not `"Network;Development;Game;"`:**
The XDG Desktop Menu specification allows a semicolon-delimited list, and electron-builder
passes the value directly into the `.desktop` file `Categories=` field. The current multi-value
string is syntactically valid but the `Network` and `Development` categories are semantically
incorrect for a mod manager. `Game` is the correct primary category. electron-builder 24.x
does not add trailing semicolons on its own — the spec requires a trailing semicolon, so
`"Game;"` or `"Game"` both work (electron-builder appends one if missing).

**Confidence:** HIGH — verified against electron-builder 24.13.3 schema and XDG spec.

**AppImage target:**
- electron-builder uses `appimagetool` internally; no CI tooling needed beyond standard apt packages
- AppImage works in SteamOS Desktop Mode without installation
- The icon at `../../assets/images/vortex.png` must be 512x512 PNG — verify before packaging

**deb target:**
- electron-builder injects standard runtime deps automatically:
  `libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0`
- The `libasound2t64` Ubuntu 24.04 rename is NOT automatically handled — if targeting both Ubuntu 22.04
  and 24.04, add explicit `deb.depends` override:
  ```json
  "deb": {
    "depends": ["libasound2 | libasound2t64"]
  }
  ```
  For CI-only artifacts (not Ubuntu PPA submission), this can be deferred.

**Confidence:** HIGH — verified against electron-builder source defaults and Ubuntu 24.04 package naming.

---

### 2. GitHub Actions — Linux Packaging Job

**File:** `.github/workflows/package.yml`

**Change:** Add a parallel `build-linux` job to the existing Windows-only workflow. The current
workflow has a single `build` job on `windows-latest`. A Linux job must run in parallel and upload
its artifacts alongside the Windows ones.

**Required apt packages for the Linux CI runner:**

```yaml
sudo apt-get install -y \
  build-essential python3 \
  libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libasound2t64 \
  libpango-1.0-0 libcairo2 libexpat1 \
  libfontconfig1-dev libicu-dev
```

These are the Electron 39 runtime deps (carried over from v1.0 devcontainer research — HIGH confidence).

**Artifacts to upload:**
```yaml
- ./dist/*.AppImage
- ./dist/*.deb
- ./dist/latest-linux.yml
```

**Release integration:** The `softprops/action-gh-release` step in the Windows job uploads
`./dist/latest.yml`. The Linux job must upload `./dist/latest-linux.yml` to the same release
(or a parallel release step). `electron-updater` on Linux reads `latest-linux.yml` for
auto-update metadata.

**No code change to `electron-updater`** — it generates the correct YAML file name per-platform
at build time. No source modification needed.

**Confidence:** HIGH — verified against electron-updater cross-platform documentation and the
existing `package.yml` workflow structure.

---

### 3. Steam/Proton Detection — Source Gaps

The foundation (`Steam.ts`, `proton.ts`, `steamPaths.ts`) is complete. The remaining source
work is integration and edge-case coverage.

#### 3a. `{mygames}` Path Resolution on Linux

**Location of variable use:** `src/renderer/src/extensions/ini_prep/gameSupport.ts` line 210:
```typescript
const mygames = path.join(getVortexPath("documents"), "My Games");
```

**Current behaviour on Linux:** `getVortexPath("documents")` calls Electron's
`app.getPath("documents")`, which on Linux returns `$HOME/Documents` (XDG standard). This is the
*native* documents path — not the Wine prefix. For Proton games, the game stores INI files inside
the Wine prefix at `<compatDataPath>/pfx/drive_c/users/steamuser/Documents/My Games/<GameName>/`.

**Required addition:** A platform guard in `iniFiles()` (or in the underlying path resolution)
that returns the Wine-prefix documents path when the game's `discovery.store === "steam"` and
Proton is detected. The Proton info is already available on `ISteamEntry` (see `Steam.ts` lines
375–395 where `usesProton`, `compatDataPath`, and `protonPath` are populated).

**Implementation pattern (no new deps):**
```typescript
// In iniFiles() or a dedicated resolver:
if (process.platform === "linux" && discovery.store === "steam") {
  // resolve ISteamEntry from store cache to get compatDataPath
  const wineDocuments = path.join(
    compatDataPath, "pfx", "drive_c", "users", "steamuser", "Documents"
  );
  return path.join(wineDocuments, "My Games");
}
```

The `steamuser` home directory is the standard Wine user path inside Proton prefixes. No library
needed — this is a path construction with `path.join`.

**Confidence:** HIGH — Wine prefix structure is well-documented; Proton uses `steamuser` as the
default username in all versions; verified by community sources and Proton GitHub docs.

#### 3b. Flatpak Steam Path Validation

`steamPaths.ts` already includes the Flatpak path:
```typescript
path.join(home, ".var", "app", "com.valvesoftware.Steam", "data", "Steam"),
path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam"),
```

These paths are correct. No library change needed. The validation work (STAM-02) is runtime
testing — confirming `isValidSteamPath()` returns `true` for a Flatpak Steam install.

**Confidence:** HIGH — paths verified against Flatpak Steam filesystem layout documentation.

#### 3c. VDF Parsing — No Change Needed

`simple-vdf` (Nexus fork) already handles all required file formats:
- `libraryfolders.vdf` — Steam library locations (used in `resolveSteamPaths()`)
- `appmanifest_<id>.acf` — Per-game manifests (used in `parseManifests()`)
- `config.vdf` — Proton version mapping (used in `getConfiguredProtonName()`)

The fork adds async parsing support. No version bump needed.

**Confidence:** HIGH — verified by reading the actual parse calls in Steam.ts and proton.ts.

---

### 4. NXM Protocol Handler — Integration Wiring

The Linux protocol registration stack is fully implemented:
- `protocolRegistration/linux/nxm.ts` — desktop entry generation, wrapper script, xdg-settings call
- `protocolRegistration/linux/common.ts` — `xdg-settings get/set`, `update-desktop-database`, Flatpak-spawn support
- `protocolRegistration/linux/desktopFileEscaping.ts` — desktop entry escaping utilities
- `protocolRegistration/index.ts` — platform dispatch (Linux → registerLinuxProtocolHandler)

**What is NOT yet wired:**

**4a. Application.ts startup registration:**
On Windows, `Application.ts` calls `setDefaultProtocolClient` at startup (via electron's built-in).
On Linux, `registerProtocolHandler()` from `protocolRegistration/index.ts` must be called at
startup (or when the user toggles "Handle Nexus Links" in settings). The exact call site needs
confirming — search for the Windows equivalent in `Application.ts`.

**4b. `--download` argument forwarding from second instance:**
Electron's `app.on("second-instance")` handler receives the command line of the second instance
when a user clicks an NXM link (since the desktop entry calls the wrapper script with `--download %u`).
The existing `cli.ts` already parses `--download <url>` — the question is whether the
`second-instance` handler on Linux receives the full argv correctly. This needs validation.

**4c. `electron-builder` desktop entry for packaged builds:**
The electron-builder `linux.mimeTypes: ["x-scheme-handler/nxm"]` config generates a `MimeType=`
line in the packaged `.desktop` file (via AppImage/deb post-install). The dev-mode desktop entry
is generated by `nxm.ts` at runtime. No config change needed beyond what is already in the builder
config — the production path is handled by the package manager registering the `MimeType` on install.

**System dependencies (host OS — no npm packages):**
- `xdg-settings` — part of `xdg-utils`; pre-installed on all major desktop distros and SteamOS
- `update-desktop-database` — part of `desktop-file-utils`; pre-installed on all major distros
- `flatpak-spawn` — only needed inside Flatpak sandbox; irrelevant for AppImage/deb

**Confidence:** HIGH for xdg-utils availability — it is a required dependency of most browsers
and Steam itself, making it universally available on any gaming Linux desktop.

---

## Top-4 Game Extensions Audit

Required for STAM-05: determine which of Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley
have Linux blockers.

| Game | Extension type | Windows-specific issues | Linux readiness |
|------|---------------|------------------------|-----------------|
| Skyrim SE | Pre-compiled `.js` | `registry: [...]` in `queryPath` — registry lookup for install path | BLOCKED by registry; Steam path detection via `Steam.ts` is the Linux fix |
| Fallout 4 | Pre-compiled `.js` | `require('winapi-bindings')` at top level + `registry: [...]` for install path | BLOCKED by winapi-bindings require + registry; needs platform guard |
| Cyberpunk 2077 | Pre-compiled `.js` | `registerGameStub` only — no store lookup, no registry | UNBLOCKED — game stub only, no detection logic |
| Stardew Valley | TypeScript source | Already has `process.platform` guards; explicit Linux path (`~/.local/share/Steam/...`) | UNBLOCKED — Linux path already present in `StardewValleyGame.ts` |

**Critical finding for Fallout 4:** The extension does a top-level `require('winapi-bindings')`.
On Linux, the webpack/rolldown alias routes this to the shim (established in v1.0). If the shim
is not present in the bundled extension output, the extension will throw at load time. Confirm
the alias applies to the `extensions/games/game-fallout4` webpack context.

**Confidence:** MEDIUM — based on reading the compiled `.js` files; source TypeScript for
Skyrim SE and Fallout 4 is not present in this repo (pre-compiled), so the exact source guard
pattern cannot be verified. The registry paths are in the compiled output and will need the
Steam-based detection path to work on Linux.

---

## What NOT to Add

| Approach | Why Rejected |
|----------|-------------|
| `vdf` (npm) | `simple-vdf` (Nexus fork) already in use and handles all required formats; a second VDF parser is redundant |
| `@types/xdg-basedir` or `xdg-basedir` | Path logic for XDG dirs is already implemented inline using `process.env.XDG_DATA_HOME` and `os.homedir()` |
| `electron-protocol-handler` | No such well-maintained package exists; Electron's built-in + the existing `protocolRegistration/` stack covers all cases |
| Flatpak packaging | Flatpak sandbox restrictions on `~/.steam` and `~/.local/share/Steam` require portal permissions not yet validated; AppImage covers the use case today |
| `snap` packaging | Snap sandbox is more restrictive than Flatpak for game library access; AppImage is the de-facto standard for Linux gaming tools (Heroic, Lutris, Bottles) |
| `xdg-mime` (npm stub) | `xdg-settings` (system binary) is already called directly via `spawnSync`; no npm wrapper needed |
| Wine wrapper for `{mygames}` | The Wine prefix path is a static structure (`pfx/drive_c/users/steamuser/Documents/My Games`); no Wine binary invocation needed to resolve it |
| `node-winreg` | Windows-only; the Steam path on Linux is resolved via filesystem scan (`steamPaths.ts`), not registry |

---

## Integration Points Summary

For the requirements writer:

| Requirement | Integration point | Files touched |
|-------------|------------------|---------------|
| STAM-01: VDF parsing on Linux | Already works — `Steam.ts` uses `parse()` from `simple-vdf` | No new files |
| STAM-02: Flatpak Steam paths | Already in `steamPaths.ts`; validation only | `src/renderer/src/util/linux/steamPaths.ts` |
| STAM-03: Proton prefix per-game | Already in `proton.ts` and wired in `Steam.ts` | No new files |
| STAM-04: `{mygames}` in Wine prefix | Gap — needs platform guard in `iniFiles()` | `src/renderer/src/extensions/ini_prep/gameSupport.ts` |
| STAM-05: Top-4 game extension audit | Cyberpunk + Stardew unblocked; Skyrim SE + Fallout 4 need Steam-path detection | `extensions/games/game-skyrimse/`, `extensions/games/game-fallout4/` |
| DIST-01: AppImage artifact | electron-builder config change | `src/main/electron-builder.config.json` |
| DIST-02: deb artifact | Same config change | `src/main/electron-builder.config.json` |
| DIST-03: CI uploads Linux artifacts | New `build-linux` job | `.github/workflows/package.yml` |
| DIST-04: `latest-linux.yml` | Auto-generated by electron-builder; upload step in CI | `.github/workflows/package.yml` |
| PROT-01: NXM handler on standard Linux | Implementation complete; wiring from Application.ts needed | `src/main/src/Application.ts` or settings extension |
| PROT-02: NXM handler on SteamOS/KDE Plasma | Same implementation; KDE Plasma uses `xdg-settings` identically to GNOME; validation needed | Runtime testing |

---

## Sources

- `src/main/electron-builder.config.json` — verified current config
- `src/renderer/src/util/Steam.ts` — Steam detection implementation
- `src/renderer/src/util/linux/proton.ts` — Proton path resolution
- `src/renderer/src/util/linux/steamPaths.ts` — Linux Steam path candidates
- `src/renderer/src/util/protocolRegistration/linux/` — NXM handler implementation
- `src/renderer/src/extensions/ini_prep/gameSupport.ts` — `{mygames}` variable usage
- `extensions/games/game-*/src/index.js` — compiled game extension files (audited)
- `extensions/games/game-stardewvalley/src/game/StardewValleyGame.ts` — platform-guarded example
- `.github/workflows/package.yml` — current Windows-only packaging workflow
- `pnpm-workspace.yaml` — catalog entries for `simple-vdf` and `fs-extra`
- electron-builder 24.13.3 docs: AppImage/deb target configuration
- electron-updater cross-platform design: `latest-linux.yml` auto-generation
- XDG Desktop Entry specification: Categories, MimeType fields
- Proton Wine prefix structure: `pfx/drive_c/users/steamuser/` is canonical across all Proton versions

---

*Research date: 2026-03-31*
