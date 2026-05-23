# Phase 33: Gamebryo + per-game extensions (v2.0.1) — Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 183 conflict files (879 regions across 80+ extensions) + 6–8 PLAN.md artefacts + harness extension + catalog re-add commit + per-game preservation gates
**Analogs found:** all artefacts have direct in-tree analogs (Phase 32 plans, Phase 27 v8.0 archive, Phase 31 catalog work, existing Phase 32 harness)

## Phase Nature: Conflict Resolution + Phase 27 Replay at v2.0.1 Scale

This phase is structurally a scaled-up Phase 27 v8.0 replay with v2.0.1 conflict shape. **Every artefact already has a direct precursor** — Phase 32 PLAN files set the v8.1-era plan template, Phase 27 v8.0 archive sets the harness-extension and per-extension typecheck precedents, Phase 31 catalog work sets the workspace edit pattern. Phase 33 introduces no new authoring conventions; it reuses Phase 32's template scaled across 6 waves and adds the 5 Phase 27 gates onto Phase 32's harness.

For each new artefact below, the analog row gives the exact file or commit to copy from at plan time. The dominant conflict shape is oxfmt 80-col formatter reflow (~95% of regions, all tier-5 smaller-diff under D-33-02), with sentinel preservation narrowed to 2 active gates (BG3 divineCore.ts + Morrowind migrations.js) and 10 passive harness gates.

## Per-Artefact Pattern Assignments

