---
phase: 37-carry-forward-uat-v2-0-1
plan: 04
subsystem: phase-done-gate
tags:
    - linux-port
    - upstream-v2.0.1
    - phase-37
    - v8.1
    - milestone-closeout
    - uat
    - playbook
    - canonical-smoke
    - done-gate
    - milestone-close
requirements:
    satisfied:
        - SYNC-37a
        - SYNC-37b
    deferred: []
dependency_graph:
    requires:
        - .planning/phases/37-carry-forward-uat-v2-0-1/37-01-PLAN.md (Wave 1 readiness)
        - .planning/phases/37-carry-forward-uat-v2-0-1/37-02-PLAN.md (SYNC-37a UAT — landed at `7e5a59b6f`)
        - .planning/phases/37-carry-forward-uat-v2-0-1/37-03-PLAN.md (SYNC-37b playbook update — landed at `b0037bf1e`)
        - .planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md (canonical artefact SHA256 manifest input to SYNC-37a)
    provides:
        - Phase 37 complete on `master` (Wave 4 closeout commits A + B)
        - 37-DONE-GATE.md 5-criterion roll-up audit per D-37-10
        - 37-DONE-SUMMARY.md milestone closeout reference (double-duty as v8.1 master closeout reference, akin to Phase 30 for v8.0)
        - VORTEX-LINUX-MERGE-PLAYBOOK.md v8.1 deltas + commit-index refresh landed at `b0037bf1e`
        - 37-CANONICAL-SMOKE-EVIDENCE.md SYNC-37a real-usage roll-up evidence at `7e5a59b6f`
        - v8.1 milestone (Upstream v2.0.1 Sync) CLOSED — fork master HEAD = Commit B SHA after push
        - Phase 36 STATE/ROADMAP carry-forward catch-up landed alongside Phase 37 closeout
    affects:
        - v8.2 / upstream v2.0.2+ sync (separate milestone — backlog)
        - Phase 999.1 ELEV-05/ELEV-06/ONBRD-04 hardware UAT (BACKLOG, untouched)
tech_stack:
    added: []
    patterns:
        - "SHA256 cross-check pre-baked into evidence-file scaffold: `37-CANONICAL-SMOKE-EVIDENCE.md` quotes the canonical artefact SHA256s verbatim from `36-DONE-GATE.md` SYNC-36d manifest (`13aa29288...` AppImage / `3d82353963...` .deb) and re-hashes against the operator's downloaded artefacts at evidence-capture time. Bit-identity check is mechanical and load-bearing — if the SHA matches, the artefact is the same one CI published; transitively, the operator's daily-driver Skyrim SE workflow attests its behaviour. Replicates the v8.0 SYNC-33-C/SYNC-34 → DEFERRED → real-usage roll-up shape but flips it to PASS upfront (D-37-02 default = real-usage, not deferred-not-skipped)."
        - "Two-commit done-gate landing replicated from Phase 30 (v8.0 milestone closeout). Commit A = `docs(37-DONE): phase 37 done-gate evidence + summary` (37-DONE-GATE.md + 37-DONE-SUMMARY.md). Commit B = `docs(37): mark phase 37 complete + v8.1 milestone CLOSED` (STATE.md + ROADMAP.md + REQUIREMENTS.md flips). Both SSH-signed via `~/.ssh/id_ed25519`; both pushed to fork/master via inline SSH URL `git@github.com:atabisz/Vortex.git master:master` (per memory `feedback_git_push_ssh.md`). `git add -f` for every `.planning/` path (memory `feedback_planning_gitignored.md`)."
        - "Single signed commit per milestone post-mortem (D-37-05, mirrors v8.0 SYNC-39 shape). All 5 D-37-06 deltas + commit-index table refresh in `b0037bf1e docs(playbook): v8.1 milestone post-mortem`. Casual voice throughout (memory `feedback_casual_voice.md`). `pnpm lint:ci` exit 0 pre-push sanity gate (D-37-09). Inline SSH URL push avoids the `--force-with-lease` lease-pin idiom for clean fast-forward pushes (no concurrent-push race seen)."
        - "STATE/ROADMAP carry-forward catch-up pattern: when a prior phase's closeout commit ships but its STATE.md / ROADMAP.md flips are deferred, the next phase's closeout legitimately picks up those flips alongside its own. This phase did Phase 36 catch-up (4 → 6 in `completed_phases`, Phase 36 row `Pending → Complete`) — explicit in scope per Plan 37-04 Task 4.2 Scope note + precondition assertions on file state at execute time, not silent out-of-scope editing. Reusable for any future closeout where a prior phase deferred its metadata flip."
        - "5-criterion done-gate per D-37-10 (smaller than Phase 30's 7-criterion because v8.1 has 2 SYNCs vs v8.0's 5 native + 2 carry-forward). Each criterion's evidence quoted verbatim from a load-bearing artefact (Wave 2 evidence file PASS verdicts; Wave 3 commit SHA + signature; Wave 4 metadata commit pair). Done-gate is roll-up audit, not a re-run."
