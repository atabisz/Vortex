# Phase 35 — Execution DAG

**Phase:** 35 — build verification (v2.0.1)
**Branch:** v8.1/config-bucket
**Mode:** `--auto` (autonomous, sequential)
**Parallelization decision:** SEQUENTIAL (rationale below)
**Anchor finding:** D-35-01 branch A confirmed Σ(significant) = 0. Wave 1 collapses to a single `git rm` (−4154 LOC).

---

## Wave dependency graph

```
            ┌──────────────────────┐
            │ Wave 0 — readiness   │ (35-01) — verify Phase 34 done-gate still GREEN
            │  + lint baseline     │           capture master lint baseline
            │  + sanity checks     │           webpack-config + .chunks audits
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 1 — delete dead │ (35-02) — git rm DownloadManager.ts + DownloadObserver.ts
            │  code (D-35-01 br A) │           one chore() commit; renderer-bucket → 0
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 2 — typecheck   │ (35-03) — pnpm typecheck full sweep; per-bucket validation
            │  full sweep SYNC-35a │           verification-only; no commits
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 3 — lint        │ (35-04) — pnpm lint:ci + pnpm lint
            │  baseline-parity     │           produce 35-LINT-BASELINE.md (verification-only)
            │  SYNC-35b            │           parity proof: v8.1 errors ≤ master baseline
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 4 — test        │ (35-05) — pnpm test (Vitest); document Jest as orphan
            │  SYNC-35c            │           produce 35-VERIFY-RESULTS.md (verification-only)
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 5 — build       │ (35-06) — pnpm build + pnpm build:extensions
            │  SYNC-35d            │           bundledPlugins ≥ 130 floor (current=132)
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 6 — orphan      │ (35-07) — git rm src/main/electron-builder.config.json
            │  reconcile SYNC-35e  │           + structure.md:27 line removal; one chore() commit
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Wave 7 — done-gate   │ (35-08) — D-35-10 SYNC-35a..e checklist
            │  + closeout          │           STATE/ROADMAP update + master closeout SUMMARY
            └──────────────────────┘
```

## Parallelization rationale

D-35-09 says sequential is the recommended default and offers Claude's Discretion to collapse Waves 2–5 into parallel verifications. **Decision: keep sequential.**

Reasons:

1. **Audit ordering.** Each verification wave produces an artifact (`35-LINT-BASELINE.md`, `35-VERIFY-RESULTS.md`) bound to a single point-in-time HEAD. Parallelizing means multiple captures from different working trees — splitting the audit story.
2. **Cost is low.** With branch A delete-only (no rewire), the entire phase is verification-heavy and most waves are sub-minute. Sequential overhead is trivial.
3. **Failure containment.** If Wave 2 fails, we want Waves 3–5 paused and the audit clean. Sequential gives that automatically.
4. **CI pattern parity.** v8.0 P29 ran sequentially; matching shape makes the closeout SUMMARY trivially comparable.

If the operator decides to parallelize at execute time, the artifact ordering can be reconstructed post-hoc — but the planning decision is sequential.

---

## Coverage matrix (SYNC-35a..e → wave mapping)

| Requirement  | Definition                                         | Wave(s)                                                                 | Verification command(s)                                                                                                                                     |
| ------------ | -------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SYNC-35a** | `pnpm run typecheck` exits 0 across all workspaces | Wave 1 (closes renderer-bucket from 9 → 0) + Wave 2 (full sweep)        | `pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 \| grep -v TS1185 \| wc -l` → 0 (Wave 1); `pnpm run typecheck` exit 0 + per-bucket all 6 = 0 (Wave 2) |
| **SYNC-35b** | `pnpm run lint` baseline-parity with master        | Wave 0 (capture master baseline) + Wave 3 (capture v8.1 + parity proof) | `pnpm lint:ci` exit 0 AND v8.1 error count ≤ master baseline                                                                                                |
| **SYNC-35c** | `pnpm run test` exits 0 (Vitest + Jest)            | Wave 4                                                                  | `pnpm test` exit 0 (Vitest); Jest documented as orphan, deferred to Phase 36+                                                                               |
| **SYNC-35d** | `pnpm run build` exits 0                           | Wave 5                                                                  | `pnpm build` exit 0; `pnpm build:extensions` exit 0; `ls src/main/build/bundledPlugins/ \| wc -l` ≥ 130                                                     |
| **SYNC-35e** | Orphan `electron-builder.config.json` reconciled   | Wave 6                                                                  | `git rm src/main/electron-builder.config.json`; `structure.md:27` line removed; commit landed                                                               |

Every SYNC-35a..e maps to at least one wave with concrete verification commands. Goal-backward sanity check: GREEN.

---

## Wave commit count estimate

| Wave | Commits | What                                                                                                             |
| ---- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| 0    | 0       | Verification-only                                                                                                |
| 1    | 1       | `chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter`    |
| 2    | 0       | Verification-only                                                                                                |
| 3    | 0       | Verification-only (artifact written but `.planning/` is gitignored — emitted, not committed in this wave)        |
| 4    | 0       | Verification-only                                                                                                |
| 5    | 0       | Verification-only                                                                                                |
| 6    | 1       | `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs`                                   |
| 7    | 1–2     | `docs(35-08): summary — phase 35 done-gate roll-up` (paired STATE/ROADMAP commit `chore(state): close phase 35`) |

**Total: 3–4 SSH-signed commits across the entire phase.** Fewer than Phase 34 (140) because Phase 35 is verification-heavy; the actual code change is one `git rm` plus one orphan `git rm`.

The verification artifacts (`35-LINT-BASELINE.md`, `35-VERIFY-RESULTS.md`, `35-DONE-GATE.md`, `35-08-SUMMARY.md`) are all under `.planning/` (gitignored) — Wave 7 closeout commit uses `git add -f` to land them alongside STATE.md + ROADMAP.md.

---

## Critical constraints (carried into every PLAN.md)

- SSH-signed commits required (`~/.ssh/id_ed25519`); NEVER `--no-gpg-sign` or `--no-verify`
- `.planning/` is gitignored → `git add -f` for any planning-doc commits
- DO NOT push from sandbox; Phase 36 owns push + FF-merge + tag
- Casual project voice in docs/commits/PR comments
- Never reformat files outside change scope (minimize-diff)
- Bluebird Promise trap N/A for branch A (deletion removes the bluebird-importing files)
- bun/bunx for app commands; pnpm for repo; never npm/yarn/npx
- TypeScript only; never Python
- Branch: `v8.1/config-bucket`
- D-34-03: NO blanket `--ours`/`--theirs` shortcuts
- No `git stash` (Wave B trip lesson — use `git checkout -- <file>` or worktree if a quick branch swap is needed)
- Verify SSH signature post-commit: `git cat-file -p <sha> | grep -c '^gpgsig '` ≥ 1
