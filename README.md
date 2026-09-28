# Vortex Linux Port

> **This is an unofficial community fork.** The real project is [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex) — maintained by Nexus Mods, with official releases for Windows only, and where you should report bugs if you're on Windows. This fork exists just to get Vortex working on Linux. For general support, feature requests, and anything that isn't a Linux-specific issue, head over there.

Linux builds (AppImage + .deb) are published as [releases on this fork](../../releases). Each Linux release follows an upstream tag — `v2.7.1-linux` is upstream `v2.7.1` plus the Linux patches.

---

## Installing

| Package                | Download                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| AppImage (recommended) | [vortex-setup.AppImage](https://github.com/atabisz/Vortex/releases/download/latest-linux/vortex-setup.AppImage) |
| Debian/Ubuntu .deb     | [vortex_amd64.deb](https://github.com/atabisz/Vortex/releases/download/latest-linux/vortex_amd64.deb)           |

Both links track the latest `master` build. Tagged releases are on the [releases page](../../releases).

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

**As of v2.7.1-linux (2026-09-28):**

- **Launches on Linux** — `pnpm run start` boots without crashing; the native addons (bsatk, loot, vortexmt, xxhash-addon and friends) compile and load.
- **FOMOD installer** — C#/.NET FOMOD installers work via native Linux binaries — no Wine needed.
- **Steam/Proton game detection** — Multi-root VDF scanning (native Steam + Flatpak), Proton prefix resolution, never-launched games picked up via `oslist`, and the `{mygames}` Wine path resolves correctly (`compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games`).
- **Top game extensions work** — Skyrim SE, Fallout 4, Cyberpunk 2077, Stardew Valley all confirmed working on Linux with Proton.
- **NXM "Download with Manager"** — Clicking download links on Nexus Mods hands off to Vortex on GNOME and KDE Plasma, in both dev and AppImage builds; KDE Plasma's `kbuildsycoca6` database refresh is wired in.
- **Packaged distributions** — AppImage and `.deb` built by CI, with every release smoke-launched in CI before it's published.
- **winapi-bindings shim** — The Windows registry/UAC imports are shimmed at bundle time, with zero edits to the original Windows code.
- **Persistent session elevation token (.deb)** — The `.deb` ships a polkit rules file granting `AUTH_ADMIN_KEEP`, so elevation operations (mod deployment, symlink creation) only ask for your password once per desktop session instead of every single time.
- **Steam Deck error UX** — When Vortex runs in Steam Deck Game Mode where there's no polkit agent, a clear notification tells you to switch to Desktop Mode; Vortex keeps working after you dismiss it.
- **Save file transfer** — You can move save files between Vortex profiles for Skyrim SE and Fallout 4 across Wine prefix paths from the save manager UI.
- **Linux case-folding fs wrapper** — A shared fs shim resolves the real on-disk casing for Wine prefix AppData paths before file operations, fixing `Plugins.txt` vs `plugins.txt` mismatches and similar "Windows assumed case-insensitive" bugs.
- **FOMOD path normalization** — FOMOD XML installers get their source paths normalised for Linux (forward-slash, lowercase), so mods that used to silently fail on case-sensitive filesystems actually install.
- **CSharpScript Linux notice** — Mods that use CSharpScript-based FOMOD installers (a Windows-only feature) now surface a clear, actionable notification on Linux instead of failing silently.
- **chattr+F kernel casefold for mod staging** — On ext4/btrfs, mod staging directories get created with `chattr +F` (kernel-level case folding), which sidesteps the userspace shim's race conditions on deep mod hierarchies; falls back to the shim on XFS/ZFS and anything else.

## What Doesn't Work

| Feature                                        | Status        | Notes                                                                                                                                                                                     |
| ---------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save game viewer/parser (Skyrim SE, Fallout 4) | Untested      | `gamebryo-savegame` compiles on Linux (build issues got sorted in v3.0) but hasn't actually been exercised at runtime. Save _transfer_ between profiles does work — see What Works above. |
| Elevated privilege operations (AppImage)       | Degraded      | AppImage builds don't ship the polkit rules file — you'll get prompted on every elevation call. Use the `.deb` if you want session-scoped credential caching.                             |
| NXM via Steam Browser overlay (Steam Deck)     | Unknown       | The WebKit overlay's `xdg-open` behaviour isn't documented anywhere; needs hardware access plus a chat with both Valve and the Nexus Mods web team.                                       |
| In-app auto-update (AppImage / .deb)           | Not working   | The updater checks upstream's releases, which only carry Windows builds, so it won't find Linux updates. Download new versions from [this fork's releases](../../releases) by hand.       |
| GOG / itch.io / Heroic Launcher games          | Not supported | Steam/Proton only for now.                                                                                                                                                                |
| Flathub / Flatpak distribution                 | Not from here | This fork doesn't publish a Flatpak. Upstream now carries its own Flatpak manifest (`flatpak/com.nexusmods.vortex.yaml`, see [docs/flatpak/](docs/flatpak/technical.md)).                 |

## Installing runtime libraries into Proton prefixes

Many games and mods require additional Windows libraries — most commonly Microsoft's Visual C++ Redistributable — installed inside the game's Proton prefix. These aren't part of Proton's default Wine environment, so mods that depend on them will fail to load with cryptic errors (e.g., SKSE reporting `couldn't load plugin (000003E6)`).

**Install with protontricks (recommended):**

```sh
# Example: Skyrim SE (App ID 489830)
protontricks-launch --appid 489830 ~/Downloads/VC_redist.x64.exe
```

Replace the app ID with your game's Steam ID. Download the redistributable from Microsoft: `https://aka.ms/vs/17/release/vc_redist.x64.exe`

**Manual alternative (no protontricks):**

```sh
WINEPREFIX=~/.steam/steam/steamapps/compatdata/<appid>/pfx \
  ~/.steam/steam/steamapps/common/"Proton - Experimental"/files/bin/wine64 \
  ~/Downloads/VC_redist.x64.exe
```

Adjust the Proton path to match whichever version the game is using.

## Roadmap

The full development plan is in [VORTEX-LINUX.md](VORTEX-LINUX.md).

### Recently shipped

Since v2.0.0, releases have mostly been upstream syncs — each one merges the new upstream tag, fixes whatever it broke on Linux, and gets a matching `-linux` release. The per-sync gotchas are written up in [VORTEX-LINUX-MERGE-PLAYBOOK.md](VORTEX-LINUX-MERGE-PLAYBOOK.md).

- **v2.7.1-linux (2026-09-28)** — Synced to upstream v2.7.1.
- **v2.6.3-linux (2026-09-21)** — Synced to upstream v2.6.3.
- **v2.5.0-linux (2026-08-11)** — Synced to upstream v2.5.0.
- **v2.1.1-linux (2026-06-26)** — Synced to upstream v2.1.1; Linux packaging fixes (winapi stubs, asar unpack, loot rebuild in release CI).
- **v2.0.2-linux (2026-05-29)** — Synced to upstream v2.0.2.
- **v2.0.0-linux (2026-05-08)** — First tagged Linux release of the fork. chattr+F kernel casefold for mod staging (ext4/btrfs); upstream-rebase automation (daily CI merges the latest upstream tags); upstream-merge survival work (named `skip-on-windows.mjs` / `skip-on-linux.mjs` guards, LOOT case-sensitivity fix, `testPathTransfer` platform guard, `nodeExternals` allowlist for `winapi-bindings`); CI hardening (pnpm-bundled `gyp_main.py` chmod, `src/main` packaging `dist` → `build` sync, fork-gated `fingerprint-*` workflows); post-merge playbook published.
- **v1.16.9 (2026-04-09)** — FOMOD source path normalisation for Linux, CSharpScript Linux notice, vortex-api declarations updated.
- **v1.16.8 (2026-04-07)** — Persistent elevation token (.deb), Steam Deck Game Mode error UX, save file transfer across Wine prefix paths, Linux case-folding fs wrapper.

### Up next

- Hardware testing for elevation, save transfer, and NXM on real devices.
- First-run onboarding wizard with Linux-native path detection.
- Point the in-app updater at this fork's Linux releases.
- Heroic Launcher, GOG, and itch.io game detection.

## Building from Source

Start with the per-distro setup guides in [docs/install-instructions/](docs/install-instructions/README.md) (Debian/Ubuntu, Fedora, Arch, NixOS), then follow [shared.md](docs/install-instructions/shared.md). You don't need nvm, Volta or a global Node: install [pnpm](https://pnpm.io/installation), and on `pnpm install` it switches to the version pinned in `packageManager` and downloads the Node runtime pinned in `devEngines.runtime`.

This fork's Linux build also needs a few packages the upstream guides don't list. They're for the native addons built during `pnpm install`. On Debian/Ubuntu:

```sh
sudo apt-get install -y cmake libfontconfig1-dev liblz4-dev
curl https://sh.rustup.rs -sSf | sh
. "$HOME/.cargo/env"
```

`liblz4-dev` is for the Gamebryo-related native modules, and Rust is needed because `libloot` is built from source. It's the same set the Linux release CI installs.

```sh
pnpm install
pnpm run build:all
pnpm run start
```

`build:all` has to run before `start` — it compiles the TypeScript bundles, builds
the extension packages, and pulls down the DuckDB extensions and CSS assets. `pnpm run build`
on its own only compiles TypeScript and won't get you a launchable app.

If your distro ships Python 3.13+, a few legacy `node-gyp` consumers still expect `distutils`. Install `python3-setuptools` (the upstream Debian guide already does), or create a user-local shim and export it before `pnpm install`:

```sh
python3 -m venv "$HOME/.local/share/vortex-node-gyp-python"
"$HOME/.local/share/vortex-node-gyp-python/bin/pip" install setuptools
export npm_config_python="$HOME/.local/share/vortex-node-gyp-python/bin/python"
```

## Upstream project

All credit for Vortex goes to the Nexus Mods team and contributors at [Nexus-Mods/Vortex](https://github.com/Nexus-Mods/Vortex).

- [Official download](https://www.nexusmods.com/site/mods/1?tab=files) (Windows)
- [Upstream source](https://github.com/Nexus-Mods/Vortex)
- [Official wiki](https://github.com/Nexus-Mods/Vortex/wiki)
- [Support forum](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/) / [Discord](https://discord.gg/nexusmods)

## License

GPL-3.0 — same as upstream. See [LICENSE.md](LICENSE.md).
