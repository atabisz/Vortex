# Phase 36: Land + tag + cherry-pick (v2.0.1) — Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Mode:** `--auto` (Claude auto-selected recommended option for every gray area; single-pass)

<domain>
## Phase Boundary

Land the v8.1 milestone work onto fork master and stamp the canonical Linux release artefact for Vortex v2.0.1. Five gates, all git/CI plumbing — **no new code**:

1. Push local `master` (+5 fork-only commits) to `fork/master` so PR base reflects what we'll FF onto.
2. Rebase `v8.1/config-bucket` onto `master` HEAD; force-push lease-pinned to `fork/sync/upstream-v2.0.1`.
3. Wait for Windows CI green on the rebased PR head; FF-merge PR #5.
4. Create SSH-signed annotated tag `v2.0.1-linux-rebased` on the post-FF master; push to `fork` (triggers `release-linux.yml`) AND `origin` (informational).
5. Cherry-pick the path-filtered Linux subset from post-FF master onto `linux-port`; document drops.

Gate 0 (also): verify `release-linux.yml` produces AppImage + .deb with SHA256 manifest on the canonical tag push (carry-forward SYNC-33-C / SYNC-34 manual UAT belongs to Phase 37, not 36).

**In scope:** rebase, force-push, FF-merge, signed tag, dual-remote tag push, cherry-pick, release-linux.yml smoke evidence.
**Out of scope:** any code change in `src/`/`packages/`/`extensions/` (this is plumbing); manual hardware UAT (Phase 37 / 999.1); playbook post-mortem (Phase 37 SYNC-37b); upstream PR to Nexus-Mods (memory `project_upstream_pr_policy.md`).

</domain>

<decisions>
## Implementation Decisions

### Land strategy

- **D-36-01 (= v8.0 D-30-01 carry-forward):** **Rebase + FF-merge.** Rebase `v8.1/config-bucket` onto `master` HEAD (`d717c09c3` per `git ls-remote` 2026-05-23), force-push lease-pinned to `fork/sync/upstream-v2.0.1` (current SHA `8054a935b6aad505798bba8a993d002718d119cb`), then `gh pr merge 5 --merge` to FF-merge PR #5. Rationale: ROADMAP success criterion #1 is verbatim "fast-forward merged"; FF preserves SHAs (Phase 35 done-gate evidence chain stays valid); `--merge=rebase` would rewrite SHAs and invalidate the 5-commit Phase 35 receipt at `e2127cecb..f1425a5c8`.
- **D-36-02 — Conflict-resolution stance during rebase:** **fork-side default (HEAD wins).** v8.0 D-30-01 took fork-side default; carries forward verbatim. Exception (if it applies): any file already restored-from-master via Wave 2 contingency-fix (`packages/paths{,-node}/src/`) — those should rebase clean since they ARE master's state. No bluebird-Promise trap files expected in the diff (Phase 32-34 already drained that surface), but scan each conflict file for `import Promise from "bluebird"` before accepting upstream `:Promise<T>` annotations (memory `feedback_bluebird_promise_trap.md`).
- **D-36-03 — Pre-rebase fork/master push:** **Push local master to fork/master FIRST.** Resolves v8.0 Open Question §1 (locked carry-forward). Local master is +5 ahead of `fork/master` (still at `d494bcb7d`). Push first so fork CI runs on those +5 in isolation; if PR #5 rebase reveals a conflict that's actually a master-side regression, we know early. Lease pin `d494bcb7d`.

### Tag placement & push order

- **D-36-04 (= v8.0 D-30-02 carry-forward):** **SSH-signed annotated tag `v2.0.1-linux-rebased`** on the post-FF master HEAD. Annotated (not lightweight) so `softprops/action-gh-release@v2` reads the tag annotation as release body fallback and `git describe` resolves it. SSH-signed via existing `~/.ssh/id_ed25519` (`gpg.format=ssh`, `tag.gpgsign=true` already configured — verify with `git config --get-all tag.gpgsign`).
- **D-36-05 — Dual-remote push order:** **fork FIRST, origin SECOND.** Fork triggers `release-linux.yml` (`push: tags: ['v*']`). Origin (Nexus-Mods/Vortex) is informational only — push may be rejected for permissions; do NOT block on origin success (memory `project_upstream_pr_policy.md`). If origin push fails, document in DONE-GATE and move on.
- **D-36-06 — RC-tag cleanup:** **N/A — there is no v2.0.1 RC tag.** v8.0's D-30-02 had to clean up `v2.0.0-linux-rebased-rc1`; Phase 35 closed without producing an RC. Confirmed via `git ls-remote ... 'refs/tags/v2.0.1*'` — empty. Skip RC-deletion step entirely.

