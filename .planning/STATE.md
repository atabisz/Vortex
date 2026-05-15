---
gsd_state_version: 1.0
milestone: v8.0
milestone_name: Upstream v2.0.0 Sync
status: executing
stopped_at: Phase 24 complete — pushed to fork/sync/upstream-v2.0.0 at 87784986d
last_updated: "2026-05-15T00:20:00Z"
last_activity: 2026-05-15 -- Phase 24 complete
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 8
  completed_plans: 8
  percent: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-15 after v8.0 milestone start)

**Core value:** A Linux user can install Vortex, detect their Steam/Proton games, download mods via NXM link, and manage save games — without leaving the Vortex UI.
**Current focus:** Phase 24 — config-bucket

## Current Position

Phase: 24 (config-bucket) — COMPLETE
Plan: 8 of 8
Status: Phase 24 done. fork/sync/upstream-v2.0.0 force-pushed at 87784986d. PR #4 reflects resolved tree. Next: Phase 25 (restore dropped scaffolding).
Last activity: 2026-05-15 -- Phase 24 complete

## Performance Metrics

**Velocity:**

- Total plans completed: 20
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 11 | 1 | - | - |
| 12 | 1 | - | - |
| 14 | 2 | - | - |
| 13 | 1 | - | - |
| 15 | 3 | - | - |
| 16 | 1 | - | - |
| 17 | 1 | - | - |
| 19 | 3 | - | - |
| 20 | 2 | - | - |
| 21 | 2 | - | - |
| 22 | 1 | - | - |
| 23 | 2 | - | - |

**Recent Trend:**

- Last 5 plans: Phase 21–23 (v7.0 onboarding wizard)
- Trend: -

*Updated after each plan completion*
| Phase 06-steam-proton-detection P01 | 3 | 2 tasks | 3 files |
| Phase 06-steam-proton-detection P02 | 15 | 2 tasks | 4 files |
| Phase 06-steam-proton-detection P03 | 5 | 1 tasks | 1 files |
| Phase 06-steam-proton-detection P03 | 20min | 2 tasks | 5 files |
| Phase 07-linux-packaging P02 | 5 | 1 tasks | 1 files |
| Phase 07-linux-packaging P01 | 2 | 2 tasks | 2 files |
| Phase 08-nxm-protocol-handler P02 | 5 | 1 tasks | 1 files |
| Phase 08-nxm-protocol-handler P01 | 8 | 2 tasks | 2 files |
| Phase 09 P01 | 2 | 2 tasks | 4 files |
| Phase 09 P02 | 7 | 1 tasks | 2 files |
| Phase 10-save-ui-validation-steamos-polkit P02 | 5 | 2 tasks | 4 files |
| Phase 10-save-ui-validation-steamos-polkit P01 | 8 | 3 tasks | 6 files |
| Phase 16 P01 | 6 | 2 tasks | 3 files |
| Phase 17-upstream-rebase-ci-workflow P01 | 3 | 2 tasks | 3 files |
| Phase 17 P01 | 30 | 4 tasks | 3 files |
| Phase 18-first-run-dashboard-foundation P01 | 9 | 2 tasks | 4 files |
| Phase 18 P02 | 16 | 2 tasks | 4 files |
| Phase 19 P00 | 25 | 2 tasks | 3 files |
| Phase 19 P01 | 4 | 2 tasks | 5 files |
| Phase 19 P02 | 5 | 2 tasks | 2 files |
| Phase 20-windows-string-purge P01 | 5min | 2 tasks | 3 files |
| Phase 20 P02 | 3min | 2 tasks | 0 files |
| Phase 21-mod-install-round-trip-validation P01 | 5min | 2 tasks | 2 files |
| Phase 21-mod-install-round-trip-validation P02 | 2min | 1 tasks | 2 files |
| Phase 23-help-links P01 | 3min | 2 tasks | 5 files |
| Phase 23 P02 | 2min | 1 tasks | 1 files |
| Phase 23-help-links P02 | 5min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting v8.0 work:

