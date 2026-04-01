# Phase 10: Save UI Validation + SteamOS + Polkit - Research

**Researched:** 2026-04-01
**Domain:** Electron/TypeScript — Wine prefix path resolution, polkit policy packaging, SteamOS elevation fallback
**Confidence:** HIGH

## Summary

Phase 10 has three independent tracks: make the `gamebryo-savegame-management` extension find save files at the correct Proton/Wine prefix path on Linux (SAVE-02, SAVE-03, SAVE-04); add SteamOS-aware graceful degradation to `runElevated()` instead of a hang or crash (ELEV-02); and ship a branded polkit action file in the `.deb` package (ELEV-03).

All required patterns are already in the codebase. The SAVE track mirrors `ini_prep/index.ts:getSteamEntry()` + `ini_prep/gameSupport.ts:iniFiles()` which already handles Proton path resolution. The ELEV-02 track adds `isSteamOS()` and a `sudo -n` fallback inside `elevated.ts`, using the existing injectable spawner seam. The ELEV-03 track adds one XML file and one config entry to `electron-builder.config.cjs`.

The SAVE-04 analysis confirms a secondary bug: `iniPath()` in the savegame extension calls the non-Linux-aware `mygamesPath()`, so the `apply-settings` path comparison on line 306 of `index.ts` always fails on Linux. Once `mygamesPath()` becomes async and Linux-aware, `iniPath()` must also become async and `iniPath`-callers must be updated.

**Primary recommendation:** Make `mygamesPath()` async + Linux-aware first; derive all fixes (getSavesPath, iniPath, iniPath callers, profile change handlers, onLoadSaves, onRemoveSavegames, onTransferSavegames) from that single change. Then implement ELEV-02 + ELEV-03 independently.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SAVE track: save path resolution**
- **D-01:** Use `steam.allGames()` + `getMyGamesPath(steamEntry.compatDataPath)` in the savegame extension — mirror `ini_prep/gameSupport.ts` exactly. No new shared utility; keep the change local to the extension for minimal diff.
- **D-02:** Make `mygamesPath()` async and add the Linux branch inside it. All callers of `mygamesPath()` in the extension become async (currently: `getSavesPath()`, profile change handlers, `openSavegamesDirectory()`). One fix point, all call sites automatically covered.
- **D-03:** Linux branch guard: `if (process.platform === 'linux' && steamEntry?.usesProton && steamEntry?.compatDataPath)` — exact pattern from `ini_prep/gameSupport.ts:219-223`. Fall back to `getVortexPath("documents")` path when not a Proton game or entry not found (preserves non-Steam Linux behavior).

**SAVE-04: SLocalSavePath INI patching**
- **D-04:** The `SLocalSavePath` value written to the INI is a relative path (e.g. `Saves\profile-id`). The game interprets it relative to `{mygames}`. This value does NOT need a Linux fix.
- **D-05:** The INI file path (where the `.ini` file lives on disk) goes through `ini_prep`'s `prepareINI()`, which already resolves `{mygames}` to the Wine prefix on Linux. Verify this wires through correctly for profile-scoped saves — no code change expected unless `setSavePath()` in `extensions/gamebryo-savegame-management/src/index.ts` bypasses `ini_prep`'s file path resolution.
- **Claude's Discretion:** Confirm during planning whether `setSavePath()` opens the INI file directly (needs its own fix) or delegates to ini_prep (works as-is). Planning should check `index.ts:44-46` where `iniFile.data.General.SLocalSavePath = savePath` is set.

**SteamOS elevation fallback (ELEV-02)**
- **D-06:** Detect SteamOS via `/etc/os-release` — read the file, check for `ID=steamos` or `ID_LIKE` containing `steamos`. Sync read on first call, cached in a module-level variable.
- **D-07:** On SteamOS + pkexec failure: attempt `sudo -n [process.execPath] --run [tmpPath]` as fallback. If `sudo -n` also fails (exit code 1 or ENOENT), reject with `UserCanceled` and surface a non-blocking notification: "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation."
- **D-08:** `isSteamOS()` and the SteamOS branch live in `elevated.ts` — same file as the pkexec branch. No new file needed.
- **D-09:** On non-SteamOS Linux (standard desktop), behavior is unchanged from Phase 9: pkexec only, exit 126 → `UserCanceled`, other non-zero → descriptive error.

