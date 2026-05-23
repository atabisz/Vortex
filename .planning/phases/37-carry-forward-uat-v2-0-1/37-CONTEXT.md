# Phase 37: Carry-forward UAT (v2.0.1) — Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Mode:** `--auto` (Claude auto-selected recommended option for every gray area; single-pass)

<domain>
## Phase Boundary

Close out the v8.1 milestone with two non-code workstreams that ride on top of the canonical `v2.0.1-linux-rebased` build delivered by Phase 36:

1. **SYNC-37a — Carry-forward UAT against canonical artefacts.** Local-boot verification of the AppImage + .deb published by Phase 36 (run URL `26323706583`, AppImage SHA256 `13aa29288...`, .deb SHA256 `3d8235396...`); 4-screenshot Skyrim SE walkthrough on the canonical AppImage. v8.0 precedent: SYNC-33-C + SYNC-34 deferred to Phase 30, both PASS via real-usage roll-up. Phase 999.1 covers desktop-Linux + Steam Deck elevation hardware UAT and is unchanged by this phase.
2. **SYNC-37b — Playbook post-mortem update.** Land v8.1 deltas in `VORTEX-LINUX-MERGE-PLAYBOOK.md`. Codify the **Path C forward-sync 3-way-merge pattern** as the canonical response to the "branch base predates downstream work" anti-pattern (the v8.1 base mismatch surfaced by `project_v8_1_base_mismatch.md`); add Phase 35's `packages/paths` master-restore contingency-fix; bundledPlugins floor; per-bucket typecheck idiom; cherry-pick `--no-merges` filter; cherry-induced-regression fix-up shape (Wave 5's two atomic fix-ups). Single signed commit on `master`.

**In scope:** local-boot AppImage + .deb verification, 4-screenshot Skyrim walkthrough, playbook update on `master`, Phase 37 done-gate, milestone closeout (STATE + ROADMAP + REQUIREMENTS).
**Out of scope:** any code change in `src/`/`packages/`/`extensions/`; any cherry-pick to `linux-port` (Phase 36 owned that); upstream PR (memory `project_upstream_pr_policy.md`); Phase 999.1 ELEV-05/ELEV-06 hardware UAT (BACKLOG, separate scope); upstream v2.0.2+ sync (separate milestone).

</domain>

<decisions>
## Implementation Decisions

### SYNC-37a — Local-boot UAT

