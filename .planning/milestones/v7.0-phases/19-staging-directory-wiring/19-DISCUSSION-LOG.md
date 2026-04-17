# Phase 19: Staging Directory Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 19-staging-directory-wiring
**Areas discussed:** Staging path suggestion, Disk-space todo visibility, Windows example path replacements, Partition-exists check

---

## Staging Path Suggestion

| Option | Description | Selected |
|--------|-------------|----------|
| Game install dir parent | Use game install dir as device anchor; suggest path relative to it | ✓ |
| XDG_DATA_HOME sibling on that device | Find XDG-like path on game's device | |
| suggestInstallPathDirectory config at device root | Mirror Windows: config dir at device root via /proc/mounts or stat.dev scan | |

**User's choice:** Game install dir parent
**Notes:** Follow-up determined to walk up to mountpoint boundary via stat.dev comparison (same technique used in chattr code). Use `suggestInstallPathDirectory` config value (defaults to 'vortex_mods') for folder name, same as Windows.

### Walk strategy sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| Walk up to mountpoint boundary | Use stat.dev to walk until device changes | ✓ |
| Fixed 3 levels up | SteamLibrary/steamapps/common/GameName → 3 up = SteamLibrary | |
| Use discovery path directly | Use modPaths[''] as device anchor as-is | |

### Folder name sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse suggestInstallPathDirectory config | Same as Windows, defaults to 'vortex_mods' | ✓ |
| Hardcode 'vortex_mods' | Simpler, diverges from Windows if user customized | |

---

## Disk-Space Todo Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible on Linux | Show unconditionally as informational items | ✓ |
| Mirror Windows threshold behavior | Use statfs() for actual low-disk check, async/sync bridge needed | |

**User's choice:** Always visible on Linux
**Notes:** Cleaner, no async complexity. Todos become informational path-display items rather than low-disk warnings.

---

## Windows Example Path Replacements

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with Linux examples | ~/.local/share/Vortex/downloads for downloads | ✓ |
| Strip Windows-only example lines | Remove without Linux equivalent | |
| You decide | Claude picks | |

**Downloads path:** `~/.local/share/Vortex/downloads`

### Staging and mods path examples

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with Linux examples | ~/.local/share/Vortex/<game> and ~/.local/share/Vortex/mods/{game} | ✓ |
| Strip Windows-only example lines | Remove without equivalent | |
| You decide | Claude picks | |

### Settings.tsx staging tooltip

| Option | Description | Selected |
|--------|-------------|----------|
| Platform-guard and show Linux paths | ~/.local/share/Vortex/<game> and /{mountpoint}/vortex_mods/<game id> | ✓ |
| Skip — tooltip is minor | Only fix the prominent examples | |

**Notes:** All three locations get platform-guarded replacements. Windows text unchanged, Linux arm added alongside.

---

## Partition-Exists Check (ONBRD-02b)

| Option | Description | Selected |
|--------|-------------|----------|
| statAsync on path prefix | Walk up from instPath until existing ancestor found | ✓ |
| Check /proc/mounts for mount prefix | Parse /proc/mounts for mount entry prefix | |
| Skip — ENOENT from statAsync is enough | Let existing ENOENT path handle it | |

**User's choice:** statAsync walk

### Behavior when no ancestor found

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror Windows exactly | partitionExists = false, block purge | ✓ |
| Always allow purge attempt on Linux | Don't set partitionExists = false | |

**Notes:** Consistent downstream behavior — same "can't purge a non-existing partition" error path as Windows.

---

## Claude's Discretion

- Exact wording of Linux example strings
- Whether to add debug logging at suggestStagingPath Linux branch
- Loop vs recursion for statAsync partition walk

## Deferred Ideas

- Actual statfs() disk-space threshold check on Linux (show todos only when low) — out of scope for v7.0
- /proc/mounts parsing for mountpoint detection — overkill vs stat.dev walk
