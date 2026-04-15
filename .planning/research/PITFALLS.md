# Domain Pitfalls

**Domain:** Linux-native first-run onboarding wizard added to a Windows-first Electron/React/Redux app
**Researched:** 2026-04-16
**Confidence:** HIGH — grounded in codebase audit of onboarding_dashlet, firststeps_dashlet, stagingDirectory.ts, Steam.ts, fs.ts, nativeErrors.ts, winapi-shim.ts, and dialogs.scss

> **Scope:** This document covers the v7.0 milestone specifically: adding Linux-native first-run
> onboarding to an existing codebase where all the underlying Linux infrastructure (Steam detection,
> elevation, casefold, FOMOD, NXM) is already shipped. Pitfalls for prior milestones are in
> the archived `.planning/` history.

---

## Critical Pitfalls

Mistakes that cause silent regressions on Windows, block the first-run flow entirely, or require
structural rewrites to fix.

---

### Pitfall 1: Editing i18n strings without a platform guard silently breaks Windows wording

**What goes wrong:**
The string resources in `texts.ts`, `firststeps_dashlet/todos.tsx`, and `symlink_activator_elevate/
index.ts` are shared across all platforms — there is no per-platform i18n branch in the build.
If a developer changes "Run as Administrator" to something Linux-friendly without a runtime
`process.platform === 'linux'` guard, the changed wording shows on Windows too.

The `t()` call in `symlink_activator_elevate/index.ts` line 121 reads:
`"Symlink Deployment (Run as Administrator)"` — this is the constructor argument passed as the
human-visible display name, not a translatable string key. Changing it in place changes the
Windows UX permanently.

Additionally, `mod_management/texts.ts` contains the `downloadspath` and `modspath` help texts
with `C:\\Users\\Mike\\AppData\\Roaming\\Vortex\\Downloads\\` as an example path. These are
passed through the `t()` wrapper, which means i18next caches the English source string as the
key. If you change the source string (removing the Windows path), the old key in any user's
persisted locale cache becomes stale and falls back to the raw key string instead of the
translated value — a different Windows regression.

**Why it happens:**
The codebase uses inline string literals as i18next keys throughout the renderer (not
key-based lookup). Any edit to an existing translated string breaks the key for users who have
a non-English locale cached, and any platform-neutral edit changes Windows wording.

**Consequences:**
- Windows users see Linux-specific instructions in the staging-folder settings help text
- Windows users lose the "Run as Administrator" label that correctly describes what UAC does
- Non-English locale users see raw English strings (fallback) where there was a translation
- Nexus support load increases from confused Windows users

**Prevention:**
1. Do NOT edit existing i18n string literals. Add NEW strings alongside existing ones.
2. For platform-divergent wording, use a runtime branch:
   ```typescript
   const label = process.platform === 'linux'
     ? t("Symlink Deployment (requires pkexec)")
     : t("Symlink Deployment (Run as Administrator)");
   ```
3. Guard every new Linux-specific string addition inside `process.platform === 'linux'` at
   the render site, not in a translation file.
4. Run the Windows CI build and visually diff any affected component before merging.

**Detection:**
- Windows CI build passes (no type errors) but Windows UAT shows changed UI wording
- A string in `texts.ts` that previously contained a Windows path no longer does
- `git diff --stat` shows edits to existing `t("...")` literals rather than additions

**Phase:** Address in any phase that touches error messages. Prevention must be in the initial
diff, not a fixup later.

---

### Pitfall 2: `firststeps_dashlet/todos.tsx` calls `winapi.GetVolumePathName` unconditionally — crashes on Linux without the shim alias

**What goes wrong:**
`firststeps_dashlet/todos.tsx` imports `* as winapi from "winapi-bindings"` and calls both
`winapi.GetDiskFreeSpaceEx(checkPath)` and `winapi.GetVolumePathName(props.dlPath)` in the
`value` functions for the "download-location" and "mod-location" todo items. The webpack
alias `winapi-bindings → winapi-shim.ts` is already in place (v1.0), so these calls resolve
to the Linux shim at runtime.

However, the shim's `GetVolumePathName` walks the directory tree using `fs.statSync` to find
the mount point. If the `dlPath` or `instPath` stored in Redux state is an invalid or
nonexistent path (which is common on a brand-new Linux install before onboarding completes),
`GetVolumePathName` throws inside `value()` — and the component re-throws it as an uncaught
exception from a Redux selector callback.

