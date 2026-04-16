# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Elevation Hardening + Save Transfer** — Phases 11–14 (shipped 2026-04-07) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 fomod-installer Linux Fixes** — Phase 15 (shipped 2026-04-09) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Infrastructure** — Phases 16–17 (shipped 2026-04-15) — [archive](milestones/v6.0-ROADMAP.md)
- 🚧 **v7.0 First-Run Onboarding Wizard** — Phases 18–23 (in progress)

## Phases

<details>
<summary>✅ v1.0 Linux Port Phase 1 (Phases 1–5) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Runtime Environment (1/1 plans) — completed 2026-03-30
- [x] Phase 2: winapi-bindings Shim (2/2 plans) — completed 2026-03-30
- [x] Phase 3: Native Addon Compilation (3/3 plans) — completed 2026-03-30
- [x] Phase 4: FOMOD Installer Integration (2/2 plans) — completed 2026-03-31
- [x] Phase 5: IPC and Elevation Audit (2/2 plans) — completed 2026-03-31

</details>

<details>
<summary>✅ v2.0 Usable on Linux (Phases 6–8) — SHIPPED 2026-04-01</summary>

- [x] Phase 6: Steam/Proton Detection (3/3 plans) — completed 2026-04-01
- [x] Phase 7: Linux Packaging (2/2 plans) — completed 2026-04-01
- [x] Phase 8: NXM Protocol Handler (2/2 plans) — completed 2026-04-01

</details>

<details>
<summary>✅ v3.0 Save Games + Elevation (Phases 9–10) — SHIPPED 2026-04-01</summary>

- [x] Phase 9: Native Addon Fix + Elevation Foundation (2/2 plans) — completed 2026-04-01
- [x] Phase 10: Save UI Validation + SteamOS + Polkit (2/2 plans) — completed 2026-04-01

</details>

<details>
<summary>✅ v4.0 Elevation Hardening + Save Transfer (Phases 11–14) — SHIPPED 2026-04-07</summary>

- [x] Phase 11: Persistent Elevation Token (1/1 plans) — completed 2026-04-07
- [x] Phase 12: Elevation End-to-End Validation + Steam Deck Error UX (1/1 plans) — completed 2026-04-07
- [x] Phase 13: Save Transfer (1/1 plans) — completed 2026-04-07
- [x] Phase 14: Linux Case-Folding fs Wrapper (2/2 plans) — completed 2026-04-07

</details>

<details>
<summary>✅ v5.0 fomod-installer Linux Fixes (Phase 15) — SHIPPED 2026-04-09</summary>

- [x] Phase 15: fomod-installer Linux Fixes + Vortex Cleanup (3/3 plans) — completed 2026-04-09

</details>

<details>
<summary>✅ v6.0 Infrastructure (Phases 16–17) — SHIPPED 2026-04-15</summary>

- [x] Phase 16: chattr+F Filesystem Layer (1/1 plans) — completed 2026-04-15
- [x] Phase 17: Upstream Rebase CI Workflow (1/1 plans) — completed 2026-04-15

</details>

### v7.0 First-Run Onboarding Wizard (Phases 18–23)

- [x] **Phase 18: First-Run Dashboard Foundation** - Fix crash paths and Steam detection gaps so the dashlet renders cleanly on a fresh Linux install
- [x] **Phase 19: Staging Directory Wiring** - Wire Linux-native disk space checks, partition detection, and path suggestions into the staging directory setup flow (completed 2026-04-16)
- [x] **Phase 20: Windows String Purge** - Replace every Windows-specific error string visible during first run with a Linux-appropriate alternative (completed 2026-04-16)
- [ ] **Phase 21: Mod Install Round-Trip Validation** - Human UAT: install, deploy, and enable a mod for one Proton game without any terminal interaction (gates on Phases 18 + 19)
- [ ] **Phase 22: Steam Deck Layout** - Clamp onboarding overlay and modals so all buttons and content are accessible at 800px viewport height
- [ ] **Phase 23: Help Links** - Route Linux users to Linux-specific help content and show URLs inline when the browser launcher fails

## Phase Details

