# Technology Stack

**Project:** Vortex Linux — v7.0 First-Run Onboarding Wizard
**Researched:** 2026-04-16
**Confidence:** HIGH — all findings based on direct code inspection of the live codebase

---

## Scope

This document covers stack analysis for the **v7.0 First-Run Onboarding Wizard** milestone.
All previous milestone stack research (v1.0–v6.0) is preserved in git history. This file
covers only what is relevant for v7.0.

The v7.0 requirements are:
- **ONBRD-01**: First-run wizard completes and auto-detects Steam library
- **ONBRD-02**: Mod staging directory configured with filesystem detection (ext4 → chattr+F,
  fallback for XFS/ZFS/other)
- **ONBRD-03**: No "Run as Administrator" or `C:\` paths appear in any error state on Linux
- **ONBRD-04**: Mod install → deploy → enable round-trip works for one Proton game
- **ONBRD-05**: All dialogs render without clipped buttons or invisible scroll at 1280×800
- **ONBRD-06**: "Get Help" links route to Linux-specific documentation

**No new major dependencies are needed.** This is UI/string fixes + connecting existing
detection code to the wizard flow.

---

## 1. First-Run Wizard Infrastructure (ONBRD-01)

### What Exists

Vortex does not have a traditional "modal wizard" that appears on first run. The first-run
experience is entirely dashboard-based and consists of two separate dashlets plus a
game-picker flow:

#### `firststeps_dashlet` — The "To-Do" dashlet ("Let's get you set up")

**Location:** `src/renderer/src/extensions/firststeps_dashlet/`

Files:
- `index.ts` — registers dashlet, exposes `registerToDo` API to other extensions
- `Dashlet.tsx` — renders the to-do list; calls `todo.action(props)` on click
- `todos.tsx` — defines the built-in todo items (pick-game, profile-visibility, download-location,
  mod-location, manual-scan)
- `reducers.ts` — persists which steps have been dismissed (`settings.firststeps.steps`)
- `actions.ts` — `dismissStep` action
- `IToDo.ts` — interface

**Critical issue for ONBRD-03:** `todos.tsx` calls `winapi.GetDiskFreeSpaceEx()` and
`winapi.GetVolumePathName()` directly at lines 31, 99, and 132. The import is:
```typescript
import * as winapi from "winapi-bindings";
```
On Linux, webpack aliases `winapi-bindings` → `src/renderer/src/util/winapi-shim.ts`
(configured at `src/renderer/webpack.config.cjs:52`), so the shim's Linux-native implementations
(`statfsSync`, mount-point walk) are used. The shim already works correctly.

**Issue:** The `download-location` and `mod-location` todos only appear as
warnings when disk space is below 200 GB (`MIN_DISK_SPACE = 200 * 1024^3`). On Linux the
`GetVolumePathName()` shim returns the mount point path (e.g., `/home`, `/`) rather than
`C:` drive letter. This is correct behavior — no change needed.

**Issue:** The `mod-location` todo value displays the volume path via `winapi.GetVolumePathName`,
which returns the mount point on Linux. This is reasonable (e.g., `/home`), though it is less
informative than a drive letter display. MEDIUM priority — informational only.

#### `NoGameDashlet` — The welcome banner

**Location:** `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx`

Shows "Welcome to Vortex — As this is the first time you start Vortex, please pick a game
to manage." Renders discovered game thumbnails inline and has a "More..." link to the Games
page. No Windows strings. No layout issues observed.

#### `onboarding_dashlet` — The video tutorial dashlet ("Get Started")

**Location:** `src/renderer/src/extensions/onboarding_dashlet/`

Files:
- `index.ts` — registers dashlet
- `Dashlet.tsx` — renders video cards and a "completed" state
- `steps.ts` — hard-codes three tutorial videos (YouTube embeds): "Manage your game",
  "Browse & install mods", "Using Profiles in Vortex"
- `views/Overlay.tsx` — renders the iframe + "Mark as complete" button

**Issue for ONBRD-01/ONBRD-06:** The tutorial videos are Windows-centric (no Linux-specific
content). Existing video IDs (Nn4fLIbe7mU, MxmZNONcSVU, tNfA0iZ7kgw) should be supplemented
with a Linux-specific step if available, or the description text updated to note Linux
differences. This is a content decision, not a code architecture change.

**Overlay size at 1280×800 (ONBRD-05):** The overlay is sized at:
```scss
.instructions-overlay.overlay-onboarding {
    height: 466px;
    width: 600px;
}
```
At 1280×800 this is fine — the overlay is 600px wide vs 1280px viewport. No clipping expected.

### Steam Library Auto-Detection (ONBRD-01)

Steam library detection is fully implemented in v2.0 via:
- `src/renderer/src/util/Steam.ts` — `allGames()` uses `findAllLinuxSteamPaths()` on Linux
- `src/renderer/src/util/linux/steamPaths.ts` — parses VDF, handles Flatpak Steam paths

**The detection already works on Linux.** ONBRD-01 is about ensuring the wizard flow
*surfaces* the detection results correctly, not reimplementing detection.

The `firststeps_dashlet` todos include a `pick-game` item that navigates to the Games page
(`api.events.emit("show-main-page", "Games")`). The Games page runs `allGames()` via the
Steam store helper. No changes needed to detection; the wiring already exists.

---

## 2. Mod Staging Directory + Filesystem Detection (ONBRD-02)

### Status: Already Implemented in v6.0

`applyChattrCasefold(dirPath)` in `src/renderer/src/util/fs.ts` is called from
`ensureDirWritableAsync()`. This covers:
- `statfsSync` to detect ext4 casefold support (CASE-05)
- `chattr +F` application on success (CASE-06)
- Silent fallback to Wine-prefix shim on EOPNOTSUPP/EINVAL/non-ext4 (CASE-07)
- Platform guard (CASE-08), Flatpak guard (CASE-09), post-apply verify (CASE-10)

**ONBRD-02 is already satisfied by v6.0 infrastructure.** No stack changes needed.

---

## 3. Windows-Specific Strings (ONBRD-03)

### Findings by File

#### HIGH PRIORITY — Visible on Linux, no platform guard

**`src/renderer/src/extensions/download_management/views/Settings.tsx:737`**
```
"This directory is not writable to the current windows user account. "
"Vortex can try to create the directory as administrator but it will "
"then have to give access to it to all logged in users."
```
Triggered by `confirmElevate()` when user attempts to create a non-writable download
directory. No platform guard. This dialog and its "Create as Administrator" button appear
on Linux. Must be fixed.

**`src/renderer/src/util/fs.ts:1563-1564` (inside `raiseUACDialog`)**
```
"If your account has admin rights Vortex can unlock the file for you. "
"Windows will show an UAC dialog."
```
`raiseUACDialog` is called from `forcePerm` when both `changeFileAttributes` and the
retry path fail on `EPERM`/`EACCES`. This can happen on Linux. Must be fixed.

**`src/renderer/src/extensions/mod_management/util/activationStore.ts:313`**
```
"insufficient permissions.\nPlease ensure your Windows user account "
"has full read/write permissions to the manifest file and try again."
```
EPERM reading the manifest file — no platform guard. Can be seen on Linux. Must be fixed.

**`src/renderer/src/extensions/mod_management/texts.ts:96-98`**
```
"e.g. if your Windows account name is Mike,"
'"C:\\Users\\Mike\\AppData\\Roaming\\Vortex\\Downloads\\"'
```
Shown in the More popover for the downloads path setting. Informational text, visible on
Linux. Should be replaced with platform-appropriate example paths.

**`src/renderer/src/extensions/mod_management/views/Settings.tsx:222`**
```
'"c:\\Users\\<username>\\AppData\\Roaming\\Vortex\\<game>" because that\'s '
```
In the "Staging Path Mode" More popover. Visible on Linux. Should show Linux path example
(`~/.local/share/vortex/<game>`) instead.

#### MEDIUM PRIORITY — Shown on Linux but only as deployment method descriptions (informational)

**`src/renderer/src/extensions/symlink_activator_elevate/index.ts:121,123`**
```
"Symlink Deployment (Run as Administrator)"
"This is run as administrator and requires your permission every time we deploy."
```
This extension's `isSupported()` returns `{ description: (t) => "Elevation not required on
non-windows systems" }` on Linux (line 240), so this deployer never becomes *active* on
Linux. The name/description strings are only shown in the deployment method selector UI,
where the method appears as "unavailable." A Linux user sees the unavailability reason
("Elevation not required on non-windows systems") but not the method's own description
string. MEDIUM priority — could confuse if the user browses deployment method details.

**`src/renderer/src/extensions/symlink_activator/index.ts:104`**
```
"Requires admin rights on windows."
```
`symlink_activator.isSupported()` calls `this.ensureAdmin()` which tests symlink creation.
On Linux, regular users can create symlinks in home directories, so `ensureAdmin()` returns
`true` and this string is NOT shown. The `symlink_activator` is available on Linux.
LOW priority — string would only show if symlink creation fails for the test file.

**`src/renderer/src/extensions/symlink_activator_elevate/index.ts:154,186-187`**
```
"On Windows, symbolic links only work on NTFS drives."
" - On windows you need admin rights to create a symbolic link..."
```
These are in `detailedDescription()` which is shown when the user clicks "details" on a
deployment method in settings. The `symlink_activator_elevate` shows as unavailable on
Linux, but its detail text can still be viewed. LOW/MEDIUM priority.

#### LOW PRIORITY — Platform-guarded or in comments

- `src/main/src/Application.ts:650-656`: UAC warning dialog — guarded by `is-admin` which
  returns `false` on non-win32. Never shown on Linux.
- `src/main/src/Application.ts:401-417`: "My Documents" missing dialog — `DocumentsPathMissing`
  only thrown on `win32` (guarded at `Application.ts:1200`). Never shown on Linux.
- `src/renderer/src/extensions/symlink_activator_elevate/Settings.tsx:138-149`: UAC/Developer
  Mode dialog — this settings page is Windows-only since the deployer is unavailable on Linux.
- `src/renderer/src/util/fs.ts:1367`: Comment only (UAC dialog cancellation code). Not user-visible.
- `src/renderer/src/extensions/installer_dotnet/index.ts:98,150`: .NET installer — the
  `installer_dotnet` extension has its own platform guard; not applicable on Linux.

---

## 4. Help URL Infrastructure (ONBRD-06)

### How "Get Help" Works

The help system uses a single event-driven pattern: `api.events.emit("open-knowledge-base", wikiId?)`.

**Entry point:** `src/renderer/src/views/components/Header/HelpSection.tsx:30`
```typescript
api.events.emit("open-knowledge-base");
```
The "Help centre" dropdown item in the header fires this event without a `wikiId`.

**Handler:** `extensions/documentation/src/index.tsx:118-133`
```typescript
context.api.events.on("open-knowledge-base", (wikiId?: string) => {
  const state = context.api.store.getState();
  const isModernLayout = state.settings?.window?.useModernLayout;
  if (isModernLayout) {
    const url = generateUrl(wikiId) ?? WIKI_URL;
    util.opn(url).catch(() => null);  // opens browser
  } else {
    context.api.events.emit("show-main-page", "Knowledge base");
    // navigate to inline Knowledge base page
  }
});
```

**URL generation:** `extensions/documentation/src/index.tsx:13-34`
```typescript
const WIKI_URL = "https://github.com/Nexus-Mods/Vortex/wiki";

const WIKI_TOPICS = {
  "adding-games": "MODDINGWIKI-Users-UI-Games-section",
  "deployment-methods": "MODDINGWIKI-Users-General-Deployment-Methods",
  // ... 8 topics total, all Windows-focused
};
```

**Issue for ONBRD-06:** There are no Linux-specific wiki topic IDs. The `WIKI_URL` points
to `github.com/Nexus-Mods/Vortex/wiki` which has no Linux-specific documentation. When a
Linux user clicks "Help centre" they get the Windows-focused Nexus Mods wiki.

**What needs to change:**
1. Add a Linux-specific default help URL constant (e.g., pointing to a Linux setup guide)
2. Optionally add Linux-specific `wikiId` entries (e.g., `"linux-setup"`) that can be
   emitted from relevant error dialogs
3. The `open-knowledge-base` handler in `documentation/src/index.tsx` can be extended
   to branch on `process.platform === "linux"` for the default fallback URL

**More component (inline help):** `src/renderer/src/controls/More.tsx` shows a "Learn more"
link that emits `open-knowledge-base` with the component's `wikiId`. This is the inline
contextual help for settings fields. No changes needed to the component itself; the wiki
topic map in `documentation/src/index.tsx` just needs Linux entries added.

---

## 5. Layout at 1280×800 (ONBRD-05)

### Window Size Constraints

`src/main/src/MainWindow.ts:17`:
```typescript
const MIN_HEIGHT = 700;
```
`src/main/src/MainWindow.ts:387-388`:
```typescript
minWidth: 1024,
minHeight: MIN_HEIGHT,  // 700px
```

At 1280×800, Vortex has 800px height — 100px above the 700px minimum. The window fits
within 1280×800.

### Potential Layout Problems at 1280×800

**Onboarding cards (`.onboarding-card`):**
```scss
.onboarding-card {
    width: 250px;
    max-width: 250px;
}
.onboarding-card-list {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;  // wraps if needed
    overflow: auto;
}
```
Three cards × 250px + 2 gaps × 14px = 778px minimum. At 1280px wide minus the Spine
sidebar width, there should be enough room for 3 cards in a row. `flex-wrap: wrap` means
cards wrap to a second row at narrow widths — no clipping, just reflow.

**Overlay (`.instructions-overlay.overlay-onboarding`):**
```scss
height: 466px;
width: 600px;
```
This is positioned absolutely near the clicked card. At 1280×800 this overlay (600px wide,
466px tall) should fit. The overlay uses `window.innerWidth / window.innerHeight` for its
position reference. At 800px height, a 466px overlay leaves 334px of space — the overlay
should not be cut off if positioned with enough top margin. **Investigation needed** at
actual 1280×800 to verify no clipping at bottom edge.

**Game picker media query:**
```scss
@media (max-width: 1280px) {
    // .game-thumbnail-body .thumbnail-img {
    //   max-width: 128px;
    // }
}
```
Commented out — no active constraint at 1280px.

**ToDo dashlet (`.todo`):**
```scss
width: 140px;
height: 105px;
min-width: 110px;
```
Fixed-size tiles — no overflow issue expected.

**Known risk areas for 1280×800:**
- The onboarding overlay position calculation uses `{ x: window.innerWidth, y: window.innerHeight }`
  as the trigger position (`Dashlet.tsx:42`). This places the overlay near the bottom-right
  corner. At 800px height the overlay (466px) may be clipped by the viewport bottom.
  This is the most likely ONBRD-05 bug.
- The FOMOD installer dialog (`dialog-fomod.scss`) has fixed height constraints that may
  overflow at 800px but is not part of the first-run flow.

---

## 6. Deployment Round-Trip (ONBRD-04)

### What Already Works

By v6.0, the full deployment stack is in place:
- `hardlink_activator` — preferred deployer on Linux (works cross-partition via hardlinks)
- `symlink_activator` — available on Linux (no admin rights needed)
- `applyChattrCasefold` — applied at staging dir creation
- Steam/Proton game paths — resolved via `mygamesPath()`, `proton.ts`

**ONBRD-04 requires no new stack.** The remaining work is integration testing, not new code.

The `firststeps_dashlet` todos already guide users: pick-game → configure staging path →
deploy. The staging directory creation wires to `ensureDirWritableAsync` → `applyChattrCasefold`.

---

## 7. No New Dependencies Required

| Requirement | Approach | New Dep? |
|-------------|----------|----------|
| ONBRD-01: Steam auto-detect | Already done via `Steam.ts` | None |
| ONBRD-02: Filesystem detection | Already done via `applyChattrCasefold` | None |
| ONBRD-03: Windows string cleanup | String edits + platform guards | None |
| ONBRD-04: Deploy round-trip | Integration testing | None |
| ONBRD-05: 1280×800 layout | CSS/positioning fixes | None |
| ONBRD-06: Help links | Add Linux URL constant + conditional branch | None |

---

## Specific Files That Need Changes

### ONBRD-03 — Windows String Cleanup

| File | Line(s) | Change Needed |
|------|---------|---------------|
| `src/renderer/src/extensions/download_management/views/Settings.tsx` | 737-741 | Platform-guard the dialog; show Linux-appropriate message ("not writable to the current user") with pkexec elevation path instead of UAC |
| `src/renderer/src/util/fs.ts` | 1560-1565 (`raiseUACDialog`) | Platform-guard "Windows will show an UAC dialog." — show "Vortex will use pkexec to grant permission." on Linux |
| `src/renderer/src/extensions/mod_management/util/activationStore.ts` | 312-314 | Remove "Windows user account" from EPERM message; use platform-neutral wording |
| `src/renderer/src/extensions/mod_management/texts.ts` | 96-98 | Replace Windows path example with `{USERDATA}` variable reference (platform-neutral) or add conditional example |
| `src/renderer/src/extensions/mod_management/views/Settings.tsx` | 221-226 | Replace `c:\Users\<username>\AppData\Roaming\Vortex\<game>` with platform-agnostic description or `{USERDATA}` example |

### ONBRD-06 — Help Link Routing

| File | Change Needed |
|------|---------------|
| `extensions/documentation/src/index.tsx` | Add Linux-specific default URL in `open-knowledge-base` handler; add `"linux-setup"` key to `WIKI_TOPICS` map; add Linux help URL constant |

### ONBRD-05 — Layout at 1280×800

| File | Change Needed |
|------|---------------|
| `src/renderer/src/extensions/onboarding_dashlet/Dashlet.tsx` | Clamp overlay position so it does not extend past viewport bottom; use `Math.min(y - height, window.innerHeight - overlayHeight)` pattern |
| `src/stylesheets/vortex/dashlet.scss` | Verify `.instructions-overlay.overlay-onboarding` height (466px) fits within 800px viewport; add `max-height` media query if needed |

---

## Already Validated (No Changes Needed)

| Item | Status | Evidence |
|------|--------|----------|
| `winapi.GetDiskFreeSpaceEx` on Linux | Works | `winapi-shim.ts` uses `fs.statfsSync` (line 37); webpack alias active |
| `winapi.GetVolumePathName` on Linux | Works | `winapi-shim.ts` walks mount point tree (line 54); returns `/home`, `/` etc. |
| `applyChattrCasefold` at staging creation | Shipped v6.0 | `ensureDirWritableAsync` calls it at `fs.ts:1390` |
| Steam library detection on Linux | Shipped v2.0 | `findAllLinuxSteamPaths()` + Flatpak path support |
| `isAdmin()` returns false on Linux | Works | `is-admin` package explicitly returns false on non-win32 |
| `DocumentsPathMissing` on Linux | Not triggered | `validateDocumentsPath` guarded by `if (process.platform !== "win32") return` |
| Symlink activator available on Linux | Works | `ensureAdmin()` tests symlink creation; succeeds for normal users in home dirs |
| Symlink elevate deployer on Linux | Correctly unavailable | `isSupported()` returns unavailability reason on non-win32 |

---

## Sources

All findings based on direct code inspection (HIGH confidence). Specific files:
- `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` — winapi calls confirmed
- `src/renderer/webpack.config.cjs:50-59` — winapi-bindings webpack alias confirmed
- `src/renderer/src/util/winapi-shim.ts:37-75` — Linux shim implementations confirmed
- `src/renderer/src/extensions/download_management/views/Settings.tsx:730-747` — Windows dialog
- `src/renderer/src/util/fs.ts:1552-1565` — raiseUACDialog Windows text
- `src/renderer/src/extensions/mod_management/util/activationStore.ts:310-317` — Windows perms text
- `src/renderer/src/extensions/mod_management/texts.ts:85-118` — Windows example paths
- `extensions/documentation/src/index.tsx:13-34` — WIKI_URL + WIKI_TOPICS
- `src/main/src/MainWindow.ts:17,387-388` — window size constraints
- `src/stylesheets/vortex/dashlet.scss:455-620` — onboarding CSS
- `src/renderer/src/extensions/symlink_activator_elevate/index.ts:240-244` — Linux guard
- `src/main/src/Application.ts:1200` — DocumentsPathMissing Linux guard
- `src/main/node_modules/is-admin/index.js` — returns false on non-win32

---

*Stack research for: Vortex Linux — v7.0 First-Run Onboarding Wizard*
*Researched: 2026-04-16*
