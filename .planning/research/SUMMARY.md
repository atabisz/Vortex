# Research Summary — v7.0 First-Run Onboarding Wizard

**Project:** Vortex Linux — v7.0 First-Run Onboarding Wizard
**Domain:** Electron mod manager — Linux-native first-run onboarding wiring
**Researched:** 2026-04-16
**Confidence:** HIGH — all findings from direct codebase inspection

---

## Executive Summary

The v7.0 milestone is not a greenfield wizard. Vortex has no traditional step-through
first-run modal; its "wizard" is a dashboard composed of `firststeps_dashlet` (todo list)
and `onboarding_dashlet` (tutorial video cards). The underlying Linux infrastructure —
Steam detection, chattr+F casefold, pkexec elevation, FOMOD pipeline, NXM download — is
fully shipped from v1.0–v6.0. ONBRD-01 through ONBRD-06 are wiring, string-cleanup, and
layout fixes on top of that foundation, not new subsystems.

The recommended approach is surgical: platform-guard Windows-specific strings without
editing existing i18n literals, fix the two known crash paths in `firststeps_dashlet` and
`stagingDirectory.ts`, and audit dialogs at 1280×800. No new runtime dependencies are
needed. All changes are additive Linux branches alongside unchanged Windows paths. The
diff against upstream should remain minimal.

The primary risk is accidentally changing existing i18n string literals, which silently
breaks Windows wording and stales non-English locale caches. Every string change must be
a new conditional branch, never an edit to an existing `t("...")` literal. Secondary risk
is the `stagingDirectory.ts` partition-exists check, which uses a Windows-only error code
and produces the wrong dialog branch on Linux when the staging folder is missing.

---

## 1. Stack Additions

### Already Wired — No Changes Needed

| Subsystem | Status | Entry Point |
|-----------|--------|-------------|
| Steam library detection | Shipped v2.0 | `util/Steam.ts` → `findAllLinuxSteamPaths()` |
| chattr+F at staging dir creation | Shipped v6.0 | `util/fs.ts` `ensureDirWritableAsync()` → `applyChattrCasefold()` |
| pkexec elevation | Shipped v3.0 | `util/elevated.ts` `runElevated()` |
| winapi-bindings shim | Shipped v1.0 | webpack alias → `util/winapi-shim.ts` |
| FOMOD IPC pipeline | Shipped v5.0 | TCP transport + `TextUtil.NormalizePath` |
| NXM download handler | Shipped v2.0 | `extensions/download_management/` + xdg-utils |
| Hardlink + symlink deployers | Existing | `hardlink_activator/`, `symlink_activator/` |

### New in v7.0 — The Actual Changes

No new dependencies. All v7.0 work is edits to existing files:

| Change | File(s) | ONBRD# |
|--------|---------|--------|
| Fix `getDriveList.ts` — hardcoded `"C:"` fallback on lines 23/44 → `"/"` on Linux | `gamemode_management/util/getDriveList.ts` | 01 |
| Fix `todos.tsx` — wrap `GetVolumePathName` value functions with undefined guard | `firststeps_dashlet/todos.tsx` | 01 |
| Add Steam cache retry on empty result (2s delay, `reloadGames()`) | `firststeps_dashlet` game-detection step | 01 |
| Show actionable guidance when no games found post-discovery | `gamemode_management/views/NoGameDashlet.tsx` | 01 |
| Fix `stagingDirectory.ts` partition-exists check — use Linux `statAsync` not Windows error code | `mod_management/stagingDirectory.ts` | 02 |
| Fix `mod-location` todo visibility — broken `GetDiskFreeSpaceEx` condition hides it on Linux | `firststeps_dashlet/todos.tsx` | 02 |
| Platform-conditional path examples in help text | `mod_management/texts.ts`, `mod_management/views/Settings.tsx` | 02 |
| Platform guard in `raiseUACDialog` — Linux message references pkexec, not UAC | `util/fs.ts` | 03 |
| Platform guard in `download_management/views/Settings.tsx:737` — Windows-only error text | `download_management/views/Settings.tsx` | 03 |
| Platform guard in `activationStore.ts:313` — "Windows user account" message | `mod_management/util/activationStore.ts` | 03 |
| Platform guard in `symlink_activator_elevate` name/description (if visible on Linux) | `symlink_activator_elevate/index.ts`, `Settings.tsx` | 03 |
| Add Linux arm to `nativeErrors.ts` `decodeSystemError` for EPERM/EACCES | `util/nativeErrors.ts` | 03 |
| Clamp onboarding overlay position to viewport bottom | `onboarding_dashlet/Dashlet.tsx` | 05 |
| Add `max-height: calc(100vh - 160px)` + `flex-shrink: 0` on modal footer | `stylesheets/vortex/dialogs.scss` | 05 |
| Add Linux entries to `WIKI_TOPICS`; platform branch in handler; `opn()` fallback | `extensions/documentation/src/index.tsx` | 06 |

