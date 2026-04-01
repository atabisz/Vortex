# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🔄 **v2.0 Usable on Linux** — Phases 6–8 (active)

## Phases

<details>
<summary>✅ v1.0 Linux Port Phase 1 (Phases 1–5) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Runtime Environment (1/1 plans) — completed 2026-03-30
- [x] Phase 2: winapi-bindings Shim (2/2 plans) — completed 2026-03-30
- [x] Phase 3: Native Addon Compilation (3/3 plans) — completed 2026-03-30
- [x] Phase 4: FOMOD Installer Integration (2/2 plans) — completed 2026-03-31
- [x] Phase 5: IPC and Elevation Audit (2/2 plans) — completed 2026-03-31

</details>

### v2.0 Usable on Linux

- [ ] **Phase 6: Steam/Proton Detection** — Validate and complete Steam/Proton game detection on Linux; fix `{mygames}` Wine prefix path; audit top-4 game extensions
- [x] **Phase 7: Linux Packaging** — Produce AppImage and .deb artifacts via electron-builder; add Linux CI job; generate auto-updater manifest (completed 2026-04-01)
- [x] **Phase 8: NXM Protocol Handler** — Wire and validate NXM "Download with Manager" on standard Linux and SteamOS/KDE Plasma (completed 2026-04-01)

## Phase Details

### Phase 6: Steam/Proton Detection
**Goal**: Linux users can detect, launch, and manage their Steam/Proton games in Vortex — including Bethesda titles that store INI and save files inside the Wine prefix
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: STAM-01, STAM-02, STAM-03, STAM-04, STAM-05
**Success Criteria** (what must be TRUE):
  1. Vortex detects Steam games from both native Steam (`~/.steam/steam`) and Flatpak Steam (`~/.var/app/com.valvesoftware.Steam`) installs, including dual-install setups
  2. Proton prefix path resolves correctly per game, including games that have never been launched (detected via `oslist` ACF field)
  3. Skyrim SE and Fallout 4 INI/save files are found inside `compatdata/<appid>/pfx/drive_c/users/steamuser/Documents/My Games/` — not `~/Documents/My Games`
  4. Cyberpunk 2077 and Stardew Valley are confirmed manageable on Linux without errors
**Plans**: 3 plans
Plans:
- [x] 06-01-PLAN.md — Multi-root Steam detection + oslist Proton detection
- [x] 06-02-PLAN.md — Wine prefix {mygames} path fix (both gameSupport.ts files + async iniFiles)
- [x] 06-03-PLAN.md — Top-4 game extension audit + Fallout 4 dead import fix
**UI hint**: yes

### Phase 7: Linux Packaging
**Goal**: A distributable Linux build of Vortex exists — AppImage and .deb — produced automatically by CI alongside the Windows build, with auto-updater support
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04
**Success Criteria** (what must be TRUE):
  1. A GitHub Actions CI run produces a `vortex-setup-{version}.AppImage` artifact on the Ubuntu runner
  2. A GitHub Actions CI run produces a `vortex_{version}_amd64.deb` artifact with `xdg-utils` and `libasound2` declared as dependencies
  3. Linux artifacts (AppImage, .deb, `latest-linux.yml`) are uploaded to GitHub releases in the same job run as the Windows artifacts
  4. The in-app auto-updater checks for Linux updates only when running from an AppImage (`process.env.APPIMAGE` is set)
**Plans**: 2 plans
Plans:
- [x] 07-01-PLAN.md — electron-builder AppImage + deb config and auto-updater gate
- [x] 07-02-PLAN.md — Parallel build-linux CI job in package.yml

### Phase 8: NXM Protocol Handler
**Goal**: Clicking "Download with Manager" on Nexus Mods opens Vortex and starts the download — in both dev and AppImage builds, on standard Linux and SteamOS/KDE Plasma
**Depends on**: Phase 7
**Requirements**: PROT-01, PROT-02
**Success Criteria** (what must be TRUE):
  1. Clicking "Download with Manager" in a browser on standard Linux (GNOME or KDE Plasma) with Vortex already running opens Vortex and immediately begins the download
  2. Clicking "Download with Manager" while Vortex is closed launches Vortex and begins the download after the Redux store is ready — the NXM URL is not silently dropped
  3. The NXM protocol handler is registered and functional when running from a packaged AppImage build (`.desktop` file written to `~/.local/share/applications/`)
  4. NXM handler is confirmed working in SteamOS Desktop Mode (KDE Plasma); Steam Browser behavior documented or deferred to v3.0 if hardware is unavailable
**Plans**: 2 plans
Plans:
- [x] 08-01-PLAN.md — AppImage desktop entry + KDE kbuildsycoca6 refresh for NXM handler
- [x] 08-02-PLAN.md — Cold-start NXM URL buffer in Application.ts

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Runtime Environment | v1.0 | 1/1 | Complete | 2026-03-30 |
| 2. winapi-bindings Shim | v1.0 | 2/2 | Complete | 2026-03-30 |
| 3. Native Addon Compilation | v1.0 | 3/3 | Complete | 2026-03-30 |
| 4. FOMOD Installer Integration | v1.0 | 2/2 | Complete | 2026-03-31 |
| 5. IPC and Elevation Audit | v1.0 | 2/2 | Complete | 2026-03-31 |
| 6. Steam/Proton Detection | v2.0 | 0/3 | Planned | - |
| 7. Linux Packaging | v2.0 | 2/2 | Complete   | 2026-04-01 |
| 8. NXM Protocol Handler | v2.0 | 2/2 | Complete   | 2026-04-01 |
