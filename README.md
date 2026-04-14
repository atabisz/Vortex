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

**Arch Linux:**

```sh
git clone https://github.com/atabisz/Vortex
cd Vortex/packaging/arch
makepkg -si
```

> Requires `fuse2` (`sudo pacman -S fuse2`). The package installs the AppImage to `/usr/lib/vortex-linux/` and adds a `vortex` command to your PATH. NXM download links are registered automatically via the desktop entry.

> **Note:** This package is not published on the AUR. I'm not an Arch user — the PKGBUILD is provided for anyone who wants to use it, and in the hope that Nexus Mods adopts this Linux port officially and handles distribution themselves.

> **Elevation note (.deb vs AppImage):** The `.deb` package installs a polkit rules file (`/etc/polkit-1/rules.d/10-vortex.rules`) that caches your admin credential for the desktop session. This means elevation operations (mod deployment, symlink creation) only prompt for your password once. AppImage builds do not include this rule — you will be prompted each time Vortex needs elevated privileges.

## What Works

**As of v1.16.8 (2026-04-07):**

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

### v1.16.8 — Elevation Hardening + Save Transfer (2026-04-07)

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

Ubuntu/Debian build prerequisites:

```sh
sudo apt-get update
sudo apt-get install -y git python3 make g++ cmake libfontconfig1-dev liblz4-dev zlib1g-dev
curl https://sh.rustup.rs -sSf | sh
. "$HOME/.cargo/env"
```

These packages are required for the native Node addons built during `pnpm install` on Linux. In particular, `libfontconfig1-dev` is needed by `font-scanner`, `liblz4-dev` is needed by Gamebryo-related native modules, and Rust is required because `libloot` is built from source during install.

```sh
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22.22.0
nvm alias default 22.22.0
npm install -g pnpm@10.33.0
pnpm config set store-dir "$HOME/.local/share/pnpm/store/v10" --global
pnpm install
pnpm run build:all
pnpm run start
```

Known-good toolchain on Ubuntu:

- `node v22.22.0`
- `pnpm 10.33.0`
- `pnpm store path` -> `~/.local/share/pnpm/store/v10`
- `python3 3.12.x` preferred

If your distro ships Python 3.13+ instead of 3.12, some legacy `node-gyp` consumers in this repo still expect `distutils`. In that case, create a user-local shim once and export it before `pnpm install`/`pnpm run build:all`:

```sh
python3 -m venv "$HOME/.local/share/vortex-node-gyp-python"
"$HOME/.local/share/vortex-node-gyp-python/bin/pip" install setuptools
export npm_config_python="$HOME/.local/share/vortex-node-gyp-python/bin/python"
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
