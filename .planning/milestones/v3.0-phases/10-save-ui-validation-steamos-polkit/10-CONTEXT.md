# Phase 10: Save UI Validation + SteamOS + Polkit - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Three tracks:

1. **SAVE track** — Make the gamebryo-savegame-management extension find save files at the correct Wine prefix path on Linux. Requires:
   - `mygamesPath()` in `extensions/gamebryo-savegame-management/src/util/gameSupport.ts` becomes Linux-aware, mirroring the `ini_prep` pattern (call `steam.allGames()`, match by discovery path, call `getMyGamesPath(steamEntry.compatDataPath)`)
   - SAVE-02: Skyrim SE saves visible with correct fields
   - SAVE-03: Fallout 4 saves visible with correct fields
   - SAVE-04: Profile-scoped saves via `SLocalSavePath` INI patching — verify the existing ini_prep Linux path awareness covers this correctly; no code change expected unless the INI file path lookup is bypassed

2. **ELEV track (SteamOS)** — `runElevated()` does not hang or crash on SteamOS/Steam Deck. Requires:
   - `isSteamOS()` utility reads `/etc/os-release`, checks `ID=steamos` (or `ID_LIKE` containing steamos), sync on first call, cached
   - On Linux + SteamOS: attempt `sudo -n` fallback after pkexec fails; if both fail, throw `UserCanceled` with a user-visible notification explaining the Game Mode limitation
   - ELEV-02

3. **ELEV track (polkit)** — `.deb` package installs a branded polkit action file. Requires:
   - `io.nexusmods.vortex.policy` XML file with single action `io.nexusmods.vortex.run-elevated`
   - Delivered via `linux.extraFiles` in `electron-builder.config.cjs` so it lands at `/usr/share/polkit-1/actions/` on `.deb` install
   - ELEV-03

This phase does NOT cover: other game titles' save paths, save transfer between profiles, persistent elevation tokens, or SteamOS Flatpak distribution.

</domain>

<decisions>
## Implementation Decisions

### SAVE track: save path resolution

- **D-01:** Use `steam.allGames()` + `getMyGamesPath(steamEntry.compatDataPath)` in the savegame extension — **mirror `ini_prep/gameSupport.ts` exactly**. No new shared utility; keep the change local to the extension for minimal diff.
- **D-02:** Make `mygamesPath()` **async** and add the Linux branch inside it. All callers of `mygamesPath()` in the extension become async (currently: `getSavesPath()`, profile change handlers, `openSavegamesDirectory()`). One fix point, all call sites automatically covered.
- **D-03:** Linux branch guard: `if (process.platform === 'linux' && steamEntry?.usesProton && steamEntry?.compatDataPath)` — exact pattern from `ini_prep/gameSupport.ts:219-223`. Fall back to `getVortexPath("documents")` path when not a Proton game or entry not found (preserves non-Steam Linux behavior).

### SAVE-04: SLocalSavePath INI patching

- **D-04:** The `SLocalSavePath` value written to the INI is a **relative path** (e.g. `Saves\profile-id`). The game interprets it relative to `{mygames}`. This value does NOT need a Linux fix.
- **D-05:** The INI **file path** (where the `.ini` file lives on disk) goes through `ini_prep`'s `prepareINI()`, which already resolves `{mygames}` to the Wine prefix on Linux. **Verify** this wires through correctly for profile-scoped saves — no code change expected unless `setSavePath()` in `extensions/gamebryo-savegame-management/src/index.ts` bypasses `ini_prep`'s file path resolution.
- **Claude's Discretion:** Confirm during planning whether `setSavePath()` opens the INI file directly (needs its own fix) or delegates to ini_prep (works as-is). Planning should check `index.ts:44-46` where `iniFile.data.General.SLocalSavePath = savePath` is set.

### SteamOS elevation fallback (ELEV-02)

