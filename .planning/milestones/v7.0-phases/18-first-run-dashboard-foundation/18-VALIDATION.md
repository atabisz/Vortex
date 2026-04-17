---
phase: 18
slug: first-run-dashboard-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` (root, project array) |
| **Quick run command** | `pnpm vitest run --reporter=verbose 2>&1 | tail -40` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose 2>&1 | tail -40`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-W0-01 | W0 | 0 | ONBRD-01a | — | N/A | unit stub | `pnpm vitest run __tests__/todos.test.tsx` | ❌ W0 | ⬜ pending |
| 18-W0-02 | W0 | 0 | ONBRD-01b | — | N/A | unit stub | `pnpm vitest run __tests__/getDriveList.test.ts` | ❌ W0 | ⬜ pending |
| 18-W0-03 | W0 | 0 | ONBRD-01c | — | N/A | unit stub | `pnpm vitest run __tests__/todos.test.tsx` | ❌ W0 | ⬜ pending |
| 18-W0-04 | W0 | 0 | ONBRD-01d | — | N/A | unit stub | `pnpm vitest run __tests__/NoGameDashlet.test.tsx` | ❌ W0 | ⬜ pending |
| 18-W0-05 | W0 | 0 | ONBRD-01e | — | N/A | unit stub | `pnpm vitest run src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` | ❌ W0 | ⬜ pending |
| 18-01-01 | 01 | 1 | ONBRD-01a | — | N/A | unit | `pnpm vitest run __tests__/todos.test.tsx` | ✅ | ⬜ pending |
| 18-02-01 | 02 | 1 | ONBRD-01b | — | N/A | unit | `pnpm vitest run __tests__/getDriveList.test.ts` | ✅ | ⬜ pending |
| 18-03-01 | 03 | 1 | ONBRD-01c | — | N/A | unit | `pnpm vitest run __tests__/todos.test.tsx` | ✅ | ⬜ pending |
| 18-04-01 | 04 | 1 | ONBRD-01d | — | N/A | unit | `pnpm vitest run __tests__/NoGameDashlet.test.tsx` | ✅ | ⬜ pending |
| 18-05-01 | 05 | 1 | ONBRD-01e | — | N/A | unit | `pnpm vitest run src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/todos.test.tsx` — stubs for ONBRD-01a (instPath/dlPath crash) and ONBRD-01c (manual-scan todo guard)
- [ ] `__tests__/getDriveList.test.ts` — stubs for ONBRD-01b (Linux drive list fallback)
- [ ] `__tests__/NoGameDashlet.test.tsx` — stubs for ONBRD-01d (empty-state Refresh guidance)
- [ ] `src/renderer/src/extensions/gamemode_management/GameModeManager.test.ts` — stubs for ONBRD-01e (Steam retry on empty)

*All four test files are missing — Wave 0 must create them before implementation tasks run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Steam retry fires automatically when Vortex launches before Steam finishes | ONBRD-01e | Requires real Steam install + timing to reproduce | Launch Vortex before Steam, observe games appear after ~30s without restart |
| Linux mount points (`/home`, `/media`) shown (not `C:`) in game-search dialog | ONBRD-01b | Requires Linux environment with mounted drives | Open game discovery dialog, verify drive list shows Linux paths |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