The existing Windows code already handles this with a `try/catch` that calls `t("<Invalid
Drive>")` — the Linux shim's `GetVolumePathName` has a catch block too, but the `try { statSync
}` inside `GetVolumePathName` only handles `ENOENT` by falling back to `path.parse(p).root`.
Any path that is partially valid (parent exists, child doesn't) still throws.

**Why it happens:**
The first-run context starts with no game selected and no staging path set. State values are
`undefined` or point to a default `{USERDATA}` template string that contains a `{USERDATA}`
macro not yet resolved. The todo item's `condition` function checks `props.instPath` for
`undefined` but the `value` function is called regardless by the dashlet render path when the
todo is visible.

**Consequences:**
- The ToDo List dashlet crashes on first render on a fresh Linux install
- The entire dashboard page goes blank (React error boundary triggered)
- User sees a blank dashboard, has no onboarding guidance, cannot proceed

**Prevention:**
1. Wrap the `winapi.GetVolumePathName(props.instPath)` call in the `value` function with a
   `try/catch` that returns `t("<No staging folder>")` on any error — the existing catch
   already does this but only for `GetVolumePathName` exceptions from invalid drives; extend
   it to cover `undefined` path:
   ```typescript
   value: (t, props) => {
     if (props.instPath === undefined) return t("<No staging folder>");
     try {
       return winapi.GetVolumePathName(props.instPath);
     } catch { return t("<Invalid Drive>"); }
   }
   ```
2. Confirm the `condition` function for both disk-space todo items returns `false` when the
   path is `undefined`, preventing the `value` call entirely.
3. Add a Vitest test that renders the firststeps_dashlet with an undefined `instPath` and
   verifies no exception is thrown.

**Detection:**
- Dashboard page blank on fresh Linux run; browser DevTools shows "TypeError: Cannot read
  properties of undefined" in winapi-shim.ts `GetVolumePathName`
- `git log` shows the todo item condition added `props.instPath !== undefined` but the value
  function still runs (race condition between condition evaluation and render)

**Phase:** Phase 1 (first-run wizard foundation). Must be addressed before any other dashboard
work lands.

---

### Pitfall 3: `ensureStagingDirectory` calls `winapi.GetVolumePathName` on the drive-check path — unconditional on Linux

**What goes wrong:**
In `stagingDirectory.ts` line 157, `ensureStagingDirectoryImpl` calls:
```typescript
winapi.GetVolumePathName(instPath);
```
to check whether a partition exists. On Windows this checks if the drive letter is valid; the
shim's `GetVolumePathName` on Linux walks parent dirs via `statSync`, which is different
behaviour.

More critically, the `partitionExists` boolean is set to `false` only when
`isErrorWithSystemCode(err) && err.systemCode === 2` — this checks for Windows error code 2
(ERROR_FILE_NOT_FOUND). The Linux shim never sets `systemCode` on the error it throws; it
throws a generic JS Error. So on Linux, any `GetVolumePathName` failure leaves `partitionExists
= true` (initial value), and the wrong dialog branch is taken when the staging folder doesn't
exist — the user sees "Mod Staging Folder missing!" with instructions referencing removable
drives, not a Linux-appropriate message.

This call path fires on every game activation, not just during first run.

**Why it happens:**
The Windows-specific `systemCode === 2` check was never updated to account for the Linux shim's
error shape. The shim was added for compilation; the error semantics at call sites weren't
audited.

**Consequences:**
- Wrong dialog shown when staging folder is missing on Linux (drive-not-found error → shows
  "removable drive" message instead of "create new staging folder" message)
- `partitionExists = false` path (which has the correct "Invalid/Missing partition" handling
  in the `fallbackPurge` catch) is never taken on Linux

**Prevention:**
1. Platform-guard the `winapi.GetVolumePathName` partition check:
   ```typescript
   if (process.platform === 'win32') {
     try { winapi.GetVolumePathName(instPath); }
     catch (err) {
       if (isErrorWithSystemCode(err) && err.systemCode === 2) partitionExists = false;
     }
   }
   // On Linux: assume partition exists if the path root exists
   else {
     try { await fs.statAsync(path.parse(instPath).root); }
     catch { partitionExists = false; }
   }
   ```
2. Add platform-specific error handling for the Linux case.

**Detection:**
- On Linux with a deleted staging folder, user sees "removable drive" dialog text rather than
  the simpler "create new" path
- `git log` shows no platform guard around the `winapi.GetVolumePathName` call in
  `stagingDirectory.ts`

**Phase:** Phase 2 (staging directory selection). Must be addressed in the same phase that
wires up staging detection in the wizard.

---

### Pitfall 4: Staging path persisted in Redux state uses `{USERDATA}` macro — resolving it at wizard time vs. at use time is a race condition

**What goes wrong:**
When a staging path is set in the wizard, it may be stored as the raw macro string
`{USERDATA}/{game}/mods` rather than the resolved absolute path. The state hive (`settings.mods.
installPath[gameId]`) stores whatever string the wizard dispatches. The resolution from
`{USERDATA}` to `/home/user/.local/share/Vortex/...` happens later via `resolveInstallPath`
in `mod_management/util/getInstallPath.ts`.

If the wizard dispatches `setInstallPath(gameId, rawMacroString)` and then immediately calls
`ensureDirWritableAsync(rawMacroString)`, the directory creation fails because the OS doesn't
understand `{USERDATA}` as a path. There is also a second timing issue: if the Redux state is
hydrated asynchronously (via the `persist:hydrate` IPC channel), a wizard step that reads
`installPathForGame(state, gameId)` right after dispatch may get the old undefined value from
the pre-hydration snapshot.

**Why it happens:**
The `installPathMode === "suggested"` branch in `ensureStagingDirectoryImpl` calls
`resolveInstallPath(await suggestStagingPath(api, gameId), gameId)` — resolving macros —
before dispatching `setInstallPath`. But the wizard's direct-dispatch path bypasses
`suggestStagingPath`. If the wizard dispatches the unresolved string, the path stored in
LevelDB is a macro, and `ensureDirWritableAsync` is called with the macro.

**Consequences:**
- `ensureDirWritableAsync("{USERDATA}/mods/skyrimse")` throws ENOENT immediately
- The chattr+F casefold check runs against `{USERDATA}` as a literal path, fails, and the
  once-per-session notification fires with a confusing path in the message
- If the wizard completes "successfully" with the macro stored, the staging dir is never
  actually created until the next game activation — a silent deferred failure

**Prevention:**
1. Always resolve macros before calling any filesystem function or dispatching to Redux:
   ```typescript
   import { resolveInstallPath } from '../mod_management/util/getInstallPath';
   const resolved = resolveInstallPath(wizardSelectedPath, gameId);
   api.store.dispatch(setInstallPath(gameId, resolved));
   await fs.ensureDirWritableAsync(resolved);
   ```
2. In `ensureStagingDirectoryImpl`, add an assertion that `instPath` does not contain
   `{USERDATA}` or `{game}` before calling `ensureDirWritableAsync`.
3. Add a Vitest test that the wizard-path dispatch stores a resolved absolute path.

**Detection:**
- `{USERDATA}` appears as a literal string in the LevelDB state dump after wizard completion
- `ENOENT` in `ensureDirWritableAsync` on first game activation after wizard
- chattr+F notification shows `{USERDATA}` in the path field

**Phase:** Phase 2 (staging directory selection wizard step). Prevention must be in the same
commit as the wizard dispatch.

---

### Pitfall 5: Steam `mCache` is module-singleton and populated once at constructor time — first-run wizard finds no games if Steam is still launching

**What goes wrong:**
`Steam.ts` holds `mCache: PromiseBB<ISteamEntry[]>` as an instance variable. `allGames()` sets
`mCache = this.parseManifests()` on first call and returns the same promise on all subsequent
calls. `parseManifests()` reads `libraryfolders.vdf` and `.acf` manifest files synchronously
at the time it is first invoked.

On a fresh Linux desktop boot, when the user launches Vortex immediately and goes through first
run, Steam may not have finished writing its library state to disk (Steam itself may be in the
middle of loading). `parseManifests()` may find zero `.acf` files in `steamapps/` because Steam
hasn't placed them yet, or `libraryfolders.vdf` may be partially written.

The wizard calls `allGames()` once during the game-selection step. If the cache was populated
at app start with an empty result, the wizard shows "No games found" even though Steam has
hundreds of games installed. The user has no way to trigger a cache refresh without restarting
Vortex.

**Why it happens:**
The cache was designed for a Windows use case where Steam is a persistent background process
and VDF files are fully written well before Vortex is typically launched. On Linux, especially
on first boot after installing both Vortex and Steam, the timing is unpredictable.

**Consequences:**
- First-run wizard game-selection step shows empty game list
- User thinks Vortex doesn't detect their Steam library
- User must restart Vortex (not obvious) to get games to appear
- Creates a support burden and "Vortex broken on Linux" perception

**Prevention:**
1. Add a "Refresh" / "Re-scan" button to the game detection step in the wizard that calls
   `steam.reloadGames()` and re-renders the list.
2. In the wizard's game detection step, attempt `allGames()` and if the result is empty on
   Linux, automatically retry once with a 2-second delay before showing the empty state:
   ```typescript
   let games = await steam.allGames();
   if (games.length === 0 && process.platform === 'linux') {
     await new Promise(resolve => setTimeout(resolve, 2000));
     await steam.reloadGames();
     games = await steam.allGames();
   }
   ```
3. Show an explicit loading state during the refresh, not a blank list.
4. `reloadGames()` already exists in `Steam.ts` — use it.

**Detection:**
- Wizard shows "No games found" on first run; restarting Vortex shows games correctly
- `git log` shows wizard game-detection step calls `allGames()` with no retry logic

**Phase:** Phase 1 (first-run wizard foundation / game detection). The retry must be in the
initial wizard implementation.

---

### Pitfall 6: `suggestStagingPath` takes the non-Linux branch when `process.platform !== "win32"` — but the Linux branch doesn't check whether `{USERDATA}` drive equals the game drive

**What goes wrong:**
`gamemode_management/util/discovery.ts` line 859:
```typescript
if (statModPath.dev === statUserData.dev || process.platform !== "win32") {
  suggestion = path.join("{USERDATA}", "{game}", "mods");
}
```
On Linux, this always takes the first branch and suggests `{USERDATA}/{game}/mods` — regardless
of whether the game and user data are on the same filesystem. This is correct behaviour on a
typical single-drive Linux system.

However, it masks a subtler issue: if the user has their Steam library on an external drive
(e.g., `/mnt/storage/SteamLibrary`) and their home on the system SSD, the staging folder
will be suggested on the system SSD even though the game files are on the external drive. This
causes the hard-link deployment method to fail (hard links cannot cross filesystem boundaries),
forcing a slower copy or symlink deployment without explaining why.

The fallback branch (`winapi.GetVolumePathName(modPaths[""])`) correctly handles this on Windows
but is unreachable on Linux due to the `process.platform !== "win32"` condition.

**Why it happens:**
The platform guard was added to skip the Windows-specific `GetVolumePathName` call on Linux,
but it collapsed the logic to always suggest userdata, losing the cross-drive detection.

**Consequences:**
- Wizard suggests a staging path that guarantees hard-link deployment will fail for external
  Steam library games
- Deployment silently falls back to copy or symlink, which is slower and uses more disk space
- No warning is shown to the user that the staging path and game path are on different devices

**Prevention:**
1. Add a Linux-aware cross-device check using `statSync`:
   ```typescript
   if (process.platform === 'linux') {
     const gameRoot = path.parse(modPaths[""]).root; // mount-point walk needed
     const userDataRoot = path.parse(getVortexPath("userData")).root;
     if (statModPath.dev !== statUserData.dev) {
       // suggest on the same device as the game
       const volume = winapi.GetVolumePathName(modPaths[""]); // shim handles this
       suggestion = path.join(volume, state.settings.mods.suggestInstallPathDirectory, "{game}");
     } else {
       suggestion = path.join("{USERDATA}", "{game}", "mods");
     }
   }
   ```
2. In the wizard's staging-folder step, show a warning if the user manually selects a path
   on a different device than the game path.

**Detection:**
- User with Steam on external drive reports hard-link deployment failing
- `suggestStagingPath` returns a path on `/home` for a game on `/mnt/storage`
- No warning in wizard about device mismatch

**Phase:** Phase 2 (staging directory selection). The device check should be in the same
phase as the path suggestion logic.

---

## Moderate Pitfalls

---

### Pitfall 7: `nativeErrors.ts` only decodes Windows system codes — Linux EPERM gets an uninformative generic error dialog

**What goes wrong:**
`decodeSystemError` in `nativeErrors.ts` returns `undefined` for any error where
`process.platform !== 'win32'` (line 13 explicit check). When `ensureDirWritableAsync`
encounters EPERM or EACCES on Linux (e.g., the user selected `/mnt/usbdrive` which is
mounted read-only), the calling code gets `undefined` from `decodeSystemError` and falls back
to a generic "Access denied" message that tells the user to "Run as Administrator" — because
that's the fallback text in `mod_management/index.ts` for permission errors.

The user on Linux is told to "Run as Administrator" for a staging folder permission error.
This is the primary source of Windows-specific error text that ONBRD-03 requires to be
purged.

**Why it happens:**
`decodeSystemError` was written entirely for Windows error codes. The `process.platform !==
'win32'` early return means no Linux-specific decoding was ever added. The callers of
`decodeSystemError` fall through to generic English text that was written assuming Windows.

**Prevention:**
1. Add a Linux arm to `decodeSystemError` (or add a new `decodeLinuxError` function) that
   translates EPERM/EACCES into actionable Linux-specific messages:
   - EPERM/EACCES on a staging path → "You don't have write permission to this directory. Try
     a location in your home folder (e.g. ~/Vortex/mods)."
   - EROFS → "This location is on a read-only filesystem. Choose a writable location."
2. Platform-guard any fallback message that says "Run as Administrator" to show
   "requires elevated privileges (pkexec)" on Linux.
3. Search the entire codebase for the literal string "Administrator" and audit each site for
   platform context.

**Phase:** Phase 1 (error message purge) or alongside staging directory setup in Phase 2.

---

### Pitfall 8: Help URL routing — `open-knowledge-base` event has zero listeners on Linux until the nexus_integration extension is fully initialized

**What goes wrong:**
The `More.tsx` component's `wikiId` prop triggers the `open-knowledge-base` event via
`api.events.emit("open-knowledge-base", wikiId)`. The `haveKnowledgeBase` function in
`More.tsx` caches whether any listener is registered:
```typescript
value = api.events.listenerCount("open-knowledge-base") > 0;
```
This check is done once and cached. If the onboarding wizard renders before the
`nexus_integration` extension (which registers the `open-knowledge-base` listener) has fully
initialized, `haveKnowledgeBase` returns `false`, the "Learn more" link is hidden, and the
result is cached permanently for the session.

The extension initialization order is non-deterministic because extensions load via dynamic
`import()` during `renderer.tsx` bootstrapping. On a slow system or with a large number of
extensions, `nexus_integration` may not register its listener before the wizard's first
render.

**Why it happens:**
The cache in `haveKnowledgeBase` was added for performance (`is this expensive? Is it worth
caching?` — line 14 in More.tsx). But a cache populated during initialization rather than at
stable state creates a TOCTOU problem.

**Prevention:**
1. Remove the cached value in `haveKnowledgeBase` and check `listenerCount` on each render.
   The `api.events.listenerCount` call is O(1) and not actually expensive.
2. Alternatively, add the `open-knowledge-base` listener in a core extension (not
   `nexus_integration`) so it's guaranteed to be present before any component renders.
3. For Linux-specific "Get Help" links in the wizard, use `opn(url)` directly rather than
   routing through the knowledge-base event, which eliminates the dependency entirely.

**Detection:**
- "Learn more" links in the wizard are missing on first launch; appear after restart
- `api.events.listenerCount("open-knowledge-base")` returns 0 during wizard render
- The `haveKnowledgeBase` closure has `value = false` on first wizard render and never updates

**Phase:** Phase 3 (help links). Noted here as a risk; direct `opn(url)` is the safe
alternative.

---

### Pitfall 9: Help URLs baked into string literals are NOT i18next-translatable — locale variants for Linux docs need a different mechanism

**What goes wrong:**
Help URLs appear in three forms in the codebase:
1. Direct `opn(url)` calls with hardcoded `https://wiki.nexusmods.com/...` strings
2. `wikiId` props that route through `open-knowledge-base` → Nexus knowledge base
3. `NEXUS_DOMAIN` constant interpolation

