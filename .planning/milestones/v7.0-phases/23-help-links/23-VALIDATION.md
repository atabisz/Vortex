---
phase: 23
slug: help-links
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (main process), jest (renderer) |
| **Config file** | `vitest.config.ts` (main), `src/renderer/jest.config.mjs` (renderer) |
| **Quick run command** | `pnpm --filter @vortex/main test run src/main/src/open.test.ts` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @vortex/main test run src/main/src/open.test.ts`
- **After every plan wave:** Run `pnpm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 0 | ONBRD-06b | — | N/A | unit | `pnpm --filter @vortex/main test run src/main/src/open.test.ts` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | ONBRD-06a | — | N/A | unit | `pnpm --filter @vortex/main test run src/main/src/open.test.ts` | ✅ after W0 | ⬜ pending |
| 23-01-03 | 01 | 1 | ONBRD-06b | — | N/A | unit | `pnpm --filter @vortex/main test run src/main/src/open.test.ts` | ✅ after W0 | ⬜ pending |
| 23-01-04 | 01 | 2 | ONBRD-06b | — | N/A | manual | See Manual-Only Verifications | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/main/src/open.test.ts` — test stubs for `openUrl` error path (ONBRD-06b) and URL routing (ONBRD-06a)

*Existing vitest infrastructure covers main process. Jest covers renderer. No new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Notification appears in UI when browser open fails | ONBRD-06b | Requires running Electron and triggering a shell.openExternal failure | 1. Launch Vortex on SteamOS or set `DISPLAY` to invalid. 2. Click "Get Help". 3. Verify warning notification shows "Could not open browser" with the URL inline. |

*All other behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