### Cherry-pick filter

- **D-36-07 (= v8.0 D-30-03 carry-forward, verbatim path filter):** **Path-based cherry-pick from post-FF master to `linux-port`.**
    ```
    git log master..<post-ff-master> --diff-filter=ACMRD --name-only --reverse \
      -- 'src/**' 'extensions/**' 'packages/**' 'scripts/**' \
      ':!.planning/**' \
      ':!.github/workflows/release-linux.yml' \
      ':!.github/workflows/format.yml' \
      ':!.github/actions/fingerprints/**' \
      ':!docker/**'
    ```
    Cherry-pick chronologically (`--reverse`); cherry-pick `-x` for traceability; **`linux-port` HEAD wins on conflict**; document drops in `36-CHERRY-PICK-NOTES.md`.
- **D-36-08 — Linux-port baseline:** before cherry-pick, sync `linux-port` to `fork/linux-port` (current `6a28945d1` per `git ls-remote`). The 656-commit gap between `master` and `v8.1/config-bucket` will be the cherry-pick candidate set after FF-merge — likely ~400-450 commits after path-filter exclusion (extrapolated from v8.0's 216-of-375 ratio).

### release-linux.yml smoke evidence

- **D-36-09 — SYNC-36d closure:** **CI smoke evidence only in Phase 36** — `release-linux.yml` runs on the canonical tag push, produces AppImage + .deb with SHA256 manifest, and that's it. Capture the run URL and asset SHA256s in `36-DONE-GATE.md`. **Local-boot AppImage + Skyrim walkthrough = Phase 37** (carry-forward UAT — SYNC-37a's home for v8.0 carry-fwd SYNC-33-C / SYNC-34, with v8.1 equivalents added).

### Playbook update

- **D-36-10 — Phase 37, not Phase 36.** REQUIREMENTS.md SYNC-37b explicitly assigns playbook updates to Phase 37; there's no SYNC-36e parallel to v8.0's SYNC-39. Phase 36 stays minimal — pure landing.

### Fork CI quirks (post-Phase 35)

- **D-36-11 — `packages/vortex-api/lib/api.d.ts` recurring drift.** Post-Phase 35 we know typecheck regenerates this file as a side-effect (Phase 28/29/35 documented pattern). Discard with `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` after each rebase typecheck. Don't commit it.

### Claude's Discretion

- Plan-shape sequencing (number of plans / waves / verification cadence) — leave to `gsd-planner`.
- Whether to push local master (D-36-03) as its own first plan or fold into the rebase plan's setup task — planner's call.
- `gh pr merge 5 --merge` flag interaction (v8.0 Open Question §2: does `--merge` produce a true FF or always a merge commit?) — **researcher must verify** before plan execution, with fallback `git push fork v8.1/config-bucket:master` (manual FF push) + `gh pr close 5` if `--merge` produces an unwanted merge commit.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v8.0 precedent — the playbook for this phase

- `.planning/milestones/v8.0-phases/30-land-tag/30-RESEARCH.md` — full v8.0 Phase 30 research: rebase mechanics, force-with-lease pin pattern, SSH-signed tag pattern, path-filter cherry-pick, 7 pitfalls, 7 assumptions, 5 open questions. Locked decisions D-30-01..D-30-04 carry forward verbatim as D-36-01/D-36-04/D-36-07/(D-36-10 in Phase 37).

### v8.1 milestone artefacts

- `.planning/PROJECT.md` — milestone goal: FF-merge `sync/upstream-v2.0.1` tagged `v2.0.1-linux-rebased`.
- `.planning/REQUIREMENTS.md` — SYNC-36a/b/c/d verbatim; SYNC-37a/b explicitly carry the playbook + UAT to Phase 37.
- `.planning/ROADMAP.md` (Phase 36 section) — `v8.0 D-30-01/02/03` referenced as canonical playbook.
- `.planning/STATE.md` — Phase 35 close state, branch HEAD `f1425a5c8`, 5 SSH-signed Phase 35 commits.

### Phase 35 close evidence (the post-FF merge will land this)