For Linux-specific documentation URLs, a developer might be tempted to add something like:
```typescript
opn(`https://wiki.nexusmods.com/linux/${articleId}`)
```
If the Linux docs article doesn't exist yet at that URL, the user lands on a 404. Nexus wiki
articles may not have a stable permanent URL at the time of shipping.

Additionally, if the URL is stored in Redux state (e.g., as a setting or in a notification
action), it persists in LevelDB. If the URL later changes (redirected, deprecated), users
who already ran through onboarding have the old URL cached in their persisted notifications.

**Why it happens:**
URLs in source code are treated as stable constants, but wiki/documentation URLs change more
often than code. Linux documentation for Vortex didn't exist before v1.0 — it's being created
in parallel with the code.

**Prevention:**
1. Use a stable redirect URL pattern: route through `https://nexus.gg/vortex-linux-help` or
   a GitHub wiki anchor (`https://github.com/atabisz/Vortex/wiki/linux-setup`) that the
   maintainer controls and can update without a code release.
2. Never store help URLs in Redux persistent state — only in component code. If a
   notification includes an action URL, verify the URL exists before shipping.
3. Add a `platform` parameter to the URL helper: `getHelpUrl("staging-folder", "linux")` →
   returns platform-appropriate URL. This isolates all URL changes to one file.
