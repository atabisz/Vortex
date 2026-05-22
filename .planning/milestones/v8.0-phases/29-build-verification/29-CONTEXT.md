# Phase 29: Build verification + AppImage/.deb smoke - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Branch:** `v8.0/config-bucket` @ `70f8547ab` (Phase 28 done; remote `fork/sync/upstream-v2.0.0` synced)

<domain>
## Phase Boundary

Verify that the merge-clean tree produced by Phase 28 actually builds, types, lints, tests, packages, and runs end-to-end on Linux. No new code in scope — every requirement here is a measurement of work already landed in Phases 24–28. The phase produces evidence (exit codes, artefact hashes, screenshots) and a SMOKE-EVIDENCE record; it does not modify source.

**Scope:** SYNC-01, SYNC-21, SYNC-28, SYNC-29, SYNC-30, SYNC-31, SYNC-32, SYNC-33, SYNC-34 (9 of 9 requirements).

## Success criteria (≤6, measurable)

1. **SYNC-01:** `git grep '^<<<<<<< '` over the whole repo (no scope filter, no `--skip-conflict-check`) returns zero hits. The Phase 28 done-gate already proved this for 7 directories; SYNC-01 widens it to the entire tree.
2. **SYNC-28/29/30/31/32:** Five-script local-first sequence (`pnpm typecheck → pnpm build → pnpm build:extensions → pnpm test → pnpm lint:ci`) all green per the rules in §Verify-script-rules below.
3. **SYNC-21:** `src/main/build/bundledPlugins/` contains ≥130 entries after `pnpm build:extensions` (~132 expected; absolute floor 130 absorbs minor upstream churn).
4. **SYNC-33 part A:** `pnpm run start` boots from source on Linux — main window opens, no fatal renderer error in the first 30 s, log shows extension manager loaded ≥130 extensions.
5. **SYNC-33 part B:** AppImage built by `release-linux.yml` (triggered by RC tag — see D-29-04) downloads, runs, opens main window. .deb installs cleanly via `sudo apt install ./vortex_*.deb`, launches via desktop entry.
6. **SYNC-34:** 5-min Skyrim SE Steam smoke per D-29-03 — game detected via Steam library, one cosmetic mod installed via NXM, deployed via hardlink, launched via Proton — captured in `29-SMOKE-EVIDENCE.md` with screenshots.

## Requirements (≥1)

- **SYNC-01:** repo-wide zero conflict markers
- **SYNC-21:** `pnpm build:extensions` populates bundledPlugins/ (~132)
- **SYNC-28:** `pnpm typecheck` passes across all workspaces
- **SYNC-29:** `pnpm build` (main + renderer + preload + shared) succeeds
- **SYNC-30:** `pnpm build:extensions` succeeds for every extension
- **SYNC-31:** `pnpm test` (Vitest) passes; renderer-no-Jest divergence acknowledged
- **SYNC-32:** `pnpm lint:ci` passes — diff-based vs master baseline (D-29-05)
- **SYNC-33:** AppImage from release-linux.yml boots; `pnpm run start` boots from source
- **SYNC-34:** 5-min manual smoke — Skyrim SE detect → install one mod → deploy → launch via Proton

## Reusable assets (4 confirmed; details inline)

- **`pnpm` script catalogue** (read from `package.json`): `start`, `build`, `build:all`, `build:extensions`, `typecheck` (delegates to `pnpm nx run-many`), `test` (Vitest), `lint:ci` (delegates to `lint:quiet`), `package:nosign` (electron-builder, no signing). All five verification scripts already exist — no script work needed.
- **`.github/workflows/release-linux.yml`:** ubuntu-22.04 runner, full AppImage + deb build pipeline. Uses `package:nosign`, runs `npx @electron/rebuild -f -v 39.8.0`, separately rebuilds `@vortex/loot` and `@vortex/bsatk`, runs `node scripts/verify-addons.cjs` and `node scripts/verify-asar-unpacked.cjs`, publishes via `softprops/action-gh-release@v2` to a rolling `latest-linux` release. **Triggers:** tag push `v*` OR `workflow_run` after "Main" succeeds on master. **Does NOT trigger on `v8.0/config-bucket` branch pushes** — see D-29-04.
- **`scripts/verify-addons.cjs` + `scripts/verify-asar-unpacked.cjs`:** native-addon and asar.unpacked verification gates already wired into release-linux.yml. Re-runnable locally if needed.
- **`grep-checkpoint.sh`:** 16-gate preservation script, last green at Phase 28. Already covers §1/§2/§3/§4/§6/§7a-d/§8/§9/§10 + 140a57217 + BG3/Morrowind. Phase 29 reruns it as a regression sanity gate but does not extend it.

