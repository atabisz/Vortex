# Phase 37: Carry-forward UAT (v2.0.1) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 37-carry-forward-uat-v2-0-1
**Mode:** `--auto` (Claude auto-selected recommended option for every gray area; single-pass; no AskUserQuestion)
**Areas discussed:** SYNC-37a UAT scope, Skyrim walkthrough method, evidence file shape, Phase 999.1 boundary, SYNC-37b commit shape, v8.1 deltas to capture, commit-index refresh, sequencing, push expectation, done-gate criteria, operational invariants

---

## SYNC-37a UAT scope (D-37-01)

| Option                       | Description                                          | Selected |
| ---------------------------- | ---------------------------------------------------- | -------- |
| AppImage only                | Skip .deb (faster, single artefact)                  |          |
| Both AppImage + .deb         | Full canonical-artefact coverage; both ship to users | ✓        |
| AppImage + .deb + Steam Deck | Adds Phase 999.1 hardware UAT                        |          |

**Selection rationale:** Both packages are published as canonical Phase 36 release assets; both must boot. v8.0 SYNC-33-C precedent verified both. Steam Deck belongs to Phase 999.1, not 37.

---

## Skyrim walkthrough method (D-37-02)

| Option                                            | Description                                                                                        | Selected |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Contrived 5-min Skyrim SE smoke                   | Clean session, 4 staged screenshots                                                                |          |
| Real-usage roll-up by default; contrived fallback | Capture from actual daily-driver usage; if not available within the day, fall back to staged smoke | ✓        |
| Skip walkthrough (boot screenshot only)           | Out of D-37-04's gate intent                                                                       |          |

**Selection rationale:** v8.0 SYNC-34 closed via real-usage roll-up evidence; same pattern carries forward. Operator's daily-driver Skyrim SE through Vortex/Steam/Proton on `linux-port` HEAD already produces all 4 checkpoint moments. Fallback path is explicit.

---

## Evidence file shape (D-37-03)

| Option                                             | Description                                                                | Selected |
| -------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Mirror v8.0 `30-CANONICAL-SMOKE-EVIDENCE.md` shape | PASS/FAIL per section, screenshots/ subdirectory, verbatim acceptance text | ✓        |
| New shape                                          | Custom v8.1 layout                                                         |          |
| Inline in 37-DONE-GATE.md                          | No separate evidence file                                                  |          |

**Selection rationale:** v8.0 template proven; downstream agents already familiar.

---

## Phase 999.1 boundary (D-37-04)

| Option                              | Description                                                                                            | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| Pull ELEV-05/ELEV-06 into Phase 37  | Hardware matrix in this phase                                                                          |          |
| Phase 999.1 explicitly out of scope | Linux-laptop AppImage + .deb smoke only; failures filed as both Phase 37 finding and Phase 999.1 entry | ✓        |

**Selection rationale:** REQUIREMENTS.md SYNC-37a is the carry-forward UAT only. Hardware matrix is its own scope.

---

## SYNC-37b commit shape (D-37-05)

| Option                             | Description                         | Selected |
| ---------------------------------- | ----------------------------------- | -------- |
| Single SSH-signed commit on master | Casual voice; v8.0 SYNC-39 template | ✓        |
| Per-delta atomic commits           | Each delta its own commit           |          |
| PR for the playbook update         | Branch + review                     |          |

**Selection rationale:** v8.0 SYNC-39 single-commit precedent. Per-delta variation acceptable per D-37-05 fallthrough if planner picks it.

---

## Five v8.1 deltas to capture (D-37-06)

| Delta                                                                     | Section in playbook                  | Selected |
| ------------------------------------------------------------------------- | ------------------------------------ | -------- |
| Path C forward-sync 3-way merge pattern                                   | NEW SECTION                          | ✓        |
| `packages/paths{,-node}` master-restore contingency                       | Past gotchas                         | ✓        |
| bundledPlugins floor invariant                                            | Post-merge checklist §5 augmentation | ✓        |
| Per-bucket typecheck idiom                                                | §11 neighbour or new §12             | ✓        |
| Cherry-pick `--no-merges` filter + cherry-induced-regression fix-up shape | Cherry-pick augmentation             | ✓        |

**Selection rationale:** All five are load-bearing, surfaced empirically in Phases 32-36. None are nice-to-have.

---

## Commit-index refresh (D-37-07)

| Option                                  | Description                                                                                                    | Selected |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Add v8.1 commit IDs + cherry-pick range | Path C `c4d1b4555`, paths-restore `52ea1941b`, fix-ups `31c8ad3e4` + `799ad300f`, range `538aef374..c4d1b4555` | ✓        |
| Defer commit-index update               | Update later                                                                                                   |          |

**Selection rationale:** Required for SYNC-37b "post-mortem" framing — commit IDs are the audit trail.

---

## Sequencing (D-37-08)

| Option                          | Description                           | Selected |
| ------------------------------- | ------------------------------------- | -------- |
| SYNC-37a first, SYNC-37b second | UAT verdict cited in playbook section | ✓        |
| SYNC-37b first, SYNC-37a second | Playbook lands earlier                |          |
| Parallel                        | Both in flight together               |          |

**Selection rationale:** Single-pass sequencing keeps the playbook section's verdict reference accurate at landing time.

---

## Push expectation (D-37-09)

| Option                                                                         | Description               | Selected |
| ------------------------------------------------------------------------------ | ------------------------- | -------- |
| Direct push to fork/master via inline SSH URL after lint:ci + signature verify | Phase 36 closeout pattern | ✓        |
| PR-based                                                                       | Open PR, self-merge       |          |

**Selection rationale:** Branch protection allows non-force pushes by operator account; PR fallback is documented.

---

## Done-gate shape (D-37-10)

| Option                        | Description                                | Selected |
| ----------------------------- | ------------------------------------------ | -------- |
| 5-criterion done-gate         | Two SYNCs → smaller gate than Phase 36's 7 | ✓        |
| 7-criterion (mirror Phase 36) | Even though only 2 SYNCs                   |          |

**Selection rationale:** Match the SYNC count.

---

## Operational invariants (D-37-11..13)

All three carry forward verbatim from prior phases — bluebird Promise scan, `git add -f` for `.planning/`, SSH-signed commits with corepack PATH workaround. Auto-applied; no alternatives discussed.

---

## Claude's Discretion

- Plan-shape sequencing (number of plans / waves) — left to `gsd-planner`.
- Whether to invoke `gsd-phase-researcher` — left to `gsd-planner` (probably overkill given v8.0 templates).
- Screenshot capture tooling — operator-driven at execute time.
- Single-commit vs per-delta atomic commits for SYNC-37b — single by default, atomic acceptable.

## Deferred Ideas

- Phase 999.1 ELEV-05/ELEV-06/ONBRD-04 hardware UAT (BACKLOG, separate scope).
- Upstream v2.0.2+ sync (separate milestone).
- AppImage update channel — v8.0 deferred-idea carry-forward.
- `@vortex/api` regen as routine commit — housekeeping.
- GitHub Actions step bumps — housekeeping.
