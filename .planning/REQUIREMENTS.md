# Requirements: Vortex Linux Port — v3.0 Save Games + Elevation

**Milestone:** v3.0
**Goal:** Skyrim SE and Fallout 4 save game management works in Vortex on Linux, and operations that require elevated privileges no longer silently fail.
**Status:** Active
**Last updated:** 2026-04-01

---

## Milestone Requirements

### Save Game Management (SAVE)

- [x] **SAVE-01**: `gamebryo-savegame` native addon compiles and loads on Linux CI — `MoreInfoException` base class ported from MSVC `std::exception(std::runtime_error(...))` to `std::runtime_error`; `binding.gyp` gains `OS=="linux"` condition with `-llz4 -lz` linker flags; `pnpm patch` applied and pinned to exact package version; `@electron/rebuild` verifies `.node` loads without linker errors
- [x] **SAVE-02**: Save game manager UI lists saves for Skyrim SE on Linux — character name, level, location, timestamp, and screenshot thumbnail visible; save files read from correct Wine prefix path (`compatdata/<appid>/pfx/.../My Games/Skyrim Special Edition/Saves`) not `~/Documents`
- [x] **SAVE-03**: Save game manager UI lists saves for Fallout 4 on Linux — same as SAVE-02 but for Fallout 4; both primary Bethesda titles covered
- [x] **SAVE-04**: Profile-scoped saves work on Linux — `SLocalSavePath` INI patching writes to correct Wine prefix path; save files associated with the active mod profile in Vortex

### Elevation (ELEV)

- [ ] **ELEV-01**: `runElevated()` uses `pkexec` on Linux — Unix domain socket server listens before `pkexec` is spawned (socket-before-spawn ordering enforced); pkexec exit code 126 maps to `UserCanceled`; injectable spawner seam for CI testing; no elevation-related hangs or crashes on Linux
- [x] **ELEV-02**: SteamOS / Steam Deck elevation handled gracefully — `isSteamOS()` detected via `/etc/os-release`; `sudo -n` fallback attempted before pkexec; if both fail, user receives actionable notification rather than a hung UI
- [x] **ELEV-03**: `.deb` package installs a polkit action file — `io.nexusmods.vortex.policy` installed in `.deb` post-install hook; Vortex elevation requests display a branded polkit dialog instead of the generic `pkexec` prompt on desktop Linux

---

## Future Requirements (Deferred)

- **SAVE-05**: Save transfer between profiles on Linux — pure file copy; trivial once SAVE-04 paths confirmed; defer to v4.0
- **ELEV-04**: Persistent elevation token (session-scoped polkit rule) — high complexity, low-frequency need; defer to v4.0
- **PROT-03**: NXM handler via Steam Browser overlay on Steam Deck — requires hardware + Nexus Mods web team; deferred from v2.0
- **DIST-05**: AppImage delta auto-update on SteamOS immutable filesystem — deferred from v2.0

---

## Out of Scope

- Steam cloud save conflict detection — requires Valve cloud API; substantial new complexity
- Native Linux game support (GOG, itch.io) — separate track, deferred to v4.0+
- Heroic Launcher integration — deferred to v4.0+
- gamebryo-savegame for games beyond Skyrim SE and Fallout 4 — validate core path first
- Flatpak distribution — AppImage works; Flatpak sandbox restrictions need separate validation

---

## Traceability

| Requirement | Phase | Plan |
|-------------|-------|------|
| SAVE-01 | Phase 9 | — |
| ELEV-01 | Phase 9 | — |
| SAVE-02 | Phase 10 | — |
| SAVE-03 | Phase 10 | — |
| SAVE-04 | Phase 10 | — |
| ELEV-02 | Phase 10 | — |
| ELEV-03 | Phase 10 | — |

*Plans filled by `/gsd:plan-phase`*
