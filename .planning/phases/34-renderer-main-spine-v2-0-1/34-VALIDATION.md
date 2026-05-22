---
phase: 34
slug: renderer-main-spine-v2-0-1
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-23
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase is a brownfield merge-resolution sweep — validation is binary at three layers (L1 markers / L2 harness / L3 per-bucket typecheck). No new Vitest/Jest tests are written in Phase 34; full suite runs are deferred to Phase 35 per D-34-20.

---

## Test Infrastructure

| Property               | Value                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.0 (renderer/main/shared) + Jest 29.7.0 (legacy) — used at Phase 35 only                 |
| **Config file**        | `vitest.config.ts` (root project array); per-bucket `tsconfig.json` for L3                         |
| **Quick run command**  | `pnpm tsc -p <ws>/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l` (per-bucket; expected 0) |
| **Full suite command** | Deferred to Phase 35 (`pnpm run typecheck` / `lint` / `test` / `build`) per D-34-20                |
| **Estimated runtime**  | ~30–60 s per bucket typecheck; ~5–6 invocations across the phase                                   |

---

## Sampling Rate

- **After every task commit (file resolve):** No per-file typecheck — D-34-06 cadence is per-bucket.
- **After every plan wave:** Run that wave's bucket-scoped `pnpm tsc -p <ws>/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l` AND harness in `--skip-conflict-check` mode.
- **Before `/gsd:verify-work` (D-34-14 done-gate):** L1 + L2 (full mode, no skip) + L3 across all six TS workspaces, all GREEN.
- **Max feedback latency:** ~60 s (per-bucket typecheck wall-time).

---

## Per-Task Verification Map

Phase 34 is a 117-file atomic-resolution sweep. Per-file verification is L1 (post-commit `git grep` returns zero markers in the resolved file) plus the wave-end L2/L3 sweep — not per-task unit tests. The map below uses wave-level rows.

| Task ID | Plan | Wave                     | Requirement | Threat Ref | Secure Behavior                                                                    | Test Type                                         | Automated Command                                                                               | File Exists | Status     |
| ------- | ---- | ------------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 34-A    | TBD  | A (shared)               | SYNC-34a    | —          | Shared spine resolved; error classes preserved at `src/shared/src/types/errors.ts` | bucket-typecheck                                  | `pnpm tsc -p src/shared/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l`                 | ✅ verified | ⬜ pending |
| 34-B    | TBD  | B (preload)              | SYNC-34a    | —          | Preload IPC bridge resolved                                                        | bucket-typecheck                                  | `pnpm tsc -p src/preload/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l`                | ✅ verified | ⬜ pending |
| 34-C    | TBD  | C (main)                 | SYNC-34a    | —          | Main spine resolved; Linux platform guards preserved                               | bucket-typecheck                                  | `pnpm tsc -p src/main/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l`                   | ✅ verified | ⬜ pending |
| 34-D    | TBD  | D (renderer leaves)      | SYNC-34a    | —          | Renderer leaves resolved; bluebird trap avoided on 7 risk files                    | bucket-typecheck                                  | `pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l`               | ✅ verified | ⬜ pending |
| 34-E    | TBD  | E (renderer extensions)  | SYNC-34a    | —          | Renderer extensions (incl. `nexus_integration`) resolved                           | bucket-typecheck                                  | `pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l`               | ✅ verified | ⬜ pending |
| 34-F    | TBD  | F (renderer views/pages) | SYNC-34a    | —          | `renderer.tsx` resolved; D-34-17 native-errors trigger evaluated                   | bucket-typecheck + commit-body audit              | `pnpm tsc -p src/renderer/tsconfig.json --noEmit ...` AND grep `nativeErr` import disposition   | ✅ verified | ⬜ pending |
| 34-G    | TBD  | G (repo-wide leaves)     | SYNC-34a    | —          | fingerprints + e2e + top-level docs resolved                                       | bucket-typecheck (e2e) + `node --check` (scripts) | `pnpm tsc -p packages/e2e/tsconfig.json --noEmit ...` AND `node --check scripts/*.ts`           | ✅ verified | ⬜ pending |
| 34-H    | TBD  | H (R2 + done-gate)       | SYNC-34b    | —          | `src/renderer/src/__mocks__/` removed; SYNC-34b documented                         | doc-level + dir-absence                           | `[ ! -d src/renderer/src/__mocks__ ]` AND `grep -q 'SYNC-34b.*\[x\]' .planning/REQUIREMENTS.md` | ✅ verified | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

Per-file rows will be enumerated in the wave-level PLAN.md files emitted by the planner (one row per atomic-commit file). The L1+L2+L3 commands above are the verification surface for every file in that wave; per-file evidence is captured in commit bodies per D-34-08.

---

## Wave 0 Requirements

- [ ] Copy Phase 33 harness `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh` → `.planning/phases/34-renderer-main-spine-v2-0-1/scripts/grep-checkpoint.sh` per D-34-04.
- [ ] Append **gate 13** (single-host `getIPCPath`) to copied harness; keep existing 12 gates intact.
    - Gate 13 sentinel: `grep -c '^export function getIPCPath' src/renderer/src/util/ipc.ts == 1` AND `grep -c 'import.*getIPCPath.*from.*ipc' src/renderer/src/{ExtensionManager,extensions/symlink_activator_elevate/index,util/{elevated,fs}}.ts >= 4`.
- [ ] Verify harness `--skip-conflict-check` mode passes 12/12 GREEN against working tree at Wave 0 close.
- [ ] No new test framework install — Vitest already in place.

---

## Manual-Only Verifications

| Behavior                                                                             | Requirement                  | Why Manual                                                                                     | Test Instructions                                                                                                                |
| ------------------------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Process-boot path on Linux (Application, cli, errorReporting, autoupdater, TrayIcon) | SYNC-34a success criterion 1 | Requires running Electron binary on real hardware; deferred to Phase 999.1 backlog per D-34-19 | Hardware UAT in Phase 999.1: launch built AppImage on Linux desktop + Steam Deck; verify boot path + tray + autoupdater surfaces |
| AppImage / .deb produce-and-launch                                                   | Phase 35 (`pnpm run build`)  | Build pipeline scoped to Phase 35 per D-34-20                                                  | Phase 35 will exercise full `pnpm run build` and CI release-linux.yml                                                            |

---

## Validation Sign-Off

- [x] All wave tasks have an `<automated>` verify command (L1 + L2 + L3) or are explicitly deferred to Phase 35 / 999.1.
- [x] Sampling continuity: per-bucket typecheck runs at every wave end; no 3 consecutive waves without automated verify.
- [x] Wave 0 covers all MISSING references (harness copy + gate 13).
- [x] No watch-mode flags (all commands single-shot).
- [x] Feedback latency < 60 s per bucket typecheck.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-05-23 (auto-mode per `--auto --no-transition`).