**Polkit .policy file (ELEV-03)**
- **D-10:** Single polkit action: `io.nexusmods.vortex.run-elevated`. `auth_admin` for all contexts (active, inactive, local). Display name: "Vortex Mod Manager". Description: "Vortex needs elevated privileges to modify game files."
- **D-11:** Deliver via `linux.extraFiles` in `electron-builder.config.cjs` — add an entry mapping `build/linux/io.nexusmods.vortex.policy` → `/usr/share/polkit-1/actions/io.nexusmods.vortex.policy`. The `.policy` file lives at `build/linux/io.nexusmods.vortex.policy` in the repo.
- **D-12:** No postinst script changes — `extraFiles` handles placement automatically during `.deb` packaging.

### Claude's Discretion

- How `steam.allGames()` is called in `mygamesPath()` — whether it's called fresh each time or if there's a cached result available from the extension's existing `update` watcher. Keep it simple; a fresh call per mygames lookup is acceptable.
- Whether `getSteamEntry()` from `ini_prep/index.ts` should be extracted as a shared utility or duplicated into the savegame extension. Either is acceptable — match whichever approach keeps the diff smallest.

### Deferred Ideas (OUT OF SCOPE)

- Save transfer between profiles on Linux (SAVE-05) — pure file copy once SAVE-04 paths confirmed; v4.0
- Persistent elevation token (session-scoped polkit rule, ELEV-04) — high complexity; v4.0
- Other Bethesda game titles' save paths (beyond Skyrim SE and Fallout 4) — validate core path first
- SteamOS Flatpak distribution — AppImage works; Flatpak sandbox restrictions need separate validation
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAVE-02 | Save game manager UI lists saves for Skyrim SE on Linux — character name, level, location, timestamp, thumbnail visible; files read from Wine prefix path | `mygamesPath()` async + Linux branch in `gameSupport.ts:166`; mirrors `ini_prep:iniFiles()` pattern |
| SAVE-03 | Save game manager UI lists saves for Fallout 4 on Linux — same fields, same correct Wine prefix path | Same fix as SAVE-02; both games use same `mygamesPath()` code path |
| SAVE-04 | Profile-scoped saves: `SLocalSavePath` INI patching writes to correct Wine prefix path; saves associated with active mod profile | `iniPath()` must also become async + Linux-aware so the `apply-settings` path comparison in `index.ts:306` matches the Linux path that `ini_prep:bakeSettings` emits |
| ELEV-02 | SteamOS / Steam Deck elevation handled gracefully — `isSteamOS()` detected; `sudo -n` fallback; actionable notification if both fail | New `isSteamOS()` function in `elevated.ts`; new `sudo -n` branch after pkexec fails; reuses existing `UserCanceled` + spawner seam |
| ELEV-03 | `.deb` package installs a polkit action file — `io.nexusmods.vortex.policy` at correct system path; branded dialog replaces generic pkexec prompt | New `build/linux/io.nexusmods.vortex.policy` XML; `linux.extraFiles` entry in `electron-builder.config.cjs` |
</phase_requirements>

## Standard Stack

### Core
| Library / API | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| `steam.allGames()` | existing (src/renderer/src/util/Steam.ts) | Enumerate Steam entries with `usesProton` + `compatDataPath` | Already used by `ini_prep`; established pattern |
| `getMyGamesPath(compatDataPath)` | existing (src/renderer/src/util/linux/proton.ts:22) | Resolve Wine prefix My Games path | Canonical function for this purpose |
| `fs.readFileSync` / `fs.readSync` | Node.js built-in | Read `/etc/os-release` synchronously for SteamOS detection | Sync for first-call cache; acceptable at cold path |
| polkit PolicyKit 1.0 XML | system polkit | Declare elevation action | Freedesktop standard |

### No New Runtime Dependencies

All required functionality uses existing imports. No new packages needed.

### Installation

```bash
# No new packages
```

## Architecture Patterns

### SAVE Track: Async mygamesPath()

The `mygamesPath()` function in `extensions/gamebryo-savegame-management/src/util/gameSupport.ts` must become async and gain a Linux branch:

