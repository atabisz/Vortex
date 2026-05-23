# Phase 36: Land + tag + cherry-pick (v2.0.1) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 36-land-tag-cherry-pick-v2-0-1
**Mode:** `--auto` — Claude auto-selected the recommended (carry-forward) option for every gray area in a single pass. No AskUserQuestion calls; v8.0 D-30-01..04 playbook locks every load-bearing decision and the only meaningful gray areas were "do we deviate from the v8.0 playbook for this v8.1 instance?" — answered **no** in every case (with documented reduced scope: D-36-06 RC-tag cleanup is N/A, D-36-10 playbook update moves to Phase 37 per REQUIREMENTS.md).
**Areas auto-resolved:** Land strategy, Conflict-resolution stance, Pre-rebase fork/master push, Tag placement & signing, Dual-remote push order, RC-tag cleanup, Cherry-pick filter, Linux-port baseline, release-linux.yml smoke evidence scope, Playbook update routing, Recurring api.d.ts drift handling.

---

## Land strategy (rebase + FF-merge vs alternatives)

| Option                                                      | Description                                                                                | Selected |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| Rebase + `gh pr merge --merge` (carry-forward v8.0 D-30-01) | Rebase v8.1/config-bucket onto master HEAD, force-push, FF-merge. Preserves Phase 35 SHAs. | ✓        |
| `gh pr merge --rebase`                                      | gh-side rebase. Rewrites SHAs — invalidates Phase 35 done-gate evidence chain.             |          |
| `gh pr merge --merge` without local rebase                  | Produces merge commit; ROADMAP success criterion #1 says "fast-forward merged" verbatim.   |          |
| `gh pr merge --squash`                                      | Squashes 656 commits into one — destroys atomic-commit traceability across Phases 32-35.   |          |

**Auto-selected:** Rebase + FF-merge. **D-36-01.** Rationale: ROADMAP verbatim FF requirement; Phase 35 SHA preservation; v8.0 precedent.

---

## Conflict-resolution stance during rebase

| Option                              | Description                                                                           | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Fork-side default (HEAD wins)       | Same as v8.0 D-30-01. Bluebird scan per file before accepting upstream `:Promise<T>`. | ✓        |
| Theirs default (master wins)        | Would undo Phase 32-35 work in any conflicted file — wrong.                           |          |
| File-by-file judgement (no default) | Slower; v8.0 already establishes "fork-side except documented exceptions" works.      |          |

**Auto-selected:** Fork-side default. **D-36-02.**

---

## Pre-rebase fork/master push

| Option                                               | Description                                                             | Selected |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| Push local master → fork/master FIRST                | v8.0 Open Question §1 recommendation. CI signal on the +5 in isolation. | ✓        |
| Skip; let FF-merge land all 661 commits in one event | Faster but loses early signal if any of the +5 broke Windows.           |          |

**Auto-selected:** Push first. **D-36-03.** Lease pin `d494bcb7d`.

---

## Tag placement & signing

| Option                                                                       | Description                                                                                                                 | Selected |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| SSH-signed annotated tag `v2.0.1-linux-rebased` (carry-forward v8.0 D-30-02) | `gpg.format=ssh`, `tag.gpgsign=true` already configured. `softprops/action-gh-release@v2` reads annotation as release body. | ✓        |
| Lightweight tag                                                              | Breaks release-body annotation, breaks `git describe`.                                                                      |          |
| GPG-signed                                                                   | Project standard is SSH key only (memory `feedback_ssh_signing.md`).                                                        |          |

**Auto-selected:** SSH-signed annotated. **D-36-04.**

---

## Dual-remote tag push order

| Option                    | Description                                                                                           | Selected |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Fork FIRST, origin SECOND | Fork triggers `release-linux.yml`. Origin push may reject (no write perms); non-blocking.             | ✓        |
| Origin first              | Risks pushing to upstream before our CI fires; habitual `git push origin --tags` muscle memory leaks. |          |
| Fork only                 | Origin push is informational; if it works it's nice to have.                                          |          |

**Auto-selected:** Fork first, origin second, non-blocking on origin failure. **D-36-05.**

---

## RC-tag cleanup

| Option                                                        | Description                                                                                     | Selected |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| Skip — no v2.0.1 RC tag exists                                | Confirmed via `git ls-remote refs/tags/v2.0.1*` empty. Phase 35 closed without producing an RC. | ✓        |
| Match v8.0 D-30-02 verbatim (delete RC then create canonical) | Would error — there's nothing to delete.                                                        |          |

