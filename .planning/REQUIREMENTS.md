# Requirements: Vortex Linux Port — Phase 1

**Defined:** 2026-03-30
**Core Value:** `pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine

## v1 Requirements

### Runtime Environment

- [x] **RENV-01**: Devcontainer includes all Electron 39 runtime shared libraries (libglib2.0-0, libnss3, libatk1.0-0, libatk-bridge2.0-0, libcups2, libdrm2, libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3, libxrandr2, libgbm1, libasound2t64, libpango-1.0-0, libcairo2)
- [x] **RENV-02**: `getVortexPath("localAppData")` returns a valid XDG path on Linux (`$XDG_DATA_HOME` or `~/.local/share`) instead of the broken `~/.config/../Local` fallback
- [x] **RENV-03**: `electron-builder.config.json` Windows-only `extraResources` (.exe files) moved to `win.extraResources` so Linux packaging does not fail with ENOENT

### winapi-bindings Shim

- [ ] **WAPI-01**: webpack alias maps `winapi-bindings` → `./util/winapi-shim.ts` on Linux builds — the app reaches the renderer without MODULE_NOT_FOUND crash (covers all 21 import sites with one config change)
- [x] **WAPI-02**: `GetDiskFreeSpaceEx` shim returns valid data via `fs.statfs()` — firststeps_dashlet renders without crashing on first launch
- [x] **WAPI-03**: `GetVolumePathName` shim returns correct path root via `stat.dev` comparison — firststeps_dashlet renders without crashing on first launch
- [x] **WAPI-04**: `ShellExecuteEx` shim throws a clear error on Linux (pkexec integration deferred pending elevation audit)
- [x] **WAPI-05**: All remaining winapi-bindings exports (registry functions, GetProcessList, SetForegroundWindow, file ACL functions) are shimmed as no-ops or safe stubs — no unhandled throw on import

### Native Addons

- [ ] **NADD-01**: `bsatk` native addon compiles for Linux via `@electron/rebuild` in CI (GitHub Actions Linux runner)
- [ ] **NADD-02**: `esptk` native addon compiles for Linux via `@electron/rebuild` in CI
- [ ] **NADD-03**: `loot` native addon compiles for Linux via `@electron/rebuild` in CI
- [ ] **NADD-04**: `bsdiff-node` native addon compiles for Linux via `@electron/rebuild` in CI
- [ ] **NADD-05**: `xxhash-addon` native addon compiles for Linux via `@electron/rebuild` in CI
- [ ] **NADD-06**: `vortexmt` and `gamebryo-savegame` audited for Windows-specific API usage — compilation added to CI if clean, disabled/shimmed with clear error if Windows-only

### FOMOD Installer

- [ ] **FOMD-01**: Linux FOMOD binaries (`ModInstaller.Native.so`, `ModInstallerIPC` ELF) added to `asarUnpack` in `electron-builder.config.json` so they are accessible at runtime
- [ ] **FOMD-02**: `dotnetprobe` Linux ELF added to `asarUnpack` and/or `linux.extraResources`
- [ ] **FOMD-03**: Platform guard in `installer_dotnet/index.ts` that throws on Linux is removed — existing Linux code path is activated
- [ ] **FOMD-04**: FOMOD TCP transport completes a handshake end-to-end on Linux — `ModInstallerIPC` ELF accepts a TCP connection and responds to `TestSupported`

### IPC / Elevation

- [ ] **IPC-01**: `getIPCPath(id)` utility extracted — returns `\\\\?\\pipe\\{id}` on Windows, `path.join(os.tmpdir(), 'vortex-{id}.sock')` on Linux
- [ ] **IPC-02**: `elevated.ts` parent `startIPCServer()` uses `getIPCPath()` — no hardcoded `\\\\?\\pipe` UNC prefix on Linux
- [ ] **IPC-03**: Serialised `elevatedMain` closure uses `getIPCPath()` via passed-in argument — the stringified child process code connects to a Unix socket on Linux, not a named pipe
- [ ] **IPC-04**: Elevation audit complete — documents whether `runElevated()` is called in any startup code path and whether pkexec is needed for Phase 1

## v2 Requirements

### Elevation

- **ELEV-01**: `pkexec` + Unix domain socket elevation model fully implemented — replaces Windows UAC for operations that genuinely require elevated privileges on Linux
- **ELEV-02**: Elevation works on Steam Deck (SteamOS) without requiring a polkit password (deck user has no polkit password by default)

### Steam / Proton Game Management

- **STAM-01**: Vortex detects games installed in Steam libraries on Linux by parsing `~/.steam/steam/steamapps/libraryfolders.vdf`
- **STAM-02**: Flatpak Steam library path (`~/.var/app/com.valvesoftware.Steam/`) detected and enumerated
- **STAM-03**: Proton prefix paths resolved: game AppID → `compatdata/<appid>/pfx/drive_c/` for mod installation
- **STAM-04**: `ini_prep/gameSupport.ts` resolves `{mygames}` to correct Proton Wine prefix path for Bethesda games (not the broken Windows Documents path)
- **STAM-05**: Game extensions audited for the top 4 Proton titles: Skyrim SE, Fallout 4, Cyberpunk 2077, Baldur's Gate 3

### Packaging / Distribution

- **DIST-01**: Vortex packages as AppImage (runs on any distro, Steam Deck Desktop Mode compatible)
- **DIST-02**: Vortex packages as .deb (Ubuntu / Debian / Pop!\_OS native)
- **DIST-03**: GitHub Actions `package.yml` includes Linux runner producing `.AppImage` and `.deb` artifacts
- **DIST-04**: Auto-updater includes Linux artifacts and `latest-linux.yml` metadata in GitHub Releases

### Protocol Handler

- **PROT-01**: NXM protocol handler (`xdg-settings set default-url-scheme-handler nxm vortex.desktop`) validated on SteamOS/KDE Plasma
- **PROT-02**: Clicking a Nexus "Mod Manager Download" link invokes Vortex on Linux

## Out of Scope

| Feature | Reason |
|---------|--------|
| pkexec / polkit implementation | Deferred pending elevation audit — most Steam libraries are user-owned and need no elevation |
| Native Linux game support (GOG, itch.io) | Phase 4 — separate track with different challenges from Proton support |
| Heroic Launcher integration | Phase 4 — scope decision to keep Phase 2 Steam-only |
| Steam Deck Flatpak distribution | Flatpak sandbox restrictions on `~/.steam` need validation before investing; AppImage works in Desktop Mode |
| Wine wrapper for FOMOD | Rejected — fragile, adds Wine dep, slow startup; Linux binaries already exist in npm |
| Large codebase refactors | Core constraint — Windows code paths must be untouched; Linux support is additive only |
| vortexmt / gamebryo-savegame Linux compilation | Conditional on audit — if Windows-specific APIs found, deferred to Phase 2 or later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RENV-01 | Phase 1 | Complete |
| RENV-02 | Phase 1 | Complete |
| RENV-03 | Phase 1 | Complete |
| WAPI-01 | Phase 2 | Pending |
| WAPI-02 | Phase 2 | Complete |
| WAPI-03 | Phase 2 | Complete |
| WAPI-04 | Phase 2 | Complete |
| WAPI-05 | Phase 2 | Complete |
| NADD-01 | Phase 3 | Pending |
| NADD-02 | Phase 3 | Pending |
| NADD-03 | Phase 3 | Pending |
| NADD-04 | Phase 3 | Pending |
| NADD-05 | Phase 3 | Pending |
| NADD-06 | Phase 3 | Pending |
| FOMD-01 | Phase 4 | Pending |
| FOMD-02 | Phase 4 | Pending |
| FOMD-03 | Phase 4 | Pending |
| FOMD-04 | Phase 4 | Pending |
| IPC-01 | Phase 5 | Pending |
| IPC-02 | Phase 5 | Pending |
| IPC-03 | Phase 5 | Pending |
| IPC-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation — all 22 requirements mapped*
