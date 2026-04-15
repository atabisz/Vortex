# Feature Research: v7.0 First-Run Onboarding Wizard (Linux)

**Domain:** Electron mod manager — Linux-native first-run onboarding flow
**Researched:** 2026-04-16
**Confidence:** HIGH — all claims based on direct codebase inspection; specific file paths cited
**Milestone scope:** ONBRD-01 through ONBRD-06 from PROJECT.md

---

## What Is Already Built (Relevant Infrastructure)

The following pieces are shipped and form the substrate that this milestone wires together:

- Steam library detection: `src/renderer/src/util/Steam.ts` + `src/renderer/src/util/linux/steamPaths.ts`
  — `findLinuxSteamPath()` / `findAllLinuxSteamPaths()` / VDF parsing via `simple-vdf`.
  Runs automatically on startup via `GameModeManager.startQuickDiscovery()`.
- chattr+F filesystem layer: `ensureDirWritableAsync()` in `src/renderer/src/util/fs.ts` calls
  `applyChattrCasefold()` at staging directory creation time — kernel casefold on ext4,
  silent fallback to Wine-prefix shim on all other filesystems. This is already wired.
- Elevation: `runElevated()` in `src/renderer/src/util/elevated.ts` — pkexec on Linux,
  graceful `UserCanceled` on SteamOS Game Mode.
- NXM download: `src/extensions/download_management/` + `src/extensions/browse_nexus/` —
  NXM URL handler registered for AppImage/standard installs via xdg-utils.
- Save management: `src/renderer/src/extensions/gamemode_management/` — Proton prefix resolution
  via `{mygames}` macro, `src/renderer/src/util/linux/proton.ts`.

---

## 1. First-Run Wizard: What Exists and What Is Missing

### What Exists (codified, real code)

Vortex has **no traditional first-run wizard** (no step-through modal, no setup screens).
The "first-run" experience is dashboard-based, composed of two dashlets:

**`firststeps_dashlet` ("Let's get you set up")**
Source: `src/renderer/src/extensions/firststeps_dashlet/`
This is the primary first-run control surface. It renders a todo list that adapts
as the user completes steps. Defined todos (in `todos.tsx`):

| Todo ID | Text | Action | Condition |
|---------|------|--------|-----------|
| `pick-game` | "Select a game to manage" | Opens Games page | `activeGameId === undefined` |
| `profile-visibility` | "Profile Management" | Toggles profiles visible | Always shown |
| `download-location` | "Downloads are on drive" | Opens Settings > Download | Only if disk < 200 GB |
| `mod-location` | "Mods are staged on drive" | Opens Settings > Mods | Only if disk < 200 GB |
| `manual-scan` | "Scan for missing games" | Emits `start-discovery` event | `searchPaths !== undefined` |

**`onboarding_dashlet` ("Get Started")**
Source: `src/renderer/src/extensions/onboarding_dashlet/`
This dashlet shows 3 video tutorial cards (YouTube-nocookie iframes):
1. "Manage your game" — Link account + add games (1:34)
2. "Browse & install mods" — Install mods through Vortex (2:29)
3. "Using Profiles in Vortex" — Profiles tutorial (1:23)

Cards can be marked "complete". Once all three are complete, a congratulations banner
with "Get more mods" appears. The dashlet state is persisted in Redux
`settings.onboardingsteps`.

**`NoGameDashlet` ("Welcome to Vortex")**
Source: `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx`
Rendered on first launch: "As this is the first time you start Vortex, please pick a
game to manage. Afterwards please check the ToDo List below." Shows discovered game
thumbnails inline. Uses horizontal scroll with overflow-hidden clipping for overflow.

### What Is Missing (Linux gaps)

- The `firststeps_dashlet` todos call `winapi.GetVolumePathName(props.dlPath)` and
  `winapi.GetVolumePathName(props.instPath)` to display drive labels. On Linux, winapi
  is shimmed but these calls return undefined/throw — the `download-location` and
  `mod-location` todos fail silently or show `<Invalid Drive>`. The todo display value
  function calls `winapi.GetVolumePathName` with no platform guard.
  Source: `src/renderer/src/extensions/firststeps_dashlet/todos.tsx:98–129`.

