# Vortex Native Linux — Implementation Plan (Proton-First)

## Strategic Framing

**Track 1 (Phases 1–3): Proton/Wine-managed Windows games** — the primary use case for Linux modders. Skyrim, Fallout, Cyberpunk, etc., all running via Steam + Proton. This is where the existing `proton.ts` foundation lives and where ~95% of moddable titles are.

**Track 2 (Phase 4+): Native Linux games** — a smaller, separate use case. Native Linux ports (e.g. open-source games, some GOG/itch.io titles) have different mod structures, no Proton prefix, and no existing Vortex game support. Deferred until Track 1 is stable.

---

## Phase 1 — Make Vortex Launch on Linux

**Goal:** `pnpm run start` works, no crashes, UI renders.

### 1.1 Devcontainer Runtime Libraries (Quick Win — 1 hour)

Add Electron runtime libs to `docker/linux/Dockerfile.devcontainer`:

```
libglib2.0-0, libnss3, libatk1.0-0, libatk-bridge2.0-0, libcups2,
libdrm2, libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3,
libxrandr2, libgbm1, libasound2t64, libpango-1.0-0, libcairo2, libexpat1
```

### 1.2 Compile Portable C++ Addons for Linux (2–4 weeks)

Add Linux targets to CI for each native module repo:

| Addon | Notes |
|-------|-------|
| `bsatk` | BSA archive parsing — no Windows deps |
| `esptk` | ESP plugin parsing — no Windows deps |
| `loot` | Load order — Linux supported upstream |
| `vortexmt` | Audit for Windows deps first |
| `gamebryo-savegame` | Audit for Windows deps first |
| `bsdiff-node` | Binary diff — portable |
| `xxhash-addon` | Hash — already cross-platform |

**`winapi-bindings` — Linux shim (3 days):**

`winapi-bindings` is Windows-only by design and cannot be compiled for Linux. Replace with a platform shim:

- Registry functions → no-ops (existing platform guards mean they're never called on Linux anyway)
- `ShellExecuteEx("runas")` → `pkexec`
- `GetProcessList` / `SetForegroundWindow` → no-ops (UAC monitoring not applicable on Linux)

### 1.3 FOMOD Installer for Linux (1–2 weeks)

The FOMOD installer ships as `.exe` / `.dll` (C# .NET) and cannot run directly on Linux.

**Recommended approach: recompile for Linux using .NET 9.**

- .NET 9 runs natively on Linux — the devcontainer already installs it
- Build the `fomod-installer` repo targeting Linux: produces a Linux executable instead of `.exe`, Linux shared libs instead of `.dll`
- Remove the `if (process.platform !== "win32") throw` guard in `src/renderer/src/extensions/installer_dotnet/index.ts`
- The IPC layer between Electron and the C# process is generic enough to work cross-platform

Alternative options (not recommended):
- **Wine wrapper**: fragile, adds a Wine dependency, slow startup
- **Graceful disable on Linux**: FOMOD mods are ~60% of Nexus Mods content — too large a gap

### 1.4 Elevation / Privileged Operations (1 week)

The current elevation model uses Windows UAC + named pipes. Linux replacement:

- `ShellExecuteEx("runas")` → `pkexec` (handled via the winapi shim above)
- Named pipes (`\\.\pipe\`) → Unix domain sockets (`/tmp/vortex-elevated.sock`)
- `symlink_activator_elevate` extension is already disabled on Linux via `if (process.platform !== "win32") return` guard

**Audit first:** For games installed in `~/.steam` (user-owned), symlinks and hardlinks work without any elevation at all. Elevation may only be needed for edge cases (e.g. games installed system-wide). Confirm the scope before implementing `pkexec` integration.

---

## Phase 2 — Steam/Proton Game Management

**Goal:** Vortex detects Steam games, resolves Proton prefixes, installs mods to the correct locations.

**Scope boundary:** This phase covers Proton-managed Windows games only. Native Linux game support is Phase 4.

### 2.1 Steam Library Detection (1–2 weeks)

- Parse `~/.steam/steam/steamapps/libraryfolders.vdf` → enumerate all Steam library paths
- Enumerate installed games from `appmanifest_*.acf` files in each library
- **Flatpak Steam**: use `~/.var/app/com.valvesoftware.Steam/` as alternate base path (Flatpak detection already exists in the codebase)
- Audit `gamestore-steam` extension — verify it handles Linux library paths or add a Linux branch

### 2.2 Proton Prefix Resolution (3–5 days)

`src/util/linux/proton.ts` already resolves Proton installations and environment variables. Remaining work:

- Map game AppID → `~/.steam/steam/steamapps/compatdata/<appid>/pfx/drive_c/` for mod installation paths
- Handle custom Proton builds (GE-Proton, Proton-tkg) — `proton.ts` already has groundwork for this
- Validate that game-specific extensions resolve mod paths correctly under a Proton prefix

### 2.3 Mod Activator Audit (1 week)

For Steam-library games in `~`, no elevation is required:

- Symlinks: work as normal user ✅
- Hardlinks: work as normal user ✅
- Move: works ✅

Audit each activator extension for hardcoded Windows path assumptions (drive letters, `%APPDATA%`, `Documents` folder refs).

### 2.4 Game Extension Audit — Proton-managed titles (1–2 weeks)

Each game extension in `extensions/games/` may have Windows path assumptions. Prioritise the most-modded titles that drive Linux adoption:

1. Skyrim Special Edition
2. Fallout 4
3. Cyberpunk 2077
4. Baldur's Gate 3

For each: verify game discovery, mod path resolution, and plugin management work under a Proton prefix.

---

## Phase 3 — Packaging and Distribution

**Goal:** Downloadable Linux artifact with auto-updates.

### 3.1 Packaging Format: AppImage + .deb

- **AppImage**: runs on any distro without installation, Steam Deck compatible, standard format for Linux gaming apps (Heroic, Lutris both use AppImage)
- **.deb**: native for Ubuntu / Debian / Pop!\_OS — the dominant Linux gaming distributions

Add to `src/main/electron-builder.config.json`:

```json
"linux": {
  "target": ["AppImage", "deb"],
  "category": "Game"
}
```

A 512×512 PNG app icon is required for Linux packaging.

### 3.2 Auto-Updater (3 days)

`electron-updater` is already cross-platform — this is a CI/CD change, not a code change:

- Include Linux build artifacts (`.AppImage`, `.deb`) in GitHub Releases
- Generate Linux update metadata (`.yml`) files alongside Windows ones

### 3.3 CI/CD Pipeline (1 week)

- Add Linux runner to the GitHub Actions build matrix
- Build all native addons on Linux runner
- Run test suite on Linux
- Publish AppImage + .deb to GitHub Releases

---

## Phase 4 — Native Linux Game Support (Deferred)

**Goal:** Vortex manages mods for games that run natively on Linux (no Proton).

**Prerequisite:** Phases 1–3 complete and stable.

This is a separate track with different challenges from Proton support:

- **Game detection**: no Proton prefix; games install to `/opt`, `~/.local/share`, or custom paths depending on store
- **GOG Linux**: check `~/.config/GOG.com/Galaxy/` or scan `~/GOG Games/`; game metadata in SQLite
- **Heroic Launcher**: `~/.config/heroic/` — JSON metadata covering GOG + Epic games on Linux (note: Heroic also manages Proton-run games, so partial Heroic support may be worth pulling into Phase 2)
- **itch.io**: `~/.config/itch/` — Butler-managed installs
- **Mod path conventions**: native Linux games often use `~/.config/<game>/` or XDG data dirs rather than Windows `Documents` paths — game extensions need Linux-specific path handling

---

## Open Decision Points

1. **FOMOD strategy**: Recompiling for Linux (.NET 9) is the recommended path. Confirm before starting Phase 1.3.
2. **Steam Deck**: AppImage works in Desktop Mode. If Steam Deck is an explicit target, investigate Flatpak via Flathub — but Flatpak sandbox restrictions on accessing game library paths in `~/.steam` need validation first.
3. **Heroic Launcher timing**: Heroic manages Proton-run GOG and Epic games, making it a Proton use case as much as a native Linux one. Consider pulling Heroic detection into Phase 2 rather than deferring to Phase 4.
4. **Elevation scope**: Audit whether `pkexec` integration is actually needed before implementing it — most Steam libraries are user-owned and require no elevation.

---

## Effort Summary

| Phase | Scope | Estimated Duration |
|-------|-------|--------------------|
| Phase 1 | Launch + native addons + FOMOD + elevation | 4–8 weeks |
| Phase 2 | Steam/Proton detection + mod install | 3–5 weeks |
| Phase 3 | Packaging + CI/CD | 2–3 weeks |
| Phase 4 | Native Linux games (deferred) | TBD |
| **Total (Phases 1–3)** | | **9–16 weeks** |
