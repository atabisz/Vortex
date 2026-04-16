# Vortex Linux — Forward Plan

## Strategic Position

Vortex Linux is an independent fork of [nexus-mods/Vortex](https://github.com/Nexus-Mods/Vortex) targeting Linux users. Phases 1–3 are complete and shipped (v1.0–v5.0, March–April 2026). A Linux user can today install Vortex, detect their Steam/Proton games, download mods via NXM link, run FOMOD installers, manage save games, and deploy mods with hardlink/symlink activation — without leaving the Vortex UI.

**Fork identity:** I'm not aware of a native Linux port for MO2 at this time, and there is no widely-available native Linux mod manager for Bethesda-engine games that I know of. Vortex is well-suited to fill that gap — it is already a mature, actively maintained mod manager built on excellent foundations. We build and distribute independently while staying current with the upstream work we depend on.

**Upstream relationship:** The door is open. Four PR branches (devcontainer, XDG paths, winapi shim, IPC utility) are ready on the `linux-port` branch. We have not yet found a path to working together with the nexus-mods team. When that changes, the branches are there. In the meantime: ship to users, build an install base, and let demonstrated adoption do the talking. We stay current with upstream merges and our changes remain surgical — nothing stops a future reconciliation.

---

## What Is Complete

| Milestone | Shipped | What It Delivered |
|-----------|---------|-------------------|
| v1.0 | 2026-03-31 | Boot on Linux: runtime libs, winapi shim, native addons, FOMOD (.NET 9), IPC |
| v2.0 | 2026-04-01 | Steam/Proton detection, AppImage + .deb packaging, NXM protocol handler |
| v3.0 | 2026-04-01 | Save game management, pkexec elevation, polkit action, SteamOS fallback |
| v4.0 | 2026-04-07 | Polkit session caching (.deb), Steam Deck failure UX, save transfer, case-folding fs shim |
| v5.0 | 2026-04-09 | fomod-installer source path normalization, CSharpScript Linux warning, vortex-api declarations |
| v6.0 | 2026-04-15 | chattr+F kernel casefold for mod staging (ext4/btrfs dual-path); automated upstream rebase CI |

**Pending hardware UAT** (code-complete, not yet validated on real hardware):
- ELEV-04: polkit `AUTH_ADMIN_KEEP` session caching on desktop Linux
- ELEV-05: full elevation E2E on desktop Linux (hardlinks, permission repair, session re-use)
- ELEV-06: Steam Deck Game Mode failure toast UX
- SAVE-05: live save transfer on real Proton/Linux install
- PROT-01: NXM download on real AppImage/deb hardware

---

## Phase 4 — Stabilization + Beta Launch

**Goal:** Fix the known quality gap, complete hardware UAT, ship a labeled beta, and open the door to community contributors.

### 4.1 Investigate and Fix D1 — RESOLVED

**Status:** Fixed (2026-04-15). Two separate issues were identified and fixed:

1. **Plugins tab missing in .deb** — `esptk.node` failed to dlopen because the static top-level import caused the entire `gamebryo-plugin-management` extension to fail registration. Fixed by converting the import to a lazy `require()` with graceful degradation (commits `0875e3db2`, `03a8c74fa`). Also: `LD_LIBRARY_PATH` was not propagated to the loot subprocess; fixed by adding it explicitly in the `fork()` env block.

2. **mod-dependency-manager spam + mo-import/nmm-import-tool failure** — `modmeta-db` and its native peer `leveldown` lived inside `app.asar`. `leveldown`'s `node-gyp-build` v4.1.1 silently returns `[]` when `fs.readdirSync` is called on a virtual asar path, causing `modmeta-db` to export `ModDB=undefined`. Separately, `bundledPlugins` extensions cannot reach packages inside `app.asar` via Node.js path resolution. Fully fixed across three commits:
   - `538aef374` — added `modmeta-db`, `leveldown`, `levelup`, `encoding-down` to `asarUnpack`. The globs matched nothing because these packages were never installed: they are peerDeps of `modmeta-db`, not direct deps of `@vortex/main`.
   - `fb1a6727f` — promoted `levelup`, `leveldown`, `encoding-down` to direct deps in `src/main/package.json` and added catalog entries in `pnpm-workspace.yaml`, so `pnpm install --dir=./dist` installs them and the `asarUnpack` globs resolve. Also attempted to add `bluebird` to `asarUnpack`, which caused `EEXIST` hardlink errors in electron-builder because `bluebird` is already a direct dep processed by the normal file scan.
   - `a6b0a2c92` — removed `bluebird` from `asarUnpack`. Instead, the `beforePack` hook copies `bluebird` into `dist/node_modules/modmeta-db/node_modules/bluebird/` before packaging, so it is covered by the existing `node_modules/modmeta-db/**` asarUnpack glob and lands in `app.asar.unpacked` alongside `modmeta-db`. The top-level `bluebird` in the asar is untouched, avoiding the hardlink conflict. Confirmed resolved via `1.16.202604150801` log: zero module-resolution errors, `mo-import` and `nmm-import-tool` load cleanly, mod-dependency-manager completes conflict check successfully.

### 4.2 Hardware UAT

Validate the five pending items on real hardware (see "What Is Complete" above). These are table stakes for the beta label. No substitute for running on actual devices.

### 4.3 First-Run Onboarding Wizard

The current first-run flow carries Windows assumptions. Before any public announcement, the following must work without terminal intervention:

1. First-run wizard completes and detects Steam library automatically
2. Mod staging directory configured with filesystem detection (ext4 for `chattr +F`, fallback for XFS/ZFS/other)
3. No "Run as Administrator" or `C:\` paths in any error state
4. Mod install → deploy → enable round-trip works for one Proton game without touching config files
5. All dialogs render without clipped buttons or invisible scroll at 1280×800 (Steam Deck Desktop Mode)
6. "Get Help" links route to Linux-specific documentation, not Windows troubleshooting

### 4.4 Filesystem Layer — chattr+F Dual-Path — COMPLETE

**Status:** Shipped (2026-04-15). Implemented `applyChattrCasefold()` in `src/renderer/src/util/fs.ts` with injectable seams for testing. On ext4/btrfs filesystems, mod staging directories are created with `chattr +F` (kernel-level case folding); falls back automatically to the existing userspace shim on XFS/ZFS and other filesystems. The notifier injection (`_setChattrNotifier`) is wired in `renderer.tsx` bootstrap so UX feedback reaches the user on first-run. All branches covered by Vitest unit tests against a mock `execFile`.

### 4.5 Automated Rebase Machinery — COMPLETE

**Status:** Shipped (2026-04-15). A `rebase-upstream.yml` GitHub Actions workflow runs on a daily schedule (`0 6 * * *`) and on `workflow_dispatch`. It invokes `.github/scripts/rebase-upstream.sh`, which fetches the latest upstream release tag, merges it into `linux-port`, runs conflict resolution, and opens a PR via the GitHub REST API. The workflow has `contents: write` and `pull-requests: write` permissions and is gated to the `atabisz/Vortex` repository to prevent accidental runs on forks.

---

## Phase 5 — Distribution and Community

**Goal:** Reach Linux users who aren't already searching for Vortex. Build the community before announcing to it.

### 5.1 AppImage Beta Release

Ship AppImage with honest "experimental" labeling to GitHub Releases. No fanfare — a "looking for testers" post on r/SteamDeck. The Steam Deck audience is the right first community: high mod need (Skyrim, Fallout 4, Elden Ring, BG3 dominate Deck usage), tolerance for rough edges, and excellent bug reports.

Do not post to r/linux_gaming until early testers have validated the experience. One bad first-impression thread there will follow the project for years.

### 5.2 Flathub Submission

Flathub is the primary discovery channel for Ubuntu and Fedora users — they browse it like an app store. Submit alongside the AppImage beta (Flathub review takes 2–4 weeks, so the timing works out).

Use the Lutris permission model — `--filesystem=home`, `--allow=devel`, `--device=all`. No polkit helper needed inside the sandbox: mod deployment is user-space work (symlinks and hardlinks into user-owned `~/.steam` directories). Lutris ships at 60K Flathub downloads/month with this exact approach.

### 5.3 AUR Package

Community-maintained PKGBUILD. Let an early tester submit and maintain it — high adoption density among Arch/Manjaro users (who skew heavily Linux gaming). Low team investment required.

### 5.4 Governance Declaration

Publish before community outreach, not after:
- Contributor covenant
- Public roadmap (this document)
- Changelog
- Two people with merge rights

A single-maintainer fork with no governance is one burnout away from abandonment. Establishing governance publicly demonstrates that this is a serious, well-maintained project and makes it easier for contributors to get involved.

### 5.5 Distribution Priority

| Channel | Audience | When |
|---------|----------|------|
| AppImage (GitHub Releases) | Power users, all distros | Phase 4 complete |
| Flathub | Ubuntu, Fedora, openSUSE | Submit concurrent with beta |
| r/SteamDeck soft launch | Steam Deck modders | After onboarding gates pass |
| r/linux_gaming announcement | Broad Linux gaming community | After early tester validation |
| AUR | Arch/Manjaro users | Community-maintained, no gate |

---

## Phase 6 — Steam Deck Desktop Mode

**Goal:** Vortex feels designed for Steam Deck, not ported to it.

Steam Deck users primarily play Bethesda RPGs (Skyrim, Fallout 4), Elden Ring, BG3, and Stardew Valley — exactly the modding-heavy titles Vortex supports. These users will tolerate Desktop Mode for a proper tool. Gaming Mode is a future differentiator, not a current blocker.

### 6.1 Touch Target Sizing

All interactive elements: 48px minimum height with 8px gaps. The mod list action buttons (enable/disable/remove) are currently ~32px — a touchscreen misclick at scale. This single change converts Desktop Mode from frustrating to usable.

### 6.2 Collapsible Left Sidebar

The navigation panel consumes ~240px at desktop widths — 19% of 1280px. On Steam Deck, collapse it behind a hamburger icon by default. Sidebar content is navigation, not primary workflow; it should not compete with the mod list for screen real estate.

### 6.3 Bottom Action Bar

"Deploy Mods" and "Install from File" currently live in a top toolbar. On a 7-inch handheld in landscape, primary actions belong in the bottom thumb zone. A sticky bottom bar at this resolution makes Vortex feel intentional on Deck rather than adapted.

### 6.4 NXM via Steam Browser (PROT-03)

The NXM handler for Steam Deck's built-in browser (WebKit-based Discover overlay) is deferred — requires hardware access and coordination with both Valve and Nexus Mods web teams. Track as a future item after Desktop Mode UX is solid.

---

## Phase 7 — Native Linux Game Support

**Goal:** Vortex detects and manages mods for games running natively on Linux, not just via Proton.

**Prerequisite:** Phases 4–5 complete and stable. This is a separate track with different challenges from Proton support.

### 7.1 Heroic Launcher Integration

Heroic manages GOG and Epic Games libraries on Linux and is the primary launcher for non-Steam games. Its entire library is stored as readable JSON — no API required:

| File | Location | Contents |
|------|----------|----------|
| `installed.json` | `~/.config/heroic/` | Epic Games library (via Legendary); `install_path`, `executable`, `version` per game |
| `manifests/{appName}` | `~/.config/heroic/` | GOG game manifests; `goggame-{appName}.info` at install root for build IDs |
| `{appName}.json` | `{gamesConfigPath}/` | Per-game config: `install_path`, `is_installed`, `is_linux_native`, `folder_name`, `runner` (epic/gog/nile), Wine prefix, env vars |

**Implementation strategy:** Start with read-only game detection — parse `installed.json` (Epic) and `manifests/` (GOG) to enumerate installed games. Read per-game config for install paths and Proton prefix. Scope as a full phase: handle version drift defensively, Proton prefix resolution for non-native Heroic games, testing across GOG and Epic libraries.

Heroic is also the best user acquisition channel for users not already in the Linux gaming community — a co-launch integration meets users at game install time.

### 7.2 GOG Native Linux

For games installed outside Heroic: check `~/.config/GOG.com/Galaxy/` or scan `~/GOG Games/`. Game metadata stored in SQLite. Game extensions need Linux-specific mod path handling (native Linux games use `~/.config/<game>/` or XDG data dirs, not Windows `Documents` paths).

### 7.3 itch.io

`~/.config/itch/` — Butler-managed installs. Game extensions need XDG path handling.

### 7.4 Lutris

Lutris manages a broad range of Linux and Wine-based games. `~/.local/share/lutris/` contains game databases. Lower priority than Heroic given overlap with Steam/Proton coverage, but the community is active and the integration is straightforward.

---

## Upstream Path

We have not found a way to work together with the nexus-mods team yet. That is not a permanent state.

The `linux-port` branch stays clean and current. The four PR branches (pr-a through pr-d) remain as candidates. When there is an opening — a new maintainer, a community push, a change in upstream priorities — the branches are ready.

In the meantime, one action worth taking: file a single GitHub Discussion in nexus-mods/Vortex asking "We maintain a Linux-compatible fork — what would a mergeable contribution look like to your team?" No PR. No pressure. Just an open question that keeps the conversation available. Then let the install base speak.

Nothing in this forward plan closes the upstream door. The platform guards are additive, the diff is minimal, and the Windows build never breaks. If upstream ever wants to merge, the work is designed to land cleanly.

---

## Success Signals (6 months)

| Signal | Threshold | Meaning |
|--------|-----------|---------|
| Flathub install count | >15K | Reached non-gaming Linux audience |
| r/linux_gaming organic mentions | >2/week unprompted | Community formed without forcing it |
| GitHub issue ratio | 70%+ feature requests vs. bugs | Core loop works — users want more |
| Game extension contributor | 1+ Linux path contribution | Ecosystem effect beginning |

Hit 3 of 4 → strategy is working. Fewer than 2 → revisit distribution approach.