---

## 2. Feature Table Stakes

What must work for ONBRD-01 through ONBRD-06 to be satisfied:

### ONBRD-01 — First-run wizard completes, Steam auto-detected

- `firststeps_dashlet` todo list renders without crashing on a fresh Linux install
  (currently crashes when `instPath`/`dlPath` are undefined — `GetVolumePathName` throws)
- `pick-game` todo navigates to Games page where discovered Steam games appear
- `getDriveList.ts` returns Linux mount points (not `"C:"`), so game search paths populate
- When no Steam games found after quick discovery, an actionable notification or guidance
  appears — not a blank screen
- `manual-scan` todo is visible unconditionally on Linux (currently hidden because
  `searchPaths !== undefined` condition is never true on a fresh install)
- Steam detection retries once with a 2-second delay if initial result is empty, to handle
  the case where Steam hasn't finished writing VDF/ACF files at Vortex launch

### ONBRD-02 — Staging directory configured with filesystem detection

- `mod-location` todo in `firststeps_dashlet` is visible on Linux (currently always hidden
  because `GetDiskFreeSpaceEx` in the condition silently returns false on any error)
- Staging directory suggestion resolves to `~/.local/share/Vortex/{game}/mods` (already
  works via `suggestStagingPath()` Linux branch — no change needed)
- `stagingDirectory.ts` shows the correct dialog when staging folder is missing on Linux
  (currently the partition-exists check uses Windows error code and takes the wrong branch)
- chattr+F fires automatically on directory creation — already wired via v6.0; no change needed

### ONBRD-03 — No Windows-specific error text on Linux

- Zero `"Run as Administrator"` strings in any path a Linux user can reach during first run
- Zero `"C:\"` or `"C:\\Users"` example paths in visible help text or tooltips
- Zero `"Windows will show an UAC dialog"` text in any permission-error dialog
- Zero `"windows user account"` text in any permission-error dialog
- EPERM/EACCES on Linux produces an actionable Linux-specific message, not a fallthrough
  to Windows-centric "Run as Administrator" text from `decodeSystemError`

### ONBRD-04 — Mod install → deploy → enable round-trip

- A Proton game is detected and selectable (ONBRD-01 must be satisfied first)
- Installing one mod archive completes without error (staging dir must exist — ONBRD-02)
- "Deploy Mods" completes with hardlink or symlink deployment for a game on the same device
  as staging
- The mod shows as enabled in the mod list and the game can be launched through Vortex
- No cryptic `NoDeployment` error appears immediately after wizard completion (staging
  initialization race condition guard)

### ONBRD-05 — All dialogs render correctly at 1280×800

- The onboarding overlay (600px wide, 466px tall) does not clip below the viewport bottom
  at 800px height — position clamping needed in `Dashlet.tsx`
- The "Mark as complete" button in the YouTube overlay is always accessible without
  requiring the user to discover a hidden scrollbar