- `.planning/phases/35-build-verification-v2-0-1/35-VERIFY-RESULTS.md` — five SYNC sections (35a/b/c/d/e all PASS).
- `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md` — D-35-10 7-criterion gate GREEN.
- `.planning/phases/35-build-verification-v2-0-1/35-08-SUMMARY.md` — closeout summary.

### Operational invariants

- `CLAUDE.md` — branch strategy table (linux-port = clean Linux-only history, master = full fork including .planning/ + distribution CI + fork tooling).
- `AGENTS.md` — `pnpm run` for repo commands.
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §1 platform guards, §3 LOOT casing, §10 native binaries (verified Phase 33-34); §4 transferPath NEGATIVE gate.
- `.github/workflows/release-linux.yml` — `push: tags: ['v*']` trigger; `softprops/action-gh-release@v2` consumes annotated tag body as release body fallback.
- `.github/workflows/main.yml` — Windows + Linux matrix; SYNC-36a green-CI gate before FF-merge.
- `~/.claude/projects/-home-alex-src-Vortex/memory/MEMORY.md` — operational constraints:
    - `feedback_ssh_signing.md` — SSH key only, never GPG; `~/.ssh/id_ed25519`.
    - `feedback_git_push_ssh.md` — inline SSH URL for push (sandbox blocks `.git/config`).
    - `feedback_planning_gitignored.md` — `git add -f` for `.planning/` paths.
    - `feedback_minimize_upstream_diff.md` — never reformat outside change scope.
    - `feedback_casual_voice.md` — casual project voice in commits, tag annotations, PR comments.
    - `feedback_bluebird_promise_trap.md` — bluebird Promise scan during rebase conflict resolution.
    - `project_upstream_pr_policy.md` — origin tag push is informational; non-blocking on rejection.
    - `project_upstream_merge_checklist.md` — verify gamebryo guards + skip-on-windows.mjs survived after rebase.
    - `reference_github_token.md` — GH_TOKEN env var fallback if `gh auth status` expired.

### Live state (captured 2026-05-23 via `git ls-remote git@github.com:atabisz/Vortex.git`)

- `fork/master` = `d717c09c38f04ccfd8084e61ae61cbce01162a1a` (LOCAL master is +5 ahead, at `d494bcb7d090bdf311f8e5b1cc7cfb418b009726`)
- `fork/sync/upstream-v2.0.1` = `8054a935b6aad505798bba8a993d002718d119cb`
- `fork/linux-port` = `6a28945d153ee9a7ca604d5c673eb5bd61c33e13`
- `v2.0.1*` tags: NONE (no RC tag to clean up — D-36-06 simplification)
- PR #5 (atabisz/Vortex#5): OPEN, mergeable=CONFLICTING (expected — unresolved 656-commit divergence; rebase resolves), head `8054a935b`, base `master`.
- Local `v8.1/config-bucket` HEAD = `f1425a5c810794b8325db624d97da9abc106ad90` (Phase 35 closeout commit).
- 656 commits on `v8.1/config-bucket` ahead of `master`; 5 commits on local master ahead of fork.
- Repo merge config: `mergeCommitAllowed=true`, `rebaseMergeAllowed=true`, `squashMergeAllowed=true` — all three modes available; D-36-01 picks `--merge` after local rebase guarantees FF.
- Branch protection on `master`: 1 required PR review, signatures NOT required, force-push NOT allowed, deletions NOT allowed. Note: `required_signatures.enabled=false` — does not block our SSH-signed flow, but the 1-review requirement means PR #5 must satisfy that before `gh pr merge` works (self-review or admin override).

### Tools verified available

- `git` with `gpg.format=ssh`, `tag.gpgsign=true` (verify before tag push).
- `gh` (authenticated; `GH_TOKEN` fallback per memory).
- `~/.ssh/id_ed25519` (signing key).
- pnpm 10.33.0+.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **v8.0 Phase 30 playbook (research-only — no PLAN/SUMMARY artifacts shipped):** `.planning/milestones/v8.0-phases/30-land-tag/30-RESEARCH.md` is the operational template. Patterns 1-3 (rebase-then-FF, SSH-signed annotated tag, path-based cherry-pick filter) all transcribe to v8.1 with SHA substitution. Pitfalls 1-9 carry forward — Pitfall 1 (force-with-lease pin), 2 (`gh pr merge --merge` semantics), 7 (bluebird trap), 8 (oxfmt reformat) all directly applicable.
- **`.github/workflows/release-linux.yml`** (fork-only) — empirically verified working for v2.0.0-linux-rebased-rc1 (10m58s, AppImage + .deb + SHA256 manifest). No changes since v8.0; should fire on `v2.0.1-linux-rebased` push event the same way.
- **`.github/workflows/main.yml`** — Windows + Linux matrix; SYNC-36a green-CI gate.
- **No `.planning/milestones/v8.1/scripts/grep-checkpoint.sh` exists** — v8.1 didn't extend the v8.0 16-gate harness as a milestone script; per-phase harnesses lived inside Phase 32-34 wave plans. Post-rebase verification uses `pnpm run typecheck && pnpm run lint:ci && pnpm test && pnpm build` (the SYNC-35a..d gates) instead. Optional: copy v8.0's harness if planner wants belt-and-braces.

