# Phase 26: Mod-management hot zone - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the 8 conflict files in `src/renderer/src/extensions/mod_management/` on `v8.0/config-bucket` so the playbook §6 (`stagingDirHasFiles`) and §7a–d (`normalizeBackslashPaths`, `mergeCaseConflictingDirs`, backslash-replaceAll on copy source+destination, `resolvePathCase` in extractArchive) survive intact, and the `140a57217` `resolvePathCase(dataPath, relDataPath, dirCache)` calls in `LinkingDeployment.ts` + `externalChanges.ts` are preserved. Output: `git grep '^<<<<<<< '` empty across all 8 files, playbook §6 + §7a–d re-grep clean against `InstallManager.ts`, `pnpm typecheck @vortex/renderer` passes.

**Bucket files (8):**

1. `src/renderer/src/extensions/mod_management/views/ModList.tsx`
2. `src/renderer/src/extensions/mod_management/eventHandlers.ts`
3. `src/renderer/src/extensions/mod_management/util/deploy.ts`
4. `src/renderer/src/extensions/mod_management/stagingDirectory.ts`
5. `src/renderer/src/extensions/mod_management/externalChanges.ts`
6. `src/renderer/src/extensions/mod_management/LinkingDeployment.ts`
7. `src/renderer/src/extensions/mod_management/InstallManager.ts`
8. `src/renderer/src/extensions/mod_management/index.ts`

**Out of scope this phase:** Gamebryo per-game extensions (Phase 27). Renderer + main spine (Phase 28). Build verification (Phase 29). Cherry-pick to `linux-port` (post-merge, after Phase 30).

</domain>

<decisions>
## Implementation Decisions

### Branch & commit pattern (carried from Phase 24/25)

- **D-26-00:** Continue work on `v8.0/config-bucket`. One atomic commit per file (8 commits). Title format `resolve(mod-mgmt): <file> — <one-line stance>`. Push to `fork/sync/upstream-v2.0.0` once at phase end with `--force-with-lease`.

### Resolution order

- **D-26-01:** Leaf-first order: `views/ModList.tsx` → `eventHandlers.ts` → `util/deploy.ts` → `stagingDirectory.ts` → `externalChanges.ts` → `LinkingDeployment.ts` → `InstallManager.ts` → `index.ts`. Surrounding utilities `InstallManager.ts` imports settle before the playbook-heavy file is opened. `index.ts` last because it re-exports — its conflicts depend on the other 7 files' final symbol shapes.

### 140a57217 preservation

- **D-26-02:** Verification = grep-pre + read + grep-post for `LinkingDeployment.ts` and `externalChanges.ts`:
    1. **Pre-resolution grep** — capture line numbers + arg shape:
        ```bash
        git grep -n 'resolvePathCase' \
          src/renderer/src/extensions/mod_management/LinkingDeployment.ts \
          src/renderer/src/extensions/mod_management/externalChanges.ts \
          > .planning/phases/26-mod-management-hot-zone/scripts/140a57217-pre.txt
        ```
    2. **Hand-read** every conflict region in those two files that touches `resolvePathCase` — confirm the "ours" side keeps the call AND the arg shape (`dataPath, relDataPath, dirCache`). Detects upstream renames (e.g., `relDataPath` → `relativePath`).
    3. **Post-resolution grep** — re-run, diff against pre. Hit count must not decrease; arg shape must match.
    4. Pre-grep file + post-grep diff committed in the resolution commit's body.

    **NOTE (post-D-26-03a):** This decision predates D-26-03a. The "two files" framing is incorrect — `140a57217` modifies only `LinkingDeployment.ts`; the playbook entry "externalChanges" names a method inside that file (see D-26-03a). Plans 26-06 and 26-07 honour the corrected scope: plan 26-06 is an ordinary leaf-first resolution of `util/externalChanges.ts` (no pre-snapshot), and plan 26-07 hosts the full hand-read for `LinkingDeployment.ts` with the run-time grep gate (D-26-03 gate 7) providing durable verification in lieu of a pre-snapshot file.

