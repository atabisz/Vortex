# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- 🔄 **v4.0 Elevation Hardening + Save Transfer** — Phases 11–13 (in progress)

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

### v4.0 Elevation Hardening + Save Transfer

- [x] **Phase 11: Persistent Elevation Token** — Session-scoped polkit rule; no re-prompts within a session (completed 2026-04-07)
- [x] **Phase 12: Elevation End-to-End Validation + Steam Deck Error UX** — All desktop Linux elevation operations validated live; Steam Deck failure notification wired (completed 2026-04-07)
- [ ] **Phase 13: Save Transfer** — Profile-to-profile save file copy between Wine prefix paths
- [ ] **Phase 14: Linux Case-Folding fs Wrapper** — Shared fs shim resolving on-disk casing before AppData path calls

## Phase Details

### Phase 11: Persistent Elevation Token
**Goal**: Users can perform repeated elevation operations in a session without being prompted more than once
**Depends on**: Phase 10 (polkit action file + pkexec foundation from v3.0)
**Requirements**: ELEV-04
**Success Criteria** (what must be TRUE):
  1. User triggers an elevation operation (e.g. mod deploy) and enters their password once
  2. User triggers a second elevation operation in the same session without being re-prompted
  3. The polkit session rule file is installed at the correct path and grants auth_admin_keep for Vortex's action
  4. A new session (fresh Vortex launch) prompts for the password again — the token does not persist across sessions
  5. Windows build compiles and tests pass without modification — polkit rule logic is Linux-only
**Plans:** 1/1 plans complete
Plans:
- [x] 11-01-PLAN.md — Polkit rules file, .deb packaging, and README documentation

### Phase 12: Elevation End-to-End Validation + Steam Deck Error UX
**Goal**: All user-triggered elevation operations work reliably on desktop Linux; Steam Deck users see a clear, actionable failure notification when elevation is unavailable
**Depends on**: Phase 11 (persistent token in place for full path validation)
**Requirements**: ELEV-05, ELEV-06
**Success Criteria** (what must be TRUE):
  1. Mod deployment completes successfully on desktop Linux (Gnome/KDE) with ELEV-04 token active
  2. Symlink creation and permission fix operations complete without crashing or hanging on desktop Linux
  3. On Steam Deck in Game Mode (no polkit agent), the user sees a notification with a recovery path (e.g. "Switch to Desktop Mode to authorize")
  4. The Steam Deck error notification is dismissible and does not leave Vortex in a broken state
  5. Windows build and CI remain green after all validation fixes applied
**Plans:** 1/1 plans complete
Plans:
- [x] 12-01-PLAN.md — _setNotifier callback in elevated.ts, renderer.tsx wiring, notifier tests, HUMAN-UAT.md
**UI hint**: yes

### Phase 13: Save Transfer
**Goal**: Users can transfer saves between Vortex profiles on Linux using the existing save manager UI
**Depends on**: Phase 10 (mygamesPath() async with Proton branch, from v3.0)
**Requirements**: SAVE-05
**Success Criteria** (what must be TRUE):
  1. User can select a save in the save manager and transfer it to another active Vortex profile
  2. The transferred save file appears in the destination profile's save list after transfer
  3. The source save file is not modified or deleted by the transfer operation
  4. Transfer works for both Skyrim SE and Fallout 4 on Linux (Wine prefix paths)
**Plans**: TBD

### Phase 14: Linux Case-Folding fs Wrapper
**Goal**: Eliminate Windows-assumes-case-insensitive bugs without patching individual callsites — wrap vortex-api's fs module with a Linux shim that resolves actual on-disk casing before any `readFile`/`writeFile`/`stat`/`watch` call on game AppData paths
**Depends on**: Phase 10 (Proton/Wine path resolution foundation from v3.0)
**Context**: Skyrim SE creates `Plugins.txt` (capital P) via Proton/Wine; Vortex hardcodes lowercase paths. Fixed surgically in `PluginPersistor.ts` (2026-04-07), but the same mismatch will recur for ini files, save files, and other game AppData files. Scoped to Wine prefix AppData paths, not all fs calls globally. Prerequisite: promote `resolvePathCase` from `mod_management` into a shared utility (`@vortex/shared` or `vortex-api`).
**Requirements**: CASE-01, CASE-02, CASE-03, CASE-04
**Success Criteria** (what must be TRUE):
  1. A `resolvePathCase` utility is promoted from `mod_management` into `@vortex/shared` or `vortex-api`
  2. The fs shim wraps `readFile`, `writeFile`, `stat`, and `watch` calls on Wine prefix AppData paths
  3. Vortex correctly reads `Plugins.txt` (capital P) without a surgical per-callsite fix
  4. No global fs calls are intercepted — shim is scoped to game AppData paths only
  5. Windows build compiles and tests pass without modification — shim logic is Linux-only
**Plans:** 2 plans
Plans:
- [ ] 14-01-PLAN.md — Promote resolvePathCase, wire fs.ts shim, update mod_management imports
- [ ] 14-02-PLAN.md — Clean up PluginPersistor surgical workaround

## Backlog

### Phase 999.1: Manual UAT — ELEV-05/ELEV-06 Desktop Linux + Steam Deck Elevation (BACKLOG)

**Goal:** Manually validate Phase 12 elevation UX on real hardware — desktop Linux ELEV-05 checklist (hardlinks, permission repair, session token re-use, fresh session re-prompt) and Steam Deck Game Mode ELEV-06 notification UX. Also confirm Windows CI green via `main.yml` windows-latest matrix push.
**Context:** Symlink deployment item skipped (not exposed in current UI). Automated Vitest coverage exists for ELEV-06 notifier; this validates end-to-end Electron rendering. Phase 11 polkit rule prerequisite for ELEV-05.
**Requirements:** ELEV-05, ELEV-06
**Plans:** 0 plans (promote with /gsd-review-backlog when ready)

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
| 11. Persistent Elevation Token | v4.0 | 1/1 | Complete    | 2026-04-07 |
| 12. Elevation End-to-End Validation + Steam Deck Error UX | v4.0 | 1/1 | Complete    | 2026-04-07 |
| 13. Save Transfer | v4.0 | 0/TBD | Not started | - |
| 14. Linux Case-Folding fs Wrapper | v4.0 | 0/2 | Not started | - |