### Established Patterns

- **Inline SSH URL force-with-lease with explicit lease pin** (v8.0 Phase 28-30 + v8.1 Phase 31): `git push --force-with-lease=<ref>:<verified-pre-push-sha> git@github.com:atabisz/Vortex.git <local>:<remote>`. Implicit lease ("stale info") rejection is documented; never use plain `--force-with-lease` over inline SSH URL.
- **`packages/vortex-api/lib/api.d.ts` regen after typecheck**: discard with `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` (Phase 28/29/34/35 pattern; D-36-11).
- **Annotated SSH-signed tag**: `git tag -a v2.0.1-linux-rebased -m "<casual body referring to .planning/phases/35.../35-DONE-GATE.md>"` then `git push fork v2.0.1-linux-rebased`. `gpg.format=ssh` + `tag.gpgsign=true` is already configured project-wide — `-a` alone signs.
- **Cherry-pick `-x` for traceability**: adds `(cherry picked from commit <sha>)` line so future merges can use `git cherry` to detect already-applied commits.
- **`linux-port` baseline policy** (CLAUDE.md): exclude `.planning/`, fork CI (`release-linux.yml`, `format.yml`, `fingerprints/`), distribution config — D-36-07 path-filter is the encoding.

### Integration Points

- **PR #5 (atabisz/Vortex#5)** is the FF-merge target. Currently CONFLICTING (expected pre-rebase). After lease-pinned force-push of rebased branch, mergeable should flip to MERGEABLE.
- **Tag push to fork** triggers `release-linux.yml` (workflow path: `push: tags: ['v*']`). The `v2.0.1-linux-rebased` name matches `v*`.
- **Tag push to origin (Nexus-Mods/Vortex)** is informational only — origin push may reject (no write permissions); non-blocking per `project_upstream_pr_policy.md`.
- **Cherry-pick targets `fork/linux-port` (currently `6a28945d1`)** — locally check out, fast-forward to remote, then cherry-pick chronological subset, then push.

</code_context>

<specifics>
## Specific Ideas

