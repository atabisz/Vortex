# Phase 30: Land + tag - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Branch:** `v8.0/config-bucket` @ `355158381` (Phase 29 done; remote `fork/sync/upstream-v2.0.0` synced; PR #4 OPEN MERGEABLE)

<domain>
## Phase Boundary

Land the resolved-merge content (`v8.0/config-bucket` HEAD `355158381`) on `master`, tag it canonically, mirror the Linux-only commits to `linux-port`, and capture the milestone post-mortem in the playbook. No new code; this is the publish/release plumbing for the v8.0 sync.

**Scope:** SYNC-35, SYNC-36, SYNC-37, SYNC-38, SYNC-39 (5 of 5 requirements).
**Carries forward from Phase 29:** SYNC-33 part C (AppImage + .deb local boot) + SYNC-34 four-screenshot Skyrim walkthrough — both deferred against the canonical (non-RC) tag's artefacts. They run as acceptance gates after `release-linux.yml` republishes against `v2.0.0-linux-rebased`.

## Success criteria (≤6, measurable)

1. **SYNC-35:** Windows CI (`main.yml` `windows-latest` matrix) green on the post-rebase / post-FF master commit. The two PR-#4-pending Main checks at `26260569344` are the live signal.
2. **SYNC-36:** PR #4 fast-forward merged (`gh pr merge 4 --merge=fast-forward` or equivalent) and closed; `git merge-base master <new-head>` equals the new head (linear history).
3. **SYNC-37:** Annotated SSH-signed tag `v2.0.0-linux-rebased` exists on the post-FF master HEAD; pushed to `origin`/`fork`; `release-linux.yml` re-runs and publishes a Linux Beta release with AppImage + .deb under canonical (non-RC) names.
4. **SYNC-38:** Linux-only commits cherry-picked onto `linux-port` per existing branch policy (excludes `.planning/`, `.github/workflows/release-linux.yml`, fork-only CI, fingerprint-disable commits); `linux-port` HEAD pushed.
5. **SYNC-39:** `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with deltas surfaced through Phases 24–29; commit-index table refreshed with the new master + linux-port SHAs.
6. **Phase 29 deferred items closed:** SYNC-33 part C (AppImage + .deb local boot — chmod+x, sudo apt install, desktop-entry launch, screenshots) + SYNC-34 four-screenshot Skyrim walkthrough captured against the canonical tag's release artefacts and folded into `30-SMOKE-EVIDENCE.md` (or appended to `29-SMOKE-EVIDENCE.md` with a Phase 30 timestamp).

## Requirements (≥1)

- **SYNC-35:** Windows CI green on the resolved merge commit (master post-FF)
- **SYNC-36:** PR #4 (`atabisz/Vortex#4`) merged into master via fast-forward
- **SYNC-37:** Tag `v2.0.0-linux-rebased` created on the merge commit
- **SYNC-38:** Linux-only commits cherry-picked from master to `linux-port` branch per existing branch policy
- **SYNC-39:** `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated; commit-index table refreshed
- **Phase 29 carry-forward:** SYNC-33 part C local boot + SYNC-34 four-screenshot Skyrim walkthrough against canonical tag artefacts

## Reusable assets (4 confirmed)

- **`release-linux.yml`:** triggered on tag push `v*` — same pipeline that produced the RC artefacts in Phase 29 (run [26259632336](https://github.com/atabisz/Vortex/actions/runs/26259632336), 10m58s wall-clock). Will re-run automatically when `v2.0.0-linux-rebased` is pushed; produces canonical-named AppImage + .deb assets.
- **PR #4 (`atabisz/Vortex#4`):** OPEN, MERGEABLE, base `master`, head `sync/upstream-v2.0.0` @ `355158381`. Two Main checks (Linux + Windows) currently IN_PROGRESS at run [26260569344](https://github.com/atabisz/Vortex/actions/runs/26260569344). Format check at run [26260569333](https://github.com/atabisz/Vortex/actions/runs/26260569333).
- **Linux-port branch policy** (CLAUDE.md): exclude `.planning/`, AppImage/.deb build config, GitHub Actions distribution CI, fork-specific IDE config. Past v6.0/v7.0 cherry-pick passes used this policy directly — pattern is established.
- **VORTEX-LINUX-MERGE-PLAYBOOK.md:** existing playbook with §1–§10 invariants. Already extended in Phases 24–29 via `grep-checkpoint.sh` gates. Phase 30 captures the **post-mortem deltas** (idioms, traps, patterns) surfaced through milestone resolution.