4. For the "Get Help" button, use `opn()` directly (not `open-knowledge-base`) so it opens
   the OS default browser reliably on both KDE and GNOME without depending on knowledge-base
   event registration.

**Phase:** Phase 3 (help links). All Linux help URLs should be defined in one constants file,
not scattered across component files.

---

### Pitfall 10: 1280×800 layout — `.modal-dialog` has `max-width: 60%` but no max-height, causing buttons to clip below the viewport

**What goes wrong:**
The existing `.common-dialog-regular` and `.common-dialog-wide` CSS classes in `dialogs.scss`
do not constrain modal height. At 1280×800, the browser window is 800px tall. After subtracting
the OS taskbar (~40px), window chrome (~30px), and the Vortex toolbar/navbar (~105px from
`.toolbar-app-region`), the usable content area is approximately 625px.

A wizard dialog with 4+ steps, each containing:
- A header/title (~60px)
- Step description text (~80px)
- A directory input/browse button (~60px)
- A filesystem detection status block (~80px)
- Navigation buttons (Back/Next/Finish, ~60px)

...totals approximately 340px in isolation, but Bootstrap's `.modal-dialog` stacks these inside
a `.modal-content` that starts at the top of the viewport. If the modal has `height: 80%`
(from `.common-dialog-wide`) that is 640px, and the visible viewport is only 625px, the bottom
of the modal (including the navigation buttons) is clipped by 15-20px — exactly enough to hide
the bottom row of buttons.