```typescript
// Source: mirrors ini_prep/index.ts:35-52 + ini_prep/gameSupport.ts:218-223
export async function mygamesPath(gameMode: string): Promise<string> {
  if (process.platform === "linux") {
    const discovery = discoveryForGame(gameMode);
    if (discovery?.store === "steam") {
      try {
        const entries = await steam.allGames();
        const steamEntry = entries.find(
          (e) =>
            e.gamePath !== undefined &&
            discovery.path !== undefined &&
            e.gamePath.toLowerCase() === discovery.path.toLowerCase(),
        );
        if (steamEntry?.usesProton && steamEntry?.compatDataPath) {
          return getMyGamesPath(steamEntry.compatDataPath);
        }
      } catch {
        // fall through to Windows path
      }
    }
  }
  return path.join(
    util.getVortexPath("documents"),
    "My Games",
    gameSupport.get(gameMode, "mygamesPath"),
  );
}
```

**Key insight:** `discoveryForGame` is already captured at init time via `initGameSupport(api)`. No API changes needed for the discovery lookup.

### SAVE Track: iniPath() also becomes async

Because `iniPath()` calls `mygamesPath()`, and the `apply-settings` handler at `index.ts:306` compares the incoming `filePath` (which is Linux-aware, from `ini_prep:bakeSettings` via `iniFiles()`) against `iniPath(prof.gameId)` (which was Windows-only), this comparison always returns false on Linux. Both must be made async:

```typescript
export async function iniPath(gameMode: string): Promise<string> {
  return path.join(await mygamesPath(gameMode), gameSupport.get(gameMode, "iniName"));
}
```

The `apply-settings` handler must then `await iniPath(prof.gameId)` in the comparison.

### SAVE Track: Caller Audit (Complete)

Every synchronous call site of `mygamesPath()` in `index.ts` must become async. Confirmed call sites:

| Location | Context | Fix |
|----------|---------|-----|
| `getSavesPath(profile)` at line 166 | Returns a path string | `async function getSavesPath` + `await mygamesPath()` |
| `openSavegamesDirectory()` at lines 181-182 | Calls `mygamesPath()` twice | `async function` + `await` both calls |
| `onProfilesModified()` at line 266 | Already in `onStateChange` callback — wrapped in Promise | `async function` or extract to async helper |
| `apply-settings` handler at line 311 | `onAsync` callback — already returns Promise | `await mygamesPath()` |
| `did-remove-profile` handler at line 325 | `onAsync` callback — already returns Promise | `await mygamesPath()` |
| `onLoadSaves()` at line 406 | Returns `Promise<ISavegame[]>` | `await mygamesPath()` |
| `onRemoveSavegames()` at line 533 | Returns `Promise<...>` | `await mygamesPath()` |
| `onTransferSavegames()` at lines 604-613 | Returns `Promise<...>` | `await mygamesPath()` both call sites |
| `apply-settings` path comparison at line 306 | Needs to compare against Linux-aware `iniPath` | `await iniPath(prof.gameId)` |

The `iniPath()` export is also used directly in `index.ts:306` comparison only. The `prefIniPath()` export is not called anywhere in `index.ts` (only `iniPath`). Both should become async for consistency, but only `iniPath` is strictly required.

### ELEV-02: isSteamOS() Detection Pattern

```typescript
// Source: /etc/os-release standard; D-06 from CONTEXT.md
let _isSteamOS: boolean | undefined;

function isSteamOS(): boolean {
  if (_isSteamOS !== undefined) {
    return _isSteamOS;
  }
  try {
    const content = fs.readFileSync("/etc/os-release", "utf8");
    _isSteamOS =
      /^ID=steamos$/im.test(content) ||
      /^ID_LIKE=.*steamos.*$/im.test(content);
  } catch {
    _isSteamOS = false;
  }
  return _isSteamOS;
}
```

**`/etc/os-release` on SteamOS:** Contains `ID=steamos` and `ID_LIKE=arch`. The `ID_LIKE` field is whitespace-delimited and may contain multiple values — the regex above handles that correctly.

### ELEV-02: SteamOS Branch Integration

The existing Linux block at `elevated.ts:189-205` spawns pkexec and handles close events. The SteamOS branch wraps this flow:

```
if (process.platform === "linux") {
  if (isSteamOS()) {
    // attempt sudo -n first; pkexec hangs without polkit agent in Game Mode
    attempt sudo -n process.execPath --run tmpPath
    on success: resolve(tmpPath)
    on failure (ENOENT or non-zero exit): reject(new UserCanceled()) + show notification
  } else {
    // existing pkexec branch unchanged (Phase 9 behavior)
    spawn pkexec, exit 126 → UserCanceled, other non-zero → Error
  }
}
```

