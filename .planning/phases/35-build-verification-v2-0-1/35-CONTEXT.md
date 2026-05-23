# Phase 35: Build verification (v2.0.1) - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; mirrors v8.0 Phase 29 D-29-XX, adjusted for v2.0.1 download-spine drop + R3 orphan carry-forward)

<domain>
## Phase Boundary

Get `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build` all exit-0 on `v8.1/config-bucket` after the v2.0.1 sync, then reconcile the orphan `src/main/electron-builder.config.json` (R3 carry-forward from 31-01-SUMMARY).

The branch is conflict-free (D-34-14 done-gate confirmed: zero markers outside `.planning/`, harness 13/13 GREEN, shared/preload/main/fingerprints/e2e bucket typechecks all 0). Renderer-bucket carries 9 deferred typecheck errors all confined to `src/renderer/src/extensions/download_management/` — those are the headline reconciliation work for this phase.

**In scope:**

1. **Renderer-bucket typecheck reconciliation** — drive `pnpm tsc -p src/renderer/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l` to 0. Source of the 9 errors is upstream commit `0743774cd "Remove old downloader"` (erri120, 2026-04-27): upstream deleted `FileAssembler.ts` (211 lines), `SpeedCalculator.ts` (102 lines), shrunk `DownloadManager.ts` from 2850→0 lines, shrunk `DownloadObserver.ts` from 1274→0 lines, mutated `IDownload` shape (`chunks` field gone), and tightened call signatures (TS2554 arg-count mismatches). Upstream replaced the renderer-side downloader with `src/main/src/downloading/manager.ts` + `chunking.ts` etc. Our branch — through SYNC-14 / Phase 25 commit `9a17907b6 "restore(downloading)"` — deliberately re-restored these four renderer files from upstream parent `8b5a9f675` because the chunking primitives the new `src/main/.../downloading/manager.ts` depended on were a Phase 25 surprise that we accepted. Net state: renderer-side `DownloadManager.ts` + `DownloadObserver.ts` are alive on our branch but their `FileAssembler` + `SpeedCalculator` siblings are not, and the `IDownload` shape they reference has drifted past them.

2. **`pnpm run lint` baseline-parity with `fork/master`** — same philosophy as v8.0 Phase 29 SYNC-32: a `−N` delta vs master baseline is PASS, not regression. Master's lint baseline includes errors that may reappear on `v8.1/config-bucket` once upstream files land (e.g. the v8.0 `downloader.test.ts` 10× `@typescript-eslint/no-unsafe-*` pattern). Phase 35 PASS condition: `v8.1/config-bucket lint errors ≤ fork/master baseline` AND `pnpm run lint` exit 0 (or the `lint:ci` equivalent the existing tooling exposes).

3. **`pnpm run test`** — Vitest + Jest both exit 0. R1 lockfile-drift contingency from v8.0 P29 did not trigger and is unlikely here either.

4. **`pnpm run build`** — full webpack/rolldown/extensions chain exits 0; renderer + main + preload + extensions; bundledPlugins count ≥ 130 floor (v8.0 baseline = 132 — confirm count holds after v2.0.1 sync).

5. **R3 orphan reconcile (SYNC-35e)** — `src/main/electron-builder.config.json` (added by upstream v2.0.1 with no conflict marker, pure addition; references `out/`+`dist/` paths). `src/main/package.json` `package` and `package:nosign` scripts both use `--config ./electron-builder.config.cjs`. The `.json` is genuinely orphan — `pnpm package` never reads it. Per 31-01-SUMMARY pickup note, deletion option is on the table but the original instruction was "do not delete in v8.1". This phase: confirm the orphan with a script-level grep, document the disposition, then choose the smaller-diff path (see D-35-04).

**Out of scope:**

- Rebase + FF-merge PR #5 + `v2.0.1-linux-rebased` tag — Phase 36.
- Cherry-pick to `linux-port` — Phase 36.
- Hardware UAT (AppImage local boot, Skyrim walkthrough) — Phase 999.1 / Phase 37.
- Linting / refactoring outside the renderer-bucket reconciliation scope — minimize-diff feedback applies. No mass oxfmt sweeps.
- Touching `src/main/src/downloading/` (the new main-side downloader) — that's already on the branch and clean per Phase 34 D-34-14.

</domain>

<decisions>
## Implementation Decisions

### Branch & commit pattern (carries D-34-00 / D-33-00 / D-32-15)