### Per-file checkpoint

- **D-26-03:** Encode the playbook §6/§7a–d + 140a57217 checks as a shell script: `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh`. Exits non-zero on any failure. Each plan task runs it after the commit lands. Script content covers seven substantive gates plus the conflict-marker assertion:
    - **§6:** `git grep -n 'stagingDirHasFiles' src/renderer/src/extensions/mod_management/InstallManager.ts` (≥1 hit), and `test -f src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts`.
    - **§7a:** `git grep -nE '\bnormalizeBackslashPaths\b' src/renderer/src/extensions/mod_management/InstallManager.ts` — import + 2 call sites (≥3 hits).
    - **§7b:** `git grep -nE '\bmergeCaseConflictingDirs\b' src/renderer/src/extensions/mod_management/InstallManager.ts` — import + 2 call sites (≥3 hits).
    - **§7c:** `git grep -n 'replaceAll' src/renderer/src/extensions/mod_management/InstallManager.ts | grep -E '\\\\\\\\.*"/"'` — copy `source` AND `destination` (≥2 hits).
    - **§7d:** `git grep -n 'resolvePathCase(tempPath' src/renderer/src/extensions/mod_management/InstallManager.ts` — in `extractArchive` copy loop (≥1 hit).
    - **140a57217:** `git grep -nE 'resolvePathCase\(dataPath,' src/renderer/src/extensions/mod_management/LinkingDeployment.ts` — must return ≥3 hits. The base-commit (`de79ab7be`) call sites are LinkingDeployment.ts:523 (`resolvePathCase(dataPath, relDataPath, dirCache)`), :742 (`resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)`), and :799 (`resolvePathCase(dataPath, relOutputPath, this.mReaddirCache)`). All three carry the `(dataPath, …)` shape that `140a57217` produced; the gate's prefix-anchored regex plus the ≥3 threshold locks all of them at once. This is a single-file gate — there is no second file (see D-26-03a).
    - **No conflict markers:** `! git grep -l '^<<<<<<< ' src/renderer/src/extensions/mod_management/`.

    Script is durable — future sync milestones reuse it. Lives in the phase dir; commit message body of the script's introductory commit cites the playbook section it corresponds to.

- **D-26-03a (file/method distinction — added 2026-05-15 after planning defect surfaced at execution time):** The playbook entry "`externalChanges` didn't case-resolve manifest paths" (VORTEX-LINUX-MERGE-PLAYBOOK.md line 360) names a _method_, not a file. Commit `140a57217` modifies a single file: `src/renderer/src/extensions/mod_management/LinkingDeployment.ts` — adding `resolvePathCase` calls inside the `externalChanges()` method defined at LinkingDeployment.ts:513. There is **no** file at `src/renderer/src/extensions/mod_management/externalChanges.ts` on this fork — it has never existed. There IS a file at `src/renderer/src/extensions/mod_management/util/externalChanges.ts` (the UI-side external-changes scanner), but it is unrelated to `140a57217` and contains zero `resolvePathCase` calls — it appears in the bucket-8 list because it has ordinary merge conflicts to resolve, not because it hosts any playbook invariant. This sub-decision exists to prevent the same conflation from re-emerging in future phases (e.g. v8.1 sync, v9.0 sync). Where the bucket list (line 16) and D-26-01 mention `externalChanges.ts`, read it as the actual file `util/externalChanges.ts` — plan 26-06 retargets accordingly.

### Typecheck cadence

- **D-26-04:** Per-file typecheck after every commit: `pnpm typecheck -F @vortex/renderer`. Failure blocks the next commit. Adds 8× ~30–90s runs (~4–12min total). Deviation from Phase 24 D-17 / Phase 25 D-15 (phase-end-only) is intentional — hot zone has higher per-file regression risk than config or restore phases. Phase-end run still happens as the final done-gate.

### Done gate