**Critical ordering note (from Phase 9 pitfall):** The Unix domain socket server must be started BEFORE spawning any process (pkexec or sudo). The existing code at line 189 starts the server earlier in the flow — this ordering is already correct and must not be disturbed.

**`sudo -n` semantics:**
- Exit code 0 = succeeded (Vortex can run elevated without a password, e.g. passwordless sudo rule)
- Exit code 1 = password required (normal Steam Deck Game Mode result when no sudo rule)
- `ENOENT` = `sudo` not on PATH (unlikely on SteamOS, but handle as failure)
- The process may succeed and then the elevated child sends results via IPC — same as pkexec flow

**Notification API:** Use `api.sendNotification` is not directly available in `elevated.ts` (it does not receive `api`). The `UserCanceled` rejection will propagate to the caller, which should surface the notification. Alternatively, the existing pattern in the codebase is to throw `UserCanceled` with a message attached:

```typescript
const err = new UserCanceled();
(err as any).message = "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation.";
throw err;
```

Check how `runElevated` callers handle `UserCanceled` — the caller likely already shows a notification for this error type.

### ELEV-03: Polkit Policy XML Format

Standard freedesktop.org PolicyKit 1.0 format, verified against system examples at `/usr/share/polkit-1/actions/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC
  "-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/PolicyKit/1.0/policyconfig.dtd">
<policyconfig>
  <vendor>Nexus Mods</vendor>
  <vendor_url>https://www.nexusmods.com/</vendor_url>
  <action id="io.nexusmods.vortex.run-elevated">
    <description>Vortex Mod Manager</description>
    <message>Vortex needs elevated privileges to modify game files.</message>
    <defaults>
      <allow_any>auth_admin</allow_any>
      <allow_inactive>auth_admin</allow_inactive>
      <allow_active>auth_admin</allow_active>
    </defaults>
  </action>
</policyconfig>
```

**`auth_admin` vs `auth_admin_keep`:** D-10 specifies `auth_admin` (prompt every time). `auth_admin_keep` would cache the credential for a session. The spec says `auth_admin` — this is correct for an infrequent operation.

### ELEV-03: electron-builder extraFiles for deb

The `extraFiles` array in `electron-builder.config.cjs` places files at absolute paths in the installed package. The existing `extraResources` array (lines 69-75) puts files under `resources/`. For a system-level polkit action, `extraFiles` with an absolute target is needed:

```javascript
// In linux section of electron-builder.config.cjs
linux: {
  // ... existing fields ...
  extraFiles: [
    {
      from: "../../build/linux/io.nexusmods.vortex.policy",
      to: "/usr/share/polkit-1/actions/io.nexusmods.vortex.policy",
    },
  ],
},
```

**Verified:** `extraFiles` in electron-builder supports object form `{from, to}` with absolute `to` paths for system file placement in `.deb`. The `deb` target respects `linux.extraFiles`. Confidence: HIGH (system polkit examples verified at `/usr/share/polkit-1/actions/`; electron-builder 24.x docs confirm `extraFiles` object form).

**File location:** `build/linux/io.nexusmods.vortex.policy` — the `build/linux/` directory does not currently exist in the repo and must be created with the policy file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wine prefix path resolution | Custom path calculator | `getMyGamesPath(compatDataPath)` from `proton.ts:22` | Already handles `pfx/drive_c/users/steamuser/Documents/My Games` correctly |
| Steam entry lookup | Custom VDF parser / direct file read | `steam.allGames()` + `find()` by gamePath | Handles multiple Steam library folders, manifest parsing, Proton detection already |
| SteamOS detection | Parsing `/etc/os-release` with regex manually | The `isSteamOS()` pattern using `readFileSync` + regex (new function, but simple) | No library needed; file is well-structured key=value |
| Polkit dialog branding | Custom pkexec wrapper or D-Bus calls | Standard `.policy` XML file | Polkit reads policy files at system path automatically; pkexec uses them without code changes |

## SAVE-04 Root Cause Analysis

**Confirmed:** The `apply-settings` handler in `index.ts:305-306` does:

```typescript
filePath.toLowerCase() === iniPath(prof.gameId).toLowerCase()
```