## Boundaries

- **In scope:** rebase + FF-merge of PR #4; canonical tag creation + push; linux-port cherry-pick pass; playbook update; RC tag cleanup (per D-29-04); Phase 29 deferred SYNC-33 part C + SYNC-34 evidence capture against canonical tag.
- **Out of scope:**
    - Source modifications. If Windows CI surfaces a real bug, file as a follow-up phase deviation, not a Phase 30 in-line fix unless the fix is one-line and obvious.
    - New Linux-port features (those belong in v8.1 or v9.0 milestones).
    - PR #4 description / changelog content edits (those happen at milestone-audit step, not Phase 30 plumbing).
    - upstream Nexus-Mods/Vortex PR (per memory `project_upstream_pr_policy.md` — not accepting fork PRs right now; design fork-local).

</domain>

## Decisions

### D-30-01: Land strategy — rebase v8.0 onto master, force-push, then FF-merge

**Choice:** rebase the 374 v8.0 commits onto master HEAD `db8035192`, force-push `sync/upstream-v2.0.0` (lease pinned to `355158381`), then `gh pr merge 4 --merge=fast-forward`.

**Why:** matches ROADMAP success criterion #2 verbatim ("PR #4 fast-forward merged"). Cleanest history — linear master timeline, no merge commit, downstream `git log` reads naturally. Master is +20 commits ahead along a divergent lineage (Phase 25 SYNC-14 `9a17907b6` restore + downstream churn) so a no-op FF is not currently possible — the rebase is the gate.

**Cost:** invalidates the RC tag (`v2.0.0-linux-rebased-rc1` points at pre-rebase SHA `bd2468119`). Not a problem — RC tag was provisional from the start (D-29-04 cleanup was always Phase 30 work). After rebase + FF + canonical tag, the RC tag is deleted local + remote per cleanup pattern.

