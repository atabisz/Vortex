---
phase: 35
wave: 7
plan_id: 35-08
title: "Wave 7 — done-gate + closeout (D-35-10)"
branch: v8.1/config-bucket
requirement_ids:
    - SYNC-35a
    - SYNC-35b
    - SYNC-35c
    - SYNC-35d
    - SYNC-35e
dependencies:
    - 35-07 # Wave 6 orphan delete must have landed
estimated_commits: 1 # paired SUMMARY + STATE/ROADMAP closeout (single commit OR adjacent commit pair — see Task 6)
---

# Wave 7 — D-35-10 done-gate + STATE/ROADMAP closeout + master SUMMARY

## Goal

Roll up the SYNC-35a..e evidence into a 7-criterion done-gate (D-35-10), produce the canonical Phase 35 closeout artifacts (`35-DONE-GATE.md` + master `35-08-SUMMARY.md`), update STATE.md + ROADMAP.md to mark Phase 35 closed, and land everything in one closeout commit (or a closely-paired commit pair). Phase 35 ends here. Phase 36 owns push + FF-merge + tag.

References: see `35-CONTEXT.md` D-35-10 (done-gate criteria); Phase 34 `34-09-SUMMARY.md` (template for the SUMMARY shape).

## Tasks

1. **Run the D-35-10 done-gate checklist verbatim.**
    - C1: `pnpm run typecheck` exits 0 — confirm via Wave 2 evidence + a fresh re-run.
    - C2: `pnpm run lint` baseline-parity proven (`v8.1 errors ≤ master baseline` AND `pnpm lint:ci` exit 0) — confirm via Wave 3 `35-LINT-BASELINE.md`.
    - C3: `pnpm run test` exits 0 (Vitest; Jest documented as ORPHAN) — confirm via Wave 4 evidence.
    - C4: `pnpm run build` exits 0 (renderer + main + preload + extensions); bundledPlugins ≥ 130 — confirm via Wave 5 evidence.
    - C5: `src/main/electron-builder.config.json` deleted; `pnpm package:nosign` smoke clean — confirm via Wave 6 commit + smoke note.
    - C6: STATE.md updated (Phase 35 [x]).
    - C7: ROADMAP.md updated (Phase 35 [x] + plan list checkbox roll-up).
    - All Phase 35 commits SSH-signed; zero `--no-verify`.

2. **Produce `35-DONE-GATE.md`.**
    - File: `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md`.
    - 7-criterion checklist with evidence anchors (commit SHAs, artifact paths) — mirrors Phase 34 `34-09-SUMMARY.md §2 D-34-14 done-gate evidence` shape.

3. **Confirm zero `--no-verify` across Phase 35 commits.**
    - The Phase 35 commit range is `<wave-1-commit-parent>..HEAD` — typically 3 or 4 commits across all waves (Wave 1 delete + Wave 6 orphan + Wave 7 closeout pair). All must be SSH-signed.