Users cannot click "Next" or "Finish" without scrolling, and because `.layout-flex` has
`overflow: hidden`, there is no scrollbar to discover.

**Why it happens:**
The existing dialogs were designed for Windows where the default Vortex window size is larger
(typically 1920×1080 or at minimum 1280×900 for desktops). The 1280×800 constraint is specific
to Steam Deck Desktop Mode, which is the target resolution for ONBRD-05.

**Prevention:**
1. Set an explicit `max-height` on the wizard modal that accounts for the full UI chrome:
   ```scss
   .wizard-dialog {
     .modal-dialog {
       max-height: calc(100vh - 160px); // 105px toolbar + 40px nav + 15px margin
       display: flex;
       flex-direction: column;
     }
     .modal-content {
       height: 100%;
       overflow-y: auto;
     }
     .modal-footer {
       flex-shrink: 0; // navigation buttons never scroll off-screen
     }
   }
   ```
2. Make the wizard footer (Back/Next/Finish buttons) `position: sticky; bottom: 0` or use
   `flex-shrink: 0` so it is always visible regardless of content height.
3. Test at exactly 800px browser height by setting `BrowserWindow` height to 800 in the
   dev config and visually inspecting all wizard steps.
4. Do not put content in `.common-dialog-wide` — that class sets `height: 80%` which equals
   640px at 800px viewport, leaving almost no margin.

