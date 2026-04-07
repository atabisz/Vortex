# Phase 10: Save UI Validation + SteamOS + Polkit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 10-save-ui-validation-steamos-polkit
**Areas discussed:** Save path resolution, SLocalSavePath (SAVE-04), SteamOS elevation fallback, Polkit .policy file

---

## Save Path Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror ini_prep exactly | Call steam.allGames(), match by discovery path to get compatDataPath, pass to getMyGamesPath(). Same code pattern as ini_prep/gameSupport.ts — consistent, already validated in Phase 6. | ✓ |
| Extract shared utility | Move the steamEntry lookup + getMyGamesPath call into a shared util (e.g. linux/proton.ts), imported by both ini_prep and savegame-management. More DRY, slightly more surgery. | |
| Read from Redux state | If the game discovery already stores compatDataPath in Redux state, avoid the steam.allGames() call entirely and read from there. | |

**User's choice:** Mirror ini_prep exactly

---

| Option | Description | Selected |
|--------|-------------|----------|
| Async wrapper on mygamesPath() | Make mygamesPath() async, do the steam.allGames() lookup inside it when process.platform === 'linux'. All callers get the fix in one place — mirrors how ini_prep does it. | ✓ |
| Patch each call site | Add Linux branches at each of the 3-4 places that call mygamesPath(). More explicit but spreads the change across multiple locations. | |
| You decide | Whatever approach keeps the diff smallest and stays consistent with ini_prep patterns. | |

**User's choice:** Async wrapper on mygamesPath()

---

## SLocalSavePath (SAVE-04)

| Option | Description | Selected |
|--------|-------------|----------|
| INI path only — relative value stays | The SLocalSavePath value in the INI is relative (e.g. 'Saves\profile-id') and Bethesda games interpret it relative to {mygames}. The fix is only in how gamebryo-savegame-management finds the INI file path, not the value written inside it. | ✓ |
| Both: INI path AND value need Linux fix | The path separator or base path in the written value may also be wrong on Linux — needs separate investigation. | |
| Not sure — investigate during planning | Too uncertain to decide now; leave it for the planner to verify. | |

**User's choice:** INI path only — relative value stays

---

| Option | Description | Selected |
|--------|-------------|----------|
| Just verify it wires through ini_prep correctly | The setSavePath() in savegame index.ts just sets iniFile.data.General.SLocalSavePath. Verify ini_prep already handles the file path correctly on Linux — no code change needed here if so. | ✓ |
| setSavePath needs its own Linux branch | setSavePath() directly opens the INI file itself, bypassing ini_prep's path resolution — needs its own fix. | |
| Investigate during planning | Check exactly how setSavePath resolves the INI file path before deciding. | |

**User's choice:** Just verify it wires through ini_prep correctly

---

## SteamOS Elevation Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| sudo -n fallback, then notify | Try sudo -n (passwordless sudo) first. If that also fails, throw UserCanceled with a user-visible notification. Non-blocking — user can dismiss and continue. | ✓ |
| Skip elevation, log warning | On SteamOS, silently skip the elevated operation and log a warning. | |
| Hard error with actionable message | Throw an error (not UserCanceled) that surfaces a notification with steps to switch to Desktop Mode. Blocks the operation but doesn't crash. | |

**User's choice:** sudo -n fallback, then notify

---

| Option | Description | Selected |
|--------|-------------|----------|
| Read /etc/os-release, check ID=steamos | Parse /etc/os-release at runtime, look for ID=steamos or ID_LIKE containing steamos. Sync read on first call, cached. Standard Linux OS detection approach. | ✓ |
| Check STEAM_DECK env var | Valve sets STEAM_DECK=1 in Steam Deck Game Mode. Fast, but only works in Game Mode — Desktop Mode wouldn't be detected. | |
| You decide | Claude picks the most reliable detection approach. | |

**User's choice:** Read /etc/os-release, check ID=steamos

---

## Polkit .policy File

| Option | Description | Selected |
|--------|-------------|----------|
| Single action: run-elevated | One action: io.nexusmods.vortex.run-elevated. auth_admin for all contexts. Simple, matches what pkexec triggers in practice. | ✓ |
| Granular per-operation actions | Separate actions for file operations (install-mod, delete-mod, etc). More user-visible granularity but substantially more complex. | |
| You decide | Claude picks the appropriate polkit action scope. | |

**User's choice:** Single action: run-elevated

---

| Option | Description | Selected |
|--------|-------------|----------|
| electron-builder extraFiles | Add the .policy file to linux.extraFiles in electron-builder.config.cjs so it gets bundled at /usr/share/polkit-1/actions/. Same pattern as .so file already there. | ✓ |
| postinst script only | Write a postinst script that copies the .policy file from Vortex resources dir on install. Explicit, no extraFiles needed. | |
| You decide | Claude picks the right deb packaging approach. | |

**User's choice:** electron-builder extraFiles

---

## Claude's Discretion

- Whether `getSteamEntry()` is extracted as a shared utility or duplicated in the savegame extension
- How `steam.allGames()` call is managed (fresh vs cached) in the async `mygamesPath()`
- SAVE-04 INI path wiring verification — confirm during planning whether setSavePath() bypasses ini_prep

## Deferred Ideas

- SAVE-05: Save transfer between profiles on Linux — v4.0
- ELEV-04: Persistent elevation token (session-scoped polkit rule) — v4.0
- Other Bethesda game save paths beyond Skyrim SE and Fallout 4
- SteamOS Flatpak distribution
