# Vortex Linux

> Operational playbook for post-merge recovery lives in [VORTEX-LINUX-MERGE-PLAYBOOK.md](VORTEX-LINUX-MERGE-PLAYBOOK.md). Read it after every upstream merge, before assuming a fresh regression.

## Strategic Position

Vortex Linux is an independent fork of [nexus-mods/Vortex](https://github.com/Nexus-Mods/Vortex) targeting Linux users. A Linux user can today install Vortex, detect their Steam/Proton games, download mods via NXM link, run FOMOD installers, manage save games, and deploy mods with hardlink/symlink activation — without leaving the Vortex UI.

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

## Upstream Path

We have not found a way to work together with the nexus-mods team yet. That is not a permanent state.

The `linux-port` branch stays clean and current. The four PR branches (pr-a through pr-d) remain as candidates. When there is an opening — a new maintainer, a community push, a change in upstream priorities — the branches are ready.

In the meantime, one action worth taking: file a single GitHub Discussion in nexus-mods/Vortex asking "We maintain a Linux-compatible fork — what would a mergeable contribution look like to your team?" No PR. No pressure. Just an open question that keeps the conversation available. Then let the install base speak.

The platform guards are additive, the diff is minimal, and the Windows build never breaks. If upstream ever wants to merge, the work is designed to land cleanly.
