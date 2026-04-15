# Architecture Patterns — v7.0 First-Run Onboarding Wizard

**Domain:** Electron + React + Redux mod manager — Linux onboarding wiring
**Researched:** 2026-04-16
**Confidence:** HIGH (all findings from live source code)

---

## 1. First-Run Wizard Architecture

### What "wizard" actually means in Vortex

There is no single-screen guided wizard. The first-run experience is composed of two independent dashlet extensions that both render on the Dashboard page.

| Extension | Location | State Hive | Purpose |
|-----------|----------|------------|---------|
| `firststeps_dashlet` | `src/renderer/src/extensions/firststeps_dashlet/` | `settings.firststeps` | "ToDo List" — action items visible until dismissed. Handles staging path, download path, game discovery. |
| `onboarding_dashlet` | `src/renderer/src/extensions/onboarding_dashlet/` | `settings.onboardingsteps` | Tutorial video cards. Separate from to-do items. |

### firststeps_dashlet — the actionable wizard

**Registration** (`index.ts`):
- `context.registerReducer(["settings", "firststeps"], settingsReducer)` — persisted
- `context.registerDashlet("ToDo List", ...)` — renders on Dashboard
- Exposes `context.registerToDo` hook so other extensions can inject their own to-do items

**Redux state** (`reducers.ts`):
```
settings.firststeps = {
  dismissAll: false,
  steps: { [stepId]: true }   // true = dismissed
}
```
Action: `dismissStep(stepId)` marks a step done.

**Built-in todos** (`todos.tsx`):

| Step ID | Condition | Action |
|---------|-----------|--------|
| `pick-game` | `activeGameId === undefined` | Opens Games page |
| `profile-visibility` | always shown | Toggles profile visibility in settings |
| `download-location` | disk free < 200 GB | Opens Download settings |
| `mod-location` | disk free < 200 GB | Opens Mods settings, highlights `#install-path-form` |
| `manual-scan` | `searchPaths !== undefined` | Emits `start-discovery` event |

**Critical Linux issue in `todos.tsx`:** The `download-location` and `mod-location` steps call `winapi.GetDiskFreeSpaceEx(path)` and `winapi.GetVolumePathName(path)` directly — but these are wrapped by the `winapi-shim` (webpack/rolldown alias). The shim at `src/renderer/src/util/winapi-shim.ts` provides Linux implementations of both functions. **No code change needed here** — the shim already handles it.

### onboarding_dashlet

**Registration** (`index.ts`):
- `context.registerReducer(["settings", "onboardingsteps"], settingsReducer)` — persisted
- `context.registerDashlet("Onboarding", ...)` — shows tutorial video cards
- Steps defined in `steps.ts` — hardcoded YouTube video links for "Manage your game", "Browse & install mods", "Using Profiles"

**Redux state**:
```
settings.onboardingsteps = {
  steps: { [stepId]: true }   // true = completed
}
```

**Linux issue with onboarding videos:** The tutorial videos reference Windows-centric gameplay. This is a UX issue, not a code issue. The videos show Windows paths and Steam on Windows. For v7.0 scope, the main concern is that the `pick-game` todo correctly detects Steam on Linux.

---

## 2. Staging Directory Configuration

### State location

```
state.settings.mods.installPath = { [gameId]: string }
state.settings.mods.installPathMode = "userData" | "suggested"
state.settings.mods.suggestInstallPathDirectory = "Vortex Mods"
```

**Extension owner:** `mod_management`
**Reducer file:** `src/renderer/src/extensions/mod_management/reducers/settings.ts`
**Actions file:** `src/renderer/src/extensions/mod_management/actions/settings.ts`
- Key action: `setInstallPath(gameId, path)` — dispatched when user applies new path
- Key action: `setInstallPathMode(mode)` — toggles auto-suggest vs. manual

### Selector chain

```
state.settings.mods.installPath[gameId]
  → getInstallPath(rawPath, gameId)   // resolves {USERDATA}/{game} variables
  → installPath selector              // src/renderer/src/extensions/mod_management/selectors.ts
```

`getInstallPath` is at `src/renderer/src/extensions/mod_management/util/getInstallPath.ts`.

### Settings UI

**File:** `src/renderer/src/extensions/mod_management/views/Settings.tsx`

This is the primary UI for staging dir. Renders via Settings page tab "Mods", registered in `mod_management/index.ts`.

**Linux-specific issues in Settings.tsx:**

