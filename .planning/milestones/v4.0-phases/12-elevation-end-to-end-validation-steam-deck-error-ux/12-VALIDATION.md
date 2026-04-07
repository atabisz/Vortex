---
phase: 12
slug: elevation-end-to-end-validation-steam-deck-error-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `src/renderer/vitest.config.mts` |
| **Quick run command** | `pnpm --filter src/renderer run test -- --reporter=verbose src/renderer/src/util/elevated.test.ts` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter src/renderer run test -- src/renderer/src/util/elevated.test.ts`
- **After every plan wave:** Run `pnpm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 0 | ELEV-06 | — | N/A | unit | `pnpm --filter src/renderer run test -- src/renderer/src/util/elevated.test.ts` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | ELEV-06 | — | Notification fires before reject; UserCanceled type preserved | unit | `pnpm --filter src/renderer run test -- src/renderer/src/util/elevated.test.ts` | ✅ | ⬜ pending |
| 12-01-03 | 01 | 1 | ELEV-06 | — | Both error paths (close + error) fire notifier | unit | `pnpm --filter src/renderer run test -- src/renderer/src/util/elevated.test.ts` | ✅ | ⬜ pending |
| 12-01-04 | 01 | 1 | ELEV-05 | — | N/A — manual UAT | manual | HUMAN-UAT.md | ✅ (created) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add `_setNotifier` / `_setNotifier(undefined)` afterEach cleanup to `src/renderer/src/util/elevated.test.ts`
- [ ] Add test: SteamOS `sudo -n` exit non-zero fires notifier with `type: "error"` and message containing "Game Mode"
- [ ] Add test: SteamOS `sudo` ENOENT fires notifier with `type: "error"` and message containing "Game Mode"
- [ ] Add test: error thrown is still `UserCanceled` (regression guard for D-05)

*Existing infrastructure in `elevated.test.ts` covers all phase requirements — only new test cases needed, no new files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All user-triggered elevation ops complete on desktop Linux (Gnome/KDE) | ELEV-05 | Requires real hardware with polkit agent | Follow HUMAN-UAT.md checklist: (1) Deploy a mod with hardlinks, (2) Repair permissions, (3) Create symlinks. Confirm no crash or hang. Session token from Phase 11 should suppress re-prompts. |
| SteamOS notification appears and is dismissible | ELEV-06 | Requires SteamOS Game Mode environment | Simulate by setting `ID=steamos ID_LIKE=arch` in os-release and forcing `sudo -n` exit 1. Or verify on hardware. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