| New Artefact                                                                             | Closest Analog                                                                                                                                                                                               | Match Quality | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `33-00-PLAN.md` (Wave 0 — harness extension)                                             | `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/27-00-PLAN.md`                                                                                                                          | exact         | Phase 27 wave 0 commit `96364fe17 resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates` is the verbatim title and structure for Phase 33's wave 0. Same 5 gates; same in-place edit pattern; same single-commit shape. **Diff vs. analog:** path target moves from `26-mod-management-hot-zone/scripts/` to `33-gamebryo-per-game-extensions-v2-0-1/scripts/` (Phase 32 already established the per-phase script copy at `32-01-PLAN.md` Task 2 Step A — extract via `git show`, chmod +x, header comment cites prior origin).                                                                                                                                                                                                                                                                                                                                                                          |
| `33-01-PLAN.md` (Wave A — gamebryo core, 4 extensions parallel)                          | `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-02-PLAN.md` (leaf-tier 7 files)                                                                                                                       | exact-shape   | Same shape: per-file atomic commits, leaf-first within each unit, shared per-task workflow defined once at top, master-blob comparison pattern (Pattern S1 of `32-PATTERNS.md`). **Adapt:** title format changes from `resolve(mod-mgmt-v2.0.1): <file>` to `resolve(<ext-slug>): <file>` per D-33-07. Wave A has 4 parallel extensions (`gamebryo-{savegame,plugin,archive,bsa}-management`) — dispatch via `Agent(subagent_type="Engineer", run_in_background=true)` per D-33-12, mirroring the parallelism that was sequential-only in 32-02 because Phase 32 had a single workspace.                                                                                                                                                                                                                                                                                                                                                               |
| `33-02-PLAN.md` (Wave B — modtype-bepinex, 3 files)                                      | `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-02-PLAN.md` (single sequential workspace)                                                                                                             | exact-shape   | One extension, 3 files leaf-first; near-identical shape to Phase 32's leaf-tier sub-section. Stance: smaller-diff for all 3 (formatter reflow per RESEARCH §2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `33-03-PLAN.md` (Wave C — collections, 12 files leaf→barrel)                             | `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-03-PLAN.md` (mid-tier 5 files) + `32-05-PLAN.md` (barrel-last `index.ts`)                                                                             | exact-shape   | Phase 32's `index.ts` resolved last after siblings stabilised — same pattern for collections: 11 source files first, `index.ts` barrel last. Plus `build.mjs` first (depends on nothing else).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `33-04-PLAN.md` (Wave D1 — heavy: witcher3 27f + bg3 16f, 2 parallel agents)             | `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/27-05-PLAN.md` (BG3 7 files leaf-first, Wave 6) + `27-06-PLAN.md` (Witcher3) + `27-07-PLAN.md` (Morrowind)                              | exact-shape   | Phase 27 Plan 05 is the **verbatim BG3 leaf-first template** including the divineCore.ts preservation gate handling. Same divineCore class-count grep, same per-extension typecheck-via-build (BG3 has no `typecheck` script — use `pnpm --filter game-baldursgate3 build` per RESEARCH §3 routing table). Witcher3 27 files needs internal sub-batching per RESEARCH Open Q #3 — split by file group (mergers cluster vs. installers/menumod cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `33-05-PLAN.md` (Wave D2 — medium ~7 extensions, parallel)                               | `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/27-07-PLAN.md` (Morrowind 1 file) replicated × 7                                                                                        | role-match    | Phase 27 had only 7 extensions total; Phase 33 D2 has 7 medium extensions. Same per-extension structure but parallelised. **Morrowind preservation gate active** — RESEARCH §4 confirms `migrate103` warning at lines 50/60 of HEAD, fork-wins on those regions per D-33-02 tier-1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `33-06-PLAN.md` (Wave D3 — light batch ~60 single-file extensions, ~6 agents × 10/agent) | `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-02-PLAN.md` shared workflow                                                                                                                           | role-match    | The shared per-task workflow scales: each light extension is one file, one master-blob compare, smaller-diff for almost every region (all formatter reflow), one signed commit, one harness skip-mode invocation, one bucket-scoped build/typecheck. Batched into ~10 extensions per parallel Engineer agent per D-33-12. **Watch for `game-masterchiefcollection/src/index.ts` nested markers** (RESEARCH R1) — must be hand-resolved, no regex tooling.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `33-07-PLAN.md` (Wave E — supporting scaffolding)                                        | `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-02-PLAN.md` workflow + `32-03-PLAN.md` mid-tier shape                                                                                                 | role-match    | `extensions/copy-extension.mjs` + `copy-native.mjs` are scaffolding — RESEARCH §6 + Open Q #4 require **planner-time caller verification** before stance choice (HEAD-wins lower risk; upstream-wins requires every caller's `package.json` "build" script to pass `build` arg). `mod-dependency-manager` (4f), `theme-switcher` (2f), `gamestore-{xbox,uplay,gog}` (1f each), `local-gamesettings` (1f) — all independent, parallelise. **`gamestore-xbox` is the §1 inline-guard exception** — its package.json is the only place the `node -e.*process.platform` form is allowed; harness gate §1 already accounts for this.                                                                                                                                                                                                                                                                                                                        |
| `33-08-PLAN.md` (Wave F — catalog re-add, single sequential commit)                      | `git show 3a231f1a0` (Phase 31 `resolve(config): pnpm-workspace.yaml — hand-resolve per D-31-07/08/09`) + `git show 30fa56f6a` (Phase 31 `regen(config): pnpm-lock.yaml + workspace cleanup per Plan 31-07`) | exact         | Phase 31 commit `3a231f1a0` is the verbatim template for the catalog `+ entry` body format — region-by-region rationale, "take upstream addition" stance, lockfile regeneration in a follow-up commit (Phase 31 split it; Phase 33 D-33-13 recommends combined commit unless lockfile diff is noisy). The 4 entries (`esptk`, `exe-version`, `gamebryo-savegame`, `native-errors`) are the **same 4 entries Phase 31 added in regions 2/3/5** of `3a231f1a0` — Phase 31 D-31-08 took them, Phase 31 cleanup dropped them, Phase 33 re-adds them. Title per D-33-13: `chore(workspace): re-add esptk/exe-version/gamebryo-savegame/native-errors catalog entries (SYNC-33b)`.                                                                                                                                                                                                                                                                           |
| `33-09-PLAN.md` (Wave verification — done-gate)                                          | `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-06-PLAN.md`                                                                                                                                           | exact         | Phase 32's wave 5 verification plan is the verbatim shape: drop `--skip-conflict-check`, assert gate 7 (no-marker) passes, audit every commit body against the body template, re-verify single-host invariant (D-33-10 inherits D-32-12), write VALIDATION.md sign-off + PHASE-SUMMARY.md. Adapt to ~183 commit-body audit instead of 15.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `scripts/grep-checkpoint.sh` (Phase 33 harness extension — 12 gates)                     | Phase 32 harness `.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh` (159 lines, 7 gates) + Phase 27 wave-0 commit `96364fe17` (5 added gates)                                   | exact         | Wave 0 plan extracts Phase 32's harness verbatim (`cp` or `git show 32-01..:.planning/phases/32-mod-management-hot-zone-v2-0-1/scripts/grep-checkpoint.sh`), then applies the 5 gate additions from Phase 27's `27-00-PLAN.md` Task 1 in-place. **Resulting structure: 12 gates total** — gate-numbered `7` (§1 build guards), `8` (§3 LOOT casing in autosort.ts), `9` (§10 native binaries existence), `10` (BG3 4-class divine), `11` (Morrowind migrate103) inserted after gate 6 (140a57217); the existing no-marker gate becomes gate 12. Same `pass`/`fail`/`failures` aggregate-fail pattern, same `--skip-conflict-check` flag (which only gates the final no-marker check).                                                                                                                                                                                                                                                                  |
| Per-file resolve commits (~183 across waves A–E)                                         | Phase 27 commit `146916a9e resolve(savegame-mgmt): index.ts — keep HEAD (drop stale upstream indent + extra brace)`                                                                                          | exact         | Verbatim title format `resolve(<ext-slug>): <file> — <one-line stance>` per D-33-07. Body shape per Pattern S5 of `32-PATTERNS.md`: regions split, gates touched/preserved, harness exit, typecheck status, `--no-verify` status. Casual project voice per `feedback_casual_voice.md`. SSH-signed per `feedback_ssh_signing.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| BG3 divineCore.ts active fork-wins resolution                                            | Phase 27 plan `27-05-PLAN.md` Task 3 (divineCore.ts) + harness gate 10 added in `96364fe17`                                                                                                                  | exact         | Same gate, same regex `class (DivineExecMissing\|DivineMissingDotNet\|DivineTimedOut\|DivineAborted)\b extends Error` count ≥ 4, same pre/post grep snapshot pattern (D-33-11 inherits D-26-02 / D-32-11). RESEARCH §4 confirmed all 4 classes present at HEAD lines 17/24/31/38 — fork-wins on any of the 6 conflict regions that touch those lines per D-33-02 tier-1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Morrowind migrations.js active fork-wins resolution                                      | Phase 27 plan `27-07-PLAN.md` (Morrowind 1 file) + harness gate 11 added in `96364fe17`                                                                                                                      | exact         | Same gate, same grep `'morrowind migrate103: mod directory missing'` count ≥ 1, same pre/post snapshot pattern. RESEARCH §4 confirmed warning string at HEAD lines 50/60 — fork-wins on regions touching either line per D-33-02 tier-1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Bucket-scoped typecheck invocation                                                       | Phase 27 D-27-04 + RESEARCH §3 routing table                                                                                                                                                                 | exact         | **Two-route table per RESEARCH §3:** for the 8 extensions with their own `tsconfig.json` AND a `typecheck` script (`collections`, `gamebryo-{archive,bsa,plugin,savegame}-*`, `mod-dependency-manager`, `modtype-bepinex`, `local-gamesettings`, plus `theme-switcher` + `gamestore-{gog,uplay,xbox}` if their package.json has the script — planner verifies at plan time): `pnpm --filter <pkg-name> typecheck`. For the ~70 game-\* extensions and any extension lacking a typecheck script: `pnpm --filter <pkg-name> build` (build-as-typecheck via rolldown — Phase 27 verified for BG3/Morrowind/Witcher3). **Do NOT use** `pnpm typecheck -F @vortex/<ext>` — Phase 32 D-32-06 verified that form fails TS5023/TS5083 on this Nx monorepo. **Do NOT use** `pnpm tsc -p tsconfig.json` from D-33-06 fallback unless the filter form fails — RESEARCH retrospective §1 documents `pnpm --filter <name> typecheck` as the verified Phase 27 form. |
| Atomic commit body template                                                              | Pattern S5 of `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-PATTERNS.md`                                                                                                                            | exact         | Verbatim body fields: regions resolved (total, fork/upstream/smaller-diff split with line numbers), playbook gates affected, playbook gates preserved (yes/no per gate), grep-checkpoint exit, bucket-scoped typecheck status (or "deferred to extension closeout commit" on intermediate files per D-33-06 per-extension cadence), `--no-verify` status. **Adapt for D-33-08:** most files in Phase 33 record "Playbook gates affected: none — no playbook surface in this file" (10 of 12 gates passive per RESEARCH §4). Only divineCore.ts + migrations.js record active-gate preservation.                                                                                                                                                                                                                                                                                                                                                        |
| Catalog re-add commit                                                                    | Phase 31 commit `3a231f1a0` (region-by-region rationale) + Phase 31 commit `30fa56f6a` (lockfile regen)                                                                                                      | exact         | Same workspace.yaml region-by-region body format: `<entry> (region N) — D-XX-NN: <stance>`. Phase 33 D-33-13 prefers single combined commit (workspace edit + regenerated lockfile staged together). If lockfile regen produces unwanted version bumps beyond the 4 catalog entries (RESEARCH R10), split into 2 commits per the Phase 31 precedent. **Pre-commit verification per D-33-13:** `grep -lEr "from ['\"](esptk\|exe-version\|gamebryo-savegame\|native-errors)['\"]" extensions/ src/` to filter dead entries — RESEARCH §5 confirmed `exe-version` has 9 live consumers; `esptk` likely lazy-loaded; `gamebryo-savegame` consumer is `gamebryo-savegame-management/`; `native-errors` requires planner verification.                                                                                                                                                                                                                      |

## Shared Patterns (Cross-Cutting)

### Pattern P1 — Master-blob comparison workflow (carries from Phase 32 Pattern S1)

**Source:** `.planning/phases/32-mod-management-hot-zone-v2-0-1/32-PATTERNS.md` Pattern S1
**Apply to:** every per-file resolve task across waves A–E

```bash
F=extensions/<path>/<file>
git show fork/master:$F > /tmp/$(basename $F).master
diff -u /tmp/$(basename $F).master $F  # see what HEAD adds vs. master
```

The master blob is the playbook-preserving truth; HEAD-side of conflicts should match master at every playbook-touched line. Default stance per RESEARCH §2: side closer to master analog wins (which is HEAD on ~95% of regions because the upstream side is the oxfmt reflow).

### Pattern P2 — Pre/post sentinel grep (only for the 2 active gates)

**Source:** D-26-02 → D-32-11 → D-33-11
**Apply to:** divineCore.ts (BG3) and migrations.js (Morrowind) only — RESEARCH §4 confirms 10/12 gates passive

```bash
# divineCore.ts (before resolving):
git grep -nE 'class (DivineExecMissing|DivineMissingDotNet|DivineTimedOut|DivineAborted)\b extends Error' \
  extensions/games/game-baldursgate3/src/divineCore.ts | wc -l   # must be ≥ 4

