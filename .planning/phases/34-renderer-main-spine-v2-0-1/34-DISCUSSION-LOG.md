# Phase 34: Renderer + main spine (v2.0.1) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `34-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 34-renderer-main-spine-v2-0-1
**Mode:** `--auto` (single-pass; recommended option auto-selected for every gray area)
**Areas discussed:** branch + commit pattern, resolution order / wave decomposition, per-region stance hierarchy, harness reuse + Phase 34 gates, typecheck cadence, atomic-commit format, single-host invariant carry, wave parallelism, scope expansion, done-gate, R2 carry-forward (`__mocks__/`), `native-errors` carry-over from Phase 33-F, R3 / hardware-UAT / full-build deferrals.

---

## Branch & commit pattern (D-34-00)

| Option                                                                                                                | Description                                                                  | Selected |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| Continue `v8.1/config-bucket`, atomic per-file SSH-signed commits, `resolve(<bucket-slug>): <file> — <stance>` titles | Carries D-32-08 / D-33-07 idiom; clean bisect; matches v8.0 Phase 28 cadence | ✓        |
| New branch `v8.1/renderer-spine` off Phase 33 head                                                                    | Adds rebase friction at Phase 36 FF-merge for no benefit                     |          |
| Squash-per-bucket                                                                                                     | Loses per-file bisect granularity; would mask any D1-style carryover defect  |          |

**Auto choice:** Continue `v8.1/config-bucket`; per-file atomic SSH-signed commits.
**Rationale:** Phase 32/33 precedent; no operator override.

---

## Resolution order / wave decomposition (D-34-01)

| Option                                                                                                                                                          | Description                                                         | Selected |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| Wave A (shared) → B (preload) → C (main) → D (renderer leaves) → E (renderer extensions) → F (renderer views/pages) → G (repo-wide leaves) → H (R2 + done-gate) | Dependency-graph leaf-first; mirrors D-33-01                        | ✓        |
| Top-down (renderer first)                                                                                                                                       | Would force shared/main retypechecks every renderer commit          |          |
| File-name alphabetical                                                                                                                                          | Ignores cross-file dependencies; risks Application.ts before cli.ts |          |

**Auto choice:** A → B → C → D → E → F → G → H.
**Rationale:** Bucket-boundary leaf-first is the only ordering that lets bucket-scoped typecheck fail early.

---

## Per-region resolution stance hierarchy (D-34-02 / D-34-03)

| Option                                                                                                                             | Description                                                              | Selected |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| 6-tier hierarchy (playbook → guard → upstream feature → Rule-1 dup-import → Rule-2 D1-carryover prevention → smaller-diff default) | Carries D-32-02 + D-33-02; adds Phase 32 Rule-1 + Phase 33 Wave F lesson | ✓        |
| Blanket `--ours`                                                                                                                   | v8.0 Phase 30 cascading-drift incident proves this fails                 |          |
| Blanket `--theirs`                                                                                                                 | Same failure mode, opposite direction                                    |          |

**Auto choice:** 6-tier hierarchy with explicit Rule-1 / Rule-2 tiers.
**Rationale:** Every Phase 32/33 incident category covered by an explicit tier.

---

## Harness reuse (D-34-04 / D-34-05)

| Option                                                                                                                                 | Description                                | Selected |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------- |
| Re-use Phase 33 12-gate harness, copy under `phases/34-…/scripts/`, extend with v2.0.1-specific gates if researcher confirms necessity | Single source of truth, additive evolution | ✓        |
| Rewrite from scratch                                                                                                                   | Loses all Phase 26→33 invariant coverage   |          |
| Re-use without extension                                                                                                               | Risks missing v2.0.1-specific regressions  |          |

**Auto choice:** Re-use + extend, with 4 candidate gates flagged (IPC channel, argv slice, error-class preservation, `__mocks__/` shape).
**Rationale:** Same upstream merge axis; harness has paid for itself across two phases.

---

## Typecheck cadence (D-34-06)

