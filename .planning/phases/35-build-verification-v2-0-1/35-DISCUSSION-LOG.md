# Phase 35: Build verification (v2.0.1) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 35-build-verification-v2-0-1
**Mode:** `--auto` (single-pass; recommended-default selection per `modes/auto.md`)
**Areas discussed:** download_management reconciliation strategy, R3 orphan disposition, lint baseline philosophy, wave ordering

---

## Download_management reconciliation strategy

| Option                    | Description                                                                                                                                                                                                                                                | Selected                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A — delete-and-rewire     | Adopt upstream `0743774cd "Remove old downloader"` decision. Delete `DownloadManager.ts` + `DownloadObserver.ts` + missing `FileAssembler.ts`/`SpeedCalculator.ts` references; rewire callers to upstream `src/main/src/downloading/manager.ts` IPC spine. | ✓ (default; recommended)                                                     |
| B — surgical patch        | Restore `FileAssembler.ts` + `SpeedCalculator.ts` byte-for-byte from `8b5a9f675`; fix `IDownload.chunks` + arg-count drift in `DownloadObserver.ts` only. Keep renderer-side downloader.                                                                   | (escalation only — if researcher finds ≥3 callers cannot be cleanly rewired) |
| C — defer to Phase 35-bis | Suppress 9 errors with `// @ts-expect-error`; punt to a follow-up.                                                                                                                                                                                         | (rejected — perpetuates dead code, violates SYNC-35a contract)               |

**Auto-selected:** A — delete-and-rewire (recommended default).
**Notes:** Upstream's `0743774cd` is the canonical decision; the Phase 25 SYNC-14 restore was a transitional accept-as-surprise. Branch A is the on-mission convergence. Researcher dispatched at Wave 0 to map callers; planner escalates to B explicitly with rationale only if Σ(significant rewires) ≥ 3. Linux-fork invariants (playbook §1/§3/§4/§5/§6/§7/§10) do not live inside the deleted files — confirmed by Phase 34 D-34-14 inventory.

---

## R3 orphan disposition (`src/main/electron-builder.config.json`)

| Option  | Description                                                                                            | Selected                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Delete  | `git rm` the orphan; `package.json` scripts already use `.cjs` exclusively. Confirmed orphan via grep. | ✓ (recommended)                                                            |
| Keep    | Leave the v2.0.1 addition in place; document as pre-`pnpm dist` cleanup.                               |                                                                            |
| Convert | Migrate `.cjs` → `.json` to match upstream layout.                                                     | (rejected — `.cjs` is needed for `forceCodeSigning` + `sign.cjs` callable) |

**Auto-selected:** Delete.
**Notes:** 31-01-SUMMARY hedged ("do not delete in v8.1") because Phase 31 didn't have the bandwidth to verify orphan-ness. We have it now. Pre-deletion grep confirms zero references.

---

## Lint baseline-parity philosophy

| Option                                   | Description                                                                                                                                          | Selected                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Baseline-parity (`v8.1 errors ≤ master`) | Carries v8.0 P29 D-29-XX philosophy: `−N` delta vs master is PASS, not regression. Pre-existing master errors are not introduced by the v2.0.1 sync. | ✓ (recommended)                                            |
| Strict zero-error                        | Drive all lint errors to zero.                                                                                                                       | (rejected — out of scope for this phase per minimize-diff) |
| Skip lint                                | Defer to Phase 36 / 37.                                                                                                                              | (rejected — SYNC-35b explicitly requires it)               |

**Auto-selected:** Baseline-parity.
**Notes:** Mirrors v8.0 P29 SYNC-32 handling. Capture `35-LINT-BASELINE.md` as separate artifact (planner discretion).

---

## Wave ordering

| Option              | Description                                                                   | Selected                                              |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| Sequential 7-wave   | Researcher → reconcile → typecheck → lint → test → build → orphan → done-gate | ✓ (recommended)                                       |
| Parallelized 4-wave | Lint/test/build run in parallel after typecheck closes                        | (planner-discretion fallback if wave-7 timing pushes) |

**Auto-selected:** Sequential 7-wave (D-35-09).
**Notes:** Sequential is safer because the reconciliation in Wave 1 changes file shape; running parallel verifies before reconciliation completes invites flake. Planner may collapse 2–5 if the reconciliation lands clean.

---

## Claude's Discretion

- Researcher's specific file-level rewire map for D-35-01.
- Whether to escalate D-35-01 from branch A to branch B (escalation must be explicit).
- Whether `35-LINT-BASELINE.md` is a separate artifact or inlined in `35-VERIFY-RESULTS.md`.
- Wave 2–5 parallelization (planner decides after seeing the reconciliation diff size).

## Deferred Ideas

- AppImage + .deb local boot — Phase 36 / Phase 999.1.
- `release-linux.yml` CI verification — Phase 36.
- Cherry-pick to `linux-port` — Phase 36.
- Reformatting download_management files outside reconciliation scope — explicitly out of scope.
- SYNC-37 carry-forward UAT — Phase 37.
- R1 lockfile-drift contingency — handle reactively if it triggers.
