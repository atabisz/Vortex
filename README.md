# Vortex Linux Port

> **This is an unofficial community fork.** The real project is [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex) — maintained by Nexus Mods, Windows-only, and where you should report bugs if you're on Windows. This fork exists just to get Vortex working on Linux. For general support, feature requests, and anything that isn't a Linux-specific issue, head over there.

Linux builds (AppImage + .deb) are published as [releases on this fork](../../releases).

---

## Installing

| Package                | Download                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| AppImage (recommended) | [vortex-setup.AppImage](https://github.com/atabisz/Vortex/releases/download/latest-linux/vortex-setup.AppImage) |
| Debian/Ubuntu .deb     | [vortex_amd64.deb](https://github.com/atabisz/Vortex/releases/download/latest-linux/vortex_amd64.deb)           |

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

> Needs `fuse2` (`sudo pacman -S fuse2`). The package drops the AppImage into `/usr/lib/vortex-linux/` and adds a `vortex` command to your PATH. NXM download links get registered automatically via the desktop entry.

> **Note:** This one isn't on the AUR. I'm not an Arch user — the PKGBUILD is here for anyone who wants to use it, and in the hope that Nexus Mods eventually picks up the Linux port officially and handles distribution themselves.

> **Elevation note (.deb vs AppImage):** The `.deb` installs a polkit rules file (`/etc/polkit-1/rules.d/10-vortex.rules`) that caches your admin credential for the desktop session, so elevation operations (mod deployment, symlink creation) only prompt for your password once. AppImage builds don't ship this rule — you'll be prompted every time Vortex needs elevated privileges.

## What Works

**As of v2.0.0-linux (2026-05-08):**

- **Launches on Linux** — `pnpm run start` boots without crashing; all the native addons (bsatk, esptk, loot, vortexmt, xxhash-addon, bsdiff-node) compile and load.
- **FOMOD installer** — C#/.NET FOMOD installers work via native Linux binaries — no Wine needed.
- **Steam/Proton game detection** — Multi-root VDF scanning (native Steam + Flatpak), Proton prefix resolution, never-launched games picked up via `oslist`, and the `{mygames}` Wine path resolves correctly (`compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games`).
- **Top game extensions work** — Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley all confirmed working on Linux with Proton.
- **NXM "Download with Manager"** — Clicking download links on Nexus Mods hands off to Vortex on GNOME and KDE Plasma, in both dev and AppImage builds; KDE Plasma's `kbuildsycoca6` database refresh is wired in.
- **Packaged distributions** — AppImage and `.deb` built by CI and published alongside the Windows artifacts; auto-updater works for AppImage installs.
- **winapi-bindings shim** — All 21 Windows registry/UAC import sites shimmed at bundle time, with zero edits to the original Windows code.
- **Persistent session elevation token (.deb)** — The `.deb` ships a polkit rules file granting `AUTH_ADMIN_KEEP`, so elevation operations (mod deployment, symlink creation) only ask for your password once per desktop session instead of every single time.
- **Steam Deck error UX** — When Vortex runs in Steam Deck Game Mode where there's no polkit agent, a clear notification tells you to switch to Desktop Mode; Vortex keeps working after you dismiss it.
- **Save file transfer** — You can move save files between Vortex profiles for Skyrim SE and Fallout 4 across Wine prefix paths from the save manager UI.
- **Linux case-folding fs wrapper** — A shared fs shim resolves the real on-disk casing for Wine prefix AppData paths before file operations, fixing `Plugins.txt` vs `plugins.txt` mismatches and similar "Windows assumed case-insensitive" bugs.
- **FOMOD path normalization** — FOMOD XML installers get their source paths normalised for Linux (forward-slash, lowercase), so mods that used to silently fail on case-sensitive filesystems actually install.
- **CSharpScript Linux notice** — Mods that use CSharpScript-based FOMOD installers (a Windows-only feature) now surface a clear, actionable notification on Linux instead of failing silently.
- **chattr+F kernel casefold for mod staging** — On ext4/btrfs, mod staging directories get created with `chattr +F` (kernel-level case folding), which sidesteps the userspace shim's race conditions on deep mod hierarchies; falls back to the shim on XFS/ZFS and anything else.

## What Doesn't Work

| Feature                                        | Status          | Notes                                                                                                                                                                                     |
| ---------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save game viewer/parser (Skyrim SE, Fallout 4) | Untested        | `gamebryo-savegame` compiles on Linux (build issues got sorted in v3.0) but hasn't actually been exercised at runtime. Save _transfer_ between profiles does work — see What Works above. |
| Elevated privilege operations (AppImage)       | Degraded        | AppImage builds don't ship the polkit rules file — you'll get prompted on every elevation call. Use the `.deb` if you want session-scoped credential caching.                             |
| NXM via Steam Browser overlay (Steam Deck)     | Unknown         | The WebKit overlay's `xdg-open` behaviour isn't documented anywhere; needs hardware access plus a chat with both Valve and the Nexus Mods web team.                                       |
| AppImage delta auto-updates on SteamOS         | Not implemented | Haven't checked how `electron-updater` behaves on SteamOS's immutable filesystem yet.                                                                                                     |
| GOG / itch.io / Heroic Launcher games          | Not supported   | Steam/Proton only for now.                                                                                                                                                                |
| Flathub / Flatpak distribution                 | Planned         | AppImage works today; Flathub submission is on the list, using the same permission model as Lutris.                                                                                       |

## Roadmap

The full development plan is in [VORTEX-LINUX.md](VORTEX-LINUX.md).

### Recently shipped

- **v2.0.0-linux (2026-05-08)** — First tagged Linux release of the fork. chattr+F kernel casefold for mod staging (ext4/btrfs); upstream-rebase automation (daily CI merges the latest upstream tags); upstream-merge survival work (named `skip-on-windows.mjs` / `skip-on-linux.mjs` guards, LOOT case-sensitivity fix, `testPathTransfer` platform guard, `nodeExternals` allowlist for `winapi-bindings`); CI hardening (pnpm-bundled `gyp_main.py` chmod, `src/main` packaging `dist` → `build` sync, fork-gated `fingerprint-*` workflows); post-merge playbook published.
- **v1.16.9 (2026-04-09)** — FOMOD source path normalisation for Linux, CSharpScript Linux notice, vortex-api declarations updated.
- **v1.16.8 (2026-04-07)** — Persistent elevation token (.deb), Steam Deck Game Mode error UX, save file transfer across Wine prefix paths, Linux case-folding fs wrapper.

### Up next

- Hardware testing for elevation, save transfer, and NXM on real devices.
- First-run onboarding wizard with Linux-native path detection.
- Flathub submission.
- Heroic Launcher, GOG, and itch.io game detection.

## Building from Source

Ubuntu/Debian build prerequisites:

```sh
sudo apt-get update
sudo apt-get install -y git python3 make g++ cmake libfontconfig1-dev liblz4-dev zlib1g-dev
curl https://sh.rustup.rs -sSf | sh
. "$HOME/.cargo/env"
```

These are for the native Node addons that get built during `pnpm install` on Linux. `libfontconfig1-dev` is needed by `font-scanner`, `liblz4-dev` by the Gamebryo-related native modules, and Rust is needed because `libloot` is built from source during install.

```sh
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22.22.0
npm install -g pnpm@10.33.0
pnpm install
pnpm run build:all
pnpm run start
```

`build:all` has to run before `start` — it compiles the TypeScript bundles, builds
the extension packages, and pulls down the DuckDB extensions and CSS assets. `pnpm run build`
on its own only compiles TypeScript and won't get you a launchable app.

Known-good toolchain on Ubuntu:

- `node v22.22.0`
- `pnpm 10.33.0`
- `python3 3.12.x` preferred

If your distro ships Python 3.13+ instead of 3.12, a few legacy `node-gyp` consumers in this repo still expect `distutils`. Create a user-local shim once and export it before `pnpm install` / `pnpm run build:all`:

```sh
python3 -m venv "$HOME/.local/share/vortex-node-gyp-python"
"$HOME/.local/share/vortex-node-gyp-python/bin/pip" install setuptools
export npm_config_python="$HOME/.local/share/vortex-node-gyp-python/bin/python"
```

See [AGENTS.md](AGENTS.md) for the full dev setup.

## Upstream project

All credit for Vortex goes to the Nexus Mods team and contributors at [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex).

- [Official download](https://www.nexusmods.com/site/mods/1?tab=files) (Windows)
- [Upstream source](https://github.com/Nexus-Mods/Vortex)
- [Official wiki](https://github.com/Nexus-Mods/Vortex/wiki)
- [Support forum](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/) / [Discord](https://discord.gg/nexusmods)

## License

GPL-3.0 — same as upstream. See [LICENSE.md](LICENSE.md).
