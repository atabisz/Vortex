# Vortex Linux Port

> **This is an unofficial community fork.** The official project is [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex) — maintained by Nexus Mods, Windows-only, and where you should report bugs if you're on Windows. This fork exists solely to get Vortex running on Linux. Go there for general support, feature requests, and all non-Linux issues.

Linux builds (AppImage + .deb) are published as [releases on this fork](../../releases).

---

## What Works

**As of v2.0 (shipped 2026-04-01):**

- **Launches on Linux** — `pnpm run start` works on Linux without crashing; all native addons (bsatk, esptk, loot, vortexmt, xxhash-addon, bsdiff-node) compile and load
- **FOMOD installer** — C#/.NET FOMOD installers work via native Linux binaries (no Wine dependency)
- **Steam/Proton game detection** — Multi-root VDF scanning (native Steam + Flatpak), Proton prefix resolution, never-launched game detection via `oslist`, and correct `{mygames}` Wine path resolution (`compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games`)
- **Top game extensions work**: Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley all confirmed working on Linux with Proton
- **NXM "Download with Manager"** — Clicking download links on Nexus Mods triggers Vortex on GNOME and KDE Plasma in both dev and AppImage builds; KDE Plasma's `kbuildsycoca6` database refresh wired in
- **Packaged distributions** — AppImage and `.deb` built by CI and published alongside Windows artifacts; auto-updater available for AppImage installs
- **winapi-bindings shim** — All 21 Windows registry/UAC import sites shimmed at bundle time; no source edits to Windows code

## What Doesn't Work

| Feature | Status | Notes |
|---|---|---|
| Save game management (Skyrim SE, Fallout 4) | Broken | `gamebryo-savegame` native addon has MSVC exception constructors + lz4/zlib linker issues; disabled on Linux with a clear error |
| Elevated privilege operations | Degraded | `pkexec` + Unix socket elevation not yet implemented; user-triggered elevation calls fail gracefully; startup path confirmed clean |
| NXM via Steam Browser overlay (Steam Deck) | Unknown | WebKit-based overlay `xdg-open` behavior undocumented; requires hardware + Nexus Mods web team coordination |
| AppImage delta auto-updates on SteamOS | Not implemented | `electron-updater` behavior on SteamOS immutable filesystem needs validation |
| GOG / itch.io / Heroic Launcher games | Not supported | Steam/Proton only for now |
| Steam Deck Flatpak distribution | Not packaged | AppImage works in Desktop Mode; Flatpak `~/.steam` sandbox restrictions need validation first |

## Roadmap

### v3.0 — Save Games + Elevation (planning)

- Fix `gamebryo-savegame` native addon compilation on Linux (MSVC exception constructors + lz4/zlib linker flags)
- Save game manager UI working end-to-end for Skyrim SE and Fallout 4 on Linux
- `pkexec` + Unix domain socket elevation for operations that require root (mod deployment, symlink creation)
- Elevation path for Steam Deck / SteamOS without a polkit password

### v4.0+ (deferred)

- GOG, itch.io, Heroic Launcher game detection
- NXM handler via Steam Browser overlay on Steam Deck
- AppImage delta auto-update on SteamOS
- Steam Deck Flatpak distribution

## Installing

Download the latest AppImage or `.deb` from the [Releases](../../releases) page.

**AppImage:**
```sh
chmod +x vortex-setup-*.AppImage
./vortex-setup-*.AppImage
```

**Debian/Ubuntu (.deb):**
```sh
sudo apt install ./vortex_*_amd64.deb
```

## Building from Source

```sh
volta install node@22
pnpm install
pnpm run build
pnpm run start
```

See [AGENTS.md](AGENTS.md) for the full dev setup.

## Upstream Project

All credit for Vortex belongs to the Nexus Mods team and contributors at [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex).

- [Official download](https://www.nexusmods.com/site/mods/1?tab=files) (Windows)
- [Upstream source](https://github.com/Nexus-Mods/Vortex)
- [Official wiki](https://github.com/Nexus-Mods/Vortex/wiki)
- [Support forum](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/) / [Discord](https://discord.gg/nexusmods)

## License

GPL-3.0 — same as upstream. See [LICENSE.md](LICENSE.md).
