---
status: partial
phase: 13-save-transfer
source: [13-VERIFICATION.md]
started: 2026-04-07T21:21:33Z
updated: 2026-04-07T21:21:33Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end save transfer on Linux
expected: Select a save, transfer to another profile, confirm file appears in destination (requires running Vortex on Linux with real Wine/Proton prefix)
result: [pending]

### 2. Skyrim SE and Fallout 4 casing resolution
expected: Repeat transfer for both games at their actual `compatdata/.../pfx/` paths — casing resolution fires correctly and saves land in the correct destination
result: [pending]

### 3. Empty-state transfer picker
expected: Open the transfer picker with no eligible profiles — italicised message "No profiles with local saves found. Enable local saves in Profile Settings to use save transfer." renders in the Electron UI
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