**Phase:** Every wizard-building phase. Must be verified by visual inspection at 1280×800.

---

### Pitfall 11: Bootstrap 3 modal `overflow: visible` on `.modal-dialog` means content that overflows is invisible, not scrollable

**What goes wrong:**
Bootstrap 3's modal system (used in Vortex) does NOT automatically add scrollbars to modal
content. The `.modal-body` has no `overflow-y: auto` by default in Bootstrap 3. If wizard
content is taller than the visible area, it simply overflows below the fold with no
indication to the user.

The `.layout-flex` class has `overflow: hidden` — so if the wizard renders inside a flex
container, overflowing content is invisibly clipped, not scrollable.

Specific risk: the filesystem detection step may show a table of detected filesystems and
their casefold status. On a system with many mount points, this table can be long. At 800px,
any table with more than 4-5 rows will clip below the visible area.

**Why it happens:**
Bootstrap 3 was designed for desktop web at 1024px+ minimum viewport. Modal overflow was not
a concern at typical desktop resolutions. The Steam Deck 1280×800 constraint is tighter.

**Prevention:**
1. Always add `overflow-y: auto` to the `.modal-body` of any wizard step that may have
   variable-length content.
2. For lists in wizard steps (detected games, mount points), add `max-height: 200px;
   overflow-y: auto` to the list container specifically.
3. Never use `height: 80%` or fixed pixel heights inside wizard step content — use
   `max-height` with `overflow-y: auto` instead.
4. Add `flex-shrink: 0` to any fixed-height element (buttons, headers) so the flex layout
   never squishes them in favor of scrollable content.

**Phase:** Every wizard-building phase. A visual checklist at 800px height is mandatory.

---

### Pitfall 12: Staging directory filesystem detection — `statfs()` must be called on an existing path, not the target path before creation

**What goes wrong:**
`applyChattrCasefold` in `fs.ts` calls `fsPromises.statfs(dirPath)` to detect the filesystem
type. But `ensureDirWritableAsync` creates the directory before calling `applyChattrCasefold`:
```typescript
return PromiseBB.resolve(fs.ensureDir(dirPath))
  .then(() => applyChattrCasefold(dirPath))
```

During a wizard-guided staging directory setup, if the user types a path like
`/home/user/newdir/mods/skyrimse` where `newdir` does not yet exist, `ensureDir` creates all
intermediate directories first — and `statfs` correctly identifies the filesystem. This works.

However, if the wizard validates the path in a preview step before creation (e.g., showing the
filesystem type to the user with a "Your staging folder will be on ext4" message), the `statfs`
call happens on a path that doesn't exist yet. `statfs` on a non-existent path throws ENOENT on
older Node versions (Node 22+ falls back to the nearest existing parent, but this is not
documented behavior).

The ext4 detection cache keyed by `dirPath` will cache the `false` result from the ENOENT
fallback, and the wizard will incorrectly report "casefold not available" even on an ext4+casefold
system.

**Why it happens:**
The wizard wants to show the user what will happen before committing (good UX), but the
detection logic assumes the path exists.

**Prevention:**
1. For wizard preview, call `statfs` on the nearest existing ancestor of the target path, not
   the target path itself:
   ```typescript
   async function existingAncestor(p: string): Promise<string> {
     try { await fsPromises.stat(p); return p; }
     catch { return existingAncestor(path.dirname(p)); }
   }
   const detectPath = await existingAncestor(targetStagingPath);
   const isExt4 = await isExt4Filesystem(detectPath);
   ```
2. Do not cache the preview-time result in `ext4CasefoldCache`. The cache should only be
   populated after directory creation succeeds.
3. The actual `applyChattrCasefold` call (after directory creation) will use the correct path.

**Phase:** Phase 2 (staging directory step). If filesystem preview is added to the wizard, this
prevention must be in the same commit.

---

### Pitfall 13: Wizard "complete" state stored in Redux `settings.firststeps.steps` — hydration race means wizard reshows on next launch if persisted state hasn't flushed

**What goes wrong:**
The `firststeps_dashlet` extension registers `context.registerReducer(["settings",
"firststeps"], settingsReducer)` and the `completeStep` action writes to `state.settings.
firststeps.steps[id] = true`. State in the `settings` hive is persisted to LevelDB via the
`persistDiffMiddleware` on a diff-debounce cycle.

