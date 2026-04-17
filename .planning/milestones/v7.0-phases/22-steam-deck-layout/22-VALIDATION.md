---
phase: 22
slug: steam-deck-layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (main/shared) + Jest (renderer) + SCSS build |
| **Config file** | `vitest.config.ts` / `src/renderer/jest.config.mjs` |
| **Quick run command** | `pnpm run build` (renderer bundle — catches SCSS compile errors) |
| **Full suite command** | `pnpm run build && pnpm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run build`
- **After every plan wave:** Run `pnpm run build && pnpm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | ONBRD-05b | — | N/A | grep | `grep -c "max-height: 90vh" src/renderer/src/stylesheets/dashlet.scss` | ✅ | ⬜ pending |
| 22-01-02 | 01 | 1 | ONBRD-05a | — | N/A | grep | `grep -c "@media.*max-height" src/renderer/src/stylesheets/dialog-steam-deck.scss` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | ONBRD-05a | — | N/A | grep | `grep -c "dialog-steam-deck" src/renderer/src/stylesheets/style.scss` | ✅ | ⬜ pending |
| 22-01-04 | 01 | 1 | ONBRD-05a,05b | — | N/A | build | `pnpm run build` exits 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/renderer/src/stylesheets/dialog-steam-deck.scss` — new file (created by task 22-01-02)

*All other files already exist. Existing build infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overlay bottom edge stays within 800px viewport | ONBRD-05b | Requires visual check at 1280×800 resolution in Electron | Launch Vortex, resize window to 1280×800, trigger onboarding overlay, verify no clipping |
| Modal action buttons reachable without scrolling | ONBRD-05a | Requires visual check at 1280×800 resolution in Electron | Launch Vortex, resize window to 1280×800, trigger onboarding modal, verify buttons visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
