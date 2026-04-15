---
phase: 16
slug: chattr-f-filesystem-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `src/renderer/vitest.config.mts` |
| **Quick run command** | `pnpm --filter renderer vitest run src/renderer/src/util/chattrCasefold.test.ts` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~10 seconds (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter renderer vitest run src/renderer/src/util/chattrCasefold.test.ts`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green (including pre-existing 22 fs.test.ts tests)
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | CASE-05 | T-08 path injection | `execFile` arg array, not shell string | unit | `pnpm --filter renderer vitest run src/renderer/src/util/chattrCasefold.test.ts` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | CASE-06 | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | CASE-07 | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| 16-01-04 | 01 | 1 | CASE-08 | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| 16-01-05 | 01 | 1 | CASE-09 | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| 16-01-06 | 01 | 1 | CASE-10 | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| 16-01-07 | 01 | 1 | CASE-11 | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | CASE-08 | — | N/A | unit | `pnpm vitest run` (CI matrix) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/renderer/src/util/chattrCasefold.test.ts` — 13 test cases covering CASE-05 through CASE-11
- [ ] Export `_resetChattrState()` from `fs.ts` — required by test `beforeEach` to clear `ext4CasefoldCache` Map and `hasShownCasefoldNotification` flag between tests

*Existing test infrastructure (`vitest.config.mts`, `fs.test.ts`) is sufficient — no new config files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| chattr+F actually enables casefold on real ext4-casefold filesystem | CASE-06 | Requires an ext4 filesystem formatted with `-O casefold` (not available in standard CI) | Boot Linux with `mkfs.ext4 -O casefold` staging volume; run Vortex; create a mod; verify `lsattr -d <stagingDir>` shows `F` flag |
| Notification shown to user on EOPNOTSUPP-on-ext4 | CASE-11 | Requires a real ext4 filesystem without casefold feature; notification dispatch requires running renderer | Run Vortex on Linux with standard ext4 (no casefold); trigger mod staging directory creation; verify info notification appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