1. **`suggestPath()` calls `winapi.GetVolumePathName(modPaths[""])`** (line ~1156) — shim handles this on Linux. However the suggestion logic builds `path.join(volume, suggestInstallPathDirectory, "{game}")` using `winapi.GetVolumePathName`, which on Linux returns a mount point (`/`, `/home`, etc.) not a drive letter. The shim implementation is correct; the resulting path will be `/Vortex Mods/{game}` or similar — potentially unexpected for Linux users.

2. **Help text in `texts.ts` case `"modspath"` and `"downloadspath"`** — contains `C:\Users\Mike\AppData\Roaming\Vortex\Downloads\` example. These are Windows paths. These strings are wrapped with `t()` but are in the default English translation, not in a locale file — they're in source code.

3. **Help text in `Settings.tsx` for `installPathMode`** — hardcodes `"c:\\Users\\<username>\\AppData\\Roaming\\Vortex\\<game>"` as the default path description. Platform-specific string.

4. **`isPathSensible(input)`** — contains `process.platform === "win32"` guard but the else branch correctly does nothing (no restrictions on non-Windows platforms). This is already correct.

### chattr+F integration point

`applyChattrCasefold(dirPath)` in `src/renderer/src/util/fs.ts` is called from `ensureDirWritableAsync`. This is already wired for v6.0. The staging dir Settings.tsx calls `fs.ensureDirAsync(newInstallPath)` which triggers `ensureDirWritableAsync` internally. **No new wiring needed for ONBRD-02** — the chattr+F path fires automatically when a staging dir is created.

---

## 3. Error Messages and Dialog Strings

### i18n architecture

**Framework:** `i18next` 19.0.1 + `react-i18next` 11.11.0
**Translation files:** `locales/en/{namespace}.json` — namespaces: `common`, `mod_management`, `gamemode_management`, `download_management`, etc.
**Init:** `src/renderer/src/util/i18n.ts` — `MultiBackend` FSBackend, loads from `getVortexPath("locales")`
**Usage pattern:** `t("string key or literal")` — most strings are used as both key and default English text (literal string mode)

**Critical finding:** The Windows-specific strings (`C:\`, "Run as Administrator", "UAC dialog") are NOT in the `.json` locale files. They are **hardcoded English literals** passed directly to `t()` in source files. They are translatable by downstream, but changing them requires editing source files directly.

### Windows-specific strings inventory

| File | String | Severity |
|------|--------|----------|
| `src/renderer/src/extensions/mod_management/texts.ts` line 98 | `"C:\\Users\\Mike\\AppData\\Roaming\\Vortex\\Downloads\\"` | Medium — in help tooltip for downloads path |
| `src/renderer/src/extensions/mod_management/views/Settings.tsx` lines 221–234 | `"c:\\Users\\<username>\\AppData\\Roaming\\Vortex\\<game>"` | High — shown in staging folder mode toggle help |
| `src/renderer/src/extensions/symlink_activator_elevate/index.ts` line 121 | `"Symlink Deployment (Run as Administrator)"` | High — deployment method name shown to all users |
| `src/renderer/src/extensions/symlink_activator_elevate/index.ts` line 123 | `"This is run as administrator and requires your permission every time we deploy."` | High — deployment method description |
| `src/renderer/src/extensions/symlink_activator_elevate/Settings.tsx` lines 138–148 | UAC dialog instructions, "windows Settings -> Update & Security -> For developers" | High — shown when enabling user symlinks |
| `src/renderer/src/util/fs.ts` line 1564 | `"Windows will show an UAC dialog."` | High — shown on EPERM/EACCES fs errors on Linux too |
| `src/main/src/Application.ts` line 650–654 | Admin rights + UAC warning dialog | Medium — admin check at startup |

**Platform guarding:** The `raiseUACDialog` function in `fs.ts` is reached via `forcePerm()` → `raiseUACDialog()`. The call at line 1643 is gated by `err.code === "EPERM"` or `err.code === "EACCES"` — these can occur on Linux too. The UAC dialog message would be shown on Linux if a permission error occurs. This is a **moderate Linux bug** — on Linux the dialog says "Windows will show an UAC dialog" which is wrong.

**`symlink_activator_elevate` on Linux:** The elevated symlink activator is Windows-specific (uses tasks scheduler + named pipes). Its `isSupported()` check calls `tasksSupported()` at line 1142. On Linux `tasksSupported()` should return false/unsupported, so the deployment method shouldn't appear. If the activator correctly excludes itself on Linux, the "Run as Administrator" strings won't be visible. **This needs verification before v7.0.**

### Platform-specific string strategy for v7.0

The recommended pattern is `process.platform === 'linux'` guards inside the `t()` call or wrapping the rendered string:

```typescript
// Pattern A: conditional string (used elsewhere in codebase)
const msg = process.platform === 'linux'
  ? t("pkexec will request your password.")
  : t("Windows will show a UAC dialog.");