- No Bootstrap 3 modal has its action buttons clipped off-screen at 800px viewport height
  (fix: `max-height: calc(100vh - 160px)` on wizard modal; `flex-shrink: 0` on footer)

### ONBRD-06 — "Get Help" links route to Linux documentation

- Clicking "Help centre" on Linux opens a Linux-appropriate URL, not the generic Windows wiki
- If the Linux doc page does not yet exist, the fallback is the Vortex wiki root (acceptable)
  rather than a dead link or Windows-only article
- `opn()` failure on SteamOS (no default browser set) shows the URL as inline dialog text,
  not a silent no-op

---

## 3. Watch Out For

### Pitfall 1 — Editing i18n string literals breaks Windows wording (CRITICAL)

The codebase uses inline string literals as i18next keys. Editing an existing
`t("Windows will show an UAC dialog.")` changes the Windows UI permanently and stales
non-English locale caches. Every string change must be a new conditional branch alongside
the unchanged existing string:

```typescript
// CORRECT: add new string alongside the old one
const msg = process.platform === 'linux'
  ? t("pkexec will request your password.")
  : t("Windows will show a UAC dialog.");

// WRONG: edits existing key, breaks Windows and non-English locales
t("pkexec will request your password.")
```

Never edit an existing `t("...")` literal. Add new ones alongside.

### Pitfall 2 — `firststeps_dashlet/todos.tsx` crashes on undefined path (CRITICAL)

On a fresh Linux install, `instPath`/`dlPath` in Redux state are `undefined`. The `value`
function for `download-location` and `mod-location` todos calls
`winapi.GetVolumePathName(props.instPath)` without guarding for `undefined`. The shim's
mount-point walk throws, the React error boundary catches it, and the entire dashboard goes
blank — the user has no onboarding guidance and cannot proceed.

Fix: add `if (props.instPath === undefined) return t("<No staging folder>");` before the
`GetVolumePathName` call in both todo `value` functions.

### Pitfall 3 — `stagingDirectory.ts` partition check uses Windows-only error code (HIGH)

`ensureStagingDirectoryImpl` checks `isErrorWithSystemCode(err) && err.systemCode === 2`
to detect a missing partition. The Linux shim throws a plain JS Error without `systemCode`,
so `partitionExists` stays `true`, and the wrong dialog branch fires when the staging folder
is missing on Linux (user sees "removable drive" language rather than "create directory").
This call path fires on every game activation, not just first run.

Fix: platform-guard the partition-exists check; use
`fs.statAsync(path.parse(instPath).root)` on Linux.

### Pitfall 4 — Steam `mCache` singleton returns empty if Steam still loading at Vortex start (HIGH)

`Steam.ts` populates `mCache` once at first `allGames()` call. If Vortex launches before
Steam finishes writing its VDF/ACF files (common on first boot), the cache is populated
with zero games and never refreshed without a restart.

Fix: if `allGames()` returns empty on Linux, automatically retry once after a 2-second delay
using the existing `steam.reloadGames()` method. Add a visible "Refresh" button in the
game-detection view.

### Pitfall 5 — Bootstrap 3 modal has no `max-height`; buttons clip at 800px (HIGH)

`.common-dialog-wide` sets `height: 80%` = 640px at 800px viewport. After subtracting OS
taskbar, window chrome, and Vortex toolbar (~160px total), the usable content area is ~640px.
A modal at 80% viewport height with `overflow: hidden` on `.layout-flex` clips action
buttons below the fold with no discoverable scroll.

Fix:
```scss
.modal-dialog { max-height: calc(100vh - 160px); display: flex; flex-direction: column; }
.modal-content { height: 100%; overflow-y: auto; }
.modal-footer  { flex-shrink: 0; }
```

Test every wizard-adjacent dialog at exactly 800px browser height before shipping.

---

## 4. Phase Ordering Recommendation

ONBRD-04 depends on both ONBRD-01 (need a detected game) and ONBRD-02 (need a staging
dir). Everything else is independent and can be parallelized.