### Phase 18: First-Run Dashboard Foundation
**Goal**: The first-run dashboard renders without crashing and guides a fresh Linux user to their detected Steam games
**Depends on**: Phase 16 (chattr+F layer), Phase 17 (CI baseline)
**Requirements**: ONBRD-01a, ONBRD-01b, ONBRD-01c, ONBRD-01d, ONBRD-01e
**Success Criteria** (what must be TRUE):
  1. User opens Vortex on a fresh Linux install and the first-steps dashlet renders without crashing (no undefined `instPath`/`dlPath` error)
  2. User sees Linux mount points (not `C:`) in the game-search drive list, so game discovery populates valid paths
  3. User sees the manual-scan todo unconditionally on Linux, not hidden behind an undefined searchPaths guard
  4. User who has no Steam games detected after discovery sees an actionable "Refresh" or guidance message instead of a blank screen
  5. User who launches Vortex before Steam finishes loading sees their games appear after an automatic retry, without needing to restart Vortex
**Plans**: 2 plans
Plans:
- [x] 18-01-PLAN.md — Platform guards for todos.tsx crash paths and getDriveList Linux fallback
- [ ] 18-02-PLAN.md — NoGameDashlet empty-state guidance and one-shot Steam detection retry
**UI hint**: yes

### Phase 19: Staging Directory Wiring
**Goal**: Staging directory setup correctly detects missing dirs, shows Linux-appropriate path examples, and suggests a same-device path to avoid hardlink deployment failure
**Depends on**: Phase 18
**Requirements**: ONBRD-02a, ONBRD-02b, ONBRD-02c, ONBRD-02d
**Success Criteria** (what must be TRUE):
  1. User sees mod-location and download-location todos in the dashlet on Linux (disk-space display no longer blocked by the Windows-only `GetDiskFreeSpaceEx` call)
  2. User who configures a staging directory on a filesystem where the folder does not exist gets the correct "missing directory" dialog, not a silent mismatch from the Windows-only error code fallback
  3. User reading staging directory help text sees Linux path examples (e.g. `/home/user/mods`) instead of Windows paths (`C:\Users\Mike\...`)
  4. User on a multi-drive Linux setup receives a staging path suggestion on the same device as their game install, preventing guaranteed hardlink-deployment failure
**Plans**: 3 plans
Plans:
- [x] 19-00-PLAN.md — Wave 0 test stubs for stagingDirectory, texts, and discovery (Nyquist compliance)
- [x] 19-01-PLAN.md — Todos visibility flip, partition-exists statAsync walk, Linux path example strings
- [x] 19-02-PLAN.md — Device-aware suggestStagingPath and Settings.tsx suggestPath Linux guard

### Phase 20: Windows String Purge
**Goal**: No Windows-specific error string (UAC prompts, "Run as Administrator", Windows path examples) is shown to a Linux user in any reachable error path during first run
**Depends on**: Phase 18
**Requirements**: ONBRD-03a, ONBRD-03b, ONBRD-03c, ONBRD-03d
**Success Criteria** (what must be TRUE):
  1. User who triggers a UAC-level file operation on Linux sees a pkexec-specific prompt message, not a Windows UAC dialog description
  2. User who encounters the download-settings Windows user account error on Linux sees a meaningful Linux-specific alternative message
  3. User who hits EPERM or EACCES on Linux sees an actionable Linux-specific message (e.g. "check file permissions with chmod") instead of "Run as Administrator"
  4. No path through the first-run flow on Linux surfaces the string "Run as Administrator" to the user
**Plans**: 2 plans
Plans:
- [x] 20-01-PLAN.md — Platform-guard raiseUACDialog and confirmElevate with Linux-arm ternaries
- [x] 20-02-PLAN.md — Verify EPERM/EACCES path and grep audit for zero reachable "Run as Administrator"

### Phase 21: Mod Install Round-Trip Validation
**Goal**: A Linux user can install a mod, deploy it, and enable it for one Proton game — end to end — without editing any config files or opening a terminal
**Depends on**: Phase 18, Phase 19
**Requirements**: ONBRD-04
**Success Criteria** (what must be TRUE):
  1. User can download a mod via NXM link (or manual install), install it through the FOMOD wizard, and see it in the mod list — no terminal required
  2. User can deploy the installed mod to the Proton game's mod directory and confirm the files appear in the correct location
  3. User can enable the deployed mod for the selected Proton game and launch the game without editing any INI or config file manually
**Plans**: 2 plans
Plans:
- [ ] 21-01-PLAN.md — TDD: Fix ENOENT blocker in hardlink_activator isSupported
- [ ] 21-02-PLAN.md — Mark ONBRD-04 code-complete and add 999.1 UAT entry