If the user completes the wizard and Vortex is closed quickly (within the debounce window,
typically 1-2 seconds), the `completeStep` actions may not have flushed to LevelDB before the
process exits. On the next launch, the wizard reshows from step 1.

This is particularly likely on Steam Deck where users close applications by pressing the Steam
button, which sends a rapid SIGTERM to the process.

**Why it happens:**
The persist middleware debounces writes to reduce LevelDB I/O. The wizard completion action
dispatched in the last second before close may not have triggered a flush.

**Consequences:**
- User repeats onboarding wizard on every launch
- Staging directory may be recreated or reconfigured, triggering chattr+F again
- `completeStep` action fires again for already-completed steps, causing duplicate LevelDB
  writes on subsequent starts

**Prevention:**
1. After dispatching `completeStep(wizardId)`, call a "force flush" API or dispatch an
   action that triggers an immediate persist cycle:
   ```typescript
   api.store.dispatch(completeStep('linux-onboarding'));
   // Force persist before the user might close
   await api.store.dispatch({ type: '__force_persist' });
   ```
2. Alternatively, use a session-state flag to suppress the wizard for the current session
   and only show it on next launch if the settings hive doesn't include the completion flag.
   This prevents the repeated-wizard problem without requiring a synchronous flush.
3. Listen for the Electron `before-quit` event in the renderer (via preload IPC) and call
   a synchronous persist before allowing the quit.

**Phase:** Phase 1 (wizard state management). Must be addressed in the same commit as
wizard completion tracking.

---

### Pitfall 14: Installing a mod before staging directory is fully initialized — `deploy.ts` throws `NoDeployment` with no Linux-specific guidance

**What goes wrong:**
`mod_management/util/deploy.ts` line 206:
```typescript
if (activator === undefined || stagingPath === undefined) {
  throw new NoDeployment();
}
```
`NoDeployment` surfaces as a generic error notification in the UI. The user who has just
completed the first-run wizard but whose staging directory setup is still in-flight (the
`ensureDirWritableAsync` promise is pending because chattr+F is running) gets this error if
they immediately click "Install" on a mod from the Browse page.

The timing window is small but real: `chattr +F` is a synchronous subprocess spawn; on an
older system it can take 200-500ms. If the user is fast and the wizard "completes" before the
directory setup coroutine resolves, a race condition exists.

**Why it happens:**
The wizard dispatches `setInstallPath` before the filesystem setup coroutine completes.
`installPathForGame` returns the path immediately after dispatch, so `stagingPath` is defined
— but the directory doesn't physically exist yet and the activator hasn't confirmed it.
`NoDeployment` is thrown for a different reason (activator not selected) but manifests at the
same call site.

**Consequences:**
- User gets cryptic "No deployment method available" error immediately after completing wizard
- No actionable guidance in the error dialog for Linux users
- User must wait a few seconds and retry, which is not obvious

**Prevention:**
1. After the wizard's final step, dispatch a "staging directory initializing" session flag and
   block the mod-install entry point:
   ```typescript
   // In wizard final step
   api.store.dispatch(setStagingInitializing(true));
   await ensureStagingDirectory(api, resolvedPath, gameId);
   api.store.dispatch(setStagingInitializing(false));
   ```
2. In the deployment entry point, check this flag and show a "Setup in progress, please wait"
   notification instead of the cryptic `NoDeployment` error.
3. Alternatively, show a modal spinner in the wizard's final step while directory setup
   completes, so the wizard does not dismiss until setup is done.

**Phase:** Phase 4 (mod install round-trip). The timing guard should be implemented when
integrating the wizard with the install flow.

---

## Minor Pitfalls

---

### Pitfall 15: `GetDiskFreeSpaceEx` in the shim calls `statfsSync` — throws if path is on an unmounted removable drive during first-run

**What goes wrong:**
`winapi-shim.ts` `GetDiskFreeSpaceEx` calls `fs.statfsSync(filePath)`. Unlike Windows
`GetDiskFreeSpaceEx` which returns a structured error for unmounted drives, `statfsSync` throws
ENOENT synchronously. The `firststeps_dashlet` calls `GetDiskFreeSpaceEx` inside a condition
function that's called on every Redux state change. An ENOENT that isn't caught returns `false`
from the `minDiskSpace` condition (because the outer try/catch returns false on any error) — so
this is not a crash, but it means disk-space warnings are silently suppressed for any path on
an unmounted or unavailable device.

**Prevention:**
The existing try/catch in `todos.tsx` correctly swallows errors from `GetDiskFreeSpaceEx` and
returns `false`. No action needed unless disk-space warnings are a v7.0 requirement. Note this
for the test plan.

**Phase:** Not a blocker. Document in test plan.

---

### Pitfall 16: `opn()` on Linux opens the URL in the OS default browser — but under Steam Deck Desktop Mode the default browser may not be set