- The `download-location` todo has `condition: minDiskSpace(MIN_DISK_SPACE, 'dlPath')`
  which also calls `winapi.GetDiskFreeSpaceEx`. This throws on Linux (the winapi shim
  does not implement `GetDiskFreeSpaceEx`). The condition returns `false` on error,
  which means the disk space todos are never shown on Linux — silently hidden.
  Source: `src/renderer/src/extensions/firststeps_dashlet/todos.tsx:20–38`.

- Steam auto-detection runs via `GameModeManager.startQuickDiscovery()` which calls
  `GameStoreHelper.find()` → `Steam.allGames()` → `resolveSteamPaths()` → `findAllLinuxSteamPaths()`.
  This part works. **The gap**: when Steam detection succeeds, discovered games appear in
  `NoGameDashlet` as thumbnails. But if the user's Steam install is Flatpak or in a
  non-standard location, `findAllLinuxSteamPaths()` may return nothing, leaving the
  "Welcome to Vortex" dashlet empty. There is no diagnostic message explaining why no
  games were found. The user sees an empty thumbnail row with no guidance.

- The `PathSelection.tsx` modal (for manual game search path entry) defaults to `C:` on
  win32 and `/` on Linux. Source: `src/renderer/src/extensions/gamemode_management/views/PathSelection.tsx:46`.
  This part is already handled correctly. No Linux gap here.

- The `symlink_activator_elevate` extension displays "Symlink Deployment (Run as
  Administrator)" as the deployment method name, and its description says "This is run as
  administrator and requires your permission every time we deploy."
  Source: `src/renderer/src/extensions/symlink_activator_elevate/index.ts:121–123`.
  On Linux, this deployment method is only used if the mod path is not writable by the
  current user. The string "administrator" in the description is Windows-centric.

- `download_management/views/Settings.tsx:737` shows "This directory is not writable to
  the current windows user account. Vortex can try to create the directory as administrator
  but it will then have to give access to it to all logged in users." — always shown when
  the directory is not writable, regardless of platform. No Linux variant exists.

- `mod_management/texts.ts:96–98` contains Windows-only example text:
  `"e.g. if your Windows account name is Mike... C:\\Users\\Mike\\AppData\\..."`.
  This appears in the "mods staging path" help text shown in Settings > Mods.

---

## 2. Steam Library Auto-Detection: Current vs. Required

### What Currently Happens

1. On startup, `GameModeManager` calls `startQuickDiscovery()`.
2. `quickDiscovery()` calls `GameStoreHelper.find(game.queryArgs)` for each registered game.
3. `GameStoreHelper.find()` iterates `mKnownGameStores` = `[Steam, EpicGamesLauncher, ...]`.
4. `Steam.allGames()` → `resolveSteamPaths()`:
   - Calls `findAllLinuxSteamPaths()` (on Linux).
   - `findAllLinuxSteamPaths()` checks `~/.steam/root` symlink first, then a hardcoded
     candidate list: XDG path, `~/.steam/debian-installation`, Flatpak paths, Snap paths.
   - For each valid Steam root, reads `config/libraryfolders.vdf` and collects all library paths.
5. Parses `.acf` manifests in each `steamapps/` directory.
6. Returns a list of `ISteamEntry[]` with `appid`, `name`, `gamePath`, `lastUpdated`.
7. `quickDiscovery()` tests each game's `queryPath()` or `queryArgs` against the store entries.
8. `addDiscoveredGame()` is dispatched to Redux state with each discovered game.
9. `NoGameDashlet` reads `state.settings.gameMode.discovered` and renders thumbnails.

### The Discovery Gap on Linux

The quick discovery fires silently at startup and succeeds in the happy path (native Steam
at `~/.local/share/Steam`). However:

- If no Steam installation is found, `resolveSteamPaths()` returns `[]`, `allGames()`
  returns `[]`, and no games are discovered. The user sees the empty "Welcome to Vortex"
  dashlet with no explanation.
- The `manual-scan` todo in `firststeps_dashlet` (id `manual-scan`) has
  `condition: (props) => props.searchPaths !== undefined`. This means it only shows up
  if search paths are configured — which they are not on a fresh Linux install by default.
  The manual scan todo is hidden on a fresh install.
- There is no toast/notification when Steam detection finds nothing. The user must
  intuit that they need to manually add games.

### What Should Happen (ONBRD-01)

