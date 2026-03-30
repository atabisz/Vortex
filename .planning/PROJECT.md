# Vortex Linux Support — Phase 1: Boot on Linux

## What This Is

Vortex is an Electron-based mod manager for Nexus Mods, currently Windows-only. This milestone ports it to Linux — starting with Phase 1: getting Vortex to launch and run on Linux without breaking the existing Windows build. The approach is surgical: platform-guarded additions, no large refactors, Windows CI stays green throughout.

## Core Value

`pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine.

## Requirements

### Validated

- ✓ Vortex launches and runs on Windows — existing
- ✓ Mod installation via FOMOD installer (.exe/.dll, C#/.NET) — existing
- ✓ Native addons (bsatk, esptk, loot, vortexmt, gamebryo-savegame, bsdiff-node, xxhash-addon) built for Windows — existing
- ✓ Elevation via Windows UAC + named pipes — existing
- ✓ Steam game detection on Windows via gamestore-steam extension — existing
- ✓ proton.ts foundation for Proton/Wine path resolution — existing

### Active

- [ ] Devcontainer includes Electron runtime libraries for Linux (libglib2.0-0, libnss3, libatk, etc.)
- [ ] All C++ native addons compile and run on Linux (bsatk, esptk, loot, bsdiff-node, xxhash-addon audited/ported)
- [ ] winapi-bindings replaced with a Linux shim (pkexec for ShellExecuteEx, no-ops for registry/UAC functions)
- [ ] FOMOD installer recompiled for Linux using .NET 9 (Linux binary, not .exe)
- [ ] Elevation model works on Linux: pkexec + Unix domain sockets replacing named pipes
- [ ] Windows build, tests, and CI remain unaffected throughout

### Out of Scope

- Steam/Proton game detection and prefix resolution — Phase 2
- AppImage / .deb packaging and distribution — Phase 3
- Auto-updater CI/CD changes — Phase 3
- Native Linux game support (GOG, Heroic, itch.io) — Phase 4
- Steam Deck Flatpak investigation — Phase 3 or later (AppImage works in Desktop Mode without Flatpak)
- vortexmt and gamebryo-savegame Linux compilation — pending audit for Windows deps (may slip to Phase 2)

## Context

Vortex is an existing, production Electron app with a Redux state model. The codebase already has:
- `src/util/linux/proton.ts` — Proton path resolution foundation
- Platform guards (`if (process.platform !== 'win32')`) in multiple extensions
- .NET 9 installed in the devcontainer (Linux-native FOMOD compilation is viable)
- Flatpak Steam detection already exists in gamestore-steam extension

The primary modding use case on Linux is Proton-managed Windows games (Skyrim, Fallout 4, Cyberpunk, BG3 via Steam). Native Linux game support is a separate, smaller use case deferred until Track 1 (Phases 1-3) is stable.

**Windows compatibility is non-negotiable:** all changes must be additive or platform-guarded. No modifications to Windows code paths. Windows CI must stay green after every commit.

**Steam Deck is a first-class target:** AppImage format (Phase 3) must work in Desktop Mode. Flatpak investigation deferred until after Phase 3 stabilizes.

## Constraints

- **Compatibility**: Windows build must never break — platform guards, not replacements
- **Diff size**: Prefer small, additive changes over refactors — no gutting existing modules
- **Dependencies**: No new runtime deps that affect Windows (Linux-only deps are fine)
- **FOMOD**: .NET 9 recompile path chosen — Wine wrapper explicitly rejected
- **Heroic Launcher**: Deferred to Phase 4 (not Phase 2)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FOMOD: recompile for Linux via .NET 9 | Native Linux binary, no Wine dep, .NET 9 already in devcontainer | — Pending |
| winapi-bindings: platform shim (not removal) | Registry/UAC functions are already guarded — shim only replaces the module binding | — Pending |
| Steam Deck: AppImage (not Flatpak) | Flatpak sandbox restrictions on ~/.steam need validation; AppImage works today | — Pending |
| Heroic Launcher: deferred to Phase 4 | Phase 2 focus is Steam only; Heroic adds complexity without core validation | — Pending |
| Elevation scope: audit first | Most Steam libraries are user-owned — pkexec may not be needed at all | — Pending |
| Milestone scope: Phase 1 only | Ship "boots on Linux" before planning Phases 2-3; validate feasibility first | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after initialization*