- **D-06:** Detect SteamOS via `/etc/os-release` — read the file, check for `ID=steamos` or `ID_LIKE` containing `steamos`. Sync read on first call, cached in a module-level variable.
- **D-07:** On SteamOS + pkexec failure: attempt `sudo -n [process.execPath] --run [tmpPath]` as fallback. If `sudo -n` also fails (exit code 1 or ENOENT), reject with `UserCanceled` and surface a **non-blocking notification** to the user: *"Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation."*
- **D-08:** `isSteamOS()` and the SteamOS branch live in `elevated.ts` — same file as the pkexec branch. No new file needed.
- **D-09:** On non-SteamOS Linux (standard desktop), behavior is unchanged from Phase 9: pkexec only, exit 126 → `UserCanceled`, other non-zero → descriptive error.

### Polkit .policy file (ELEV-03)

- **D-10:** Single polkit action: `io.nexusmods.vortex.run-elevated`. `auth_admin` for all contexts (active, inactive, local). Display name: `"Vortex Mod Manager"`. Description: `"Vortex needs elevated privileges to modify game files."`.
- **D-11:** Deliver via `linux.extraFiles` in `electron-builder.config.cjs` — add an entry mapping `build/linux/io.nexusmods.vortex.policy` → `/usr/share/polkit-1/actions/io.nexusmods.vortex.policy`. The `.policy` file lives at `build/linux/io.nexusmods.vortex.policy` in the repo.
- **D-12:** No postinst script changes — `extraFiles` handles placement automatically during `.deb` packaging.

### Claude's Discretion

- How `steam.allGames()` is called in `mygamesPath()` — whether it's called fresh each time or if there's a cached result available from the extension's existing `update` watcher. Keep it simple; a fresh call per mygames lookup is acceptable.
- Whether `getSteamEntry()` from `ini_prep/index.ts` should be extracted as a shared utility or duplicated into the savegame extension. Either is acceptable — match whichever approach keeps the diff smallest.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §SAVE-02, SAVE-03, SAVE-04, ELEV-02, ELEV-03 — exact acceptance criteria for all five requirements

### SAVE track — files to modify
- `extensions/gamebryo-savegame-management/src/util/gameSupport.ts` — `mygamesPath()` at line 166; this function needs to become async and gain a Linux branch
- `extensions/gamebryo-savegame-management/src/index.ts` — all callers of `mygamesPath()` (getSavesPath at line 163, profile change handlers at lines 265, 311, 326); `setSavePath()` at lines 36-49 (check if it bypasses ini_prep path resolution)

### SAVE track — Linux path resolution pattern to mirror
- `src/renderer/src/extensions/ini_prep/gameSupport.ts` lines 214-241 — `iniFiles()` function; Linux branch at lines 219-223 using `getMyGamesPath(steamEntry.compatDataPath)`. **Mirror this pattern exactly in the savegame extension.**
- `src/renderer/src/extensions/ini_prep/index.ts` lines 36-50 — `getSteamEntry()` helper (calls `steam.allGames()`, matches by `discovery.path`). Either import or duplicate this pattern.
- `src/renderer/src/util/linux/proton.ts` — `getMyGamesPath(compatDataPath)` at line 22

### ELEV track — files to modify
- `src/renderer/src/util/elevated.ts` — pkexec branch at lines 189-205; add `isSteamOS()` check before/within the Linux branch; add `sudo -n` fallback and UserCanceled notification on SteamOS

### ELEV track — detection reference
- `/etc/os-release` — standard Linux OS identification file; `ID=steamos` for Steam Deck/SteamOS

### Polkit — new file to create
- `build/linux/io.nexusmods.vortex.policy` — new polkit action XML file (create from scratch; standard freedesktop.org PolicyKit format)

### Polkit — packaging config
- `src/main/electron-builder.config.cjs` — `linux.extraFiles` array (currently used for FOMOD .so at line 94); add `.policy` entry here

### Prior phase patterns
- `.planning/phases/09-native-addon-fix-elevation-foundation/09-CONTEXT.md` — pkexec branch decisions (D-elevated section)
- `.planning/phases/06-steam-proton-detection/06-CONTEXT.md` — `getMyGamesPath` and Steam detection patterns