# migrations.js (before resolving):
grep -nc 'morrowind migrate103: mod directory missing' \
  extensions/games/game-morrowind/src/migrations.js              # must be ≥ 1

# After resolving each: re-run, count must NOT decrease.
```

### Pattern P3 — Harness invocation (carries from Phase 32 Pattern S3, extended to 12 gates)

**Source:** `.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh` (created by Wave 0)
**Apply to:** after every per-file resolve commit + final phase done-gate

```bash
# After every commit, before next resolution:
bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh --skip-conflict-check
# Phase done-gate: drop the skip flag for full marker eradication assertion
bash .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/scripts/grep-checkpoint.sh
```

Aggregate-fail (no `set -e`) — all 12 gates report regardless of any one failing. Skip-mode runs gates 1–11; full-mode adds gate 12 (no-marker). All 12 must pass at done-gate.

### Pattern P4 — Bucket-scoped typecheck per extension (D-33-06, RESEARCH §3 routing)

**Source:** Phase 27 D-27-04, refined by RESEARCH §3
**Apply to:** after the LAST file of each extension commits (not per-file like Phase 32; per-extension like Phase 27)

```bash
# Route 1: extensions with tsconfig.json + typecheck script (8 known)
pnpm --filter <pkg-name> typecheck 2>&1 | grep -E 'error TS' | grep -v TS1185 | wc -l   # must be 0