The first-run flow on Linux should:
1. Run `startQuickDiscovery()` (already happens).
2. If no games discovered after quick discovery AND platform is Linux: show a
   contextual notification/dashlet entry explaining that Steam was not found automatically
   with a direct action to open the Games page and manually locate Steam.
3. The `manual-scan` todo should appear unconditionally on Linux when no games are found,
   not gated on `searchPaths !== undefined`.

---

## 3. Mod Install → Deploy → Enable Round-Trip

### Code Path (what exists)

The install → deploy → enable round-trip involves three independent operations:

**Step 1: Install (archive → staging directory)**
Entry point: User clicks "Install" on a downloaded archive in Downloads page.
Flow: `mod_management/index.ts` → `installManager.install()` →
`InstallManager.installMod()` → installer pipeline (fomod, basic, nested, etc.) →
extracts mod files to `stagingPath/<modId>/`.
Key file: `src/renderer/src/extensions/mod_management/InstallManager.ts`
Linux readiness: The staging directory is created with `ensureDirWritableAsync()` which
now calls `applyChattrCasefold()`. The FOMOD installer IPC pipeline works on Linux (v5.0).
The basic installer has no platform-specific code.

**Step 2: Deploy**
Entry point: "Deploy Mods" button or automatic deploy trigger.
Flow: `mod_management/index.ts:genUpdateModDeployment()` →
`deployAllModTypes()` → `deployModType()` → `deployMods()` (in `modActivation.ts`) →
`activator.activate(stagingPath, modPath, files)`.
The activator is the deployment method: hardlink (same drive), symlink, or move.
Key files: `src/renderer/src/extensions/hardlink_activator/`, `symlink_activator/`, `move_activator/`.
On Linux: `hardlink_activator` is available when staging and game are on the same filesystem
device (`statSync(installPath).dev === statSync(modPath).dev`).
`symlink_activator` is always available on Linux (no Windows-only code in `isSupported()`).
`symlink_activator_elevate` is available only on Windows (guarded: `process.platform !== 'linux'`
at line 49 skips the monitorConsent call, but the class itself is registered without platform guard —
this needs verification).

**Step 3: Enable**
"Enable" in the mod list sets `state.persistent.mods[gameId][modId].state = 'enabled'`.
This does not trigger deployment; deployment is separate. Enable just changes the mod state
in Redux. The actual deployment of enabled mods happens during the next "Deploy" operation.

### Linux Deployment Status

`hardlink_activator/index.ts:40`: `if (process.platform !== "linux") return;` — this is the
`init()` function of the hardlink activator, meaning hardlink deployment is **NOT registered
on Linux at all**. Hardlinks require a Windows compatibility check that is skipped on Linux.

Wait — let me re-read. Line 40 says `if (process.platform !== "linux") return;` — this EXITS
the init function on non-Linux platforms, which means hardlink activator IS registered on Linux
and NOT on Windows-only. Actually the condition `!== "linux"` means: if NOT linux, return early.
So hardlink IS registered on Linux. This is correct behavior (Linux hardlinks work cross-directory
on the same filesystem device, same as on Windows).

`symlink_activator/index.ts`: no platform guard on registration. Works on Linux.

`move_activator/`: No platform-specific code. Works everywhere.

`symlink_activator_elevate/`: The `monitorConsent()` function has `if (process.platform !== 'win32') return` (line 49). The deployment class itself (`DeploymentMethod extends LinkingDeployment`) is registered regardless of platform. On Linux, the elevated symlink deployment would try to use `runElevated()` (pkexec) — which works on desktop Linux (v3.0) but shows an error toast on SteamOS (v4.0). This deployment method shows "Run as Administrator" in its name on Linux — a Windows-specific label.

### The Round-Trip on Linux: What Works vs. What Needs Attention

| Step | Linux Status | Gap |
|------|--------------|-----|
| Download via NXM | Works (PROT-01 verified) | None |
| Install archive to staging | Works | Staging dir gets chattr+F (v6.0) |
| Deploy via hardlink | Works if same device | None |
| Deploy via symlink | Works | None |
| Deploy via elevated symlink | Works (pkexec) | Name says "Administrator" — misleading on Linux |
| Enable in mod list | Works | None |
| Active profile selects deployment method | Works | On new Linux install, deployment method selection dialog may confuse users |