### Roadmap
- `.planning/ROADMAP.md` §Phase 10 — success criteria list (5 items)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/renderer/src/util/linux/proton.ts:22` — `getMyGamesPath(compatDataPath: string): string` — already resolves `<compatDataPath>/pfx/drive_c/users/steamuser/Documents/My Games`
- `src/renderer/src/extensions/ini_prep/index.ts:36-50` — `getSteamEntry(discovery)` — calls `steam.allGames()` and matches by discovery path; either import or duplicate for the savegame extension
- `src/renderer/src/extensions/ini_prep/gameSupport.ts:214-241` — `iniFiles()` Linux branch — exact pattern to mirror in `mygamesPath()`

### Established Patterns
- `process.platform === 'linux'` guard — used consistently; use same in `mygamesPath()` and `isSteamOS()` detection
- `steam.allGames()` — available in renderer process; used by ini_prep already
- `extraFiles` in electron-builder — already used at line 94 for FOMOD .so file; same array for .policy file

### gamebryo-savegame-management current state
- `mygamesPath(gameMode)` at line 166: `path.join(util.getVortexPath("documents"), "My Games", gameSupport.get(gameMode, "mygamesPath"))` — **no Linux override**; this is the root cause of SAVE-02/SAVE-03
- `getSavesPath(profile)` at line 163: calls `mygamesPath(profile.gameId)` + `savePath` — becomes async once `mygamesPath` does
- Profile change handlers at lines 265, 311, 326: also call `mygamesPath()` — all become async

### elevated.ts current state (post-Phase 9)
- pkexec branch at lines 189-205: `process.platform === 'linux'` guard, spawns pkexec, exit 126 → UserCanceled
- No `isSteamOS()` function exists anywhere in the codebase — needs to be created
- `UserCanceled` already imported at line 10 — use for the SteamOS fallback failure case

### Integration Points
- `extensions/gamebryo-savegame-management/src/util/gameSupport.ts:166` — `mygamesPath()` → needs Linux async override
- `src/renderer/src/util/elevated.ts:189` — Linux pkexec block → add `isSteamOS()` + sudo -n branch
- `src/main/electron-builder.config.cjs` — `linux.extraFiles` array → add `.policy` entry
- `build/linux/` — new directory for polkit `.policy` file (create if doesn't exist)

</code_context>

<specifics>
## Specific Ideas

- `mygamesPath()` async change: the `getSteamEntry` call needs `discovery` (the game discovery result for the current game). The savegame extension has access to `context.api` — use `context.api.getState()` → `state.settings.gameMode.discovered[gameMode]` to get the discovery object, then call `steam.allGames()` to match.
- SteamOS notification wording: *"Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation."* — plain, actionable, no jargon.
- Polkit XML template: standard freedesktop.org format. `<action id="io.nexusmods.vortex.run-elevated">` with `<defaults>` block setting `allow_active`, `allow_inactive`, `allow_any` all to `auth_admin`.
- `isSteamOS()` can use `fs.readFileSync('/etc/os-release', 'utf8')` in a try/catch; cache result in module-level `let _isSteamOS: boolean | undefined`. Return `false` if the file doesn't exist (not SteamOS).
- `sudo -n` invocation: `spawn('sudo', ['-n', process.execPath, '--run', tmpPath])` — same injectable spawner seam as pkexec.

</specifics>

<deferred>
## Deferred Ideas

- Save transfer between profiles on Linux (SAVE-05) — pure file copy once SAVE-04 paths confirmed; v4.0
- Persistent elevation token (session-scoped polkit rule, ELEV-04) — high complexity; v4.0
- Other Bethesda game titles' save paths (beyond Skyrim SE and Fallout 4) — validate core path first
- SteamOS Flatpak distribution — AppImage works; Flatpak sandbox restrictions need separate validation

None outside these — discussion stayed within Phase 10 scope.

</deferred>

---

*Phase: 10-save-ui-validation-steamos-polkit*
*Context gathered: 2026-04-01*
