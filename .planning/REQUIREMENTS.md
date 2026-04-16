# Requirements: Vortex Linux — v7.0 First-Run Onboarding Wizard

**Defined:** 2026-04-16
**Core Value:** A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.

## v7.0 Requirements

### First-Run Dashboard (ONBRD-01)

- [x] **ONBRD-01a**: `firststeps_dashlet` todo list renders without crashing on a fresh Linux install (fix `todos.tsx` undefined `instPath`/`dlPath` crash before `GetVolumePathName`)
- [x] **ONBRD-01b**: `getDriveList.ts` returns Linux mount points on error fallback (not hardcoded `"C:"`)
- [x] **ONBRD-01c**: `manual-scan` todo is visible unconditionally on Linux (not gated on `searchPaths !== undefined`)
- [x] **ONBRD-01d**: When no Steam games are detected after initial discovery, an actionable "Refresh" or guidance message is shown (not a blank screen)
- [x] **ONBRD-01e**: Steam detection retries once with a short delay if initial `allGames()` result is empty on Linux (handles Steam still loading at Vortex launch)

### Staging Directory Setup (ONBRD-02)

- [x] **ONBRD-02a**: `mod-location` and `download-location` todos are visible on Linux (`GetDiskFreeSpaceEx` replaced with `fs.statfs()` for disk-space display)
- [x] **ONBRD-02b**: `stagingDirectory.ts` partition-exists check uses Linux-native `statAsync` (not Windows-only error code `systemCode === 2`) so the correct dialog fires when staging folder is missing
- [x] **ONBRD-02c**: Windows path examples (`C:\Users\Mike\...`) in `mod_management/texts.ts` and `Settings.tsx` are replaced with Linux-appropriate paths under a platform guard
- [x] **ONBRD-02d**: `suggestStagingPath()` uses device-aware logic on Linux — suggests a staging path on the same device as the game install (via `statSync.dev` comparison) to avoid guaranteed hardlink-deployment failure for multi-drive setups

### Windows String Purge (ONBRD-03)

- [x] **ONBRD-03a**: `fs.ts` `raiseUACDialog` shows pkexec-specific message on Linux (platform-guarded alongside unchanged Windows UAC text)
- [x] **ONBRD-03b**: `download_management/views/Settings.tsx:737` "windows user account" error text is platform-guarded; Linux arm shows a meaningful alternative
- [x] **ONBRD-03c**: `nativeErrors.ts` `decodeSystemError` has a Linux arm for EPERM/EACCES that produces actionable Linux-specific messages (not fallthrough to "Run as Administrator")
- [x] **ONBRD-03d**: No `"Run as Administrator"` string is visible to a Linux user in any reachable error path during first run

### Mod Install Round-Trip (ONBRD-04)

- [ ] **ONBRD-04**: User can install a mod, deploy it, and enable it for one Proton game — end-to-end, no config file edits required (human UAT; gates on ONBRD-01 + ONBRD-02)

### Steam Deck Layout (ONBRD-05)

- [ ] **ONBRD-05a**: Onboarding overlay (`Dashlet.tsx`) position is clamped to viewport so the overlay does not clip below 800px height
- [ ] **ONBRD-05b**: Bootstrap 3 modals in the onboarding flow have `max-height: calc(100vh - 160px)` and `flex-shrink: 0` on the footer so action buttons are accessible at 800px viewport height

### Help Links (ONBRD-06)

- [ ] **ONBRD-06a**: `extensions/documentation/src/index.tsx` `WIKI_TOPICS` includes Linux-specific entries; `open-knowledge-base` handler uses Linux URL branch on Linux
- [ ] **ONBRD-06b**: `opn()` failure on SteamOS (no browser set) shows the target URL inline rather than silently failing

## v2 Requirements

### Deferred from v7.0

- **ONBRD-UAT-ELEV**: Full elevation E2E UAT on desktop Linux (ELEV-05) — pending real hardware
- **ONBRD-UAT-DECK**: Steam Deck Game Mode failure toast UX (ELEV-06) — pending hardware access
- **PROT-01-UAT**: NXM download live runtime test on AppImage/deb — pending hardware
- **PROT-03**: NXM handler via Steam Browser overlay on Steam Deck — requires Valve + Nexus Mods coordination

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gaming Mode (Steam Deck) full-screen UI | Desktop Mode is the target for v7.0; Gaming Mode is a Phase 6 item |
| Heroic / GOG / itch.io game detection | Separate track, deferred to Phase 7+ per VORTEX-LINUX.md |
| Flatpak distribution | AppImage is the v7.0 distribution target; Flatpak has polkit sandbox constraints |
| Auto-updater on SteamOS immutable fs (DIST-05) | Complex; deferred |
| Full i18n / non-English locale support | String changes are English-only platform guards; full locale work is out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONBRD-01a | Phase 18 | Complete |
| ONBRD-01b | Phase 18 | Complete |
| ONBRD-01c | Phase 18 | Complete |
| ONBRD-01d | Phase 18 | Complete |
| ONBRD-01e | Phase 18 | Complete |
| ONBRD-02a | Phase 19 | Complete |
| ONBRD-02b | Phase 19 | Complete |
| ONBRD-02c | Phase 19 | Complete |
| ONBRD-02d | Phase 19 | Complete |
| ONBRD-03a | Phase 20 | Complete |
| ONBRD-03b | Phase 20 | Complete |
| ONBRD-03c | Phase 20 | Complete |
| ONBRD-03d | Phase 20 | Complete |
| ONBRD-04 | Phase 21 | Pending |
| ONBRD-05a | Phase 22 | Pending |
| ONBRD-05b | Phase 22 | Pending |
| ONBRD-06a | Phase 23 | Pending |
| ONBRD-06b | Phase 23 | Pending |

**Coverage:**
- v7.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
