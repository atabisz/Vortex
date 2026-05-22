# Phase 30 Done Gate

Captured 2026-05-22. Branch: `v8.0/config-bucket`. HEAD before done-gate: `2474c3d0d`.
Environment: Linux (Ubuntu 24.04.4 LTS), Node 22.22.0 (Volta-pinned), pnpm 10.33.0, Electron 42.0.0, Vortex 1.16.8.

## Phase 30 Done Gate

### SYNC-35 — Windows + Linux CI green on rebased head

**Originating plan:** 30-02.

Phase 30 used the parity-with-master CI baseline established at the v8.0/config-bucket rebase head. The Format and Main legs were re-run on the rebased tip after Wave 2; both finished without introducing new errors against `Main` baseline.

Quoted from `30-CI-EVIDENCE.md`:

> Format CI run **26265518519** — green ✓
> Main CI base run **26265518520** — baseline-parity (14 SYNC-32-D errors riding on master since Phase 25 SYNC-14, accepted as deviation against `Main` per CI-EVIDENCE)

The 14 SYNC-32-D typecheck errors carried over from master into the rebased head — they were master's own pre-existing errors, not introduced by the rebase. Accepted against `Main` CI as a baseline deviation, then load-bearing-fixed in `f570149ea` for `release-linux.yml`'s typecheck gate (see SYNC-37 below).

**Result: PASS** — rebased head reaches CI parity with master baseline; rebase introduced zero new CI errors.

### SYNC-36 — PR #4 fast-forward merged onto master

**Originating plan:** 30-03.

Quoted from `30-MERGE-EVIDENCE.md`:

> Bare FF master SHA: `cf9a8a59980ee8166139913ee04a4ed8d3ab8860`
> Post-FF master SHA: `f570149ea9554fe2d24b00b86e688855b845a4fe`
> PR #4 head SHA at merge: matches bare FF master SHA (FF-merge invariant satisfied)
> Parents-count post-merge: 1 (true fast-forward, no merge commit)

Strict-FF idiom executed via `gh pr merge 4 --merge=fast-forward` after CI parity confirmed. Master pointer advanced to PR head with zero divergent history. The `f570149ea` commit beyond bare FF SHA is the SYNC-32-D fix landed mid-Phase-30 to clear `release-linux.yml`'s typecheck gate (see SYNC-37 below); D-30-02 invariant relaxed to "tag on bare FF SHA + minimum SYNC-32-D fix" with full justification in `30-MERGE-EVIDENCE.md`.

**Result: PASS** — PR #4 fast-forward merged; master FF-advanced to v8.0/config-bucket post-rebase head.

### SYNC-37 — canonical tag `v2.0.0-linux-rebased` + AppImage/.deb published

**Originating plan:** 30-04.

Quoted from `30-TAG-EVIDENCE.md`:

> Canonical tag = v2.0.0-linux-rebased
> Annotated tag object SHA = 634a5cc1a912d13dc01761e76fd850a116afd7d5
> Tag-target commit SHA (post-fix master) = f570149ea9554fe2d24b00b86e688855b845a4fe
> Run: <https://github.com/atabisz/Vortex/actions/runs/26270905415>
> Conclusion: success
> Wall-clock: ~12m25s
> Release URL: <https://github.com/atabisz/Vortex/releases/tag/v2.0.0-linux-rebased>

RC tag `v2.0.0-linux-rebased-rc1` deleted from local + fork remote per D-29-04. First tag attempt landed on bare FF SHA (`cf9a8a599`) and `release-linux.yml` failed at typecheck step 16 with the 14 SYNC-32-D errors. Fix-in-v8.0 authorised at the user-checkpoint; `f570149ea` ("rewire DownloadObserver against new download API") landed one commit past bare FF SHA. Canonical tag re-created on the post-fix master and the re-run published the release cleanly.

Canonical asset SHA256s (locally re-hashed against released artefacts):

```
f458092a3e19c16896e89c38c0cac14e6226f003868a66604032bdf605229eeb  vortex-setup.AppImage      (258928186 bytes / 247 MiB)
414681b5a89f077c803a4ec11fde5b8265dc0dcb38db599d0841e6b14c5d368c  vortex_amd64.deb           (158158200 bytes / 151 MiB)
25a3e6aff4a9e091b224f3f2b177086cc83b86cbb817284cc8514d5d01174ef1  latest-linux.yml           (559 bytes)
```

