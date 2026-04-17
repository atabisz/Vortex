---
phase: 19
slug: staging-directory-wiring
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-16
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `src/renderer/vitest.config.mts` |
| **Quick run command** | `pnpm vitest run src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` |
| **Full suite command** | `pnpm vitest run --project renderer` |
| **Estimated runtime** | ~15 seconds (quick) / ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run src/renderer/src/extensions/firststeps_dashlet/todos.test.ts`
- **After every plan wave:** Run `pnpm vitest run --project renderer`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-00-01 | 00 | 0 | ONBRD-02b, ONBRD-02c | — | N/A | unit stub | `pnpm vitest run src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` and `pnpm vitest run src/renderer/src/extensions/mod_management/texts.test.ts` | Created by 19-00 | pending |
| 19-00-02 | 00 | 0 | ONBRD-02d | — | N/A | unit stub | `pnpm vitest run src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` | Created by 19-00 | pending |
| 19-01-01 | 01 | 1 | ONBRD-02a | — | N/A | unit | `pnpm vitest run src/renderer/src/extensions/firststeps_dashlet/todos.test.ts` | Yes | pending |
| 19-01-02 | 01 | 1 | ONBRD-02b, ONBRD-02c | T-19-01, T-19-02, T-19-03 | Recursive walk terminates at root; no user input in strings | unit | `pnpm vitest run src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` and `pnpm vitest run src/renderer/src/extensions/mod_management/texts.test.ts` | Wave 0 (19-00) | pending |
| 19-02-01 | 02 | 2 | ONBRD-02d | T-19-04, T-19-06 | While loop terminates at root or dev change | unit | `pnpm vitest run src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` | Wave 0 (19-00) | pending |
| 19-02-02 | 02 | 2 | ONBRD-02d | T-19-05, T-19-06 | While loop terminates; outer catch handles errors | structural | `grep -n 'process\.platform !== .win32.' Settings.tsx && grep -n 'modDirStat' Settings.tsx && grep -n 'let mountpoint = modPaths' Settings.tsx && grep -n 'parentStat\.dev !== modDirStat\.dev' Settings.tsx && grep -n 'if (parent === mountpoint) break' Settings.tsx` | N/A (structural) | pending |

*Status: pending / green / red / flaky*

---

## Structural-Only Verification Rationale

| Task ID | File | Rationale |
|---------|------|-----------|
| 19-02-02 | `Settings.tsx` | `suggestPath()` is a private method on a Redux-connected React class component (`Settings extends ComponentEx`) with dependencies on `this.props` (Redux connect HOC), `window.api.app.getPath()` (Electron preload bridge), and `this.changePath()` (component instance method). Behavioral unit testing in isolation would require mocking the full React component lifecycle, Redux store, and Electron preload API -- not feasible for a targeted platform guard change. Structural grep checks confirm the 5 critical code markers are present: platform guard, device stat, mountpoint walk init, device-change break condition, and root-reached guard. The parallel logic in `discovery.ts:suggestStagingPath()` (Task 19-02-01) IS behaviorally tested via discovery.test.ts. |

---

## Wave 0 Requirements

Wave 0 is covered by **19-00-PLAN.md** which creates:
- [x] `src/renderer/src/extensions/mod_management/stagingDirectory.test.ts` -- stubs for ONBRD-02b (partition check Linux path)
- [x] `src/renderer/src/extensions/mod_management/texts.test.ts` -- stubs for ONBRD-02c (string platform guards)
- [x] `src/renderer/src/extensions/gamemode_management/util/discovery.test.ts` -- stubs for ONBRD-02d (device-aware suggestStagingPath)

*Existing infrastructure (todos.test.ts) covers ONBRD-02a -- update only, no new file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Staging todo cards render on Linux with correct path labels | ONBRD-02a | Requires running Vortex on Linux and inspecting the firststeps dashlet | Launch Vortex on Linux; confirm mod-location and download-location todo cards are visible with the correct staging path displayed |
| "Missing directory" dialog appears when staging dir doesn't exist on Linux | ONBRD-02b | Requires Linux runtime and a non-existent staging path | Set staging dir to a path that doesn't exist on Linux; re-launch Vortex; confirm the "missing directory" dialog appears (not a silent error) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (19-00-PLAN.md creates all three test files)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] Task 19-02-02 structural-only verify documented with rationale
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution of 19-00-PLAN.md