# Route 2: game-* extensions and others without typecheck script (~70)
pnpm --filter <pkg-name> build 2>&1 | tail -5                                            # rolldown refuses syntax errors

# Route 3: vanilla ESM scaffolding (copy-extension.mjs, copy-native.mjs, build.mjs files)
node --check <file>                                                                     # exit 0
```

Per-extension cadence keeps total wall-time ~80 minutes vs. ~90 minutes for per-file across 183 files (D-33-06 rationale).

### Pattern P5 — Atomic commit body template (D-33-08, carries from Phase 32 Pattern S5)

**Source:** D-33-08 / D-32-09 / Phase 27 commit `146916a9e`
**Apply to:** every per-file resolve commit + catalog re-add commit

```text
resolve(<ext-slug>): <file> — <one-line stance>

Regions resolved: <N total>
  fork-side: <N> (lines: L1, L2, ...)  [reason brief, e.g. "BG3 divine class decl preservation"]
  upstream-side: <N> (lines: ...)       [reason brief, e.g. "new feature scaffolding"]
  smaller-diff: <N>                      [Prettier/oxfmt line-wrap, semantically equivalent]
  HEAD-empty (Rule-1): <N>               [upstream side dropped — already imported]

Playbook gates affected: <list of §1/§3/§10/BG3-divine/Morrowind-migrate103 OR "none — no playbook surface in this file">
Playbook gates preserved: <yes/no per gate touched, or "n/a">