SSH-signed annotated tag verified via `git cat-file tag` raw object inspection (tag-verify blocked by sandbox `gpg.ssh.allowedSignersFile` config — same as Phase 29 RC tag).

**Result: PASS** — canonical tag SSH-signed, pushed, `release-linux.yml` published AppImage + .deb at deterministic SHA256s.

### SYNC-38 — linux-port cherry-pick complete (with deviation: SYNC-39 baseline drift)

**Originating plan:** 30-06.

Quoted from `30-CHERRY-PICK-NOTES.md`:

> Pre-run linux-port HEAD = db8880f92760c31e41f614d4631dd6a84f3f9aa6
> Post-cherry-pick HEAD = 463f3c6eb (75 picks)
> Post-SYNC-32-D-revert HEAD = c5d775f06
> Post-housekeeping HEAD = 6a28945d153ee9a7ca604d5c673eb5bd61c33e13
> Pushed to fork (lease-pinned) = ✓ db8880f92..6a28945d1

| Status                  | Count   |
| ----------------------- | ------- |
| `pick-clean`            | 53      |
| `pick-with-ours`        | 22      |
| `skip-after-ours-empty` | 77      |
| `skip-empty`            | 14      |
| **Landed**              | **75**  |
| **Dropped**             | **91**  |
| **Total**               | **166** |

166 candidates from `db8035192..f570149ea` cherry-picked chronologically with strict `--ours` auto-resolve policy (user-confirmed at run start). 75 commits landed on linux-port; 91 dropped as superseded by linux-port's prior rebase rounds. SYNC-32-D fix `f570149ea` reverted on linux-port to preserve internal consistency with linux-port's still-old 5-arg `downloadProgress` / 3-arg `pauseDownload` action shapes (action-side simplification predates the cherry-pick range). Resurrected `downloader.test.ts` deleted via `git rm` housekeeping.

Post-run typecheck = 7 errors (1 pre-existing JWT narrowing + 6 baseline-drift errors surfaced by the cherry-pick — `isToastSystemDisabled` export, `installationValidation.ts`, `onRemoveMod` arity, `useToolsValidation` arity, `@vortex/shared/download` workspace path). All 6 drift sources predate the cherry-pick range so a wider `--ours` policy would not have caught them.

**Result: PASS (with deviation)** — 75 commits landed; baseline-drift deviation tracked as SYNC-39 follow-up for v8.1 linux-port catch-up milestone. linux-port pushed to fork at `6a28945d1` via lease-pinned inline SSH URL.

### SYNC-39 — `VORTEX-LINUX-MERGE-PLAYBOOK.md` updated with milestone post-mortem

**Originating plan:** 30-07.

Single signed commit `2474c3d0d docs(playbook): v8.0 milestone post-mortem` lands all 5 D-30-04 deltas plus commit-index table refresh:

1. **Bluebird Promise shadow — don't take upstream `:Promise<T>` annotations on async fns** (Phase 27 footnote)
2. **§4 transferPath NEGATIVE gate sub-note** (gate 13 in `grep-checkpoint.sh` — first NEGATIVE gate in milestone, count must be 0)
3. **DEFERRED, not skipped — explicit deferral with Phase-N+1 acceptance text** (Phase 29 SYNC-33-C + SYNC-34 split precedent)
4. **Force-with-lease over inline SSH URL needs an explicit lease pin** (Phase 28+29+30 push idiom)
5. **Lint deltas vs branch lineage** (Phase 29 SYNC-32 — PASS = exit-0 + sane comparison, not zero-delta)

Commit-index table refreshed: `_pending_` rows on linux-port reclassified `_SYNC-39 v8.1_` (commits exist on master but not on linux-port, predate cherry-pick range); new milestone-closure row added with `f570149ea` (master + canonical tag `v2.0.0-linux-rebased`) and `6a28945d1` (linux-port HEAD).

Casual voice throughout. SSH-signed.

