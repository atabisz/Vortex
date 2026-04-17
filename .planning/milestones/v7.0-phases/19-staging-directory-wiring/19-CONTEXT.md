# Phase 19: Staging Directory Wiring - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the staging directory setup flow for Linux: make the disk-space todos visible on Linux (always-on, informational), fix the partition-exists check to use statAsync instead of winapi + Windows error codes, replace Windows example paths in help text with Linux-appropriate equivalents, and make suggestStagingPath() device-aware on Linux so it suggests a path on the game's actual device rather than always falling back to userData.

**In scope:** ONBRD-02a, ONBRD-02b, ONBRD-02c, ONBRD-02d
**Out of scope (Phase 20):** Windows string purge in error paths (UAC dialogs, nativeErrors.ts, download Settings error text)

</domain>

<decisions>
## Implementation Decisions

### Disk-Space Todos Visibility (ONBRD-02a)

- **D-01:** `minDiskSpace()` on Linux returns `true` unconditionally (always show todo) rather than checking actual disk space. The todos become informational "here's your path, click to change it" items on Linux — not low-disk-space warnings. No async/sync complexity needed.
- **D-02:** Both `download-location` and `mod-location` todos become always-visible on Linux. The `value` renderer already has a Linux branch that returns the raw path (added in Phase 18) — that branch is now reached because the condition is `true`.

### Partition-Exists Check (ONBRD-02b)

- **D-03:** Replace `winapi.GetVolumePathName(instPath)` + Windows error-code-2 check with a platform-guarded Linux path: walk up from `instPath` using `fs.statAsync` until an accessible ancestor is found. If no ancestor exists up to `/`, set `partitionExists = false`. Mirrors Windows behavior exactly — same downstream: Reinitialize shows "can't purge" error.
- **D-04:** The statAsync walk is the Linux arm only — Windows keeps `winapi.GetVolumePathName` unchanged.

### Suggest Staging Path — Device Awareness (ONBRD-02d)

- **D-05:** `suggestStagingPath()` currently short-circuits on Linux and always returns `{USERDATA}/{game}/mods`. Replace with device-aware logic on Linux:
  1. Stat both `modPaths['']` (game install path ancestor) and `getVortexPath('userData')`.
  2. If same `stat.dev` → use `{USERDATA}/{game}/mods` (same device, existing behavior is correct).
  3. If different `stat.dev` → walk up from `modPaths['']` using `stat.dev` comparison to find the mountpoint boundary (the deepest directory still on the same device as the game). Then suggest `{mountpoint}/{suggestInstallPathDirectory}/{game}`.
- **D-06:** Use `state.settings.mods.suggestInstallPathDirectory` (defaults to `'vortex_mods'`) as the folder name, same as Windows. No new config value.
- **D-07:** The mountpoint walk uses `statSync.dev` identity — same reasoning the chattr code uses for device detection. Walk parent dirs until `stat.dev` changes, then step back one level.

### Windows Path Example Replacements (ONBRD-02c)

- **D-08:** All three locations get platform-guarded replacements. Windows text is unchanged; Linux arm is added alongside:

  | Location | Windows text replaced | Linux replacement |
  |---|---|---|
  | `texts.ts` downloads case | `C:\Users\Mike\AppData\Roaming\Vortex\Downloads\` | `~/.local/share/Vortex/downloads` |
  | `texts.ts` modspath case | `d:\vortex_mods\{GAME}` example | `~/.local/share/Vortex/mods/{game}` |
  | `Settings.tsx` staging toggle tooltip | `c:\Users\<username>\AppData\Roaming\Vortex\<game>` and `<drive>:\{suggestionPattern}\<game id>` | `~/.local/share/Vortex/<game>` and `/{mountpoint}/vortex_mods/<game id>` |

- **D-09:** Pattern: use `process.platform === 'linux'` guard wrapping the entire interpolated string, not per-substring substitution. Consistent with the Phase 18 platform guard pattern.

### Claude's Discretion

- Exact wording of the Linux example strings (e.g. whether to use `~/.local/share` vs `$HOME/.local/share` in the displayed text — use `~/.local/share` as it's more readable to users).
- Whether to add a `log('debug', ...)` at the suggestStagingPath Linux branch.
- Whether the statAsync walk in the partition check uses a loop or recursion — implementation detail.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Staging Directory Setup (ONBRD-02) — all four sub-requirements

### Key Source Files
- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` — `minDiskSpace()` condition function; `download-location` and `mod-location` todos (lines ~20-160)
- `src/renderer/src/extensions/mod_management/stagingDirectory.ts` — `GetVolumePathName` + error-code-2 partition check (lines ~155-167)
- `src/renderer/src/extensions/gamemode_management/util/discovery.ts:832` — `suggestStagingPath()` function; Linux already has a partial branch (`process.platform !== 'win32'` always returns `{USERDATA}`)
- `src/renderer/src/extensions/mod_management/texts.ts` — downloads and modspath help text with Windows path examples (lines ~86-118)
- `src/renderer/src/extensions/mod_management/views/Settings.tsx` — staging path mode tooltip with Windows path examples (lines ~219-233)