grep-checkpoint.sh exit: <0|nonzero> (gates: <state breakdown if non-zero>)
pnpm --filter <pkg> typecheck (or build): <count> non-marker errors  [or: "deferred to extension closeout"]

--no-verify used: no  [or: yes — reason: <document>]
```

### Pattern P6 — Wave parallelism via background Engineer agents (D-33-12)

**Source:** Phase 32 wave structure; D-33-12 explicit dispatch primitive
**Apply to:** Wave A (4 parallel), Wave D1 (2 parallel: witcher3 + bg3), Wave D2 (~7 parallel), Wave D3 (~6 batched parallel), Wave E (~6 parallel)

```text
Agent(subagent_type="Engineer", run_in_background=true,
      prompt="Resolve all conflicts in extensions/<slug>/. Sequential leaf-first per D-33-01.
              Master analog: git show fork/master:<path>. Stance hierarchy: D-33-02.
              Run harness skip-mode after each commit. Per-extension typecheck at end.
              Pattern P5 commit body. SSH-signed.")
```

Sequential within an extension (single coupling boundary); parallel across independent extensions (cross-extension import audit per RESEARCH §6 = empty — fully independent at source-import level). Wave F (catalog) is **always serial last** — depends on entire build graph being conflict-free.

### Pattern P7 — Phase frontmatter shape (Phase 32 PLAN files)

**Source:** every `32-NN-PLAN.md` frontmatter block
**Apply to:** every Phase 33 PLAN.md

```yaml
---
phase: 33-gamebryo-per-game-extensions-v2-0-1
plan: <NN>
type: execute
wave: <0|1|2|3|4|5|6>
depends_on:
    - 33-<prev>
files_modified:
    - <full repo-relative path 1>
    - <full repo-relative path 2>
    - .planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-<NN>-SUMMARY.md
autonomous: true
requirements:
    - SYNC-33a # all waves except F
    - SYNC-33b # Wave F only
must_haves:
    truths:
        - "..."
    artifacts:
        - path: "..."
          provides: "..."
          contains: "..."
    key_links:
        - from: "..."
          to: "..."
          via: "..."
          pattern: "..."
---
```

## Conventions to Follow

These read directly off the Phase 32 + Phase 27 + Phase 31 analogs and apply to every Phase 33 artefact the planner produces:

1. **Title format is non-negotiable** — `resolve(<ext-slug>): <file> — <one-line stance>` for resolution commits per D-33-07; `chore(workspace): ...` for the catalog re-add per D-33-13; `chore(<ext-slug>): ...` for any non-resolve scaffolding (e.g. wave 0 harness extension uses `resolve(checkpoint): scripts/grep-checkpoint.sh — extend with §1 + §3 + §10 + BG3 + Morrowind gates` per the verbatim Phase 27 commit `96364fe17`).

2. **Casual project voice everywhere** — commit titles, bodies, SUMMARY.md prose, PLAN.md objectives. Per `feedback_casual_voice.md`. Phase 27 commit `146916a9e` is the canonical example.

3. **Shared per-task workflow at the top of each PLAN file** — Phase 32 plans 02/03/04 each carry a `<shared_per_task_workflow>` block defining steps 1–10 (capture master analog → read side-by-side → hand-edit → diff-check → pre/post grep snapshot → harness skip-mode → bucket-scoped typecheck → stage+commit signed → verify signed → DO NOT push). Phase 33 PLAN files reuse this verbatim with extension-specific amendments (e.g., divineCore.ts PLAN inserts "Pattern P2 mandatory" at step 5).

4. **`@`-imported context block** — every PLAN.md `<context>` section pulls in `33-CONTEXT.md`, `33-RESEARCH.md`, `33-PATTERNS.md`, `33-VALIDATION.md`, `VORTEX-LINUX-MERGE-PLAYBOOK.md`, `CLAUDE.md`, `AGENTS.md`, plus prior-plan SUMMARY (e.g., `33-01-SUMMARY.md` in `33-02-PLAN.md`). Mirrors Phase 32 `32-02-PLAN.md` structure.

5. **`.planning/` paths require `git add -f`** — all SUMMARY.md and PATTERNS.md additions per `feedback_planning_gitignored.md`.

6. **No `--no-verify` unless husky cannot parse partial markers** — D-33-09. Phase 31 commit `3a231f1a0` documents the only acceptable `--no-verify` reason ("pnpm-lock.yaml still carries merge markers in this branch state"). Document any use in commit body.

7. **No push from sandbox during execution** — per `feedback_git_push_ssh.md`. Phase 36 handles the push + FF-merge.

8. **SSH-signed commits via `gpg.format=ssh` + `commit.gpgsign=true`** — verify per Phase 32 closeout note: `git cat-file -p <sha> | grep -c '^gpgsig '` returns ≥ 1 (because `git log --show-signature` reports "No signature" without `gpg.ssh.allowedSignersFile` configured locally, even though commits are signed).

9. **Verify before assuming** — every PLAN file should encode a Pre-flight verification task (Phase 32's Plan 01 Task 1 pattern). At minimum: branch identity check (`v8.1/config-bucket`), conflict-file count match against RESEARCH §2, working tree clean.

10. **Wave 0 always lands first** — harness extension before any resolution work, per Phase 27 wave-0 + Phase 32 wave-0 precedent.

## No Analog Found

None. Every artefact in scope has a direct precursor — Phase 32 plans are the v8.1-era PLAN.md template; Phase 27 v8.0 archive is the per-extension/parallel/preservation-gate template; Phase 31 commit `3a231f1a0` is the catalog re-add template; Phase 32's harness file is the 7-gate base extending in-place to 12 gates per Phase 27's gate-addition model.

## Metadata

**Analog search scope:**

- Phase 32 PLAN files (`32-01-PLAN.md` through `32-06-PLAN.md`)
- Phase 32 PATTERNS.md (Patterns S1–S5)
- Phase 32 harness `scripts/grep-checkpoint.sh` (159 lines, 7 gates)
- Phase 27 v8.0 archive at `git show d56c45cea:.planning/phases/27-gamebryo-per-game-extensions/`
- Phase 27 commits `146916a9e` (savegame-mgmt resolve), `96364fe17` (harness extension)
- Phase 31 commits `3a231f1a0` (catalog hand-resolve) + `30fa56f6a` (lockfile regen)

**Files scanned:** Phase 32: 6 PLAN files + 1 PATTERNS + 1 harness; Phase 27: 8 PLAN files + 1 SUMMARY + 2 commits; Phase 31: 2 commits
**Pattern extraction date:** 2026-05-22
**Phase 33 active preservation gates:** 2 (BG3 divineCore.ts, Morrowind migrations.js); 10 of 12 harness gates passive per RESEARCH §4

## PATTERN MAPPING COMPLETE

**Phase:** 33 - Gamebryo + per-game extensions (v2.0.1)
**Files classified:** 14 new artefacts (1 harness extension + ~9 PLAN files + ~183 resolve commits + 1 catalog commit + 2 active-gate sentinel resolutions, all classified)
**Analogs found:** 14 / 14 (each artefact has a direct Phase 32 / Phase 27 / Phase 31 precursor)

### Coverage

- Artefacts with exact analog: 14 (Phase 32 PLAN template, Phase 27 archive replay, Phase 31 catalog template)
- Artefacts with role-match analog: 0 (n/a — every artefact has an exact precursor)
- Artefacts with no analog: 0

### Key Patterns Identified

- **Phase 32 PLAN template** scales directly to Phase 33 with title-format change (`mod-mgmt-v2.0.1` → `<ext-slug>`) and parallelism amendment (D-33-12 background Engineer agents)
- **Phase 27 v8.0 archive** is the verbatim template for the 5 added harness gates, BG3 leaf-first preservation, Morrowind preservation, and per-extension typecheck cadence
- **Phase 31 commit `3a231f1a0`** is the verbatim template for the catalog re-add commit body
- **2 active preservation gates** (BG3 + Morrowind) — the other 10 of 12 harness gates are passive during Phase 33 resolution per RESEARCH §4
- **~95% of 879 conflict regions** are oxfmt formatter reflow → tier-5 smaller-diff → HEAD-wins by default per RESEARCH §2

### File Created

`/home/alex/src/Vortex/.planning/phases/33-gamebryo-per-game-extensions-v2-0-1/33-PATTERNS.md`

### Ready for Planning

Pattern mapping complete. Planner can now reference Phase 32 PLAN files for v8.1 plan structure, Phase 27 archive for harness/preservation/per-extension typecheck precedent, Phase 31 commit `3a231f1a0` for catalog body shape, and the 7 shared patterns (P1–P7) directly in Phase 33 PLAN.md actions.