- **D-26-05:** Phase 26 done-gate is all five:
    1. `git grep '^<<<<<<< ' src/renderer/src/extensions/mod_management/` returns empty (success criterion #1).
    2. `scripts/grep-checkpoint.sh` exits zero (success criterion #2 + #3 — playbook §6, §7a–d, and 140a57217).
    3. `pnpm typecheck -F @vortex/renderer` passes (success criterion #4).
    4. 8 atomic commits on `v8.0/config-bucket` matching the title format `resolve(mod-mgmt): <file> — <stance>`.
    5. `--force-with-lease` push to `fork/sync/upstream-v2.0.0` succeeds at phase end.

### Claude's discretion

- Per-conflict-region resolution stance for each file is left to the executor (default = hand-resolve, fork-side wins for Linux fixes, upstream wins for new feature scaffolding that doesn't touch playbook items). The decisions above lock the _strategy_, not per-region outcomes.
- Where to place `scripts/grep-checkpoint.sh` exactly under the phase dir is left to the executor. Suggested: `.planning/phases/26-mod-management-hot-zone/scripts/grep-checkpoint.sh`.
- Whether to commit `scripts/grep-checkpoint.sh` as commit 0 (before any file resolution) or alongside the first resolution commit — left to the executor. Suggested: commit 0 — the script must exist before the first resolution commit so the per-file checkpoint can run.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project / milestone scope

- `.planning/PROJECT.md` — fork constraints (Windows CI green, additive Linux changes only).
- `.planning/REQUIREMENTS.md` — Phase 26 owns SYNC-04, SYNC-22, SYNC-23, SYNC-27.
- `.planning/ROADMAP.md` — Phase 26 success criteria (4 items).
- `.planning/milestones/v8.0-SCOPE-PROPOSAL.md` — bucket inventory; mod-management is part of the conflict surface.
- `.planning/STATE.md` — current position.

### Linux fork preservation (MANDATORY READ)

- `VORTEX-LINUX-MERGE-PLAYBOOK.md` — §6 `stagingDirHasFiles`, §7a–d backslash/case cluster, and the externalChanges/`140a57217` entry are the playbook items this phase protects. Re-grep verification commands at the bottom of each section ARE the script body for `scripts/grep-checkpoint.sh`.

### Prior phase context (decisions carry forward)

- `.planning/phases/24-config-bucket/24-CONTEXT.md` — atomic commit pattern, branch policy, push policy.
- `.planning/phases/25-restore-dropped-scaffolding/25-CONTEXT.md` — done-gate shape, two-pass install discipline (typecheck cadence is a deliberate deviation here).

### Source files this phase touches

- `src/renderer/src/extensions/mod_management/` (8 files listed in `<domain>` above).
- `src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts` — sibling file existence is a §6 check, not edited.

### Reference commit

- Upstream parent of merge: `8b5a9f675` (per Phase 25 D-25-01).
- Fork's `140a57217` SHA — the LinkingDeployment fix this phase preserves.

</canonical_refs>

<code_context>

## Reusable Assets

- `scripts/grep-checkpoint.sh` (this phase, new) — playbook §6/§7a–d re-grep harness. Future sync milestones (v8.1, v9.0) reuse it.
- Atomic-commit + force-with-lease pattern from Phase 24/25 — directly reused.
- Phase 25 D-25-01 SHA-pinning practice — apply if any file needs to be re-fetched from upstream parent during conflict resolution.

## Patterns

- Hand-resolve default (Phase 24 D-05).
- Fork-side wins for Linux fixes; upstream wins for new feature scaffolding that doesn't touch playbook items.
- Per-file commit titles: `resolve(mod-mgmt): <file> — <stance>`.

</code_context>

<deferred>
## Deferred Ideas (Future Phases)

- Promoting `scripts/grep-checkpoint.sh` to `release-linux.yml` as a pre-build CI assertion — Phase 29 (Build verification) territory. Noted but not done here.
- Refactoring inside any of the 8 files — explicitly out of scope per `.planning/PROJECT.md` Out of Scope row "Refactoring inside conflict-resolution files".

</deferred>
