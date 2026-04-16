---
status: partial
phase: 18-first-run-dashboard-foundation
source: [18-VERIFICATION.md]
started: 2026-04-16T00:00:00Z
updated: 2026-04-16T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. No-crash launch on Linux

expected: Vortex launches on a fresh Linux install and the first-steps dashlet renders without crashing (no `instPath`/`dlPath` undefined error)
result: [pending]

### 2. NoGameDashlet empty state visible

expected: After game discovery completes with no Steam games detected, the NoGameDashlet renders the "No Steam games detected" heading, guidance text, and Refresh button (not a blank screen)
result: [pending]

### 3. Refresh button triggers re-discovery

expected: Clicking the Refresh button in the empty-state block emits the `start-discovery` event and triggers a new game discovery cycle
result: [pending]

### 4. Steam startup race condition retry

expected: When Vortex launches before Steam finishes loading, Steam games appear after the automatic ~2s retry without needing to restart Vortex
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