- Branch strategy: resolve on `sync/upstream-v2.0.0` directly (PR #4 head) and FF-merge to master — keeps PR review thread, simpler than fresh resolution branch
- Test divergence: drop upstream's renderer Jest scaffolding entirely; fork is Vitest-only — divergence to be documented in playbook
- Phase split: 7-phase split (24–30) preserves natural checkpoints — config first to unblock the tree, hot-zone resolution gets its own phase, build verification before land
- Lockfile: regenerate `pnpm-lock.yaml` rather than hand-merge — diff against v2.0.0's lockfile post-Linux-tweaks for catalog drift
- Fingerprints action: pick-theirs wholesale; fork-side disablement lives at GitHub API workflow level (workflow IDs `269710415/16/17`), survives upstream merges cleanly
- Mod-management hot zone: per-file commit + per-file playbook re-grep — reverting any one of the four §7 fixes surfaces as cryptic ENOENTs, so checkpoint must be tight

Older decisions (v1.0–v7.0) preserved in PROJECT.md Key Decisions table.

### Research Context (v8.0)

Key context from `.planning/milestones/v8.0-SCOPE-PROPOSAL.md` and `VORTEX-LINUX-MERGE-PLAYBOOK.md`:

- 109 conflict files / 365 regions across 10 buckets (A–J) — Bucket A (config) is the only true tree-blocker
- 135 files dropped by auto-merge — split into restore (paths/, paths-node/, gamebryo-ba2-support/, chunking) vs. deliberately-not-restore (Jest scaffolding)
- Mod-management hot zone (Bucket D, 8 files) carries playbook §6 (stagingDirHasFiles), §7a–d (four-fix backslash/case cluster), and the externalChanges/`140a57217` fix — all four §7 fixes have been reverted by upstream PR #22607 before; expect re-revert on every merge
- LinkingDeployment.ts must retain `140a57217` resolvePathCase fix — was reverted as part of the same upstream batch
- Gamebryo extensions: §1 (no inline guards), §3 (path.basename not toLowerCase for LOOT), §10 (cross-compiled native binaries handled by CI rebuild not committed)
- Renderer/spine: §2 (winapi-bindings allowlist), §4 (no testPathTransfer guard), §8 (Proton helpers in StarterInfo), §9 (findAllLinuxSteamPaths)
- 41 truly-missing patches need eyes during resolution — playbook covers Linux concerns but content fixes (BG3 divine, Morrowind migrate103, FOMOD installer 0.13.1, install crash on large archives, "already running" dialog) need review

### Pending Todos

None.

### Blockers/Concerns

None — ready for `/gsd-plan-phase 24`.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-m5m | fix blank game version in mismatch dialog on Linux | 2026-04-01 | e3d6638 | [260401-m5m-fix-blank-game-version-in-mismatch-dialo](./quick/260401-m5m-fix-blank-game-version-in-mismatch-dialo/) |
| 260401-mvp | normalize backslashes in FOMOD copy source/destination paths | 2026-04-01 | 926255819 | [260401-mvp-normalize-backslashes-in-fomod-copy-sour](./quick/260401-mvp-normalize-backslashes-in-fomod-copy-sour/) |
| 260401-oz3 | case-folding path resolver in LinkingDeployment for Linux | 2026-04-01 | 32a9b021b | [260401-oz3-case-folding-path-resolver-in-linkingdep](./quick/260401-oz3-case-folding-path-resolver-in-linkingdep/) |
| 260401-scf | FOMOD case-sensitivity in InstallManager.extractArchive | 2026-04-01 | 6e56ba5bf | [260401-scf-fix-fomod-case-sensitivity-error-in-inst](./quick/260401-scf-fix-fomod-case-sensitivity-error-in-inst/) |
| 260402-1b1 | Wine-era deployment manifest detection in loadActivation | 2026-04-02 | 5b2420f | [260402-1b1-implement-wine-era-deployment-manifest-d](./quick/260402-1b1-implement-wine-era-deployment-manifest-d/) |
| 260402-iko | fix hardlink undeploy orphan when manifest missing | 2026-04-02 | ca5fffb | [260402-iko-fix-hardlink-undeploy-orphan-when-manife](./quick/260402-iko-fix-hardlink-undeploy-orphan-when-manife/) |
| 260407-grv | Fix NXM download bugs: cli.ts argv slice and no-sandbox propagation | 2026-04-07 | d9986f6 | [260407-grv-fix-nxm-download-bug-cli-ts-argv-slice-a](./quick/260407-grv-fix-nxm-download-bug-cli-ts-argv-slice-a/) |
| 260407-icu | Remove Linux-disabled guard from NXM toggle in Settings.tsx | 2026-04-07 | b3c474bcc | [260407-icu-remove-the-linux-disabled-guard-from-the](./quick/260407-icu-remove-the-linux-disabled-guard-from-the/) |
| 260407-iv0 | Patch Firefox profiles with nxm expose pref during Linux NXM registration | 2026-04-07 | 35ba35ccb | [260407-iv0-patch-firefox-profiles-with-nxm-expose-p](./quick/260407-iv0-patch-firefox-profiles-with-nxm-expose-p/) |
| 260407-h9r | Clear Firefox handlers.json nxm entry on registration | 2026-04-07 | e08518b20 | — |
| 260408-haq | Set deb/AppImage version to major.minor.YYYYMMDDHHMM | 2026-04-08 | 53033d808 | [260408-haq-set-deb-package-version-to-major-minor-f](./quick/260408-haq-set-deb-package-version-to-major-minor-f/) |
| 260408-mvp | Speed up GH Actions builds: rust cache, workflow_run chain, paths-ignore | 2026-04-08 | 30436ef73 | [260408-mvp-speed-up-gh-actions-builds-rust-cache-wo](./quick/260408-mvp-speed-up-gh-actions-builds-rust-cache-wo/) |
| 260408-ms8 | Update planning docs with current state after v4.0 backlog analysis | 2026-04-08 | — | [260408-ms8-update-planning-docs-with-current-state-](./quick/260408-ms8-update-planning-docs-with-current-state-/) |
| 260417-kth | fix unused IDiscoveryState import in NoGameDashlet.tsx | 2026-04-17 | 604daafed | [260417-kth-fix-unused-idiscoverystate-import-in-nog](./quick/260417-kth-fix-unused-idiscoverystate-import-in-nog/) |
| 260509-dwt | heal stale empty staging dirs across install attempts | 2026-05-09 | 7e2c40e94 | [260509-dwt-implement-plans-validated-yawning-wave-m](./quick/260509-dwt-implement-plans-validated-yawning-wave-m/) |
| 260509-eur | re-apply normalizeBackslashPaths reverted by upstream PR 22607 | 2026-05-09 | 356e42cdb | [260509-eur-re-apply-normalizebackslashpaths-reverte](./quick/260509-eur-re-apply-normalizebackslashpaths-reverte/) |

## Session Continuity

Last session: 2026-05-15T00:20:00Z
Stopped at: Phase 24 complete; pushed to fork at 87784986d
Resume file: .planning/phases/25-restore-dropped/ (next phase — needs context-gathering)
