---
status: partial
phase: 11-persistent-elevation-token
source: [11-VERIFICATION.md]
started: 2026-04-07T10:16:23Z
updated: 2026-04-07T10:16:23Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Session credential caching (.deb install)
expected: After triggering elevation once in a session, a second elevation op in the same session must NOT re-prompt for password (AUTH_ADMIN_KEEP caches until session ends).
result: [pending]

### 2. Session boundary re-prompt (.deb install)
expected: After closing and relaunching Vortex, the first elevation in the new session must prompt again (subject.active guard resets across sessions).
result: [pending]

### 3. AppImage isolation (no rules file)
expected: On AppImage install (no polkit rules file installed), triggering elevation twice in one session must re-prompt each time (no caching).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