**Result: PASS** — playbook captures v8.0 milestone post-mortem in one coherent commit per D-30-04.

### SYNC-33 part C (carry-forward from Phase 29) — canonical AppImage + .deb local boot

**Originating plan:** 30-05.

Cross-reference: `29-DONE-GATE.md` SYNC-33 deferred this part to Phase 30 acceptance against canonical (non-RC) tag.

**Status: DEFERRED to v8.1** (carry-forward folded back as deferred-not-skipped).

User authorisation at start of Wave 6 (30-05): "skip evidence and continue". The canonical AppImage + .deb published cleanly via `release-linux.yml` (SYNC-37) at the deterministic SHA256s captured in `30-TAG-EVIDENCE.md`. Local-launch evidence against the canonical artefacts is real but lower-risk — the daily-driver Skyrim SE workflow on Linux against `v8.0/config-bucket` HEAD is stronger evidence than a contrived single-launch screenshot, and SYNC-33 parts A + B (load-bearing) already PASS in `29-DONE-GATE.md`.

Tracked as carry-forward to v8.1 for explicit local-boot validation against canonical artefacts.

**Result: DEFERRED to v8.1** (not blocking — parts A + B load-bearing for SYNC-33 overall PASS; part C is real-evidence enrichment, deferred-not-skipped per the playbook §DEFERRED pattern landed in this same phase).

### SYNC-34 (carry-forward from Phase 29) — Skyrim SE 4-screenshot walkthrough

**Originating plan:** 30-05.

Cross-reference: `29-DONE-GATE.md` SYNC-34 marked PASS via real-usage evidence rolled up from D-29-03's Skyrim SE daily-driver smoke; the 4-screenshot walkthrough was deferred to Phase 30 against canonical (non-RC) tag.

**Status: DEFERRED to v8.1** (carry-forward folded back as deferred-not-skipped).

Same authorisation context as SYNC-33-C above. Phase 29 SYNC-34 already PASSed via the D-29-03 fallback intent (real evidence over contrived capture). The 4-screenshot walkthrough on the canonical AppImage is an additional confirmation, deferred-not-skipped to v8.1 per the playbook §DEFERRED pattern.

**Result: DEFERRED to v8.1** (not blocking — Phase 29 SYNC-34 PASSed via real-usage evidence; canonical-artefact walkthrough is confirmation enrichment).

## Requirements satisfied

| Req ID                | Source                         | Plan  | Result            |
| --------------------- | ------------------------------ | ----- | ----------------- |
| SYNC-35               | 30-CI-EVIDENCE.md              | 30-02 | PASS              |
| SYNC-36               | 30-MERGE-EVIDENCE.md           | 30-03 | PASS              |
| SYNC-37               | 30-TAG-EVIDENCE.md             | 30-04 | PASS              |
| SYNC-38               | 30-CHERRY-PICK-NOTES.md        | 30-06 | PASS (w/ SYNC-39) |
| SYNC-39               | VORTEX-LINUX-MERGE-PLAYBOOK.md | 30-07 | PASS              |
| SYNC-33-C (carry-fwd) | 29-DONE-GATE.md SYNC-33        | 30-05 | DEFERRED to v8.1  |
| SYNC-34 (carry-fwd)   | 29-DONE-GATE.md SYNC-34        | 30-05 | DEFERRED to v8.1  |

5 native PASS · 2 carry-forward DEFERRED-to-v8.1 (deferred-not-skipped per playbook).

## Phase 30 status: COMPLETE

**Captured:** 2026-05-22T07:22:38Z
**Closes:** Phase 30 (land + tag) and **v8.0 milestone (Upstream v2.0.0 Sync)**.
**Tag:** `v2.0.0-linux-rebased` annotated SSH-signed at `f570149ea` (tag object `634a5cc1a`).
**Master HEAD:** `2474c3d0d` (post-playbook). **linux-port HEAD:** `6a28945d1` (post-cherry-pick).
**Next:** v8.1 backlog — SYNC-39 linux-port catch-up + carry-forward SYNC-33-C/34 + AppImage update channel + GH-Actions step bumps + `@vortex/api` regen-as-chore.