- **D-37-01 — Two-artefact local-boot scope.** Verify both AppImage and .deb against the published Phase 36 release (`v2.0.1-linux-rebased`). AppImage: `chmod +x` then run from `~/Downloads/`. .deb: `sudo apt install ./vortex_amd64.deb`, then launch via desktop entry / `vortex` shim. Capture: SHA256 re-hash of downloaded artefacts (must match `latest-linux.yml` and the Phase 36 done-gate manifest), boot to first window, version string visible in About / title bar (== `v2.0.1-linux-rebased`'s electron-builder internal `1.16.202605230443`), no console errors at startup. Rationale: v8.0 SYNC-33-C precedent (Phase 30 closed against canonical); both packages ship to users, both must boot.
- **D-37-02 — 4-screenshot Skyrim walkthrough = real-usage roll-up by default.** Skyrim SE is the daily driver on `linux-port` HEAD via Vortex through Steam/Proton; v8.0 SYNC-34 closed via real-usage roll-up evidence, not a contrived 5-minute capture. Same pattern here: capture 4 checkpoints from a real Skyrim session (game detection / NXM mod install + staging populated / hardlink deploy + LOOT autosort / Proton launch with tray-icon visible). Specific 4 checkpoints below in `<specifics>`. If real-usage roll-up isn't available within the day, fall back to a clean 5-minute Skyrim SE Steam smoke against canonical AppImage with the same 4 screenshots — operator's call at execute time.
- **D-37-03 — Evidence file shape.** `37-CANONICAL-SMOKE-EVIDENCE.md` mirrors v8.0's `30-CANONICAL-SMOKE-EVIDENCE.md`: `## SYNC-37a — Local-boot AppImage`, `## SYNC-37a — Local-boot .deb`, `## SYNC-37a — Skyrim SE walkthrough` with PASS/FAIL verdict per section + verbatim acceptance text + checkpoint screenshot paths under `screenshots/` subdirectory. SHA256 re-hash captured under each artefact section. Cross-reference `36-DONE-GATE.md` SYNC-36d table for source-of-truth manifest.
- **D-37-04 — Hardware UAT explicitly OUT of scope.** Phase 999.1 (ELEV-05/ELEV-06 + ONBRD-04) owns desktop Linux + Steam Deck Game Mode elevation hardware checklist. Phase 37 is a Linux-laptop AppImage + .deb smoke, not a hardware matrix. If something fails on the operator's daily-driver, file as a Phase 37 finding **and** queue a Phase 999.1 entry — don't expand Phase 37 scope.

### SYNC-37b — Playbook post-mortem

- **D-37-05 — Single signed commit on master, casual voice.** All v8.1 playbook deltas land in one SSH-signed commit on `master`. Commit body: "Why v8.1 needed playbook updates: 5 deltas surfaced by a 656-commit upstream rebase across Phases 32-35 + a Path C forward-sync merge in Phase 36." Casual voice (memory `feedback_casual_voice.md`); not a formal release-notes section. v8.0 SYNC-39 precedent ("5 deltas + commit-index row" single-commit shape) is the template.
- **D-37-06 — Five v8.1 deltas to capture.** All five are load-bearing — none are nice-to-have:
    1. **Path C forward-sync 3-way merge pattern** (NEW SECTION). The "branch base predates downstream work" anti-pattern encoding. Trigger: branch base SHA precedes one or more downstream merges that already absorbed an upstream parent. Symptoms: `git rebase --rebase-merges` halts with hundreds of conflicts at the central upstream-merge commit. Diagnostic: `git merge-base --is-ancestor <upstream-merge-1st-parent> master` returns 1 (ancestor relationship missing). Resolution: `git merge --no-ff <feature-branch>` from `master` tip — produces byte-equivalent post-divergence-resolution tree without the rebase pathology. Tag the merge commit; both ancestries reachable via 1st/2nd parent. Concrete example: Phase 36 merge `c4d1b4555` (1st parent `d494bcb7d` master / 2nd parent `f1425a5c8` v8.1/config-bucket); two prior attempts failed (rebase 403-conflict halt at central upstream-merge `aa3faf7e5`; surgical squash Stage A5 same mismatch). Codify with rollback-tag pattern: `phase{N}/master-pre-merge` + `phase{N}/pre-surgical-snapshot` snapshot tags before merge.
    2. **`packages/paths{,-node}` master-restore contingency-fix** (Past gotchas section). When the upstream feature branch surfaces 130 aggregate-typecheck errors against `@vortex/paths` exports (`pathLengthBucketRoot`, `BucketKey`, `getBucketKeyForPath`), check whether `master` has the source files and the feature branch dropped them inadvertently — restore via `git checkout master -- packages/paths{,-node}/src/` rather than re-implementing. Phase 35 Wave 2 cut typecheck 130 → 0 with one restore commit `52ea1941b`. Rule: when the symptom is "exports missing", check master before reaching for new code.
    3. **bundledPlugins floor invariant** (Post-merge checklist §5 augmentation). Add a numerical floor count to the existing "bundled plugins populated" check. After any v8.x sync, `bundledPlugins.length ≥ 130` (Phase 35 Wave 5 confirmed 132 against the v2.0.1 tree). If the count drops below floor on a fresh merge, an extension was silently lost from the build and `pnpm build:extensions` will succeed but the deb/AppImage will ship with missing UI. Capture command: `node -p 'require("./src/main/build/main.js").bundledPlugins?.length || "n/a"'` after `pnpm build`.
    4. **Per-bucket typecheck idiom** (`§11 Deliberate test-runner divergences` neighbour, or new `§12 Per-bucket gates`). When aggregate `pnpm typecheck` exit-status is dominated by a single deferrable bucket (Phase 34's renderer-bucket 9 errors all in `extensions/download_management/`), accept "5/6 buckets clean modulo deferred bucket N" as a pass shape with explicit Phase-N+1 close-out — rather than blocking the phase on a deferral. Phase 35 Wave 1 closed the renderer bucket by dropping the dead code; the rule survives as: per-bucket gates first, aggregate gate last, each bucket failure tied to a named scope.
    5. **Cherry-pick `--no-merges` filter + cherry-induced-regression fix-up shape** (`§Cherry-pick to linux-port` augmentation; v8.0 had a path-filter pattern but not these two). After a Path C merge, cherry-picking the path-filtered Linux subset onto `linux-port` requires `--no-merges` to exclude the Wave 1 forward-sync merge AND any v8.x PR-merges in the 2nd-parent ancestry (Phase 36: 119 v8.1 PR-merges + Wave 1 merge excluded; 407 candidates after `--no-merges` + patch-id dedup). Two concrete fix-up patterns to document: (a) cherry-induced orphan (cherry deleted `DownloadManager.ts` but a prior formatter cherry preserved `DownloadObserver.ts` via `--ours` → revert the delete-cherry, restore both files); (b) cherry-induced dropped-hunk (cherry's `pnpm-workspace.yaml` + `pnpm-lock.yaml` hunks dropped during loop → manual workspace bump in a follow-up commit). Both ride atop the cherry-loop end SHA, both SSH-signed, both atomic.
- **D-37-07 — Update commit-index table.** Playbook has a per-section commit-index table. Refresh: add the v8.1 commit IDs (Path C merge `c4d1b4555`, packages/paths restore `52ea1941b`, Wave 5 fix-ups `31c8ad3e4` + `799ad300f`) and the cherry-pick filter range (`merge-base(linux-port, master) = 538aef374..c4d1b4555`).

### Sequencing & risk

- **D-37-08 — SYNC-37a runs FIRST, SYNC-37b SECOND.** SYNC-37a verifies the canonical artefacts boot — that's the gate for "v8.1 is real". SYNC-37b is documentation-only and depends on Phase 36 evidence already captured in `36-DONE-GATE.md` + `36-CHERRY-PICK-NOTES.md` + `36-REBASE-NOTES.md` — it can land any time after Phase 36 closes, but landing it AFTER SYNC-37a means the playbook section can cite the UAT verdict (Phase 37 done-gate) instead of a forward-reference. Single-pass sequencing.
- **D-37-09 — Push expectation: SYNC-37b commit pushed to `fork/master` immediately after lint:ci sanity check.** Playbook is a markdown doc; commit is one file change. After commit, run `pnpm lint:ci` (must exit 0) + verify the SSH signature (`git log -1 --format='%G?'` = `G`); push to `fork/master` via the same FF push pattern Phase 36 closeout used (`git push git@github.com:atabisz/Vortex.git master` — inline SSH URL per memory `feedback_git_push_ssh.md`). No PR — branch protection allows non-force pushes by the operator account; falls back to PR if the protection rejects.
- **D-37-10 — Phase 37 done-gate shape.** 5-criterion done-gate (smaller than Phase 36's 7 because there are 2 SYNCs not 4): (1) SYNC-37a AppImage local-boot PASS + SHA256 match + screenshot, (2) SYNC-37a .deb local-boot PASS + SHA256 match + screenshot, (3) SYNC-37a Skyrim walkthrough PASS + 4 screenshots OR real-usage roll-up text, (4) SYNC-37b playbook commit landed on master with 5 deltas + commit-index refresh, (5) STATE.md + ROADMAP.md + REQUIREMENTS.md updated to reflect milestone close. All 5 = GREEN → milestone v8.1 ships.

### Operational invariants (carry-forward)

- **D-37-11 — bluebird Promise scan still applies.** No code change in this phase, but if the playbook update mentions specific lines or example snippets, do not introduce `:Promise<T>` annotations that conflict with bluebird-imported files (memory `feedback_bluebird_promise_trap.md`). Documentation-only commit, but the rule still applies to anything quoted.
- **D-37-12 — `.planning/` is gitignored.** Phase 37 done-gate + STATE/ROADMAP/REQUIREMENTS commits use `git add -f` for any `.planning/**` paths (memory `feedback_planning_gitignored.md`). The playbook commit (`VORTEX-LINUX-MERGE-PLAYBOOK.md`) is at repo root — no `-f` needed.
- **D-37-13 — SSH-signed commits, no `--no-verify`.** Every commit in this phase is SSH-signed via `~/.ssh/id_ed25519` (memory `feedback_ssh_signing.md`). Husky pre-commit hook runs `pnpm lint-staged`; it has bitten us when `pnpm` isn't on PATH — corepack shim PATH workaround documented in v8.1 notes from Phase 36 close (`export PATH="/home/alex/.local/share/pnpm/nodejs/22.14.0/lib/node_modules/corepack/shims:$PATH"`).

### Claude's Discretion

- Plan-shape sequencing (number of plans / waves / verification cadence) — leave to `gsd-planner`. Likely shape: 4-5 plans (Wave 0 readiness + AppImage UAT + .deb UAT + Skyrim walkthrough + playbook update + done-gate) or a tighter 3-plan shape (UAT bundle + playbook + done-gate). Planner's call.
- Whether `gsd-planner` wants a research pass (`gsd-phase-researcher`) — most of Phase 37 is repeating v8.0 patterns (SYNC-33-C/34/39 templates), so a heavy research pass is probably overkill. If the planner opts in, the research focus should be the canonical artefact validation pattern + the Path C section structure within the existing playbook (where in the file to slot it, neighbouring sections to update).
- Tie-breaker on screenshot capture method (Wayland vs X11, GIMP vs ksnip vs gnome-screenshot) — operator-driven; not a Phase 37 decision.
- Whether SYNC-37b commit is a single commit or split into per-delta commits — single commit per D-37-05; if the planner wants atomic per-delta for cherry-pick reversibility, that's an acceptable variation as long as casual voice + SSH sign + lint:ci sanity hold.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v8.0 Phase 30 — direct precedent for both SYNC-37a and SYNC-37b

- `.planning/milestones/v8.0-phases/30-land-tag/30-CANONICAL-SMOKE-EVIDENCE.md` — the SYNC-33-C / SYNC-34 evidence file template. Replicate shape verbatim for `37-CANONICAL-SMOKE-EVIDENCE.md`.
- `.planning/milestones/v8.0-phases/30-land-tag/30-DONE-GATE.md` — 7-criterion done-gate that included carry-forward SYNC-33-C + SYNC-34. Phase 37 done-gate is the v8.1 equivalent (5-criterion since fewer SYNCs).
- `.planning/milestones/v8.0-phases/30-land-tag/30-08-PLAN.md` — done-gate plan structure including SYNC-39 (playbook update single-commit pattern).
- `.planning/milestones/v8.0-phases/29-build-verification/29-10-SUMMARY.md` — describes the DEFERRED-not-skipped pattern + explicit Phase-N+1 acceptance text rule that v8.1 inherits.

### Phase 36 evidence (input to SYNC-37a)

- `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-DONE-GATE.md` — SYNC-36d table: AppImage SHA256 `13aa29288e8936a4dd7cdc3c9f3f669d15c7c65d3d416efee8ab2ba957059c9b`, .deb SHA256 `3d82353963d3625865bcd9281862172ede2a6f860812cc52579f1c1d7b22f3a6`, release-linux.yml run `26323706583`, release page URL.
- `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-CHERRY-PICK-NOTES.md` — Wave 5 cherry-loop + 2 fix-ups (input to SYNC-37b delta #5).
- `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-REBASE-NOTES.md` — Path C 3-way merge per-conflict resolution log (input to SYNC-37b delta #1).
- `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-CONTEXT.md` — Strategy Deviation section (3-attempt history) verbatim source for Path C codification.
- `.planning/phases/36-land-tag-cherry-pick-v2-0-1/36-RESEARCH-FORWARD-SYNC.md` — load-bearing research doc that codified Path C; SYNC-37b should reference it for the "diagnostic" subsection.

### Phase 35 evidence (input to SYNC-37b deltas #2, #3, #4)

- `.planning/phases/35-build-verification-v2-0-1/35-DONE-GATE.md` — D-35-10 7-criterion gate; Wave 2 contingency-fix `52ea1941b` packages/paths restore (delta #2); Wave 5 bundledPlugins=132 floor evidence (delta #3); per-bucket typecheck flow (delta #4).
- `.planning/phases/35-build-verification-v2-0-1/35-08-SUMMARY.md` — closeout summary; the 130-error → 0 typecheck flip is documented here.

### Playbook target

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` (repo root) — destination for SYNC-37b. Existing structure: post-merge checklist §1-§10 + §11 (test-runner divergences) + "What we've learned the hard way" section. Path C codification is a NEW section between §11 and "What we've learned" (or as `§12 Path C forward-sync` — planner's call). Other 4 deltas slot into existing sections (§5 augmentation, "Past gotchas" addition, etc.).

### Operational invariants

- `CLAUDE.md` — branch strategy table; Phase 37 commits land on `master` only (linux-port unchanged after Phase 36 Wave 5).
- `AGENTS.md` — `pnpm run` for repo commands.
- `~/.claude/projects/-home-alex-src-Vortex/memory/MEMORY.md` — operational memory:
    - `feedback_casual_voice.md` — playbook commit body voice.
    - `feedback_ssh_signing.md` — every commit SSH-signed.
    - `feedback_planning_gitignored.md` — `git add -f` for `.planning/` paths.
    - `feedback_git_push_ssh.md` — inline SSH URL push pattern.
    - `feedback_minimize_upstream_diff.md` — playbook is a fork-only doc; freeform but minimize unrelated reformatting.
    - `feedback_bluebird_promise_trap.md` — applies to any code snippets quoted in the playbook update.
    - `project_upstream_pr_policy.md` — Phase 37 doesn't touch upstream; informational.
    - `project_v8_1_base_mismatch.md` — the load-bearing memory describing the "branch base predates downstream work" condition that Path C resolves; primary source for delta #1.

### Live state (captured 2026-05-23 post-Phase-36)

- `fork/master` HEAD = `855fb3e1a` (Phase 36 closeout commit)
- `fork/linux-port` HEAD = `799ad300f` (Phase 36 Wave 5 fix-ups end)
- `v2.0.1-linux-rebased` tag = `dbef02338` (annotated SSH-signed; targets `c4d1b4555`)
- Release page: `https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased`
- Phase 999.1 (ELEV-05/ELEV-06/ONBRD-04 hardware UAT) — BACKLOG, untouched by Phase 37.

### Tools verified available

- `git` with `gpg.format=ssh`, `tag.gpgsign=true`.
- `gh` (authenticated; `GH_TOKEN` env-var fallback per memory).
- `~/.ssh/id_ed25519` (signing key).
- pnpm 10.33.0+; husky pre-commit + lint-staged on `master`.
- Steam + Proton + Skyrim SE installed on operator's daily-driver Linux laptop (real-usage roll-up source).
- Curl + sha256sum (for re-hashing downloaded artefacts).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **v8.0 Phase 30 evidence files** as templates: `30-CANONICAL-SMOKE-EVIDENCE.md` shape transcribes 1:1 to `37-CANONICAL-SMOKE-EVIDENCE.md` with SHA + tag + run URL substitution.
- **`screenshots/` subdirectory pattern** (v8.0 Phase 30): committed via `git add -f .planning/phases/37-carry-forward-uat-v2-0-1/screenshots/*`. PNG only; no HEIC / no JPEG to keep git LFS off-table.
- **Playbook commit-index table** is already in `VORTEX-LINUX-MERGE-PLAYBOOK.md`; SYNC-37b updates rows in place + adds rows for v8.1 deltas. No new tables.

### Established Patterns

- **Single-commit playbook update** (v8.0 SYNC-39): one SSH-signed commit covering all deltas + commit-index refresh.
- **Real-usage roll-up evidence** (v8.0 SYNC-34): the daily-driver's actual workflow beats a contrived 5-minute capture for daily-driver titles. Phase 37 inherits this preference but keeps the contrived-walkthrough fallback as a planner option.
- **`pnpm lint:ci` exit 0 sanity gate before push** — Phase 35-36 Wave-end pattern; carries forward to SYNC-37b push.
- **Phase done-gate as roll-up audit** — Phase 36 7-criterion structure is the shape (5 criteria here since smaller scope).
- **Master-only commits, no linux-port touch** — Phase 36 Wave 5 owned the linux-port cherry-pick; Phase 37 stays on master.

### Integration Points

- **Phase 36 done-gate evidence chain** is input — SHA256 manifest + run URL flow into `37-CANONICAL-SMOKE-EVIDENCE.md` for re-hashing comparison.
- **Phase 35 + 36 wave artefacts** are input to SYNC-37b — quoted SHAs, conflict-count statistics, range commits all source from those done-gates and per-wave notes.
- **Milestone closeout** is the integration with `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` — flip Phase 37 to ✅ Complete; mark milestone v8.1 ✅ shipped; tick SYNC-37a + SYNC-37b in REQUIREMENTS; update milestones/v8.1-ROADMAP.md or equivalent if the milestone-archive pattern from v8.0 is followed (planner's call — v8.0 has milestone archive files; v8.1 likely will too).

</code_context>

<specifics>

## Specific Ideas

- **4 Skyrim walkthrough checkpoints** (matches v8.0 SYNC-34 D-29-03 mapping):
    1. Game detection — Vortex auto-detects Skyrim SE through Steam/Proton (`gamemode-activated` event captured); staging path resolves to `/media/alex/intel/Vortex/SkyrimSE` or equivalent.
    2. NXM mod install + staging populated — install one mod via NXM link OR manual install; staging directory shows the unpacked archive.
    3. Hardlink deploy + LOOT autosort — Deploy button activates hardlink_activator; LOOT post-deploy autosort runs without "ghost file" errors (playbook §3 LOOT casing rule active); deployed files visible in `~/.steam/steam/steamapps/common/Skyrim Special Edition/Data/`.
    4. Proton launch with tray-icon visible — launch Skyrim SE via Vortex's launch button; Proton spawns; Vortex tray icon hides during gameplay per playbook §8 hide-on-spawn invariant.
- **AppImage smoke is one screenshot:** the About dialog (or window title) showing version `1.16.202605230443` (electron-builder internal) + tag `v2.0.1-linux-rebased` (release page).
- **.deb smoke is one screenshot:** desktop entry / system menu showing the installed app, plus a launched Vortex window.
- **SHA256 re-hash command:** `sha256sum <downloaded>` and compare against `36-DONE-GATE.md` SYNC-36d manifest. Capture command output + diff verbatim in `37-CANONICAL-SMOKE-EVIDENCE.md`.
- **Plans likely needed (3-5, planner's call):**
    1. Pre-flight readiness: download AppImage + .deb from release page; capture SHA256 manifest; confirm screenshot tooling.
    2. SYNC-37a UAT: AppImage boot + .deb install/boot + Skyrim 4-screenshot OR real-usage roll-up; write `37-CANONICAL-SMOKE-EVIDENCE.md`.
    3. SYNC-37b playbook update: edit `VORTEX-LINUX-MERGE-PLAYBOOK.md` (5 deltas + commit-index refresh); single SSH-signed commit; `pnpm lint:ci` sanity; push to fork/master.
    4. Phase 37 done-gate (`37-DONE-GATE.md` 5-criterion roll-up) + milestone closeout (STATE/ROADMAP/REQUIREMENTS + milestone archive).

</specifics>

<deferred>

## Deferred Ideas

- **Phase 999.1 ELEV-05 / ELEV-06 / ONBRD-04 hardware UAT** — desktop Linux + Steam Deck Game Mode elevation matrix; remains in BACKLOG. Phase 37 is laptop-AppImage scope only.
- **Upstream PR to Nexus-Mods/Vortex** — fork PRs not accepted (memory `project_upstream_pr_policy.md`); origin tag push was already informational in Phase 36.
- **AppImage update channel** — v8.0 deferred carry-forward; still out of scope for v8.1 (separate milestone).
- **`@vortex/api` regen as routine commit** — housekeeping; not v8.1.
- **GitHub Actions step bumps (Node-20 deprecated runner notices)** — housekeeping; not v8.1.
- **v8.2 / upstream v2.0.2+ sync** — separate milestone; Phase 37 closes v8.1, not opens v8.2.
- **Path C codification as a reusable skill** — interesting future-work but the playbook section is sufficient for now; could be lifted into a stand-alone `.claude/skills/path-c-merge/SKILL.md` later.

</deferred>

---

_Phase: 37-carry-forward-uat-v2-0-1_
_Context gathered: 2026-05-23_
