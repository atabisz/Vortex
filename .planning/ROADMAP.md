# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Elevation Hardening + Save Transfer** — Phases 11–14 (shipped 2026-04-07) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 fomod-installer Linux Fixes** — Phase 15 (shipped 2026-04-09) — [archive](milestones/v5.0-ROADMAP.md)
- 🔄 **v6.0 Infrastructure** — Phases 16–17 (in progress)

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

### v6.0 Infrastructure

- [x] **Phase 16: chattr+F Filesystem Layer** — Kernel casefold applied at staging directory creation on ext4; silent fallback to userspace shim on all other filesystems (completed 2026-04-15)
- [ ] **Phase 17: Upstream Rebase CI Workflow** — Daily automated detection of new nexus-mods/Vortex release tags; draft rebase PR with clean/conflict distinction; idempotent on repeated runs

## Phase Details

### Phase 16: chattr+F Filesystem Layer
**Goal**: New mod staging directories on ext4-casefold filesystems use kernel-level case-insensitivity; all other filesystems and Windows are silently unaffected
**Depends on**: Phase 15 (fs.ts Wine-prefix shim already in place as fallback target)
**Requirements**: CASE-05, CASE-06, CASE-07, CASE-08, CASE-09, CASE-10, CASE-11
**Success Criteria** (what must be TRUE):
  1. When a new mod staging directory is created on an ext4 filesystem with the casefold feature enabled, `chattr +F` is applied before any files are written and both ubuntu-latest and windows-latest CI matrix jobs in main.yml remain green
  2. When `chattr +F` returns EOPNOTSUPP, EINVAL, or any non-zero exit (including on non-casefold ext4, btrfs, XFS, ZFS), Vortex continues normally with no error shown to the user and the existing Wine-prefix shim handles case resolution
  3. When running inside a Flatpak sandbox (FLATPAK_ID set) or on Windows (process.platform !== 'linux'), the chattr+F code path is never reached — chattr is never invoked
  4. After a successful `chattr +F` call, Vortex verifies casefold is active by writing an uppercase filename and reading it back lowercase — if the verify test fails, Vortex falls back to the shim silently
  5. The INFO log entry appears on chattr+F success; the DEBUG log entry appears on fallback; no user-visible error dialog is shown for normal fallback on unsupported filesystems
**Plans:** 1/1 plans complete
Plans:
- [x] 16-01-PLAN.md — applyChattrCasefold implementation + tests + renderer.tsx notification wiring

### Phase 17: Upstream Rebase CI Workflow
**Goal**: Upstream nexus-mods/Vortex release tags are detected automatically each day and produce a draft rebase PR in the fork without human polling
**Depends on**: Phase 16 (independent — may be implemented in parallel)
**Requirements**: REBASE-01, REBASE-02, REBASE-03, REBASE-04, REBASE-05, REBASE-06, REBASE-07
**Success Criteria** (what must be TRUE):
  1. A daily cron run when the fork is already up to date exits cleanly with no PR created; a manual `workflow_dispatch` run with an optional `upstream_ref` input also exits cleanly when no new tag is found
  2. When a new upstream release tag is detected, the workflow opens a draft PR titled `chore: rebase onto upstream <tag>` with a body that includes the upstream tag, release URL, conflict status, commit diff summary, and the fork link https://github.com/atabisz/Vortex
  3. A second daily run after a rebase PR already exists updates the branch without creating a duplicate PR
  4. When `git rebase` encounters conflicts, the workflow aborts cleanly, commits the conflict state, pushes the branch, and opens a draft PR with a "conflicts detected" warning body — the workflow job itself shows green (not failed)
  5. The workflow never runs outside the `atabisz/Vortex` repository (job-level `if: github.repository == 'atabisz/Vortex'` guard is present and enforced)
**Plans**: TBD

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
| 11. Persistent Elevation Token | v4.0 | 1/1 | Complete | 2026-04-07 |
| 12. Elevation End-to-End Validation + Steam Deck Error UX | v4.0 | 1/1 | Complete | 2026-04-07 |
| 13. Save Transfer | v4.0 | 1/1 | Complete | 2026-04-07 |
| 14. Linux Case-Folding fs Wrapper | v4.0 | 2/2 | Complete | 2026-04-07 |
| 15. fomod-installer Linux Fixes + Vortex Cleanup | v5.0 | 3/3 | Complete | 2026-04-09 |
| 16. chattr+F Filesystem Layer | v6.0 | 1/1 | Complete    | 2026-04-15 |
| 17. Upstream Rebase CI Workflow | v6.0 | 0/? | Not started | - |