## Boundaries

- **In scope:** measuring already-landed work; running scripts; producing evidence files; pushing one RC tag to trigger CI AppImage build; capturing screenshots of a Skyrim SE smoke run.
- **Out of scope:**
    - Source modifications. If a script fails for a real bug, file it as a follow-up phase deviation, do not fix in 29 unless the fix is one-line and obvious (e.g. lockfile drift on `pnpm test`). Anything substantive is a Phase 28-bis or Phase 30 prerequisite.
    - PR #4 merge / FF / cherry-pick to `linux-port` — those are Phase 30 (SYNC-35..39).
    - Tag `v2.0.0-linux-rebased` — that is Phase 30. Phase 29 may push an RC tag like `v2.0.0-linux-rebased-rc1` to drive AppImage CI; the canonical milestone tag is created in 30.
    - New CI workflow_dispatch wiring. If we need it for tag-free CI builds, scope into a Phase 30 helper, not 29.

</domain>

## Decisions

### D-29-01: Verification execution strategy — local-first sequential

**Choice:** run typecheck → build → build:extensions → test → lint:ci sequentially on `v8.0/config-bucket` locally. Capture exit codes + key output to `29-VERIFY-RESULTS.md`. Do NOT trust CI alone — AppImage smoke needs a local build anyway, so we get verification + artefact prep in one pass.

**Why:** sequential gives clean attribution per script (failure → exact gate that broke). Parallel saves minutes but hides ordering bugs (e.g. `test` running before `build:extensions` finishes). CI-only trust adds a feedback round-trip and doesn't materially de-risk anything we won't already verify locally.

**§Verify-script-rules:**

- Each script gets its own atomic plan (Plan 29-01..29-05) and its own commit (or run-only, no commit, if exit 0 with no source changes).
- Capture: exit code, stderr tail (≤30 lines on failure), key positive signals (`pnpm typecheck` → "All projects passed", `pnpm test` → final test summary, `pnpm build:extensions` → bundledPlugins count).
- On non-zero exit: stop the cascade, file a deviation note in the relevant plan SUMMARY, decide repair-in-29 vs defer-to-29-bis based on triage.

### D-29-02: AppImage / .deb verification — CI build, local boot

**Choice:** trigger `release-linux.yml` via RC tag push (D-29-04). Download AppImage + .deb artefacts from the resulting GitHub Release. Run AppImage locally, confirm main window opens + Steam game detection succeeds. Install .deb via `sudo apt install ./vortex_*.deb`, confirm it launches via desktop entry. Capture screenshots + artefact SHA256s in `29-SMOKE-EVIDENCE.md`.

**Why:** the AppImage that ships to users IS the CI-built one. Local `package:nosign` is faster but doesn't prove the release path works. SYNC-33 explicitly says "AppImage produced by `release-linux.yml`".

### D-29-03: 5-min smoke scope — Skyrim SE only

**Choice:** Skyrim SE on Steam, one cosmetic SKSE-free mod (e.g. a small texture or HUD tweak), hardlink deploy, launch via Proton.

**Why:** Skyrim SE exercises the full Linux-port surface area in one game:

- §9 `findAllLinuxSteamPaths` + `libraryfolders.vdf` (SYNC-25) — Steam game detection
- §3 LOOT call-site casing in autosort.ts (SYNC-19) — gamebryo plugin sort
- §4 `testPathTransfer` no Windows reject (SYNC-20) — staging → deployed transfer
- §6/§7a-d staging integrity + backslash-paths cluster (SYNC-22/23) — install
- §8 StarterInfo Proton helpers + hide-on-spawn (SYNC-24) — launch
- §10 cross-compiled gamebryo binaries (SYNC-26) — at runtime, not just at build

A second non-gamebryo Steam game adds breadth but ~doubles the time. Reserve as fallback if Skyrim SE smoke fails for a non-Vortex reason (Steam offline, Proton compatibility flaw).

### D-29-04: How to get a CI AppImage from `v8.0/config-bucket` (branch, not master)

**Constraint discovered during scouting:** `release-linux.yml` triggers on (a) tag push `v*` OR (b) `workflow_run` after Main on master. Branch pushes to `v8.0/config-bucket` do NOT trigger AppImage CI.

**Choice:** push annotated RC tag `v2.0.0-linux-rebased-rc1` pointing at `v8.0/config-bucket` HEAD (currently `70f8547ab`, will be that or its descendant at the time of tagging). The tag triggers `release-linux.yml`; CI builds AppImage + .deb; we download from the resulting GitHub Release.

**Why:** simplest mechanism that uses the existing CI without modifying workflows. The RC tag is a deliberate throwaway — Phase 30 creates the canonical `v2.0.0-linux-rebased` tag. RC tags are easy to delete after the release artefacts are downloaded.

**Cleanup:** after Phase 30 lands, the RC tag + its generated GitHub Release are deleted (`gh release delete v2.0.0-linux-rebased-rc1 --cleanup-tag`).

**Push idiom:** same explicit-lease form as Phase 28. RC tag push is `git push git@github.com:atabisz/Vortex.git v2.0.0-linux-rebased-rc1` — tags don't need lease (they're additive).

### D-29-05: lint:ci baseline — diff vs master

**Choice:** capture warning count on `master` at phase start (`git stash; git checkout master; pnpm lint:ci 2>&1 | tee /tmp/lint-master.log; git checkout v8.0/config-bucket; git stash pop`). Compare warning count on `v8.0/config-bucket` at phase end. PASS if `new-warnings ≤ baseline-warnings`, FAIL if strictly greater.

**Why:** matches SYNC-32 wording exactly ("passes — or surfaces only pre-existing warnings — diff vs. master"). Stricter than exit-code-only (catches regressions sneaking under the warning ceiling); less brittle than zero-new-warnings strict (which would block on cosmetic upstream-introduced warnings we have to live with).

**Capture format:** `29-LINT-BASELINE.md` — table with master count vs v8.0 count per workspace, plus the full delta if > 0.

### D-29-06: Smoke evidence record format

**Choice:** new file `29-SMOKE-EVIDENCE.md` — captures (a) `pnpm run start` boot evidence (timestamp, log excerpt confirming extension manager loaded ≥130 extensions, screenshot of main window), (b) AppImage download URL + SHA256 + boot evidence, (c) .deb install + launch evidence, (d) Skyrim SE smoke walkthrough (game detection screenshot, mod NXM-install screenshot, deploy result, launch via Proton with vortex tray visible during gameplay).

**Why:** one durable artefact lets future-me + Phase 30 verifier audit SYNC-33+34 without re-running the smoke. Screenshots go in `.planning/phases/29-build-verification/screenshots/` — git-ignored via `.planning/` rule but referenced by relative path in the evidence file.

## Reusable Assets

- `pnpm typecheck`, `pnpm build`, `pnpm build:extensions`, `pnpm test`, `pnpm lint:ci`, `pnpm run start`, `pnpm run package:nosign` — all defined in root `package.json`.
- `.github/workflows/release-linux.yml` — full Linux release pipeline.
- `scripts/verify-addons.cjs`, `scripts/verify-asar-unpacked.cjs` — native + asar gates.
- `.planning/milestones/v8.0/scripts/grep-checkpoint.sh` — 16-gate preservation script (regression-safety only this phase).
- Phase 28 done-gate template (`28-DONE-GATE.md`) — reuse the section headings + per-check pass/fail format.

