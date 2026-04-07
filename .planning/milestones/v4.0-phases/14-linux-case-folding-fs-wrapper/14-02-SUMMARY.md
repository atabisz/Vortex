---
phase: 14-linux-case-folding-fs-wrapper
plan: 02
subsystem: filesystem
tags: [linux, wine, proton, case-folding, plugin-persistor, cleanup]

# Dependency graph
requires:
  - phase: 14-01
    provides: fs.ts Wine prefix shim (readFileAsync/writeFileAsync/statAsync/watch)
provides:
  - PluginPersistor.ts with resolvePluginsFilePath removed — shim handles path resolution
affects:
  - gamebryo-plugin-management (PluginPersistor cleanup completed)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-callsite workaround removed once transparent fs shim is in place"

key-files:
  created: []
  modified:
    - extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts

key-decisions:
  - "PluginPersistor cleanup completed in Plan 14-01 as part of the GREEN TDD commit — no additional changes needed in Plan 14-02"
  - "fileName.toLowerCase() watch fix retained permanently: inotify event filenames from OS are outside shim reach (D-11)"

requirements-completed: [CASE-04]

# Metrics
duration: 0min
completed: 2026-04-07
---

# Phase 14 Plan 02: PluginPersistor Cleanup Summary

**PluginPersistor.resolvePluginsFilePath removed; serialize/deserialize use path.join directly; fs.ts shim handles case-folding transparently**

## Performance

- **Duration:** ~0 min (no-op — work already complete from Plan 14-01)
- **Started:** 2026-04-07
- **Completed:** 2026-04-07
- **Tasks:** 1 (pre-completed by Plan 14-01)
- **Files modified:** 0 (no changes needed)

## Accomplishments

All acceptance criteria were already met when this plan's executor ran, because the Plan 14-01 executor included the PluginPersistor cleanup in its GREEN TDD commit (`4e4d2e3e5 feat(14-01): wire Wine prefix case-folding shim into fs.ts, clean up PluginPersistor`).

Verified state of `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts`:

- `resolvePluginsFilePath` method: absent (grep returns 0 matches)
- `serialize` method: uses `const pluginsFile = path.join(destPath, "plugins.txt")` directly
- `deserialize` method: uses `path.join(this.mPluginPath, "plugins.txt")` directly in both format branches
- `fileName.toLowerCase()` watch fix: present at line ~652 (`["loadorder.txt", "plugins.txt"].includes(fileName.toLowerCase())`)

## Task Commits

No new commits were required. The work was already committed in Plan 14-01:

- `4e4d2e3e5` — `feat(14-01): wire Wine prefix case-folding shim into fs.ts, clean up PluginPersistor`

## Files Created/Modified

None — all changes already applied in Plan 14-01.

## Decisions Made

The Plan 14-01 executor applied the PluginPersistor cleanup as part of the fs.ts TDD implementation, which was in-scope per D-10, D-11, and D-12 from the phase context. This is documented in the Plan 14-01 SUMMARY as "None — plan executed exactly as written. PluginPersistor cleanup was in-scope per D-10/D-11/D-12."

## Deviations from Plan

None — the pre-completion scenario described in the `<important_context>` block applied. All acceptance criteria were satisfied by Plan 14-01 before Plan 14-02 began execution.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `extensions/gamebryo-plugin-management/src/util/PluginPersistor.ts` exists and contains the expected content
- `resolvePluginsFilePath` is absent: confirmed via grep
- `path.join(destPath, "plugins.txt")` present in serialize: confirmed
- `path.join(this.mPluginPath, "plugins.txt")` present in deserialize: confirmed
- `fileName.toLowerCase()` present in watch handler: confirmed
- Plan 14-01 commit `4e4d2e3e5` exists: confirmed

---
*Phase: 14-linux-case-folding-fs-wrapper*
*Completed: 2026-04-07*