**What goes wrong:**
`opn()` calls `getPreloadApi().shell.openUrl(url)` which delegates to Electron's
`shell.openExternal()`. Under SteamOS Desktop Mode, `xdg-open` is used as the bridge. If the
user has not set a default browser (common on a fresh SteamOS install), `xdg-open` opens the
URL in Discover (the software center) or fails silently.

**Prevention:**
Show the URL as clickable text in a dialog as a fallback if `shell.openUrl` does not confirm
success. Electron's `shell.openExternal` returns a Promise that rejects if the handler is not
found — catch the rejection and fall back to showing the URL inline:
```typescript
opn(url).catch(() => {
  api.showDialog("info", "Help Link", { text: `Visit: ${url}` }, [{ label: "OK" }]);
});
```

**Phase:** Phase 3 (help links). Add the fallback in the same commit as help URL wiring.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Error message purge (ONBRD-03) | Editing i18n string literals changes Windows wording | Platform-guard new strings; never edit existing `t("...")` literals |
| Error message purge (ONBRD-03) | `nativeErrors.ts` returns undefined on Linux, callers show "Run as Administrator" | Add Linux arm to error decoder or add platform-guarded fallback text at call sites |
| First-run wizard foundation | `winapi.GetVolumePathName` in firststeps_dashlet crashes on undefined path | Wrap in try/catch with `undefined` guard before call |
| First-run wizard foundation | Wizard completion state not flushed to LevelDB before rapid close | Force-persist after completing wizard steps |
| Steam library auto-detection (ONBRD-01) | `mCache` populated with empty list if Steam not ready at Vortex start | Add retry with delay and "Refresh" button in game-selection step |
| Staging directory setup (ONBRD-02) | `{USERDATA}` macro dispatched to Redux without resolving, then passed to `ensureDir` | Always call `resolveInstallPath` before dispatch and filesystem calls |
| Staging directory setup (ONBRD-02) | `winapi.GetVolumePathName` partition check uses Windows error code, misbehaves on Linux | Platform-guard the partition-exists check |
| Staging directory setup (ONBRD-02) | `suggestStagingPath` always returns userdata path on Linux regardless of device layout | Add Linux-aware cross-device check using `statSync.dev` |
| Staging directory setup (ONBRD-02) | `statfs` called on non-existent preview path, caches false result | Walk to nearest existing ancestor before calling `statfs` |
| 1280×800 layout (ONBRD-05) | Bootstrap 3 modal has no max-height; buttons clip below viewport | `max-height: calc(100vh - 160px)` on wizard modal; `flex-shrink: 0` on footer |
| 1280×800 layout (ONBRD-05) | Variable-length content (game list, mount table) overflows without scrollbar | Add `max-height` + `overflow-y: auto` to list containers in wizard |
| Help links (ONBRD-06) | `haveKnowledgeBase` cached as false before nexus_integration listener registers | Use `opn()` directly for Linux help links; remove the cache |
| Help links (ONBRD-06) | `opn()` silent failure under SteamOS (no default browser) | Add rejection handler that shows URL inline as fallback |
| Mod install round-trip (ONBRD-04) | Mod install attempted before staging dir setup coroutine resolves | Session-state "staging initializing" flag; block install entry point while set |

---

## Sources

- Codebase audit (HIGH confidence, 2026-04-16):
  - `src/renderer/src/extensions/onboarding_dashlet/` — step reducer, actions, index
  - `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` — `winapi.GetVolumePathName` calls, disk-space conditions
  - `src/renderer/src/extensions/mod_management/stagingDirectory.ts` — `ensureStagingDirectoryImpl`, `winapi.GetVolumePathName` partition check
  - `src/renderer/src/extensions/gamemode_management/util/discovery.ts` — `suggestStagingPath` Linux shortcut
  - `src/renderer/src/extensions/symlink_activator_elevate/index.ts` — "Run as Administrator" string
  - `src/renderer/src/extensions/mod_management/texts.ts` — Windows path examples in i18n strings
  - `src/renderer/src/util/nativeErrors.ts` — Windows-only `decodeSystemError`
  - `src/renderer/src/util/Steam.ts` — `mCache` singleton, `findLinuxSteamPath()` at constructor
  - `src/renderer/src/util/winapi-shim.ts` — `GetVolumePathName` walk, `GetDiskFreeSpaceEx` statfsSync
  - `src/renderer/src/util/opn.ts` — `shell.openUrl` delegation
  - `src/renderer/src/util/fs.ts` — `applyChattrCasefold`, `isExt4Filesystem`, `ext4CasefoldCache`
  - `src/renderer/src/store/hydration.ts` — persist:hydrate IPC, debounced flush
  - `src/renderer/src/controls/More.tsx` — `haveKnowledgeBase` cached closure
  - `src/stylesheets/vortex/dialogs.scss` — `.common-dialog-wide` `height: 80%`
  - `src/stylesheets/vortex/main-window.scss` — `.toolbar-app-region` 105px height

---

*Pitfalls research for: Vortex Linux fork v7.0 — First-Run Onboarding Wizard*
*Researched: 2026-04-16*