**Auto-selected:** Skip. **D-36-06** (carry-forward simplification of v8.0 D-30-02).

---

## Cherry-pick filter

| Option                                           | Description                                                                                                                                                       | Selected |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Path-based (carry-forward v8.0 D-30-03 verbatim) | `src/**`, `extensions/**`, `packages/**`, `scripts/**` minus `.planning/`, fork CI, distribution config. linux-port HEAD wins on conflict. `-x` for traceability. | ✓        |
| Scope-prefix filtering (commit subject regex)    | v8.0 rejected this — `resolve(mod-mgmt):` commits touch real Linux code but wouldn't match `fix(linux):`.                                                         |          |
| Squash all 656 into one cherry                   | Destroys atomic-commit traceability needed for future merges.                                                                                                     |          |

**Auto-selected:** Path-based, verbatim v8.0 filter. **D-36-07.** Linux-port baseline `6a28945d1` per `git ls-remote`. **D-36-08.**

---

## release-linux.yml smoke-evidence scope

| Option                                                           | Description                                                                                                                         | Selected |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CI smoke evidence only in Phase 36                               | Capture run URL + AppImage/.deb SHA256s in DONE-GATE. Local boot + Skyrim walkthrough → Phase 37.                                   | ✓        |
| Include local-boot + 4-screenshot Skyrim walkthrough in Phase 36 | Would duplicate v8.0's SYNC-33-C/SYNC-34 carry-forward into Phase 36 — REQUIREMENTS.md explicitly homes UAT in Phase 37 (SYNC-37a). |          |

**Auto-selected:** CI smoke only; UAT in Phase 37. **D-36-09.**

---

## Playbook update routing

| Option                                              | Description                                                                            | Selected |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| Phase 37 (SYNC-37b verbatim)                        | REQUIREMENTS.md explicitly assigns playbook updates to Phase 37; no SYNC-36e parallel. | ✓        |
| Fold into Phase 36 as v8.0 D-30-04 did with SYNC-39 | Would conflict with REQUIREMENTS.md and bloat Phase 36.                                |          |

**Auto-selected:** Phase 37. **D-36-10.**

---

## Recurring api.d.ts drift handling

| Option                                                                                    | Description                                                               | Selected |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| Discard with `git checkout HEAD -- packages/vortex-api/lib/api.d.ts` after each typecheck | Phase 28/29/34/35 established pattern. Not a real change.                 | ✓        |
| Commit the regen                                                                          | Would pollute the rebase / cherry-pick lineage with non-meaningful diffs. |          |

**Auto-selected:** Discard. **D-36-11.**

---

## Claude's Discretion

- Plan-shape sequencing (number of plans / waves / verification cadence) — left to `gsd-planner`.
- Whether to push local master (D-36-03) as its own first plan or fold into the rebase plan's setup task — planner's call.
- `gh pr merge 5 --merge` flag interaction (v8.0 Open Question §2 carry-forward: does `--merge` produce a true FF or always a merge commit?) — researcher must verify before plan execution; fallback `git push fork v8.1/config-bucket:master` (manual FF push) + `gh pr close 5` if `--merge` produces an unwanted merge commit. Repo merge config confirms all three modes are allowed (`mergeCommitAllowed=true`, `rebaseMergeAllowed=true`, `squashMergeAllowed=true`).

---

## Deferred Ideas

- Local-boot AppImage + .deb verification → **Phase 37 SYNC-37a**
- 4-screenshot Skyrim walkthrough vs canonical AppImage → **Phase 37 SYNC-37a**
- `VORTEX-LINUX-MERGE-PLAYBOOK.md` post-mortem update (5+ deltas: 656-commit rebase lessons, Phase 35 `packages/paths` contingency-fix lesson, bundledPlugins floor pattern, per-bucket typecheck idiom, lint baseline-parity philosophy) → **Phase 37 SYNC-37b**
- AppImage update channel (v8.0 deferred carry-forward; separate milestone)
- `@vortex/api` regen as routine commit (housekeeping)
- GitHub Actions step bumps / Node-20 deprecated runner notices (housekeeping)
- Upstream PR to Nexus-Mods/Vortex (fork PRs not accepted; memory `project_upstream_pr_policy.md`)