### Phase 22: Steam Deck Layout
**Goal**: All onboarding dialogs and overlays are fully usable at 1280×800 (Steam Deck Desktop Mode) with no clipped buttons or scrolled-away content
**Depends on**: Nothing (independent)
**Requirements**: ONBRD-05a, ONBRD-05b
**Success Criteria** (what must be TRUE):
  1. User on a 1280×800 display sees the onboarding overlay fully within the viewport — the overlay bottom edge does not clip below the visible area
  2. User on a 1280×800 display can click action buttons in any Bootstrap modal in the onboarding flow without scrolling — buttons are visible and reachable
**Plans**: TBD
**UI hint**: yes

### Phase 23: Help Links
**Goal**: Linux users reach Linux-specific documentation when using help features, and get the target URL inline if the browser launcher fails
**Depends on**: Nothing (independent)
**Requirements**: ONBRD-06a, ONBRD-06b
**Success Criteria** (what must be TRUE):
  1. User who clicks "Get Help" or opens the knowledge base on Linux is routed to a Linux-specific wiki page, not the generic Windows documentation
  2. User on SteamOS (or any system with no browser configured) sees the target URL displayed inline in the UI instead of a silent failure
**Plans**: TBD
**UI hint**: yes

## Backlog

### Phase 999.1: Manual UAT — ELEV-05/ELEV-06 Desktop Linux + Steam Deck Elevation (BACKLOG)

**Goal:** Manually validate Phase 12 elevation UX on real hardware — desktop Linux ELEV-05 checklist (hardlinks, permission repair, session token re-use, fresh session re-prompt) and Steam Deck Game Mode ELEV-06 notification UX. Also confirm Windows CI green via `main.yml` windows-latest matrix push.
**Context:** Symlink deployment item skipped (not exposed in current UI). Automated Vitest coverage exists for ELEV-06 notifier; this validates end-to-end Electron rendering. Phase 11 polkit rule prerequisite for ELEV-05.
**Requirements:** ELEV-05, ELEV-06
**Plans:** 2/2 plans complete

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Runtime Environment | v1.0 | 1/1 | Complete | 2026-03-30 |
| 2. winapi-bindings Shim | v1.0 | 2/2 | Complete | 2026-03-30 |
| 3. Native Addon Compilation | v1.0 | 3/3 | Complete | 2026-03-30 |
| 4. FOMOD Installer Integration | v1.0 | 2/2 | Complete | 2026-03-31 |
| 5. IPC and Elevation Audit | v1.0 | 2/2 | Complete | 2026-03-31 |
| 6. Steam/Proton Detection | v2.0 | 3/3 | Complete | 2026-04-01 |
| 7. Linux Packaging | v2.0 | 2/2 | Complete | 2026-04-01 |
| 8. NXM Protocol Handler | v2.0 | 2/2 | Complete | 2026-04-01 |
| 9. Native Addon Fix + Elevation Foundation | v3.0 | 2/2 | Complete | 2026-04-01 |
| 10. Save UI Validation + SteamOS + Polkit | v3.0 | 2/2 | Complete | 2026-04-01 |
| 11. Persistent Elevation Token | v4.0 | 1/1 | Complete | 2026-04-07 |
| 12. Elevation End-to-End Validation + Steam Deck Error UX | v4.0 | 1/1 | Complete | 2026-04-07 |
| 13. Save Transfer | v4.0 | 1/1 | Complete | 2026-04-07 |
| 14. Linux Case-Folding fs Wrapper | v4.0 | 2/2 | Complete | 2026-04-07 |
| 15. fomod-installer Linux Fixes + Vortex Cleanup | v5.0 | 3/3 | Complete | 2026-04-09 |
| 16. chattr+F Filesystem Layer | v6.0 | 1/1 | Complete | 2026-04-15 |
| 17. Upstream Rebase CI Workflow | v6.0 | 1/1 | Complete | 2026-04-15 |
| 18. First-Run Dashboard Foundation | v7.0 | 1/2 | In Progress|  |
| 19. Staging Directory Wiring | v7.0 | 3/3 | Complete    | 2026-04-16 |
| 20. Windows String Purge | v7.0 | 2/2 | Complete    | 2026-04-16 |
| 21. Mod Install Round-Trip Validation | v7.0 | 0/2 | Not started | - |
| 22. Steam Deck Layout | v7.0 | 0/? | Not started | - |
| 23. Help Links | v7.0 | 0/? | Not started | - |