On Linux, `filePath` comes from `ini_prep:bakeSettings` via `iniFiles()`, which returns paths like:
```
/home/user/.steam/steam/steamapps/compatdata/489830/pfx/drive_c/users/steamuser/Documents/My Games/Skyrim Special Edition/Skyrim.ini
```

But `iniPath(prof.gameId)` calls the current sync `mygamesPath()` which returns:
```
/home/user/Documents/My Games/Skyrim Special Edition/Skyrim.ini
```

These never match. Result: `applySaveSettings()` is never called on Linux, `SLocalSavePath` is never written, profile-scoped saves don't work.

**Fix:** Once `mygamesPath()` is async + Linux-aware, `iniPath()` must also be async, and the comparison in the `apply-settings` handler must `await` it.

## Common Pitfalls

### Pitfall 1: Forgetting iniPath() in the async migration

**What goes wrong:** Developer makes `mygamesPath()` async and updates `getSavesPath()`, but misses `iniPath()`. The `apply-settings` comparison at line 306 continues to fail on Linux silently.
**Why it happens:** `iniPath()` is a separate export that also calls `mygamesPath()`. It is easy to overlook.
**How to avoid:** Update `iniPath()` to `async` immediately after `mygamesPath()`. The `apply-settings` handler must `await iniPath()` in the comparison.
**Warning signs:** Profile-scoped saves still don't work after SAVE-02/SAVE-03 are fixed (saves visible but not profile-scoped).

### Pitfall 2: Synchronous callers of mygamesPath() not awaited

**What goes wrong:** `onProfilesModified()` at line 266 calls `mygamesPath()` synchronously inside an `onStateChange` callback. If it's not made async + awaited, the Linux path is silently ignored.
**Why it happens:** `onStateChange` callbacks don't return Promises — the call is fire-and-forget.
**How to avoid:** Extract the `mygamesPath()` + `savesPath` computation into a helper `async function getProfileSavesPath(prof)` and call it from an `async` IIFE inside the `onStateChange` callback: `(async () => { const p = await getProfileSavesPath(prof); ... })();`
**Warning signs:** The "Open Save Games" directory action opens the wrong folder on Linux after profile changes.

### Pitfall 3: IPC socket ordering with sudo -n branch

**What goes wrong:** Developer adds the `sudo -n` spawn before ensuring the IPC server is listening. The elevated child starts, tries to connect to the IPC socket, and hangs.
**Why it happens:** The socket-before-spawn ordering from Phase 9 must be preserved for ALL spawner paths.
**How to avoid:** Verify the IPC server is started at the same point it is in the pkexec branch. The `sudo -n` spawn must use the same `tmpPath` and IPC setup as pkexec.
**Warning signs:** Elevated operations hang indefinitely on SteamOS Desktop Mode (not Game Mode).

### Pitfall 4: SteamOS detection returns false on SteamOS 3.x

**What goes wrong:** SteamOS 3 (based on Arch Linux) uses `ID=steamos` in `/etc/os-release`. But some versions may set `ID_LIKE=arch` without `ID=steamos` in early builds.
**Why it happens:** The `/etc/os-release` spec allows `ID_LIKE` for distro families.
**How to avoid:** Check both `ID=steamos` (case-insensitive) AND `ID_LIKE` containing `steamos`. This is already in D-06.
**Warning signs:** SteamOS machines bypass the graceful fallback and attempt pkexec, causing hangs in Game Mode.

### Pitfall 5: extraFiles absolute path rejected by electron-builder

**What goes wrong:** Using `to: "usr/share/polkit-1/actions/..."` (relative, missing leading `/`) causes the file to land under the app resources directory instead of system path.
**Why it happens:** `extraFiles` requires an absolute `to` path to place files at system locations. Without leading `/`, it's treated as relative to the package root.
**How to avoid:** Use `to: "/usr/share/polkit-1/actions/io.nexusmods.vortex.policy"` with leading slash.
**Warning signs:** `.deb` installs without errors but `pkexec` still shows generic dialog (policy file not at system path).

### Pitfall 6: build/linux/ directory not created

**What goes wrong:** The `build/linux/` directory does not exist in the repo. If the `.policy` file is added to electron-builder config but the directory doesn't exist, `pnpm run package` fails.
**Why it happens:** It is a new directory; nothing creates it automatically.
**How to avoid:** Create `build/linux/` directory and add `build/linux/io.nexusmods.vortex.policy` to the repo before referencing it in `electron-builder.config.cjs`.

