# Roadmap: Vortex Linux Port

## Milestones

- ✅ **v1.0 Linux Port Phase 1** — Phases 1–5 (shipped 2026-03-31) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Usable on Linux** — Phases 6–8 (shipped 2026-04-01) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Save Games + Elevation** — Phases 9–10 (shipped 2026-04-01) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Elevation Hardening + Save Transfer** — Phases 11–14 (shipped 2026-04-07) — [archive](milestones/v4.0-ROADMAP.md)
- **v5.0 fomod-installer Linux Fixes** — Phase 15 (in progress)

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

## v5.0 — fomod-installer Linux Fixes

### Phase 15: fomod-installer Linux Fixes + Vortex Cleanup

**Goal:** Deliver clean, PR-ready Linux fixes in the local fomod-installer fork and apply corresponding Vortex cleanup so the end-to-end FOMOD story is correct on Linux without workarounds.
**Context:** Local fork at `/home/alex/src/fomod-installer` is linked via pnpm overrides. Parser10 path normalization already implemented. Remaining gaps: CSharpScript runtime OS guard, CI Linux IPC build pipeline, source-path case normalization in XmlScriptInstaller. Vortex needs: unsupported-instruction warning for Linux, redundant replaceAll removal, and vortex-api declaration regeneration.
**Requirements:** FOMD-15-01, FOMD-15-02, FOMD-15-03, FOMD-15-04, FOMD-15-05, FOMD-15-06, FOMD-15-07
**Plans:** 3/3 plans complete

Plans:
- [x] 15-01-PLAN.md — fomod-installer source path normalization + verify existing OS guard and CI
- [x] 15-02-PLAN.md — Vortex Linux CSharpScript warning + remove redundant replaceAll
- [x] 15-03-PLAN.md — Regenerate vortex-api declarations + REQUIREMENTS.md

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
| 15. fomod-installer Linux Fixes + Vortex Cleanup | v5.0 | 3/3 | Complete    | 2026-04-09 |