// Pattern B: omit Windows-only paragraph on Linux
{process.platform !== 'linux' && <p>{t("UAC instructions...")}</p>}
```

---

## 4. Help / Documentation URL Routing

### Architecture

Help URLs flow through an event-based system, not a URL registry.

**Event:** `"open-knowledge-base"` — emitted with optional `wikiId` parameter

**Emitters:**
- `HelpSection.tsx` (`src/renderer/src/views/components/Header/HelpSection.tsx`) — top-level Help button click
- `More.tsx` (`src/renderer/src/controls/More.tsx`) — question mark popovers with `wikiId` prop

**Handler:** `extensions/documentation/src/index.tsx` line 118 — registered in `context.once()`:
```typescript
context.api.events.on("open-knowledge-base", (wikiId?: string) => {
  const isModernLayout = state.settings?.window?.useModernLayout;
  if (isModernLayout) {
    const url = generateUrl(wikiId) ?? WIKI_URL;
    util.opn(url).catch(() => null);  // opens in browser
  } else {
    context.api.events.emit("show-main-page", "Knowledge base");
    // embedded wiki view
  }
});
```

**URL resolution:** `generateUrl(wikiId)` in `extensions/documentation/src/index.tsx`:
```typescript
const WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki";
const WIKI_TOPICS = {
  "adding-games": "MODDINGWIKI-Users-UI-Games-section",
  "deployment-methods": "MODDINGWIKI-Users-General-Deployment-Methods",
  // ...8 more topics
};
```

**All help links are hardcoded** at the definition site — no centralized platform-aware URL registry. Unknown `wikiId` values fall back to `WIKI_URL` (the wiki root).

### Linux-specific help link strategy

For v7.0, Linux-specific help should point to Linux documentation. Options:

**Option A — Extend WIKI_TOPICS:** Add `"linux-setup"`, `"linux-steam"`, etc. to `WIKI_TOPICS` in `extensions/documentation/src/index.tsx`, pointing to Linux wiki pages. Pass conditionally from affected components.

**Option B — Platform-conditional URL in handler:** In the `open-knowledge-base` handler, detect Linux and route to Linux-specific docs when `wikiId` matches a Linux topic.

**Recommendation:** Option A. The `More` component's `wikiId` prop accepts a string; a conditional like `wikiId={process.platform === 'linux' ? 'linux-staging' : 'deployment-methods'}` works without any framework changes.

### Help link callsites for v7.0

| Location | Current wikiId / URL | Linux target |
|----------|---------------------|--------------|
| `mod_management/views/Settings.tsx` — staging folder `More` | none | `"linux-staging"` |
| `extensions/documentation/src/index.tsx` WIKI_URL fallback | `github.com/Nexus-Mods/Vortex/wiki` | Linux wiki section |
| `firststeps_dashlet` "download-location" todo action | opens settings page | no change needed |
| `ui/components/no_results/NoResults.tsx` | `help.nexusmods.com/article/125-contact-us` | keep — generic |

---

## 5. Build Order and Phase Dependencies

### Dependency graph

```
ONBRD-01 (Steam wizard auto-detect)
  └── depends on: Steam.ts resolveSteamPaths() already works (v2.0)
  └── depends on: getDriveList() returning Linux paths (drivelist works on Linux)
  └── NEW: firststeps_dashlet todos.tsx — no platform guard needed (winapi shim handles it)
  └── RISK: getDriveList fallback hardcodes "C:" on error (line 23, 44 in getDriveList.ts)

ONBRD-02 (staging dir filesystem detection)
  └── depends on: applyChattrCasefold() already wired in ensureDirWritableAsync (v6.0)
  └── depends on: Settings.tsx suggestPath() — winapi shim handles GetVolumePathName
  └── NEW: fix help text Windows path examples in texts.ts and Settings.tsx

ONBRD-03 (purge Windows error strings)
  └── independent — string replacements in multiple files
  └── affects: symlink_activator_elevate (verify isSupported() on Linux first)
  └── affects: fs.ts raiseUACDialog (add platform guard)
  └── affects: Settings.tsx staging folder mode help text
  └── affects: texts.ts downloadspath/modspath examples

ONBRD-04 (mod install round-trip)
  └── depends on: ONBRD-01 (must have a detected game)
  └── depends on: ONBRD-02 (must have valid staging dir)
  └── existing extension wiring — no new extension hooks

ONBRD-05 (1280x800 layout)
  └── independent — CSS/SCSS changes
  └── MainWindow.ts: minWidth=1024, minHeight=700 — window fits 1280x800
  └── dialog SCSS: some dialogs have fixed height/overflow issues at small viewport
  └── specifically: settings page panels may overflow at 800px height

