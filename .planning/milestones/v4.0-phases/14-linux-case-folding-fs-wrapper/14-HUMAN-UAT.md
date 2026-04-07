---
status: partial
phase: 14-linux-case-folding-fs-wrapper
source: [14-VERIFICATION.md]
started: 2026-04-07T00:00:00.000Z
updated: 2026-04-07T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. TypeScript Build
expected: `pnpm run build` completes without type errors in fs.ts, resolvePathCase.ts, api.ts, LinkingDeployment.ts, InstallManager.ts
result: [pending]

### 2. End-to-End Wine Prefix Test
expected: On Linux with Steam + Proton — launch Vortex with Skyrim SE (or any Proton Bethesda game), open Plugins tab, plugin list loads without ENOENT errors (the "Plugins.txt capital P" scenario)
result: [pending]

### 3. Requirements Register Gap
expected: CASE-01 through CASE-04 present in .planning/REQUIREMENTS.md with Phase 14 traceability, or omission documented
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