## Dependencies

- **Requires:** Phase 28 complete (`v8.0/config-bucket` @ `70f8547ab`, working tree merge-clean, remote `fork/sync/upstream-v2.0.0` synced).
- **Provides:** evidence that the resolved tree is shippable. Specifically: green typecheck/build/build:extensions/test/lint:ci, working AppImage + .deb, smoke-passing 5-min Skyrim SE walkthrough. Phase 30 needs all of this before tag/FF/cherry-pick.
- **Affects:** Phase 30 (gates the milestone tag), and surfaces any last-mile bugs that need a hotfix before tagging.

## Plan structure (proposed for the planner)

10 plans + done-gate. One plan per script + AppImage CI + local boot + smoke + done.

1. **29-00:** Setup — re-verify branch state, capture lint baseline on master, create `29-LINT-BASELINE.md` (master half)
2. **29-01:** SYNC-01 + SYNC-28 — repo-wide grep + `pnpm typecheck`
3. **29-02:** SYNC-29 — `pnpm build`
4. **29-03:** SYNC-30 + SYNC-21 — `pnpm build:extensions`, count bundledPlugins/
5. **29-04:** SYNC-31 — `pnpm test`
6. **29-05:** SYNC-32 — `pnpm lint:ci` + diff vs master baseline (closes `29-LINT-BASELINE.md`)
7. **29-06:** SYNC-33 part A — `pnpm run start` from source, capture boot evidence
8. **29-07:** SYNC-33 part B — push RC tag, monitor `release-linux.yml`, download AppImage + .deb
9. **29-08:** SYNC-33 part C — local AppImage + .deb boot evidence
10. **29-09:** SYNC-34 — Skyrim SE 5-min smoke walkthrough
11. **29-10:** D-29-XX done-gate — one summary file rolling up all evidence + closing all 9 SYNC requirements

Atomic-commit cadence: each plan ends with one `docs(29-NN): ...` commit capturing its evidence file. No source commits expected unless a verification-driven hotfix is unavoidable (in which case it's its own scoped `fix(29-NN): ...` commit, scoped narrowly).

## Risk register

- **R1: `pnpm test` lockfile drift** — Phase 28 didn't touch `pnpm-lock.yaml` (Phase 24 did, and the pnpm install was clean). If test setup runs `pnpm install` and the lockfile drifted, fix is `pnpm install` (no `--frozen-lockfile`) and commit the lockfile delta as `fix(29-04): regenerate lockfile post-merge`. Documented contingency, not expected.
- **R2: AppImage CI fails on first RC tag** — most likely causes: native-addon mismatch (loot/bsatk rebuild path), asar.unpacked drift, missing system deps. Each is a single CI log line away. Triage and either fix-in-29 (≤1 hr work) or escalate to a focused Phase 28-bis.
- **R3: Skyrim SE smoke regresses** — playbook §3/§4/§8/§9/§10 guards exist precisely to catch this. If grep-checkpoint stayed green but smoke fails, the gap is in coverage not protection — note it for the playbook update in Phase 30 (SYNC-39).
- **R4: lint:ci baseline drifts during phase** — capture once at start (Plan 29-00), don't refresh. If master gets new commits during the phase, document them but use the start-of-phase snapshot for SYNC-32 evidence.

## Notes for the planner

- Five verification scripts each get a tight ≤30-min plan. Test/build:extensions are slowest (~5–10 min each); typecheck/lint:ci are fast.
- AppImage CI run takes ~12–15 min wall-clock per `release-linux.yml` history.
- Manual smoke is the least scriptable and longest wall-clock — schedule it last so verification gates are all green before user-time is spent.
- Done-gate (29-10) reuses Phase 28's template structure verbatim — section per check, evidence quoted, force-push not applicable (Phase 29 only adds docs commits on top of `70f8547ab`).
