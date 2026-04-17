---
phase: 21
slug: mod-install-round-trip-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `src/renderer/vitest.config.mts` |
| **Quick run command** | `pnpm run test --project src/renderer` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run test --project src/renderer`
- **After every plan wave:** Run `pnpm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | ONBRD-04 | — | N/A | unit | `pnpm run test --project src/renderer -- --reporter=verbose src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | ONBRD-04 | — | N/A | unit | `pnpm run test --project src/renderer -- --reporter=verbose src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-01 | 02 | 2 | ONBRD-04 | — | N/A | manual | N/A (docs/planning update) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/renderer/src/extensions/hardlink_activator/hardlink_activator.test.ts` — covers ONBRD-04 hardlink isSupported logic
  - Assertion (a): ENOENT in staging dir → `isSupported` returns `undefined` (supported)
  - Assertion (b): skyrimse in symlink Gamebryo blocklist → symlink `isSupported` returns IUnavailableReason
  - Assertion (c): non-ENOENT stat error → `isSupported` returns "not initialized" reason

*Existing infrastructure (Vitest + vitest.config.mts) covers the framework. Only the test file is missing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full round-trip: install mod → deploy via hardlink → enable for Skyrim SE on Proton | ONBRD-04 | Requires hardware with Steam + Proton + Skyrim SE installed | See Phase 999.1 UAT backlog entry for step-by-step instructions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