ONBRD-06 (help links)
  └── independent of all other items
  └── requires: Linux wiki pages exist at target URLs
  └── code change: extensions/documentation/src/index.tsx WIKI_TOPICS
  └── code change: conditional wikiId prop at Linux-relevant More components
```

### Recommended phase ordering

**Phase 1 (foundation): ONBRD-01 — Steam wizard auto-detect**

Reason: All other onboarding items require a game to be selected. If Steam detection fails silently on Linux, the user is stuck at the `pick-game` todo. This is the entry gate.

Specific work:
- Fix `getDriveList.ts` fallback: the hardcoded `"C:"` at lines 23 and 44 should be `"/"` on Linux.
- Verify `firststeps_dashlet/todos.tsx` `minDiskSpace` condition works (uses shim — should be fine).
- Test that `start-discovery` event → `getDriveList()` → `setGameSearchPaths(drives)` populates Linux mount points.

Files: `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts`

**Phase 2 (staging): ONBRD-02 — Staging dir setup**

Reason: Once a game is found, the user needs to set the staging folder. chattr+F fires automatically (v6.0). But the help text and suggest-path logic need Linux awareness.

Specific work:
- Fix `texts.ts` `"downloadspath"` and `"modspath"` cases — replace Windows path examples with platform-conditional examples.
- Fix `Settings.tsx` staging folder mode help text — the `"c:\\Users\\..."` string in the `Toggle` help.
- Fix `suggestPath()` — ensure suggested path is sensible on Linux (mount point will be `/`, `/home`, etc.).

Files:
- `src/renderer/src/extensions/mod_management/texts.ts`
- `src/renderer/src/extensions/mod_management/views/Settings.tsx`

**Phase 3 (error strings): ONBRD-03 — Purge Windows error text**

Reason: Can be done independently of game detection, but logically follows once the user can reach the staging dir setup.

Specific work:
- `fs.ts` `raiseUACDialog` — add `process.platform !== 'linux'` guard or replace message.
- `symlink_activator_elevate/index.ts` — verify `tasksSupported()` returns false on Linux; if so, the "Run as Administrator" name is never shown. If not, add a Linux-specific deployment method name.
- `symlink_activator_elevate/Settings.tsx` — add platform guard around UAC dialog explanation text.
- `Application.ts` admin warning — already uses `is-admin`; on Linux `is-admin` checks `getuid() === 0`. The warning text references UAC; add platform-conditional text.

Files:
- `src/renderer/src/util/fs.ts`
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts`
- `src/renderer/src/extensions/symlink_activator_elevate/Settings.tsx`
- `src/main/src/Application.ts`

**Phase 4 (layout): ONBRD-05 — 1280x800 dialog layout**

Reason: Independent. Can run in parallel with Phase 3 but needs actual 1280x800 testing to identify which dialogs clip.

Specific work:
- Run Vortex at 1280x800 (Steam Deck Desktop Mode resolution).
- Identify which dialogs have clipped buttons or invisible scrollbars.
- Known risk areas: `dialog-fomod.scss`, `dialogs.scss` `.common-dialog-wide`, settings page with multiple panels.
- Fix: `overflow-y: auto` + `max-height: calc(100vh - Xpx)` on panel containers.

Files: `src/stylesheets/vortex/dialogs.scss` and per-dialog SCSS.

**Phase 5 (links): ONBRD-06 — Help link routing**

Reason: Requires Linux documentation pages to exist first. Lowest risk — pure content routing.

Specific work:
- Add Linux-specific entries to `WIKI_TOPICS` in `extensions/documentation/src/index.tsx`.
- Add `wikiId` prop with platform-conditional value to `More` components in `Settings.tsx` (mod staging) and `download_management/views/Settings.tsx`.

Files: `extensions/documentation/src/index.tsx`

**Phase 6 (validation): ONBRD-04 — Mod install round-trip**

Reason: Integration test of Phases 1–3. Requires: Steam detection working (P1), staging dir set (P2), no broken error dialogs (P3). This phase adds no new code — it validates the existing pipeline works end-to-end on Linux.

---

## 6. New vs Modified Files

### New files (v7.0)

None required. All v7.0 work modifies existing files with platform guards.

### Modified files

