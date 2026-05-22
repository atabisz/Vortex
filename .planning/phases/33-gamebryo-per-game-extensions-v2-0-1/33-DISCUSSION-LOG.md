# Phase 33: Gamebryo + per-game extensions (v2.0.1) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 33-gamebryo-per-game-extensions-v2-0-1
**Mode:** `--auto` (single-pass autonomous; no interactive AskUserQuestion calls)
**Areas discussed:** Branch & commit pattern, Resolution order, Per-region stance, Harness reuse, Typecheck cadence, Scope coverage, Catalog re-add (SYNC-33b), Done gate

---

## Branch & commit pattern

| Option                                                  | Description                                         | Selected |
| ------------------------------------------------------- | --------------------------------------------------- | -------- |
| Continue on `v8.1/config-bucket` (carries D-31/D-32-15) | Stack on cumulative branch                          | ✓        |
| New branch per phase                                    | Cleaner isolation but requires Phase 36 multi-merge |          |
| Squash to one commit per extension                      | Loses per-file bisectability                        |          |

**Auto-selection rationale:** D-32-15 / D-27-00 / D-26-00 all locked the same pattern; no signal to deviate.

---

## Resolution order

| Option                                                                | Description                                  | Selected |
| --------------------------------------------------------------------- | -------------------------------------------- | -------- |
| Per-extension dependency-grouped + leaf-first within (D-27-01 mirror) | Wave A→F per dependency depth                | ✓        |
| Strictly leaf-first across all extensions                             | Loses extension-typecheck cadence boundaries |          |
| File-size-ordered                                                     | Ignores dependency reality                   |          |

**Auto-selection rationale:** v8.0 Phase 27 proved the dependency-grouped pattern works for cross-extension scope; v2.0.1's broader reach (80+ extensions vs 7) doesn't change the underlying ordering logic.

---

## Per-region resolution stance

| Option                                                                        | Description                                                             | Selected |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| 5-tier hierarchy (playbook→guards→new-feature→Rule-1-dup-import→smaller-diff) | D-32-02 + Phase 32 Wave 1–3 validated tier 4                            | ✓        |
| Strict fork-wins                                                              | Loses v2.0.1 feature surface                                            |          |
| Strict upstream-wins                                                          | Destroys playbook (v8.0 Phase 30 cascading-drift incident is the proof) |          |

**Auto-selection rationale:** D-32-02 precedent + Rule-1 dup-import was empirically validated 5+ times across Phase 32 Waves 1–3.

---

## Harness reuse

| Option                                                                                            | Description                             | Selected |
| ------------------------------------------------------------------------------------------------- | --------------------------------------- | -------- |
| Re-use Phase 32 harness, extend with §1/§3/§10 + BG3 + Morrowind gates (D-27-03 + D-27-02 mirror) | 7 inherited + 5 new = 12-gate aggregate | ✓        |
| Build new harness from scratch                                                                    | Wastes durable v8.0/v8.1 work           |          |
| Use only inherited 7 gates without extension                                                      | Misses BG3 + Morrowind preservation     |          |

**Auto-selection rationale:** D-27-02 + D-27-03 already designed durable, reusable gates; Phase 32 D-32-04 confirmed re-use pattern works.

---

## Typecheck cadence

| Option                                                           | Description                                            | Selected |
| ---------------------------------------------------------------- | ------------------------------------------------------ | -------- |
| Per-extension (D-27-04 mirror) — bucket-scoped tsc per extension | ~80 typecheck runs, parallelizable                     | ✓        |
| Per-file (D-32-06 mirror)                                        | ~183× per-file = ~90 min wall-time for marginal signal |          |
| Phase-end only                                                   | Loses early-detection of cross-file drift              |          |

**Auto-selection rationale:** Phase 32's per-file cadence made sense for 15 tightly-coupled files; Phase 33 spans 80+ independent extension workspaces — D-27-04 deviation rationale applies. Bucket-scoped invocation pattern (`cd <ext> && pnpm tsc -p tsconfig.json`) inherits from Phase 32's correction over the broken `pnpm typecheck -F @vortex/<ws>` Nx invocation.

---

## Scope coverage (ROADMAP-named vs all-conflicts)

| Option                                                                                                 | Description                                | Selected |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------ | -------- |
| Resolve every conflict in `extensions/` (D-32-13 mirror) — 183 files                                   | Atomic bucket; no Phase 33-bis             | ✓        |
| Resolve only ROADMAP.md-named buckets (gamebryo + collections + bepinex + BG3 + Morrowind + Witcher 3) | Leaves ~60 game-extension conflicts behind |          |
| Split ROADMAP-scope vs expansion into separate phases                                                  | Adds Phase 33-bis overhead                 |          |

**Auto-selection rationale:** D-32-13 already established the precedent; SYNC-33a's "every playbook §1/§3/§10 site preserved" implicitly covers all extensions in the playbook-protected directory. v2.0.1's broad reach (likely a formatter pass or `IExtensionContext` shape change) means every game extension is in the same boat — splitting them would be artificial.

---

## Catalog re-add (SYNC-33b)

| Option                                                                                                                                         | Description                                        | Selected |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| Single combined commit at end of phase (Wave F) — `chore(workspace): re-add esptk/exe-version/gamebryo-savegame/native-errors catalog entries` | Final lockfile regen reflects full extension graph | ✓        |
| One commit per catalog entry                                                                                                                   | Lockfile regen produces noisy per-entry diffs      |          |
| Defer to Phase 35                                                                                                                              | Misses SYNC-33b acceptance criterion this phase    |          |

**Auto-selection rationale:** ROADMAP success criterion #3 explicitly scopes catalog re-add to Phase 33; bundling at end keeps the lockfile clean.

---

## Done gate

| Option                                                                                                              | Description                                           | Selected |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------- |
| Six-criterion gate mirroring D-27-05 (markers empty + harness 0 + per-ext tc + ~183 commits + state/roadmap update) | Proven at v8.0 Phase 27                               | ✓        |
| Add full-repo `pnpm typecheck` to Phase 33 done-gate                                                                | Pulls Phase 35 work forward; v8.0 split kept it in 29 |          |
| Add full-repo `pnpm run build`                                                                                      | Out of phase scope; v8.0 split kept it in 29          |          |

**Auto-selection rationale:** D-27-05 split (per-extension typecheck Phase 27, full-repo Phase 29) maps cleanly onto v8.1 (Phase 33 → Phase 35).

---

## Claude's Discretion

- Per-region resolution outcomes inside each file (executor judgement under D-33-02 stance hierarchy)
- Whether `divineCore.test.ts` lands before or after `divineCore.ts` (executor judgement on conflict-shape weight)
- Exact wave parallelism count and agent batching for Wave D3 light per-game (planner's call)
- Whether to extend the harness with v2.0.1-specific gates (D-33-05 inspection result drives this)
- Final extension-slug → typecheck-path mapping for D-33-06 (planner confirms each `tsconfig.json` exists at plan time)

## Deferred Ideas

- Phase 34 (Renderer + main spine + R2 Jest `__mocks__/` decision)
- Phase 35 (Build verification + R3 orphan `electron-builder.config.json`)
- Phase 36 (Land + tag + cherry-pick)
- Phase 37 (Carry-forward UAT)
- Phase 999.1 backlog (manual hardware UAT for per-game extensions)
- Manual lockfile recovery rollback (Phase 31 D-31-XX precedent; not Phase 33)