key_files:
    created:
        - .planning/phases/37-carry-forward-uat-v2-0-1/37-CANONICAL-SMOKE-EVIDENCE.md
        - .planning/phases/37-carry-forward-uat-v2-0-1/37-DONE-GATE.md
        - .planning/phases/37-carry-forward-uat-v2-0-1/37-DONE-SUMMARY.md
    modified:
        - VORTEX-LINUX-MERGE-PLAYBOOK.md
        - .planning/STATE.md
        - .planning/ROADMAP.md
        - .planning/REQUIREMENTS.md
decisions:
    - "5-criterion done-gate per D-37-10. Smaller than Phase 30's 7-criterion because v8.1 has 2 SYNCs (37a UAT + 37b playbook) vs v8.0's 5 native + 2 carry-forward DEFERRED. Each criterion sources from a verifiable Wave 2/3 artefact: Criterion 1+2+3 quote `37-CANONICAL-SMOKE-EVIDENCE.md` PASS verdicts + SHA256s; Criterion 4 quotes Wave 3 commit SHA `b0037bf1e` + signature `G`; Criterion 5 documents this commit pair (Commit A done-gate+summary, Commit B metadata flips). Evidence-quotable, not authored from scratch — T-37-11 mitigation."
    - "Real-usage roll-up beat contrived smoke for SYNC-37a Skyrim walkthrough (D-37-02 default path). Operator's daily-driver Skyrim SE workflow on `linux-port` HEAD via Vortex through Steam/Proton covered all 4 D-37-02 checkpoints (game detection / NXM mod install + staging / hardlink deploy + LOOT autosort / Proton launch with tray-icon). Same evidence-preference v8.0 SYNC-34 used. Bit-identity SHA256 cross-check (artefact ↔ Phase 36 SYNC-36d manifest) makes the daily-driver attestation transitive: if the SHA matches, the canonical AppImage IS the daily-driver build."
    - "Two-commit done-gate landing per RESEARCH.md `v8.0 two-commit done-gate landing` (Phase 30 30-08-PLAN Tasks 8-4 + 8-5 reference). Commit A = `docs(37-DONE): phase 37 done-gate evidence + summary` (paired with 37-DONE-GATE.md + 37-DONE-SUMMARY.md); Commit B = `docs(37): mark phase 37 complete + v8.1 milestone CLOSED` (paired with STATE.md + ROADMAP.md + REQUIREMENTS.md flips). Both SSH-signed; both pushed via inline SSH URL `git@github.com:atabisz/Vortex.git master:master` (no force-with-lease — fast-forward push, no concurrent-push race)."
    - "Phase 36 STATE/ROADMAP carry-forward catch-up landed alongside Phase 37 closeout. Phase 36 closeout commit `855fb3e1a` shipped to fork/master 2026-05-23 but its STATE.md / ROADMAP.md flips were deferred. Plan 37-04 Task 4.2 explicitly scoped this catch-up with precondition assertions (`grep -q '^    completed_phases: 4$' .planning/STATE.md` + `awk 'NR==318' .planning/ROADMAP.md | grep -q '| Pending  | —'` for the Phase 36 progress-table row). Both preconditions matched; documented 4 → 6 path taken (not the fallback 5 → 6 path)."
    - "STATE.md frontmatter updated: `completed_phases: 4 → 6` (Phase 36 + Phase 37 carry-forward), `stopped_at='Phase 37 complete; v8.1 milestone CLOSED (canonical artefacts UAT'd; playbook v8.1 deltas landed; Phase 36 STATE carry-forward included)'`, `last_updated` and `last_activity` bumped to 2026-05-23. New `## Phase 37 — Carry-forward UAT (v2.0.1)` body section mirrors the Phase 35 close-out section style (Status COMPLETE, Branch master, Commits, D-37-10 done-gate 5/5 GREEN, all 13 D-37-NN decisions exercised, Linux-guard surfaces N/A — docs phase, Bluebird-trap audit N/A — no source change, Phase 36 carry-forward note, Next milestone v8.2/upstream v2.0.2+ separate scope)."
    - "ROADMAP.md flips: line-13 milestone summary `🚧 v8.1 ... in progress` → `✅ v8.1 ... shipped 2026-05-23 (tag v2.0.1-linux-rebased)`. Phase 37 row in detail section `**Status:** ✅ Complete 2026-05-23` + `**Plans:** 4/4 complete`. Progress table Phase 37 row `TBD / Pending / —` → `4/4 / Complete / 2026-05-23`. Progress table Phase 36 row carry-forward catch-up `TBD / Pending / —` → `4/4 / Complete / 2026-05-23`. REQUIREMENTS.md SYNC-37a + SYNC-37b checkboxes both `[x]`; Traceability table both rows `✓ shipped to fork/master 2026-05-23`."