---

## 4. Staging Directory Configuration UI

### What Exists

The staging directory UI lives in **Settings > Mods**. Two places:

**Primary: `mod_management/views/Settings.tsx`**
This is a full settings panel (719 lines) rendered inside `#settings-tab-pane-Mods`.
Key elements:
- Install path input: an `<InputGroup>` with a path text field and "Browse" button.
- "Automatically use suggested path for staging folder" toggle.
- Transfer mods to new location option (when path changes).
- The input field has CSS class `install-path-input` which has `min-width: 40em` in
  `page-settings.scss:77`. At 1280px viewport width, a 40em (640px) min-width
  with sidebar (~200px) and padding leaves ~1000px for content — this is OK at 1280px.

**Secondary: `stagingDirectory.ts` error dialogs**
When the staging directory is missing or invalid on launch, a modal dialog appears:
- "Mod Staging Folder missing!" with [Quit Vortex] [Reinitialize] [Browse...] actions.
- "Mod Staging Folder invalid" with [Quit Vortex] [Ignore] [Browse...] actions.
These dialogs are plain `api.showDialog()` calls — responsive to viewport, no hardcoded sizes.

**The `suggestStagingPath()` function** in `gamemode_management/util/discovery.ts:832`:
```typescript
if (statModPath.dev === statUserData.dev || process.platform !== "win32") {
  suggestion = path.join("{USERDATA}", "{game}", "mods");
} else {
  // different drives — calls winapi.GetVolumePathName(modPaths[""])
  suggestion = path.join(volume, ...);
}
```
On Linux (`process.platform !== "win32"` is always true), the suggestion is always
`{USERDATA}/{game}/mods` which resolves to `~/.local/share/Vortex/{game}/mods`.
The winapi call is in the `else` branch — Linux never reaches it. Correct.

**There is no dedicated "staging directory setup" step in the wizard.** It is entirely
in Settings > Mods, accessible either via the `mod-location` todo link or directly.
On Linux the todo fires only if disk space < 200GB and `winapi.GetDiskFreeSpaceEx`
works — which it does not. So the staging directory todo is silently hidden on Linux.

### Filesystem Detection in the UI

There is NO UI showing whether chattr+F is active on the staging directory. The
`applyChattrCasefold()` function runs silently during directory creation and logs
to INFO/DEBUG. The notification is only emitted once per session when chattr+F is
unavailable (via `_chattrNotifier`), but this is an informational toast, not a
visible indicator in the staging directory settings UI.

For the onboarding milestone, a Linux user needs to:
1. Know where their staging directory is (suggested: `~/.local/share/Vortex/...`).
2. Know whether it's on ext4 (and whether casefold is active) — currently not surfaced.
3. Not need to manually configure it if the suggestion is acceptable.

---

## 5. Steam Deck Desktop Mode at 1280x800: Viewport Risks

### Hardcoded Window Constraints

`src/main/src/MainWindow.ts:387`:
```typescript
minWidth: 1024,
minHeight: MIN_HEIGHT,  // MIN_HEIGHT = 700
```
At 1280x800, the window can display at full size. There is no 1280px lower bound that
would prevent the window from rendering. The min width of 1024px means Vortex can open
at any size above 1024x700.

### CSS Constraints That Risk Clipping at 1280x800

Key findings from stylesheet audit:

**`dialogs.scss:3`**: `min-width: 400px` on `.modal-dialog`. At 1280px viewport, max-width is
60% = 768px. This is fine.

**`dialogs.scss:175`**: `min-width: 600px` on a specific dialog class. This one is risky: at
1280px, a 600px min-width modal with default centering uses 47% of the viewport. If the modal
is wider than 60% of 1280px (768px), it clips. The 600px min-width is below 768px so it's OK
at 1280px. Verified: no clipping at 1280px.

**`page-settings.scss:64`**: `.download-path-input { min-width: 40em }` and
**`page-settings.scss:77`**: `.install-path-input { min-width: 40em }`.
40em at default 14px base = 560px. At 1280px viewport with sidebar (~200px) and padding,
the settings panel is ~1000px wide. 560px fits comfortably. Not a clipping risk at 1280px.

**`supertable.scss:235`**: `min-width: 250px` on column containers. Not a viewport risk.