| Option                                 | Description                                                                              | Selected |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Per-bucket (after each wave's commits) | Catches cross-file drift inside renderer; ~5–6 invocations total                         | ✓        |
| Per-file (Phase 32 cadence)            | ~117× ~30–60s = ~90 min wall-time for marginal signal                                    |          |
| Per-extension (Phase 33 cadence)       | Renderer is one workspace with one tsconfig; would miss cross-file drift inside renderer |          |
| Phase-end only                         | Defers detection to Phase 35; loses fail-fast                                            |          |

**Auto choice:** Per-bucket (`shared`, `preload`, `main`, `renderer`, `repo-wide TS leaves`).
**Rationale:** Phase 34's coupling boundaries align to bucket boundaries, not file or extension boundaries.

---

## Atomic-commit format + body (D-34-07 / D-34-08 / D-34-09)

| Option                                                                                                            | Description                                                       | Selected |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| Title `resolve(<bucket-slug>): <file> — <stance>`; body lists gates / region tally / grep-exit / typecheck status | Phase 32/33 Pattern S5 verbatim                                   | ✓        |
| Conventional commits with `feat:` / `fix:`                                                                        | Doesn't reflect that these are conflict resolutions, not features |          |
| One-liner titles, body-less                                                                                       | Loses the audit-trail value during done-gate review               |          |

**Auto choice:** `resolve(<bucket-slug>): <file> — <stance>` with structured body.
**Rationale:** Pattern proven across Phase 32 (15 files) + Phase 33 (182 files).

---

## Single-host + sentinel invariants (D-34-10 / D-34-11)

| Option                                                                                                                                                | Description                                                      | Selected |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| Carry D-33-10 / D-32-12 single-host invariant; pre/post grep + read pattern; planner-researcher checks v2.0.1 diff for new `resolvePathCase` patterns | Defends 140a57217 invariant                                      | ✓        |
| Trust the harness alone                                                                                                                               | Harness gate catches drift; researcher catches new sites earlier |          |

**Auto choice:** Single-host invariant + pre/post grep pattern carry forward.
**Rationale:** Cheap insurance; researcher pass is already happening for other reasons.

---

## Wave parallelism + agent dispatch (D-34-12)

| Option                                                                                                                                                        | Description                                                       | Selected |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| Background `Agent(subagent_type="Engineer", run_in_background=true)` for parallel-safe sub-buckets; sequential within coupled groups; Wave G heavily parallel | Phase 32/33 precedent; Wave G is mostly docs/configs              | ✓        |
| Fully sequential                                                                                                                                              | ~117 files × ~30s commit overhead = adds ~hour for no safety gain |          |
| Fully parallel                                                                                                                                                | Risks lockfile / branch-state contention on coupled buckets       |          |

**Auto choice:** Mixed — parallel where independent, sequential within coupling boundaries; planner finalizes count.
**Rationale:** Same sweet spot Phase 33 hit at Wave D3 (60 ext in parallel batches).

---

## Scope expansion (D-34-13)

| Option                                                                                          | Description                                                             | Selected |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| Cover all 117 markers outside `extensions/` and `.planning/` (ROADMAP-named + repo-wide leaves) | Mirrors D-32-13 / D-33-13 wording-coverage precedent; unblocks Phase 35 | ✓        |
| Strict ROADMAP-named only (~13 files)                                                           | Leaves 100+ markers blocking Phase 35; would force a Phase 34-bis       |          |
| Full repo including extensions/                                                                 | Phase 33 already cleared `extensions/` to zero; nothing to do there     |          |

**Auto choice:** All 117 markers outside `extensions/` and `.planning/`.
**Rationale:** Same playbook surface; same FF-merge target; same atomic-commit-per-file structure.

---

## Done-gate criteria (D-34-14)

| Option                                                                                                                 | Description                                                | Selected |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| 7-criterion gate (zero markers + harness + per-bucket typecheck + commit accounting + R2 documented + STATE + ROADMAP) | Mirrors D-33-14's 6-criterion gate, adds R2 documentation  | ✓        |
| 6-criterion (skip R2 documentation as separate criterion)                                                              | Hides the SYNC-34b checkbox in the resolution log; fragile |          |
| Add full-repo typecheck as a Phase 34 criterion                                                                        | Belongs to Phase 35; would cross the bucket boundary       |          |

**Auto choice:** 7-criterion done-gate.
**Rationale:** R2 + SYNC-34b need their own checkbox or they get lost.

---

## R2 carry-forward — Jest `__mocks__/` decision (D-34-15 / D-34-16)

| Option                                                                                     | Description                                                                                                                                       | Selected |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **DROP** `src/renderer/src/__mocks__/` (single `chore(renderer):` commit at end of Wave H) | No active consumer (Vitest replaced Jest in v8.0; no `jest.config` in renderer); pre-audit confirms 19 mocks + 4 fixtures are dead infrastructure | ✓        |
| Restore renderer Jest runner alongside Vitest                                              | Outside Phase 34 scope; would require a SYNC-34c                                                                                                  |          |
| Keep tree, defer to later phase                                                            | SYNC-34b is owed a decision, not another deferral; Phase 33 D-33-15 already deferred once                                                         |          |

**Auto choice:** DROP the renderer-side `__mocks__/`; commit lands AFTER all 117 resolution commits to keep test-surface stable through resolution.
**Rationale:** Three sessions of pre-audit (Phase 14, Phase 19, Phase 34) all agree the directory is dead since the v8.0 Vitest flip.

---

## `native-errors` carry-over from Phase 33-F (D-34-17)

| Option                                                                                                                                                                           | Description                                                     | Selected |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------- |
| Trigger-conditional: if `nativeErr` import survives `renderer.tsx` resolution, re-add to `pnpm-workspace.yaml catalog:` in same wave; if dropped, record permanent "no consumer" | Mirrors Phase 33-F deferral decision; minimises lockfile churn  | ✓        |
| Pre-emptively re-add catalog entry now                                                                                                                                           | Risks adding a no-consumer entry if upstream removed the symbol |          |
| Drop the import unconditionally                                                                                                                                                  | Pre-empts the resolution decision in `renderer.tsx`             |          |

**Auto choice:** Trigger-conditional, decided when Wave F3 resolves `renderer.tsx`.
**Rationale:** Defer the decision to the file that knows the answer.

---

## Out-of-scope deferrals (D-34-18 / D-34-19 / D-34-20)

| Option                                                                                                                                     | Description                                           | Selected |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | -------- |
| Defer R3 (electron-builder.config.json) → Phase 35; manual hardware UAT → Phase 999.1 / 37; full repo typecheck/lint/test/build → Phase 35 | Matches ROADMAP.md scope partition                    | ✓        |
| Pull Phase 35 work forward                                                                                                                 | Bloats this phase; risks both phases failing together |          |

**Auto choice:** Defer all three.
**Rationale:** Phase boundaries are load-bearing; v8.0 Phase 28 → 29 split worked cleanly here.

---

## Claude's Discretion

- Per-region resolution outcomes inside each file (executor judgement under D-34-02 stance hierarchy).
- Exact wave parallelism count and agent batching for Wave G (repo-wide leaves) — planner's call.
- Whether to extend the harness with v2.0.1-specific gates beyond the 4 candidates (D-34-05 inspection result drives this).
- Whether the `R2 drop` commit is single-file-rm or `git rm -r` of the whole `__mocks__/` directory plus tsconfig adjustments — executor judgement.
- Whether the `native-errors` catalog re-add (D-34-17) lands in the same commit as `renderer.tsx` or a separate `chore(workspace): re-add native-errors catalog entry` follow-up — single combined commit recommended unless lockfile regen produces noisy diffs.
- Final `bucket-slug` mapping for Wave G.

## Deferred Ideas

- Phase 35 — full `pnpm run {typecheck,lint,test,build}`; lint baseline-parity; R3 confirmation; `.github/actions/fingerprints/dist/index.js` rebuild check.
- Phase 36 — rebase + FF-merge PR #5 + SSH-signed `v2.0.1-linux-rebased` tag + cherry-pick to `linux-port`.
- Phase 37 — SYNC-33-C, SYNC-34, SYNC-39 carry-forward; playbook updates from v8.1.
- Phase 999.1 backlog — manual hardware UAT (process-boot, NXM, Tray, autoupdater surfaces).
- Restoring renderer Jest runner alongside Vitest (rejected alternative for D-34-15) — would itself require a SYNC-34c.
- Promoting `grep-checkpoint.sh` to `release-linux.yml` CI — re-deferred to Phase 35.

---

_Auto-mode discussion log; recommended option selected for every gray area._