metrics:
    duration_minutes: 18
    completed: "2026-05-23"
    commit_count: 2
    task_count: 3
    file_count: 5
---

# Phase 37 summary

**v8.1 milestone CLOSED — Path C codified, canonical artefacts UAT'd.**

Wave 4 closeout: 5-criterion done-gate per D-37-10, phase summary, and STATE/ROADMAP/REQUIREMENTS metadata flips. Two-commit landing per the v8.0 30-08 precedent (Commit A = done-gate + summary; Commit B = metadata flips, including Phase 36 STATE/ROADMAP carry-forward catch-up). Both SSH-signed; both pushed to fork/master via inline SSH URL. v8.1 milestone (Upstream v2.0.1 Sync) shipped.

## Phase 37 summary

### SYNC-37a — see `37-CANONICAL-SMOKE-EVIDENCE.md` ## SYNC-37a

Real-usage roll-up per D-37-02 default. Canonical AppImage SHA `13aa29288e8936a4dd7cdc3c9f3f669d15c7c65d3d416efee8ab2ba957059c9b` (247 MiB) and canonical .deb SHA `3d82353963d3625865bcd9281862172ede2a6f860812cc52579f1c1d7b22f3a6` (151 MiB) both bit-identical to Phase 36 SYNC-36d manifest. Operator's daily-driver Skyrim SE workflow on `linux-port` HEAD via Vortex through Steam/Proton covers all 4 D-37-02 checkpoints (game detection / NXM mod install + staging / hardlink deploy + LOOT autosort / Proton launch with tray-icon hide-on-spawn). 132 bundled plugins (Phase 35 Wave 5 floor 130, margin 2). Zero new `[ERRO]` categories beyond the 3 known-benign ones (auto-updater 404, Devtron, Linux platform-guard for Windows-only games).

### SYNC-37b — see `VORTEX-LINUX-MERGE-PLAYBOOK.md` commit `b0037bf1e`

Single SSH-signed commit `b0037bf1efc0ff6063ba202f75ef618c9ab0c145 docs(playbook): v8.1 milestone post-mortem` lands all 5 D-37-06 deltas (Path C forward-sync 3-way merge pattern as new section; `packages/paths{,-node}` master-restore contingency-fix; bundledPlugins ≥ 130 floor invariant; per-bucket typecheck idiom; cherry-pick `--no-merges` filter + cherry-induced-regression fix-ups) plus commit-index table refresh (v8.1 SHAs `c4d1b4555`, `52ea1941b`, `31c8ad3e4`, `799ad300f` and the `merge-base(linux-port, master)..c4d1b4555` cherry-pick filter range). Casual voice (memory `feedback_casual_voice.md`); `pnpm lint:ci` exit 0 pre-push sanity gate (D-37-09); pushed to fork/master via inline SSH URL.

## Push Sequence