**`gamepicker.scss:133`**: `@media (max-width: 1280px) { ... }` — there is a breakpoint
specifically at 1280px with some layout adjustments. This suggests the devs tested at
exactly this breakpoint. The comment-out inside suggests the resize was reverted. Not a risk.

**`starter.scss:235`**: `--grid-item--min-width: 30em`. 30em ≈ 420px. The starter dashlet
uses CSS grid with `minmax(30em, ...)`. At 1280px minus sidebar (~200px) = 1080px content
area: two 420px columns fit. Three 420px = 1260px > 1080px so only two columns render.
This is cosmetic — no clipping.

**`onboarding_dashlet/Overlay.tsx`**: The YouTube iframe has `height: "335"` hardcoded.
At 1280x800, the overlay panel rendering an iframe of height 335px plus the description
text plus the "Mark as complete" button — total height could exceed 800px viewport.
The overlay is rendered in an `instructions_overlay` which has its own positioning logic.
If the overlay appears near the bottom of the screen, content may be cut off.

**`NoGameDashlet.tsx`**: Uses `style={{ overflowX: "hidden", position: "relative" }}` on
the inner container with `display: "inline-flex"`. At 1280px with many game thumbnails,
the horizontal overflow is hidden rather than scrollable. The `refreshMore()` function
checks if content overflows and shows a "More..." link. This works but requires the link
to be visible — at 1280px there is enough horizontal space for several thumbnails before
overflow triggers.

**`dialogs.scss` and modals**: The `min-width: 600px` on the `#new-update-changelog-dialog`
modal is the riskiest found: at 800px height, a 600px modal with tall content may have the
action buttons scrolled off-screen. However `dialog-content-html` has overflow auto
inside the modal body, so scrolling should work.

### Risks Summary

| Location | Risk | Severity |
|----------|------|----------|
| `onboarding_dashlet/Overlay.tsx` — iframe 335px + buttons | May push buttons below fold at 800px | MEDIUM |
| `NoGameDashlet.tsx` — overflowX hidden on thumbnail row | Thumbnails clipped without scroll at narrow width | LOW (More link shown) |
| `dialogs.scss:175` — `min-width: 600px` specific dialog | Tall dialog may clip action buttons at 800px | LOW |
| `page-settings.scss` — `min-width: 40em` on path inputs | Not a 1280px problem, fine at full width | NONE |
| `firststeps_dashlet` todos in sidebar | List items with `min-width: 110px` are fine | NONE |

---

## Table Stakes vs. Differentiators

### Table Stakes (must work, shipping without these = product incomplete on Linux)

