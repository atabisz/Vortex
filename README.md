# Vortex Linux Port

> **This is an unofficial community fork.** The official project is [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex) — maintained by Nexus Mods, Windows-only, and where you should report bugs if you're on Windows. This fork exists solely to get Vortex running on Linux. Go there for general support, feature requests, and all non-Linux issues.

Linux builds (AppImage + .deb) are published as [releases on this fork](../../releases).

---

## Installing

**Stable release** (latest tagged version):

| Package | Download |
|---|---|
| AppImage (recommended) | [vortex-setup.AppImage](https://github.com/atabisz/Vortex/releases/latest/download/vortex-setup.AppImage) |
| Debian/Ubuntu .deb | [vortex_amd64.deb](https://github.com/atabisz/Vortex/releases/latest/download/vortex_amd64.deb) |

**Rolling build** (latest master commit, may be less stable):

| Package | Download |
|---|---|
| AppImage (recommended) | [vortex-setup.AppImage](https://github.com/atabisz/Vortex/releases/download/latest-linux/vortex-setup.AppImage) |
| Debian/Ubuntu .deb | [vortex_amd64.deb](https://github.com/atabisz/Vortex/releases/download/latest-linux/vortex_amd64.deb) |

**AppImage:**
```sh
chmod +x vortex-setup.AppImage
./vortex-setup.AppImage
```
> Ubuntu 22.04+ users: `sudo apt install libfuse2` first.

**Debian/Ubuntu (.deb):**
```sh
sudo apt install ./vortex_amd64.deb
```

> **Elevation note (.deb vs AppImage):** The `.deb` package installs a polkit rules file (`/etc/polkit-1/rules.d/10-vortex.rules`) that caches your admin credential for the desktop session. This means elevation operations (mod deployment, symlink creation) only prompt for your password once. AppImage builds do not include this rule — you will be prompted each time Vortex needs elevated privileges.

## What Works

**As of v4.0 (shipped 2026-04-07):**

- **Launches on Linux** — `pnpm run start` works on Linux without crashing; all native addons (bsatk, esptk, loot, vortexmt, xxhash-addon, bsdiff-node) compile and load
- **FOMOD installer** — C#/.NET FOMOD installers work via native Linux binaries (no Wine dependency)
- **Steam/Proton game detection** — Multi-root VDF scanning (native Steam + Flatpak), Proton prefix resolution, never-launched game detection via `oslist`, and correct `{mygames}` Wine path resolution (`compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games`)
- **Top game extensions work**: Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley all confirmed working on Linux with Proton
- **NXM "Download with Manager"** — Clicking download links on Nexus Mods triggers Vortex on GNOME and KDE Plasma in both dev and AppImage builds; KDE Plasma's `kbuildsycoca6` database refresh wired in
- **Packaged distributions** — AppImage and `.deb` built by CI and published alongside Windows artifacts; auto-updater available for AppImage installs
- **winapi-bindings shim** — All 21 Windows registry/UAC import sites shimmed at bundle time; no source edits to Windows code
- **Persistent session elevation token (.deb)** — The `.deb` package installs a polkit rules file granting `AUTH_ADMIN_KEEP`; elevation operations (mod deployment, symlink creation) prompt for your password once per desktop session rather than once per operation
- **Steam Deck error UX** — When Vortex runs in Steam Deck Game Mode where no polkit agent is available, a clear notification tells the user to switch to Desktop Mode; Vortex remains functional after dismissal
- **Save file transfer** — Save files can be transferred between Vortex profiles for Skyrim SE and Fallout 4 across Wine prefix paths using the save manager UI
- **Linux case-folding fs wrapper** — A shared fs shim resolves actual on-disk casing for Wine prefix AppData paths before file operations, fixing `Plugins.txt`/`plugins.txt` mismatches and similar Windows-assumes-case-insensitive bugs

## What Doesn't Work

| Feature | Status | Notes |
|---|---|---|
| Save game viewer/parser (Skyrim SE, Fallout 4) | Broken | `gamebryo-savegame` native addon has MSVC exception constructors + lz4/zlib linker issues; disabled on Linux with a clear error. Save *transfer* between profiles works — see What Works above. |
| Elevated privilege operations (AppImage) | Degraded | AppImage builds do not include the polkit rules file — users are prompted on every elevation call. Install the `.deb` for session-scoped credential caching. |
| NXM via Steam Browser overlay (Steam Deck) | Unknown | WebKit-based overlay `xdg-open` behavior undocumented; requires hardware + Nexus Mods web team coordination |
| AppImage delta auto-updates on SteamOS | Not implemented | `electron-updater` behavior on SteamOS immutable filesystem needs validation |
| GOG / itch.io / Heroic Launcher games | Not supported | Steam/Proton only for now |
| Steam Deck Flatpak distribution | Not packaged | AppImage works in Desktop Mode; Flatpak `~/.steam` sandbox restrictions need validation first |

## Roadmap

### v4.0 — Elevation Hardening + Save Transfer (shipped 2026-04-07)

- Persistent elevation token via polkit session-scoped rules (.deb only)
- End-to-end validation of all elevation operations on desktop Linux
- Steam Deck error UX for missing polkit agent in Game Mode
- Profile-to-profile save file transfer between Wine prefix paths
- Linux case-folding fs wrapper for Wine prefix AppData paths

### Future

- GOG, itch.io, Heroic Launcher game detection
- NXM handler via Steam Browser overlay on Steam Deck
- AppImage delta auto-update on SteamOS
- Steam Deck Flatpak distribution

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