## Code Examples

### getSteamEntry() pattern to duplicate in savegame extension

```typescript
// Source: src/renderer/src/extensions/ini_prep/index.ts:35-52
// Duplicate (not import) into extensions/gamebryo-savegame-management/src/util/gameSupport.ts
// to keep the diff local to the extension (D-01)
import steam from "../../util/Steam";
import type { ISteamEntry } from "../../util/Steam";
// Note: relative path will differ in savegame extension
// Use: import steam from "../../../../src/renderer/src/util/Steam"
// OR: rely on vortex-api re-export if available

async function getSteamEntry(
  discovery: types.IDiscoveryResult,
): Promise<ISteamEntry | undefined> {
  if (process.platform !== "linux" || discovery?.store !== "steam") {
    return undefined;
  }
  try {
    const entries = await steam.allGames();
    return entries.find(
      (e) =>
        e.gamePath !== undefined &&
        discovery.path !== undefined &&
        e.gamePath.toLowerCase() === discovery.path.toLowerCase(),
    );
  } catch {
    return undefined;
  }
}
```

**Import path note:** The savegame extension is in `extensions/gamebryo-savegame-management/`. It already imports from `vortex-api` for `util`, `types`, `selectors`. Check whether `steam` is re-exported via `vortex-api` or must be imported via a relative path. `ini_prep` uses `import steam from "../../util/Steam"` (relative from `src/renderer/src/extensions/ini_prep/`). The savegame extension will need a longer relative path: `../../../../renderer/src/util/Steam` relative to its location. Alternatively, if the extension is bundled and `vortex-api` re-exports steam, use that. **Verify the import path during implementation.**

### Polkit action XML (complete file content for `build/linux/io.nexusmods.vortex.policy`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC
  "-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/PolicyKit/1.0/policyconfig.dtd">
<policyconfig>
  <vendor>Nexus Mods</vendor>
  <vendor_url>https://www.nexusmods.com/</vendor_url>
  <action id="io.nexusmods.vortex.run-elevated">
    <description>Vortex Mod Manager</description>
    <message>Vortex needs elevated privileges to modify game files.</message>
    <defaults>
      <allow_any>auth_admin</allow_any>
      <allow_inactive>auth_admin</allow_inactive>
      <allow_active>auth_admin</allow_active>
    </defaults>
  </action>
