---
phase: 20
slug: windows-string-purge
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm run test --project main` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run test --project main`
- **After every plan wave:** Run `pnpm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | ONBRD-03a | — | pkexec prompt shown on Linux for UAC-level ops | unit | `pnpm run test --project main` | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | ONBRD-03b | — | Linux-safe message for download-settings user account error | unit | `pnpm run test --project main` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 2 | ONBRD-03c | — | nativeErrors.ts early-returns undefined on non-Windows | unit | `pnpm run test --project main` | ✅ | ⬜ pending |
| 20-02-02 | 02 | 2 | ONBRD-03d | — | EPERM/EACCES shows Linux-actionable message | unit | `pnpm run test --project main` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Check if `Settings.test.tsx` exists for download_management extension — may need stubs for ONBRD-03b

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grep confirms no "Run as Administrator" in reachable Linux paths | ONBRD-03d | String audit, not runtime | `grep -r "Run as Administrator" src/ --include="*.ts" --include="*.tsx"` — verify only unreachable Win32-guarded hit in symlink_activator_elevate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
