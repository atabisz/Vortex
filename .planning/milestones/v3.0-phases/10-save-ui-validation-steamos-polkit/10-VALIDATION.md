---
phase: 10
slug: save-ui-validation-steamos-polkit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `pnpm vitest run --reporter=verbose src/extensions/gamebryo-savegame-management` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~30 seconds (quick) / ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose src/extensions/gamebryo-savegame-management`
- **After every plan wave:** Run `pnpm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SAVE-02 | unit | `pnpm vitest run --reporter=verbose src/extensions/gamebryo-savegame-management` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | SAVE-03 | unit | `pnpm vitest run --reporter=verbose src/extensions/gamebryo-savegame-management` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | SAVE-04 | unit | `pnpm vitest run --reporter=verbose src/extensions/gamebryo-savegame-management` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 2 | ELEV-02 | unit | `pnpm vitest run --reporter=verbose src/main` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 2 | ELEV-03 | manual | n/a — requires .deb packaging | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/extensions/gamebryo-savegame-management/__tests__/mygamesPath.test.ts` — stubs for SAVE-02, SAVE-03, SAVE-04
- [ ] `src/main/__tests__/elevated.linux.test.ts` — stubs for ELEV-02

*Existing vitest infrastructure covers most; new test files needed for new Linux code paths.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `.deb` installs polkit action file | ELEV-03 | Requires actual Debian package installation | Build `.deb` via `pnpm run package`, install with `dpkg -i`, verify `ls /usr/share/polkit-1/actions/io.nexusmods.vortex.policy` |
| SteamOS elevation notification | ELEV-02 | Requires SteamOS environment / Steam Deck | On SteamOS game mode, trigger elevation, verify notification appears rather than hang |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