- **Tag annotation body shape:** casual voice (memory `feedback_casual_voice.md`); reference `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md` evidence URL; mention "656 commits, 5 Phase 35 commits, D-35-10 7/7 GREEN"; not a formal release-notes-style document. v8.0 D-30-02 example body in 30-RESEARCH.md §Pattern 2 is the template.
- **Plans likely needed (~6-8, planner's call):**
    1. Pre-flight: verify `gh pr merge --merge` semantics on a test PR or via `gh repo view` flags; confirm signing config; capture pre-state SHAs.
    2. Push local master to fork/master (D-36-03) — lease pin `d494bcb7d`.
    3. Rebase `v8.1/config-bucket` onto master + force-push to `fork/sync/upstream-v2.0.1` lease-pinned to `8054a935b`. Document conflicts in `36-REBASE-NOTES.md`.
    4. Wait for Windows CI green on rebased PR head; FF-merge PR #5; verify post-FF master HEAD.
    5. Create + dual-push SSH-signed `v2.0.1-linux-rebased` tag; verify `release-linux.yml` triggers and produces AppImage + .deb + SHA256 manifest.
    6. Cherry-pick path-filtered subset onto `linux-port`; push; document in `36-CHERRY-PICK-NOTES.md`.
    7. Phase done-gate (`36-DONE-GATE.md` — SYNC-36a/b/c/d evidence rollup).
- **No screenshots in Phase 36** — those are Phase 37/999.1 (UAT carry-forward).

</specifics>

<deferred>
## Deferred Ideas

- **Local-boot AppImage + .deb verification** — Phase 37 SYNC-37a (carry-forward UAT lands here, paralleling v8.0 SYNC-33-C).
- **4-screenshot Skyrim walkthrough vs canonical AppImage** — Phase 37 SYNC-37a (paralleling v8.0 SYNC-34).
- **`VORTEX-LINUX-MERGE-PLAYBOOK.md` post-mortem update** — Phase 37 SYNC-37b (REQUIREMENTS.md explicitly assigns this to Phase 37; v8.1's 5 deltas to capture: any new conflict-resolution patterns surfaced during Phase 32-34 + 656-commit-rebase Phase 36 lessons + Phase 35 contingency-fix `packages/paths` restore lesson + bundledPlugins floor pattern + per-bucket typecheck idiom).
- **AppImage update channel** — v8.0 deferred-idea carry-forward; still out of scope for v8.1 (separate milestone).
- **`@vortex/api` regen as routine commit** — housekeeping; not v8.1.
- **GitHub Actions step bumps (Node-20 deprecated runner notices)** — housekeeping; not v8.1.
- **Upstream PR to Nexus-Mods/Vortex** — fork PRs not accepted (memory `project_upstream_pr_policy.md`); origin tag push is informational only.

</deferred>

---

## Strategy Deviation — Wave 1 Path C Forward-Sync Merge

Two prior strategies collapsed against a foundational v8.1 base mismatch
(memory `project_v8_1_base_mismatch.md`): v8.1/config-bucket was branched
from `d4c0d0da5` (1st parent of the upstream-v2.0.1 merge `aa3faf7e5`),
a master point that PRE-DATES v8.0's v2.0.0-linux work. Master had absorbed
~300 v2.0.0-linux atomic commits since `d4c0d0da5`; v8.1 hadn't.

1. **Attempt 1 — `git rebase --rebase-merges master`** halted at central
   upstream-merge `aa3faf7e5` with 403 conflicts: the merge's 1st parent
   (`d4c0d0da5`) is no longer the rebase base, so git 3-way-merges 8.7k
   upstream files against the wrong ancestor.

2. **Attempt 2 — surgical squash + cherry-pick replay** (see falsified
   `36-RESEARCH-SURGICAL.md`) halted at Stage A5 with the same foundational
   mismatch surfaced from a different angle: master had 304 non-merge
   commits past merge-base, not the +5 docs-only assumed by the surgical
   plan.

3. **Attempt 3 — Path C 3-way merge** (see load-bearing
   `36-RESEARCH-FORWARD-SYNC.md`): `git merge --no-ff v8.1/config-bucket`
   from master tip. Empirical dry-run produced **12 conflict files, 2 real
   code conflicts**. ~2 hours focused work. **ADOPTED.**

D-36-01 substitution: "FF-merge" → "merge --no-ff to land". Operator-accepted
the wording substitution (AskUserQuestion 2026-05-23). The resulting tree is
byte-equivalent to what FF would have produced post-divergence-resolution;
Phase 35 atomic SHAs `e2127cecb..f1425a5c8` survive in the 2nd-parent
ancestry of the merge commit.

Downstream waves accommodate:

- Wave 3 tag body references merge SHA + 1st parent (`d494bcb7d`) + 2nd parent
  (`f1425a5c8`) + upstream anchor (`f25ff55da` reachable via 2nd-parent
  ancestry through `aa3faf7e5`) + Phase 32-35 atomic range
  (`e2127cecb..f1425a5c8`) + rollback tag (`phase36/pre-surgical-snapshot`).
- Wave 5 cherry-pick uses `--no-merges` to exclude the Wave 1 merge commit
  AND the 119 v8.1 PR-merges in the 2nd-parent ancestry; estimate ~350-450
  candidates (broader than surgical because Path C surfaces v2.0.0-linux
  atomics alongside Phase 32-35 atomics, both excluded from linux-port via
  the `merge-base(linux-port, master)` baseline).

Rollback targets if anything goes south:

- `phase36/pre-surgical-snapshot` (= `f1425a5c8`) — local tag from prior attempt.
- `phase36/master-pre-merge` (= `d494bcb7d`) — local tag from Wave 1 Stage 0.

Both `36-RESEARCH-SURGICAL.md` (falsified, Stage A5 halt) and the original
`--rebase-merges` halt log in `36-REBASE-NOTES.md` are preserved verbatim
for the v8.1 playbook (Phase 37 SYNC-37b will codify the Path C pattern as
a reusable response to the "branch base predates downstream work" anti-pattern).

---

_Phase: 36-land-tag-cherry-pick-v2-0-1_
_Context gathered: 2026-05-23_
