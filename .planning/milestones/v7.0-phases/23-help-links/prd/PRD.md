---
task: Map code patterns for Phase 23 help links
slug: 20260417-000001_phase-23-pattern-mapping
effort: standard
phase: complete
progress: 8/8
mode: interactive
started: 2026-04-17T00:00:00Z
updated: 2026-04-17T00:01:00Z
---

## Context

Pattern mapping for Phase 23 (Help Links). Two requirements: ONBRD-06a (Linux URL routing
in documentation extension) and ONBRD-06b (browser failure notification via IPC push).
Five files modified, zero files created. All analogs found in codebase.

## Criteria

- [x] ISC-1: documentation/index.tsx classified with role and data flow
- [x] ISC-2: open.ts classified with role and data flow
- [x] ISC-3: ipc.ts classified with role and data flow
- [x] ISC-4: preload.ts classified with role and data flow
- [x] ISC-5: preload/index.ts classified with role and data flow
- [x] ISC-6: Concrete code excerpts extracted for each file with line numbers
- [x] ISC-7: Shared cross-cutting patterns identified (platform guard, IPC push, sendNotification)
- [x] ISC-8: PATTERNS.md written to correct phase directory

## Verification

All 8 criteria satisfied. PATTERNS.md written to
`.planning/phases/23-help-links/23-PATTERNS.md`. All analogs directly read from codebase
with line numbers cited.