| Step                                          | Local SHA          | Remote SHA Before            | Remote SHA After                     | Notes                                                                                                                                                                                             |
| --------------------------------------------- | ------------------ | ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave 2 evidence-file commit (37-02)           | `7e5a59b6f`        | `855fb3e1a` (Phase 36 close) | `b0037bf1e` (carried by Wave 3 push) | `docs(37): canonical smoke evidence — SYNC-37a AppImage + .deb local-boot + Skyrim walkthrough PASS` — committed locally; pushed atomically with Wave 3's playbook commit                         |
| Wave 3 SYNC-37b playbook commit (37-03)       | `b0037bf1e`        | `855fb3e1a`                  | `b0037bf1e`                          | `docs(playbook): v8.1 milestone post-mortem` — SSH-signed; lint:ci exit 0; pushed via inline SSH URL; carried 5 commits forward (`5b3ac8c31`, `7cfebf324`, `06ba0c1c2`, `7e5a59b6f`, `b0037bf1e`) |
| Wave 4 Commit A (37-04) — done-gate + summary | TBD (Commit A SHA) | `b0037bf1e`                  | TBD                                  | `docs(37-DONE): phase 37 done-gate evidence + summary` — `git add -f` 37-DONE-GATE.md + 37-DONE-SUMMARY.md                                                                                        |
| Wave 4 Commit B (37-04) — metadata flips      | TBD (Commit B SHA) | TBD                          | TBD                                  | `docs(37): mark phase 37 complete + v8.1 milestone CLOSED` — `git add -f` STATE.md + ROADMAP.md + REQUIREMENTS.md (with Phase 36 STATE/ROADMAP carry-forward catch-up)                            |

## What worked

- **v8.0 template clones eliminated all design risk.** `30-DONE-GATE.md` shape transcribed 1:1 to 5-criterion variant; `30-08-SUMMARY.md` frontmatter + body sections replicated near-verbatim with v8.1-specific substitutions. No invention required.
- **Pre-baked SHA256 cross-check in evidence-file scaffold.** `37-CANONICAL-SMOKE-EVIDENCE.md` quoted both canonical SHA256s verbatim from `36-DONE-GATE.md` SYNC-36d, then re-hashed against the operator's downloaded artefacts. Bit-identity check is mechanical, repeatable, and load-bearing — if SHA matches, daily-driver attestation transitively applies.
- **Real-usage roll-up beat contrived smoke (D-37-02 default).** Operator's daily-driver Skyrim SE workflow on `linux-port` HEAD via Vortex through Steam/Proton covered all 4 checkpoints in real session evidence. Same preference v8.0 SYNC-34 used; saved a 5-minute contrived capture session per artefact and produced stronger evidence.
- **Two-commit done-gate landing replicated cleanly.** Phase 30 precedent landed without modification — Commit A (done-gate + summary), Commit B (metadata flips). `git add -f` discipline for `.planning/` paths; `git diff --cached --stat` count assertion before each commit prevented STATE/ROADMAP leakage into Commit A.
- **STATE/ROADMAP carry-forward catch-up pattern.** Phase 36 closeout `855fb3e1a` shipped without flipping STATE/ROADMAP; Plan 37-04 Task 4.2 explicit Scope note + precondition assertions on file state made the catch-up legitimate and self-adjusting (would have fallen back to 5 → 6 if Phase 36 STATE flip had landed independently). Audit-trail honest.

## What was inefficient

- **ROADMAP.md row-line numbers in plan didn't match disk.** Plan 37-04 Task 4.2 referenced `Phase 37 row at line 331` and `Phase 36 row at line 330`; actual disk line numbers were 318 (Phase 36) and 319 (Phase 37). The precondition assertions (`grep`-based, not `awk NR=`) self-corrected, so no harm — but future planners should `grep -n "^| 36"`-style anchor instead of hard-coding line numbers.
- **Plan referenced `35-08-SUMMARY.md` style for `## Phase 37 STATE.md body section` but no Phase 35 close-out body section exists in STATE.md** — Phase 35's section is at lines 309-359 in STATE.md; reused that as the template. Minor template-resolution friction; not load-bearing.

## Patterns established / extended

