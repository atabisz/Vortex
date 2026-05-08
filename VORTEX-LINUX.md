# Vortex Linux

> Post-merge recovery playbook is in [VORTEX-LINUX-MERGE-PLAYBOOK.md](VORTEX-LINUX-MERGE-PLAYBOOK.md). Read it after every upstream merge, before assuming a fresh regression.

## Where we are

Vortex Linux is an independent fork of [nexus-mods/Vortex](https://github.com/Nexus-Mods/Vortex) targeting Linux users. A Linux user can today install Vortex, detect their Steam/Proton games, download mods via NXM link, run FOMOD installers, manage save games, and deploy mods with hardlink/symlink activation — without ever leaving the Vortex UI.

**Fork identity:** There's no native Linux port of MO2 that I know of, and no widely-available native Linux mod manager for Bethesda-engine games. Vortex is a good fit for that gap — it's already a mature, actively maintained mod manager with solid foundations. We build and distribute independently while staying current with the upstream work we depend on.

**Upstream relationship:** The door is open. We haven't found a way to work with the nexus-mods team yet. In the meantime: ship to users, build an install base, and let actual adoption do the talking. We stay current with upstream merges and our changes stay surgical — nothing stops a future reconciliation.

---

## What's done

| Milestone | Shipped    | What it delivered                                                                              |
| --------- | ---------- | ---------------------------------------------------------------------------------------------- |
| v1.0      | 2026-03-31 | Boot on Linux: runtime libs, winapi shim, native addons, FOMOD (.NET 9), IPC                   |
| v2.0      | 2026-04-01 | Steam/Proton detection, AppImage + .deb packaging, NXM protocol handler                        |
| v3.0      | 2026-04-01 | Save game management, pkexec elevation, polkit action, SteamOS fallback                        |
| v4.0      | 2026-04-07 | Polkit session caching (.deb), Steam Deck failure UX, save transfer, case-folding fs shim      |
| v5.0      | 2026-04-09 | fomod-installer source path normalization, CSharpScript Linux warning, vortex-api declarations |
| v6.0      | 2026-04-15 | chattr+F kernel casefold for mod staging (ext4/btrfs dual-path); automated upstream rebase CI  |

**Not yet tested on real hardware** (code-complete, needs a live box):

- ELEV-04: polkit `AUTH_ADMIN_KEEP` session caching on desktop Linux
- ELEV-05: full elevation E2E on desktop Linux (hardlinks, permission repair, session re-use)
- ELEV-06: Steam Deck Game Mode failure toast UX
- SAVE-05: live save transfer on real Proton/Linux install
- PROT-01: NXM download on real AppImage/deb hardware

---

## Upstream path

We haven't found a way to work with the nexus-mods team yet. That's not permanent.

The `linux-port` branch stays clean and current. When there's an opening — a new maintainer, a community push, a shift in upstream priorities — the work is ready to go.

In the meantime, one thing worth doing: file a single GitHub Discussion in nexus-mods/Vortex asking "We maintain a Linux-compatible fork — what would a mergeable contribution look like to your team?" No pressure. Just an open question that keeps the conversation available. Then let the install base speak.

Platform guards are additive, the diff is minimal, and the Windows build never breaks. If upstream ever wants to merge, the work is set up to land cleanly.
