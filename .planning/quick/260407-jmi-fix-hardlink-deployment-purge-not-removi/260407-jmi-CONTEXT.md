# Quick Task 260407-jmi: Fix hardlink deployment purge not removing all files on Linux - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Task Boundary

After creating a new (empty) profile and running purge, SKSE DLLs and other mod files remain
in the Skyrim game directory. Hardlink deployment is in use. A vanilla install should result.

</domain>

<decisions>
## Implementation Decisions

### Root Cause
- Trace the code path: loadActivation → purge → unlink in the hardlink deployer to find
  exactly where files slip through. No assumed root cause.

### Orphan Cleanup
- Fix forward only — fix the purge path so future purges work correctly. User will manually
  remove currently stranded files. No auto-clean of existing orphans.

### Windows Safety
- Linux-guard any new code paths. Shared hardlink deployer code must not change Windows
  behaviour. Wrap Linux-specific logic in `process.platform === "linux"` guards.

### Claude's Discretion
- Exact files to change and implementation details — follow from code trace.

</decisions>

<specifics>
## Specific Ideas

- Symptom: SKSE DLLs still present after profile switch + purge with hardlink deployment
- Entry points to trace: `src/renderer/src/extensions/mod_management/` — hardlink deployer,
  loadActivation, purge flow

</specifics>