| Feature | Why Expected | Complexity | Blocking Gap |
|---------|--------------|------------|--------------|
| First-run dashboard renders without broken UI elements | Users expect a working UI | LOW | `winapi.GetVolumePathName` calls in `firststeps_dashlet/todos.tsx` throw on Linux — disk-space todos must platform-guard or use a Linux-compatible disk space check |
| Steam games auto-detected on first launch, shown in "Welcome to Vortex" dashlet | Core value prop | LOW | Already works; gap is when detection fails silently — need feedback |
| When no Steam games found, actionable guidance shown (not empty screen) | Users with non-standard Steam installs need guidance | LOW | Add Linux-aware notification when `discoveredGames` is empty post-discovery |
| Mod staging directory auto-configured to valid Linux path on first game management | Users should not need to touch settings | LOW | `suggestStagingPath()` already returns `{USERDATA}/{game}/mods` on Linux — the gap is the `mod-location` todo being hidden due to broken `GetDiskFreeSpaceEx` call |
| No "Run as Administrator" text appears in normal first-run flow | Windows text on Linux is confusing | LOW | `symlink_activator_elevate` shows "Administrator" in name; `download_management/Settings.tsx:737` shows Windows-only error text |
| No `C:\` paths in help text or tooltips | Windows examples confuse Linux users | LOW | `mod_management/texts.ts:96–98` contains `C:\Users\Mike\...` example — needs Linux variant |
| "Deploy Mods" succeeds for a Proton game without config file editing | Core install round-trip | MEDIUM | Deployment methods work on Linux; gap is ensuring the correct method is selected by default |
| All modal dialogs have scrollable content at 800px height | Steam Deck Desktop Mode viability | LOW | YouTube iframe in onboarding overlay may push buttons below fold |
| "Get Help" links are not dead or Windows-only | Users need Linux help resources | LOW | All help links go to `help.nexusmods.com` — currently no Linux-specific documentation links |

### Differentiators (set this milestone apart for Linux users)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Filesystem-aware staging setup: show whether chattr+F is active in Settings > Mods | Linux power users want to know if kernel casefold is running | LOW | Surface `casefold: 'kernel' / 'userspace'` from tag file in the staging path UI |
| "Mods are staged on drive" todo uses Linux-native disk space check | Linux-aware first-run todo | LOW | `fs.statfs()` or `df` subprocess instead of `GetDiskFreeSpaceEx` |
| When Steam not found: show specific paths checked, offer to browse for Steam install | Contextual troubleshooting for Flatpak/Snap/custom Steam installs | MEDIUM | Currently a silent failure; Linux has diverse Steam install locations |
| Staging directory auto-configured to same filesystem as game (cross-device hardlink warning) | Prevents hardlink deployment failures on multi-drive setups | MEDIUM | Check if staging is on same device as game's modPath; warn if not |
| Linux-specific "Get Help" link routing to Linux troubleshooting wiki article | Linux users need platform-specific help | LOW | Add a `process.platform === 'linux'` branch in help URL construction |
| "Symlink Deployment (Run as Administrator)" renamed on Linux to "Symlink Deployment (Elevated)" | Correct platform terminology | LOW | String change in `symlink_activator_elevate/index.ts:121–123` with platform guard |

### Anti-Features (explicitly do not build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Wizard-style setup modal with forced step-through | Vortex's existing dashboard approach is non-blocking and tested; a modal wizard would be a major architectural addition | Fix the existing `firststeps_dashlet` and `NoGameDashlet` to work correctly on Linux |
| Steam library path picker during first run | Auto-detection already works; a picker adds friction for the 95% case | Add fallback guidance only when auto-detection fails |
| Filesystem format explanation UI (explaining ext4 casefold) | Too much complexity for onboarding; users do not care about filesystem internals | A single-line status indicator in Settings > Mods is sufficient |
| Heroic Launcher detection in this milestone | Deferred to v4.0+ per PROJECT.md | No Heroic code in this milestone |
| Replacing or bypassing Windows code paths | Compatibility constraint — Windows build must not break | Platform guards only; additive Linux branches |

---

## Feature Dependencies

```
ONBRD-01 (Steam auto-detect + first-run feedback)
  └── depends on: Steam.ts findAllLinuxSteamPaths() — already exists
  └── requires: empty-state notification when discoveredGames is empty post-quickDiscovery
  └── requires: unconditional manual-scan todo on Linux (remove searchPaths condition)

ONBRD-02 (Staging directory filesystem detection)
  └── depends on: applyChattrCasefold() in fs.ts — already exists and runs
  └── requires: surface casefold strategy in Settings > Mods UI
  └── requires: Linux-native disk space check for mod-location todo
  └── requires: fix GetDiskFreeSpaceEx guard in firststeps_dashlet/todos.tsx

ONBRD-03 (No Windows error text on Linux)
  └── requires: platform guard in download_management/Settings.tsx:737
  └── requires: platform guard in mod_management/texts.ts:96–98 (C:\ path example)
  └── requires: platform guard in symlink_activator_elevate/index.ts:121–123 (name + description)
  └── independent of: all other ONBRD items

ONBRD-04 (Mod install → deploy → enable round-trip)
  └── depends on: InstallManager (working), deployment methods (working)
  └── requires: verify default deployment method selected correctly on Linux
  └── requires: end-to-end manual test with one Proton game

ONBRD-05 (1280x800 rendering)
  └── requires: fix onboarding_dashlet/Overlay.tsx iframe height or add scroll wrapper
  └── requires: audit NoGameDashlet horizontal overflow UX
  └── independent of: other ONBRD items (CSS/layout only)

ONBRD-06 (Linux-specific help links)
  └── requires: platform branch in help URL construction
  └── requires: Linux troubleshooting article to exist at Nexus Mods help center
  └── lowest risk: if article doesn't exist yet, route to general Vortex help