- **D-35-00:** Continue work on `v8.1/config-bucket`. SSH-signed commits per `feedback_ssh_signing.md`. **No push from sandbox** — Phase 36 owns push + FF-merge. Atomic per-fix commits where the unit of work is naturally atomic (one file or one cluster), but Phase 35 is verification-heavy not resolution-heavy, so plan-phase will likely produce fewer commits than Phase 34 (target: ~5–15 commits across all waves vs Phase 34's 142). Title format `fix(<bucket-slug>): <one-line>` for code fixes, `chore(<bucket-slug>): <one-line>` for non-code (e.g. orphan reconcile), `docs(35-NN): <one-line>` for SUMMARYs.

### Resolution strategy for the 9 download_management errors (the headline question)

- **D-35-01 (LOCKED):** **Adopt upstream's "Remove old downloader" decision** — delete renderer-side `DownloadManager.ts` + `DownloadObserver.ts` + their non-existent `FileAssembler.ts`/`SpeedCalculator.ts` references, plus rewire callers to the upstream `src/main/src/downloading/manager.ts` spine that's already on the branch. **Rationale:** (a) upstream `0743774cd` is the canonical decision — they replaced 4434 lines of renderer-side downloader with the main-side `manager.ts` + `chunking.ts` spine because the architecture moved downloads off the renderer; (b) the Phase 25 SYNC-14 restore that brought these files back was a _transitional_ accept-as-surprise, with explicit Phase 25 D-25-11 deferring "Linux-specific concerns inside them" to Phase 26/28 — that deferral has been paid down through Phases 26+33+34, but the underlying decision to keep renderer-side code that upstream deleted has now expired its usefulness; (c) keeping the dead code costs a permanent typecheck-suppression and a maintenance burden every future upstream sync hits this seam; (d) the project is on `v2.0.1` upstream sync — divergence reset is on-mission. **Implementation:** plan-phase asks the researcher to map every importer of `DownloadManager` / `DownloadObserver` / `FileAssembler` / `SpeedCalculator` from `extensions/download_management/`, map each to its upstream replacement (most likely `IPCDownloadAdapter` + `src/main/src/downloading/manager.ts` IPC contract), and produce a delete-and-rewire plan. If the researcher discovers that ≥3 callers cannot be cleanly rewired without significant new code (>~100 LOC of glue), planner escalates: option B = surgical patch (add back `FileAssembler` + `SpeedCalculator` from `8b5a9f675` byte-for-byte, fix the `IDownload.chunks` + arg-count drift in `DownloadObserver.ts` only). **Default branch is A (delete-and-rewire).** Escalation must be flagged explicitly in the plan, not silently chosen.

- **D-35-02 (LOCKED):** **Renderer-bucket typecheck must be 0 errors at done-gate** — the `filtered=0` adjustment from Phase 34 D-34-14 was a one-time deferral; Phase 35 closes it. SYNC-35a as written ("`pnpm run typecheck` exits 0 across all workspaces") is the contract.

- **D-35-03:** **Bluebird-Promise trap stays banned** — `feedback_bluebird_promise_trap.md`: do NOT add `:Promise<void>` annotations on async fns when the file imports bluebird Promise (TS1064). The download_management files import bluebird; rewiring or surgical patching MUST honor this rule.

### R3 orphan reconcile (SYNC-35e)

- **D-35-04 (LOCKED):** **Delete `src/main/electron-builder.config.json`.** Confirmed orphan: `src/main/package.json` `package` + `package:nosign` scripts both use `electron-builder.config.cjs`; the `.json` is never referenced. The original 31-01-SUMMARY pickup note ("if `.json` is genuinely orphan, defer deletion to a future cleanup milestone (do not delete in v8.1)") was hedging because Phase 31 didn't have the bandwidth to verify orphan-ness; we have it now. Deleting reduces the diff against `linux-port` and removes ambiguity for future syncs. Single-file `git rm` + `chore(electron-builder): drop orphan v2.0.1 config.json — superseded by .cjs` commit. **Pre-deletion check:** `grep -r "electron-builder.config.json" --include="*.json" --include="*.cjs" --include="*.mjs" --include="*.ts" --include="*.tsx" --include="*.yml" --include="*.yaml" --include="Makefile"` to confirm zero references repo-wide before `git rm`.

### Lint baseline-parity (SYNC-35b)

- **D-35-05:** **Lint baseline-parity philosophy carries from v8.0 D-29-XX.** PASS condition: `v8.1/config-bucket errors ≤ fork/master baseline` measured by `pnpm run lint` (or `lint:ci`) exit code 0 plus a numerical comparison if `lint:ci` allows non-zero error counts. Pre-existing master errors are not regressions. Capture baseline as `35-LINT-BASELINE.md` artifact (mirrors v8.0 Phase 29 `29-LINT-BASELINE.md`). **No reformatting outside scope** — the minimize-diff feedback applies hard here. If lint surfaces "fix-with-autofix" issues in download_management/ during reconciliation, fix only those touched by the reconciliation; do not autofix the rest of the renderer.

### Test + build verification

- **D-35-06:** **Vitest + Jest both run.** Same shape as v8.0 P29 SYNC-31. Capture artifacts: `35-VERIFY-RESULTS.md` (mirrors `29-VERIFY-RESULTS.md`).

- **D-35-07:** **Build chain exit 0.** Webpack renderer + rolldown main + extensions chain (133 `build: Done` markers in v8.0; expect ≥130 floor, exact count documented in summary). Optional native-dep webpack warnings (e.g. `vortexmt`) are non-fatal — same as v8.0 D-29-XX.

- **D-35-08:** **bundledPlugins floor ≥ 130** — same as v8.0 SYNC-21. Confirm via `ls src/main/build/bundledPlugins/ | wc -l`. Document any change in count in 35-VERIFY-RESULTS.md.

### Wave ordering + done-gate

- **D-35-09:** **Wave-based execution.** Suggested wave order (planner can refine):
    - **Wave 0 — readiness check & researcher dispatch:** confirm Phase 34 done-gate state still GREEN, dispatch researcher to map download_management callers
    - **Wave 1 — download_management reconciliation (D-35-01):** delete-and-rewire OR surgical-patch path; renderer typecheck 0 at end
    - **Wave 2 — typecheck full sweep (SYNC-35a):** all 6 buckets exit 0
    - **Wave 3 — lint (SYNC-35b):** baseline capture + parity proof
    - **Wave 4 — test (SYNC-35c):** Vitest + Jest exit 0
    - **Wave 5 — build (SYNC-35d):** typecheck/build/extensions/bundledPlugins
    - **Wave 6 — orphan reconcile (SYNC-35e, D-35-04):** delete `electron-builder.config.json`
    - **Wave 7 — done-gate + closeout:** SYNC-35a–e all GREEN, STATE/ROADMAP updated, master closeout SUMMARY

- **D-35-10:** **Done-gate criteria (SYNC-35a–e):**
    1. `pnpm run typecheck` exits 0 — all 6 buckets clean
    2. `pnpm run lint` baseline-parity proven (`v8.1 errors ≤ fork/master` AND CI lint exit 0)
    3. `pnpm run test` exits 0 (Vitest + Jest)
    4. `pnpm run build` exits 0 (renderer + main + preload + extensions); bundledPlugins ≥ 130
    5. `src/main/electron-builder.config.json` deleted; `pnpm package` smoke-load (script-level — full AppImage build deferred to Phase 36 release-linux.yml)
    6. STATE.md + ROADMAP.md updated (Phase 35 [x])
    7. All Phase 35 commits SSH-signed; zero `--no-verify`

### Claude's Discretion

- Researcher's wave ordering across Wave 2–5 (typecheck/lint/test/build) — these are independent; planner may parallelize where safe.
- Specific file-level rewiring map for D-35-01 — researcher produces; planner consumes.
- Whether to escalate D-35-01 from branch A (delete-and-rewire) to branch B (surgical patch) — researcher reports caller count; planner escalates explicitly with rationale if branch B is chosen.
- Whether to capture `35-LINT-BASELINE.md` as a separate artifact or inline in `35-VERIFY-RESULTS.md` — planner decides based on diff size.

### Folded Todos

[None — no todos folded into Phase 35 from `cross_reference_todos`. Phase 35 scope is fully driven by SYNC-35a–e + D-34-20 carry-over.]

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone context

- `.planning/STATE.md` — current milestone state; Phase 35 in-progress; download_management deferred carry-over recorded
- `.planning/REQUIREMENTS.md` — SYNC-35a/b/c/d/e definitions
- `.planning/ROADMAP.md` — Phase 35 entry, success criteria
- `.planning/PROJECT.md` — project-level context (Linux port, v8.1 milestone)
- `CLAUDE.md` + `AGENTS.md` — project-level conventions

### Phase 34 closeout (immediate predecessor)

- `.planning/phases/34-renderer-main-spine-v2-0-1/34-CONTEXT.md` — D-34-00..D-34-20
- `.planning/phases/34-renderer-main-spine-v2-0-1/34-09-SUMMARY.md` — Phase 34 master closeout; D-34-14 done-gate evidence; renderer-bucket=9 deferred scope rationale
- `.planning/phases/34-renderer-main-spine-v2-0-1/34-VALIDATION.md` — L1/L2/L3 validation strategy; per-bucket typecheck command

### v8.0 Phase 29 (the structural template for Phase 35)

- `.planning/milestones/v8.0-phases/29-build-verification/` — directory of v8.0 build verification artifacts
- v8.0 commit `2bb90d1f4 "docs(29-10): summary — phase 29 done-gate roll-up"` — pattern: 29-DONE-GATE.md + 29-VERIFY-RESULTS.md + 29-SMOKE-EVIDENCE.md + 29-LINT-BASELINE.md, 9 SYNC roll-up
- v8.0 Phase 29 lint baseline-parity philosophy (master `−N` is PASS) — applies as D-35-05

### Source of the 9 download_management errors

- Upstream commit `0743774cd "Remove old downloader"` (erri120, 2026-04-27) — deleted `FileAssembler.ts` (211 lines), `SpeedCalculator.ts` (102 lines), 2850 lines of `DownloadManager.ts`, 1274 lines of `DownloadObserver.ts`; mutated `IDownload` shape; replaced with `src/main/src/downloading/manager.ts`
- Branch commit `9a17907b6 "restore(downloading): chunking + download_management spine + bsdiff-node test from upstream 8b5a9f675"` (Phase 25 SYNC-14, 2026-05-15) — restored 4 download_management files byte-for-byte from upstream parent `8b5a9f675`; D-25-11 deferred Linux concerns to Phase 26/28; that deferral has now expired into Phase 35
- `.planning/phases/25-restore-dropped-scaffolding/25-DISCOVERY-RESULT.md` — Wave 1 surprise acceptance record
- `src/main/src/downloading/manager.ts` + `chunking.ts` + `progress.ts` + `cookies.electron.ts` — upstream's replacement spine; the rewire target

### Orphan reconcile (R3 / SYNC-35e)

- `.planning/phases/31-config-bucket/31-01-SUMMARY.md` §pickup — orphan `src/main/electron-builder.config.json` provenance
- `.planning/phases/31-config-bucket/31-05-SUMMARY.md` — `build/` vs `out/` output dir rationale
- `src/main/electron-builder.config.cjs` — the actually-used config; defines `build/` output
- `src/main/package.json` — `package` + `package:nosign` scripts; both reference `electron-builder.config.cjs`

### Linux-fork invariants

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §1 (Linux platform guards), §3 (LOOT casing), §4–§5 (Steam/Proton + NXM handler), §6 (`stagingDirHasFiles`), §7a–d (backslash/case), §10 (native binaries), 140a57217 (single-host `resolvePathCase`)

### Tooling / build

- `pnpm-workspace.yaml` — strict catalog mode; relevant if download_management rewire pulls in new deps (it shouldn't)
- `vitest.config.ts` — root project array; renderer/main/shared
- `src/renderer/jest.config.mjs` — Jest config (renderer-side)
- `src/renderer/webpack.config.cjs` — renderer bundler

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 34 harness:** `.planning/phases/34-renderer-main-spine-v2-0-1/scripts/grep-checkpoint.sh` — 13-gate L1+L2 sentinel; not directly applicable to Phase 35 (Phase 35 is no-markers and no-resolutions), but the per-bucket typecheck command pattern (`pnpm tsc -p <ws>/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l`) carries forward as the L3 verification surface.

- **v8.0 P29 artifact templates:** `29-DONE-GATE.md`, `29-VERIFY-RESULTS.md`, `29-LINT-BASELINE.md`, `29-SMOKE-EVIDENCE.md` — same shape applies for Phase 35 (renamed `35-...md`). Plan-phase consumes these as templates.

- **Upstream `src/main/src/downloading/` spine (already on branch):** `manager.ts` (1075 lines), `chunking.ts`, `cookies.electron.ts`, `downloader.ts`, `errors.ts`, `ipc.ts`, `progress.ts`, `resolver.ts`, `retry.ts`, `test-server.ts` + `manager.test.integration.ts` + `downloader.test.integration.ts` + `progress.test.ts` — this is the rewire target for D-35-01 branch A.

- **`src/renderer/src/IPCDownloadAdapter.ts`** — already on branch from upstream; if download_management rewire goes branch A, this is the renderer-side bridge.

### Established Patterns

- **Per-bucket typecheck (L3 from Phase 34):** `pnpm tsc -p <ws>/tsconfig.json --noEmit 2>&1 | grep -v TS1185 | wc -l == 0`. Six buckets: shared, preload, main, renderer, fingerprints, e2e. Phase 35 SYNC-35a closes the gap on renderer.

- **Atomic per-fix commits with SSH signing** (D-34-00 / D-33-07 / D-32-08 / D-26-00 idiom). Title format `fix(<slug>): ...` / `chore(<slug>): ...` / `docs(35-NN): ...`. SSH-signed (~/.ssh/id_ed25519). Never `--no-verify`. Commit body uses Pattern S5 (D-34-08 carry).

- **`.planning/` is gitignored:** `git add -f` for any planning-doc commit (memory `feedback_planning_gitignored.md`).

- **No push from sandbox:** Phase 36 owns push + FF-merge + tag (memory `feedback_git_push_ssh.md`).

- **Bluebird Promise trap:** never add `:Promise<void>` annotation on async fns when file imports bluebird Promise (TS1064 — memory `feedback_bluebird_promise_trap.md`).

- **Casual project voice:** docs, commits, PR/issue comments — not formal/ops-review (memory `feedback_casual_voice.md`).

- **Minimize-diff:** never reformat files outside scope of a change (memory `feedback_minimize_upstream_diff.md`).

### Integration Points

- **`extensions/download_management/index.ts`** — registers the download extension into the renderer extension manager. Branch A (delete-and-rewire) modifies this; branch B leaves it intact.

- **`extensions/nexus_integration/eventHandlers.ts`** — Phase 34 surfaced this file (11 conflict regions, fully resolved). It calls into download_management; Branch A rewires those calls to IPC; Branch B leaves them.

- **`extensions/mod_management/InstallManager.ts`** — touched by upstream `0743774cd` (555 lines changed in that commit), so already on the new IPC contract on our branch — confirms IPC bridge exists.

- **CI: `release-linux.yml` AppImage + .deb build** — Phase 36 owns this. Phase 35 only proves `pnpm run build` works locally; the GH Actions chain is not exercised here.

</code_context>

<specifics>
## Specific Ideas

- **Researcher dispatch (Wave 0):** the highest-leverage action is mapping every external caller of `DownloadManager` / `DownloadObserver` / `FileAssembler` / `SpeedCalculator` from `extensions/download_management/`. Without that map, the plan can't choose between branch A and branch B intelligently. The researcher should produce a markdown table: `<importer-file>` | `<imported-symbol>` | `<upstream-replacement-symbol>` | `<rewire-difficulty (trivial/moderate/significant)>`. If `Σ(significant) >= 3` callers, escalate to branch B.

- **Default branch is A (delete-and-rewire):** because upstream's `0743774cd` _is_ the canonical decision and our v8.1 sync mission is to converge with upstream where it doesn't break Linux-fork invariants. None of the Linux-fork playbook §1/§3/§4/§5/§6/§7/§10 invariants live inside the deleted files (they're all in `extensions/symlink_activator_elevate`, `extensions/gamemode_management`, `extensions/installer_fomod*`, `util/{elevated,fs}.ts`, `TrayIcon.ts`, `errorReporting.ts`, `extensions/autoupdater.ts` — Phase 34 confirmed these), so deletion does not threaten Linux fork.

- **`pnpm run` script names** — the REQUIREMENTS.md line items use `pnpm run typecheck` / `pnpm run lint` / `pnpm run test` / `pnpm run build`. If the actual `package.json` exposes different script names (e.g. `pnpm typecheck`, `pnpm lint:ci`), the plan should use the actual names and call this out explicitly. v8.0 Phase 29 used `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm build:extensions`, `pnpm lint:ci` — same shape likely here.

- **bundledPlugins count drift watch:** v8.0 baseline = 132. v2.0.1 may have added or removed bundles. Document any drift; floor stays ≥ 130.

</specifics>

<deferred>
## Deferred Ideas

- **AppImage + .deb local boot** — Phase 36 / Phase 999.1 (not in Phase 35 scope per D-35-XX scope-fence; SYNC-37b carries it).
- **`release-linux.yml` CI verification** — Phase 36 owns CI build and tag.
- **Cherry-pick to `linux-port`** — Phase 36.
- **Reformatting download_management/ files outside the reconciliation scope** — explicitly deferred per minimize-diff. If branch B (surgical patch) is taken, only touch the lines that fix the 9 errors plus their immediate dependencies; do not run oxfmt across the file.
- **SYNC-37 carry-forward UAT** — Phase 37.
- **R1 lockfile-drift contingency** — only if `pnpm install` / `pnpm test` surfaces drift; v8.0 P29 did not trigger it; defer same handling here.

### Reviewed Todos (not folded)

[None — no todos reviewed in `cross_reference_todos`.]

</deferred>

---

_Phase: 35-build-verification-v2-0-1_
_Context gathered: 2026-05-23_