4. **Produce master closeout SUMMARY (`35-08-SUMMARY.md`).**
    - File: `.planning/phases/35-build-verification-v2-0-1/35-08-SUMMARY.md`.
    - Frontmatter shape: copy from `34-09-SUMMARY.md` adjusted for Phase 35 — phase: 35, plan: 08, wave: 7, requirement_ids: [SYNC-35a..e], phase_total_commits, phase_anchor_commit, key-files, key-decisions.
    - Body sections (mirrors 34-09):
        1. Header (one-paragraph framing).
        2. D-35-10 done-gate evidence (the 7-criterion table, with evidence anchors).
        3. SYNC-35a..e roll-up table (one row per requirement; commands; status; pointer to Wave artifact).
        4. Phase 35 commit log (ranged listing — `git log --oneline <anchor>~..HEAD`).
        5. Linux-guard surfaces preserved (carries the Phase 34 receipts list — Phase 35 didn't touch any of them, but the audit confirms).
        6. Bluebird-trap audit (N/A — Wave 1 deleted the bluebird-importing files; trap cannot fire).
        7. Validation (L1 markers / L2 harness / L3 buckets — same lens as Phase 34).
        8. Blockers (none) + next phase pointer (Phase 36 owns push + FF-merge + tag + cherry-pick).

5. **Update STATE.md + ROADMAP.md (paired closeout block).**
    - STATE.md: append `## Phase 35 — build verification v2.0.1` block (mirrors STATE.md current "Phase 34 — renderer + main spine merge resolution v2.0.1" block, lines 249–307). Update `## Current Position`, `last_activity`, `progress.completed_phases`, `progress.completed_plans`, `progress.percent`.
    - ROADMAP.md: tick `### Phase 35` checkbox, fill `**Status:**` line, populate the `Plans:` checklist with the eight Wave-NN plan files marked `[x]`. Bump milestone progress in the "v8.1 Upstream v2.0.1 Sync" line ("Phases 31–35 complete; 5/7 phases done"). Update the master "Progress" table row for Phase 35.
    - Tick the SYNC-35a..e checkboxes in `REQUIREMENTS.md` from `[ ]` to `[x]` for the five lines; update the Traceability table row for SYNC-35a–e.

6. **Closeout commit(s).**
    - **Preferred shape** (single commit, mirrors Phase 34 Wave 9 paired-commit-but-atomic intent):
        - One commit titled `chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN` touching `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, and `git add -f` for `.planning/phases/35-build-verification-v2-0-1/{35-DONE-GATE.md, 35-VERIFY-RESULTS.md, 35-LINT-BASELINE.md, 35-08-SUMMARY.md, 35-EXECUTION-DAG.md, 35-01-..35-08-WAVE-*.md, artifacts/*}` — single SSH-signed commit.
    - **Acceptable alternative** (matches Phase 34 cadence):
        - Commit 1 — `docs(35-08): summary — phase 35 build verification v2.0.1 closeout` adding the SUMMARY + DONE-GATE + plan files via `git add -f`.
        - Commit 2 — `chore(state): close phase 35 — build verification v2.0.1` updating STATE.md + ROADMAP.md + REQUIREMENTS.md.
    - Either path: SSH-signed, NEVER `--no-verify`.

7. **Post-commit verification.**
    - SSH-sig on every Phase 35 commit: `git log --pretty=format:'%H' <anchor>~..HEAD | xargs -I{} sh -c "git cat-file -p {} | grep -c '^gpgsig '"` — every line ≥ 1.
    - Repo-wide marker check: `git grep -nE '^(<{7}|={7}|>{7})( |$)' -- ':!.planning' | wc -l` = 0.
    - Final per-bucket typecheck: all six = 0.

## Verification commands

```bash
# Task 1 — D-35-10 done-gate verbatim re-run (cheap; final receipts)
pnpm run typecheck && echo "C1=PASS"
test -f .planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md \
  && grep -q 'SYNC-35b: PASS' .planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md \
  && echo "C2=PASS"
grep -q 'Test (SYNC-35c)' .planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md \
  && grep -q 'PASS' .planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md \
  && echo "C3=PASS"
grep -q 'Build (SYNC-35d)' .planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md \
  && echo "C4=PASS"
test ! -f src/main/electron-builder.config.json && echo "C5=PASS"

# Task 3 — SSH-sign + no-verify audit on the Phase 35 commit range
PHASE35_ANCHOR=$(git log --reverse --pretty=format:'%H %s' | grep 'chore(download_management): drop dead DownloadManager' | awk '{print $1}' | head -1)
git log --pretty=format:'%H' "$PHASE35_ANCHOR^..HEAD" | while read sha; do
  sig=$(git cat-file -p "$sha" | grep -c '^gpgsig ')
  echo "$sha: gpgsig=$sig"
done
# Expected: every line gpgsig≥1

# Final per-bucket typecheck
for cfg in \
  src/shared/tsconfig.json \
  src/preload/tsconfig.json \
  src/main/tsconfig.json \
  src/renderer/tsconfig.json \
  .github/actions/fingerprints/tsconfig.json \
  packages/e2e/tsconfig.json
do
  count=$(pnpm tsc -p "$cfg" --noEmit 2>&1 | grep -v TS1185 | wc -l)
  echo "$cfg: $count"
done
# Expected: all 0

# Marker audit
git grep -nE '^(<{7}|={7}|>{7})( |$)' -- ':!.planning' | wc -l
# Expected: 0

# Closeout commit (single-commit shape)
git add -f \
  .planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md \
  .planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md \
  .planning/phases/35-build-verification-v2-0-1/35-LINT-BASELINE.md \
  .planning/phases/35-build-verification-v2-0-1/35-08-SUMMARY.md \
  .planning/phases/35-build-verification-v2-0-1/35-EXECUTION-DAG.md \
  .planning/phases/35-build-verification-v2-0-1/35-01-WAVE-0-readiness.md \
  .planning/phases/35-build-verification-v2-0-1/35-02-WAVE-1-delete-dead-code.md \
  .planning/phases/35-build-verification-v2-0-1/35-03-WAVE-2-typecheck.md \
  .planning/phases/35-build-verification-v2-0-1/35-04-WAVE-3-lint.md \
  .planning/phases/35-build-verification-v2-0-1/35-05-WAVE-4-test.md \
  .planning/phases/35-build-verification-v2-0-1/35-06-WAVE-5-build.md \
  .planning/phases/35-build-verification-v2-0-1/35-07-WAVE-6-orphan.md \
  .planning/phases/35-build-verification-v2-0-1/35-08-WAVE-7-closeout.md \
  .planning/phases/35-build-verification-v2-0-1/artifacts/

git add STATE.md ROADMAP.md .planning/REQUIREMENTS.md

git commit -S -m "chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN

D-35-10 7/7 GREEN. SYNC-35a..e all ticked.

  C1 typecheck: pnpm run typecheck exit 0; six buckets all 0 (renderer 9→0 closed by Wave 1).
  C2 lint: pnpm lint:ci exit 0; v8.1 errors ≤ master baseline (Δ ≤ 0); see 35-LINT-BASELINE.md.
  C3 test: pnpm test exit 0 (Vitest); Jest documented as ORPHAN, deferred to Phase 36+.
  C4 build: pnpm build + pnpm build:extensions exit 0; bundledPlugins ≥ 130 (current 132).
  C5 orphan: src/main/electron-builder.config.json git-removed; structure.md:27 line dropped.
  C6 STATE: this commit.
  C7 ROADMAP: this commit (paired with REQUIREMENTS.md SYNC-35a..e ticks).

Phase 35 commits in range (SSH-signed, zero --no-verify):
  - chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter (Wave 1; −4154 LOC)
  - chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs (Wave 6)
  - this closeout

Phase 35 closed on v8.1/config-bucket. Phase 36 owns push + FF-merge + tag (v2.0.1-linux-rebased)
+ cherry-pick to linux-port + release-linux.yml AppImage + .deb.

Refs: D-35-00..D-35-10; SYNC-35a, SYNC-35b, SYNC-35c, SYNC-35d, SYNC-35e.
"

git cat-file -p HEAD | grep -c '^gpgsig '
# Expected: ≥ 1
```

## Commits

| #   | Title                                                                      | Body shape                                                                   | Signed                  | Files touched                                                                                                                                            |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN` | Pattern S5 with 7-criterion roll-up + commit-range list + next-phase pointer | SSH `~/.ssh/id_ed25519` | STATE.md, ROADMAP.md, .planning/REQUIREMENTS.md, plus `git add -f` for the 13 `.planning/phases/35-build-verification-v2-0-1/*.md` files + artifacts dir |

(If the operator prefers the two-commit Phase 34 cadence shape, split into `docs(35-08): summary — …` + `chore(state): close phase 35 — …` — both SSH-signed.)

## Expected Wave 7 done-gate signature

After Wave 7 completes, the v8.1/config-bucket HEAD chain (most recent first) reads roughly:

```
<sha-3> chore(state): close phase 35 — build verification v2.0.1 done-gate GREEN
<sha-2> chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs
<sha-1> chore(download_management): drop dead DownloadManager + DownloadObserver — superseded by IPCDownloadAdapter
<previous-HEAD = Phase 34 Wave 9 closeout commit>
```

All three commits SSH-signed (`gpgsig` block on each). D-35-10 7/7 GREEN. SYNC-35a..e all `[x]`. Branch unpushed; Phase 36 owns push + FF-merge + tag.

## Risks / contingencies

- **D-35-10 criterion regresses on the final re-run.** If `pnpm run typecheck` / `pnpm lint:ci` / `pnpm test` / `pnpm build` flips on the final re-verification, that's a sandbox-state issue (uncommitted local changes from prior waves leaking). Investigate the working-tree, re-clean, re-run. The gate is non-negotiable — Phase 35 cannot close with any criterion failing.
- **`PHASE35_ANCHOR` resolution** — if the anchor-commit grep heuristic fails (e.g. multiple commits with similar titles across history), use the explicit commit SHA from Wave 1's commit verification step. Don't over-engineer.
- **STATE/ROADMAP/REQUIREMENTS edits get tangled.** Carries Phase 34 Wave 9 idiom — make all three edits in a worktree, verify the diff is clean (only the closeout block changes, no spurious reformat), then commit. Minimize-diff applies.
- **Closeout commit count.** Single-commit and two-commit shapes both honor the "all SSH-signed, NEVER `--no-verify`" rule. Operator preference; either works.
- **Phase 35 plan files (this PLAN included) live under `.planning/`** — gitignored. Wave 7's `git add -f` is the only point at which they enter git history.
- **Push prohibition.** D-35-00 reaffirms: NO push from sandbox. Phase 36 owns push + FF-merge + tag. Even after the closeout commit lands, the operator does not push.

## Done criteria

1. D-35-10 7/7 GREEN per fresh re-run evidence captured in `35-DONE-GATE.md`.
2. `35-08-SUMMARY.md` master closeout SUMMARY emitted (mirrors `34-09-SUMMARY.md` shape).
3. STATE.md updated — Phase 35 closeout block, Current Position, last_activity, progress counters.
4. ROADMAP.md updated — Phase 35 `[x]`, plan list `[x]` × 8, milestone progress 5/7, Progress table row for Phase 35 = Complete.
5. REQUIREMENTS.md updated — SYNC-35a..e all `[x]`; Traceability row for SYNC-35a–e populated.
6. Closeout commit(s) landed and SSH-signed.
7. Final per-bucket typecheck all 0; markers outside `.planning/` = 0.
8. Phase 35 closed; Phase 36 unblocked (push + FF-merge + tag + cherry-pick).