```
ONBRD-01 (Steam/game detection) ──┐
                                   ├─→ ONBRD-04 (mod install round-trip)
ONBRD-02 (staging dir setup)   ──┘

ONBRD-03 (Windows string purge)  — independent
ONBRD-05 (1280×800 layout)       — independent
ONBRD-06 (help links)            — independent, lowest risk, lowest urgency
```

### Phase A — First-Run Dashboard Foundation (ONBRD-01)

Fix the two crash paths that prevent the dashboard from rendering on a fresh Linux install:
the `todos.tsx` undefined-path crash and the `getDriveList.ts` `"C:"` fallback. Add the
Steam cache retry and the unconditional `manual-scan` todo on Linux. After this phase a
Linux user can launch Vortex and see a working todo list that guides them to pick a game.

Files: `getDriveList.ts`, `firststeps_dashlet/todos.tsx`, `NoGameDashlet.tsx`.

Needs research: NO — exact file locations and fix patterns are specified.

### Phase B — Staging Directory Wiring (ONBRD-02)

Fix `stagingDirectory.ts` partition check, fix the `mod-location` todo visibility (broken
`GetDiskFreeSpaceEx` condition), and fix Windows path examples in `texts.ts` and
`Settings.tsx`. The chattr+F machinery already runs silently — this phase ensures the user
can see and configure the staging path through the todo list without seeing Windows text.

Files: `stagingDirectory.ts`, `texts.ts`, `mod_management/views/Settings.tsx`.

Needs research: NO — exact line numbers and fix patterns are specified.

### Phase C — Windows String Purge (ONBRD-03)

Platform-guard all remaining Windows-specific error strings. Add Linux arm to
`nativeErrors.ts` so EPERM/EACCES produce actionable Linux messages instead of falling
through to "Run as Administrator" text. Verify whether `symlink_activator_elevate` is
visible on Linux before committing scope for that file.

Files: `fs.ts`, `download_management/views/Settings.tsx`, `activationStore.ts`,
`nativeErrors.ts`, and conditionally `symlink_activator_elevate/index.ts` and `Settings.tsx`.

Needs research: One runtime/source check — verify whether `tasksSupported()` returns false
on Linux (determines if `symlink_activator_elevate` is in scope for string changes).

### Phase D — Layout at 1280×800 (ONBRD-05)

Apply modal fix (`max-height` + sticky footer). Clamp onboarding overlay position in
`Dashlet.tsx`. Run Vortex at exactly 1280×800 and audit every dialog reachable in the
first-run flow. This phase is independent and can run in parallel with Phase C.

Files: `stylesheets/vortex/dialogs.scss`, `onboarding_dashlet/Dashlet.tsx`.

Needs research: Live visual inspection at 800px height to confirm which dialogs clip —
static code analysis alone is insufficient.

### Phase E — Help Links (ONBRD-06)

Add Linux entries to `WIKI_TOPICS`. Add `opn()` rejection handler that shows URL inline
as fallback for SteamOS no-browser case. Should be last — it requires Linux documentation
pages to exist at target URLs, or a redirect URL to be set up first.

Files: `extensions/documentation/src/index.tsx`.

Needs research: Confirm target URL exists or create a stable redirect before implementation.

### Phase F — Mod Install Round-Trip Validation (ONBRD-04)

No new code. End-to-end UAT: install one mod for a Proton game, deploy, enable, verify
game loads mod. Requires Phases A and B to be complete. Document result in PROJECT.md.

Needs research: NO (for code). Requires human tester with Steam + Proton game installed.

---

## 5. Key Open Questions

Blockers and decisions needed before or during execution:

**Q1: Does `symlink_activator_elevate.isSupported()` return false/unsupported on Linux?**
If yes, the "Run as Administrator" name is never shown and no string change is needed
for that file. If no, a platform-conditional name must be added. Verify by tracing
`tasksSupported()` return value before committing Phase C scope for that extension.
Impact: determines whether 2-3 files are in scope for ONBRD-03.
Source: ARCHITECTURE.md "symlink_activator_elevate on Linux — MEDIUM confidence"