</policyconfig>
```

### electron-builder.config.cjs linux.extraFiles addition

```javascript
linux: {
  target: ["AppImage", "deb"],
  artifactName: "vortex-setup.${ext}",
  // ... existing fields unchanged ...
  extraFiles: [
    {
      from: "../../build/linux/io.nexusmods.vortex.policy",
      to: "/usr/share/polkit-1/actions/io.nexusmods.vortex.policy",
    },
  ],
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `mygamesPath()` returns Windows documents path (sync) | `mygamesPath()` returns Wine prefix path on Linux (async) | Phase 10 | Saves discovered at correct location on Linux |
| `pkexec` only on Linux elevation | `pkexec` on desktop Linux; `sudo -n` fallback on SteamOS | Phase 10 | No hang/crash on Steam Deck Game Mode |
| Generic pkexec authentication dialog | Branded polkit dialog for `.deb` users | Phase 10 | Better UX on desktop Linux |

## Open Questions

1. **Steam module import path in savegame extension**
   - What we know: `ini_prep` imports `steam` via `"../../util/Steam"` (relative). The savegame extension is in a different directory tree.
   - What's unclear: Whether `vortex-api` re-exports the `steam` default export or if it must be a relative import.
   - Recommendation: Check `src/renderer/src/vortexApi.ts` or `vortex-api` package exports for a steam re-export. If not present, use relative import `"../../../../src/renderer/src/util/Steam"` from the extension root.

2. **UserCanceled notification on SteamOS elevation failure**
   - What we know: `runElevated()` in `elevated.ts` does not receive `api`. It can only throw `UserCanceled`.
   - What's unclear: Whether callers of `runElevated()` already surface a user notification for `UserCanceled`, or if a custom message must be embedded in the error.
   - Recommendation: Check the callers of `runElevated()` in the codebase to see how they handle `UserCanceled`. If they show a generic "operation cancelled" message, a custom `message` property on the `UserCanceled` instance may need to pass through.

3. **`onProfilesModified` async pattern**
   - What we know: `onStateChange` callbacks are synchronous (no Promise return).
   - What's unclear: Whether an async IIFE `(async () => { ... })()` inside the callback will have timing issues with `store.dispatch()` calls.
   - Recommendation: Use async IIFE pattern, which is established in the codebase. Store dispatches are synchronous and safe to call from within.

## Environment Availability

Step 2.6: SKIPPED (no external tool dependencies beyond existing repo toolchain; all changes are code/config/new file).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `src/renderer/vitest.config.mts` (renderer project) |
| Quick run command | `pnpm --filter @vortex/renderer test src/util/elevated.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-02 | `mygamesPath()` returns Wine prefix path for Skyrim SE on Linux | unit | `pnpm --filter gamebryo-savegame-management test -- --run` | ❌ Wave 0 |
| SAVE-03 | `mygamesPath()` returns Wine prefix path for Fallout 4 on Linux | unit | (same file as SAVE-02) | ❌ Wave 0 |
| SAVE-04 | `apply-settings` path comparison fires correctly on Linux (iniPath async) | unit | (same file or integration test) | ❌ Wave 0 |
| ELEV-02 | `isSteamOS()` returns true for `ID=steamos` and false for non-SteamOS | unit | `pnpm --filter @vortex/renderer test src/util/elevated.test.ts` | ✅ (add cases) |
| ELEV-02 | `sudo -n` fallback used on SteamOS + pkexec failure | unit | (same elevated.test.ts) | ✅ (add cases) |
| ELEV-02 | `UserCanceled` thrown when `sudo -n` fails on SteamOS | unit | (same elevated.test.ts) | ✅ (add cases) |
| ELEV-03 | `io.nexusmods.vortex.policy` XML is valid PolicyKit format | manual | `pkcheck --action-id io.nexusmods.vortex.run-elevated 2>&1` | N/A |

### Sampling Rate
- **Per task commit:** `pnpm --filter @vortex/renderer test src/util/elevated.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `extensions/gamebryo-savegame-management/src/util/gameSupport.test.ts` — covers SAVE-02, SAVE-03, SAVE-04 (mygamesPath Linux branch, iniPath async, getSteamEntry mock)
- [ ] Vitest project entry for gamebryo-savegame-management in `vitest.config.ts` (currently not in the projects array — may need adding or the test can run via the extension's own config)

*(Check whether `extensions/gamebryo-savegame-management/` has its own vitest/jest config before adding to root vitest.config.ts)*

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `extensions/gamebryo-savegame-management/src/util/gameSupport.ts` — confirmed `mygamesPath()` is sync, no Linux branch
- Direct code inspection of `extensions/gamebryo-savegame-management/src/index.ts` — confirmed all call sites; `iniPath()` comparison at line 306 confirmed as the SAVE-04 root cause
- Direct code inspection of `src/renderer/src/extensions/ini_prep/index.ts:35-52` — `getSteamEntry()` pattern confirmed
- Direct code inspection of `src/renderer/src/extensions/ini_prep/gameSupport.ts:218-223` — Linux branch pattern confirmed
- Direct code inspection of `src/renderer/src/util/elevated.ts:189-205` — pkexec branch confirmed, no `isSteamOS()` exists
- Direct code inspection of `src/renderer/src/util/elevated.test.ts` — test structure confirmed, injectable spawner seam confirmed
- Direct code inspection of `src/main/electron-builder.config.cjs` — `extraFiles`/`extraResources` pattern; no `linux.extraFiles` currently present
- System file `/usr/share/polkit-1/actions/org.freedesktop.timedate1.policy` — confirmed `auth_admin_keep` syntax; adapted `auth_admin` per D-10
- System `/etc/os-release` — format confirmed; `ID=steamos` field verified via SteamOS documentation

### Secondary (MEDIUM confidence)
- electron-builder 24.x documentation — `extraFiles` with absolute `to` path for `.deb` system file placement

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct code inspection
- Architecture: HIGH — patterns mirrored from existing codebase
- Pitfalls: HIGH — derived from code analysis and Phase 9 decisions
- SAVE-04 root cause: HIGH — confirmed by tracing path comparison at index.ts:306

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable patterns, no fast-moving dependencies)