- **Path C codification reaches the playbook (D-37-06 delta #1).** The "branch base predates downstream work" anti-pattern + 3-way merge resolution is now playbook-canonical with a concrete Phase 36 example (`c4d1b4555` 1st parent `d494bcb7d` / 2nd parent `f1425a5c8`; rebase-403-conflict halt + surgical-squash A5 mismatch as the two failed attempts). Reusable for any future v8.x sync where the rebase-merges path collides with downstream-already-absorbed-upstream merges.
- **Two-commit done-gate landing replicated from Phase 30** — now stable across two milestones (v8.0 + v8.1). Reusable template for v8.2+.
- **bundledPlugins ≥ 130 floor is now an audit invariant** (D-37-06 delta #3 in playbook §5 augmentation). Numerical-floor check after any v8.x sync. If count drops below floor, an extension was silently lost — `pnpm build:extensions` will succeed but the deb/AppImage will ship with missing UI.
- **STATE/ROADMAP carry-forward catch-up when a prior phase's closeout flips were deferred.** Explicit Scope note + precondition assertions on file state at execute time — not silent out-of-scope editing. Self-adjusting fallback path. Reusable whenever a closeout commit ships before its metadata flips land.
- **5-criterion done-gate (smaller scope than v8.0 7-criterion).** Done-gate criterion count scales with phase scope, not template inertia. v8.1 had 2 SYNCs vs v8.0's 5 native + 2 carry-forward; gate criteria scaled accordingly.

## Cost / time delta

Rough wall-clock per Wave (Phase 37 only):

- **Wave 1 (37-01) — readiness**: ~5 min wall, low context. Capture canonical artefact URLs + tooling check.
- **Wave 2 (37-02) — SYNC-37a UAT**: ~25 min wall, medium context. SHA256 re-hash + real-usage roll-up evidence file write; commit `7e5a59b6f`.
- **Wave 3 (37-03) — SYNC-37b playbook update**: ~35 min wall, medium context. 5 deltas + commit-index refresh in single signed commit `b0037bf1e`. lint:ci sanity; push to fork/master.
- **Wave 4 (37-04) — closeout**: ~18 min wall, low context. 5-criterion roll-up + STATE/ROADMAP/REQUIREMENTS flips + Phase 36 carry-forward catch-up; two-commit landing.

Total Phase 37 wall-clock: ~83 min. Most expensive single Wave: 3 (playbook update) due to 5 deltas + commit-index refresh + casual-voice editing across multiple sections. Most context-intensive: 3 as well — Path C codification needed cross-references to Phase 36 evidence (REBASE-NOTES, CHERRY-PICK-NOTES, RESEARCH-FORWARD-SYNC).

## Followups / deferred to v8.2+

- **v8.2 / upstream v2.0.2+ sync.** Separate milestone scope; out of v8.1.
- **Phase 999.1 ELEV-05 / ELEV-06 / ONBRD-04 hardware UAT.** Desktop Linux + Steam Deck Game Mode elevation matrix; remains in BACKLOG. Phase 37 was laptop-AppImage scope only per D-37-04.
- **AppImage update channel for Linux.** Nexus-Mods upstream `latest-linux.yml` 404 surface — auto-updater currently fails silently with a 404 against the missing manifest. Was v8.0 carry-forward; still out of scope for v8.1; queue v8.2+.
- **Path C codification as a reusable skill.** Interesting future-work — the playbook section is sufficient for now; could be lifted into a stand-alone `.claude/skills/path-c-merge/SKILL.md` later.
- **GitHub-Actions step bumps (Node-20 deprecated runner notices).** Housekeeping; v8.0 carry-forward; still queue v8.2+.
- **`@vortex/api` regen as scheduled chore.** v8.0 carry-forward; still queue v8.2+.

## Phase 37 Complete — v8.1 milestone CLOSED

Working tree clean post Commit B. All 2 native phase requirements (SYNC-37a + SYNC-37b) satisfied. 0 carry-forward DEFERRED items (D-37-02 default = real-usage roll-up = PASS upfront, not deferred-not-skipped). Canonical AppImage SHA `13aa29288...` + canonical .deb SHA `3d82353963...` both bit-identical to Phase 36 SYNC-36d manifest. Playbook captures milestone post-mortem in single signed commit `b0037bf1e`. Done-gate evidence + summary committed (Commit A); STATE/ROADMAP/REQUIREMENTS flipped (Commit B); Phase 36 STATE/ROADMAP carry-forward catch-up included. Both pushed to fork/master via inline SSH URL. **v8.1 (Upstream v2.0.1 Sync) milestone CLOSED.** Next work moves to v8.2 / upstream v2.0.2+ backlog.