**Rebase resolution policy:** if conflicts surface during the rebase against the +20 master commits, resolve fork-side (HEAD) by default — same stance used through Phases 26/27. Hot zone is most likely `src/main/src/downloading/downloader.test.ts` (the file at the heart of SYNC-32's −10 lint delta — Phase 25 SYNC-14 restored it on master after v8.0 branched). We keep the upstream-restored test file (it's the file we want; v8.0 just hadn't picked it up yet) — that's the one place where the rebase wants `--theirs`. Document each conflict atomically in `30-REBASE-NOTES.md`.

### D-30-02: Tag placement — post-FF master HEAD, annotated + SSH-signed

**Choice:** create `v2.0.0-linux-rebased` as an annotated SSH-signed tag (`~/.ssh/id_ed25519`) on the master commit that results from FF-merging PR #4. Push to `origin` (Nexus-Mods/Vortex remote configured) AND `fork` (atabisz/Vortex). Tag annotation captures milestone summary + Phase-29 evidence pointers.

**Why:** the tag must be on the canonical post-merge commit so `git describe` and downstream tooling find it. Push to BOTH remotes because `release-linux.yml` lives on the fork and triggers off `v*` tag push to atabisz/Vortex; origin push is for Nexus-Mods upstream visibility (informational — they're not consuming our PRs per memory `project_upstream_pr_policy.md`, but it keeps the fork story legible if they ever look). SSH-signed per memory `feedback_ssh_signing.md`.

**RC cleanup ordering:** delete `v2.0.0-linux-rebased-rc1` (local + fork remote) FIRST, then create the canonical tag. Avoids any window where both tags coexist; release-linux.yml only re-runs on the canonical tag's push event.

**Tag triggers AppImage CI:** push of `v2.0.0-linux-rebased` to fork triggers `release-linux.yml` (same flow as RC). Wait for the run to complete and republish, then download AppImage + .deb for the deferred Phase 29 part-C local boot evidence.

### D-30-03: Cherry-pick enumeration — path-based filter on the v8.0 range

**Choice:** enumerate Linux-only commits via `git log master..<post-ff-master>` filtered by path-touching:

```
git log master..<post-ff-master> --diff-filter=ACMRD --name-only \
  -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
  ':!.planning/**' \
  ':!.github/workflows/release-linux.yml' \
  ':!.github/workflows/format.yml' \
  ':!.github/actions/fingerprints/**' \
  ':!docker/**'
```

(plus a manual eyeball pass to catch edge-cases like CLAUDE.md / AGENTS-DIRECTORIES.md that touch `.planning/` adjacent paths).

**Why:** matches the v6.0/v7.0 cherry-pick pattern; `linux-port` branch policy is path-defined ("exclude `.planning/`, fork CI, etc.") so a path-based filter is the most direct expression of the policy. Explicit allow-list (option B) was rejected because many phase commits use scopes like `resolve(mod-mgmt):` — those touch real Linux code but the scope wouldn't match a simple `fix(linux):` filter.

**Order:** chronological (`--reverse`) so each cherry-pick lands on top of a coherent linux-port history. If a chain of commits doesn't apply cleanly, prefer squashing the chain to a single cherry-pick rather than partial application.

**Conflict policy:** linux-port HEAD wins by default (linux-port is the curated branch — its history is the authority for this surface). If the cherry-pick brings in renderer/main-spine churn that's incompatible with linux-port's lighter scope, drop those commits with a note in `30-CHERRY-PICK-NOTES.md`.

### D-30-04: Playbook update — Phase 30 last-step before milestone audit

**Choice:** after tag + cherry-pick land, in a single `docs(playbook): v8.0 milestone post-mortem` commit, update `VORTEX-LINUX-MERGE-PLAYBOOK.md` with:

- **§Bluebird-Promise trap** (from Phase 27 footnote): `Promise from "bluebird"` shadow → don't add `:Promise<T>` annotations to async fns; either omit or use a separate type alias.
- **§4 transferPath NEGATIVE gate** (from Phase 28 grep-checkpoint): first NEGATIVE gate in the script — count must be 0 — proves Windows-only reject in `transferPath.ts` was not re-introduced.
- **§DEFERRED-not-skipped pattern** (from Phase 29 SYNC-33/34 split): explicit deferral with Phase-N+1 acceptance text in evidence file, not silent omission. Real-usage evidence > contrived walkthrough for daily-driver titles.
- **§Inline-SSH-URL force-with-lease idiom** (from Phase 28+29 push pattern): `--force-with-lease=<ref>:<verified-pre-push-sha>` because inline SSH URL has no remote-tracking branch; verify SHA via `git ls-remote` immediately before pushing.
- **§Pre-existing baseline philosophy for lint deltas** (from Phase 29 SYNC-32): negative delta vs master explained by branch-lineage (file absent, not fixed) is PASS — PASS condition is exit-0 + count-comparison, not zero-delta.
- **Commit-index table refresh:** new master HEAD SHA (post-FF) + new linux-port HEAD SHA (post-cherry-pick) replacing the v7.0-era values.

**Why:** single commit keeps the post-mortem coherent and audit-trail-friendly. Doing it during cherry-pick (option B) would multiply commits and risk scope-creep into Phase 30 sub-tasks. Deferring to a Phase 30-bis (option C) risks the post-mortem fading. Phase 27 done-gate established the precedent of bundling milestone post-mortem deltas into one playbook commit.

## Plan shape (informational, not locked — for the planner)

Anticipated plan count: ~6–8 plans.

1. **30-00 — Phase 30 setup:** verify PR #4 still MERGEABLE; verify Phase 29 done-gate intact; capture pre-rebase state (SHAs, branch list, RC tag presence).
2. **30-01 — Rebase v8.0 onto master:** rebase, resolve any conflicts (likely `downloader.test.ts` pickup), force-push lease-pinned to `355158381`. Wait for Main + Format CI to re-run on the rebased head.
3. **30-02 — Verify Windows CI green (SYNC-35):** observe both Main (linux + windows) and Format runs; capture screenshots of green status; if any flake, retry.
4. **30-03 — FF-merge PR #4 (SYNC-36):** `gh pr merge 4 --merge=fast-forward`; verify master HEAD == post-rebase v8.0 HEAD; PR transitions to MERGED.
5. **30-04 — RC tag cleanup + canonical tag (SYNC-37):** delete `v2.0.0-linux-rebased-rc1` local + fork remote; create + push annotated SSH-signed `v2.0.0-linux-rebased` to origin + fork; observe `release-linux.yml` re-run; capture canonical AppImage + .deb SHA256s.
6. **30-05 — Phase 29 deferred SYNC-33-C + SYNC-34 against canonical tag:** chmod+x AppImage, launch, screenshot; sudo apt install .deb, launch via desktop entry, screenshot; 4-screenshot Skyrim SE walkthrough on canonical AppImage; append to `29-SMOKE-EVIDENCE.md` or write `30-CANONICAL-SMOKE-EVIDENCE.md`.
7. **30-06 — Cherry-pick to linux-port (SYNC-38):** path-filtered enumeration, chronological cherry-pick, push linux-port HEAD; document drops in `30-CHERRY-PICK-NOTES.md`.
8. **30-07 — Playbook post-mortem update (SYNC-39):** single commit updating VORTEX-LINUX-MERGE-PLAYBOOK.md with the 5 deltas + commit-index table refresh.
9. **30-08 — Phase 30 done-gate:** roll up SYNC-35/36/37/38/39 + carry-forward Phase 29 SYNC-33-C/34 evidence into `30-DONE-GATE.md`; STATE.md + ROADMAP.md flip Phase 30 to complete; two-commit landing pattern same as Phase 28/29.

(Planner is free to merge/split — this is shape, not contract.)

## Canonical refs

- `.planning/ROADMAP.md` — Phase 30 row, success criteria
- `.planning/REQUIREMENTS.md` — SYNC-35..39 full text
- `.planning/PROJECT.md` — milestone context
- `.planning/STATE.md` — Phase 29 close state, frontmatter
- `.planning/phases/29-build-verification/29-DONE-GATE.md` — predecessor done-gate (shape reference)
- `.planning/phases/29-build-verification/29-SMOKE-EVIDENCE.md` — predecessor smoke evidence (Phase 29 deferred items live here, get folded in Phase 30)
- `.planning/phases/28-renderer-main-spine/28-DONE-GATE.md` — Phase 28 done-gate (two-commit landing shape reference)
- `.planning/milestones/v8.0/scripts/grep-checkpoint.sh` — 16-gate preservation script, must stay green through rebase
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — playbook target for SYNC-39 update
- `CLAUDE.md` — branch strategy table (linux-port cherry-pick policy)
- `~/.claude/projects/-home-alex-src-Vortex/memory/MEMORY.md` — operational constraints (SSH signing, inline SSH URL, gitignored .planning/, casual voice, upstream PR policy, bluebird-Promise trap)

## Code context

- **Master HEAD:** `db8035192` (`docs(phase-26): correct 140a57217 file/method confusion in plans 01/06/07`) — +20 commits ahead of merge-base `d4c0d0da5`.
- **v8.0/config-bucket HEAD:** `355158381` (`docs(29-10): summary — phase 29 done-gate roll-up`) — 374 commits ahead of merge-base.
- **Merge-base:** `d4c0d0da5` — branch divergence point.
- **PR #4 status:** OPEN, MERGEABLE, base `master`, head `sync/upstream-v2.0.0` @ `355158381`. Main + Format CI runs IN_PROGRESS at scrape time.
- **Hot file for rebase:** `src/main/src/downloading/downloader.test.ts` — Phase 25 SYNC-14 restored on master at `9a17907b6` (one of the 20 master-only commits). Doesn't exist on v8.0; rebase will pull it in. Carries 10 pre-existing `@typescript-eslint/no-unsafe-*` errors per Phase 29 SYNC-32 baseline (acceptable; pre-existing on master per `29-LINT-BASELINE.md`).
- **RC tag:** `v2.0.0-linux-rebased-rc1` annotated SSH-signed at `bd2468119` (pre-rebase v8.0 commit). Will become orphaned after rebase — clean up per D-30-04.
- **Linux-port HEAD:** check via `git ls-remote git@github.com:atabisz/Vortex.git refs/heads/linux-port` immediately before cherry-pick to lock baseline.

## Deferred ideas

- **Upstream PR to Nexus-Mods/Vortex:** out of scope per memory `project_upstream_pr_policy.md` (not accepting fork PRs right now). Re-evaluate at v8.1 or when upstream signals openness.
- **AppImage update channel for Linux:** `release-linux.yml` produces `latest-linux.yml` but Nexus-Mods/Vortex doesn't publish Linux release metadata, so Vortex's auto-updater hits a 404 on Linux (Phase 29 SYNC-33-A boot evidence). Forward-port note: either disable update check on Linux at runtime, or wire a fork-local update channel. Candidate hotfix material for v8.1 — not Phase 30.
- **GitHub-Actions step bumps:** `actions/checkout@v4`, `actions/setup-node@v4`, `softprops/action-gh-release@v2` flagged as Node-20 deprecated by runner. Bumping to v5 is housekeeping outside Phase 30 scope.
- **`@vortex/api` regen as routine commit:** `packages/vortex-api/lib/api.d.ts` regenerates as a side-effect of typecheck/build chains. Discarded ad-hoc through Phases 28/29; a single periodic `chore(vortex-api): regen api.d.ts` cycle would be cleaner but not Phase 30 scope.
- **Phase 28 ROADMAP progress-table row drift:** line 291 still shows `0/0 | Not started | -` for Phase 28 despite the row at line 87 being flipped during Phase 28 close. Quick-task-sized fix; not Phase 30 scope per minimize-diff feedback.

## Risks + contingencies

- **R-30-01 (rebase conflicts):** the +20 master-only commits include Phase 25 SYNC-14 restore which re-introduces files v8.0 doesn't have. Likely conflict surfaces are `src/main/src/downloading/` (test file pickup), and any file Phase 25 touched on master after v8.0 branched. **Contingency:** resolve fork-side (HEAD) by default for substantive content; take master-side (`--theirs`) for upstream restorations like `downloader.test.ts`. Document each in `30-REBASE-NOTES.md`. If a single commit has too many conflicts to resolve cleanly, drop into the rebase editor and reorder/squash.
- **R-30-02 (Windows CI flake):** `main.yml` `windows-latest` job has been green on prior fork pushes but the Phase 28 push didn't run all CI workflows (PR #4 was created post-Phase-28). If CI surfaces a Windows-specific regression introduced during Phase 25–28 resolution work, plan 30-02 documents the failure and we cycle back: identify offending commit, propose fix on `v8.0/config-bucket`, re-rebase. **Contingency:** Phase 30-bis if multiple cycles needed.
- **R-30-03 (cherry-pick scope drift):** the path filter could miss a commit that's notionally Linux-relevant but technically touches a fork-only path (e.g., a CI fix that was Linux-motivated but lives in `release-linux.yml`). **Contingency:** manual eyeball pass on the filtered list before each cherry-pick; if a borderline commit surfaces, document the include/drop decision in `30-CHERRY-PICK-NOTES.md` rather than choosing silently.
- **R-30-04 (release-linux.yml flake on canonical tag):** Phase 29 RC build was clean (10m58s wall-clock, 0 errors). If the canonical tag's run flakes, retry; if persistent, identify the regressing commit (likely one of the 20 master-only) and push a tag-attached fix. **Contingency:** allow up to 2 retries before escalating to a Phase 30-bis CI fix.
- **R-30-05 (deferred SYNC-33-C boot fails):** if the canonical AppImage doesn't boot or the .deb desktop-entry launch surfaces a regression, the carry-forward Phase 29 deferred-evidence acceptance gate fails. **Contingency:** don't roll Phase 30 to complete with this failing — diagnose, propose fix, re-tag canonical (`-rc2` or revised v2.0.0). Phase 29 SYNC-33-A `pnpm run start` from source DID boot cleanly so the regression surface is constrained to package + desktop-entry.

## Verify-script-rules (carry-forward)

Same rules as Phase 29 §Verify-script-rules:

- Each script gets atomic plan + commit (or run-only, no commit, if exit 0 with no source changes).
- Capture: exit code, stderr tail (≤30 lines on failure), key positive signals.
- On non-zero exit: stop the cascade, file deviation note, decide repair-in-30 vs defer-to-30-bis based on triage.
- Force-with-lease pushes via inline SSH URL with explicit lease pinned to verified pre-push SHA from `git ls-remote`.

## Next steps

`/clear` then:

`/gsd:plan-phase 30`