**Q2: Does a Linux-specific Vortex help article exist at Nexus Mods (or fork wiki)?**
ONBRD-06 requires help links to point somewhere useful. If no Linux article exists yet,
the implementation should use a stable redirect URL the maintainer controls
(`github.com/atabisz/Vortex/wiki/linux-setup`), not a direct article URL that may 404.
Ship the redirect first; update the article later.
Impact: must be confirmed before Phase E can ship.
Source: STACK.md "Help URL Infrastructure" + PITFALLS.md Pitfall 9

**Q3: Is the `mod-location`/`download-location` disk-space fix (replace `GetDiskFreeSpaceEx`
with `fs.statfs()`) in scope for v7.0?**
The todo items are currently always hidden on Linux because the shim's `GetDiskFreeSpaceEx`
silently returns false. Replacing the condition with native `statfs().bavail * bsize` is a
one-function change and would make disk-space todos functional. It is listed as a
differentiator in FEATURES.md but not a table-stakes requirement.
Impact: decides whether Phase B includes this change or defers it.
Source: FEATURES.md "Differentiators" + PITFALLS.md Pitfall 15

**Q4: Should staging-path suggestion use device-aware logic on Linux for multi-drive setups?**
`suggestStagingPath()` always returns `{USERDATA}/{game}/mods` on Linux, even when the
game is on an external drive. This guarantees hardlink deployment fails for external-drive
Steam libraries. PITFALLS.md Pitfall 6 has the fix (`statSync.dev` comparison). Low cost,
meaningful benefit for multi-drive users. Decide: Phase B or deferred.
Impact: scope of Phase B.
Source: PITFALLS.md Pitfall 6

**Q5: Is ONBRD-04 a human UAT gate or a CI-testable integration test?**
The mod install → deploy → enable round-trip requires a real Proton game install. The
existing UAT backlog (ELEV-05, PROT-01) is already pending hardware testing. Decide
whether Phase F is a code phase, a sign-off gate, or both.
Impact: determines whether Phase F appears on the execution roadmap or the UAT backlog.
Source: PROJECT.md "Human UAT pending" items

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new deps confirmed; all 6 ONBRD items mapped to existing files with exact line numbers |
| Features | HIGH | All table-stakes gaps identified with exact file + line numbers from live source |
| Architecture | HIGH | Extension hooks, Redux state paths, and ONBRD dependency graph confirmed from source |
| Pitfalls | HIGH | 14 pitfalls grounded in codebase audit; 2 MEDIUM items noted (symlink_activator_elevate runtime behavior; dialog clip locations need live test at 800px) |

**Overall confidence:** HIGH

### Gaps to Address During Planning

- **`symlink_activator_elevate` on Linux runtime behavior (MEDIUM)** — needs a quick
  source trace of `tasksSupported()` to confirm whether the deployment method appears in
  the UI on Linux. Resolves Q1 above; determines Phase C scope.

- **Dialog clip locations at 1280×800** — ARCHITECTURE.md and FEATURES.md identify likely
  risk areas but actual clipping must be confirmed by running Vortex at 800px height. Cannot
  be fully scoped from static code analysis alone. Phase D must include a visual inspection
  step before writing SCSS changes.

- **Linux help article URL** — must be confirmed or a redirect URL created before Phase E
  can be finalized. If deferred until an article exists, Phase E can ship with a GitHub wiki
  fallback in the interim.

---

## Sources

All findings from direct codebase inspection at `/home/alex/src/Vortex/` on 2026-04-16.
No external documentation consulted — confidence derives from reading live source files.

Detailed findings with exact file paths and line numbers in:
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`

---

*Research completed: 2026-04-16*
*Ready for roadmap: yes*