| File | Change Type | ONBRD# |
|------|-------------|--------|
| `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts` | Fix hardcoded `"C:"` fallback to `"/"` on Linux | ONBRD-01 |
| `src/renderer/src/extensions/mod_management/texts.ts` | Platform-conditional path examples in help text | ONBRD-02 |
| `src/renderer/src/extensions/mod_management/views/Settings.tsx` | Platform-conditional staging folder mode help text; suggestPath Linux path | ONBRD-02 |
| `src/renderer/src/util/fs.ts` | Platform guard in `raiseUACDialog` | ONBRD-03 |
| `src/renderer/src/extensions/symlink_activator_elevate/index.ts` | Platform-conditional name/description if `tasksSupported()` allows on Linux | ONBRD-03 |
| `src/renderer/src/extensions/symlink_activator_elevate/Settings.tsx` | Platform guard around UAC-specific instructions | ONBRD-03 |
| `src/main/src/Application.ts` | Platform-conditional admin warning text | ONBRD-03 |
| `src/stylesheets/vortex/dialogs.scss` + per-dialog files | overflow/max-height fixes | ONBRD-05 |
| `extensions/documentation/src/index.tsx` | Add Linux wikiId entries to WIKI_TOPICS | ONBRD-06 |

---

## 7. IExtensionContext Hooks Used

### firststeps_dashlet hooks
- `context.registerReducer(["settings", "firststeps"], reducerSpec)` — registers persisted Redux state
- `context.registerDashlet(name, w, h, pos, Component, isVisibleFn, propsFactory)` — dashboard card
- `context.registerToDo(id, type, props, icon, text, action, condition, value, priority)` — extensible hook, allows other extensions to add todo items

### onboarding_dashlet hooks
- `context.registerReducer(["settings", "onboardingsteps"], reducerSpec)`
- `context.registerDashlet(...)` — overlay-based video player cards
- `context.api.ext.showOverlay(id, ...)` / `context.api.ext.dismissOverlay(id)` — overlay system (from `instructions_overlay` extension)

### mod_management hooks used by staging dir
- `context.registerSettings("Mods", Settings, ...)` — adds Mods tab to Settings page
- `context.registerReducer(["settings", "mods"], settingsReducer)`
- `context.registerReducer(["persistent", "mods"], modsReducer)`

---

## 8. Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| First-run wizard extension structure | HIGH | Direct source read of `firststeps_dashlet/index.ts`, `reducers.ts`, `todos.tsx`, `onboarding_dashlet/index.ts` |
| Staging dir Redux state path | HIGH | Direct read of `mod_management/reducers/settings.ts`, `selectors.ts`, `Settings.tsx` |
| Windows-specific strings inventory | HIGH | `grep` across all source files, confirmed in file contents |
| i18n architecture | HIGH | Direct read of `i18n.ts`, `locales/en/` directory |
| Help URL routing | HIGH | Full read of `More.tsx`, `HelpSection.tsx`, `documentation/index.tsx` |
| getDriveList Linux fallback bug | HIGH | Direct read — line 23 hardcodes `"C:"` |
| symlink_activator_elevate on Linux | MEDIUM | Saw `tasksSupported()` call but did not verify what it returns on Linux — needs runtime check |
| Dialog layout at 1280x800 | MEDIUM | Code evidence suggests potential overflow; actual clip locations need live testing |
| chattr+F auto-fires on staging dir change | HIGH | v6.0 verified — `ensureDirWritableAsync` calls `applyChattrCasefold` |

---

## Sources

All findings from direct source code inspection at `/home/alex/src/Vortex/`:

- `src/renderer/src/extensions/firststeps_dashlet/` — all files
- `src/renderer/src/extensions/onboarding_dashlet/` — all files
- `src/renderer/src/extensions/mod_management/reducers/settings.ts`
- `src/renderer/src/extensions/mod_management/selectors.ts`
- `src/renderer/src/extensions/mod_management/views/Settings.tsx`
- `src/renderer/src/extensions/mod_management/texts.ts`
- `src/renderer/src/extensions/gamemode_management/util/getDriveList.ts`
- `src/renderer/src/extensions/gamemode_management/index.ts` (start-discovery handler)
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts`
- `src/renderer/src/extensions/symlink_activator_elevate/Settings.tsx`
- `src/renderer/src/util/fs.ts` (raiseUACDialog, forcePerm)
- `src/renderer/src/util/Steam.ts` (constructor, resolveSteamPaths)
- `src/renderer/src/util/linux/steamPaths.ts`
- `src/renderer/src/util/winapi-shim.ts`
- `src/renderer/src/util/i18n.ts`
- `src/renderer/src/controls/More.tsx`
- `src/renderer/src/views/components/Header/HelpSection.tsx`
- `extensions/documentation/src/index.tsx`
- `src/main/src/MainWindow.ts`
- `src/main/src/Application.ts`
- `src/stylesheets/vortex/dialogs.scss`