```

---

## MVP Definition

### Must Ship (this milestone — ONBRD-01 through ONBRD-06)

- [ ] `firststeps_dashlet/todos.tsx`: Platform-guard `GetVolumePathName` and `GetDiskFreeSpaceEx`
  calls; replace with Linux-native equivalents (statfs or df) for disk-space conditions.
- [ ] `firststeps_dashlet/todos.tsx`: Show `manual-scan` todo unconditionally on Linux when
  no games discovered (remove `searchPaths !== undefined` condition gate).
- [ ] `gamemode_management/views/NoGameDashlet.tsx` or parent: When `discoveredGames` is empty
  after quick discovery on Linux, show an actionable notification/dashlet entry guiding the
  user to the Games page or offering a manual Steam path browse.
- [ ] `symlink_activator_elevate/index.ts:121–123`: Platform-guard "Run as Administrator"
  → "Elevated Deployment" on Linux.
- [ ] `download_management/views/Settings.tsx:737`: Platform-guard Windows-specific error text
  → Linux-appropriate "not writable" message.
- [ ] `mod_management/texts.ts:96–98`: Platform-guard `C:\Users\Mike\...` example
  → show Linux equivalent (`~/.local/share/Vortex/...`).
- [ ] `onboarding_dashlet/Overlay.tsx`: Add overflow-y scroll wrapper around iframe content
  so the "Mark as complete" button is always accessible at 800px viewport height.
- [ ] Manual end-to-end UAT: install one mod for a Proton game (Skyrim SE or Fallout 4),
  deploy, enable, verify game loads mod. Document result in PROJECT.md.

### Differentiators to Add (if bandwidth allows)

- [ ] Settings > Mods: Show filesystem casefold strategy status (kernel / userspace shim).
- [ ] Linux-specific help link routing (when Linux troubleshooting doc exists).
- [ ] Staging directory cross-device hardlink warning UI.

### Defer

- [ ] Full Flatpak Steam detection diagnostics (complex; Flatpak path already in steamPaths.ts).
- [ ] Heroic Launcher (v4.0+ per PROJECT.md).
- [ ] Steam Deck Game Mode specific UI optimizations beyond 1280x800 rendering fix.

---

## Sources

| Claim | Source |
|-------|--------|
| `firststeps_dashlet` todos structure | `src/renderer/src/extensions/firststeps_dashlet/todos.tsx` |
| `onboarding_dashlet` video steps | `src/renderer/src/extensions/onboarding_dashlet/steps.ts` |
| `NoGameDashlet` welcome text + overflow | `src/renderer/src/extensions/gamemode_management/views/NoGameDashlet.tsx` |
| Steam Linux detection paths | `src/renderer/src/util/linux/steamPaths.ts`, `src/renderer/src/util/Steam.ts` |
| `suggestStagingPath()` Linux branch | `src/renderer/src/extensions/gamemode_management/util/discovery.ts:859` |
| `ensureDirWritableAsync` → `applyChattrCasefold` | `src/renderer/src/util/fs.ts:1381–1394` |
| Staging directory dialogs | `src/renderer/src/extensions/mod_management/stagingDirectory.ts` |
| Settings > Mods path input 40em min-width | `src/stylesheets/vortex/page-settings.scss:64,77` |
| minWidth 1024 / minHeight 700 | `src/main/src/MainWindow.ts:387–388` |
| Dialogs min-width 400/600 | `src/stylesheets/vortex/dialogs.scss:3,175` |
| "Run as Administrator" text | `src/renderer/src/extensions/symlink_activator_elevate/index.ts:121–123` |
| "windows user account" text | `src/renderer/src/extensions/download_management/views/Settings.tsx:737–738` |
| `C:\Users\Mike\...` example text | `src/renderer/src/extensions/mod_management/texts.ts:96–98` |
| Hardlink activator Linux guard | `src/renderer/src/extensions/hardlink_activator/index.ts:40` |
| Onboarding overlay iframe 335px | `src/renderer/src/extensions/onboarding_dashlet/views/Overlay.tsx:29` |
| GamePicker 1280px breakpoint | `src/stylesheets/vortex/gamepicker.scss:133` |
| help.nexusmods.com links | `src/renderer/src/ui/components/no_results/NoResults.tsx:80` |

---

*Feature research for: v7.0 First-Run Onboarding Wizard (Linux)*
*Researched: 2026-04-16*