### Patterns to Follow
- `src/renderer/src/util/fs.ts` — `statfs` already imported from `node:fs/promises` and used in `applyChattrCasefold`; `statAsync` available for the partition walk
- `src/renderer/src/util/elevated.ts` — platform guard pattern (`process.platform === 'linux'`) and module-level state caching
- Phase 18 CONTEXT.md — D-01/D-02 established that `minDiskSpace()` returns `false` on Linux (todos hidden); Phase 19 flips to `true` (always visible)

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fs.statAsync` (from `src/renderer/src/util/fs.ts`): already available in `stagingDirectory.ts` (used on line ~171); use for partition walk
- `suggestStagingPath()` in `discovery.ts`: already has `process.platform !== 'win32'` branch — extend it rather than add a new guard
- `state.settings.mods.suggestInstallPathDirectory`: already read in `suggestStagingPath()` for the Windows path — reuse for Linux too

### Established Patterns
- Platform guard: `if (process.platform === 'linux') { ... }` — used throughout fs.ts, elevated.ts, todos.tsx
- Device identity: `stat.dev` comparison to identify mountpoint boundary — used in `applyChattrCasefold` logic
- `statAsync` walk: pattern of walking parent dirs exists conceptually in `suggestStagingPath()` itself (`idModPath` recursive walk for ENOENT)

### Integration Points
- `todos.tsx` `minDiskSpace()`: change `return false` on Linux to `return true` — one-line change
- `stagingDirectory.ts` partition check: wrap the `winapi.GetVolumePathName` block in `if (process.platform === 'win32')`, add `else` with statAsync walk
- `discovery.ts` `suggestStagingPath()`: replace `process.platform !== 'win32'` shortcircuit with device-aware Linux logic using `stat.dev`
- `texts.ts`: wrap Windows example strings with ternary or `process.platform === 'linux'` branch per `t()` call
- `Settings.tsx`: same pattern — ternary on `process.platform` within the `t()` string body

</code_context>

<specifics>
## Specific Ideas

- **Disk-space todos**: Phase 18 context (D-01) deliberately left `minDiskSpace()` returning `false` on Linux so the todos were hidden. Phase 19 flips to `true` — todos are now always visible as informational items. The `value` renderer already shows the raw path on Linux (Phase 18 D-02). Clean handoff.
- **suggestStagingPath device walk**: The function already has `idModPath()` which walks up on ENOENT. The device walk for finding the mountpoint can follow a similar recursive pattern but stops on `stat.dev` change rather than ENOENT.
- **Partition check**: `stagingDirectory.ts` already imports `fs` (the custom fs wrapper with `statAsync`). No new imports needed.
- **Path examples**: The ONBRD-02c requirement says "replaced with Linux-appropriate paths under a platform guard" — the Windows text is preserved, not deleted. Important for upstream diff minimality.

</specifics>

<deferred>
## Deferred Ideas

- Actual disk-space check on Linux using `statfs()` (show todo only when below threshold, mirroring Windows) — deferred; always-visible is simpler and sufficient for v7.0
- /proc/mounts parsing for more accurate mountpoint detection — overkill; stat.dev walk is correct and already used in the codebase
- Full drive enumeration from /proc/mounts for getDriveList — Phase 19 or later backlog

</deferred>

---

*Phase: 19-staging-directory-wiring*
*Context gathered: 2026-04-16*
