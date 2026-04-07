---
phase: 9
slug: native-addon-fix-elevation-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (renderer) + pnpm rebuild verification |
| **Config file** | `src/renderer/vitest.config.mts` |
| **Quick run command** | `pnpm --filter renderer test -- --run src/renderer/src/util/elevated.test.ts` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~30 seconds (quick) / ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | SAVE-01 | native build | `@electron/rebuild --module-dir ... 2>&1 \| grep -c "Rebuild Complete"` | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 1 | SAVE-01 | ldd check | `ldd node_modules/gamebryo-savegame/build/Release/gamebryosavegame.node \| grep -E "lz4\|libz"` | ❌ W0 | ⬜ pending |
| 9-01-03 | 01 | 1 | SAVE-01 | pnpm patch | `pnpm install 2>&1 \| grep -v "warn"` | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | ELEV-01 | unit | `pnpm --filter renderer test -- --run src/renderer/src/util/elevated.test.ts` | ❌ W0 | ⬜ pending |
| 9-02-02 | 02 | 2 | ELEV-01 | CI integration | `grep -c "zlib1g-dev" .github/workflows/main.yml` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/renderer/src/util/elevated.test.ts` — unit tests for pkexec Linux branch (cancel → UserCanceled, success → resolves, spawner seam injectable)
- [ ] CI apt-get step in `.github/workflows/main.yml` — must include `zlib1g-dev` before gamebryo-savegame rebuild can pass

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| pkexec Cancel returns UserCanceled on live system | ELEV-01 | Requires real pkexec binary and polkit agent | Run Vortex on Linux, trigger elevation, click Cancel — verify UI shows error, no hang |
| gamebryo-savegame.node loads in Electron | SAVE-01 | Electron V8 incompatible with plain node for require() | Launch Vortex on Linux, open Save Games panel — verify no "module not found" error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
