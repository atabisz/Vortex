---
phase: 11-persistent-elevation-token
plan: "01"
subsystem: linux-packaging
tags: [polkit, elevation, deb-packaging, documentation]
dependency_graph:
  requires: []
  provides: [ELEV-04]
  affects: [linux-packaging, elevation-flow]
tech_stack:
  added: []
  patterns: [polkit-js-rules, electron-builder-deb-extraFiles]
key_files:
  created:
    - build/linux/10-vortex.rules
  modified:
    - src/main/electron-builder.config.cjs
    - README.md
decisions:
  - "10-vortex.rules uses no isInGroup guard — simpler, consistent with .policy file auth_admin semantics; all active desktop users may cache credential"
  - "deb.extraFiles used (not linux.extraFiles) — AppImage does not receive the rules file; .policy file stays in linux.extraFiles for both formats"
metrics:
  duration: "5 minutes"
  completed: "2026-04-07"
  tasks_completed: 3
  files_changed: 3
---

# Phase 11 Plan 01: Persistent Elevation Token — Polkit Rules File Summary

**One-liner:** Polkit JS rules file granting `AUTH_ADMIN_KEEP` for `io.nexusmods.vortex.run-elevated`, wired into `.deb` packaging, with README documentation of `.deb` vs AppImage elevation difference.

## What Was Built

Three static changes — no TypeScript source files modified:

1. **`build/linux/10-vortex.rules`** — New polkit JavaScript rules file. Matches action ID `io.nexusmods.vortex.run-elevated` (same as the existing `.policy` file), checks `subject.active` (active desktop session only), returns `polkit.Result.AUTH_ADMIN_KEEP`. Users who install the `.deb` package will be prompted for their admin password once per desktop session instead of on every elevation call.

2. **`src/main/electron-builder.config.cjs`** — Added `deb.extraFiles` array with one entry: installs the rules file to `/etc/polkit-1/rules.d/10-vortex.rules` during `.deb` package installation. The existing `linux.extraFiles` (the `.policy` file) is untouched — both AppImage and `.deb` still get the policy file.

3. **`README.md`** — Three documentation updates:
   - "What Doesn't Work" table row for elevated ops now shows "Working (.deb) / Degraded (AppImage)" with `AUTH_ADMIN_KEEP` explanation
   - Elevation note added under the `.deb` install command block explaining session-scoped credential caching
   - Roadmap updated from stale "v3.0 — Save Games + Elevation (planning)" to "v4.0 — Elevation Hardening + Save Transfer (in progress)"

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 055d4503f | feat(11-01): add polkit rules file granting AUTH_ADMIN_KEEP |
| Task 2 | fa4875a23 | feat(11-01): wire polkit rules file into deb packaging |
| Task 3 | bff54d577 | docs(11-01): document .deb vs AppImage elevation difference |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| No `isInGroup("sudo")` guard in rules file | Simpler; consistent with the `.policy` file which uses `auth_admin` for all active users without group restriction |
| `deb.extraFiles` not `linux.extraFiles` | Ensures AppImage builds do NOT include the rules file; only `.deb` installs the session-caching rule |

## Deviations from Plan

None — plan executed exactly as written.

`build/linux/10-vortex.rules` required `git add -f` because `.gitignore` has a top-level `build/` ignore with `!build/linux/` exceptions. The force flag was needed to add a new file even with the negation rules present. This is expected behavior for this path.

## Known Stubs

None. This plan produces static asset files only — no UI rendering, no data flow.

## Threat Flags

None. The new surface (polkit rules file) was fully covered by the plan's threat model (T-11-01 through T-11-04, all accepted). No new trust boundaries introduced beyond what the plan anticipated.

## Self-Check

- [x] `build/linux/10-vortex.rules` exists
- [x] `src/main/electron-builder.config.cjs` contains `10-vortex.rules` and `polkit-1/rules.d`
- [x] `README.md` contains `AUTH_ADMIN_KEEP`, `AppImage builds do not include this rule`, `v4.0`
- [x] No `.ts` or `.tsx` files modified
- [x] Commits 055d4503f, fa4875a23, bff54d577 exist
